"""Risk engine + ML prediction routes."""
from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models import (
    Student, AttendanceRecord, InternalMark, AssignmentSubmission,
    LmsActivity, RiskScore, Alert
)
from app.services.ml_service import (
    predict_risk, explain_risk, generate_suggestions,
    predict_trend, compute_risk_score, generate_ai_explanation
)
from app.schemas.common import RiskScoreRead, MLPredictionResult, MLTrendResult

router_risk = APIRouter(prefix="/risk", tags=["risk-engine"])
router_ml = APIRouter(prefix="/ml", tags=["ml"])


def _compute_student_features(student_id: int, db: Session) -> dict:
    """Compute the 4 raw features for a student."""
    # Attendance percentage
    total_att = db.query(AttendanceRecord).filter(AttendanceRecord.student_id == student_id).count()
    present = db.query(AttendanceRecord).filter(
        AttendanceRecord.student_id == student_id, AttendanceRecord.status == "present"
    ).count()
    attendance_pct = round(present / total_att * 100, 2) if total_att else 75.0

    # Marks percentage
    marks = db.query(InternalMark).filter(InternalMark.student_id == student_id).all()
    if marks:
        total_obtained = sum(float(m.marks_obtained) for m in marks if m.marks_obtained is not None)
        total_max = sum(float(m.max_marks) for m in marks)
        marks_pct = round(total_obtained / total_max * 100, 2) if total_max else 50.0
    else:
        marks_pct = 50.0

    # Assignment completion
    subs = db.query(AssignmentSubmission).filter(AssignmentSubmission.student_id == student_id).all()
    if subs:
        completed = sum(1 for s in subs if s.status == "graded")
        assignment_pct = round(completed / len(subs) * 100, 2)
    else:
        assignment_pct = 50.0

    # LMS activity
    lms = db.query(LmsActivity).filter(LmsActivity.student_id == student_id).all()
    if lms:
        lms_score = round(sum(float(l.activity_score) for l in lms) / len(lms), 2)
    else:
        lms_score = 50.0

    return {
        "attendance": attendance_pct,
        "marks": marks_pct,
        "assignment": assignment_pct,
        "lms": lms_score,
    }


# ── Risk Engine ────────────────────────────────────

@router_risk.post("/compute/{student_id}")
def compute_risk(student_id: int, user=Depends(get_current_user), db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(404, "Student not found")

    features = _compute_student_features(student_id, db)
    prediction = predict_risk(features["attendance"], features["marks"], features["assignment"], features["lms"])
    explanations = explain_risk(features["attendance"], features["marks"], features["assignment"], features["lms"])
    suggestions = generate_suggestions(explanations, features["attendance"], features["marks"], features["assignment"], features["lms"])

    risk_entry = RiskScore(
        student_id=student_id,
        attendance_pct=features["attendance"],
        marks_pct=features["marks"],
        assignment_pct=features["assignment"],
        lms_score=features["lms"],
        risk_score=prediction["risk_score"],
        risk_label=prediction["risk_label"].lower(),
        ai_explanation=generate_ai_explanation(explanations),
        ai_suggestions="; ".join(suggestions),
        model_version="xgb-v1.0",
    )
    db.add(risk_entry)

    # Auto-generate alert if high/critical
    if prediction["risk_label"].lower() in ("high", "critical"):
        alert_type = "critical_risk" if prediction["risk_label"].lower() == "critical" else "high_risk"
        alert = Alert(
            student_id=student_id, mentor_id=student.mentor_id,
            alert_type=alert_type
        )
        db.add(alert)

    db.commit()
    db.refresh(risk_entry)
    return RiskScoreRead.model_validate(risk_entry)


@router_risk.post("/compute-all")
def compute_all_risks(user=Depends(get_current_user), db: Session = Depends(get_db)):
    students = db.query(Student).all()
    count = 0
    for student in students:
        features = _compute_student_features(student.id, db)
        prediction = predict_risk(features["attendance"], features["marks"], features["assignment"], features["lms"])
        explanations = explain_risk(features["attendance"], features["marks"], features["assignment"], features["lms"])
        suggestions = generate_suggestions(explanations, features["attendance"], features["marks"], features["assignment"], features["lms"])

        risk_entry = RiskScore(
            student_id=student.id,
            attendance_pct=features["attendance"],
            marks_pct=features["marks"],
            assignment_pct=features["assignment"],
            lms_score=features["lms"],
            risk_score=prediction["risk_score"],
            risk_label=prediction["risk_label"].lower(),
            ai_explanation=generate_ai_explanation(explanations),
            ai_suggestions="; ".join(suggestions),
            model_version="xgb-v1.0",
        )
        db.add(risk_entry)

        if prediction["risk_label"].lower() in ("high", "critical"):
            alert_type = "critical_risk" if prediction["risk_label"].lower() == "critical" else "high_risk"
            db.add(Alert(student_id=student.id, mentor_id=student.mentor_id, alert_type=alert_type))
        count += 1

    db.commit()
    return {"message": f"Risk computed for {count} students"}


@router_risk.get("/history/{student_id}", response_model=list[RiskScoreRead])
def risk_history(student_id: int, user=Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(RiskScore).filter(
        RiskScore.student_id == student_id
    ).order_by(RiskScore.computed_at.desc()).all()


# ── ML Routes ──────────────────────────────────────

@router_ml.post("/predict/{student_id}", response_model=MLPredictionResult)
def ml_predict(student_id: int, user=Depends(get_current_user), db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(404, "Student not found")
    features = _compute_student_features(student_id, db)
    prediction = predict_risk(features["attendance"], features["marks"], features["assignment"], features["lms"])
    explanations = explain_risk(features["attendance"], features["marks"], features["assignment"], features["lms"])
    suggestions = generate_suggestions(explanations, features["attendance"], features["marks"], features["assignment"], features["lms"])
    return MLPredictionResult(
        student_id=student_id,
        risk_label=prediction["risk_label"],
        confidence=prediction["confidence"],
        risk_score=prediction["risk_score"],
        shap_explanations=explanations,
        suggestions=suggestions,
    )


@router_ml.post("/trend/{student_id}", response_model=MLTrendResult)
def ml_trend(student_id: int, user=Depends(get_current_user), db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(404, "Student not found")

    # Gather weekly snapshots from risk_scores
    risk_history = db.query(RiskScore).filter(
        RiskScore.student_id == student_id
    ).order_by(RiskScore.computed_at.desc()).limit(5).all()

    if not risk_history:
        features = _compute_student_features(student_id, db)
        weekly = [[features["attendance"], features["marks"], features["assignment"], features["lms"]]]
    else:
        weekly = [[float(r.attendance_pct), float(r.marks_pct), float(r.assignment_pct), float(r.lms_score)]
                   for r in reversed(risk_history)]

    trend_result = predict_trend(weekly)
    return MLTrendResult(
        student_id=student_id,
        predicted_next_score=trend_result["predicted_next_score"],
        trend=trend_result["trend"],
        alert_needed=trend_result["alert_needed"],
    )


@router_ml.post("/predict-all")
def ml_predict_all(user=Depends(get_current_user), db: Session = Depends(get_db)):
    students = db.query(Student).all()
    results = []
    for s in students:
        features = _compute_student_features(s.id, db)
        prediction = predict_risk(features["attendance"], features["marks"], features["assignment"], features["lms"])
        results.append({
            "student_id": s.id,
            "risk_label": prediction["risk_label"],
            "risk_score": prediction["risk_score"],
        })
    return results


@router_ml.get("/shap/{student_id}")
def ml_shap(student_id: int, user=Depends(get_current_user), db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(404, "Student not found")
    features = _compute_student_features(student_id, db)
    explanations = explain_risk(features["attendance"], features["marks"], features["assignment"], features["lms"])
    return {"student_id": student_id, "explanations": explanations}
