"""Data-access layer for users. Isolates Mongo details from services."""

from __future__ import annotations

from bson import ObjectId
from bson.errors import InvalidId
from motor.motor_asyncio import AsyncIOMotorDatabase
from pymongo.errors import DuplicateKeyError

from app.models.user import UserInDB
from app.utils.exceptions import ConflictError


class UserRepository:
    COLLECTION = "users"

    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        self._col = db[self.COLLECTION]

    async def create(self, user: UserInDB) -> UserInDB:
        doc = user.model_dump(by_alias=True, exclude={"id"})
        try:
            result = await self._col.insert_one(doc)
        except DuplicateKeyError as exc:
            raise ConflictError("An account with this email already exists.") from exc
        user.id = str(result.inserted_id)
        return user

    async def get_by_email(self, email: str) -> UserInDB | None:
        doc = await self._col.find_one({"email": email.lower()})
        return UserInDB(**doc) if doc else None

    async def get_by_id(self, user_id: str) -> UserInDB | None:
        try:
            oid = ObjectId(user_id)
        except (InvalidId, TypeError):
            return None
        doc = await self._col.find_one({"_id": oid})
        return UserInDB(**doc) if doc else None
