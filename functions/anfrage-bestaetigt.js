import { consumeConfirmationToken } from './_shared/repair-confirmation.js';

const page = (title, message, confirmation) => `<!doctype html><html lang="de" data-confirmation="${confirmation}"><meta charset="utf-8"><title>${title}</title><p>${message}</p></html>`;

const headers = {
  'Content-Type': 'text/html; charset=utf-8',
  'Cache-Control': 'no-store',
  'X-Robots-Tag': 'noindex, nofollow',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'SAMEORIGIN',
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains',
  'Content-Security-Policy': "default-src 'none'; frame-ancestors 'self'; base-uri 'none'",
  'Referrer-Policy': 'no-referrer'
};

export async function onRequestGet({ request, env }) {
  const reference = new URL(request.url).searchParams.get('ref') || '';
  const valid = env.DB && await consumeConfirmationToken(env.DB, reference);

  return new Response(valid
    ? page('Anfrage übermittelt', 'Ihre Anfrage wurde übermittelt. Bitte prüfen Sie auch Ihr E-Mail-Postfach.', 'valid')
    : page('Bestätigung ungültig', 'Diese Bestätigungsnummer ist ungültig oder bereits abgelaufen. Es wurde keine Übermittlung bestätigt.', 'invalid'), {
    status: valid ? 200 : 400,
    headers: {
      ...headers
    }
  });
}
