const FALLBACK = Object.freeze({
  rating: 4.9,
  reviewCount: 83,
  updatedAt: '2026-08-01T00:00:00+02:00'
});

const responseHeaders = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
  'X-Content-Type-Options': 'nosniff'
};

const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: responseHeaders
});

export async function onRequestGet({ env }) {
  const apiKey = env.GOOGLE_PLACES_API_KEY;
  const placeId = env.GOOGLE_PLACE_ID;

  if (!apiKey || !placeId) {
    return json({ ...FALLBACK, source: 'verified-fallback' });
  }

  try {
    const endpoint = `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`;
    const response = await fetch(endpoint, {
      headers: {
        Accept: 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'rating,userRatingCount'
      }
    });

    if (!response.ok) throw new Error(`Google Places antwortete mit ${response.status}`);

    const place = await response.json();
    if (!Number.isInteger(place.userRatingCount) || typeof place.rating !== 'number') {
      throw new Error('Google Places lieferte unvollständige Bewertungsdaten');
    }

    return json({
      rating: place.rating,
      reviewCount: place.userRatingCount,
      updatedAt: new Date().toISOString(),
      source: 'google-places'
    });
  } catch {
    return json({ ...FALLBACK, source: 'verified-fallback' });
  }
}
