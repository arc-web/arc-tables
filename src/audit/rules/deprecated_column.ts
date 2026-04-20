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
          category: 'cleanup',
          description: `Column "${t.name}.${c.name}" is marked deprecated/legacy.`,
          fixSql: `ALTER TABLE ${t.name} DROP COLUMN ${c.name}; -- verify no dependents first`,
          plainTitle: `Old column left behind: "${t.name}.${c.name}"`,
          plainWhat: `Someone marked this column as "deprecated" or "legacy" - meaning they renamed or replaced it but never deleted the original. It's been sitting there ever since, possibly empty or full of stale data.`,
          plainWhy: `Old unused columns confuse anyone reading the schema. They might still be holding wrong/outdated data that nobody's looking at. Best case: clutter. Worst case: source of bugs.`,
          plainFix: `Confirm nothing's reading from it anymore, then drop the column.`,
        });
      }
    }
  }
  return findings;
}
