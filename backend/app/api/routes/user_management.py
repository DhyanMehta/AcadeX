"""User management routes — coordinator can add students and teachers."""
from __future__ import annotations
import random
import string
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models import User, Student, Class, Department
from app.core.security import get_password_hash
from app.services.email_service import send_credentials_email

router = APIRouter(prefix="/coordinator/users", tags=["user-management"])


def _generate_password(length: int = 10) -> str:
    chars = string.ascii_letters + string.digits + "!@#$"
    return "".join(random.choices(chars, k=length))


# ── Schemas ────────────────────────────────────────────────────────────────

class AddStudentRequest(BaseModel):
    name: str
    email: EmailStr
    enrollment_no: str
    class_id: int
    mentor_id: int
    department_id: Optional[int] = None


class AddTeacherRequest(BaseModel):
    name: str
    email: EmailStr
    department_id: Optional[int] = None


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


# ── Endpoints ──────────────────────────────────────────────────────────────

@router.get("/list")
def list_users(role: Optional[str] = None, user=Depends(get_current_user), db: Session = Depends(get_db)):
    """List all users, optionally filtered by role."""
    q = db.query(User)
    if role:
        q = q.filter(User.role == role)
    users = q.order_by(User.created_at.desc()).all()
    return [
        {
            "id": u.id,
            "name": u.name,
            "email": u.email,
            "role": u.role,
            "is_active": u.is_active,
            "must_change_password": u.must_change_password,
            "department_id": u.department_id,
            "created_at": u.created_at.isoformat(),
        }
        for u in users
    ]


@router.post("/add-student")
def add_student(
    payload: AddStudentRequest,
    background_tasks: BackgroundTasks,
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Check email not already used
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(400, f"Email {payload.email} is already registered.")
    # Check enrollment not duplicate
    if db.query(Student).filter(Student.enrollment_no == payload.enrollment_no).first():
        raise HTTPException(400, f"Enrollment number {payload.enrollment_no} already exists.")
    # Validate class exists
    cls = db.query(Class).filter(Class.id == payload.class_id).first()
    if not cls:
        raise HTTPException(404, "Class not found.")
    # Validate mentor exists
    mentor = db.query(User).filter(User.id == payload.mentor_id, User.role == "faculty").first()
    if not mentor:
        raise HTTPException(404, "Mentor (faculty) not found.")

    temp_password = _generate_password()

    # Create user account
    new_user = User(
        name=payload.name,
        email=payload.email,
        password_hash=get_password_hash(temp_password),
        role="student",
        department_id=payload.department_id or cls.department_id,
        is_active=True,
        must_change_password=True,
    )
    db.add(new_user)
    db.flush()  # get new_user.id

    # Create student profile
    student = Student(
        user_id=new_user.id,
        enrollment_no=payload.enrollment_no,
        class_id=payload.class_id,
        mentor_id=payload.mentor_id,
    )
    db.add(student)
    db.commit()

    # Send email in background
    background_tasks.add_task(
        send_credentials_email,
        to_email=payload.email,
        name=payload.name,
        role="student",
        temp_password=temp_password,
    )

    return {
        "message": f"Student {payload.name} created successfully. Credentials email queued.",
        "user_id": new_user.id,
        "student_id": student.id,
        "temp_password": temp_password,  # shown in UI in case email fails
    }


@router.post("/add-teacher")
def add_teacher(
    payload: AddTeacherRequest,
    background_tasks: BackgroundTasks,
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(400, f"Email {payload.email} is already registered.")

    temp_password = _generate_password()

    new_user = User(
        name=payload.name,
        email=payload.email,
        password_hash=get_password_hash(temp_password),
        role="faculty",
        department_id=payload.department_id,
        is_active=True,
        must_change_password=True,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    background_tasks.add_task(
        send_credentials_email,
        to_email=payload.email,
        name=payload.name,
        role="faculty",
        temp_password=temp_password,
    )

    return {
        "message": f"Teacher {payload.name} created successfully. Credentials email queued.",
        "user_id": new_user.id,
        "temp_password": temp_password,
    }


@router.put("/toggle-active/{user_id}")
def toggle_active(user_id: int, user=Depends(get_current_user), db: Session = Depends(get_db)):
    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(404, "User not found")
    target.is_active = not target.is_active
    db.commit()
    return {"message": f"User {'activated' if target.is_active else 'deactivated'}.", "is_active": target.is_active}


class ChangeMentorRequest(BaseModel):
    mentor_id: int


@router.put("/{user_id}/change-mentor")
def change_mentor(user_id: int, payload: ChangeMentorRequest, user=Depends(get_current_user), db: Session = Depends(get_db)):
    """Change the assigned mentor for a student (identified by their user_id)."""
    student = db.query(Student).filter(Student.user_id == user_id).first()
    if not student:
        raise HTTPException(404, "Student record not found for this user.")
    mentor = db.query(User).filter(User.id == payload.mentor_id, User.role == "faculty").first()
    if not mentor:
        raise HTTPException(404, "Mentor (faculty user) not found.")
    student.mentor_id = payload.mentor_id
    db.commit()
    return {"message": f"Mentor updated to {mentor.name} successfully."}
