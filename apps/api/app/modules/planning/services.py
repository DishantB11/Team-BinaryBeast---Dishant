from datetime import date
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundException
from app.db.enums import FeedbackDecision, StudySessionStatus
from app.db.models import (
    Assignment,
    Exam,
    PlannerFeedback,
    PlannerRun,
    ProgressRecord,
    StudySession,
    Subject,
)
from app.modules.planning.engine import PlannerEngine
from app.schemas.planner import (
    PlannerGenerateRequest,
    PlannerPreviewResponse,
    PlannerReplanRequest,
    PlannerRunRead,
    PlannerStatusResponse,
    StudySessionRead,
    StudyTaskPreview,
)


class PlanningService:
    """Planner service with real scheduling engine."""

    def __init__(self, session: Session) -> None:
        self.session = session
        self.engine = PlannerEngine(session)

    def get_preview(self) -> PlannerPreviewResponse:
        """Get a preview of upcoming tasks for the dashboard."""
        subject = self.session.query(Subject).order_by(Subject.created_at.desc()).first()
        assignments = self.session.query(Assignment).order_by(Assignment.due_at.asc()).limit(3).all()
        exams = self.session.query(Exam).order_by(Exam.scheduled_at.asc()).limit(2).all()

        tasks: list[StudyTaskPreview] = []

        for assignment in assignments:
            tasks.append(
                StudyTaskPreview(
                    task=f"Work on {assignment.title}",
                    subject=assignment.subject.name if assignment.subject else "General",
                    module=assignment.module.title if assignment.module else "Coursework",
                    estimated_duration_minutes=90,
                    priority="high" if assignment.priority >= 4 else "medium",
                    reason="Assignment deadlines should be addressed before they become urgent.",
                    confidence=0.84,
                )
            )
        for exam in exams:
            tasks.append(
                StudyTaskPreview(
                    task=f"Revise for {exam.title}",
                    subject=exam.subject.name if exam.subject else "General",
                    module="Revision",
                    estimated_duration_minutes=120,
                    priority="high",
                    reason="Scheduled exams require revision buffers and focused review sessions.",
                    confidence=0.82,
                )
            )
        if not tasks:
            tasks.append(
                StudyTaskPreview(
                    task="Create your first academic inputs",
                    subject=subject.name if subject else "General",
                    module="Foundations",
                    estimated_duration_minutes=90,
                    priority="high",
                    reason="Planner quality improves once subjects, assignments, exams, and goals are stored.",
                    confidence=0.86,
                )
            )

        return PlannerPreviewResponse(
            plan_title="Starter Study Plan",
            explanation="This preview is derived from persisted assignments and exams to reflect near-term workload realistically.",
            tasks=tasks,
        )

    def generate_plan(self, user_id: str, request: PlannerGenerateRequest) -> PlannerRunRead:
        """Generate a new study plan using the engine."""
        planner_run = self.engine.generate_plan(
            user_id=user_id,
            window_start=request.window_start,
            window_end=request.window_end,
            daily_hours=request.daily_hours,
        )
        return self._run_to_read(planner_run)

    def replan(self, user_id: str, planner_run_id: str, request: PlannerReplanRequest) -> PlannerRunRead:
        """Replan based on feedback and progress."""
        from app.db.models import PlannerRun
        if planner_run_id == "default-run" or not self.session.get(PlannerRun, planner_run_id):
            latest_run = self.session.query(PlannerRun).filter_by(user_id=user_id).order_by(PlannerRun.created_at.desc()).first()
            if latest_run:
                planner_run_id = latest_run.id
            else:
                # Generate initial plan if none exists
                return self.generate_plan(user_id, PlannerGenerateRequest())

        planner_run = self.engine.replan(
            user_id=user_id,
            planner_run_id=planner_run_id,
            daily_hours=request.daily_hours,
        )
        return self._run_to_read(planner_run)

    def approve_plan(self, planner_run_id: str) -> PlannerRunRead:
        """Approve a draft plan."""
        run = self.session.get(PlannerRun, planner_run_id)
        if run is None:
            raise NotFoundException("PlannerRun")
        from app.db.enums import PlannerRunStatus
        run.status = PlannerRunStatus.APPROVED
        self.session.commit()
        self.session.refresh(run)
        return self._run_to_read(run)

    def get_plan_status(self, user_id: str) -> PlannerStatusResponse:
        """Get the current plan status for a user."""
        latest_run = self.session.scalar(
            select(PlannerRun)
            .where(PlannerRun.user_id == user_id)
            .order_by(PlannerRun.created_at.desc())
            .limit(1)
        )

        # Count completed vs planned sessions
        planned_count = self.session.scalar(
            select(PlannerRun)
            .join(StudySession, StudySession.planner_run_id == PlannerRun.id)
            .where(PlannerRun.user_id == user_id, StudySession.status == StudySessionStatus.PLANNED)
            .with_only_columns(StudySession.id)
        )

        completed_count = self.session.scalar(
            select(PlannerRun)
            .join(StudySession, StudySession.planner_run_id == PlannerRun.id)
            .where(PlannerRun.user_id == user_id, StudySession.status == StudySessionStatus.COMPLETED)
            .with_only_columns(StudySession.id)
        )

        return PlannerStatusResponse(
            has_active_plan=latest_run is not None,
            plan_status=latest_run.status.value if latest_run else None,
            planned_sessions=planned_count or 0,
            completed_sessions=completed_count or 0,
            total_sessions=(planned_count or 0) + (completed_count or 0),
        )

    def submit_feedback(
        self,
        user_id: str,
        planner_run_id: str,
        study_session_id: str | None,
        decision: FeedbackDecision,
        notes: str | None = None,
    ) -> dict[str, Any]:
        """Submit feedback on a study session or plan."""
        feedback = PlannerFeedback(
            user_id=user_id,
            planner_run_id=planner_run_id,
            study_session_id=study_session_id,
            decision=decision,
            feedback_notes=notes,
        )
        self.session.add(feedback)
        self.session.commit()
        self.session.refresh(feedback)
        return {"id": feedback.id, "decision": feedback.decision.value}

    def get_sessions(self, planner_run_id: str) -> list[StudySessionRead]:
        """Get all study sessions for a planner run."""
        sessions = self.session.scalars(
            select(StudySession)
            .where(StudySession.planner_run_id == planner_run_id)
            .order_by(StudySession.scheduled_start.asc())
        ).all()
        return [
            StudySessionRead(
                id=s.id,
                title=s.title,
                subject_id=s.subject_id,
                module_id=s.module_id,
                scheduled_start=s.scheduled_start,
                scheduled_end=s.scheduled_end,
                estimated_duration_minutes=s.estimated_duration_minutes,
                status=s.status.value,
                priority=s.priority,
                reason=s.reason,
                confidence=s.confidence,
            )
            for s in sessions
        ]

    def mark_session_completed(self, session_id: str, minutes_studied: int | None = None) -> StudySessionRead:
        """Mark a study session as completed."""
        session = self.session.get(StudySession, session_id)
        if session is None:
            raise NotFoundException("StudySession")
        session.status = StudySessionStatus.COMPLETED
        self.session.commit()
        self.session.refresh(session)

        # Record progress
        if minutes_studied and session.user_id and session.subject_id:
            progress = ProgressRecord(
                user_id=session.user_id,
                subject_id=session.subject_id,
                module_id=session.module_id,
                study_session_id=session.id,
                progress_date=session.scheduled_start.date(),
                minutes_studied=minutes_studied,
                completion_percent=100,
            )
            self.session.add(progress)
            self.session.commit()

        return StudySessionRead(
            id=session.id,
            title=session.title,
            subject_id=session.subject_id,
            module_id=session.module_id,
            scheduled_start=session.scheduled_start,
            scheduled_end=session.scheduled_end,
            estimated_duration_minutes=session.estimated_duration_minutes,
            status=session.status.value,
            priority=session.priority,
            reason=session.reason,
            confidence=session.confidence,
        )

    def get_run(self, planner_run_id: str) -> PlannerRunRead:
        """Get a planner run by ID."""
        run = self.session.get(PlannerRun, planner_run_id)
        if run is None:
            raise NotFoundException("PlannerRun")
        return self._run_to_read(run)

    def list_runs(self, user_id: str) -> list[PlannerRunRead]:
        """List all planner runs for a user."""
        runs = self.session.scalars(
            select(PlannerRun)
            .where(PlannerRun.user_id == user_id)
            .order_by(PlannerRun.created_at.desc())
        ).all()
        return [self._run_to_read(r) for r in runs]

    @staticmethod
    def _run_to_read(run: PlannerRun) -> PlannerRunRead:
        return PlannerRunRead(
            id=run.id,
            user_id=run.user_id,
            trigger=run.trigger,
            status=run.status.value,
            planning_window_start=run.planning_window_start,
            planning_window_end=run.planning_window_end,
            reason_summary=run.reason_summary,
            input_snapshot=run.input_snapshot,
            output_snapshot=run.output_snapshot,
            created_at=run.created_at,
            updated_at=run.updated_at,
        )
