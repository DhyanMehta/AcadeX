from __future__ import annotations
from typing import Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models import Department, Class, Subject
from app.schemas.common import DepartmentRead, ClassRead, SubjectRead

router = APIRouter(prefix="/setup", tags=["setup"])


@router.get("/departments", response_model=list[DepartmentRead])
def get_departments(db: Session = Depends(get_db)):
    return db.query(Department).all()


@router.get("/classes", response_model=list[ClassRead])
def get_classes(department_id: Optional[int] = None, db: Session = Depends(get_db)):
    q = db.query(Class)
    if department_id:
        q = q.filter(Class.department_id == department_id)
    return q.order_by(Class.semester).all()


@router.get("/classes/{class_id}/subjects", response_model=list[SubjectRead])
def get_class_subjects(class_id: int, db: Session = Depends(get_db)):
    return db.query(Subject).filter(Subject.class_id == class_id).all()
