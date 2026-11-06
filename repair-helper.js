(() => {
 'use strict';
 for (const helper of document.querySelectorAll('[data-repair-helper]')) {
  const toggle = helper.querySelector('.repair-helper-toggle');
  const panel = helper.querySelector('.repair-helper-panel');
  const close = helper.querySelector('.repair-helper-close');
  if (!toggle || !panel || !close) continue;
  const setOpen = (open, restoreFocus = true) => {
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
 }
})();
