(() => {
  const toggle=document.querySelector('.locale-toggle'),nav=document.querySelector('#locale-nav');
  const close=()=>{nav?.classList.remove('open');toggle?.setAttribute('aria-expanded','false');toggle?.setAttribute('aria-label',toggle.dataset.open)};
  toggle?.addEventListener('click',()=>{const open=nav.classList.toggle('open');toggle.setAttribute('aria-expanded',String(open));toggle.setAttribute('aria-label',open?toggle.dataset.close:toggle.dataset.open)});
  nav?.querySelectorAll('a').forEach(a=>a.addEventListener('click',close));
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){const open=nav?.classList.contains('open');close();document.querySelectorAll('.language-picker[open]').forEach(d=>d.open=false);if(open)toggle.focus()}});
  document.addEventListener('click',e=>document.querySelectorAll('.language-picker[open]').forEach(d=>{if(!d.contains(e.target))d.open=false}));
})();
