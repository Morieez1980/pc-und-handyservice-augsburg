import {compactHomeTitles} from './compact-home.mjs';
import {homeContactStrip} from './home-contact-strip.mjs';
import {repairHelper} from './repair-helper.mjs';
import {homeRequestNotice} from './home-request-notice.mjs';
import {homeVisit} from './home-visit.mjs';

import {localMotto} from './service-positioning.mjs';
import {premisesTrust} from './premises-trust.mjs';
import {arrivalPhoto} from './arrival-photo.mjs';

import {homeIntroLead,homeIntroExperience,homeIntroVisit} from './home-intro-lead.mjs';

const esc=value=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');

export function homeIntro(lang,{title,requestLabel,serviceLabels,programPreview}){
 const request=lang==='de'?'/reparaturanfrage':`/${lang}/reparaturanfrage`;
 if(!programPreview)throw Error('Missing homepage program preview: '+lang);
 if(!homeRequestNotice[lang])throw Error('Missing homepage request notice: '+lang);
 const v=homeVisit[lang];if(!v)throw Error('Missing visit notice: '+lang);
 return `<!-- home-first-screen:start --><div class="home-first-screen"><section class="home-intro" aria-labelledby="home-intro-title">
 <div class="home-intro-copy"><p class="home-intro-eyebrow">${esc(homeIntroExperience[lang])}</p>
 <a class="home-visit-notice" href="#anfahrt"><svg aria-hidden="true" viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.7"><path d="m3 11 9-8 9 8M5 9v12h14V9M9 21v-8h6v8"/></svg><span><strong>${esc(v[0])}</strong><span>${esc(v[1])}</span></span><span class="home-visit-arrow" aria-hidden="true">↘</span></a>
 <h1 id="home-intro-title">${esc(compactHomeTitles[lang]||title)}</h1><p class="home-intro-motto">${esc(localMotto[lang])}</p><p class="owner-story">${esc(homeIntroLead[lang])}</p><ul class="home-intro-services">${serviceLabels.map(label=>`<li>${esc(label)}</li>`).join('')}</ul>${repairHelper(lang)}</div>
 <div class="home-overview">
 <div class="home-intro-links"><a class="home-review-card" href="/#bewertungen" hreflang="de"><strong class="review-proof" data-verified-at="2026-11-05">4,9 / 5 <span aria-hidden="true">★</span> · 97</strong><span>${esc(premisesTrust[lang][2])} →</span></a></div>
 <div class="home-service-card"><span class="home-service-check" aria-hidden="true">✓</span><div><p class="home-intro-visit"><strong>${esc(homeIntroVisit[lang][0])}</strong><span>${esc(v[3])}</span></p><a class="home-arrival-card" href="#anfahrt">${esc(v[2])} →</a></div></div>
 <div class="home-intro-action-group"><div class="home-intro-actions"><a class="button button-primary" href="${request}" aria-describedby="home-request-note">${esc(requestLabel)} →</a><a class="home-intro-phone" href="tel:+4915254530080">0152 54530080</a><a class="home-intro-whatsapp" href="https://wa.me/4915254530080" rel="noopener noreferrer">WhatsApp</a></div><p class="home-request-note" id="home-request-note">${esc(homeRequestNotice[lang])}</p></div>
 </div>${programPreview}</section>${homeContactStrip(lang)}</div><!-- home-first-screen:end -->`;
}
