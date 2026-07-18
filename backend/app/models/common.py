"""Shared model primitives (ObjectId handling, timestamps)."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Annotated, Any

from bson import ObjectId
from pydantic import BaseModel, BeforeValidator, ConfigDict, Field


def _validate_object_id(value: Any) -> str:
    """Coerce ObjectId/str into a canonical string id."""
    if isinstance(value, ObjectId):
        return str(value)
    if isinstance(value, str) and ObjectId.is_valid(value):
        return value
    if isinstance(value, str):
        # Allow non-ObjectId string ids (useful in tests / seed data).
        return value
    raise ValueError(f"Invalid ObjectId: {value!r}")


# A string field that transparently accepts Mongo ObjectId inputs.
PyObjectId = Annotated[str, BeforeValidator(_validate_object_id)]


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class MongoModel(BaseModel):
    """Base for documents read from Mongo.

    Maps Mongo's `_id` onto a string `id` field and permits population by
    either the field name or its alias.
    """

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str},
    )

    id: PyObjectId | None = Field(default=None, alias="_id")


class TimestampMixin(BaseModel):
    created_at: datetime = Field(default_factory=utcnow)
    updated_at: datetime = Field(default_factory=utcnow)
