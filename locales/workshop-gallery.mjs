import images from './gallery-images.json' with {type:'json'};
export const galleryCopy={
de:['Einblicke in meine Werkstatt','Geräte, Bauteile und Reparaturschritte aus meinem Reparaturservice. Ein Bild anklicken, um es vollständig zu sehen.','Bild vergrößern','Reparaturbericht mit allen Details','Bilder & Werkstatt ansehen'],
en:['Inside my workshop','Devices, components and repair steps from my repair service. Select an image to see it in full.','Enlarge image','Read the full repair report','See workshop photos'],
tr:['Atölyemden görüntüler','Servisimden cihazlar, parçalar ve onarım adımları. Tam boy görmek için görsele dokunun.','Görseli büyüt','Ayrıntılı onarım raporu','Atölye fotoğrafları'],
ro:['Din atelierul meu','Dispozitive, componente și etape de reparație din service-ul meu. Selectați imaginea pentru a o vedea complet.','Mărește imaginea','Raportul complet al reparației','Vezi fotografiile atelierului'],
uk:['Моя майстерня','Пристрої, деталі та етапи ремонту в моєму сервісі. Натисніть зображення, щоб побачити його повністю.','Збільшити зображення','Повний звіт про ремонт','Переглянути фото майстерні'],
es:['Dentro de mi taller','Dispositivos, componentes y pasos de reparación de mi servicio. Seleccione una imagen para verla completa.','Ampliar imagen','Informe completo de reparación','Ver fotos del taller'],
sv:['Inblick i min verkstad','Enheter, delar och reparationssteg från min service. Välj en bild för att se hela bilden.','Förstora bilden','Läs hela reparationsrapporten','Se verkstadsbilder'],
da:['Indblik i mit værksted','Enheder, dele og reparationstrin fra min service. Vælg et billede for at se det i fuld størrelse.','Forstør billede','Læs hele reparationsrapporten','Se værkstedsbilleder'],
ru:['Моя мастерская','Устройства, компоненты и этапы ремонта в моём сервисе. Нажмите на изображение, чтобы увидеть его полностью.','Увеличить изображение','Полный отчёт о ремонте','Посмотреть фото мастерской'],
zh:['我的维修工作室','查看维修服务中的设备、零件和维修步骤。点击图片可查看完整大图。','放大图片','查看完整维修报告','查看工作室图片'],
ja:['工房の様子','修理サービスの機器、部品、作業工程をご覧いただけます。画像を選ぶと全体を表示します。','画像を拡大','修理レポートの詳細','工房の写真を見る'],
pl:['W moim warsztacie','Urządzenia, części i etapy napraw z mojego serwisu. Wybierz zdjęcie, aby zobaczyć je w całości.','Powiększ zdjęcie','Pełny raport z naprawy','Zobacz zdjęcia warsztatu'],
it:['Nel mio laboratorio','Dispositivi, componenti e fasi di riparazione del mio servizio. Seleziona una foto per vederla interamente.','Ingrandisci immagine','Leggi il rapporto completo','Guarda le foto del laboratorio'],
fr:['Dans mon atelier','Appareils, composants et étapes de réparation de mon service. Sélectionnez une image pour la voir en entier.','Agrandir l’image','Lire le rapport complet','Voir les photos de l’atelier'],
bg:['В моята работилница','Устройства, компоненти и етапи на ремонт от моя сервиз. Изберете снимка, за да я видите изцяло.','Увеличаване на снимката','Пълен отчет за ремонта','Снимки от работилницата'],
hr:['U mojoj radionici','Uređaji, dijelovi i koraci popravka iz mog servisa. Odaberite sliku za puni prikaz.','Povećaj sliku','Cijeli izvještaj o popravku','Pogledaj slike radionice'],
el:['Στο εργαστήριό μου','Συσκευές, εξαρτήματα και βήματα επισκευής από το σέρβις μου. Επιλέξτε μια εικόνα για πλήρη προβολή.','Μεγέθυνση εικόνας','Πλήρης αναφορά επισκευής','Δείτε φωτογραφίες του εργαστηρίου'],
ar:['من ورشتي','أجهزة ومكونات وخطوات إصلاح من خدمتي. اختر الصورة لرؤيتها كاملة.','تكبير الصورة','تقرير الإصلاح الكامل','شاهد صور الورشة'],
fa:['در کارگاه من','دستگاه‌ها، قطعات و مراحل تعمیر در خدمات من. برای دیدن تصویر کامل روی آن بزنید.','بزرگ‌نمایی تصویر','گزارش کامل تعمیر','دیدن عکس‌های کارگاه']
};
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
export function workshopGallery(lang,{price,pc,phone}){
 const c=galleryCopy[lang];if(!c)throw Error('Missing gallery translation: '+lang);
 const caption=p=>p.type==='brand'?'PC & Handyservice Augsburg – Maurice Keil':p.type==='price'?price+' (DE) · 30.10.2026':p.type==='iphone'?'iPhone SE (2020) · '+p.number:(p.type==='phone'?phone:pc)+' · '+p.number;
 return '<section class="workshop-gallery" id="bilder" data-workshop-gallery aria-labelledby="workshop-gallery-title"><header><h2 id="workshop-gallery-title">'+esc(c[0])+'</h2><p>'+esc(c[1])+'</p><a href="https://www.pc-und-handyservice-augsburg.com/reparaturberichte/iphone-se-2020-akkutausch" hreflang="de">'+esc(c[3])+' (DE) →</a></header><div class="workshop-gallery-grid">'+images.map(p=>'<figure><a href="'+esc(p.src)+'" target="_blank" rel="noopener noreferrer" aria-label="'+esc(c[2]+': '+caption(p))+'"><img src="'+esc(p.src)+'" width="'+p.width+'" height="'+p.height+'" loading="lazy" decoding="async" alt="'+esc(caption(p))+'"></a><figcaption>'+esc(caption(p))+'</figcaption></figure>').join('')+'</div></section>';
}
export const workshopGalleryLink=lang=>'<p class="workshop-gallery-shortcut"><a href="#bilder">'+esc(galleryCopy[lang][4])+' ↓</a></p>';
