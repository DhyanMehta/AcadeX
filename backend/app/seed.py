"""
Seed script — run with: python -m app.seed
Creates demo data for the hackathon presentation.
"""
import random
from datetime import date, timedelta

from app.core.security import get_password_hash
from app.db.session import SessionLocal
from app.models import (
    Department, User, Class, Student, Subject, AttendanceRecord,
    InternalMark, Assignment, AssignmentSubmission, LmsActivity,
    RiskScore, Alert, Intervention, InterventionOutcome,
)


def seed():
    db = SessionLocal()

    # Check if already seeded
    if db.query(User).first():
        print("Database already seeded. Skipping.")
        db.close()
        return

    print("Seeding database...")
    pw = get_password_hash("password123")

    # Departments
    d1 = Department(name="Computer Science", code="CS")
    d2 = Department(name="Information Technology", code="IT")
    d3 = Department(name="Electronics", code="ECE")
    db.add_all([d1, d2, d3])
    db.flush()

    # Faculty users (teachers / mentors)
    faculty = []
    faculty_names = [
        "Dr. Rajesh Kumar", "Prof. Anita Sharma", "Dr. Vikram Singh",
        "Prof. Meena Patel", "Dr. Suresh Nair", "Prof. Kavita Reddy",
    ]
    for i, name in enumerate(faculty_names):
        u = User(name=name, email=f"faculty{i+1}@acadex.edu",
                 password_hash=pw, role="faculty",
                 department_id=[d1.id, d1.id, d2.id, d2.id, d3.id, d3.id][i])
        db.add(u)
        faculty.append(u)
    db.flush()

    # Coordinator
    coord = User(name="Dr. Priya Deshmukh", email="coordinator@acadex.edu",
                 password_hash=pw, role="coordinator", department_id=d1.id)
    db.add(coord)
    db.flush()

    # Classes
    classes = []
    for dept, sem in [(d1, 3), (d1, 5), (d2, 3), (d2, 5), (d3, 3)]:
        c = Class(name=f"{dept.code}-SEM{sem}", semester=sem, department_id=dept.id)
        db.add(c)
        classes.append(c)
    db.flush()

    # Subjects (3 per class)
    subj_names = [
        ("Data Structures", "CS301"), ("DBMS", "CS302"), ("OS", "CS303"),
        ("Computer Networks", "CS501"), ("AI", "CS502"), ("Cloud Computing", "CS503"),
        ("Web Dev", "IT301"), ("Cyber Security", "IT302"), ("Software Eng", "IT303"),
        ("Information Systems", "IT501"), ("Data Mining", "IT502"), ("Mobile Dev", "IT503"),
        ("Digital Electronics", "ECE301"), ("Signals", "ECE302"), ("Microprocessors", "ECE303"),
    ]
    subjects = []
    for i, cls in enumerate(classes):
        for j in range(3):
            idx = i * 3 + j
            name, code = subj_names[idx]
            teacher_idx = i % len(faculty)
            s = Subject(name=name, code=code, class_id=cls.id, teacher_id=faculty[teacher_idx].id)
            db.add(s)
            subjects.append(s)
    db.flush()

    # Student users + Student records (6 per class = 30 students)
    student_first = ["Aarav", "Vivaan", "Aditya", "Sai", "Arjun", "Diya",
                     "Priya", "Ishaan", "Riya", "Rohan", "Neha", "Kavya",
                     "Amit", "Sneha", "Karan", "Pooja", "Varun", "Meera",
                     "Rahul", "Tanvi", "Dev", "Nisha", "Harsh", "Simran",
                     "Akash", "Swati", "Mohit", "Jaya", "Nikhil", "Ananya"]
    students = []
    for i, cls in enumerate(classes):
        mentor = faculty[i % len(faculty)]
        for j in range(6):
            idx = i * 6 + j
            name = f"{student_first[idx]} Student"
            u = User(name=name, email=f"student{idx+1}@acadex.edu",
                     password_hash=pw, role="student", department_id=cls.department_id)
            db.add(u)
            db.flush()
            s = Student(user_id=u.id, enrollment_no=f"ENR2024{idx+1:04d}",
                        class_id=cls.id, mentor_id=mentor.id)
            db.add(s)
            students.append(s)
    db.flush()

    # Attendance (last 8 weeks, 5 days/week per subject)
    print("  Generating attendance records...")
    today = date.today()
    for student in students:
        # Get subjects for this student
        cls_subjects = [s for s in subjects if s.class_id == student.class_id]
        for subj in cls_subjects:
            for week in range(8):
                for day in range(5):
                    d = today - timedelta(weeks=week, days=day)
                    if d.weekday() < 5:
                        # Vary attendance by student risk profile
                        r = random.random()
                        idx = students.index(student)
                        if idx % 6 < 2:  # high risk students
                            status = "present" if r < 0.55 else ("late" if r < 0.7 else "absent")
                        elif idx % 6 < 4:  # medium risk
                            status = "present" if r < 0.75 else ("late" if r < 0.85 else "absent")
                        else:  # low risk
                            status = "present" if r < 0.92 else ("late" if r < 0.97 else "absent")
                        db.add(AttendanceRecord(student_id=student.id, subject_id=subj.id, date=d, status=status))
    db.flush()

    # Internal marks
    print("  Generating internal marks...")
    for student in students:
        cls_subjects = [s for s in subjects if s.class_id == student.class_id]
        for subj in cls_subjects:
            idx = students.index(student)
            for exam in ["unit_test_1", "unit_test_2", "mid_sem"]:
                max_m = 30 if exam != "mid_sem" else 50
                if idx % 6 < 2:
                    marks = round(random.uniform(8, max_m * 0.5), 1)
                elif idx % 6 < 4:
                    marks = round(random.uniform(max_m * 0.4, max_m * 0.7), 1)
                else:
                    marks = round(random.uniform(max_m * 0.65, max_m * 0.95), 1)
                db.add(InternalMark(student_id=student.id, subject_id=subj.id,
                    entered_by=subj.teacher_id, exam_type=exam, marks_obtained=marks, max_marks=max_m))
    db.flush()

    # Assignments (2 per subject)
    print("  Generating assignments...")
    assignments = []
    for subj in subjects:
        for k in range(2):
            a = Assignment(subject_id=subj.id, title=f"{subj.name} Assignment {k+1}",
                           due_date=today - timedelta(weeks=random.randint(1, 4)))
            db.add(a)
            assignments.append(a)
    db.flush()

    for a in assignments:
        subj = db.query(Subject).filter(Subject.id == a.subject_id).first()
        cls_students = [s for s in students if s.class_id == subj.class_id]
        for s in cls_students:
            idx = students.index(s)
            if idx % 6 < 2:
                status = random.choice(["missing", "missing", "pending", "graded"])
                marks = round(random.uniform(20, 50), 1) if status == "graded" else None
            elif idx % 6 < 4:
                status = random.choice(["pending", "graded", "graded"])
                marks = round(random.uniform(40, 70), 1) if status == "graded" else None
            else:
                status = random.choice(["graded", "graded", "graded", "pending"])
                marks = round(random.uniform(65, 95), 1) if status == "graded" else None
            db.add(AssignmentSubmission(assignment_id=a.id, student_id=s.id,
                status=status, marks_obtained=marks, max_marks=100))
    db.flush()

    # LMS Activity
    print("  Generating LMS activity...")
    for student in students:
        cls_subjects = [s for s in subjects if s.class_id == student.class_id]
        idx = students.index(student)
        for subj in cls_subjects:
            for week in range(8):
                d = today - timedelta(weeks=week)
                if idx % 6 < 2:
                    logins = random.randint(0, 3)
                    score = round(random.uniform(10, 40), 1)
                elif idx % 6 < 4:
                    logins = random.randint(2, 6)
                    score = round(random.uniform(35, 65), 1)
                else:
                    logins = random.randint(4, 10)
                    score = round(random.uniform(60, 95), 1)
                db.add(LmsActivity(student_id=student.id, subject_id=subj.id,
                    activity_date=d, logins=logins, activity_score=score))
    db.flush()

    db.commit()
    print(f"Seeded: {len(students)} students, {len(faculty)} faculty, 1 coordinator")
    print(f"  {len(subjects)} subjects, {len(assignments)} assignments")
    print("Default password for all users: password123")
    print("Done! Now run: POST /risk/compute-all to generate risk scores.")
    db.close()


if __name__ == "__main__":
    seed()
