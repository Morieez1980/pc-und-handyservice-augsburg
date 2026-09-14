import { requireAccess } from "../../_shared/access.js";
import { json, methodNotAllowed, readJson, slugify, text } from "../../_shared/http.js";

function parseImage(image) {
  if (!image || typeof image.data !== "string") throw new Error("INVALID_IMAGE");
  const match = image.data.match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/);
  if (!match) throw new Error("INVALID_IMAGE");
  const binary = atob(match[2]);
  if (binary.length > 900_000) throw new Error("IMAGE_TOO_LARGE");
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return { mime: match[1], data: bytes.buffer, alt: text(image.alt, 160) || "Dokumentierte Reparatur" };
}

async function listData(env) {
  const now = Date.now();
  await env.DB.batch([
    env.DB.prepare("DELETE FROM report_questions WHERE status = 'hidden' AND moderated_at < ?").bind(new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString()),
    env.DB.prepare("DELETE FROM report_questions WHERE status = 'pending' AND created_at < ?").bind(new Date(now - 90 * 24 * 60 * 60 * 1000).toISOString()),
  ]);
  const [reports, images, questions] = await Promise.all([
    env.DB.prepare("SELECT id, slug, title, category, summary, problem, diagnosis, solution, status, published_at, created_at, updated_at FROM reports WHERE status != 'archived' ORDER BY updated_at DESC").all(),
    env.DB.prepare("SELECT id, report_id, alt_text, sort_order FROM report_images ORDER BY report_id, sort_order").all(),
    env.DB.prepare("SELECT q.id, q.report_id, q.display_name, q.body, q.status, q.answer, q.created_at, r.title AS report_title FROM report_questions q JOIN reports r ON r.id = q.report_id WHERE q.status != 'hidden' ORDER BY q.created_at DESC LIMIT 200").all(),
  ]);
  return json({ reports: reports.results || [], images: images.results || [], questions: questions.results || [] });
}

async function saveReport(request, env) {
  const data = await readJson(request, 13_000_000);
  const id = text(data.id, 80) || crypto.randomUUID();
  const title = text(data.title, 120);
  const category = text(data.category, 60);
  const summary = text(data.summary, 300);
  const problem = text(data.problem, 3000);
  const diagnosis = text(data.diagnosis, 3000);
  const solution = text(data.solution, 3000);
  const slug = slugify(data.slug || title);
  if (!title || !category || summary.length < 20 || problem.length < 20 || diagnosis.length < 20 || solution.length < 20 || !slug) return json({ error: "Bitte alle Textfelder vollständig ausfüllen." }, 400);
  if (Array.isArray(data.images) && data.images.length > 10) return json({ error: "Bitte maximal zehn Fotos auswählen." }, 400);
  const images = Array.isArray(data.images) ? data.images.map(parseImage) : [];
  const now = new Date().toISOString();
  const existing = await env.DB.prepare("SELECT status, created_at, published_at FROM reports WHERE id = ? LIMIT 1").bind(id).first();
  const statements = [env.DB.prepare(`INSERT INTO reports (id, slug, title, category, summary, problem, diagnosis, solution, status, published_at, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET slug=excluded.slug, title=excluded.title, category=excluded.category, summary=excluded.summary, problem=excluded.problem, diagnosis=excluded.diagnosis, solution=excluded.solution, updated_at=excluded.updated_at`)
    .bind(id, slug, title, category, summary, problem, diagnosis, solution, existing?.status || "draft", existing?.published_at || null, existing?.created_at || now, now)];
  if (Array.isArray(data.images)) {
    statements.push(env.DB.prepare("DELETE FROM report_images WHERE report_id = ?").bind(id));
    images.forEach((image, index) => statements.push(env.DB.prepare("INSERT INTO report_images (id, report_id, mime_type, alt_text, image_data, sort_order, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)").bind(crypto.randomUUID(), id, image.mime, image.alt, image.data, index, now)));
  }
  await env.DB.batch(statements);
  return json({ ok: true, id, slug });
}

async function setStatus(request, env) {
  const data = await readJson(request);
  const id = text(data.id, 80);
  const status = text(data.status, 20);
  if (!id || !["draft", "published", "archived"].includes(status)) return json({ error: "Ungültiger Status." }, 400);
  const now = new Date().toISOString();
  const result = await env.DB.prepare("UPDATE reports SET status = ?, published_at = CASE WHEN ? = 'published' THEN COALESCE(published_at, ?) ELSE published_at END, updated_at = ? WHERE id = ?").bind(status, status, now, now, id).run();
  if (!result.meta?.changes) return json({ error: "Bericht nicht gefunden." }, 404);
  return json({ ok: true });
}

async function moderateQuestion(request, env) {
  const data = await readJson(request);
  const id = text(data.id, 80);
  const status = text(data.status, 20);
  const answer = text(data.answer, 1500) || null;
  if (!id || !["approved", "hidden", "pending"].includes(status)) return json({ error: "Ungültiger Status." }, 400);
  const result = await env.DB.prepare("UPDATE report_questions SET status = ?, answer = ?, moderated_at = ? WHERE id = ?").bind(status, answer, new Date().toISOString(), id).run();
  if (!result.meta?.changes) return json({ error: "Frage nicht gefunden." }, 404);
  return json({ ok: true });
}

export async function onRequest({ request, env, params }) {
  const access = await requireAccess(request, env);
  if (!access.ok) return json({ error: access.error }, access.status);
  if (!env.DB) return json({ error: "Datenbank ist nicht verbunden." }, 503);
  const action = String(params.action || "");
  try {
    if (action === "data" && request.method === "GET") return await listData(env);
    if (action === "report" && request.method === "POST") return await saveReport(request, env);
    if (action === "status" && request.method === "POST") return await setStatus(request, env);
    if (action === "question" && request.method === "POST") return await moderateQuestion(request, env);
    return methodNotAllowed(action === "data" ? ["GET"] : ["POST"]);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message === "PAYLOAD_TOO_LARGE" || message === "IMAGE_TOO_LARGE") return json({ error: "Bilder oder Anfrage sind zu groß." }, 413);
    if (message === "INVALID_IMAGE" || error instanceof SyntaxError) return json({ error: "Ungültige Eingaben." }, 400);
    if (message.includes("UNIQUE constraint failed: reports.slug")) return json({ error: "Diese Webadresse wird bereits verwendet. Bitte den Titel oder die Kurzadresse ändern." }, 409);
    console.error(JSON.stringify({ message: "admin request failed", action, error: message }));
    return json({ error: "Die Änderung konnte nicht gespeichert werden." }, 500);
  }
}
