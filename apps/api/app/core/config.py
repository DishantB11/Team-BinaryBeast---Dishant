from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "StudyPilot AI API"
    app_version: str = "0.2.0"
    app_env: str = "development"
    api_v1_prefix: str = "/api/v1"
    openapi_description: str = (
        "Backend service for StudyPilot AI planning, syllabus ingestion, progress tracking, and explainable recommendations."
    )
    database_url: str = "sqlite:///./studypilot.db"
    upload_dir: str = "./uploads"
    redis_url: str = "redis://localhost:6379/0"
    openai_api_key: str = "replace-me"
    watsonx_apikey: str = ""
    watsonx_project_id: str = ""
    watsonx_url: str = "https://us-south.ml.cloud.ibm.com"
    jwt_secret_key: str = "replace-me"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60

    # Vector storage settings
    vector_store_path: str = "./vector_store"
    embedding_model: str = "sentence-transformers/all-MiniLM-L6-v2"
    chunk_size: int = 512
    chunk_overlap: int = 64

    # OCR settings
    tesseract_cmd: str = "tesseract"

    # Scheduler settings
    scheduler_enabled: bool = False
    reminder_lead_minutes: int = 30

    # PostgreSQL pool settings (used when database_url is postgresql)
    db_pool_size: int = 5
    db_max_overflow: int = 10


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
