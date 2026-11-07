import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import path from 'node:path';
import {test} from 'node:test';
import {Script} from 'node:vm';
import {fileURLToPath} from 'node:url';

const root = new URL('../', import.meta.url);
const html = readFileSync(new URL('apps.html', root), 'utf8');
const scriptPath = html.match(/<script\b[^>]*src=["'](\/(?:apps|app-hub)\.js(?:\?[^"']*)?)["']/)?.[1];
assert.ok(scriptPath, 'The real app page must link its app script');
const scriptUrl = new URL(scriptPath, 'https://fixture.invalid');
assert.equal(scriptUrl.origin, 'https://fixture.invalid');
const source = readFileSync(new URL('.' + scriptUrl.pathname, root), 'utf8');
const workflow = readFileSync(new URL('.github/workflows/monitor.yml', root), 'utf8');
const probe = workflow.split('// BEGIN APP DOWNLOAD GATE PROBE:')[1]?.split('// END APP DOWNLOAD GATE PROBE')[0];
assert.ok(probe, 'Test the exact gate probe used by the production monitor');
const functions = new Script('//' + probe + '\n({observeDownloadGate, verifyDownloadGate})').runInNewContext({assert, Script, URL, URLSearchParams, setImmediate});
const {observeDownloadGate, verifyDownloadGate} = functions;
const monitorStep = workflow.split('- name: Check app hub and avatar asset contents')[1]?.split('      - name:')[0]?.split('        run: |')[1]?.split('\n').map(line => line.replace(/^          /, '')).join('\n');
assert.ok(monitorStep, 'Read the actual production-monitor Node step');
const flags = ['published', 'legalReviewComplete', 'practicalAcceptanceComplete'];
const validUrl = 'https://downloads.example.test/demo.zip?edition=demo&v=1#download';
const offer = (overrides = {}) => ({published: true, legalReviewComplete: true, practicalAcceptanceComplete: true, demo: {url: validUrl}, purchaseDownloadUrl: null, ...overrides});

function assertUnavailable(state) {
  assert.equal(state.disabled, 'true');
  assert.equal(state.href, state.initialHref);
  assert.equal(state.clickPrevented, true);
  assert.ok(state.notices.length > 0, 'Use the real preview notice from apps.html');
  assert.ok(state.notices.every(removed => !removed));
  assert.equal(state.status, '');
}

test('the linked production script enables the valid HTTPS target and removes the preview', async () => {
  assert.equal(scriptUrl.pathname, '/apps.js');
  const state = await observeDownloadGate(source, html, offer());
  assert.equal(state.href, validUrl);
  assert.equal(state.disabled, null);
  assert.equal(state.clickPrevented, false);
  assert.ok(state.notices.length > 0);
  assert.ok(state.notices.every(removed => removed));
  assert.match(state.status, /30 Tage/);
  await verifyDownloadGate(source, html, offer());
});

for (const flag of flags) {
  test(`the actual script keeps the preview and blocks the link while ${flag} is false`, async () => {
    assertUnavailable(await observeDownloadGate(source, html, offer({[flag]: false})));
    await verifyDownloadGate(source, html, offer({[flag]: false, demo: {url: null}}));
  });
}

test('string release flags cannot activate the download', async () => {
  assertUnavailable(await observeDownloadGate(source, html, offer({published: 'true'})));
});

const invalidUrls = [
  ['missing', undefined],
  ['null', null],
  ['empty', ''],
  ['HTTP', 'http://downloads.example.test/demo.zip'],
  ['username', 'https://user@downloads.example.test/demo.zip'],
  ['password', 'https://user:secret@downloads.example.test/demo.zip'],
  ['JavaScript', 'javascript:alert(1)'],
  ['relative', '/demo.zip'],
  ['malformed', 'https://']
];
for (const [name, url] of invalidUrls) {
  test(`all three flags true with ${name} URL keeps the preview and fails the monitor`, async () => {
    const data = offer({demo: url === undefined ? {} : {url}});
    assertUnavailable(await observeDownloadGate(source, html, data));
    await assert.rejects(verifyDownloadGate(source, html, data), /Released demo URL must be valid HTTPS without credentials/);
  });
}

test('the monitor detects a real script regression that chooses the wrong target', async () => {
  const broken = source.replace('link.href=url;', "link.href='https://wrong.example.test/demo.zip';");
  assert.notEqual(broken, source);
  await assert.rejects(verifyDownloadGate(broken, html, offer()), /wrong target/);
});

test('the monitor detects a real script regression that leaves the link disabled', async () => {
  const broken = source.replace("link.removeAttribute('aria-disabled');", 'void 0;');
  assert.notEqual(broken, source);
  await assert.rejects(verifyDownloadGate(broken, html, offer()), /still disabled/);
});

test('the monitor detects a real script regression that leaves the preview in place', async () => {
  const broken = source.replace("document.querySelectorAll('[data-preview-notice]').forEach(n=>n.remove());", 'void 0;');
  assert.notEqual(broken, source);
  await assert.rejects(verifyDownloadGate(broken, html, offer()), /preview notice was not removed/);
});

test('the monitor rejects incomplete unreleased configuration instead of exposing its target', async () => {
  await assert.rejects(verifyDownloadGate(source, html, offer({published: false})), /Unreleased demo URL must remain unset/);
  await assert.rejects(verifyDownloadGate(source, html, offer({published: false, demo: {url: null}, purchaseDownloadUrl: validUrl})), /Unreleased purchase URL must remain unset/);
});

async function runProductionMonitor(data) {
  const base = 'https://monitor.fixture';
  const process = {env: {MONITOR_BASE: base}, exitCode: 0};
  const failures = [], messages = [];
  let finish;
  const completed = new Promise(resolve => { finish = resolve; });
  const deadline = setTimeout(finish, 1000);
  const mime = {'.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.webp': 'image/webp'};
  const rootPath = fileURLToPath(root);
  new Script(monitorStep, {filename: '.github/workflows/monitor.yml:app-step'}).runInNewContext({
    require(name) {
      if (name === 'node:assert/strict') return assert;
      if (name === 'node:vm') return {Script};
      throw Error('Unexpected monitor dependency: ' + name);
    },
    process, Buffer, URL, URLSearchParams, AbortSignal, setImmediate,
    console: {log(value) { messages.push(String(value)); finish(); }, error(error) { failures.push(String(error)); finish(); }},
    fetch: async value => {
      const url = new URL(value);
      assert.equal(url.origin, base, 'No production network request is allowed in this fixture test');
      const name = url.pathname === '/' ? 'index.html' : url.pathname.includes('.') ? url.pathname.slice(1) : url.pathname.slice(1) + '.html';
      const file = path.resolve(rootPath, name);
      assert.ok(file.startsWith(rootPath), 'Fixture path must stay inside the website checkout');
      const bytes = url.pathname === '/app-offer.json' ? Buffer.from(JSON.stringify(data)) : readFileSync(file);
      return {status: 200, headers: {get() { return mime[path.extname(file)] || ''; }}, arrayBuffer: async () => bytes};
    }
  }, {timeout: 1000});
  await completed;
  clearTimeout(deadline);
  assert.ok(messages.length || failures.length, 'The complete production-monitor step did not settle');
  return {code: process.exitCode, failures: failures.join('\n'), messages};
}

test('the complete production monitor checks the linked app script, using local responses only', async () => {
  const actual = JSON.parse(readFileSync(new URL('app-offer.json', root), 'utf8'));
  assert.equal((await runProductionMonitor(actual)).code, 0);
  const released = {...actual, ...offer()};
  const good = await runProductionMonitor(released);
  assert.equal(good.code, 0, good.failures);
  const invalid = await runProductionMonitor({...released, demo: {url: 'javascript:alert(1)'}});
  assert.equal(invalid.code, 1);
  assert.match(invalid.failures, /Released demo URL must be valid HTTPS without credentials/);
});
