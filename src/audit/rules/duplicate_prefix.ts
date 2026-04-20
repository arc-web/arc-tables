// Detects plural/singular naming inconsistency: tables both prefixed `clients_*` and `client_*`.
// Recommendation: standardize on the singular prefix to match the join-table convention.

import type { Schema, AuditFinding } from '../../types.js';

export function duplicatePrefixRule(schema: Schema): AuditFinding[] {
  const findings: AuditFinding[] = [];
  const tables = schema.tables.map((t) => t.name);
  const prefixGroups = new Map<string, string[]>();
  for (const name of tables) {
    const m = name.match(/^([a-z]+?)s?_(.+)$/);
    if (!m) continue;
    const stem = m[1];
    const suffix = m[2];
    const key = `${stem}|${suffix}`;
    const list = prefixGroups.get(key) ?? [];
    list.push(name);
    prefixGroups.set(key, list);
  }
  // Look for stem with both plural and singular variants
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
        description: `Table "${name}" and "${singular}" both exist - inconsistent plural/singular prefix. Standardize on "${singular}".`,
        fixSql: `ALTER TABLE ${name} RENAME TO ${singular}_legacy; -- review then merge data from ${singular}_legacy into ${singular}`,
      });
    }
  }
  // Also flag isolated plurals (no singular sibling) when other tables in the schema use the singular form
  const stems = new Set(tables.map((n) => n.match(/^([a-z]+?)_/)?.[1]).filter(Boolean) as string[]);
  for (const name of tables) {
    const m = name.match(/^([a-z]+?)s_(.+)$/);
    if (!m) continue;
    const stem = m[1];
    if (stems.has(stem) && !tables.includes(`${stem}_${m[2]}`)) {
      findings.push({
        rule: 'duplicate-prefix',
        severity: 'info',
        table: name,
        description: `Table "${name}" uses plural prefix "${stem}s_" but other tables use singular "${stem}_". Consider renaming to "${stem}_${m[2]}" for consistency.`,
        fixSql: `ALTER TABLE ${name} RENAME TO ${stem}_${m[2]};`,
      });
    }
  }
  return findings;
}
