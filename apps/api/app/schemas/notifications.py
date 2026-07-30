from datetime import datetime

from app.db.enums import NotificationChannel, NotificationStatus
from app.schemas.common import ORMModel


class NotificationCreateRequest(ORMModel):
    title: str
    message: str
    channel: NotificationChannel = NotificationChannel.IN_APP
    scheduled_for: datetime | None = None


class NotificationUpdateRequest(ORMModel):
    status: NotificationStatus | None = None


class NotificationRead(ORMModel):
    id: str
    user_id: str
    channel: NotificationChannel
    status: NotificationStatus
    title: str
    message: str
    scheduled_for: datetime
    created_at: datetime
    updated_at: datetime
