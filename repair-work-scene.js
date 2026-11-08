(() => {
 'use strict';
 // Preserve the complete illustrated anatomy. A continuous local deformation
 // moves the wrist/tool while tapering to zero at the elbow and screw tip.
 // No synthetic stick arm, floating memory cards or cartridge receptacle.
 window.PCRepairWorkScene = (frames, id) => {
  const source = '/bilder/reparatur-avatar-praezision-20261108.webp';
  const duration = '12s';
  const field = `<svg xmlns="http://www.w3.org/2000/svg" width="1254" height="1254" viewBox="0 0 1254 1254"><defs><radialGradient id="hand"><stop stop-color="#ff8080"/><stop offset=".46" stop-color="#df8080"/><stop offset="1" stop-color="#808080"/></radialGradient><radialGradient id="head"><stop stop-color="#808e80"/><stop offset="1" stop-color="#808080"/></radialGradient></defs><rect width="1254" height="1254" fill="#808080"/><ellipse cx="525" cy="892" rx="255" ry="148" fill="url(#hand)"/><ellipse cx="725" cy="230" rx="175" ry="210" fill="url(#head)"/></svg>`;
  const svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
  svg.setAttribute('viewBox','0 0 1254 1254');
  svg.setAttribute('class','repair-working-scene');
  svg.setAttribute('aria-hidden','true');
  svg.setAttribute('focusable','false');
  svg.innerHTML = `<defs><filter id="${id}-precision" x="-3%" y="-3%" width="106%" height="106%" color-interpolation-filters="sRGB"><feImage href="data:image/svg+xml,${encodeURIComponent(field)}" x="0" y="0" width="1254" height="1254" preserveAspectRatio="none" result="field"/><feComponentTransfer in="field" result="centered"><feFuncR type="linear" slope="1" intercept="-0.0019607843"/><feFuncG type="linear" slope="1" intercept="-0.0019607843"/></feComponentTransfer><feDisplacementMap in="SourceGraphic" in2="centered" scale="0" xChannelSelector="R" yChannelSelector="G" class="repair-precision-motion"><animate attributeName="scale" values="0;100;-85;100;-85;100;0;0" keyTimes="0;.12;.24;.36;.48;.60;.76;1" keySplines=".42 0 .58 1;.42 0 .58 1;.42 0 .58 1;.42 0 .58 1;.42 0 .58 1;.42 0 .58 1;.42 0 .58 1" calcMode="spline" dur="${duration}" repeatCount="indefinite"/></feDisplacementMap></filter></defs><image class="repair-precision-illustration" href="${source}" width="1254" height="1254" filter="url(#${id}-precision)"/>`;
  frames.replaceChildren(svg);
  svg.pauseAnimations();svg.setCurrentTime(0);
  return {svg,start:()=>svg.unpauseAnimations(),stop:()=>svg.pauseAnimations()};
 };
})();
