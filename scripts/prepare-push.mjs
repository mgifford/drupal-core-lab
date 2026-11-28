// Before a contribution goes to an issue fork: what would be pushed, is it already published, did someone else change the branch,
// does the patch apply, and what history is missing? Read-only by default (tools/compare/prepare-push.mjs).
//   node scripts/prepare-push.mjs <nid> [--local <ref>] [--patch <full.patch> [--base <rev>] [--interdiff <file>]]
//        [--source-branch <b>] [--target main] [--fetch-url <https url>] [--push-url <ssh url>] [--core-url <url>]
//        [--repo <dir>] [--offline] [--fetch] [--json]
// Defaults come from reports/issues/<nid>/status.json (MR branch, recorded tip) and BRANCHES.md (issue fork, local integration branch).
// --repo defaults to the shared core clone envs/core.git (the main checkout's, from a worktree); a checkout or linked worktree also works.
// The fork and core tips are read with git ls-remote (--offline: the last fetched refs/lab/prepare-push/<nid>/*).
// --fetch runs only the bounded fetches the report lists (named refs into refs/lab/prepare-push/<nid>/*; --shallow-since or --deepen,
// never --unshallow), then reads again. Nothing ever pushes, force-pushes, updates a fork, merges or publishes: the push command is printed
// for the owner to run after approving it (AGENTS.md rule 4).
// Exit 0 published, ready (fast-forward) or new branch; 1 stop (diverged, patch problem, unrelated history); 2 usage; 3 history or network needed.
import fs from 'node:fs';
import path from 'node:path';
import { labRoot } from '../tools/compare/lib.mjs';
import { primaryCheckout } from '../tools/compare/deps.mjs';
import { openRepo, git } from '../tools/compare/patch-validate.mjs';
import { readIssue, prepare, CORE_URL, forkPushUrl } from '../tools/compare/prepare-push.mjs';
import { acquireGitLock, releaseGitLock } from '../tools/compare/git-lock.mjs';

const args = process.argv.slice(2);
const val = (n) => { const i = args.indexOf(`--${n}`); return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : ''; };
const nid = /^\d+$/.test(args[0] || '') ? args[0] : '';
if (!nid) { console.error('usage: node scripts/prepare-push.mjs <nid> [--local <ref>] [--patch <file> [--base <rev>] [--interdiff <file>]] [--source-branch <b>] [--target <b>] [--fetch-url <url>] [--push-url <url>] [--core-url <url>] [--repo <dir>] [--offline] [--fetch] [--json]'); process.exit(2); }
const root = path.resolve(val('lab-root') || labRoot);   // --lab-root is for tests
const issue = readIssue(root, nid);
const repoDir = val('repo') || path.join(primaryCheckout(root) || root, 'envs/core.git');
const repo = openRepo(repoDir);
if (!repo.ok) { console.error(`${repo.error}.${val('repo') ? '' : ' The shared core clone is created by: node tools/compare/setup.mjs <slug> (or name a repository with --repo <dir>).'}`); process.exit(2); }
for (const f of ['patch', 'interdiff']) if (val(f) && !fs.existsSync(val(f))) { console.error(`--${f} ${val(f)} does not exist`); process.exit(2); }

const opts = {
  repo, nid, local: val('local') || issue.localBranch, sourceBranch: val('source-branch') || issue.sourceBranch, target: val('target') || 'main',
  fetchUrl: val('fetch-url') || issue.fetchUrl, pushUrl: val('push-url') || forkPushUrl(nid), coreUrl: val('core-url') || CORE_URL,
  base: val('base'), patch: val('patch') ? fs.readFileSync(val('patch')) : null, interdiff: val('interdiff') ? fs.readFileSync(val('interdiff')) : null,
  offline: args.includes('--offline'), recordedTip: issue.recordedTip,
};
if (/^https?:\/\//.test(opts.pushUrl)) console.error(`note: --push-url ${opts.pushUrl} is HTTPS; drupal.org issue forks are pushed over SSH (${forkPushUrl(nid)}).`);

let rep = prepare(opts), fetched = [];
if (args.includes('--fetch') && rep.fetch.length) {
  // setup.mjs fetches into envs/core.git under this lock; two fetches at once fail with "shallow file has changed since we read it"
  const setupLock = path.join(path.dirname(repo.dir), '.setup.lock');
  let busy = 0; try { busy = Number(fs.readFileSync(setupLock, 'utf8')) || 0; process.kill(busy, 0); } catch { busy = 0; }
  if (busy) { console.error(`A setup is fetching into ${repo.dir} (pid ${busy}); nothing was fetched. Run this again when it has finished.`); process.exit(3); }
  const gitLock = acquireGitLock({ repo, operation: `prepare-push fetch #${nid}`, session: process.env.DSH_SESSION_ID || 'unknown' });
  if (!gitLock.ok) {
    const o = gitLock.owner;
    console.error(`Shared Git repository is busy: ${gitLock.reason}.` + (o ? `\n  ${o.operation} (${o.session}, pid ${o.pid}) has held it since ${new Date(o.started).toISOString()}.` : '') + '\nNo fetch was run; wait for that operation to finish, then run this again.');
    process.exit(3);
  }
  try {
    for (const f of rep.fetch) {
      const r = git(repo, f.args, { env: { ...process.env, GIT_TERMINAL_PROMPT: '0' } });
      fetched.push({ command: f.text, ok: r.status === 0, detail: r.status === 0 ? '' : `${r.stderr || r.stdout}`.trim().split('\n').slice(-1)[0] });
    }
  } finally { releaseGitLock({ repo, pid: gitLock.owner.pid }); }
  rep = prepare(opts);
}

if (args.includes('--json')) { console.log(JSON.stringify({ ...rep, fetched }, null, 1)); process.exit(rep.exit); }
const F = rep.facts, s12 = (x) => (x ? x.slice(0, 12) : '-');
console.log(`prepare-push #${nid} (${fetched.length ? `fetched into refs/lab/prepare-push/${nid}/* only` : 'read-only: nothing was fetched, pushed or written'})`);
console.log(`  MR        ${issue.iid ? `!${issue.iid}` : '(none recorded)'}   ${F.source || '?'} -> ${F.target}`);
console.log(`  fetch     ${F.fetchUrl}\n  push      ${F.pushUrl}   (never run by this tool)`);
console.log(`  repo      ${F.repo}${F.bare ? ' (bare' : ' (checkout'}${F.shallow ? ', shallow)' : ')'}`);
if (F.local) console.log(`  local     ${F.local.ref} = ${s12(F.local.sha)} ${F.local.name}: ${F.local.subject}`);
console.log(`  fork tip  ${s12(F.remote.sha) || '-'} (${F.remote.how || 'not read'}${F.remote.recorded ? `; status.json recorded ${F.remote.recorded}` : ''})`);
console.log(`  ${F.target.padEnd(9)} ${s12(F.main.sha)} (${F.main.how}${F.main.sha && !F.main.present ? ', not in this repository' : ''})\n`);
for (const f of fetched) console.log(`${f.ok ? 'fetched' : 'FETCH FAILED'}  ${f.command}${f.detail ? `\n         ${f.detail}` : ''}`);
if (fetched.length) console.log('');
for (const c of rep.checks) console.log(`${c.status.padEnd(4)}  ${c.name}${c.detail ? `: ${c.detail}` : ''}`);
if (rep.fetch.length) console.log(`\nMinimum history to fetch (named refs only, into refs/lab/prepare-push/${nid}/*; never later than history already here, never --depth or --unshallow). Run these, or this command with --fetch, then run it again:\n${rep.fetch.map((f) => `  ${f.text}${f.why ? `\n    (${f.why})` : ''}`).join('\n')}`);
const say = {
  published: 'PUBLISHED: the fork branch already has this commit. Do not push again.',
  ready: 'READY: a plain push (fast-forward, no force) would publish it. Only after the owner approves:',
  'new-branch': 'NEW BRANCH: the fork has no such branch; a push would create it. Only after the owner approves:',
  diverged: 'STOP: the fork branch has commits the local commit lacks. Integrate them first; never force-push.',
  'needs-history': 'NEEDS HISTORY OR NETWORK: some answers above are unknown, not failures.',
  blocked: 'STOP: fix what is marked STOP above.',
}[rep.verdict];
console.log(`\n${say}${rep.push ? `\n  ${rep.push}` : ''}`);
process.exit(rep.exit);
