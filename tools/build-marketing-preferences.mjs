import fs from 'node:fs';import path from 'node:path';import{fileURLToPath,pathToFileURL}from'node:url';
import{languages}from'../locales/content.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
export function buildMarketingPreferences(){
 const copy=JSON.parse(fs.readFileSync(path.join(root,'marketing-preferences-copy.json'),'utf8'));
 const url=(lang,file)=>'/'+(lang==='de'?'':lang+'/')+file;
 for(const lang of Object.keys(languages)){
  const t=copy[lang];if(!t||t.length!==9)throw Error('Missing email preference text: '+lang);
  const navigation=Object.entries(languages).map(([code,name])=>'<a href="'+url(code,'email-wuensche')+'" lang="'+code+'"'+(code===lang?' aria-current="page"':'')+'>'+esc(name)+'</a>').join(' ');
  const alternatives=Object.keys(languages).map(code=>'<link rel="alternate" hreflang="'+(code==='de'?'de-DE':code)+'" href="https://www.pc-und-handyservice-augsburg.com'+url(code,'email-wuensche')+'">').join('');
  const html='<!doctype html><html lang="'+lang+'" dir="'+(['ar','fa'].includes(lang)?'rtl':'ltr')+'"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,follow"><title>'+esc(t[6])+' · PC &amp; Handyservice Augsburg</title><link rel="canonical" href="https://www.pc-und-handyservice-augsburg.com'+url(lang,'email-wuensche')+'">'+alternatives+'<link rel="icon" href="/favicon.svg"><link rel="stylesheet" href="/marketing-preferences.css?v=20261106-1"><script defer src="/marketing-preferences.js?v=20261106-1"></script></head><body class="mail-page"><header class="mail-header"><a class="mail-brand" href="'+url(lang,'')+'">PC &amp; Handyservice Augsburg<br>Maurice Keil</a><details><summary>🌐 '+lang.toUpperCase()+'</summary><nav class="mail-languages">'+navigation+'</nav></details></header><main class="mail-main"><p>PC &amp; Handyservice Augsburg · Maurice Keil</p><h1>'+esc(t[0])+'</h1><p class="mail-lead">'+esc(t[4])+'</p><p class="mail-lead">'+esc(t[8])+'</p><aside class="mail-status" data-marketing-unavailable role="status">'+esc(t[7])+'</aside><section class="mail-options"><article class="mail-card"><h2>'+esc(t[3])+'</h2><p>'+esc(t[5])+'</p><a href="#" data-marketing-action="signup" aria-disabled="true">'+esc(t[3])+'</a></article><article class="mail-card"><h2>'+esc(t[2])+'</h2><p>'+esc(t[8])+'</p><a href="#" data-marketing-action="unsubscribe" aria-disabled="true">'+esc(t[2])+'</a></article></section><section class="mail-backup-contact"><p>'+esc(t[6])+': <a href="mailto:keil.maurice1980@gmail.com?subject=E-Mail-Werbewunsch">keil.maurice1980@gmail.com</a> · <a href="tel:+4915254530080">0152 54530080</a></p><p><a href="'+url(lang,'datenschutz')+'">Datenschutz / Privacy</a></p></section></main><footer class="mail-footer">PC &amp; Handyservice Augsburg · Maurice Keil<br>Stätzlinger Straße 99 · 86165 Augsburg<br><a href="'+url(lang,'impressum')+'">Impressum</a></footer></body></html>';
  const base=path.join(root,lang==='de'?'':lang);fs.mkdirSync(base,{recursive:true});fs.writeFileSync(path.join(base,'email-wuensche.html'),html);
  for(const file of['index.html','reparaturanfrage.html']){
   const p=path.join(base,file);let s=fs.readFileSync(p,'utf8');
   if(file==='reparaturanfrage.html'){
    if(!s.includes('data-marketing-slot'))s=s.replace('<label class="privacy-check">','<div data-marketing-slot></div><label class="privacy-check">');
    if(!s.includes('/marketing-preferences.js'))s=s.replace('</head>','<link rel="stylesheet" href="/marketing-preferences.css?v=20261106-1"><script defer src="/marketing-preferences.js?v=20261106-1"></script></head>');
    s=s.replace(/(\/repair-form(?:\.min)?\.js\?v=)[^"']+/g,(_,prefix)=>prefix+'20261106-werbewunsch1');
   }
   if(!s.includes('data-marketing-link'))s=s.replace('</footer>','<p><a data-marketing-link href="'+url(lang,'email-wuensche')+'">'+esc(t[6])+'</a></p></footer>');
   fs.writeFileSync(p,s);
  }
 }
 return{languages:Object.keys(languages).length,providerReady:false,marketingEmailsSent:0};
}
if(process.argv[1]&&pathToFileURL(path.resolve(process.argv[1])).href===import.meta.url)console.log(JSON.stringify(buildMarketingPreferences()));
