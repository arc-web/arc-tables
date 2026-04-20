// Connection profiles: stored in ~/.arc-tables/profiles.json
// Secrets (PATs, passwords) are stored as 1Password references where possible,
// or as plain values for non-1P users (with a warning).

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';

const PROFILES_PATH = join(homedir(), '.arc-tables', 'profiles.json');

export interface SupabaseProfile {
  kind: 'supabase';
  project: string;
  pat: string; // raw PAT or "op://..." reference
}

export interface PostgresProfile {
  kind: 'postgres';
  conn: string; // raw connection string or "op://..." reference
}

export interface MysqlProfile {
  kind: 'mysql';
  conn: string;
}

export interface SqliteProfile {
  kind: 'sqlite';
  path: string;
}

export type Profile = SupabaseProfile | PostgresProfile | MysqlProfile | SqliteProfile;

interface ProfilesFile {
  profiles: Record<string, Profile>;
}

async function load(): Promise<ProfilesFile> {
  try {
    const raw = await readFile(PROFILES_PATH, 'utf8');
    return JSON.parse(raw);
  } catch (err: any) {
    if (err.code === 'ENOENT') return { profiles: {} };
    throw err;
  }
}

async function save(data: ProfilesFile): Promise<void> {
  await mkdir(join(homedir(), '.arc-tables'), { recursive: true });
  await writeFile(PROFILES_PATH, JSON.stringify(data, null, 2) + '\n', { mode: 0o600 });
}

export async function getProfile(name: string): Promise<Profile> {
  const data = await load();
  const p = data.profiles[name];
  if (!p) throw new Error(`Profile "${name}" not found. Run \`arc-tables connect ... --as ${name}\` first.`);
  return p;
}

export async function setProfile(name: string, profile: Profile): Promise<void> {
  const data = await load();
  data.profiles[name] = profile;
  await save(data);
}

export async function listProfiles(): Promise<string[]> {
  const data = await load();
  return Object.keys(data.profiles);
}

// Resolve op:// references to actual values (best-effort, no-op if op CLI missing)
export async function resolveSecret(value: string): Promise<string> {
  if (!value.startsWith('op://')) return value;
  const { exec } = await import('node:child_process');
  const { promisify } = await import('node:util');
  const exec_ = promisify(exec);
  try {
    const { stdout } = await exec_(`op read "${value}"`);
    return stdout.trim();
  } catch {
    throw new Error(`Failed to resolve 1Password reference: ${value}. Is the op CLI installed and signed in?`);
  }
}
