PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS report_publications (
  report_id TEXT PRIMARY KEY REFERENCES reports(id) ON DELETE CASCADE,
  repair TEXT NOT NULL DEFAULT '',
  result TEXT NOT NULL DEFAULT '',
  facebook_text TEXT NOT NULL DEFAULT '',
  instagram_text TEXT NOT NULL DEFAULT '',
  google_text TEXT NOT NULL DEFAULT '',
  privacy_confirmed_at TEXT,
  updated_at TEXT NOT NULL DEFAULT ''
);
