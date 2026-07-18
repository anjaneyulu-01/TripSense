"""Gemini (Google) provider — generateContent REST API.

Gemini has no `system` role, so system messages are folded into a
`systemInstruction`, and the remaining turns are mapped user->"user",
assistant->"model".
"""

from __future__ import annotations

import httpx

from app.config import Settings
from app.services.ai.base import ChatMessage, ChatProvider, ProviderError

_RETRYABLE_STATUS = {408, 409, 425, 429, 500, 502, 503, 504}


class GeminiProvider(ChatProvider):
    name = "gemini"

    def __init__(self, settings: Settings, client: httpx.AsyncClient) -> None:
        self._settings = settings
        self._client = client

    @property
    def enabled(self) -> bool:
        return bool(self._settings.gemini_api_key)

    async def complete(
        self,
        messages: list[ChatMessage],
        *,
        temperature: float = 0.7,
        max_tokens: int = 1024,
    ) -> str:
        if not self.enabled:
            raise ProviderError(
                self.name, "GEMINI_API_KEY not configured", retryable=False
            )

        base = self._settings.gemini_api_base.rstrip("/")
        model = self._settings.gemini_model
        url = f"{base}/models/{model}:generateContent"

        system_parts = [m.content for m in messages if m.role == "system"]
        contents = [
            {
                "role": "model" if m.role == "assistant" else "user",
                "parts": [{"text": m.content}],
            }
            for m in messages
            if m.role != "system"
        ]

        payload: dict = {
            "contents": contents,
            "generationConfig": {
                "temperature": temperature,
                "maxOutputTokens": max_tokens,
            },
        }
        if system_parts:
            payload["systemInstruction"] = {
                "parts": [{"text": "\n\n".join(system_parts)}]
            }

        try:
            resp = await self._client.post(
                url,
                json=payload,
                params={"key": self._settings.gemini_api_key},
            )
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
            candidate = data["candidates"][0]
            parts = candidate["content"]["parts"]
            return "".join(p.get("text", "") for p in parts).strip()
        except (KeyError, IndexError, ValueError) as exc:
            raise ProviderError(
                self.name, f"malformed response: {exc}", retryable=True
            ) from exc
