-- ============================================================
-- TS-12 · Early Academic Risk Detection & Student Intervention
-- Dev IT Limited · GTU Hackathon
-- Database : MySQL 8.0+
-- Encoding : utf8mb4
-- All tables follow creation order to satisfy FK dependencies
-- ============================================================

CREATE DATABASE IF NOT EXISTS ts12_academic_risk
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE ts12_academic_risk;

-- ============================================================
-- LAYER 1 — IDENTITY & STRUCTURE
-- Creation order:
--   departments → users → classes → students → subjects
-- ============================================================

-- ------------------------------------------------------------
-- 1. departments
-- Top of the org hierarchy. Must be created before users
-- and classes because both reference department_id.
-- ------------------------------------------------------------
CREATE TABLE departments (
  id         INT            UNSIGNED NOT NULL AUTO_INCREMENT,
  name       VARCHAR(150)   NOT NULL,
  code       VARCHAR(20)    NOT NULL,

  created_at TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP
                            ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_departments_code (code)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='Academic departments e.g. CSE, IT, EC';


-- ------------------------------------------------------------
-- 2. users
-- Single identity table for ALL roles.
-- role ENUM enforces exactly three valid values:
--   student   → student portal only
--   faculty   → teacher tab + mentor tab always
--   coordinator → department analytics only
-- department_id is relevant for faculty and coordinators.
-- NULL allowed for students (they belong to a class, not dept).
-- ------------------------------------------------------------
CREATE TABLE users (
  id            INT            UNSIGNED NOT NULL AUTO_INCREMENT,
  name          VARCHAR(150)   NOT NULL,
  email         VARCHAR(255)   NOT NULL,
  password_hash VARCHAR(255)   NOT NULL
                COMMENT 'bcrypt or argon2 hash — never plain text',
  role          ENUM(
                  'student',
                  'faculty',
                  'coordinator'
                )              NOT NULL,
  department_id INT UNSIGNED   NULL
                COMMENT 'FK to departments — set for faculty and coordinator, NULL for students',

  is_active     TINYINT(1)     NOT NULL DEFAULT 1
                COMMENT '0 = deactivated account, excluded from all queries',
  created_at    TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP
                               ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email),
  KEY idx_users_role        (role),
  KEY idx_users_department  (department_id),

  CONSTRAINT fk_users_department
    FOREIGN KEY (department_id)
    REFERENCES departments (id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='Central identity table — students, faculty, coordinators';


-- ------------------------------------------------------------
-- 3. classes
-- A class is one batch e.g. "CSE Sem 5 - 2024".
-- Belongs to a department.
-- semester stored as INT (1–8 for BE, 1–6 for diploma etc.)
-- ------------------------------------------------------------
CREATE TABLE classes (
  id            INT           UNSIGNED NOT NULL AUTO_INCREMENT,
  name          VARCHAR(100)  NOT NULL
                COMMENT 'e.g. CE-5A, IT-3B',
  semester      TINYINT       UNSIGNED NOT NULL
                COMMENT '1 to 8',
  department_id INT           UNSIGNED NOT NULL,

  created_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
                              ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  KEY idx_classes_department (department_id),
  KEY idx_classes_semester   (semester),

  CONSTRAINT fk_classes_department
    FOREIGN KEY (department_id)
    REFERENCES departments (id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='Academic class batches per department per semester';


-- ------------------------------------------------------------
-- 4. students
-- Extends users for students only.
-- user_id   → auth identity (name, email, login)
-- class_id  → which batch they belong to
-- mentor_id → assigned faculty mentor (users.role = faculty)
--             every faculty is always also a mentor per PS
-- enrollment_no is GTU enrollment number — unique, required
-- ------------------------------------------------------------
CREATE TABLE students (
  id            INT           UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id       INT           UNSIGNED NOT NULL,
  enrollment_no VARCHAR(30)   NOT NULL
                COMMENT 'GTU enrollment number — unique per student',
  class_id      INT           UNSIGNED NOT NULL,
  mentor_id     INT           UNSIGNED NOT NULL
                COMMENT 'FK to users where role = faculty',

  created_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
                              ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_students_user        (user_id),
  UNIQUE KEY uq_students_enrollment  (enrollment_no),
  KEY idx_students_class             (class_id),
  KEY idx_students_mentor            (mentor_id),

  CONSTRAINT fk_students_user
    FOREIGN KEY (user_id)
    REFERENCES users (id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,

  CONSTRAINT fk_students_class
    FOREIGN KEY (class_id)
    REFERENCES classes (id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,

  CONSTRAINT fk_students_mentor
    FOREIGN KEY (mentor_id)
    REFERENCES users (id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='Student academic identity — extends users for student role';


-- ------------------------------------------------------------
-- 5. subjects
-- A subject taught within a specific class by a faculty member.
-- Every signal table (attendance, marks, LMS) references
-- subject_id to keep risk per-student-per-subject.
-- ------------------------------------------------------------
CREATE TABLE subjects (
  id         INT           UNSIGNED NOT NULL AUTO_INCREMENT,
  name       VARCHAR(150)  NOT NULL
             COMMENT 'e.g. Data Structures, DBMS',
  code       VARCHAR(20)   NOT NULL
             COMMENT 'e.g. CS301, IT402',
  class_id   INT           UNSIGNED NOT NULL,
  teacher_id INT           UNSIGNED NOT NULL
             COMMENT 'FK to users where role = faculty',

  created_at TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
                           ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_subjects_code_class (code, class_id)
             COMMENT 'Same subject code can exist in different classes',
  KEY idx_subjects_class   (class_id),
  KEY idx_subjects_teacher (teacher_id),

  CONSTRAINT fk_subjects_class
    FOREIGN KEY (class_id)
    REFERENCES classes (id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,

  CONSTRAINT fk_subjects_teacher
    FOREIGN KEY (teacher_id)
    REFERENCES users (id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='Subjects taught per class by assigned faculty';


-- ============================================================
-- LAYER 2 — RAW ACADEMIC SIGNALS
-- All data in these tables is entered by faculty (teacher).
-- Students are strictly read-only consumers.
-- Creation order:
--   attendance_records → internal_marks → assignments
--   → assignment_submissions → lms_activity
-- ============================================================

-- ------------------------------------------------------------
-- 6. attendance_records
-- One row per student per subject per lecture date.
-- status ENUM: present | absent | late
-- late can be weighted as 0.5 in attendance_pct formula.
-- Composite unique key prevents duplicate entries.
-- ------------------------------------------------------------
CREATE TABLE attendance_records (
  id         INT           UNSIGNED NOT NULL AUTO_INCREMENT,
  student_id INT           UNSIGNED NOT NULL,
  subject_id INT           UNSIGNED NOT NULL,
  date       DATE          NOT NULL,
  status     ENUM(
               'present',
               'absent',
               'late'
             )             NOT NULL,

  created_at TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
                           ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_attendance_student_subject_date (student_id, subject_id, date)
             COMMENT 'One record per student per subject per day',
  KEY idx_attendance_subject (subject_id),
  KEY idx_attendance_date    (date),

  CONSTRAINT fk_attendance_student
    FOREIGN KEY (student_id)
    REFERENCES students (id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,

  CONSTRAINT fk_attendance_subject
    FOREIGN KEY (subject_id)
    REFERENCES subjects (id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='Daily attendance per student per subject — entered by faculty';


-- ------------------------------------------------------------
-- 7. internal_marks
-- Assessment marks entered by subject teacher.
-- exam_type distinguishes mid_sem, unit_test, practical etc.
-- entered_by tracks which faculty entered the marks (audit).
-- marks_obtained NULL = not yet entered for this student.
-- DECIMAL used instead of FLOAT for exact precision.
-- ------------------------------------------------------------
CREATE TABLE internal_marks (
  id             INT            UNSIGNED NOT NULL AUTO_INCREMENT,
  student_id     INT            UNSIGNED NOT NULL,
  subject_id     INT            UNSIGNED NOT NULL,
  entered_by     INT            UNSIGNED NOT NULL
                 COMMENT 'FK to users — faculty who entered these marks',
  exam_type      ENUM(
                   'unit_test_1',
                   'unit_test_2',
                   'mid_sem',
                   'practical',
                   'assignment',
                   'viva',
                   'end_sem'
                 )              NOT NULL,
  marks_obtained DECIMAL(6, 2)  NULL
                 COMMENT 'NULL = not yet graded/entered',
  max_marks      DECIMAL(6, 2)  NOT NULL
                 COMMENT 'Maximum marks for this exam — required for percentage computation',

  created_at     TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP
                                ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_marks_student_subject_exam (student_id, subject_id, exam_type)
             COMMENT 'One marks entry per student per subject per exam type',
  KEY idx_marks_subject    (subject_id),
  KEY idx_marks_entered_by (entered_by),

  CONSTRAINT fk_marks_student
    FOREIGN KEY (student_id)
    REFERENCES students (id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,

  CONSTRAINT fk_marks_subject
    FOREIGN KEY (subject_id)
    REFERENCES subjects (id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,

  CONSTRAINT fk_marks_entered_by
    FOREIGN KEY (entered_by)
    REFERENCES users (id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,

  CONSTRAINT chk_marks_valid
    CHECK (marks_obtained IS NULL OR marks_obtained <= max_marks),

  CONSTRAINT chk_max_marks_positive
    CHECK (max_marks > 0)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='Internal assessment marks per student per subject — teacher entered';


-- ------------------------------------------------------------
-- 8. assignments
-- Master list of assignments given per subject by teacher.
-- Each assignment can have one submission record per student.
-- ------------------------------------------------------------
CREATE TABLE assignments (
  id         INT          UNSIGNED NOT NULL AUTO_INCREMENT,
  subject_id INT          UNSIGNED NOT NULL,
  title      VARCHAR(255) NOT NULL
             COMMENT 'e.g. Unit 3 Lab Report, Trees Implementation',
  due_date   DATE         NOT NULL
             COMMENT 'Used to detect overdue submissions and trigger alerts',

  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
                          ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  KEY idx_assignments_subject  (subject_id),
  KEY idx_assignments_due_date (due_date),

  CONSTRAINT fk_assignments_subject
    FOREIGN KEY (subject_id)
    REFERENCES subjects (id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='Assignments created per subject by faculty';


-- ------------------------------------------------------------
-- 9. assignment_submissions
-- Marks register for assignments — entered by teacher.
-- Student submits physically offline; teacher enters marks here.
-- status ENUM:
--   pending  = assignment created, marks not yet entered
--   graded   = teacher has entered marks after physical review
--   missing  = teacher confirmed student did not submit
-- entered_by tracks which faculty entered the marks (audit).
-- max_marks stored here too — assignments can have varying
-- maximum marks independent of each other.
-- ------------------------------------------------------------
CREATE TABLE assignment_submissions (
  id             INT           UNSIGNED NOT NULL AUTO_INCREMENT,
  assignment_id  INT           UNSIGNED NOT NULL,
  student_id     INT           UNSIGNED NOT NULL,
  entered_by     INT           UNSIGNED NULL
                 COMMENT 'FK to users — faculty who entered marks. NULL until teacher acts.',
  status         ENUM(
                   'pending',
                   'graded',
                   'missing'
                 )             NOT NULL DEFAULT 'pending',
  marks_obtained DECIMAL(6,2)  NULL
                 COMMENT 'NULL while status is pending or missing',
  max_marks      DECIMAL(6,2)  NOT NULL
                 COMMENT 'Max marks for this assignment — needed for assignment_pct',

  created_at     TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
                               ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_submission_assignment_student (assignment_id, student_id)
             COMMENT 'One submission record per student per assignment',
  KEY idx_submission_student    (student_id),
  KEY idx_submission_entered_by (entered_by),
  KEY idx_submission_status     (status),

  CONSTRAINT fk_submission_assignment
    FOREIGN KEY (assignment_id)
    REFERENCES assignments (id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,

  CONSTRAINT fk_submission_student
    FOREIGN KEY (student_id)
    REFERENCES students (id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,

  CONSTRAINT fk_submission_entered_by
    FOREIGN KEY (entered_by)
    REFERENCES users (id)
    ON UPDATE CASCADE
    ON DELETE SET NULL,

  CONSTRAINT chk_submission_marks_valid
    CHECK (marks_obtained IS NULL OR marks_obtained <= max_marks),

  CONSTRAINT chk_submission_max_positive
    CHECK (max_marks > 0)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='Assignment marks register — teacher entered, student read-only';


-- ------------------------------------------------------------
-- 10. lms_activity
-- Daily LMS engagement log per student per subject.
-- Captures digital disengagement invisible to attendance.
-- activity_score is a normalized 0–100 composite of all
-- LMS actions (videos, quizzes, downloads) on that day.
-- ------------------------------------------------------------
CREATE TABLE lms_activity (
  id             INT            UNSIGNED NOT NULL AUTO_INCREMENT,
  student_id     INT            UNSIGNED NOT NULL,
  subject_id     INT            UNSIGNED NOT NULL,
  activity_date  DATE           NOT NULL,
  logins         SMALLINT       UNSIGNED NOT NULL DEFAULT 0
                 COMMENT 'Number of LMS logins on this date',
  activity_score DECIMAL(5, 2)  NOT NULL DEFAULT 0.00
                 COMMENT 'Normalized 0.00–100.00 composite engagement score',

  created_at     TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP
                                ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_lms_student_subject_date (student_id, subject_id, activity_date)
             COMMENT 'One log entry per student per subject per day',
  KEY idx_lms_subject (subject_id),
  KEY idx_lms_date    (activity_date),

  CONSTRAINT fk_lms_student
    FOREIGN KEY (student_id)
    REFERENCES students (id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,

  CONSTRAINT fk_lms_subject
    FOREIGN KEY (subject_id)
    REFERENCES subjects (id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,

  CONSTRAINT chk_lms_score_range
    CHECK (activity_score >= 0 AND activity_score <= 100)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='Daily LMS engagement per student per subject';


-- ============================================================
-- LAYER 3 — AI ENGINE
-- Computed by system. Multiple rows per student over time
-- enables risk trend graphs. Never manually written.
-- ============================================================

-- ------------------------------------------------------------
-- 11. risk_scores
-- One row per risk computation event per student.
-- All 4 signal percentages stored at time of computation
-- for full audit trail — scores cannot be reverse-engineered
-- if source data changes later.
-- risk_label ENUM enforces controlled vocabulary.
-- ai_explanation and ai_suggestions are the explainability
-- core — directly required by PS winning logic.
-- ------------------------------------------------------------
CREATE TABLE risk_scores (
  id              INT            UNSIGNED NOT NULL AUTO_INCREMENT,
  student_id      INT            UNSIGNED NOT NULL,

  attendance_pct  DECIMAL(5, 2)  NOT NULL
                  COMMENT 'Aggregated attendance % at time of computation',
  marks_pct       DECIMAL(5, 2)  NOT NULL
                  COMMENT 'Aggregated marks % across all assessments',
  assignment_pct  DECIMAL(5, 2)  NOT NULL
                  COMMENT 'Assignment completion % at time of computation',
  lms_score       DECIMAL(5, 2)  NOT NULL
                  COMMENT 'LMS engagement score at time of computation',

  risk_score      DECIMAL(5, 2)  NOT NULL
                  COMMENT 'Final weighted risk score 0.00–100.00. Higher = more at risk.',
  risk_label      ENUM(
                    'low',
                    'medium',
                    'high',
                    'critical'
                  )              NOT NULL
                  COMMENT 'Human-readable classification for dashboard color coding',

  ai_explanation  TEXT           NOT NULL
                  COMMENT 'AI-generated top contributing reasons for this risk score',
  ai_suggestions  TEXT           NOT NULL
                  COMMENT 'AI-generated actionable improvement steps for the student',
  model_version   VARCHAR(20)    NOT NULL
                  COMMENT 'AI model version that produced this score e.g. v1.2',

  computed_at     TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP
                  COMMENT 'When this computation ran — multiple rows per student = trend data',

  PRIMARY KEY (id),
  KEY idx_risk_student       (student_id),
  KEY idx_risk_label         (risk_label),
  KEY idx_risk_computed_at   (computed_at),
  KEY idx_risk_student_time  (student_id, computed_at)
      COMMENT 'Composite index for risk trend queries per student over time',

  CONSTRAINT fk_risk_student
    FOREIGN KEY (student_id)
    REFERENCES students (id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,

  CONSTRAINT chk_risk_score_range
    CHECK (risk_score >= 0 AND risk_score <= 100),

  CONSTRAINT chk_attendance_pct_range
    CHECK (attendance_pct >= 0 AND attendance_pct <= 100),

  CONSTRAINT chk_marks_pct_range
    CHECK (marks_pct >= 0 AND marks_pct <= 100),

  CONSTRAINT chk_assignment_pct_range
    CHECK (assignment_pct >= 0 AND assignment_pct <= 100),

  CONSTRAINT chk_lms_score_range_rs
    CHECK (lms_score >= 0 AND lms_score <= 100)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='AI-computed risk scores per student — append-only trend log';


-- ============================================================
-- LAYER 4 — RESPONSE LOOP
-- alerts   → auto-generated by system when risk crosses threshold
-- interventions → manually logged by faculty mentor
-- intervention_outcomes → measured after sufficient time
-- Creation order: alerts → interventions → intervention_outcomes
-- ============================================================

-- ------------------------------------------------------------
-- 12. alerts
-- Auto-generated when risk_score crosses a threshold.
-- alert_type ENUM allows fine-grained notification routing.
-- is_read powers unread badge count on faculty dashboard.
-- triggered_at proves early warning timing per PS requirement.
-- ------------------------------------------------------------
CREATE TABLE alerts (
  id           INT           UNSIGNED NOT NULL AUTO_INCREMENT,
  student_id   INT           UNSIGNED NOT NULL,
  mentor_id    INT           UNSIGNED NOT NULL
               COMMENT 'Derived from students.mentor_id at time of alert creation',
  alert_type   ENUM(
                 'high_risk',
                 'critical_risk',
                 'attendance_drop',
                 'marks_drop',
                 'assignment_overdue',
                 'lms_inactive'
               )             NOT NULL,
  is_read      TINYINT(1)    NOT NULL DEFAULT 0
               COMMENT '0 = unread, 1 = read by mentor',
  triggered_at TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
               COMMENT 'When alert was auto-generated — proves early warning timing',

  PRIMARY KEY (id),
  KEY idx_alerts_student     (student_id),
  KEY idx_alerts_mentor      (mentor_id),
  KEY idx_alerts_is_read     (is_read),
  KEY idx_alerts_type        (alert_type),
  KEY idx_alerts_triggered   (triggered_at),
  KEY idx_alerts_mentor_read (mentor_id, is_read)
      COMMENT 'Composite index for unread alert count per mentor',

  CONSTRAINT fk_alerts_student
    FOREIGN KEY (student_id)
    REFERENCES students (id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,

  CONSTRAINT fk_alerts_mentor
    FOREIGN KEY (mentor_id)
    REFERENCES users (id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='Auto-generated alerts for mentors when student risk crosses threshold';


-- ------------------------------------------------------------
-- 13. interventions
-- Manually logged by faculty mentor after taking action.
-- type ENUM covers all action types mentioned in PS.
-- risk_score_before snapshot is critical — this is the
-- "before" value for pre/post performance comparison.
-- ------------------------------------------------------------
CREATE TABLE interventions (
  id               INT            UNSIGNED NOT NULL AUTO_INCREMENT,
  student_id       INT            UNSIGNED NOT NULL,
  mentor_id        INT            UNSIGNED NOT NULL,
  type             ENUM(
                     'counselling',
                     'remedial_class',
                     'assignment_extension',
                     'parent_meeting',
                     'academic_support',
                     'other'
                   )              NOT NULL,
  remarks          TEXT           NOT NULL
                   COMMENT 'Mentor notes — what was discussed and agreed',
  risk_score_before DECIMAL(5,2)  NOT NULL
                   COMMENT 'Snapshot of risk_score at time of intervention — the before value',
  conducted_at     TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  KEY idx_interventions_student     (student_id),
  KEY idx_interventions_mentor      (mentor_id),
  KEY idx_interventions_type        (type),
  KEY idx_interventions_conducted   (conducted_at),

  CONSTRAINT fk_interventions_student
    FOREIGN KEY (student_id)
    REFERENCES students (id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,

  CONSTRAINT fk_interventions_mentor
    FOREIGN KEY (mentor_id)
    REFERENCES users (id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,

  CONSTRAINT chk_intervention_risk_range
    CHECK (risk_score_before >= 0 AND risk_score_before <= 100)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='Mentor-logged intervention actions per at-risk student';


-- ------------------------------------------------------------
-- 14. intervention_outcomes
-- Measured after sufficient time post-intervention.
-- Stores both score and label before/after for clean display.
-- student_id redundant FK allows fast outcome queries without
-- joining through interventions table.
-- Label delta e.g. "High → Medium" is primary displayed metric.
-- ------------------------------------------------------------
CREATE TABLE intervention_outcomes (
  id                  INT           UNSIGNED NOT NULL AUTO_INCREMENT,
  intervention_id     INT           UNSIGNED NOT NULL,
  student_id          INT           UNSIGNED NOT NULL
                      COMMENT 'Redundant FK — allows fast student-level outcome queries',
  risk_score_before   DECIMAL(5,2)  NOT NULL
                      COMMENT 'Copied from interventions.risk_score_before for single-row comparison',
  risk_score_after    DECIMAL(5,2)  NOT NULL
                      COMMENT 'Risk score measured after post-intervention period',
  risk_label_before   ENUM(
                        'low',
                        'medium',
                        'high',
                        'critical'
                      )             NOT NULL,
  risk_label_after    ENUM(
                        'low',
                        'medium',
                        'high',
                        'critical'
                      )             NOT NULL,

  measured_at         TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
                      COMMENT 'When this outcome measurement was taken',

  PRIMARY KEY (id),
  UNIQUE KEY uq_outcome_intervention (intervention_id)
             COMMENT 'One outcome record per intervention',
  KEY idx_outcome_student     (student_id),
  KEY idx_outcome_label_after (risk_label_after)
      COMMENT 'Fast filter: show all students who reached low risk after intervention',

  CONSTRAINT fk_outcome_intervention
    FOREIGN KEY (intervention_id)
    REFERENCES interventions (id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,

  CONSTRAINT fk_outcome_student
    FOREIGN KEY (student_id)
    REFERENCES students (id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,

  CONSTRAINT chk_outcome_before_range
    CHECK (risk_score_before >= 0 AND risk_score_before <= 100),

  CONSTRAINT chk_outcome_after_range
    CHECK (risk_score_after >= 0 AND risk_score_after <= 100)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='Pre/post intervention performance comparison — closes the feedback loop';


-- ============================================================
-- END OF SCHEMA
-- 14 tables | 23 relationships | 4 layers
-- All constraints, indexes, and checks in place
-- ============================================================
