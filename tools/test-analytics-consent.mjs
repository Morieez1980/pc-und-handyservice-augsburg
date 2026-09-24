import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const code = await readFile(new URL('../analytics-consent.js', import.meta.url), 'utf8');

function page(privatePage, choice) {
  const elements = [], listeners = new Map(), storage = new Map();
  if (choice) storage.set('pc-service-analysis-consent-v2', choice);
  const document = {
    documentElement: { dataset: { privatePage: privatePage ? 'true' : 'false' } },
    head: { append: element => elements.push(element) },
    createElement: () => ({ dataset: {} }),
    addEventListener: (name, callback) => listeners.set(name, callback)
  };
  const window = { addEventListener: (name, callback) => listeners.set(name, callback) };
  const localStorage = { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) };
  vm.runInNewContext(code, { document, window, localStorage, location: { origin: 'https://example.com' }, Date, encodeURIComponent });
  return { elements, listeners, storage, window };
}

test('Google Analytics does not load before consent and loads once after opt-in', () => {
  const state = page(false);
  assert.equal(state.elements.length, 0);
  state.storage.set('pc-service-analysis-consent-v2', 'granted');
  state.listeners.get('pc-service-analysis-consent-granted')();
  state.listeners.get('pc-service-analysis-consent-granted')();
  assert.equal(state.elements.length, 1);
  assert.match(state.elements[0].src, /G-W6FZ6FN9T3/);
});

test('private repair page sends a lead only after consent and no automatic page view', () => {
  const state = page(true);
  state.window.pcTrackRepairLead();
  assert.equal(state.elements.length, 0);
  state.storage.set('pc-service-analysis-consent-v2', 'granted');
  state.window.pcTrackRepairLead();
  assert.equal(state.elements.length, 1);
  const calls = state.window.dataLayer;
  assert.equal([...calls].some(call => call[0] === 'config' && call[2].send_page_view === false), true);
  const lead = [...calls].find(call => call[0] === 'event' && call[1] === 'generate_lead');
  assert.equal(lead[2].page_location, 'https://example.com/reparaturanfrage');
  assert.deepEqual(Object.keys(lead[2]).sort(), ['lead_source', 'page_location']);
});
