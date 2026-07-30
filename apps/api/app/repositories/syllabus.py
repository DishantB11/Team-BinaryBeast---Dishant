from collections.abc import Sequence

from sqlalchemy import select

from app.db.models import SyllabusDocument
from app.repositories.base import SQLAlchemyRepository


class SyllabusRepository(SQLAlchemyRepository):
    def get(self, document_id: str) -> SyllabusDocument | None:
        return self.session.get(SyllabusDocument, document_id)

    def create(self, document: SyllabusDocument) -> SyllabusDocument:
        self.session.add(document)
        self.session.commit()
        self.session.refresh(document)
        return document

    def update(self, document: SyllabusDocument, updates: dict) -> SyllabusDocument:
        for key, value in updates.items():
            setattr(document, key, value)
        self.session.commit()
        self.session.refresh(document)
        return document

    def delete(self, document: SyllabusDocument) -> None:
        self.session.delete(document)
        self.session.commit()

    def list(self, user_id: str | None = None) -> Sequence[SyllabusDocument]:
        stmt = select(SyllabusDocument).order_by(SyllabusDocument.created_at.desc())
        if user_id:
            stmt = stmt.where(SyllabusDocument.user_id == user_id)
        return self.session.scalars(stmt).all()
