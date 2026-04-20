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
      category: 'cleanup',
      description: `Tables ${names.map((n) => `"${n}"`).join(' and ')} differ only by case.`,
      fixSql: upper.length > 0 ? upper.map((u) => `DROP TABLE IF EXISTS "${u}"; -- verify empty/unused first`).join('\n') : undefined,
      plainTitle: `Two tables with the same name, different capitalization: ${names.join(' & ')}`,
      plainWhat: `Two tables exist with the same letters but different upper/lower-case (like "Foo" and "foo"). The database treats them as separate, but they're almost certainly meant to be one table.`,
      plainWhy: `Usually the uppercase one is leftover from an old script that didn't follow naming conventions. Whoever's reading the schema can't tell which one is "the real one" and might write to the wrong table.`,
      plainFix: `Pick the lowercase version (database convention), copy any data from the uppercase version into it, then drop the uppercase one.`,
    });
  }
  return findings;
}
