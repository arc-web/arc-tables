// SSH tunnel adapter - creates a local port forward and delegates to PostgresAdapter.

import { BaseAdapter } from './base.js';
import { PostgresAdapter } from './postgres.js';
import type { Schema } from '../types.js';
import { spawn } from 'child_process';
import { randomInt } from 'crypto';

interface SSHTunnelConfig {
  host: string; // SSH host
  port?: number; // SSH port (default 22)
  user: string; // SSH user
  privateKey?: string; // path to private key
  remoteHost?: string; // remote DB host (default localhost)
  remotePort?: number; // remote DB port (default 5432)
  username?: string; // DB username
  password?: string; // DB password
  database: string; // DB name
}

export class SSHAdapter extends BaseAdapter {
  private postgres: PostgresAdapter | null = null;
  private tunnel: any = null;
  private localPort: number = 0;
  private config: SSHTunnelConfig;

  constructor(config: SSHTunnelConfig) {
    super();
    this.config = {
      port: 22,
      remoteHost: 'localhost',
      remotePort: 5432,
      ...config,
    };
  }

  private async createTunnel(): Promise<number> {
    return new Promise((resolve, reject) => {
      // Pick a random local port in the ephemeral range
      const localPort = 10000 + randomInt(55535);

      const sshCmd = [
        `-N`,
        `-L`,
        `${localPort}:${this.config.remoteHost}:${this.config.remotePort}`,
        ...(this.config.privateKey ? ['-i', this.config.privateKey] : []),
        `${this.config.user}@${this.config.host}`,
        ...(this.config.port && this.config.port !== 22 ? ['-p', String(this.config.port)] : []),
      ];

      this.tunnel = spawn('ssh', sshCmd);

      let connected = false;
      const timeout = setTimeout(() => {
        if (!connected) {
          this.tunnel?.kill();
          reject(new Error(`SSH tunnel timeout to ${this.config.host}`));
        }
      }, 5000);

      this.tunnel.stderr?.on('data', (data: Buffer) => {
        const msg = data.toString();
        // Assume the tunnel is ready if no errors in first 500ms
        if (!connected && !msg.includes('Permission denied') && !msg.includes('Connection refused')) {
          connected = true;
          clearTimeout(timeout);
          resolve(localPort);
        }
      });

      this.tunnel.on('error', (err: Error) => {
        clearTimeout(timeout);
        reject(err);
      });

      this.tunnel.on('exit', (code: number) => {
        if (!connected) {
          reject(new Error(`SSH tunnel exited with code ${code}`));
        }
      });

      // If no stderr data within 1s, assume success (some SSH daemons are quiet)
      setTimeout(() => {
        if (!connected) {
          connected = true;
          clearTimeout(timeout);
          resolve(localPort);
        }
      }, 1000);
    });
  }

  async introspect(schema: string): Promise<Schema> {
    if (!this.postgres) {
      this.localPort = await this.createTunnel();
      const connectionString = `postgres://${this.config.username || 'postgres'}:${this.config.password || ''}@localhost:${this.localPort}/${this.config.database}`;
      this.postgres = new PostgresAdapter(connectionString);
    }
    return this.postgres.introspect(schema);
  }

  async close(): Promise<void> {
    if (this.postgres) await this.postgres.close();
    if (this.tunnel) {
      this.tunnel.kill('SIGTERM');
      await new Promise((r) => setTimeout(r, 500)); // grace period
    }
  }
}
