import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { onRequestGet } from '../functions/api/review-summary.js';
import { onRequestGet as getGoogleReviews } from '../functions/api/google-reviews.js';

const response = await onRequestGet({ env: {} });
const body = await response.json();

assert.equal(response.status, 200);
assert.equal(body.rating, 4.9);
assert.equal(body.reviewCount, 91);
assert.equal(body.source, 'verified-fallback');
assert.match(response.headers.get('Cache-Control'), /s-maxage=86400/);

console.log('Google-Bewertungsfunktion: geprüfter Ausfallwert 4,9 / 91 ist gültig.');

const unconfiguredResponse = await getGoogleReviews({ env: {} });
const unconfiguredBody = await unconfiguredResponse.json();
assert.equal(unconfiguredResponse.status, 200);
assert.equal(unconfiguredBody.source, 'not-configured');
assert.deepEqual(unconfiguredBody.reviews, []);
assert.equal(unconfiguredResponse.headers.get('Cache-Control'), 'no-store');

const originalFetch = globalThis.fetch;
const requestedUrls = [];
globalThis.fetch = async (input) => {
  const url = String(input);
  requestedUrls.push(url);
  if (url === 'https://oauth2.googleapis.com/token') {
    return new Response(JSON.stringify({ access_token: 'temporary-access-token' }), { status: 200 });
  }
  if (url.includes('mybusinessaccountmanagement.googleapis.com')) {
    return new Response(JSON.stringify({ accounts: [{ name: 'accounts/123' }, { name: 'accounts/999' }] }), { status: 200 });
  }
  if (url.includes('mybusinessbusinessinformation.googleapis.com')) {
    const locations = url.includes('accounts/123')
      ? [{ name: 'locations/111', title: 'Anderes Unternehmen', storeCode: 'OTHER 001' }]
      : [{ name: 'locations/456', title: 'PC & Handyservice Augsburg', storeCode: 'MUC 00052702' }];
    return new Response(JSON.stringify({ locations }), { status: 200 });
  }
  if (url.includes('mybusiness.googleapis.com')) {
    if (url.includes('pageToken=next-reviews-page')) {
      return new Response(JSON.stringify({
        averageRating: 4.9,
        totalReviewCount: 88,
        reviews: [{
          reviewer: { displayName: 'Erika Beispiel' },
          starRating: 'FIVE',
          comment: 'Sehr gute und transparente Beratung.',
          createTime: '2026-08-10T08:00:00Z',
          updateTime: '2026-08-10T08:00:00Z'
        }]
      }), { status: 200 });
    }
    return new Response(JSON.stringify({
      averageRating: 4.9,
      totalReviewCount: 88,
      nextPageToken: 'next-reviews-page',
      reviews: [{
        reviewer: { displayName: 'Max Mustermann', profilePhotoUrl: 'https://example.invalid/photo.jpg' },
        starRating: 'FIVE',
        comment: 'Schnelle und freundliche Hilfe.',
        createTime: '2026-09-01T12:00:00Z',
        updateTime: '2026-09-01T12:00:00Z'
      }]
    }), { status: 200 });
  }
  return new Response('{}', { status: 404 });
};

try {
  const liveResponse = await getGoogleReviews({
    env: {
      GOOGLE_OAUTH_CLIENT_ID: 'client-id',
      GOOGLE_OAUTH_CLIENT_SECRET: 'client-secret',
      GOOGLE_OAUTH_REFRESH_TOKEN: 'refresh-token'
    }
  });
  const liveBody = await liveResponse.json();
  assert.equal(liveBody.source, 'google-business-profile');
  assert.equal(liveBody.rating, 4.9);
  assert.equal(liveBody.reviewCount, 88);
  assert.equal(liveBody.reviews.length, 2);
  assert.deepEqual(liveBody.reviews[0], {
    author: 'Max Mustermann',
    rating: 5,
    text: 'Schnelle und freundliche Hilfe.',
    publishedAt: '2026-09-01T12:00:00Z',
    updatedAt: '2026-09-01T12:00:00Z'
  });
  assert.equal('profilePhotoUrl' in liveBody.reviews[0], false);
  assert(requestedUrls.some((url) => url.includes('orderBy=updateTime+desc')));
  assert(requestedUrls.some((url) => url.includes('pageSize=50')));
  assert(requestedUrls.some((url) => url.includes('pageToken=next-reviews-page')));
  assert(requestedUrls.some((url) => url.includes('accounts/999/locations/456/reviews')));
} finally {
  globalThis.fetch = originalFetch;
}

console.log('Google-Rezensionsfunktion: OAuth, Standort-Erkennung und datensparsame Ausgabe sind gültig.');

const browserScript = await readFile(new URL('../script.js', import.meta.url), 'utf8');
const pageMarkup = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const pageStyles = await readFile(new URL('../styles.css', import.meta.url), 'utf8');
const qrStyles = await readFile(new URL('../qr.css', import.meta.url), 'utf8');
assert.match(browserScript, /Promise\.all\(\[reviewSummaryRequest, googleReviewsRequest\]\)/);
assert.match(browserScript, /googleData\?\.source === 'google-business-profile' \? googleData : fallbackData/);
assert.match(pageMarkup, /data-review-dialog-open hidden disabled/);
assert.match(pageStyles, /\.review-dialog-trigger\[hidden\]\{display:none!important\}/);
assert.match(browserScript, /reviewDialogOpen\.disabled = false/);
assert.match(browserScript, /!reviewDialogList\?\.children\.length/);
assert.match(qrStyles, /\.qr-card > span[\s\S]*background: linear-gradient\(135deg, var\(--blue\), var\(--cyan\)\)/);
assert.match(qrStyles, /\.qr-security-note[\s\S]*border-left: 3px solid #ff6b61/);
console.log('Google-Bewertungsanzeige: Live-Daten haben eine feste Priorität vor dem Ausfallwert.');
console.log('Google-Bewertungsfenster: Ohne geladene Rezensionen bleibt der Auslöser sicher verborgen.');
console.log('Farbsystem: Blau/Cyan bleibt der Markenakzent; Rot ist auf den Sicherheitshinweis begrenzt.');
