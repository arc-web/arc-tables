// SVG path styles + connection drawing logic.
// Mirrors the .p-cyan / .p-ora / .p-grn etc. pattern from client_ecosystem.html,
// plus the animated flow-dot pattern.

export const pathCss = `
svg#conn { position:absolute; inset:0; width:100%; height:100%; pointer-events:none; z-index:1; overflow:visible; }
.p-cyan   { fill:none; stroke:#00d4ff; stroke-width:1.5; stroke-dasharray:7 5; opacity:.5; filter:drop-shadow(0 0 2px rgba(0,212,255,0.3)); }
.p-orange { fill:none; stroke:#ff8c00; stroke-width:1.5; stroke-dasharray:7 5; opacity:.45; filter:drop-shadow(0 0 2px rgba(255,140,0,0.3)); }
.p-green  { fill:none; stroke:#00dc82; stroke-width:1.5; stroke-dasharray:7 5; opacity:.45; filter:drop-shadow(0 0 2px rgba(0,220,130,0.3)); }
.p-purple { fill:none; stroke:#bb77ff; stroke-width:1.5; stroke-dasharray:7 5; opacity:.4; filter:drop-shadow(0 0 2px rgba(187,119,255,0.3)); }
.p-yellow { fill:none; stroke:#ffc800; stroke-width:1.5; stroke-dasharray:7 5; opacity:.4; filter:drop-shadow(0 0 2px rgba(255,200,0,0.3)); }
.p-red    { fill:none; stroke:#ff5050; stroke-width:1.5; stroke-dasharray:7 5; opacity:.55; filter:drop-shadow(0 0 2px rgba(255,80,80,0.3)); }
.path-hi { opacity:1 !important; stroke-width:2.5 !important; }
.path-dim { opacity:0.04 !important; }
`.trim();

// Animated dot script - injected once, reads <path> elements and attaches <circle><animateMotion>
export const pathRuntimeJs = `
function attachAnimatedDots(svg) {
  const ns = 'http://www.w3.org/2000/svg';
  const colorByClass = { 'p-cyan':'#00d4ff', 'p-orange':'#ff8c00', 'p-green':'#00dc82',
                          'p-purple':'#bb77ff', 'p-yellow':'#ffc800', 'p-red':'#ff5050' };
  const paths = svg.querySelectorAll('path[id^="p"]');
  paths.forEach((p, i) => {
    const cls = p.getAttribute('class') || '';
    const fill = colorByClass[cls] || '#00d4ff';
    const dot = document.createElementNS(ns, 'circle');
    dot.setAttribute('r', '3');
    dot.setAttribute('fill', fill);
    dot.setAttribute('filter', 'drop-shadow(0 0 3px ' + fill + ')');
    const dur = (1.8 + i * 0.23).toFixed(2);
    dot.innerHTML = '<animateMotion dur="' + dur + 's" repeatCount="indefinite"><mpath href="#' + p.id + '"/></animateMotion>';
    svg.appendChild(dot);
  });
}
`.trim();
