import { Command } from 'commander';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf8')) as { version: string };

const program = new Command();

program
  .name('arc-tables')
  .description('Database schema visualizer + auditor')
  .version(pkg.version);

program
  .command('connect <kind>')
  .description('Save a connection profile (supabase | postgres | mysql | sqlite)')
  .option('--pat <pat>', 'Supabase Personal Access Token')
  .option('--project <ref>', 'Supabase project ref')
  .option('--conn <connstr>', 'Postgres/MySQL connection string')
  .option('--path <file>', 'SQLite file path')
  .requiredOption('--as <profile>', 'Profile name to save under')
  .action(async (kind, opts) => {
    const { connect } = await import('./commands/connect.js');
    await connect(kind, opts);
  });

program
  .command('map')
  .description('Generate the full ecosystem HTML map')
  .requiredOption('--profile <name>', 'Connection profile to use')
  .option('--schema <name>', 'Database schema', 'public')
  .option('--output <file>', 'Output HTML file', 'arc-tables-map.html')
  .action(async (opts) => {
    const { map } = await import('./commands/map.js');
    await map(opts);
  });

program
  .command('flow')
  .description('Generate a lifecycle flow diagram between tables')
  .requiredOption('--profile <name>', 'Connection profile')
  .requiredOption('--from <table>', 'Source table')
  .requiredOption('--to <table>', 'Destination table')
  .option('--through <tables>', 'Comma-separated intermediate tables')
  .option('--output <file>', 'Output HTML file', 'arc-tables-flow.html')
  .action(async (opts) => {
    const { flow } = await import('./commands/flow.js');
    await flow(opts);
  });

program
  .command('audit')
  .description('Run lint rules and emit issues + suggested fix SQL')
  .requiredOption('--profile <name>', 'Connection profile')
  .option('--schema <name>', 'Database schema', 'public')
  .option('--output <file>', 'Output HTML report', 'arc-tables-audit.html')
  .option('--sql <file>', 'Output SQL fix file', 'arc-tables-fixes.sql')
  .action(async (opts) => {
    const { audit } = await import('./commands/audit.js');
    await audit(opts);
  });

program
  .command('annotate')
  .description('Edit annotations sidecar (opens $EDITOR)')
  .requiredOption('--profile <name>', 'Connection profile')
  .option('--table <name>', 'Pre-position cursor on this table')
  .action(async (opts) => {
    const { annotate } = await import('./commands/annotate.js');
    await annotate(opts);
  });

program.parseAsync().catch((err) => {
  console.error(err);
  process.exit(1);
});
