# Microsoft Clarity und Bing Webmaster Tools

Stand: 15. Juli 2026

## Microsoft Clarity

Die Website enthält eine zustimmungsbasierte Clarity-Integration. Sie bleibt vollständig inaktiv, solange in den HTML-Dateien keine echte Projekt-ID im Attribut `data-clarity-project` eingetragen ist. Ohne Projekt-ID erscheint kein Banner und es wird keine Verbindung zu Microsoft aufgebaut.

Aktivierung:

1. Unter https://clarity.microsoft.com/ ein Projekt für `https://pc-und-handyservice-augsburg.pages.dev/` erstellen.
2. In Clarity unter **Settings → Setup** die Cookie-Voreinstellung ausschalten und Consent Mode verwenden.
3. Die echte Projekt-ID in allen HTML-Dateien eintragen:
   `<html lang="de" data-clarity-project="ECHTE_PROJEKT_ID">`
4. Deployment durchführen und im Browser prüfen, dass vor Zustimmung keine Anfrage an `clarity.ms` erfolgt.
5. Nach Zustimmung prüfen, dass `consentv2` mit `analytics_Storage: granted` und `ad_Storage: denied` übermittelt wird.
6. Die Datenschutzhinweise vor der Aktivierung nochmals rechtlich prüfen.

Die CSP ist für die von Microsoft dokumentierten Clarity-Domains vorbereitet. Das lokale Skript `clarity-consent.min.js` lädt Clarity ausschließlich nach Zustimmung.

## Bing Webmaster Tools

Bing benötigt einen kontospezifischen Eigentumsnachweis. Es wird absichtlich kein Platzhalter als angebliche Verifizierung veröffentlicht.

Empfohlener Ablauf:

1. https://www.bing.com/webmasters/ öffnen und die Website `https://pc-und-handyservice-augsburg.pages.dev/` hinzufügen.
2. Wenn eine verifizierte Google-Search-Console-Property vorhanden ist, diese direkt importieren.
3. Alternativ die von Bing gelieferte XML-Datei, den echten `msvalidate.01`-Meta-Tag oder einen CNAME-DNS-Eintrag verwenden.
4. Nach erfolgreicher Verifizierung `https://pc-und-handyservice-augsburg.pages.dev/sitemap.xml` in Bing einreichen.
5. Die Eigentumsprüfung und Sitemap-Verarbeitung im Bing-Dashboard kontrollieren.

Verifizierungscodes gehören nicht in Dokumentation, Issues oder Commit-Nachrichten.
