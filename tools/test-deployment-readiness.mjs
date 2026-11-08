import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import {Script} from 'node:vm';

const root = new URL('../', import.meta.url);
const readFile = file => readFileSync(new URL(file, root), 'utf8');
const workflow = readFile('.github/workflows/monitor.yml');
const probe = workflow.split('// BEGIN DEPLOYMENT READINESS:')[1]?.split('// END DEPLOYMENT READINESS')[0];
assert.ok(probe, 'Test the exact deployment-readiness code used by the monitor');
const {expectedDeployment, checkDeployment, waitForDeployment, endpoints} = new Script('//' + probe + '\n({expectedDeployment, checkDeployment, waitForDeployment, endpoints})').runInNewContext({assert, URL});
const expected = expectedDeployment(readFile);
const files = new Map([
  ['/', readFile('index.html')], ['/apps', readFile('apps.html')],
  ['/reparaturanfrage', readFile('reparaturanfrage.html')],
  [expected.helper, readFile('repair-helper.js')], [expected.css, readFile('home-intro.css')], [expected.scene, readFile('repair-work-scene.js')]
]);

function fixture(changes = {}, requests = []) {
  return async (path, text) => {
    requests.push(path);
    if (Object.hasOwn(changes, path)) {
      if (changes[path] instanceof Error) throw changes[path];
      return changes[path];
    }
    if (!text && endpoints.includes(path)) return undefined;
    assert.ok(files.has(path), 'Unexpected fixture request: ' + path);
    return files.get(path);
  };
}

function clock() {
  let elapsed = 0;
  const sleeps = [], messages = [];
  return {sleeps, messages, now: () => elapsed, sleep: async ms => { sleeps.push(ms); elapsed += ms; }, log: message => messages.push(message), budgetMs: 25, pollMs: 10};
}

test('the current checkout passes and preserves every existing endpoint check', async () => {
  const requests = [], timer = clock();
  const attempts = await waitForDeployment(() => checkDeployment(expected, fixture({}, requests)), timer);
  assert.equal(attempts, 1);
  assert.equal(timer.sleeps.length, 0);
  for (const endpoint of endpoints) assert.ok(requests.includes(endpoint), 'Endpoint was not checked: ' + endpoint);
  assert.ok(requests.includes(expected.helper));
  assert.ok(requests.includes(expected.css));
  assert.ok(requests.includes(expected.scene));
});

test('a still-successful old deployment is waited out until current version references arrive', async () => {
  const oldHome = files.get('/').replaceAll(expected.helper, '/repair-helper.js?v=old-avatar').replaceAll(expected.css, '/home-intro.css?v=old-avatar');
  assert.notEqual(oldHome, files.get('/'), 'The stale fixture must replace current asset references');
  const timer = clock();
  let reads = 0;
  const attempts = await waitForDeployment(() => checkDeployment(expected, fixture(++reads === 1 ? {'/': oldHome} : {})), timer);
  assert.equal(attempts, 2);
  assert.deepEqual(timer.sleeps, [10]);
  assert.match(timer.messages[0], /waiting for current frontend reference/);
});

test('an indefinitely old deployment fails at the bounded deadline instead of checking old PNG budgets', async () => {
  const timer = clock();
  const appScript = expected.pages[1].refs.find(ref => /^\/(?:apps|app-hub)\.js\?/.test(ref));
  assert.ok(appScript, 'Current app script reference is required');
  const oldApps = files.get('/apps').replaceAll(appScript, '/apps.js?v=old-app');
  assert.notEqual(oldApps, files.get('/apps'), 'The stale fixture must replace the current app reference');
  const requests = [];
  await assert.rejects(waitForDeployment(() => checkDeployment(expected, fixture({'/apps': oldApps}, requests)), timer), /did not become ready.*current frontend reference/);
  assert.equal(timer.now(), 25);
  assert.deepEqual(timer.sleeps, [10, 10, 5]);
  assert.ok(!requests.some(path => path.includes('.png')), 'Do not run image content checks against a stale HTML deployment');
});

test('HTML formatting transformations do not require a byte-identical deployment', async () => {
  const changes = {};
  for (const route of ['/', '/apps']) changes[route] = files.get(route).replaceAll('\r\n', '\n').replace(/>\s+</g, '>\n<').replace(/(href|src)="([^"]+)"/g, "$1='$2'");
  await checkDeployment(expected, fixture(changes));
});

test('a stale portrait is not accepted when script and CSS version tokens are current', async () => {
  let home = files.get('/');
  for (const portrait of expected.portraitRefs) home = home.replaceAll(portrait, '/bilder/old-portrait.png');
  assert.notEqual(home, files.get('/'), 'The stale fixture must replace current portraits');
  await assert.rejects(checkDeployment(expected, fixture({'/': home})), /current avatar portrait/);
});

for (const [label, asset] of [['script', expected.helper], ['CSS', expected.css]]) {
  test(`current HTML with an old avatar ${label} body is retried`, async () => {
    const staleAsset = label === 'script' ? files.get(asset).replaceAll(expected.sprite, '/bilder/old-avatar-sprite.png') : files.get(asset).replaceAll('.repair-working-avatar.rig-ready', '.previous-avatar');
    assert.notEqual(staleAsset, files.get(asset), 'The stale fixture must replace the current sprite');
    await assert.rejects(checkDeployment(expected, fixture({[asset]: staleAsset})), /waiting for the current (sprite|work-scene styles)/);
    const timer = clock();
    let attempts = 0;
    assert.equal(await waitForDeployment(() => checkDeployment(expected, fixture(++attempts === 1 ? {[asset]: staleAsset} : {})), timer), 2);
  });
}

test('a stale articulated work scene is rejected even when HTML and controller are current', async () => {
  const oldScene = files.get(expected.scene).replace("const duration = '24s'", "const duration = '4s'");
  assert.notEqual(oldScene, files.get(expected.scene));
  await assert.rejects(checkDeployment(expected, fixture({[expected.scene]: oldScene})), /current articulated work scene/);
});

test('endpoint errors remain a readiness failure and can recover on a later attempt', async () => {
  const timer = clock();
  let attempts = 0;
  assert.equal(await waitForDeployment(() => checkDeployment(expected, fixture(++attempts === 1 ? {'/api/google-reviews': Error('HTTP 503')} : {})), timer), 2);
  assert.match(timer.messages[0], /HTTP 503/);
});

test('the entire readiness step uses local HEAD fixtures without real network or retry timers', async () => {
  const step = workflow.split('- name: Wait for current deployment and check endpoints')[1]?.split('      - name:')[0]?.split('        run: |')[1]?.split('\n').map(line => line.replace(/^          /, '')).join('\n');
  assert.ok(step);
  const process = {env: {MONITOR_BASE: 'https://fixture.invalid'}, exitCode: 0};
  const logs = [], errors = [], requests = [];
  await new Script(step, {filename: '.github/workflows/monitor.yml:readiness-step'}).runInNewContext({
    require(name) {
      if (name === 'node:assert/strict') return assert;
      if (name === 'node:fs') return {readFileSync: readFile};
      throw Error('Unexpected readiness dependency: ' + name);
    },
    URL, AbortSignal, process,
    setTimeout() { throw Error('An already current fixture must not wait'); },
    console: {log: message => logs.push(message), error: message => errors.push(message)},
    fetch: async (value, options) => {
      const url = new URL(value), path = url.pathname + url.search;
      assert.equal(url.origin, 'https://fixture.invalid', 'No production network is allowed');
      assert.equal(options.headers['cache-control'], 'no-cache');
      requests.push(path);
      assert.ok(files.has(path) || endpoints.includes(path), 'Unexpected URL: ' + path);
      return {status: 200, text: async () => files.get(path), body: {cancel: async () => {}}};
    }
  }, {timeout: 1000});
  assert.equal(process.exitCode, 0, errors.join('\n'));
  assert.ok(logs.some(message => message.includes('ready after attempt 1')));
  for (const endpoint of endpoints) assert.ok(requests.includes(endpoint));
});

test('checkout is pinned before readiness and existing avatar byte limits stay strict', () => {
  const validate = readFile('.github/workflows/validate.yml');
  const pinned = validate.match(/uses: (actions\/checkout@[a-f\d]{40})/)?.[1];
  assert.ok(pinned);
  assert.ok(workflow.indexOf('uses: ' + pinned) < workflow.indexOf('- name: Wait for current deployment'));
  assert.match(workflow, /timeout-minutes: 7/);
  assert.match(workflow, /path === sprite \? 384 \* 1024 : 64 \* 1024/);
  assert.ok(validate.includes('tools/test-deployment-readiness.mjs'));
});
