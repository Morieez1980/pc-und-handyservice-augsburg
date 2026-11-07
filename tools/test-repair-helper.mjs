import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';

const source = await readFile(new URL('../repair-helper.js', import.meta.url), 'utf8');
function setup({reduced = false, imageFails = false, lang = 'de'} = {}) {
 const listeners = new WeakMap();
 const element = () => ({hidden:false,attrs:{},classList:{values:new Set(),add(v){this.values.add(v);},remove(v){this.values.delete(v);},contains(v){return this.values.has(v);}},setAttribute(k,v){this.attrs[k]=v;},focus(){},addEventListener(k,fn){const map=listeners.get(this)||{};(map[k]??=[]).push(fn);listeners.set(this,map);}});
 const toggle=element(),panel=element(),close=element(),mascot=element(),frames=element(),helper=element();
 panel.hidden=true;
 toggle.querySelector=()=>mascot; mascot.querySelector=()=>frames;
 helper.querySelector=s=>({'.repair-helper-toggle':toggle,'.repair-helper-panel':panel,'.repair-helper-close':close}[s]);
 helper.contains=el=>[toggle,panel,close,helper.motion].includes(el);
 helper.append=el=>{helper.motion=el;};
 const doc=element();doc.hidden=false;doc.documentElement={lang};
 doc.querySelectorAll=()=>[helper];doc.querySelector=()=>null;doc.createElement=element;
 const media=element();media.matches=reduced;
 let now=0,next=0;const timers=new Map();
 const win={matchMedia:()=>media,setTimeout(fn,ms){const id=++next;timers.set(id,{fn,at:now+ms});return id;},clearTimeout(id){timers.delete(id);}};
 const fire=(target,name,extra={})=>{for(const fn of listeners.get(target)?.[name]??[])fn({target,...extra});};
 const tick=ms=>{const end=now+ms;for(;;){const first=[...timers].filter(([,t])=>t.at<=end).sort((a,b)=>a[1].at-b[1].at)[0];if(!first)break;now=first[1].at;timers.delete(first[0]);first[1].fn();}now=end;};
 runInNewContext(source,{document:doc,window:win,Image:class{decode(){return imageFails?Promise.reject(new Error('offline')):Promise.resolve();}}});
 return {helper,toggle,panel,close,mascot,frames,doc,media,fire,tick,active:()=>mascot.classList.contains('is-greeting'),ready:async()=>{await Promise.resolve();await Promise.resolve();}};
}

test('the eight-second repair sequence is not cut short, rests, then starts again', async()=>{
 const h=setup();await h.ready();assert.equal(h.active(),true);
 h.tick(7999);assert.equal(h.active(),true);
 h.tick(1);assert.equal(h.active(),true);
 h.fire(h.frames,'animationend',{animationName:'repair-avatar-actions'});
 assert.equal(h.active(),false);h.tick(1999);assert.equal(h.active(),false);
 h.tick(1);assert.equal(h.active(),true);
});
test('finishing a moving arm or head does not interrupt the full repair cycle', async()=>{
 const h=setup();await h.ready();h.tick(4000);
 h.fire(h.frames,'animationend',{target:{},animationName:'repair-avatar-arm'});
 h.fire(h.frames,'animationend',{target:{},animationName:'repair-avatar-head'});
 h.fire(h.frames,'animationend',{target:{},animationName:'repair-avatar-strength'});
 assert.equal(h.active(),true);
 h.tick(3999);assert.equal(h.active(),true);
 h.fire(h.frames,'animationend',{animationName:'repair-avatar-actions'});
 assert.equal(h.active(),false);
});
test('pause persists across cycles and tab visibility; resume is explicit', async()=>{
 const h=setup();await h.ready();h.fire(h.helper.motion,'click');
 assert.equal(h.active(),false);assert.equal(h.helper.motion.attrs['aria-label'],'Animation fortsetzen');
 h.doc.hidden=true;h.fire(h.doc,'visibilitychange');h.doc.hidden=false;h.fire(h.doc,'visibilitychange');
 h.tick(60000);assert.equal(h.active(),false);
 h.fire(h.helper.motion,'click');assert.equal(h.active(),true);
});
test('opening contacts stops movement; close and Escape preserve usable controls', async()=>{
 const h=setup();await h.ready();h.fire(h.toggle,'click');
 assert.equal(h.panel.hidden,false);assert.equal(h.active(),false);h.tick(20000);assert.equal(h.active(),false);
 h.fire(h.close,'click');h.tick(2000);assert.equal(h.active(),true);
 h.fire(h.toggle,'click');h.fire(h.doc,'keydown',{key:'Escape',preventDefault(){}});
 assert.equal(h.panel.hidden,true);assert.equal(h.toggle.attrs['aria-expanded'],'false');
});
test('reduced motion stays static and hidden tabs never animate', async()=>{
 const h=setup({reduced:true});await h.ready();assert.equal(h.active(),false);assert.equal(h.helper.motion.hidden,true);
 h.media.matches=false;h.fire(h.media,'change');h.tick(2000);assert.equal(h.active(),true);
 h.doc.hidden=true;h.fire(h.doc,'visibilitychange');h.tick(20000);assert.equal(h.active(),false);
 h.doc.hidden=false;h.fire(h.doc,'visibilitychange');h.tick(2000);assert.equal(h.active(),true);
 h.media.matches=true;h.fire(h.media,'change');assert.equal(h.active(),false);
});
test('failed sprite leaves the static contact button available', async()=>{
 const h=setup({imageFails:true});await h.ready();assert.equal(h.active(),false);assert.equal(h.toggle.hidden,false);assert.equal(h.helper.motion.hidden,true);
 h.fire(h.toggle,'click');assert.equal(h.panel.hidden,false);
});
test('motion control follows the page language and lost animation events recover', async()=>{
 const h=setup({lang:'en'});await h.ready();assert.equal(h.helper.motion.attrs['aria-label'],'Pause animation');
 h.tick(8499);assert.equal(h.active(),true);
 h.tick(1);assert.equal(h.active(),false);h.tick(2000);assert.equal(h.active(),true);
});
