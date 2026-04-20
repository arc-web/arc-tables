// Direct Postgres adapter - uses node-postgres (`pg`).
// For when you have a connection string and don't want to go through an API.

import { BaseAdapter, PG_QUERIES } from './base.js';
import type { Schema, Table, Column, ForeignKey, View } from '../types.js';
import pg from 'pg';
const { Client } = pg;

export class PostgresAdapter extends BaseAdapter {
  private client: pg.Client;

  constructor(connectionString: string) {
    super();
    this.client = new Client({ connectionString });
  }

  private async ensure() {
    // @ts-expect-error - pg client doesn't expose connected state
    if (!this.client._connected) await this.client.connect();
  }

  async introspect(schema: string): Promise<Schema> {
    await this.ensure();
    const [tableRes, columnRes, fkRes, viewRes] = await Promise.all([
      this.client.query(PG_QUERIES.tables(schema)),
      this.client.query(PG_QUERIES.columns(schema)),
      this.client.query(PG_QUERIES.foreignKeys(schema)),
      this.client.query(PG_QUERIES.views(schema)),
    ]);

    const colsByTable = new Map<string, Column[]>();
    for (const c of columnRes.rows) {
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

    const tables: Table[] = tableRes.rows.map((t) => ({
      name: t.table_name,
      schema,
      columns: colsByTable.get(t.table_name) ?? [],
      comment: t.comment ?? undefined,
    }));

    const foreignKeys: ForeignKey[] = fkRes.rows.map((fk) => ({
      name: fk.name,
      fromTable: fk.from_table,
      fromColumn: fk.from_column,
      toTable: fk.to_table,
      toColumn: fk.to_column,
      onDelete: fk.on_delete as ForeignKey['onDelete'],
    }));

    const views: View[] = viewRes.rows.map((v) => ({
      name: v.name,
      schema,
      definition: v.definition,
    }));

    return {
      profile: this.client.database ?? 'postgres',
      source: {
        kind: 'postgres',
        host: this.client.host ?? 'unknown',
        database: this.client.database ?? 'unknown',
      },
      tables,
      views,
      foreignKeys,
    };
  }

  async close(): Promise<void> {
    await this.client.end().catch(() => {});
  }
}
