import type { Annotations } from '../types.js';

export const legendCss = `
#legend { position:fixed; bottom:20px; right:20px; background:rgba(9,13,28,0.95);
  border:1px solid rgba(255,255,255,0.07); border-radius:10px; padding:14px 18px; z-index:100; }
.lt { font-size:9px; letter-spacing:2px; text-transform:uppercase; color:rgba(255,255,255,0.25); margin-bottom:10px; }
.li { display:flex; align-items:center; gap:9px; font-size:10px; color:rgba(200,210,255,0.5); margin-bottom:5px; }
.lb { width:10px; height:10px; border-radius:3px; flex-shrink:0; }
.lb.cyan   { background:rgba(0,212,255,0.13); border:1px solid rgba(0,212,255,0.4); }
.lb.orange { background:rgba(255,140,0,0.13); border:1px solid rgba(255,140,0,0.4); }
.lb.green  { background:rgba(0,220,130,0.13); border:1px solid rgba(0,220,130,0.4); }
.lb.purple { background:rgba(187,119,255,0.13); border:1px solid rgba(187,119,255,0.4); }
.lb.yellow { background:rgba(255,200,0,0.13); border:1px solid rgba(255,200,0,0.4); }
.lb.white  { background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.12); }
.lb.red    { background:rgba(255,80,80,0.13); border:1px solid rgba(255,80,80,0.4); }
`.trim();

export function renderLegend(annotations: Annotations | undefined): string {
  if (!annotations?.groups) return '';
  const items = Object.entries(annotations.groups)
    .map(([name, g]) => `<div class="li"><div class="lb ${g.color}"></div>${escape(name)}</div>`)
    .join('');
  return `<div id="legend"><div class="lt">Groups</div>${items}</div>`;
}

function escape(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}
