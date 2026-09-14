export async function onRequestGet({ env, params, request }) {
  if (!env.DB) return new Response(null, { status: 503 });
  const image = await env.DB.prepare("SELECT mime_type, image_data FROM report_images WHERE id = ? LIMIT 1").bind(String(params.id)).first();
  if (!image) return new Response(null, { status: 404 });
  const etag = `"${String(params.id)}"`;
  if (request.headers.get("if-none-match") === etag) return new Response(null, { status: 304, headers: { ETag: etag } });
  return new Response(image.image_data, { headers: { "Content-Type": image.mime_type, "Cache-Control": "public, max-age=31536000, immutable", "X-Content-Type-Options": "nosniff", ETag: etag } });
}
