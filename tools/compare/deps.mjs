// Dependency identity and release planning for lab environments. A dependency directory is reproducible from
// the lockfiles, so it can be released when the environment is not using it. This module only plans; the caller
// does the removal after the owner says --yes.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

// A short content hash of a manifest, or null when it is absent. Used to group environments that need one
// dependency store rather than one per worktree.
export function hashFile(file) {
  try { return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex').slice(0, 12); } catch { return null; }
}

export function dependencyKeys(dir) {
  return { composer: hashFile(path.join(dir, 'composer.lock')), yarn: hashFile(path.join(dir, 'core/yarn.lock')) };
}

// Plan which environments may release core/node_modules. states: env -> DDEV status. A running, leased or
// unreadable environment is skipped; a directory that is not there is skipped too.
export function releasePlan({ envs = [], states = {}, protectedEnvs = new Set(), vendor = false } = {}) {
  return envs.map((env) => {
    const state = states[env] || 'unknown';
    if (state === 'running') return { env, action: 'skip', reason: 'running', paths: [] };
    if (state === 'unknown') return { env, action: 'skip', reason: 'state unknown', paths: [] };
    if (protectedEnvs.has(env)) return { env, action: 'skip', reason: 'active lease', paths: [] };
    return { env, action: 'remove', reason: state, paths: ['core/node_modules', ...(vendor ? ['vendor'] : [])] };
  });
}

export function planSummary(plan) {
  const remove = plan.filter((p) => p.action === 'remove').length;
  const skip = plan.filter((p) => p.action === 'skip').length;
  return { remove, skip, total: plan.length };
}
