// Flow template - lifecycle diagram between specific tables.
// v1: minimal - filters the schema down to from/through/to tables and renders as a horizontal flow.

import type { Schema, Annotations } from '../../types.js';
import { renderMap } from './map.js';

export function renderFlow(
  schema: Schema,
  sidecar: Annotations | undefined,
  from: string,
  to: string,
  through: string[],
): string {
  const include = new Set([from, to, ...through]);

  // Filter schema to only the chosen tables and their direct FKs
  const filtered: Schema = {
    ...schema,
    tables: schema.tables.filter((t) => include.has(t.name)),
    foreignKeys: schema.foreignKeys.filter((fk) => include.has(fk.fromTable) && include.has(fk.toTable)),
    views: [],
  };

  // For v1, defer rendering to the map template. Stage 2 polish: dedicated horizontal layout + stage pills.
  return renderMap(filtered, sidecar);
}
