export function onRequestGet() {
  return new Response('<!doctype html><html lang="de"><meta charset="utf-8"><title>Anfrage übermittelt</title><p>Ihre Anfrage wurde übermittelt. Bitte prüfen Sie auch Ihr E-Mail-Postfach.</p></html>', {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex, nofollow',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'SAMEORIGIN',
      'Content-Security-Policy': "default-src 'none'; frame-ancestors 'self'; base-uri 'none'",
      'Referrer-Policy': 'no-referrer'
    }
  });
}
