import { json, methodNotAllowed, readJson, text } from "../../_shared/http.js";

async function visitorHash(request, salt) {
  const ip = request.headers.get("cf-connecting-ip") || "unknown";
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${salt}:${ip}`));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function onRequest({ request, env }) {
  if (request.method !== "POST") return methodNotAllowed(["POST"]);
  if (!env.DB || !env.RATE_LIMIT_SALT) return json({ error: "Fragenfunktion ist noch nicht vollständig eingerichtet." }, 503);
  try {
    const data = await readJson(request);
    if (text(data.website, 200)) return json({ ok: true }, 202);
    const reportId = text(data.report_id, 80);
    const displayName = text(data.display_name, 50);
    const body = text(data.body, 800);
    if (!data.consent || displayName.length < 2 || body.length < 10) return json({ error: "Bitte Name, Frage und Einwilligung vollständig angeben." }, 400);
    const report = await env.DB.prepare("SELECT id FROM reports WHERE id = ? AND status = 'published' LIMIT 1").bind(reportId).first();
    if (!report) return json({ error: "Der Reparaturbericht wurde nicht gefunden." }, 404);
    const hash = await visitorHash(request, env.RATE_LIMIT_SALT);
    const cutoff = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const recent = await env.DB.prepare("SELECT 1 FROM question_rate_limits WHERE visitor_hash = ? AND report_id = ? AND created_at > ? LIMIT 1").bind(hash, reportId, cutoff).first();
    if (recent) return json({ error: "Bitte warten Sie einige Minuten, bevor Sie eine weitere Frage senden." }, 429);
    const now = new Date().toISOString();
    await env.DB.batch([
      env.DB.prepare("INSERT INTO report_questions (id, report_id, display_name, body, status, created_at) VALUES (?, ?, ?, ?, 'pending', ?)").bind(crypto.randomUUID(), reportId, displayName, body, now),
      env.DB.prepare("INSERT INTO question_rate_limits (visitor_hash, report_id, created_at) VALUES (?, ?, ?)").bind(hash, reportId, now),
      env.DB.prepare("DELETE FROM question_rate_limits WHERE created_at < ?").bind(new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
    ]);
    return json({ ok: true, message: "Vielen Dank. Ihre Frage wurde zur Prüfung übermittelt." }, 202);
  } catch (error) {
    if (error instanceof SyntaxError) return json({ error: "Ungültige Anfrage." }, 400);
    if (error instanceof Error && error.message === "PAYLOAD_TOO_LARGE") return json({ error: "Die Anfrage ist zu groß." }, 413);
    console.error(JSON.stringify({ message: "question submission failed", error: error instanceof Error ? error.message : String(error) }));
    return json({ error: "Die Frage konnte nicht gespeichert werden." }, 500);
  }
}
