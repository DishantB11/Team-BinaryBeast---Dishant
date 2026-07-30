from collections.abc import Generator

from app.modules.dashboard.services import DashboardService
from app.modules.planning.services import PlanningService
from app.db.session import get_db_session


def get_session() -> Generator:
    """Expose the database session dependency from a single import path."""
    yield from get_db_session()


def get_dashboard_service() -> DashboardService:
    """Return the dashboard service dependency."""
    return DashboardService()


def get_planning_service() -> PlanningService:
    """Return the planning service dependency."""
    return PlanningService()
