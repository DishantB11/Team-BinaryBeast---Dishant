from typing import Annotated

from fastapi import APIRouter, Depends

from app.api.dependencies import get_auth_service, get_current_user_id
from app.modules.auth.services import AuthService
from app.schemas.auth import (
    AuthenticatedUser,
    ChangePasswordRequest,
    LoginRequest,
    ProfileUpdateRequest,
    RegisterRequest,
    TokenResponse,
)

router = APIRouter()


@router.post("/register", response_model=TokenResponse, status_code=201)
async def register(
    payload: RegisterRequest,
    service: Annotated[AuthService, Depends(get_auth_service)],
) -> TokenResponse:
    return service.register(payload)


@router.post("/login", response_model=TokenResponse)
async def login(
    payload: LoginRequest,
    service: Annotated[AuthService, Depends(get_auth_service)],
) -> TokenResponse:
    return service.login(payload)


@router.get("/me", response_model=AuthenticatedUser)
async def me(
    current_user_id: Annotated[str, Depends(get_current_user_id)],
    service: Annotated[AuthService, Depends(get_auth_service)],
) -> AuthenticatedUser:
    return service.get_authenticated_user(current_user_id)


@router.patch("/me", response_model=AuthenticatedUser)
async def update_profile(
    payload: ProfileUpdateRequest,
    current_user_id: Annotated[str, Depends(get_current_user_id)],
    service: Annotated[AuthService, Depends(get_auth_service)],
) -> AuthenticatedUser:
    return service.update_profile(current_user_id, payload)


@router.post("/change-password", status_code=204)
async def change_password(
    payload: ChangePasswordRequest,
    current_user_id: Annotated[str, Depends(get_current_user_id)],
    service: Annotated[AuthService, Depends(get_auth_service)],
) -> None:
    service.change_password(current_user_id, payload.old_password, payload.new_password)


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    current_user_id: Annotated[str, Depends(get_current_user_id)],
    service: Annotated[AuthService, Depends(get_auth_service)],
) -> TokenResponse:
    return service.refresh_token(current_user_id)

