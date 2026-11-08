import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {languages} from '../locales/content.mjs';

const require=createRequire(import.meta.url);
const {chromium}=require('C:/Users/Maurice/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const evidence=process.env.KEILCOPY_APP_HUB_EVIDENCE||'D:/ChatGPT/Keil-Copy/Entwicklung/Aenderungen/1.9.89/Apps-Seite-20261107/Browser-Pruefung';
const widths=[320,360,390,1366];
const sections=['funktionen','testen','lizenzen','kaufanfrage','updates','upgrades','mitgestalten','bedingungen'];
const aliases=[
 {route:'/apps-bestellen?edition=technician',hash:'#kaufanfrage',edition:'technician'},
 {route:'/apps-kontakt',hash:'#mitgestalten'},
 {route:'/apps-rechtliches',hash:'#bedingungen'}
];
const checks=[],pageErrors=[],blockedExternal=[],unexpectedPosts=[],mailAttempts=[],windowOpenAttempts=[],contrastSamples=[];
const darkMode=process.env.KEILCOPY_APP_HUB_DARK==='1';
let browser,primaryPage,base;
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.webm':'video/webm','.mp4':'video/mp4','.woff2':'font/woff2','.ico':'image/x-icon'};
const server=http.createServer((req,res)=>{
 let url,relative;
 try{url=new URL(req.url,'http://127.0.0.1');relative=decodeURIComponent(url.pathname);}catch{return res.writeHead(400).end();}
 if(!['GET','HEAD'].includes(req.method)){unexpectedPosts.push({method:req.method,path:url.pathname,source:'server'});return res.writeHead(405).end();}
 if(relative.endsWith('/'))relative+='index.html';
 if(!path.extname(relative))relative+='.html';
 const file=path.resolve(root,'.'+relative);
 if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile())return res.writeHead(404).end();
 res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');
 res.setHeader('Cache-Control','no-store');
 if(req.method==='HEAD')return res.end();
 const stream=fs.createReadStream(file);stream.on('error',()=>res.destroy());res.on('close',()=>stream.destroy());stream.pipe(res);
});

function record(name,detail={}){checks.push({name,...detail});}
async function context(options={}){
 const ctx=await browser.newContext({viewport:{width:1366,height:900},reducedMotion:'reduce',serviceWorkers:'block',acceptDownloads:false,...options});
 await ctx.route('**/*',async route=>{
  const request=route.request();let url;
  try{url=new URL(request.url());}catch{return route.abort();}
  if(!['GET','HEAD'].includes(request.method())){
   unexpectedPosts.push({method:request.method(),path:url.pathname,source:'browser'});return route.abort();
  }
  if(url.origin!==base){blockedExternal.push(url.origin+url.pathname);return route.abort();}
  return route.continue();
 });
 if(typeof ctx.routeWebSocket==='function')await ctx.routeWebSocket('**/*',socket=>{
  const url=new URL(socket.url());
  if(url.origin!==base.replace(/^http/,'ws')){blockedExternal.push(url.origin+url.pathname);socket.close({code:1008,reason:'Only paired loopback server is allowed'});}
  else socket.connectToServer();
 });
 await ctx.exposeBinding('__recordMailAttempt',(_source,url)=>mailAttempts.push(url));
 await ctx.exposeBinding('__recordOpenAttempt',(_source,url)=>windowOpenAttempts.push(url));
 await ctx.addInitScript(()=>{
  window.__appHubCopied=[];
  Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async value=>{window.__appHubCopied.push(String(value));}}});
  window.open=(url)=>{void window.__recordOpenAttempt(String(url));return null;};
  document.addEventListener('click',event=>{
   const anchor=event.target?.closest?.('a[href]');
   if(anchor&&/^(mailto:|tel:)/i.test(anchor.getAttribute('href'))){event.preventDefault();void window.__recordMailAttempt(anchor.getAttribute('href'));}
  },true);
 });
 ctx.on('page',page=>{
  page.on('pageerror',error=>pageErrors.push(error.message));
  page.on('dialog',dialog=>void dialog.dismiss());
  page.on('download',download=>void download.cancel());
 });
 return ctx;
}
async function goto(page,route){
 // Repeat scenarios need a fresh document and fetch; a hash-only goto has no response.
 const current=new URL(page.url()),target=new URL(base+route);
 if(current.origin===target.origin&&current.pathname===target.pathname&&current.search===target.search)await page.goto('about:blank');
 const response=await page.goto(base+route,{waitUntil:'domcontentloaded'});
 assert.equal(response?.status(),200,route+' response');
 return response;
}
async function ready(page){
 await page.locator('#app-enquiry fieldset[data-form-fields]:not([disabled])').waitFor();
 await page.locator('#app-idea fieldset[data-form-fields]:not([disabled])').waitFor();
}
async function layout(page,route,width){
 await page.waitForFunction(()=>[...document.images].every(image=>image.loading==='lazy'||image.complete));
 const dimensions=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,h1:document.querySelectorAll('h1').length,broken:[...document.images].filter(i=>i.loading!=='lazy'&&i.complete&&i.naturalWidth===0).map(i=>i.getAttribute('src'))}));
 assert.ok(dimensions.scroll<=dimensions.width+1,`${route} at ${width}: horizontal overflow ${dimensions.scroll}`);
 assert.equal(dimensions.h1,1,route+' must have one heading');
 assert.deepEqual(dimensions.broken,[],route+' visible image assets');
 record('layout',{route,width,horizontalOverflow:false});
}
async function contrast(page,width){
 const result=await page.evaluate(()=>{
  const parse=value=>{
   const parts=value.match(/^rgba?\(([^)]+)\)$/)?.[1].split(/\s*[,/]\s*|\s+/).map(Number);
   return parts&&parts.length>=3&&parts.every(Number.isFinite)?[...parts.slice(0,3),parts[3]??1]:null;
  };
  const over=(front,back)=>front.slice(0,3).map((channel,index)=>channel*front[3]+back[index]*(1-front[3]));
  const luminance=color=>color.map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;}).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);
  const ratio=(a,b)=>{const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);};
  function backdrop(element){
   const ancestors=[];for(let node=element;node;node=node.parentElement)ancestors.push(node);
   let background=[255,255,255];const gradients=[];
   for(const node of ancestors.reverse()){
    const style=getComputedStyle(node),color=parse(style.backgroundColor);
    if(color)background=over(color,background);
    if(style.backgroundImage!=='none')gradients.push(style.backgroundImage);
   }
   return {background,gradients};
  }
  const samples=[];
  for(const element of document.querySelectorAll('h1,h2,h3,p,li,label,legend,a,button,.card-label,.eyebrow,.app-hero em,input,select,textarea')){
   const style=getComputedStyle(element),rect=element.getBoundingClientRect();
   if(!rect.width||!rect.height||style.visibility!=='visible'||Number(style.opacity)===0||element.closest('[hidden],[aria-disabled="true"]')||element.matches(':disabled'))continue;
   const text=(element.textContent||element.getAttribute('placeholder')||'').trim().replace(/\s+/g,' ').slice(0,90);
   if(!text&&!element.matches('input,select,textarea'))continue;
   const foreground=parse(style.color);if(!foreground)continue;
   const {background,gradients}=backdrop(element),effective=over(foreground,background);
   const large=parseFloat(style.fontSize)>=24||(parseFloat(style.fontSize)>=18.66&&parseInt(style.fontWeight,10)>=700);
   const threshold=large?3:4.5;
   samples.push({element:element.id?'#'+element.id:element.tagName.toLowerCase()+'.'+[...element.classList].join('.'),text,color:style.color,background:background.map(Math.round),ratio:Number(ratio(effective,background).toFixed(3)),minimum:threshold,gradientBackground:gradients.length>0});
   if(element.getAttribute('placeholder')){
    const placeholder=getComputedStyle(element,'::placeholder'),color=parse(placeholder.color);
    if(color)samples.push({element:'#'+element.id+'::placeholder',text:element.getAttribute('placeholder'),color:placeholder.color,background:background.map(Math.round),ratio:Number(ratio(over([color[0],color[1],color[2],color[3]*Number(placeholder.opacity)],background),background).toFixed(3)),minimum:4.5,gradientBackground:gradients.length>0});
   }
  }
  const body=backdrop(document.body).background;
  return {samples,bodyBackground:body.map(Math.round),bodyLuminance:luminance(body)};
 });
 const failures=result.samples.filter(sample=>!sample.gradientBackground&&sample.ratio+.01<sample.minimum);
 contrastSamples.push({width,...result,failures});
 assert.ok(result.bodyLuminance<.15,'dark page background at '+width);
 assert.ok(result.samples.some(sample=>!sample.gradientBackground),'solid backgrounds available for numeric contrast checks');
 assert.deepEqual(failures,[],'text contrast on solid backgrounds at '+width);
 record('dark contrast',{width,samples:result.samples.length,solidSamples:result.samples.filter(s=>!s.gradientBackground).length,gradientSamplesForVisualReview:result.samples.filter(s=>s.gradientBackground).length,bodyBackground:result.bodyBackground});
}

async function inertForms(page,label){
 for(const id of ['app-enquiry','app-idea']){
  const form=page.locator('#'+id);
  assert.equal(await form.count(),1,label+' '+id);
  assert.equal((await form.getAttribute('method'))?.toLowerCase(),'post',label+' no GET fallback');
  assert.ok((await form.getAttribute('action'))?.trim(),label+' explicit action');
  assert.equal(await form.locator('fieldset[data-form-fields][disabled]').count(),1,label+' initial disabled fieldset');
  const controls=await form.evaluate(form=>[...form.querySelectorAll('input[name],select[name],textarea[name],button[type="submit"],input[type="submit"]')].map(el=>({name:el.name||el.type,disabled:el.matches(':disabled')})));
  assert.ok(controls.length>=4,label+' expected form controls');
  assert.ok(controls.every(control=>control.disabled),label+' all personal-data and submit controls disabled: '+JSON.stringify(controls));
 }
 record('forms inert',{mode:label,method:'POST',personalDataControlsDisabled:true});
}
async function copyPreview(page,id){
 const expected=await page.locator('#'+id).inputValue();
 const before=await page.evaluate(()=>window.__appHubCopied.length);
 await page.locator(`[data-copy-preview="${id}"]`).click();
 await page.waitForFunction(count=>window.__appHubCopied.length>count,before);
 assert.equal(await page.evaluate(()=>window.__appHubCopied.at(-1)),expected,id+' clipboard mock receives exact preview');
 record('mocked clipboard',{preview:id});
}
async function assertPreview(page,{panel,preview,link,expectedParts,beforeURL}){
 await page.locator('#'+panel).waitFor({state:'visible'});
 const box=page.locator('#'+preview);
 assert.equal(await box.evaluate(el=>el.readOnly),true,preview+' readonly');
 const text=await box.inputValue();
 for(const part of expectedParts)assert.ok(text.includes(part),preview+' includes '+part);
 assert.ok(text.includes('\n'),preview+' actual newlines');
 assert.ok(!text.includes('\\n'),preview+' no escaped newline separators');
 const href=await page.locator('#'+link).getAttribute('href');
 const mail=new URL(href);
 assert.equal(mail.protocol,'mailto:');assert.ok(mail.pathname&&!/[\r\n]/.test(mail.pathname),'fixed valid recipient');
 assert.equal(mail.searchParams.get('body'),text,preview+' mail body exactly matches reviewable text');
 assert.equal(page.url(),beforeURL,preview+' submit must not navigate');
 assert.equal(await page.locator('[data-app-hub-injected]').count(),0,preview+' text must not become HTML');
 assert.equal(await page.evaluate(()=>window.__appHubInjected),undefined,preview+' injected handlers never execute');
 assert.deepEqual(mailAttempts,[],preview+' no mail application opened');
 assert.deepEqual(windowOpenAttempts,[],preview+' no new window opened');
 record('safe text preview',{preview,realMailOpened:false});
 await copyPreview(page,preview);
}

try{
 fs.mkdirSync(evidence,{recursive:true});
 // Reject automatic navigation in the app script before exercising synthetic form submits.
 // Only allow the shared-script legacy redirect; no automatic enquiry navigation.
 const script=fs.readFileSync(path.join(root,'apps.js'),'utf8');
 assert.ok(!/\b(?:window\s*\.\s*)?location\s*(?:\.\s*href\s*=|\.\s*assign\s*\()/m.test(script),'apps.js must produce previews instead of navigating');
 for(const [,target] of script.matchAll(/\blocation\s*\.\s*replace\s*\(([^)]*)\)/g)){
  assert.match(target.trim(),/^[\x27\x22]\/apps[\x27\x22]\s*\+\s*location\s*\.\s*search\s*\+\s*legacy$/,'only the constrained legacy redirect is allowed');
  assert.ok(script.includes('data-app-redirect')||script.includes('dataset.appRedirect'),'legacy redirect requires its alias marker');
 }
 assert.ok(!/\bwindow\s*\.\s*open\s*\(/m.test(script),'apps.js must not open mail or payment windows');
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
 base='http://127.0.0.1:'+server.address().port;
 browser=await chromium.launch({channel:'msedge',headless:true,args:['--disable-background-networking','--disable-component-update','--disable-sync','--no-first-run','--no-proxy-server']});
 const ctx=await context();const page=await ctx.newPage();primaryPage=page;
 const langs=Object.keys(languages);assert.equal(langs.length,19,'all supported homepages');
 for(const width of widths){
  await page.setViewportSize({width,height:900});
  for(const lang of langs){
   const route=lang==='de'?'/':'/'+lang+'/';await goto(page,route);await layout(page,route,width);
   const overview=page.locator('[data-app-overview-link]');assert.ok(await overview.count()>=1,route+' app overview button');
   for(const link of await overview.all())assert.equal(await link.getAttribute('href'),'/apps#upgrades',route+' overview leads to the planned-upgrades section');
  }
  await goto(page,'/apps');await ready(page);
  for(const id of sections)assert.equal(await page.locator('#'+id).count(),1,'one-page section '+id);
  assert.equal(await page.locator('#upgrades [data-upgrade-id]').count(),3,'three planned upgrade cards');
  assert.equal(await page.locator('#upgrades a[href],#upgrades button').count(),0,'planned upgrades have no purchase or download action');
  for(const id of ['app-enquiry','app-idea']){
   assert.equal((await page.locator('#'+id).getAttribute('method'))?.toLowerCase(),'post');
   assert.ok((await page.locator('#'+id).getAttribute('action'))?.trim());
  }
  await layout(page,'/apps',width);
  if(darkMode)await contrast(page,width);
  await page.screenshot({path:path.join(evidence,`Apps-${width}.png`),fullPage:true});
  if([390,1366].includes(width))for(const [name,selector] of [['Hero','.app-hero'],['Preise','#lizenzen'],['Upgrades','#upgrades'],['Kaufanfrage','#app-enquiry'],['Rueckmeldung','#app-idea']]){
   await page.locator(selector).screenshot({path:path.join(evidence,`Apps-${name}-${width}.png`)});
   record('section screenshot',{section:name,width});
  }
  for(const alias of aliases){
   await goto(page,alias.route);
   await page.waitForURL(url=>url.pathname==='/apps'&&url.hash===alias.hash);
   await ready(page);const current=new URL(page.url());
   if(alias.edition){assert.equal(current.searchParams.get('edition'),alias.edition);assert.equal(await page.locator('#edition').inputValue(),alias.edition);}
   await layout(page,alias.route,width);record('legacy redirect',{route:alias.route,target:current.pathname+current.search+current.hash,width});
  }
 }
 // Disabled initial markup is safe even when scripting is absent or the specific script fails.
 for(const mode of ['no JavaScript','apps.js blocked']){
  const safe=await context({javaScriptEnabled:mode!=='no JavaScript'});
  if(mode==='apps.js blocked')await safe.route('**/apps.js*',route=>route.abort());
  const p=await safe.newPage();await goto(p,'/apps');await inertForms(p,mode);
  if(mode==='no JavaScript')for(const alias of aliases){
   await goto(p,alias.route);assert.equal(new URL(p.url()).pathname,new URL(base+alias.route).pathname);
   assert.equal(await p.locator('form').count(),0,'legacy alias contains no form without JS');
   const hrefs=await p.locator('a[href]').evaluateAll(links=>links.map(a=>a.getAttribute('href')));
   assert.ok(hrefs.some(href=>{const url=new URL(href,base);return url.origin===base&&url.pathname==='/apps'&&url.hash===alias.hash;}),'legacy fallback link '+alias.route);
   record('legacy without JavaScript',{route:alias.route,fallbackHash:alias.hash,forms:0});
  }
  await safe.close();
 }
 await page.setViewportSize({width:390,height:900});await goto(page,'/apps');await ready(page);
 // Choice buttons both change the correct field and expose its form in the viewport.
 for(const edition of ['technician','personal']){
  await page.locator(`[data-license-choice="${edition}"]`).click();
  assert.equal(await page.locator('#edition').inputValue(),edition);
  await page.waitForFunction(()=>{const r=document.querySelector('#app-enquiry').getBoundingClientRect();return r.top<innerHeight&&r.bottom>0;});
  record('license choice',{edition});
 }
 const ideaChoice=page.locator('[data-idea-choice]').first();assert.ok(await ideaChoice.count()>0,'idea topic button');
 const choice=await ideaChoice.getAttribute('data-idea-choice');await ideaChoice.click();
 assert.equal(await page.locator('#idea-topic').inputValue(),choice,'topic selection is preserved');
 await page.waitForFunction(()=>document.querySelector('#app-idea').contains(document.activeElement));
 record('idea choice',{topic:choice,focusInForm:true});
 // Invalid required fields cannot create a preview or reach a server.
 await goto(page,'/apps');await ready(page);
 await page.locator('#app-enquiry [type="submit"]').click();
 assert.equal(await page.locator('#enquiry-preview-panel').isVisible(),false,'invalid enquiry does not produce preview');
 await page.locator('#app-idea [type="submit"]').click();
 assert.equal(await page.locator('#idea-preview-panel').isVisible(),false,'invalid idea does not produce preview');
 record('invalid forms',{blocked:true});
 const injection='<img data-app-hub-injected src=x onerror="window.__appHubInjected=1">';
 for(const {edition,payment,price} of [{edition:'technician',payment:'PayPal',price:'65'},{edition:'technician',payment:'Revolut Pro / SEPA-Überweisung',price:'65'},{edition:'personal',payment:'PayPal',price:'35'}]){
  await goto(page,'/apps?edition='+edition+'#kaufanfrage');await ready(page);const beforeURL=page.url();
  assert.equal(await page.locator('#edition').inputValue(),edition);
  await page.locator('#buyer-name').fill('TESTDATEN '+injection);
  await page.locator('#buyer-email').fill('apphub@example.invalid');
  await page.locator(`input[name="payment"][value="${payment}"]`).check();
  await page.locator('#app-enquiry [type="submit"]').click();
  await assertPreview(page,{panel:'enquiry-preview-panel',preview:'enquiry-preview',link:'enquiry-open-mail',expectedParts:['TESTDATEN '+injection,'apphub@example.invalid',payment,price],beforeURL});
 }
 await goto(page,'/apps#mitgestalten');await ready(page);const beforeURL=page.url();
 const topic=await page.locator('#idea-topic option').evaluateAll(options=>options.find(option=>option.value&&!option.disabled)?.value);
 assert.ok(topic,'selectable idea topic');await page.locator('#idea-topic').selectOption(topic);
 await page.locator('#idea-name').fill('TESTDATEN '+injection);await page.locator('#idea-email').fill('apphub@example.invalid');
 const message='TESTDATEN App-Idee\nZweite Zeile: '+injection;await page.locator('#idea-message').fill(message);
 await page.locator('#app-idea [type="submit"]').click();
 await assertPreview(page,{panel:'idea-preview-panel',preview:'idea-preview',link:'idea-open-mail',expectedParts:[topic,'TESTDATEN '+injection,'apphub@example.invalid',message],beforeURL});
 // Gate data is synthetic and fulfilled locally. No download link is ever followed.
 const offerTemplate=JSON.parse(fs.readFileSync(path.join(root,'app-offer.json'),'utf8'));
 const flags={published:true,legalReviewComplete:true,practicalAcceptanceComplete:true};
 const demoURL='https://downloads.example.invalid/keil-copy-demo.zip';
 const gateCases=[{name:'fully accepted',flags,url:demoURL,enabled:true}];
 for(const flag of Object.keys(flags)){
  gateCases.push({name:flag+' false',flags:{...flags,[flag]:false},url:demoURL,enabled:false});
  gateCases.push({name:flag+' string true',flags:{...flags,[flag]:'true'},url:demoURL,enabled:false});
  const missing={...flags};delete missing[flag];gateCases.push({name:flag+' missing',flags:missing,url:demoURL,enabled:false});
 }
 for(const url of ['http://127.0.0.1/demo.zip','javascript:alert(1)','/demo.zip','https://',''])gateCases.push({name:'invalid URL '+url,flags,url,enabled:false});
 gateCases.push({name:'missing demo',flags,enabled:false});
 for(const gate of gateCases){
  const offer={...offerTemplate,...gate.flags};
  for(const flag of Object.keys(flags))if(!(flag in gate.flags))delete offer[flag];
  if(gate.url===undefined)delete offer.demo;else offer.demo={...(offerTemplate.demo||{}),url:gate.url};
  await page.route('**/app-offer.json',route=>route.fulfill({json:offer}));
  const offered=page.waitForResponse(response=>new URL(response.url()).pathname==='/app-offer.json');await goto(page,'/apps');await offered;await ready(page);
  await page.waitForFunction(()=>document.querySelector('#download-status')?.textContent.trim().length>0);
  // Wait for the same render turn as the fetched JSON handler, without a network request.
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  const download=page.locator('[data-demo-download]');assert.equal(await download.count(),1);
  assert.equal(await download.getAttribute('aria-disabled')==='true',!gate.enabled,gate.name+' disabled state');
  if(gate.enabled)assert.equal(await download.getAttribute('href'),demoURL,gate.name+' HTTPS URL');
  else assert.notEqual(await download.getAttribute('href'),demoURL,gate.name+' unreleased URL not linked');
  const appPrevented=await download.evaluate(anchor=>{
   let prevented;
   const observer=event=>{prevented=event.defaultPrevented;event.preventDefault();};
   document.addEventListener('click',observer,{once:true});
   const event=new MouseEvent('click',{bubbles:true,cancelable:true});anchor.dispatchEvent(event);
   document.removeEventListener('click',observer);
   return prevented??event.defaultPrevented;
  });
  assert.equal(appPrevented,!gate.enabled,gate.name+' disabled click guard');
  record('strict download gate',{case:gate.name,enabled:gate.enabled});await page.unroute('**/app-offer.json');
 }
 assert.deepEqual(unexpectedPosts,[],'no form POST or PII GET fallback');
 assert.deepEqual(mailAttempts,[],'no mail application opened');assert.deepEqual(windowOpenAttempts,[],'no external window opened');
 assert.deepEqual(pageErrors,[],'browser JavaScript errors');
 const result={checkedAt:new Date().toISOString(),passed:true,layoutCases:checks.filter(c=>c.name==='layout').length,supportedHomepages:langs.length,widths,checks,contrastSamples,pageErrors,blockedExternal:[...new Set(blockedExternal)],realEmails:0,realPayments:0,realSubmissions:0,clipboard:'mocked only',downloadLinksFollowed:0,published:false};
 fs.writeFileSync(path.join(evidence,'Ergebnis.json'),JSON.stringify(result,null,2));
 console.log(JSON.stringify({passed:true,layoutCases:result.layoutCases,checks:checks.length,gateCases:gateCases.length,realEmails:0,realPayments:0,realSubmissions:0,evidence}));
}catch(error){
 if(primaryPage&&!primaryPage.isClosed())await primaryPage.screenshot({path:path.join(evidence,'Fehler.png'),fullPage:true}).catch(()=>{});
 fs.writeFileSync(path.join(evidence,'Ergebnis.json'),JSON.stringify({checkedAt:new Date().toISOString(),passed:false,error:error.stack||String(error),checks,contrastSamples,pageErrors,blockedExternal:[...new Set(blockedExternal)],unexpectedPosts,mailAttempts,windowOpenAttempts,realEmails:0,realPayments:0,realSubmissions:0,published:false},null,2));
 throw error;
}finally{
 if(browser)await browser.close();
 if(server.listening){server.closeIdleConnections?.();await new Promise(resolve=>server.close(resolve));}
}
