# arc-tables

**Stop squinting at database diagrams. Get a live, interactive map of your entire schema — plus an AI-powered audit that explains every issue in plain English.**

Point arc-tables at your Postgres or Supabase database. Out comes a single HTML file: a gorgeous animated diagram of every table, every FK link, color-coded by group. Hover to isolate. Click to zoom. Then run the built-in auditor and get 144 issues highlighted as swipeable cards with the exact SQL to fix them.

No server. No deployment. No config. Just *click* and understand your database.

---

## What you get

### 📊 Schema visualization
Every table laid out with animated FK flow lines. Color-coded by group (anchors, pipeline, people, financial, ops). Hover to dim everything except what you're looking at. One HTML file, opens in any browser.

### 🎯 Plain-English audit
Instead of raw SQL, each issue gets explained in three parts:
- **What** — the specific problem (e.g., "this column uses names instead of IDs")
- **Why it matters** — the actual consequence (e.g., "if a client is renamed, the link breaks")
- **Fix** — step-by-step plain English, plus the exact SQL

### 🃏 Tinder-style review
One card at a time. Swipe to accept, skip, or dismiss. Notes persist to localStorage. Jump to a diagram of the affected table with one click. See your progress as you go.

### 🗺️ Lifecycle flows
Trace a specific path through your schema — from leads to clients to transactions. See how data moves. Understand dependencies at a glance.

---

## The audit rules

arc-tables ships with 9 built-in rules, each one modeled on a real schema issue:

1. **Duplicate-prefix orphans** — Tables named both `clients_X` and `client_X` (plural/singular mismatch)
2. **String FK columns** — Foreign keys using name-based links (`client_name`) instead of IDs
3. **Ambiguous name columns** — Bare `name` columns that collide in joins
4. **Deprecated columns** — `*_deprecated` columns left after migration
5. **Orphan tables** — Tables with no FK in or out
6. **Single-row satellites** — Tables that should be columns (one row per parent, no time axis)
7. **Empty staging tables** — `*_staging` and `temp_*` tables with zero rows
8. **Casing duplicates** — Both `Foo` and `foo` existing in the same schema
9. **Broken views** — Views referencing columns or tables that no longer exist

Every rule comes with the exact SQL to fix it. Every SQL block is commented with the issue it solves.

---

## Quick start

### Install

```bash
# global
npm install -g @arc-web/arc-tables

# or run without installing
npx @arc-web/arc-tables --help
```

### Connect to your database

```bash
# Supabase
arc-tables connect supabase --project your-project-ref --as mydb

# Postgres
arc-tables connect postgres --host localhost --database mydb --as mydb
```

Credentials are never sent anywhere. They're stored locally in `~/.arc-tables/profiles.json`.

### Generate your first audit

```bash
arc-tables audit --profile mydb --format cards --output audit.html
```

Then open `audit.html` in your browser.

```
Found 144 issues across 166 tables.
Wrote card report: audit.html
Wrote SQL: fixes.sql
```

Each issue is one swipeable card. Accept a fix, and it adds the SQL to `fixes.sql`. Review the file, run it when you're ready.

### Also available

```bash
# Full schema map (all tables, all FKs)
arc-tables map --profile mydb --output schema.html

# Lifecycle flow (trace a path through your schema)
arc-tables flow --from leads --to clients --through client_transactions --output flow.html

# Edit annotations (colors, descriptions, group labels)
arc-tables annotate --table clients
```

---

## How it works

1. **Connect** — Point at your database (Supabase PAT, Postgres connection string, or local file)
2. **Introspect** — Reads all tables, columns, FKs, views, indexes. Read-only, no schema changes.
3. **Audit** — Runs 9 rules. Each issue gets a plain-English explanation and the SQL to fix it.
4. **Review** — Open the HTML in your browser. One card at a time. Accept fixes or dismiss.
5. **Fix** — Run the generated SQL whenever you're ready.

---

## Annotations

Customize how tables are displayed with a sidecar YAML file:

```yaml
# arc-tables.yaml
groups:
  anchors:
    color: white
    members: [companies, contacts]
  pipeline:
    color: orange
    members: [leads, leads_events]
  core:
    color: cyan
    members: [clients, client_contacts, client_comms]
  financial:
    color: green
    members: [client_transactions, client_budget]

tables:
  clients:
    description: "Signed contracts and account-level data."
    columns:
      company_id: "Links to the org identity"
      status: "active, paused, closed"
```

Run `arc-tables annotate --table clients` to edit in your `$EDITOR`. Annotations automatically apply to all output files.

---

## Features

- ✅ Single-file HTML output (no server, no deps)
- ✅ Works with Supabase, Postgres, MySQL, SQLite (adapters coming)
- ✅ SSH tunnel support for remote databases
- ✅ 9 audit rules with plain-English copy
- ✅ Sidecar YAML annotations for custom colors, descriptions, groups
- ✅ Tinder-style card review UI with localStorage persistence
- ✅ Interactive diagram per issue (pan, zoom, show FK neighbors)
- ✅ Generated SQL comments with per-rule source
- ✅ No write operations — read-only introspection only

---

## What's NOT here (yet)

- Schema editing through the UI (fixes are reviewed as SQL)
- Auto-apply of suggested SQL (you run it yourself)
- Hosted/SaaS version (CLI only)
- Migration generation (just fix suggestions)

---

## License

MIT. Built with TypeScript, commander, pg, and SVG.

---

## Examples

**Before arc-tables:**
- Squinting at database docs that are 6 months out of date
- Spending 2 hours tracing which tables link to which
- Finding naming inconsistencies and orphans by hand
- Writing migration SQL with no idea if it'll work

**After arc-tables:**
- Open audit.html, see all 144 issues color-coded by severity
- Click "Accept fix" on the string FK issue, SQL is ready to review
- Spot the `clients_X` vs `client_X` mismatch immediately
- Read "why it matters" before running any SQL
- 30 minutes from schema introspection to production-ready fixes

---

Have questions? Open an issue on GitHub or read the full docs at [arc-web.github.io/arc-tables](https://arc-web.github.io/arc-tables).
