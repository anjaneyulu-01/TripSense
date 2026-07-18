from fastapi import APIRouter

from app.api.routes.auth import router as auth_router
from app.api.routes.consult import router as consult_router
from app.api.routes.health import router as health_router

# Aggregate router mounted under the API version prefix in main.py.
api_router = APIRouter()
api_router.include_router(health_router)
api_router.include_router(auth_router)
api_router.include_router(consult_router)

__all__ = ["api_router"]
