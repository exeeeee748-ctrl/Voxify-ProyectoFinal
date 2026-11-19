from fastapi import FastAPI

app = FastAPI(
    title="Voxify API",
    description="Servicio de procesamiento de texto a voz",
    version="1.0.0"
)

@app.get("/")
def inicio():
    return {
        "mensaje": "Bienvenido a Voxify",
        "servicio": "FastAPI",
        "estado": "Funcionando"
    }

@app.get("/health")
def health():
    return {
        "status": "ok"
    }
