import assert from 'node:assert/strict';
import test from 'node:test';
import { onRequest as applySecurityHeaders } from '../functions/_middleware.js';
import { onRequestGet as showConfirmation } from '../functions/anfrage-bestaetigt.js';
import { onRequestGet as rejectConfirmationGet, onRequestPost as createConfirmation } from '../functions/api/repair-confirmation.js';

class MemoryStatement {
  constructor(database, sql) {
    this.database = database;
    this.sql = sql.replace(/\s+/g, ' ').trim();
    this.values = [];
  }

  bind(...values) {
    this.values = values;
    return this;
  }

  async run() {
    if (this.sql.startsWith('CREATE TABLE') || this.sql.startsWith('CREATE INDEX')) return { meta: { changes: 0 } };
    if (this.sql.startsWith('INSERT INTO repair_confirmation_tokens')) {
      this.database.tokens.set(this.values[0], { expiresAt: this.values[1], createdAt: this.values[2] });
      return { meta: { changes: 1 } };
    }
    if (this.sql.includes('DELETE FROM repair_confirmation_tokens WHERE expires_at')) {
      let changes = 0;
      for (const [hash, record] of this.database.tokens) {
        if (record.expiresAt < this.values[0]) {
          this.database.tokens.delete(hash);
          changes += 1;
        }
      }
      return { meta: { changes } };
    }
    if (this.sql.includes('DELETE FROM repair_confirmation_tokens WHERE token_hash')) {
      const changes = this.database.tokens.delete(this.values[0]) ? 1 : 0;
      return { meta: { changes } };
    }
    throw new Error(`Nicht unterstützte Testabfrage: ${this.sql}`);
  }

  async first() {
    if (!this.sql.startsWith('SELECT token_hash FROM repair_confirmation_tokens')) {
      throw new Error(`Nicht unterstützte Testabfrage: ${this.sql}`);
    }
    const record = this.database.tokens.get(this.values[0]);
    return record && record.expiresAt >= this.values[1] ? { token_hash: this.values[0] } : null;
  }
}

class MemoryDatabase {
  constructor() {
    this.tokens = new Map();
  }

  prepare(sql) {
    return new MemoryStatement(this, sql);
  }
}

test('Bestätigungsnummer ist serverseitig, kurzlebig und nur einmal verwendbar', async () => {
  const env = { DB: new MemoryDatabase() };
  const issued = await createConfirmation({ env });
  const body = await issued.json();
  assert.equal(issued.status, 201);
  assert.match(body.ref, /^[0-9a-f-]{36}$/i);

  const invalid = await showConfirmation({
    env,
    request: new Request('https://www.pc-und-handyservice-augsburg.com/anfrage-bestaetigt?ref=ungueltig')
  });
  assert.equal(invalid.status, 400);
  assert.match(await invalid.text(), /data-confirmation="invalid"/);

  const validUrl = `https://www.pc-und-handyservice-augsburg.com/anfrage-bestaetigt?ref=${body.ref}`;
  const valid = await showConfirmation({ env, request: new Request(validUrl) });
  assert.equal(valid.status, 200);
  assert.match(await valid.text(), /data-confirmation="valid"/);

  const reused = await showConfirmation({ env, request: new Request(validUrl) });
  assert.equal(reused.status, 400);
  assert.match(await reused.text(), /bereits abgelaufen/);
});

test('Bestätigungsnummern können nicht per GET erzeugt werden', async () => {
  const response = rejectConfirmationGet();
  assert.equal(response.status, 405);
  assert.equal(response.headers.get('Allow'), 'POST');
});

test('Middleware ergänzt Sicherheitsheader und erlaubt nur den Bestätigungs-Iframe', async () => {
  const apiResponse = await applySecurityHeaders({
    request: new Request('https://www.pc-und-handyservice-augsburg.com/api/google-reviews'),
    next: async () => new Response('{}', { headers: { 'Content-Type': 'application/json' } })
  });
  assert.equal(apiResponse.headers.get('Strict-Transport-Security'), 'max-age=63072000; includeSubDomains');
  assert.equal(apiResponse.headers.get('X-Frame-Options'), 'DENY');
  assert.match(apiResponse.headers.get('Content-Security-Policy'), /frame-ancestors 'none'/);

  const reportResponse = await applySecurityHeaders({
    request: new Request('https://www.pc-und-handyservice-augsburg.com/reparaturberichte/beispiel'),
    next: async () => new Response('<!doctype html>', { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
  });
  assert.match(reportResponse.headers.get('Content-Security-Policy'), /default-src 'self'/);
  assert.match(reportResponse.headers.get('Content-Security-Policy'), /img-src 'self'/);

  const confirmationResponse = await applySecurityHeaders({
    request: new Request('https://www.pc-und-handyservice-augsburg.com/anfrage-bestaetigt?ref=test'),
    next: async () => new Response('ok')
  });
  assert.equal(confirmationResponse.headers.get('X-Frame-Options'), 'SAMEORIGIN');
  assert.match(confirmationResponse.headers.get('Content-Security-Policy'), /frame-ancestors 'self'/);
});
