"""Groq (groq.com) provider — OpenAI-compatible chat completions API.

Note: Groq (fast LPU inference) is a different service from xAI's Grok.
"""

from __future__ import annotations

from app.services.ai.openai_compatible import OpenAICompatibleProvider


class GroqProvider(OpenAICompatibleProvider):
    name = "groq"

    @property
    def _api_key(self) -> str:
        return self._settings.groq_api_key

    @property
    def _base_url(self) -> str:
        return self._settings.groq_api_base

    @property
    def _model(self) -> str:
        return self._settings.groq_model
