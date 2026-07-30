from collections.abc import Sequence

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.exceptions import DuplicateException, NotFoundException
from app.core.security import hash_password
from app.db.models import Assignment, Exam, Goal, Module, Subject, User
from app.repositories.academic import (
    AssignmentRepository,
    ExamRepository,
    GoalRepository,
    ModuleRepository,
    SubjectRepository,
    UserRepository,
)
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


class AcademicService:
    """CRUD service for core planning inputs."""

    def __init__(self, session: Session) -> None:
        self.user_repository = UserRepository(session)
        self.subject_repository = SubjectRepository(session)
        self.module_repository = ModuleRepository(session)
        self.assignment_repository = AssignmentRepository(session)
        self.exam_repository = ExamRepository(session)
        self.goal_repository = GoalRepository(session)

    # ── User ──

    def create_user(self, payload: UserCreate) -> UserRead:
        if self.user_repository.get_by_email(payload.email):
            raise DuplicateException(entity="User", field="email")
        data = payload.model_dump()
        password = data.pop("password")
        user = self.user_repository.create(User(**data, password_hash=hash_password(password)))
        return UserRead.model_validate(user)

    def get_user(self, user_id: str) -> UserRead:
        user = self.user_repository.get(user_id)
        if user is None:
            raise NotFoundException(entity="User", entity_id=user_id)
        return UserRead.model_validate(user)

    def list_users(self) -> Sequence[UserRead]:
        return [UserRead.model_validate(item) for item in self.user_repository.list()]

    def update_user(self, user_id: str, payload: UserUpdate) -> UserRead:
        user = self._require("User", self.user_repository.get(user_id))
        updated = self.user_repository.update(user, payload.model_dump(exclude_none=True))
        return UserRead.model_validate(updated)

    def delete_user(self, user_id: str) -> None:
        user = self._require("User", self.user_repository.get(user_id))
        self.user_repository.delete(user)

    # ── Subject ──

    def create_subject(self, payload: SubjectCreate) -> SubjectRead:
        subject = self.subject_repository.create(Subject(**payload.model_dump()))
        return SubjectRead.model_validate(subject)

    def get_subject(self, subject_id: str) -> SubjectRead:
        subject = self.subject_repository.get(subject_id)
        if subject is None:
            raise NotFoundException(entity="Subject", entity_id=subject_id)
        return SubjectRead.model_validate(subject)

    def list_subjects(self, user_id: str | None = None) -> Sequence[SubjectRead]:
        return [SubjectRead.model_validate(item) for item in self.subject_repository.list(user_id=user_id)]

    def update_subject(self, subject_id: str, payload: SubjectUpdate) -> SubjectRead:
        subject = self._require("Subject", self.subject_repository.get(subject_id))
        updated = self.subject_repository.update(subject, payload.model_dump(exclude_none=True))
        return SubjectRead.model_validate(updated)

    def delete_subject(self, subject_id: str) -> None:
        subject = self._require("Subject", self.subject_repository.get(subject_id))
        self.subject_repository.delete(subject)

    # ── Module ──

    def create_module(self, payload: ModuleCreate) -> ModuleRead:
        module = self.module_repository.create(Module(**payload.model_dump()))
        return ModuleRead.model_validate(module)

    def get_module(self, module_id: str) -> ModuleRead:
        module = self.module_repository.get(module_id)
        if module is None:
            raise NotFoundException(entity="Module", entity_id=module_id)
        return ModuleRead.model_validate(module)

    def list_modules(self, subject_id: str | None = None) -> Sequence[ModuleRead]:
        return [ModuleRead.model_validate(item) for item in self.module_repository.list(subject_id=subject_id)]

    def update_module(self, module_id: str, payload: ModuleUpdate) -> ModuleRead:
        module = self._require("Module", self.module_repository.get(module_id))
        updated = self.module_repository.update(module, payload.model_dump(exclude_none=True))
        return ModuleRead.model_validate(updated)

    def delete_module(self, module_id: str) -> None:
        module = self._require("Module", self.module_repository.get(module_id))
        self.module_repository.delete(module)

    # ── Assignment ──

    def create_assignment(self, payload: AssignmentCreate) -> AssignmentRead:
        assignment = self.assignment_repository.create(Assignment(**payload.model_dump()))
        return AssignmentRead.model_validate(assignment)

    def get_assignment(self, assignment_id: str) -> AssignmentRead:
        assignment = self.assignment_repository.get(assignment_id)
        if assignment is None:
            raise NotFoundException(entity="Assignment", entity_id=assignment_id)
        return AssignmentRead.model_validate(assignment)

    def list_assignments(self, user_id: str | None = None) -> Sequence[AssignmentRead]:
        return [AssignmentRead.model_validate(item) for item in self.assignment_repository.list(user_id=user_id)]

    def update_assignment(self, assignment_id: str, payload: AssignmentUpdate) -> AssignmentRead:
        assignment = self._require("Assignment", self.assignment_repository.get(assignment_id))
        updated = self.assignment_repository.update(assignment, payload.model_dump(exclude_none=True))
        return AssignmentRead.model_validate(updated)

    def delete_assignment(self, assignment_id: str) -> None:
        assignment = self._require("Assignment", self.assignment_repository.get(assignment_id))
        self.assignment_repository.delete(assignment)

    # ── Exam ──

    def create_exam(self, payload: ExamCreate) -> ExamRead:
        exam = self.exam_repository.create(Exam(**payload.model_dump()))
        return ExamRead.model_validate(exam)

    def get_exam(self, exam_id: str) -> ExamRead:
        exam = self.exam_repository.get(exam_id)
        if exam is None:
            raise NotFoundException(entity="Exam", entity_id=exam_id)
        return ExamRead.model_validate(exam)

    def list_exams(self, user_id: str | None = None) -> Sequence[ExamRead]:
        return [ExamRead.model_validate(item) for item in self.exam_repository.list(user_id=user_id)]

    def update_exam(self, exam_id: str, payload: ExamUpdate) -> ExamRead:
        exam = self._require("Exam", self.exam_repository.get(exam_id))
        updated = self.exam_repository.update(exam, payload.model_dump(exclude_none=True))
        return ExamRead.model_validate(updated)

    def delete_exam(self, exam_id: str) -> None:
        exam = self._require("Exam", self.exam_repository.get(exam_id))
        self.exam_repository.delete(exam)

    # ── Goal ──

    def create_goal(self, payload: GoalCreate) -> GoalRead:
        goal = self.goal_repository.create(Goal(**payload.model_dump()))
        return GoalRead.model_validate(goal)

    def get_goal(self, goal_id: str) -> GoalRead:
        goal = self.goal_repository.get(goal_id)
        if goal is None:
            raise NotFoundException(entity="Goal", entity_id=goal_id)
        return GoalRead.model_validate(goal)

    def list_goals(self, user_id: str | None = None) -> Sequence[GoalRead]:
        return [GoalRead.model_validate(item) for item in self.goal_repository.list(user_id=user_id)]

    def update_goal(self, goal_id: str, payload: GoalUpdate) -> GoalRead:
        goal = self._require("Goal", self.goal_repository.get(goal_id))
        updated = self.goal_repository.update(goal, payload.model_dump(exclude_none=True))
        return GoalRead.model_validate(updated)

    def delete_goal(self, goal_id: str) -> None:
        goal = self._require("Goal", self.goal_repository.get(goal_id))
        self.goal_repository.delete(goal)

    # ── Helpers ──

    @staticmethod
    def _require(label: str, value):
        if value is None:
            raise NotFoundException(entity=label)
        return value

