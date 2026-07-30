from fastapi.testclient import TestClient

from app.db import models  # noqa: F401
from app.main import app
from app.db.base import Base


def test_health_check() -> None:
    client = TestClient(app)

    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {
        "status": "ok",
        "app_name": "StudyPilot AI API",
        "environment": "development",
        "version": "0.1.0",
    }


def test_metadata_contains_core_tables() -> None:
    expected_tables = {
        "users",
        "subjects",
        "modules",
        "assignments",
        "exams",
        "goals",
        "study_sessions",
        "notifications",
        "progress_records",
        "planner_runs",
        "planner_feedback",
        "calendar_events",
    }

    assert expected_tables.issubset(Base.metadata.tables.keys())
