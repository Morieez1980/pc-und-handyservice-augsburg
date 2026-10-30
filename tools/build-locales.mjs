import {calibratedFees,calibratedScope} from '../locales/price-calibration.mjs';
import {hardwareSales,hardwareSalesSection} from '../locales/hardware-sales.mjs';
import {specialistService,extraServiceCards,specialistServiceSection} from '../locales/specialist-service.mjs';
import {expandedFormTranslations,expandedArrival} from '../locales/expanded-locales.mjs';
import fs from 'node:fs';
import {closureNotices} from '../locales/opening-hours.mjs';
import {arrival} from '../locales/arrival.mjs';
import {premises} from '../locales/premises.mjs';
import {wayfinder} from '../locales/wayfinder.mjs';
import {arrivalPhoto,arrivalMore} from '../locales/arrival-photo.mjs';
import {arrivalRoute} from '../locales/arrival-route.mjs';
import {arrivalClosing} from '../locales/arrival-closing.mjs';
import {premisesTrust} from '../locales/premises-trust.mjs';
import {serviceCoverage,germanOverviewCards} from '../locales/service-coverage.mjs';
import {compactArrival} from '../locales/arrival-compact.mjs';
import {copyProgramPreview} from '../locales/copy-program-preview.mjs';
import {ownerIntro,soleOwnerText} from '../locales/sole-owner.mjs';
import {priceScope} from '../locales/price-scope.mjs';
Object.assign(arrival,expandedArrival);
for(const [lang,[heading,directions,introduction]] of Object.entries(arrivalRoute)){
  wayfinder[lang][0]=heading;
  arrival[lang][1]=directions;
  premises[lang][0]=introduction;
}
for(const [lang,[introduction]] of Object.entries(premisesTrust)) premises[lang][0]=introduction;
for(const [lang,c] of Object.entries(compactArrival)){
  if(c.length!==7||!copyProgramPreview[lang])throw Error('Missing compact customer information: '+lang);
  wayfinder[lang][0]=c[0];
  arrival[lang][1]=c[3];
  arrival[lang][2]=c[2];
  premises[lang][1]=c[4];
  premises[lang][2]=c[5];
  arrivalClosing[lang][0]=c[6];
}
import path from 'node:path';
import {languages,routes,prices,localeContent} from '../locales/content.mjs';
import {formRows,formShared} from '../locales/form-data.mjs';
import {runtimeRows,unconfirmed} from '../locales/runtime-data.mjs';
import {additionalForms,additionalRuntime,additionalUnconfirmed} from '../locales/additional-form-data.mjs';
import {repairUxTranslations} from '../locales/repair-ux.mjs';
import {repairRequiredTranslations} from '../locales/repair-required.mjs';
import {repairPlainTranslations} from '../locales/repair-plain.mjs';
import {repairUnlockTranslations} from '../locales/repair-unlock.mjs';
const root=path.resolve(import.meta.dirname,'..');
const ownerMap=(value,lang)=>typeof value==='string'?soleOwnerText(value,lang):Array.isArray(value)?value.map(v=>ownerMap(v,lang)):value&&typeof value==='object'?Object.fromEntries(Object.entries(value).map(([k,v])=>[k,ownerMap(v,lang)])):value;
for(const[lang,c]of Object.entries(localeContent)){Object.assign(c,ownerMap(c,lang));c.intro=ownerIntro[lang];c.fees=calibratedFees[lang];c.terms=calibratedScope[lang]+' '+c.terms;c.services[0][0]=specialistService[lang][4];c.services[0][1]+=' MacBook · iMac · Mac mini · Mac Pro.';c.services[0][2]+=' '+specialistService[lang][1];}
for(const source of[arrival,premises,wayfinder,arrivalPhoto,arrivalMore,arrivalRoute,arrivalClosing])for(const[lang,value]of Object.entries(source))source[lang]=ownerMap(value,lang);
for(const [lang,c] of Object.entries(localeContent)){
  const coverage=serviceCoverage[lang];
  if(!coverage||coverage.length!==5)throw Error('Missing service coverage translation: '+lang);
  c.services[0][1]=coverage[0];
  c.services[3][0]=coverage[1];
  c.services[3][1]=coverage[2];
}
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const write=(f,s)=>{fs.mkdirSync(path.dirname(path.join(root,f)),{recursive:true});fs.writeFileSync(path.join(root,f),s.replace(/[ \t]+\r?\n/g,"\n"))};
const source=JSON.parse(read('locales/form-source.json'));
const version='20261027-lang3',repairFormVersion='20261030-preise1',origin='https://www.pc-und-handyservice-augsburg.com';
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const norm=s=>s.replaceAll('&amp;','&').replaceAll('&nbsp;',' ').replaceAll('&quot;','"').replace(/\s+/g,' ').trim();
const url=(lang,route='')=>lang==='de'?'/'+route:'/'+lang+'/'+route;
function picker(lang,route='') {
  return '<details class="language-picker"><summary aria-label="'+(localeContent[lang]?.labels[13]||'Sprache')+'">🌐 '+lang.toUpperCase()+'</summary><nav aria-label="'+(localeContent[lang]?.labels[13]||'Sprache')+'">'+Object.entries(languages).map(([code,name])=>'<a lang="'+code+'" hreflang="'+code+'" href="'+url(code,route)+'"'+(code===lang?' aria-current="page"':'')+'>'+name+'</a>').join('')+'</nav></details>';
}
const closureNotice=lang=>!closureNotices[lang]?'':'<aside class="special-hours-notice" data-closure-date="2026-10-24" hidden style="margin:1rem auto;padding:1rem;max-width:calc(100% - 2rem);border:1px solid #e7b54c;border-radius:8px;background:#fff5d9;color:#172d47">'+esc(closureNotices[lang])+'</aside>';
const hoursScript='<script defer src="/special-hours.js?v=20261024"></script>';
const alternates=route=>Object.keys(languages).map(l=>'<link rel="alternate" hreflang="'+(l==='de'?'de-DE':l)+'" href="'+origin+url(l,route)+'">').join('\n')+'\n<link rel="alternate" hreflang="x-default" href="'+origin+url('de',route)+'">';
const premisesLead=lang=>{const p=premises[lang];if(!p||p.length!==3)throw Error('Missing premises translation: '+lang);return '<p class="arrival-context">'+esc(p[0])+'</p>';};
const premisesReviewLink=lang=>{const t=premisesTrust[lang];if(!t||t.length!==3)throw Error('Missing premises trust translation: '+lang);return '<p class="arrival-trust"><a href="/#bewertungen" hreflang="de">'+esc(t[2])+'</a></p>';};
const arrivalWayfinder=lang=>{const c=compactArrival[lang];if(!c)throw Error('Missing wayfinder translation: '+lang);return '<aside class="arrival-wayfinder" aria-labelledby="wayfinder-heading"><div><strong id="wayfinder-heading">'+esc(c[0])+'</strong><p>'+esc(c[1])+'</p><p>'+esc(c[2])+'</p><p>'+esc(c[3])+'</p>'+premisesReviewLink(lang)+'</div><a class="arrival-wayfinder-link" href="#anfahrt">'+esc(arrivalPhoto[lang][0])+' <span aria-hidden="true">↓</span></a></aside>';};
const copyPreviewBanner=lang=>{const c=copyProgramPreview[lang];if(!c||c.length!==3)throw Error('Missing program preview: '+lang);return '<aside class="copy-preview" aria-labelledby="copy-preview-heading"><div><h2 id="copy-preview-heading">'+esc(c[0])+'</h2><p>'+esc(c[1])+'</p></div><a href="mailto:MauriceKeil@pc-und-handyservice-augsburg.com?subject=Kopierprogramm">'+esc(c[2])+' →</a></aside>';};
const arrivalOriginalMapLink='<a data-original-map href="https://www.google.com/maps/place/St%C3%A4tzlinger+Str.+99,+86165+Lechhausen/@48.3796179,10.9431915,143m/data=!3m1!1e3!4m6!3m5!1s0x479e97bdef4a65a7:0x55076455bfc4f062!8m2!3d48.3796179!4d10.9431915!16s%2Fg%2F11c26q5nbw" target="_blank" rel="noopener noreferrer">Google Maps ↗</a>';
const arrivalSection=(lang,route="")=>{const a=arrival[lang],p=premises[lang],photo=arrivalPhoto[lang];if(!a||!p||!photo)throw Error('Missing arrival translation: '+lang);return '<section class="arrival-notice" id="anfahrt" aria-labelledby="arrival-heading"><h2 id="arrival-heading">'+esc(a[0])+'</h2><div class="arrival-guide"><div class="arrival-guide-copy"><p class="arrival-address">PC &amp; Handyservice Augsburg – Maurice Keil<br>Stätzlinger Straße 99, 86165 Augsburg</p><p>'+esc(a[1])+'</p><p><strong>'+esc(a[2])+'</strong></p><p>'+esc(p[1])+'</p><p>'+esc(p[2])+'</p><p>'+esc(a[4])+' <a href="tel:+4915254530080">0152 54530080</a></p>'+premisesReviewLink(lang)+'</div><figure class="arrival-photo"><a href="/anfahrt-hof-plan-20261030-v3.svg" target="_blank" rel="noopener noreferrer" aria-label="'+esc(photo[1])+'"><img src="/anfahrt-hof-plan-20261030-v3.svg" width="1122" height="1402" loading="lazy" decoding="async" alt="'+esc(a[1])+'"></a><figcaption>'+esc(photo[0])+' · <a href="/anfahrt-hof-plan-20261030-v3.svg" target="_blank" rel="noopener noreferrer">'+esc(photo[1])+' ↗</a> · '+arrivalOriginalMapLink+'</figcaption></figure></div><div class="arrival-closing"><p>'+esc(arrivalClosing[lang][0])+'</p><p><a href="'+(route==='reparaturanfrage'?'#repair-request':url(lang,'reparaturanfrage'))+'">'+esc(arrivalClosing[lang][2])+' →</a></p><p>'+esc(arrivalClosing[lang][1])+'<br><strong>Maurice Keil</strong><br>PC &amp; Handyservice Augsburg</p></div></section>';};
const range=(a,b)=>Array.from({length:b-a+1},(_,i)=>i+a);
const servicePrices=[range(2,9),range(10,14),range(17,22),[15,16]];
const baseForm=read('reparaturanfrage.html').match(/<section class="request-form-shell"[\s\S]*?<\/section>/)[0];
for(const [lang,c] of Object.entries(localeContent)){
  const column=Object.keys(localeContent).indexOf(lang)+1;
  if(c.labels.length!==25||c.priceNames.length!==prices.length||c.services.length!==4)throw Error('Incomplete content: '+lang);
  const map={};
  if(expandedFormTranslations[lang]){Object.assign(map,expandedFormTranslations[lang]);}else if(additionalForms[lang]){if(additionalForms[lang].length!==source.length)throw Error('Missing form rows: '+lang);source.forEach((key,i)=>map[key]=additionalForms[lang][i]);}else for(const row of formRows){if(row.length!==8)throw Error('Translation columns: '+row[0]);map[source[Number(row[0])]]=row[column]}
  for(const [i,v] of Object.entries(formShared))map[source[i]]=v;
  map[source[36]]=c.fees;
  for(const key of source)if(!map[key])throw Error('Missing form translation: '+lang+' '+key);
  for(const [i,row] of runtimeRows.entries()){if(row.length!==8)throw Error('Runtime columns');map[row[0]]=additionalRuntime[lang]?.[i]||map[row[0]]||row[column];if(!map[row[0]])throw Error('Missing runtime translation: '+lang+' '+row[0]);}
  map['Gerät & Fehler']=c.labels[21];map['Kontakt']=c.labels[22];
  const oldUnconfirmed=read('repair-form.js').match(/errorSummary.textContent = (?:t\()?("Bitte prüfen Sie die Antwort von Bigin unten:[^"]*")/);
  if(!oldUnconfirmed)throw Error('Bigin response message not found');
  map[oldUnconfirmed[1].slice(1,-1)]=additionalUnconfirmed[lang]||map[oldUnconfirmed[1].slice(1,-1)]||unconfirmed[lang];
  Object.assign(map,repairUxTranslations[lang]);
  Object.assign(map,repairRequiredTranslations[lang]);
  Object.assign(map,repairPlainTranslations[lang]);
  Object.assign(map,repairUnlockTranslations[lang]);
  write(lang+'/form-i18n.js','window.siteTranslate=(key)=>('+JSON.stringify(map)+')[key]||key;\n');
  const translateText=html=>html.replace(/>([^<>]+)</g,(all,raw)=>map[norm(raw)]?'>'+(/^\s/.test(raw)?' ':'')+esc(map[norm(raw)])+(/\s$/.test(raw)?' ':'')+'<':all).replace(/\b(placeholder|aria-label|title)="([^"]*)"/g,(all,key,raw)=>map[norm(raw)]?key+'="'+esc(map[norm(raw)])+'"':all);
  let form=translateText(baseForm).replaceAll('href="/"','href="'+url(lang)+'"').replaceAll('href="/datenschutz"','href="'+url(lang,'datenschutz')+'"');
  // Keep the consent wording as a single grammatical sentence in every language.
  form=form.replace(/(<label class="privacy-check"><input[^>]+>)<span>[\s\S]*?<\/span><\/label>/,'$1<span><a href="'+url(lang,'datenschutz')+'" target="_blank" rel="noopener noreferrer">'+esc(c.privacyAck)+'</a> <b aria-hidden="true">*</b></span></label>');
  const l=c.labels;
  const button='<a class="button button-primary" href="'+url(lang,'reparaturanfrage')+'">'+esc(l[5])+' →</a>';
  const contact='<section class="locale-section" id="kontakt"><h2>'+esc(l[4])+'</h2><p>PC &amp; Handyservice Augsburg – Maurice Keil</p><address>Stätzlinger Straße 99<br>86165 Augsburg</address><p>'+esc(c.hours)+'</p><div class="locale-actions"><a class="button button-outline" href="tel:+4915254530080">'+esc(l[6])+' · 0152 54530080</a><a class="button button-outline" href="https://wa.me/4915254530080" rel="noopener noreferrer">WhatsApp</a><a class="button button-outline" href="https://share.google/57mrs7jE79LUInKVg" rel="noopener noreferrer">Google</a><a class="button button-outline" href="'+url(lang,'reparaturanfrage')+'">'+esc(l[5])+'</a></div><p><a class="contact-email" href="mailto:MauriceKeil@pc-und-handyservice-augsburg.com">MauriceKeil@pc-und-handyservice-augsburg.com</a></p><p><a href="https://www.google.com/maps/dir/?api=1&amp;destination=St%C3%A4tzlinger+Stra%C3%9Fe+99%2C+86165+Augsburg" rel="noopener noreferrer">'+esc(l[17])+' ↗</a></p><p class="locale-note">'+esc(c.languageNote)+'</p></section>';
  const priceSection=(indices=range(0,22))=>{
    const groups=[['pc',c.priceNames[0]+' · '+specialistService[lang][4],range(0,9)],['handy',c.services[1][0],range(10,14)],['daten',c.services[3][0],[15,16]],['konsole',c.services[2][0],range(17,22)]].map(([key,title,all])=>({key,title,items:all.filter(i=>indices.includes(i))})).filter(g=>g.items.length);
    const nav='<nav class="price-category-nav" aria-label="'+esc(l[1])+'">'+groups.map(g=>'<a href="#preise-'+g.key+'">'+esc(g.title)+'</a>').join('')+'<a href="#spezialreparaturen">'+esc(specialistService[lang][0])+'</a><a href="#hardwareverkauf">'+esc(hardwareSales[lang][0])+'</a></nav>';
    const blocks=groups.map(g=>'<section class="locale-price-group" id="preise-'+g.key+'"><h3>'+esc(g.title)+'</h3><dl class="locale-prices">'+g.items.map(i=>'<div data-price-index="'+i+'"><dt>'+esc(c.priceNames[i])+'</dt><dd>'+(i===1?esc(l[15]):([0,15].includes(i)?'':esc(l[14])+' ')+prices[i]+' €')+'</dd></div>').join('')+'</dl></section>').join('');
    return '<section class="locale-section" id="preise"><h2>'+esc(l[1])+'</h2>'+nav+blocks+'<p>'+esc(c.fees)+'</p><p class="locale-note">'+esc(c.terms)+'</p>'+specialistServiceSection(lang)+hardwareSalesSection(lang)+'</section>';
  };
  const process='<section class="locale-section" id="ablauf"><h2>'+esc(l[2])+'</h2><ol class="locale-steps">'+c.steps.map(s=>'<li>'+esc(s)+'</li>').join('')+'</ol></section>';
  const faq='<section class="locale-section" id="faq"><h2>'+esc(l[3])+'</h2>'+c.faq.map(([q,a])=>'<details class="locale-faq"><summary>'+esc(q)+'</summary><p>'+esc(a)+'</p></details>').join('')+'</section>';
  for(const route of routes){
    let title=c.hero,description=c.intro,body='',extra='',formPage=route==='reparaturanfrage',legal=['impressum','datenschutz','rechtliches'].includes(route);
    if(!route){
      body='<section class="locale-hero"><p class="eyebrow">AUGSBURG · MAURICE KEIL</p><h1>'+esc(c.hero)+'</h1><p class="hero-lead">'+esc(c.intro)+'</p><div class="locale-actions">'+button+'<a href="tel:+4915254530080">'+esc(l[6])+' · 0152 54530080</a></div><p>'+esc(c.hours)+'</p></section><section class="locale-section" id="leistungen"><h2>'+esc(l[0])+'</h2><p class="service-coverage-lead">'+esc(serviceCoverage[lang][4])+'</p><div class="locale-cards">'+c.services.map(([t,d],i)=>'<article><h3>'+esc(t)+'</h3><p>'+esc(d)+'</p><a href="'+url(lang,routes[i+1])+'">'+esc(l[7])+' →</a></article>').join('')+extraServiceCards(lang)+'</div></section>'+priceSection()+process+faq+'<section class="locale-section" id="bewertungen"><h2>'+esc(l[11])+' · '+esc(l[12])+'</h2><p>'+esc(c.originals)+'</p><div class="locale-actions"><a href="/#bewertungen" hreflang="de">'+esc(l[11])+' ('+esc(l[18])+')</a><a href="/reparaturberichte" hreflang="de">'+esc(l[12])+' ('+esc(l[18])+')</a></div></section>'+contact;
    } else if(routes.slice(1,5).includes(route)){
      const i=routes.indexOf(route)-1,[t,d,detail]=c.services[i];title=t+' · Augsburg';description=d;
      body='<section class="locale-hero"><a href="'+url(lang)+'">← '+esc(l[8])+'</a><h1>'+esc(title)+'</h1><p class="hero-lead">'+esc(d)+'</p><div class="locale-actions">'+button+'</div><p>'+esc(c.hours)+'</p></section><section class="locale-section"><h2>'+esc(l[7])+'</h2><p>'+esc(detail)+'</p></section>'+(i===3?'<section class="locale-section" data-backup-service><h2>'+esc(c.priceNames[3])+'</h2><p>'+esc(serviceCoverage[lang][3])+'</p></section>':'')+priceSection([0,1,...servicePrices[i]])+process+faq+contact;
    } else if(formPage){
      title=l[20];description=c.formIntro;extra='<link rel="stylesheet" href="/vendor/intl-tel-input/css/intlTelInput.min.css?v=29.2.3"><link rel="stylesheet" href="/request.css?v='+repairFormVersion+'"><script defer src="/'+lang+'/form-i18n.js?v='+repairFormVersion+'"></script><script defer src="/vendor/intl-tel-input/js/intlTelInputWithUtils.min.js?v=29.2.3"></script><script defer src="/repair-form.js?v='+repairFormVersion+'"></script>';
      body='<section class="locale-form-intro"><h1>'+esc(title)+'</h1><p>'+esc(description)+'</p></section>'+form+contact;
    } else {
      title=route==='datenschutz'?l[10]:route==='impressum'?l[9]:l[9]+' · '+l[10];description=c.original;
      if(route==='rechtliches')body='<h1>'+esc(title)+'</h1><p>'+esc(c.original)+'</p><p><a href="'+url(lang,'impressum')+'">'+esc(l[9])+'</a></p><p><a href="'+url(lang,'datenschutz')+'">'+esc(l[10])+'</a></p>';
      else {let original=read(route+'.html').match(/<main[^>]*>([\s\S]*?)<\/main>/)[1].replace(/<aside class="special-hours-notice"[\s\S]*?<\/aside>/g,'').replace(/<a class="back-link"[\s\S]*?<\/a>/,'').replace(/<h1>[\s\S]*?<\/h1>/,'');body='<h1>'+esc(title)+'</h1><aside class="locale-original-note">'+esc(c.original)+' <a href="/'+route+'" hreflang="de">'+esc(l[18])+' ↗</a></aside><article lang="de" translate="no" class="locale-legal-original">'+original+'</article>';}
    }
    if(!route||formPage)body=body.replace(/(<h1\b[^>]*>[\s\S]*?<\/h1>)/,'$1'+premisesLead(lang));
    if(!legal)body=arrivalWayfinder(lang)+(!route?copyPreviewBanner(lang):'')+body+arrivalSection(lang,route);
    const pageUrl=origin+url(lang,route);
    const html='<!doctype html>\n<html lang="'+lang+'" dir="'+(['ar','fa'].includes(lang)?'rtl':'ltr')+'" data-private-page="true"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="'+(legal?'noindex,follow':'index,follow')+'"><title>'+esc(title)+' | PC &amp; Handyservice Augsburg</title><meta name="description" content="'+esc(description)+'"><link rel="canonical" href="'+pageUrl+'">'+alternates(route)+'<meta property="og:title" content="'+esc(title)+'"><meta property="og:description" content="'+esc(description)+'"><meta property="og:type" content="website"><meta property="og:url" content="'+pageUrl+'"><meta property="og:image" content="'+origin+'/og-image.png"><meta name="theme-color" content="#050914"><link rel="icon" href="/favicon.svg"><link rel="apple-touch-icon" href="/apple-touch-icon.png"><link rel="stylesheet" href="/styles.min.css?v=20261014-logo"><link rel="stylesheet" href="/locale.css?v='+version+'">'+extra+(!legal&&!formPage?'<link rel="stylesheet" href="/offers.css?v=20261030-2">':'')+'<link rel="stylesheet" href="/arrival.css?v=20261030-compact1">'+hoursScript+'<script defer src="/locale-nav.js?v='+version+'"></script></head><body class="locale-page'+(formPage?' locale-form-page':'')+'"><header class="locale-header"><a class="brand" href="'+url(lang)+'"><img class="brand-logo" src="/favicon.svg?v=20261014-logo" width="48" height="48" alt=""><span><strong>PC &amp; Handyservice</strong><small>Augsburg · Maurice Keil</small></span></a>'+picker(lang,route)+'<button class="locale-toggle" type="button" aria-expanded="false" aria-controls="locale-nav" data-open="'+esc(l[23])+'" data-close="'+esc(l[24])+'" aria-label="'+esc(l[23])+'">☰</button><nav id="locale-nav"><a href="'+url(lang)+'#leistungen">'+esc(l[0])+'</a><a href="'+url(lang)+'#preise">'+esc(l[1])+'</a><a href="'+url(lang)+'#kontakt">'+esc(l[4])+'</a><a href="'+url(lang,'reparaturanfrage')+'">'+esc(l[5])+'</a></nav></header><main id="main" class="locale-main'+(legal?' locale-legal':'')+'">'+closureNotice(lang)+body+'</main><footer class="locale-footer"><a href="'+url(lang)+'">'+esc(l[8])+'</a><a href="'+url(lang,'impressum')+'">'+esc(l[9])+'</a><a href="'+url(lang,'datenschutz')+'">'+esc(l[10])+'</a><span>© 2026 Maurice Keil</span></footer><aside class="locale-mobile-contact"><a href="tel:+4915254530080">'+esc(l[6])+'</a><a href="https://wa.me/4915254530080">WhatsApp</a><a href="'+url(lang,'reparaturanfrage')+'">'+esc(l[5])+'</a></aside></body></html>';
    const startLinkedHtml=html
      .replace(/(<html lang="[^"]+")/,'$1 id="top"')
      .replace('<a class="brand" href="'+url(lang)+'"','<a class="brand" href="'+url(lang)+'#top"');
    write(lang+'/'+(route||'index')+'.html',startLinkedHtml);
  }
}
// German source pages receive reciprocal links and the same language menu.
for(const route of routes){
  const file=(route||'index')+'.html';let html=read(file);
  if(!route){
    html=html.replace(/<section class="section services" id="leistungen">[\s\S]*?<\/section>/,section=>{
      let card=0;
      section=section.replace(/<article class="service-card[^\"]*">[\s\S]*?<\/article>/g,block=>{
        if(card>=germanOverviewCards.length)return block;
        const [title,summary,points]=germanOverviewCards[card++];
        return block.replace(/<h3>[\s\S]*?<\/ul>/,'<h3>'+esc(title)+'</h3><p>'+esc(summary)+'</p><ul>'+points.map(p=>'<li>'+esc(p)+'</li>').join('')+'</ul>');
      });
      if(card!==4)throw Error('German service overview must contain four main repair cards');
      return section.replace(/(<h2>[\s\S]*?<\/h2>\s*)<p>[\s\S]*?<\/p>/,'$1<p>'+esc(serviceCoverage.de[4])+'</p>');
    });
    html=html.replace('Schreiben Sie mich','Schreiben Sie mir').replace('Ich analysiere die Ursache und erklären verständlich','Ich analysiere die Ursache und erkläre verständlich');
  }
  if(route==='datenrettung-augsburg'){
    html=html.replace(/<section class="section service-backup" data-backup-service>[\s\S]*?<\/section>/g,'');
    html=html.replace('<section class="section services service-detail-content">','<section class="section service-backup" data-backup-service><div class="section-heading compact"><h2>Datensicherung &amp; Datenübernahme</h2></div><p>'+esc(serviceCoverage.de[3])+'</p></section><section class="section services service-detail-content">');
  }
  html=html.replace(/<link\b[^>]*rel="alternate"[^>]*>\r?\n?/g,'').replace(/<!-- languages:start -->[\s\S]*?<!-- languages:end -->/g,'');
  html=html.replace('</head>',alternates(route)+'\n<link rel="stylesheet" href="/language-picker.css?v='+version+'">\n</head>');
  html=html.replace(/<link rel="stylesheet" href="\/language-picker.css[^"]*">\s*(?=[\s\S]*<link rel="stylesheet" href="\/language-picker.css)/g,'');
  const menu='<!-- languages:start -->'+picker('de',route)+'<!-- languages:end -->';
  if(html.includes('<button class="nav-toggle"'))html=html.replace('<button class="nav-toggle"',menu+'<button class="nav-toggle"');
  else html=html.replace('</header>',menu+'</header>');
  html=html.replace(/<script defer src="\/locale-nav.js[^\"]*"><\/script>/g,'');
  html=html.replace('</head>','<script defer src="/locale-nav.js?v='+version+'"></script></head>');
  if(route==='reparaturanfrage')html=html.replace(/\/repair-form\.js\?v=[^"']+/g,'/repair-form.js?v='+repairFormVersion);
  html=html.replace(/<aside class="special-hours-notice"[\s\S]*?<\/aside>/g,'').replace(/<script defer src="\/special-hours\.js[^"]*"><\/script>/g,'');
  html=html.replace('</head>',hoursScript+'</head>').replace(/(<main\b[^>]*>)/,'$1'+closureNotice('de').replace('margin:1rem auto','margin:7rem auto 1rem'));
  if(routes.slice(0,6).includes(route)){html=html.replace(/<section class="arrival-notice"[\s\S]*?<\/section>/g,'').replace(/<p class="arrival-context">[\s\S]*?<\/p>/g,'');if(!route||route==='reparaturanfrage')html=html.replace(/(<h1\b[^>]*>[\s\S]*?<\/h1>)/,'$1'+premisesLead('de'));html=html.replace('</main>',arrivalSection('de',route)+'</main>');if(!html.includes('/arrival.css'))html=html.replace('</head>','<link rel="stylesheet" href="/arrival.css?v=20261030-compact1">\n</head>');}
  html=html.replace(/<aside class="arrival-wayfinder"[\s\S]*?<\/aside>/g,'').replace(/<aside class="copy-preview"[\s\S]*?<\/aside>/g,'');
  if(routes.slice(0,6).includes(route))html=html.replace(/(<main\b[^>]*>)/,'$1'+arrivalWayfinder('de')+(!route?copyPreviewBanner('de'):''));
  html=html.replace(/\/arrival\.css\?v=[^"']+/g,'/arrival.css?v=20261030-compact1');
  html=html.replace(/<a class="brand" href="[^"]*"/g,'<a class="brand" href="/#top"');
  write(file,html);
}
let sitemap=read('sitemap.xml').replace(/<!-- locales:start -->[\s\S]*?<!-- locales:end -->\s*/g,'');
const entries=Object.keys(localeContent).flatMap(l=>routes.slice(0,6).map(r=>'<url><loc>'+origin+url(l,r)+'</loc><lastmod>'+(r==='reparaturanfrage'?'2026-10-05':'2026-10-02')+'</lastmod></url>')).join('\n');
write('sitemap.xml',sitemap.replace('</urlset>','<!-- locales:start -->\n'+entries+'\n<!-- locales:end -->\n</urlset>'));
console.log('Built '+Object.keys(localeContent).length*routes.length+' localized pages and '+Object.keys(localeContent).length+' form dictionaries.');
await import('./apply-owner-voice.mjs');

