import fs from 'node:fs';
import {repairAccessTranslationKeys} from './repair-unlock.mjs';
const data=JSON.parse(fs.readFileSync(new URL('./expanded-data.json',import.meta.url),'utf8'));
const forms=JSON.parse(fs.readFileSync(new URL('./expanded-forms.json',import.meta.url),'utf8'));
const source=JSON.parse(fs.readFileSync(new URL('./form-source.json',import.meta.url),'utf8'));
const reference=fs.readFileSync(new URL('../en/form-i18n.js',import.meta.url),'utf8');
// The legacy expanded rows are positional; the independently keyed access text is merged later.
const keys=Object.keys(JSON.parse(reference.slice('window.siteTranslate=(key)=>('.length).split(')[key]||key;')[0])).filter(key=>!repairAccessTranslationKeys.includes(key));
if(keys.length!==137)throw Error('Review expanded form translation keys: '+keys.length);
export const expandedContent={},expandedFormTranslations={},expandedArrival={},expandedLanguages={};
for(const [lang,d]of Object.entries(data)){
 const f=forms[lang],b=f.basic.split('|'),l=d.labels.split('|');
 if(b.length!==source.length||l.length!==25||d.prices.split('|').length!==23)throw Error('Incomplete locale '+lang);
 expandedLanguages[lang]=d.name;expandedArrival[lang]=d.arrival;
 expandedContent[lang]={...d,labels:l,priceNames:d.prices.split('|'),services:d.services.split('|').map((v,i)=>[v,d.details[i],d.details[i]+' '+d.backup]),faq:[[d.faq[0],d.hours],[d.faq[1],d.approve],[d.faq[2],d.backup]],formIntro:f.fill};
 const m=Object.fromEntries(source.map((key,i)=>[key,b[i]==='@fees'?d.fees:b[i]]));
 const runtime=f.runtime.split('|');if(runtime.length!==16)throw Error('Incomplete runtime '+lang);
 keys.slice(75,91).forEach((key,i)=>m[key]=runtime[i]);
 m[keys[91]]=l[21];m[keys[92]]=l[22];m[keys[93]]=f.notice;
 const extras=[b[16],l[22],b[16]+' / '+b[22],b[24]+' / IMEI',f.fill,f.id,f.idNone,f.idError,f.addrOptional,f.addrLater,f.allRequired,f.id,f.idNone,f.modelRequired,f.technical,f.invoice,f.addrRequired,f.invoiceFor,f.private,f.company,b[56],f.purpose,f.board,f.power,f.required,f.id,f.modelOptional,f.technical,f.addrRequired,d.approve,f.payment,d.backup,f.unlock,f.atDropoff,f.noLock,f.password,f.pattern,f.unlockHelp,f.patternHelp,f.pinPass,f.pinPattern,f.consolePin,f.patternOrder];
 if(extras.length!==43)throw Error('Invalid expanded keys '+lang);
 keys.slice(94).forEach((key,i)=>m[key]=extras[i]);
 for(const key of keys)if(!m[key])throw Error('Missing expanded translation '+lang+' '+key);
 expandedFormTranslations[lang]=m;
}
