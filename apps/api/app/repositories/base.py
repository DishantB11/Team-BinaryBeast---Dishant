from sqlalchemy.orm import Session


class SQLAlchemyRepository:
    """Base repository carrying a SQLAlchemy session."""

    def __init__(self, session: Session) -> None:
        self.session = session
