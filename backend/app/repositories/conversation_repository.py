"""Data-access layer for AI consultant conversations."""

from __future__ import annotations

from bson import ObjectId
from bson.errors import InvalidId
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.models.common import utcnow
from app.models.conversation import ConversationInDB, Message


class ConversationRepository:
    COLLECTION = "conversations"

    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        self._col = db[self.COLLECTION]

    async def create(self, conversation: ConversationInDB) -> ConversationInDB:
        doc = conversation.model_dump(by_alias=True, exclude={"id"})
        result = await self._col.insert_one(doc)
        conversation.id = str(result.inserted_id)
        return conversation

    async def get(self, conversation_id: str, user_id: str) -> ConversationInDB | None:
        try:
            oid = ObjectId(conversation_id)
        except (InvalidId, TypeError):
            return None
        doc = await self._col.find_one({"_id": oid, "user_id": user_id})
        return ConversationInDB(**doc) if doc else None

    async def append_messages(
        self,
        conversation_id: str,
        messages: list[Message],
        collected_info: dict,
        title: str | None = None,
    ) -> None:
        update: dict = {
            "$push": {
                "messages": {
                    "$each": [m.model_dump() for m in messages]
                }
            },
            "$set": {
                "collected_info": collected_info,
                "updated_at": utcnow(),
            },
        }
        if title is not None:
            update["$set"]["title"] = title
        await self._col.update_one({"_id": ObjectId(conversation_id)}, update)

    async def list_for_user(
        self, user_id: str, limit: int = 20, skip: int = 0
    ) -> list[ConversationInDB]:
        cursor = (
            self._col.find({"user_id": user_id})
            .sort("updated_at", -1)
            .skip(skip)
            .limit(limit)
        )
        return [ConversationInDB(**doc) async for doc in cursor]
