-- ============================================================
-- Migration 001: Create ENUM types, tables, and indexes
-- ============================================================

-- ============ ENUM Types ============

CREATE TYPE job_type_enum AS ENUM ('campus', 'internship');

CREATE TYPE stage_enum AS ENUM (
  'pending', 'applied', 'written_test',
  'interview_1', 'interview_2', 'hr_interview',
  'offer', 'rejected', 'withdrawn'
);

-- priority stored as string enum to allow future label changes without data migration
CREATE TYPE priority_enum AS ENUM ('1', '2', '3');

CREATE TYPE interview_type_enum AS ENUM ('online', 'onsite', 'phone');

CREATE TYPE interview_result_enum AS ENUM ('pending', 'passed', 'failed', 'cancelled');

CREATE TYPE headcount_type_enum AS ENUM ('regular', 'outsourced', 'contract');

CREATE TYPE notification_type_enum AS ENUM (
  'deadline_3d', 'deadline_1d', 'deadline_today',
  'interview_24h', 'interview_2h',
  'stage_changed', 'offer_deadline'
);

-- ============ users ============

CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  name          VARCHAR(100) NOT NULL,
  avatar_url    VARCHAR(500),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============ applications ============

CREATE TABLE applications (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_name  VARCHAR(100) NOT NULL,
  position      VARCHAR(100) NOT NULL,
  job_type      job_type_enum NOT NULL DEFAULT 'campus',
  stage         stage_enum NOT NULL DEFAULT 'pending',
  city          VARCHAR(50),
  salary_min    INTEGER CHECK (salary_min >= 0),
  salary_max    INTEGER CHECK (salary_max >= 0),
  deadline      DATE,
  job_url       VARCHAR(500),
  notes         TEXT,
  priority      priority_enum NOT NULL DEFAULT '2',
  referral_code VARCHAR(100),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT salary_range_check CHECK (
    salary_max IS NULL OR salary_min IS NULL OR salary_max >= salary_min
  )
);

-- ============ stage_logs ============

CREATE TABLE stage_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id  UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  from_stage      stage_enum,        -- NULL on initial creation
  to_stage        stage_enum NOT NULL,
  note            VARCHAR(500),
  changed_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============ interviews ============

CREATE TABLE interviews (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id  UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  round           VARCHAR(50) NOT NULL,
  interview_time  TIMESTAMPTZ NOT NULL,
  interview_type  interview_type_enum NOT NULL DEFAULT 'online',
  location        VARCHAR(200),      -- required when interview_type = 'onsite'
  interviewer     VARCHAR(100),
  prep_notes      TEXT,
  result          interview_result_enum NOT NULL DEFAULT 'pending',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============ documents ============

CREATE TABLE documents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id  UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  doc_type        VARCHAR(50) NOT NULL,
  is_submitted    BOOLEAN NOT NULL DEFAULT FALSE,
  submitted_at    TIMESTAMPTZ,
  notes           VARCHAR(200),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============ offers ============

CREATE TABLE offers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id  UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE UNIQUE,
  base_salary     INTEGER CHECK (base_salary >= 0),
  city            VARCHAR(50),
  department      VARCHAR(100),
  headcount_type  headcount_type_enum,
  offer_deadline  DATE,
  is_accepted     BOOLEAN,           -- NULL=undecided, TRUE=accepted, FALSE=declined
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============ notifications ============

CREATE TABLE notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type        notification_type_enum NOT NULL,
  title       VARCHAR(200) NOT NULL,
  content     VARCHAR(500) NOT NULL,
  related_id  UUID,                  -- application_id or interview_id
  is_read     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============ Indexes ============

CREATE INDEX idx_applications_user_id
  ON applications(user_id);

CREATE INDEX idx_applications_user_stage
  ON applications(user_id, stage);

CREATE INDEX idx_applications_deadline
  ON applications(deadline)
  WHERE deadline IS NOT NULL;

CREATE INDEX idx_interviews_application_id
  ON interviews(application_id);

CREATE INDEX idx_interviews_time
  ON interviews(interview_time);

CREATE INDEX idx_notifications_user_unread
  ON notifications(user_id, is_read)
  WHERE is_read = FALSE;

-- Idempotency guard: prevent duplicate unread notifications for the same trigger.
-- PostgreSQL treats NULL as distinct in unique indexes, so COALESCE is used to
-- make (user_id, type, NULL related_id) also idempotent.
CREATE UNIQUE INDEX idx_notifications_idempotent
  ON notifications(user_id, type, COALESCE(related_id, '00000000-0000-0000-0000-000000000000'))
  WHERE is_read = FALSE;
