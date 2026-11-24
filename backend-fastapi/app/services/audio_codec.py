from dataclasses import dataclass
import io
import logging

import numpy as np
import soundfile as sf

logger = logging.getLogger(__name__)

FORMAT_TO_MEDIA_TYPE: dict[str, str] = {
    "wav": "audio/wav",
    "mp3": "audio/mpeg",
    "ogg": "audio/ogg",
}


@dataclass
class EncodedAudio:
    """Audio ya codificado en memoria listo para enviarse en una respuesta HTTP."""

    content: bytes
    media_type: str
    file_extension: str


@dataclass
class DecodedReference:
    """Muestra de referencia decodificada y normalizada a WAV mono PCM 16."""

    content: bytes
    duration_seconds: float
    sample_rate: int
    channels: int


def encode_audio(samples: np.ndarray, sample_rate: int, audio_format: str = "wav") -> EncodedAudio:
    """Convierte un arreglo de muestras de audio a bytes en memoria según el formato."""
    normalized_format = audio_format.lower().strip()
    if normalized_format not in FORMAT_TO_MEDIA_TYPE:
        raise ValueError(f"Formato de audio no soportado: '{audio_format}'")

    media_type = FORMAT_TO_MEDIA_TYPE[normalized_format]
    audio_array = np.asarray(samples, dtype=np.float32)

    buffer = io.BytesIO()
    try:
        sf.write(buffer, audio_array, samplerate=sample_rate, format=normalized_format.upper())
    except Exception as exc:
        logger.exception("Error codificando audio a formato '%s'", normalized_format)
        raise RuntimeError(f"No se pudo codificar el audio a '{normalized_format}'.") from exc

    buffer.seek(0)
    return EncodedAudio(
        content=buffer.getvalue(),
        media_type=media_type,
        file_extension=normalized_format,
    )


def normalize_reference_audio(content: bytes) -> DecodedReference:
    """Valida que la muestra contenga audio real y la convierte a WAV mono PCM 16.

    No basta con cambiar la extensión del archivo (especificación, sección 10.2):
    se decodifica el contenido real y, si es válido, se normaliza a un WAV mono
    que Kitten TTS 2 pueda consumir como referencia de clonación.
    """
    if not content:
        raise ValueError("El archivo de muestra está vacío.")

    try:
        samples, sample_rate = sf.read(
            io.BytesIO(content),
            dtype="float32",
            always_2d=False,
        )
    except Exception as exc:
        logger.warning("No se pudo decodificar la muestra de referencia: %s", exc)
        raise ValueError(
            "El archivo de muestra no contiene audio decodificable o su formato no es compatible."
        ) from exc

    samples = np.asarray(samples, dtype=np.float32)
    if samples.size == 0:
        raise ValueError("El archivo de muestra no contiene audio.")

    if not isinstance(sample_rate, int) or sample_rate <= 0:
        raise ValueError("La muestra de referencia tiene una frecuencia de muestreo inválida.")

    channels = 1
    if samples.ndim > 1:
        channels = int(samples.shape[1])
        samples = samples.mean(axis=1)

    samples = np.ascontiguousarray(samples, dtype=np.float32)
    duration_seconds = float(samples.shape[0] / sample_rate)

    buffer = io.BytesIO()
    try:
        sf.write(buffer, samples, samplerate=sample_rate, format="WAV", subtype="PCM_16")
    except Exception as exc:
        logger.exception("Error normalizando la muestra de referencia a WAV")
        raise ValueError("No se pudo convertir la muestra de referencia a WAV.") from exc

    buffer.seek(0)
    return DecodedReference(
        content=buffer.getvalue(),
        duration_seconds=duration_seconds,
        sample_rate=sample_rate,
        channels=channels,
    )
