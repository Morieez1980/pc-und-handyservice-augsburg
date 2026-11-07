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
  let greetingTimer;
  let restartTimer;
  let spriteReady = false;
  let userPaused = false;
  const motion = document.createElement('button');
  motion.type = 'button';
  motion.className = 'repair-helper-motion';
  motion.hidden = true;
  const labels = motionCopy[document.documentElement.lang.split('-')[0]] || motionCopy.en;
  const updateMotionControl = () => {
   motion.textContent = userPaused ? '▶' : 'Ⅱ';
   motion.setAttribute('aria-label', labels[userPaused ? 1 : 0]);
   motion.title = labels[userPaused ? 1 : 0];
   motion.hidden = !spriteReady || reducedMotion.matches;
  };
  const stopGreeting = () => {
   window.clearTimeout(greetingTimer);
   window.clearTimeout(restartTimer);
   mascot?.classList.remove('is-greeting');
   helper.classList.remove('is-animating');
  };
  const canAnimate = () => spriteReady && !userPaused && !reducedMotion.matches && !document.hidden && panel.hidden;
  const startGreeting = () => {
   stopGreeting();
   if (!canAnimate()) return;
   mascot.classList.add('is-greeting');
   helper.classList.add('is-animating');
   // Allow the full eight-second repair sequence; recover if animationend is lost.
   greetingTimer = window.setTimeout(finishGreeting, 8500);
  };
  const scheduleGreeting = () => {
   stopGreeting();
   if (canAnimate()) restartTimer = window.setTimeout(startGreeting, 2000);
  };
  const finishGreeting = () => {
   scheduleGreeting();
  };
  const setOpen = (open, restoreFocus = true) => {
   if (open) stopGreeting();
   panel.hidden = !open;
   toggle.setAttribute('aria-expanded', String(open));
   if (open) close.focus({preventScroll:true});
   else {
    if (restoreFocus) toggle.focus({preventScroll:true});
    scheduleGreeting();
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
    userPaused = !userPaused;
    updateMotionControl();
    if (userPaused) stopGreeting();
    else startGreeting();
   });
  }
  frames?.addEventListener('animationend', event => {
   if (event.target === frames && event.animationName === 'repair-avatar-actions') finishGreeting();
  });
  reducedMotion.addEventListener('change', () => {
   updateMotionControl();
   if (reducedMotion.matches) stopGreeting();
   else scheduleGreeting();
  });
  document.addEventListener('visibilitychange', () => {
   if (document.hidden) stopGreeting();
   else scheduleGreeting();
  });
  if (mascot && frames) {
   const sprite = new Image();
   sprite.src = '/bilder/reparatur-avatar-werkbank-8s-20261107.png';
   sprite.decode().then(() => {
    spriteReady = true;
    updateMotionControl();
    startGreeting();
   }).catch(() => {/* The static portrait remains available if the animation cannot load. */});
  }
 }
})();
