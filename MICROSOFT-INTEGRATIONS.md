# Microsoft Clarity und Bing Webmaster Tools

Stand: 16. Juli 2026

## Microsoft Clarity

Microsoft Clarity ist für die kanonische Domain `https://www.pc-und-handyservice-augsburg.com/` eingerichtet. Die aktive Projekt-ID lautet `xn1s7qrbvj`.

Die Website lädt Clarity ausschließlich nach einer ausdrücklichen Einwilligung über das lokale Skript `clarity-consent.min.js`. Vor der Zustimmung wird keine Verbindung zu Microsoft aufgebaut. Die Consent-V2-Konfiguration setzt `analytics_Storage` nur nach Zustimmung auf `granted`; `ad_Storage` bleibt `denied`. Eine Entscheidung kann jederzeit über „Analyse-Einstellungen“ im Seitenfuß geändert werden.

Die CSP erlaubt nur die für Clarity benötigten Microsoft-Domains. Die Datenschutzerklärung beschreibt die aktive, einwilligungsbasierte Nutzung.

Prüfpunkte nach Deployments:

1. Ohne Zustimmung darf kein Clarity-Skript geladen werden.
2. Nach Zustimmung muss die Analyse für Projekt `xn1s7qrbvj` starten.
3. Nach Ablehnung darf kein Clarity-Skript geladen werden.
4. Der Link „Analyse-Einstellungen“ muss die Auswahl erneut öffnen.

## Bing Webmaster Tools

Bing benötigt einen kontospezifischen Eigentumsnachweis. Es wird absichtlich kein Platzhalter als angebliche Verifizierung veröffentlicht.

Empfohlener Ablauf:

1. https://www.bing.com/webmasters/ öffnen und `https://www.pc-und-handyservice-augsburg.com/` hinzufügen.
2. Die bereits verifizierte Google-Search-Console-Property importieren.
3. Alternativ die von Bing gelieferte XML-Datei, den echten `msvalidate.01`-Meta-Tag oder einen CNAME-DNS-Eintrag verwenden.
4. Nach erfolgreicher Verifizierung `https://www.pc-und-handyservice-augsburg.com/sitemap.xml` einreichen.
5. Eigentumsprüfung und Sitemap-Verarbeitung im Bing-Dashboard kontrollieren.

Verifizierungscodes gehören nicht in Dokumentation, Issues oder Commit-Nachrichten.
