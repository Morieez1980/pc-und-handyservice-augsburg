import test from'node:test';import assert from'node:assert/strict';
import{assessMarketingPermission as assess,prepareMarketingRecipients,CONSENT_VERSION,TOPIC}from'../functions/_shared/marketing-permission.js';
const now=Date.parse('2026-11-06T15:00:00Z');
const ready={providerReady:true,marketingSendingEnabled:true};
const person={email:'test@example.invalid',emailOptOut:false};
const row={email:'test@example.invalid',status:'confirmed',doubleOptIn:true,unsubscribed:false,consentTextVersion:CONSENT_VERSION,topics:[TOPIC],confirmedAt:'2026-11-05T15:00:00Z'};
const proof=()=>({source:'zoho-campaigns',verified:true,checkedAt:'2026-11-06T14:55:00Z',contacts:[{...row}]});
test('CRM without opt-out and a form Yes never establish consent',()=>{
 assert.equal(assess({...person,latestPreference:'yes'},null,ready,now).allowed,false);
 assert.equal(assess(person,{...proof(),contacts:[{...row,status:'pending'}]},ready,now).allowed,false);
 assert.equal(assess(person,proof(),{providerReady:false,marketingSendingEnabled:false},now).reason,'provider-not-ready');
});
test('Only a freshly checked, scoped Double-Opt-in record permits an address',()=>{
 assert.equal(assess(person,proof(),ready,now).allowed,true);
 for(const patch of[{doubleOptIn:false},{unsubscribed:true},{unsubscribed:undefined},{topics:['unrelated']},{consentTextVersion:'unknown'},{confirmedAt:'2027-01-01T00:00:00Z'}]){
  const p=proof();p.contacts[0]={...p.contacts[0],...patch};assert.equal(assess(person,p,ready,now).allowed,false,JSON.stringify(patch));
 }
});
test('Withdrawals, unknown CRM state and stale proof block sending',()=>{
 for(const c of[{...person,emailOptOut:true},{email:person.email},{...person,latestPreference:'no'},{...person,latestDeclineAt:'2026-11-06T10:00:00Z'}])assert.equal(assess(c,proof(),ready,now).allowed,false);
 for(const patch of[{verified:false},{checkedAt:'2026-11-01T00:00:00Z'},{checkedAt:'2027-01-01T00:00:00Z'}])assert.equal(assess(person,{...proof(),...patch},ready,now).allowed,false);
 assert.equal(assess({...person,latestPreference:'no',latestDeclineAt:'2026-11-04T00:00:00Z'},proof(),ready,now).allowed,true);
});
test('Ambiguous or duplicate addresses cannot silently produce multiple recipients',()=>{
 const p=proof();p.contacts.push({...row});assert.equal(assess(person,p,ready,now).allowed,false);
 const result=prepareMarketingRecipients([person,{...person,email:' TEST@EXAMPLE.INVALID ',emailOptOut:true}],proof(),ready,now);
 assert.ok(result.every(r=>!r.allowed));
 assert.equal(assess({...person,email:'bad\r\nBcc: client@example.invalid'},proof(),ready,now).allowed,false);
});
