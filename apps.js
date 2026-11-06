const mailAddress='keil.maurice1980@gmail.com';
fetch('/app-offer.json').then(r=>{
 if(!r.ok)throw Error('not available');return r.json();
}).then(data=>{
 if(data.published)document.querySelectorAll('[data-preview-notice]').forEach(n=>n.remove());
 const link=document.querySelector('[data-demo-download]');
 if(link&&data.published&&data.legalReviewComplete&&data.practicalAcceptanceComplete&&data.demo.url&&/^https:\/\//.test(data.demo.url)){
  link.href=data.demo.url;link.removeAttribute('aria-disabled');
  document.querySelector('#download-status').textContent='30 Tage · 5 TB geplanter Auftragsumfang.';
 }
}).catch(()=>{});
document.querySelectorAll('a[aria-disabled=true]').forEach(a=>a.addEventListener('click',e=>{
 if(a.getAttribute('aria-disabled')==='true')e.preventDefault();
}));
function openMail(subject,paragraphs,status){
 document.querySelector(status).textContent='Dein E-Mail-Programm wird geöffnet. Bitte die Nachricht prüfen und selbst absenden. Falls es nicht öffnet: '+mailAddress;
 location.href='mailto:'+mailAddress+'?subject='+encodeURIComponent(subject)+'&body='+encodeURIComponent(paragraphs.join('\n\n'));
}
const form=document.querySelector('#app-enquiry');
if(form){
 const select=form.elements.edition;
 const requested=new URLSearchParams(location.search).get('edition');
 if(['personal','technician'].includes(requested))select.value=requested;
 const refresh=()=>{
  const tech=select.value==='technician';
  document.querySelector('[data-selected-license]').textContent=tech?'Techniker':'Privat';
  document.querySelector('[data-selected-price]').textContent=tech?'65 €':'35 €';
 };
 select.addEventListener('change',refresh);refresh();
 form.addEventListener('submit',e=>{
  e.preventDefault();if(!form.reportValidity())return;
  const tech=select.value==='technician';
  openMail('Keil@Copy – Kaufanfrage '+(tech?'Techniker':'Privat'),[
   'Guten Tag Herr Keil,',
   'ich interessiere mich für Keil@Copy und bitte um ein persönliches Angebot mit den vollständigen Vertrags- und Widerrufsinformationen.',
   'Lizenz: '+(tech?'Techniker · 65 €':'Privat · 35 €')+' einmalig',
   'Name: '+form.elements.name.value.trim(),
   'Antwortadresse: '+form.elements.email.value.trim(),
   'Gewünschter Zahlungsweg: '+form.elements.payment.value,
   'Bitte senden Sie mir vor einer Zahlung die verbindlichen Angebots- und Zahlungsdaten.'
  ],'#enquiry-status');
 });
}
const ideaForm=document.querySelector('#app-idea');
if(ideaForm){
 ideaForm.addEventListener('submit',e=>{
  e.preventDefault();if(!ideaForm.reportValidity())return;
  openMail('App-Idee / Funktionswunsch – '+ideaForm.elements.topic.value,[
   'Guten Tag Herr Keil,',
   'Thema: '+ideaForm.elements.topic.value,
   'Name: '+ideaForm.elements.name.value.trim(),
   'Antwortadresse: '+ideaForm.elements.email.value.trim(),
   'Meine Idee oder mein Anliegen:\n'+ideaForm.elements.message.value.trim(),
   'Dies ist eine unverbindliche Anfrage. Noch kein Entwicklungsauftrag und keine Anmeldung für Werbemails.'
  ],'#idea-status');
 });
}
