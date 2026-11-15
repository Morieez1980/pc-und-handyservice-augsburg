import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdir, writeFile, readFile} from 'node:fs/promises';
import {languages, routes} from '../locales/content.mjs';

export const PREVIEW = 'https://409d5b9a.pc-und-handyservice-augsburg.pages.dev';
export const CONTENT_COMMIT = 'ea1b022aa78c67bfef8b6f8061e9dc7289679622';
const allowedHost = '409d5b9a.pc-und-handyservice-augsburg.pages.dev';
const base = new URL(PREVIEW);
assert.equal(base.protocol, 'https:');
assert.equal(base.hostname, allowedHost);
assert.equal(base.origin, PREVIEW);
const require = createRequire(import.meta.url);
const {chromium} = require('../.preview-qa-deps/node_modules/playwright');
const evidence = 'preview-qa-results';
await mkdir(evidence, {recursive: true});
const result = {preview: PREVIEW, contentCommit: CONTENT_COMMIT, qaCommit: process.env.GITHUB_SHA || null,
  checks: [], failures: [], headFallbacks: [], blockedExternalRequests: 0, blockedWrites: 0, apiSources: {}};
const links = new Set(['/robots.txt', '/sitemap.xml', '/site.webmanifest', '/og-image.png']);
const apiPaths = new Set(['/api/review-summary', '/api/google-reviews']);
let browser;
function permitted(value) {
  const url = new URL(value, base);
  assert.equal(url.origin, PREVIEW, 'Only the pinned preview origin is allowed');
  assert.equal(url.username + url.password, '');
  assert.ok(!url.pathname.startsWith('/api/') || apiPaths.has(url.pathname), 'Unexpected API');
  return url;
}
async function record(label, check) {
  try { await check(); result.checks.push({label, passed: true}); }
  catch (error) {
    result.failures.push({label, message: error.message});
    const message = (label + ': ' + error.message).replaceAll('%', '%25').replaceAll('\r', '%0D').replaceAll('\n', '%0A');
    console.error('::error::' + message);
  }
}
try {
  browser = await chromium.launch({headless: true});
  const context = await browser.newContext({reducedMotion: 'reduce', serviceWorkers: 'block'});
  await context.route('**/*', route => {
    const request = route.request();
    if (!['GET', 'HEAD'].includes(request.method())) { result.blockedWrites++; return route.abort(); }
    const url = new URL(request.url());
    if (url.origin !== PREVIEW) { result.blockedExternalRequests++; return route.abort(); }
    if (url.pathname.startsWith('/api/') && !apiPaths.has(url.pathname)) return route.abort();
    return route.continue();
  });
  await context.addInitScript(() => {
    document.addEventListener('submit', event => event.preventDefault(), true);
    HTMLFormElement.prototype.submit = function () { throw new Error('Preview QA blocks form submissions'); };
    navigator.sendBeacon = () => false;
  });
  const page = await context.newPage();
  page.setDefaultTimeout(7000);
  let errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => {
    if (new URL(response.url()).origin === PREVIEW && response.status() >= 400)
      errors.push('HTTP ' + response.status() + ' ' + new URL(response.url()).pathname);
  });
  async function request(path, method = 'GET', redirects = 0) {
    const url = permitted(path);
    const response = await context.request.fetch(url.href, {method, maxRedirects: 0, timeout: 20000});
    if ([301, 302, 303, 307, 308].includes(response.status())) {
      assert.ok(redirects < 4, 'Too many redirects');
      const location = response.headers().location;
      assert.ok(location, 'Missing redirect location');
      return request(permitted(new URL(location, url).href).href, method, redirects + 1);
    }
    // Public dynamic routes may implement GET without a matching HEAD handler.
    if (method === 'HEAD' && [404, 405, 501].includes(response.status())) {
      result.headFallbacks.push({path: url.pathname, headStatus: response.status()});
      return request(url.href, 'GET', redirects);
    }
    assert.equal(response.status(), 200, url.pathname + ': HTTP ' + response.status());
    return response;
  }
  // A failed initial connection must not cause hundreds of repeated network probes.
  const initialResponse = await request('/');
  await record('security headers', async () => {
    const response = initialResponse;
    const headers = response.headers();
    for (const header of ['strict-transport-security', 'content-security-policy', 'x-content-type-options', 'referrer-policy', 'permissions-policy'])
      assert.ok(headers[header], 'Missing ' + header);
    assert.equal(headers['x-content-type-options'], 'nosniff');
  });
  for (const path of apiPaths) await record(path + ' public contract', async () => {
    const response = await request(path);
    assert.match(response.headers()['content-type'] || '', /^application\/json\b/i);
    assert.equal(response.headers()['x-content-type-options'], 'nosniff');
    const body = await response.json();
    result.apiSources[path] = body.source;
    if (path === '/api/review-summary') {
      assert.ok(['google-business-profile', 'google-places', 'verified-fallback'].includes(body.source));
      assert.ok(Number.isFinite(body.rating) && body.rating >= 0 && body.rating <= 5);
      assert.ok(Number.isInteger(body.reviewCount) && body.reviewCount >= 0);
      assert.ok(Number.isFinite(Date.parse(body.updatedAt)));
    } else {
      assert.ok(['google-business-profile', 'not-configured', 'temporarily-unavailable'].includes(body.source));
      assert.ok(Array.isArray(body.reviews));
      if (body.source !== 'google-business-profile') {
        assert.equal(body.reviews.length, 0);
        assert.equal(response.headers()['cache-control'], 'no-store');
      } else {
        assert.ok(body.rating === null || (Number.isFinite(body.rating) && body.rating >= 0 && body.rating <= 5));
        assert.ok(body.reviewCount === null || (Number.isInteger(body.reviewCount) && body.reviewCount >= 0));
        assert.ok(body.reviews.every(review => review.rating >= 1 && review.rating <= 5));
      }
    }
  });
  for (const file of ['index.html','home-intro.css','repair-helper.js','repair-work-scene.js','anfahrt-hof-plan-20261030-v6.svg','bilder/hauseingang-autohof-20261108.webp','bilder/reparatur-avatar-frei-20261109.webp','bilder/reparatur-avatar-frei-klein-20261109.webp','es/reparaturanfrage.html','es/form-i18n.js']) await record('pinned exact bytes '+file, async () => {
    const delivered=Buffer.from(await (await request('/'+file)).body());
    assert.deepEqual(delivered,await readFile(file),'Committed preview bytes differ: '+file);
  });
  for (const lang of Object.keys(languages)) for (const width of [320, 360, 390, 1280]) {
    await page.setViewportSize({width, height: 900});
    for (const route of routes) {
      const path = (lang === 'de' ? '' : '/' + lang) + '/' + route;
      await record(`${lang} ${route || '/'} ${width}`, async () => {
        errors = [];
        const response = await page.goto(permitted(path).href, {waitUntil: 'networkidle', timeout: 25000});
        assert.equal(response.status(), 200);
        assert.equal(new URL(page.url()).origin, PREVIEW);
        const state = await page.evaluate(() => ({
          scroll: document.documentElement.scrollWidth, width: document.documentElement.clientWidth,
          title: document.title, h1: document.querySelectorAll('h1').length,
          description: document.querySelector('meta[name="description"]')?.content,
          canonical: document.querySelector('link[rel="canonical"]')?.href,
          brokenImages: [...document.images].filter(img => img.loading !== 'lazy' && (!img.complete || !img.naturalWidth)).map(img => img.getAttribute('src')),
          links: [...document.querySelectorAll('a[href],script[src],link[rel="stylesheet"][href],img[src]')].map(el => el.getAttribute('href') || el.getAttribute('src'))
        }));
        assert.ok(state.scroll <= state.width + 1, `Horizontal overflow: ${state.scroll} > ${state.width}`);
        assert.ok(state.title && state.description, 'SEO title/description missing');
        assert.equal(state.h1, 1, 'Expected one H1');
        assert.equal(new URL(state.canonical).origin, 'https://www.pc-und-handyservice-augsburg.com');
        assert.deepEqual(state.brokenImages, [], 'Broken initial images');
        for (const href of state.links) {
          if (!href || /^(?:mailto:|tel:|data:|blob:)/i.test(href)) continue;
          const url = new URL(href, page.url());
          assert.ok(['https:', 'http:'].includes(url.protocol), 'Unexpected link protocol');
          if (url.origin === PREVIEW && !url.pathname.startsWith('/api/')) links.add(url.pathname + url.search);
        }
        if (!route) {
          const picker = page.locator('.language-picker summary');
          await picker.click();
          assert.equal(await page.locator('.language-picker nav').isVisible(), true);
          assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1), 'Language menu overflow');
          await picker.click();
          const toggle = page.locator('[data-nav-toggle]');
          if (await toggle.isVisible()) {
            await toggle.click();
            assert.equal(await toggle.getAttribute('aria-expanded'), 'true');
            await toggle.click();
            assert.equal(await toggle.getAttribute('aria-expanded'), 'false');
          }
          if (lang === 'de') {
            const consentBanner=page.locator('[data-clarity-banner]');
            if (await consentBanner.isVisible()) {
              await page.locator('[data-clarity-choice="denied"]').click();
              assert.equal(await consentBanner.isVisible(),false,'Normal optional-analysis rejection did not close the banner');
            }
            assert.ok(await page.locator('body.homepage-original-layout').count(),'Restored homepage scope missing');
            const notice=page.locator('.home-visit-notice');
            assert.equal(await notice.getAttribute('href'),'#anfahrt');
            assert.match(await notice.innerText(),/Gewerblicher Reparaturservice an privater Adresse/);
            assert.match(await notice.innerText(),/Hier klicken: Anfahrt, Eingangsfoto & Besuchshinweise weiter unten/);
            const noticeBox=await notice.boundingBox();assert.ok(noticeBox.height>=90,'Prominent visit link too small');
            const helper=page.locator('.repair-helper-toggle');await helper.click();
            const panel=page.locator('.repair-helper-dialog');assert.equal(await panel.isVisible(),true);
            assert.ok((await panel.locator('.repair-avatar>img').getAttribute('src')).includes('reparatur-avatar-frei-klein-20261109.webp'));
            await panel.locator('.repair-helper-motion').waitFor({state:'visible'});
            assert.equal(await panel.locator('svg.repair-working-scene').count(),1,'Original animated scene missing');
            assert.equal(await panel.locator('svg').evaluate(s=>s.animationsPaused()),true,'Reduced motion not respected');
            await panel.locator('.repair-helper-motion').click();
            await page.waitForTimeout(300);
            assert.ok(await panel.locator('svg').evaluate(s=>!s.animationsPaused()&&s.getCurrentTime()>0),'Original animation does not run after explicit opt-in');
            await panel.locator('.repair-helper-motion').click();
            assert.equal(await panel.locator('svg').evaluate(s=>s.animationsPaused()),true,'Pause does not work');
            await panel.locator('.repair-helper-close').click();
            await notice.click();assert.equal(new URL(page.url()).hash,'#anfahrt');
            const entrance=page.locator('.arrival-entrance img');await entrance.scrollIntoViewIfNeeded();
            await entrance.evaluate(img=>img.decode());assert.ok(await entrance.evaluate(img=>img.naturalWidth===1280&&img.naturalHeight===960),'Original entrance photo missing');
            assert.ok(await page.locator('.arrival-photo img').getAttribute('src')==='/'+'anfahrt-hof-plan-20261030-v6.svg');
            const svg=await (await request('/anfahrt-hof-plan-20261030-v6.svg')).text();
            assert.match(svg,/id="entrance-no-parking"/);assert.match(svg,/Links und rechts neben dem Hauseingang nicht parken/);
            assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth+1),'Arrival section overflow');
            await page.screenshot({path:`${evidence}/arrival-${width}.png`,fullPage:false});
            await page.goto(permitted('/').href,{waitUntil:'networkidle',timeout:25000});
          }
          if (lang === 'de' || lang === 'es') await page.screenshot({path: `${evidence}/${lang}-${width}.png`, fullPage: true});
        }
        assert.deepEqual(errors, [], 'Page JavaScript or same-origin HTTP errors');
      });
    }
    console.log(`Viewport complete: ${lang} ${width}`);
  }
  for (const path of [...links].sort()) await record('link/asset ' + path, () => request(path, 'HEAD'));
  await record('no form or consent submissions', async () => assert.equal(result.blockedWrites, 0));
  await context.close();
} catch (error) {
  result.failures.push({label: 'fatal browser/preflight failure', message: error.message});
  throw error;
} finally {
  if (browser) await browser.close();
  result.passed = result.failures.length === 0;
  await writeFile(`${evidence}/results.json`, JSON.stringify(result, null, 2));
  console.log('::notice::' + JSON.stringify({preview: PREVIEW, contentCommit: CONTENT_COMMIT, checks: result.checks.length, failures: result.failures.length, blockedWrites: result.blockedWrites, headFallbacks: result.headFallbacks, apiSources: result.apiSources}));
}
assert.equal(result.failures.length, 0, 'Preview QA failed; inspect preview-qa-results/results.json');
