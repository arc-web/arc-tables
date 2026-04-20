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
        category: 'cleanup',
        description: `Table "${t.name}" has no foreign keys in or out.`,
        plainTitle: `"${t.name}" doesn't connect to anything else`,
        plainWhat: `This table is sitting alone in your database. Nothing links into it, and it doesn't link out to anything either. It's a relational island.`,
        plainWhy: `Could be a totally fine standalone table (a list of countries, a settings store, a log). Or it could be leftover from an old experiment that nobody removed. Worth a quick "is this still in use?" check.`,
        plainFix: `If it's still being used by your apps or agents, leave it. If it's leftover, drop it.`,
      });
    }
  }
  return findings;
}
