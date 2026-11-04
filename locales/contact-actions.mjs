import {localeContent} from './content.mjs';
const esc=value=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');

// Keep the same three direct choices for offers instead of hiding a WhatsApp-only destination.
export function offerContactActions(lang){
 const labels=lang==='de'?{request:'Reparatur anfragen',call:'Anrufen',contact:'Kontakt'}:{request:localeContent[lang]?.labels[5],call:localeContent[lang]?.labels[6],contact:localeContent[lang]?.labels[4]};
 if(!labels.request||!labels.call||!labels.contact)throw Error('Missing contact action labels: '+lang);
 const request=lang==='de'?'/reparaturanfrage':`/${lang}/reparaturanfrage`;
 return `<div class="offer-contact-actions" role="group" aria-label="${esc(labels.contact)}"><a class="button button-primary" href="${request}">${esc(labels.request)} →</a><a class="button button-outline" href="tel:+4915254530080" aria-label="${esc(labels.call)}: 0152 54530080">0152 54530080</a><a class="button button-outline" href="https://wa.me/4915254530080" rel="noopener noreferrer">WhatsApp</a></div>`;
}
