from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Student(Base):
    __tablename__ = "students"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", onupdate="CASCADE", ondelete="RESTRICT"), unique=True, nullable=False
    )
    enrollment_no: Mapped[str] = mapped_column(String(30), unique=True, nullable=False)
    class_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("classes.id", onupdate="CASCADE", ondelete="RESTRICT"), nullable=False
    )
    mentor_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", onupdate="CASCADE", ondelete="RESTRICT"), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    user = relationship("User", foreign_keys=[user_id], lazy="joined")
    mentor = relationship("User", foreign_keys=[mentor_id], lazy="joined")
    class_ = relationship("Class", back_populates="students", lazy="joined")
    risk_scores = relationship("RiskScore", back_populates="student", lazy="select")
    alerts = relationship("Alert", back_populates="student", lazy="select")
    interventions = relationship("Intervention", back_populates="student", lazy="select")
