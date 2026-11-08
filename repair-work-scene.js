(() => {
 'use strict';
 // A local articulated component exchange. The SVG timeline drives the hand,
 // elbow and component together, with no paid video service or external code.
 window.PCRepairWorkScene = (frames, id) => {
  const source = '/bilder/reparatur-avatar-hintergrund-20261108.webp';
  const poses = [
   [0,530,990,0], [.12,580,760,-10], [.25,100,890,-16],
   [.32,20,1030,0], [.40,140,860,-8], [.48,260,1030,0],
   [.60,600,760,-10], [.78,530,990,0], [.86,530,1010,0],
   [.94,540,900,-4], [1,530,990,0]
  ];
  const times = poses.map(p=>p[0]).join(';');
  const splines = poses.slice(1).map(()=>'.42 0 .58 1').join(';');
  const duration = '12s';
  const num = n=>Math.round(n*100)/100;
  const elbows = poses.map(([,x,y])=>{
   const sx=265,sy=540,upper=260,fore=420;
   const dx=x-sx,dy=y-sy,d=Math.hypot(dx,dy);
   const a=(upper*upper-fore*fore+d*d)/(2*d),h=Math.sqrt(Math.max(0,upper*upper-a*a));
   return [num(sx+a*dx/d-h*dy/d),num(sy+a*dy/d+h*dx/d)];
  });
  const morph = (attribute,values)=>`<animate attributeName="${attribute}" values="${values.join(';')}" keyTimes="${times}" keySplines="${splines}" calcMode="spline" dur="${duration}" repeatCount="indefinite"/>`;
  const transform = (type,values)=>`<animateTransform attributeName="transform" type="${type}" values="${values.join(';')}" keyTimes="${times}" keySplines="${splines}" calcMode="spline" dur="${duration}" repeatCount="indefinite"/>`;
  const show = (values,keyTimes)=>`<animate attributeName="opacity" values="${values}" keyTimes="${keyTimes}" calcMode="discrete" dur="${duration}" repeatCount="indefinite"/>`;
  const upper = elbows.map(([x,y])=>`M265 540L${x} ${y}`);
  const fore = elbows.map(([x,y],i)=>`M${x} ${y}L${poses[i][1]} ${poses[i][2]}`);
  const limb = (values,width)=>`<path d="${values[0]}" fill="none" stroke="#995d3d" stroke-opacity=".65" stroke-width="${width+5}" stroke-linecap="round">${morph('d',values)}</path><path d="${values[0]}" fill="none" stroke="url(#${id}-skin)" stroke-width="${width}" stroke-linecap="round">${morph('d',values)}</path><path d="${values[0]}" fill="none" stroke="#ffd0a6" stroke-opacity=".23" stroke-width="${width*.55}" stroke-linecap="round" filter="url(#${id}-soft-light)">${morph('d',values)}</path>`;
  const card = (fresh=false)=>`<g class="repair-component${fresh?' repair-component-new':' repair-component-old'}"><rect width="220" height="100" rx="8" fill="${fresh?'#27836c':'#53616b'}" stroke="${fresh?'#a5e8d4':'#b4bdc4'}" stroke-width="5"/><path d="M8 86H212V100H8Z" fill="#d2ae54"/>${[15,65,115,165].map(x=>`<rect x="${x}" y="17" width="38" height="52" rx="4" fill="#1b252e"/><path d="M${x+3} 20h32" stroke="#78919b" stroke-width="3"/>`).join('')}<path d="M17 77H203" stroke="${fresh?'#75d0ad':'#8c9ba2'}" stroke-width="4"/></g>`;
  const head='M583 283L575 203L609 141L632 60L711 7L823 0L935 35L978 113L977 216L950 300L928 400L884 491L811 551L727 551L647 494L603 410Z';
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
  svg.setAttribute('viewBox','-80 -20 1370 1300');
  svg.setAttribute('class','repair-working-scene');svg.setAttribute('aria-hidden','true');svg.setAttribute('focusable','false');
  svg.innerHTML=`<defs><clipPath id="${id}-head"><path d="${head}"/></clipPath><mask id="${id}-body" maskUnits="userSpaceOnUse" x="0" y="0" width="1254" height="1254"><rect width="1254" height="1254" fill="white"/><path d="${head}" fill="black"/></mask><filter id="${id}-soft-light" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="7"/></filter><linearGradient id="${id}-skin" gradientUnits="userSpaceOnUse" x1="70" y1="480" x2="650" y2="1080"><stop stop-color="#d78e5e"/><stop offset=".28" stop-color="#f5bc91"/><stop offset=".6" stop-color="#e4a77b"/><stop offset="1" stop-color="#ba7951"/></linearGradient><linearGradient id="${id}-hand" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#fac69b"/><stop offset=".55" stop-color="#e9aa7e"/><stop offset="1" stop-color="#c4875b"/></linearGradient></defs>
   <image href="${source}" width="1254" height="1254" mask="url(#${id}-body)"/>
   <g class="repair-rig-head repair-working-head">${transform('rotate',[-2,2,0,-2,0,0,3,4,5,1,-2].map(a=>a+' 732 548'))}<image href="${source}" width="1254" height="1254" clip-path="url(#${id}-head)"/></g>
   <g class="repair-work-slot"><rect x="540" y="1030" width="260" height="145" rx="10" fill="#152c32" stroke="#567a81" stroke-width="6"/><path d="M552 1160H788" stroke="#c7ab58" stroke-width="8"/><path d="M548 1040V1150M792 1040V1150" stroke="#a5bdc4" stroke-width="8"/></g>
   <g class="repair-work-tray"><path d="M15 1090L494 1055L510 1210L20 1240Z" fill="#17343c" stroke="#43717c" stroke-width="5"/>
    <g transform="translate(40 1080)" opacity="0">${show('0;1;1','0;.32;1')}${card(false)}</g>
    <g transform="translate(280 1080)">${show('1;0;0','0;.48;1')}${card(true)}</g>
   </g>
   <g transform="translate(550 1040)" opacity="0" class="repair-installed-component">${show('0;1;1','0;.86;1')}${card(true)}</g>
   <g class="repair-rig-arm repair-working-arm">${limb(upper,112)}${limb(fore,91)}
    <g opacity=".28">${transform('translate',elbows.map(([x,y],i)=>`${num(x+(poses[i][1]-x)*.34)} ${num(y+(poses[i][2]-y)*.34)}`))}<g>${transform('rotate',elbows.map(([x,y],i)=>num(Math.atan2(poses[i][2]-y,poses[i][1]-x)*180/Math.PI)))}<circle r="28" fill="none" stroke="#23323a" stroke-width="9"/><circle r="10" fill="#23323a"/><path d="M-39 0H39M0-39V39M-28-28L28 28M-28 28L28-28" stroke="#23323a" stroke-width="8"/></g></g>
   </g>
   <path d="M211 468Q266 477 310 555" fill="none" stroke="#15242a" stroke-width="22" stroke-linecap="round"/><path d="M211 460Q269 472 318 556" fill="none" stroke="#43bfc0" stroke-width="8" stroke-linecap="round"/>
   <g class="repair-work-hand">${transform('translate',poses.map(p=>p[1]+' '+p[2]))}<g>${transform('rotate',poses.map(p=>p[3]))}
    <g transform="translate(20 50)" class="repair-held-old">${show('1;0;0','0;.32;1')}${card(false)}</g>
    <g transform="translate(20 50)" opacity="0" class="repair-held-new">${show('0;1;0;0','0;.48;.86;1')}${card(true)}</g>
    <path d="M-42-28C-10-39 17-33 34-12L65 26L74 62C77 77 61 88 49 73L36 46L40 83C41 100 24 105 18 86L12 55L14 92C12 111-5 109-9 92L-15 53L-17 87C-20 104-37 102-39 83L-43 40C-66 35-66 17-54 0Z" fill="url(#${id}-hand)" stroke="#a56c4a" stroke-width="4" stroke-linejoin="round"/>
    <path d="M-36 8Q-17-4 8 9M-24 38L-21 72M1 39L6 79M26 30L32 65" fill="none" stroke="#b97f57" stroke-opacity=".5" stroke-width="4" stroke-linecap="round"/>
   </g></g>
   <g transform="translate(820 1030)" opacity="0" class="repair-component-check">${show('0;1;0;0','0;.86;.97;1')}<circle r="42" fill="#133c37" stroke="#6adab9" stroke-width="6"/><path d="M-20 0L-5 16L23-19" fill="none" stroke="#9affd9" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/></g>`;
  frames.replaceChildren(svg);svg.pauseAnimations();svg.setCurrentTime(0);
  return {svg,start:()=>svg.unpauseAnimations(),stop:()=>svg.pauseAnimations()};
 };
})();
