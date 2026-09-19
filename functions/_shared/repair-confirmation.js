const TOKEN_TTL_MS = 15 * 60 * 1000;
const TOKEN_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const tokenHash = async (token) => {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
};

export const ensureConfirmationTable = (db) => db.prepare(`
  CREATE TABLE IF NOT EXISTS repair_confirmation_tokens (
    token_hash TEXT PRIMARY KEY,
    expires_at INTEGER NOT NULL,
    created_at INTEGER NOT NULL
  )
`).run();

export async function issueConfirmationToken(db, now = Date.now()) {
  await ensureConfirmationTable(db);
  await db.prepare('DELETE FROM repair_confirmation_tokens WHERE expires_at < ?').bind(now).run();

  const token = crypto.randomUUID();
  await db.prepare(`
    INSERT INTO repair_confirmation_tokens (token_hash, expires_at, created_at)
    VALUES (?, ?, ?)
  `).bind(await tokenHash(token), now + TOKEN_TTL_MS, now).run();

  return { token, expiresAt: new Date(now + TOKEN_TTL_MS).toISOString() };
}

export async function consumeConfirmationToken(db, token, now = Date.now()) {
  if (!TOKEN_PATTERN.test(token || '')) return false;
  await ensureConfirmationTable(db);

  const hash = await tokenHash(token);
  const row = await db.prepare(`
    SELECT token_hash FROM repair_confirmation_tokens
    WHERE token_hash = ? AND expires_at >= ?
  `).bind(hash, now).first();
  if (!row) return false;

  const result = await db.prepare('DELETE FROM repair_confirmation_tokens WHERE token_hash = ?').bind(hash).run();
  return (result.meta?.changes ?? 0) === 1;
}
