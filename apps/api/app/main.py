from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError

from app.api.router import api_router
from app.core.config import settings
from app.core.exceptions import (
    AppException,
    app_exception_handler,
    unhandled_exception_handler,
    validation_exception_handler,
)
from app.core.logging import configure_logging, get_logger
from app.db.session import init_db
from app.schemas.health import HealthResponse


@asynccontextmanager
async def lifespan(_: FastAPI):
    configure_logging()
    init_db()
    logger = get_logger(__name__)
    logger.info("application.startup", app_name=settings.app_name, environment=settings.app_env)
    yield
    logger.info("application.shutdown", app_name=settings.app_name, environment=settings.app_env)


def create_application() -> FastAPI:
    application = FastAPI(
        title=settings.app_name,
        description=settings.openapi_description,
        version=settings.app_version,
        openapi_url=f"{settings.api_v1_prefix}/openapi.json",
        docs_url=f"{settings.api_v1_prefix}/docs",
        redoc_url=f"{settings.api_v1_prefix}/redoc",
        lifespan=lifespan,
    )

    # Configure CORS middleware for frontend communication
    from fastapi.middleware.cors import CORSMiddleware
    application.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Register global exception handlers
    application.add_exception_handler(AppException, app_exception_handler)
    application.add_exception_handler(RequestValidationError, validation_exception_handler)
    application.add_exception_handler(Exception, unhandled_exception_handler)

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
