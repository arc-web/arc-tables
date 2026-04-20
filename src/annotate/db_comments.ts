// DB comment fallback - reads COMMENT ON TABLE / COMMENT ON COLUMN values.
// This is already extracted by the introspect step (Schema.tables[i].comment, Schema.tables[i].columns[j].comment).
// This module merges those into the Annotations shape when no sidecar entry exists.

import type { Schema, Annotations, TableAnnotation } from '../types.js';

export function annotationsFromDbComments(schema: Schema): Annotations {
  const tables: Record<string, TableAnnotation> = {};
  for (const t of schema.tables) {
    const cols: Record<string, string> = {};
    for (const c of t.columns) {
      if (c.comment) cols[c.name] = c.comment;
    }
    if (t.comment || Object.keys(cols).length > 0) {
      tables[t.name] = {
        description: t.comment,
        columns: Object.keys(cols).length > 0 ? cols : undefined,
      };
    }
  }
  return { profile: schema.profile, tables };
}
