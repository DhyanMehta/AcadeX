from __future__ import annotations

from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Integer, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

ALERT_TYPES = ("high_risk", "critical_risk", "attendance_drop", "marks_drop", "assignment_overdue", "lms_inactive")


class Alert(Base):
    __tablename__ = "alerts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    student_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("students.id", onupdate="CASCADE", ondelete="CASCADE"), nullable=False
    )
    mentor_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", onupdate="CASCADE", ondelete="RESTRICT"), nullable=False
    )
    alert_type: Mapped[str] = mapped_column(
        Enum(*ALERT_TYPES, name="alert_type_enum", create_type=False), nullable=False
    )
    is_read: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    triggered_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    student = relationship("Student", back_populates="alerts", lazy="joined")
    mentor = relationship("User", lazy="joined")
