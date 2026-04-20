// Detects two tables that differ only by case (e.g. "GHL_ARC_Calendars" and "ghl_arc_calendars").
// Postgres preserves case for quoted identifiers, so both can coexist - usually a bug.

import type { Schema, AuditFinding } from '../../types.js';

export function casingDuplicateRule(schema: Schema): AuditFinding[] {
  const findings: AuditFinding[] = [];
  const byLower = new Map<string, string[]>();
  for (const t of schema.tables) {
    const key = t.name.toLowerCase();
    const list = byLower.get(key) ?? [];
    list.push(t.name);
    byLower.set(key, list);
  }
  for (const [, names] of byLower) {
    if (names.length < 2) continue;
    const lower = names.find((n) => n === n.toLowerCase());
    const upper = names.filter((n) => n !== lower);
    findings.push({
      rule: 'casing-duplicate',
      severity: 'warning',
      table: names.join(' / '),
      description: `Tables ${names.map((n) => `"${n}"`).join(' and ')} differ only by case. Keep the lowercase version (Postgres convention).`,
      fixSql: upper.length > 0 ? upper.map((u) => `DROP TABLE IF EXISTS "${u}"; -- verify empty/unused first`).join('\n') : undefined,
    });
  }
  return findings;
}
