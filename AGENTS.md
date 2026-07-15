# AGENTS.md

## Projekt

Statische, deutschsprachige Unternehmenswebsite für **PC & Handyservice Augsburg** auf Cloudflare Pages.

- Production-Branch: `main`
- Framework: keines
- Build-Verzeichnis: Repository-Wurzel
- Lokaler Server: `python -m http.server 4173`
- JavaScript-Prüfung: `node --check script.js`
- Repository-Prüfung: `node tools/validate.mjs`

## Arbeitsweise

1. Niemals direkt auf `main` arbeiten.
2. Für jede Änderung einen kleinen, klar benannten Branch und Pull Request verwenden.
3. Bestehendes Design und Verhalten nur ändern, wenn die Aufgabe dies ausdrücklich verlangt.
4. Vor jedem PR mindestens `node --check script.js` und `node tools/validate.mjs` ausführen.
5. Keine Secrets, Zugangsdaten, Kundendaten oder privaten Schlüssel committen.
6. Keine Telefonnummern, E-Mail-Adressen, Preise, Bewertungen, USt-IDs, Registerdaten oder rechtlichen Angaben erfinden.
7. Externe Skripte, Tracker, Karten, Formulare oder Schriftarten nur nach Datenschutz- und CSP-Prüfung ergänzen.
8. Änderungen an Canonical-URLs, Sitemap, robots.txt, security.txt und strukturierten Daten immer konsistent durchführen.
9. Mobile Darstellung, Tastaturbedienung, Fokuszustände und `prefers-reduced-motion` erhalten.
10. Pull Requests müssen Zusammenfassung, Tests, Risiken, offene Punkte und Rückrollmöglichkeit enthalten.

## Qualitätsanforderungen

- gültiges semantisches HTML
- eindeutiger Seitentitel und Meta-Beschreibung
- Canonical-URL auf jeder indexierbaren Seite
- keine defekten internen Pflichtlinks
- keine externen Skripte oder Stylesheets ohne ausdrückliche Freigabe
- `target="_blank"` nur mit `noopener noreferrer`
- Sicherheitsheader in `_headers` erhalten
- keine horizontalen Überläufe auf Mobilgeräten
- keine Browserkonsolenfehler
- strukturierte Daten müssen zu sichtbaren Inhalten passen

## Definition of Done

Eine Änderung ist fertig, wenn:

- die Aufgabe vollständig umgesetzt ist,
- alle vorhandenen Prüfungen erfolgreich sind,
- keine erfundenen Unternehmens- oder Rechtsdaten eingeführt wurden,
- die Live-Funktionalität nicht unbeabsichtigt verändert wurde,
- der PR klein, nachvollziehbar und rückrollbar bleibt.
