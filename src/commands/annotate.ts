import { spawn } from 'node:child_process';
import { sidecarPath, ensureSidecar } from '../annotate/sidecar.js';

interface AnnotateOpts {
  profile: string;
  table?: string;
}

export async function annotate(opts: AnnotateOpts): Promise<void> {
  const path = sidecarPath(opts.profile);
  await ensureSidecar(opts.profile);
  const editor = process.env.EDITOR ?? 'vi';
  console.log(`Opening ${path} in ${editor}...`);
  await new Promise<void>((resolve, reject) => {
    const child = spawn(editor, [path], { stdio: 'inherit' });
    child.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`${editor} exited with ${code}`))));
  });
}
