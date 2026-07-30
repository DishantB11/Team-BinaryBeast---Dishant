from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.dependencies import get_academic_service
from app.modules.academic.services import AcademicService
from app.schemas.academic import (
    AssignmentCreate,
    AssignmentRead,
    AssignmentUpdate,
    ExamCreate,
    ExamRead,
    ExamUpdate,
    GoalCreate,
    GoalRead,
    GoalUpdate,
    ModuleCreate,
    ModuleRead,
    ModuleUpdate,
    SubjectCreate,
    SubjectRead,
    SubjectUpdate,
    UserCreate,
    UserRead,
    UserUpdate,
)

router = APIRouter()


@router.post("/users", response_model=UserRead, status_code=201)
async def create_user(
    payload: UserCreate,
    service: Annotated[AcademicService, Depends(get_academic_service)],
) -> UserRead:
    return service.create_user(payload)


@router.get("/users", response_model=list[UserRead])
async def list_users(service: Annotated[AcademicService, Depends(get_academic_service)]) -> list[UserRead]:
    return list(service.list_users())


@router.get("/users/{user_id}", response_model=UserRead)
async def get_user(
    user_id: str,
    service: Annotated[AcademicService, Depends(get_academic_service)],
) -> UserRead:
    return service.get_user(user_id)


@router.patch("/users/{user_id}", response_model=UserRead)
async def update_user(
    user_id: str,
    payload: UserUpdate,
    service: Annotated[AcademicService, Depends(get_academic_service)],
) -> UserRead:
    return service.update_user(user_id, payload)


@router.delete("/users/{user_id}", status_code=204)
async def delete_user(
    user_id: str,
    service: Annotated[AcademicService, Depends(get_academic_service)],
) -> None:
    service.delete_user(user_id)


@router.post("/subjects", response_model=SubjectRead, status_code=201)
async def create_subject(
    payload: SubjectCreate,
    service: Annotated[AcademicService, Depends(get_academic_service)],
) -> SubjectRead:
    return service.create_subject(payload)


@router.get("/subjects", response_model=list[SubjectRead])
async def list_subjects(
    service: Annotated[AcademicService, Depends(get_academic_service)],
    user_id: str | None = Query(default=None),
) -> list[SubjectRead]:
    return list(service.list_subjects(user_id=user_id))


@router.get("/subjects/{subject_id}", response_model=SubjectRead)
async def get_subject(
    subject_id: str,
    service: Annotated[AcademicService, Depends(get_academic_service)],
) -> SubjectRead:
    return service.get_subject(subject_id)


@router.patch("/subjects/{subject_id}", response_model=SubjectRead)
async def update_subject(
    subject_id: str,
    payload: SubjectUpdate,
    service: Annotated[AcademicService, Depends(get_academic_service)],
) -> SubjectRead:
    return service.update_subject(subject_id, payload)


@router.delete("/subjects/{subject_id}", status_code=204)
async def delete_subject(
    subject_id: str,
    service: Annotated[AcademicService, Depends(get_academic_service)],
) -> None:
    service.delete_subject(subject_id)


@router.post("/modules", response_model=ModuleRead, status_code=201)
async def create_module(
    payload: ModuleCreate,
    service: Annotated[AcademicService, Depends(get_academic_service)],
) -> ModuleRead:
    return service.create_module(payload)


@router.get("/modules", response_model=list[ModuleRead])
async def list_modules(
    service: Annotated[AcademicService, Depends(get_academic_service)],
    subject_id: str | None = Query(default=None),
) -> list[ModuleRead]:
    return list(service.list_modules(subject_id=subject_id))


@router.get("/modules/{module_id}", response_model=ModuleRead)
async def get_module(
    module_id: str,
    service: Annotated[AcademicService, Depends(get_academic_service)],
) -> ModuleRead:
    return service.get_module(module_id)


@router.patch("/modules/{module_id}", response_model=ModuleRead)
async def update_module(
    module_id: str,
    payload: ModuleUpdate,
    service: Annotated[AcademicService, Depends(get_academic_service)],
) -> ModuleRead:
    return service.update_module(module_id, payload)


@router.delete("/modules/{module_id}", status_code=204)
async def delete_module(
    module_id: str,
    service: Annotated[AcademicService, Depends(get_academic_service)],
) -> None:
    service.delete_module(module_id)


@router.post("/assignments", response_model=AssignmentRead, status_code=201)
async def create_assignment(
    payload: AssignmentCreate,
    service: Annotated[AcademicService, Depends(get_academic_service)],
) -> AssignmentRead:
    return service.create_assignment(payload)


@router.get("/assignments", response_model=list[AssignmentRead])
async def list_assignments(
    service: Annotated[AcademicService, Depends(get_academic_service)],
    user_id: str | None = Query(default=None),
) -> list[AssignmentRead]:
    return list(service.list_assignments(user_id=user_id))


@router.get("/assignments/{assignment_id}", response_model=AssignmentRead)
async def get_assignment(
    assignment_id: str,
    service: Annotated[AcademicService, Depends(get_academic_service)],
) -> AssignmentRead:
    return service.get_assignment(assignment_id)


@router.patch("/assignments/{assignment_id}", response_model=AssignmentRead)
async def update_assignment(
    assignment_id: str,
    payload: AssignmentUpdate,
    service: Annotated[AcademicService, Depends(get_academic_service)],
) -> AssignmentRead:
    return service.update_assignment(assignment_id, payload)


@router.delete("/assignments/{assignment_id}", status_code=204)
async def delete_assignment(
    assignment_id: str,
    service: Annotated[AcademicService, Depends(get_academic_service)],
) -> None:
    service.delete_assignment(assignment_id)


@router.post("/exams", response_model=ExamRead, status_code=201)
async def create_exam(
    payload: ExamCreate,
    service: Annotated[AcademicService, Depends(get_academic_service)],
) -> ExamRead:
    return service.create_exam(payload)


@router.get("/exams", response_model=list[ExamRead])
async def list_exams(
    service: Annotated[AcademicService, Depends(get_academic_service)],
    user_id: str | None = Query(default=None),
) -> list[ExamRead]:
    return list(service.list_exams(user_id=user_id))


@router.get("/exams/{exam_id}", response_model=ExamRead)
async def get_exam(
    exam_id: str,
    service: Annotated[AcademicService, Depends(get_academic_service)],
) -> ExamRead:
    return service.get_exam(exam_id)


@router.patch("/exams/{exam_id}", response_model=ExamRead)
async def update_exam(
    exam_id: str,
    payload: ExamUpdate,
    service: Annotated[AcademicService, Depends(get_academic_service)],
) -> ExamRead:
    return service.update_exam(exam_id, payload)


@router.delete("/exams/{exam_id}", status_code=204)
async def delete_exam(
    exam_id: str,
    service: Annotated[AcademicService, Depends(get_academic_service)],
) -> None:
    service.delete_exam(exam_id)


@router.post("/goals", response_model=GoalRead, status_code=201)
async def create_goal(
    payload: GoalCreate,
    service: Annotated[AcademicService, Depends(get_academic_service)],
) -> GoalRead:
    return service.create_goal(payload)


@router.get("/goals", response_model=list[GoalRead])
async def list_goals(
    service: Annotated[AcademicService, Depends(get_academic_service)],
    user_id: str | None = Query(default=None),
) -> list[GoalRead]:
    return list(service.list_goals(user_id=user_id))


@router.get("/goals/{goal_id}", response_model=GoalRead)
async def get_goal(
    goal_id: str,
    service: Annotated[AcademicService, Depends(get_academic_service)],
) -> GoalRead:
    return service.get_goal(goal_id)


@router.patch("/goals/{goal_id}", response_model=GoalRead)
async def update_goal(
    goal_id: str,
    payload: GoalUpdate,
    service: Annotated[AcademicService, Depends(get_academic_service)],
) -> GoalRead:
    return service.update_goal(goal_id, payload)


@router.delete("/goals/{goal_id}", status_code=204)
async def delete_goal(
    goal_id: str,
    service: Annotated[AcademicService, Depends(get_academic_service)],
) -> None:
    service.delete_goal(goal_id)
