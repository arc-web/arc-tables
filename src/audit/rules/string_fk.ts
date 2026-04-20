import type { Schema, AuditFinding } from '../../types.js';

export function stringFkRule(schema: Schema): AuditFinding[] {
  const findings: AuditFinding[] = [];
  const tableByName = new Map(schema.tables.map((t) => [t.name, t]));

  for (const fk of schema.foreignKeys) {
    if (fk.toColumn === 'id') continue;
    const targetTable = tableByName.get(fk.toTable);
    if (!targetTable) continue;
    const hasIdPk = targetTable.columns.some((c) => c.name === 'id' && c.isPrimaryKey);
    if (!hasIdPk) continue;
    findings.push({
      rule: 'string-fk',
      severity: 'warning',
      table: fk.fromTable,
      column: fk.fromColumn,
      category: 'connection',
      description: `FK "${fk.name}" targets ${fk.toTable}.${fk.toColumn} (text) instead of ${fk.toTable}.id (uuid).`,
      fixSql: `ALTER TABLE ${fk.fromTable} DROP CONSTRAINT ${fk.name};`,
      plainTitle: `"${fk.fromTable}" links to "${fk.toTable}" using text, not a proper ID`,
      plainWhat: `The connection between these two tables uses the "${fk.toColumn}" column as the link instead of an ID number. Think of it like organizing a filing cabinet by people's first names instead of employee ID numbers.`,
      plainWhy: `Text-based links break the moment you rename anything. Two records with the same name get tangled. It's slower for the database to look up. The proper way is to use the unique ID that never changes.`,
      plainFix: `Drop the text-based connection. There's already an ID-based connection available, or one needs to be added.`,
    });
  }
  return findings;
}
