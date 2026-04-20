import type { Adapter, Schema } from '../types.js';

export abstract class BaseAdapter implements Adapter {
  abstract introspect(schema: string): Promise<Schema>;
  abstract close(): Promise<void>;
}

// Shared SQL queries used by Postgres + Supabase adapters
export const PG_QUERIES = {
  tables: (schema: string) => `
    SELECT table_name, obj_description((quote_ident(table_schema)||'.'||quote_ident(table_name))::regclass, 'pg_class') AS comment
    FROM information_schema.tables
    WHERE table_schema = '${schema}' AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `,
  columns: (schema: string) => `
    SELECT
      c.table_name,
      c.column_name,
      c.data_type,
      c.is_nullable = 'YES' AS nullable,
      EXISTS (
        SELECT 1 FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON kcu.constraint_name = tc.constraint_name AND kcu.table_schema = tc.table_schema
        WHERE tc.table_schema = c.table_schema
          AND tc.table_name = c.table_name
          AND tc.constraint_type = 'PRIMARY KEY'
          AND kcu.column_name = c.column_name
      ) AS is_pk,
      col_description((quote_ident(c.table_schema)||'.'||quote_ident(c.table_name))::regclass, c.ordinal_position) AS comment
    FROM information_schema.columns c
    WHERE c.table_schema = '${schema}'
    ORDER BY c.table_name, c.ordinal_position
  `,
  foreignKeys: (schema: string) => `
    SELECT
      con.conname AS name,
      cl.relname AS from_table,
      a.attname AS from_column,
      ft.relname AS to_table,
      af.attname AS to_column,
      CASE con.confdeltype
        WHEN 'c' THEN 'CASCADE'
        WHEN 'n' THEN 'SET NULL'
        WHEN 'r' THEN 'RESTRICT'
        ELSE 'NO ACTION'
      END AS on_delete
    FROM pg_constraint con
    JOIN pg_class cl ON cl.oid = con.conrelid
    JOIN pg_namespace ns ON ns.oid = cl.relnamespace
    JOIN pg_attribute a ON a.attrelid = con.conrelid AND a.attnum = ANY(con.conkey)
    JOIN pg_class ft ON ft.oid = con.confrelid
    JOIN pg_attribute af ON af.attrelid = con.confrelid AND af.attnum = ANY(con.confkey)
    WHERE con.contype = 'f' AND ns.nspname = '${schema}'
    ORDER BY cl.relname, a.attname
  `,
  views: (schema: string) => `
    SELECT viewname AS name, definition
    FROM pg_views
    WHERE schemaname = '${schema}'
    ORDER BY viewname
  `,
  rowCount: (schema: string, table: string) => `
    SELECT count(*)::bigint AS n FROM "${schema}"."${table}"
  `,
};
