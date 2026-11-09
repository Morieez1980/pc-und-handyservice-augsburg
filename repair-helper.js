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

 // One static preview in the upper-right hero card. The existing portrait,
 // translated copy and contacts are reused in one click-open dialog.
 let rigSequence=0;
 for(const helper of document.querySelectorAll('[data-repair-helper]')){
  const toggle=helper.querySelector('.repair-helper-toggle');
  const panel=helper.querySelector('.repair-helper-panel');
  const close=helper.querySelector('.repair-helper-close');
  if(!toggle||!panel||!close)continue;
  const card=helper.closest('.home-intro')?.querySelector('.home-intro-copy');
  card?.append(helper);helper.classList.add('repair-helper-head');helper.hidden=false;
  const mascot=toggle.querySelector('.repair-avatar'),frames=mascot?.querySelector('.repair-avatar-frames');
  const slogan=helper.querySelector('.repair-helper-slogan'),result=helper.querySelector('[data-repair-result]');
  let workScene=null;
  if(typeof frames?.replaceChildren==='function'&&typeof window.PCRepairWorkScene==='function'){
   try{workScene=window.PCRepairWorkScene(frames,'repair-working-'+(++rigSequence));mascot.classList.add('repair-working-avatar');}catch{frames.replaceChildren();}
  }
  const showcase=document.createElement('div');showcase.className='repair-helper-showcase';
  if(mascot)showcase.append(mascot);if(slogan)showcase.append(slogan);if(result)showcase.append(result);
  panel.insertBefore(showcase,panel.querySelector('.repair-helper-contacts'));
  panel.classList.add('repair-helper-dialog');document.body?.append(panel);
  const preview=document.createElement('span');preview.className='repair-helper-preview';preview.setAttribute('aria-hidden','true');
  const image=document.createElement('img');image.src='/bilder/reparatur-avatar-stehend-klein-20261109.webp';image.width=128;image.height=128;image.alt='';image.decoding='async';preview.append(image);toggle.prepend(preview);
  const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
  let spriteReady=false,userPaused=false,motionOptIn=false;
  const motion=document.createElement('button');motion.type='button';motion.className='repair-helper-motion';motion.hidden=true;panel.append(motion);
  const labels=motionCopy[document.documentElement.lang.split('-')[0]]||motionCopy.en;
  const updateMotionControl=()=>{const paused=userPaused||(reducedMotion.matches&&!motionOptIn);motion.textContent=paused?'▶':'Ⅱ';motion.setAttribute('aria-label',labels[paused?1:0]);motion.title=labels[paused?1:0];motion.hidden=!spriteReady;};
  const stopGreeting=()=>{workScene?.stop();mascot?.classList.remove('is-greeting');helper.classList.remove('is-animating');};
  const canAnimate=()=>spriteReady&&!helper.hidden&&!panel.hidden&&!userPaused&&(!reducedMotion.matches||motionOptIn)&&!document.hidden;
  const startGreeting=()=>{if(!canAnimate()){stopGreeting();return;}mascot?.classList.add('is-greeting');helper.classList.add('is-animating');workScene?.start();};
  const positionPanel=()=>{
   if(panel.hidden)return;
   const bar=document.querySelector('.mobile-contact-bar,.locale-mobile-contact');
   const barBox=bar?.getBoundingClientRect();
   const bottom=barBox?.height>0&&getComputedStyle(bar).display!=='none'?Math.min(innerHeight,barBox.top):innerHeight;
   panel.style.maxHeight=Math.max(120,bottom-24)+'px';
   const anchor=toggle.getBoundingClientRect(),box=panel.getBoundingClientRect();
   panel.style.left=Math.max(12,Math.min(anchor.right-box.width,innerWidth-box.width-12))+'px';
   panel.style.top=Math.max(12,Math.min(anchor.bottom+8,bottom-box.height-12))+'px';
  };
  const setOpen=(open,restoreFocus=true)=>{
   stopGreeting();panel.hidden=!open;toggle.setAttribute('aria-expanded',String(open));
   if(open){
    if(result){result.textContent='\u00a0';result.dataset.phase='idle';}
    workScene?.restartFromBeginning?.();positionPanel();close.focus({preventScroll:true});startGreeting();
   }else if(restoreFocus)toggle.focus({preventScroll:true});
  };
  toggle.hidden=false;toggle.addEventListener('click',()=>setOpen(panel.hidden));
  close.addEventListener('click',()=>setOpen(false));
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!panel.hidden){event.preventDefault();setOpen(false,helper.contains(document.activeElement)||panel.contains(document.activeElement));}});
  document.addEventListener('pointerdown',event=>{if(!panel.hidden&&!helper.contains(event.target)&&!panel.contains(event.target))setOpen(false,false);});
  document.querySelector('[data-nav-toggle], .nav-toggle, .locale-toggle')?.addEventListener('click',()=>{if(!panel.hidden)setOpen(false,false);});
  motion.addEventListener('click',()=>{if(userPaused||(reducedMotion.matches&&!motionOptIn)){userPaused=false;motionOptIn=true;helper.classList.add('motion-opt-in');}else userPaused=true;updateMotionControl();startGreeting();});
  reducedMotion.addEventListener('change',()=>{motionOptIn=false;helper.classList.remove('motion-opt-in');updateMotionControl();startGreeting();});
  document.addEventListener('visibilitychange',startGreeting);window.addEventListener('pageshow',startGreeting);window.addEventListener('focus',startGreeting);
  window.addEventListener('resize',positionPanel);
  window.addEventListener('scroll',()=>{if(panel.hidden)return;const anchor=toggle.getBoundingClientRect();if(anchor.bottom<0||anchor.top>innerHeight)setOpen(false,false);else positionPanel();},{passive:true});
  if(mascot&&frames){const sprite=new Image();sprite.src='/bilder/reparatur-avatar-stehend-20261109.webp';sprite.decode().then(()=>{spriteReady=Boolean(workScene)||typeof frames?.replaceChildren!=='function';if(workScene)mascot.classList.add('rig-ready');updateMotionControl();positionPanel();startGreeting();}).catch(()=>{/* Keep the original still and usable contact dialog. */});}
 }
})();
