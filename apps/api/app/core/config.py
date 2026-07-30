from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "StudyPilot AI API"
    app_version: str = "0.1.0"
    app_env: str = "development"
    api_v1_prefix: str = "/api/v1"
    database_url: str = "postgresql+psycopg://postgres:postgres@localhost:5432/studypilot"
    redis_url: str = "redis://localhost:6379/0"
    openapi_description: str = (
        "Backend service for StudyPilot AI planning, syllabus ingestion, external sync, and explainable recommendations."
    )
    openai_api_key: str = "replace-me"
    google_client_id: str = "replace-me"
    google_client_secret: str = "replace-me"
    google_redirect_uri: str = "http://localhost:8000/api/v1/auth/google/callback"
    jwt_secret_key: str = "replace-me"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
