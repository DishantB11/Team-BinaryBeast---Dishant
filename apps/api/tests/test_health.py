from fastapi.testclient import TestClient

from app.db import models  # noqa: F401
from app.db.base import Base
from app.main import app


def test_health_check() -> None:
    client = TestClient(app)
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_metadata_contains_core_tables() -> None:
    expected_tables = {
        "users",
        "subjects",
        "modules",
        "assignments",
        "exams",
        "goals",
    }
    assert expected_tables.issubset(Base.metadata.tables.keys())


def test_create_user_and_subject() -> None:
    client = TestClient(app)

    user_response = client.post(
        "/api/v1/academic/users",
        json={
            "full_name": "Dishu",
            "email": "dishu@example.com",
            "timezone": "Asia/Calcutta",
            "role": "student",
        },
    )
    assert user_response.status_code == 201
    user_id = user_response.json()["id"]

    subject_response = client.post(
        "/api/v1/academic/subjects",
        json={
            "user_id": user_id,
            "name": "DBMS",
            "code": "CS301",
            "description": "Database systems",
            "difficulty": 4,
            "color_hex": "#2563EB",
        },
    )
    assert subject_response.status_code == 201
    assert subject_response.json()["name"] == "DBMS"


def test_register_and_login_flow() -> None:
    client = TestClient(app)

    register_response = client.post(
        "/api/v1/auth/register",
        json={
            "full_name": "Planner User",
            "email": "planner@example.com",
            "password": "securepass123",
            "timezone": "Asia/Calcutta",
            "role": "student",
        },
    )
    assert register_response.status_code == 201
    assert "access_token" in register_response.json()

    login_response = client.post(
        "/api/v1/auth/login",
        json={
            "email": "planner@example.com",
            "password": "securepass123",
        },
    )
    assert login_response.status_code == 200
    assert login_response.json()["token_type"] == "bearer"
