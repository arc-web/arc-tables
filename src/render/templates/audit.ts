// Audit report template - issues grouped by rule, with inline SQL fix snippets.

import type { Schema, AuditFinding } from '../../types.js';
import { baseCss } from '../theme.js';

export function renderAudit(schema: Schema, findings: AuditFinding[]): string {
  const byRule = new Map<string, AuditFinding[]>();
  for (const f of findings) {
    const list = byRule.get(f.rule) ?? [];
    list.push(f);
    byRule.set(f.rule, list);
  }

  const sections = [...byRule.entries()]
    .map(([rule, items]) => {
      const ct = items.length;
      const rows = items
        .map((f) => `
<div class="finding ${escape(f.severity)}">
  <div class="loc">${escape(f.table ?? '\u2014')}${f.column ? ' . ' + escape(f.column) : ''}</div>
  <div class="desc">${escape(f.description)}</div>
  ${f.fixSql ? `<pre class="sql"><code>${escape(f.fixSql)}</code></pre>` : ''}
</div>`).join('');
      return `
<section class="rule">
  <h2>${escape(rule)} <span class="ct">${ct} issue${ct === 1 ? '' : 's'}</span></h2>
  ${rows}
</section>`;
    })
    .join('');

  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><title>${escape(schema.profile)} audit</title>
<style>
${baseCss}
.container { max-width:1100px; margin:0 auto; padding:0 28px 60px; position:relative; z-index:2; }
section.rule { background:rgba(10,14,30,0.94); border:1px solid rgba(0,200,255,0.2); border-radius:12px; padding:20px 24px; margin-bottom:18px; }
section.rule h2 { font-size:11px; letter-spacing:2px; text-transform:uppercase; color:#00d4ff; margin-bottom:14px; display:flex; align-items:center; gap:12px; }
section.rule h2 .ct { font-size:9px; color:rgba(255,255,255,0.3); letter-spacing:1px; }
.finding { padding:10px 0; border-top:1px solid rgba(255,255,255,0.05); }
.finding:first-of-type { border-top:none; padding-top:0; }
.finding .loc { font-size:10px; color:rgba(0,212,255,0.7); margin-bottom:4px; letter-spacing:1px; }
.finding .desc { font-size:11px; color:rgba(220,225,255,0.7); margin-bottom:6px; line-height:1.5; }
.finding.error .loc { color:#ff5050; }
.finding.warning .loc { color:#ffc800; }
pre.sql { background:rgba(0,0,0,0.4); border:1px solid rgba(0,200,255,0.15); border-radius:6px; padding:10px 14px; font-size:10.5px; color:#00dc82; overflow-x:auto; }
pre.sql code { font-family:'SF Mono', monospace; }
.empty { text-align:center; padding:60px 0; color:rgba(0,220,130,0.6); font-size:12px; letter-spacing:2px; }
</style></head>
<body>
<h1>${escape(schema.profile)} \u2014 Schema Audit</h1>
<div id="sub">${findings.length} issue${findings.length === 1 ? '' : 's'} across ${schema.tables.length} tables</div>
<div class="container">
${findings.length === 0 ? '<div class="empty">\u2713 No issues detected</div>' : sections}
</div>
</body></html>`;
}

function escape(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}
