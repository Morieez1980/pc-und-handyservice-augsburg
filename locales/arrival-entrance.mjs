const copy={
 de:['Hauseingang im Autohof','Eingangsfoto vergrößern'],
 en:['Entrance in the rear courtyard','Enlarge entrance photo'],
 tr:['Arka avludaki bina girişi','Giriş fotoğrafını büyüt'],
 ro:['Intrarea în clădire din curtea din spate','Mărește fotografia intrării'],
 uk:['Вхід у будівлю в задньому дворі','Збільшити фото входу'],
 es:['Entrada del edificio en el patio trasero','Ampliar foto de la entrada'],
 sv:['Husentrén på bakgården','Förstora entrébilden'],
 da:['Indgangen i baggården','Forstør billedet af indgangen'],
 ru:['Вход в здание в заднем дворе','Увеличить фото входа'],
 zh:['后院的楼房入口','放大入口照片'],
 ja:['裏の中庭にある建物入口','入口の写真を拡大'],
 fr:['Entrée du bâtiment dans la cour arrière','Agrandir la photo de l’entrée'],
 pl:['Wejście do budynku na tylnym dziedzińcu','Powiększ zdjęcie wejścia'],
 it:['Ingresso dell’edificio nel cortile posteriore','Ingrandisci la foto dell’ingresso'],
 el:['Είσοδος κτιρίου στην πίσω αυλή','Μεγέθυνση φωτογραφίας εισόδου'],
 bg:['Входът на сградата в задния двор','Увеличаване на снимката на входа'],
 hr:['Ulaz u zgradu u stražnjem dvorištu','Povećaj fotografiju ulaza'],
 ar:['مدخل المبنى في الساحة الخلفية','تكبير صورة المدخل'],
 fa:['ورودی ساختمان در حیاط پشتی','بزرگ‌نمایی عکس ورودی']
};
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
export function arrivalEntrance(lang){
 const c=copy[lang];if(!c)throw Error('Missing entrance-photo translation: '+lang);
 const image='/bilder/hauseingang-autohof-20261108.webp';
 return `<figure class="arrival-entrance"><a href="${image}" target="_blank" rel="noopener noreferrer" aria-label="${esc(c[1])}"><img src="${image}" width="1280" height="960" loading="lazy" decoding="async" alt="${esc(c[0])} · Stätzlinger Straße 99, Augsburg"></a><figcaption>${esc(c[0])} · <a href="${image}" target="_blank" rel="noopener noreferrer">${esc(c[1])} ↗</a></figcaption></figure>`;
}
