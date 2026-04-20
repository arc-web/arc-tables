import { writeFile } from 'node:fs/promises';
import { getProfile } from '../profile.js';
import { adapterFromProfile } from '../adapters/index.js';
import { runAudit } from '../audit/runner.js';
import { renderAudit } from '../render/templates/audit.js';

interface AuditOpts {
  profile: string;
  schema: string;
  output: string;
  sql: string;
}

export async function audit(opts: AuditOpts): Promise<void> {
  const profile = await getProfile(opts.profile);
  const adapter = await adapterFromProfile(profile);
  try {
    const schema = await adapter.introspect(opts.schema);
    const findings = runAudit(schema);
    console.log(`Found ${findings.length} issues across ${schema.tables.length} tables.`);

    // HTML report
    const html = renderAudit(schema, findings);
    await writeFile(opts.output, html, 'utf8');
    console.log(`Wrote report: ${opts.output}`);

    // SQL fix file
    const sqlLines: string[] = [
      '-- arc-tables suggested fixes',
      `-- Generated against profile "${opts.profile}", schema "${opts.schema}"`,
      `-- Review every statement before running.`,
      '',
    ];
    for (const f of findings) {
      if (!f.fixSql) continue;
      sqlLines.push(`-- [${f.rule}] ${f.description}`);
      sqlLines.push(f.fixSql);
      sqlLines.push('');
    }
    await writeFile(opts.sql, sqlLines.join('\n'), 'utf8');
    console.log(`Wrote SQL: ${opts.sql}`);
  } finally {
    await adapter.close();
  }
}
