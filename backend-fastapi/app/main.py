import logging

from fastapi import FastAPI
from fastapi.responses import HTMLResponse
from scalar_fastapi import get_scalar_api_reference

from app import __version__
from app.api.routes.health import router as health_router
from app.api.routes.tts import legacy_router as tts_legacy_router
from app.api.routes.tts import router as tts_router
from app.core.config import get_settings
from app.core.lifespan import lifespan


def create_app() -> FastAPI:
    """Construye y configura la instancia principal de FastAPI."""
    settings = get_settings()

    logging.basicConfig(
        level=getattr(logging, settings.log_level.upper(), logging.INFO),
        format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
    )

    app = FastAPI(
        title=settings.app_name,
        version=__version__,
        lifespan=lifespan,
    )

    app.include_router(health_router)
    app.include_router(tts_router)
    app.include_router(tts_legacy_router)

    @app.get("/scalar", response_class=HTMLResponse, include_in_schema=False)
    def scalar_docs() -> HTMLResponse:
        return get_scalar_api_reference(
            openapi_url=app.openapi_url or "/openapi.json",
            title=f"{app.title} - API Reference",
        )

    return app


app = create_app()