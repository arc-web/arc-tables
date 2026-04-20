// Layout engine: manual positions from sidecar, or simple auto-layout fallback.
//
// Auto-layout strategy: group tables by their annotated group, place groups in a grid,
// then arrange tables within each group in columns. Not as pretty as hand-tuned, but
// gives a usable starting point that the user can override via sidecar.

import type { Schema, Annotations } from '../types.js';

export interface Position {
  x: number;
  y: number;
}

export function computePositions(
  schema: Schema,
  annotations: Annotations | undefined,
): Map<string, Position> {
  const positions = new Map<string, Position>();
  const explicit = annotations?.layout ?? {};

  // 1. Use explicit positions where given
  for (const [name, pos] of Object.entries(explicit)) {
    positions.set(name, pos);
  }

  // 2. Auto-place the rest by group
  const tablesNeedingPlacement = schema.tables.filter((t) => !positions.has(t.name));
  const groupOf = new Map<string, string>();
  if (annotations?.groups) {
    for (const [groupName, group] of Object.entries(annotations.groups)) {
      for (const member of group.members) groupOf.set(member, groupName);
    }
  }

  // Bucket tables by group (ungrouped → "_other")
  const buckets = new Map<string, string[]>();
  for (const t of tablesNeedingPlacement) {
    const g = groupOf.get(t.name) ?? '_other';
    const list = buckets.get(g) ?? [];
    list.push(t.name);
    buckets.set(g, list);
  }

  // Lay out groups in a 3-column grid, tables stacked vertically within each
  const COL_WIDTH = 260;
  const ROW_HEIGHT = 200;
  const groupNames = [...buckets.keys()];
  groupNames.forEach((groupName, gi) => {
    const col = gi % 3;
    const groupRow = Math.floor(gi / 3);
    const tables = buckets.get(groupName)!;
    tables.forEach((name, ti) => {
      positions.set(name, {
        x: 60 + col * COL_WIDTH * 1.5,
        y: 80 + groupRow * 600 + ti * ROW_HEIGHT,
      });
    });
  });

  return positions;
}

export function canvasSize(positions: Map<string, Position>): { w: number; h: number } {
  let maxX = 800;
  let maxY = 600;
  for (const p of positions.values()) {
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }
  return { w: maxX + 280, h: maxY + 320 };
}
