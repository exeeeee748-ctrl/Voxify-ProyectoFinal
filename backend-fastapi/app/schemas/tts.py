from typing import Literal

from pydantic import AliasChoices, BaseModel, ConfigDict, Field, field_validator


class TTSRequest(BaseModel):
    """Contrato de entrada para solicitar síntesis de voz."""

    model_config = ConfigDict(str_strip_whitespace=True, populate_by_name=True)

    text: str = Field(
        ...,
        min_length=1,
        max_length=10000,
        description="Texto a convertir en audio.",
    )
    voice: str = Field(
        default="default",
        validation_alias=AliasChoices("voice", "voice_id"),
        description="Identificador de voz o preset del modelo (soporta 'voice' o 'voice_id').",
    )
    speed: float = Field(
        default=1.0,
        ge=0.5,
        le=2.0,
        description="Velocidad de habla (0.5 = lenta, 1.0 = normal, 2.0 = rápida).",
    )
    audio_format: Literal["wav", "mp3", "ogg"] = Field(
        default="wav",
        description="Formato de salida del audio.",
    )

    @field_validator("text")
    @classmethod
    def validate_not_only_whitespace(cls, value: str) -> str:
        """Evita textos compuestos solo por espacios o saltos de línea."""
        if not value.strip():
            raise ValueError("El texto no puede estar vacío ni contener solo espacios.")
        return value


class VoiceInfo(BaseModel):
    """Voz técnica reconocida por la instalación local de Kitten TTS 2."""

    id: str = Field(description="Identificador interno de la voz.")
    name: str = Field(description="Nombre legible de la voz.")
    voice_id: str = Field(description="Identificador que entiende el motor TTS.")
    description: str = Field(default="", description="Detalle técnico opcional de la voz.")


class VoicesResponse(BaseModel):
    """Listado de voces disponibles en la instalación local."""

    voices: list[VoiceInfo]


class LanguageInfo(BaseModel):
    """Idioma soportado por la instalación local del motor TTS."""

    code: str = Field(description="Código ISO del idioma, por ejemplo 'es'.")
    name: str = Field(description="Nombre legible del idioma.")


class LanguagesResponse(BaseModel):
    """Listado de idiomas disponibles en la instalación local."""

    languages: list[LanguageInfo]
