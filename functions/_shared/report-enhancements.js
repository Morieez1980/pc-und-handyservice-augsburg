export async function ensureReportEnhancements(env) {
  await env.DB.batch([
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS report_meta (
      report_id TEXT PRIMARY KEY REFERENCES reports(id) ON DELETE CASCADE,
      device_model TEXT NOT NULL DEFAULT '',
      repair_type TEXT NOT NULL DEFAULT '',
      tested_functions TEXT NOT NULL DEFAULT ''
    )`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS report_image_meta (
      image_id TEXT PRIMARY KEY REFERENCES report_images(id) ON DELETE CASCADE,
      stage TEXT NOT NULL DEFAULT 'repair' CHECK (stage IN ('before', 'repair', 'result'))
    )`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS report_publications (
      report_id TEXT PRIMARY KEY REFERENCES reports(id) ON DELETE CASCADE,
      repair TEXT NOT NULL DEFAULT '',
      result TEXT NOT NULL DEFAULT '',
      facebook_text TEXT NOT NULL DEFAULT '',
      instagram_text TEXT NOT NULL DEFAULT '',
      google_text TEXT NOT NULL DEFAULT '',
      privacy_confirmed_at TEXT,
      updated_at TEXT NOT NULL DEFAULT ''
    )`),
  ]);
}
