# PC & Handyservice Augsburg

Statische Website für PC & Handyservice Augsburg – optimiert für Cloudflare Pages und erreichbar unter https://www.pc-und-handyservice-augsburg.com/.

## Lokal testen

```powershell
python -m http.server 4173
```

Danach `http://localhost:4173` öffnen.

`npm test` führt die vorhandenen Unit-Tests sowie Regressionstests für spanische Preise und Terminangaben, die Gerätekennungs-Ausnahme und abgelaufene Schließhinweise aus. `npm run validate` prüft anschließend die Website. Beide Prüfungen benötigen den vollständigen Checkout einschließlich der Bilddateien; fehlende Assets dürfen nicht durch Platzhalter ersetzt werden. Änderungen an `locales/` mit `npm run build:locales` erzeugen und generierte Änderungen vor dem Commit auf unbeabsichtigte Abweichungen prüfen.

## Cloudflare Pages

- Production branch: `main`
- Framework preset: `None`
- Build command: leer lassen
- Build output directory: `/`

Jeder Push auf `main` löst nach der GitHub-Verknüpfung automatisch ein Deployment aus.

## Sicherheit und Rechtliches

- Keine extern eingebundenen Schriftarten oder Bilder; das Bigin-Formular wird ausschließlich auf der Reparaturanfrage-Seite eingebettet
- Strenge Content Security Policy, HSTS, Frame-Schutz und eingeschränkte Browserberechtigungen
- Automatische Website- und Sicherheitsprüfung bei jedem Pull Request
- Tastaturfreundliche Mobilnavigation und installierbare Web-App-Metadaten
- Konsistente Deployments durch versionierte und revalidierte Assets
- Tägliche automatische Produktionsüberwachung über GitHub Actions
- Zustimmungsbasierte, standardmäßig deaktivierte Microsoft-Clarity-Vorbereitung
- Bing-Webmaster-Tools-Aktivierungsanleitung ohne unsichere Platzhalter-Verifizierung
- Kompositorische Animationen und optimierte Cache-Strategie für versionierte Assets
- Sicherheitsmeldungen über `SECURITY.md` und `/.well-known/security.txt`
- Impressum nach § 5 DDG und Datenschutzhinweise für Cloudflare Pages, E-Mail/Telefon und den freiwilligen Google-Profillink
- Trackerfreie Google-Bewertungsübersicht mit serverseitiger Google-Places-Abfrage, aktuellen Einzelrezensionen aus dem Google-Unternehmensprofil, Cache und geprüftem Ausfallwert
- Service- und Diagnosepreise mit transparentem Kostenvorbehalt
- Verifizierte Instagram-, TikTok- und Facebook-Profile sowie direkter WhatsApp-Kontakt als einfache, nicht eingebettete Links

Vor dem produktiven Merge durch den Betreiber prüfen:

- Umsatzsteuer-Identifikationsnummer oder Wirtschafts-Identifikationsnummer ergänzen, falls vorhanden
- Registereintrag und Registernummer ergänzen, falls vorhanden
- Cloudflare Data Processing Addendum im Cloudflare-Konto bestätigen und dokumentieren
- Rechtstexte bei Änderungen an Hosting, Tracking, Formularen, Karten, Terminbuchung oder weiteren Drittanbietern aktualisieren
- Für die automatische Google-Bewertungsaktualisierung in Cloudflare Pages die verschlüsselte Variable `GOOGLE_PLACES_API_KEY` und die Variable `GOOGLE_PLACE_ID` hinterlegen; bis dahin bleibt der zuletzt geprüfte Stand sichtbar
- Für aktuelle Einzelrezensionen zusätzlich die verschlüsselten Variablen `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET` und `GOOGLE_OAUTH_REFRESH_TOKEN` hinterlegen. Konto und Standort werden automatisch erkannt; optional lassen sie sich mit `GOOGLE_BUSINESS_ACCOUNT_ID`, `GOOGLE_BUSINESS_LOCATION_ID` oder `GOOGLE_BUSINESS_STORE_CODE` eindeutig festlegen.

## Explizite Preview-QA für PR #149

`.github/workflows/preview-qa.yml` startet ausschließlich bei Änderungen seiner QA-Dateien auf `copilot/inhaltskonsistenz-20261114-d7c3b226`. Kein Zeitplan, keine frei eingebbaren URLs/Befehle, kein Produktionsmonitor und kein `workflow_dispatch`. Berechtigung: ausschließlich `contents: read`; Checkout ohne gespeicherte Zugangsdaten.

Die unveränderliche Preview `https://67c1001a.pc-und-handyservice-augsburg.pages.dev/` gehört laut erfolgreichem Cloudflare-Check zum Website-Commit `7e3f1f8a4053782be435b6d96931f366bce15730` (Deployment `67c1001a-9394-4fd3-9e75-d3cdc18464bd`). Der QA-Commit darf gegenüber diesem Stand nur README und die zwei QA-Dateien ändern; sonst bricht die Zuordnungsprüfung ab. Ein nachfolgendes Cloudflare-Deployment des QA-Commits wird nicht automatisch als geprüft ausgegeben.

Playwright `1.56.1` und Chromium werden ausschließlich im kostenlosen normalen GitHub-CI-Job in getrennten Arbeitsverzeichnissen installiert; vorhandene Paketdateien bleiben unverändert. `tools/test-preview-qa.mjs` prüft alle vorhandenen Sprachrouten bei 320, 360, 390 und 1280 CSS-Pixeln: Überlauf, Sprach-/Mobilnavigation, JS-/HTTP-Fehler, initiale Bilder, interne Links/Assets, SEO-Metadaten, Sicherheitsheader und öffentliche Review-API-Verträge einschließlich dokumentierter Ausfallzustände. Externe Browseranfragen und alle schreibenden Methoden sind blockiert; keine Formular-, Kunden- oder Consent-Daten werden abgeschickt. Externe Dienste und Formulare sind ausdrücklich nicht funktional abgenommen.

Run-Zusammenfassung und Artefakt `preview-qa-<QA-Commit>` enthalten die genaue Zuordnung; `results.json` und Screenshots bleiben sieben Tage erhalten. Nur ein tatsächlich erfolgreicher Browser-Schritt gilt als grüne Preview-QA. Fehlgeschlagene Prüfungen bleiben Merge-Gates; kein Merge/Push auf `main` gehört zu diesem Workflow.
