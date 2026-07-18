"""Grok (xAI) provider — OpenAI-compatible chat completions API."""

from __future__ import annotations

from app.services.ai.openai_compatible import OpenAICompatibleProvider


class GrokProvider(OpenAICompatibleProvider):
    name = "grok"

    @property
    def _api_key(self) -> str:
        return self._settings.grok_api_key

    @property
    def _base_url(self) -> str:
        return self._settings.grok_api_base

    @property
    def _model(self) -> str:
        return self._settings.grok_model
