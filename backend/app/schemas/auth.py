"""Auth request/response DTOs (the public API contract)."""

from __future__ import annotations

from pydantic import BaseModel, EmailStr, Field

from app.models.user import Language, Theme


class RegisterRequest(BaseModel):
    email: EmailStr
    full_name: str = Field(min_length=1, max_length=120)
    password: str = Field(min_length=8, max_length=128)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class RefreshRequest(BaseModel):
    refresh_token: str


class TokenPair(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class UserPreferencesPublic(BaseModel):
    language: Language
    theme: Theme
    voice_enabled: bool
    notifications_enabled: bool


class UserPublic(BaseModel):
    """User shape returned to clients — never includes the password hash."""

    id: str
    email: EmailStr
    full_name: str
    is_active: bool
    preferences: UserPreferencesPublic


class AuthResponse(BaseModel):
    user: UserPublic
    tokens: TokenPair
