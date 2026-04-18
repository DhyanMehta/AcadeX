# AcadeX - Early Academic Risk Detection & Student Intervention Platform

AcadeX is a unified system designed to continuously analyze academic signals, detect early risk trends, and provide clear reasons for interventions. By leveraging Machine Learning (XGBoost) and predictive analytics, AcadeX empowers educational institutions to enact proactive academic support, drastically improving overall student outcomes and ensuring that struggling students are identified before their performance and morale decline.

## 🚀 The Problem & Solution

**The Problem:** In many universities, academically at-risk students are identified far too late. Key indicators—declining attendance, lagging internal marks, missed assignments, or poor LMS activity—are scattered and siloed, causing faculty mentors to rely on delayed reports, ultimately resulting in untimely interventions.

**The Solution:** AcadeX predicts academic risk early utilizing an automated multi-factor scoring engine. Instead of a simple "score," it displays highly **explainable insights** through AI, highlighting exact contributing factors (e.g., "Attendance dropped to 60%") enabling mentors to take swift, effective, and guided action.

---

## 🎯 Core Features

### 🧠 Predictive Risk Engine & Explainability
- **Multi-Factor Risk Scoring:** Analyzes student attendance %, internal marks, assignment completion rates, and LMS activities to construct an overall risk label (Low, Medium, High, Critical).
- **Explainable AI (XAI):** Leveraging SHAP values, risk scores are unpacked into human-readable insights (e.g., “Risk is Critical primarily due to 45% exam marks and 50% LMS interaction”).

### 📊 Multi-Stakeholder Portals
- **Student Dashboard:** Self-view portal to track progress, personal risk scores, explanations, and tailored AI-generated recommendations to improve.
- **Faculty Mentor Panel:** Interactive dashboard filtering mentees by risk severity, enabling swift identification and documentation of mentorship interventions.
- **Subject Teacher View:** Upload functionality for assessment marks and attendance, along with subject-specific risk demographics analysis.
- **Academic Coordinator Analytics:** Department-wide and institution-level drill-down reports to monitor overall performance, detect macro academic trends, and measure intervention effectiveness.

### 🛠 Action Tracking & Timely Alerts
- **Intervention Lifecycle Tracking:** Mentors can log sessions, counseling events, or assignment extensions. AcadeX compares pre/post intervention metrics to track true effectiveness.
- **Automated Alerts System:** Sends real-time alerts to mentors natively for any student flagged as moving into the High or Critical risk bands naturally.

---

## 💻 Tech Stack

- **Frontend:** React.js
- **Backend API:** Python, FastAPI, SQLAlchemy
- **Database:** PostgreSQL
- **Machine Learning Engine:** XGBoost (Classification/Prediction) & SHAP (Explainability Insights)

---

## ⚙️ Getting Started

### Prerequisites
- Node.js (v18+)
- Python (v3.10+)
- PostgreSQL Server

### 1. Backend Setup (FastAPI)

Navigate to the `backend` directory, set up your Python virtual environment, install the dependencies, and start up the app.

```bash
cd backend
python -m venv .venv

# Activate the virtual environment
# Windows: .\.venv\Scripts\activate.ps1
# Mac/Linux: source .venv/bin/activate

pip install -r requirements.txt

# Create your .env
cp .env.example .env
# Edit .env and update the DATABASE_URL and JWT_SECRET_KEY as needed

# Start the development server
uvicorn app.main:app --reload
```
The FastAPI is globally available at `http://127.0.0.1:8000/`. You can view the swagger UI documentation at `http://127.0.0.1:8000/docs`.

### 2. Frontend Setup (React)

Open a new terminal window or tab and navigate to the `frontend` directory.

```bash
cd frontend

# Install the React dependencies
npm install

# Start the frontend dev server
npm start
```
The React frontend starts locally at `http://localhost:3000`.

---

## 📈 Use Cases
- **Students:** Log in to view personal AI-curated academic risk insights and active improvement suggestions.
- **Mentors:** Identify at-risk students securely, pinpoint *why* they are struggling, and document mentoring actions systematically.
- **Teachers:** Manage class-specific metrics and view subject-related risk anomalies.
- **Coordinators:** View a bird's-eye analytical dashboard of the entire organization to track institutional progress.
