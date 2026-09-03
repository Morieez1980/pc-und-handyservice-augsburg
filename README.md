# PC & Handyservice Augsburg

Statische Website für PC & Handyservice Augsburg – optimiert für Cloudflare Pages und erreichbar unter https://www.pc-und-handyservice-augsburg.com/.

## Lokal testen

```powershell
python -m http.server 4173
```

Danach `http://localhost:4173` öffnen.

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
