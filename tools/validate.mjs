import { access, readFile } from 'node:fs/promises';

const requiredFiles = [
  'index.html', 'impressum.html', 'datenschutz.html', '404.html',
  'styles.css', 'script.js', '_headers', 'robots.txt', 'sitemap.xml',
  'favicon.svg', '.well-known/security.txt'
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
for (const link of ['impressum.html', 'datenschutz.html', 'https://share.google/57mrs7jE79LUInKVg', 'https://share.google/2mQbAIfJoIab9YR3G']) {
  if (!index.includes(link)) errors.push(`index.html: Pflichtlink fehlt: ${link}`);
}
if (!index.includes('4,9') || !index.includes('81 öffentlich sichtbaren Google-Rezensionen')) {
  errors.push('index.html: Google-Bewertungskennzahl oder Quellenhinweis fehlt');
}

const headers = await readFile('_headers', 'utf8');
for (const header of ['Content-Security-Policy', 'Strict-Transport-Security', 'Permissions-Policy', 'X-Frame-Options']) {
  if (!headers.includes(header)) errors.push(`_headers: ${header} fehlt`);
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log(`Validierung erfolgreich: ${requiredFiles.length} Pflichtdateien und ${htmlFiles.length} HTML-Seiten geprüft.`);
