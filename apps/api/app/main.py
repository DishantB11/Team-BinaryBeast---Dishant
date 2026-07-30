from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.api.router import api_router
from app.core.config import settings
from app.core.logging import configure_logging, get_logger
from app.schemas.health import HealthResponse


@asynccontextmanager
async def lifespan(_: FastAPI):
    """Configure application concerns that should run on startup and shutdown."""
    configure_logging()
    logger = get_logger(__name__)
    logger.info("application.startup", app_name=settings.app_name, environment=settings.app_env)
    yield
    logger.info("application.shutdown", app_name=settings.app_name, environment=settings.app_env)


def create_application() -> FastAPI:
    """Create and configure the FastAPI application."""
    application = FastAPI(
        title=settings.app_name,
        description=settings.openapi_description,
        version=settings.app_version,
        openapi_url=f"{settings.api_v1_prefix}/openapi.json",
        docs_url=f"{settings.api_v1_prefix}/docs",
        redoc_url=f"{settings.api_v1_prefix}/redoc",
        lifespan=lifespan,
    )

    application.include_router(api_router, prefix=settings.api_v1_prefix)

    @application.get("/health", tags=["Health"], response_model=HealthResponse)
    async def health_check() -> HealthResponse:
        return HealthResponse(
            status="ok",
            app_name=settings.app_name,
            environment=settings.app_env,
            version=settings.app_version,
        )

    return application


app = create_application()
