from pydantic import BaseModel


class DashboardSummaryResponse(BaseModel):
    """Top-level dashboard metrics shown on the home screen."""

    today_focus: str
    pending_assignments: int
    upcoming_exams: int
    study_streak_days: int
