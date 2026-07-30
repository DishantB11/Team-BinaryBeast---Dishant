"""initial schema

Revision ID: 20260730_0001
Revises:
Create Date: 2026-07-30 00:00:00
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "20260730_0001"
down_revision = None
branch_labels = None
depends_on = None


study_session_status = sa.Enum("planned", "completed", "missed", "cancelled", name="study_session_status")
notification_channel = sa.Enum("in_app", "email", "push", "calendar", name="notification_channel")
notification_status = sa.Enum("pending", "sent", "failed", "dismissed", name="notification_status")
feedback_decision = sa.Enum("accepted", "modified", "rejected", name="feedback_decision")
planner_run_status = sa.Enum("draft", "approved", "partially_applied", "superseded", name="planner_run_status")


def upgrade() -> None:
    bind = op.get_bind()
    study_session_status.create(bind, checkfirst=True)
    notification_channel.create(bind, checkfirst=True)
    notification_status.create(bind, checkfirst=True)
    feedback_decision.create(bind, checkfirst=True)
    planner_run_status.create(bind, checkfirst=True)

    op.create_table(
        "users",
        sa.Column("full_name", sa.String(length=255), nullable=False),
        sa.Column("email", sa.String(length=320), nullable=False),
        sa.Column("avatar_url", sa.String(length=500), nullable=True),
        sa.Column("timezone", sa.String(length=100), nullable=False),
        sa.Column("role", sa.String(length=50), nullable=False, server_default="student"),
        sa.Column("google_id", sa.String(length=255), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("last_synced_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("email"),
        sa.UniqueConstraint("google_id"),
    )
    op.create_index(op.f("ix_users_email"), "users", ["email"], unique=False)

    op.create_table(
        "subjects",
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("code", sa.String(length=100), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("difficulty", sa.Integer(), nullable=False, server_default="3"),
        sa.Column("color_hex", sa.String(length=7), nullable=True),
        sa.Column("syllabus_source_name", sa.String(length=255), nullable=True),
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_subjects_user_id"), "subjects", ["user_id"], unique=False)

    op.create_table(
        "modules",
        sa.Column("subject_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("sequence_number", sa.Integer(), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("learning_outcomes", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("estimated_hours", sa.Numeric(5, 2), nullable=True),
        sa.Column("weight", sa.Integer(), nullable=False, server_default="3"),
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["subject_id"], ["subjects.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("subject_id", "sequence_number", name="uq_modules_subject_sequence"),
    )
    op.create_index(op.f("ix_modules_subject_id"), "modules", ["subject_id"], unique=False)

    op.create_table(
        "goals",
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("subject_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("target_date", sa.Date(), nullable=True),
        sa.Column("target_hours", sa.Numeric(6, 2), nullable=True),
        sa.Column("priority", sa.Integer(), nullable=False, server_default="3"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["subject_id"], ["subjects.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_goals_user_id"), "goals", ["user_id"], unique=False)

    op.create_table(
        "exams",
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("subject_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("scheduled_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("location", sa.String(length=255), nullable=True),
        sa.Column("weight", sa.Integer(), nullable=False, server_default="5"),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["subject_id"], ["subjects.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_exams_user_id"), "exams", ["user_id"], unique=False)
    op.create_index(op.f("ix_exams_subject_id"), "exams", ["subject_id"], unique=False)

    op.create_table(
        "assignments",
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("subject_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("module_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("due_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("priority", sa.Integer(), nullable=False, server_default="3"),
        sa.Column("status", sa.String(length=50), nullable=False, server_default="pending"),
        sa.Column("source", sa.String(length=50), nullable=False, server_default="manual"),
        sa.Column("external_id", sa.String(length=255), nullable=True),
        sa.Column("attachment_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["module_id"], ["modules.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["subject_id"], ["subjects.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_assignments_user_id"), "assignments", ["user_id"], unique=False)
    op.create_index(op.f("ix_assignments_subject_id"), "assignments", ["subject_id"], unique=False)

    op.create_table(
        "calendar_events",
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("subject_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("assignment_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("study_session_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("external_id", sa.String(length=255), nullable=True),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("starts_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("ends_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("event_type", sa.String(length=50), nullable=False, server_default="study_block"),
        sa.Column("source", sa.String(length=50), nullable=False, server_default="system"),
        sa.Column("is_all_day", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["assignment_id"], ["assignments.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["subject_id"], ["subjects.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("external_id"),
    )
    op.create_index(op.f("ix_calendar_events_user_id"), "calendar_events", ["user_id"], unique=False)

    op.create_table(
        "planner_runs",
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("trigger", sa.String(length=50), nullable=False, server_default="manual"),
        sa.Column("status", planner_run_status, nullable=False, server_default="draft"),
        sa.Column("planning_window_start", sa.Date(), nullable=False),
        sa.Column("planning_window_end", sa.Date(), nullable=False),
        sa.Column("reason_summary", sa.Text(), nullable=True),
        sa.Column("input_snapshot", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("output_snapshot", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("graph_trace", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_planner_runs_user_id"), "planner_runs", ["user_id"], unique=False)

    op.create_table(
        "study_sessions",
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("subject_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("module_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("planner_run_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("scheduled_start", sa.DateTime(timezone=True), nullable=False),
        sa.Column("scheduled_end", sa.DateTime(timezone=True), nullable=False),
        sa.Column("actual_start", sa.DateTime(timezone=True), nullable=True),
        sa.Column("actual_end", sa.DateTime(timezone=True), nullable=True),
        sa.Column("estimated_duration_minutes", sa.Integer(), nullable=False),
        sa.Column("status", study_session_status, nullable=False, server_default="planned"),
        sa.Column("priority", sa.Integer(), nullable=False, server_default="3"),
        sa.Column("reason", sa.Text(), nullable=False),
        sa.Column("confidence", sa.Numeric(4, 3), nullable=False),
        sa.Column("is_revision", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["module_id"], ["modules.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["planner_run_id"], ["planner_runs.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["subject_id"], ["subjects.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_study_sessions_user_id"), "study_sessions", ["user_id"], unique=False)
    op.create_index(op.f("ix_study_sessions_subject_id"), "study_sessions", ["subject_id"], unique=False)

    op.create_foreign_key(
        "fk_calendar_events_study_session_id",
        "calendar_events",
        "study_sessions",
        ["study_session_id"],
        ["id"],
        ondelete="SET NULL",
    )

    op.create_table(
        "notifications",
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("study_session_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("assignment_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("channel", notification_channel, nullable=False, server_default="in_app"),
        sa.Column("status", notification_status, nullable=False, server_default="pending"),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("scheduled_for", sa.DateTime(timezone=True), nullable=False),
        sa.Column("sent_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("metadata_json", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["assignment_id"], ["assignments.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["study_session_id"], ["study_sessions.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_notifications_user_id"), "notifications", ["user_id"], unique=False)

    op.create_table(
        "planner_feedback",
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("planner_run_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("study_session_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("decision", feedback_decision, nullable=False),
        sa.Column("feedback_notes", sa.Text(), nullable=True),
        sa.Column("edited_payload", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["planner_run_id"], ["planner_runs.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["study_session_id"], ["study_sessions.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_planner_feedback_user_id"), "planner_feedback", ["user_id"], unique=False)

    op.create_table(
        "progress_records",
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("subject_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("module_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("study_session_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("progress_date", sa.Date(), nullable=False),
        sa.Column("completion_percent", sa.Numeric(5, 2), nullable=False, server_default="0"),
        sa.Column("minutes_studied", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("comprehension_score", sa.Integer(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["module_id"], ["modules.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["study_session_id"], ["study_sessions.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["subject_id"], ["subjects.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "subject_id", "module_id", "progress_date", name="uq_progress_daily"),
    )
    op.create_index(op.f("ix_progress_records_user_id"), "progress_records", ["user_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_progress_records_user_id"), table_name="progress_records")
    op.drop_table("progress_records")
    op.drop_index(op.f("ix_planner_feedback_user_id"), table_name="planner_feedback")
    op.drop_table("planner_feedback")
    op.drop_index(op.f("ix_notifications_user_id"), table_name="notifications")
    op.drop_table("notifications")
    op.drop_index(op.f("ix_study_sessions_subject_id"), table_name="study_sessions")
    op.drop_index(op.f("ix_study_sessions_user_id"), table_name="study_sessions")
    op.drop_table("study_sessions")
    op.drop_index(op.f("ix_planner_runs_user_id"), table_name="planner_runs")
    op.drop_table("planner_runs")
    op.drop_index(op.f("ix_calendar_events_user_id"), table_name="calendar_events")
    op.drop_table("calendar_events")
    op.drop_index(op.f("ix_assignments_subject_id"), table_name="assignments")
    op.drop_index(op.f("ix_assignments_user_id"), table_name="assignments")
    op.drop_table("assignments")
    op.drop_index(op.f("ix_exams_subject_id"), table_name="exams")
    op.drop_index(op.f("ix_exams_user_id"), table_name="exams")
    op.drop_table("exams")
    op.drop_index(op.f("ix_goals_user_id"), table_name="goals")
    op.drop_table("goals")
    op.drop_index(op.f("ix_modules_subject_id"), table_name="modules")
    op.drop_table("modules")
    op.drop_index(op.f("ix_subjects_user_id"), table_name="subjects")
    op.drop_table("subjects")
    op.drop_index(op.f("ix_users_email"), table_name="users")
    op.drop_table("users")

    bind = op.get_bind()
    planner_run_status.drop(bind, checkfirst=True)
    feedback_decision.drop(bind, checkfirst=True)
    notification_status.drop(bind, checkfirst=True)
    notification_channel.drop(bind, checkfirst=True)
    study_session_status.drop(bind, checkfirst=True)
