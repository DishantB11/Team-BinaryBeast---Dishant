from fastapi import APIRouter

from app.api.v1.endpoints import dashboard, planner

api_router = APIRouter()
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard"])
api_router.include_router(planner.router, prefix="/planner", tags=["Planner"])
