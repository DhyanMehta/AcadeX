"""Intervention outcome routes."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api.deps import get_current_user
from app.db.session import get_db
from app.models import Intervention, InterventionOutcome, RiskScore
from app.schemas.common import InterventionOutcomeRead, InterventionOutcomeCreate, InterventionRead

from typing import Optional

router = APIRouter(prefix="/interventions", tags=["interventions"])

@router.post("/{intervention_id}/outcome")
def create_outcome(intervention_id: int, payload: InterventionOutcomeCreate,
                   user=Depends(get_current_user), db: Session = Depends(get_db)):
    iv = db.query(Intervention).filter(Intervention.id == intervention_id).first()
    if not iv:
        raise HTTPException(404, "Intervention not found")
    existing = db.query(InterventionOutcome).filter(InterventionOutcome.intervention_id == intervention_id).first()
    if existing:
        raise HTTPException(400, "Outcome already recorded")
    latest_risk = db.query(RiskScore).filter(RiskScore.student_id == iv.student_id).order_by(RiskScore.computed_at.desc()).first()
    label_before = latest_risk.risk_label if latest_risk else "low"
    outcome = InterventionOutcome(
        intervention_id=intervention_id, student_id=iv.student_id,
        risk_score_before=float(iv.risk_score_before), risk_score_after=payload.risk_score_after,
        risk_label_before=label_before, risk_label_after=payload.risk_label_after)
    db.add(outcome)
    db.commit()
    return {"message": "Outcome recorded"}

@router.get("/{intervention_id}/outcome", response_model=Optional[InterventionOutcomeRead])
def get_outcome(intervention_id: int, user=Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(InterventionOutcome).filter(InterventionOutcome.intervention_id == intervention_id).first()

@router.get("/student/{student_id}")
def student_interventions(student_id: int, user=Depends(get_current_user), db: Session = Depends(get_db)):
    ivs = db.query(Intervention).filter(Intervention.student_id == student_id).order_by(Intervention.conducted_at.desc()).all()
    return [InterventionRead(id=iv.id, student_id=iv.student_id, mentor_id=iv.mentor_id,
        type=iv.type, remarks=iv.remarks, risk_score_before=float(iv.risk_score_before),
        conducted_at=iv.conducted_at,
        mentor_name=iv.mentor.name if iv.mentor else None,
        student_name=iv.student.user.name if iv.student and iv.student.user else None) for iv in ivs]
