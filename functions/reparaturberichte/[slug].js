import { renderDetail, reportPageHeaders } from "../_shared/reports-page.js";
import { ensureReportEnhancements } from "../_shared/report-enhancements.js";

export async function onRequestGet({ env, params }) {
  if (!env.DB) return new Response("Dienst vorübergehend nicht verfügbar.", { status: 503 });
  await ensureReportEnhancements(env);
  const report = await env.DB.prepare(`SELECT r.*, COALESCE(m.device_model, '') AS device_model, COALESCE(m.repair_type, '') AS repair_type, COALESCE(m.tested_functions, '') AS tested_functions
    FROM reports r LEFT JOIN report_meta m ON m.report_id = r.id WHERE r.slug = ? AND r.status = 'published' LIMIT 1`).bind(String(params.slug)).first();
  if (!report) return new Response("Reparaturbericht nicht gefunden.", { status: 404, headers: { "Content-Type": "text/plain; charset=utf-8", "X-Robots-Tag": "noindex" } });
  const [imageResult, questionResult] = await Promise.all([
    env.DB.prepare("SELECT i.id, i.alt_text, COALESCE(m.stage, 'repair') AS stage FROM report_images i LEFT JOIN report_image_meta m ON m.image_id = i.id WHERE i.report_id = ? ORDER BY i.sort_order, i.created_at").bind(report.id).all(),
    env.DB.prepare("SELECT display_name, body, answer FROM report_questions WHERE report_id = ? AND status = 'approved' ORDER BY created_at").bind(report.id).all(),
  ]);
  return new Response(renderDetail(report, imageResult.results || [], questionResult.results || []), { headers: reportPageHeaders() });
}
