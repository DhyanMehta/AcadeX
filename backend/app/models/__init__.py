from app.models.department import Department
from app.models.user import User
from app.models.class_ import Class
from app.models.student import Student
from app.models.subject import Subject
from app.models.attendance import AttendanceRecord
from app.models.internal_mark import InternalMark
from app.models.assignment import Assignment, AssignmentSubmission
from app.models.lms_activity import LmsActivity
from app.models.risk_score import RiskScore
from app.models.alert import Alert
from app.models.intervention import Intervention, InterventionOutcome

__all__ = [
    "Department", "User", "Class", "Student", "Subject",
    "AttendanceRecord", "InternalMark", "Assignment", "AssignmentSubmission",
    "LmsActivity", "RiskScore", "Alert", "Intervention", "InterventionOutcome",
]
