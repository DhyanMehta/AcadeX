from __future__ import annotations

from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, Numeric, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

EXAM_TYPES = ("unit_test_1", "unit_test_2", "mid_sem", "practical", "assignment", "viva", "end_sem")


class InternalMark(Base):
    __tablename__ = "internal_marks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    student_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("students.id", onupdate="CASCADE", ondelete="CASCADE"), nullable=False
    )
    subject_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("subjects.id", onupdate="CASCADE", ondelete="RESTRICT"), nullable=False
    )
    entered_by: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", onupdate="CASCADE", ondelete="RESTRICT"), nullable=False
    )
    exam_type: Mapped[str] = mapped_column(
        Enum(*EXAM_TYPES, name="exam_type_enum", create_type=False), nullable=False
    )
    marks_obtained: Mapped[Optional[float]] = mapped_column(Numeric(6, 2), nullable=True)
    max_marks: Mapped[float] = mapped_column(Numeric(6, 2), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    student = relationship("Student", lazy="joined")
    subject = relationship("Subject", lazy="joined")
