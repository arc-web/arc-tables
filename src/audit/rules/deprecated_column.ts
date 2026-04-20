// Detects columns ending in `_deprecated` or `_legacy` - candidates for removal once dependents are gone.

import type { Schema, AuditFinding } from '../../types.js';

export function deprecatedColumnRule(schema: Schema): AuditFinding[] {
  const findings: AuditFinding[] = [];
  for (const t of schema.tables) {
    for (const c of t.columns) {
      if (/(_deprecated|_legacy)$/i.test(c.name)) {
        findings.push({
          rule: 'deprecated-column',
          severity: 'info',
          table: t.name,
          column: c.name,
          description: `Column "${t.name}.${c.name}" is marked deprecated/legacy. Confirm no dependents, then drop.`,
          fixSql: `ALTER TABLE ${t.name} DROP COLUMN ${c.name}; -- verify no dependents first`,
        });
      }
    }
  }
  return findings;
}
