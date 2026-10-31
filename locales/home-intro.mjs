import {compactArrival} from './arrival-compact.mjs';
import {ownerStory,localMotto,servicePositioning} from './service-positioning.mjs';
import {premisesTrust} from './premises-trust.mjs';
import {arrivalPhoto} from './arrival-photo.mjs';

const esc=value=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');

export function homeIntro(lang,{title,requestLabel,serviceLabels,programPreview}){
 const request=lang==='de'?'/reparaturanfrage':`/${lang}/reparaturanfrage`;
 if(!programPreview)throw Error('Missing homepage program preview: '+lang);
 return `<section class="home-intro" aria-labelledby="home-intro-title"><div class="home-intro-copy"><p class="home-intro-eyebrow">${esc(compactArrival[lang][0])}</p><h1 id="home-intro-title">${esc(title)}</h1><p class="home-intro-motto">${esc(localMotto[lang])}</p><p class="owner-story">${esc(ownerStory[lang])}</p><ul class="home-intro-services">${serviceLabels.map(label=>`<li>${esc(label)}</li>`).join('')}</ul><div class="home-intro-actions"><a class="button button-primary" href="${request}">${esc(requestLabel)} →</a><a class="home-intro-phone" href="tel:+4915254530080">0152 54530080</a><a class="home-intro-whatsapp" href="https://wa.me/4915254530080" rel="noopener noreferrer">WhatsApp</a></div></div><div class="home-overview"><div class="home-service-card"><span class="home-service-check" aria-hidden="true">✓</span><p class="home-intro-visit">${esc(servicePositioning[lang][1])}</p></div><div class="home-intro-links"><a class="home-review-card" href="/#bewertungen" hreflang="de"><strong class="review-proof" data-verified-at="2026-10-30">4,9 / 5 <span aria-hidden="true">★</span> · 96</strong><span>${esc(premisesTrust[lang][2])} →</span></a><a class="home-arrival-card" href="#anfahrt"><svg aria-hidden="true" viewBox="0 0 24 24" width="25" height="25" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></svg><span>${esc(arrivalPhoto[lang][0])} ↓</span></a></div>${programPreview}</div></section>`;
}
