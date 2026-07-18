"""Application configuration.

All secrets and environment-specific values are read from `.env` via
pydantic-settings. Nothing is hardcoded. Access the singleton through
`get_settings()` so the object is parsed once and cached.
"""

from __future__ import annotations

from functools import lru_cache

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Typed, validated view of the process environment."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # --- App ---
    app_env: str = "development"
    app_host: str = "0.0.0.0"
    app_port: int = 8000
    api_v1_prefix: str = "/api/v1"
    cors_origins: str = "http://localhost:5173"

    # --- Database ---
    mongodb_uri: str = ""
    mongodb_db_name: str = "tripsense"

    # --- Auth / JWT ---
    jwt_secret: str = "dev_only_change_me"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7

    # --- AI providers ---
    # Grok (xAI) — OpenAI-compatible. Optional; add a key to enable.
    grok_api_key: str = ""
    grok_api_base: str = "https://api.x.ai/v1"
    grok_model: str = "grok-3"

    # Groq (groq.com, fast LPU inference) — OpenAI-compatible.
    groq_api_key: str = ""
    groq_api_base: str = "https://api.groq.com/openai/v1"
    groq_model: str = "llama-3.3-70b-versatile"

    # Gemini (Google).
    gemini_api_key: str = ""
    gemini_api_base: str = "https://generativelanguage.googleapis.com/v1beta"
    gemini_model: str = "gemini-2.5-flash"

    ai_request_timeout: float = 30.0

    # --- Derived helpers ---
    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def is_production(self) -> bool:
        return self.app_env.lower() in {"production", "prod"}

    @property
    def grok_enabled(self) -> bool:
        return bool(self.grok_api_key)

    @property
    def groq_enabled(self) -> bool:
        return bool(self.groq_api_key)

    @property
    def gemini_enabled(self) -> bool:
        return bool(self.gemini_api_key)

    @property
    def db_enabled(self) -> bool:
        return bool(self.mongodb_uri)

    @field_validator("jwt_secret")
    @classmethod
    def _warn_default_secret(cls, value: str) -> str:
        # Kept permissive so the app boots for local dev even without a real
        # secret; production hardening is enforced at startup (see main.py).
        return value


@lru_cache
def get_settings() -> Settings:
    """Return the process-wide settings singleton."""
    return Settings()
