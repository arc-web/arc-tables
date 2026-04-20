// Supabase adapter - uses the Management API (no direct DB exposure required).
// Endpoint: POST https://api.supabase.com/v1/projects/{ref}/database/query
// Auth: Bearer <PAT>

import { BaseAdapter, PG_QUERIES } from './base.js';
import type { Schema, Table, Column, ForeignKey, View } from '../types.js';

export class SupabaseAdapter extends BaseAdapter {
  constructor(
    private project: string,
    private pat: string,
  ) {
    super();
  }

  private async query<T = unknown>(sql: string): Promise<T[]> {
    const res = await fetch(
      `https://api.supabase.com/v1/projects/${this.project}/database/query`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.pat}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: sql }),
      },
    );
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Supabase API ${res.status}: ${body}`);
    }
    const data: unknown = await res.json();
    if (!Array.isArray(data)) {
      throw new Error(`Unexpected Supabase response: ${JSON.stringify(data).slice(0, 200)}`);
    }
    return data as T[];
  }

  async introspect(schema: string): Promise<Schema> {
    const [tableRows, columnRows, fkRows, viewRows] = await Promise.all([
      this.query<{ table_name: string; comment: string | null }>(PG_QUERIES.tables(schema)),
      this.query<{
        table_name: string;
        column_name: string;
        data_type: string;
        nullable: boolean;
        is_pk: boolean;
        comment: string | null;
      }>(PG_QUERIES.columns(schema)),
      this.query<{
        name: string;
        from_table: string;
        from_column: string;
        to_table: string;
        to_column: string;
        on_delete: string;
      }>(PG_QUERIES.foreignKeys(schema)),
      this.query<{ name: string; definition: string }>(PG_QUERIES.views(schema)),
    ]);

    // Group columns by table
    const colsByTable = new Map<string, Column[]>();
    for (const c of columnRows) {
      const list = colsByTable.get(c.table_name) ?? [];
      list.push({
        name: c.column_name,
        type: c.data_type,
        nullable: c.nullable,
        isPrimaryKey: c.is_pk,
        comment: c.comment ?? undefined,
      });
      colsByTable.set(c.table_name, list);
    }

    const tables: Table[] = tableRows.map((t) => ({
      name: t.table_name,
      schema,
      columns: colsByTable.get(t.table_name) ?? [],
      comment: t.comment ?? undefined,
    }));

    const foreignKeys: ForeignKey[] = fkRows.map((fk) => ({
      name: fk.name,
      fromTable: fk.from_table,
      fromColumn: fk.from_column,
      toTable: fk.to_table,
      toColumn: fk.to_column,
      onDelete: fk.on_delete as ForeignKey['onDelete'],
    }));

    const views: View[] = viewRows.map((v) => ({
      name: v.name,
      schema,
      definition: v.definition,
    }));

    return {
      profile: this.project,
      source: { kind: 'supabase', project: this.project },
      tables,
      views,
      foreignKeys,
    };
  }

  async getRowCount(schema: string, table: string): Promise<number> {
    const rows = await this.query<{ n: string | number }>(PG_QUERIES.rowCount(schema, table));
    return Number(rows[0]?.n ?? 0);
  }

  async close(): Promise<void> {
    // no persistent connection - nothing to close
  }
}
