import { access, readFile, stat } from 'node:fs/promises';
import { dirname, extname, join, normalize } from 'node:path';

const requiredFiles = [
  'index.html', 'impressum.html', 'datenschutz.html', '404.html',
  'styles.css', 'styles.min.css', 'script.js', 'script.min.js',
  'clarity-consent.js', 'clarity-consent.min.js', 'MICROSOFT-INTEGRATIONS.md',
  '_headers', 'robots.txt', 'sitemap.xml', 'favicon.svg',
  'apple-touch-icon.png', 'icon-192.png', 'icon-512.png',
  'icon-maskable-512.png', 'og-image.png', 'site.webmanifest',
  '.well-known/security.txt'
];

const errors = [];
for (const file of requiredFiles) {
  try { await access(file); } catch { errors.push(`Fehlende Datei: ${file}`); }
}

const htmlFiles = ['index.html', 'impressum.html', 'datenschutz.html', '404.html'];
const htmlByFile = new Map();
for (const file of htmlFiles) {
  const html = await readFile(file, 'utf8');
  htmlByFile.set(file, html);
  if (!/<html\s+lang="de"(?:\s|>)/i.test(html)) errors.push(`${file}: lang="de" fehlt`);
  if (!/<meta\s+name="viewport"/i.test(html)) errors.push(`${file}: viewport-Metaangabe fehlt`);
  if (!/<title>[^<]+<\/title>/i.test(html)) errors.push(`${file}: Titel fehlt`);
  if (!/<meta\s+name="description"/i.test(html)) errors.push(`${file}: Meta-Beschreibung fehlt`);
  if (/<(?:script|img)[^>]+src=["']https?:\/\//i.test(html)) errors.push(`${file}: externes Script/Bild gefunden`);
  if (/<link[^>]+rel=["']stylesheet["'][^>]+href=["']https?:\/\//i.test(html)) errors.push(`${file}: externes Stylesheet gefunden`);
  if (!html.includes('styles.min.css?v=')) errors.push(`${file}: minifiziertes CSS wird nicht genutzt`);
  if (!html.includes('rel="apple-touch-icon"')) errors.push(`${file}: Apple-Touch-Icon fehlt`);
  if (!html.includes('clarity-consent.min.js?v=')) errors.push(`${file}: vorbereitete Clarity-Consent-Integration fehlt`);
  if (!html.includes('data-clarity-project=""') && !/data-clarity-project="[a-z0-9]{6,32}"/i.test(html)) errors.push(`${file}: Clarity-Projektkonfiguration fehlt`);
  const externalTabs = html.match(/<a\b[^>]*target=["']_blank["'][^>]*>/gi) ?? [];
  for (const anchor of externalTabs) {
    if (!/rel=["'][^"']*noopener[^"']*noreferrer[^"']*["']/i.test(anchor)) {
      errors.push(`${file}: target="_blank" ohne noopener/noreferrer`);
    }
  }
}

for (const [file, html] of htmlByFile) {
  const ids = [...html.matchAll(/\bid=["']([^"']+)["']/gi)].map(([, id]) => id);
  for (const id of ids) {
    if (ids.filter((candidate) => candidate === id).length > 1) errors.push(`${file}: doppelte ID #${id}`);
  }
  const hrefs = [...html.matchAll(/\bhref=["']([^"']+)["']/gi)].map(([, href]) => href);
  for (const href of hrefs) {
    if (/^(?:https?:|mailto:|tel:|javascript:)/i.test(href)) continue;
    const [rawPath, fragment] = href.split('#', 2);
    let target = rawPath || file;
    if (target === '/') target = 'index.html';
    else if (target.startsWith('/')) target = target.slice(1);
    else if (rawPath) target = normalize(join(dirname(file), rawPath.split('?')[0]));
    try { await access(target); } catch { errors.push(`${file}: interner Link fehlt: ${href}`); continue; }
    if (fragment && extname(target).toLowerCase() === '.html') {
      const targetHtml = htmlByFile.get(target) ?? await readFile(target, 'utf8');
      if (!targetHtml.includes(`id="${fragment}"`) && !targetHtml.includes(`id='${fragment}'`)) {
        errors.push(`${file}: Sprungziel fehlt: ${href}`);
      }
    }
  }
}

const index = htmlByFile.get('index.html');
for (const marker of [
  'rel="canonical"', 'property="og:image"', 'og:image:width',
  'name="twitter:card" content="summary_large_image"', 'name="twitter:image"',
  'application/ld+json', 'styles.min.css?v=', 'script.min.js?v=',
  'site.webmanifest?v='
]) {
  if (!index.includes(marker)) errors.push(`index.html: SEO-/Asset-Marker fehlt: ${marker}`);
}
for (const link of [
  'impressum.html', 'datenschutz.html',
  'https://share.google/57mrs7jE79LUInKVg',
  'https://share.google/2mQbAIfJoIab9YR3G',
  'https://www.instagram.com/pc_handyservice_maurice_keil/',
  'https://www.tiktok.com/@pcundhandyreparaturaugsb',
  'https://www.facebook.com/profile.php?id=61588640742328',
  'https://wa.me/4915254530080',
  'id="preise"',
  'id="social-media"'
]) {
  if (!index.includes(link)) errors.push(`index.html: Pflichtlink fehlt: ${link}`);
}
if ((index.match(/class="social-card/g) ?? []).length !== 4) errors.push('index.html: vier sichtbare Social- und Kontaktkarten fehlen');
if (!index.includes('4,9') || !index.includes('81 öffentlich sichtbaren Google-Rezensionen')) {
  errors.push('index.html: Google-Bewertungskennzahl oder Quellenhinweis fehlt');
}

const jsonLdMatch = index.match(/<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/i);
if (!jsonLdMatch) {
  errors.push('index.html: JSON-LD fehlt');
} else {
  try {
    const data = JSON.parse(jsonLdMatch[1]);
    const graph = Array.isArray(data['@graph']) ? data['@graph'] : [data];
    if (!graph.some((item) => item['@type'] === 'LocalBusiness' || (Array.isArray(item['@type']) && item['@type'].includes('LocalBusiness')))) errors.push('index.html: Schema.org LocalBusiness fehlt');
    if (!graph.some((item) => item['@type'] === 'Service' && /RepairService/i.test(item.serviceType ?? ''))) {
      errors.push('index.html: valides RepairService-Service-Schema fehlt');
    }
  } catch (error) {
    errors.push(`index.html: JSON-LD ist ungültig: ${error.message}`);
  }
}

const canonicals = {
  'index.html': 'https://www.pc-und-handyservice-augsburg.com/',
  'impressum.html': 'https://www.pc-und-handyservice-augsburg.com/impressum.html',
  'datenschutz.html': 'https://www.pc-und-handyservice-augsburg.com/datenschutz.html'
};
for (const [file, url] of Object.entries(canonicals)) {
  if (!htmlByFile.get(file).includes(`<link rel="canonical" href="${url}">`)) errors.push(`${file}: Canonical URL fehlt oder ist falsch`);
}

const script = await readFile('script.js', 'utf8');
if (!script.includes("'addEventListener' in desktopQuery") || !script.includes('addListener(handleDesktopChange)')) {
  errors.push('script.js: kompatibler MediaQuery-Fallback fehlt');
}
const [sourceScriptSize, minScriptSize, sourceCssSize, minCssSize, sourceClaritySize, minClaritySize] = await Promise.all([
  stat('script.js'), stat('script.min.js'), stat('styles.css'), stat('styles.min.css'),
  stat('clarity-consent.js'), stat('clarity-consent.min.js')
]);
if (minScriptSize.size >= sourceScriptSize.size) errors.push('script.min.js: Datei ist nicht kleiner als die Quelle');
if (minCssSize.size >= sourceCssSize.size) errors.push('styles.min.css: Datei ist nicht kleiner als die Quelle');
if (minClaritySize.size >= sourceClaritySize.size) errors.push('clarity-consent.min.js: Datei ist nicht kleiner als die Quelle');

const clarity = await readFile('clarity-consent.js', 'utf8');
for (const marker of ["consentv2", "ad_Storage: 'denied'", "analytics_Storage: analyticsStorage", "data-clarity-banner"]) {
  if (!clarity.includes(marker)) errors.push(`clarity-consent.js: Consent-Marker fehlt: ${marker}`);
}
if (clarity.indexOf('loadClarity()') < clarity.indexOf("choice === 'granted'")) {
  errors.push('clarity-consent.js: Clarity darf nicht vor einer Einwilligung geladen werden');
}
const microsoftGuide = await readFile('MICROSOFT-INTEGRATIONS.md', 'utf8');
if (!microsoftGuide.includes('msvalidate.01') || !microsoftGuide.includes('ECHTE_PROJEKT_ID')) {
  errors.push('MICROSOFT-INTEGRATIONS.md: Clarity- oder Bing-Aktivierungsanleitung unvollständig');
}

const styles = await readFile('styles.css', 'utf8');
if (!styles.includes('visibility:hidden') || !styles.includes('body.nav-open') || !styles.includes('min-height:44px')) {
  errors.push('styles.css: Fokus-, Scroll- oder Touchschutz der Mobilnavigation fehlt');
}

const manifest = JSON.parse(await readFile('site.webmanifest', 'utf8'));
if (manifest.id !== '/' || !Array.isArray(manifest.categories)) {
  errors.push('site.webmanifest: stabile App-ID oder Kategorien fehlen');
}
for (const size of ['192x192', '512x512']) {
  if (!manifest.icons?.some((icon) => icon.sizes === size && icon.type === 'image/png')) {
    errors.push(`site.webmanifest: PNG-App-Icon ${size} fehlt`);
  }
}
if (!manifest.icons?.some((icon) => icon.purpose === 'maskable')) errors.push('site.webmanifest: maskierbares Icon fehlt');

const pngExpectations = {
  'apple-touch-icon.png': [180, 180],
  'icon-192.png': [192, 192],
  'icon-512.png': [512, 512],
  'icon-maskable-512.png': [512, 512],
  'og-image.png': [1200, 630]
};
for (const [file, [width, height]] of Object.entries(pngExpectations)) {
  const bytes = await readFile(file);
  const isPng = bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  if (!isPng || bytes.readUInt32BE(16) !== width || bytes.readUInt32BE(20) !== height) {
    errors.push(`${file}: PNG-Format oder Abmessungen sind falsch`);
  }
}

const robots = await readFile('robots.txt', 'utf8');
if (!robots.includes('User-agent: *') || !robots.includes('Sitemap: https://www.pc-und-handyservice-augsburg.com/sitemap.xml')) {
  errors.push('robots.txt: Crawling- oder Sitemap-Angabe fehlt');
}
const sitemap = await readFile('sitemap.xml', 'utf8');
for (const url of [...Object.values(canonicals), 'https://www.pc-und-handyservice-augsburg.com/og-image.png']) {
  if (!sitemap.includes(url)) errors.push(`sitemap.xml: URL fehlt: ${url}`);
}

const headers = await readFile('_headers', 'utf8');
if (headers.includes('max-age=3600')) errors.push('_headers: veränderliche Assets werden zu lange gecacht');
for (const header of ['Content-Security-Policy', 'Strict-Transport-Security', 'Permissions-Policy', 'X-Frame-Options', 'Cache-Control']) {
  if (!headers.includes(header)) errors.push(`_headers: ${header} fehlt`);
}
if (!/script-src 'self' 'sha256-[A-Za-z0-9+/=]+'/.test(headers)) errors.push('_headers: CSP-Hash für JSON-LD fehlt');
if (!headers.includes('/styles.min.css') || !headers.includes('max-age=31536000, immutable')) errors.push('_headers: versionierte Produktionsassets werden nicht langfristig gecacht');
if (!headers.includes('https://*.clarity.ms') || !headers.includes('https://www.clarity.ms')) errors.push('_headers: Clarity-CSP-Vorbereitung fehlt');
if (!headers.includes('max-age=86400, stale-while-revalidate=604800')) errors.push('_headers: stabile Bildassets haben keine sichere Revalidierungsstrategie');

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log(`Validierung erfolgreich: ${requiredFiles.length} Pflichtdateien, ${htmlFiles.length} HTML-Seiten, interne Links, SEO, Schema.org, Bilder und Security geprüft.`);
