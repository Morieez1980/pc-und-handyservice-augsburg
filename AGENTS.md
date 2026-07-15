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
2. Für jede Änderung einen kleinen, klar benannten Branch und Pull