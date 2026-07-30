from __future__ import annotations

import uuid
from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import JSON, Boolean, Date, DateTime, Enum, ForeignKey, Integer, Numeric, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.db.enums import (
    FeedbackDecision,
    NotificationChannel,
    NotificationStatus,
    PlannerRunStatus,
    StudySessionStatus,
)
from app.db.mixins import TimestampMixin, UUIDPrimaryKeyMixin


JsonType = JSON().with_variant(JSONB, "postgresql")


class User(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "users"

    full_name: Mapped[str] = mapped_column(String(255))
    email: Mapped[str] = mapped_column(String(320), unique=True, index=True)
    avatar_url: Mapped[str | None] = mapped_column(String(500))
    timezone: Mapped[str] = mapped_column(String(100), default="UTC")
    role: Mapped[str] = mapped_column(String(50), default="student")
    google_id: Mapped[str | None] = mapped_column(String(255), unique=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    last_synced_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    subjects: Mapped[list["Subject"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    assignments: Mapped[list["Assignment"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    exams: Mapped[list["Exam"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    goals: Mapped[list["Goal"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    study_sessions: Mapped[list["StudySession"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    notifications: Mapped[list["Notification"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    progress_records: Mapped[list["ProgressRecord"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    planner_runs: Mapped[list["PlannerRun"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    planner_feedback_items: Mapped[list["PlannerFeedback"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
    )
    calendar_events: Mapped[list["CalendarEvent"]] = relationship(back_populates="user", cascade="all, delete-orphan")


class Subject(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "subjects"

    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    name: Mapped[str] = mapped_column(String(255))
    code: Mapped[str | None] = mapped_column(String(100))
    description: Mapped[str | None] = mapped_column(Text)
    difficulty: Mapped[int] = mapped_column(Integer, default=3)
    color_hex: Mapped[str | None] = mapped_column(String(7))
    syllabus_source_name: Mapped[str | None] = mapped_column(String(255))

    user: Mapped["User"] = relationship(back_populates="subjects")
    modules: Mapped[list["Module"]] = relationship(back_populates="subject", cascade="all, delete-orphan")
    assignments: Mapped[list["Assignment"]] = relationship(back_populates="subject", cascade="all, delete-orphan")
    exams: Mapped[list["Exam"]] = relationship(back_populates="subject", cascade="all, delete-orphan")
    goals: Mapped[list["Goal"]] = relationship(back_populates="subject")
    study_sessions: Mapped[list["StudySession"]] = relationship(back_populates="subject", cascade="all, delete-orphan")
    progress_records: Mapped[list["ProgressRecord"]] = relationship(back_populates="subject", cascade="all, delete-orphan")
    calendar_events: Mapped[list["CalendarEvent"]] = relationship(back_populates="subject")


class Module(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "modules"
    __table_args__ = (UniqueConstraint("subject_id", "sequence_number", name="uq_modules_subject_sequence"),)

    subject_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("subjects.id", ondelete="CASCADE"), index=True)
    title: Mapped[str] = mapped_column(String(255))
    sequence_number: Mapped[int] = mapped_column(Integer)
    description: Mapped[str | None] = mapped_column(Text)
    learning_outcomes: Mapped[list[str] | None] = mapped_column(JsonType)
    estimated_hours: Mapped[Decimal | None] = mapped_column(Numeric(5, 2))
    weight: Mapped[int] = mapped_column(Integer, default=3)

    subject: Mapped["Subject"] = relationship(back_populates="modules")
    assignments: Mapped[list["Assignment"]] = relationship(back_populates="module")
    study_sessions: Mapped[list["StudySession"]] = relationship(back_populates="module")
    progress_records: Mapped[list["ProgressRecord"]] = relationship(back_populates="module")


class Assignment(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "assignments"

    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    subject_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("subjects.id", ondelete="CASCADE"), index=True)
    module_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("modules.id", ondelete="SET NULL"))
    title: Mapped[str] = mapped_column(String(255))
    description: Mapped[str | None] = mapped_column(Text)
    due_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    priority: Mapped[int] = mapped_column(Integer, default=3)
    status: Mapped[str] = mapped_column(String(50), default="pending")
    source: Mapped[str] = mapped_column(String(50), default="manual")
    external_id: Mapped[str | None] = mapped_column(String(255))
    attachment_count: Mapped[int] = mapped_column(Integer, default=0)

    user: Mapped["User"] = relationship(back_populates="assignments")
    subject: Mapped["Subject"] = relationship(back_populates="assignments")
    module: Mapped["Module" | None] = relationship(back_populates="assignments")
    notifications: Mapped[list["Notification"]] = relationship(back_populates="assignment")
    calendar_events: Mapped[list["CalendarEvent"]] = relationship(back_populates="assignment")


class Exam(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "exams"

    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    subject_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("subjects.id", ondelete="CASCADE"), index=True)
    title: Mapped[str] = mapped_column(String(255))
    scheduled_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    location: Mapped[str | None] = mapped_column(String(255))
    weight: Mapped[int] = mapped_column(Integer, default=5)
    notes: Mapped[str | None] = mapped_column(Text)

    user: Mapped["User"] = relationship(back_populates="exams")
    subject: Mapped["Subject"] = relationship(back_populates="exams")


class Goal(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "goals"

    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    subject_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("subjects.id", ondelete="SET NULL"))
    title: Mapped[str] = mapped_column(String(255))
    description: Mapped[str | None] = mapped_column(Text)
    target_date: Mapped[date | None] = mapped_column(Date)
    target_hours: Mapped[Decimal | None] = mapped_column(Numeric(6, 2))
    priority: Mapped[int] = mapped_column(Integer, default=3)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    user: Mapped["User"] = relationship(back_populates="goals")
    subject: Mapped["Subject" | None] = relationship(back_populates="goals")


class PlannerRun(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "planner_runs"

    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    trigger: Mapped[str] = mapped_column(String(50), default="manual")
    status: Mapped[PlannerRunStatus] = mapped_column(Enum(PlannerRunStatus, name="planner_run_status"), default=PlannerRunStatus.DRAFT)
    planning_window_start: Mapped[date] = mapped_column(Date)
    planning_window_end: Mapped[date] = mapped_column(Date)
    reason_summary: Mapped[str | None] = mapped_column(Text)
    input_snapshot: Mapped[dict] = mapped_column(JsonType)
    output_snapshot: Mapped[dict] = mapped_column(JsonType)
    graph_trace: Mapped[dict | None] = mapped_column(JsonType)

    user: Mapped["User"] = relationship(back_populates="planner_runs")
    study_sessions: Mapped[list["StudySession"]] = relationship(back_populates="planner_run")
    feedback_items: Mapped[list["PlannerFeedback"]] = relationship(back_populates="planner_run", cascade="all, delete-orphan")


class StudySession(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "study_sessions"

    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    subject_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("subjects.id", ondelete="CASCADE"), index=True)
    module_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("modules.id", ondelete="SET NULL"))
    planner_run_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("planner_runs.id", ondelete="SET NULL"))
    title: Mapped[str] = mapped_column(String(255))
    scheduled_start: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    scheduled_end: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    actual_start: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    actual_end: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    estimated_duration_minutes: Mapped[int] = mapped_column(Integer)
    status: Mapped[StudySessionStatus] = mapped_column(Enum(StudySessionStatus, name="study_session_status"), default=StudySessionStatus.PLANNED)
    priority: Mapped[int] = mapped_column(Integer, default=3)
    reason: Mapped[str] = mapped_column(Text)
    confidence: Mapped[Decimal] = mapped_column(Numeric(4, 3))
    is_revision: Mapped[bool] = mapped_column(Boolean, default=False)

    user: Mapped["User"] = relationship(back_populates="study_sessions")
    subject: Mapped["Subject"] = relationship(back_populates="study_sessions")
    module: Mapped["Module" | None] = relationship(back_populates="study_sessions")
    planner_run: Mapped["PlannerRun" | None] = relationship(back_populates="study_sessions")
    notifications: Mapped[list["Notification"]] = relationship(back_populates="study_session")
    progress_records: Mapped[list["ProgressRecord"]] = relationship(back_populates="study_session")
    planner_feedback_items: Mapped[list["PlannerFeedback"]] = relationship(back_populates="study_session")
    calendar_events: Mapped[list["CalendarEvent"]] = relationship(back_populates="study_session")


class Notification(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "notifications"

    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    study_session_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("study_sessions.id", ondelete="SET NULL"))
    assignment_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("assignments.id", ondelete="SET NULL"))
    channel: Mapped[NotificationChannel] = mapped_column(
        Enum(NotificationChannel, name="notification_channel"),
        default=NotificationChannel.IN_APP,
    )
    status: Mapped[NotificationStatus] = mapped_column(
        Enum(NotificationStatus, name="notification_status"),
        default=NotificationStatus.PENDING,
    )
    title: Mapped[str] = mapped_column(String(255))
    message: Mapped[str] = mapped_column(Text)
    scheduled_for: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    sent_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    metadata_json: Mapped[dict | None] = mapped_column(JsonType)

    user: Mapped["User"] = relationship(back_populates="notifications")
    study_session: Mapped["StudySession" | None] = relationship(back_populates="notifications")
    assignment: Mapped["Assignment" | None] = relationship(back_populates="notifications")


class PlannerFeedback(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "planner_feedback"

    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    planner_run_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("planner_runs.id", ondelete="CASCADE"))
    study_session_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("study_sessions.id", ondelete="SET NULL"))
    decision: Mapped[FeedbackDecision] = mapped_column(Enum(FeedbackDecision, name="feedback_decision"))
    feedback_notes: Mapped[str | None] = mapped_column(Text)
    edited_payload: Mapped[dict | None] = mapped_column(JsonType)

    user: Mapped["User"] = relationship(back_populates="planner_feedback_items")
    planner_run: Mapped["PlannerRun"] = relationship(back_populates="feedback_items")
    study_session: Mapped["StudySession" | None] = relationship(back_populates="planner_feedback_items")


class ProgressRecord(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "progress_records"
    __table_args__ = (
        UniqueConstraint("user_id", "subject_id", "module_id", "progress_date", name="uq_progress_daily"),
    )

    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    subject_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("subjects.id", ondelete="CASCADE"))
    module_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("modules.id", ondelete="SET NULL"))
    study_session_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("study_sessions.id", ondelete="SET NULL"))
    progress_date: Mapped[date] = mapped_column(Date)
    completion_percent: Mapped[Decimal] = mapped_column(Numeric(5, 2), default=0)
    minutes_studied: Mapped[int] = mapped_column(Integer, default=0)
    comprehension_score: Mapped[int | None] = mapped_column(Integer)
    notes: Mapped[str | None] = mapped_column(Text)

    user: Mapped["User"] = relationship(back_populates="progress_records")
    subject: Mapped["Subject"] = relationship(back_populates="progress_records")
    module: Mapped["Module" | None] = relationship(back_populates="progress_records")
    study_session: Mapped["StudySession" | None] = relationship(back_populates="progress_records")


class CalendarEvent(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "calendar_events"

    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    subject_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("subjects.id", ondelete="SET NULL"))
    assignment_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("assignments.id", ondelete="SET NULL"))
    study_session_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("study_sessions.id", ondelete="SET NULL"))
    external_id: Mapped[str | None] = mapped_column(String(255), unique=True)
    title: Mapped[str] = mapped_column(String(255))
    description: Mapped[str | None] = mapped_column(Text)
    starts_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    ends_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    event_type: Mapped[str] = mapped_column(String(50), default="study_block")
    source: Mapped[str] = mapped_column(String(50), default="system")
    is_all_day: Mapped[bool] = mapped_column(Boolean, default=False)

    user: Mapped["User"] = relationship(back_populates="calendar_events")
    subject: Mapped["Subject" | None] = relationship(back_populates="calendar_events")
    assignment: Mapped["Assignment" | None] = relationship(back_populates="calendar_events")
    study_session: Mapped["StudySession" | None] = relationship(back_populates="calendar_events")
