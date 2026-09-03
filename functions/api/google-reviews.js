const SUCCESS_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'public, max-age=900, s-maxage=3600, stale-while-revalidate=86400',
  'X-Content-Type-Options': 'nosniff'
};

const FALLBACK_HEADERS = {
  ...SUCCESS_HEADERS,
  'Cache-Control': 'no-store'
};

const json = (body, headers = SUCCESS_HEADERS) => new Response(JSON.stringify(body), {
  status: 200,
  headers
});

const resourceId = (value = '') => value.split('/').filter(Boolean).at(-1) ?? '';

const fetchJson = async (url, options = {}) => {
  const response = await fetch(url, options);
  if (!response.ok) throw new Error(`Google API antwortete mit ${response.status}`);
  return response.json();
};

const getAccessToken = async (env) => {
  const body = new URLSearchParams({
    client_id: env.GOOGLE_OAUTH_CLIENT_ID,
    client_secret: env.GOOGLE_OAUTH_CLIENT_SECRET,
    refresh_token: env.GOOGLE_OAUTH_REFRESH_TOKEN,
    grant_type: 'refresh_token'
  });

  const token = await fetchJson('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  });

  if (!token.access_token) throw new Error('Google lieferte kein Zugriffstoken');
  return token.access_token;
};

const authorizedJson = (url, accessToken) => fetchJson(url, {
  headers: {
    Accept: 'application/json',
    Authorization: `Bearer ${accessToken}`
  }
});

const selectLocation = (locations, env) => {
  const wantedId = resourceId(env.GOOGLE_BUSINESS_LOCATION_ID);
  const wantedStoreCode = (env.GOOGLE_BUSINESS_STORE_CODE || 'MUC 00052702').trim().toLowerCase();
  const wantedTitle = (env.GOOGLE_BUSINESS_LOCATION_TITLE || 'PC & Handyservice Augsburg').trim().toLowerCase();

  return locations.find((location) => wantedId && resourceId(location.name) === wantedId)
    ?? locations.find((location) => location.storeCode?.trim().toLowerCase() === wantedStoreCode)
    ?? locations.find((location) => location.title?.trim().toLowerCase().includes(wantedTitle))
    ?? (locations.length === 1 ? locations[0] : null);
};

const discoverReviewParent = async (accessToken, env) => {
  if (env.GOOGLE_BUSINESS_ACCOUNT_ID && env.GOOGLE_BUSINESS_LOCATION_ID) {
    return `accounts/${resourceId(env.GOOGLE_BUSINESS_ACCOUNT_ID)}/locations/${resourceId(env.GOOGLE_BUSINESS_LOCATION_ID)}`;
  }

  const accountResponse = await authorizedJson(
    'https://mybusinessaccountmanagement.googleapis.com/v1/accounts?pageSize=20',
    accessToken
  );
  const wantedAccountId = resourceId(env.GOOGLE_BUSINESS_ACCOUNT_ID);
  const accounts = (accountResponse.accounts ?? []).filter((account) => (
    !wantedAccountId || resourceId(account.name) === wantedAccountId
  ));

  for (const account of accounts) {
    try {
      const url = new URL(`https://mybusinessbusinessinformation.googleapis.com/v1/${account.name}/locations`);
      url.searchParams.set('pageSize', '100');
      url.searchParams.set('readMask', 'name,title,storeCode');

      const locationResponse = await authorizedJson(url.toString(), accessToken);
      const location = selectLocation(locationResponse.locations ?? [], env);
      if (location) return `${account.name}/${location.name}`;
    } catch {
      // Manche Kontotypen enthalten keine direkt abrufbaren Standorte.
    }
  }

  throw new Error('Kein passender Google-Unternehmensstandort gefunden');
};

const STAR_VALUES = Object.freeze({
  ONE: 1,
  TWO: 2,
  THREE: 3,
  FOUR: 4,
  FIVE: 5
});

const publicReview = (review) => ({
  author: review.reviewer?.displayName?.trim() || 'Google-Nutzer',
  rating: STAR_VALUES[review.starRating] ?? 0,
  text: review.comment?.trim() || '',
  publishedAt: review.createTime || review.updateTime || null,
  updatedAt: review.updateTime || review.createTime || null
});

export async function onRequestGet({ env }) {
  if (!env.GOOGLE_OAUTH_CLIENT_ID || !env.GOOGLE_OAUTH_CLIENT_SECRET || !env.GOOGLE_OAUTH_REFRESH_TOKEN) {
    return json({ reviews: [], source: 'not-configured' }, FALLBACK_HEADERS);
  }

  try {
    const accessToken = await getAccessToken(env);
    const parent = await discoverReviewParent(accessToken, env);
    const url = new URL(`https://mybusiness.googleapis.com/v4/${parent}/reviews`);
    url.searchParams.set('pageSize', '5');
    url.searchParams.set('orderBy', 'updateTime desc');

    const data = await authorizedJson(url.toString(), accessToken);
    const reviews = (data.reviews ?? [])
      .map(publicReview)
      .filter((review) => review.rating >= 1 && review.rating <= 5)
      .slice(0, 5);

    return json({
      rating: typeof data.averageRating === 'number' ? data.averageRating : null,
      reviewCount: Number.isInteger(data.totalReviewCount) ? data.totalReviewCount : null,
      reviews,
      updatedAt: new Date().toISOString(),
      source: 'google-business-profile'
    });
  } catch {
    return json({ reviews: [], source: 'temporarily-unavailable' }, FALLBACK_HEADERS);
  }
}
