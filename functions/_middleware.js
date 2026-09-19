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
  const response = await context.next();
  const headers = new Headers(response.headers);

  for (const [name, value] of Object.entries(COMMON_SECURITY_HEADERS)) {
    headers.set(name, value);
  }

  const confirmationFrame = new URL(context.request.url).pathname === '/anfrage-bestaetigt';
  const htmlResponse = (headers.get('Content-Type') || '').toLowerCase().startsWith('text/html');
  headers.set('X-Frame-Options', confirmationFrame ? 'SAMEORIGIN' : 'DENY');

  if (!headers.has('Content-Security-Policy')) {
    headers.set(
      'Content-Security-Policy',
      confirmationFrame
        ? "default-src 'none'; frame-ancestors 'self'; base-uri 'none'"
        : htmlResponse
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
