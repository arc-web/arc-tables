import type { Schema, AuditFinding } from '../../types.js';

export function brokenViewRule(schema: Schema): AuditFinding[] {
  const findings: AuditFinding[] = [];
  const tableByName = new Map(schema.tables.map((t) => [t.name, t]));

  for (const v of schema.views) {
    const refs = [...v.definition.matchAll(/\b([a-z_]+)\.([a-z_]+)\b/g)];
    const seen = new Set<string>();
    for (const m of refs) {
      const tname = m[1];
      const cname = m[2];
      const key = `${tname}.${cname}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const t = tableByName.get(tname);
      if (!t) continue;
      const hasCol = t.columns.some((c) => c.name === cname);
      if (!hasCol) {
        findings.push({
          rule: 'broken-view',
          severity: 'error',
          table: v.name,
          category: 'broken',
          description: `View "${v.name}" references "${tname}.${cname}" which does not exist.`,
          plainTitle: `View "${v.name}" is broken`,
          plainWhat: `A "view" is a saved database query that acts like a table. This one tries to use a column called "${tname}.${cname}" - but that column doesn't exist (probably renamed or deleted at some point).`,
          plainWhy: `Anyone or any app trying to read from this view will get an error. It's silently broken until someone touches it.`,
          plainFix: `Update the view's saved query to use the new column name, or rebuild the view.`,
        });
      }
    }
  }
  return findings;
}
