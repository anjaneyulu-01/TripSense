"""User domain model (as stored in MongoDB)."""

from __future__ import annotations

from enum import Enum

from pydantic import EmailStr, Field

from app.models.common import MongoModel, TimestampMixin


class Language(str, Enum):
    english = "en"
    hindi = "hi"
    telugu = "te"


class Theme(str, Enum):
    light = "light"
    dark = "dark"
    system = "system"


class UserPreferences(TimestampMixin):
    language: Language = Language.english
    theme: Theme = Theme.system
    voice_enabled: bool = True
    notifications_enabled: bool = True


class UserInDB(MongoModel, TimestampMixin):
    """A user document. `hashed_password` never leaves the backend."""

    email: EmailStr
    full_name: str
    hashed_password: str
    is_active: bool = True
    preferences: UserPreferences = Field(default_factory=UserPreferences)
