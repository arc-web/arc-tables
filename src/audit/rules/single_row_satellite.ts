// Detects "satellite" tables that point to a parent via a single FK and have no time component.
// These often should just be columns on the parent table.
// Heuristic: table has 1 FK out (to a parent) and no created_at/effective_from/version columns.

import type { Schema, AuditFinding } from '../../types.js';

export function singleRowSatelliteRule(schema: Schema): AuditFinding[] {
  const findings: AuditFinding[] = [];
  const fksByTable = new Map<string, number>();
  for (const fk of schema.foreignKeys) {
    fksByTable.set(fk.fromTable, (fksByTable.get(fk.fromTable) ?? 0) + 1);
  }
  const TIME_COLS = ['effective_from', 'effective_until', 'version', 'is_current_version', 'started_at', 'ended_at', 'archived_at'];
  for (const t of schema.tables) {
    if ((fksByTable.get(t.name) ?? 0) !== 1) continue;
    const hasTime = t.columns.some((c) => TIME_COLS.includes(c.name));
    if (hasTime) continue;
    if (t.columns.length > 12) continue; // wide tables likely warrant their own existence
    findings.push({
      rule: 'single-row-satellite',
      severity: 'info',
      table: t.name,
      description: `Table "${t.name}" looks like a single-row-per-parent satellite (1 FK out, no time component). Consider folding its columns into the parent table.`,
    });
  }
  return findings;
}
