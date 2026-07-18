"""Assemble the message list sent to the AI provider.

Combines the consultant system prompt, the structured facts already collected
(so the agent doesn't re-ask), and the running conversation history.
"""

from __future__ import annotations

from app.models.conversation import CollectedInfo, Message, MessageRole
from app.prompts.system_prompts import (
    CONSULTANT_SYSTEM,
    KNOWN_INFO_TEMPLATE,
    LANGUAGE_NAMES,
)
from app.services.ai.base import ChatMessage

# Keep prompt size bounded — only the most recent turns are replayed verbatim.
_MAX_HISTORY_MESSAGES = 20

_FIELD_LABELS = {
    "budget": "Budget",
    "currency": "Currency",
    "duration_days": "Trip duration (days)",
    "starting_city": "Starting city",
    "destination": "Destination",
    "travel_type": "Travel type",
    "group_size": "Group size",
    "interests": "Interests",
    "food_preferences": "Food preferences",
    "transport_preferences": "Transport preferences",
    "luxury_level": "Luxury level",
    "has_children": "Traveling with children",
    "has_seniors": "Traveling with seniors",
    "medical_needs": "Medical needs",
    "adventure_level": "Adventure level",
    "accessibility_requirements": "Accessibility requirements",
}


def _known_block(info: CollectedInfo) -> str:
    lines: list[str] = []
    for field, label in _FIELD_LABELS.items():
        value = getattr(info, field)
        if value in (None, [], ""):
            continue
        if isinstance(value, list):
            value = ", ".join(str(v) for v in value)
        lines.append(f"- {label}: {value}")
    return "\n".join(lines) if lines else "- (nothing collected yet)"


def _missing_block(info: CollectedInfo) -> str:
    missing = info.missing_fields()
    if not missing:
        return "- (all essentials collected — you can start recommending a plan)"
    return "\n".join(f"- {_FIELD_LABELS.get(m, m)}" for m in missing)


def build_consultant_messages(
    history: list[Message],
    collected_info: CollectedInfo,
    language: str,
) -> list[ChatMessage]:
    language_name = LANGUAGE_NAMES.get(language, "English")

    system = CONSULTANT_SYSTEM.format(language_name=language_name)
    system += "\n\n" + KNOWN_INFO_TEMPLATE.format(
        known_block=_known_block(collected_info),
        missing_block=_missing_block(collected_info),
    )

    messages: list[ChatMessage] = [ChatMessage(role="system", content=system)]

    recent = history[-_MAX_HISTORY_MESSAGES:]
    for msg in recent:
        if msg.role == MessageRole.system:
            continue
        messages.append(ChatMessage(role=msg.role.value, content=msg.content))

    return messages


def summarize_title(first_user_message: str) -> str:
    """Derive a short conversation title from the opening message."""
    text = first_user_message.strip().replace("\n", " ")
    return (text[:57] + "…") if len(text) > 58 else text or "New consultation"
