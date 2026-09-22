import assert from "node:assert/strict";
import test from "node:test";
import { escapeHtml, slugify } from "../functions/_shared/http.js";
import { renderDetail, renderIndex } from "../functions/_shared/reports-page.js";
import { requireAccess } from "../functions/_shared/access.js";
import { onRequest as submitQuestion } from "../functions/api/reparaturberichte/frage.js";
import { onRequest as adminRequest, setStatus } from "../functions/reparaturberichte-admin/api/[action].js";
import { onRequestGet as getReportImage } from "../functions/api/reparaturberichte/bild/[id].js";
import { buildPublicationDrafts, detectSensitiveContent } from "../publication-copy.js";

const b64url = (value) => Buffer.from(value).toString("base64url");

test("Texte und Kurzadressen werden sicher ausgegeben", () => {
  assert.equal(slugify("Ärger mit heißem PC & SSD"), "arger-mit-heissem-pc-ssd");
  assert.equal(escapeHtml(`<script>alert("x")</script>`), "&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;");
  const html = renderIndex([{ id: "1", slug: "test", title: "<img>", category: "PC", summary: "Sicher", image_id: null }]);
  assert.ok(html.includes("&lt;img&gt;"));
  assert.ok(!html.includes("<img>"));
});

test("Detailseite zeigt getrennte Reparatur und Ergebnis sowie nur freigegebene Fragen", () => {
  const report = { id: "r1", slug: "bericht", title: "Bericht", category: "PC", summary: "Kurzbeschreibung", problem: "Fehler", diagnosis: "Diagnose", solution: "Alte Gesamtlösung", repair: "Akku ersetzt", result: "Start und Laden erfolgreich getestet", device_model: "iPhone SE", repair_type: "Akkutausch", tested_functions: "Start und Laden" };
  const html = renderDetail(report, [{ id: "img1", alt_text: "Gerät vor der Reparatur", stage: "before" }], [{ display_name: "A & B", body: "Wie ging das?", answer: "Vorsichtig." }]);
  assert.ok(html.includes("A &amp; B"));
  assert.ok(html.includes("data-private-page=\"true\""));
  assert.ok(html.includes("Die Frage wird geprüft und erscheint erst nach Freigabe."));
  assert.ok(html.includes("Gerät vor der Reparatur"));
  assert.ok(html.includes("stage-before"));
  assert.ok(html.includes("/api/reparaturberichte/bild/img1?v=20260914-2"));
  assert.ok(html.includes("iPhone SE"));
  assert.ok(html.includes("Durchgeführte Reparatur"));
  assert.ok(html.includes("Akku ersetzt"));
  assert.ok(html.includes("Ergebnis"));
  assert.ok(html.includes("Start und Laden erfolgreich getestet"));
  assert.ok(html.includes("Reparaturanfrage starten"));
  assert.ok(html.includes("gallery-dialog"));
});

test("Veröffentlichungstexte entstehen deterministisch aus einem Reparaturfall", () => {
  const drafts = buildPublicationDrafts({
    device_model: "iPhone 13",
    problem: "Akku entlädt sich sehr schnell",
    diagnosis: "Akku deutlich verschlissen",
    repair: "Akku ersetzt und Gerät gereinigt",
    result: "Gerät startet ordnungsgemäß; Laden, Display und Touch wurden erfolgreich getestet",
  });
  assert.equal(drafts.category, "Smartphone & Tablet");
  assert.equal(drafts.slug, "iphone-13-akku-ersetzt-und-gerat-gereinigt");
  assert.ok(drafts.title.startsWith("iPhone 13:"));
  assert.ok(drafts.facebook_text.includes("PC & Handyservice Augsburg"));
  assert.ok(drafts.instagram_text.includes("#AugsburgLechhausen"));
  assert.ok(drafts.instagram_text.includes("#Akkutausch"));
  assert.ok(drafts.google_text.length <= 1500);
  assert.ok((drafts.instagram_text.match(/#[\p{L}\d]+/gu) || []).length <= 9);
});

test("Datenschutzprüfung markiert typische Kundendaten, ohne unauffällige Texte zu sperren", () => {
  assert.deepEqual(detectSensitiveContent({ problem: "Akku entlädt sich schnell", result: "Laden geprüft" }), []);
  const issues = detectSensitiveContent({ diagnosis: "IMEI 123456789012345, Rückfrage an kunde@example.de" });
  assert.ok(issues.includes("mögliche E-Mail-Adresse"));
  assert.ok(issues.includes("lange Ziffernfolge oder Gerätekennung"));
  assert.ok(issues.includes("Hinweis auf Zugangsdaten oder Kennungen"));
  assert.ok(detectSensitiveContent({ imageDescriptions: "Gerät mit IMEI 123456789012345" }).includes("Hinweis auf Zugangsdaten oder Kennungen"));
  assert.ok(detectSensitiveContent({ imageDescriptions: "WhatsApp Image 2026-09-14 at 08.14.30" }).includes("möglicher unveränderter Fotodateiname"));
});

test("Cloudflare Access JWT wird kryptografisch geprüft", async () => {
  const pair = await crypto.subtle.generateKey({ name: "RSASSA-PKCS1-v1_5", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" }, true, ["sign", "verify"]);
  const jwk = await crypto.subtle.exportKey("jwk", pair.publicKey);
  jwk.kid = "test-key";
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: "RS256", kid: jwk.kid }));
  const payload = b64url(JSON.stringify({ iss: "https://team.cloudflareaccess.com", aud: ["audience"], exp: now + 60, nbf: now - 1, email: "owner@example.com" }));
  const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", pair.privateKey, new TextEncoder().encode(`${header}.${payload}`));
  const token = `${header}.${payload}.${Buffer.from(signature).toString("base64url")}`;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({ keys: [jwk] }));
  try {
    const result = await requireAccess(new Request("https://example.com", { headers: { "Cf-Access-Jwt-Assertion": token } }), { TEAM_DOMAIN: "https://team.cloudflareaccess.com", POLICY_AUD: "audience" });
    assert.deepEqual(result, { ok: true, email: "owner@example.com" });
    const rejected = await requireAccess(new Request("https://example.com"), { TEAM_DOMAIN: "https://team.cloudflareaccess.com", POLICY_AUD: "audience" });
    assert.equal(rejected.status, 403);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

class FakeStatement {
  constructor(db, sql) { this.db = db; this.sql = sql; this.args = []; }
  bind(...args) { this.args = args; return this; }
  async first() {
    if (this.sql.startsWith("SELECT id FROM reports")) return this.db.reportExists ? { id: this.args[0] } : null;
    if (this.sql.startsWith("SELECT 1 FROM question_rate_limits")) return this.db.recent ? { 1: 1 } : null;
    return null;
  }
  async run() { return { meta: { changes: 1 } }; }
}

class FakeDb {
  constructor() { this.reportExists = true; this.recent = false; this.batches = []; }
  prepare(sql) { return new FakeStatement(this, sql); }
  async batch(statements) { this.batches.push(statements); return statements.map(() => ({ success: true })); }
}

test("Besucherfragen werden nur mit Einwilligung als wartend gespeichert und gedrosselt", async () => {
  const db = new FakeDb();
  const env = { DB: db, RATE_LIMIT_SALT: "test-salt" };
  const valid = new Request("https://example.com/api/reparaturberichte/frage", { method: "POST", headers: { "Content-Type": "application/json", "Cf-Connecting-IP": "192.0.2.1" }, body: JSON.stringify({ report_id: "r1", display_name: "Anna", body: "Welche Ursache hatte der Fehler?", consent: true }) });
  const accepted = await submitQuestion({ request: valid, env });
  assert.equal(accepted.status, 202);
  assert.equal(db.batches.length, 1);
  assert.ok(db.batches[0][0].sql.includes("'pending'"));

  db.recent = true;
  const repeated = new Request("https://example.com/api/reparaturberichte/frage", { method: "POST", headers: { "Content-Type": "application/json", "Cf-Connecting-IP": "192.0.2.1" }, body: JSON.stringify({ report_id: "r1", display_name: "Anna", body: "Noch eine ausreichend lange Frage?", consent: true }) });
  assert.equal((await submitQuestion({ request: repeated, env })).status, 429);

  const missingConsent = new Request("https://example.com/api/reparaturberichte/frage", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ report_id: "r1", display_name: "Anna", body: "Eine ausreichend lange Frage", consent: false }) });
  assert.equal((await submitQuestion({ request: missingConsent, env })).status, 400);
});

test("Verwaltungs-API bleibt ohne vollständig konfigurierten Zugriffsschutz geschlossen", async () => {
  const response = await adminRequest({ request: new Request("https://example.com/reparaturberichte-admin/api/data"), env: { DB: new FakeDb() }, params: { action: "data" } });
  assert.equal(response.status, 503);
});

test("Veröffentlichung bleibt ohne gespeicherte Datenschutzbestätigung gesperrt", async () => {
  const db = {
    prepare(sql) {
      return {
        args: [],
        bind(...args) { this.args = args; return this; },
        async first() { return sql.includes("privacy_confirmed_at") ? { privacy_confirmed_at: null } : null; },
        async run() { throw new Error("Ein gesperrter Bericht darf nicht aktualisiert werden."); },
      };
    },
  };
  const request = new Request("https://example.com/reparaturberichte-admin/api/status", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: "r1", status: "published" }) });
  const response = await setStatus(request, { DB: db });
  assert.equal(response.status, 409);
  assert.ok((await response.json()).error.includes("Text-, Foto- und Faktenprüfung"));
});

test("D1-Bilddaten werden als echte Binärdatei ausgeliefert", async () => {
  const bytes = [137, 80, 78, 71, 13, 10, 26, 10];
  const env = { DB: { prepare: () => ({ bind: () => ({ first: async () => ({ mime_type: "image/png", image_data: bytes }) }) }) } };
  const response = await getReportImage({ env, params: { id: "bild-1" }, request: new Request("https://example.com/api/reparaturberichte/bild/bild-1") });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-type"), "image/png");
  assert.equal(response.headers.get("content-length"), String(bytes.length));
  assert.equal(response.headers.get("cache-control"), "public, max-age=86400, must-revalidate");
  assert.deepEqual([...new Uint8Array(await response.arrayBuffer())], bytes);
});
