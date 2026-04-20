// Card component CSS + HTML builder.
// Mirrors the .card / .ch / .ct / .cb / .cl / .cr structure from client_ecosystem.html.

import type { Table, Annotations, ForeignKey } from '../types.js';

export const cardCss = `
.card {
  position:absolute;
  background:rgba(9,13,28,0.95);
  border-radius:11px;
  border:1px solid rgba(0,200,255,0.18);
  box-shadow:0 0 22px rgba(0,200,255,0.05);
  z-index:2;
  transition:box-shadow .2s,border-color .2s,transform .15s;
  min-width:175px;
  cursor:default;
}
.card:hover { transform:translateY(-2px); z-index:20; }
.card.cyan   { border-color:rgba(0,212,255,0.22); box-shadow:0 0 22px rgba(0,212,255,0.05); }
.card.cyan:hover { border-color:rgba(0,212,255,0.55); box-shadow:0 0 34px rgba(0,212,255,0.15); }
.card.orange { border-color:rgba(255,140,0,0.22); box-shadow:0 0 22px rgba(255,140,0,0.05); }
.card.orange:hover { border-color:rgba(255,140,0,0.55); box-shadow:0 0 34px rgba(255,140,0,0.14); }
.card.green  { border-color:rgba(0,220,130,0.22); box-shadow:0 0 22px rgba(0,220,130,0.05); }
.card.green:hover { border-color:rgba(0,220,130,0.55); box-shadow:0 0 34px rgba(0,220,130,0.14); }
.card.purple { border-color:rgba(187,119,255,0.22); box-shadow:0 0 22px rgba(187,119,255,0.05); }
.card.purple:hover { border-color:rgba(187,119,255,0.55); box-shadow:0 0 34px rgba(187,119,255,0.14); }
.card.yellow { border-color:rgba(255,200,0,0.18); box-shadow:0 0 22px rgba(255,200,0,0.04); }
.card.yellow:hover { border-color:rgba(255,200,0,0.5); box-shadow:0 0 34px rgba(255,200,0,0.12); }
.card.white  { border-color:rgba(255,255,255,0.1); }
.card.white:hover  { border-color:rgba(255,255,255,0.3); }
.card.red    { border-color:rgba(255,80,80,0.22); box-shadow:0 0 22px rgba(255,80,80,0.05); }
.card.red:hover    { border-color:rgba(255,80,80,0.55); box-shadow:0 0 34px rgba(255,80,80,0.14); }
.card.dimmed { opacity:0.12 !important; }

.ch { padding:9px 13px 7px; border-bottom:1px solid rgba(255,255,255,0.05); }
.ct { font-size:10.5px; font-weight:700; letter-spacing:1.8px; text-transform:uppercase; color:#00d4ff; }
.card.orange .ct { color:#ff8c00; }
.card.green  .ct { color:#00dc82; }
.card.purple .ct { color:#bb77ff; }
.card.yellow .ct { color:#ffc800; }
.card.white  .ct { color:rgba(200,210,255,0.5); }
.card.red    .ct { color:#ff5050; }

.cb { font-size:9px; color:rgba(255,255,255,0.18); margin-top:2px; letter-spacing:.8px; }
.cl { padding:6px 0 8px; }
.cr { padding:2.5px 13px; font-size:10px; color:rgba(170,185,255,0.5); display:flex; align-items:center; gap:6px; }
.cr.pk { color:rgba(160,160,255,0.6); }
.cr.fk { color:#00d4ff; }
.cr.warn { color:rgba(255,80,80,0.55); text-decoration:line-through; }

.dot { width:4px; height:4px; border-radius:50%; background:rgba(255,255,255,0.1); flex-shrink:0; }
.cr.pk .dot { background:rgba(150,150,255,0.5); }
.cr.fk .dot { background:#00d4ff; box-shadow:0 0 4px rgba(0,212,255,0.5); }
.cr.warn .dot { background:rgba(255,80,80,0.4); }
`.trim();

export interface CardOptions {
  table: Table;
  groupColor: string;
  badge: string;
  fkSet: Set<string>; // column names that are FK sources
  annotations?: Annotations;
}

export function renderCard(opts: CardOptions, x: number, y: number): string {
  const { table, groupColor, badge, fkSet } = opts;
  const cols = table.columns
    .map((c) => {
      let cls = 'cr';
      if (c.isPrimaryKey) cls += ' pk';
      else if (fkSet.has(c.name)) cls += ' fk';
      return `<div class="${cls}" data-col="${escape(c.name)}"><span class="dot"></span>${escape(c.name)}</div>`;
    })
    .join('');
  return `
<div class="card ${groupColor}" id="card-${escape(table.name)}" style="left:${x}px;top:${y}px">
  <div class="ch"><div class="ct">${escape(table.name)}</div><div class="cb">${escape(badge)}</div></div>
  <div class="cl">${cols}</div>
</div>`.trim();
}

export function buildFkSet(table: string, fks: ForeignKey[]): Set<string> {
  const s = new Set<string>();
  for (const fk of fks) {
    if (fk.fromTable === table) s.add(fk.fromColumn);
  }
  return s;
}

function escape(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}
