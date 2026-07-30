from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, Query, UploadFile

from app.api.dependencies import get_current_user_id, get_syllabus_service
from app.modules.syllabus.services import SyllabusService
from app.schemas.syllabus import SyllabusDocumentRead, SyllabusDocumentUpdate

router = APIRouter()


@router.post("/upload", response_model=SyllabusDocumentRead, status_code=201)
async def upload_syllabus(
    file: Annotated[UploadFile, File(...)],
    current_user_id: Annotated[str, Depends(get_current_user_id)],
    service: Annotated[SyllabusService, Depends(get_syllabus_service)],
    subject_id: Annotated[str | None, Form()] = None,
) -> SyllabusDocumentRead:
    return await service.upload_document(current_user_id, subject_id, file)


@router.get("/documents", response_model=list[SyllabusDocumentRead])
async def list_syllabus_documents(
    current_user_id: Annotated[str, Depends(get_current_user_id)],
    service: Annotated[SyllabusService, Depends(get_syllabus_service)],
    user_id: str | None = Query(default=None),
) -> list[SyllabusDocumentRead]:
    return service.list_documents(user_id=user_id or current_user_id)


@router.get("/documents/{document_id}", response_model=SyllabusDocumentRead)
async def get_syllabus_document(
    document_id: str,
    current_user_id: Annotated[str, Depends(get_current_user_id)],
    service: Annotated[SyllabusService, Depends(get_syllabus_service)],
) -> SyllabusDocumentRead:
    return service.get_document(document_id)


@router.patch("/documents/{document_id}", response_model=SyllabusDocumentRead)
async def update_syllabus_document(
    document_id: str,
    payload: SyllabusDocumentUpdate,
    current_user_id: Annotated[str, Depends(get_current_user_id)],
    service: Annotated[SyllabusService, Depends(get_syllabus_service)],
) -> SyllabusDocumentRead:
    return service.update_document(document_id, payload)


@router.delete("/documents/{document_id}", status_code=204)
async def delete_syllabus_document(
    document_id: str,
    current_user_id: Annotated[str, Depends(get_current_user_id)],
    service: Annotated[SyllabusService, Depends(get_syllabus_service)],
) -> None:
    service.delete_document(document_id)

