// Does the lab itself work? Checks the lab's own tools, not a Drupal issue.
//   node scripts/selftest.mjs                   static: syntax of every script, unit tests, variants, docs, cloud/ (no DDEV, no network; CI runs this)
//                                               Hermetic (tools/compare/hermetic.mjs): ddev, docker, mutagen and gh are refusing stand-ins, only
//                                               loopback connections and local git remotes are allowed, git config is empty plus
//                                               safe.bareRepository=explicit. Anything refused is listed and fails the run.
//   node scripts/selftest.mjs --live <slug>     also, against that built pair: doctor, lint (the tools must RUN: PASS or FAIL, never ERROR),
//                                               and tools/playwright/evaluate-<nid>.mjs if it exists (output to a temp folder; results.json must be complete)
//   node scripts/selftest.mjs --network         also read one issue's status from drupal.org (scripts/issue-status.mjs, read-only)
//   node scripts/selftest.mjs --keep-going      run the unit tests even when a package they load is missing (normally they are not run:
//                                               the dependency row says what to install, before minutes are spent on known failures)
// Writes nothing into reports/. Exit 1 if any check fails; skipped checks say why. Every run also writes .lab-cache/selftest-last.json
// (git-ignored): each check, and each failing unit test with its class, file, line, root error, missing package or executable, the
// command that reruns it alone and the usual fix, so a person or an agent reads that instead of the TAP (tools/compare/test-output.mjs).
import { staticSurvey, isAuthoredPatch } from '../tools/compare/css-build.mjs';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { labRoot, rawVariants, variants } from '../tools/compare/lib.mjs';
import { noChangeProblem } from '../tools/compare/change-under-test.mjs';
import { resolveBase, unrecorded } from '../tools/compare/patch-change.mjs';
import { matrixProblems } from '../tools/compare/coverage-matrix.mjs';
import { testRunSummary } from '../tools/compare/test-output.mjs';
import { runProblems } from '../tools/playwright/lib/run-schema.mjs';
import { checkTask, describeRow, trackedDependencyProblems, primaryCheckout } from '../tools/compare/deps.mjs';
import { hermeticEnv } from '../tools/compare/hermetic.mjs';

const args = process.argv.slice(2);
const liveIdx = args.indexOf('--live'); const liveSlug = liveIdx >= 0 ? args[liveIdx + 1] : null;
if (liveIdx >= 0 && (!liveSlug || liveSlug.startsWith('--'))) { console.error('usage: node scripts/selftest.mjs [--live <slug>] [--network] [--keep-going]'); process.exit(2); }
const results = [], testFailures = [], started = Date.now();
const record = (name, status, detail = '') => { results.push({ name, status, detail }); console.log(`${status.padEnd(4)}  ${name}${detail ? `: ${detail}` : ''}`); };
const run = (cmd, a, opts = {}) => spawnSync(cmd, a, { cwd: labRoot, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, ...opts });
const H = hermeticEnv();   // the static checks below run in it; --live and --network use the real environment
const runStatic = (cmd, a, opts = {}) => run(cmd, a, { env: H.env, ...opts });
const has = (cmd) => run('sh', ['-c', `command -v ${cmd}`]).status === 0;
const first = (r) => `${r.stderr || ''}${r.stdout || ''}`.trim().split('\n').filter(Boolean).slice(-3).join(' / ').slice(0, 300);

// 0. before anything slow: do the packages the unit tests load resolve here (tools/compare/deps.mjs), and is no dependency tree or
// machine-specific symlink tracked (tools/playwright/node_modules was a committed symlink that only worked five folders deep)?
const deps = checkTask(labRoot, 'selftest');
{
  const primary = primaryCheckout(labRoot), reuse = primary && primary !== labRoot ? ` (or reuse ${primary}'s: node scripts/deps.mjs link)` : '';
  const warn = deps.warnings.length ? `; warning: ${deps.warnings.map((r) => describeRow(r)).join('; ')}` : '';
  record('packages the unit tests load (deps.mjs check --for=selftest)', deps.ok ? 'ok' : 'FAIL',
    deps.ok ? `${deps.rows.map((r) => `${r.name} ${r.version}`).join(', ')}${warn}` : `${deps.problems.map((r) => describeRow(r)).join('; ')}. Fix: ${deps.fixes.join(' && ')}${reuse}`);
  const tracked = trackedDependencyProblems(labRoot);
  record('no tracked dependency trees or out-of-repository symlinks', tracked.length ? 'FAIL' : 'ok', tracked.length ? `${tracked.map((x) => `${x.path}: ${x.problem}`).join('; ')}. Untrack: git rm --cached <path> (the files on disk stay)` : '');
}
const unitTestsBlocked = !deps.ok && !args.includes('--keep-going');

// 1. syntax of the lab's own code
const SKIP = new Set(['node_modules', '.deps', '.git', 'envs', 'cloud', '.lab-browser', '.claude', '.agents', 'bundles', 'reports']);
const files = [];
(function walk(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { if (SKIP.has(e.name)) continue; const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else files.push(path.relative(labRoot, p)); } })(labRoot);
const bad = [];
for (const f of files.filter((x) => /\.(mjs|js)$/.test(x) && !/\.config\.|playwright\/tests\//.test(x))) { const r = run('node', ['--check', f]); if (r.status !== 0) bad.push(`${f}: ${(r.error?.message || r.stderr || r.stdout || 'no diagnostics').trim().slice(0, 1400)}`); }
for (const f of files.filter((x) => x.endsWith('.sh'))) { const r = run('bash', ['-n', f]); if (r.status !== 0) bad.push(`${f}: ${(r.error?.message || r.stderr || r.stdout || 'no diagnostics').trim().slice(0, 1400)}`); }
const phpFiles = files.filter((x) => x.endsWith('.php') && /^(scripts|tools)\//.test(x));
if (has('php')) for (const f of phpFiles) { const r = run('php', ['-l', f]); if (r.status !== 0) bad.push(`${f}: ${(r.error?.message || r.stderr || r.stdout || 'no diagnostics').trim().slice(0, 1400)}`); }
record('syntax of scripts (node --check, bash -n' + (has('php') ? ', php -l' : '') + ')', bad.length ? 'FAIL' : 'ok', bad.length ? bad.join('; ') : `${files.filter((x) => /\.(mjs|js|sh)$/.test(x)).length + (has('php') ? phpFiles.length : 0)} files`);
if (!has('php')) record('php -l', 'skip', 'no php on this machine');

// 2. unit tests
const glob = (dir) => (fs.existsSync(path.join(labRoot, dir)) ? fs.readdirSync(path.join(labRoot, dir)).filter((f) => f.endsWith('.test.mjs')).map((f) => path.join(dir, f)) : []);
for (const [name, list] of [['unit tests: lab tools', glob('tests/lab')], ['unit tests: issue packs', glob('tests/issue-pack')], ['unit tests: design observations', glob('tests/design')]]) {
  if (!list.length) { record(name, 'skip', 'no tests found'); continue; }
  if (unitTestsBlocked) { record(name, 'skip', `not run: a package they load is missing (first row); --keep-going runs them anyway`); continue; }
  const r = runStatic('node', ['--test', '--test-reporter=tap', '--test-concurrency=1', ...list], { timeout: 600000 });
  const summary = testRunSummary(r, { root: labRoot });
  testFailures.push(...summary.failures.map((f) => ({ group: name, ...f })));
  record(name, summary.ok ? 'ok' : 'FAIL', summary.detail);
}

// 3. variants: each resolves, its patches and recipe exist, After has a change to test, slugs are unique, any coverage matrix is valid
{
  const problems = []; const raw = rawVariants(); const seen = new Set();
  for (const x of raw) { if (seen.has(x.slug)) problems.push(`duplicate slug ${x.slug}`); seen.add(x.slug); if (x.extends && !raw.some((y) => y.slug === x.extends)) problems.push(`${x.slug} extends unknown ${x.extends}`); }
  let vs = []; try { vs = variants(); } catch (e) { problems.push(`variants do not resolve: ${e.message}`); }
  for (const v of vs) {
    if (!v.before?.env || !v.after?.env) problems.push(`${v.slug}: before.env and after.env are required`);
    for (const p of [...(v.before?.patches || []), ...(v.after?.patches || [])]) if (!fs.existsSync(path.join(labRoot, p))) problems.push(`${v.slug}: patch missing ${p}`);
    const none = noChangeProblem(v); if (none) problems.push(none);
    if (v.recipe && !fs.existsSync(path.join(labRoot, 'recipes', v.recipe))) problems.push(`${v.slug}: recipe missing recipes/${v.recipe}`);
    if (v.coverage && v.coverage.matrix) for (const [at, msg] of matrixProblems(v.coverage, `${v.slug}.coverage`)) problems.push(`${at} ${msg}`);
  }
  record('variants', problems.length ? 'FAIL' : 'ok', problems.length ? problems.slice(0, 8).join('; ') : `${vs.length} variants`);
}

// 3b. patches that changed since the base branch say so (scripts/patch-change.mjs): a changed patch file is changed evidence
{
  const base = resolveBase(labRoot);
  if (!base) record('patch changes recorded (patch-change.mjs check)', 'skip', 'no base branch to compare with (origin/main not fetched); that is not a pass');
  else { const bad = unrecorded(labRoot, base); record('patch changes recorded (patch-change.mjs check)', bad.length ? 'FAIL' : 'ok', bad.length ? `${bad.length} changed patch file(s) since ${base} without a record: ${bad.map((x) => x.path).slice(0, 4).join(', ')}. Run: node scripts/patch-change.mjs check` : `against ${base}`); }
}

// 3c. generated CSS: a patch written in the lab that changes a .pcss.css must carry its compiled .css (static look, no toolchain). Imported patches are
// only counted: they are preserved as submitted, and node scripts/css-build.mjs checks them with core's own toolchain.
{
  const bad = [], imported = []; const issuesDir = path.join(labRoot, 'reports/issues');
  for (const nid of fs.existsSync(issuesDir) ? fs.readdirSync(issuesDir) : []) {
    const bdir = path.join(issuesDir, nid, 'branches'); if (!fs.existsSync(bdir)) continue;
    for (const f of fs.readdirSync(bdir).filter((x) => x.endsWith('.patch'))) {
      const rel = `reports/issues/${nid}/branches/${f}`, sv = staticSurvey(fs.readFileSync(path.join(labRoot, rel), 'utf8'));
      if (!sv.missingCompiled.length) continue;
      (isAuthoredPatch(rel) ? bad : imported).push(`${rel} (${sv.missingCompiled.map((x) => path.basename(x)).join(', ')})`);
    }
  }
  record('generated CSS: lab-authored patches carry their compiled .css', bad.length ? 'FAIL' : 'ok', bad.length ? `${bad.length}: ${bad.slice(0, 4).join('; ')}. Run: node scripts/css-build.mjs <slug> --build` : `${imported.length} imported patch(es) change a .pcss.css without its .css in the patch (left as submitted; check with css-build.mjs)`);
}

// 4. documentation links and the published guide
for (const [name, a] of [['documentation links (check-docs.mjs)', ['scripts/check-docs.mjs']], ['cloud/ up to date (build-cloud.mjs --check)', ['scripts/build-cloud.mjs', '--check']]]) {
  const r = runStatic('node', a); record(name, r.status === 0 ? 'ok' : 'FAIL', first(r));
}
{ const r = runStatic('node', ['scripts/skill-evals.mjs', 'validate']); record('skill evals valid and grounded (skill-evals.mjs validate)', r.status === 0 ? 'ok' : 'FAIL', r.status === 0 ? first(r) : (r.stdout || '').split('\n').filter((l) => /^FAIL|^ {6}/.test(l)).slice(0, 6).join(' | ')); }
for (const t of ['REPRODUCE.md', 'EVIDENCE.md', 'ISSUE-COMMENT-DRAFT.md']) if (!fs.existsSync(path.join(labRoot, 'reports/_templates', t))) record(`template ${t}`, 'FAIL', 'missing');

// 4b. the static checks above stayed hermetic: no live tool ran, no remote was reached
{
  const calls = H.calls();
  record('static checks touched no live tool or network (hermetic)', calls.length ? 'FAIL' : 'ok', calls.length
    ? `${calls.length} refused call(s): ${calls.slice(0, 6).map((c) => `${c.call}${c.count > 1 ? ` (x${c.count})` : ''}`).join('; ')}. A test needs its own stand-in (tools/compare/hermetic.mjs standIn) or a local server`
    : 'ddev, docker, mutagen, gh and remote connections were refused stand-ins; none was called');
  H.cleanup();
}

// 5. live: tools against a built pair
if (liveSlug) {
  const v = variants().find((x) => x.slug === liveSlug);
  if (!v) record(`live ${liveSlug}`, 'FAIL', 'unknown variant');
  else {
    let r = run('node', ['scripts/doctor.mjs', liveSlug], { timeout: 300000 });
    record(`doctor ${liveSlug}`, r.status === 0 ? 'ok' : 'FAIL', (r.stdout.match(/^(FAIL|WARN).*$/gm) || []).slice(0, 4).join('; ') || first(r));
    for (const mode of [[], ['--host']]) {
      r = run('node', ['scripts/lint.mjs', liveSlug, ...mode], { timeout: 900000 });
      const res = (r.stdout.match(/^Result: (\w+)/m) || [])[1] || 'none';
      // PASS and FAIL both mean the tools ran; ERROR or no result means the lint step itself is broken.
      record(`lint ${liveSlug}${mode.length ? ' --host' : ' (DDEV)'} runs its tools`, ['PASS', 'FAIL'].includes(res) ? 'ok' : 'FAIL', `result ${res}${res === 'FAIL' ? ' (a finding about the patch, not about the lab)' : ''}${['PASS', 'FAIL'].includes(res) ? '' : ': ' + first(r)}`);
    }
    const ev = path.join('tools/playwright', `evaluate-${v.issue}.mjs`);
    if (!fs.existsSync(path.join(labRoot, ev))) record(`evaluate-${v.issue}.mjs`, 'skip', 'this issue has no evaluator script');
    else {
      const out = fs.mkdtempSync(path.join(os.tmpdir(), 'lab-selftest-'));
      r = run('node', [ev, liveSlug, `--out=${out}`], { timeout: 900000 });
      let detail = `exit ${r.status}`; let ok = r.status === 0 || r.status === 2;   // 2 = the run worked and found unexpected results
      const f = path.join(out, 'results.json');
      if (!fs.existsSync(f)) { ok = false; detail += ', no results.json: ' + first(r); }
      else { const p = runProblems(JSON.parse(fs.readFileSync(f, 'utf8'))); if (p.length) { ok = false; detail += `, results.json incomplete: ${p.join('; ')}`; } else detail += ', results.json complete (context, AJAX, speech, verdict)'; }
      record(`evaluate-${v.issue}.mjs ${liveSlug}`, ok ? 'ok' : 'FAIL', detail);
      fs.rmSync(out, { recursive: true, force: true });
    }
  }
}

// 6. network: one read-only status fetch
if (args.includes('--network')) {
  const nid = fs.readdirSync(path.join(labRoot, 'reports/issues')).find((d) => /^\d+$/.test(d) && fs.existsSync(path.join(labRoot, 'reports/issues', d, 'BRANCHES.md')));
  const r = run('node', ['scripts/issue-status.mjs', nid], { timeout: 120000 });
  record(`issue-status ${nid} (drupal.org, read-only)`, r.status === 0 && /Status: \*\*/.test(r.stdout) ? 'ok' : 'FAIL', first(r).slice(0, 120));
}

const failed = results.filter((x) => x.status === 'FAIL').length, skipped = results.filter((x) => x.status === 'skip').length;
const lastFile = path.join(labRoot, '.lab-cache/selftest-last.json');
try {
  fs.mkdirSync(path.dirname(lastFile), { recursive: true });
  fs.writeFileSync(lastFile, `${JSON.stringify({ schema: 1, finished: new Date().toISOString(), seconds: Math.round((Date.now() - started) / 1000), node: process.versions.node,
    args, ok: !failed, checks: results.map(({ name, status }) => ({ name, status })), failures: testFailures }, null, 1)}\n`);
  if (failed) console.log(`\nEach failure, classified, with the command that reruns it alone: ${path.relative(process.cwd(), lastFile) || lastFile}`);
} catch (e) { console.log(`(could not write ${lastFile}: ${e.message})`); }
console.log(`\n${failed ? `${failed} check(s) FAILED` : 'Self-test passed'} (${results.length - failed - skipped} ok, ${skipped} skipped${liveSlug ? '' : '; add --live <slug> to test the tools against a built pair'}).`);
process.exit(failed ? 1 : 0);
