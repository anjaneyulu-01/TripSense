"""Orchestrates one turn of the AI Travel Consultant.

Flow (mirrors the product's AI workflow):
    user message
      -> load / create conversation (memory)
      -> extract structured facts, merge into collected_info
      -> build prompt (system + known facts + history)
      -> AIService.chat (Grok -> Gemini fallback)
      -> persist user + assistant messages
      -> return reply + provider + collected state
"""

from __future__ import annotations

from app.models.conversation import (
    CollectedInfo,
    ConversationInDB,
    Message,
    MessageRole,
)
from app.prompts import build_consultant_messages, summarize_title
from app.repositories import ConversationRepository
from app.schemas.consult import ConsultResponse
from app.services.ai import AIService
from app.services.extraction import extract_from_message, merge_extracted


class ConsultantService:
    def __init__(self, repo: ConversationRepository, ai: AIService) -> None:
        self._repo = repo
        self._ai = ai

    async def consult(
        self,
        *,
        user_id: str,
        message: str,
        conversation_id: str | None,
        language: str,
    ) -> ConsultResponse:
        conversation = await self._load_or_create(user_id, conversation_id, language)

        # 1) Update agent memory with any new facts from this message.
        extracted = extract_from_message(message)
        conversation.collected_info = merge_extracted(
            conversation.collected_info, extracted
        )

        # 2) Build the prompt from history + known facts, then call the model.
        user_msg = Message(role=MessageRole.user, content=message)
        history_with_new = [*conversation.messages, user_msg]
        prompt = build_consultant_messages(
            history_with_new, conversation.collected_info, language
        )
        result = await self._ai.chat(prompt, temperature=0.7, max_tokens=1200)

        assistant_msg = Message(
            role=MessageRole.assistant,
            content=result.text,
            provider=result.provider,
        )

        # 3) Persist both new messages + updated memory.
        is_new = not conversation.messages
        title = summarize_title(message) if is_new else None
        await self._persist(conversation, [user_msg, assistant_msg], title)

        missing = conversation.collected_info.missing_fields()
        return ConsultResponse(
            conversation_id=conversation.id or "",
            reply=result.text,
            provider=result.provider,
            language=language,
            collected_info=conversation.collected_info,
            missing_fields=missing,
            ready_to_plan=not missing,
        )

    async def _load_or_create(
        self, user_id: str, conversation_id: str | None, language: str
    ) -> ConversationInDB:
        if conversation_id:
            existing = await self._repo.get(conversation_id, user_id)
            if existing:
                existing.language = language
                return existing
        # Start fresh (also covers a stale/foreign conversation_id).
        conversation = ConversationInDB(
            user_id=user_id,
            language=language,
            collected_info=CollectedInfo(),
        )
        return await self._repo.create(conversation)

    async def _persist(
        self,
        conversation: ConversationInDB,
        new_messages: list[Message],
        title: str | None,
    ) -> None:
        assert conversation.id is not None
        await self._repo.append_messages(
            conversation.id,
            new_messages,
            conversation.collected_info.model_dump(),
            title=title,
        )
        conversation.messages.extend(new_messages)
