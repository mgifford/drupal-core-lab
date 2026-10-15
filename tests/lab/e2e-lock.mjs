// The end-to-end setup tests share envs/core.git and envs/.setup.lock, and `node --test` runs test files in parallel. This lets one of
// them at a time in. A lock left by a process that died is taken over. Not a test file (no .test.mjs in its name).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { labRoot } from '../../tools/compare/lib.mjs';

const file = path.join(os.tmpdir(), `lab-e2e-${crypto.createHash('sha1').update(labRoot).digest('hex').slice(0, 8)}.lock`);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export async function lock() {
  for (let i = 0; i < 1200; i++) {
    try { fs.writeFileSync(file, String(process.pid), { flag: 'wx' }); return; } catch { /* held */ }
    let pid = 0; try { pid = Number(fs.readFileSync(file, 'utf8')); } catch { continue; }
    if (pid) { try { process.kill(pid, 0); } catch { fs.rmSync(file, { force: true }); continue; } }
    await sleep(500);
  }
  throw new Error(`could not get ${file}`);
}
export const unlock = () => { try { if (Number(fs.readFileSync(file, 'utf8')) === process.pid) fs.rmSync(file, { force: true }); } catch { /* gone */ } };
