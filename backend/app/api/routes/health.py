"""Health & status endpoints."""

from __future__ import annotations

from fastapi import APIRouter

from app.config import get_settings
from app.database import db_state, ensure_connected
from app.services.ai import get_ai_service

router = APIRouter(tags=["system"])


@router.get("/health")
async def health() -> dict:
    """Liveness + configuration status (safe to expose; no secrets)."""
    settings = get_settings()
    try:
        providers = get_ai_service().available_providers
    except RuntimeError:
        providers = []

    db_connected = await ensure_connected()
    return {
        "status": "ok",
        "env": settings.app_env,
        "database_connected": db_connected,
        "ai_providers": providers,
        "primary_provider": providers[0] if providers else None,
    }





