from __future__ import annotations
from datetime import date, datetime
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict


# ─── Setup ──────────────────────────────────────────
class DepartmentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    code: str


class ClassRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    semester: int
    department_id: int


class SubjectRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    code: str
    class_id: int
    teacher_id: int


# ─── Student ────────────────────────────────────────
class StudentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    user_id: int
    enrollment_no: str
    class_id: int
    mentor_id: int
    student_name: Optional[str] = None
    class_name: Optional[str] = None


class RiskScoreRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    student_id: int
    attendance_pct: float
    marks_pct: float
    assignment_pct: float
    lms_score: float
    risk_score: float
    risk_label: str
    ai_explanation: str
    ai_suggestions: str
    model_version: str
    computed_at: datetime


class AttendanceRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    student_id: int
    subject_id: int
    date: date
    status: str
    subject_name: Optional[str] = None


class AttendanceSummary(BaseModel):
    subject_id: int
    subject_name: str
    total: int
    present: int
    absent: int
    late: int
    percentage: float


class MarkRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    student_id: int
    subject_id: int
    exam_type: str
    marks_obtained: Optional[float]
    max_marks: float
    subject_name: Optional[str] = None


class AssignmentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    subject_id: int
    title: str
    due_date: date
    subject_name: Optional[str] = None


class AssignmentSubmissionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    assignment_id: int
    student_id: int
    status: str
    marks_obtained: Optional[float]
    max_marks: float
    assignment_title: Optional[str] = None
    subject_name: Optional[str] = None
    due_date: Optional[date] = None


class InterventionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    student_id: int
    mentor_id: int
    type: str
    remarks: str
    risk_score_before: float
    conducted_at: datetime
    mentor_name: Optional[str] = None
    student_name: Optional[str] = None


class InterventionCreate(BaseModel):
    type: Literal["counselling", "remedial_class", "assignment_extension", "parent_meeting", "academic_support", "other"]
    remarks: str


class InterventionOutcomeRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    intervention_id: int
    student_id: int
    risk_score_before: float
    risk_score_after: float
    risk_label_before: str
    risk_label_after: str
    measured_at: datetime


class InterventionOutcomeCreate(BaseModel):
    risk_score_after: float
    risk_label_after: Literal["low", "medium", "high", "critical"]


class AlertRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    student_id: int
    mentor_id: int
    alert_type: str
    is_read: bool
    triggered_at: datetime
    student_name: Optional[str] = None
    enrollment_no: Optional[str] = None


class SuggestionRead(BaseModel):
    category: str
    message: str
    priority: str


class ProgressRead(BaseModel):
    risk_history: list[RiskScoreRead]
    interventions: list[InterventionRead]


# ─── Teacher ────────────────────────────────────────
class AttendanceBulkEntry(BaseModel):
    student_id: int
    status: Literal["present", "absent", "late"]


class AttendanceBulkCreate(BaseModel):
    date: date
    records: list[AttendanceBulkEntry]


class MarkCreate(BaseModel):
    student_id: int
    exam_type: Literal["unit_test_1", "unit_test_2", "mid_sem", "practical", "assignment", "viva", "end_sem"]
    marks_obtained: float
    max_marks: float


class MarkBulkCreate(BaseModel):
    marks: list[MarkCreate]


class AssignmentCreate(BaseModel):
    title: str
    due_date: date


class AssignmentMarkUpdate(BaseModel):
    student_id: int
    status: Literal["pending", "graded", "missing"]
    marks_obtained: Optional[float] = None
    max_marks: float = 100


class SubjectRiskOverview(BaseModel):
    subject_id: int
    subject_name: str
    total_students: int
    high_risk: int
    medium_risk: int
    low_risk: int


class MenteeRiskDetail(BaseModel):
    student: StudentRead
    latest_risk: Optional[RiskScoreRead]
    attendance_summary: list[AttendanceSummary]
    recent_marks: list[MarkRead]
    pending_assignments: int
    total_assignments: int


# ─── LMS ────────────────────────────────────────────
class LmsActivityCreate(BaseModel):
    subject_id: int
    activity_date: date
    logins: int = 0
    activity_score: float = 0.0


class LmsActivityRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    student_id: int
    subject_id: int
    activity_date: date
    logins: int
    activity_score: float


class LmsBulkCreate(BaseModel):
    records: list[dict]


# ─── Coordinator ────────────────────────────────────
class CoordinatorDashboard(BaseModel):
    total_students: int
    at_risk_count: int
    high_risk_count: int
    critical_risk_count: int
    avg_risk_score: float
    total_interventions: int
    intervention_success_rate: float
    active_alerts: int


class RiskDistribution(BaseModel):
    low: int
    medium: int
    high: int
    critical: int


class DepartmentAnalytics(BaseModel):
    department_id: int
    department_name: str
    total_students: int
    avg_risk_score: float
    high_risk_count: int


class InterventionEffectiveness(BaseModel):
    total_interventions: int
    with_outcomes: int
    avg_score_improvement: float
    success_rate: float
    by_type: list[dict]


class MentorActivity(BaseModel):
    mentor_id: int
    mentor_name: str
    total_mentees: int
    at_risk_mentees: int
    interventions_count: int
    last_intervention: Optional[datetime]


# ─── ML ─────────────────────────────────────────────
class MLPredictionResult(BaseModel):
    student_id: int
    risk_label: str
    confidence: dict[str, float]
    risk_score: float
    shap_explanations: list[dict]
    suggestions: list[str]


class MLTrendResult(BaseModel):
    student_id: int
    predicted_next_score: float
    trend: str
    alert_needed: bool


class MessageResponse(BaseModel):
    message: str
