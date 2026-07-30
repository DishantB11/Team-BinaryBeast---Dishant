from typing import Annotated

from fastapi import APIRouter, Depends

from app.api.dependencies import get_current_user_id, get_planning_service
from app.db.enums import FeedbackDecision
from app.modules.planning.services import PlanningService
from app.schemas.planner import (
    FeedbackSubmitRequest,
    MarkSessionCompleteRequest,
    PlannerGenerateRequest,
    PlannerPreviewResponse,
    PlannerReplanRequest,
    PlannerRunRead,
    PlannerStatusResponse,
    StudySessionRead,
)

router = APIRouter()


@router.get("/preview", response_model=PlannerPreviewResponse)
async def get_planner_preview(
    planning_service: Annotated[PlanningService, Depends(get_planning_service)],
) -> PlannerPreviewResponse:
    return planning_service.get_preview()


@router.post("/generate", response_model=PlannerRunRead, status_code=201)
async def generate_plan(
    request: PlannerGenerateRequest,
    current_user_id: Annotated[str, Depends(get_current_user_id)],
    planning_service: Annotated[PlanningService, Depends(get_planning_service)],
) -> PlannerRunRead:
    return planning_service.generate_plan(current_user_id, request)


@router.post("/replan", response_model=PlannerRunRead)
async def replan(
    request: PlannerReplanRequest,
    current_user_id: Annotated[str, Depends(get_current_user_id)],
    planning_service: Annotated[PlanningService, Depends(get_planning_service)],
) -> PlannerRunRead:
    return planning_service.replan(current_user_id, request.planner_run_id, request)


@router.post("/runs/{planner_run_id}/approve", response_model=PlannerRunRead)
async def approve_plan(
    planner_run_id: str,
    planning_service: Annotated[PlanningService, Depends(get_planning_service)],
) -> PlannerRunRead:
    return planning_service.approve_plan(planner_run_id)


@router.get("/runs", response_model=list[PlannerRunRead])
async def list_runs(
    current_user_id: Annotated[str, Depends(get_current_user_id)],
    planning_service: Annotated[PlanningService, Depends(get_planning_service)],
) -> list[PlannerRunRead]:
    return planning_service.list_runs(current_user_id)


@router.get("/runs/{planner_run_id}", response_model=PlannerRunRead)
async def get_run(
    planner_run_id: str,
    planning_service: Annotated[PlanningService, Depends(get_planning_service)],
) -> PlannerRunRead:
    return planning_service.get_run(planner_run_id)


@router.get("/runs/{planner_run_id}/sessions", response_model=list[StudySessionRead])
async def get_sessions(
    planner_run_id: str,
    planning_service: Annotated[PlanningService, Depends(get_planning_service)],
) -> list[StudySessionRead]:
    return planning_service.get_sessions(planner_run_id)


@router.get("/status", response_model=PlannerStatusResponse)
async def get_plan_status(
    current_user_id: Annotated[str, Depends(get_current_user_id)],
    planning_service: Annotated[PlanningService, Depends(get_planning_service)],
) -> PlannerStatusResponse:
    return planning_service.get_plan_status(current_user_id)


@router.post("/feedback", response_model=dict)
async def submit_feedback(
    request: FeedbackSubmitRequest,
    current_user_id: Annotated[str, Depends(get_current_user_id)],
    planning_service: Annotated[PlanningService, Depends(get_planning_service)],
) -> dict:
    return planning_service.submit_feedback(
        user_id=current_user_id,
        planner_run_id=request.planner_run_id,
        study_session_id=request.study_session_id,
        decision=request.decision,
        notes=request.notes,
    )


@router.patch("/sessions/{session_id}/complete", response_model=StudySessionRead)
async def mark_session_completed(
    session_id: str,
    request: MarkSessionCompleteRequest,
    planning_service: Annotated[PlanningService, Depends(get_planning_service)],
) -> StudySessionRead:
    return planning_service.mark_session_completed(session_id, request.minutes_studied)


@router.get("/sessions/{session_id}", response_model=StudySessionRead)
async def get_session(
    session_id: str,
    planning_service: Annotated[PlanningService, Depends(get_planning_service)],
) -> StudySessionRead:
    return planning_service.mark_session_completed(session_id)

