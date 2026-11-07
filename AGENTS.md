# Website maintenance

For every website change, verify desktop and mobile layouts, including 320, 360 and 390 CSS pixels, navigation, contact actions and any available language pages. Prefer the Opera connector for the user's current browser context; use isolated browser tests for repeatable viewport checks. Do not submit real enquiries during tests. Keep the existing GitHub → Cloudflare Pages deployment and preserve DNS, email configuration, pricing and unrelated changes. Save local audit evidence in the established OneDrive ChatGPT task folder.


## Language versions

Customer-facing language selection: German, English, Turkish, Romanian, Ukrainian, Spanish, Swedish, Danish, Russian, Simplified Chinese and Japanese. Russian, Chinese and Japanese were expressly requested on 2026-10-02. Run node tools/build-locales.mjs after editing locales/ or the German form; generated HTML and form dictionaries are committed because Cloudflare has no build command. Preserve CRM field names and option values. Legal text, customer reviews and repair reports are explicitly marked German originals; do not claim they are translated. Verify every language at 320, 360, 390 and desktop widths and intercept all form submissions in tests.


## Werbeeinwilligung (06.11.2026)
Werbemails nur mit belegter, zweckgebundener und aktuell gültiger Zustimmung senden. Ein bestehender Kontakt, Email_Opt_Out=false oder eine Ja-Auswahl im Reparaturformular ist kein Double-Opt-in-Nachweis. Der Formularwunsch wird lediglich als ABGELEHNT / ANGEFRAGT_UNBESTAETIGT / NICHT_ANGEGEBEN im Auftragsfeld Description dokumentiert; Eingangszeitpunkt stammt aus Bigin. Bestätigte Anmeldung und Abmeldung müssen anhand des Versanddienstes geprüft werden.
Vor Werbeversand die Prüfung in functions/_shared/marketing-permission.js einbinden, auch CRM-Widersprüche und neuere Ablehnungen berücksichtigen. Fehlende, veraltete, mehrdeutige oder nicht verifizierbare Nachweise sperren den Versand. Keine Altkunden als zugestimmt importieren und keine ungefragten Zustimmungs-Werbemails versenden.
Aktuell ist die kostenlose Zoho-Campaigns-Anbindung noch nicht abgeschlossen. Private Supportbelege gehoeren nicht in dieses Repository. marketing-preferences.json bleibt deshalb providerReady=false und marketingSendingEnabled=false. Keine Veröffentlichung als funktionierende An-/Abmeldung und keine Aktivierung allein anhand lokaler Prüfungen. Nach Freischaltung echte Double-Opt-in-, Widerrufs- und Zustelltests sowie Datenschutzinformation und gegebenenfalls eine rechtliche Prüfung abschließen. Keine kostenpflichtige Buchung oder automatische Tarifaufwertung.
