(()=>{
'use strict';
const mailAddress='keil.maurice1980@gmail.com';
const legacy=document.body.dataset.appRedirect;
if(['#kaufanfrage','#mitgestalten','#bedingungen'].includes(legacy)){
 location.replace('/apps'+location.search+legacy);return;
}
function safeHttps(value){
 try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password?u.href:null;}catch{return null;}
}
fetch('/app-offer.json').then(r=>{if(!r.ok)throw Error('not available');return r.json();}).then(data=>{
 const ready=data.published===true&&data.legalReviewComplete===true&&data.practicalAcceptanceComplete===true;
 if(ready)document.querySelectorAll('[data-preview-notice]').forEach(n=>n.remove());
 const url=safeHttps(data.demo?.url),link=document.querySelector('[data-demo-download]');
 if(ready&&url&&link){
  link.href=url;link.removeAttribute('aria-disabled');
  document.querySelector('#download-status').textContent='30 Tage · 5 TB geplanter Auftragsumfang. Produktinformationen vor Einsatz lesen.';
 }
}).catch(()=>{});
document.querySelectorAll('a[aria-disabled=true]').forEach(a=>a.addEventListener('click',e=>{
 if(a.getAttribute('aria-disabled')==='true')e.preventDefault();
}));
function preview(prefix,subject,paragraphs){
 const text=paragraphs.join('\n\n'),area=document.querySelector('#'+prefix+'-preview');
 area.value=text;
 document.querySelector('#'+prefix+'-open-mail').href='mailto:'+mailAddress+'?subject='+encodeURIComponent(subject)+'&body='+encodeURIComponent(text);
 document.querySelector('#'+prefix+'-preview-panel').hidden=false;
 document.querySelector('#'+prefix+'-status').textContent='Entwurf vorbereitet. Noch nicht versendet: bitte prüfen und anschließend im eigenen Mailprogramm senden.';
 area.style.height='auto';area.style.height=Math.max(210,area.scrollHeight)+'px';
}
function activate(form){
 form.querySelector('[data-form-fields]').disabled=false;
 form.querySelector('[data-form-unavailable]').hidden=true;
}
const form=document.querySelector('#app-enquiry');
if(form){
 const edition=form.elements.edition;
 const requested=new URLSearchParams(location.search).get('edition');
 if(['personal','technician'].includes(requested))edition.value=requested;
 const refresh=()=>{
  const tech=edition.value==='technician';
  document.querySelector('[data-selected-license]').textContent=tech?'Techniker':'Privat';
  document.querySelector('[data-selected-price]').textContent=tech?'65 €':'35 €';
 };
 edition.addEventListener('change',refresh);refresh();
 form.addEventListener('submit',e=>{
  e.preventDefault();if(!form.reportValidity())return;
  const tech=edition.value==='technician';
  preview('enquiry','Keil@Copy – Kaufanfrage '+(tech?'Techniker':'Privat'),[
   'Guten Tag Herr Keil,',
   'ich interessiere mich für Keil@Copy und bitte um ein persönliches Angebot mit vollständigen Produkt-, Vertrags- und Widerrufsinformationen.',
   'Lizenz: '+(tech?'Techniker · 65 €':'Privat · 35 €')+' einmalig',
   'Name: '+form.elements.name.value.trim(),
   'Antwortadresse: '+form.elements.email.value.trim(),
   'Gewünschter Zahlungsweg: '+form.elements.payment.value,
   'Bitte senden Sie mir vor einer Zahlung die verbindlichen Angebots- und Zahlungsdaten.'
  ]);
 });
 document.querySelectorAll('[data-license-choice]').forEach(a=>a.addEventListener('click',()=>{
  if(['personal','technician'].includes(a.dataset.licenseChoice)){edition.value=a.dataset.licenseChoice;refresh();}
 }));
 activate(form);
}
const idea=document.querySelector('#app-idea');
if(idea){
 idea.addEventListener('submit',e=>{
  e.preventDefault();if(!idea.reportValidity())return;
  preview('idea','Keil@Copy / App-Rückmeldung – '+idea.elements.topic.value,[
   'Guten Tag Herr Keil,',
   'Thema: '+idea.elements.topic.value,
   'Name: '+(idea.elements.name.value.trim()||'nicht angegeben'),
   'Antwortadresse: '+idea.elements.email.value.trim(),
   'Meine Rückmeldung oder mein Anliegen:\n'+idea.elements.message.value.trim(),
   'Dies ist eine unverbindliche Anfrage. Noch kein Entwicklungsauftrag und keine Anmeldung für Werbemails.'
  ]);
 });
 document.querySelectorAll('[data-idea-choice]').forEach(button=>button.addEventListener('click',()=>{
  const target=button.dataset.ideaChoice;
  if([...idea.elements.topic.options].some(o=>o.value===target))idea.elements.topic.value=target;
  idea.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});
  idea.elements.message.focus({preventScroll:true});
 }));
 activate(idea);
}
document.querySelectorAll('[data-copy-preview]').forEach(button=>button.addEventListener('click',async()=>{
 const area=document.getElementById(button.dataset.copyPreview);
 if(!area||!area.value)return;
 const prefix=area.id.startsWith('enquiry')?'enquiry':'idea',status=document.getElementById(prefix+'-status');
 try{
  if(!navigator.clipboard?.writeText)throw Error('clipboard not available');
  await navigator.clipboard.writeText(area.value);status.textContent='Nachrichtentext kopiert. Bitte selbst in deiner E-Mail an '+mailAddress+' einfügen und senden.';
 }catch{
  area.focus();area.select();status.textContent='Bitte den markierten Text selbst kopieren (Strg+C) und an '+mailAddress+' senden.';
 }
}));
})();
