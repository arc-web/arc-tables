# ARC Tables

Animated HTML schema maps + auditor for any database. Built for people who'd rather see a database than read it.

Point it at Postgres, Supabase, MySQL, or SQLite. Get back a futuristic-looking interactive HTML map with color-coded table groups, animated FK flows, hover-to-isolate, plain-English tooltips - and a lint pass that flags orphans, duplicate prefixes, ambiguous columns, and legacy patterns with the SQL to fix them.

## Install

```bash
npm install -g @arc-web/arc-tables
```

## Quick Start

```bash
# Connect to a Supabase project
arc-tables connect supabase \
  --pat "op://ARC/Supabase MCP Master Token/credential" \
  --project pqwfnhbltsygwaiefnru \
  --as arc-prod

# Generate the schema map
arc-tables map --profile arc-prod --output ecosystem.html
open ecosystem.html

# Run the audit
arc-tables audit --profile arc-prod --output audit.html --sql fixes.sql
```

## Connection Profiles

Profiles live in `~/.arc-tables/profiles.json`. Secrets can be raw values or 1Password references (`op://...`) - references are resolved at runtime via the `op` CLI.

```bash
arc-tables connect supabase --pat $PAT --project <ref> --as arc-prod
arc-tables connect postgres --conn "postgres://user:pass@host:5432/db" --as my-pg
arc-tables connect sqlite --path ./local.db --as scratch
```

## Annotations

Add plain-English descriptions, color groups, and manual layout via a sidecar YAML next to where you run the CLI:

```yaml
profile: arc-prod
groups:
  anchors:    { color: white,  members: [companies, contacts] }
  pipeline:   { color: orange, members: [leads] }
  core:       { color: cyan,   members: [clients] }
  financial:  { color: green,  members: [client_transactions, client_budget] }
  people:     { color: purple, members: [client_contacts, client_comms] }
tables:
  clients:
    description: "Signed contracts and account-level data."
  client_information:
    flag: "orphaned-no-fk"
layout:
  companies: { x: 600, y: 20 }
  clients:   { x: 560, y: 240 }
```

Sidecar wins over `COMMENT ON TABLE` / `COMMENT ON COLUMN` from the database itself.

```bash
arc-tables annotate --profile arc-prod  # opens the sidecar in $EDITOR
```

## Audit Rules

| Rule | What it catches |
|---|---|
| `duplicate-prefix` | Plural/singular mismatch (`clients_X` and `client_X` both exist) |
| `string-fk` | FKs targeting a text column when an `id` PK exists on the parent |
| `ambiguous-name` | Bare `name` columns that should be `{table}_name` |
| `deprecated-column` | Columns ending in `_deprecated` or `_legacy` |
| `orphan-table` | Tables with no FKs in or out |
| `single-row-satellite` | Tables that should probably be columns on the parent |
| `empty-staging` | Tables matching `*_staging`, `temp_*`, `*_old`, `*_backup` |
| `casing-duplicate` | Two tables differing only by case (e.g. `Foo` and `foo`) |
| `broken-view` | Views referencing non-existent columns |

The audit emits both an interactive HTML report and a `fixes.sql` file with commented-out SQL ready to review and apply manually. Nothing is run automatically.

## Embedding Programmatically

```ts
import { SupabaseAdapter, runAudit, renderMap } from '@arc-web/arc-tables';

const adapter = new SupabaseAdapter('project-ref', process.env.SUPABASE_PAT!);
const schema = await adapter.introspect('public');
const findings = runAudit(schema);
const html = renderMap(schema, undefined);
```

## Repo

```
src/
  adapters/    # Postgres, Supabase, MySQL, SQLite, SSH
  introspect/  # Schema reader
  annotate/    # Sidecar YAML + DB COMMENT fallback
  audit/       # Lint rules + runner
  render/      # Theme, cards, paths, layout, templates
  commands/    # CLI command handlers
```

## Status

v0.1 - foundation + Supabase adapter + map/audit/flow templates + 9 audit rules.
v0.2 - Postgres direct, sidecar annotation editor, polished flow template.
v0.3 - MySQL, SQLite, SSH adapters.
v0.4 - Python plugin interface for custom rules.
