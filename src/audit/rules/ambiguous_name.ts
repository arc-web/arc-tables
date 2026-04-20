// Detects bare "name" columns. Recommendation: rename to {table}_name for clarity in joins/queries.

import type { Schema, AuditFinding } from '../../types.js';

export function ambiguousNameRule(schema: Schema): AuditFinding[] {
  const findings: AuditFinding[] = [];
  for (const t of schema.tables) {
    const hasName = t.columns.some((c) => c.name === 'name');
    if (!hasName) continue;
    // Singularize for the new name
    const stem = t.name.replace(/s$/, '');
    findings.push({
      rule: 'ambiguous-name',
      severity: 'info',
      table: t.name,
      column: 'name',
      description: `Column "${t.name}.name" is ambiguous in joins. Rename to "${stem}_name" for clarity.`,
      fixSql: `ALTER TABLE ${t.name} RENAME COLUMN name TO ${stem}_name;`,
    });
  }
  return findings;
}
