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
      category: 'cleanup',
      description: `Table "${t.name}" matches a staging/temp/backup naming pattern.`,
      fixSql: `DROP TABLE IF EXISTS ${t.name}; -- verify empty/unused first`,
      plainTitle: `"${t.name}" looks like leftover scratch work`,
      plainWhat: `The name follows a "staging", "temp", "backup", or "old" pattern - the kind of name developers give to a table they're using briefly during a data import, migration, or test.`,
      plainWhy: `These tables are usually meant to be temporary but get forgotten. They sit in the database taking up space and confusing anyone trying to understand the schema.`,
      plainFix: `Confirm it's not actively used anymore, then drop it.`,
    });
  }
  return findings;
}
