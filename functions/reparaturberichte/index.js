import { renderIndex, reportPageHeaders } from "../_shared/reports-page.js";

export async function onRequestGet({ env }) {
  if (!env.DB) return new Response(renderIndex([]), { headers: reportPageHeaders() });
  const { results } = await env.DB.prepare(`SELECT r.id, r.slug, r.title, r.category, r.summary, i.id AS image_id, i.alt_text AS image_alt
    FROM reports r LEFT JOIN report_images i ON i.id = (SELECT id FROM report_images WHERE report_id = r.id ORDER BY sort_order, created_at LIMIT 1)
    WHERE r.status = 'published' ORDER BY r.published_at DESC LIMIT 50`).all();
  return new Response(renderIndex(results || []), { headers: reportPageHeaders() });
}
