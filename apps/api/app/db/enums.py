from enum import Enum


class StudySessionStatus(str, Enum):
    PLANNED = "planned"
    COMPLETED = "completed"
    MISSED = "missed"
    CANCELLED = "cancelled"


class NotificationChannel(str, Enum):
    IN_APP = "in_app"
    EMAIL = "email"
    PUSH = "push"
    CALENDAR = "calendar"


class NotificationStatus(str, Enum):
    PENDING = "pending"
    SENT = "sent"
    FAILED = "failed"
    DISMISSED = "dismissed"


class FeedbackDecision(str, Enum):
    ACCEPTED = "accepted"
    MODIFIED = "modified"
    REJECTED = "rejected"


class PlannerRunStatus(str, Enum):
    DRAFT = "draft"
    APPROVED = "approved"
    PARTIALLY_APPLIED = "partially_applied"
    SUPERSEDED = "superseded"
