from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.db.models import Assignment, Exam
from app.schemas.dashboard import DashboardSummaryResponse


class DashboardService:
    """Dashboard-facing read service."""

    def __init__(self, session: Session) -> None:
        self.session = session

    def get_summary(self) -> DashboardSummaryResponse:
        pending_assignments = self.session.scalar(
            select(func.count()).select_from(Assignment).where(Assignment.status != "completed")
        ) or 0
        upcoming_exams = self.session.scalar(select(func.count()).select_from(Exam)) or 0

        return DashboardSummaryResponse(
            today_focus="Review urgent deadlines first, then allocate deep work to your hardest subject.",
            pending_assignments=int(pending_assignments),
            upcoming_exams=int(upcoming_exams),
            study_streak_days=0,
        )
