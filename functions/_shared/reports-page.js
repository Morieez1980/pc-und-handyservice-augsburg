import { escapeHtml } from "./http.js";

const shell = (title, description, body, canonical) => `<!doctype html>
<html lang="de" data-private-page="true"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(title)}</title><meta name="description" content="${escapeHtml(description)}"><link rel="canonical" href="${canonical}">
<meta name="theme-color" content="#050914"><link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="/styles.min.css?v=20260914-1"><link rel="stylesheet" href="/reports.css?v=20260914-2"></head>
<body><a class="skip-link" href="#main">Zum Inhalt springen</a><header class="site-header scrolled"><a class="brand" href="/" aria-label="Startseite"><span class="brand-mark">MK</span><span><strong>PC &amp; Handyservice</strong><small>Augsburg · Maurice Keil</small></span></a><nav class="nav" aria-label="Hauptnavigation"><a href="/#leistungen">Leistungen</a><a href="/#preise">Preise</a><a href="/reparaturberichte" aria-current="page">Reparaturberichte</a><a class="nav-cta" href="/reparaturanfrage">Reparatur anfragen</a></nav></header>
<main id="main" class="reports-main">${body}</main><footer class="reports-footer"><a href="/">Startseite</a><a href="/reparaturanfrage">Reparaturanfrage</a><a href="/datenschutz">Datenschutz</a><a href="/impressum">Impressum</a><span>© 2026 Maurice Keil</span></footer>
<script src="/clarity-consent.min.js?v=20260914-1" defer></script><script src="/reports.js?v=20260914-2" defer></script></body></html>`;

const stageLabels = { before: "Vorher", repair: "Reparatur", result: "Ergebnis" };
const image = (item, index) => {
  const src = `/api/reparaturberichte/bild/${encodeURIComponent(item.id)}`;
  const stageKey = stageLabels[item.stage] ? item.stage : "repair";
  return `<figure class="stage-${stageKey}"><button type="button" class="gallery-open" data-gallery-src="${src}" data-gallery-alt="${escapeHtml(item.alt_text)}" aria-label="${escapeHtml(item.alt_text)} vergrößern"><img src="${src}" alt="${escapeHtml(item.alt_text)}" loading="${index ? "lazy" : "eager"}" width="1200" height="800"><span>${stageLabels[stageKey]}</span></button><figcaption><b>${index + 1}.</b> ${escapeHtml(item.alt_text)}</figcaption></figure>`;
};

export function renderIndex(reports) {
  const cards = reports.length ? reports.map((report) => `<article class="report-card"><a href="/reparaturberichte/${encodeURIComponent(report.slug)}">${report.image_id ? `<img src="/api/reparaturberichte/bild/${encodeURIComponent(report.image_id)}" alt="${escapeHtml(report.image_alt || "Reparaturfoto")}" loading="lazy" width="720" height="480">` : `<div class="report-placeholder" aria-hidden="true">MK</div>`}<div class="report-card-copy"><span class="report-category">${escapeHtml(report.category)}</span><h2>${escapeHtml(report.title)}</h2>${report.device_model || report.repair_type ? `<div class="report-card-facts">${report.device_model ? `<span>${escapeHtml(report.device_model)}</span>` : ""}${report.repair_type ? `<span>${escapeHtml(report.repair_type)}</span>` : ""}</div>` : ""}<p>${escapeHtml(report.summary)}</p><span class="report-link">Bericht mit Bildern ansehen →</span></div></a></article>`).join("") : `<div class="reports-empty"><h2>Die ersten Berichte werden vorbereitet.</h2><p>Hier erscheinen demnächst dokumentierte Reparaturen mit Fotos und verständlichen Erklärungen.</p></div>`;
  return shell("Reparaturberichte | PC & Handyservice Augsburg", "Dokumentierte PC-, Handy- und Konsolenreparaturen mit Fotos, Diagnose und Ergebnis.", `<section class="reports-hero"><p class="reports-eyebrow">Aus der Werkstatt</p><h1>Echte Reparaturen.<br><em>Sauber dokumentiert.</em></h1><p>Einblicke in Fehlerbilder, Diagnosen und Reparaturschritte – verständlich erklärt und ohne persönliche Kundendaten.</p></section><section class="reports-list" aria-label="Veröffentlichte Reparaturberichte">${cards}</section>`, "https://www.pc-und-handyservice-augsburg.com/reparaturberichte");
}

export function renderDetail(report, images, questions) {
  const gallery = images.length ? `<div class="report-gallery">${images.map(image).join("")}</div>` : "";
  const qa = questions.length ? questions.map((question) => `<article class="qa-item"><h3>${escapeHtml(question.display_name)} fragt</h3><p>${escapeHtml(question.body)}</p>${question.answer ? `<div class="owner-answer"><strong>Antwort von Maurice Keil</strong><p>${escapeHtml(question.answer)}</p></div>` : ""}</article>`).join("") : `<p class="reports-muted">Zu diesem Bericht wurden noch keine Fragen veröffentlicht.</p>`;
  const facts = report.device_model || report.repair_type || report.tested_functions ? `<dl class="report-facts">${report.device_model ? `<div><dt>Gerät</dt><dd>${escapeHtml(report.device_model)}</dd></div>` : ""}${report.repair_type ? `<div><dt>Reparatur</dt><dd>${escapeHtml(report.repair_type)}</dd></div>` : ""}${report.tested_functions ? `<div><dt>Geprüft</dt><dd>${escapeHtml(report.tested_functions)}</dd></div>` : ""}</dl>` : "";
  const body = `<article class="report-detail"><a class="reports-back" href="/reparaturberichte">← Alle Reparaturberichte</a><span class="report-category">${escapeHtml(report.category)}</span><h1>${escapeHtml(report.title)}</h1><p class="report-summary">${escapeHtml(report.summary)}</p>${facts}<nav class="repair-journey" aria-label="Ablauf dieser Reparatur"><span><b>01</b>Fehlerbild</span><i></i><span><b>02</b>Diagnose</span><i></i><span><b>03</b>Reparatur</span><i></i><span><b>04</b>Ergebnis</span></nav>${gallery}<div class="report-sections"><section><span>01</span><h2>Fehlerbild</h2><p>${escapeHtml(report.problem)}</p></section><section><span>02</span><h2>Diagnose</h2><p>${escapeHtml(report.diagnosis)}</p></section><section><span>03</span><h2>Reparatur und Ergebnis</h2><p>${escapeHtml(report.solution)}</p></section></div><aside class="privacy-note">Dieser Bericht enthält keine Passwörter, Seriennummern oder Kontaktdaten. Fotos werden vor Veröffentlichung auf erkennbare persönliche Angaben geprüft.</aside><aside class="report-cta"><span>Ähnliches Problem?</span><h2>Gerät prüfen und Reparatur anfragen</h2><p>Beschreiben Sie kurz den Fehler und senden Sie auf Wunsch passende Fotos mit. Zusatzarbeiten erfolgen erst nach Ihrer Zustimmung.</p><a class="button button-primary" href="/reparaturanfrage">Reparaturanfrage starten →</a></aside><section class="questions"><h2>Fragen zu dieser Reparatur</h2><div class="qa-list">${qa}</div><form id="question-form" data-report-id="${escapeHtml(report.id)}"><h3>Frage stellen</h3><p class="reports-muted">Die Frage wird geprüft und erscheint erst nach Freigabe.</p><label>Anzeigename<input name="display_name" required maxlength="50" autocomplete="nickname"></label><label>Ihre Frage<textarea name="body" required minlength="10" maxlength="800"></textarea></label><label class="honeypot" aria-hidden="true">Website<input name="website" tabindex="-1" autocomplete="off"></label><label class="consent"><input type="checkbox" name="consent" required> Ich stimme der Verarbeitung meiner Angaben zur Prüfung und Beantwortung gemäß <a href="/datenschutz">Datenschutzerklärung</a> zu.</label><button class="button button-primary" type="submit">Frage zur Prüfung senden</button><p class="form-result" aria-live="polite"></p></form></section><dialog class="gallery-dialog" aria-label="Bild vergrößert anzeigen"><button type="button" class="gallery-close" aria-label="Vergrößerte Ansicht schließen">×</button><img alt=""><p></p></dialog></article>`;
  return shell(`${report.title} | Reparaturbericht`, report.summary, body, `https://www.pc-und-handyservice-augsburg.com/reparaturberichte/${encodeURIComponent(report.slug)}`);
}

export function reportPageHeaders(cacheControl = "public, max-age=60") {
  return {
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": cacheControl,
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
    "Content-Security-Policy": "default-src 'self'; base-uri 'self'; connect-src 'self'; font-src 'self'; form-action 'self'; frame-ancestors 'none'; img-src 'self' data:; object-src 'none'; script-src 'self'; style-src 'self'; upgrade-insecure-requests",
  };
}
