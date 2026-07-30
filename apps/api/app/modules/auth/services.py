from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.exceptions import DuplicateException, NotFoundException, UnauthorizedException
from app.core.security import create_access_token, hash_password, verify_password
from app.db.models import User
from app.repositories.academic import UserRepository
from app.schemas.auth import (
    AuthenticatedUser,
    ChangePasswordRequest,
    LoginRequest,
    ProfileUpdateRequest,
    RegisterRequest,
    TokenResponse,
)


class AuthService:
    """Local JWT authentication service."""

    def __init__(self, session: Session) -> None:
        self.user_repository = UserRepository(session)

    def register(self, payload: RegisterRequest) -> TokenResponse:
        if self.user_repository.get_by_email(str(payload.email)):
            raise DuplicateException(entity="User", field="email")

        user = self.user_repository.create(
            User(
                full_name=payload.full_name,
                email=str(payload.email),
                password_hash=hash_password(payload.password),
                timezone=payload.timezone,
                role=payload.role,
            )
        )
        return TokenResponse(access_token=create_access_token(user.id))

    def login(self, payload: LoginRequest) -> TokenResponse:
        user = self.user_repository.get_by_email(str(payload.email))
        if user is None or not verify_password(payload.password, user.password_hash):
            raise UnauthorizedException("Invalid credentials.")
        return TokenResponse(access_token=create_access_token(user.id))

    def get_authenticated_user(self, user_id: str) -> AuthenticatedUser:
        user = self.user_repository.get(user_id)
        if user is None:
            raise NotFoundException(entity="User", entity_id=user_id)
        return AuthenticatedUser(
            id=user.id,
            full_name=user.full_name,
            email=user.email,
            timezone=user.timezone,
            role=user.role,
            is_active=user.is_active,
        )

    def update_profile(self, user_id: str, payload: ProfileUpdateRequest) -> AuthenticatedUser:
        user = self.user_repository.get(user_id)
        if user is None:
            raise NotFoundException(entity="User", entity_id=user_id)

        updates = payload.model_dump(exclude_none=True)
        if updates:
            updated_user = self.user_repository.update(user, updates)
        else:
            updated_user = user

        return AuthenticatedUser(
            id=updated_user.id,
            full_name=updated_user.full_name,
            email=updated_user.email,
            timezone=updated_user.timezone,
            role=updated_user.role,
            is_active=updated_user.is_active,
        )

    def change_password(self, user_id: str, old_password: str, new_password: str) -> None:
        user = self.user_repository.get(user_id)
        if user is None:
            raise NotFoundException(entity="User", entity_id=user_id)
        if not verify_password(old_password, user.password_hash):
            raise UnauthorizedException("Current password is incorrect.")
        self.user_repository.update(user, {"password_hash": hash_password(new_password)})

    def refresh_token(self, user_id: str) -> TokenResponse:
        user = self.user_repository.get(user_id)
        if user is None:
            raise NotFoundException(entity="User", entity_id=user_id)
        return TokenResponse(access_token=create_access_token(user.id))

