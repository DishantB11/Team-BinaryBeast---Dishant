from fastapi import APIRouter, Depends

from app.api.dependencies import get_dashboard_service
from app.modules.dashboard.services import DashboardService
from app.schemas.dashboard import DashboardSummaryResponse

router = APIRouter()


@router.get("/summary", response_model=DashboardSummaryResponse)
async def get_dashboard_summary(
    dashboard_service: DashboardService = Depends(get_dashboard_service),
) -> DashboardSummaryResponse:
    """Return a lightweight dashboard summary placeholder for Phase 1."""
    return dashboard_service.get_summary()
