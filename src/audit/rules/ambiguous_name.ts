import type { Schema, AuditFinding } from '../../types.js';

export function ambiguousNameRule(schema: Schema): AuditFinding[] {
  const findings: AuditFinding[] = [];
  for (const t of schema.tables) {
    const hasName = t.columns.some((c) => c.name === 'name');
    if (!hasName) continue;
    const stem = t.name.replace(/s$/, '');
    findings.push({
      rule: 'ambiguous-name',
      severity: 'info',
      table: t.name,
      column: 'name',
      category: 'naming',
      description: `Column "${t.name}.name" is ambiguous in joins.`,
      fixSql: `ALTER TABLE ${t.name} RENAME COLUMN name TO ${stem}_name;`,
      plainTitle: `"${t.name}" has a column just called "name"`,
      plainWhat: `The column is called "name" with no context. When you pull data from this table next to another table that also has a "name" column, you can't tell them apart.`,
      plainWhy: `Imagine a spreadsheet where two columns are both labeled "name" - is that a person's name? A company name? A project name? You'd have to guess every time.`,
      plainFix: `Rename it to "${stem}_name" so it's obvious what kind of name it is.`,
    });
  }
  return findings;
}
