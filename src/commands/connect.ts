import { setProfile, type Profile } from '../profile.js';

interface ConnectOpts {
  pat?: string;
  project?: string;
  conn?: string;
  path?: string;
  as: string;
}

export async function connect(kind: string, opts: ConnectOpts): Promise<void> {
  let profile: Profile;
  switch (kind) {
    case 'supabase':
      if (!opts.pat || !opts.project) {
        throw new Error('supabase requires --pat and --project');
      }
      profile = { kind: 'supabase', project: opts.project, pat: opts.pat };
      break;
    case 'postgres':
      if (!opts.conn) throw new Error('postgres requires --conn');
      profile = { kind: 'postgres', conn: opts.conn };
      break;
    case 'mysql':
      if (!opts.conn) throw new Error('mysql requires --conn');
      profile = { kind: 'mysql', conn: opts.conn };
      break;
    case 'sqlite':
      if (!opts.path) throw new Error('sqlite requires --path');
      profile = { kind: 'sqlite', path: opts.path };
      break;
    default:
      throw new Error(`Unknown profile kind: ${kind}. Use supabase | postgres | mysql | sqlite.`);
  }
  await setProfile(opts.as, profile);
  console.log(`Saved profile "${opts.as}" (${kind}).`);
  if (opts.pat?.startsWith('op://') || opts.conn?.startsWith('op://')) {
    console.log(`Secret stored as 1Password reference - will resolve via \`op read\` at runtime.`);
  }
}
