from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, Numeric, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

INTERVENTION_TYPES = ("counselling", "remedial_class", "assignment_extension", "parent_meeting", "academic_support", "other")
RISK_LABELS = ("low", "medium", "high", "critical")


class Intervention(Base):
    __tablename__ = "interventions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    student_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("students.id", onupdate="CASCADE", ondelete="CASCADE"), nullable=False
    )
    mentor_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", onupdate="CASCADE", ondelete="RESTRICT"), nullable=False
    )
    type: Mapped[str] = mapped_column(
        Enum(*INTERVENTION_TYPES, name="intervention_type_enum", create_type=False), nullable=False
    )
    remarks: Mapped[str] = mapped_column(Text, nullable=False)
    risk_score_before: Mapped[float] = mapped_column(Numeric(5, 2), nullable=False)
    conducted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    student = relationship("Student", back_populates="interventions", lazy="joined")
    mentor = relationship("User", lazy="joined")
    outcome = relationship("InterventionOutcome", back_populates="intervention", uselist=False, lazy="joined")


class InterventionOutcome(Base):
    __tablename__ = "intervention_outcomes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    intervention_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("interventions.id", onupdate="CASCADE", ondelete="CASCADE"), unique=True, nullable=False
    )
    student_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("students.id", onupdate="CASCADE", ondelete="CASCADE"), nullable=False
    )
    risk_score_before: Mapped[float] = mapped_column(Numeric(5, 2), nullable=False)
    risk_score_after: Mapped[float] = mapped_column(Numeric(5, 2), nullable=False)
    risk_label_before: Mapped[str] = mapped_column(
        Enum(*RISK_LABELS, name="risk_label_enum", create_type=False), nullable=False
    )
    risk_label_after: Mapped[str] = mapped_column(
        Enum(*RISK_LABELS, name="risk_label_enum", create_type=False), nullable=False
    )
    measured_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    intervention = relationship("Intervention", back_populates="outcome", lazy="joined")
    student = relationship("Student", lazy="joined")
