import fs from'node:fs';import path from'node:path';import http from'node:http';import assert from'node:assert/strict';import{createRequire}from'node:module';import{fileURLToPath}from'node:url';
import{languages}from'../locales/content.mjs';
const require=createRequire(import.meta.url),{chromium}=require('C:/Users/Maurice/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),evidence=process.env.KEILCOPY_CONSENT_EVIDENCE||path.resolve(root,'../Werbeeinwilligung-Pruefung-20261106');
fs.mkdirSync(evidence,{recursive:true});
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml'};
const server=http.createServer((req,res)=>{let rel=new URL(req.url,'http://localhost').pathname;if(rel.endsWith('/'))rel+='index.html';if(!path.extname(rel))rel+='.html';const p=path.resolve(root,'.'+rel);if(!p.startsWith(root+path.sep)||!fs.existsSync(p)||!fs.statSync(p).isFile())return res.writeHead(404).end();res.setHeader('Content-Type',types[path.extname(p)]||'application/octet-stream');fs.createReadStream(p).pipe(res);});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;let browser;
const results=[],errors=[],captured=[],outside=[];let resolveCapture;
try{
 browser=await chromium.launch({channel:'msedge',headless:true});
 const context=await browser.newContext({reducedMotion:'reduce'});
 await context.route('**/*',async route=>{
  const req=route.request(),u=new URL(req.url());
  if(u.origin!==base){
   if(u.hostname==='bigin.zoho.eu'&&req.method()==='POST'){captured.push(req.postData()||'');if(resolveCapture){resolveCapture();resolveCapture=null;}return route.fulfill({contentType:'text/html',body:'<p>Lokaler abgefangener Test – keine Anfrage gesendet.</p>'});}
   outside.push(u.origin);return route.abort();
  }
  if(u.pathname==='/api/repair-confirmation')return route.fulfill({status:201,json:{ref:'12345678-1234-4123-8123-123456789012'}});
  return route.continue();
 });
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 for(const width of[320,360,390,1366]){
  await page.setViewportSize({width,height:900});
  for(const lang of Object.keys(languages)){
   const prefix=lang==='de'?'':'/'+lang;
   for(const name of['email-wuensche','reparaturanfrage']){
    const response=await page.goto(base+prefix+'/'+name,{waitUntil:'domcontentloaded'});assert.equal(response.status(),200);
    if(name==='reparaturanfrage'){
     await page.locator('#marketing-preference').waitFor();
     assert.equal(await page.locator('#marketing-preference').inputValue(),'','No marketing choice is preselected');
     assert.equal(await page.locator('#marketing-preference').evaluate(e=>e.required),true);
     assert.equal(await page.locator('#marketing-preference').getAttribute('name'),null,'UI field is not submitted as an unsupported CRM field');
     await page.locator('#marketing-preference').selectOption('no');
     assert.match(await page.evaluate(()=>window.pcMarketingPreferences.describe()),/ABGELEHNT/);
     await page.locator('#marketing-preference').selectOption('yes');
     assert.match(await page.evaluate(()=>window.pcMarketingPreferences.describe()),/ANGEFRAGT_UNBESTAETIGT/);
    }else{
     assert.equal(await page.locator('[data-marketing-action][aria-disabled="true"]').count(),2);
     for(const a of await page.locator('[data-marketing-action]').all())assert.equal(await a.evaluate(a=>!a.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true}))),true);
    }
    const size=await page.evaluate(()=>({w:innerWidth,s:document.documentElement.scrollWidth,h1:document.querySelectorAll('h1').length}));
    assert.ok(size.s<=size.w+1,lang+' '+name+' '+width+' overflow');assert.equal(size.h1,1);
    results.push({lang,name,width,passed:true});
    if(lang==='de'&&name==='email-wuensche'&&[390,1366].includes(width))await page.screenshot({path:path.join(evidence,'E-Mail-Wuensche-'+width+'.png'),fullPage:true});
    if(lang==='de'&&name==='reparaturanfrage'&&width===390)await page.locator('[data-marketing-slot]').screenshot({path:path.join(evidence,'Werbeauswahl-390.png')});
   }
  }
 }
 assert.equal(captured.length,0,'Layout checks must never submit requests');
 for(const choice of['no','yes']){
  await page.goto(base+'/reparaturanfrage');await page.locator('#marketing-preference').waitFor();
  await page.waitForTimeout(2600);
  await page.locator('#device-type').selectOption('Sonstiges');
  for(const[id,value]of Object.entries({'device-name':'TESTDATEN Geraet','description':'Abgefangener lokaler Formulartest ohne echten Versand.','serial-number':'TEST-1234','first-name':'TESTDATEN','last-name':'Beispiel','email':'test@example.invalid','phone':'+4915123456789','street':'Teststrasse 1','postcode':'10000','city':'Testort','country':'Deutschland'}))await page.locator('#'+id).fill(value);
  await page.locator('#privacy-acknowledged').check();
  const before=captured.length;
  await page.locator('[data-submit]').click();
  assert.equal(captured.length,before,'Missing explicit marketing choice does not silently subscribe');
  await page.locator('#marketing-preference').selectOption(choice);
  let postTimer;const posted=new Promise((resolve,reject)=>{resolveCapture=resolve;postTimer=setTimeout(()=>reject(Error('Synthetic form submission was not captured')),10000);});
  try{await page.locator('[data-submit]').click();await posted;}finally{clearTimeout(postTimer);resolveCapture=null;}
  assert.equal(captured.length,before+1);assert.ok(captured.at(-1).includes('Deutschland'),'Explicit billing country must be preserved');
  assert.ok(captured.at(-1).includes(choice==='no'?'ABGELEHNT':'ANGEFRAGT_UNBESTAETIGT'));
  assert.ok(!captured.at(-1).includes('name="marketing-preference"'));

 }
 assert.deepEqual(errors,[]);
 const proof={checkedAt:new Date().toISOString(),passed:true,layoutCases:results.length,results,javaScriptErrors:errors,interceptedSyntheticCrmPosts:captured.length,realSubmissions:0,realEmails:0,providerReady:false,sourcePublished:false,blockedExternalOrigins:[...new Set(outside)]};
 fs.writeFileSync(path.join(evidence,'Browser-Ergebnis.json'),JSON.stringify(proof,null,2));
 console.log(JSON.stringify({passed:true,layoutCases:results.length,javaScriptErrors:errors.length,interceptedSyntheticCrmPosts:captured.length,realSubmissions:0,realEmails:0,providerReady:false}));
 await context.close();
}finally{if(browser)await browser.close();await new Promise(r=>server.close(r));}
