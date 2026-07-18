"""Shared base for OpenAI-compatible chat providers (Grok, Groq, …).

xAI's Grok and Groq both expose the OpenAI `/chat/completions` contract, so the
request/response handling is identical — only the base URL, API key, and model
differ. Subclasses supply those three via properties.
"""

from __future__ import annotations

import abc

import httpx

from app.config import Settings
from app.services.ai.base import ChatMessage, ChatProvider, ProviderError

# HTTP statuses worth failing over on (transient / capacity related).
_RETRYABLE_STATUS = {408, 409, 425, 429, 500, 502, 503, 504}


class OpenAICompatibleProvider(ChatProvider):
    def __init__(self, settings: Settings, client: httpx.AsyncClient) -> None:
        self._settings = settings
        self._client = client

    # --- Subclass configuration ---
    @property
    @abc.abstractmethod
    def _api_key(self) -> str: ...

    @property
    @abc.abstractmethod
    def _base_url(self) -> str: ...

    @property
    @abc.abstractmethod
    def _model(self) -> str: ...

    @property
    def enabled(self) -> bool:
        return bool(self._api_key)

    async def complete(
        self,
        messages: list[ChatMessage],
        *,
        temperature: float = 0.7,
        max_tokens: int = 1024,
    ) -> str:
        if not self.enabled:
            raise ProviderError(self.name, "API key not configured", retryable=True)

        url = f"{self._base_url.rstrip('/')}/chat/completions"
        payload = {
            "model": self._model,
            "messages": [{"role": m.role, "content": m.content} for m in messages],
            "temperature": temperature,
            "max_tokens": max_tokens,
            "stream": False,
        }
        headers = {"Authorization": f"Bearer {self._api_key}"}

        try:
            resp = await self._client.post(url, json=payload, headers=headers)
        except httpx.TimeoutException as exc:
            raise ProviderError(self.name, f"timeout: {exc}", retryable=True) from exc
        except httpx.HTTPError as exc:
            raise ProviderError(self.name, f"network error: {exc}", retryable=True) from exc

        if resp.status_code >= 400:
            retryable = resp.status_code in _RETRYABLE_STATUS
            raise ProviderError(
                self.name,
                f"HTTP {resp.status_code}: {resp.text[:200]}",
                retryable=retryable,
            )

        try:
            data = resp.json()
            return data["choices"][0]["message"]["content"].strip()
        except (KeyError, IndexError, ValueError) as exc:
            raise ProviderError(
                self.name, f"malformed response: {exc}", retryable=True
            ) from exc
