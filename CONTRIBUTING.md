# Mitwirken

## Grundsatz

Änderungen werden nicht direkt auf `main` vorgenommen. Verwende einen kleinen, klar benannten Branch und einen Pull Request.

## Ablauf

1. Branch von `main` erstellen.
2. Nur zusammengehörige Änderungen umsetzen.
3. Vor dem Commit ausführen:
   - `node --check script.js`
   - `node tools/validate.mjs`
4. Mobile Darstellung, Tastaturbedienung und Browserkonsole prüfen.
5. Pull Request mit Zusammenfassung, Tests, Risiken, offenen Punkten und Rückrollmöglichkeit erstellen.

## Inhaltliche Regeln

- Keine Telefonnummern, E-Mail-Adressen, Preise, Bewertungen, Steuer- oder Registerangaben erfinden.
- Keine Secrets, Kundendaten oder Zugangsdaten committen.
- Externe Skripte, Tracker, Karten, Formulare oder Schriftarten nur nach Datenschutz- und CSP-Prüfung ergänzen.
- Änderungen an Canonical-URLs, Sitemap, `robots.txt`, `security.txt` und strukturierten Daten immer konsistent durchführen.

## Qualitätsanforderungen

- gültiges semantisches HTML
- keine defekten internen Links
- keine Browserkonsolenfehler
- keine horizontalen Überläufe
- sichtbare Fokuszustände
- Unterstützung von `prefers-reduced-motion`
- Sicherheitsheader in `_headers` erhalten
