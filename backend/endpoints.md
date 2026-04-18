# API Endpoints Documentation

## AUTH (3)

| Method | Endpoint     |
| ------ | ------------ |
| POST   | /auth/login  |
| POST   | /auth/logout |
| GET    | /auth/me     |

---

## STUDENT (8)

| Method | Endpoint               |
| ------ | ---------------------- |
| GET    | /student/dashboard     |
| GET    | /student/risk-score    |
| GET    | /student/attendance    |
| GET    | /student/marks         |
| GET    | /student/assignments   |
| GET    | /student/interventions |
| GET    | /student/progress      |
| GET    | /student/suggestions   |

---

## TEACHER — SUBJECT SIDE (11)

| Method | Endpoint                                              |
| ------ | ----------------------------------------------------- |
| GET    | /teacher/subjects                                     |
| GET    | /teacher/subjects/{subject_id}/students               |
| GET    | /teacher/subjects/{subject_id}/attendance             |
| POST   | /teacher/subjects/{subject_id}/attendance             |
| PUT    | /teacher/subjects/{subject_id}/attendance/{date}      |
| GET    | /teacher/subjects/{subject_id}/marks                  |
| POST   | /teacher/subjects/{subject_id}/marks                  |
| PUT    | /teacher/subjects/{subject_id}/marks/{assessment_id}  |
| POST   | /teacher/subjects/{subject_id}/assignments            |
| PUT    | /teacher/subjects/{subject_id}/assignments/{id}/marks |
| GET    | /teacher/subjects/{subject_id}/assignments            |
| GET    | /teacher/subjects/{subject_id}/risk-overview          |

---

## TEACHER — MENTOR SIDE (9)

| Method | Endpoint                                         |
| ------ | ------------------------------------------------ |
| GET    | /teacher/mentees                                 |
| GET    | /teacher/mentees/at-risk                         |
| GET    | /teacher/mentees/{student_id}/profile            |
| GET    | /teacher/mentees/{student_id}/risk-detail        |
| GET    | /teacher/mentees/{student_id}/interventions      |
| POST   | /teacher/mentees/{student_id}/interventions      |
| PUT    | /teacher/mentees/{student_id}/interventions/{id} |
| GET    | /teacher/mentees/{student_id}/progress           |
| GET    | /teacher/alerts                                  |

---

## COORDINATOR (11)

| Method | Endpoint                                        |
| ------ | ----------------------------------------------- |
| GET    | /coordinator/dashboard                          |
| GET    | /coordinator/students                           |
| GET    | /coordinator/students/{student_id}/full-profile |
| GET    | /coordinator/risk-distribution                  |
| GET    | /coordinator/departments                        |
| GET    | /coordinator/subjects/risk-overview             |
| GET    | /coordinator/interventions                      |
| GET    | /coordinator/interventions/effectiveness        |
| GET    | /coordinator/teachers/mentor-activity           |
| GET    | /coordinator/alerts                             |
| GET    | /coordinator/reports/export                     |

---

## RISK ENGINE (3)

| Method | Endpoint                   |
| ------ | -------------------------- |
| POST   | /risk/compute/{student_id} |
| POST   | /risk/compute-all          |
| GET    | /risk/history/{student_id} |

---

## FINAL COUNT

| Section           | Count  |
| ----------------- | ------ |
| Auth              | 3      |
| Student           | 8      |
| Teacher — Subject | 11     |
| Teacher — Mentor  | 9      |
| Coordinator       | 11     |
| Risk Engine       | 3      |
| **Total**         | **45** |
