from app.schemas.common import ORMModel


class SyllabusDocumentRead(ORMModel):
    id: str
    user_id: str
    subject_id: str | None
    file_name: str
    content_type: str
    raw_text: str
    extracted_structure: dict


class SyllabusDocumentUpdate(ORMModel):
    subject_id: str | None = None
    file_name: str | None = None
