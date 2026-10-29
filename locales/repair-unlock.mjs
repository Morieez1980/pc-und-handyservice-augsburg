const keys = [
  'Geräteentsperrung (optional)',
  'Bei Geräteabgabe mitteilen',
  'Keine Sperre vorhanden',
  'Passwort',
  'Muster',
  'Nur die Geräteentsperrung für die Reparatur angeben. Keine Passwörter für E-Mail, Apple, Google oder andere Onlinekonten. Alternativ bei Geräteabgabe mitteilen.',
  'Muster: Punkte zeilenweise von 1 bis 9 nummerieren (oben 1–2–3, Mitte 4–5–6, unten 7–8–9), dann die Reihenfolge eingeben.',
  'PIN oder Passwort (optional)',
  'PIN, Passwort oder Muster (optional)',
  'Konsolen-PIN oder Passwort (falls nötig)',
  'Muster – Reihenfolge der Punkte'
];
const rows = {
  en: ['Device unlock (optional)', 'Provide when handing over the device', 'No screen lock', 'Password', 'Pattern', 'Only provide the device unlock needed for repair. No passwords for email, Apple, Google or other online accounts. You can also provide it when handing over the device.', 'Pattern: number the dots row by row from 1 to 9 (top 1–2–3, middle 4–5–6, bottom 7–8–9), then enter the sequence.', 'PIN or password (optional)', 'PIN, password or pattern (optional)', 'Console PIN or password (if needed)', 'Pattern – dot sequence'],
  tr: ['Cihaz kilidi (isteğe bağlı)', 'Cihazı teslim ederken bildireceğim', 'Ekran kilidi yok', 'Parola', 'Desen', 'Yalnızca onarım için gereken cihaz kilidini belirtin. E-posta, Apple, Google veya diğer çevrimiçi hesapların parolalarını yazmayın. Cihazı teslim ederken de bildirebilirsiniz.', 'Desen: noktaları satır satır 1–9 olarak numaralandırın (üst 1–2–3, orta 4–5–6, alt 7–8–9), ardından sırayı girin.', 'PIN veya parola (isteğe bağlı)', 'PIN, parola veya desen (isteğe bağlı)', 'Konsol PIN’i veya parolası (gerekirse)', 'Desen – nokta sırası'],
  ro: ['Deblocarea dispozitivului (opțional)', 'Comunic la predarea dispozitivului', 'Fără blocare', 'Parolă', 'Model', 'Indicați doar codul de deblocare necesar reparației. Nu introduceți parole pentru e-mail, Apple, Google sau alte conturi online. Îl puteți comunica și la predarea dispozitivului.', 'Model: numerotați punctele pe rânduri de la 1 la 9 (sus 1–2–3, mijloc 4–5–6, jos 7–8–9), apoi introduceți ordinea.', 'PIN sau parolă (opțional)', 'PIN, parolă sau model (opțional)', 'PIN sau parolă pentru consolă (dacă este necesar)', 'Model – ordinea punctelor'],
  uk: ['Розблокування пристрою (необов’язково)', 'Повідомлю під час передачі пристрою', 'Блокування немає', 'Пароль', 'Графічний ключ', 'Вкажіть лише дані розблокування пристрою для ремонту. Не вводьте паролі від пошти, Apple, Google та інших онлайн-акаунтів. Їх можна повідомити під час передачі пристрою.', 'Графічний ключ: пронумеруйте точки по рядах від 1 до 9 (верхній 1–2–3, середній 4–5–6, нижній 7–8–9), потім введіть послідовність.', 'PIN або пароль (необов’язково)', 'PIN, пароль або графічний ключ (необов’язково)', 'PIN або пароль консолі (за потреби)', 'Графічний ключ – послідовність точок'],
  es: ['Desbloqueo del dispositivo (opcional)', 'Lo indicaré al entregar el dispositivo', 'Sin bloqueo', 'Contraseña', 'Patrón', 'Indique solo el desbloqueo del dispositivo necesario para la reparación. No incluya contraseñas de correo, Apple, Google u otras cuentas en línea. También puede indicarlo al entregar el dispositivo.', 'Patrón: numere los puntos por filas del 1 al 9 (arriba 1–2–3, centro 4–5–6, abajo 7–8–9) e introduzca la secuencia.', 'PIN o contraseña (opcional)', 'PIN, contraseña o patrón (opcional)', 'PIN o contraseña de la consola (si hace falta)', 'Patrón – secuencia de puntos'],
  sv: ['Lås upp enheten (valfritt)', 'Lämnas när enheten lämnas in', 'Inget skärmlås', 'Lösenord', 'Mönster', 'Ange endast enhetens upplåsning för reparationen. Ange inga lösenord för e-post, Apple, Google eller andra onlinekonton. Du kan också lämna uppgiften när enheten lämnas in.', 'Mönster: numrera punkterna radvis från 1 till 9 (överst 1–2–3, mitten 4–5–6, nederst 7–8–9) och ange sedan ordningen.', 'PIN eller lösenord (valfritt)', 'PIN, lösenord eller mönster (valfritt)', 'Konsolens PIN eller lösenord (vid behov)', 'Mönster – punktordning'],
  da: ['Oplåsning af enheden (valgfrit)', 'Oplyses ved aflevering af enheden', 'Ingen skærmlås', 'Adgangskode', 'Mønster', 'Angiv kun enhedens oplåsning til reparationen. Ingen adgangskoder til e-mail, Apple, Google eller andre onlinekonti. Du kan også oplyse det ved aflevering af enheden.', 'Mønster: nummerér punkterne rækkevis fra 1 til 9 (øverst 1–2–3, midten 4–5–6, nederst 7–8–9), og indtast derefter rækkefølgen.', 'PIN eller adgangskode (valgfrit)', 'PIN, adgangskode eller mønster (valgfrit)', 'Konsollens PIN eller adgangskode (hvis nødvendigt)', 'Mønster – punkternes rækkefølge'],
  ru: ['Разблокировка устройства (необязательно)', 'Сообщу при передаче устройства', 'Блокировки нет', 'Пароль', 'Графический ключ', 'Укажите только данные разблокировки устройства для ремонта. Не вводите пароли от почты, Apple, Google и других онлайн-аккаунтов. Можно сообщить их при передаче устройства.', 'Графический ключ: пронумеруйте точки по рядам от 1 до 9 (верхний 1–2–3, средний 4–5–6, нижний 7–8–9), затем введите последовательность.', 'PIN или пароль (необязательно)', 'PIN, пароль или графический ключ (необязательно)', 'PIN или пароль консоли (при необходимости)', 'Графический ключ – последовательность точек'],
  zh: ['设备解锁（可选）', '交付设备时提供', '没有屏幕锁', '密码', '图案', '仅提供维修所需的设备解锁信息。请勿填写邮箱、Apple、Google 或其他在线账户的密码。也可在交付设备时提供。', '图案：将圆点按行编号为 1 至 9（上排 1–2–3，中排 4–5–6，下排 7–8–9），然后输入顺序。', 'PIN 或密码（可选）', 'PIN、密码或图案（可选）', '游戏机 PIN 或密码（如有需要）', '图案 — 圆点顺序'],
  ja: ['端末のロック解除（任意）', '端末をお預けの際に伝える', '画面ロックなし', 'パスワード', 'パターン', '修理に必要な端末のロック解除情報のみ入力してください。メール、Apple、Google、その他オンラインアカウントのパスワードは入力しないでください。端末をお預けの際にもお伝えいただけます。', 'パターン：点を行ごとに 1～9 と番号付けし（上 1–2–3、中央 4–5–6、下 7–8–9）、順番を入力してください。', 'PIN またはパスワード（任意）', 'PIN、パスワードまたはパターン（任意）', 'ゲーム機の PIN またはパスワード（必要な場合）', 'パターン — 点の順番']
};
export const repairUnlockTranslations = Object.fromEntries(Object.entries(rows).map(([lang, values]) => {
  if (values.length !== keys.length) throw new Error('Incomplete unlock translations: ' + lang);
  return [lang, Object.fromEntries(keys.map((key, index) => [key, values[index]]))];
}));

const accessKeys = [
  'Gerätezugang (bitte auswählen)',
  'Bitte auswählen',
  'Bei Abgabe persönlich entsperren / Zugang klären',
  'PIN / Kennwort nicht bekannt',
  'Die Auswahl ist erforderlich, ein Code im Onlineformular nicht. Ohne Gerätezugang kläre ich die Möglichkeiten mit Ihnen. Kein Zurücksetzen oder Löschen ohne gesonderte Freigabe.'
];
export const repairAccessTranslationKeys = accessKeys.filter(key => key !== 'Bitte auswählen');
const accessRows = {
  en: ['Device access (please choose)', 'Please choose', 'Unlock in person / arrange access at handover', 'PIN / password unknown', 'Please choose an option; entering a code online is optional. If access is unavailable, I will discuss the options with you. No reset or deletion without separate approval.'],
  tr: ['Cihaza erişim (lütfen seçin)', 'Lütfen seçin', 'Teslimde kendim açacağım / erişimi görüşeceğim', 'PIN / parola bilinmiyor', 'Bir seçenek seçilmelidir; çevrimiçi kod girmek zorunlu değildir. Erişim yoksa seçenekleri sizinle görüşürüm. Ayrı onayınız olmadan sıfırlama veya silme yapılmaz.'],
  ro: ['Acces la dispozitiv (alegeți)', 'Alegeți', 'Deblochez personal / clarific accesul la predare', 'PIN / parolă necunoscută', 'Alegerea este obligatorie, introducerea codului online nu. Dacă accesul lipsește, discut opțiunile cu dumneavoastră. Fără resetare sau ștergere fără acord separat.'],
  uk: ['Доступ до пристрою (оберіть)', 'Оберіть', 'Розблокую особисто / узгоджу доступ при передачі', 'PIN / пароль невідомий', 'Потрібно обрати варіант; вводити код онлайн необов’язково. Якщо доступу немає, я обговорю з вами можливості. Без окремої згоди скидання чи видалення не проводиться.'],
  es: ['Acceso al dispositivo (elija)', 'Elija una opción', 'Desbloquearé en persona / acordaré el acceso al entregarlo', 'PIN / contraseña desconocido', 'Debe elegir una opción; introducir un código en línea es opcional. Sin acceso, consultaré las posibilidades con usted. No se restablece ni borra sin autorización aparte.'],
  sv: ['Åtkomst till enheten (välj)', 'Välj ett alternativ', 'Låser upp personligen / ordnar åtkomst vid inlämning', 'PIN / lösenord okänt', 'Välj ett alternativ; du behöver inte ange en kod online. Saknas åtkomst diskuterar jag alternativen med dig. Ingen återställning eller radering utan separat godkännande.'],
  da: ['Adgang til enheden (vælg)', 'Vælg en mulighed', 'Låser selv op / aftaler adgang ved aflevering', 'PIN / adgangskode ukendt', 'Du skal vælge en mulighed; du behøver ikke skrive en kode online. Uden adgang aftaler jeg mulighederne med dig. Ingen nulstilling eller sletning uden særskilt godkendelse.'],
  ru: ['Доступ к устройству (выберите)', 'Выберите вариант', 'Разблокирую лично / согласую доступ при передаче', 'PIN / пароль неизвестен', 'Выбор обязателен; вводить код онлайн необязательно. Если доступа нет, я обсужу с вами варианты. Сброс и удаление — только с отдельного согласия.'],
  ja: ['端末へのアクセス（選択してください）', '選択してください', '引き渡し時に自分で解除／アクセス方法を相談', 'PIN・パスワード不明', '選択は必須ですが、オンラインでのコード入力は任意です。アクセスできない場合は対応方法をご相談します。別途同意なしに初期化や削除は行いません。'],
  zh: ['设备访问方式（请选择）', '请选择', '交付时亲自解锁／商定访问方式', '不知道 PIN／密码', '必须选择一项，但无需在线输入解锁码。若无法访问设备，我会与您协商处理方式。未经另行同意，不会重置或删除数据。'],
  pl: ['Dostęp do urządzenia (wybierz)', 'Wybierz opcję', 'Odblokuję osobiście / ustalę dostęp przy przekazaniu', 'PIN / hasło nieznane', 'Wybór jest wymagany, wpisanie kodu online nie. Jeśli dostęp jest niemożliwy, omówię z Państwem możliwości. Bez resetowania ani usuwania bez osobnej zgody.'],
  it: ['Accesso al dispositivo (scegliere)', 'Scegliere', 'Sblocco di persona / concordo l’accesso alla consegna', 'PIN / password sconosciuto', 'La scelta è obbligatoria, inserire un codice online no. Se manca l’accesso, discuterò le possibilità con lei. Nessun ripristino o cancellazione senza consenso separato.'],
  fr: ['Accès à l’appareil (à choisir)', 'Choisissez', 'Déverrouiller en personne / convenir de l’accès au dépôt', 'PIN / mot de passe inconnu', 'Le choix est obligatoire, la saisie du code en ligne ne l’est pas. Sans accès, je discuterai des possibilités avec vous. Aucune réinitialisation ni suppression sans accord distinct.'],
  bg: ['Достъп до устройството (изберете)', 'Изберете', 'Отключвам лично / уточнявам достъпа при предаване', 'Непознат PIN / парола', 'Изборът е задължителен, но код онлайн не се изисква. Без достъп ще обсъдя възможностите с вас. Без нулиране или изтриване без отделно съгласие.'],
  hr: ['Pristup uređaju (odaberite)', 'Odaberite', 'Osobno otključavam / dogovaram pristup pri predaji', 'PIN / lozinka nije poznata', 'Odabir je obavezan, unos koda na internetu nije. Ako nema pristupa, razgovarat ću s vama o mogućnostima. Nema vraćanja na tvorničke postavke ni brisanja bez posebnog odobrenja.'],
  el: ['Πρόσβαση στη συσκευή (επιλέξτε)', 'Επιλέξτε', 'Ξεκλείδωμα αυτοπροσώπως / συνεννόηση κατά την παράδοση', 'Άγνωστο PIN / συνθηματικό', 'Η επιλογή είναι υποχρεωτική, η εισαγωγή κωδικού online όχι. Αν δεν υπάρχει πρόσβαση, θα συζητήσω τις επιλογές μαζί σας. Καμία επαναφορά ή διαγραφή χωρίς ξεχωριστή έγκριση.'],
  ar: ['الوصول إلى الجهاز (يرجى الاختيار)', 'يرجى الاختيار', 'أفتح الجهاز شخصياً / أتفق على الوصول عند التسليم', 'رمز PIN / كلمة المرور غير معروفة', 'يجب اختيار أحد الخيارات، ولا يلزم إدخال الرمز عبر الإنترنت. إذا تعذر الوصول فسأناقش الخيارات معك. لن تتم إعادة الضبط أو الحذف دون موافقة منفصلة.'],
  fa: ['دسترسی به دستگاه (انتخاب کنید)', 'انتخاب کنید', 'هنگام تحویل شخصاً باز می‌کنم / دسترسی را هماهنگ می‌کنم', 'PIN / رمز عبور مشخص نیست', 'انتخاب گزینه الزامی است، اما وارد کردن رمز آنلاین الزامی نیست. اگر دسترسی ممکن نباشد، گزینه‌ها را با شما بررسی می‌کنم. بدون تأیید جداگانه بازنشانی یا حذف انجام نمی‌شود.']
};
for (const [lang, values] of Object.entries(accessRows)) {
  if (values.length !== accessKeys.length) throw new Error('Incomplete access translations: ' + lang);
  repairUnlockTranslations[lang] ||= {};
  Object.assign(repairUnlockTranslations[lang], Object.fromEntries(accessKeys.map((key, index) => [key, values[index]])));
}
