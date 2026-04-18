"""Student self-view portal routes."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func as sql_func
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models import (
    Student, AttendanceRecord, InternalMark, Assignment, AssignmentSubmission,
    RiskScore, Intervention, LmsActivity, Subject
)
from app.schemas.common import (
    RiskScoreRead, AttendanceSummary, MarkRead, AssignmentSubmissionRead,
    InterventionRead, SuggestionRead, ProgressRead
)

router = APIRouter(prefix="/student", tags=["student"])


def _get_student(user, db):
    student = db.query(Student).filter(Student.user_id == user.id).first()
    if not student:
        raise HTTPException(404, "Student profile not found")
    return student


@router.get("/dashboard")
def student_dashboard(user=Depends(get_current_user), db: Session = Depends(get_db)):
    student = _get_student(user, db)
    latest_risk = db.query(RiskScore).filter(
        RiskScore.student_id == student.id
    ).order_by(RiskScore.computed_at.desc()).first()

    # Attendance summary
    total_att = db.query(AttendanceRecord).filter(AttendanceRecord.student_id == student.id).count()
    present = db.query(AttendanceRecord).filter(
        AttendanceRecord.student_id == student.id, AttendanceRecord.status == "present"
    ).count()
    att_pct = round((present / total_att * 100), 1) if total_att else 0

    # Pending assignments
    pending = db.query(AssignmentSubmission).filter(
        AssignmentSubmission.student_id == student.id,
        AssignmentSubmission.status == "pending"
    ).count()

    # Active alerts count
    from app.models import Alert
    alerts = db.query(Alert).filter(Alert.student_id == student.id, Alert.is_read == False).count()

    return {
        "student_id": student.id,
        "student_name": student.user.name,
        "enrollment_no": student.enrollment_no,
        "class_name": student.class_.name if student.class_ else "",
        "semester": student.class_.semester if student.class_ else 0,
        "risk_score": float(latest_risk.risk_score) if latest_risk else 0,
        "risk_label": latest_risk.risk_label if latest_risk else "low",
        "attendance_pct": att_pct,
        "pending_assignments": pending,
        "active_alerts": alerts,
        "ai_explanation": latest_risk.ai_explanation if latest_risk else "",
        "ai_suggestions": latest_risk.ai_suggestions if latest_risk else "",
    }


from typing import Optional

@router.get("/risk-score", response_model=Optional[RiskScoreRead])
def student_risk_score(user=Depends(get_current_user), db: Session = Depends(get_db)):
    student = _get_student(user, db)
    return db.query(RiskScore).filter(
        RiskScore.student_id == student.id
    ).order_by(RiskScore.computed_at.desc()).first()


@router.get("/attendance", response_model=list[AttendanceSummary])
def student_attendance(user=Depends(get_current_user), db: Session = Depends(get_db)):
    student = _get_student(user, db)
    subjects = db.query(Subject).filter(Subject.class_id == student.class_id).all()
    result = []
    for subj in subjects:
        records = db.query(AttendanceRecord).filter(
            AttendanceRecord.student_id == student.id,
            AttendanceRecord.subject_id == subj.id
        ).all()
        total = len(records)
        present = sum(1 for r in records if r.status == "present")
        absent = sum(1 for r in records if r.status == "absent")
        late = sum(1 for r in records if r.status == "late")
        pct = round(present / total * 100, 1) if total else 0
        result.append(AttendanceSummary(
            subject_id=subj.id, subject_name=subj.name,
            total=total, present=present, absent=absent, late=late, percentage=pct
        ))
    return result


@router.get("/marks", response_model=list[MarkRead])
def student_marks(user=Depends(get_current_user), db: Session = Depends(get_db)):
    student = _get_student(user, db)
    marks = db.query(InternalMark).filter(InternalMark.student_id == student.id).all()
    result = []
    for m in marks:
        result.append(MarkRead(
            id=m.id, student_id=m.student_id, subject_id=m.subject_id,
            exam_type=m.exam_type,
            marks_obtained=float(m.marks_obtained) if m.marks_obtained else None,
            max_marks=float(m.max_marks),
            subject_name=m.subject.name if m.subject else None
        ))
    return result


@router.get("/assignments", response_model=list[AssignmentSubmissionRead])
def student_assignments(user=Depends(get_current_user), db: Session = Depends(get_db)):
    student = _get_student(user, db)
    subs = db.query(AssignmentSubmission).filter(
        AssignmentSubmission.student_id == student.id
    ).all()
    result = []
    for s in subs:
        result.append(AssignmentSubmissionRead(
            id=s.id, assignment_id=s.assignment_id, student_id=s.student_id,
            status=s.status,
            marks_obtained=float(s.marks_obtained) if s.marks_obtained else None,
            max_marks=float(s.max_marks),
            assignment_title=s.assignment.title if s.assignment else None,
            subject_name=s.assignment.subject.name if s.assignment and s.assignment.subject else None,
            due_date=s.assignment.due_date if s.assignment else None
        ))
    return result


@router.get("/interventions", response_model=list[InterventionRead])
def student_interventions(user=Depends(get_current_user), db: Session = Depends(get_db)):
    student = _get_student(user, db)
    interventions = db.query(Intervention).filter(
        Intervention.student_id == student.id
    ).order_by(Intervention.conducted_at.desc()).all()
    result = []
    for iv in interventions:
        result.append(InterventionRead(
            id=iv.id, student_id=iv.student_id, mentor_id=iv.mentor_id,
            type=iv.type, remarks=iv.remarks,
            risk_score_before=float(iv.risk_score_before),
            conducted_at=iv.conducted_at,
            mentor_name=iv.mentor.name if iv.mentor else None
        ))
    return result


@router.get("/progress")
def student_progress(user=Depends(get_current_user), db: Session = Depends(get_db)):
    student = _get_student(user, db)
    risk_history = db.query(RiskScore).filter(
        RiskScore.student_id == student.id
    ).order_by(RiskScore.computed_at).all()
    interventions = db.query(Intervention).filter(
        Intervention.student_id == student.id
    ).order_by(Intervention.conducted_at).all()
    return {
        "risk_history": [RiskScoreRead.model_validate(r) for r in risk_history],
        "interventions": [InterventionRead(
            id=iv.id, student_id=iv.student_id, mentor_id=iv.mentor_id,
            type=iv.type, remarks=iv.remarks,
            risk_score_before=float(iv.risk_score_before),
            conducted_at=iv.conducted_at,
            mentor_name=iv.mentor.name if iv.mentor else None
        ) for iv in interventions],
    }


@router.get("/suggestions", response_model=list[SuggestionRead])
def student_suggestions(user=Depends(get_current_user), db: Session = Depends(get_db)):
    student = _get_student(user, db)
    latest_risk = db.query(RiskScore).filter(
        RiskScore.student_id == student.id
    ).order_by(RiskScore.computed_at.desc()).first()

    suggestions = []
    if latest_risk:
        att = float(latest_risk.attendance_pct)
        marks = float(latest_risk.marks_pct)
        assign = float(latest_risk.assignment_pct)
        lms = float(latest_risk.lms_score)
        if att < 75:
            suggestions.append(SuggestionRead(
                category="Attendance", priority="high",
                message=f"Your attendance is {att:.0f}%. Attend all upcoming classes to reach 75%."
            ))
        if marks < 50:
            suggestions.append(SuggestionRead(
                category="Marks", priority="high",
                message=f"Internal marks are at {marks:.0f}%. Focus on upcoming exams and assignments."
            ))
        if assign < 60:
            suggestions.append(SuggestionRead(
                category="Assignments", priority="medium",
                message=f"Assignment completion is {assign:.0f}%. Submit all pending work before deadlines."
            ))
        if lms < 40:
            suggestions.append(SuggestionRead(
                category="LMS Activity", priority="medium",
                message=f"LMS score is {lms:.0f}%. Log in daily and engage with course materials."
            ))
    if not suggestions:
        suggestions.append(SuggestionRead(
            category="General", priority="low",
            message="You're doing great! Keep up the consistent effort."
        ))
    return suggestions
