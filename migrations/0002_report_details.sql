PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS report_meta (
  report_id TEXT PRIMARY KEY REFERENCES reports(id) ON DELETE CASCADE,
  device_model TEXT NOT NULL DEFAULT '',
  repair_type TEXT NOT NULL DEFAULT '',
  tested_functions TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS report_image_meta (
  image_id TEXT PRIMARY KEY REFERENCES report_images(id) ON DELETE CASCADE,
  stage TEXT NOT NULL DEFAULT 'repair' CHECK (stage IN ('before', 'repair', 'result'))
);
