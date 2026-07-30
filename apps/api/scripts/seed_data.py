#!/usr/bin/env python3
"""Seed the database with comprehensive demo data for development and testing."""

import uuid
from datetime import date, datetime, timedelta, timezone

from app.core.security import hash_password
from app.db.base import Base
from app.db.enums import PlannerRunStatus, StudySessionStatus
from app.db.models import (
    Assignment,
    Exam,
    Goal,
    Module,
    PlannerRun,
    ProgressRecord,
    StudySession,
    Subject,
    User,
)
from app.db.session import SessionLocal, engine


def seed_database() -> None:
    """Populate the database with sample data."""
    Base.metadata.create_all(bind=engine)
    session = SessionLocal()

    try:
        # Check if already seeded
        existing = session.query(User).first()
        if existing:
            print("Database already seeded. Skipping.")
            return

        now = datetime.now(timezone.utc)
        today = now.date()

        # ── Users ──
        users = [
            User(
                id=str(uuid.uuid4()),
                full_name="Alice Student",
                email="alice@example.com",
                password_hash=hash_password("password123"),
                timezone="America/New_York",
                role="student",
            ),
            User(
                id=str(uuid.uuid4()),
                full_name="Bob Learner",
                email="bob@example.com",
                password_hash=hash_password("password123"),
                timezone="Europe/London",
                role="student",
            ),
            User(
                id=str(uuid.uuid4()),
                full_name="Dr. Mentor",
                email="mentor@example.com",
                password_hash=hash_password("password123"),
                timezone="Asia/Kolkata",
                role="mentor",
            ),
        ]
        session.add_all(users)
        session.flush()

        # ── Subjects ──
        subjects_data = [
            ("CS301", "Database Management Systems", "Advanced DBMS covering relational theory, SQL, NoSQL, and query optimization.", 4, "#2563EB"),
            ("CS401", "Machine Learning", "Foundations of ML: supervised, unsupervised, neural networks, and deployment.", 5, "#7C3AED"),
            ("MATH201", "Linear Algebra", "Vectors, matrices, eigenvalues, SVD — core math for data science.", 3, "#059669"),
            ("ENG101", "Technical Communication", "Academic writing, presentations, and documentation best practices.", 2, "#D97706"),
        ]
        subjects = []
        for code, name, desc, difficulty, color in subjects_data:
            subject = Subject(
                id=str(uuid.uuid4()),
                user_id=users[0].id,
                name=name,
                code=code,
                description=desc,
                difficulty=difficulty,
                color_hex=color,
            )
            session.add(subject)
            subjects.append(subject)
        session.flush()

        # ── Modules ──
        modules_data = {
            subjects[0]: [
                ("Relational Model & ER Diagrams", 1, "Learn entity-relationship modeling and normalization.", 6),
                ("SQL Advanced Queries", 2, "Subqueries, window functions, CTEs, and indexing.", 8),
                ("NoSQL & Distributed Databases", 3, "Document stores, key-value, graph databases, CAP theorem.", 5),
            ],
            subjects[1]: [
                ("Supervised Learning", 1, "Regression, classification, decision trees, ensemble methods.", 10),
                ("Unsupervised Learning", 2, "Clustering, dimensionality reduction, anomaly detection.", 8),
                ("Neural Networks & Deep Learning", 3, "MLPs, CNNs, RNNs, transformers, and transfer learning.", 12),
            ],
            subjects[2]: [
                ("Vectors & Matrices", 1, "Basic operations, matrix multiplication, determinants.", 6),
                ("Eigenvalues & Singular Value Decomposition", 2, "Diagonalization, SVD, and applications.", 8),
            ],
        }
        all_modules = []
        for subject, mods in modules_data.items():
            for title, seq, desc, hours in mods:
                module = Module(
                    id=str(uuid.uuid4()),
                    subject_id=subject.id,
                    title=title,
                    sequence_number=seq,
                    description=desc,
                    estimated_hours=hours,
                    weight=min(seq + 2, 5),
                    learning_outcomes=[f"Understand {title.lower()}", f"Apply {title.lower()} concepts"],
                )
                session.add(module)
                all_modules.append(module)
        session.flush()

        # ── Assignments ──
        assignments_data = [
            ("ER Diagram Project", "Design an ER diagram for a library management system.", today + timedelta(days=7), subjects[0], all_modules[0], 4),
            ("SQL Query Optimization Report", "Optimize 10 given SQL queries and document improvements.", today + timedelta(days=5), subjects[0], all_modules[1], 3),
            ("Linear Regression Implementation", "Implement linear regression from scratch in Python.", today + timedelta(days=10), subjects[1], all_modules[3], 5),
            ("Matrix Operations Problem Set", "Complete problem set on matrix operations.", today + timedelta(days=3), subjects[2], all_modules[6], 2),
            ("Technical Report Draft", "Write first draft of technical report on a topic of choice.", today + timedelta(days=14), subjects[3], None, 2),
        ]
        for title, desc, due, subject, module, priority in assignments_data:
            assignment = Assignment(
                id=str(uuid.uuid4()),
                user_id=users[0].id,
                subject_id=subject.id,
                module_id=module.id if module else None,
                title=title,
                description=desc,
                due_at=datetime.combine(due, datetime.min.time(), tzinfo=timezone.utc),
                priority=priority,
                status="pending",
                source="manual",
            )
            session.add(assignment)

        # ── Exams ──
        exams_data = [
            ("DBMS Midterm", subjects[0], today + timedelta(days=21), "Room 301", 8),
            ("ML Quiz 1", subjects[1], today + timedelta(days=14), "Room 205", 5),
            ("Linear Algebra Final", subjects[2], today + timedelta(days=35), "Exam Hall A", 10),
        ]
        for title, subject, scheduled, location, weight in exams_data:
            exam = Exam(
                id=str(uuid.uuid4()),
                user_id=users[0].id,
                subject_id=subject.id,
                title=title,
                scheduled_at=datetime.combine(scheduled, datetime.min.time().replace(hour=10), tzinfo=timezone.utc),
                location=location,
                weight=weight,
            )
            session.add(exam)

        # ── Goals ──
        goals_data = [
            ("Master SQL", "Become proficient in advanced SQL queries.", today + timedelta(days=30), 20, 4, subjects[0]),
            ("Complete ML Course", "Finish the machine learning course with distinction.", today + timedelta(days=60), 40, 5, subjects[1]),
            ("Improve Writing", "Improve technical writing skills.", today + timedelta(days=45), 15, 2, subjects[3]),
        ]
        for title, desc, target, hours, priority, subject in goals_data:
            goal = Goal(
                id=str(uuid.uuid4()),
                user_id=users[0].id,
                subject_id=subject.id if subject else None,
                title=title,
                description=desc,
                target_date=target,
                target_hours=hours,
                priority=priority,
                is_active=True,
            )
            session.add(goal)

        # ── Planner Run ──
        planner_run = PlannerRun(
            id=str(uuid.uuid4()),
            user_id=users[0].id,
            trigger="seed",
            status=PlannerRunStatus.DRAFT,
            planning_window_start=today,
            planning_window_end=today + timedelta(days=14),
            reason_summary="Seed data plan for demonstration.",
            input_snapshot={"source": "seed_data", "total_assignments": 5, "total_exams": 3, "total_goals": 3},
            output_snapshot={"sessions_generated": 10, "total_minutes": 2400},
        )
        session.add(planner_run)
        session.flush()

        # ── Study Sessions ──
        for i in range(10):
            session_start = datetime.combine(
                today + timedelta(days=i),
                datetime.min.time().replace(hour=9 + (i % 8)),
                tzinfo=timezone.utc,
            )
            study_session = StudySession(
                id=str(uuid.uuid4()),
                user_id=users[0].id,
                subject_id=subjects[i % len(subjects)].id,
                module_id=all_modules[i % len(all_modules)].id if all_modules else None,
                planner_run_id=planner_run.id,
                title=f"Study: {subjects[i % len(subjects)].name} - Session {i + 1}",
                scheduled_start=session_start,
                scheduled_end=session_start + timedelta(minutes=90),
                estimated_duration_minutes=90,
                status=StudySessionStatus.PLANNED if i < 7 else StudySessionStatus.COMPLETED,
                priority=3 if i < 5 else 4,
                reason="Scheduled based on assignment deadlines and exam proximity.",
                confidence=0.85,
            )
            session.add(study_session)
            session.flush()

            # Progress records for completed sessions
            if study_session.status == StudySessionStatus.COMPLETED:
                progress = ProgressRecord(
                    id=str(uuid.uuid4()),
                    user_id=users[0].id,
                    subject_id=study_session.subject_id,
                    module_id=study_session.module_id,
                    study_session_id=study_session.id,
                    progress_date=study_session.scheduled_start.date(),
                    minutes_studied=90,
                    completion_percent=100,
                    notes="Completed as planned.",
                )
                session.add(progress)

        # ── Assignments for Bob ──
        bob_subject = Subject(
            id=str(uuid.uuid4()),
            user_id=users[1].id,
            name="Physics",
            code="PHY201",
            description="Classical mechanics and thermodynamics.",
            difficulty=3,
            color_hex="#DC2626",
        )
        session.add(bob_subject)
        session.flush()

        bob_assignment = Assignment(
            id=str(uuid.uuid4()),
            user_id=users[1].id,
            subject_id=bob_subject.id,
            title="Thermodynamics Problem Set",
            description="Solve 20 problems on thermodynamics.",
            due_at=datetime.combine(today + timedelta(days=7), datetime.min.time(), tzinfo=timezone.utc),
            priority=3,
            status="pending",
            source="manual",
        )
        session.add(bob_assignment)

        session.commit()
        print("Database seeded successfully with demo data!")
        print(f"  Users: {len(users)}")
        print(f"  Subjects: {len(subjects)}")
        print(f"  Modules: {len(all_modules)}")
        print(f"  Assignments: {len(assignments_data) + 1}")
        print(f"  Exams: {len(exams_data)}")
        print(f"  Goals: {len(goals_data)}")
        print(f"  Study Sessions: 10")
        print(f"\nLogin credentials:")
        print(f"  alice@example.com / password123")
        print(f"  bob@example.com / password123")
        print(f"  mentor@example.com / password123")

    finally:
        session.close()


if __name__ == "__main__":
    seed_database()

