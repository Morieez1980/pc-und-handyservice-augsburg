# AGENTS.md - Arbeitsstandard fuer dieses Repository

## Ziel
Arbeite selbststaendig, sicher, reproduzierbar und moeglichst bis zum fertigen Ergebnis, statt nach jedem Zwischenschritt anzuhalten.

## Vorgehen
- Vor riskanten Aenderungen zuerst einen wiederherstellbaren Sicherheitsstand anlegen.
- Bestehende Nutzerarbeit niemals ungefragt verwerfen, resetten, ueberschreiben oder bereinigen.
- Bei einem klaren Auftrag Analyse, Umsetzung, Tests und sichere Korrekturen eigenstaendig bis zum Ergebnis fortsetzen.
- Nur bei echten Blockern, rechtlich/persoenlich erforderlichen Bestaetigungen oder mehrdeutigen folgenreichen Entscheidungen anhalten.
- PowerShell-Automatisierung moeglichst als grosse, vollstaendige Skripte oder einen einzelnen Startbefehl liefern.
- Interaktive Rueckfragen in Skripten vermeiden, soweit technisch und rechtlich moeglich.
- Nach Aenderungen die vorhandenen Tests und Validierungen ausfuehren; bei Website-Aenderungen Desktop und Smartphone beruecksichtigen.
- Cloudflare: Preview vor Production, Production nur nach bestandenen Tests; Rollback-Ziel dokumentieren.
- Fehler nicht verdecken. Exitcodes pruefen und bei Fehlern sicher stoppen.
- Temporare Artefakte wie node_modules, .wrangler und test-results nicht versehentlich committen.

## Kommunikation
- Keine langen Zwischenberichte, wenn direkt weitergearbeitet werden kann.
- Nur relevante Blocker, notwendige Nutzereingriffe und das Endergebnis hervorheben.
- Konkrete Pfade, Befehle und geaenderte Dateien nennen.
