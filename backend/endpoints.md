# API Endpoints Documentation (Final — 63 Endpoints)

---

## AUTH (3)

| Method | Endpoint     |
| ------ | ------------ |
| POST   | /auth/login  |
| POST   | /auth/logout |
| GET    | /auth/me     |

---

## SETUP (3)

| Method | Endpoint                           |
| ------ | ---------------------------------- |
| GET    | /setup/departments                 |
| GET    | /setup/classes                     |
| GET    | /setup/classes/{class_id}/subjects |

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

## TEACHER — SUBJECT SIDE (12)

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
| GET    | /teacher/subjects/{subject_id}/assignments            |
| POST   | /teacher/subjects/{subject_id}/assignments            |
| PUT    | /teacher/subjects/{subject_id}/assignments/{id}/marks |
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

## ML (4)

| Method | Endpoint                 |
| ------ | ------------------------ |
| POST   | /ml/predict/{student_id} |
| POST   | /ml/trend/{student_id}   |
| POST   | /ml/predict-all          |
| GET    | /ml/shap/{student_id}    |

---

## LMS ACTIVITY (3)

| Method | Endpoint                   |
| ------ | -------------------------- |
| POST   | /lms/activity/{student_id} |
| GET    | /lms/activity/{student_id} |
| POST   | /lms/activity/bulk         |

---

## ALERTS (4)

| Method | Endpoint                       |
| ------ | ------------------------------ |
| GET    | /alerts/active                 |
| PUT    | /alerts/{alert_id}/acknowledge |
| PUT    | /alerts/{alert_id}/read        |
| GET    | /alerts/history/{student_id}   |

---

## INTERVENTIONS (3)

| Method | Endpoint                                 |
| ------ | ---------------------------------------- |
| POST   | /interventions/{intervention_id}/outcome |
| GET    | /interventions/{intervention_id}/outcome |
| GET    | /interventions/student/{student_id}      |

---

## FINAL COUNT

| Section           | Count  |
| ----------------- | ------ |
| Auth              | 3      |
| Setup             | 3      |
| Student           | 8      |
| Teacher — Subject | 12     |
| Teacher — Mentor  | 9      |
| Coordinator       | 11     |
| Risk Engine       | 3      |
| ML                | 4      |
| LMS Activity      | 3      |
| Alerts            | 4      |
| Interventions     | 3      |
| **Total**         | **63** |
