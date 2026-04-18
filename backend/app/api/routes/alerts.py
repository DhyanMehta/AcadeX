"""Alert routes."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api.deps import get_current_user
from app.db.session import get_db
from app.models import Alert
from app.schemas.common import AlertRead

router = APIRouter(prefix="/alerts", tags=["alerts"])

@router.get("/active")
def active_alerts(user=Depends(get_current_user), db: Session = Depends(get_db)):
    alerts = db.query(Alert).filter(Alert.is_read == False).order_by(Alert.triggered_at.desc()).all()
    return [AlertRead(id=a.id, student_id=a.student_id, mentor_id=a.mentor_id,
        alert_type=a.alert_type, is_read=a.is_read, triggered_at=a.triggered_at,
        student_name=a.student.user.name if a.student and a.student.user else None,
        enrollment_no=a.student.enrollment_no if a.student else None) for a in alerts]

@router.put("/{alert_id}/acknowledge")
def acknowledge_alert(alert_id: int, user=Depends(get_current_user), db: Session = Depends(get_db)):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(404, "Alert not found")
    alert.is_read = True
    db.commit()
    return {"message": "Alert acknowledged"}

@router.put("/{alert_id}/read")
def mark_read(alert_id: int, user=Depends(get_current_user), db: Session = Depends(get_db)):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(404, "Alert not found")
    alert.is_read = True
    db.commit()
    return {"message": "Alert marked as read"}

@router.get("/history/{student_id}")
def alert_history(student_id: int, user=Depends(get_current_user), db: Session = Depends(get_db)):
    alerts = db.query(Alert).filter(Alert.student_id == student_id).order_by(Alert.triggered_at.desc()).all()
    return [AlertRead(id=a.id, student_id=a.student_id, mentor_id=a.mentor_id,
        alert_type=a.alert_type, is_read=a.is_read, triggered_at=a.triggered_at,
        student_name=a.student.user.name if a.student and a.student.user else None,
        enrollment_no=a.student.enrollment_no if a.student else None) for a in alerts]
