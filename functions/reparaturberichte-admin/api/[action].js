import { requireAccess } from "../../_shared/access.js";
import { json, methodNotAllowed, readJson, slugify, text } from "../../_shared/http.js";
import { ensureReportEnhancements } from "../../_shared/report-enhancements.js";
import { detectSensitiveContent } from "../../../publication-copy.js";

function parseImage(image) {
  if (!image || typeof image.data !== "string") throw new Error("INVALID_IMAGE");
  const match = image.data.match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/);
  if (!match) throw new Error("INVALID_IMAGE");
  const binary = atob(match[2]);
  if (binary.length > 900_000) throw new Error("IMAGE_TOO_LARGE");
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return { mime: match[1], data: bytes.buffer, alt: text(image.alt, 160) || "Dokumentierte Reparatur", stage: ["before", "repair", "result"].includes(image.stage) ? image.stage : "repair" };
}

async function listData(env) {
  await ensureReportEnhancements(env);
  const now = Date.now();
  await env.DB.batch([
    env.DB.prepare("DELETE FROM report_questions WHERE status = 'hidden' AND moderated_at < ?").bind(new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString()),
    env.DB.prepare("DELETE FROM report_questions WHERE status = 'pending' AND created_at < ?").bind(new Date(now - 90 * 24 * 60 * 60 * 1000).toISOString()),
  ]);
  const [reports, images, questions] = await Promise.all([
    env.DB.prepare(`SELECT r.id, r.slug, r.title, r.category, r.summary, r.problem, r.diagnosis, r.solution, r.status, r.published_at, r.created_at, r.updated_at,
      COALESCE(m.device_model, '') AS device_model, COALESCE(m.repair_type, '') AS repair_type, COALESCE(m.tested_functions, '') AS tested_functions,
      COALESCE(p.repair, '') AS repair, COALESCE(p.result, '') AS result, COALESCE(p.facebook_text, '') AS facebook_text,
      COALESCE(p.instagram_text, '') AS instagram_text, COALESCE(p.google_text, '') AS google_text,
      p.privacy_confirmed_at
      FROM reports r LEFT JOIN report_meta m ON m.report_id = r.id LEFT JOIN report_publications p ON p.report_id = r.id
      WHERE r.status != 'archived' ORDER BY r.updated_at DESC`).all(),
    env.DB.prepare("SELECT i.id, i.report_id, i.alt_text, i.sort_order, COALESCE(m.stage, 'repair') AS stage FROM report_images i LEFT JOIN report_image_meta m ON m.image_id = i.id ORDER BY i.report_id, i.sort_order").all(),
    env.DB.prepare("SELECT q.id, q.report_id, q.display_name, q.body, q.status, q.answer, q.created_at, r.title AS report_title FROM report_questions q JOIN reports r ON r.id = q.report_id WHERE q.status != 'hidden' ORDER BY q.created_at DESC LIMIT 200").all(),
  ]);
  return json({ reports: reports.results || [], images: images.results || [], questions: questions.results || [] });
}

async function saveReport(request, env) {
  const data = await readJson(request, 13_000_000);
  await ensureReportEnhancements(env);
  const id = text(data.id, 80) || crypto.randomUUID();
  const title = text(data.title, 120);
  const category = text(data.category, 60);
  const summary = text(data.summary, 300);
  const problem = text(data.problem, 3000);
  const diagnosis = text(data.diagnosis, 3000);
  const repair = text(data.repair, 3000);
  const result = text(data.result, 3000);
  const solution = text(data.solution || [repair, result].filter(Boolean).join("\n\n"), 6000);
  const deviceModel = text(data.device_model, 120);
  const repairType = text(data.repair_type, 120);
  const testedFunctions = text(data.tested_functions, 500);
  const facebookText = text(data.facebook_text, 5000);
  const instagramText = text(data.instagram_text, 2200);
  const googleText = text(data.google_text, 1500);
  const slug = slugify(data.slug || title);
  if (!title || !category || !deviceModel || summary.length < 20 || problem.length < 10 || diagnosis.length < 10 || repair.length < 10 || result.length < 10 || !slug) return json({ error: "Bitte Gerät, Fehlerbild, Diagnose, Reparatur und Ergebnis vollständig ausfüllen." }, 400);
  if (!facebookText || !instagramText || !googleText) return json({ error: "Bitte alle Veröffentlichungstexte prüfen und vollständig ausfüllen." }, 400);
  const privacyIssues = detectSensitiveContent({ deviceModel, title, summary, problem, diagnosis, repair, result, facebookText, instagramText, googleText });
  if (privacyIssues.length && data.sensitive_reviewed !== true) return json({ error: `Bitte erkannte Datenschutzauffälligkeiten bewusst prüfen: ${privacyIssues.join(", ")}.` }, 400);
  if (Array.isArray(data.images) && data.images.length > 10) return json({ error: "Bitte maximal zehn Fotos auswählen." }, 400);
  const imageItems = Array.isArray(data.images) ? data.images : null;
  const now = new Date().toISOString();
  const existing = await env.DB.prepare("SELECT status, created_at, published_at FROM reports WHERE id = ? LIMIT 1").bind(id).first();
  const storedImages = imageItems ? await env.DB.prepare("SELECT id FROM report_images WHERE report_id = ?").bind(id).all() : { results: [] };
  const storedImageIds = new Set((storedImages.results || []).map((image) => image.id));
  if (imageItems?.some((item) => text(item?.id, 80) && !storedImageIds.has(text(item.id, 80)))) return json({ error: "Mindestens ein gespeichertes Foto gehört nicht zu diesem Bericht. Bitte die Seite neu laden." }, 400);
  const statements = [env.DB.prepare(`INSERT INTO reports (id, slug, title, category, summary, problem, diagnosis, solution, status, published_at, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET slug=excluded.slug, title=excluded.title, category=excluded.category, summary=excluded.summary, problem=excluded.problem, diagnosis=excluded.diagnosis, solution=excluded.solution, status='draft', updated_at=excluded.updated_at`)
    .bind(id, slug, title, category, summary, problem, diagnosis, solution, "draft", existing?.published_at || null, existing?.created_at || now, now),
    env.DB.prepare(`INSERT INTO report_meta (report_id, device_model, repair_type, tested_functions) VALUES (?, ?, ?, ?)
      ON CONFLICT(report_id) DO UPDATE SET device_model=excluded.device_model, repair_type=excluded.repair_type, tested_functions=excluded.tested_functions`).bind(id, deviceModel, repairType, testedFunctions),
    env.DB.prepare(`INSERT INTO report_publications (report_id, repair, result, facebook_text, instagram_text, google_text, privacy_confirmed_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(report_id) DO UPDATE SET repair=excluded.repair, result=excluded.result, facebook_text=excluded.facebook_text,
      instagram_text=excluded.instagram_text, google_text=excluded.google_text, privacy_confirmed_at=excluded.privacy_confirmed_at, updated_at=excluded.updated_at`)
      .bind(id, repair, result, facebookText, instagramText, googleText, data.privacy_confirmed === true ? now : null, now)];
  if (imageItems) {
    const existingItems = imageItems.filter((item) => storedImageIds.has(text(item?.id, 80)));
    const keepIds = existingItems.map((item) => text(item.id, 80));
    if (keepIds.length) {
      const placeholders = keepIds.map(() => "?").join(",");
      statements.push(env.DB.prepare(`DELETE FROM report_image_meta WHERE image_id IN (SELECT id FROM report_images WHERE report_id = ? AND id NOT IN (${placeholders}))`).bind(id, ...keepIds));
      statements.push(env.DB.prepare(`DELETE FROM report_images WHERE report_id = ? AND id NOT IN (${placeholders})`).bind(id, ...keepIds));
    } else {
      statements.push(env.DB.prepare("DELETE FROM report_image_meta WHERE image_id IN (SELECT id FROM report_images WHERE report_id = ?)").bind(id));
      statements.push(env.DB.prepare("DELETE FROM report_images WHERE report_id = ?").bind(id));
    }
    imageItems.forEach((item, index) => {
      const existingId = text(item?.id, 80);
      const stage = ["before", "repair", "result"].includes(item?.stage) ? item.stage : "repair";
      if (existingId) {
        const alt = text(item.alt, 160) || "Dokumentierte Reparatur";
        statements.push(env.DB.prepare("UPDATE report_images SET alt_text = ?, sort_order = ? WHERE id = ? AND report_id = ?").bind(alt, index, existingId, id));
        statements.push(env.DB.prepare("INSERT INTO report_image_meta (image_id, stage) VALUES (?, ?) ON CONFLICT(image_id) DO UPDATE SET stage=excluded.stage").bind(existingId, stage));
      } else {
        const image = parseImage(item);
        const imageId = crypto.randomUUID();
        statements.push(env.DB.prepare("INSERT INTO report_images (id, report_id, mime_type, alt_text, image_data, sort_order, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)").bind(imageId, id, image.mime, image.alt, image.data, index, now));
        statements.push(env.DB.prepare("INSERT INTO report_image_meta (image_id, stage) VALUES (?, ?)").bind(imageId, image.stage));
      }
    });
  }
  await env.DB.batch(statements);
  return json({ ok: true, id, slug });
}

export async function setStatus(request, env) {
  const data = await readJson(request);
  const id = text(data.id, 80);
  const status = text(data.status, 20);
  if (!id || !["draft", "published", "archived"].includes(status)) return json({ error: "Ungültiger Status." }, 400);
  if (status === "published") {
    const confirmation = await env.DB.prepare("SELECT privacy_confirmed_at FROM report_publications WHERE report_id = ? LIMIT 1").bind(id).first();
    if (!confirmation?.privacy_confirmed_at) return json({ error: "Vor der Veröffentlichung müssen Text-, Foto- und Faktenprüfung im Bericht bestätigt und gespeichert werden." }, 409);
  }
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
