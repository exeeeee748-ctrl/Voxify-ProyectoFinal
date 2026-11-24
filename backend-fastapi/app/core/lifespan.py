from contextlib import asynccontextmanager
import logging
import threading

from fastapi import FastAPI

from app.core.config import get_settings
from app.services.tts_engine import TTSEngine

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Gestiona el arranque y apagado del microservicio TTS."""
    settings = get_settings()
    logger.info(
        "Iniciando %s (entorno=%s, modelo=%s, dispositivo=%s)",
        settings.app_name,
        settings.environment,
        settings.model_name,
        settings.device,
    )

    engine = TTSEngine(
        model_name=settings.model_name,
        device=settings.device,
        sample_rate=settings.sample_rate,
    )
    engine.load()

    inference_semaphore = threading.Semaphore(settings.max_concurrent_inferences)

    app.state.tts_engine = engine
    app.state.inference_semaphore = inference_semaphore
    app.state.is_ready = engine.is_loaded()

    logger.info("Microservicio TTS listo para recibir peticiones.")
    yield

    logger.info("Apagando %s y liberando recursos...", settings.app_name)
    app.state.is_ready = False
    engine.unload()