from __future__ import annotations

from datetime import date, datetime
from typing import Optional

from sqlalchemy import Date, DateTime, Enum, ForeignKey, Integer, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

SUBMISSION_STATUSES = ("pending", "graded", "missing")


class Assignment(Base):
    __tablename__ = "assignments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    subject_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("subjects.id", onupdate="CASCADE", ondelete="RESTRICT"), nullable=False
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    due_date: Mapped[date] = mapped_column(Date, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    subject = relationship("Subject", lazy="joined")
    submissions = relationship("AssignmentSubmission", back_populates="assignment", lazy="select")


class AssignmentSubmission(Base):
    __tablename__ = "assignment_submissions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    assignment_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("assignments.id", onupdate="CASCADE", ondelete="RESTRICT"), nullable=False
    )
    student_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("students.id", onupdate="CASCADE", ondelete="CASCADE"), nullable=False
    )
    entered_by: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("users.id", onupdate="CASCADE", ondelete="SET NULL"), nullable=True
    )
    status: Mapped[str] = mapped_column(
        Enum(*SUBMISSION_STATUSES, name="submission_status_enum", create_type=False), nullable=False, default="pending"
    )
    marks_obtained: Mapped[Optional[float]] = mapped_column(Numeric(6, 2), nullable=True)
    max_marks: Mapped[float] = mapped_column(Numeric(6, 2), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    assignment = relationship("Assignment", back_populates="submissions", lazy="joined")
    student = relationship("Student", lazy="joined")
