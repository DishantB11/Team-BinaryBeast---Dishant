from typing import Annotated

from fastapi import APIRouter, Depends, Query

from app.api.dependencies import get_current_user_id, get_notification_service
from app.db.enums import NotificationStatus
from app.modules.notifications.services import NotificationService
from app.schemas.notifications import (
    NotificationCreateRequest,
    NotificationRead,
    NotificationUpdateRequest,
)

router = APIRouter()


@router.post("/notifications", response_model=NotificationRead, status_code=201)
async def create_notification(
    payload: NotificationCreateRequest,
    current_user_id: Annotated[str, Depends(get_current_user_id)],
    service: Annotated[NotificationService, Depends(get_notification_service)],
) -> NotificationRead:
    notification = service.create_notification(
        user_id=current_user_id,
        title=payload.title,
        message=payload.message,
        channel=payload.channel,
        scheduled_for=payload.scheduled_for,
    )
    return NotificationRead.model_validate(notification)


@router.get("/notifications", response_model=list[NotificationRead])
async def list_notifications(
    current_user_id: Annotated[str, Depends(get_current_user_id)],
    service: Annotated[NotificationService, Depends(get_notification_service)],
    status: NotificationStatus | None = Query(default=None),
    limit: int = Query(default=50, ge=1, le=200),
) -> list[NotificationRead]:
    notifications = service.list_notifications(
        user_id=current_user_id,
        status=status,
        limit=limit,
    )
    return [NotificationRead.model_validate(n) for n in notifications]


@router.patch("/notifications/{notification_id}/read", response_model=NotificationRead)
async def mark_notification_read(
    notification_id: str,
    service: Annotated[NotificationService, Depends(get_notification_service)],
) -> NotificationRead:
    notification = service.mark_as_read(notification_id)
    return NotificationRead.model_validate(notification)


@router.patch("/notifications/{notification_id}", response_model=NotificationRead)
async def update_notification(
    notification_id: str,
    payload: NotificationUpdateRequest,
    service: Annotated[NotificationService, Depends(get_notification_service)],
) -> NotificationRead:
    if payload.status == NotificationStatus.DISMISSED:
        service.dismiss_notification(notification_id)
    else:
        notification = service.mark_as_read(notification_id)
    return NotificationRead.model_validate(notification)


@router.delete("/notifications/{notification_id}", status_code=204)
async def delete_notification(
    notification_id: str,
    service: Annotated[NotificationService, Depends(get_notification_service)],
) -> None:
    service.dismiss_notification(notification_id)
