import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
const require = createRequire(import.meta.url);
// Install Playwright locally, or set PLAYWRIGHT_MODULE_PATH for a bundled runtime.
const {chromium} = require(process.env.PLAYWRIGHT_MODULE_PATH || 'playwright');
const root = path.resolve(import.meta.dirname, '..');
const evidence = path.resolve(root, '..', 'Formular-Optional-20261020');
await fs.mkdir(evidence, {recursive: true});
const types = {'.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.png':'image/png', '.svg':'image/svg+xml'};
const server = http.createServer(async (req,res) => {
  try {
    let file = new URL(req.url, 'http://localhost').pathname;
    if (file.endsWith('/')) file += 'index.html';
    if (!path.extname(file)) file += '.html';
    const target = path.resolve(root, '.' + file);
    if (!target.startsWith(root + path.sep)) throw new Error('Invalid path');
    res.setHeader('Content-Type', types[path.extname(target)] || 'application/octet-stream');
    res.end(await fs.readFile(target));
  } catch { res.writeHead(404); res.end('Not found'); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const origin = 'http://127.0.0.1:' + server.address().port;
let browser;
try {
  browser = await chromium.launch({headless:true, channel:'msedge'});
  const context = await browser.newContext();
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  let posts=0, references=0, releaseReference;
  await context.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (url.origin !== origin) {
      if (url.hostname==='bigin.zoho.eu' && route.request().method()==='POST') { posts++; await route.fulfill({contentType:'text/html',body:'<p>Intercepted test submission</p>'}); }
      else await route.abort();
      return;
    }
    if (url.pathname==='/api/repair-confirmation') {
      references++;
      await new Promise(resolve => { releaseReference=resolve; });
      await route.fulfill({status:201,contentType:'application/json',body:JSON.stringify({ref:'12345678-1234-4123-8123-123456789012'})});
      return;
    }
    await route.continue();
  });
  const layouts=[];
  for (const lang of ['de','en','tr','ro','uk','es','sv','da','ru','zh','ja']) {
    for (const width of [320,360,390,1280]) {
      await page.setViewportSize({width,height:900});
      await page.goto(origin + (lang==='de'?'':'/'+lang) + '/reparaturanfrage');
      await page.locator('#phone').waitFor({state:'visible'});
      assert.equal(await page.locator('[data-next-step],[data-prev-step]').count(),0,lang+' has step buttons');
      assert.equal(await page.locator('[data-form-step="2"]').isVisible(),true,lang+' contact fields hidden');
      assert.equal(await page.locator('#serial-number').isVisible(),true,lang+' device identifier hidden');
      assert.equal(await page.locator('#imei').isVisible(),true,lang+' IMEI hidden');
      for (const id of ['street','postcode','city']) {
        assert.equal(await page.locator('#'+id).isVisible(),true,lang+' required field hidden: '+id);
        assert.equal(await page.locator('#'+id).evaluate(e=>e.required),true,lang+' missing required field: '+id);
      }
      assert.equal(await page.locator('a[href="tel:+4915254530080"]').count()>0,true);
      assert.equal(await page.locator('a[href^="https://wa.me/4915254530080"]').count()>0,true);
      const dimensions=await page.evaluate(()=>({width:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth}));
      assert.ok(dimensions.scroll<=dimensions.width+1,lang+' horizontal overflow at '+width+': '+JSON.stringify(dimensions));
      await page.locator('#device-type').selectOption('Desktop-PC');
      for(const id of ['device-manufacturer','device-model','computer-cpu','computer-ram','computer-gpu','computer-mainboard','computer-psu']) {
        assert.equal(await page.locator('#'+id).evaluate(e=>e.required),false,lang+' optional technical field: '+id);
        assert.equal(await page.locator('#'+id).evaluate(e=>e.checkValidity()),true,lang+' empty optional field: '+id);
        assert.doesNotMatch(await page.locator('label[for="'+id+'"]').textContent(),/\*/);
      }
      await page.locator('#device-type').selectOption('Smartphone');
      await page.locator('#unlock-method').selectOption('pattern');
      await page.locator('#unlock-code').fill('1 2 3 6');
      assert.equal(await page.locator('#unlock-code').isVisible(),true);
      assert.equal(await page.locator('#unlock-code').evaluate(e=>e.checkValidity()),true);
      if(lang!=='de') assert.notEqual(await page.locator('#unlock-label').textContent(),'PIN, Passwort oder Muster (optional)');
      const unlockDimensions=await page.evaluate(()=>({width:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth}));
      assert.ok(unlockDimensions.scroll<=unlockDimensions.width+1,lang+' unlock fields overflow at '+width);
      const nav=page.locator(lang==='de'?'.nav-toggle':'.locale-toggle');
      if(width<700){ await nav.click(); assert.equal(await nav.getAttribute('aria-expanded'),'true'); await nav.click(); }
      if(lang==='de' && [390,1280].includes(width)) await page.screenshot({path:path.join(evidence,'Reparaturformular-'+width+'.png'),fullPage:true});
      layouts.push({lang,width,passed:true});
    }
  }
  await page.goto(origin+'/reparaturanfrage');
  await page.clock.install();
  await page.clock.fastForward(3000);
  await page.locator('#device-type').selectOption('Smartphone');
  await page.locator('#device-name').fill('TEST Smartphone');
  await page.locator('#device-manufacturer').fill('Apple');
  await page.locator('#device-model').fill('A2882');
  await page.locator('#description').fill('Gekennzeichneter lokaler Test ohne Kundenversand.');
  await page.locator('#first-name').fill('Test');
  await page.locator('#last-name').fill('Inhaber');
  await page.locator('#email').fill('MauriceKeil@pc-und-handyservice-augsburg.com');
  await page.locator('#phone').fill('015254530080');
  await page.locator('#privacy-acknowledged').check();
  await page.locator('[data-submit]').click();
  assert.equal(await page.evaluate(()=>document.activeElement.id),'serial-number');
  assert.equal(references,0,'Missing identifier must not transmit');
  for(const type of ['Desktop-PC','Laptop','Smartphone','Tablet','Konsole','Sonstiges']) {
    await page.locator('#device-type').selectOption(type);
    const supportsUnlock=type!=='Sonstiges';
    assert.equal(await page.locator('[data-unlock-fields]').isVisible(),supportsUnlock,type+' unlock visibility');
    assert.equal(await page.locator('#unlock-code').isDisabled(),true,type+' code disabled until selected');
    if(supportsUnlock) {
      await page.locator('#unlock-method').selectOption('pin');
      assert.equal(await page.locator('#unlock-code').evaluate(e=>e.required),true);
      await page.locator('#unlock-code').fill('LOCAL-TEST-PIN');
      await page.locator('#unlock-method').selectOption('password');
      assert.equal(await page.locator('#unlock-code').inputValue(),'','Method change clears old secret');
      await page.locator('#unlock-code').fill('   ');
      assert.equal(await page.locator('#unlock-code').evaluate(e=>e.checkValidity()),false,'Blank password rejected');
      await page.locator('#unlock-code').fill('LOCAL-TEST-PASSWORD');
      await page.locator('#unlock-method').selectOption('none');
      assert.equal(await page.locator('#unlock-code').inputValue(),'');
      assert.equal(await page.locator('#unlock-code').isDisabled(),true);
    }
    assert.equal(await page.locator('#imei').isVisible(),true,type+' IMEI must remain visible');
    const computer=['Desktop-PC','Laptop'].includes(type);
    for(const id of ['computer-cpu','computer-ram','computer-gpu','computer-mainboard','computer-psu']) {
      assert.equal(await page.locator('#'+id).evaluate(e=>e.required),false,type+' specification must be optional: '+id);
      assert.equal(await page.locator('#'+id).isDisabled(),!computer,type+' hidden specification disabled: '+id);
    }
    await page.locator('#serial-number').fill('CODEX-LOCAL-TEST');
    assert.equal(await page.locator('#imei').evaluate(e=>e.required),false,type+' serial alternative');
    await page.locator('#serial-number').fill('');
    await page.locator('#imei').fill('490154203237518');
    assert.equal(await page.locator('#serial-number').evaluate(e=>e.required),false,type+' IMEI alternative');
    await page.locator('#imei').fill('');
  }
  await page.locator('#device-type').selectOption('Smartphone');
  await page.locator('#imei').fill('490154203237518');
  assert.equal(await page.locator('#serial-number').evaluate(e=>e.required),false);
  await page.locator('#imei').fill('123');
  await page.locator('[data-submit]').click();
  assert.equal(references,0,'Invalid IMEI must not transmit');
  await page.locator('#identifier-unavailable').check();
  assert.equal(await page.locator('#serial-number').isDisabled(),true);
  assert.equal(await page.locator('#imei').isDisabled(),true);
  for(const id of ['device-manufacturer','device-model']) {
    const field=page.locator('#'+id), prior=await field.inputValue();
    await field.fill('   ');
    assert.equal(await field.evaluate(e=>e.required),false,'Optional '+id);
    assert.equal(await field.evaluate(e=>e.checkValidity()),true,'Blank optional '+id+' must be valid');
    await field.fill(prior);
  }
  await page.locator('[data-submit]').click();
  assert.equal(await page.evaluate(()=>document.activeElement.id),'street');
  assert.equal(references,0,'Missing billing address must not transmit');
  await page.locator('#street').fill('Stätzlinger Straße 99');
  await page.locator('#postcode').fill('12');
  await page.locator('[data-submit]').click();
  assert.equal(await page.evaluate(()=>document.activeElement.id),'postcode');
  assert.equal(references,0);
  await page.locator('#postcode').fill('86165');
  await page.locator('[data-submit]').click();
  assert.equal(await page.evaluate(()=>document.activeElement.id),'city');
  assert.equal(references,0,'Missing city must not transmit');
  await page.locator('#city').fill('Augsburg');
  await page.locator('#customer-kind').selectOption('business');
  await page.locator('[data-submit]').click();
  assert.equal(await page.evaluate(()=>document.activeElement.id),'company');
  assert.equal(references,0,'Business invoice requires company');
  await page.locator('#company').fill('CODEX LOCAL TEST');
  await page.locator('#customer-kind').selectOption('private');
  assert.equal(await page.locator('#company').isDisabled(),true);
  await page.locator('#device-type').selectOption('Desktop-PC');
  for(const id of ['computer-cpu','computer-ram','computer-gpu','computer-mainboard','computer-psu']) assert.equal(await page.locator('#'+id).evaluate(e=>e.checkValidity()),true,'Empty PC specification must be valid: '+id);
  for(const [id,value] of Object.entries({'computer-cpu':'Intel Core i5','computer-ram':'16 GB','computer-gpu':'Intel UHD','computer-mainboard':'TEST BOARD','computer-psu':'TEST 65 W'})) await page.locator('#'+id).fill(value);
  await page.locator('#device-type').selectOption('Smartphone');
  assert.equal(await page.locator('#unlock-code').inputValue(),'','Device change clears old secret');
  await page.locator('#unlock-method').selectOption('pattern');
  await page.locator('#unlock-code').fill('1 2 3 6');
  await page.locator('[data-submit]').click();
  await page.waitForFunction(()=>document.querySelector('[data-submit]').disabled);
  await page.locator('form#repair-request').evaluate(f=>{f.requestSubmit(); f.requestSubmit();});
  await page.waitForTimeout(100);
  assert.equal(references,1,'Rapid repeated submission creates only one confirmation');
  releaseReference();
  await page.waitForTimeout(200);
  assert.equal(posts,1,'Rapid repeated submission reaches CRM once');
  const mapping=await page.locator('#repair-request').evaluate(f=>Object.fromEntries(Array.from(f.elements).filter(e=>e.type==='hidden'&&!['xnQsjsdp','xmIwtLD','zc_gad','actionType'].includes(e.name)).map(e=>[e.name,e.value])));
  assert.equal(mapping.POTENTIALCF5,'MauriceKeil@pc-und-handyservice-augsburg.com');
  assert.equal(mapping.POTENTIALCF6,'+4915254530080');
  assert.equal(mapping.POTENTIALCF7,'Stätzlinger Straße 99, 86165 Augsburg');
  assert.match(mapping.Description,/Gerätekennung: nicht vorhanden/);
  assert.match(mapping.Description,/Geräteentsperrung \(Muster – Punkte 1–9\): 1 2 3 6/);
  assert.equal(mapping.POTENTIALCF2,'TEST Smartphone | Apple | A2882');
  assert.doesNotMatch(mapping.Description,/TEST BOARD|TEST 65 W/,'Hidden PC details must not reach smartphone requests');
  for(const type of ['Desktop-PC','Laptop']) {
    await page.goto(origin+'/reparaturanfrage');
    await page.clock.fastForward(3000);
    await page.locator('#device-type').selectOption(type);
    for(const [id,value] of Object.entries({'device-name':'Lokaler Test-PC','description':'Lokaler Test ohne technische Zusatzangaben und ohne echten Versand.','serial-number':'CODEX-LOCAL-TEST','first-name':'Maurice','last-name':'Keil','email':'MauriceKeil@pc-und-handyservice-augsburg.com','phone':'015254530080','street':'Stätzlinger Straße 99','postcode':'86165','city':'Augsburg'})) await page.locator('#'+id).fill(value);
    await page.locator('#privacy-acknowledged').check();
    const prior=posts;
    await page.locator('[data-submit]').click();
    await page.waitForFunction(()=>document.querySelector('[data-submit]').disabled);
    releaseReference();
    await page.frameLocator('[name="bigin-response"]').getByText('Intercepted test submission').waitFor();
    assert.equal(posts,prior+1,type+' accepts blank optional technical details');
    assert.equal(await page.locator('#bigin-device-model').inputValue(),'Lokaler Test-PC');
    for(const id of ['device-manufacturer','device-model','computer-cpu','computer-ram','computer-gpu','computer-mainboard','computer-psu']) assert.equal(await page.locator('#'+id).inputValue(),'');
  }
  assert.equal(posts,3,'Only three intercepted local submissions');
  assert.equal(errors.length,0,errors.join('\n'));
  await fs.writeFile(path.join(evidence,'Ergebnis.json'),JSON.stringify({layouts,checks:['optional manufacturer and exact model','required full billing address','all six device types accept serial OR IMEI OR explicit exception','IMEI validation','company required only for business invoice','PC specifications optional for PCs/laptops','CRM field mapping','rapid repeat submission suppressed','all external submissions intercepted'],references,crmPosts:posts,errors},null,2));
  console.log('44 Sprach-/Breitenprüfungen und Formularverhalten bestanden. Externe Übermittlung ausschließlich abgefangen.');
} finally { if(browser) await browser.close(); await new Promise(resolve=>server.close(resolve)); }
