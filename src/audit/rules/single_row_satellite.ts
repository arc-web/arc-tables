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
    if (t.columns.length > 12) continue;

    // Find the parent
    const parentFk = schema.foreignKeys.find((fk) => fk.fromTable === t.name);
    const parent = parentFk?.toTable ?? 'its parent table';

    findings.push({
      rule: 'single-row-satellite',
      severity: 'info',
      table: t.name,
      category: 'structure',
      description: `Table "${t.name}" looks like a single-row-per-parent satellite.`,
      plainTitle: `"${t.name}" might just be extra columns on "${parent}"`,
      plainWhat: `This is its own table, but it only connects to one other table ("${parent}") and doesn't track any history (no created_at/version/effective_from). It's basically holding a few extra fields about each ${parent} record.`,
      plainWhy: `Splitting things into separate tables makes sense when you have many entries per parent or when you need history. For one-row-per-parent with no history, it's simpler to just add those columns directly to the parent table - one less join, one less thing to keep in sync.`,
      plainFix: `Move the columns from "${t.name}" onto "${parent}", then drop "${t.name}".`,
    });
  }
  return findings;
}
