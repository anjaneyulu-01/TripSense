"""FastAPI dependency-injection wiring.

Keeps routes thin: they declare the service they need and this module builds
it from the request-scoped database handle + shared singletons.
"""

from __future__ import annotations

from typing import Annotated

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.database import ensure_connected, get_database
from app.models.user import UserInDB
from app.repositories import ConversationRepository, UserRepository
from app.services.ai import AIService, get_ai_service
from app.services.auth_service import AuthService
from app.services.consultant_service import ConsultantService
from app.utils.exceptions import ServiceUnavailableError
from app.utils.security import TokenType, decode_token

_bearer = HTTPBearer(auto_error=True)


async def get_db() -> AsyncIOMotorDatabase:
    """Request-scoped database handle.

    Attempts a lazy (re)connect first, so the app recovers automatically once
    Atlas is reachable again. Returns 503 only while it's genuinely down.
    """
    if not await ensure_connected():
        raise ServiceUnavailableError(
            "The database is temporarily unavailable. Please try again in a moment.",
            code="db_unavailable",
        )
    try:
        return get_database()
    except RuntimeError as exc:
        raise ServiceUnavailableError(str(exc), code="db_unavailable") from exc


DbDep = Annotated[AsyncIOMotorDatabase, Depends(get_db)]


# --- Repositories ---
def get_user_repository(db: DbDep) -> UserRepository:
    return UserRepository(db)


def get_conversation_repository(db: DbDep) -> ConversationRepository:
    return ConversationRepository(db)


# --- Services ---
def get_auth_service(
    users: Annotated[UserRepository, Depends(get_user_repository)],
) -> AuthService:
    return AuthService(users)


def get_consultant_service(
    convos: Annotated[ConversationRepository, Depends(get_conversation_repository)],
    ai: Annotated[AIService, Depends(get_ai_service)],
) -> ConsultantService:
    return ConsultantService(convos, ai)


AuthServiceDep = Annotated[AuthService, Depends(get_auth_service)]
ConsultantServiceDep = Annotated[ConsultantService, Depends(get_consultant_service)]


# --- Current user guard ---
async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(_bearer)],
    auth: AuthServiceDep,
) -> UserInDB:
    user_id = decode_token(credentials.credentials, TokenType.access)
    return await auth.get_current_user(user_id)


CurrentUser = Annotated[UserInDB, Depends(get_current_user)]
