# StudyPilot AI

StudyPilot AI is an autonomous AI-powered personal study planner built for the Generative AI hackathon theme. This repository currently contains the backend foundation for a production-minded FastAPI service with clean architectural boundaries for planning, ingestion, synchronization, and explainable AI workflows.

## Phase 1 Status

Phase 1 is complete in this repository:

- Architecture defined
- Backend scaffold added
- Shared development conventions documented
- Docker-based local development foundation prepared
- Environment templates included

Next phase: database design and persistence implementation.

## Monorepo Structure

```text
study-pilot-ai/
  apps/
    api/        FastAPI backend
  docs/         Architecture and engineering decisions
```

## Tech Stack

- Backend: FastAPI, Pydantic v2, SQLAlchemy-ready clean architecture layout
- AI: LangGraph-first backend service boundaries
- Infra: Docker Compose, PostgreSQL, Redis placeholders

## Quick Start

### 1. Configure environment files

Copy the templates:

- `apps/api/.env.example` to `apps/api/.env`

### 2. Backend

```bash
cd apps/api
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements-dev.txt
uvicorn app.main:app --reload
```

### 3. Optional infrastructure

```bash
docker compose up --build
```

## Architecture Principles

- Clean Architecture with explicit dependency direction
- API routes stay thin; business logic lives in services and agents
- AI agents operate on structured state, not direct infrastructure calls
- Explanations are first-class entities, not optional UI sugar
- Every recommendation must remain user-reviewable: accept, modify, reject

## Key Documents

- [Architecture Overview](docs/architecture.md)
- [Phase 1 Decisions](docs/phase-1.md)

## Phase Roadmap

1. Phase 1: Architecture and project initialization
2. Phase 2: Database schema, models, migrations, repositories
3. Phase 3: Authentication and authorization
4. Phase 4: Syllabus ingestion and PDF extraction
5. Phase 5: Google integrations
6. Phase 6: AI planner and explanation engine
7. Phase 7: Adaptive replanning and notifications
8. Phase 8: Analytics, heatmap, and hardening

## Notes

- This repo currently emphasizes a strong foundation over feature completeness.
- External integrations are intentionally represented by ports and configuration seams first so later phases can remain stable.
