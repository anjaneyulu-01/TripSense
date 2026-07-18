"""Async MongoDB connection management (Motor).

The connection is opened once during the FastAPI lifespan and shared across
requests. If no `MONGODB_URI` is configured the app still boots in a
"degraded" mode (DB features raise a clear error) so the AI layer can be
developed and tested independently.
"""

from __future__ import annotations

import asyncio
import logging

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from app.config import get_settings

logger = logging.getLogger("tripsense.db")


class Database:
    """Holds the singleton Motor client/database handles."""

    client: AsyncIOMotorClient | None = None
    db: AsyncIOMotorDatabase | None = None


db_state = Database()
_connect_lock = asyncio.Lock()


async def connect_to_mongo() -> None:
    """Open the MongoDB connection and verify it with a ping.

    Non-fatal by design: if Atlas is briefly unreachable (e.g. a primary
    election, or a paused free-tier cluster resuming), we log and start in
    DEGRADED mode. `ensure_connected()` then reconnects on the next request
    once the cluster recovers — a transient DB blip never crashes the app.
    """
    settings = get_settings()

    if not settings.db_enabled:
        logger.warning(
            "MONGODB_URI is empty — starting WITHOUT a database. "
            "Auth and persistence endpoints will return 503 until it is set."
        )
        return

    logger.info("Connecting to MongoDB…")
    try:
        client = AsyncIOMotorClient(
            settings.mongodb_uri,
            serverSelectionTimeoutMS=8000,
            uuidRepresentation="standard",
        )
        await client.admin.command("ping")
        db = client[settings.mongodb_db_name]
        await _ensure_indexes(db)
        db_state.client = client
        db_state.db = db
        logger.info("MongoDB connected (db=%s).", settings.mongodb_db_name)
    except Exception as exc:  # noqa: BLE001 — degrade gracefully on any driver error
        db_state.client = None
        db_state.db = None
        logger.error(
            "MongoDB unavailable at startup (%s). Starting in DEGRADED mode; "
            "will reconnect automatically on the next request.",
            exc,
        )


async def ensure_connected() -> bool:
    """Lazily (re)connect if the DB handle is missing. Returns True if usable."""
    if db_state.db is not None:
        return True
    settings = get_settings()
    if not settings.db_enabled:
        return False
    async with _connect_lock:
        if db_state.db is not None:  # another request already reconnected
            return True
        await connect_to_mongo()
    return db_state.db is not None


async def close_mongo_connection() -> None:
    """Close the MongoDB connection on shutdown."""
    if db_state.client is not None:
        db_state.client.close()
        db_state.client = None
        db_state.db = None
        logger.info("MongoDB connection closed.")


async def _ensure_indexes(database: AsyncIOMotorDatabase) -> None:
    """Create the indexes the app relies on (idempotent, best-effort).

    Index builds need a primary; if one isn't available right now we log and
    move on rather than failing the whole connection — reads/writes will work
    once the primary returns, and indexes get ensured on the next reconnect.
    """
    try:
        await database["users"].create_index("email", unique=True)
        await database["conversations"].create_index("user_id")
        await database["conversations"].create_index([("user_id", 1), ("updated_at", -1)])
        await database["trips"].create_index("user_id")
        logger.info("MongoDB indexes ensured.")
    except Exception as exc:  # noqa: BLE001
        logger.warning("Skipping index creation for now: %s", exc)


def get_database() -> AsyncIOMotorDatabase:
    """FastAPI dependency: return the live database handle.

    Raises RuntimeError if the DB was never connected — routes translate this
    into a 503 via the error handler.
    """
    if db_state.db is None:
        raise RuntimeError("Database is not configured. Set MONGODB_URI in .env.")
    return db_state.db
