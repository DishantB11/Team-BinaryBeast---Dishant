"""Notification service for in-app and external notifications."""

from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundException
from app.db.enums import NotificationChannel, NotificationStatus
from app.db.models import Notification, StudySession, User


class NotificationService:
    """Service for creating and managing notifications."""

    def __init__(self, session: Session) -> None:
        self.session = session

    def create_notification(
        self,
        user_id: str,
        title: str,
        message: str,
        channel: NotificationChannel = NotificationChannel.IN_APP,
        scheduled_for: datetime | None = None,
    ) -> Notification:
        """Create a new notification."""
        notification = Notification(
            user_id=user_id,
            channel=channel,
            status=NotificationStatus.PENDING,
            title=title,
            message=message,
            scheduled_for=scheduled_for or datetime.now(timezone.utc),
        )
        self.session.add(notification)
        self.session.commit()
        self.session.refresh(notification)
        return notification

    def send_study_session_reminder(self, session_id: str) -> Notification | None:
        """Send a reminder for an upcoming study session."""
        study_session = self.session.get(StudySession, session_id)
        if study_session is None or study_session.user_id is None:
            return None

        user = self.session.get(User, study_session.user_id)
        if user is None:
            return None

        minutes_until = int((study_session.scheduled_start - datetime.now(timezone.utc)).total_seconds() / 60)

        return self.create_notification(
            user_id=study_session.user_id,
            title=f"Study Session Reminder",
            message=(
                f"Your session '{study_session.title}' starts in {minutes_until} minutes "
                f"(at {study_session.scheduled_start.strftime('%H:%M')}). "
                f"Duration: {study_session.estimated_duration_minutes} minutes."
            ),
            channel=NotificationChannel.IN_APP,
            scheduled_for=study_session.scheduled_start,
        )

    def send_plan_generated_notification(self, user_id: str, session_count: int) -> Notification:
        """Notify user that a new study plan has been generated."""
        return self.create_notification(
            user_id=user_id,
            title="New Study Plan Generated",
            message=f"A new study plan with {session_count} sessions has been generated for you.",
        )

    def list_notifications(
        self,
        user_id: str,
        status: NotificationStatus | None = None,
        limit: int = 50,
    ) -> list[Notification]:
        """List notifications for a user."""
        stmt = (
            select(Notification)
            .where(Notification.user_id == user_id)
            .order_by(Notification.created_at.desc())
            .limit(limit)
        )
        if status:
            stmt = stmt.where(Notification.status == status)
        return list(self.session.scalars(stmt).all())

    def mark_as_read(self, notification_id: str) -> Notification:
        """Mark a notification as sent/read."""
        notification = self.session.get(Notification, notification_id)
        if notification is None:
            raise NotFoundException("Notification")
        notification.status = NotificationStatus.SENT
        self.session.commit()
        self.session.refresh(notification)
        return notification

    def dismiss_notification(self, notification_id: str) -> None:
        """Dismiss a notification."""
        notification = self.session.get(Notification, notification_id)
        if notification is None:
            raise NotFoundException("Notification")
        notification.status = NotificationStatus.DISMISSED
        self.session.commit()

