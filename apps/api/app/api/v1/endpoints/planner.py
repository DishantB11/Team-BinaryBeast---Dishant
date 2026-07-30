from fastapi import APIRouter, Depends

from app.api.dependencies import get_planning_service
from app.modules.planning.services import PlanningService
from app.schemas.planner import PlannerPreviewResponse, StudyTaskPreview

router = APIRouter()


@router.get("/preview", response_model=PlannerPreviewResponse)
async def get_planner_preview(
    planning_service: PlanningService = Depends(get_planning_service),
) -> PlannerPreviewResponse:
    """Expose a planner preview contract before the full agent workflow lands."""
    return planning_service.get_preview()
