export const CONSENT_VERSION='marketing-v1-20261106';
export const TOPIC='apps-software-reparatur-it';
const validEmail=value=>{
 if(typeof value!=='string')return null;
 const email=value.trim().toLowerCase();
 return email.length<=254&&/^[^\s@<>]+@[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?\.[a-z]{2,63}$/.test(email)&&!email.includes('..')?email:null;
};
// Only an authenticated, freshly checked provider record is evidence.
// A browser form, CRM opt-out=false or a pending signup can never authorize a send.
export function assessMarketingPermission(contact,providerSnapshot,configuration,now=Date.now()){
 const reject=reason=>({allowed:false,reason});
 const email=validEmail(contact?.email);
 if(!email)return reject('email-invalid');
 if(configuration?.marketingSendingEnabled!==true||configuration?.providerReady!==true)return reject('provider-not-ready');
 if(contact.emailOptOut!==false)return reject('crm-opt-out-or-unknown');
 if(providerSnapshot?.source!=='zoho-campaigns'||providerSnapshot?.verified!==true)return reject('provider-proof-missing');
 const checked=Date.parse(providerSnapshot.checkedAt);
 if(!Number.isFinite(checked)||checked>now||now-checked>24*60*60*1000)return reject('provider-proof-stale');
 if(!Array.isArray(providerSnapshot.contacts))return reject('provider-proof-malformed');
 const rows=providerSnapshot.contacts.filter(row=>validEmail(row?.email)===email);
 if(rows.length!==1)return reject('provider-record-missing-or-ambiguous');
 const row=rows[0];
 if(row.status!=='confirmed'||row.doubleOptIn!==true||row.unsubscribed!==false)return reject('not-confirmed-or-withdrawn');
 if(row.consentTextVersion!==CONSENT_VERSION||!Array.isArray(row.topics)||!row.topics.includes(TOPIC))return reject('consent-scope-unproven');
 const confirmed=Date.parse(row.confirmedAt);
 if(!Number.isFinite(confirmed)||confirmed>now)return reject('confirmation-time-invalid');
 if(contact.latestDeclineAt){
  const declined=Date.parse(contact.latestDeclineAt);
  if(!Number.isFinite(declined)||declined>=confirmed)return reject('later-decline');
 }
 if(contact.latestPreference==='no'&&!contact.latestDeclineAt)return reject('decline-time-unknown');
 return{allowed:true,reason:'confirmed-within-scope',email};
}
export function prepareMarketingRecipients(contacts,proof,configuration,now=Date.now()){
 const counts=new Map();
 for(const c of contacts){const e=validEmail(c.email);if(e)counts.set(e,(counts.get(e)||0)+1);}
 return contacts.map(c=>{
  const email=validEmail(c.email);
  if(email&&counts.get(email)!==1)return{email,allowed:false,reason:'duplicate-crm-email-review-required'};
  return{email,...assessMarketingPermission(c,proof,configuration,now)};
 });
}
