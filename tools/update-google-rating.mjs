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
    'X-Goog-FieldMask': 'rating,userRatingCount,googleMapsUri'
  }
});

if (!response.ok) {
  const details = await response.text();
  throw new Error(`Google Places API antwortete mit HTTP ${response.status}: ${details}`);
}

const place = await response.json();
const rating = Number(place.rating);
const reviewCount = Number(place.userRatingCount);

if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
  throw new Error('Die Google Places API lieferte keine gültige Bewertung.');
}

if (!Number.isInteger(reviewCount) || reviewCount < 0) {
  throw new Error('Die Google Places API lieferte keine gültige Bewertungsanzahl.');
}

const payload = {
  rating: Number(rating.toFixed(1)),
  reviewCount,
  profileUrl,
  updatedAt: new Date().toISOString(),
  source: 'google-places-api'
};

await writeFile('google-rating.json', `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
console.log(`Google-Bewertung aktualisiert: ${payload.rating} Sterne bei ${payload.reviewCount} Rezensionen.`);
