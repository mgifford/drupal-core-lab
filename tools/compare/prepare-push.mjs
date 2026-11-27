// Before a contribution goes to an issue fork: what exactly would be pushed, and is it already there? Read-only; used by
// scripts/prepare-push.mjs. It never pushes, never force-pushes, never updates a fork, never merges (unrelated histories or any other)
// and never publishes. The one write it can make, only when asked (--fetch), is a bounded fetch of named refs into
// refs/lab/prepare-push/<nid>/* of the shared core clone.
// Built on envs/core.git (shallow: `merge-base` fails at the shallow boundary, so ancestry is "unknown", never "unrelated", there) and
// on what the lab already recorded: reports/issues/<nid>/status.json (the MR, its branch and the tip last read) and BRANCHES.md (the
// issue fork, the local integration branch). Patch checks are tools/compare/patch-validate.mjs.
import fs from 'node:fs';
import path from 'node:path';
import { git, revParse, validatePatch, scratch, applyToTree, equivalence } from './patch-validate.mjs';
import { patchFileList } from './patch-state.mjs';

export const CORE_URL = 'https://git.drupalcode.org/project/drupal.git';
export const forkFetchUrl = (nid) => `https://git.drupalcode.org/issue/drupal-${nid}.git`;
export const forkPushUrl = (nid) => `git@git.drupal.org:issue/drupal-${nid}.git`;
export const labRef = (nid, name) => `refs/lab/prepare-push/${nid}/${name}`;
const DAY = 86400;
const firstLine = (r) => `${r.stderr || ''}${r.stdout || ''}`.trim().split('\n')[0].slice(0, 200);
const short = (s) => (s ? s.slice(0, 12) : '-');
const isoDay = (t) => new Date(t * 1000).toISOString().slice(0, 10);

// What the lab recorded about the issue. Every value can be overridden by a flag; nothing here is trusted over the live remote.
export function readIssue(labRoot, nid) {
  const dir = path.join(labRoot, 'reports/issues', String(nid));
  let status = null; try { status = JSON.parse(fs.readFileSync(path.join(dir, 'status.json'), 'utf8')); } catch { /* none */ }
  const branches = fs.existsSync(path.join(dir, 'BRANCHES.md')) ? fs.readFileSync(path.join(dir, 'BRANCHES.md'), 'utf8') : '';
  const mr = status && status.mr && typeof status.mr === 'object' ? status.mr : {};
  const mrText = status && typeof status.mr === 'string' ? status.mr : '';
  const pick = (re) => (branches.match(re) || [])[1] || '';
  const fork = (branches.match(new RegExp(`https://git\\.drupalcode\\.org/issue/drupal-${nid}(?:\\.git)?(?![\\w/-])`)) || [])[0];
  return {
    nid: String(nid), hasStatus: !!status, hasBranches: !!branches,
    iid: mr.iid || Number((mrText.match(/merge_requests\/(\d+)/) || branches.match(/merge_requests\/(\d+)/) || [])[1]) || null,
    sourceBranch: pick(/^\|\s*Upstream source branch\s*\|\s*`([^`]+)`/m) || mr.branch || '',
    recordedTip: mr.sha || '',
    fetchUrl: fork ? `${fork.replace(/\.git$/, '')}.git` : forkFetchUrl(nid),
    localBranch: pick(/^\|\s*Local integration branch\s*\|\s*`([^`]+)`/m) || pick(/^\s*-\s*Local branch:\s*`([^`]+)`/m),
  };
}

const has = (repo, sha) => !!sha && git(repo, ['cat-file', '-e', `${sha}^{commit}`]).status === 0;
const isAncestor = (repo, a, b) => git(repo, ['merge-base', '--is-ancestor', a, b]).status === 0;
const commitInfo = (repo, sha) => { const [h, email, name, ct, subject] = git(repo, ['log', '-1', '--format=%H%x09%ae%x09%an%x09%ct%x09%s', sha]).stdout.trim().split('\t'); return { sha: h, email, name, time: Number(ct), subject }; };
const commitsIn = (repo, range, n = 50) => git(repo, ['log', `-${n}`, '--format=%H%x09%ae%x09%an%x09%s', ...range]).stdout.split('\n').filter(Boolean).map((l) => { const [sha, email, name, subject] = l.split('\t'); return { sha, email, name, subject }; });
const shallowSet = (repo) => { try { return new Set(fs.readFileSync(repo.shallowFile, 'utf8').split('\n').filter(Boolean)); } catch { return new Set(); } };

// The shallow boundary commits a commit's history ends at, oldest first: [{ sha, time }]. Empty for a complete history.
export function boundaries(repo, sha) {
  if (!repo.shallow || !sha) return [];
  const set = shallowSet(repo);
  return git(repo, ['log', '--max-parents=0', '--format=%H %ct', sha]).stdout.split('\n').filter(Boolean)
    .map((l) => { const [h, t] = l.split(' '); return { sha: h, time: Number(t) }; }).filter((b) => set.has(b.sha)).sort((a, b) => a.time - b.time);
}

function lsRemote(repo, url, branch) {
  const r = git(repo, ['ls-remote', '--heads', url, `refs/heads/${branch}`], { env: { ...process.env, GIT_TERMINAL_PROMPT: '0' } });
  if (r.status !== 0) return { error: firstLine(r) };
  const line = r.stdout.split('\n').find((l) => l.endsWith(`\trefs/heads/${branch}`));
  return { sha: line ? line.split('\t')[0] : '' };
}

// A tip: live (ls-remote) unless offline, then the last fetched lab ref. { sha, how, present, error }
function tip(repo, { url, branch, offline, refs }) {
  if (offline) {
    for (const ref of refs) { const sha = revParse(repo, ref); if (sha) return { sha, how: `offline: ${ref} as last fetched`, present: true }; }
    return { sha: '', how: 'offline: never fetched', present: false, error: `no ${refs.join(' or ')} here` };
  }
  const r = lsRemote(repo, url, branch);
  if (r.error) return { sha: '', how: 'ls-remote failed', present: false, error: r.error };
  return { sha: r.sha, how: 'ls-remote', present: has(repo, r.sha) };
}

const gitWords = (repo) => (repo.bare ? `git --git-dir=${repo.dir}` : `git -C ${repo.dir}`);

// The fetch that gives the missing history, smallest first. need: { source, target } (a tip that is not here) and ancestry (merge-base
// failed at the shallow boundary). The day that matters is the day before the declared base (when given) or before the local commit's
// oldest shallow boundary. If core's branch does not reach back that far, it is fetched with --shallow-since=<that day>. If it already
// does, the local side is what is cut short (its boundary lies inside the merge request's own commits), so the source branch is deepened.
// Measured 2026-11-27: a LATER --shallow-since SHORTENS a ref's existing history, so a ref that already reaches the day gets
// --deepen=<n>, which only deepens. Never --unshallow (all of core's history). Only refs/lab/prepare-push/<nid>/* are written.
export function fetchPlan(repo, { nid, need, local, base, sourceUrl, sourceBranch, sourceSha = '', targetUrl, targetBranch, targetSha = '' }) {
  const oldest = (sha) => (has(repo, sha) ? boundaries(repo, sha)[0] || null : null);
  const lb = oldest(local), baseTime = base && has(repo, base) ? commitInfo(repo, base).time : 0;
  const times = [baseTime, lb && lb.time].filter(Boolean);
  const since = times.length ? Math.min(...times) - DAY : (local && has(repo, local) ? commitInfo(repo, local).time : Math.floor(Date.now() / 1000)) - 30 * DAY;
  const want = { source: !!need.source, target: !!need.target }, deepen = { source: false, target: false };
  if (need.ancestry && repo.shallow) {
    const mb = oldest(revParse(repo, labRef(nid, 'target')) || targetSha);
    if (!mb || mb.time > since) want.target = true; else { want.source = true; deepen.source = true; }
  }
  const plan = [];
  for (const [name, url, branch, tipSha] of [['source', sourceUrl, sourceBranch, sourceSha], ['target', targetUrl, targetBranch, targetSha]]) {
    if (!want[name] || !url || !branch) continue;
    const ref = labRef(nid, name), have = revParse(repo, ref) || tipSha, b = oldest(have);
    let depth = [];
    if (repo.shallow) {
      if (deepen[name] || (b && b.time <= since)) depth = [`--deepen=${Math.max(100, Number(git(repo, ['rev-list', '--count', has(repo, have) ? have : local]).stdout.trim()) || 0)}`];
      else if (b || !has(repo, have)) depth = [`--shallow-since=${isoDay(since)}`];
    }
    const args = ['fetch', '--no-tags', ...depth, url, `+refs/heads/${branch}:${ref}`];
    plan.push({ ref, args, text: `${gitWords(repo)} -c gc.auto=0 ${args.join(' ')}` });
  }
  return plan;
}

// The whole read. o: { repo, labRoot, nid, local, sourceBranch, target, fetchUrl, pushUrl, coreUrl, base, patch, interdiff, offline, recordedTip }
// Returns { checks: [{ status: ok|info|WARN|STOP|NEED, name, detail }], verdict, exit, push, fetch, facts }
export function prepare(o) {
  const { repo, nid } = o, checks = [], add = (status, name, detail = '') => checks.push({ status, name, detail });
  // A value that starts with '-' would reach git as an option (ls-remote --upload-pack=<command>): refuse it, whatever its source.
  const optionLike = [['--local', o.local], ['--source-branch', o.sourceBranch], ['--target', o.target], ['--fetch-url', o.fetchUrl], ['--core-url', o.coreUrl], ['--push-url', o.pushUrl], ['--base', o.base]].filter(([, v]) => v && String(v).startsWith('-'));
  if (optionLike.length) return { checks: optionLike.map(([k, v]) => ({ status: 'STOP', name: k, detail: `${v} starts with "-", so git would read it as an option; refused` })), verdict: 'blocked', exit: 1, push: '', fetch: [], facts: { nid: String(nid), repo: repo.dir, remote: {}, main: {} } };
  const target = o.target || 'main', facts = { nid: String(nid), repo: repo.dir, bare: repo.bare, shallow: repo.shallow, source: o.sourceBranch, target, fetchUrl: o.fetchUrl, pushUrl: o.pushUrl };
  const need = { source: false, target: false, ancestry: false };
  let publication = '';

  // 1. the local contribution
  const localSha = o.local ? revParse(repo, o.local) : '';
  if (!o.local) add('STOP', 'local commit', 'none named: pass --local <ref> (BRANCHES.md names no local integration branch)');
  else if (!localSha) add('STOP', 'local commit', `${o.local} is not a commit in ${repo.dir}`);
  const L = localSha ? commitInfo(repo, localSha) : null;
  facts.local = L ? { ref: o.local, ...L } : null;
  if (!o.sourceBranch) add('STOP', 'source branch', 'unknown: pass --source-branch <branch> (status.json has no MR branch)');

  // 2. tips: the issue fork's source branch and core's target branch
  const remote = o.sourceBranch ? tip(repo, { url: o.fetchUrl, branch: o.sourceBranch, offline: o.offline, refs: [labRef(nid, 'source'), `refs/lab/issue-${nid}/${o.sourceBranch}`] }) : { sha: '', present: false, how: '' };
  const main = tip(repo, { url: o.coreUrl, branch: target, offline: o.offline, refs: [labRef(nid, 'target'), 'refs/lab/new-issue/main'] });
  facts.remote = { ...remote, recorded: o.recordedTip || '' }; facts.main = main;
  if (o.recordedTip && remote.sha && !remote.sha.startsWith(o.recordedTip)) add('WARN', 'merge request moved', `status.json recorded ${o.recordedTip}, the fork branch is now at ${short(remote.sha)}: someone pushed since the lab read it. Read it again before posting: node scripts/issue-intake.mjs fetch ${nid}`);

  // 3. published? (the remote tip equals or contains the local commit)
  if (localSha && o.sourceBranch) {
    if (remote.error) { need.source = true; add('NEED', 'published', `cannot tell: the fork branch could not be read (${remote.error})${o.offline ? '. Run without --offline, or fetch it (--fetch)' : ''}`); }
    else if (!remote.sha) { publication = 'new-branch'; add('ok', 'published', `no: the fork has no branch ${o.sourceBranch}; a push would create it`); }
    else if (remote.sha === localSha) { publication = 'published'; add('ok', 'published', `yes: the fork branch ${o.sourceBranch} is at the local commit ${short(localSha)}. Nothing to push`); }
    else if (!remote.present) { need.source = true; add('NEED', 'published', `cannot tell: the fork tip ${short(remote.sha)} is not in this repository; fetch it (below)`); }
    else if (isAncestor(repo, localSha, remote.sha)) {
      publication = 'published';
      const after = commitsIn(repo, [remote.sha, `^${localSha}`]);
      add('ok', 'published', `yes: the fork branch contains the local commit, with ${after.length} commit(s) after it. Nothing to push`);
      const others = after.filter((c) => c.email !== L.email);
      if (others.length) add('WARN', 'changed by someone else', `after your commit: ${others.slice(0, 5).map((c) => `${short(c.sha)} ${c.name}: ${c.subject}`).join('; ')}`);
    } else if (isAncestor(repo, remote.sha, localSha)) {
      publication = 'fast-forward';
      add('ok', 'published', `no: the local commit is ${git(repo, ['rev-list', '--count', `${remote.sha}..${localSha}`]).stdout.trim()} commit(s) ahead of the fork tip ${short(remote.sha)} (a plain push, no force)`);
      add('ok', 'changed by someone else', 'no: the fork branch has no commit the local commit lacks');
    } else {
      const mb = git(repo, ['merge-base', localSha, remote.sha]);
      if (mb.status === 0) {
        publication = 'diverged';
        const theirs = commitsIn(repo, [remote.sha, `^${localSha}`]), others = theirs.filter((c) => c.email !== L.email);
        add('STOP', 'changed by someone else', `${others.length ? 'yes' : 'the branch moved'}: the fork branch has ${theirs.length} commit(s) the local commit lacks (${theirs.slice(0, 5).map((c) => `${short(c.sha)} ${c.name}: ${c.subject}`).join('; ')}). Bring them into the local branch first (git merge ${labRef(nid, 'source')}, or redo the change on top of it); never force-push over another contributor's work`);
      } else if (repo.shallow) { need.source = true; add('NEED', 'published', `cannot tell: the fork tip ${short(remote.sha)} and the local commit meet beyond the shallow boundary`); }
      else add('STOP', 'published', `the fork tip ${short(remote.sha)} shares no history with the local commit: a different branch. Never merge unrelated histories`);
    }
  }

  // 4. common ancestry with core's target branch, and how far behind it the contribution is
  let base = '';
  if (localSha) {
    if (main.error) { need.target = true; add('NEED', `common ancestry with ${target}`, `cannot tell: ${target} could not be read (${main.error})`); }
    else if (!main.present) { need.target = true; add('NEED', `common ancestry with ${target}`, `${target} is at ${short(main.sha)}, which is not in this repository; fetch it (below)`); }
    else {
      const mb = git(repo, ['merge-base', localSha, main.sha]);
      if (mb.status === 0) {
        base = mb.stdout.trim();
        const behind = Number(git(repo, ['rev-list', '--count', `${localSha}..${main.sha}`]).stdout.trim());
        facts.mergeBase = base; facts.behind = behind;
        add('ok', `common ancestry with ${target}`, `merge-base ${short(base)}; ${target} ${short(main.sha)} has ${behind} commit(s) the local commit lacks`);
      } else if (repo.shallow) { need.ancestry = true; add('NEED', `common ancestry with ${target}`, `unknown: merge-base finds nothing because the history here is shallow, not because the histories are unrelated`); }
      else add('STOP', `common ancestry with ${target}`, `none: the local commit and ${target} share no history. Never merge unrelated histories (no --allow-unrelated-histories)`);
    }
  }
  if (repo.shallow) {
    const b = [['local', localSha], ['fork', remote.present ? remote.sha : ''], [target, main.present ? main.sha : '']].filter(([, s]) => s)
      .map(([n, s]) => { const x = boundaries(repo, s)[0]; return x ? `${n} from ${isoDay(x.time)} (${short(x.sha)})` : `${n} complete`; });
    facts.boundaries = b;
    add('info', 'shallow history', `${shallowSet(repo).size} boundary commit(s); history here reaches: ${b.join(', ') || '-'}`);
  }

  // 5. the patch: applies at its declared base, has the expected files, clean resulting source, equals the local commit, still applies to main
  const patchBase = o.base || base;
  let files = [];
  if (o.patch) {
    files = patchFileList(o.patch.toString('utf8'));
    const pb = patchBase ? revParse(repo, patchBase) : '';
    const expect = pb && localSha ? git(repo, ['diff', '--name-only', '--no-renames', pb, localSha]).stdout.split('\n').filter(Boolean) : null;
    if (!patchBase) add('NEED', 'patch', 'no start revision: pass --base <rev> or fetch enough history for the merge-base');
    else {
      const sc = scratch(repo);
      try {
        const v = validatePatch({ repo, patch: o.patch, base: patchBase, expect, sc });
        for (const c of v.checks) add(c.status === 'FAIL' ? 'STOP' : c.status === 'skip' ? 'info' : c.status, `patch: ${c.name}`, c.detail);
        if (v.tree && localSha) {
          const differ = [...new Set([...files, ...(expect || [])])].filter((f) => {
            const a = git(repo, ['rev-parse', '--verify', '--quiet', `${v.tree}:${f}`], { env: sc.env }).stdout.trim(), b = git(repo, ['rev-parse', '--verify', '--quiet', `${localSha}:${f}`]).stdout.trim();
            return a !== b;
          });
          add(differ.length ? 'STOP' : 'ok', 'patch equals the local commit', differ.length ? `the patch result and the local commit differ in: ${differ.join(', ')} (a file left out of the commit, an untracked fixture, or a stale patch)` : `the patch on ${short(pb)} gives the local commit's ${files.length} file(s)`);
        }
        if (main.present && pb && main.sha !== pb) {
          const ap = applyToTree(repo, sc, main.sha, o.patch);
          add(ap.ok ? 'ok' : 'WARN', `patch applies to current ${target}`, ap.ok ? short(main.sha) : `${short(main.sha)}: ${ap.error}${ap.reverse ? ' (it applies in reverse: already in core?)' : ''}`);
        }
      } finally { sc.cleanup(); }
      if (o.interdiff) {
        if (!remote.present) add('NEED', 'interdiff', 'the fork tip is not here, so the interdiff cannot be checked against it');
        else {
          const iv = validatePatch({ repo, patch: o.interdiff, base: remote.sha });
          const ap = iv.checks.find((c) => c.name === 'applies');
          add(ap && ap.status === 'ok' ? 'ok' : 'STOP', 'interdiff applies to the fork tip', ap ? ap.detail : 'not checked');
          const eq = equivalence({ repo, full: o.patch, fullBase: patchBase, interdiff: o.interdiff, priorTip: remote.sha });
          add(eq.state === 'equivalent' ? 'ok' : eq.state === 'unknown' ? 'NEED' : 'STOP', 'full patch and interdiff equivalent (rule 17)', eq.detail);
        }
      }
    }
  }

  // 6. upstream changes since the base to the same files (a tree comparison: needs no history between the two commits)
  const touched = files.length ? files : (base && localSha ? git(repo, ['diff', '--name-only', '--no-renames', base, localSha]).stdout.split('\n').filter(Boolean) : []);
  if (patchBase && main.present && touched.length && revParse(repo, patchBase)) {
    const overlap = git(repo, ['--literal-pathspecs', 'diff', '--name-only', '--no-renames', patchBase, main.sha, '--', ...touched]).stdout.split('\n').filter(Boolean);
    facts.overlap = overlap;
    const commits = overlap.length && base ? commitsIn(repo, [`${patchBase}..${main.sha}`, '--', ...overlap], 8) : [];
    if (overlap.length) add('WARN', `upstream changes to the same files`, `${target} changed ${overlap.length} of the ${touched.length} file(s) since ${short(patchBase)}: ${overlap.join(', ')}${commits.length ? `; e.g. ${commits.slice(0, 4).map((c) => `${short(c.sha)} ${c.subject}`).join('; ')}` : ''}. Merge ${target} into the local branch and re-test before pushing (a new merge commit; the branch history is not rewritten)`);
    else add('ok', 'upstream changes to the same files', `none: ${target} has not changed the ${touched.length} file(s) since ${short(patchBase)}${facts.behind ? `; ${facts.behind} commit(s) behind elsewhere, which needs no sync for this change` : ''}`);
  }

  // 7. a checkout: files that would be left behind
  if (!repo.bare && localSha) {
    const head = revParse(repo, 'HEAD');
    if (head !== localSha) add('info', 'working tree', `${o.local} is not checked out in ${repo.dir}; its untracked files were not considered`);
    else {
      const st = git(repo, ['status', '--porcelain=v1', '-z', '--untracked-files=all']).stdout.split('\0').filter(Boolean);
      const untracked = st.filter((l) => l.startsWith('?? ')).map((l) => l.slice(3)), changed = st.filter((l) => !l.startsWith('?? '));
      const fixtures = untracked.filter((f) => /(^|\/)(tests?|fixtures?)\//i.test(f));
      if (fixtures.length) add('STOP', 'untracked test files', `not in the commit, so not pushed: ${fixtures.slice(0, 8).join(', ')}${fixtures.length > 8 ? ` and ${fixtures.length - 8} more` : ''}. Commit them if the tests need them`);
      if (changed.length) add('WARN', 'uncommitted changes', `${changed.length} tracked file(s) changed and not committed; a push sends only the commit`);
      if (!fixtures.length && !changed.length) add('ok', 'working tree', `clean${untracked.length ? ` apart from ${untracked.length} untracked file(s) outside test folders` : ''}`);
    }
  }

  // 8. what to fetch, the verdict, and the push the owner may run after approving it
  const fetch = need.source || need.target || need.ancestry ? fetchPlan(repo, { nid, need, sourceSha: remote.sha, targetSha: main.sha, local: localSha, base: o.base, sourceUrl: o.fetchUrl, sourceBranch: o.sourceBranch, targetUrl: o.coreUrl, targetBranch: target }) : [];
  const has_ = (s) => checks.some((c) => c.status === s);
  const verdict = publication === 'diverged' ? 'diverged' : has_('STOP') ? 'blocked' : has_('NEED') ? 'needs-history' : publication === 'published' ? 'published' : publication === 'fast-forward' ? 'ready' : publication === 'new-branch' ? 'new-branch' : 'blocked';
  const push = ['ready', 'new-branch'].includes(verdict) ? `${gitWords(repo)} push ${o.pushUrl} ${localSha}:refs/heads/${o.sourceBranch}` : '';
  return { checks, verdict, exit: { published: 0, ready: 0, 'new-branch': 0, 'needs-history': 3 }[verdict] ?? 1, push, fetch, facts };
}
