"""One-shot health check for the three external integrations.

Run:  python scripts/verify_integrations.py

Tests, independently and with clear pass/fail:
  1. MongoDB Atlas  — connect + ping + write/read/delete a temp doc
  2. Grok (xAI)     — a tiny live chat completion
  3. Gemini (Google)— a tiny live chat completion

Never prints secret values. Exit code is non-zero if any configured
integration fails, so it's CI-friendly.
"""

from __future__ import annotations

import asyncio
import sys

import httpx

# Allow running as `python scripts/verify_integrations.py` from backend/.
sys.path.insert(0, ".")

from app.config import get_settings  # noqa: E402
from app.services.ai.base import ChatMessage  # noqa: E402
from app.services.ai.gemini_provider import GeminiProvider  # noqa: E402
from app.services.ai.grok_provider import GrokProvider  # noqa: E402
from app.services.ai.groq_provider import GroqProvider  # noqa: E402

OK = "\033[92mPASS\033[0m"
FAIL = "\033[91mFAIL\033[0m"
SKIP = "\033[93mSKIP\033[0m"


async def check_mongo(settings) -> bool | None:
    if not settings.mongodb_uri:
        print(f"[{SKIP}] MongoDB — MONGODB_URI is empty")
        return None
    try:
        from motor.motor_asyncio import AsyncIOMotorClient

        client = AsyncIOMotorClient(settings.mongodb_uri, serverSelectionTimeoutMS=8000)
        await client.admin.command("ping")
        col = client[settings.mongodb_db_name]["_verify_tmp"]
        res = await col.insert_one({"ok": True})
        await col.delete_one({"_id": res.inserted_id})
        client.close()
        print(f"[{OK}] MongoDB — connected, ping OK, write/read/delete OK "
              f"(db='{settings.mongodb_db_name}')")
        return True
    except Exception as exc:  # noqa: BLE001
        print(f"[{FAIL}] MongoDB — {type(exc).__name__}: {exc}")
        return False


async def check_provider(name: str, provider) -> bool | None:
    if not provider.enabled:
        print(f"[{SKIP}] {name} — API key is empty")
        return None
    try:
        reply = await provider.complete(
            [ChatMessage(role="user", content="Reply with the single word: pong")],
            max_tokens=16,
        )
        preview = reply.replace("\n", " ")[:60]
        print(f"[{OK}] {name} — live reply received: \"{preview}\"")
        return True
    except Exception as exc:  # noqa: BLE001
        print(f"[{FAIL}] {name} — {type(exc).__name__}: {exc}")
        return False


async def main() -> int:
    settings = get_settings()
    print("=" * 60)
    print("TripSense — integration verification")
    print("=" * 60)

    results: list[bool | None] = []
    results.append(await check_mongo(settings))

    async with httpx.AsyncClient(timeout=settings.ai_request_timeout) as client:
        results.append(await check_provider("Grok (xAI)", GrokProvider(settings, client)))
        results.append(await check_provider("Groq (groq.com)", GroqProvider(settings, client)))
        results.append(await check_provider("Gemini (Google)", GeminiProvider(settings, client)))

    print("=" * 60)
    failures = sum(1 for r in results if r is False)
    configured = sum(1 for r in results if r is not None)
    passed = sum(1 for r in results if r is True)
    print(f"Summary: {passed}/{configured} configured integrations passed, "
          f"{failures} failed.")
    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
