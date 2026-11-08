export const standingAvatarCopy={
  "de": [
    "Technik streikt?",
    "Ich kümmere mich darum.",
    "Keine Panik – ich hab den Dreh raus.",
    "✓ Reparatur fertig"
  ],
  "en": [
    "Tech trouble?",
    "I'll take care of it.",
    "No panic — I've got the knack.",
    "✓ Repair complete"
  ],
  "tr": [
    "Teknoloji aksıyor mu?",
    "Ben ilgilenirim.",
    "Panik yok — çözüm bende.",
    "✓ Onarım tamamlandı"
  ],
  "ro": [
    "Probleme cu tehnologia?",
    "Mă ocup personal.",
    "Fără panică — găsesc soluția.",
    "✓ Reparație finalizată"
  ],
  "uk": [
    "Техніка підводить?",
    "Я подбаю про це.",
    "Без паніки — знайду рішення.",
    "✓ Ремонт завершено"
  ],
  "es": [
    "¿Problemas técnicos?",
    "Yo me encargo.",
    "Sin pánico: le encuentro solución.",
    "✓ Reparación terminada"
  ],
  "sv": [
    "Teknikstrul?",
    "Jag tar hand om det.",
    "Ingen panik – jag hittar lösningen.",
    "✓ Reparation klar"
  ],
  "da": [
    "Teknikproblemer?",
    "Jeg tager mig af det.",
    "Ingen panik – jeg finder løsningen.",
    "✓ Reparation færdig"
  ],
  "ru": [
    "Техника подводит?",
    "Я об этом позабочусь.",
    "Без паники — найду решение.",
    "✓ Ремонт завершён"
  ],
  "zh": [
    "设备出问题了？",
    "交给我来处理。",
    "别着急，我来想办法。",
    "✓ 维修完成"
  ],
  "ja": [
    "機器の調子が悪い？",
    "私が対応します。",
    "慌てずに。解決策を探します。",
    "✓ 修理完了"
  ],
  "fr": [
    "Un souci technique ?",
    "Je m'en occupe.",
    "Pas de panique, je trouve la solution.",
    "✓ Réparation terminée"
  ],
  "pl": [
    "Kłopot z techniką?",
    "Zajmę się tym.",
    "Bez paniki – znajdę rozwiązanie.",
    "✓ Naprawa zakończona"
  ],
  "it": [
    "Problemi tecnici?",
    "Me ne occupo io.",
    "Niente panico: trovo la soluzione.",
    "✓ Riparazione completata"
  ],
  "el": [
    "Τεχνικό πρόβλημα;",
    "Θα το αναλάβω.",
    "Χωρίς πανικό – βρίσκω λύση.",
    "✓ Η επισκευή ολοκληρώθηκε"
  ],
  "bg": [
    "Технически проблем?",
    "Ще се погрижа.",
    "Без паника – ще намеря решение.",
    "✓ Ремонтът е завършен"
  ],
  "hr": [
    "Tehnički problem?",
    "Ja ću se pobrinuti.",
    "Bez panike – pronaći ću rješenje.",
    "✓ Popravak završen"
  ],
  "ar": [
    "مشكلة تقنية؟",
    "سأتولى الأمر.",
    "لا داعي للقلق، سأجد الحل.",
    "✓ اكتمل الإصلاح"
  ],
  "fa": [
    "مشکل فنی دارید؟",
    "من رسیدگی می‌کنم.",
    "نگران نباشید؛ راه‌حل را پیدا می‌کنم.",
    "✓ تعمیر تمام شد"
  ]
};
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
export function standingCaption(lang){const c=standingAvatarCopy[lang];if(!c)throw Error('Missing standing avatar language: '+lang);return '<span class="repair-helper-slogan"><strong>'+esc(c[0])+'</strong><span>'+esc(c[1])+'</span></span><span class="repair-helper-result" data-repair-result data-quip="'+esc(c[2])+'" data-complete="'+esc(c[3])+'" aria-hidden="true">&#160;</span>';}
