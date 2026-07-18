"""AI orchestration: try Grok first, fail over to Gemini seamlessly.

The caller receives an `AIResult` with the winning provider name. If *every*
configured provider fails, a ServiceUnavailableError is raised — the route
layer turns that into a graceful, user-facing message (never a raw stack
trace or a mention of which model broke).
"""

from __future__ import annotations

import logging
from dataclasses import dataclass

import httpx

from app.config import Settings, get_settings
from app.services.ai.base import ChatMessage, ChatProvider, ProviderError
from app.services.ai.gemini_provider import GeminiProvider
from app.services.ai.grok_provider import GrokProvider
from app.services.ai.groq_provider import GroqProvider
from app.utils.exceptions import ServiceUnavailableError

logger = logging.getLogger("tripsense.ai")


@dataclass(frozen=True)
class AIResult:
    text: str
    provider: str


class AIService:
    """Owns the shared HTTP client and the ordered provider chain."""

    def __init__(self, settings: Settings) -> None:
        self._settings = settings
        self._client = httpx.AsyncClient(timeout=settings.ai_request_timeout)
        # Order defines fallback priority. Only providers with a configured key
        # participate; the rest are skipped. With the default config that means
        # Grok (if a key is added) -> Groq -> Gemini.
        self._providers: list[ChatProvider] = [
            GrokProvider(settings, self._client),
            GroqProvider(settings, self._client),
            GeminiProvider(settings, self._client),
        ]

    async def aclose(self) -> None:
        await self._client.aclose()

    @property
    def available_providers(self) -> list[str]:
        return [p.name for p in self._providers if p.enabled]

    async def chat(
        self,
        messages: list[ChatMessage],
        *,
        temperature: float = 0.7,
        max_tokens: int = 1024,
    ) -> AIResult:
        enabled = [p for p in self._providers if p.enabled]
        if not enabled:
            raise ServiceUnavailableError(
                "No AI provider is configured. Set GROK_API_KEY or GEMINI_API_KEY.",
                code="ai_unconfigured",
            )

        last_error: ProviderError | None = None
        for provider in enabled:
            try:
                text = await provider.complete(
                    messages, temperature=temperature, max_tokens=max_tokens
                )
                if last_error is not None:
                    logger.info(
                        "AI fallback succeeded on '%s' after '%s' failed.",
                        provider.name,
                        last_error.provider,
                    )
                return AIResult(text=text, provider=provider.name)
            except ProviderError as exc:
                last_error = exc
                if exc.retryable:
                    logger.warning("Provider '%s' failed, failing over: %s", provider.name, exc)
                    continue
                # Non-retryable (e.g. missing key) — skip to next provider too,
                # but log at info since it's a config gap, not an outage.
                logger.info("Provider '%s' unavailable: %s", provider.name, exc)
                continue

        # Everything failed.
        logger.error("All AI providers failed. Last error: %s", last_error)
        raise ServiceUnavailableError(
            "The AI consultant is temporarily unavailable. Please try again shortly.",
            code="ai_all_failed",
        )


# --- Singleton wiring (created in lifespan, retrieved via DI) ----------------

_ai_service: AIService | None = None


def init_ai_service() -> AIService:
    global _ai_service
    if _ai_service is None:
        _ai_service = AIService(get_settings())
    return _ai_service


async def shutdown_ai_service() -> None:
    global _ai_service
    if _ai_service is not None:
        await _ai_service.aclose()
        _ai_service = None


def get_ai_service() -> AIService:
    if _ai_service is None:
        raise RuntimeError("AIService not initialised.")
    return _ai_service
