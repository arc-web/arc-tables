// Public API surface for embedding arc-tables programmatically.
export type { Schema, Table, Column, ForeignKey, View, Adapter, Annotations, AuditFinding } from './types.js';
export { SupabaseAdapter } from './adapters/supabase.js';
export { PostgresAdapter } from './adapters/postgres.js';
export { runAudit } from './audit/runner.js';
export { renderMap } from './render/templates/map.js';
export { renderFlow } from './render/templates/flow.js';
export { renderAudit } from './render/templates/audit.js';
export { loadAnnotations } from './annotate/sidecar.js';
export { mergeAnnotations } from './annotate/merge.js';
