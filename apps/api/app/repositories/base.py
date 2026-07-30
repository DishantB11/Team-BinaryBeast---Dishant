from sqlalchemy.orm import Session


class SQLAlchemyRepository:
    """Base repository wrapper."""

    def __init__(self, session: Session) -> None:
        self.session = session
