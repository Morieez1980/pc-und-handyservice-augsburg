import { writeFile } from 'node:fs/promises';

const apiKey = process.env.GOOGLE_PLACES_API_KEY?.trim();
const placeId = process.env.GOOGLE_PLACE_ID?.trim();
const profileUrl = 'https://share.google/0Fr2Kl1iXhIG9e8RP';

if (!apiKey || !placeId) {
  console.log('GOOGLE_PLACES_API_KEY oder GOOGLE_PLACE_ID fehlt. Bestehender Fallback bleibt unverändert.');
  process.exit(0);
}

const endpoint = `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`;
const response = await fetch(endpoint, {
  headers: {
    'X-Goog-Api-Key': apiKey,
    'X-Goog-