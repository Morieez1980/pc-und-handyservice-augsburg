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
 for (const helper of document.querySelectorAll('[data-repair-helper]')) {
  const toggle = helper.querySelector('.repair-helper-toggle');
  const panel = helper.querySelector('.repair-helper-panel');
  const close = helper.querySelector('.repair-helper-close');
  if (!toggle || !panel || !close) continue;
  const mascot = toggle.querySelector('.repair-avatar');
  const frames = mascot?.querySelector('.repair-avatar-frames');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let spriteReady = false;
  let userPaused = false;
  let motionOptIn = false;
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
   mascot?.classList.remove('is-greeting');
   helper.classList.remove('is-animating');
  };
  const canAnimate = () => spriteReady && !userPaused && (!reducedMotion.matches || motionOptIn) && !document.hidden && panel.hidden;
  const startGreeting = () => {
   if (!canAnimate()) {stopGreeting();return;}
   // Keep the same CSS loop running. Restoring a tab no longer depends on
   // a JavaScript timer restarting the decoration after every sequence.
   mascot.classList.add('is-greeting');
   helper.classList.add('is-animating');
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
   sprite.src = '/bilder/reparatur-avatar-schlanker-bewegung-20261107.png';
   sprite.decode().then(() => {
    spriteReady = true;
    updateMotionControl();
    startGreeting();
   }).catch(() => {/* The static portrait remains available if the animation cannot load. */});
  }
 }
})();
