import type { Schema, AuditFinding } from '../types.js';
import { duplicatePrefixRule } from './rules/duplicate_prefix.js';
import { stringFkRule } from './rules/string_fk.js';
import { ambiguousNameRule } from './rules/ambiguous_name.js';
import { deprecatedColumnRule } from './rules/deprecated_column.js';
import { orphanTableRule } from './rules/orphan_table.js';
import { singleRowSatelliteRule } from './rules/single_row_satellite.js';
import { emptyStagingRule } from './rules/empty_staging.js';
import { casingDuplicateRule } from './rules/casing_duplicate.js';
import { brokenViewRule } from './rules/broken_view.js';

export type Rule = (schema: Schema) => AuditFinding[];

export const RULES: Rule[] = [
  duplicatePrefixRule,
  stringFkRule,
  ambiguousNameRule,
  deprecatedColumnRule,
  orphanTableRule,
  singleRowSatelliteRule,
  emptyStagingRule,
  casingDuplicateRule,
  brokenViewRule,
];

export function runAudit(schema: Schema): AuditFinding[] {
  return RULES.flatMap((rule) => rule(schema));
}
