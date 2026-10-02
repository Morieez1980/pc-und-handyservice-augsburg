import fs from 'node:fs';
import path from 'node:path';
import {languages,routes,prices,localeContent} from '../locales/content.mjs';
import {formRows,formShared} from '../locales/form-data.mjs';
import {runtimeRows,unconfirmed} from '../locales/runtime-data.mjs';
const root=path.resolve(import.meta.dirname,'..');
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const write=(f,s)=>{fs.mkdirSync(path.dirname(path.join(root,f)),{recursive:true});fs.writeFileSync(path.join(root,f),s.replace(/[ \t]+\r?\n/g,"\n"))};
const source=JSON.parse(read('locales/form-source.json'));
const version='20261002-lang1',origin='https://www.pc-und-handyservice-augsburg.com';
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const norm=s=>s.replaceAll('&amp;','&').replaceAll('&nbsp;',' ').replaceAll('&quot;','"').replace(/\s+/g,' ').trim();
const url=(lang,route='')=>lang==='de'?'/'+route:'/'+lang+'/'+route;
function picker(lang,route='') {
  return '<details class="language-picker"><summary aria-label="'+(localeContent[lang]?.labels[13]||'Sprache')+'">🌐 '+lang.toUpperCase()+'</summary><nav aria-label="'+(localeContent[lang]?.labels[13]||'Sprache')+'">'+Object.entries(languages).map(([code,name])=>'<a lang="'+code+'" hreflang="'+code+'" href="'+url(code,route)+'"'+(code===lang?' aria-current="page"':'')+'>'+name+'</a>').join('')+'</nav></details>';
}
const alternates=route=>Object.keys(languages).map(l=>'<link rel="alternate" hreflang="'+(l==='de'?'de-DE':l)+'" href="'+origin+url(l,route)+'">').join('\n')+'\n<link rel="alternate" hreflang="x-default" href="'+origin+url('de',route)+'">';
const range=(a,b)=>Array.from({length:b-a+1},(_,i)=>i+a);
const servicePrices=[range(2,9),range(10,14),range(17,22),[15,16]];
const baseForm=read('reparaturanfrage.html').match(/<section class="request-form-shell"[\s\S]*?<\/section>/)[0];
for(const [lang,c] of Object.entries(localeContent)){
  const column=Object.keys(localeContent).indexOf(lang)+1;
  if(c.labels.length!==25||c.priceNames.length!==prices.length||c.services.length!==4)throw Error('Incomplete content: '+lang);
  const map={};
  for(const row of formRows){if(row.length!==8)throw Error('Translation columns: '+row[0]);map[source[Number(row[0])]]=row[column]}
  for(const [i,v] of Object.entries(formShared))map[source[i]]=v;
  map[source[36]]=c.fees;
  for(const key of source)if(!map[key])throw Error('Missing form translation: '+lang+' '+key);
  for(const row of runtimeRows){if(row.length!==8)throw Error('Runtime columns');map[row[0]]=row[column]}
  map['Gerät & Fehler']=c.labels[21];map['Kontakt']=c.labels[22];
  const oldUnconfirmed=read('repair-form.js').match(/errorSummary.textContent = (?:t\()?("Bitte prüfen Sie die Antwort von Bigin unten:[^"]*")/);
  if(!oldUnconfirmed)throw Error('Bigin response message not found');
  map[oldUnconfirmed[1].slice(1,-1)]=unconfirmed[lang];
  write(lang+'/form-i18n.js','window.siteTranslate=(key)=>('+JSON.stringify(map)+')[key]||key;\n');
  const translateText=html=>html.replace(/>([^<>]+)</g,(all,raw)=>map[norm(raw)]?'>'+(/^\s/.test(raw)?' ':'')+esc(map[norm(raw)])+(/\s$/.test(raw)?' ':'')+'<':all).replace(/\b(placeholder|aria-label|title)="([^"]*)"/g,(all,key,raw)=>map[norm(raw)]?key+'="'+esc(map[norm(raw)])+'"':all);
  let form=translateText(baseForm).replaceAll('href="/"','href="'+url(lang)+'"').replaceAll('href="/datenschutz"','href="'+url(lang,'datenschutz')+'"');
  // Keep the consent wording as a single grammatical sentence in every language.
  form=form.replace(/(<label class="privacy-check"><input[^>]+>)<span>[\s\S]*?<\/span><\/label>/,'$1<span><a href="'+url(lang,'datenschutz')+'" target="_blank" rel="noopener noreferrer">'+esc(c.privacyAck)+'</a> <b aria-hidden="true">*</b></span></label>');
  const l=c.labels;
  const button='<a class="button button-primary" href="'+url(lang,'reparaturanfrage')+'">'+esc(l[5])+' →</a>';
  const contact='<section class="locale-section" id="kontakt"><h2>'+esc(l[4])+'</h2><p>PC &amp; Handyservice Augsburg – Maurice Keil</p><address>Stätzlinger Straße 99<br>86165 Augsburg</address><p>'+esc(c.hours)+'</p><div class="locale-actions"><a class="button button-outline" href="tel:+4915254530080">'+esc(l[6])+' · 0152 54530080</a><a class="button button-outline" href="https://wa.me/4915254530080" rel="noopener noreferrer">WhatsApp</a></div><p><a class="contact-email" href="mailto:MauriceKeil@pc-und-handyservice-augsburg.com">MauriceKeil@pc-und-handyservice-augsburg.com</a></p><p><a href="https://www.google.com/maps/dir/?api=1&amp;destination=St%C3%A4tzlinger+Stra%C3%9Fe+99%2C+86165+Augsburg" rel="noopener noreferrer">'+esc(l[17])+' ↗</a></p><p class="locale-note">'+esc(c.languageNote)+'</p></section>';
  const priceSection=(indices=range(0,22))=>'<section class="locale-section" id="preise"><h2>'+esc(l[1])+'</h2><dl class="locale-prices">'+indices.map(i=>'<div data-price-index="'+i+'"><dt>'+esc(c.priceNames[i])+'</dt><dd>'+(i===1?esc(l[15]):([0,15,16].includes(i)?'':esc(l[14])+' ')+prices[i]+' €')+'</dd></div>').join('')+'</dl><p>'+esc(c.fees)+'</p><p class="locale-note">'+esc(c.terms)+'</p></section>';
  const process='<section class="locale-section" id="ablauf"><h2>'+esc(l[2])+'</h2><ol class="locale-steps">'+c.steps.map(s=>'<li>'+esc(s)+'</li>').join('')+'</ol></section>';
  const faq='<section class="locale-section" id="faq"><h2>'+esc(l[3])+'</h2>'+c.faq.map(([q,a])=>'<details class="locale-faq"><summary>'+esc(q)+'</summary><p>'+esc(a)+'</p></details>').join('')+'</section>';
  for(const route of routes){
    let title=c.hero,description=c.intro,body='',extra='',formPage=route==='reparaturanfrage',legal=['impressum','datenschutz','rechtliches'].includes(route);
    if(!route){
      body='<section class="locale-hero"><p class="eyebrow">AUGSBURG · MAURICE KEIL</p><h1>'+esc(c.hero)+'</h1><p class="hero-lead">'+esc(c.intro)+'</p><div class="locale-actions">'+button+'<a href="tel:+4915254530080">'+esc(l[6])+' · 0152 54530080</a></div><p>'+esc(c.hours)+'</p></section><section class="locale-section" id="leistungen"><h2>'+esc(l[0])+'</h2><div class="locale-cards">'+c.services.map(([t,d],i)=>'<article><h3>'+esc(t)+'</h3><p>'+esc(d)+'</p><a href="'+url(lang,routes[i+1])+'">'+esc(l[7])+' →</a></article>').join('')+'</div></section>'+priceSection()+process+faq+'<section class="locale-section" id="bewertungen"><h2>'+esc(l[11])+' · '+esc(l[12])+'</h2><p>'+esc(c.originals)+'</p><div class="locale-actions"><a href="/#bewertungen" hreflang="de">'+esc(l[11])+' ('+esc(l[18])+')</a><a href="/reparaturberichte" hreflang="de">'+esc(l[12])+' ('+esc(l[18])+')</a></div></section>'+contact;
    } else if(routes.slice(1,5).includes(route)){
      const i=routes.indexOf(route)-1,[t,d,detail]=c.services[i];title=t+' · Augsburg';description=d;
      body='<section class="locale-hero"><a href="'+url(lang)+'">← '+esc(l[8])+'</a><h1>'+esc(title)+'</h1><p class="hero-lead">'+esc(d)+'</p><div class="locale-actions">'+button+'</div><p>'+esc(c.hours)+'</p></section><section class="locale-section"><h2>'+esc(l[7])+'</h2><p>'+esc(detail)+'</p></section>'+priceSection([0,1,...servicePrices[i]])+process+faq+contact;
    } else if(formPage){
      title=l[20];description=c.formIntro;extra='<link rel="stylesheet" href="/vendor/intl-tel-input/css/intlTelInput.min.css?v=29.2.3"><link rel="stylesheet" href="/request.css?v='+version+'"><script defer src="/'+lang+'/form-i18n.js?v='+version+'"></script><script defer src="/vendor/intl-tel-input/js/intlTelInputWithUtils.min.js?v=29.2.3"></script><script defer src="/repair-form.js?v='+version+'"></script>';
      body='<section class="locale-form-intro"><h1>'+esc(title)+'</h1><p>'+esc(description)+'</p></section>'+form+contact;
    } else {
      title=route==='datenschutz'?l[10]:route==='impressum'?l[9]:l[9]+' · '+l[10];description=c.original;
      if(route==='rechtliches')body='<h1>'+esc(title)+'</h1><p>'+esc(c.original)+'</p><p><a href="'+url(lang,'impressum')+'">'+esc(l[9])+'</a></p><p><a href="'+url(lang,'datenschutz')+'">'+esc(l[10])+'</a></p>';
      else {let original=read(route+'.html').match(/<main[^>]*>([\s\S]*?)<\/main>/)[1].replace(/<a class="back-link"[\s\S]*?<\/a>/,'').replace(/<h1>[\s\S]*?<\/h1>/,'');body='<h1>'+esc(title)+'</h1><aside class="locale-original-note">'+esc(c.original)+' <a href="/'+route+'" hreflang="de">'+esc(l[18])+' ↗</a></aside><article lang="de" translate="no" class="locale-legal-original">'+original+'</article>';}
    }
    const pageUrl=origin+url(lang,route);
    const html='<!doctype html>\n<html lang="'+lang+'" data-private-page="true"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="'+(legal?'noindex,follow':'index,follow')+'"><title>'+esc(title)+' | PC &amp; Handyservice Augsburg</title><meta name="description" content="'+esc(description)+'"><link rel="canonical" href="'+pageUrl+'">'+alternates(route)+'<meta property="og:title" content="'+esc(title)+'"><meta property="og:description" content="'+esc(description)+'"><meta property="og:type" content="website"><meta property="og:url" content="'+pageUrl+'"><meta property="og:image" content="'+origin+'/og-image.png"><meta name="theme-color" content="#050914"><link rel="icon" href="/favicon.svg"><link rel="apple-touch-icon" href="/apple-touch-icon.png"><link rel="stylesheet" href="/styles.min.css?v=20261002-1"><link rel="stylesheet" href="/locale.css?v='+version+'">'+extra+'<script defer src="/locale-nav.js?v='+version+'"></script></head><body class="locale-page'+(formPage?' locale-form-page':'')+'"><header class="locale-header"><a class="brand" href="'+url(lang)+'"><span class="brand-mark">MK</span><span><strong>PC &amp; Handyservice</strong><small>Augsburg · Maurice Keil</small></span></a>'+picker(lang,route)+'<button class="locale-toggle" type="button" aria-expanded="false" aria-controls="locale-nav" data-open="'+esc(l[23])+'" data-close="'+esc(l[24])+'" aria-label="'+esc(l[23])+'">☰</button><nav id="locale-nav"><a href="'+url(lang)+'#leistungen">'+esc(l[0])+'</a><a href="'+url(lang)+'#preise">'+esc(l[1])+'</a><a href="'+url(lang)+'#kontakt">'+esc(l[4])+'</a><a href="'+url(lang,'reparaturanfrage')+'">'+esc(l[5])+'</a></nav></header><main id="main" class="locale-main'+(legal?' locale-legal':'')+'">'+body+'</main><footer class="locale-footer"><a href="'+url(lang)+'">'+esc(l[8])+'</a><a href="'+url(lang,'impressum')+'">'+esc(l[9])+'</a><a href="'+url(lang,'datenschutz')+'">'+esc(l[10])+'</a><span>© 2026 Maurice Keil</span></footer><aside class="locale-mobile-contact"><a href="tel:+4915254530080">'+esc(l[6])+'</a><a href="https://wa.me/4915254530080">WhatsApp</a><a href="'+url(lang,'reparaturanfrage')+'">'+esc(l[5])+'</a></aside></body></html>';
    write(lang+'/'+(route||'index')+'.html',html);
  }
}
// German source pages receive reciprocal links and the same language menu.
for(const route of routes){
  const file=(route||'index')+'.html';let html=read(file);
  html=html.replace(/<link\b[^>]*rel="alternate"[^>]*>/g,'').replace(/<!-- languages:start -->[\s\S]*?<!-- languages:end -->/g,'');
  html=html.replace('</head>',alternates(route)+'\n<link rel="stylesheet" href="/language-picker.css?v='+version+'">\n</head>');
  html=html.replace(/<link rel="stylesheet" href="\/language-picker.css[^"]*">\s*(?=[\s\S]*<link rel="stylesheet" href="\/language-picker.css)/g,'');
  const menu='<!-- languages:start -->'+picker('de',route)+'<!-- languages:end -->';
  if(html.includes('<button class="nav-toggle"'))html=html.replace('<button class="nav-toggle"',menu+'<button class="nav-toggle"');
  else html=html.replace('</header>',menu+'</header>');
  html=html.replace(/<script defer src="\/locale-nav.js[^\"]*"><\/script>/g,'');
  html=html.replace('</head>','<script defer src="/locale-nav.js?v='+version+'"></script></head>');
  if(route==='reparaturanfrage')html=html.replace('/repair-form.js?v=20261002-1','/repair-form.js?v='+version);
  write(file,html);
}
let sitemap=read('sitemap.xml').replace(/<!-- locales:start -->[\s\S]*?<!-- locales:end -->/g,'');
const entries=Object.keys(localeContent).flatMap(l=>routes.slice(0,6).map(r=>'<url><loc>'+origin+url(l,r)+'</loc><lastmod>2026-10-02</lastmod></url>')).join('\n');
write('sitemap.xml',sitemap.replace('</urlset>','<!-- locales:start -->\n'+entries+'\n<!-- locales:end -->\n</urlset>'));
console.log('Built 63 localized pages, 7 form dictionaries, reciprocal language links and sitemap.');

