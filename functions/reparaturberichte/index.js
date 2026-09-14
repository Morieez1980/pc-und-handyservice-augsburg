import { renderIndex, reportPageHeaders } from "../_shared/reports-page.js";
import { ensureReportEnhancements } from "../_shared/report-enhancements.js";

export async function onRequestGet({ env }) {
  if (!env.DB) return new Response(renderIndex([]), { headers: reportPageHeaders() });
  await ensureReportEnhancements(env);
  const { results } = await env.DB.prepare(`SELECT r.id, r.slug, r.title, r.category, r.summary, i.id AS image_id, i.alt_text AS image_alt,
    COALESCE(m.device_model, '') AS device_model, COALESCE(m.repair_type, '') AS repair_type
    FROM reports r LEFT JOIN report_meta m ON m.report_id = r.id LEFT JOIN report_images i ON i.id = (SELECT id FROM report_images WHERE report_id = r.id ORDER BY sort_order, created_at LIMIT 1)
    WHERE r.status = 'published' ORDER BY r.published_at DESC LIMIT 50`).all();
  return new Response(renderIndex(results || []), { headers: reportPageHeaders() });
}
