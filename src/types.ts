// Canonical Schema shape - every adapter normalizes to this.
// This is the single source of truth that introspect/, audit/, and render/ all consume.

export interface Schema {
  profile: string;
  source: AdapterSource;
  tables: Table[];
  views: View[];
  foreignKeys: ForeignKey[];
}

export type AdapterSource =
  | { kind: 'supabase'; project: string }
  | { kind: 'postgres'; host: string; database: string }
  | { kind: 'mysql'; host: string; database: string }
  | { kind: 'sqlite'; path: string };

export interface Table {
  name: string;
  schema: string;
  columns: Column[];
  rowCount?: number;
  comment?: string;
}

export interface Column {
  name: string;
  type: string;
  nullable: boolean;
  isPrimaryKey: boolean;
  comment?: string;
}

export interface View {
  name: string;
  schema: string;
  definition: string;
  comment?: string;
}

export interface ForeignKey {
  name: string;
  fromTable: string;
  fromColumn: string;
  toTable: string;
  toColumn: string;
  onDelete?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
}

// Annotation shape (sidecar YAML)
export interface Annotations {
  profile: string;
  groups?: Record<string, AnnotationGroup>;
  tables?: Record<string, TableAnnotation>;
  layout?: Record<string, { x: number; y: number }>;
}

export interface AnnotationGroup {
  color: 'cyan' | 'orange' | 'green' | 'purple' | 'yellow' | 'white' | 'red';
  members: string[];
}

export interface TableAnnotation {
  description?: string;
  flag?: 'orphaned-no-fk' | 'legacy' | 'deprecated' | 'staging';
  columns?: Record<string, string>;
}

// Adapter interface - every DB adapter implements this
export interface Adapter {
  introspect(schemaName: string): Promise<Schema>;
  close(): Promise<void>;
}

// Audit finding - emitted by each rule
export interface AuditFinding {
  rule: string;
  severity: 'info' | 'warning' | 'error';
  table?: string;
  column?: string;
  description: string;
  fixSql?: string;
}
