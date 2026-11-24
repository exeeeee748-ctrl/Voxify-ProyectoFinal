from collections.abc import Callable
import logging
import threading
from typing import Literal

from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, Response, UploadFile, status

from app.core.config import Settings, get_settings
from app.schemas.tts import LanguagesResponse, TTSRequest, VoicesResponse
from app.services.audio_codec import DecodedReference, encode_audio, normalize_reference_audio
from app.services.tts_engine import RawAudioResult, TTSEngine

logger = logging.getLogger(__name__)

# Rutas canónicas definidas en la especificación técnica (sección 12).
router = APIRouter(prefix="/tts", tags=["TTS"])

# Alias retrocompatibles. No se documentan en OpenAPI, pero evitan romper
# clientes anteriores que usaban el prefijo /v1/tts.
legacy_router = APIRouter(prefix="/v1/tts", tags=["TTS"], include_in_schema=False)

AudioFormat = Literal["wav", "mp3", "ogg"]


def get_tts_engine(request: Request) -> TTSEngine:
    """Dependencia que entrega el motor TTS cargado y verifica disponibilidad."""
    engine: TTSEngine | None = getattr(request.app.state, "tts_engine", None)
    is_ready: bool = bool(getattr(request.app.state, "is_ready", False))

    if not is_ready or engine is None or not engine.is_loaded():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="El motor TTS no está listo para procesar peticiones.",
        )
    return engine


def get_inference_semaphore(request: Request) -> threading.Semaphore:
    """Dependencia que entrega el semáforo de concurrencia inicializado en lifespan."""
    semaphore: threading.Semaphore | None = getattr(request.app.state, "inference_semaphore", None)
    if semaphore is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="El control de concurrencia no está inicializado.",
        )
    return semaphore


def _validate_clone_text(text: str, max_text_length: int) -> str:
    """Valida que el texto para clonación no esté vacío ni exceda el límite."""
    cleaned = text.strip()
    if not cleaned:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El texto no puede estar vacío.",
        )
    if len(cleaned) > max_text_length:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"El texto supera el máximo permitido de {max_text_length} caracteres.",
        )
    return cleaned


def _read_reference_audio(reference_audio: UploadFile, max_reference_audio_mb: int) -> bytes:
    """Valida y lee en memoria el archivo de audio de referencia con límite de tamaño."""
    if reference_audio.content_type and not reference_audio.content_type.startswith("audio/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El archivo de referencia debe ser un audio válido.",
        )

    max_bytes = max_reference_audio_mb * 1024 * 1024
    try:
        content_bytes = reference_audio.file.read(max_bytes + 1)
        if len(content_bytes) > max_bytes:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"El archivo de audio supera el tamaño máximo permitido ({max_reference_audio_mb} MB).",
            )
        if not content_bytes:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El archivo de audio de referencia está vacío.",
            )
        return content_bytes
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Error leyendo archivo de audio de referencia")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No se pudo leer el archivo de audio de referencia.",
        ) from exc
    finally:
        try:
            reference_audio.file.close()
        except Exception:
            pass


def _prepare_reference_audio(
    reference_audio: UploadFile,
    settings: Settings,
) -> DecodedReference:
    """Lee, valida y normaliza la muestra de referencia a WAV mono PCM 16."""
    content_bytes = _read_reference_audio(reference_audio, settings.max_reference_audio_mb)

    try:
        decoded = normalize_reference_audio(content_bytes)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

    if decoded.duration_seconds < settings.min_reference_audio_seconds:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "La muestra de referencia es demasiado corta "
                f"({decoded.duration_seconds:.2f}s); se requieren al menos "
                f"{settings.min_reference_audio_seconds:.2f}s."
            ),
        )

    if decoded.duration_seconds > settings.max_reference_audio_seconds:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "La muestra de referencia es demasiado larga "
                f"({decoded.duration_seconds:.2f}s); el máximo es "
                f"{settings.max_reference_audio_seconds:.2f}s."
            ),
        )

    return decoded


def _execute_audio_response(
    semaphore: threading.Semaphore,
    generate_fn: Callable[[], RawAudioResult],
    audio_format: AudioFormat,
    base_filename: str,
    error_log_message: str,
    error_detail_message: str,
) -> Response:
    """Adquiere el semáforo, genera y codifica el audio, y construye la respuesta HTTP."""
    semaphore.acquire(blocking=True)
    try:
        raw_audio = generate_fn()
        encoded = encode_audio(
            samples=raw_audio.samples,
            sample_rate=raw_audio.sample_rate,
            audio_format=audio_format,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc
    except Exception as exc:
        logger.exception(error_log_message)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=error_detail_message,
        ) from exc
    finally:
        semaphore.release()

    duration_seconds = (
        float(raw_audio.samples.shape[-1] / raw_audio.sample_rate)
        if raw_audio.sample_rate > 0 and raw_audio.samples.size > 0
        else 0.0
    )

    filename = f"{base_filename}.{encoded.file_extension}"
    return Response(
        content=encoded.content,
        media_type=encoded.media_type,
        headers={
            "Content-Disposition": f'inline; filename="{filename}"',
            "X-Sample-Rate": str(raw_audio.sample_rate),
            "X-Audio-Format": encoded.file_extension,
            "X-Audio-Size": str(len(encoded.content)),
            "X-Duration-Seconds": f"{duration_seconds:.3f}",
        },
    )


@router.get("/voices", response_model=VoicesResponse)
@legacy_router.get("/voices", response_model=VoicesResponse)
def list_voices(engine: TTSEngine = Depends(get_tts_engine)) -> VoicesResponse:
    """Lista todas las voces disponibles del motor TTS."""
    return VoicesResponse(voices=engine.get_available_voices())


@router.get("/languages", response_model=LanguagesResponse)
@legacy_router.get("/languages", response_model=LanguagesResponse)
def list_languages(engine: TTSEngine = Depends(get_tts_engine)) -> LanguagesResponse:
    """Lista todos los idiomas disponibles del motor TTS."""
    return LanguagesResponse(languages=engine.get_available_languages())


@router.post(
    "/generate",
    summary="Generar audio a partir de texto",
    response_class=Response,
    responses={
        200: {
            "content": {"audio/wav": {}, "audio/mpeg": {}, "audio/ogg": {}},
            "description": "Audio binario generado.",
        },
        400: {"description": "Entrada inválida."},
        503: {"description": "Motor TTS no disponible."},
    },
)
@legacy_router.post("/synthesize", include_in_schema=False)
def synthesize_speech(
    payload: TTSRequest,
    settings: Settings = Depends(get_settings),
    engine: TTSEngine = Depends(get_tts_engine),
    semaphore: threading.Semaphore = Depends(get_inference_semaphore),
) -> Response:
    """Convierte texto a audio y devuelve los bytes codificados en memoria."""
    if len(payload.text.strip()) > settings.max_text_length:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"El texto supera el máximo permitido de {settings.max_text_length} caracteres.",
        )

    return _execute_audio_response(
        semaphore=semaphore,
        generate_fn=lambda: engine.synthesize(
            text=payload.text,
            voice=payload.voice,
            speed=payload.speed,
        ),
        audio_format=payload.audio_format,
        base_filename="speech",
        error_log_message="Error durante la síntesis o codificación de audio",
        error_detail_message="Ocurrió un error interno al generar el audio.",
    )


@router.post(
    "/clone",
    summary="Clonar una voz desde una muestra y sintetizar texto",
    response_class=Response,
    responses={
        200: {
            "content": {"audio/wav": {}, "audio/mpeg": {}, "audio/ogg": {}},
            "description": "Audio binario generado con la voz clonada.",
        },
        400: {"description": "Muestra o texto inválidos."},
        413: {"description": "Muestra demasiado grande."},
        503: {"description": "Motor TTS no disponible."},
    },
)
@legacy_router.post("/clone", include_in_schema=False)
def clone_voice_speech(
    text: str = Form(..., min_length=1),
    reference_audio: UploadFile = File(...),
    speed: float = Form(1.0, ge=0.5, le=2.0),
    audio_format: AudioFormat = Form("wav"),
    engine: TTSEngine = Depends(get_tts_engine),
    semaphore: threading.Semaphore = Depends(get_inference_semaphore),
    settings: Settings = Depends(get_settings),
) -> Response:
    """Clona la voz a partir de una muestra de audio y sintetiza el texto proporcionado."""
    cleaned_text = _validate_clone_text(text, settings.max_text_length)
    reference = _prepare_reference_audio(reference_audio, settings)

    return _execute_audio_response(
        semaphore=semaphore,
        generate_fn=lambda: engine.clone_and_synthesize(
            text=cleaned_text,
            reference_audio_bytes=reference.content,
            speed=speed,
        ),
        audio_format=audio_format,
        base_filename="cloned_speech",
        error_log_message="Error durante la clonación o síntesis de voz",
        error_detail_message="Ocurrió un error interno al clonar y generar el audio.",
    )
