import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const escape = value => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const documents = [
  ['lizenz', 'AGB und Lizenzbedingungen', 'lizenzbedingungen.txt'],
  ['produkt', 'Produktinformationen und Preise', 'produktinformationen.txt'],
  ['widerruf', 'Widerruf und Musterformular', 'widerruf.txt'],
  ['datenschutz', 'Datenschutz der App', 'datenschutz.txt'],
  ['sicherheit', 'Hinweise zur Datensicherheit', 'datensicherheit.txt']
];
// Present the existing contractual documents verbatim. This does not approve a release.
const sections = documents.map(([id, title, file]) => {
  const text = fs.readFileSync(path.join(root, 'assets/apps/keil-copy', file), 'utf8').replaceAll('\r\n', '\n').trim();
  const paragraphs = text.split(/\r?\n\r?\n/).map(block => '<p>' + escape(block).replaceAll('\n', '<br>') + '</p>').join('\n');
  return `<section id="${id}" class="legal-document" aria-labelledby="${id}-title"><h2 id="${id}-title">${title}</h2><a href="/assets/apps/keil-copy/${file}" download>Als Textdatei speichern</a><div data-legal-source="${file}">${paragraphs}</div><a href="#main">Zur Übersicht ↑</a></section>`;
}).join('\n');
const navigation = documents.map(([id, title]) => `<a href="#${id}">${title}</a>`).join('');
const html = `<!doctype html>
<html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Keil@Copy · Lizenz, AGB, Widerruf und Datenschutz</title>
<meta name="description" content="Keil@Copy: Lizenz- und Vertragsbedingungen, Produktinformationen, Widerruf mit Musterformular, Datenschutz und Hinweise zu Urheberrecht und Fremdkomponenten.">
<meta name="robots" content="noindex,follow"><link rel="canonical" href="https://www.pc-und-handyservice-augsburg.com/apps-lizenz">
<link rel="icon" href="/favicon.svg"><link rel="stylesheet" href="/apps.css?v=20261107-dark2"><link rel="stylesheet" href="/apps-legal.css?v=20261107-1"></head>
<body class="app-page app-legal"><a class="skip-link" href="#main">Zum Inhalt</a>
<header class="app-header"><a class="app-business" href="/"><img src="/logo-profil-hellblau-20261105.webp" width="70" height="44" alt=""><span>PC &amp; Handyservice<strong>Augsburg · Maurice Keil</strong></span></a><nav aria-label="Hauptnavigation"><a href="/">Startseite</a><a href="/apps">Zur App</a><a href="mailto:keil.maurice1980@gmail.com">Kontakt</a></nav></header>
<main id="main"><section class="legal-intro"><p class="eyebrow">KEIL@COPY · INFORMATIONEN VOR TEST UND KAUF</p><h1>Lizenz, Bedingungen<br>und Ihre Rechte.</h1><p class="lead">Hier finden Sie die vollständigen App-Unterlagen – direkt lesbar und zum Speichern. Die Vertragsunterlagen erhalten Sie vor einer Beauftragung zusätzlich mit Ihrem persönlichen Angebot per E-Mail.</p><p>Unterlagenfassung 06.11.2026 · Darstellung vom 07.11.2026 · Deutsch</p><div class="info-strip"><strong>Veröffentlichung in Vorbereitung</strong><p>Diese Seite schließt keinen Kaufvertrag. Demo-Download und Verkauf werden erst nach der noch offenen Namens-/Vertriebsbewertung und abschließenden Produktabnahme freigegeben.</p></div></section>
<nav class="legal-toc" aria-label="App-Unterlagen">${navigation}<a href="#urheberrecht">Urheberrecht und Fremdkomponenten</a></nav>
${sections}
<section id="urheberrecht" class="legal-document" aria-labelledby="copyright-title"><h2 id="copyright-title">Urheberrecht und Fremdkomponenten</h2><p>© 2026 Maurice Keil. Rechte an eigenen Anwendungsteilen vorbehalten; Komponenten unter ihren jeweiligen Lizenzen. Die eigene Anwendung wird im in den Lizenzbedingungen beschriebenen Umfang proprietär vertrieben. Ein Nutzungsrecht ist kein Eigentum am Quellcode und keine allgemeine Vertriebserlaubnis.</p><p>Rechte und Originalbedingungen von Microsoft-, .NET- und Open-Source-Bestandteilen bleiben bei den jeweiligen Rechteinhabern. Sie gelten für diese Bestandteile vorrangig. Die zu einem konkreten Programmpaket gehörenden Lizenz- und Dritthinweise werden mit diesem Paket bereitgestellt. Die eigene Lizenz ersetzt diese Originalbedingungen nicht.</p><ul><li><a href="/assets/apps/keil-copy/Runtime-MIT.txt">.NET Runtime: MIT-Lizenz im Original</a></li><li><a href="/assets/apps/keil-copy/WindowsDesktop-MIT.txt">Windows Desktop Runtime: MIT-Lizenz im Original</a></li><li><a href="/assets/apps/keil-copy/Runtime-Drittanbieter.txt">.NET Runtime: Originalhinweise zu Drittanbietern</a></li></ul><p>Gesetzlich zulässige Sicherungskopien, Untersuchungen und Interoperabilität sowie die gesetzliche Erschöpfung bleiben unberührt. Die Produktbezeichnung wird hier nicht als eingetragene Marke oder als bestätigte Ausschließlichkeit ausgewiesen.</p><p>Vertragspartner und Ansprechpartner: Maurice Keil · PC &amp; Handyservice Augsburg · Stätzlinger Straße 99 · 86165 Augsburg · Deutschland · <a href="tel:+4915254530080">0152 54530080</a> · <a href="mailto:keil.maurice1980@gmail.com">keil.maurice1980@gmail.com</a></p></section>
</main><footer class="app-footer"><div><strong>PC &amp; Handyservice Augsburg · Maurice Keil</strong><p>© 2026 Maurice Keil · Rechte fremder Bestandteile bleiben unberührt.</p></div><nav aria-label="Rechtliche Informationen"><a href="/apps">App-Übersicht</a><a href="/impressum">Impressum</a><a href="/datenschutz">Website-Datenschutz</a></nav></footer></body></html>
`;
const output = path.join(root, 'apps-lizenz.html');
if (process.argv.includes('--check')) {
  if (!fs.existsSync(output) || fs.readFileSync(output, 'utf8') !== html) {
    throw new Error('Die HTML-App-Unterlagen stimmen nicht mit den aktuellen Originaldokumenten überein. Bitte node tools/build-app-legal.mjs ausführen.');
  }
  console.log('HTML-App-Unterlagen stimmen mit den Originaldokumenten überein.');
} else {
  fs.writeFileSync(output, html);
  console.log('App-Unterlagen als HTML aufgebaut; Quellen und Freigabestatus unverändert.');
}
