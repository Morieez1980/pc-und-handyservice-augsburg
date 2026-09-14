PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS reports (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  summary TEXT NOT NULL,
  problem TEXT NOT NULL,
  diagnosis TEXT NOT NULL,
  solution TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  published_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS report_images (
  id TEXT PRIMARY KEY,
  report_id TEXT NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  mime_type TEXT NOT NULL CHECK (mime_type IN ('image/jpeg', 'image/png', 'image/webp')),
  alt_text TEXT NOT NULL,
  image_data BLOB NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS report_questions (
  id TEXT PRIMARY KEY,
  report_id TEXT NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'hidden')),
  answer TEXT,
  created_at TEXT NOT NULL,
  moderated_at TEXT
);

CREATE TABLE IF NOT EXISTS question_rate_limits (
  visitor_hash TEXT NOT NULL,
  report_id TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_reports_status_date ON reports(status, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_images_report_order ON report_images(report_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_questions_report_status ON report_questions(report_id, status, created_at);
CREATE INDEX IF NOT EXISTS idx_rate_limits_lookup ON question_rate_limits(visitor_hash, report_id, created_at);
