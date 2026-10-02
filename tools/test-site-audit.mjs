import test from 'node:test';
import assert from 'node:assert/strict';
import { addPublishedReports } from '../functions/_shared/sitemap.js';
import { renderDetail, imageDescription } from '../functions/_shared/reports-page.js';
test('Sitemap appends published reports, escapes URLs and falls back on DB errors', async () => {
  const original = new Response('<urlset></urlset>');
  let query = '';
  const env = { DB: { prepare(sql) { query = sql; return { all: async () => ({ results: [{ slug: 'gerät & test', updated_at:'2026-10-02' }] }) }; } } };
  const response = await addPublishedReports(original, env);
  assert.match(query, /WHERE status = 'published'/);
  assert.match(await response.text(), /ger%C3%A4t%20%26%20test/);
  const fallback = new Response('<urlset></urlset>');
  assert.equal(await addPublishedReports(fallback, {DB:{prepare(){throw Error('offline')}}}), fallback);
});
test('Report labels preserve editorial descriptions and replace import filenames', () => {
  assert.equal(imageDescription('Akkuanschluss vor dem Ausbau','iPhone'), 'Akkuanschluss vor dem Ausbau');
  assert.equal(imageDescription('WhatsApp Image 2026-09-14','iPhone SE','repair',0), 'Reparatur: iPhone SE – Foto 1');
  const html = renderDetail({title:'iPhone SE',slug:'iphone-se',id:'one'},[{id:'img1',alt_text:'WhatsApp Image 2026-09-14'}],[]);
  assert.ok(html.includes('data-nav-toggle'));
  assert.ok(html.includes('data-nav>'));
  assert.ok(!html.includes('WhatsApp Image'));
  assert.ok(html.includes('anschließend per WhatsApp'));
});
