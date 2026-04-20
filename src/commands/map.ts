import { writeFile } from 'node:fs/promises';
import { getProfile } from '../profile.js';
import { adapterFromProfile } from '../adapters/index.js';
import { renderMap } from '../render/templates/map.js';
import { loadAnnotations } from '../annotate/sidecar.js';

interface MapOpts {
  profile: string;
  schema: string;
  output: string;
}

export async function map(opts: MapOpts): Promise<void> {
  const profile = await getProfile(opts.profile);
  const adapter = await adapterFromProfile(profile);
  console.log(`Connecting to ${profile.kind} (${opts.profile})...`);
  try {
    const schema = await adapter.introspect(opts.schema);
    console.log(`Found ${schema.tables.length} tables, ${schema.foreignKeys.length} FKs, ${schema.views.length} views.`);
    const annotations = await loadAnnotations(opts.profile);
    const html = renderMap(schema, annotations);
    await writeFile(opts.output, html, 'utf8');
    console.log(`Wrote ${opts.output}`);
  } finally {
    await adapter.close();
  }
}
