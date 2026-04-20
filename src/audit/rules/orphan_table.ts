// Detects tables with no FKs in or out (relationally isolated).
// Doesn't always mean delete - could be lookup tables - but flags for human review.

import type { Schema, AuditFinding } from '../../types.js';

export function orphanTableRule(schema: Schema): AuditFinding[] {
  const inFk = new Set<string>();
  const outFk = new Set<string>();
  for (const fk of schema.foreignKeys) {
    outFk.add(fk.fromTable);
    inFk.add(fk.toTable);
  }
  const findings: AuditFinding[] = [];
  for (const t of schema.tables) {
    if (!inFk.has(t.name) && !outFk.has(t.name)) {
      findings.push({
        rule: 'orphan-table',
        severity: 'info',
        table: t.name,
        description: `Table "${t.name}" has no foreign keys in or out. Verify it's still in use, or drop if obsolete.`,
      });
    }
  }
  return findings;
}
