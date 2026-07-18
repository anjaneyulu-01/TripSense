"""The core promise: Grok -> Gemini failover is seamless to the caller."""

from __future__ import annotations

import pytest

from app.config import get_settings
from app.services.ai.base import ChatMessage, ChatProvider, ProviderError
from app.services.ai.service import AIService
from app.utils.exceptions import ServiceUnavailableError


class FakeProvider(ChatProvider):
    def __init__(self, name: str, *, reply: str | None = None, error: ProviderError | None = None):
        self.name = name
        self._reply = reply
        self._error = error
        self.calls = 0

    @property
    def enabled(self) -> bool:
        return True

    async def complete(self, messages, *, temperature=0.7, max_tokens=1024) -> str:
        self.calls += 1
        if self._error is not None:
            raise self._error
        assert self._reply is not None
        return self._reply


def _service_with(providers: list[ChatProvider]) -> AIService:
    svc = AIService(get_settings())
    svc._providers = providers  # inject fakes
    return svc


@pytest.mark.asyncio
async def test_primary_success_never_hits_fallback():
    grok = FakeProvider("grok", reply="from grok")
    gemini = FakeProvider("gemini", reply="from gemini")
    svc = _service_with([grok, gemini])

    result = await svc.chat([ChatMessage(role="user", content="hi")])

    assert result.provider == "grok"
    assert result.text == "from grok"
    assert gemini.calls == 0  # fallback untouched


@pytest.mark.asyncio
async def test_falls_over_to_gemini_when_grok_fails():
    grok = FakeProvider("grok", error=ProviderError("grok", "429", retryable=True))
    gemini = FakeProvider("gemini", reply="from gemini")
    svc = _service_with([grok, gemini])

    result = await svc.chat([ChatMessage(role="user", content="hi")])

    assert result.provider == "gemini"
    assert result.text == "from gemini"
    assert grok.calls == 1 and gemini.calls == 1


@pytest.mark.asyncio
async def test_all_providers_fail_raises_graceful_error():
    grok = FakeProvider("grok", error=ProviderError("grok", "500", retryable=True))
    gemini = FakeProvider("gemini", error=ProviderError("gemini", "500", retryable=True))
    svc = _service_with([grok, gemini])

    with pytest.raises(ServiceUnavailableError) as exc:
        await svc.chat([ChatMessage(role="user", content="hi")])

    # User-facing message must not leak provider internals.
    assert "grok" not in exc.value.message.lower()
    assert "gemini" not in exc.value.message.lower()
