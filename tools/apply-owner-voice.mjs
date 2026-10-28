import fs from 'node:fs';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {soleOwnerText,ownerIntro} from '../locales/sole-owner.mjs';
const root=path.resolve(import.meta.dirname,'..');
// Root pages are German originals; reviews and repair case source files stay untouched.
for(const file of fs.readdirSync(root).filter(f=>f.endsWith('.html'))){
 let h=fs.readFileSync(path.join(root,file),'utf8');
 h=h.replace(/(<script\b[^>]*>[\s\S]*?<\/script>|<[^>]+>)|([^<]+)/gi,(all,tag,text)=>tag||soleOwnerText(text,'de'));
 if(file==='index.html')h=h.replace(/<p class="hero-lead">[\s\S]*?<\/p>/,'<p class="hero-lead">'+ownerIntro.de+'</p>');
 // Match visible FAQ wording in JSON-LD without modifying schema keys or prices.
 h=h.replace(/(<script[^>]*type="application\/ld\+json"[^>]*>)([\s\S]*?)(<\/script>)/g,(all,open,json,close)=>{const data=JSON.parse(json);const walk=v=>Array.isArray(v)?v.map(walk):v&&typeof v==='object'?Object.fromEntries(Object.entries(v).map(([k,x])=>[k,['text','description'].includes(k)&&typeof x==='string'?soleOwnerText(x,'de'):walk(x)])):v;return open+JSON.stringify(walk(data),null,2)+close;});
 fs.writeFileSync(path.join(root,file),h);
}
const home=fs.readFileSync(path.join(root,'index.html'),'utf8');
const jsonLd=home.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/)[1].replace(/\r\n/g,'\n');
const hash='sha256-'+createHash('sha256').update(jsonLd).digest('base64');
const header=path.join(root,'_headers');
fs.writeFileSync(header,fs.readFileSync(header,'utf8').replace(/sha256-[A-Za-z0-9+/=]+/,hash));
