import { access, readFile } from 'node:fs/promises';

const requiredFiles = [
  'index.html', 'impressum.html', 'datenschutz.html', '404.html',
  'styles.css', 'script.js', '_headers', 'robots.txt', 'sitemap.xml',
  'favicon.svg', 'site.webmanifest', '.well-known/security.txt', 'AGENTS.md'
];

const errors = [];
const warnings = [];
const siteOrigin = 'https://pc-und-handyservice-augsburg.pages.dev';

for (const file of requiredFiles) {
  try {
    await access(file);
  } catch {
    errors.push(`Fehlende Datei: ${file}`);
  }
}

const htmlFiles = ['index.html', 'impressum.html', 'datenschutz.html', '404.html'];
const indexableHtmlFiles = ['index.html', 'impressum.html', 'datenschutz.html'];

for (const file of htmlFiles) {
  const html = await readFile(file, 'utf8');

  if (!html.includes('<html lang="de">')) errors.push(`${file}: lang="de" fehlt`);
  if (!/<meta\s+name="viewport"/i.test(html)) errors.push(`${file}: viewport-Metaangabe fehlt`);
  if (!/<title>[^<]+<\/title>/i.test(html)) errors.push(`${file}: Titel fehlt`);
  if (!/<meta\s+name="description"/i.test(html)) errors.push(`${file}: Meta-Beschreibung fehlt`);
  if (/<(?:script|img)[^>]+src=["']https?:\/\//i.test(html)) errors.push(`${file}: externes Script/Bild gefunden`);
  if (/<link[^>]+rel=["']stylesheet["'][^>]+href=["']https?:\/\//i.test(html)) errors.push(`${file}: externes Stylesheet gefunden`);
  if (/<iframe\b/i.test(html)) errors.push(`${file}: iframe gefunden`);
  if (/<form\b/i.test(html)) errors.push(`${file}: Formular gefunden; Datenschutz und CSP prüfen`);

  const externalTabs = html.match(/<a\b[^>]*target=["']_blank["'][^>]*>/gi) ?? [];
  for (const anchor of externalTabs) {
    if (!/rel=["'][^"']*noopener[^"']*noreferrer[^"']*["']/i.test(anchor)) {
      errors.push(`${file}: target="_blank" ohne noopener/noreferrer`);
    }
  }

  if (indexableHtmlFiles.includes(file)) {
    const canonical = html.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i)?.[1];
    if (!canonical) {
      errors.push(`${file}: Canonical-URL fehlt`);
    } else if (!canonical.startsWith(`${siteOrigin}/`)) {
      errors.push(`${file}: Canonical-URL verwendet unerwartete Domain: ${canonical}`);
    }
  }
}

const index = await readFile('index.html', 'utf8');
if (!index.includes('itemtype="https://schema.org/LocalBusiness"')) {
  errors.push('index.html: strukturierte LocalBusiness-Daten fehlen');
}
if (!index.includes('rel="manifest"')) errors.push('index.html: Web-App-Manifest fehlt');
if (!index.includes('class="skip-link"')) errors.push('index.html: Skip-Link fehlt');
if (!index.includes('id="main"')) errors.push('index.html: Hauptinhalt mit id="main" fehlt');
if (!index.includes('aria-controls="nav"')) errors.push('index.html: Navigation ist nicht korrekt mit dem Menüschalter verknüpft');

for (const link of [
  'impressum.html',
  'datenschutz.html',
  'https://share.google/57mrs7jE79LUInKVg',
  'https://share.google/2mQbAIfJoIab9YR3G'
]) {
  if (!index.includes(link)) errors.push(`index.html: Pflichtlink fehlt: ${link}`);
}

if (!index.includes('4,9') || !index.includes('81 öffentlich sichtbaren Google-Rezensionen')) {
  errors.push('index.html: Google-Bewertungskennzahl oder Quellenhinweis fehlt');
}

const manifestRaw = await readFile('site.webmanifest', 'utf8');
let manifest;
try {
  manifest = JSON.parse(manifestRaw);
} catch {
  errors.push('site.webmanifest: ungültiges JSON');
}
if (manifest) {
  for (const key of ['name', 'short_name', 'start_url', 'scope', 'display', 'theme_color', 'background_color']) {
    if (!manifest[key]) errors.push(`site.webmanifest: ${key} fehlt`);
  }
  if (!Array.isArray(manifest.icons) || manifest.icons.length === 0) {
    errors.push('site.webmanifest: keine Icons definiert');
  }
}

const robots = await readFile('robots.txt', 'utf8');
if (!/^User-agent:\s*\*/mi.test(robots)) errors.push('robots.txt: User-agent * fehlt');
if (!/^Allow:\s*\//mi.test(robots)) errors.push('robots.txt: Allow / fehlt');
if (!robots.includes(`Sitemap: ${siteOrigin}/sitemap.xml`)) errors.push('robots.txt: Sitemap-URL fehlt oder ist inkonsistent');

const sitemap = await readFile('sitemap.xml', 'utf8');
if (!sitemap.includes('<urlset')) errors.push('sitemap.xml: urlset fehlt');
for (const url of [
  `${siteOrigin}/`,
  `${siteOrigin}/impressum.html`,
  `${siteOrigin}/datenschutz.html`
]) {
  if (!sitemap.includes(`<loc>${url}</loc>`)) errors.push(`sitemap.xml: URL fehlt: ${url}`);
}
if (/http:\/\//i.test(sitemap)) errors.push('sitemap.xml: unsichere HTTP-URL gefunden');

const securityTxt = await readFile('.well-known/security.txt', 'utf8');
for (const field of ['Contact:', 'Preferred-Languages:', 'Canonical:', 'Expires:']) {
  if (!securityTxt.includes(field)) errors.push(`security.txt: ${field} fehlt`);
}
if (!securityTxt.includes(`Canonical: ${siteOrigin}/.well-known/security.txt`)) {
  errors.push('security.txt: Canonical-URL ist inkonsistent');
}
const expiresValue = securityTxt.match(/^Expires:\s*(.+)$/mi)?.[1]?.trim();
if (expiresValue && Number.isNaN(Date.parse(expiresValue))) {
  errors.push('security.txt: Expires ist kein gültiges Datum');
}

const headers = await readFile('_headers', 'utf8');
for (const header of [
  'Content-Security-Policy',
  'Strict-Transport-Security',
  'Permissions-Policy',
  'X-Frame-Options',
  'X-Content-Type-Options',
  'Referrer-Policy',
  'Cache-Control'
]) {
  if (!headers.includes(header)) errors.push(`_headers: ${header} fehlt`);
}
if (!headers.includes("frame-ancestors 'none'")) errors.push("_headers: CSP frame-ancestors 'none' fehlt");
if (!headers.includes("object-src 'none'")) errors.push("_headers: CSP object-src 'none' fehlt");
if (!headers.includes("base-uri 'self'")) errors.push("_headers: CSP base-uri 'self' fehlt");

const script = await readFile('script.js', 'utf8');
if (!script.includes("event.key === 'Escape'")) warnings.push('script.js: Escape-Unterstützung für das mobile Menü nicht gefunden');
if (!script.includes('prefers-reduced-motion')) warnings.push('script.js: prefers-reduced-motion wird nicht berücksichtigt');

if (warnings.length) {
  console.warn(warnings.join('\n'));
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log(`Validierung erfolgreich: ${requiredFiles.length} Pflichtdateien, ${htmlFiles.length} HTML-Seiten, Manifest, Sitemap, robots.txt, security.txt und Sicherheitsheader geprüft.`);
