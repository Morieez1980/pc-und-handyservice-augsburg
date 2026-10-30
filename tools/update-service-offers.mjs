import fs from 'node:fs';import path from 'node:path';import{extraServiceCards,specialistServiceSection}from'../locales/specialist-service.mjs';
const root=path.resolve(import.meta.dirname,'..');const read=f=>fs.readFileSync(path.join(root,f),'utf8');const write=(f,s)=>fs.writeFileSync(path.join(root,f),s);
const style='<link rel="stylesheet" href="/offers.css?v=20261030-2">';
for(const file of ['index.html','pc-reparatur-augsburg.html','handyreparatur-augsburg.html','konsolenreparatur-augsburg.html','datenrettung-augsburg.html']){
 let h=read(file);if(!h.includes('/offers.css?'))h=h.replace('</head>',style+'\n</head>');
 if(file==='index.html'){
  h=h.replace('<h3>PC & Laptop</h3><p>Fehlerdiagnose, Hardwaretausch, Aufrüstung, Einrichtung und Hilfe bei Softwareproblemen.</p>','<h3>Computer &amp; Mac</h3><p>PCs, Laptops, MacBooks und iMacs: Reparatur, Einrichtung, Wartung und Aufrüstung.</p>');
  h=h.replace('<ul><li>Langsame Systeme</li><li>Start- & Hardwarefehler</li><li>Windows & Programme</li></ul>','<ul><li>Windows &amp; macOS</li><li>SSD, RAM &amp; Hardware</li><li>Start- &amp; Systemprobleme</li></ul>');
  h=h.replace('Diagnose, Reinigung und Reparatur für PlayStation- und Xbox-Konsolen.','Diagnose, Reinigung und Reparatur für PlayStation, Xbox und weitere Spielekonsolen nach Prüfung.');
  h=h.replace('Von der ersten Fehleranalyse bis zum wieder funktionierenden Gerät – Sie bekommen eine klare Einschätzung und passende Hilfe.','Reparatur, Spezialservice, Upgrades und Geräteverkauf – persönlich betreut und klar nach Leistungsbereich geordnet.');
  h=h.replace(/(<section class="section services" id="leistungen">)([\s\S]*?)(\n    <\/section>)/,(all,start,body,end)=>{const extra=extraServiceCards('de');body=body.includes('service-specialist')?body.replace(/<article class="service-card service-specialist">[\s\S]*?<\/article><article class="service-card service-sales">[\s\S]*?<\/article>/,extra):body.replace(/\n      <\/div>\s*$/,'\n'+extra+'\n      </div>');return start+body+end});
  if(!h.includes('href="#spezialreparaturen" class="price-nav-specialist"'))h=h.replace(/(<nav class="price-nav reveal"[\s\S]*?)(<\/nav>)/,'$1<a href="#spezialreparaturen" class="price-nav-specialist">Spezialreparaturen</a><a href="#hardwareverkauf">Geräte &amp; Upgrades</a>$2');
  h=h.replace('Diagnose, PC & Laptop</h3>','Diagnose, Computer &amp; Mac</h3>');
  const needle='Ich helfe bei PCs, Laptops, Smartphones, Tablets und vielen Spielekonsolen. Beschreiben Sie Ihr Gerät und den Fehler am besten kurz per Telefon oder E-Mail.';
  h=h.replaceAll(needle,'Ich helfe bei PCs, Laptops, MacBooks und iMacs, Smartphones, Tablets und Spielekonsolen. Löt-, Mainboard- und Chip-Level-Reparaturen sind nach Prüfung auch über spezialisierte Partner möglich. Kopfhörer, Bluetooth-Adapter und vergleichbare Kleingeräte repariere ich nicht.');
 }else if(file==='pc-reparatur-augsburg.html'){
  h=h.replace('PC- &amp; Laptop-Reparatur<br>','PC-, Laptop- &amp; MacBook-Reparatur<br>');
  const marker='<div class="service-detail-copy">';if(!h.includes('data-mac-service'))h=h.replace(marker,marker+'<p data-mac-service>Auch MacBook, iMac, Mac mini und Mac Pro: Diagnose, Reparatur, Wartung und passende Upgrades nach Geräteprüfung. Spezielle Löt- und Mainboardarbeiten können über Reparaturpartner abgewickelt werden.</p>');
 }
 const specialist=specialistServiceSection('de');
 if(h.includes('id="spezialreparaturen"'))h=h.replace(/<aside class="specialist-notice"[\s\S]*?<\/aside>/,specialist);
 else if(file==='index.html')h=h.replace(/(?=<aside class="service-card hardware-sales")/,specialist+'\n');
 else h=h.replace(/(?=<section class="arrival-notice")/,'<section class="section service-offer-detail">'+specialist+'<p><a class="text-link" href="/#hardwareverkauf">Upgrades &amp; Hardwareverkauf: neue und gebrauchte Geräte, Komponenten und Zubehör →</a></p></section>');
 write(file,h);
}
