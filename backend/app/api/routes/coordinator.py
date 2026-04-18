"""Coordinator analytics routes."""
from __future__ import annotations
from typing import Optional

import csv
import io

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy import func as sql_func
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models import (
    Student, RiskScore, Intervention, InterventionOutcome,
    Alert, Department, Class, Subject, User
)
from app.schemas.common import (
    CoordinatorDashboard, RiskDistribution, DepartmentAnalytics,
    InterventionEffectiveness, MentorActivity, AlertRead
)

router = APIRouter(prefix="/coordinator", tags=["coordinator"])


@router.get("/dashboard", response_model=CoordinatorDashboard)
def coordinator_dashboard(user=Depends(get_current_user), db: Session = Depends(get_db)):
    total_students = db.query(Student).count()

    # Get latest risk for each student using subquery
    from sqlalchemy import distinct
    latest_risks = []
    students = db.query(Student).all()
    at_risk = high_risk = critical_risk = 0
    total_risk_score = 0.0
    scored_count = 0

    for s in students:
        risk = db.query(RiskScore).filter(
            RiskScore.student_id == s.id
        ).order_by(RiskScore.computed_at.desc()).first()
        if risk:
            scored_count += 1
            total_risk_score += float(risk.risk_score)
            if risk.risk_label in ("medium", "high", "critical"):
                at_risk += 1
            if risk.risk_label in ("high", "critical"):
                high_risk += 1
            if risk.risk_label == "critical":
                critical_risk += 1

    avg_risk = round(total_risk_score / scored_count, 2) if scored_count else 0
    total_interventions = db.query(Intervention).count()
    outcomes = db.query(InterventionOutcome).all()
    improved = sum(1 for o in outcomes if float(o.risk_score_after) < float(o.risk_score_before))
    success_rate = round(improved / len(outcomes) * 100, 1) if outcomes else 0
    active_alerts = db.query(Alert).filter(Alert.is_read == False).count()

    return CoordinatorDashboard(
        total_students=total_students, at_risk_count=at_risk,
        high_risk_count=high_risk, critical_risk_count=critical_risk,
        avg_risk_score=avg_risk, total_interventions=total_interventions,
        intervention_success_rate=success_rate, active_alerts=active_alerts
    )


@router.get("/students")
def list_students(class_id: Optional[int] = None, risk_label: Optional[str] = None,
                  user=Depends(get_current_user), db: Session = Depends(get_db)):
    q = db.query(Student)
    if class_id:
        q = q.filter(Student.class_id == class_id)
    students = q.all()
    result = []
    for s in students:
        risk = db.query(RiskScore).filter(
            RiskScore.student_id == s.id
        ).order_by(RiskScore.computed_at.desc()).first()
        label = risk.risk_label if risk else "low"
        if risk_label and label != risk_label:
            continue
        result.append({
            "id": s.id, "enrollment_no": s.enrollment_no,
            "student_name": s.user.name, "email": s.user.email,
            "class_name": s.class_.name if s.class_ else "",
            "semester": s.class_.semester if s.class_ else 0,
            "risk_score": float(risk.risk_score) if risk else 0,
            "risk_label": label,
            "mentor_name": s.mentor.name if s.mentor else "",
        })
    result.sort(key=lambda x: x["risk_score"], reverse=True)
    return result


@router.get("/students/{student_id}/full-profile")
def student_full_profile(student_id: int, user=Depends(get_current_user), db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(404, "Student not found")
    risk = db.query(RiskScore).filter(
        RiskScore.student_id == student.id
    ).order_by(RiskScore.computed_at.desc()).first()
    interventions = db.query(Intervention).filter(
        Intervention.student_id == student.id
    ).order_by(Intervention.conducted_at.desc()).all()
    return {
        "id": student.id, "enrollment_no": student.enrollment_no,
        "student_name": student.user.name, "email": student.user.email,
        "class_name": student.class_.name if student.class_ else "",
        "risk_score": float(risk.risk_score) if risk else 0,
        "risk_label": risk.risk_label if risk else "low",
        "ai_explanation": risk.ai_explanation if risk else "",
        "ai_suggestions": risk.ai_suggestions if risk else "",
        "attendance_pct": float(risk.attendance_pct) if risk else 0,
        "marks_pct": float(risk.marks_pct) if risk else 0,
        "assignment_pct": float(risk.assignment_pct) if risk else 0,
        "lms_score": float(risk.lms_score) if risk else 0,
        "interventions": [{"id": iv.id, "type": iv.type, "remarks": iv.remarks,
                          "conducted_at": iv.conducted_at.isoformat(),
                          "mentor_name": iv.mentor.name if iv.mentor else ""} for iv in interventions],
    }


@router.get("/risk-distribution", response_model=RiskDistribution)
def risk_distribution(user=Depends(get_current_user), db: Session = Depends(get_db)):
    students = db.query(Student).all()
    dist = {"low": 0, "medium": 0, "high": 0, "critical": 0}
    for s in students:
        risk = db.query(RiskScore).filter(
            RiskScore.student_id == s.id
        ).order_by(RiskScore.computed_at.desc()).first()
        label = risk.risk_label if risk else "low"
        dist[label] = dist.get(label, 0) + 1
    return RiskDistribution(**dist)


@router.get("/departments", response_model=list[DepartmentAnalytics])
def department_analytics(user=Depends(get_current_user), db: Session = Depends(get_db)):
    depts = db.query(Department).all()
    result = []
    for d in depts:
        classes = db.query(Class).filter(Class.department_id == d.id).all()
        class_ids = [c.id for c in classes]
        students = db.query(Student).filter(Student.class_id.in_(class_ids)).all() if class_ids else []
        total = len(students)
        total_score = 0.0
        high = 0
        scored = 0
        for s in students:
            risk = db.query(RiskScore).filter(
                RiskScore.student_id == s.id
            ).order_by(RiskScore.computed_at.desc()).first()
            if risk:
                scored += 1
                total_score += float(risk.risk_score)
                if risk.risk_label in ("high", "critical"):
                    high += 1
        result.append(DepartmentAnalytics(
            department_id=d.id, department_name=d.name,
            total_students=total,
            avg_risk_score=round(total_score / scored, 2) if scored else 0,
            high_risk_count=high
        ))
    return result


@router.get("/subjects/risk-overview")
def subjects_risk_overview(user=Depends(get_current_user), db: Session = Depends(get_db)):
    subjects = db.query(Subject).all()
    result = []
    for subj in subjects:
        students = db.query(Student).filter(Student.class_id == subj.class_id).all()
        high = medium = low = 0
        for s in students:
            risk = db.query(RiskScore).filter(
                RiskScore.student_id == s.id
            ).order_by(RiskScore.computed_at.desc()).first()
            if risk:
                if risk.risk_label in ("high", "critical"):
                    high += 1
                elif risk.risk_label == "medium":
                    medium += 1
                else:
                    low += 1
            else:
                low += 1
        result.append({
            "subject_id": subj.id, "subject_name": subj.name, "subject_code": subj.code,
            "total_students": len(students), "high_risk": high, "medium_risk": medium, "low_risk": low
        })
    return result


@router.get("/interventions")
def all_interventions(user=Depends(get_current_user), db: Session = Depends(get_db)):
    interventions = db.query(Intervention).order_by(Intervention.conducted_at.desc()).limit(100).all()
    return [{"id": iv.id, "student_name": iv.student.user.name if iv.student and iv.student.user else "",
             "mentor_name": iv.mentor.name if iv.mentor else "",
             "type": iv.type, "remarks": iv.remarks,
             "risk_score_before": float(iv.risk_score_before),
             "conducted_at": iv.conducted_at.isoformat()} for iv in interventions]


@router.get("/interventions/effectiveness", response_model=InterventionEffectiveness)
def intervention_effectiveness(user=Depends(get_current_user), db: Session = Depends(get_db)):
    total = db.query(Intervention).count()
    outcomes = db.query(InterventionOutcome).all()
    improved = sum(1 for o in outcomes if float(o.risk_score_after) < float(o.risk_score_before))
    avg_improvement = 0.0
    if outcomes:
        avg_improvement = round(
            sum(float(o.risk_score_before) - float(o.risk_score_after) for o in outcomes) / len(outcomes), 2
        )

    # By type
    type_stats = {}
    for o in outcomes:
        iv = db.query(Intervention).filter(Intervention.id == o.intervention_id).first()
        if iv:
            t = iv.type
            if t not in type_stats:
                type_stats[t] = {"type": t, "count": 0, "improved": 0, "avg_improvement": 0}
            type_stats[t]["count"] += 1
            imp = float(o.risk_score_before) - float(o.risk_score_after)
            type_stats[t]["avg_improvement"] += imp
            if imp > 0:
                type_stats[t]["improved"] += 1

    by_type = []
    for t, stats in type_stats.items():
        stats["avg_improvement"] = round(stats["avg_improvement"] / stats["count"], 2) if stats["count"] else 0
        by_type.append(stats)

    return InterventionEffectiveness(
        total_interventions=total, with_outcomes=len(outcomes),
        avg_score_improvement=avg_improvement,
        success_rate=round(improved / len(outcomes) * 100, 1) if outcomes else 0,
        by_type=by_type
    )


@router.get("/teachers/mentor-activity", response_model=list[MentorActivity])
def mentor_activity(user=Depends(get_current_user), db: Session = Depends(get_db)):
    mentors = db.query(User).filter(User.role == "faculty").all()
    result = []
    for m in mentors:
        mentees = db.query(Student).filter(Student.mentor_id == m.id).all()
        at_risk = 0
        for s in mentees:
            risk = db.query(RiskScore).filter(
                RiskScore.student_id == s.id
            ).order_by(RiskScore.computed_at.desc()).first()
            if risk and risk.risk_label in ("medium", "high", "critical"):
                at_risk += 1
        iv_count = db.query(Intervention).filter(Intervention.mentor_id == m.id).count()
        last_iv = db.query(Intervention).filter(
            Intervention.mentor_id == m.id
        ).order_by(Intervention.conducted_at.desc()).first()
        result.append(MentorActivity(
            mentor_id=m.id, mentor_name=m.name,
            total_mentees=len(mentees), at_risk_mentees=at_risk,
            interventions_count=iv_count,
            last_intervention=last_iv.conducted_at if last_iv else None
        ))
    return result


@router.get("/alerts")
def coordinator_alerts(user=Depends(get_current_user), db: Session = Depends(get_db)):
    alerts = db.query(Alert).order_by(Alert.triggered_at.desc()).limit(100).all()
    return [AlertRead(
        id=a.id, student_id=a.student_id, mentor_id=a.mentor_id,
        alert_type=a.alert_type, is_read=a.is_read, triggered_at=a.triggered_at,
        student_name=a.student.user.name if a.student and a.student.user else None,
        enrollment_no=a.student.enrollment_no if a.student else None,
    ) for a in alerts]


@router.get("/reports/export")
def export_report(format: str = "csv", user=Depends(get_current_user), db: Session = Depends(get_db)):
    students = db.query(Student).all()
    rows = []
    for s in students:
        risk = db.query(RiskScore).filter(
            RiskScore.student_id == s.id
        ).order_by(RiskScore.computed_at.desc()).first()
        rows.append({
            "enrollment_no": s.enrollment_no,
            "student_name": s.user.name,
            "class": s.class_.name if s.class_ else "",
            "risk_score": float(risk.risk_score) if risk else 0,
            "risk_label": risk.risk_label if risk else "low",
            "attendance_pct": float(risk.attendance_pct) if risk else 0,
            "marks_pct": float(risk.marks_pct) if risk else 0,
            "assignment_pct": float(risk.assignment_pct) if risk else 0,
            "lms_score": float(risk.lms_score) if risk else 0,
            "explanation": risk.ai_explanation if risk else "",
        })

    if format == "csv":
        output = io.StringIO()
        if rows:
            writer = csv.DictWriter(output, fieldnames=rows[0].keys())
            writer.writeheader()
            writer.writerows(rows)
        output.seek(0)
        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=risk_report.csv"}
        )
    else:
        return rows
