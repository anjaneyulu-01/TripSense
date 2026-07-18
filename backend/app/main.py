"""TripSense FastAPI application entrypoint.

Wires the lifespan (DB + AI service), middleware, CORS, exception handlers,
and the versioned API router.
"""

from __future__ import annotations

import logging
import os
import time
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles

from app import __version__
from app.api.routes import api_router
from app.config import get_settings
from app.database import close_mongo_connection, connect_to_mongo
from app.services.ai.service import init_ai_service, shutdown_ai_service
from app.utils.exceptions import AppError
from app.utils.logger import configure_logging

logger = logging.getLogger("tripsense")


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    configure_logging()

    if settings.is_production and settings.jwt_secret in {
        "dev_only_change_me",
        "dev_only_change_me_please_use_a_long_random_string",
    }:
        raise RuntimeError("JWT_SECRET must be set to a real secret in production.")

    init_ai_service()
    await connect_to_mongo()
    logger.info("TripSense API v%s started (env=%s).", __version__, settings.app_env)
    try:
        yield
    finally:
        await close_mongo_connection()
        await shutdown_ai_service()
        logger.info("TripSense API stopped.")


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title="TripSense API",
        version=__version__,
        description="AI-powered travel planning platform backend.",
        lifespan=lifespan,
        docs_url="/docs",
        redoc_url="/redoc",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.middleware("http")
    async def add_process_time_header(request: Request, call_next):
        start = time.perf_counter()
        response = await call_next(request)
        response.headers["X-Process-Time-ms"] = f"{(time.perf_counter() - start) * 1000:.1f}"
        return response

    # --- Exception handlers: consistent JSON error envelope ---
    @app.exception_handler(AppError)
    async def handle_app_error(request: Request, exc: AppError) -> JSONResponse:
        return JSONResponse(
            status_code=exc.status_code,
            content={"error": {"code": exc.code, "message": exc.message}},
        )

    @app.exception_handler(RequestValidationError)
    async def handle_validation(request: Request, exc: RequestValidationError) -> JSONResponse:
        return JSONResponse(
            status_code=422,
            content={"error": {"code": "validation_error", "message": "Invalid request.", "details": exc.errors()}},
        )

    @app.exception_handler(Exception)
    async def handle_unexpected(request: Request, exc: Exception) -> JSONResponse:
        logger.exception("Unhandled error on %s %s", request.method, request.url.path)
        return JSONResponse(
            status_code=500,
            content={"error": {"code": "internal_error", "message": "Something went wrong."}},
        )

    app.include_router(api_router, prefix=settings.api_v1_prefix)

    # --- Serve React frontend in production if dist exists ---
    backend_app_dir = Path(__file__).resolve().parent
    root_dir = backend_app_dir.parent.parent
    frontend_dist_dir = root_dir / "frontend" / "dist"

    if os.path.exists(frontend_dist_dir):
        logger.info("Serving frontend static files from: %s", frontend_dist_dir)
        if os.path.exists(frontend_dist_dir / "assets"):
            app.mount("/assets", StaticFiles(directory=str(frontend_dist_dir / "assets")), name="assets")

        @app.get("/{catchall:path}", tags=["frontend"])
        async def serve_frontend(catchall: str):
            # Exclude backend API routes
            if catchall.startswith("api/") or catchall.startswith("api"):
                return JSONResponse(status_code=404, content={"detail": "Not Found"})

            file_path = frontend_dist_dir / catchall
            if file_path.is_file():
                return FileResponse(str(file_path))

            index_path = frontend_dist_dir / "index.html"
            if index_path.is_file():
                return FileResponse(str(index_path))

            return JSONResponse(status_code=404, content={"detail": "Not Found"})
    else:
        logger.warning("Frontend dist directory not found at: %s. Frontend will not be served.", frontend_dist_dir)
        @app.get("/", tags=["system"])
        async def root() -> dict:
            return {"name": "TripSense API", "version": __version__, "docs": "/docs"}

    return app


app = create_app()
