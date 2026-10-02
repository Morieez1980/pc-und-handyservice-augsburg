const origin = 'https://www.pc-und-handyservice-augsburg.com';
export async function addPublishedReports(response, env) {
  if (!response.ok || !env.DB) return response;
  const xml = await response.clone().text();
  if (!xml.includes('</urlset>')) return response;
  try {
    const { results } = await env.DB.prepare("SELECT slug, updated_at FROM reports WHERE status = 'published' ORDER BY published_at DESC").all();
    const entries = (results || []).filter(row => row.slug).map(row => {
      const url = origin + '/reparaturberichte/' + encodeURIComponent(row.slug);
      if (xml.includes('<loc>' + url + '</loc>')) return '';
      const date = new Date(row.updated_at);
      const lastmod = Number.isNaN(date.getTime()) ? '' : '<lastmod>' + date.toISOString().slice(0,10) + '</lastmod>';
      return '<url><loc>' + url + '</loc>' + lastmod + '</url>';
    }).join('\n');
    const headers = new Headers(response.headers);
    headers.set('Content-Type', 'application/xml; charset=utf-8');
    headers.set('Cache-Control', 'public, max-age=300');
    headers.delete('Content-Length'); headers.delete('ETag'); headers.delete('Content-Encoding');
    return new Response(xml.replace('</urlset>', entries + '\n</urlset>'), { status: 200, headers });
  } catch { return response; }
}
