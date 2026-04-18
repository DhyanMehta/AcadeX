"""Teacher routes — both subject side and mentor side."""
from __future__ import annotations
from typing import Optional

from datetime import date as date_type

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models import (
    Subject, Student, AttendanceRecord, InternalMark,
    Assignment, AssignmentSubmission, RiskScore, Intervention, Alert
)
from app.schemas.common import (
    SubjectRead, StudentRead, AttendanceRead, MarkRead, AssignmentRead,
    AssignmentSubmissionRead, InterventionRead, InterventionCreate,
    AlertRead, AttendanceBulkCreate, MarkBulkCreate, AssignmentCreate,
    AssignmentMarkUpdate, SubjectRiskOverview, RiskScoreRead, AttendanceSummary
)

router = APIRouter(prefix="/teacher", tags=["teacher"])


# ── Subject Side ───────────────────────────────────

@router.get("/subjects", response_model=list[SubjectRead])
def get_my_subjects(user=Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(Subject).filter(Subject.teacher_id == user.id).all()


@router.get("/subjects/{subject_id}/students")
def get_subject_students(subject_id: int, user=Depends(get_current_user), db: Session = Depends(get_db)):
    subject = db.query(Subject).filter(Subject.id == subject_id).first()
    if not subject:
        raise HTTPException(404, "Subject not found")
    students = db.query(Student).filter(Student.class_id == subject.class_id).all()
    return [{"id": s.id, "user_id": s.user_id, "enrollment_no": s.enrollment_no,
             "student_name": s.user.name, "class_name": s.class_.name if s.class_ else ""} for s in students]


@router.get("/subjects/{subject_id}/attendance")
def get_subject_attendance(subject_id: int, date: Optional[date_type] = None,
                           user=Depends(get_current_user), db: Session = Depends(get_db)):
    q = db.query(AttendanceRecord).filter(AttendanceRecord.subject_id == subject_id)
    if date:
        q = q.filter(AttendanceRecord.date == date)
    records = q.order_by(AttendanceRecord.date.desc()).all()
    return [{"id": r.id, "student_id": r.student_id, "date": r.date, "status": r.status,
             "student_name": r.student.user.name if r.student and r.student.user else ""} for r in records]


@router.post("/subjects/{subject_id}/attendance")
def create_attendance(subject_id: int, payload: AttendanceBulkCreate,
                      user=Depends(get_current_user), db: Session = Depends(get_db)):
    records = []
    for entry in payload.records:
        rec = AttendanceRecord(
            student_id=entry.student_id, subject_id=subject_id,
            date=payload.date, status=entry.status
        )
        db.add(rec)
        records.append(rec)
    db.commit()
    return {"message": f"{len(records)} attendance records created", "count": len(records)}


@router.put("/subjects/{subject_id}/attendance/{date}")
def update_attendance(subject_id: int, date: date_type, payload: AttendanceBulkCreate,
                      user=Depends(get_current_user), db: Session = Depends(get_db)):
    # Delete existing for that date/subject
    db.query(AttendanceRecord).filter(
        AttendanceRecord.subject_id == subject_id, AttendanceRecord.date == date
    ).delete()
    for entry in payload.records:
        db.add(AttendanceRecord(
            student_id=entry.student_id, subject_id=subject_id,
            date=payload.date, status=entry.status
        ))
    db.commit()
    return {"message": "Attendance updated"}


@router.get("/subjects/{subject_id}/marks")
def get_subject_marks(subject_id: int, user=Depends(get_current_user), db: Session = Depends(get_db)):
    marks = db.query(InternalMark).filter(InternalMark.subject_id == subject_id).all()
    return [{"id": m.id, "student_id": m.student_id, "exam_type": m.exam_type,
             "marks_obtained": float(m.marks_obtained) if m.marks_obtained else None,
             "max_marks": float(m.max_marks),
             "student_name": m.student.user.name if m.student and m.student.user else ""} for m in marks]


@router.post("/subjects/{subject_id}/marks")
def create_marks(subject_id: int, payload: MarkBulkCreate,
                 user=Depends(get_current_user), db: Session = Depends(get_db)):
    count = 0
    for m in payload.marks:
        db.add(InternalMark(
            student_id=m.student_id, subject_id=subject_id,
            entered_by=user.id, exam_type=m.exam_type,
            marks_obtained=m.marks_obtained, max_marks=m.max_marks
        ))
        count += 1
    db.commit()
    return {"message": f"{count} marks created"}


@router.put("/subjects/{subject_id}/marks/{assessment_id}")
def update_mark(subject_id: int, assessment_id: int, marks_obtained: float,
                user=Depends(get_current_user), db: Session = Depends(get_db)):
    mark = db.query(InternalMark).filter(InternalMark.id == assessment_id).first()
    if not mark:
        raise HTTPException(404, "Mark not found")
    mark.marks_obtained = marks_obtained
    db.commit()
    return {"message": "Mark updated"}


@router.get("/subjects/{subject_id}/assignments")
def get_subject_assignments(subject_id: int, user=Depends(get_current_user), db: Session = Depends(get_db)):
    assignments = db.query(Assignment).filter(Assignment.subject_id == subject_id).all()
    result = []
    for a in assignments:
        subs = db.query(AssignmentSubmission).filter(AssignmentSubmission.assignment_id == a.id).all()
        result.append({
            "id": a.id, "title": a.title, "due_date": a.due_date,
            "total_submissions": len(subs),
            "graded": sum(1 for s in subs if s.status == "graded"),
            "pending": sum(1 for s in subs if s.status == "pending"),
            "missing": sum(1 for s in subs if s.status == "missing"),
        })
    return result


@router.post("/subjects/{subject_id}/assignments")
def create_assignment(subject_id: int, payload: AssignmentCreate,
                      user=Depends(get_current_user), db: Session = Depends(get_db)):
    subject = db.query(Subject).filter(Subject.id == subject_id).first()
    if not subject:
        raise HTTPException(404, "Subject not found")
    assignment = Assignment(subject_id=subject_id, title=payload.title, due_date=payload.due_date)
    db.add(assignment)
    db.flush()
    # Create pending submissions for all students in the class
    students = db.query(Student).filter(Student.class_id == subject.class_id).all()
    for s in students:
        db.add(AssignmentSubmission(
            assignment_id=assignment.id, student_id=s.id,
            status="pending", max_marks=100
        ))
    db.commit()
    return {"message": "Assignment created", "id": assignment.id}


@router.put("/subjects/{subject_id}/assignments/{assignment_id}/marks")
def update_assignment_marks(subject_id: int, assignment_id: int, payload: AssignmentMarkUpdate,
                            user=Depends(get_current_user), db: Session = Depends(get_db)):
    sub = db.query(AssignmentSubmission).filter(
        AssignmentSubmission.assignment_id == assignment_id,
        AssignmentSubmission.student_id == payload.student_id
    ).first()
    if not sub:
        raise HTTPException(404, "Submission not found")
    sub.status = payload.status
    sub.marks_obtained = payload.marks_obtained
    sub.entered_by = user.id
    db.commit()
    return {"message": "Submission updated"}


@router.get("/subjects/{subject_id}/risk-overview", response_model=SubjectRiskOverview)
def subject_risk_overview(subject_id: int, user=Depends(get_current_user), db: Session = Depends(get_db)):
    subject = db.query(Subject).filter(Subject.id == subject_id).first()
    if not subject:
        raise HTTPException(404, "Subject not found")
    students = db.query(Student).filter(Student.class_id == subject.class_id).all()
    high = medium = low = 0
    for s in students:
        risk = db.query(RiskScore).filter(RiskScore.student_id == s.id).order_by(RiskScore.computed_at.desc()).first()
        if risk:
            if risk.risk_label in ("high", "critical"):
                high += 1
            elif risk.risk_label == "medium":
                medium += 1
            else:
                low += 1
        else:
            low += 1
    return SubjectRiskOverview(
        subject_id=subject.id, subject_name=subject.name,
        total_students=len(students), high_risk=high, medium_risk=medium, low_risk=low
    )


# ── Mentor Side ────────────────────────────────────

@router.get("/mentees")
def get_mentees(user=Depends(get_current_user), db: Session = Depends(get_db)):
    students = db.query(Student).filter(Student.mentor_id == user.id).all()
    result = []
    for s in students:
        risk = db.query(RiskScore).filter(RiskScore.student_id == s.id).order_by(RiskScore.computed_at.desc()).first()
        result.append({
            "id": s.id, "user_id": s.user_id, "enrollment_no": s.enrollment_no,
            "student_name": s.user.name, "class_name": s.class_.name if s.class_ else "",
            "risk_score": float(risk.risk_score) if risk else 0,
            "risk_label": risk.risk_label if risk else "low",
        })
    return result


@router.get("/mentees/at-risk")
def get_at_risk_mentees(severity: Optional[str] = None,
                        user=Depends(get_current_user), db: Session = Depends(get_db)):
    students = db.query(Student).filter(Student.mentor_id == user.id).all()
    result = []
    for s in students:
        risk = db.query(RiskScore).filter(RiskScore.student_id == s.id).order_by(RiskScore.computed_at.desc()).first()
        if risk and risk.risk_label in ("medium", "high", "critical"):
            if severity and risk.risk_label != severity:
                continue
            result.append({
                "id": s.id, "enrollment_no": s.enrollment_no,
                "student_name": s.user.name, "class_name": s.class_.name if s.class_ else "",
                "risk_score": float(risk.risk_score), "risk_label": risk.risk_label,
                "ai_explanation": risk.ai_explanation,
            })
    result.sort(key=lambda x: x["risk_score"], reverse=True)
    return result


@router.get("/mentees/{student_id}/profile")
def get_mentee_profile(student_id: int, user=Depends(get_current_user), db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(404, "Student not found")
    risk = db.query(RiskScore).filter(RiskScore.student_id == student.id).order_by(RiskScore.computed_at.desc()).first()
    intervention_count = db.query(Intervention).filter(Intervention.student_id == student.id).count()
    return {
        "id": student.id, "enrollment_no": student.enrollment_no,
        "student_name": student.user.name, "email": student.user.email,
        "class_name": student.class_.name if student.class_ else "",
        "semester": student.class_.semester if student.class_ else 0,
        "risk_score": float(risk.risk_score) if risk else 0,
        "risk_label": risk.risk_label if risk else "low",
        "ai_explanation": risk.ai_explanation if risk else "",
        "intervention_count": intervention_count,
    }


@router.get("/mentees/{student_id}/risk-detail")
def get_mentee_risk_detail(student_id: int, user=Depends(get_current_user), db: Session = Depends(get_db)):
    risk = db.query(RiskScore).filter(
        RiskScore.student_id == student_id
    ).order_by(RiskScore.computed_at.desc()).first()
    if not risk:
        return {"message": "No risk data available"}
    return RiskScoreRead.model_validate(risk)


@router.get("/mentees/{student_id}/interventions", response_model=list[InterventionRead])
def get_mentee_interventions(student_id: int, user=Depends(get_current_user), db: Session = Depends(get_db)):
    result = db.query(Intervention).filter(
        Intervention.student_id == student_id
    ).order_by(Intervention.conducted_at.desc()).all()
    return [InterventionRead(
        id=iv.id, student_id=iv.student_id, mentor_id=iv.mentor_id,
        type=iv.type, remarks=iv.remarks,
        risk_score_before=float(iv.risk_score_before),
        conducted_at=iv.conducted_at,
        mentor_name=iv.mentor.name if iv.mentor else None,
        student_name=iv.student.user.name if iv.student and iv.student.user else None,
    ) for iv in result]


@router.post("/mentees/{student_id}/interventions")
def create_intervention(student_id: int, payload: InterventionCreate,
                        user=Depends(get_current_user), db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(404, "Student not found")
    risk = db.query(RiskScore).filter(
        RiskScore.student_id == student_id
    ).order_by(RiskScore.computed_at.desc()).first()
    risk_before = float(risk.risk_score) if risk else 0

    intervention = Intervention(
        student_id=student_id, mentor_id=user.id,
        type=payload.type, remarks=payload.remarks,
        risk_score_before=risk_before
    )
    db.add(intervention)
    db.commit()
    db.refresh(intervention)
    return {"message": "Intervention recorded", "id": intervention.id}


@router.put("/mentees/{student_id}/interventions/{intervention_id}")
def update_intervention(student_id: int, intervention_id: int, payload: InterventionCreate,
                        user=Depends(get_current_user), db: Session = Depends(get_db)):
    iv = db.query(Intervention).filter(Intervention.id == intervention_id).first()
    if not iv:
        raise HTTPException(404, "Intervention not found")
    iv.type = payload.type
    iv.remarks = payload.remarks
    db.commit()
    return {"message": "Intervention updated"}


@router.get("/mentees/{student_id}/progress")
def get_mentee_progress(student_id: int, user=Depends(get_current_user), db: Session = Depends(get_db)):
    risk_history = db.query(RiskScore).filter(
        RiskScore.student_id == student_id
    ).order_by(RiskScore.computed_at).all()
    interventions = db.query(Intervention).filter(
        Intervention.student_id == student_id
    ).order_by(Intervention.conducted_at).all()
    return {
        "risk_history": [RiskScoreRead.model_validate(r) for r in risk_history],
        "interventions": [InterventionRead(
            id=iv.id, student_id=iv.student_id, mentor_id=iv.mentor_id,
            type=iv.type, remarks=iv.remarks,
            risk_score_before=float(iv.risk_score_before),
            conducted_at=iv.conducted_at,
            mentor_name=iv.mentor.name if iv.mentor else None,
        ) for iv in interventions],
    }


@router.get("/alerts")
def get_mentor_alerts(user=Depends(get_current_user), db: Session = Depends(get_db)):
    alerts = db.query(Alert).filter(
        Alert.mentor_id == user.id
    ).order_by(Alert.triggered_at.desc()).limit(50).all()
    return [AlertRead(
        id=a.id, student_id=a.student_id, mentor_id=a.mentor_id,
        alert_type=a.alert_type, is_read=a.is_read, triggered_at=a.triggered_at,
        student_name=a.student.user.name if a.student and a.student.user else None,
        enrollment_no=a.student.enrollment_no if a.student else None,
    ) for a in alerts]
