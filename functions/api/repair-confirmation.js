import { issueConfirmationToken } from '../_shared/repair-confirmation.js';
import { json, methodNotAllowed } from '../_shared/http.js';

export async function onRequestPost({ env }) {
  if (!env.DB) return json({ error: 'Bestätigungsdienst ist nicht verfügbar.' }, 503);

  try {
    const { token, expiresAt } = await issueConfirmationToken(env.DB);
    return json({ ref: token, expiresAt }, 201);
  } catch {
    return json({ error: 'Bestätigungsnummer konnte nicht erstellt werden.' }, 500);
  }
}

export function onRequestGet() {
  return methodNotAllowed(['POST']);
}
