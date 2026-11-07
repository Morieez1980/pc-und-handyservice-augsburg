(() => {
 'use strict';
 const version='marketing-v1-20261106';
 const choice=()=>document.querySelector('#marketing-preference')?.value||'unknown';
 // A form choice is an intent, never proof of a confirmed subscription.
 window.pcMarketingPreferences={
  choice,
  describe(){
   const state=choice();
   const status=state==='no'?'ABGELEHNT – keine Werbe-E-Mails':state==='yes'?'ANGEFRAGT_UNBESTAETIGT – erst nach gesondertem Double-Opt-in erlauben':'NICHT_ANGEGEBEN – keine Werbefreigabe';
   return 'E-Mail-Werbewunsch ['+version+']: '+status+'. Thema: Apps/Software sowie Reparatur- und IT-Dienstleistungen von PC & Handyservice Augsburg. Auftrags- und Rechnungsnachrichten davon unabhaengig. Erfasst ueber das Reparaturanfrageformular; serverseitigen Eingangszeitpunkt in Bigin verwenden.';
  }
 };
 document.querySelectorAll('[data-marketing-action]').forEach(a=>a.addEventListener('click',e=>{if(a.getAttribute('aria-disabled')==='true')e.preventDefault();}));
 const labels=fetch('/marketing-preferences-copy.json').then(r=>{if(!r.ok)throw Error('labels unavailable');return r.json();});
 const configuration=fetch('/marketing-preferences.json').then(r=>{if(!r.ok)throw Error('configuration unavailable');return r.json();});
 Promise.all([labels,configuration]).then(([all,config])=>{
  const lang=document.documentElement.lang.split('-')[0];const text=all[lang]||all.de;
  const answers={"de": ["Nein", "Ja"], "en": ["No", "Yes"], "tr": ["Hayır", "Evet"], "ro": ["Nu", "Da"], "uk": ["Ні", "Так"], "es": ["No", "Sí"], "sv": ["Nej", "Ja"], "da": ["Nej", "Ja"], "ru": ["Нет", "Да"], "zh": ["否", "是"], "ja": ["いいえ", "はい"], "pl": ["Nie", "Tak"], "it": ["No", "Sì"], "fr": ["Non", "Oui"], "bg": ["Не", "Да"], "hr": ["Ne", "Da"], "el": ["Όχι", "Ναι"], "ar": ["لا", "نعم"], "fa": ["خیر", "بله"]};const answer=answers[lang]||answers.de;
  const field=document.querySelector('[data-marketing-slot]');
  if(field){
   const el=(tag,value)=>{const n=document.createElement(tag);if(value)n.textContent=value;return n;};
   const box=el('fieldset');box.className='marketing-choice';
   box.append(el('legend',text[0]));
   const label=el('label',text[1]);label.htmlFor='marketing-preference';box.append(label);
   const select=el('select');select.id='marketing-preference';select.required=true;
   for(const[value,name]of[['',text[1]],['no',answer[0]],['yes',answer[1]]]){
    const option=el('option',name);option.value=value;select.append(option);
   }
   box.append(select,el('p',text[4]),el('p',text[5]));
   const link=el('a',text[6]);link.href=(lang==='de'?'/':'/'+lang+'/')+'email-wuensche';box.append(link);
   const status=el('p',text[7]);status.className='marketing-availability';
   if(!config.providerReady)box.append(status);
   field.replaceChildren(box);
  }
  const safeUrl=value=>{
   try{const u=new URL(value);return u.protocol==='https:'&&(u.hostname==='campaigns.zoho.eu'||['zcsend.net','zcsend.com','zcsub.net','zcsub.com'].some(d=>u.hostname===d||u.hostname.endsWith('.'+d)))?u.href:null;}catch{return null;}
  };
  const urls={signup:safeUrl(config.signupUrl),unsubscribe:safeUrl(config.unsubscribeUrl)};
  const ready=config.providerReady===true&&config.doubleOptInRequired===true&&urls.signup&&urls.unsubscribe;
  document.querySelectorAll('[data-marketing-action]').forEach(a=>{
   if(ready){a.href=urls[a.dataset.marketingAction];a.removeAttribute('aria-disabled');}
  });
  if(ready)document.querySelectorAll('[data-marketing-unavailable]').forEach(n=>n.hidden=true);
 }).catch(()=>{
  // No checkbox, failed request or missing integration can establish marketing permission.
  document.querySelectorAll('[data-marketing-action]').forEach(a=>a.addEventListener('click',e=>e.preventDefault()));
 });
})();
