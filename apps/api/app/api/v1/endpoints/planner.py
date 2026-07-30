from fastapi import APIRouter

from app.schemas.planner import PlannerPreviewResponse, StudyTaskPreview

router = APIRouter()


@router.get("/preview", response_model=PlannerPreviewResponse)
async def get_planner_preview() -> PlannerPreviewResponse:
    """Expose a planner preview contract before the full agent workflow lands."""
    return PlannerPreviewResponse(
        plan_title="Starter Study Plan",
        explanation="This preview shows the shape of explainable planner output for the upcoming phases.",
        tasks=[
            StudyTaskPreview(
                task="Upload syllabus and connect calendar",
                subject="General",
                module="Onboarding",
                estimated_duration_minutes=30,
                priority="high",
                reason="Planner quality depends on structured academic inputs.",
                confidence=0.92,
            )
        ],
    )
