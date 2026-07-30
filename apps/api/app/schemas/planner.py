from pydantic import BaseModel, Field


class StudyTaskPreview(BaseModel):
    """Represents the shape of an explainable planner task."""

    task: str
    subject: str
    module: str
    estimated_duration_minutes: int = Field(gt=0)
    priority: str
    reason: str
    confidence: float = Field(ge=0.0, le=1.0)


class PlannerPreviewResponse(BaseModel):
    """Preview response for planner output."""

    plan_title: str
    explanation: str
    tasks: list[StudyTaskPreview]
