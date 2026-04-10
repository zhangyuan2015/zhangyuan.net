from fastapi import APIRouter

from app.api.v1 import admin, health, oss, public

api_router = APIRouter()
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])
api_router.include_router(health.router, prefix="/health", tags=["health"])
api_router.include_router(oss.router, prefix="/oss", tags=["oss"])
api_router.include_router(public.router, prefix="/public", tags=["public"])
