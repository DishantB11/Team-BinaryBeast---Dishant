from fastapi import APIRouter

from app.api.v1.endpoints import academic, auth, dashboard, notifications, planner, syllabus

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["Auth"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard"])
api_router.include_router(planner.router, prefix="/planner", tags=["Planner"])
api_router.include_router(academic.router, prefix="/academic", tags=["Academic"])
api_router.include_router(syllabus.router, prefix="/syllabus", tags=["Syllabus"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["Notifications"])
