"""LMS activity routes."""
from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.api.deps import get_current_user
from app.db.session import get_db
from app.models import LmsActivity
from app.schemas.common import LmsActivityCreate, LmsActivityRead

router = APIRouter(prefix="/lms", tags=["lms"])

@router.post("/activity/{student_id}")
def create_activity(student_id: int, payload: LmsActivityCreate,
                    user=Depends(get_current_user), db: Session = Depends(get_db)):
    db.add(LmsActivity(student_id=student_id, subject_id=payload.subject_id,
        activity_date=payload.activity_date, logins=payload.logins, activity_score=payload.activity_score))
    db.commit()
    return {"message": "LMS activity recorded"}

@router.get("/activity/{student_id}", response_model=list[LmsActivityRead])
def get_activity(student_id: int, user=Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(LmsActivity).filter(LmsActivity.student_id == student_id).order_by(LmsActivity.activity_date.desc()).all()

@router.post("/activity/bulk")
def bulk_activity(payload: dict, user=Depends(get_current_user), db: Session = Depends(get_db)):
    records = payload.get("records", [])
    for r in records:
        db.add(LmsActivity(student_id=r["student_id"], subject_id=r["subject_id"],
            activity_date=r["activity_date"], logins=r.get("logins", 0), activity_score=r.get("activity_score", 0)))
    db.commit()
    return {"message": f"{len(records)} LMS records created"}
