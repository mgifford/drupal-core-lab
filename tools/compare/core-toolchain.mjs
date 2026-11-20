// Core's own toolchain, shared by scripts/lint.mjs and scripts/css-build.mjs: run a command in a checkout (DDEV web container or host),
// and make Yarn the version core pins. Nothing here installs a second copy of any tool: Corepack gives the exact Yarn core's package.json names.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

export const firstLine = (r) => `${r.stdout || ''}${r.stderr || ''}`.trim().split('\n')[0] || 'unknown';

// A function that runs a shell script inside the checkout. The script goes to `ddev exec` as ONE argument: ddev runs it with its own
// `bash -c` (with `set -u`) and re-quotes separate arguments, so `ddev exec bash -c '<script>'` would expand variables in the outer shell.
export function makeInEnv({ dir, useDdev }) {
  const shArgs = (script) => (useDdev ? ['ddev', ['exec', script]] : ['bash', ['-c', script]]);
  return (script, opts = {}) => spawnSync(...shArgs(script), { cwd: dir, encoding: 'utf8', ...opts });
}

// core pins its Yarn in package.json ("packageManager": "yarn@x.y.z"). A different global Yarn refuses to run, and core's check script hides
// that. When the Yarn on the PATH is not the pinned one, a shim in <dir>/<binDir> hands over to Corepack's Yarn. Returns
//   { want, have, pathPrefix, usedCorepack }   pathPrefix goes at the front of the shell script that runs yarn
//   { error }                                  when core needs a Yarn this machine can neither run nor fetch through Corepack
export function resolveYarn({ dir, inEnv, useDdev, binDir = '.lab-lint/bin' }) {
  let pkg; try { pkg = JSON.parse(fs.readFileSync(path.join(dir, 'core/package.json'), 'utf8')); } catch (e) { return { error: `cannot read core/package.json in ${dir}: ${e.message}` }; }
  const want = ((pkg.packageManager || '').match(/^yarn@([\d.]+)/) || [])[1];
  const have = firstLine(inEnv('cd core && yarn --version 2>/dev/null'));
  if (!want || have === want) return { want, have, pathPrefix: '', usedCorepack: false };
  if (inEnv('corepack --version').status !== 0) return { want, have, error: `core needs Yarn ${want} and this ${useDdev ? 'container' : 'machine'} has neither it nor Corepack. Install Node with Corepack, or run: corepack enable` };
  fs.mkdirSync(path.join(dir, binDir), { recursive: true });
  fs.writeFileSync(path.join(dir, binDir, 'yarn'), '#!/bin/sh\nexec corepack yarn "$@"\n', { mode: 0o755 });
  return { want, have, pathPrefix: `PATH="$PWD/${binDir}:$PATH" COREPACK_ENABLE_DOWNLOAD_PROMPT=0 `, usedCorepack: true };
}

// Core's JavaScript tools (node_modules, about 400 MB) are only installed when they are missing, from core's own lockfile
// (`yarn install --immutable`: the lockfile is never rewritten, and the command fails rather than upgrade anything).
export function ensureNodeModules({ dir, inEnv, prefix = '', marker = 'core/node_modules/eslint/bin/eslint.js', stdio = 'inherit' }) {
  if (fs.existsSync(path.join(dir, marker))) return { ok: true, installed: false };
  const r = inEnv(`${prefix}cd core && yarn install --immutable`, { stdio });
  return fs.existsSync(path.join(dir, marker)) && r.status === 0 ? { ok: true, installed: true } : { ok: false, installed: false, error: 'yarn install --immutable in core failed' };
}

// A pathPrefix from resolveYarn is `PATH=... VAR=... ` (assignments). Assignments in front of `cd core && yarn ...` would only reach `cd`, so export them first.
export const withEnv = (pathPrefix, script) => (pathPrefix ? `export ${pathPrefix.trim()}; ${script}` : script);
