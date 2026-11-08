(() => {
 'use strict';
 const motionCopy = {
  de:['Animation pausieren','Animation fortsetzen'], en:['Pause animation','Resume animation'],
  tr:['Animasyonu duraklat','Animasyonu sürdür'], ro:['Pune animația pe pauză','Reia animația'],
  uk:['Призупинити анімацію','Продовжити анімацію'], es:['Pausar animación','Reanudar animación'],
  sv:['Pausa animering','Fortsätt animering'], da:['Sæt animation på pause','Fortsæt animation'],
  ru:['Приостановить анимацию','Продолжить анимацию'], zh:['暂停动画','继续动画'],
  ja:['アニメーションを一時停止','アニメーションを再開'], fr:['Mettre l’animation en pause','Reprendre l’animation'],
  pl:['Wstrzymaj animację','Wznów animację'], it:['Metti in pausa l’animazione','Riprendi l’animazione'],
  el:['Παύση κίνησης','Συνέχιση κίνησης'], bg:['Пауза на анимацията','Продължаване на анимацията'],
  hr:['Pauziraj animaciju','Nastavi animaciju'], ar:['إيقاف الحركة مؤقتًا','استئناف الحركة'],
  fa:['توقف پویانمایی','ادامه پویانمایی']
 };
 const dismissCopy = {
  de:'Kontaktblase ausblenden',en:'Hide contact bubble',tr:'İletişim balonunu gizle',ro:'Ascunde bula de contact',
  uk:'Сховати контактну бульбашку',es:'Ocultar burbuja de contacto',sv:'Dölj kontaktbubblan',da:'Skjul kontaktboblen',
  ru:'Скрыть контактный виджет',zh:'隐藏联系气泡',ja:'連絡バブルを閉じる',fr:'Masquer la bulle de contact',
  pl:'Ukryj dymek kontaktowy',it:'Nascondi il fumetto di contatto',el:'Απόκρυψη πλαισίου επικοινωνίας',
  bg:'Скриване на балончето за контакт',hr:'Sakrij oblačić za kontakt',ar:'إخفاء فقاعة التواصل',fa:'پنهان کردن حباب تماس'
 };
 // Move the existing translated helper instead of cloning it: exactly one
 // character, one animation controller and one set of contact controls.
 const original = document.querySelector('.home-intro [data-repair-helper]');
 if (original && document.body) {
  original.classList.add('repair-helper-floating');
  original.hidden = true;
  original.querySelector('.repair-helper-panel > .repair-avatar')?.remove();
  document.body.append(original);
 }
 let rigSequence = 0;
 for (const helper of document.querySelectorAll('[data-repair-helper]')) {
  const toggle = helper.querySelector('.repair-helper-toggle');
  const panel = helper.querySelector('.repair-helper-panel');
  const close = helper.querySelector('.repair-helper-close');
  if (!toggle || !panel || !close) continue;
  const mascot = toggle.querySelector('.repair-avatar');
  const frames = mascot?.querySelector('.repair-avatar-frames');
  let workScene = null;
  if (typeof frames?.replaceChildren === 'function' && typeof window.PCRepairWorkScene === 'function') {
   try {
    workScene = window.PCRepairWorkScene(frames,'repair-working-'+(++rigSequence));
    mascot.classList.add('repair-working-avatar');
   } catch { frames.replaceChildren(); }
  }
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let spriteReady = false;
  let userPaused = false;
  let motionOptIn = false;
  const floating = helper.classList.contains('repair-helper-floating');
  const motion = document.createElement('button');
  motion.type = 'button';
  motion.className = 'repair-helper-motion';
  motion.hidden = true;
  const labels = motionCopy[document.documentElement.lang.split('-')[0]] || motionCopy.en;
  const updateMotionControl = () => {
   const paused = userPaused || (reducedMotion.matches && !motionOptIn);
   motion.textContent = paused ? '▶' : 'Ⅱ';
   motion.setAttribute('aria-label', labels[paused ? 1 : 0]);
   motion.title = labels[paused ? 1 : 0];
   motion.hidden = !spriteReady;
  };
  const stopGreeting = () => {
   workScene?.stop();
   mascot?.classList.remove('is-greeting');
   helper.classList.remove('is-animating');
  };
  const canAnimate = () => spriteReady && !helper.hidden && !userPaused && (!reducedMotion.matches || motionOptIn) && !document.hidden && panel.hidden;
  const startGreeting = () => {
   if (!canAnimate()) {stopGreeting();return;}
   // Keep the same CSS loop running. Restoring a tab no longer depends on
   // a JavaScript timer restarting the decoration after every sequence.
   mascot.classList.add('is-greeting');
   helper.classList.add('is-animating');
   workScene?.start();
  };
  const setOpen = (open, restoreFocus = true) => {
   if (open) stopGreeting();
   panel.hidden = !open;
   toggle.setAttribute('aria-expanded', String(open));
   if (open) close.focus({preventScroll:true});
   else {
    if (restoreFocus) toggle.focus({preventScroll:true});
    startGreeting();
   }
  };
  toggle.hidden = false;
  toggle.addEventListener('click', () => setOpen(panel.hidden));
  close.addEventListener('click', () => setOpen(false));
  document.addEventListener('keydown', event => {
   if (event.key === 'Escape' && !panel.hidden) {event.preventDefault();setOpen(false, helper.contains(document.activeElement));}
  });
  document.addEventListener('pointerdown', event => {
   if (!panel.hidden && !helper.contains(event.target)) setOpen(false, false);
  });
  const nav = document.querySelector('[data-nav-toggle], .nav-toggle, .locale-toggle');
  nav?.addEventListener('click', () => {if (!panel.hidden) setOpen(false, false);});
  // Animate only the decoration. Contact actions remain fixed and usable.
  if (mascot && frames) {
   helper.append(motion);
   motion.addEventListener('click', () => {
    if (userPaused || (reducedMotion.matches && !motionOptIn)) {
     userPaused = false;
     motionOptIn = true;
     helper.classList.add('motion-opt-in');
    } else userPaused = true;
    updateMotionControl();
    if (userPaused) stopGreeting();
    else startGreeting();
   });
  }
  reducedMotion.addEventListener('change', () => {
   motionOptIn = false;
   helper.classList.remove('motion-opt-in');
   updateMotionControl();
   startGreeting();
  });
  document.addEventListener('visibilitychange', () => {
   if (document.hidden) stopGreeting();
   else startGreeting();
  });
  window.addEventListener('pageshow', startGreeting);
  window.addEventListener('focus', startGreeting);
  if (mascot && frames) {
   const sprite = new Image();
   sprite.src = '/bilder/reparatur-avatar-praezision-20261108.webp';
   sprite.decode().then(() => {
    spriteReady = Boolean(workScene) || typeof frames?.replaceChildren !== 'function';
    if (workScene) mascot.classList.add('rig-ready');
    updateMotionControl();
    startGreeting();
   }).catch(() => {/* The static portrait remains available if the animation cannot load. */});
  }
  if (floating) {
   let dismissed = false;
   let ready = false;
   let frame = 0;
   const dismiss = document.createElement('button');
   dismiss.type = 'button';
   dismiss.className = 'repair-helper-dismiss';
   dismiss.textContent = '×';
   dismiss.setAttribute('aria-label',dismissCopy[document.documentElement.lang.split('-')[0]]||dismissCopy.en);
   helper.append(dismiss);
   dismiss.addEventListener('click',()=>{
    dismissed = true;
    setOpen(false,false);
    helper.hidden = true;
    stopGreeting();
   });
   const visible = node => {
    const rect = node.getBoundingClientRect();
    const style = getComputedStyle(node);
    return rect.width>1 && rect.height>1 && rect.bottom>0 && rect.top<innerHeight && style.visibility!=='hidden' && style.display!=='none';
   };
   const refresh = () => {
    frame = 0;
    if (!ready || dismissed) return;
    // The expanded state is authoritative even during the menu's opening
    // transition, when its measured height can still be zero.
    const menuOpen = [...document.querySelectorAll('.nav-toggle[aria-expanded="true"],.locale-toggle[aria-expanded="true"]')].some(visible);
    const blocked = menuOpen || [...document.querySelectorAll('.consent-banner,dialog[open],[role="dialog"],.nav.open,#locale-nav.open')]
     .some(node=>!node.closest('[data-repair-helper]') && visible(node));
    const formFocused = document.activeElement?.closest('form');
    if (blocked || formFocused) {
     if (!panel.hidden) setOpen(false,false);
     helper.hidden = true;
     stopGreeting();
     return;
    }
    helper.hidden = false;
    if (panel.hidden) {
     const controls = [...document.querySelectorAll('a[href],button,input,select,textarea,summary')].filter(node=>!node.closest('[data-repair-helper]')&&visible(node));
     // Prefer the lower-left corner, then nearby space above it. Hide only when
     // none of these positions can avoid the page's interactive controls.
     let space = false;
     for (const lift of [0,80,160]) {
      helper.style.setProperty('--repair-lift',lift+'px');
      const box = helper.getBoundingClientRect();
      if (box.top<92) continue;
      const overlaps = controls.some(node=>{const r=node.getBoundingClientRect();return box.left<r.right-2&&box.right>r.left+2&&box.top<r.bottom-2&&box.bottom>r.top+2;});
      if (!overlaps) {space=true;break;}
     }
     helper.hidden = !space;
    }
    if (helper.hidden) stopGreeting();
    else startGreeting();
   };
   const queue = () => {if (!frame) frame = window.requestAnimationFrame(refresh);};
   window.addEventListener('scroll',queue,{passive:true});
   window.addEventListener('resize',queue);
   document.addEventListener('click',queue);
   document.addEventListener('focusin',queue);
   document.addEventListener('focusout',queue);
   window.setTimeout(()=>{ready=true;queue();},1200);
  }
 }
})();
