from pydantic import BaseModel


class HealthResponse(BaseModel):
    """Health payload for service monitoring and quick diagnostics."""

    status: str
    app_name: str
    environment: str
    version: str
