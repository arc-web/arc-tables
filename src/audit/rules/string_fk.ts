// Detects FK constraints that target a non-id text column when an id sibling exists.
// Example caught this session: client_information.client_name FK -> clients.name,
// while clients.id was the proper UUID PK. Recommendation: drop the string FK,
// keep/add the id-based FK instead.

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
      description: `FK "${fk.name}" targets ${fk.toTable}.${fk.toColumn} (text) instead of ${fk.toTable}.id (uuid). Drop the string FK and link by id.`,
      fixSql: `ALTER TABLE ${fk.fromTable} DROP CONSTRAINT ${fk.name};`,
    });
  }
  return findings;
}
