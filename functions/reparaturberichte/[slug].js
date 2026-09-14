import { renderDetail, reportPageHeaders } from "../_shared/reports-page.js";

export async function onRequestGet({ env, params }) {
  if (!env.DB) return new Response("Dienst vorübergehend nicht verfügbar.", { status: 503 });
  const report = await env.DB.prepare("SELECT * FROM reports WHERE slug = ? AND status = 'published' LIMIT 1").bind(String(params.slug)).first();
  if (!report) return new Response("Reparaturbericht nicht gefunden.", { status: 404, headers: { "Content-Type": "text/plain; charset=utf-8", "X-Robots-Tag": "noindex" } });
  const [imageResult, questionResult] = await Promise.all([
    env.DB.prepare("SELECT id, alt_text FROM report_images WHERE report_id = ? ORDER BY sort_order, created_at").bind(report.id).all(),
    env.DB.prepare("SELECT display_name, body, answer FROM report_questions WHERE report_id = ? AND status = 'approved' ORDER BY created_at").bind(report.id).all(),
  ]);
  return new Response(renderDetail(report, imageResult.results || [], questionResult.results || []), { headers: reportPageHeaders() });
}
