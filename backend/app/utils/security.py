"""Password hashing and JWT creation/verification.

Access and refresh tokens are both signed JWTs distinguished by a `type`
claim, so a refresh token can never be used to authenticate a request and
vice-versa.
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from enum import Enum
from typing import Any

import jwt
from passlib.context import CryptContext

from app.config import get_settings
from app.utils.exceptions import AuthError

_pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class TokenType(str, Enum):
    access = "access"
    refresh = "refresh"


# --- Passwords ---------------------------------------------------------------


def hash_password(plain: str) -> str:
    return _pwd_context.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    return _pwd_context.verify(plain, hashed)


# --- JWT ---------------------------------------------------------------------


def _create_token(subject: str, token_type: TokenType, expires: timedelta) -> str:
    settings = get_settings()
    now = datetime.now(timezone.utc)
    payload: dict[str, Any] = {
        "sub": subject,
        "type": token_type.value,
        "iat": now,
        "exp": now + expires,
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def create_access_token(subject: str) -> str:
    settings = get_settings()
    return _create_token(
        subject,
        TokenType.access,
        timedelta(minutes=settings.access_token_expire_minutes),
    )


def create_refresh_token(subject: str) -> str:
    settings = get_settings()
    return _create_token(
        subject,
        TokenType.refresh,
        timedelta(days=settings.refresh_token_expire_days),
    )


def decode_token(token: str, expected_type: TokenType) -> str:
    """Return the subject (user id) if the token is valid and of the right type."""
    settings = get_settings()
    try:
        payload = jwt.decode(
            token, settings.jwt_secret, algorithms=[settings.jwt_algorithm]
        )
    except jwt.ExpiredSignatureError as exc:
        raise AuthError("Token has expired.", code="token_expired") from exc
    except jwt.PyJWTError as exc:
        raise AuthError("Invalid token.", code="token_invalid") from exc

    if payload.get("type") != expected_type.value:
        raise AuthError("Wrong token type.", code="token_wrong_type")

    subject = payload.get("sub")
    if not subject:
        raise AuthError("Malformed token.", code="token_malformed")
    return subject
