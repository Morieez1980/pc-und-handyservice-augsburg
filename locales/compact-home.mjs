// Short visible introductions; full service and price detail stays available.
export const compactHomeTitles={
 de:'PC-, Handy- & Konsolenreparatur in Augsburg.',en:'PC, phone & console repair in Augsburg',tr:'Augsburg’da PC, telefon ve konsol onarımı',ro:'Reparații PC, telefoane și console în Augsburg',uk:'Ремонт ПК, телефонів і консолей в Augsburg',es:'Reparación de PC, móviles y consolas en Augsburg',sv:'PC-, mobil- och konsolreparation i Augsburg',da:'PC-, mobil- og konsolreparation i Augsburg',ru:'Ремонт ПК, телефонов и консолей в Augsburg',zh:'奥格斯堡：电脑、手机与游戏机维修',ja:'PC・スマホ・ゲーム機修理｜アウクスブルク',pl:'Naprawa PC, telefonów i konsol w Augsburgu',it:'Riparazione PC, telefoni e console ad Augsburg',fr:'Réparation PC, mobiles et consoles à Augsburg',bg:'Ремонт на PC, телефони и конзоли в Augsburg',hr:'Popravak PC-ja, mobitela i konzola u Augsburgu',el:'Επισκευή PC, κινητών και κονσολών στο Augsburg',ar:'إصلاح الكمبيوتر والهواتف وأجهزة الألعاب في أوغسبورغ',fa:'تعمیر رایانه، موبایل و کنسول در آوگسبورگ'
};
export function compactGermanHome(html){
 html=html.replace(/(<div class="service-grid">)([\s\S]*?)(<\/div>\s*<p class="workshop-gallery-shortcut")/,(_,open,body,close)=>{
  let index=0;
  return open+body.replace(/(<article class="service-card[^\"]*"[^>]*>)([\s\S]*?)(<\/article>)/g,(_,start,content,end)=>{
   index++;
   if(index<=4)content=content.replace(/<p>[\s\S]*?<\/p>/,'');
   if(index===5)content=content.replace(/<p>[\s\S]*?<\/p>/,'<p>Lötarbeiten, Microsoldering, Mainboard und Chip-Level – bei Bedarf mit spezialisierten Partnern. Ich bleibe Ihr Ansprechpartner.</p>');
   if(index===6)content=content.replace(/<p>[\s\S]*?<\/p>/,'<p>Neue und gebrauchte Geräte, Komponenten und Zubehör. Passende Upgrades, Beratung und Beschaffung über meine Händler.</p>');
   return start+content+end;
  })+close;
 });
 html=html.replace(/(<section class="section why-us">[\s\S]*?<h2>[\s\S]*?<\/h2>)<p>[\s\S]*?<\/p>/,'$1<p>Ich bin Maurice Keil, Inhaber und Reparateur. Technikerfahrung seit 2001, Gewerbe seit 2023: Aus Hausbesuchen ist mein persönlicher Terminservice gewachsen. Mein Schwerpunkt sind Windows, Software und Hardware für PCs und Laptops. Ich berate verständlich, bespreche Kosten vorab und betreue Privat- und Geschäftskunden persönlich – auch bei Spezialarbeiten über Partner.</p>');
 html=html.replace(/<p>In Google-Bewertungen schätzen Kunden[\s\S]*?<\/p>/,'<p>Persönlicher Kontakt, klare Kommunikation und faire Preisabsprachen sind mir wichtig.</p>');
 html=html.replace(/(<strong>Geräteannahme<\/strong>\s*<span>)[\s\S]*?(<\/span>)/,'$1Mo–Fr 10–20 Uhr, Sa 10–16 Uhr; Sonntag geschlossen. Nur mit bestätigtem Termin. Bitte mindestens eine Stunde vorher anfragen und meine Bestätigung abwarten.$2');
 const descriptions={
  'Fehlerdiagnose':'Prüfung und Angebot; entfällt bei beauftragter Reparatur.',
  'Beratung':'Kurze Ersteinschätzung per Telefon oder Nachricht.',
  'System-Check':'Systemzustand und Einstellungen prüfen.',
  'Daten-Backup':'Lesbare Dateien sichern; Speichermedium zusätzlich.',
  'Windows-Installation':'Windows, Treiber und Grundeinrichtung; Lizenz/Backup extra.',
  'Treiber-Installation':'Ein Treiber im einfachen Standardfall. Fehlersuche/BIOS nach Angebot.',
  'Software-Installation':'Ein kompatibles Programm; Lizenz und zusätzliche Einrichtung extra.',
  'SSD-Einbau inkl. Klonen':'SSD einbauen und lesbares System klonen; SSD zusätzlich.',
  'RAM-Aufrüstung':'Zugängliches RAM einsetzen und prüfen; RAM und Zerlegung extra.',
  'Reinigung &amp; Wartung':'Innenreinigung und Kühlung prüfen; Umfang nach Gerät.',
  'Displaywechsel':'Arbeitsleistung; passendes Display zusätzlich.',
  'Akkutausch':'Einfacher Smartphonefall; Akku extra. Andere Geräte nach Angebot.',
  'Ladeanschluss-Reparatur':'Anschluss prüfen und instand setzen; Ersatzteile zusätzlich.',
  'Rückglas-Reparatur':'Für geeignete Modelle; Rückglas zusätzlich.',
  'Software- / Systemfehler':'Vereinbarte Software- oder Systemstörung beheben.',
  'Datenrettungsanalyse':'Analyse allein oder bei erfolgloser Wiederherstellung.',
  'Datenrettung':'Softwarebasierte Rettung inkl. Analyse; Gesamtpreis vorab vereinbart.',
  'PlayStation-Reinigung':'Innenreinigung; Flüssigmetall und Mehraufwand nach Angebot.',
  'PlayStation-Reparatur':'Arbeitsleistung nach Fehler; Ersatzteile zusätzlich.',
  'Xbox-Reinigung':'Innenreinigung; aufwendige Kühlung nach Angebot.',
  'Xbox-Reparatur':'Arbeitsleistung nach Fehler; Ersatzteile zusätzlich.',
  'Wärmeleitpaste erneuern':'Standardpaste; Flüssigmetall-Service separat.',
  'HDMI-Anschluss-Reparatur':'Arbeitsleistung; Buchse und Leiterbahnen nach Angebot.'
 };
 html=html.replace(/(<article class="price-card[^\"]*"[^>]*><div><h3>)([^<]+)(<\/h3><p>)[\s\S]*?(<\/p>)/g,(all,start,name,middle,end)=>descriptions[name]?start+name+middle+descriptions[name]+end:all);
 html=html.replace(/<p class="pricing-note reveal"><strong>Diagnose und Datenrettung:<\/strong>[\s\S]*?<\/p>/,'<p class="pricing-note reveal"><strong>Diagnose:</strong> 30 € ohne Reparatur, bei beauftragter Reparatur entfällt die Gebühr. <strong>Datenrettung:</strong> Analyse allein/ohne Erfolg 55 €; erfolgreiche softwarebasierte Rettung ab 120 € inkl. Analyse. Gesamtpreis vor dem Rettungsversuch vereinbart.</p>');
 html=html.replace(/<p class="pricing-note reveal">Die Ab-Preise gelten[\s\S]*?<\/p>/,'<p class="pricing-note reveal">Ab-Preise für einfache Standardarbeiten. Ersatzteile, Speichermedien und Lizenzen zusätzlich; Gesamtpreis und Mehrarbeiten nur nach Absprache und Freigabe. Gleiche Endpreise für Privat- und Geschäftskunden; bestehende Angebote bleiben gültig. Stand 30.10.2026. Gemäß § 19 UStG wird keine Umsatzsteuer ausgewiesen.</p>');
 return html.replace(/(<!-- home-first-screen:end -->)[\r\n \t]+(?=<section class="section services")/g,'$1\n\n    ');
}
