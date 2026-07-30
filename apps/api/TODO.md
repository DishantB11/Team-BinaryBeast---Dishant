# Backend Completion TODO

## Phase 1: API Enhancements & Auth Flow
- [ ] 1.1 Add global exception handlers (`app/core/exceptions.py`)
- [ ] 1.2 Add structured error response schema
- [ ] 1.3 Add GET /{id} endpoints to all academic routes
- [ ] 1.4 Add DELETE for syllabus documents
- [ ] 1.5 Add PATCH /auth/me (profile update)
- [ ] 1.6 Add POST /auth/change-password
- [ ] 1.7 Add POST /auth/refresh (token refresh with blacklist)
- [ ] 1.8 Fix dependencies to apply auth to academic endpoints

## Phase 2: Planner Engine with Real Scheduling
- [ ] 2.1 Implement planner engine (`app/modules/planning/engine.py`)
- [ ] 2.2 Implement `PlanningService.generate_plan()` with real logic
- [ ] 2.3 Add `POST /planner/generate` and `POST /planner/replan` endpoints
- [ ] 2.4 Add planner schemas for generate/replan requests
- [ ] 2.5 Implement adaptive replanning with feedback/progress

## Phase 3: Syllabus & OCR Pipeline
- [ ] 3.1 Add OCR support (pytesseract) for scanned PDFs/images
- [ ] 3.2 Add AI extraction service for syllabus content
- [ ] 3.3 Add async processing for large documents
- [ ] 3.4 Support .docx uploads
- [ ] 3.5 Add syllabus document update/delete endpoints

## Phase 4: Notifications & Scheduler
- [ ] 4.1 Create notification service (`app/modules/notifications/services.py`)
- [ ] 4.2 Create notification endpoints
- [ ] 4.3 Add APScheduler background scheduler
- [ ] 4.4 Implement study session reminders

## Phase 5: RAG/Vector Storage
- [ ] 5.1 Add vector DB config and dependencies
- [ ] 5.2 Create embedding service
- [ ] 5.3 Create RAG query service
- [ ] 5.4 Integrate RAG with planner recommendations

## Phase 6: Production Infrastructure
- [ ] 6.1 Set up Alembic with initial migration
- [ ] 6.2 Update config/session for PostgreSQL support
- [ ] 6.3 Create comprehensive seed data script
- [ ] 6.4 Write unit tests for all services
- [ ] 6.5 Write integration tests for all endpoints
- [ ] 6.6 Update requirements.txt with all new dependencies

