import assert from 'node:assert/strict';
import { onRequestGet } from '../functions/api/google-reviews.js';

const response = await onRequestGet({ env: {} });
const body = await response.json();

assert.equal(response.status, 200);
assert.equal(body.rating, 4.9);
assert.equal(body.reviewCount, 83);
assert.equal(body.source, 'verified-fallback');
assert.match(response.headers.get('Cache-Control'), /s-maxage=86400/);

console.log('Google-Bewertungsfunktion: geprüfter Ausfallwert 4,9 / 83 ist gültig.');
