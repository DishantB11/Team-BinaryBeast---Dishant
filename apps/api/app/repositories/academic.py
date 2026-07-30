from collections.abc import Sequence

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models import Assignment, Exam, Goal, Module, Subject, User
from app.repositories.base import SQLAlchemyRepository


class UserRepository(SQLAlchemyRepository):
    def get(self, user_id: str) -> User | None:
        return self.session.get(User, user_id)

    def get_by_email(self, email: str) -> User | None:
        return self.session.scalar(select(User).where(User.email == email))

    def create(self, user: User) -> User:
        self.session.add(user)
        self.session.commit()
        self.session.refresh(user)
        return user

    def list(self) -> Sequence[User]:
        return self.session.scalars(select(User).order_by(User.created_at.desc())).all()

    def update(self, user: User, updates: dict) -> User:
        for key, value in updates.items():
            setattr(user, key, value)
        self.session.commit()
        self.session.refresh(user)
        return user

    def delete(self, user: User) -> None:
        self.session.delete(user)
        self.session.commit()


class SubjectRepository(SQLAlchemyRepository):
    def get(self, subject_id: str) -> Subject | None:
        return self.session.get(Subject, subject_id)

    def create(self, subject: Subject) -> Subject:
        self.session.add(subject)
        self.session.commit()
        self.session.refresh(subject)
        return subject

    def list(self, user_id: str | None = None) -> Sequence[Subject]:
        stmt = select(Subject).order_by(Subject.created_at.desc())
        if user_id:
            stmt = stmt.where(Subject.user_id == user_id)
        return self.session.scalars(stmt).all()

    def update(self, subject: Subject, updates: dict) -> Subject:
        for key, value in updates.items():
            setattr(subject, key, value)
        self.session.commit()
        self.session.refresh(subject)
        return subject

    def delete(self, subject: Subject) -> None:
        self.session.delete(subject)
        self.session.commit()


class ModuleRepository(SQLAlchemyRepository):
    def get(self, module_id: str) -> Module | None:
        return self.session.get(Module, module_id)

    def create(self, module: Module) -> Module:
        self.session.add(module)
        self.session.commit()
        self.session.refresh(module)
        return module

    def list(self, subject_id: str | None = None) -> Sequence[Module]:
        stmt = select(Module).order_by(Module.sequence_number.asc())
        if subject_id:
            stmt = stmt.where(Module.subject_id == subject_id)
        return self.session.scalars(stmt).all()

    def update(self, module: Module, updates: dict) -> Module:
        for key, value in updates.items():
            setattr(module, key, value)
        self.session.commit()
        self.session.refresh(module)
        return module

    def delete(self, module: Module) -> None:
        self.session.delete(module)
        self.session.commit()


class AssignmentRepository(SQLAlchemyRepository):
    def get(self, assignment_id: str) -> Assignment | None:
        return self.session.get(Assignment, assignment_id)

    def create(self, assignment: Assignment) -> Assignment:
        self.session.add(assignment)
        self.session.commit()
        self.session.refresh(assignment)
        return assignment

    def list(self, user_id: str | None = None) -> Sequence[Assignment]:
        stmt = select(Assignment).order_by(Assignment.due_at.asc())
        if user_id:
            stmt = stmt.where(Assignment.user_id == user_id)
        return self.session.scalars(stmt).all()

    def update(self, assignment: Assignment, updates: dict) -> Assignment:
        for key, value in updates.items():
            setattr(assignment, key, value)
        self.session.commit()
        self.session.refresh(assignment)
        return assignment

    def delete(self, assignment: Assignment) -> None:
        self.session.delete(assignment)
        self.session.commit()


class ExamRepository(SQLAlchemyRepository):
    def get(self, exam_id: str) -> Exam | None:
        return self.session.get(Exam, exam_id)

    def create(self, exam: Exam) -> Exam:
        self.session.add(exam)
        self.session.commit()
        self.session.refresh(exam)
        return exam

    def list(self, user_id: str | None = None) -> Sequence[Exam]:
        stmt = select(Exam).order_by(Exam.scheduled_at.asc())
        if user_id:
            stmt = stmt.where(Exam.user_id == user_id)
        return self.session.scalars(stmt).all()

    def update(self, exam: Exam, updates: dict) -> Exam:
        for key, value in updates.items():
            setattr(exam, key, value)
        self.session.commit()
        self.session.refresh(exam)
        return exam

    def delete(self, exam: Exam) -> None:
        self.session.delete(exam)
        self.session.commit()


class GoalRepository(SQLAlchemyRepository):
    def get(self, goal_id: str) -> Goal | None:
        return self.session.get(Goal, goal_id)

    def create(self, goal: Goal) -> Goal:
        self.session.add(goal)
        self.session.commit()
        self.session.refresh(goal)
        return goal

    def list(self, user_id: str | None = None) -> Sequence[Goal]:
        stmt = select(Goal).order_by(Goal.created_at.desc())
        if user_id:
            stmt = stmt.where(Goal.user_id == user_id)
        return self.session.scalars(stmt).all()

    def update(self, goal: Goal, updates: dict) -> Goal:
        for key, value in updates.items():
            setattr(goal, key, value)
        self.session.commit()
        self.session.refresh(goal)
        return goal

    def delete(self, goal: Goal) -> None:
        self.session.delete(goal)
        self.session.commit()
