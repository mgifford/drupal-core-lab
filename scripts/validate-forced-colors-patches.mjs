// Check every declared stack in disposable directories, without editing core.
// Usage: node scripts/validate-forced-colors-patches.mjs /path/to/Drupal-git-checkout
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { labRoot, variants } from '../tools/compare/lib.mjs';
const core = path.resolve(process.argv[2] || 'envs/core.git');
const v = variants().filter(x => ['3631321-pinned', '3631337-pinned', '3631337-independent'].includes(x.slug));
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'forced-colors-patches-'));
let scratchIndex;
const cmd = (name, args, cwd = temp) => {
  const r = spawnSync(name, args, { cwd, encoding: 'utf8', maxBuffer: 8 * 1024 * 1024, env: { ...process.env, ...(scratchIndex ? { GIT_INDEX_FILE: scratchIndex } : {}) } });
  if (r.status !== 0) throw new Error(`${name} ${args.join(' ')}\n${r.stderr || r.stdout}`);
  return r.stdout;
};
try {
  for (const variant of v) for (const side of ['before', 'after']) {
    const dest = path.join(temp, `${variant.slug}-${side}`);
    fs.mkdirSync(dest);
    scratchIndex = path.join(temp, `${variant.slug}-${side}.index`);
    cmd('git', ['-C', core, 'read-tree', variant.core.commit]);
    cmd('git', ['-C', core, 'checkout-index', '--all', `--prefix=${dest}/`]);
    scratchIndex = undefined;
    cmd('git', ['init', '--quiet'], dest);
    for (const patch of variant[side].patches) {
      cmd('git', ['apply', '--check', '--whitespace=error', path.join(labRoot, patch)], dest);
      cmd('git', ['apply', path.join(labRoot, patch)], dest);
    }
    console.log(`PASS ${variant.slug} ${side}: ${variant[side].patches.length} patch(es)`);
  }
} finally { fs.rmSync(temp, { recursive: true, force: true }); }
