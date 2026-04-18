from __future__ import annotations

from datetime import date, datetime

from sqlalchemy import Date, DateTime, ForeignKey, Integer, Numeric, SmallInteger, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class LmsActivity(Base):
    __tablename__ = "lms_activity"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    student_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("students.id", onupdate="CASCADE", ondelete="CASCADE"), nullable=False
    )
    subject_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("subjects.id", onupdate="CASCADE", ondelete="RESTRICT"), nullable=False
    )
    activity_date: Mapped[date] = mapped_column(Date, nullable=False)
    logins: Mapped[int] = mapped_column(SmallInteger, nullable=False, default=0)
    activity_score: Mapped[float] = mapped_column(Numeric(5, 2), nullable=False, default=0.00)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    student = relationship("Student", lazy="joined")
    subject = relationship("Subject", lazy="joined")
