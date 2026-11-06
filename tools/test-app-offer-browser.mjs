import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const require=createRequire(import.meta.url);
const {chromium}=require('C:/Users/Maurice/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const evidence=process.env.KEILCOPY_WEB_EVIDENCE||'D:/ChatGPT/Keil-Copy/Entwicklung/Aenderungen/1.9.85/Website-Pruefung-Ergaenzung-20261106';fs.mkdirSync(evidence,{recursive:true});
const server=http.createServer((req,res)=>{let url;try{url=new URL(req.url,'http://localhost');}catch{return res.writeHead(400).end();}let rel=decodeURIComponent(url.pathname);if(rel.endsWith('/'))rel+='index.html';if(!path.extname(rel))rel+='.html';const file=path.resolve(root,'.'+rel);if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile())return res.writeHead(404).end();const types={'.html':'text/html; charset=utf-8','.txt':'text/plain; charset=utf-8','.json':'application/json','.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.webm':'video/webm'};res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');fs.createReadStream(file).pipe(res);});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
let browser;const checks=[],errors=[],external=[];
try{
 browser=await chromium.launch({channel:'msedge',headless:true});
 const ctx=await browser.newContext({viewport:{width:1280,height:720},reducedMotion:'reduce'});
 await ctx.route('**/*',route=>{const u=route.request().url();if(u.startsWith(base)||u.startsWith('data:')||u.startsWith('blob:'))return route.continue();external.push(u.split('?')[0]);return route.abort();});
 const page=await ctx.newPage();page.on('pageerror',e=>errors.push(e.message));
 // A labelled illustrated guide assembled from actual application test views, never a real customer copy or speed test.
 if(!fs.existsSync(path.join(root,'assets/apps/keil-copy/bedienvorschau.webm'))){
 const views=['Erster-Start-Lokal-1366x768-TESTDATEN.png','Dashboard-1.9.85-1366x768.png'];
 const images=views.map(n=>'data:image/png;base64,'+fs.readFileSync('D:/ChatGPT/Keil-Copy/Entwicklung/baseline/'+n).toString('base64'));
 await page.setContent('<canvas id="c" width="1280" height="720"></canvas>');
 const data=await page.evaluate(async(images)=>{
  const c=document.querySelector('#c'),g=c.getContext('2d');const imgs=await Promise.all(images.map(src=>new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=reject;i.src=src;})));
  const slides=[['01 · Quelle und Ziel wählen','Mehrere Ordner, USB, Windows-Freigabe oder FTP auswählen.',0],['02 · Auftrag bewusst starten','Quelle, Ziel, Kopiermodus und Sicherheitsmeldungen prüfen.',0],['03 · Fortschritt verfolgen','Datei, Pfade und Tempokurve gemeinsam im Blick behalten.',1],['04 · Prüfergebnis beachten','Ausgelassene oder nicht bestätigte Dateien gesondert prüfen.',1]];
  let start=performance.now();const draw=()=>{const elapsed=(performance.now()-start)/1000;const idx=Math.min(3,Math.floor(elapsed/4));const [title,body,image]=slides[idx];g.fillStyle='#f3f7fb';g.fillRect(0,0,1280,720);g.fillStyle='#102c43';g.fillRect(0,0,1280,126);g.font='bold 19px Segoe UI';g.fillStyle='#9ed2f0';g.fillText('Keil@Copy · Bedienvorschau',38,32);g.font='bold 30px Segoe UI';g.fillStyle='white';g.fillText(title,38,74);g.font='18px Segoe UI';g.fillStyle='#d0e0ed';g.fillText(body,38,108);g.drawImage(imgs[image],183,145,914,514);g.fillStyle='#3f5a70';g.font='16px Segoe UI';g.fillText('Anschaulicher Ablauf mit künstlichen Testansichten · keine echte Kopie oder Tempomessung',30,700);g.fillStyle='#1285c5';g.fillRect(0,714,1280*Math.min(1,elapsed/16),6);};
  draw();const stream=c.captureStream(15);const mime=['video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm'].find(t=>MediaRecorder.isTypeSupported(t));if(!mime)throw Error('No supported WebM recorder');const recorder=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:1800000});const chunks=[];recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};const done=new Promise(resolve=>recorder.onstop=resolve);recorder.start(500);const timer=setInterval(draw,65);await new Promise(r=>setTimeout(r,16100));clearInterval(timer);recorder.stop();await done;stream.getTracks().forEach(t=>t.stop());const bytes=new Uint8Array(await new Blob(chunks,{type:mime}).arrayBuffer());let str='';for(let i=0;i<bytes.length;i+=32768)str+=String.fromCharCode(...bytes.subarray(i,i+32768));return btoa(str);
 },images);
 fs.writeFileSync(path.join(root,'assets/apps/keil-copy/bedienvorschau.webm'),Buffer.from(data,'base64'));checks.push('Illustrated 16-second WebM with explicit test-data label');
 }
 const langs=['','en','tr','ro','uk','es','sv','da','ru','zh','ja','pl','it','fr','bg','hr','el','ar','fa'];
 for(const width of [320,360,390,1366]){
  await page.setViewportSize({width,height:900});
  for(const route of ['/apps','/apps-bestellen','/apps-rechtliches','/apps-kontakt',...langs.map(l=>'/'+(l?l+'/':''))]){
   const response=await page.goto(base+route,{waitUntil:'domcontentloaded'});assert.equal(response.status(),200,route);
   await page.waitForFunction(()=>[...document.images].every(i=>i.loading==='lazy'||i.complete));
   const dims=await page.evaluate(()=>({viewport:innerWidth,scroll:document.documentElement.scrollWidth,h1:document.querySelectorAll('h1').length,images:[...document.images].filter(i=>i.complete&&i.naturalWidth===0).map(i=>i.getAttribute('src')),apps:[...document.querySelectorAll('[data-apps-link]')].map(a=>a.getAttribute('href'))}));
   assert.ok(dims.scroll<=width+1,`${route} at ${width}: ${dims.scroll}`);assert.equal(dims.h1,1,route);assert.deepEqual(dims.images,[],route+' images');if(!route.startsWith('/apps'))assert.ok(dims.apps.every(x=>x==='/apps')&&dims.apps.length>=1,route+' Apps navigation');
   checks.push({route,width,overflow:false});
   if((width===390&&route==='/apps')||(width===1366&&route==='/apps')||(width===360&&route==='/apps-bestellen'))await page.screenshot({path:path.join(evidence,route.slice(1)+'-'+width+'.png'),fullPage:true});
  }
 }
 await page.setViewportSize({width:1366,height:900});
 await page.goto(base+'/apps-bestellen?edition=technician');assert.equal(await page.locator('#edition').inputValue(),'technician');assert.equal(await page.locator('[data-selected-price]').textContent(),'65 €');
 // Intercept mail navigation; no message is sent.
 await page.evaluate(()=>{window.__mailto='';document.querySelector('#app-enquiry').addEventListener('submit',e=>{e.preventDefault();e.stopImmediatePropagation();},true);});
 await page.locator('#buyer-name').fill('TESTDATEN Beispiel');await page.locator('#buyer-email').fill('test@example.invalid');await page.locator('input[value="Revolut Pro / SEPA-Überweisung"]').check();
 // Run original handler in an isolated JS context with location stub to inspect its mailto, never an external mail application.
 const js=fs.readFileSync(path.join(root,'apps.js'),'utf8');const vm=require('node:vm');let handler,listener;
 const form={elements:{edition:{value:'technician',addEventListener(){}},name:{value:'TESTDATEN Beispiel'},email:{value:'test@example.invalid'},payment:{value:'Revolut Pro / SEPA-Überweisung'}},reportValidity:()=>true,addEventListener:(n,fn)=>handler=fn};const nodes=new Map();const document={querySelector:s=>s==='#app-idea'?null:s==='#app-enquiry'?form:(nodes.get(s)||nodes.set(s,{textContent:'',getAttribute:()=>null}).get(s)),querySelectorAll:()=>[]};const location={search:'?edition=technician',href:''};vm.runInNewContext(js,{document,location,URLSearchParams,fetch:()=>Promise.reject(Error('test'))});handler({preventDefault(){}});const mail=new URL(location.href);assert.equal(mail.protocol,'mailto:');assert.equal(mail.pathname,'keil.maurice1980@gmail.com');const body=mail.searchParams.get('body');assert.ok(body.includes('\n\n')&&!body.includes('\\n'),'actual line breaks');assert.ok(body.includes('65 €')&&body.includes('Revolut Pro'));checks.push('Technician enquiry 65 EUR, Gmail, Revolut, real line breaks; no mail sent');
 // The idea form opens a reviewable email only: it never submits a repair order, newsletter consent or payment.
 let ideaHandler;
 const idea={elements:{topic:{value:'Neue App-Idee'},name:{value:'TESTDATEN Beispiel'},email:{value:'test@example.invalid'},message:{value:'Bitte Dateien einfacher ordnen. <script>TESTDATEN</script>'}},reportValidity:()=>true,addEventListener:(n,fn)=>ideaHandler=fn};
 const ideaNodes=new Map();const ideaLocation={search:'',href:''};
 const ideaDocument={querySelector:s=>s==='#app-enquiry'?null:s==='#app-idea'?idea:(ideaNodes.get(s)||ideaNodes.set(s,{textContent:''}).get(s)),querySelectorAll:()=>[]};
 vm.runInNewContext(js,{document:ideaDocument,location:ideaLocation,URLSearchParams,fetch:()=>Promise.reject(Error('test'))});
 ideaHandler({preventDefault(){}});
 const ideaMail=new URL(ideaLocation.href);assert.equal(ideaMail.protocol,'mailto:');assert.equal(ideaMail.pathname,'keil.maurice1980@gmail.com');
 const ideaBody=ideaMail.searchParams.get('body');assert.ok(ideaBody.includes('Neue App-Idee')&&ideaBody.includes('Noch kein Entwicklungsauftrag')&&ideaBody.includes('keine Anmeldung für Werbemails'));
 assert.ok(ideaBody.includes(String.fromCharCode(10))&&!ideaBody.includes(String.fromCharCode(92)+'n'));
 ideaLocation.href='';idea.reportValidity=()=>false;ideaHandler({preventDefault(){}});assert.equal(ideaLocation.href,'');
 checks.push('App idea email preview, Gmail, real line breaks, invalid form blocked; no marketing subscription or message sent');
 await page.goto(base+'/apps-kontakt');assert.equal(await page.locator('#idea-email').getAttribute('type'),'email');assert.equal(await page.locator('#idea-message').getAttribute('maxlength'),'2000');
 for(const route of ['/apps','/apps-bestellen']){await page.goto(base+route);assert.ok(await page.locator('a[href="/apps-kontakt"]').count()>=2);}
 checks.push('App idea links and visible contact form verified');
 // Release toggle cannot bypass legal/practical acceptance and a disabled link becomes usable only after all gates pass.
 for(const [name,offer,enabled] of [['prepared',{published:false,legalReviewComplete:false,practicalAcceptanceComplete:false},false],['incomplete',{published:true,legalReviewComplete:false,practicalAcceptanceComplete:true},false],['accepted',{published:true,legalReviewComplete:true,practicalAcceptanceComplete:true},true]]){
  await page.route('**/app-offer.json',route=>route.fulfill({json:{...offer,demo:{url:base.replace('http:','https:')+'/demo-test.zip'}}}));await page.goto(base+'/apps');await page.waitForTimeout(70);assert.equal(await page.locator('[data-demo-download]').getAttribute('aria-disabled'),enabled?null:'true',name);const prevented=await page.locator('[data-demo-download]').evaluate(a=>!a.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true})));assert.equal(prevented,!enabled,name+' link');await page.unroute('**/app-offer.json');checks.push('Demo release gate '+name);
 }
 await page.goto(base+'/apps');await page.locator('video').evaluate(v=>v.load());await page.waitForFunction(()=>document.querySelector('video').readyState>=1);const duration=await page.locator('video').evaluate(v=>v.duration);assert.ok(Number.isFinite(duration)&&duration>=15&&duration<30);checks.push({videoDuration:duration});
 assert.deepEqual(errors,[]);
 fs.writeFileSync(path.join(evidence,'Ergebnis.json'),JSON.stringify({checkedAt:new Date().toISOString(),passed:true,checks,pageErrors:errors,blockedExternal:[...new Set(external)],realSubmissions:0,realPayments:0,published:false},null,2));
 console.log(JSON.stringify({passed:true,layoutCases:checks.filter(x=>x.width).length,videoBytes:fs.statSync(path.join(root,'assets/apps/keil-copy/bedienvorschau.webm')).size,videoSeconds:duration,pageErrors:errors.length,noMailOrPaymentSent:true,evidence}));await ctx.close();
}finally{if(browser)await browser.close();await new Promise(r=>server.close(r));}