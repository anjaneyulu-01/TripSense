"""Authentication routes: register, login, refresh, current user."""

from __future__ import annotations

from fastapi import APIRouter, status

from app.api.deps import AuthServiceDep, CurrentUser
from app.schemas.auth import (
    AuthResponse,
    LoginRequest,
    RefreshRequest,
    RegisterRequest,
    TokenPair,
    UserPublic,
)
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def register(payload: RegisterRequest, auth: AuthServiceDep) -> AuthResponse:
    user, tokens = await auth.register(payload)
    return AuthResponse(user=user, tokens=tokens)


@router.post("/login", response_model=AuthResponse)
async def login(payload: LoginRequest, auth: AuthServiceDep) -> AuthResponse:
    user, tokens = await auth.login(payload.email, payload.password)
    return AuthResponse(user=user, tokens=tokens)


@router.post("/refresh", response_model=TokenPair)
async def refresh(payload: RefreshRequest, auth: AuthServiceDep) -> TokenPair:
    return await auth.refresh(payload.refresh_token)


@router.get("/me", response_model=UserPublic)
async def me(current_user: CurrentUser) -> UserPublic:
    return AuthService._to_public(current_user)
