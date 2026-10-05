import { addPublishedReports } from './_shared/sitemap.js';

const COMMON_SECURITY_HEADERS = Object.freeze({
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'accelerometer=(), autoplay=(), camera=(), display-capture=(), encrypted-media=(), fullscreen=(self), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), picture-in-picture=(), publickey-credentials-get=(), usb=()',
  'X-Permitted-Cross-Domain-Policies': 'none',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin'
});

export async function onRequest(context) {
  let response = await context.next();
  if (new URL(context.request.url).pathname === '/sitemap.xml') response = await addPublishedReports(response, context.env || {});
  const headers = new Headers(response.headers);

  for (const [name, value] of Object.entries(COMMON_SECURITY_HEADERS)) {
    headers.set(name, value);
  }

  const pathname = new URL(context.request.url).pathname;
  const confirmationFrame = ['/anfrage-bestaetigt', '/bigin-rueckmeldung', '/bigin-rueckmeldung.html'].includes(pathname);
  const htmlResponse = (headers.get('Content-Type') || '').toLowerCase().startsWith('text/html');
  headers.set('X-Frame-Options', confirmationFrame ? 'SAMEORIGIN' : 'DENY');

  if (confirmationFrame) {
    // Cloudflare may supply static _headers and redirect .html to the clean URL.
    // Both return pages must be readable in the form's same-origin iframe.
    headers.set('Content-Security-Policy', "default-src 'none'; frame-ancestors 'self'; base-uri 'none'; style-src 'self' 'unsafe-inline'");
    headers.set('Cache-Control', 'no-store');
    headers.set('X-Robots-Tag', 'noindex, nofollow');
    headers.set('Referrer-Policy', 'no-referrer');
  } else if (!headers.has('Content-Security-Policy')) {
    headers.set(
      'Content-Security-Policy',
      htmlResponse
          ? "default-src 'self'; base-uri 'self'; connect-src 'self' https://*.clarity.ms https://c.bing.com; font-src 'self'; form-action 'self' https://bigin.zoho.eu; frame-ancestors 'none'; frame-src https://bigin.zoho.eu https://eu.bigin.online 'self'; img-src 'self' data: https://*.clarity.ms https://c.bing.com; manifest-src 'self'; object-src 'none'; script-src 'self' https://www.clarity.ms; style-src 'self' 'unsafe-inline'; worker-src 'none'; upgrade-insecure-requests"
          : "default-src 'none'; frame-ancestors 'none'; base-uri 'none'"
    );
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}
