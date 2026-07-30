from datetime import date, datetime

from pydantic import Field

from app.schemas.common import ORMModel


class UserCreate(ORMModel):
    full_name: str
    email: str
    password: str
    timezone: str = "UTC"
    role: str = "student"


class UserUpdate(ORMModel):
    full_name: str | None = None
    timezone: str | None = None
    role: str | None = None
    is_active: bool | None = None


class UserRead(ORMModel):
    id: str
    full_name: str
    email: str
    timezone: str
    role: str
    is_active: bool


class SubjectCreate(ORMModel):
    user_id: str
    name: str
    code: str | None = None
    description: str | None = None
    difficulty: int = Field(default=3, ge=1, le=5)
    color_hex: str | None = None


class SubjectUpdate(ORMModel):
    name: str | None = None
    code: str | None = None
    description: str | None = None
    difficulty: int | None = Field(default=None, ge=1, le=5)
    color_hex: str | None = None


class SubjectRead(SubjectCreate):
    id: str


class ModuleCreate(ORMModel):
    subject_id: str
    title: str
    sequence_number: int = Field(gt=0)
    description: str | None = None
    learning_outcomes: list[str] | None = None
    estimated_hours: int | None = Field(default=None, ge=0)
    weight: int = Field(default=3, ge=1, le=5)


class ModuleUpdate(ORMModel):
    title: str | None = None
    sequence_number: int | None = Field(default=None, gt=0)
    description: str | None = None
    learning_outcomes: list[str] | None = None
    estimated_hours: int | None = Field(default=None, ge=0)
    weight: int | None = Field(default=None, ge=1, le=5)


class ModuleRead(ModuleCreate):
    id: str


class AssignmentCreate(ORMModel):
    user_id: str
    subject_id: str
    module_id: str | None = None
    title: str
    description: str | None = None
    due_at: datetime
    priority: int = Field(default=3, ge=1, le=5)
    status: str = "pending"
    source: str = "manual"


class AssignmentUpdate(ORMModel):
    title: str | None = None
    description: str | None = None
    due_at: datetime | None = None
    priority: int | None = Field(default=None, ge=1, le=5)
    status: str | None = None
    source: str | None = None
    module_id: str | None = None


class AssignmentRead(AssignmentCreate):
    id: str


class ExamCreate(ORMModel):
    user_id: str
    subject_id: str
    title: str
    scheduled_at: datetime
    location: str | None = None
    weight: int = Field(default=5, ge=1, le=10)
    notes: str | None = None


class ExamUpdate(ORMModel):
    title: str | None = None
    scheduled_at: datetime | None = None
    location: str | None = None
    weight: int | None = Field(default=None, ge=1, le=10)
    notes: str | None = None


class ExamRead(ExamCreate):
    id: str


class GoalCreate(ORMModel):
    user_id: str
    subject_id: str | None = None
    title: str
    description: str | None = None
    target_date: date | None = None
    target_hours: int | None = Field(default=None, ge=0)
    priority: int = Field(default=3, ge=1, le=5)
    is_active: bool = True


class GoalUpdate(ORMModel):
    title: str | None = None
    description: str | None = None
    target_date: date | None = None
    target_hours: int | None = Field(default=None, ge=0)
    priority: int | None = Field(default=None, ge=1, le=5)
    is_active: bool | None = None
    subject_id: str | None = None


class GoalRead(GoalCreate):
    id: str
