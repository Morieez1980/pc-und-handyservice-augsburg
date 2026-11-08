(() => {
 'use strict';
 window.PCRepairWorkScene = (frames,id) => {
  const source = '/bilder/reparatur-avatar-stehend-20261109.webp';
  const duration = '8s';
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
  svg.setAttribute('viewBox','0 0 1254 1254');svg.setAttribute('class','repair-working-scene');svg.setAttribute('aria-hidden','true');svg.setAttribute('focusable','false');
  svg.innerHTML=`
<defs>
<filter id="SCENE_ID-motion" x="-5%" y="-5%" width="110%" height="110%" color-interpolation-filters="sRGB">
<feImage id="SCENE_ID-wave-field" x="0" y="0" width="1254" height="1254" preserveAspectRatio="none" result="waveField"/>
<feComponentTransfer in="waveField" result="waveCentered"><feFuncR type="linear" slope="1" intercept="-0.0019607843"/><feFuncG type="linear" slope="1" intercept="-0.0019607843"/></feComponentTransfer>
<feDisplacementMap id="SCENE_ID-wave-motion" class="repair-precision-motion" in="SourceGraphic" in2="waveCentered" xChannelSelector="R" yChannelSelector="G" scale="0" result="waving">
<animate attributeName="scale" dur="8s" repeatCount="indefinite" values="0;44;-36;44;-28;0;0" keyTimes="0;.08;.17;.26;.35;.44;1" calcMode="spline" keySplines=".42 0 .58 1;.42 0 .58 1;.42 0 .58 1;.42 0 .58 1;.42 0 .58 1;0 0 1 1"/>
</feDisplacementMap>
<feImage id="SCENE_ID-tool-field" x="0" y="0" width="1254" height="1254" preserveAspectRatio="none" result="toolField"/>
<feComponentTransfer in="toolField" result="toolCentered"><feFuncR type="linear" slope="1" intercept="-0.0019607843"/><feFuncG type="linear" slope="1" intercept="-0.0019607843"/></feComponentTransfer>
<feDisplacementMap id="SCENE_ID-tool-motion" in="waving" in2="toolCentered" xChannelSelector="R" yChannelSelector="G" scale="0">
<animate attributeName="scale" dur="8s" repeatCount="indefinite" values="0;0;24;-20;22;-12;0;0" keyTimes="0;.42;.50;.59;.68;.77;.86;1" calcMode="spline" keySplines="0 0 1 1;.42 0 .58 1;.42 0 .58 1;.42 0 .58 1;.42 0 .58 1;.42 0 .58 1;0 0 1 1"/>
</feDisplacementMap>
</filter>
</defs>
<image class="repair-precision-illustration" href="/bilder/reparatur-avatar-stehend-20261109.webp" width="1254" height="1254" filter="url(#SCENE_ID-motion)"/>
<g transform="translate(925 880)" aria-hidden="true" opacity="0">
<animate attributeName="opacity" values="0;0;1;1;0;0" keyTimes="0;.39;.46;.90;.98;1" dur="8s" repeatCount="indefinite"/>
<rect x="-75" y="-60" width="170" height="112" rx="12" fill="#24363b" stroke="#708b8d" stroke-width="7"/>
<path d="M-94 68 H114 L102 82 H-82 Z" fill="#263c41"/>
<g transform="translate(10 -4)"><g opacity="1">
<animate attributeName="opacity" values="1;1;0;0;1" keyTimes="0;.70;.74;.98;1" dur="8s" repeatCount="indefinite"/>
<g fill="#829d9d" stroke="#829d9d" stroke-width="6">
<animateTransform attributeName="transform" type="rotate" values="0;0;190;190" keyTimes="0;.42;.73;1" dur="8s" repeatCount="indefinite" calcMode="spline" keySplines="0 0 1 1;.42 0 .58 1;0 0 1 1"/>
<circle r="23" fill="none"/><rect x="-4" y="-36" width="8" height="14"/><rect x="-4" y="-36" width="8" height="14" transform="rotate(45)"/><rect x="-4" y="-36" width="8" height="14" transform="rotate(90)"/><rect x="-4" y="-36" width="8" height="14" transform="rotate(135)"/><rect x="-4" y="-36" width="8" height="14" transform="rotate(180)"/><rect x="-4" y="-36" width="8" height="14" transform="rotate(225)"/><rect x="-4" y="-36" width="8" height="14" transform="rotate(270)"/><rect x="-4" y="-36" width="8" height="14" transform="rotate(315)"/>
</g></g><path d="M-24 0 L-4 21 L34 -23" fill="none" stroke="#75c5a9" stroke-width="11" stroke-linecap="round" stroke-linejoin="round" opacity="0"><animate attributeName="opacity" values="0;0;1;1;0" keyTimes="0;.70;.75;.95;1" dur="8s" repeatCount="indefinite"/></path></g>
</g>
`.replaceAll('SCENE_ID',id).replaceAll('8s',duration);
  const field=(key,cx,cy,rx,ry,color)=>'data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="1254" height="1254"><defs><radialGradient id="'+key+'"><stop stop-color="'+color+'"/><stop offset=".42" stop-color="'+color+'"/><stop offset="1" stop-color="#808080"/></radialGradient></defs><rect width="1254" height="1254" fill="#808080"/><ellipse cx="'+cx+'" cy="'+cy+'" rx="'+rx+'" ry="'+ry+'" fill="url(#'+key+')"/></svg>');
  svg.querySelector('[id$="wave-field"]').setAttribute('href',field('wave',380,255,115,210,'#ff8080'));
  svg.querySelector('[id$="tool-field"]').setAttribute('href',field('tool',795,785,75,145,'#ff9480'));
  frames.replaceChildren(svg);svg.pauseAnimations();svg.setCurrentTime(0);
  const result=frames.closest('[data-repair-helper]')?.querySelector('[data-repair-result]');let raf=0,phase='';
  const tick=()=>{raf=0;const t=svg.getCurrentTime()%8;const next=t>=5.8&&t<7.6?'complete':t>=3.4&&t<5.8?'quip':'idle';if(next!==phase){phase=next;if(result){result.textContent=next==='complete'?result.dataset.complete:next==='quip'?result.dataset.quip:'\u00a0';result.dataset.phase=next;}}raf=requestAnimationFrame(tick);};
  return {svg,start:()=>{svg.unpauseAnimations();if(!raf)tick();},stop:()=>{svg.pauseAnimations();if(raf)cancelAnimationFrame(raf);raf=0;}};
 };
})();
