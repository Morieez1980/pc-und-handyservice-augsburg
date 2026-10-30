import fs from 'node:fs';import path from 'node:path';
import {prices} from '../locales/content.mjs';
const root=path.resolve(import.meta.dirname,'..');
const names=['Fehlerdiagnose','Beratung','System-Check','Daten-Backup','Windows-Installation','Treiber-Installation','Software-Installation','SSD-Einbau inkl. Klonen','RAM-Aufrüstung','Reinigung &amp; Wartung','Displaywechsel','Akkutausch','Ladeanschluss-Reparatur','Rückglas-Reparatur','Software- / Systemfehler','Datenrettungsanalyse','Datenrettung','PlayStation-Reinigung','PlayStation-Reparatur','Xbox-Reinigung','Xbox-Reparatur','Wärmeleitpaste erneuern','HDMI-Anschluss-Reparatur'];
const summaryPrices={
  'pc-reparatur-augsburg.html':[['System-Check',2],['SSD inklusive Klonen',7],['Reinigung &amp; Wartung',9]],
  'handyreparatur-augsburg.html':[['Displaywechsel',10],['Akkutausch',11],['Softwarefehler',14]],
  'konsolenreparatur-augsburg.html':[['Reinigung',17],['HDMI-Reparatur',22],['Reparatur',18]],
};
for(const[file,entries]of Object.entries(summaryPrices)){
  let s=fs.readFileSync(path.join(root,file),'utf8');
  for(const[label,index]of entries){
    const escaped=label.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
    const pattern=new RegExp('(<strong>'+escaped+' ab )\\d+( €<\\/strong>)','g');
    if(!pattern.test(s))throw Error('Missing price summary: '+file+' '+label);
    s=s.replace(pattern,'$1'+prices[index]+'$2');
  }
  fs.writeFileSync(path.join(root,file),s);
}
const details=['30 € für Prüfung und Reparaturangebot; bei beauftragter Reparatur entfällt die Diagnosegebühr.','Kurze Ersteinschätzung per Telefon oder Nachricht.','Fehlersuche und Prüfung von Systemzustand und Einstellungen.','Sicherung vorhandener, lesbarer Dateien; Speichermedium zusätzlich.','Installation, Treiber und Grundeinrichtung; Lizenz und Datensicherung bei Bedarf zusätzlich.','Einfacher Standardfall: einen passenden Gerätetreiber installieren und kurz prüfen. Fehlersuche und BIOS-Arbeiten nach Angebot.','Einfacher Standardfall: ein kompatibles Programm installieren und starten; Lizenz und zusätzliche Einrichtung separat.','SSD montieren und ein lesbares bestehendes System übertragen; SSD zusätzlich.','Einfach zugängliches RAM-Modul einsetzen und kurz prüfen; RAM zusätzlich. Aufwendige Zerlegung nach Angebot.','PC oder Notebook innen reinigen und Kühlung prüfen; Umfang nach Gerät.','Arbeitsleistung für Smartphone oder Tablet; passendes Display zusätzlich.','Arbeitsleistung im einfachen Smartphone-Standardfall; Akku zusätzlich. Tablets und MacBooks nach Gesamtangebot.','Anschluss prüfen und instand setzen; erforderliche Ersatzteile zusätzlich.','Arbeitsleistung bei geeigneten Modellen; Rückglas zusätzlich.','Vereinbarte Software- oder Systemstörung beheben.','Analyse allein oder bei erfolgloser Wiederherstellung.','Softwarebasierte Wiederherstellung ab 120 € einschließlich Analyse. Gesamtpreis vor dem Rettungsversuch vereinbart.','Innenreinigung; Flüssigmetall und aufwendige Kühlungsarbeiten nach Angebot.','Arbeitsleistung je nach Fehler; benötigte Ersatzteile zusätzlich.','Innenreinigung; aufwendige Kühlungsarbeiten nach Angebot.','Arbeitsleistung je nach Fehler; benötigte Ersatzteile zusätzlich.','Standard-Wärmeleitpaste nach Geräteprüfung; Flüssigmetall-Service separat.','Arbeitsleistung je nach Konsole; Buchse und beschädigte Leiterbahnen nach Angebot.'];
let h=fs.readFileSync(path.join(root,'index.html'),'utf8');let i=0;
h=h.replace(/<article class="price-card reveal">[\s\S]*?<\/article>/g,()=>{const n=i++;return '<article class="price-card reveal"><div><h3>'+names[n]+'</h3><p>'+details[n]+'</p></div><strong>'+(n===1?'kostenlos':([0,15].includes(n)?'':'ab&nbsp;')+prices[n]+'&nbsp;€')+'</strong></article>';});
if(i!==23)throw Error('Expected 23 price cards, got '+i);
h=h.replace(/<p class="pricing-note reveal">(?:Alle Preise|Orientierung für neue Anfragen)[\s\S]*?<\/p>/,'<p class="pricing-note reveal">Die Ab-Preise gelten für einfache Standardarbeiten im beschriebenen Umfang. Ersatzteile, Speichermedien und Lizenzen kommen bei Bedarf hinzu. Vor Ihrer Freigabe erhalten Sie den vollständigen Gesamtpreis; zusätzliche Arbeiten nur nach Zustimmung. Gleiche Endpreise für Privat- und Geschäftskunden. Bestehende Angebote bleiben gültig. Stand 30.10.2026. Gemäß § 19 UStG wird keine Umsatzsteuer ausgewiesen.</p>');
fs.writeFileSync(path.join(root,'index.html'),h);
for(const file of['pc-reparatur-augsburg.html','handyreparatur-augsburg.html','konsolenreparatur-augsburg.html']){let s=fs.readFileSync(path.join(root,file),'utf8');for(let n=2;n<names.length;n++){const label=names[n].replace('inkl.','inklusive');const esc=label.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');s=s.replace(new RegExp('(<li>'+esc+' – ab )\\d+( €<\\/li>)','g'),'$1'+prices[n]+'$2');}s=s.replace(/(<\/ul>)(<\/aside>)/,'$1<p>Serviceleistung ab dem genannten Betrag; notwendige Ersatzteile zusätzlich. Vollständiges Angebot vor Ihrer Freigabe.</p>$2');fs.writeFileSync(path.join(root,file),s);}
