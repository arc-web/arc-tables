import { writeFile } from 'node:fs/promises';
import { getProfile } from '../profile.js';
import { adapterFromProfile } from '../adapters/index.js';
import { renderFlow } from '../render/templates/flow.js';
import { loadAnnotations } from '../annotate/sidecar.js';

interface FlowOpts {
  profile: string;
  from: string;
  to: string;
  through?: string;
  output: string;
}

export async function flow(opts: FlowOpts): Promise<void> {
  const profile = await getProfile(opts.profile);
  const adapter = await adapterFromProfile(profile);
  try {
    const schema = await adapter.introspect('public');
    const through = opts.through ? opts.through.split(',').map((s) => s.trim()) : [];
    const annotations = await loadAnnotations(opts.profile);
    const html = renderFlow(schema, annotations, opts.from, opts.to, through);
    await writeFile(opts.output, html, 'utf8');
    console.log(`Wrote ${opts.output}`);
  } finally {
    await adapter.close();
  }
}
