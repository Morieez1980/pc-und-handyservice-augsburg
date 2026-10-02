import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {languages,routes,prices,localeContent} from '../locales/content.mjs';
const source=JSON.parse(fs.readFileSync('locales/form-source.json','utf8'));
const read=f=>fs.readFileSync(f,'utf8');
const fields=html=>[...html.matchAll(/<input\b[^>]*type="hidden"[^>]*>/g)].map(m=>m[0]).sort();
test('All seven languages have pages, SEO links, local assets and all 23 unchanged prices',()=>{
 assert.deepEqual(Object.keys(localeContent),['en','tr','ro','uk','es','sv','da']);
 for(const lang of Object.keys(localeContent)){
  for(const route of routes){
   const html=read(lang+'/'+(route||'index')+'.html');
   assert.ok(html.includes('<html lang="'+lang+'"'));
   assert.equal((html.match(/<h1[ >]/g)||[]).length,1);
   assert.equal((html.match(/rel="canonical"/g)||[]).length,1);
   assert.equal((html.match(/hreflang="x-default"/g)||[]).length,1);
   for(const l of Object.keys(languages))assert.ok(html.includes('rel="alternate" hreflang="'+(l==='de'?'de-DE':l)+'"'));
   assert.ok(!/<script[^>]+src="https?:/.test(html));
   for(const [,href] of html.matchAll(/(?:href|src)="(\/[^"]*)"/g)){
    let file=href.split(/[?#]/)[0].slice(1);
    if(file==='reparaturberichte')continue;
    if(!file||file.endsWith('/'))file+='index.html';
    else if(!/\.[a-z0-9]+$/i.test(file))file+='.html';
    assert.ok(fs.existsSync(file),lang+' '+route+' '+file);
   }
  }
  const home=read(lang+'/index.html');assert.equal((home.match(/data-price-index=/g)||[]).length,23);
  prices.forEach((amount,i)=>{const m=home.match(new RegExp('data-price-index="'+i+'"[\\s\\S]*?<dd>([^<]+)'));assert.ok(m);if(amount)assert.ok(m[1].includes(amount+' €'));});
 }
});
test('Translated forms preserve CRM fields and translate every visible source string',()=>{
 const original=fields(read('reparaturanfrage.html'));
 for(const lang of Object.keys(localeContent)){
  const html=read(lang+'/reparaturanfrage.html');
  assert.deepEqual(fields(html),original);
  const window={};vm.runInNewContext(read(lang+'/form-i18n.js'),{window});
  const dictionary=JSON.parse(read(lang+'/form-i18n.js').slice('window.siteTranslate=(key)=>('.length).split(')[key]||key;')[0]);
  for(const key of source)assert.ok(Object.hasOwn(dictionary,key),lang+' '+key);
  assert.notEqual(window.siteTranslate('Bitte dieses Feld ausfüllen.'),'Bitte dieses Feld ausfüllen.');
  for(const val of ['Desktop-PC','Laptop','Smartphone','Tablet','Konsole','Sonstiges'])assert.ok(html.includes('value="'+val+'"'));
  assert.ok(html.includes('action="https://bigin.zoho.eu/crm/WebForm"'));
 }
});
test('Legal originals remain explicitly marked; no excluded language is advertised',()=>{
 for(const lang of Object.keys(localeContent)){
  for(const page of ['impressum','datenschutz']){
   const html=read(lang+'/'+page+'.html');
   assert.ok(html.includes('<article lang="de" translate="no"'));
   assert.ok(html.includes('noindex,follow'));
  }
  assert.ok(!/hreflang="(?:ru|zh|ja)"/.test(read(lang+'/index.html')));
 }
});

