// Run before a push: is this branch in the state CI will test? Pushes nothing, merges nothing.
//   node scripts/ready-to-push.mjs [--base origin/main] [--allow-behind] [--install-hook] [--repo <dir>] [--skip-selftest]   (the last two are for tests)
// CI tests the pull request merged with the CURRENT main, not the branch alone (PR #13 failed on a probe that arrived with main, not with the branch). So:
//   1. fetch the base and say how far behind it this branch is; behind is a stop (merge it first, then run this again) unless --allow-behind
//   2. run scripts/selftest.mjs (syntax, unit tests, variants, patch records, docs links, cloud/ up to date: the checks CI runs)
// --install-hook writes this as the repository's pre-push hook (local; git does not share hooks). Exit 0 only when both pass.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { labRoot } from '../tools/compare/lib.mjs';

const args = process.argv.slice(2), val = (n, d) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : d; };
const repo = path.resolve(val('repo', labRoot)), git = (a) => spawnSync('git', a, { cwd: repo, encoding: 'utf8' });
if (args.includes('--install-hook')) {
  const hooks = path.resolve(repo, git(['rev-parse', '--git-path', 'hooks']).stdout.trim()), file = path.join(hooks, 'pre-push');
  if (fs.existsSync(file) && !fs.readFileSync(file, 'utf8').includes('ready-to-push.mjs')) { console.error(`${file} already exists and is not this one; not overwritten.`); process.exit(1); }
  fs.mkdirSync(hooks, { recursive: true }); fs.writeFileSync(file, `#!/bin/sh\n# written by scripts/ready-to-push.mjs --install-hook\nexec node "${path.join(labRoot, 'scripts/ready-to-push.mjs')}"\n`, { mode: 0o755 });
  console.log(`Installed ${file}. Skip it once with: git push --no-verify`); process.exit(0);
}
const base = val('base', 'origin/main'), remote = base.split('/')[0];
const f = git(['fetch', remote]); if (f.status !== 0) console.log(`(could not fetch ${remote}: ${f.stderr.trim().split('\n')[0]}; comparing with what is already here)`);
const c = git(['rev-list', '--left-right', '--count', `HEAD...${base}`]);
if (c.status !== 0) { console.error(`Cannot compare with ${base}: ${c.stderr.trim()}`); process.exit(2); }
const [ahead, behind] = c.stdout.trim().split(/\s+/).map(Number);
console.log(`This branch is ${ahead} commit(s) ahead of ${base} and ${behind} behind.`);
if (behind && !args.includes('--allow-behind')) { console.error(`STOP: ${base} has ${behind} commit(s) this branch lacks, and CI tests the merge. Merge it, fix what breaks, then run this again:\n  git merge ${base}\n  node scripts/ready-to-push.mjs`); process.exit(1); }
const dirty = git(['status', '--porcelain']).stdout.trim(); if (dirty) console.log(`Note: ${dirty.split('\n').length} uncommitted change(s); the checks below run on the working tree, a push sends only commits.`);
if (args.includes('--skip-selftest')) { console.log('(selftest skipped)'); process.exit(0); }
console.log('Running scripts/selftest.mjs ...');
const r = spawnSync('node', [path.join(labRoot, 'scripts/selftest.mjs')], { cwd: labRoot, stdio: 'inherit' });
console.log(r.status === 0 ? '\nReady to push: the branch is current with the base and selftest passes.' : '\nNOT ready: selftest failed (above). Fix it before pushing.');
process.exit(r.status === 0 ? 0 : 1);
