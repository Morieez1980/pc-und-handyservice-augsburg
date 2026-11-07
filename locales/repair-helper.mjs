const copy={
  "de": [
    "Klick mich",
    "Technik zickt? Ich schaue nach.",
    "Beschreiben Sie mir kurz Ihr Anliegen. Ich melde mich persönlich. Termine nach Vereinbarung.",
    "Schließen",
    "Reparatur anfragen",
    "Anrufen"
  ],
  "en": [
    "Click me",
    "Tech acting up? I will take a look.",
    "Tell me briefly what is wrong. I will reply personally. Visits by appointment.",
    "Close",
    "Request a repair",
    "Call"
  ],
  "tr": [
    "Bana tıklayın",
    "Cihaz naz mı yapıyor? Bir bakalım.",
    "Sorununuzu kısaca anlatın. Size şahsen yanıt vereceğim. Ziyaretler randevuyla yapılır.",
    "Kapat",
    "Onarım talebi",
    "Ara"
  ],
  "ro": [
    "Apăsați aici",
    "Tehnica face figuri? Mă uit eu.",
    "Descrieți pe scurt problema. Vă voi răspunde personal. Vizite cu programare.",
    "Închide",
    "Solicită reparație",
    "Sună"
  ],
  "uk": [
    "Натисніть тут",
    "Техніка вередує? Я перевірю.",
    "Коротко опишіть проблему. Я відповім особисто. Візити за записом.",
    "Закрити",
    "Запит на ремонт",
    "Зателефонувати"
  ],
  "es": [
    "Pulse aquí",
    "¿La tecnología se rebela? Le echo un vistazo.",
    "Describa brevemente el problema. Le responderé personalmente. Visitas con cita.",
    "Cerrar",
    "Solicitar reparación",
    "Llamar"
  ],
  "sv": [
    "Klicka här",
    "Tekniken krånglar? Jag tar en titt.",
    "Beskriv problemet kort. Jag svarar personligen. Besök efter tidsbokning.",
    "Stäng",
    "Begär reparation",
    "Ring"
  ],
  "da": [
    "Klik her",
    "Driller teknikken? Jeg tager et kig.",
    "Beskriv kort problemet. Jeg svarer personligt. Besøg efter aftale.",
    "Luk",
    "Anmod om reparation",
    "Ring"
  ],
  "ru": [
    "Нажмите здесь",
    "Техника капризничает? Я посмотрю.",
    "Кратко опишите проблему. Я отвечу лично. Визиты по записи.",
    "Закрыть",
    "Запрос на ремонт",
    "Позвонить"
  ],
  "zh": [
    "点我联系",
    "设备闹脾气？我来看看。",
    "请简要说明问题，我会亲自回复。到访须提前预约。",
    "关闭",
    "申请维修",
    "致电"
  ],
  "ja": [
    "クリックしてね",
    "機器がご機嫌ななめ？私が見てみます。",
    "症状を簡単にお知らせください。私が直接ご返信します。ご来訪は予約制です。",
    "閉じる",
    "修理を依頼",
    "電話"
  ],
  "pl": [
    "Kliknij tutaj",
    "Technika kaprysi? Przyjrzę się temu.",
    "Proszę krótko opisać problem. Odpowiem osobiście. Wizyty po umówieniu.",
    "Zamknij",
    "Zleć naprawę",
    "Zadzwoń"
  ],
  "it": [
    "Clicca qui",
    "La tecnologia fa i capricci? Ci do un’occhiata.",
    "Descriva brevemente il problema. Risponderò personalmente. Visite su appuntamento.",
    "Chiudi",
    "Richiedi riparazione",
    "Chiama"
  ],
  "fr": [
    "Cliquez ici",
    "La technique fait des siennes ? Je regarde.",
    "Décrivez brièvement le problème. Je vous répondrai personnellement. Visites sur rendez-vous.",
    "Fermer",
    "Demander une réparation",
    "Appeler"
  ],
  "bg": [
    "Натиснете тук",
    "Техниката се инати? Ще погледна.",
    "Опишете накратко проблема. Ще ви отговоря лично. Посещения с уговорен час.",
    "Затвори",
    "Заявка за ремонт",
    "Обаждане"
  ],
  "hr": [
    "Kliknite ovdje",
    "Tehnika se buni? Pogledat ću.",
    "Ukratko opišite problem. Odgovorit ću osobno. Posjeti uz dogovoreni termin.",
    "Zatvori",
    "Zatraži popravak",
    "Nazovi"
  ],
  "el": [
    "Πατήστε εδώ",
    "Η τεχνολογία κάνει νάζια; Θα το κοιτάξω.",
    "Περιγράψτε σύντομα το πρόβλημα. Θα απαντήσω προσωπικά. Επισκέψεις με ραντεβού.",
    "Κλείσιμο",
    "Αίτημα επισκευής",
    "Κλήση"
  ],
  "ar": [
    "اضغط هنا",
    "الجهاز يعاند؟ سألقي نظرة.",
    "اشرح المشكلة باختصار. سأرد عليك شخصيًا. الزيارات بموعد مسبق.",
    "إغلاق",
    "طلب إصلاح",
    "اتصال"
  ],
  "fa": [
    "اینجا کلیک کنید",
    "دستگاه بدقلقی می‌کند؟ بررسی می‌کنم.",
    "مشکل را کوتاه توضیح دهید. شخصاً پاسخ می‌دهم. مراجعه با وقت قبلی است.",
    "بستن",
    "درخواست تعمیر",
    "تماس"
  ]
};
const avatar='<span class="repair-avatar" aria-hidden="true"><img src="/bilder/reparatur-avatar-erwachsen-20261107.png" width="96" height="112" alt="" decoding="async"><span class="repair-avatar-frames"></span></span>';
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
export function repairHelper(lang){
 const c=copy[lang];if(!c)throw Error('Missing contact helper locale: '+lang);
 const request=lang==='de'?'/reparaturanfrage':'/'+lang+'/reparaturanfrage';
 return '<div class="repair-helper" data-repair-helper><button type="button" class="repair-helper-toggle" aria-expanded="false" aria-controls="repair-helper-panel" hidden>'+avatar+'<span>'+esc(c[0])+'</span></button><div class="repair-helper-panel" id="repair-helper-panel" role="dialog" aria-modal="false" aria-labelledby="repair-helper-title" hidden><button type="button" class="repair-helper-close" aria-label="'+esc(c[3])+'">×</button>'+avatar+'<p class="repair-helper-owner">Maurice Keil · PC &amp; Handyservice</p><h2 id="repair-helper-title">'+esc(c[1])+'</h2><p>'+esc(c[2])+'</p><div class="repair-helper-contacts"><a href="'+request+'">'+esc(c[4])+' →</a><a href="tel:+4915254530080">'+esc(c[5])+' · 0152 54530080</a><a href="https://wa.me/4915254530080" rel="noopener noreferrer">WhatsApp →</a></div></div></div>';
}
