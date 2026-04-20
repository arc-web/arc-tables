// Full ecosystem map template - reproduces the look of /tmp/client_ecosystem.html.

import type { Schema, Annotations } from '../../types.js';
import { baseCss } from '../theme.js';
import { cardCss, renderCard, buildFkSet } from '../card.js';
import { pathCss, pathRuntimeJs } from '../path.js';
import { tooltipCss, interactionsJs } from '../interactions.js';
import { legendCss, renderLegend } from '../legend.js';
import { computePositions, canvasSize } from '../layout.js';
import { mergeAnnotations } from '../../annotate/merge.js';

export function renderMap(schema: Schema, sidecar: Annotations | undefined): string {
  const annotations = mergeAnnotations(schema, sidecar);
  const positions = computePositions(schema, annotations);
  const { w, h } = canvasSize(positions);

  // Group color resolution per table
  const colorOf = new Map<string, string>();
  if (annotations.groups) {
    for (const [, g] of Object.entries(annotations.groups)) {
      for (const m of g.members) colorOf.set(m, g.color);
    }
  }

  // Build cards
  const cards = schema.tables
    .map((t) => {
      const pos = positions.get(t.name) ?? { x: 0, y: 0 };
      const color = colorOf.get(t.name) ?? 'cyan';
      const ann = annotations.tables?.[t.name];
      const badge = ann?.description?.slice(0, 60) ?? `${t.columns.length} cols`;
      const fkSet = buildFkSet(t.name, schema.foreignKeys);
      return renderCard({ table: t, groupColor: color, badge, fkSet, annotations }, pos.x, pos.y);
    })
    .join('\n');

  // Build FK paths data (rendered client-side)
  const fkData = schema.foreignKeys.map((fk) => {
    const color = colorOf.get(fk.fromTable) ?? 'cyan';
    return {
      from: fk.fromTable,
      fromCol: fk.fromColumn,
      to: fk.toTable,
      toCol: fk.toColumn,
      cls: `p-${color}`,
      label: `${fk.fromTable}.${fk.fromColumn} \u2192 ${fk.toTable}.${fk.toColumn}`,
    };
  });

  return `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="UTF-8"><title>${escape(schema.profile)} schema map</title>
<style>
${baseCss}
${cardCss}
${pathCss}
${tooltipCss}
${legendCss}
#canvas { position:relative; width:${w}px; height:${h}px; margin:0 auto; }
</style></head>
<body>
<h1>${escape(schema.profile)} \u2014 Schema Map</h1>
<div id="sub">${schema.tables.length} tables \u00B7 ${schema.foreignKeys.length} FKs \u00B7 ${schema.views.length} views</div>
<div id="canvas"><svg id="conn"></svg>
${cards}
</div>
${renderLegend(annotations)}
<div id="tip"></div>
<script>
const FKS = ${JSON.stringify(fkData)};
${pathRuntimeJs}
${interactionsJs}
requestAnimationFrame(() => requestAnimationFrame(() => {
  const canvas = document.getElementById('canvas');
  const svg = document.getElementById('conn');
  const cards = {};
  document.querySelectorAll('.card').forEach((el) => { cards[el.id.replace('card-', '')] = el; });
  const CR = canvas.getBoundingClientRect();

  function colAnchor(tableId, colName, side) {
    const card = cards[tableId];
    if (!card) return null;
    const colEl = card.querySelector('[data-col="' + colName + '"]');
    const rect = card.getBoundingClientRect();
    const y = colEl
      ? colEl.getBoundingClientRect().top - CR.top + colEl.getBoundingClientRect().height / 2
      : rect.top - CR.top + rect.height / 2;
    return {
      x: side === 'r' ? rect.right - CR.left : rect.left - CR.left,
      y, cl: rect.left - CR.left, cr: rect.right - CR.left,
    };
  }

  const paths = [];
  FKS.forEach((fk, i) => {
    const fa = colAnchor(fk.from, fk.fromCol, 'r');
    const ta = colAnchor(fk.to, fk.toCol, 'l');
    if (!fa || !ta) return;
    const fromRight = fa.cl < ta.cl;
    const fx = fromRight ? fa.cr : fa.cl;
    const tx = fromRight ? ta.cl : ta.cr;
    const dx = Math.min(Math.abs(tx - fx) * 0.6, 140);
    const sx = fx < tx ? 1 : -1;
    const d = 'M' + fx + ',' + fa.y + ' C' + (fx + sx * dx) + ',' + fa.y + ' ' + (tx - sx * dx) + ',' + ta.y + ' ' + tx + ',' + ta.y;
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', d);
    path.setAttribute('class', fk.cls);
    path.setAttribute('id', 'p' + i);
    svg.appendChild(path);
    paths.push({ el: path, from: fk.from, to: fk.to, label: fk.label });
  });

  attachAnimatedDots(svg);
  setupInteractions(svg, paths, cards);
}));
</script>
</body></html>`;
}

function escape(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}
