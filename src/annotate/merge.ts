import type { Annotations, Schema } from '../types.js';
import { annotationsFromDbComments } from './db_comments.js';

// Sidecar wins on conflict. DB comments fill in gaps.
export function mergeAnnotations(
  schema: Schema,
  sidecar: Annotations | undefined,
): Annotations {
  const fromDb = annotationsFromDbComments(schema);
  if (!sidecar) return fromDb;

  const merged: Annotations = {
    profile: sidecar.profile ?? fromDb.profile,
    groups: sidecar.groups,
    layout: sidecar.layout,
    tables: { ...fromDb.tables },
  };

  // Sidecar wins per-table
  if (sidecar.tables) {
    for (const [name, ann] of Object.entries(sidecar.tables)) {
      const fromDbTable = merged.tables?.[name] ?? {};
      merged.tables![name] = {
        description: ann.description ?? fromDbTable.description,
        flag: ann.flag ?? fromDbTable.flag,
        columns: { ...fromDbTable.columns, ...ann.columns },
      };
    }
  }

  return merged;
}
