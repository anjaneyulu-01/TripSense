"""AI Travel Consultant routes."""

from __future__ import annotations

from fastapi import APIRouter

from app.api.deps import ConsultantServiceDep, CurrentUser
from app.schemas.consult import ConsultRequest, ConsultResponse

router = APIRouter(prefix="/consult", tags=["ai-consultant"])

_ALLOWED_LANGUAGES = {"en", "hi", "te"}


@router.post("", response_model=ConsultResponse)
async def consult(
    payload: ConsultRequest,
    current_user: CurrentUser,
    service: ConsultantServiceDep,
) -> ConsultResponse:
    """Send one message to the agentic consultant and get a reply.

    The Grok->Gemini fallback happens transparently inside the service; the
    client only ever sees a successful reply or a graceful 503.
    """
    # Prefer the per-request language, else the user's stored preference.
    language = payload.language or current_user.preferences.language.value
    if language not in _ALLOWED_LANGUAGES:
        language = "en"

    return await service.consult(
        user_id=current_user.id or "",
        message=payload.message,
        conversation_id=payload.conversation_id,
        language=language,
    )
