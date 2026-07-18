"""Conversation + message models for the AI Travel Consultant.

The consultant is *agentic*: it maintains memory of prior messages and the
structured facts it has already collected, so it only asks for what is still
missing.
"""

from __future__ import annotations

from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field

from app.models.common import MongoModel, PyObjectId, TimestampMixin, utcnow


class MessageRole(str, Enum):
    user = "user"
    assistant = "assistant"
    system = "system"


class Message(BaseModel):
    role: MessageRole
    content: str
    created_at: datetime = Field(default_factory=utcnow)
    # Which provider produced an assistant message (grok/gemini) — useful for
    # analytics and for surfacing model status without leaking failures.
    provider: str | None = None


class CollectedInfo(BaseModel):
    """Structured trip facts the agent accumulates across turns.

    Every field is optional; the agent asks only for the ones still unset.
    """

    budget: float | None = None
    currency: str | None = None
    duration_days: int | None = None
    starting_city: str | None = None
    destination: str | None = None
    travel_type: str | None = None          # solo / couple / family / friends
    group_size: int | None = None
    interests: list[str] = Field(default_factory=list)
    food_preferences: str | None = None
    transport_preferences: str | None = None
    luxury_level: str | None = None          # budget / comfort / luxury
    has_children: bool | None = None
    has_seniors: bool | None = None
    medical_needs: str | None = None
    adventure_level: str | None = None
    accessibility_requirements: str | None = None

    def missing_fields(self) -> list[str]:
        """Return the names of the *essential* fields still unknown."""
        essentials = {
            "budget": self.budget,
            "duration_days": self.duration_days,
            "starting_city": self.starting_city,
            "travel_type": self.travel_type,
            "interests": self.interests or None,
        }
        return [name for name, value in essentials.items() if not value]


class ConversationInDB(MongoModel, TimestampMixin):
    user_id: PyObjectId
    title: str = "New consultation"
    language: str = "en"
    messages: list[Message] = Field(default_factory=list)
    collected_info: CollectedInfo = Field(default_factory=CollectedInfo)
