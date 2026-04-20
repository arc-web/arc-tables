// Detects views whose definition references a column that no longer exists on the underlying table.
// Heuristic match - parses the view definition for "table.column" patterns and verifies them.

import type { Schema, AuditFinding } from '../../types.js';

export function brokenViewRule(schema: Schema): AuditFinding[] {
  const findings: AuditFinding[] = [];
  const tableByName = new Map(schema.tables.map((t) => [t.name, t]));

  for (const v of schema.views) {
    // Match `table_name.column_name` patterns (very rough)
    const refs = [...v.definition.matchAll(/\b([a-z_]+)\.([a-z_]+)\b/g)];
    const seen = new Set<string>();
    for (const m of refs) {
      const tname = m[1];
      const cname = m[2];
      const key = `${tname}.${cname}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const t = tableByName.get(tname);
      if (!t) continue; // could be an alias, skip
      const hasCol = t.columns.some((c) => c.name === cname);
      if (!hasCol) {
        findings.push({
          rule: 'broken-view',
          severity: 'error',
          table: v.name,
          description: `View "${v.name}" references "${tname}.${cname}" which does not exist on table "${tname}". View will fail when queried.`,
        });
      }
    }
  }
  return findings;
}
