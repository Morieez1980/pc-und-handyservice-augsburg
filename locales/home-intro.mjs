import {compactArrival} from './arrival-compact.mjs';
import {ownerStory,localMotto,servicePositioning} from './service-positioning.mjs';
import {premisesTrust} from './premises-trust.mjs';
import {arrivalPhoto} from './arrival-photo.mjs';

const esc=value=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');

export function homeIntro(lang,{title,requestLabel,serviceLabels}){
 const request=lang==='de'?'/reparaturanfrage':`/${lang}/reparaturanfrage`;
 return `<section class="home-intro" aria-labelledby="home-intro-title"><div class="home-intro-copy"><p class="home-intro-eyebrow">${esc(compactArrival[lang][0])}</p><h1 id="home-intro-title">${esc(title)}</h1><p class="home-intro-motto">${esc(localMotto[lang])}</p><p class="owner-story">${esc(ownerStory[lang])}</p><ul class="home-intro-services">${serviceLabels.map(label=>`<li>${esc(label)}</li>`).join('')}</ul><div class="home-intro-actions"><a class="button button-primary" href="${request}">${esc(requestLabel)} →</a><a class="home-intro-phone" href="tel:+4915254530080">0152 54530080</a><a class="home-intro-whatsapp" href="https://wa.me/4915254530080" rel="noopener noreferrer">WhatsApp</a></div><p class="home-intro-visit">${esc(servicePositioning[lang][1])}</p><div class="home-intro-links"><a href="/#bewertungen" hreflang="de"><span class="review-proof" data-verified-at="2026-10-30">4,9 / 5 ★ · 96</span> ${esc(premisesTrust[lang][2])}</a><a href="#anfahrt">${esc(arrivalPhoto[lang][0])} ↓</a></div></div><figure class="home-intro-brand"><img src="/logo-profil-20261014.png" width="1280" height="1280" alt="PC &amp; Handyservice Augsburg – Maurice Keil" fetchpriority="high" decoding="async"></figure></section>`;
}
