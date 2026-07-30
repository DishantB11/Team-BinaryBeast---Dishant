from pydantic import BaseModel


class DashboardSummaryResponse(BaseModel):
    today_focus: str
    pending_assignments: int
    upcoming_exams: int
    study_streak_days: int
