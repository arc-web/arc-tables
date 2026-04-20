import type { Adapter } from '../types.js';
import type { Profile } from '../profile.js';
import { resolveSecret } from '../profile.js';
import { SupabaseAdapter } from './supabase.js';

export async function adapterFromProfile(profile: Profile): Promise<Adapter> {
  switch (profile.kind) {
    case 'supabase': {
      const pat = await resolveSecret(profile.pat);
      return new SupabaseAdapter(profile.project, pat);
    }
    case 'postgres': {
      // Lazy-load to keep `pg` optional at install time for users who only need supabase
      const { PostgresAdapter } = await import('./postgres.js');
      const conn = await resolveSecret(profile.conn);
      return new PostgresAdapter(conn);
    }
    case 'mysql': {
      const { MysqlAdapter } = await import('./mysql.js');
      const conn = await resolveSecret(profile.conn);
      return new MysqlAdapter(conn);
    }
    case 'sqlite': {
      const { SqliteAdapter } = await import('./sqlite.js');
      return new SqliteAdapter(profile.path);
    }
    case 'ssh': {
      const { SSHAdapter } = await import('./ssh.js');
      const password = profile.password ? await resolveSecret(profile.password) : undefined;
      return new SSHAdapter({
        host: profile.host,
        port: profile.port,
        user: profile.user,
        privateKey: profile.privateKey,
        remoteHost: profile.remoteHost,
        remotePort: profile.remotePort,
        database: profile.database,
        username: profile.username,
        password,
      });
    }
  }
}
