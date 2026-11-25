FROM python:3.12-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libsndfile1 \
    espeak-ng \
    curl \
    && rm -rf /var/lib/apt/lists/*

RUN pip install --no-cache-dir \
    fastapi \
    "uvicorn[standard]" \
    python-multipart \
    pydantic-settings \
    python-dotenv \
    kittenml \
    kitten-text-processing \
    numpy \
    soundfile \
    scalar-fastapi

# Fijar transformers 4.x y diffusers <0.37 compatibles con Kitten TTS 2
# (en transformers 5.x el kwarg past_key_values cambio a cache y rompe el hook de hablante).
RUN pip install --no-cache-dir "transformers>=4.55.0,<5.0.0" "diffusers<0.37.0"

COPY app ./app

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
