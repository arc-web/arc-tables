import { writeFile } from 'node:fs/promises';
import { getProfile } from '../profile.js';
import { adapterFromProfile } from '../adapters/index.js';
import { runAudit } from '../audit/runner.js';
import { renderAudit } from '../render/templates/audit.js';
import { renderAuditCards } from '../render/templates/audit_cards.js';

interface AuditOpts {
  profile: string;
  schema: string;
  output: string;
  sql: string;
  format: 'cards' | 'list';
}

export async function audit(opts: AuditOpts): Promise<void> {
  const profile = await getProfile(opts.profile);
  const adapter = await adapterFromProfile(profile);
  try {
    const schema = await adapter.introspect(opts.schema);
    const findings = runAudit(schema);
    console.log(`Found ${findings.length} issues across ${schema.tables.length} tables.`);

    const html = opts.format === 'list' ? renderAudit(schema, findings) : renderAuditCards(schema, findings);
    await writeFile(opts.output, html, 'utf8');
    console.log(`Wrote ${opts.format} report: ${opts.output}`);

    // Always emit the raw SQL as well - users can grab it from the summary tab too
    const sqlLines: string[] = [
      '-- arc-tables suggested fixes',
      `-- Generated against profile "${opts.profile}", schema "${opts.schema}"`,
      `-- Review every statement before running.`,
      '',
    ];
    for (const f of findings) {
      if (!f.fixSql) continue;
      sqlLines.push(`-- [${f.rule}] ${f.plainTitle}`);
      sqlLines.push(f.fixSql);
      sqlLines.push('');
    }
    await writeFile(opts.sql, sqlLines.join('\n'), 'utf8');
    console.log(`Wrote SQL: ${opts.sql}`);
  } finally {
    await adapter.close();
  }
}
