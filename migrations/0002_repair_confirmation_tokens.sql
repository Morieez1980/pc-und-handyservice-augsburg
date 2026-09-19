CREATE TABLE IF NOT EXISTS repair_confirmation_tokens (
  token_hash TEXT PRIMARY KEY,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_repair_confirmation_tokens_expiry
  ON repair_confirmation_tokens (expires_at);
