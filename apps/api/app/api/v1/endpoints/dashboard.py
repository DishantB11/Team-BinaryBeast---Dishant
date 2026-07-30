from fastapi import APIRouter

from app.schemas.dashboard import DashboardSummaryResponse

router = APIRouter()


@router.get("/summary", response_model=DashboardSummaryResponse)
async def get_dashboard_summary() -> DashboardSummaryResponse:
    """Return a lightweight dashboard summary placeholder for Phase 1."""
    return DashboardSummaryResponse(
        today_focus="Connect your learning sources to unlock adaptive planning.",
        pending_assignments=0,
        upcoming_exams=0,
        study_streak_days=0,
    )
