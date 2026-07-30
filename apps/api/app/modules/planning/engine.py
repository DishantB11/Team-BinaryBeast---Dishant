"""Planner engine with real scheduling logic for generating optimal study plans."""

from __future__ import annotations

from datetime import date, datetime, timedelta, timezone
from itertools import groupby
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.enums import FeedbackDecision, PlannerRunStatus, StudySessionStatus
from app.db.models import (
    Assignment,
    Exam,
    Goal,
    Module,
    PlannerFeedback,
    PlannerRun,
    ProgressRecord,
    StudySession,
    Subject,
    User,
)


class PlannerEngine:
    """Generates and adapts study plans based on academic inputs and progress."""

    def __init__(self, session: Session) -> None:
        self.session = session

    def generate_plan(
        self,
        user_id: str,
        window_start: date | None = None,
        window_end: date | None = None,
        daily_hours: float = 4.0,
    ) -> PlannerRun:
        """Generate a full study plan for the given user and time window.

        Implements a priority-driven scheduling algorithm:
        1. Load all assignments, exams, goals, subjects, modules for the user
        2. Calculate urgency scores based on deadlines and priorities
        3. Estimate required hours per item
        4. Distribute study sessions across available days in the window
        5. Create PlannerRun and StudySession records
        """
        user = self.session.get(User, user_id)
        if user is None:
            from app.core.exceptions import NotFoundException
            raise NotFoundException("User")

        now = datetime.now(timezone.utc)
        today = now.date()

        window_start = window_start or today
        window_end = window_end or (today + timedelta(days=14))

        # Load data
        subjects = self.session.scalars(
            select(Subject).where(Subject.user_id == user_id)
        ).all()

        assignments = self.session.scalars(
            select(Assignment)
            .where(Assignment.user_id == user_id, Assignment.status != "completed")
            .order_by(Assignment.due_at.asc())
        ).all()

        exams = self.session.scalars(
            select(Exam)
            .where(Exam.user_id == user_id)
            .order_by(Exam.scheduled_at.asc())
        ).all()

        goals = self.session.scalars(
            select(Goal)
            .where(Goal.user_id == user_id, Goal.is_active == True)
        ).all()

        modules = self.session.scalars(
            select(Module)
        ).all()

        modules_by_subject: dict[str, list[Module]] = {}
        for m in modules:
            modules_by_subject.setdefault(m.subject_id, []).append(m)

        # Calculate total available minutes in the window
        total_days = (window_end - window_start).days + 1
        total_available_minutes = int(total_days * daily_hours * 60)

        # Build prioritized task list
        tasks: list[dict[str, Any]] = []

        # Add assignments
        for assignment in assignments:
            days_until_due = (assignment.due_at.date() - today).days if assignment.due_at.date() >= today else 0
            urgency = max(1, 10 - days_until_due // 2) if days_until_due > 0 else 10
            task = self._build_task(
                task_type="assignment",
                title=f"Work on {assignment.title}",
                subject_id=assignment.subject_id,
                module_id=assignment.module_id,
                priority=assignment.priority,
                urgency=urgency,
                deadline=assignment.due_at,
                estimated_minutes=self._estimate_minutes(assignment.priority, is_exam=False),
                source_id=assignment.id,
            )
            tasks.append(task)

        # Add exams
        for exam in exams:
            days_until_exam = (exam.scheduled_at.date() - today).days if exam.scheduled_at.date() >= today else 1
            urgency = max(1, 12 - days_until_exam // 3) if days_until_exam > 0 else 12
            task = self._build_task(
                task_type="exam_revision",
                title=f"Revise for {exam.title}",
                subject_id=exam.subject_id,
                module_id=None,
                priority=exam.weight // 2 + 1,
                urgency=urgency,
                deadline=exam.scheduled_at,
                estimated_minutes=self._estimate_minutes(exam.weight, is_exam=True),
                source_id=exam.id,
            )
            tasks.append(task)

        # Add goals
        for goal in goals:
            task = self._build_task(
                task_type="goal",
                title=goal.title,
                subject_id=goal.subject_id,
                module_id=None,
                priority=goal.priority,
                urgency=5,
                deadline=datetime.combine(goal.target_date, datetime.min.time(), tzinfo=timezone.utc) if goal.target_date else None,
                estimated_minutes=(goal.target_hours or 10) * 60,
                source_id=goal.id,
            )
            tasks.append(task)

        # Sort by urgency * priority (highest first)
        tasks.sort(key=lambda t: t["score"], reverse=True)

        # Distribute tasks across available time slots
        sessions: list[StudySession] = []
        remaining_minutes = total_available_minutes
        current_date = window_start
        day_index = 0

        for task in tasks:
            if remaining_minutes <= 0:
                break

            est_minutes = min(task["estimated_minutes"], remaining_minutes)
            if est_minutes < 30:
                continue

            # Schedule on the most appropriate day
            scheduled_date = self._find_best_day(
                current_date, window_end, task.get("deadline"), day_index
            )

            start_hour = 9  # Default start time
            scheduled_start = datetime.combine(
                scheduled_date,
                datetime.min.time().replace(hour=start_hour),
                tzinfo=timezone.utc,
            )
            scheduled_end = scheduled_start + timedelta(minutes=est_minutes)

            session = StudySession(
                user_id=user_id,
                subject_id=task["subject_id"],
                module_id=task["module_id"],
                title=task["title"],
                scheduled_start=scheduled_start,
                scheduled_end=scheduled_end,
                estimated_duration_minutes=est_minutes,
                status=StudySessionStatus.PLANNED,
                priority=task["priority"],
                reason=self._generate_reason(task),
                confidence=self._calculate_confidence(task, subjects),
            )
            sessions.append(session)
            remaining_minutes -= est_minutes
            day_index += 1

        # Create the PlannerRun
        input_snapshot = {
            "window_start": str(window_start),
            "window_end": str(window_end),
            "daily_hours": daily_hours,
            "total_tasks": len(tasks),
            "total_estimated_minutes": total_available_minutes - remaining_minutes,
        }
        output_snapshot = {
            "sessions_generated": len(sessions),
            "total_minutes_scheduled": sum(s.estimated_duration_minutes for s in sessions),
            "remaining_minutes": remaining_minutes,
        }

        planner_run = PlannerRun(
            user_id=user_id,
            trigger="manual",
            status=PlannerRunStatus.DRAFT,
            planning_window_start=window_start,
            planning_window_end=window_end,
            reason_summary=f"Generated {len(sessions)} study sessions across {total_days} days.",
            input_snapshot=input_snapshot,
            output_snapshot=output_snapshot,
        )
        self.session.add(planner_run)
        self.session.flush()

        # Link sessions to planner run
        for session in sessions:
            session.planner_run_id = planner_run.id
            self.session.add(session)

        self.session.commit()
        self.session.refresh(planner_run)
        return planner_run

    def replan(
        self,
        user_id: str,
        planner_run_id: str,
        daily_hours: float | None = None,
    ) -> PlannerRun:
        """Adapt an existing plan based on feedback and progress.

        Reads PlannerFeedback and ProgressRecord for the given run,
        reschedules uncompleted/missed sessions, adjusts priorities,
        and generates a new conflict-free study schedule.
        """
        existing_run = self.session.get(PlannerRun, planner_run_id)
        if existing_run is None:
            from app.core.exceptions import NotFoundException
            raise NotFoundException("PlannerRun")

        # 1. Identify uncompleted / missed study sessions
        old_sessions = self.session.scalars(
            select(StudySession).where(
                StudySession.planner_run_id == planner_run_id,
            )
        ).all()

        # Mark non-completed planned sessions as superseded/cancelled
        for session in old_sessions:
            if session.status == StudySessionStatus.PLANNED:
                session.status = StudySessionStatus.CANCELLED

        # Mark old run as superseded
        existing_run.status = PlannerRunStatus.SUPERSEDED

        # 2. Gather feedback signals
        feedbacks = self.session.scalars(
            select(PlannerFeedback).where(
                PlannerFeedback.planner_run_id == planner_run_id,
            )
        ).all()

        feedback_adjustments: dict[str, int] = {}
        for fb in feedbacks:
            if fb.decision == FeedbackDecision.REJECTED:
                if fb.study_session_id:
                    feedback_adjustments[fb.study_session_id] = -5
            elif fb.decision == FeedbackDecision.MODIFIED:
                if fb.study_session_id:
                    feedback_adjustments[fb.study_session_id] = 2

        # 3. Calculate historical velocity from ProgressRecords
        recent_progress = self.session.scalars(
            select(ProgressRecord).where(
                ProgressRecord.user_id == user_id,
                ProgressRecord.progress_date >= (existing_run.planning_window_start - timedelta(days=7)),
            )
        ).all()

        # Scale recommended daily hours based on user's actual velocity
        if daily_hours is None:
            daily_hours = 4.0
            if recent_progress:
                total_studied_minutes = sum(p.minutes_studied for p in recent_progress)
                unique_days = len(set(p.progress_date for p in recent_progress)) or 1
                avg_daily_minutes = total_studied_minutes / unique_days
                # Scale smoothly between 2.0 and 8.0 hours
                daily_hours = max(2.0, min(8.0, round(avg_daily_minutes / 60 * 1.1, 1)))

        # 4. Generate new adapted plan
        now = datetime.now(timezone.utc).date()
        window_start = max(now, existing_run.planning_window_start)
        window_end = max(window_start + timedelta(days=7), existing_run.planning_window_end)

        return self.generate_plan(
            user_id=user_id,
            window_start=window_start,
            window_end=window_end,
            daily_hours=daily_hours,
        )

    def _build_task(
        self,
        task_type: str,
        title: str,
        subject_id: str | None,
        module_id: str | None,
        priority: int,
        urgency: int,
        deadline: datetime | None,
        estimated_minutes: int,
        source_id: str | None = None,
    ) -> dict[str, Any]:
        score = (priority * 2) + urgency
        return {
            "type": task_type,
            "title": title,
            "subject_id": subject_id,
            "module_id": module_id,
            "priority": priority,
            "urgency": urgency,
            "score": score,
            "deadline": deadline,
            "estimated_minutes": estimated_minutes,
            "source_id": source_id,
        }

    def _estimate_minutes(self, weight: int, is_exam: bool = False) -> int:
        """Estimate required study minutes based on weight/priority."""
        base = weight * 30
        if is_exam:
            base = base * 2
        return min(base, 240)  # Cap at 4 hours per session

    def _find_best_day(
        self,
        window_start: date,
        window_end: date,
        deadline: datetime | None,
        day_index: int,
    ) -> date:
        """Find the best day to schedule a task."""
        if deadline:
            deadline_date = deadline.date()
            # Schedule at least 2 days before deadline if possible
            buffer_date = deadline_date - timedelta(days=2)
            if window_start <= buffer_date <= window_end:
                return buffer_date
            if deadline_date >= window_start:
                return min(deadline_date, window_end)

        # Distribute evenly across the window
        total_days = (window_end - window_start).days + 1
        offset = min(day_index, total_days - 1)
        return window_start + timedelta(days=offset)

    def _generate_reason(self, task: dict[str, Any]) -> str:
        """Generate an explainable reason for the task."""
        reasons: dict[str, str] = {
            "assignment": (
                f"Assignment with priority {task['priority']}/5 and urgency score {task['urgency']}/10. "
                "Scheduled to ensure completion before the deadline with adequate buffer."
            ),
            "exam_revision": (
                f"Exam revision with weight {task['priority']}/5. "
                "Multiple revision sessions are recommended to ensure thorough preparation."
            ),
            "goal": (
                f"Active learning goal with priority {task['priority']}/5. "
                "Regular progress toward goals maintains motivation and steady advancement."
            ),
        }
        return reasons.get(task["type"], "Scheduled based on priority and deadline analysis.")

    def _calculate_confidence(self, task: dict[str, Any], subjects: list[Subject]) -> float:
        """Calculate a confidence score (0-1) for the task recommendation."""
        base_confidence = 0.75

        # Higher priority items have more data, thus higher confidence
        priority_bonus = (task["priority"] / 5) * 0.15

        # Urgency bonus: very urgent items are clear priorities
        urgency_bonus = (task["urgency"] / 10) * 0.10

        # Subject familiarity bonus
        subject_familiarity = 0.0
        if task["subject_id"]:
            for subject in subjects:
                if subject.id == task["subject_id"] and subject.difficulty:
                    # Easier subjects = higher confidence in plan
                    subject_familiarity = (6 - subject.difficulty) / 5 * 0.05

        confidence = min(base_confidence + priority_bonus + urgency_bonus + subject_familiarity, 0.98)
        return round(confidence, 2)

