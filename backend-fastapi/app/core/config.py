from functools import lru_cache
from typing import Literal

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Configuración del microservicio cargada desde variables de entorno o archivo .env."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # Identidad y entorno del servicio
    app_name: str = "TTS Microservice"
    environment: Literal["development", "staging", "production"] = "development"
    log_level: str = "INFO"

    # Parámetros del modelo TTS y audio
    model_name: str = "KittenML/kitten-tts-2"
    device: Literal["cpu", "cuda"] = "cpu"
    default_voice: str = "default"
    sample_rate: int = Field(default=24000, gt=0)
    max_text_length: int = Field(default=1500, gt=0, le=10000)

    # Concurrencia y límites de entrada
    max_concurrent_inferences: int = Field(default=1, ge=1, le=16)
    semaphore_timeout_seconds: float = Field(default=10.0, gt=0)
    max_reference_audio_mb: int = Field(default=10, ge=1, le=50)
    min_reference_audio_seconds: float = Field(default=0.5, ge=0.0, le=60.0)
    max_reference_audio_seconds: float = Field(default=30.0, gt=0.0, le=300.0)


@lru_cache
def get_settings() -> Settings:
    """Devuelve una única instancia cacheada de Settings."""
    return Settings()