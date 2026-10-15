// Does the lab itself work? Checks the lab's own tools, not a Drupal issue.
//   node scripts/selftest.mjs                   static: syntax of every script, unit tests, variants, docs, cloud/ (no DDEV, no network; CI runs this)
//   node scripts/selftest.mjs --live <slug>     also, against that built pair: doctor, lint (the tools must RUN: PASS or FAIL, never ERROR),
//                                               and tools/playwright/evaluate-<nid>.mjs if it exists (output to a temp folder; results.json must be complete)
//   node scripts/selftest.mjs --network         also read one issue's status from drupal.org (scripts/issue-status.mjs, read-only)
// Writes nothing into reports/. Exit 1 if any check fails; skipped checks say why.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { labRoot, rawVariants, variants } from '../tools/compare/lib.mjs';
import { noChangeProblem } from '../tools/compare/change-under-test.mjs';
import { matrixProblems } from '../tools/compare/coverage-matrix.mjs';
import { runProblems } from '../tools/playwright/lib/run-schema.mjs';

const args = process.argv.slice(2);
const liveIdx = args.indexOf('--live'); const liveSlug = liveIdx >= 0 ? args[liveIdx + 1] : null;
if (liveIdx >= 0 && (!liveSlug || liveSlug.startsWith('--'))) { console.error('usage: node scripts/selftest.mjs [--live <slug>] [--network]'); process.exit(2); }
const results = [];
const record = (name, status, detail = '') => { results.push({ name, status, detail }); console.log(`${status.padEnd(4)}  ${name}${detail ? `: ${detail}` : ''}`); };
const run = (cmd, a, opts = {}) => spawnSync(cmd, a, { cwd: labRoot, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, ...opts });
const has = (cmd) => run('sh', ['-c', `command -v ${cmd}`]).status === 0;
const first = (r) => `${r.stderr || ''}${r.stdout || ''}`.trim().split('\n').filter(Boolean).slice(-3).join(' / ').slice(0, 300);

// 1. syntax of the lab's own code
const SKIP = new Set(['node_modules', '.deps', '.git', 'envs', 'cloud', '.lab-browser', '.claude', '.agents', 'bundles', 'reports']);
const files = [];
(function walk(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { if (SKIP.has(e.name)) continue; const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else files.push(path.relative(labRoot, p)); } })(labRoot);
const bad = [];
for (const f of files.filter((x) => /\.(mjs|js)$/.test(x) && !/\.config\.|playwright\/tests\//.test(x))) { const r = run('node', ['--check', f]); if (r.status !== 0) bad.push(`${f}: ${first(r)}`); }
for (const f of files.filter((x) => x.endsWith('.sh'))) { const r = run('bash', ['-n', f]); if (r.status !== 0) bad.push(`${f}: ${first(r)}`); }
const phpFiles = files.filter((x) => x.endsWith('.php') && /^(scripts|tools)\//.test(x));
if (has('php')) for (const f of phpFiles) { const r = run('php', ['-l', f]); if (r.status !== 0) bad.push(`${f}: ${first(r)}`); }
record('syntax of scripts (node --check, bash -n' + (has('php') ? ', php -l' : '') + ')', bad.length ? 'FAIL' : 'ok', bad.length ? bad.join('; ') : `${files.filter((x) => /\.(mjs|js|sh)$/.test(x)).length + (has('php') ? phpFiles.length : 0)} files`);
if (!has('php')) record('php -l', 'skip', 'no php on this machine');

// 2. unit tests
const glob = (dir) => (fs.existsSync(path.join(labRoot, dir)) ? fs.readdirSync(path.join(labRoot, dir)).filter((f) => f.endsWith('.test.mjs')).map((f) => path.join(dir, f)) : []);
const yamlThere = fs.existsSync(path.join(labRoot, 'tools/compare/.deps/node_modules/js-yaml'));
for (const [name, list, needsYaml] of [['unit tests: lab tools', glob('tests/lab'), false], ['unit tests: issue packs', glob('tests/issue-pack'), true]]) {
  if (!list.length) { record(name, 'skip', 'no tests found'); continue; }
  if (needsYaml && !yamlThere) { record(name, 'skip', 'js-yaml not installed: npm install --prefix tools/compare/.deps js-yaml@4'); continue; }
  const r = run('node', ['--test', ...list], { timeout: 600000 });
  const pass = (r.stdout.match(/^# pass (\d+)/m) || [])[1], fail = (r.stdout.match(/^# fail (\d+)/m) || [])[1];
  record(name, r.status === 0 ? 'ok' : 'FAIL', `${pass ?? '?'} passed, ${fail ?? '?'} failed${r.status === 0 ? '' : ': ' + (r.stdout.match(/^not ok .*$/gm) || []).slice(0, 5).join('; ')}`);
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

// 4. documentation links and the published guide
for (const [name, a] of [['documentation links (check-docs.mjs)', ['scripts/check-docs.mjs']], ['cloud/ up to date (build-cloud.mjs --check)', ['scripts/build-cloud.mjs', '--check']]]) {
  const r = run('node', a); record(name, r.status === 0 ? 'ok' : 'FAIL', first(r));
}
for (const t of ['REPRODUCE.md', 'EVIDENCE.md', 'ISSUE-COMMENT-DRAFT.md']) if (!fs.existsSync(path.join(labRoot, 'reports/_templates', t))) record(`template ${t}`, 'FAIL', 'missing');

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
console.log(`\n${failed ? `${failed} check(s) FAILED` : 'Self-test passed'} (${results.length - failed - skipped} ok, ${skipped} skipped${liveSlug ? '' : '; add --live <slug> to test the tools against a built pair'}).`);
process.exit(failed ? 1 : 0);
