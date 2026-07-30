from pathlib import Path

from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import settings
from app.db.base import Base


if settings.database_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False}
    pool_args = {"pool_pre_ping": True}
elif settings.database_url.startswith("postgresql"):
    connect_args = {}
    pool_args = {
        "pool_size": settings.db_pool_size,
        "max_overflow": settings.db_max_overflow,
        "pool_pre_ping": True,
    }
else:
    connect_args = {}
    pool_args = {"pool_pre_ping": True}

engine = create_engine(
    settings.database_url,
    connect_args=connect_args,
    future=True,
    **pool_args,
)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, expire_on_commit=False, class_=Session)


def init_db() -> None:
    """Initialize tables and seed demo user for local development."""
    from app.db import models  # noqa: F401

    Path(settings.upload_dir).mkdir(parents=True, exist_ok=True)
    Base.metadata.create_all(bind=engine)

    # Seed demo user for testing
    with SessionLocal() as session:
        user = session.get(models.User, "demo-user-id")
        if not user:
            demo_user = models.User(
                id="demo-user-id",
                full_name="Demo Student",
                email="demo@student.com",
                password_hash="demo_hashed_password",
                role="student",
            )
            session.add(demo_user)
            session.commit()


def get_db_session() -> Generator[Session, None, None]:
    """Yield a request-scoped database session."""
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()
