// MySQL adapter - stubbed for v1, fleshed out in Stage 5.
import { BaseAdapter } from './base.js';
import type { Schema } from '../types.js';

export class MysqlAdapter extends BaseAdapter {
  constructor(_conn: string) {
    super();
  }
  async introspect(_schema: string): Promise<Schema> {
    throw new Error('MySQL adapter not yet implemented (planned for Stage 5).');
  }
  async close(): Promise<void> {}
}
