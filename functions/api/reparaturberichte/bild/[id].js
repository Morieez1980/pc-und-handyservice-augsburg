export async function onRequestGet({ env, params, request }) {
  if (!env.DB) return new Response(null, { status: 503 });
  const image = await env.DB.prepare("SELECT mime_type, image_data FROM report_images WHERE id = ? LIMIT 1").bind(String(params.id)).first();
  if (!image) return new Response(null, { status: 404 });
  const etag = `"${String(params.id)}"`;
  if (request.headers.get("if-none-match") === etag) return new Response(null, { status: 304, headers: { ETag: etag } });
  const bytes = image.image_data instanceof ArrayBuffer
    ? new Uint8Array(image.image_data)
    : ArrayBuffer.isView(image.image_data)
      ? new Uint8Array(image.image_data.buffer, image.image_data.byteOffset, image.image_data.byteLength)
      : Array.isArray(image.image_data)
        ? Uint8Array.from(image.image_data)
        : null;
  if (!bytes) return new Response(null, { status: 500 });
  return new Response(bytes, { headers: { "Content-Type": image.mime_type, "Content-Length": String(bytes.byteLength), "Cache-Control": "public, max-age=86400, must-revalidate", "X-Content-Type-Options": "nosniff", ETag: etag } });
}
