from datetime import date, datetime

from pydantic import BaseModel, Field

from app.db.enums import FeedbackDecision
from app.schemas.common import ORMModel


class StudyTaskPreview(BaseModel):
    task: str
    subject: str
    module: str
    estimated_duration_minutes: int = Field(gt=0)
    priority: str
    reason: str
    confidence: float = Field(ge=0.0, le=1.0)


class PlannerPreviewResponse(BaseModel):
    plan_title: str
    explanation: str
    tasks: list[StudyTaskPreview]


class PlannerGenerateRequest(BaseModel):
    window_start: date | None = None
    window_end: date | None = None
    daily_hours: float = Field(default=4.0, ge=1.0, le=12.0)


class PlannerReplanRequest(BaseModel):
    planner_run_id: str
    daily_hours: float | None = Field(default=None, ge=1.0, le=12.0)


class PlannerRunRead(ORMModel):
    id: str
    user_id: str
    trigger: str
    status: str
    planning_window_start: date
    planning_window_end: date
    reason_summary: str | None
    input_snapshot: dict
    output_snapshot: dict
    created_at: datetime
    updated_at: datetime


class StudySessionRead(ORMModel):
    id: str
    title: str
    subject_id: str | None
    module_id: str | None
    scheduled_start: datetime
    scheduled_end: datetime
    estimated_duration_minutes: int
    status: str
    priority: int
    reason: str
    confidence: float


class PlannerStatusResponse(BaseModel):
    has_active_plan: bool
    plan_status: str | None
    planned_sessions: int
    completed_sessions: int
    total_sessions: int


class FeedbackSubmitRequest(BaseModel):
    planner_run_id: str
    study_session_id: str | None = None
    decision: FeedbackDecision
    notes: str | None = None


class MarkSessionCompleteRequest(BaseModel):
    minutes_studied: int | None = Field(default=None, ge=0)
