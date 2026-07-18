"""AI Travel Consultant request/response DTOs."""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field

from app.models.conversation import CollectedInfo


class ConsultRequest(BaseModel):
    message: str = Field(min_length=1, max_length=4000)
    # Continue an existing consultation, or omit to start a new one.
    conversation_id: str | None = None
    # Overrides the user's stored preference for this turn if provided.
    language: str | None = Field(default=None, description="en | hi | te")


class ConsultResponse(BaseModel):
    conversation_id: str
    reply: str
    provider: str = Field(description="Which model answered: grok | gemini")
    language: str
    collected_info: CollectedInfo
    missing_fields: list[str]
    ready_to_plan: bool


class ConversationSummary(BaseModel):
    id: str
    title: str
    language: str
    updated_at: datetime
    message_count: int
