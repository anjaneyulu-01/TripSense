"""Provider-agnostic chat interfaces for the AI layer."""

from __future__ import annotations

import abc
from dataclasses import dataclass


@dataclass(frozen=True)
class ChatMessage:
    role: str  # "system" | "user" | "assistant"
    content: str


class ProviderError(Exception):
    """Raised when a provider fails in a way that should trigger fallback.

    `retryable` distinguishes transient failures (timeouts, 429, 5xx) — which
    justify failing over to the next provider — from hard config errors.
    """

    def __init__(self, provider: str, message: str, *, retryable: bool = True) -> None:
        super().__init__(f"[{provider}] {message}")
        self.provider = provider
        self.retryable = retryable


class ChatProvider(abc.ABC):
    """A single upstream chat model (Grok, Gemini, …)."""

    name: str

    @property
    @abc.abstractmethod
    def enabled(self) -> bool:
        """Whether this provider is configured (has an API key)."""

    @abc.abstractmethod
    async def complete(
        self,
        messages: list[ChatMessage],
        *,
        temperature: float = 0.7,
        max_tokens: int = 1024,
    ) -> str:
        """Return the assistant's text reply, or raise ProviderError."""
