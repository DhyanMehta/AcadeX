from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, Numeric, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

RISK_LABELS = ("low", "medium", "high", "critical")


class RiskScore(Base):
    __tablename__ = "risk_scores"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    student_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("students.id", onupdate="CASCADE", ondelete="CASCADE"), nullable=False
    )
    attendance_pct: Mapped[float] = mapped_column(Numeric(5, 2), nullable=False)
    marks_pct: Mapped[float] = mapped_column(Numeric(5, 2), nullable=False)
    assignment_pct: Mapped[float] = mapped_column(Numeric(5, 2), nullable=False)
    lms_score: Mapped[float] = mapped_column(Numeric(5, 2), nullable=False)
    risk_score: Mapped[float] = mapped_column(Numeric(5, 2), nullable=False)
    risk_label: Mapped[str] = mapped_column(
        Enum(*RISK_LABELS, name="risk_label_enum", create_type=False), nullable=False
    )
    ai_explanation: Mapped[str] = mapped_column(Text, nullable=False)
    ai_suggestions: Mapped[str] = mapped_column(Text, nullable=False)
    model_version: Mapped[str] = mapped_column(String(20), nullable=False)
    computed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    student = relationship("Student", back_populates="risk_scores", lazy="joined")
