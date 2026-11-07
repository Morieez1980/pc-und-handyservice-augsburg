(() => {
 'use strict';
 for (const helper of document.querySelectorAll('[data-repair-helper]')) {
  const toggle = helper.querySelector('.repair-helper-toggle');
  const panel = helper.querySelector('.repair-helper-panel');
  const close = helper.querySelector('.repair-helper-close');
  if (!toggle || !panel || !close) continue;
  const mascot = toggle.querySelector('.repair-avatar');
  const frames = mascot?.querySelector('.repair-avatar-frames');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let greetingTimer;
  let greetingCancelled = false;
  const finishGreeting = () => {
   greetingCancelled = true;
   window.clearTimeout(greetingTimer);
   mascot?.classList.remove('is-greeting');
  };
  const setOpen = (open, restoreFocus = true) => {
   if (open) finishGreeting();
   panel.hidden = !open;
   toggle.setAttribute('aria-expanded', String(open));
   if (open) close.focus({preventScroll:true});
   else if (restoreFocus) toggle.focus({preventScroll:true});
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
  // Animate only the decoration. The button and its contact actions never move.
  frames?.addEventListener('animationend', event => {
   if (event.target === frames && event.animationName === 'repair-avatar-actions') finishGreeting();
  });
  reducedMotion.addEventListener('change', event => {if (event.matches) finishGreeting();});
  document.addEventListener('visibilitychange', () => {if (document.hidden) finishGreeting();});
  if (mascot && frames && !reducedMotion.matches && !document.hidden) {
   const sprite = new Image();
   sprite.src = '/bilder/reparatur-avatar-bewegung-20261107.png';
   sprite.decode().then(() => {
    if (greetingCancelled || reducedMotion.matches || document.hidden || !panel.hidden) return;
    mascot.classList.add('is-greeting');
    greetingTimer = window.setTimeout(finishGreeting, 2800);
   }).catch(() => {/* The static portrait remains available if the animation cannot load. */});
  }
 }
})();
