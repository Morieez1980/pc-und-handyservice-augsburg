import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {onRequestGet} from '../functions/reparaturberichte/[slug].js';
import {renderIndex, renderWorkshopDocumentation} from '../functions/_shared/reports-page.js';
import {workshopDocumentation} from '../functions/_shared/workshop-documentation.js';
import {workshopGallery, galleryCopy} from '../locales/workshop-gallery.mjs';

test('Bilddokumentation ist ohne Datenbank erreichbar und bleibt von Kundenfällen getrennt',async()=>{
 const response=await onRequestGet({env:{},params:{slug:workshopDocumentation.slug}});
 assert.equal(response.status,200);
 assert.match(response.headers.get('Content-Security-Policy'),/img-src 'self' data:/);
 const html=await response.text();
 assert.match(html,/Werkstatt-Bilddokumentation/);
 assert.match(html,/verschiedene Arbeiten/);
 assert.equal((html.match(/id="foto-/g)||[]).length,10);
 assert.equal((html.match(/data-gallery-src=/g)||[]).length,10);
 assert.ok(!html.includes('data-report-id='));
 assert.ok(!html.includes('stage-before'));
 assert.ok(!html.includes('stage-result'));
 assert.match(html,/iphone-se-2020-akkutausch/);
 assert.match(html,/favicon\.svg\?v=20261014-logo/);
});

test('Jedes Werkstattfoto hat eine vorhandene Datei und einen erreichbaren Dokumentationsanker',async()=>{
 const doc=renderWorkshopDocumentation();
 for(const [number]of workshopDocumentation.images){
  assert.match(doc,new RegExp(`id="foto-${number}"`));
  assert.ok((await fs.stat(new URL(`../bilder/werkstatt-${number}.jpg`,import.meta.url))).size>0);
 }
 for(const lang of Object.keys(galleryCopy)){
  const html=workshopGallery(lang,{price:'Preise',pc:'Notebook',phone:'Smartphone'});
  assert.equal((html.match(/<figure>/g)||[]).length,19);
  assert.equal((html.match(/class="gallery-documentation-link"/g)||[]).length,16);
  for(const [number]of workshopDocumentation.images)assert.ok(html.includes(`/werkstatt-notebook-smartphone#foto-${number}`));
  assert.ok(html.includes('hreflang="de"'));
 }
});

test('Übersicht verlinkt echte Berichte und die zusätzliche Bilddokumentation getrennt',()=>{
 const html=renderIndex([{slug:'vorhandener-bericht',title:'Vorhandener Bericht',category:'Smartphone',summary:'Vorhandener Kundenfall'}]);
 assert.ok(html.includes('/reparaturberichte/vorhandener-bericht'));
 assert.ok(html.includes('/reparaturberichte/'+workshopDocumentation.slug));
 assert.ok(html.includes('workshop-documentation-intro'));
 assert.ok(html.includes('og-image.png?v=20261031'));
});

test('Werkstattübersicht zeigt alle zehn Fotos ohne Aufklappen oder zusätzliche Navigation',()=>{
 const html=renderIndex([]);
 const photoIds=[...html.matchAll(/data-workshop-photo="(\d+)"/g)].map(m=>Number(m[1]));
 assert.deepEqual(photoIds.sort((a,b)=>a-b),workshopDocumentation.images.map(([id])=>id).sort((a,b)=>a-b));
 assert.equal(new Set(photoIds).size,10);
 assert.match(html,/workshop-presentation-photo[^]*werkstatt-4\.jpg/);
 assert.ok(!html.includes('<details'));
 assert.ok(!html.includes('data-gallery-src='));
 assert.ok(html.includes('Kosten vorher kennen'));
 assert.ok(html.includes('/reparaturanfrage'));
});

test('Tabletaufnahmen werden in Dokumentation und allen Sprachgalerien richtig zugeordnet',()=>{
 for(const id of [8,11])assert.match(workshopDocumentation.images.find(([n])=>n===id)[1],/Tablet/);
 const html=workshopGallery('de',{price:'Preise',pc:'Notebook',phone:'Handy'});
 for(const id of [8,11])assert.ok(html.includes(`alt="Tablet · ${id}"`));
 assert.ok(!html.includes('alt="Notebook · 8"'));
 assert.ok(!html.includes('alt="Notebook · 11"'));
});
