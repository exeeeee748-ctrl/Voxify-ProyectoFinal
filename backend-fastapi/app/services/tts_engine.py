from dataclasses import dataclass
import gc
import logging
import os
import tempfile
from typing import Any

import numpy as np

logger = logging.getLogger(__name__)

DEFAULT_LANGUAGES: list[dict[str, str]] = [
    {"code": "en", "name": "English"},
    {"code": "es", "name": "Spanish"},
    {"code": "de", "name": "German"},
    {"code": "fr", "name": "French"},
    {"code": "it", "name": "Italian"},
    {"code": "pt", "name": "Portuguese"},
    {"code": "ru", "name": "Russian"},
    {"code": "hi", "name": "Hindi"},
    {"code": "ar", "name": "Arabic"},
    {"code": "zh", "name": "Chinese"},
    {"code": "ja", "name": "Japanese"},
    {"code": "ko", "name": "Korean"},
    {"code": "nl", "name": "Dutch"},
    {"code": "pl", "name": "Polish"},
    {"code": "tr", "name": "Turkish"},
    {"code": "id", "name": "Indonesian"},
]

LANGUAGE_NAMES: dict[str, str] = {item["code"]: item["name"] for item in DEFAULT_LANGUAGES}


@dataclass
class RawAudioResult:
    """Salida cruda de la síntesis antes de codificar a WAV/MP3/OGG."""

    samples: np.ndarray
    sample_rate: int


class TTSEngine:
    """Envoltorio desacoplado para cargar y ejecutar Kitten TTS."""

    def __init__(self, model_name: str, device: str = "cpu", sample_rate: int = 24000) -> None:
        self.model_name = model_name
        self.device = device
        self.sample_rate = sample_rate
        self._model: Any = None
        self._loaded = False

    def load(self) -> None:
        """Carga el modelo Kitten TTS en memoria o dispositivo."""
        logger.info("Cargando modelo Kitten TTS '%s' en '%s'...", self.model_name, self.device)

        try:
            from kittenml import KittenTTS
        except ImportError as exc:
            raise RuntimeError(
                "No está instalado el paquete 'kittenml'. Instálalo con: pip install kittenml"
            ) from exc

        model = KittenTTS(self.model_name)
        self.sample_rate = self._resolve_sample_rate(model)

        self._model = model
        self._loaded = True
        logger.info(
            "Modelo Kitten TTS '%s' cargado correctamente (sample_rate=%d).",
            self.model_name,
            self.sample_rate,
        )

    def is_loaded(self) -> bool:
        """Indica si el modelo está cargado y listo para sintetizar."""
        return self._loaded and self._model is not None

    def get_available_languages(self) -> list[dict[str, str]]:
        """Obtiene todos los idiomas disponibles del modelo o la lista base."""
        avail = getattr(self._model, "available_voices", None) if self.is_loaded() else None
        if isinstance(avail, dict) and avail:
            languages: list[dict[str, str]] = []
            for code in avail.keys():
                clean_code = str(code).strip()
                if clean_code:
                    languages.append(
                        {
                            "code": clean_code,
                            "name": LANGUAGE_NAMES.get(clean_code.lower(), clean_code.upper()),
                        }
                    )
            if languages:
                return languages
        return DEFAULT_LANGUAGES

    def get_available_voices(self) -> list[dict[str, str]]:
        """Obtiene todas las voces disponibles del modelo Kitten TTS 2."""
        if not self.is_loaded():
            return []

        voices_out: list[dict[str, str]] = []
        voices_dict = getattr(self._model, "voices", None)
        avail_list = getattr(self._model, "available_voices", None)

        if isinstance(voices_dict, dict) and voices_dict:
            for voice_name, meta in voices_dict.items():
                name_str = str(voice_name).strip()
                if not name_str:
                    continue
                meta_dict = meta if isinstance(meta, dict) else {}
                voice_code = str(meta_dict.get("voice_id", name_str))
                transcript = str(meta_dict.get("transcript", "")).strip()
                desc = f"voice_id={voice_code}" + (f" | muestra: {transcript}" if transcript else "")
                voices_out.append(
                    {
                        "id": name_str,
                        "name": name_str,
                        "voice_id": voice_code,
                        "description": desc,
                    }
                )
            return voices_out

        if isinstance(avail_list, (list, tuple, set)):
            for v_name in avail_list:
                name_str = str(v_name).strip()
                if name_str:
                    voices_out.append(
                        {
                            "id": name_str,
                            "name": name_str,
                            "voice_id": name_str,
                            "description": "",
                        }
                    )

        return voices_out

    def _resolve_sample_rate(self, model: Any) -> int:
        """Obtiene el sample_rate del modelo si es válido; de lo contrario usa el configurado."""
        model_sr = getattr(model, "sample_rate", None)
        if isinstance(model_sr, int) and model_sr > 0:
            return model_sr
        return self.sample_rate

    def _prepare_text(self, text: str) -> str:
        """Valida que el motor esté cargado y limpia el texto de entrada."""
        if not self.is_loaded():
            raise RuntimeError("El modelo TTS no está cargado.")

        clean_text = text.strip()
        if not clean_text:
            raise ValueError("El texto no puede estar vacío.")

        return clean_text

    def _extract_audio_and_sr(self, raw_audio: Any) -> tuple[Any, int | None]:
        """Extrae muestras y sample_rate si el modelo devuelve una tupla o diccionario."""
        sr_override: int | None = None
        if isinstance(raw_audio, dict):
            for key in ("audio", "samples", "wav", "waveform"):
                if key in raw_audio:
                    if isinstance(raw_audio.get("sample_rate"), int) and raw_audio["sample_rate"] > 0:
                        sr_override = raw_audio["sample_rate"]
                    raw_audio = raw_audio[key]
                    break
        elif isinstance(raw_audio, tuple) and len(raw_audio) == 2:
            first, second = raw_audio
            if isinstance(second, int) and second > 0:
                raw_audio = first
                sr_override = second
            elif isinstance(first, int) and first > 0:
                raw_audio = second
                sr_override = first
        return raw_audio, sr_override

    def _to_float32_samples(self, raw_audio: Any) -> np.ndarray:
        """Normaliza la salida del modelo a un arreglo NumPy float32 limpio."""
        if hasattr(raw_audio, "detach"):
            raw_audio = raw_audio.detach().cpu().numpy()

        samples = np.asarray(raw_audio, dtype=np.float32)
        if samples.ndim > 1 and 1 in samples.shape:
            samples = np.squeeze(samples)

        return np.ascontiguousarray(samples, dtype=np.float32)

    def _apply_speed(self, samples: np.ndarray, speed: float) -> np.ndarray:
        """Ajusta la velocidad del audio en memoria sin modificar el sample_rate."""
        if speed == 1.0 or samples.size == 0 or speed <= 0:
            return samples

        new_length = max(1, int(round(samples.shape[-1] / speed)))
        x_old = np.linspace(0.0, 1.0, num=samples.shape[-1], endpoint=False)
        x_new = np.linspace(0.0, 1.0, num=new_length, endpoint=False)

        if samples.ndim == 1:
            return np.ascontiguousarray(np.interp(x_new, x_old, samples), dtype=np.float32)

        resampled = np.stack(
            [np.interp(x_new, x_old, channel) for channel in samples],
            axis=0,
        )
        return np.ascontiguousarray(resampled, dtype=np.float32)

    def _finalize_result(self, raw_audio: Any, speed: float = 1.0) -> RawAudioResult:
        """Convierte la salida cruda del modelo en un RawAudioResult."""
        extracted_audio, sr_override = self._extract_audio_and_sr(raw_audio)
        samples = self._to_float32_samples(extracted_audio)
        samples = self._apply_speed(samples, speed)
        sr = sr_override if sr_override else self._resolve_sample_rate(self._model)
        return RawAudioResult(samples=samples, sample_rate=sr)

    def synthesize(self, text: str, voice: str = "default", speed: float = 1.0) -> RawAudioResult:
        """Genera muestras reales de audio a partir de texto sin límite de tiempo de inferencia."""
        clean_text = self._prepare_text(text)

        selected_voice = voice.strip() if voice else ""
        use_custom_voice = bool(selected_voice and selected_voice.lower() != "default")

        if use_custom_voice:
            raw_audio = self._model.generate(clean_text, voice=selected_voice)
        else:
            raw_audio = self._model.generate(clean_text)

        result = self._finalize_result(raw_audio, speed=speed)
        duration_sec = (len(result.samples) / result.sample_rate) if result.sample_rate > 0 else 0.0

        logger.info(
            "Síntesis completada | text_len=%d | voice=%s | speed=%.2f | shape=%s | sr=%d | dur=%.2fs",
            len(clean_text),
            selected_voice if use_custom_voice else "default",
            speed,
            result.samples.shape,
            result.sample_rate,
            duration_sec,
        )
        return result

    def clone_and_synthesize(
        self,
        text: str,
        reference_audio_bytes: bytes,
        speed: float = 1.0,
    ) -> RawAudioResult:
        """Clona la voz desde un audio de referencia y sintetiza el texto."""
        clean_text = self._prepare_text(text)

        if not reference_audio_bytes:
            raise ValueError("El archivo de audio de referencia está vacío.")

        tmp_path: str | None = None
        try:
            with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp_file:
                tmp_file.write(reference_audio_bytes)
                tmp_path = tmp_file.name

            raw_audio = self._model.generate(
                clean_text,
                reference=tmp_path,
            )
        finally:
            if tmp_path and os.path.exists(tmp_path):
                try:
                    os.remove(tmp_path)
                except OSError:
                    logger.warning("No se pudo eliminar archivo temporal '%s'", tmp_path)

        result = self._finalize_result(raw_audio, speed=speed)
        duration_sec = (len(result.samples) / result.sample_rate) if result.sample_rate > 0 else 0.0

        logger.info(
            "Clonación completada | text_len=%d | speed=%.2f | shape=%s | sr=%d | dur=%.2fs",
            len(clean_text),
            speed,
            result.samples.shape,
            result.sample_rate,
            duration_sec,
        )
        return result

    def unload(self) -> None:
        """Libera referencias al modelo al detener el microservicio."""
        logger.info("Descargando modelo Kitten TTS '%s'...", self.model_name)
        self._model = None
        self._loaded = False
        gc.collect()