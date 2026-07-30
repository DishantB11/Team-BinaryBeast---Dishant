from app.schemas.dashboard import DashboardSummaryResponse


class DashboardService:
    """Application service for dashboard-facing summary data."""

    def get_summary(self) -> DashboardSummaryResponse:
        return DashboardSummaryResponse(
            today_focus="Connect your learning sources to unlock adaptive planning.",
            pending_assignments=0,
            upcoming_exams=0,
            study_streak_days=0,
        )
