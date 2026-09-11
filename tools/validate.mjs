import { access, readFile, stat } from 'node:fs/promises';
import { dirname, extname, join, normalize } from 'node:path';
import { createHash } from 'node:crypto';

const requiredFiles = [
  'index.html', 'impressum.html', 'datenschutz.html', 'reparaturanfrage.html', '404.html',
  'pc-reparatur-augsburg.html', 'handyreparatur-augsburg.html',
  'datenrettung-augsburg.html', 'konsolenreparatur-augsburg.html',
  'styles.css', 'styles.min.css', 'enhancements.min.css', 'request.css', 'request.min.css',
  'service.css', 'service.min.css', 'script.js', 'script.min.js',
  'repair-form.js', 'repair-form.min.js',
  'vendor/intl-tel-input/css/intlTelInput.min.css',
  'vendor/intl-tel-input/js/intlTelInputWithUtils.min.js',
  'vendor/intl-tel-input/img/flags.webp', 'vendor/intl-tel-input/img/flags@2x.webp',
  'vendor/intl-tel-input/LICENSE',
  'qr.min.css', 'qr-print.js', 'qr-reparaturanfrage.png', 'google-qr-reparaturanfrage.jpg',
  'qr-schild-reparaturanfrage.html', 'google-qr-reparaturanfrage.html',
  'clarity-consent.js', 'clarity-consent.min.js', 'MICROSOFT-INTEGRATIONS.md',
  'functions/api/review-summary.js', 'functions/api/google-reviews.js',
  '_headers', 'robots.txt', 'sitemap.xml', 'favicon.svg',
  'apple-touch-icon.png', 'icon-192.png', 'icon-512.png',
  'icon-maskable-512.png', 'og-image.png', 'site.webmanifest',
  '.well-known/security.txt'
];

const errors = [];
for (const file of requiredFiles) {
  try { await access(file); } catch { errors.push(`Fehlende Datei: ${file}`); }
}

const htmlFiles = [
  'index.html', 'impressum.html', 'datenschutz.html', 'reparaturanfrage.html', '404.html',
  'pc-reparatur-augsburg.html', 'handyreparatur-augsburg.html',
  'datenrettung-augsburg.html', 'konsolenreparatur-augsburg.html'
];
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
  if (!html.includes('data-clarity-project="xn1s7qrbvj"')) errors.push(`${file}: aktive Clarity-Projekt-ID fehlt oder ist falsch`);
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
    target = target.split('?')[0];
    if (!extname(target)) {
      try { await access(`${target}.html`); target = `${target}.html`; } catch {}
    }
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
  'rel="canonical"', 'hreflang="de-DE"', 'hreflang="x-default"', 'property="og:image"', 'og:image:width',
  'name="twitter:card" content="summary_large_image"', 'name="twitter:image"',
  'application/ld+json', 'styles.min.css?v=', 'script.min.js?v=',
  'site.webmanifest?v='
]) {
  if (!index.includes(marker)) errors.push(`index.html: SEO-/Asset-Marker fehlt: ${marker}`);
}
for (const link of [
  'href="/impressum"', 'href="/datenschutz"',
  'https://share.google/57mrs7jE79LUInKVg',
  'https://share.google/2mQbAIfJoIab9YR3G',
  'https://www.instagram.com/pc_handyservice_maurice_keil/',
  'https://www.facebook.com/profile.php?id=61588640742328',
  'https://www.youtube.com/channel/UClSdWj7xui8E9e75IYGmHQw',
  'https://wa.me/4915254530080',
  'href="/reparaturanfrage"',
  'id="preise"',
  'id="social-media"',
  'id="qr-reparaturanfrage"',
  'src="/qr-reparaturanfrage.png'
]) {
  if (!index.includes(link)) errors.push(`index.html: Pflichtlink fehlt: ${link}`);
}
if ((index.match(/class="social-card/g) ?? []).length !== 3) errors.push('index.html: drei sichtbare Social- und Kontaktkarten fehlen');
if (!index.includes('4,9') || !index.includes('data-google-review-count>90</span>') || !index.includes('data-google-review-date')) {
  errors.push('index.html: Google-Bewertungskennzahl oder Quellenhinweis fehlt');
}
for (const marker of [
  '"name": "PC & Handyservice Augsburg – Maurice Keil"',
  '"openingHoursSpecification"',
  '"priceRange": "30 €–250 €"',
  'Augsburg-Lechhausen',
  'Mo–Sa 09:00–20:00',
  'Maurice Keil – Ihr Ansprechpartner.',
  'id="preise-pc"',
  'id="preise-handy"',
  'id="preise-daten"',
  'id="preise-konsole"',
  'Thematische Zusammenfassung öffentlich sichtbarer Rückmeldungen'
]) {
  if (!index.includes(marker)) errors.push(`index.html: lokale Unternehmensangabe fehlt: ${marker}`);
}
if ((index.match(/class="service-card reveal/g) ?? []).length !== 4) {
  errors.push('index.html: vier getrennte Leistungsbereiche fehlen');
}
if (index.includes('Bis die automatische Verbindung eingerichtet ist')) {
  errors.push('index.html: technischer Platzhaltertext im Bewertungsbereich ist noch sichtbar');
}

const privacyPage = htmlByFile.get('datenschutz.html');
for (const marker of [
  'Microsoft 365 beziehungsweise Exchange Online',
  'Microsoft Ireland Operations Limited',
  'Microsoft Data Protection Addendum',
  'Cloudflare Pages',
  'Bigin und Zoho Flow',
  'Stand: 12. September 2026'
]) {
  if (!privacyPage.includes(marker)) errors.push(`datenschutz.html: Datenschutzhinweis fehlt: ${marker}`);
}

const legalPage = htmlByFile.get('impressum.html');
for (const marker of ['Angaben gemäß § 5 DDG', 'Inhaber: Maurice Keil', 'DE424041749', 'Verbraucherstreitbeilegung']) {
  if (!legalPage.includes(marker)) errors.push(`impressum.html: Pflichtangabe fehlt: ${marker}`);
}

if (!index.includes('href="/reparaturanfrage"') || !index.includes('mobile-contact-request')) {
  errors.push('index.html: Reparaturanfrage-Verlinkung fehlt');
}

const requestPage = htmlByFile.get('reparaturanfrage.html');
for (const marker of [
  'id="repair-request"',
  'action="https://bigin.zoho.eu/crm/WebForm"',
  'Bitte keine Passwörter, PINs oder Entsperrcodes',
  'href="/datenschutz"',
  'request.min.css?v=',
  'repair-form.min.js?v=',
  'vendor/intl-tel-input/css/intlTelInput.min.css?v=29.2.3',
  'vendor/intl-tel-input/js/intlTelInputWithUtils.min.js?v=29.2.3',
  'class="phone-control"',
  'name="Contacts.Mobile"',
  'https://eu.bigin.online/org20117040394/forms/reparatur-online-anfragen',
  'src="/qr-reparaturanfrage.png',
  'name="Pipeline" value="Reparaturaufträge"',
  'name="Stage" value="Anfrage eingegangen"'
]) {
  if (!requestPage.includes(marker)) errors.push(`reparaturanfrage.html: Bigin-/Seitenmarker fehlt: ${marker}`);
}
if (
  requestPage.includes('crm.zoho.eu/crm/WebToLeadForm') ||
  requestPage.includes('crmWebToEntityForm')
) {
  errors.push('reparaturanfrage.html: altes Zoho-CRM-Formular ist noch eingebunden');
}
if (/id="serial-number"[^>]*\brequired\b/.test(requestPage)) {
  errors.push('reparaturanfrage.html: Seriennummer darf bei der Erstanfrage nicht verpflichtend sein');
}
for (const id of ['street', 'postcode', 'city']) {
  if (new RegExp(`id="${id}"[^>]*\\brequired\\b`).test(requestPage)) {
    errors.push(`reparaturanfrage.html: freiwilliges Adressfeld #${id} ist noch verpflichtend`);
  }
}
if (requestPage.includes('Contacts.Mailing Country') || requestPage.includes('Contacts.Mailing State')) {
  errors.push('reparaturanfrage.html: nicht eingegebene Adressdaten werden weiterhin automatisch ergänzt');
}
if (!requestPage.includes('Ein kostenpflichtiger Auftrag entsteht erst nach Ihrer Freigabe')) {
  errors.push('reparaturanfrage.html: Hinweis auf die unverbindliche Anfrage fehlt');
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
    if (!graph.some((item) => item['@type'] === 'WebSite' && item.inLanguage === 'de-DE')) errors.push('index.html: WebSite-Schema fehlt');
    const faq = graph.find((item) => item['@type'] === 'FAQPage');
    if (!faq || !Array.isArray(faq.mainEntity) || faq.mainEntity.length !== 5) errors.push('index.html: vollständiges FAQPage-Schema fehlt');
  } catch (error) {
    errors.push(`index.html: JSON-LD ist ungültig: ${error.message}`);
  }
}

const canonicals = {
  'index.html': 'https://www.pc-und-handyservice-augsburg.com/',
  'impressum.html': 'https://www.pc-und-handyservice-augsburg.com/impressum',
  'datenschutz.html': 'https://www.pc-und-handyservice-augsburg.com/datenschutz',
  'reparaturanfrage.html': 'https://www.pc-und-handyservice-augsburg.com/reparaturanfrage',
  'pc-reparatur-augsburg.html': 'https://www.pc-und-handyservice-augsburg.com/pc-reparatur-augsburg',
  'handyreparatur-augsburg.html': 'https://www.pc-und-handyservice-augsburg.com/handyreparatur-augsburg',
  'datenrettung-augsburg.html': 'https://www.pc-und-handyservice-augsburg.com/datenrettung-augsburg',
  'konsolenreparatur-augsburg.html': 'https://www.pc-und-handyservice-augsburg.com/konsolenreparatur-augsburg'
};
for (const [file, url] of Object.entries(canonicals)) {
  if (!htmlByFile.get(file).includes(`<link rel="canonical" href="${url}">`)) errors.push(`${file}: Canonical URL fehlt oder ist falsch`);
}

const dataRecoveryHtml = htmlByFile.get('datenrettung-augsburg.html');
for (const marker of [
  'Auch nach weiteren Schreibvorgängen können',
  'jeder Fall individuell analysiert',
  'tatsächlich vollständig mit neuen Daten belegt',
  'Teilweise ja:'
]) {
  if (!dataRecoveryHtml.includes(marker)) errors.push(`datenrettung-augsburg.html: präziser Datenrettungshinweis fehlt (${marker})`);
}
if (dataRecoveryHtml.includes('Bereits überschriebene Daten sind softwarebasiert in der Regel nicht wiederherstellbar.')) {
  errors.push('datenrettung-augsburg.html: zu pauschale Überschreibungs-Aussage noch vorhanden');
}

const script = await readFile('script.js', 'utf8');
if (!script.includes("'addEventListener' in desktopQuery") || !script.includes('addListener(handleDesktopChange)')) {
  errors.push('script.js: kompatibler MediaQuery-Fallback fehlt');
}
for (const marker of ["fetch('/api/review-summary'", "fetch('/api/google-reviews'", 'data.reviewCount', 'data.rating', 'data.updatedAt']) {
  if (!script.includes(marker)) errors.push(`script.js: automatische Google-Bewertungsanzeige unvollständig: ${marker}`);
}
const repairScript = await readFile('repair-form.js', 'utf8');
for (const marker of ['window.intlTelInput', "initialCountry: 'de'", 'countrySearch: true', 'isValidNumber()', 'getNumber()']) {
  if (!repairScript.includes(marker)) errors.push(`repair-form.js: internationale Telefonprüfung unvollständig: ${marker}`);
}
const phoneLibraryCss = await readFile('vendor/intl-tel-input/css/intlTelInput.min.css', 'utf8');
for (const marker of ['../img/flags.webp', '../img/flags@2x.webp']) {
  if (!phoneLibraryCss.includes(marker)) errors.push(`intlTelInput.min.css: Flaggen-Pfad fehlt: ${marker}`);
}
const phoneLibraryLicense = await readFile('vendor/intl-tel-input/LICENSE', 'utf8');
if (!phoneLibraryLicense.includes('MIT License')) errors.push('intl-tel-input: MIT-Lizenzdatei fehlt oder ist ungültig');
const googleReviewsFunction = await readFile('functions/api/review-summary.js', 'utf8');
for (const marker of ['GOOGLE_PLACES_API_KEY', 'GOOGLE_PLACE_ID', 'userRatingCount', 'Cache-Control']) {
  if (!googleReviewsFunction.includes(marker)) errors.push(`functions/api/review-summary.js: Marker fehlt: ${marker}`);
}
const googleReviewListFunction = await readFile('functions/api/google-reviews.js', 'utf8');
for (const marker of ['GOOGLE_OAUTH_CLIENT_ID', 'GOOGLE_OAUTH_CLIENT_SECRET', 'GOOGLE_OAUTH_REFRESH_TOKEN', 'mybusinessaccountmanagement.googleapis.com', 'updateTime desc']) {
  if (!googleReviewListFunction.includes(marker)) errors.push(`functions/api/google-reviews.js: Marker fehlt: ${marker}`);
}
const [sourceScriptSize, minScriptSize, sourceCssSize, minCssSize, sourceRequestCssSize, minRequestCssSize, sourceServiceCssSize, minServiceCssSize, sourceRepairScriptSize, minRepairScriptSize, sourceClaritySize, minClaritySize] = await Promise.all([
  stat('script.js'), stat('script.min.js'), stat('styles.css'), stat('styles.min.css'),
  stat('request.css'), stat('request.min.css'), stat('service.css'), stat('service.min.css'),
  stat('repair-form.js'), stat('repair-form.min.js'),
  stat('clarity-consent.js'), stat('clarity-consent.min.js')
]);
if (minScriptSize.size >= sourceScriptSize.size) errors.push('script.min.js: Datei ist nicht kleiner als die Quelle');
if (minCssSize.size >= sourceCssSize.size) errors.push('styles.min.css: Datei ist nicht kleiner als die Quelle');
if (minRequestCssSize.size >= sourceRequestCssSize.size) errors.push('request.min.css: Datei ist nicht kleiner als die Quelle');
if (minServiceCssSize.size >= sourceServiceCssSize.size) errors.push('service.min.css: Datei ist nicht kleiner als die Quelle');
if (minRepairScriptSize.size >= sourceRepairScriptSize.size) errors.push('repair-form.min.js: Datei ist nicht kleiner als die Quelle');
if (minClaritySize.size >= sourceClaritySize.size) errors.push('clarity-consent.min.js: Datei ist nicht kleiner als die Quelle');

const clarity = await readFile('clarity-consent.js', 'utf8');
for (const marker of ["consentv2", "ad_Storage: 'denied'", "analytics_Storage: analyticsStorage", "data-clarity-banner"]) {
  if (!clarity.includes(marker)) errors.push(`clarity-consent.js: Consent-Marker fehlt: ${marker}`);
}
if (clarity.indexOf('loadClarity()') < clarity.indexOf("choice === 'granted'")) {
  errors.push('clarity-consent.js: Clarity darf nicht vor einer Einwilligung geladen werden');
}
const microsoftGuide = await readFile('MICROSOFT-INTEGRATIONS.md', 'utf8');
if (!microsoftGuide.includes('msvalidate.01') || !microsoftGuide.includes('xn1s7qrbvj')) {
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
  'og-image.png': [1200, 630],
  'qr-reparaturanfrage.png': [1000, 1000]
};
for (const [file, [width, height]] of Object.entries(pngExpectations)) {
  const bytes = await readFile(file);
  const isPng = bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  if (!isPng || bytes.readUInt32BE(16) !== width || bytes.readUInt32BE(20) !== height) {
    errors.push(`${file}: PNG-Format oder Abmessungen sind falsch`);
  }
}

const googleQrImage = await readFile('google-qr-reparaturanfrage.jpg');
if (googleQrImage.length < 50000 || googleQrImage[0] !== 0xff || googleQrImage[1] !== 0xd8) {
  errors.push('google-qr-reparaturanfrage.jpg: JPEG-Format oder Dateigröße ist falsch');
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
const rawJsonLd = index.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/i)?.[1];
if (rawJsonLd) {
  const jsonLdHash = `sha256-${createHash('sha256').update(rawJsonLd).digest('base64')}`;
  if (!headers.includes(`'${jsonLdHash}'`)) errors.push('_headers: CSP-Hash stimmt nicht mit dem JSON-LD der Startseite überein');
}
if (!headers.includes('/styles.min.css') || !headers.includes('max-age=31536000, immutable')) errors.push('_headers: versionierte Produktionsassets werden nicht langfristig gecacht');
if (!headers.includes('/enhancements.min.css')) errors.push('_headers: Cache-Regel für das Verbesserungs-Stylesheet fehlt');
if (!headers.includes('https://*.clarity.ms') || !headers.includes('https://www.clarity.ms')) errors.push('_headers: Clarity-CSP-Vorbereitung fehlt');
if (!headers.includes("form-action 'self' https://bigin.zoho.eu")) errors.push('_headers: Bigin-Formularziel fehlt');
if (!headers.includes('frame-src https://bigin.zoho.eu https://eu.bigin.online')) errors.push('_headers: Bigin-Frame-Freigabe fehlt');
if (!headers.includes('/request.min.css')) errors.push('_headers: Cache-Regel für das Reparaturanfrage-Stylesheet fehlt');
if (!headers.includes('/repair-form.min.js')) errors.push('_headers: Cache-Regel für das Reparaturanfrage-Script fehlt');
if (!headers.includes('/vendor/intl-tel-input/*')) errors.push('_headers: Cache-Regel für die lokale Telefon-Länderauswahl fehlt');
if (!headers.includes('/qr.min.css')) errors.push('_headers: Cache-Regel für das QR-Stylesheet fehlt');
if (!headers.includes('max-age=86400, stale-while-revalidate=604800')) errors.push('_headers: stabile Bildassets haben keine sichere Revalidierungsstrategie');

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log(`Validierung erfolgreich: ${requiredFiles.length} Pflichtdateien, ${htmlFiles.length} HTML-Seiten, interne Links, SEO, Schema.org, Bilder und Security geprüft.`);
