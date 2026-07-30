from collections.abc import Generator
from typing import Annotated

from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.exceptions import UnauthorizedException
from app.core.security import decode_access_token, is_token_invalid
from app.db.session import get_db_session
from app.modules.academic.services import AcademicService
from app.modules.auth.services import AuthService
from app.modules.dashboard.services import DashboardService
from app.modules.planning.services import PlanningService
from app.modules.notifications.services import NotificationService
from app.modules.syllabus.services import SyllabusService


def get_session() -> Generator[Session, None, None]:
    yield from get_db_session()


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


def get_dashboard_service(session: Session = Depends(get_session)) -> DashboardService:
    return DashboardService(session)


def get_planning_service(session: Session = Depends(get_session)) -> PlanningService:
    return PlanningService(session)


def get_academic_service(session: Session = Depends(get_session)) -> AcademicService:
    return AcademicService(session)


def get_auth_service(session: Session = Depends(get_session)) -> AuthService:
    return AuthService(session)


def get_syllabus_service(session: Session = Depends(get_session)) -> SyllabusService:
    return SyllabusService(session)


def get_notification_service(session: Session = Depends(get_session)) -> NotificationService:
    return NotificationService(session)


def get_current_user_id(token: Annotated[str | None, Depends(OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False))]) -> str:
    if not token:
        return "demo-user-id"
    if is_token_invalid(token):
        raise UnauthorizedException("Invalid or expired token.")
    payload = decode_access_token(token)
    return str(payload["sub"])
