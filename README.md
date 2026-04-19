# AcadeX — Academic Early Risk Detection & Monitoring Platform

> A full-stack web application that uses Machine Learning to detect academically at-risk students early, empowering teachers, coordinators, and parents with real-time dashboards and intervention tools.

---

## 📌 Table of Contents

1. [Overview](#overview)
2. [Key Features](#key-features)
3. [Tech Stack](#tech-stack)
4. [Architecture](#architecture)
5. [Roles & Dashboards](#roles--dashboards)
6. [Risk Engine & ML Pipeline](#risk-engine--ml-pipeline)
7. [Automation (n8n)](#automation-n8n)
8. [Project Structure](#project-structure)
9. [Getting Started](#getting-started)
10. [Database Setup](#database-setup)
11. [Seed Data](#seed-data)
12. [Environment Variables](#environment-variables)
13. [API Overview](#api-overview)
14. [Default Credentials](#default-credentials)

---

## Overview

**AcadeX** is a role-based academic monitoring platform built for colleges and universities. It continuously tracks each student's:

- **Attendance** — percentage across all subjects
- **Internal Marks** — across unit tests, mid-sem, practicals, and viva
- **Assignment Completion** — graded vs. pending vs. missing
- **LMS Activity** — login frequency and engagement score

These four signals are fed into a Machine Learning pipeline (XGBoost + Neural Network) that computes a **Risk Score (0–100)** and a **Risk Label** (Low / Medium / High). Teachers and coordinators can then log interventions, track outcomes, and schedule parent meetings — all from within the platform.

---

## Key Features

| Feature | Description |
|---|---|
| 🔐 **Role-Based Auth** | JWT authentication, 4 roles: Student, Faculty, Coordinator, Guardian |
| 📊 **Risk Scoring** | ML model combines 4 academic signals → 0–100 risk score |
| 🧠 **AI Remarks** | SHAP-based explanation + GPT-style suggestions per student |
| 🎓 **Student Dashboard** | SVG gauge, remarks, attendance trend, subject marks, assignments |
| 👩‍🏫 **Teacher Dashboard** | Mentee list, risk chips, subject marks entry, assignment grading, interventions, meeting scheduler |
| 🗂️ **Coordinator Dashboard** | Institution-wide analytics, department stats, all-students table, interventions tracker, export to CSV |
| 👪 **Guardian Dashboard** | Child's risk overview, attendance pie, subject marks bar chart, suggestions |
| 📅 **Meeting Scheduler** | Teacher schedules parent meetings → auto-creates Google Calendar events via n8n webhook |
| 📤 **CSV Export** | Coordinator can download full student risk report |
| 💀 **Skeleton UI** | All pages have polished loading states (no blank screens) |
| 🎨 **Light Theme** | Professional white/dark-text UI, no gradients, consistent color system |

---

## Tech Stack

### Frontend
| Layer | Technology |
|---|---|
| Framework | React 18 (Create React App) |
| Routing | React Router v6 |
| Charts | Recharts (Pie, Bar, Line, RadialBar) |
| Icons | react-icons (Feather Icon set) |
| Styling | Vanilla CSS (CSS Variables design system) |
| HTTP | Axios |
| Auth | JWT stored in `localStorage`, React Context API |

### Backend
| Layer | Technology |
|---|---|
| Framework | FastAPI 0.116 |
| ORM | SQLAlchemy 2.0 |
| Database | PostgreSQL |
| Auth | python-jose (JWT), passlib (bcrypt) |
| Validation | Pydantic v2 |
| Server | Uvicorn |

### Machine Learning
| Layer | Technology |
|---|---|
| Risk Model | XGBoost Classifier |
| Neural Net | TensorFlow / Keras |
| Explainability | SHAP |
| Feature Engineering | scikit-learn, NumPy |
| Notebook | Jupyter (Early_Risk_Detection.ipynb) |

### Automation
| Tool | Purpose |
|---|---|
| n8n (cloud) | Webhook-triggered Google Calendar event creation for parent meetings |

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    React Frontend                        │
│  Login → Role Router → Dashboard (Student/Teacher/       │
│          Coordinator/Guardian)                           │
└────────────────────┬────────────────────────────────────┘
                     │ Axios (JWT Bearer)
                     ▼
┌─────────────────────────────────────────────────────────┐
│                 FastAPI Backend                          │
│  /auth  /student  /teacher  /coordinator                 │
│  /guardian  /risk  /ml  /lms  /alerts                   │
└────────────────────┬────────────────────────────────────┘
                     │ SQLAlchemy ORM
                     ▼
┌─────────────────────────────────────────────────────────┐
│               PostgreSQL Database                        │
│  users · students · classes · subjects · departments     │
│  attendance_records · internal_marks · assignments       │
│  assignment_submissions · lms_activity · risk_scores     │
│  alerts · interventions · intervention_outcomes          │
└─────────────────────────────────────────────────────────┘
                     │
┌─────────────────────────────────────────────────────────┐
│             ML Service (models/)                         │
│  XGBoost + Neural Net → risk_score, risk_label           │
│  SHAP → ai_explanation, ai_suggestions                   │
└─────────────────────────────────────────────────────────┘
```

---

## Roles & Dashboards

### 🎓 Student
- Risk gauge (SVG arc), score, risk label badge
- Remarks (AI explanation + suggestions)
- Attendance trend (line chart, 8 weeks)
- Subject-wise marks (bar chart)
- Assignment status breakdown
- Improvement suggestions list

### 👩‍🏫 Teacher / Faculty (Mentor)
- **Dashboard**: Mentee risk distribution (donut), recent alerts
- **Mentees**: Full list with risk chips, expand for details + intervention log
- **Subjects**: Marks entry, attendance bulk upload, assignment creation & grading
- **Analytics**: Avg marks bar chart, assignment completion bar chart
- **Meeting Scheduler**: Pick mentee + date/time → triggers n8n → Google Calendar invite

### 🗂️ Coordinator
- **Dashboard**: Key stats (total students, at-risk, high-risk, avg score), risk distribution donut chart, department analytics bar chart
- **All Students**: Paginated table with filters (dept / class / mentor / risk level), risk chips
- **Department View**: Click a department card → see all its students with full risk data
- **Interventions**: Timeline of all interventions across the institution
- **Teachers**: Mentor activity table (mentees count, at-risk count, interventions)
- **Export**: One-click CSV download of all student risk data

### 👪 Guardian (Parent)
- Child's risk overview card (level, description, icon)
- 4 stat cards: attendance %, assignments done, missing work, avg marks
- Attendance pie chart (Present vs. Absent)
- Subject-wise marks bar chart (colored by performance)
- Subject-wise attendance progress bars
- Improvement suggestions

---

## Risk Engine & ML Pipeline

### Feature Vector (per student)
| Feature | Calculation |
|---|---|
| `attendance_pct` | present\_records / total\_records × 100 |
| `marks_pct` | sum(marks\_obtained) / sum(max\_marks) × 100 |
| `assignment_pct` | graded\_submissions / total\_submissions × 100 |
| `lms_score` | average(activity\_score) across all LMS records |

### Models
1. **XGBoost Classifier** — primary risk label predictor (Low / Medium / High)
2. **Neural Network** (TensorFlow) — complementary probability estimator
3. **SHAP** — generates per-feature contribution explanations

### Risk Labels
| Score Range | Label | Color |
|---|---|---|
| 0 – 33 | Low | 🟢 Green `#16a34a` |
| 34 – 66 | Medium | 🟡 Amber `#d97706` |
| 67 – 100 | High | 🔴 Red `#dc2626` |

### Computing Risk
```
POST /risk/compute/{student_id}   — Compute for one student
POST /risk/compute-all            — Compute for ALL students (run after seeding)
```

---

## Automation (n8n)

Parent meeting scheduling is powered by an **n8n cloud workflow**:

1. Teacher fills the meeting scheduler form (mentee, date, time, reason)
2. Frontend sends a `POST` request to the n8n production webhook:
   ```
   https://anshu21666.app.n8n.cloud/webhook/eacc44d3-a0a6-4e8a-a230-e18ae861eeaa
   ```
3. n8n creates a **Google Calendar event** for the teacher and sends a confirmation

---

## Project Structure

```
AcadeX/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── routes/         # auth, coordinator, teacher, student,
│   │   │                       # guardian, risk, lms, alerts, user_management
│   │   ├── core/               # config, security (JWT + bcrypt)
│   │   ├── db/                 # SQLAlchemy engine & session
│   │   ├── models/             # ORM models (14 tables)
│   │   ├── schemas/            # Pydantic request/response schemas
│   │   ├── services/           # ml_service.py (XGBoost, SHAP, ANN)
│   │   ├── main.py             # FastAPI app, CORS, lifespan, routes
│   │   ├── seed.py             # Base demo data (30 students, 6 teachers)
│   │   └── seed_extended.py    # Extended data (350 students, 10 teachers)
│   ├── requirements.txt
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Login.js
│   │   │   ├── StudentDashboard.js
│   │   │   ├── TeacherDashboard.js
│   │   │   ├── CoordinatorDashboard.js
│   │   │   ├── GuardianDashboard.js
│   │   │   ├── UserManagement.js
│   │   │   ├── ChangePasswordModal.js
│   │   │   ├── ResetPassword.js
│   │   │   └── Skeleton.js
│   │   ├── AuthContext.js      # JWT decode, role routing, login/logout
│   │   ├── api.js              # Axios instance with auth interceptor
│   │   ├── App.js              # Route definitions
│   │   └── index.css           # Full design system (CSS variables, components)
│   └── package.json
│
├── Database/
│   └── Table_Creation.sql      # PostgreSQL schema (14 tables, indexes, triggers)
│
├── Machine Learning/
│   ├── Early_Risk_Detection.ipynb
│   └── README.md
│
└── Models/                     # Trained XGBoost & ANN model files
```

---

## Getting Started

### Prerequisites
- Python 3.9+
- Node.js 18+
- PostgreSQL 14+

### 1. Clone the Repository
```bash
git clone <repo-url>
cd AcadeX
```

### 2. Backend Setup
```bash
cd backend

# Create and activate virtual environment
python -m venv venv
.\venv\Scripts\activate        # Windows
# source venv/bin/activate     # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Edit .env with your PostgreSQL credentials

# Run the server
uvicorn app.main:app --reload --port 8000
```

### 3. Frontend Setup
```bash
cd frontend

npm install
npm start
# Opens at http://localhost:3000
```

---

## Database Setup

```bash
# 1. Create the database in PostgreSQL
psql -U postgres -c "CREATE DATABASE ts12_academic_risk;"

# 2. Run the schema
psql -U postgres -d ts12_academic_risk -f Database/Table_Creation.sql
```

---

## Seed Data

```bash
cd backend
.\venv\Scripts\activate

# Base seed — 30 students, 6 teachers, 3 departments
python -m app.seed

# Extended seed — 350 more students, 10 more teachers, 2 more departments (ME, CE)
python -m app.seed_extended

# Compute risk scores for all students (REQUIRED after seeding)
# Via API or curl:
curl -X POST http://localhost:8000/risk/compute-all \
  -H "Authorization: Bearer <coordinator_token>"
```

---

## Environment Variables

Create `backend/.env` from the example:

```env
DATABASE_URL=postgresql+psycopg2://postgres:<password>@localhost:5432/ts12_academic_risk
JWT_SECRET_KEY=your-secret-key-here
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
BACKEND_CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

---

## API Overview

| Prefix | Description |
|---|---|
| `POST /auth/login` | Login, returns JWT token |
| `GET /student/*` | Student dashboard, marks, attendance, assignments |
| `GET /teacher/*` | Subjects, mentees, marks entry, interventions, alerts |
| `GET /coordinator/*` | Institution analytics, all students, departments, export |
| `GET /guardian/*` | Child's data (risk, marks, attendance, suggestions) |
| `POST /risk/compute/{id}` | Compute risk score for one student |
| `POST /risk/compute-all` | Compute risk scores for all students |
| `GET /ml/predict/{id}` | Raw ML prediction for a student |
| `GET /lms/*` | LMS activity data |

Full API docs available at: `http://localhost:8000/docs`

---

## Default Credentials

> All accounts use the password: **`password123`**

| Role | Email |
|---|---|
| Coordinator | `coordinator@acadex.edu` |
| Teacher 1 | `faculty1@acadex.edu` |
| Teacher 2 | `faculty2@acadex.edu` |
| ... | `faculty3` – `faculty16@acadex.edu` |
| Student 1 | `student1@acadex.edu` |
| Students (extended) | `xs20250001@acadex.edu` onwards |

---

## License

This project was built for a hackathon. All rights reserved © AcadeX Team.
