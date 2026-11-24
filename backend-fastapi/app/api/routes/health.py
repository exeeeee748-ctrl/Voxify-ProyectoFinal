from fastapi import APIRouter, HTTPException, Request, status

from app import __version__
from app.core.config import get_settings

router = APIRouter(tags=["Health"])


def _is_service_ready(request: Request) -> bool:
    """Comprueba si el estado de la app y el motor TTS están listos."""
    state_ready = bool(getattr(request.app.state, "is_ready", False))
    engine = getattr(request.app.state, "tts_engine", None)
    engine_loaded = bool(
        engine is not None
        and callable(getattr(engine, "is_loaded", None))
        and engine.is_loaded()
    )
    return state_ready and engine_loaded


@router.get("/health")
def health_check(request: Request) -> dict[str, str | bool]:
    """Verifica que la API está viva e informa si el modelo TTS está disponible."""
    settings = get_settings()
    model_loaded = _is_service_ready(request)
    return {
        "status": "ok",
        "service": settings.app_name,
        "version": __version__,
        "model_loaded": model_loaded,
    }


@router.get("/ready")
def readiness_check(request: Request) -> dict[str, str]:
    """Verifica que el modelo TTS esté cargado y el servicio listo para sintetizar."""
    if not _is_service_ready(request):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="El modelo TTS aún no está cargado o el servicio está iniciando/apagando.",
        )

    settings = get_settings()
    return {
        "status": "ready",
        "service": settings.app_name,
        "model": settings.model_name,
        "device": settings.device,
    }
