import {localeContent} from './content.mjs';
const words={
 de:['Vor Ort in Augsburg-Lechhausen','Termine · nur nach Bestätigung','Mo–Fr 10–20 Uhr · Sa 10–16 Uhr · So geschlossen'],
 en:['Local service in Augsburg-Lechhausen','Appointments · confirmation required','Mon–Fri 10–20 · Sat 10–16 · Sun closed'],
 tr:['Augsburg-Lechhausen’da','Randevu · onay gereklidir','Pzt–Cum 10–20 · Cmt 10–16 · Paz kapalı'],
 ro:['În Augsburg-Lechhausen','Programări · numai cu confirmare','Lu–Vi 10–20 · Sâ 10–16 · Du închis'],
 uk:['В Аугсбурзі-Лехгаузені','Запис · лише після підтвердження','Пн–Пт 10–20 · Сб 10–16 · Нд зачинено'],
 es:['En Augsburg-Lechhausen','Citas · solo con confirmación','Lun–vie 10–20 · Sáb 10–16 · Dom cerrado'],
 sv:['På plats i Augsburg-Lechhausen','Bokning · bekräftelse krävs','Mån–fre 10–20 · Lör 10–16 · Sön stängt'],
 da:['I Augsburg-Lechhausen','Aftaler · kun efter bekræftelse','Man–fre 10–20 · Lør 10–16 · Søn lukket'],
 ru:['В Аугсбурге-Леххаузене','Приём · только после подтверждения','Пн–Пт 10–20 · Сб 10–16 · Вс закрыто'],
 zh:['Augsburg-Lechhausen 本地服务','预约 · 须先获得确认','周一至周五 10–20 · 周六 10–16 · 周日休息'],
 ja:['Augsburg-Lechhausen','ご予約 · 事前の確認が必要です','月–金 10–20 · 土 10–16 · 日曜休み'],
 pl:['Na miejscu w Augsburg-Lechhausen','Wizyty · po potwierdzeniu','Pn–pt 10–20 · Sob 10–16 · Nd zamknięte'],
 it:['Ad Augsburg-Lechhausen','Appuntamenti · previa conferma','Lun–ven 10–20 · Sab 10–16 · Dom chiuso'],
 fr:['À Augsburg-Lechhausen','Rendez-vous · après confirmation','Lun–ven 10–20 · Sam 10–16 · Dim fermé'],
 bg:['В Аугсбург-Леххаузен','Посещения · след потвърждение','Пн–Пт 10–20 · Сб 10–16 · Нд затворено'],
 hr:['U Augsburg-Lechhausenu','Termini · uz potvrdu','Pon–pet 10–20 · Sub 10–16 · Ned zatvoreno'],
 el:['Στο Augsburg-Lechhausen','Ραντεβού · με επιβεβαίωση','Δευ–Παρ 10–20 · Σάβ 10–16 · Κυρ κλειστά'],
 ar:['في Augsburg-Lechhausen','المواعيد · بعد التأكيد فقط','الإثنين–الجمعة 10–20 · السبت 10–16 · الأحد مغلق'],
 fa:['در Augsburg-Lechhausen','مراجعه · فقط پس از تأیید','دوشنبه–جمعه ۱۰–۲۰ · شنبه ۱۰–۱۶ · یکشنبه تعطیل']
};
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
export function homeContactStrip(lang){
 const w=words[lang];if(!w)throw Error('Missing location strip: '+lang);
 const route=localeContent[lang]?.labels[16]||'Anfahrt';
 return `<section class="quick-contact" aria-label="${esc(localeContent[lang]?.labels[22]||'Kontakt auf einen Blick')}"><div class="quick-location"><span class="quick-icon" aria-hidden="true">📍</span><p><small>${esc(w[0])}</small><strong>Stätzlinger Straße 99</strong><a href="#anfahrt">${esc(route)}${lang==='de'?' · Hinterhaus':''} ↗</a></p></div><div><p><small>${esc(localeContent[lang]?.labels[6]||'Telefon')} · WhatsApp</small><a href="tel:+4915254530080" dir="ltr">0152 54530080</a><a href="https://wa.me/4915254530080">WhatsApp ↗</a></p></div><div><p><small>E-Mail</small><a href="mailto:keil.maurice1980@gmail.com">keil.maurice1980@gmail.com</a></p></div><div class="quick-hours"><span class="quick-icon" aria-hidden="true">◷</span><p><small>${esc(w[1])}</small><strong>${esc(w[2])}</strong></p></div></section>`;
}
