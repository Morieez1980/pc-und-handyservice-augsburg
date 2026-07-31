const json=(body,status)=>new Response(JSON.stringify(body),{status,headers:{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store","X-Content-Type-Options":"nosniff"}});

export async function onRequestGet({ env }) {
  const apiKey = env.GOOGLE_MAPS_API_KEY;
  const placeId = env.GOOGLE_PLACE_ID;

  if (!apiKey || !placeId) {
    return json({ error: "not_configured" }, 503);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4500);

  try {
    const response = await fetch(
      `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`,
      {
        headers: {
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask": "rating,userRatingCount"
        },
        signal: controller.signal
      }
    );

    if (!response.ok) {
      return json({ error: "upstream_error" }, 502);
    }

    const data = await response.json();
    const rating = Number(data.rating);
    const userRatingCount = Number(data.userRatingCount);

    if (
      !Number.isFinite(rating) ||
      rating < 0 ||
      rating > 5 ||
      !Number.isInteger(userRatingCount) ||
      userRatingCount < 0
    ) {
      return json({ error: "invalid_response" }, 502);
    }

    return json({ rating, userRatingCount }, 200);
  } catch {
    return json({ error: "upstream_unavailable" }, 502);
  } finally {
    clearTimeout(timeout);
  }
}
