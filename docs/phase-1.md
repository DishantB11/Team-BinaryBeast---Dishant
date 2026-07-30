# Phase 1 Decisions

## What was delivered

- Backend-first repository layout
- Clean architecture backend scaffold
- Dockerfiles and `docker-compose.yml`
- Environment templates
- Developer documentation

## Engineering choices

### Why FastAPI

FastAPI gives us:

- Strong typing
- Automatic OpenAPI docs
- Async support
- Fast iteration speed

### Why modular backend packages instead of one `services/` folder

Feature-oriented modules make it easier to scale the project as syllabus parsing, planning, and sync features evolve independently.

### Why use ports first for integrations

Google Classroom, Calendar, OCR, notifications, and vector storage are all external dependencies. Defining seams early avoids major rewrites later.

## Deferred to Phase 2+

- JWT and Google OAuth flows
- LangGraph implementation
- Chroma integration
- Scheduler and notification execution
