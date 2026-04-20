// Detects tables matching staging/temp/_old patterns. These are usually leftovers from migrations.
// Note: row counts aren't always available in introspection (the base introspect skips them).
// This rule flags by name pattern alone; the user verifies emptiness before dropping.

import type { Schema, AuditFinding } from '../../types.js';

const STAGING_PATTERNS = [/_staging$/i, /^staging_/i, /^temp_/i, /_temp$/i, /_old$/i, /^_/i, /_backup$/i];

export function emptyStagingRule(schema: Schema): AuditFinding[] {
  const findings: AuditFinding[] = [];
  for (const t of schema.tables) {
    if (!STAGING_PATTERNS.some((re) => re.test(t.name))) continue;
    findings.push({
      rule: 'empty-staging',
      severity: 'info',
      table: t.name,
      description: `Table "${t.name}" matches a staging/temp/backup naming pattern. Verify it's no longer needed and drop.`,
      fixSql: `DROP TABLE IF EXISTS ${t.name}; -- verify empty/unused first`,
    });
  }
  return findings;
}
