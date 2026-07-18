"""Authentication use-cases: register, login, token refresh."""

from __future__ import annotations

from app.models.user import UserInDB
from app.repositories import UserRepository
from app.schemas.auth import (
    RegisterRequest,
    TokenPair,
    UserPreferencesPublic,
    UserPublic,
)
from app.utils.exceptions import AuthError
from app.utils.security import (
    TokenType,
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)


class AuthService:
    def __init__(self, users: UserRepository) -> None:
        self._users = users

    async def register(self, data: RegisterRequest) -> tuple[UserPublic, TokenPair]:
        user = UserInDB(
            email=data.email.lower(),
            full_name=data.full_name.strip(),
            hashed_password=hash_password(data.password),
        )
        # UserRepository.create raises ConflictError on duplicate email.
        created = await self._users.create(user)
        return self._to_public(created), self._issue_tokens(created)

    async def login(self, email: str, password: str) -> tuple[UserPublic, TokenPair]:
        user = await self._users.get_by_email(email.lower())
        if user is None or not verify_password(password, user.hashed_password):
            raise AuthError("Invalid email or password.", code="bad_credentials")
        if not user.is_active:
            raise AuthError("This account is disabled.", code="account_disabled")
        return self._to_public(user), self._issue_tokens(user)

    async def refresh(self, refresh_token: str) -> TokenPair:
        user_id = decode_token(refresh_token, TokenType.refresh)
        user = await self._users.get_by_id(user_id)
        if user is None or not user.is_active:
            raise AuthError("Account no longer valid.", code="account_invalid")
        return self._issue_tokens(user)

    async def get_current_user(self, user_id: str) -> UserInDB:
        user = await self._users.get_by_id(user_id)
        if user is None or not user.is_active:
            raise AuthError("Account no longer valid.", code="account_invalid")
        return user

    # --- helpers ---
    def _issue_tokens(self, user: UserInDB) -> TokenPair:
        assert user.id is not None
        return TokenPair(
            access_token=create_access_token(user.id),
            refresh_token=create_refresh_token(user.id),
        )

    @staticmethod
    def _to_public(user: UserInDB) -> UserPublic:
        return UserPublic(
            id=user.id or "",
            email=user.email,
            full_name=user.full_name,
            is_active=user.is_active,
            preferences=UserPreferencesPublic(
                language=user.preferences.language,
                theme=user.preferences.theme,
                voice_enabled=user.preferences.voice_enabled,
                notifications_enabled=user.preferences.notifications_enabled,
            ),
        )
