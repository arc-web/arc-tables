// Detects plural/singular naming inconsistency.
import type { Schema, AuditFinding } from '../../types.js';

export function duplicatePrefixRule(schema: Schema): AuditFinding[] {
  const findings: AuditFinding[] = [];
  const tables = schema.tables.map((t) => t.name);
  const seen = new Set<string>();
  for (const name of tables) {
    const m = name.match(/^([a-z]+?)s_(.+)$/);
    if (!m) continue;
    const stem = m[1];
    const suffix = m[2];
    const singular = `${stem}_${suffix}`;
    if (tables.includes(singular)) {
      const pair = [name, singular].sort().join('|');
      if (seen.has(pair)) continue;
      seen.add(pair);
      findings.push({
        rule: 'duplicate-prefix',
        severity: 'warning',
        table: name,
        category: 'naming',
        description: `Tables "${name}" and "${singular}" both exist - inconsistent plural/singular prefix.`,
        fixSql: `ALTER TABLE ${name} RENAME TO ${singular}_legacy; -- review then merge data into ${singular}`,
        plainTitle: `Two tables doing the same job: "${name}" and "${singular}"`,
        plainWhat: `You have two tables with almost-identical names - one with an "s" and one without. They're probably tracking the same kind of thing but in different places.`,
        plainWhy: `When data ends up in two near-identical tables, no one knows which one is the "real" one. Reports get inconsistent. Apps pull from one, agents save to the other.`,
        plainFix: `Pick the singular name as the standard, move any data from the plural one into it, then drop the duplicate.`,
      });
    }
  }
  // Isolated plurals when other tables use singular
  const stems = new Set(tables.map((n) => n.match(/^([a-z]+?)_/)?.[1]).filter(Boolean) as string[]);
  for (const name of tables) {
    const m = name.match(/^([a-z]+?)s_(.+)$/);
    if (!m) continue;
    const stem = m[1];
    if (stems.has(stem) && !tables.includes(`${stem}_${m[2]}`)) {
      const newName = `${stem}_${m[2]}`;
      findings.push({
        rule: 'duplicate-prefix',
        severity: 'info',
        table: name,
        category: 'naming',
        description: `Table "${name}" uses plural prefix while other "${stem}_*" tables are singular.`,
        fixSql: `ALTER TABLE ${name} RENAME TO ${newName};`,
        plainTitle: `"${name}" doesn't match the naming style of similar tables`,
        plainWhat: `Most of your tables that relate to "${stem}" use the singular form ("${stem}_..."). This one is plural ("${stem}s_..."). It's just inconsistent naming.`,
        plainWhy: `Mixed naming makes the database harder to learn and easier to mistype. People will guess wrong about what a table is called.`,
        plainFix: `Rename it to "${newName}" so it matches everything else.`,
      });
    }
  }
  return findings;
}
