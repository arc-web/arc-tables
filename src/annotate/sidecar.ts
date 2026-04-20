import { readFile, writeFile, access } from 'node:fs/promises';
import { join } from 'node:path';
import yaml from 'js-yaml';
import type { Annotations } from '../types.js';

export function sidecarPath(profile: string): string {
  return join(process.cwd(), `arc-tables.${profile}.yaml`);
}

export async function loadAnnotations(profile: string): Promise<Annotations | undefined> {
  const path = sidecarPath(profile);
  try {
    const raw = await readFile(path, 'utf8');
    return yaml.load(raw) as Annotations;
  } catch (err: any) {
    if (err.code === 'ENOENT') return undefined;
    throw err;
  }
}

export async function ensureSidecar(profile: string): Promise<void> {
  const path = sidecarPath(profile);
  try {
    await access(path);
  } catch {
    const stub: Annotations = {
      profile,
      groups: {
        anchors: { color: 'white', members: [] },
        core: { color: 'cyan', members: [] },
      },
      tables: {},
      layout: {},
    };
    const header = `# arc-tables annotations for profile "${profile}"\n# Sidecar wins over DB COMMENT ON values.\n# See https://github.com/arc-web/arc-tables for the full schema.\n\n`;
    await writeFile(path, header + yaml.dump(stub), 'utf8');
  }
}
