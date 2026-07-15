import { access, readFile } from 'node:fs/promises';

const requiredFiles = [
  'index.html', 'impressum.html', 'datenschutz.html', '404.html',
  'styles.css', 'script.js', '_headers', 'robots.txt', 'sitemap.xml',
  'favicon.svg', 'site.webmanifest', '.well-known/security.txt'
];

const errors = [];
for (const file of requiredFiles) {
  try { await access(file); } catch { errors.push(`Fehlende Datei: ${file}`); }
}

const htmlFiles = ['index.html', 'impressum.html', 'datenschutz.html', '404.html'];
for (const file of htmlFiles) {
  const html = await readFile(file, 'utf8');
  if (!html.includes('<html lang="de">')) errors.push(`${file}: lang="de" fehlt`);
  if (!/<meta\s+name="viewport"/i.test(html)) errors.push(`${file}: viewport-Metaangabe fehlt`);
  if (!/<title>[^<]+<\/title>/i.test(html)) errors.push(`${file}: Titel fehlt`);
  if (!/<meta\s+name="description"/i.test(html)) errors.push(`${file}: Meta-Beschreibung fehlt`);
  if (/<(?:script|img)[^>]+src=["']https?:\/\//i.test(html)) errors.push(`${file}: externes Script/Bild gefunden`);
  if (/<link[^>]+rel=["']stylesheet["'][^>]+href=["']https?:\/\//i.test(html)) errors.push(`${file}: externes Stylesheet gefunden`);
  const externalTabs = html.match(/<a\b[^>]*target=["']_blank["'][^>]*>/gi) ?? [];
  for (const anchor of externalTabs) {
    if (!/rel=["'][^"']*noopener[^"']*noreferrer[^"']*["']/i.test(anchor)) {
      errors.push(`${file}: target="_blank" ohne noopener/noreferrer`);
    }
  }
}

const index = await readFile('index.html', 'utf8');
if (!index.includes('itemtype="https://schema.org/LocalBusiness"')) errors.push('index.html: strukturierte LocalBusiness-Daten fehlen');
if (!index.includes('rel="manifest"')) errors.push('index.html: Web-App-Manifest fehlt');
for (const asset of ['styles.css?v=', 'script.js?v=', 'site.webmanifest?v=']) {
  if (!index.includes(asset)) errors.push(`index.html: Versionierung fehlt: ${asset}`);
}
for (const link of ['impressum.html', 'datenschutz.html', 'https://share.google/57mrs7jE79LUInKVg', 'https://share.google/2mQbAIfJoIab9YR3G']) {
  if (!index.includes(link)) errors.push(`index.html: Pflichtlink fehlt: ${link}`);
}
if (!index.includes('4,9') || !index.includes('81 öffentlich sichtbaren Google-Rezensionen')) {
  errors.push('index.html: Google-Bewertungskennzahl oder Quellenhinweis fehlt');
}

const script = await readFile('script.js', 'utf8');
if (!script.includes("'addEventListener' in desktopQuery") || !script.includes('addListener(handleDesktopChange)')) {
  errors.push('script.js: kompatibler MediaQuery-Fallback fehlt');
}

const styles = await readFile('styles.css', 'utf8');
if (!styles.includes('visibility:hidden') || !styles.includes('body.nav-open')) {
  errors.push('styles.css: Fokus- und Scrollschutz der Mobilnavigation fehlt');
}

const manifest = JSON.parse(await readFile('site.webmanifest', 'utf8'));
if (manifest.id !== '/' || !Array.isArray(manifest.categories)) {
  errors.push('site.webmanifest: stabile App-ID oder Kategorien fehlen');
}

const headers = await readFile('_headers', 'utf8');
if (headers.includes('max-age=3600')) errors.push('_headers: veränderliche Assets werden zu lange gecacht');
for (const header of ['Content-Security-Policy', 'Strict-Transport-Security', 'Permissions-Policy', 'X-Frame-Options', 'Cache-Control']) {
  if (!headers.includes(header)) errors.push(`_headers: ${header} fehlt`);
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log(`Validierung erfolgreich: ${requiredFiles.length} Pflichtdateien und ${htmlFiles.length} HTML-Seiten geprüft.`);
