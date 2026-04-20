import { setProfile, type Profile } from '../profile.js';

interface ConnectOpts {
  pat?: string;
  project?: string;
  conn?: string;
  path?: string;
  host?: string;
  port?: string;
  user?: string;
  privateKey?: string;
  remoteHost?: string;
  remotePort?: string;
  database?: string;
  username?: string;
  password?: string;
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
    case 'ssh':
      if (!opts.host || !opts.user || !opts.database) {
        throw new Error('ssh requires --host, --user, and --database');
      }
      profile = {
        kind: 'ssh',
        host: opts.host,
        port: opts.port ? parseInt(opts.port) : undefined,
        user: opts.user,
        privateKey: opts.privateKey,
        remoteHost: opts.remoteHost,
        remotePort: opts.remotePort ? parseInt(opts.remotePort) : undefined,
        database: opts.database,
        username: opts.username,
        password: opts.password,
      };
      break;
    default:
      throw new Error(`Unknown profile kind: ${kind}. Use supabase | postgres | mysql | sqlite | ssh.`);
  }
  await setProfile(opts.as, profile);
  console.log(`Saved profile "${opts.as}" (${kind}).`);
  if (opts.pat?.startsWith('op://') || opts.conn?.startsWith('op://')) {
    console.log(`Secret stored as 1Password reference - will resolve via \`op read\` at runtime.`);
  }
}
