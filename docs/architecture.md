# StudyPilot AI Architecture

## System Goals

StudyPilot AI is designed to optimize for:

- Transparent AI planning
- Explainable recommendations
- User-controlled autonomy
- Incremental replanning instead of destructive regeneration
- Maintainable hackathon-to-production evolution

## Architecture Layers

```text
API (FastAPI routers, request/response schemas)
  ->
Application Services (orchestration, use cases)
  ->
Agents (planner, replanner, parser, explainer, sync)
  ->
Repositories / Gateways (database, vector store, Google APIs)
  ->
Infrastructure (PostgreSQL, Redis, Chroma, external APIs)
```

## Backend Design

The backend follows clean architecture boundaries:

- `api/`: HTTP entry points and API dependency wiring
- `core/`: config, security, logging, shared exceptions
- `modules/`: domain-focused application packages
- `agents/`: specialized autonomous agents operating on structured state
- `repositories/`: persistence interfaces and concrete adapters
- `schemas/`: external-facing API DTOs

## AI Design

LangGraph is the orchestration backbone because the product needs:

- Stateful workflows
- Specialized agents
- Deterministic branching
- Human-in-the-loop checkpoints
- Partial replanning over a shared graph state

### Initial Agents

- `planner_agent`
- `replanner_agent`
- `pdf_parser_agent`
- `explanation_agent`
- `calendar_agent`
- `classroom_sync_agent`
- `reminder_agent`

### Shared State Principles

Agents exchange typed planner state rather than raw prompts. This improves:

- Traceability
- Validation
- Testing
- Explainability
- Future model portability

## Why This Structure

- It keeps the hackathon build fast without turning into a one-file prototype.
- It prevents AI logic from leaking into routers.
- It makes later integrations with Google APIs, vector stores, and notifications additive rather than invasive.
