// Try proposed tests against a variant's Before and After checkouts in one call: copy them into both, run them with
// `ddev phpunit`, remove them again, lint them on After, and build a patch that is checked against the MR.
//   node scripts/try-tests.mjs <slug> <test file or folder...> [--existing <core test path...>] [--patch-out <file>] [--mr-ref <git ref>] [--report <file>]
//   <test file or folder>  laid out like core: the part of the path from its first `core/` folder is where the file goes in each
//                          checkout (reports/issues/<nid>/tests-proposal/core/modules/... goes to core/modules/...). Every *Test.php is run.
//   --existing <path...>   core's own tests, by path inside the checkout, run on both sides as well (they are not copied)
//   --patch-out <file>     write the new files as a git patch (a temp repo, `git add -N`, `git diff`)
//   --mr-ref <git ref>     check that patch applies at that ref of envs/core.git (e.g. refs/lab/issue-<nid>/<branch>)
//   --report <file>        also write the result as Markdown (a DRAFT; nothing is written unless asked)
// The sites must be running (`node scripts/lab-env.mjs start <slug>`). The copied files are ALWAYS removed again, and the tracked
// files of both checkouts are compared before and after (AGENTS.md rule 1: the baseline is never edited). A file that already exists
// at its destination stops the run, since removing it afterwards would delete someone's work. In a git worktree of this
// repository the environments are taken from the main checkout's envs/.
// Exit code: 0 nothing to flag, 1 something to flag (a test that is not useful, a regression, lint, the patch, a checkout changed), 2 usage, 3 environment problem.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn, spawnSync, execFileSync } from 'node:child_process';
import { labRoot, variants } from '../tools/compare/lib.mjs';
import { parsePhpunit, summaryLine, testMethods, methodStatus, verdictFor, verdictExisting, classifyLint, renderTable, renderMarkdownTable } from '../tools/compare/phpunit-output.mjs';

const USAGE = 'usage: node scripts/try-tests.mjs <slug> <test file or folder...> [--existing <core test path...>] [--patch-out <file>] [--mr-ref <git ref>] [--report <file>]';
const die = (msg, code = 3) => { console.error(msg); process.exit(code); };
const note = (msg) => console.error(`[try-tests] ${msg}`);
const q = (x) => `'${x.replace(/'/g, `'\\''`)}'`;
const RUN_TIMEOUT = 30 * 60 * 1000, LINT_TIMEOUT = 15 * 60 * 1000;

// 1. arguments: the slug, then test paths; after --existing, core test paths
let slug = '', mode = 'tests';
const given = [], existing = [], opt = {}, argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i++) {
  const [a, inline] = argv[i].startsWith('--') ? argv[i].split(/=(.*)/s) : [argv[i]];
  if (a === '--existing') mode = 'existing';
  else if (['--patch-out', '--mr-ref', '--report'].includes(a)) { const val = inline ?? argv[++i]; if (!val || val.startsWith('--')) die(`${a} needs a value\n${USAGE}`, 2); opt[a.slice(2)] = val; }
  else if (a.startsWith('--')) die(`unknown option ${a}\n${USAGE}`, 2);
  else if (!slug) slug = a;
  else (mode === 'existing' ? existing : given).push(a);
}
if (!slug || (!given.length && !existing.length)) die(USAGE, 2);
if ((opt['patch-out'] || opt['mr-ref']) && !given.length) die(`--patch-out and --mr-ref need test files to put in the patch.\n${USAGE}`, 2);
const v = variants().find((x) => x.slug === slug);
if (!v) die(`unknown variant: ${slug}. Variants: ${variants().map((x) => x.slug).join(', ')}`, 2);

// 2. the two environments: here, or in the main checkout when this is a git worktree
const mainCheckout = () => { try { return path.dirname(path.resolve(labRoot, execFileSync('git', ['rev-parse', '--git-common-dir'], { cwd: labRoot, encoding: 'utf8' }).trim())); } catch { return labRoot; } };
const fromMain = !fs.existsSync(path.join(labRoot, 'envs', v.before.env));
const envsDir = path.join(fromMain ? mainCheckout() : labRoot, 'envs');
const labEnv = `${fromMain ? `cd ${mainCheckout()} && ` : ''}node scripts/lab-env.mjs`;
const sides = { before: { env: v.before.env }, after: { env: v.after.env } };
const SIDES = Object.keys(sides);
for (const s of SIDES) {
  const x = sides[s]; x.dir = path.join(envsDir, x.env);
  if (!fs.existsSync(path.join(x.dir, '.ddev/config.yaml'))) die(`${x.env} (${s}) is not built in ${envsDir}. Build it: node tools/compare/setup.mjs ${slug}`);
  const d = spawnSync('ddev', ['describe', '-j'], { cwd: x.dir, encoding: 'utf8' });
  let state = ''; try { state = JSON.parse(d.stdout).raw.status; } catch { /* ddev missing or the project unknown */ }
  if (state !== 'running') die(`${x.env} (${s}) is not running (${state || 'ddev did not answer'}). Start both sites: ${labEnv} start ${slug}`);
  x.commit = spawnSync('git', ['rev-parse', '--short=11', 'HEAD'], { cwd: x.dir, encoding: 'utf8' }).stdout.trim();
}
const gitStatus = (dir) => spawnSync('git', ['status', '--short', '--untracked-files=no'], { cwd: dir, encoding: 'utf8' }).stdout.trim();

// 3. the files to copy: where each goes inside a checkout, and which of them are test classes
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).filter((e) => !e.name.startsWith('.')).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
const items = [];
for (const g of given) {
  const abs = path.resolve(g); if (!fs.existsSync(abs)) die(`not found: ${g}`);
  for (const src of fs.statSync(abs).isDirectory() ? walk(abs) : [abs]) {
    const r = path.relative(labRoot, src), parts = (r.startsWith('..') ? src : r).split(path.sep), at = parts.indexOf('core');
    if (at < 0) die(`${src}: no core/ folder in the path, so it is not clear where it goes in a checkout. Lay the files out like core (core/modules/...).`);
    const rel = parts.slice(at).join('/');
    if (items.some((x) => x.rel === rel)) die(`two files would be copied to ${rel}`);
    items.push({ src, rel });
  }
}
items.sort((a, b) => a.rel.localeCompare(b.rel));
for (const it of items) for (const s of SIDES) if (fs.existsSync(path.join(sides[s].dir, it.rel))) die(`${it.rel} already exists in ${sides[s].env}. This run removes what it copies, so it will not overwrite a file; move or rename the proposed one.`);
for (const e of existing) for (const s of SIDES) if (!fs.existsSync(path.join(sides[s].dir, e))) die(`--existing ${e}: not found in ${sides[s].env}. Give the path inside the checkout, e.g. core/modules/file/tests/src/Kernel/ManagedFileTest.php`);
const classes = items.filter((it) => /Test\.php$/.test(it.rel)).map((it) => { const php = fs.readFileSync(it.src, 'utf8'); return { ...it, short: path.basename(it.rel, '.php'), methods: testMethods(php), provider: /DataProvider/.test(php) }; });
const lintable = items.filter((it) => /\.(php|module|inc|install|theme|profile|engine)$/.test(it.rel));

// 4. cleanup registry: the copies are removed on every way out (normal end, an exception, Ctrl-C)
const cleanups = [], cleanupAll = () => { while (cleanups.length) { try { cleanups.pop()(); } catch (e) { console.error(`cleanup: ${e.message}`); } } };
for (const sig of ['SIGINT', 'SIGTERM', 'SIGHUP']) process.on(sig, () => { cleanupAll(); process.exit(130); });
const logDir = fs.mkdtempSync(path.join(os.tmpdir(), 'try-tests-'));
const started = new Date();

// 5. the patch (new files only) and whether it applies to the MR: before anything is copied, so a wrong ref costs no test run
const gitEnv = { ...process.env, GIT_CONFIG_GLOBAL: '/dev/null', GIT_CONFIG_SYSTEM: '/dev/null', GIT_CONFIG_NOSYSTEM: '1' };   // the user's diff.* settings would change the patch
const patch = { file: '', files: 0, lines: 0, applies: null, ref: '', detail: '' };
if (opt['patch-out'] || opt['mr-ref']) {
  const coreGit = path.join(envsDir, 'core.git');
  if (opt['mr-ref'] && !fs.existsSync(coreGit)) die(`--mr-ref needs ${coreGit} (the shared core clone); build an environment first.`);
  const sha = opt['mr-ref'] ? spawnSync('git', ['-C', coreGit, 'rev-parse', '--verify', '--quiet', `${opt['mr-ref']}^{commit}`], { encoding: 'utf8' }).stdout.trim() : '';
  if (opt['mr-ref'] && !sha) die(`--mr-ref ${opt['mr-ref']}: not a commit in ${coreGit}. Refs the lab keeps: git -C ${coreGit} for-each-ref refs/lab`);
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'try-tests-patch-')); cleanups.push(() => fs.rmSync(tmp, { recursive: true, force: true }));
  const git = (...a) => spawnSync('git', a, { cwd: tmp, encoding: 'utf8', env: gitEnv, maxBuffer: 1 << 28 });
  for (const it of items) { const d = path.join(tmp, it.rel); fs.mkdirSync(path.dirname(d), { recursive: true }); fs.copyFileSync(it.src, d); }
  git('init', '-q'); git('add', '-N', '--', ...items.map((it) => it.rel));
  const diff = git('diff', '--no-color', '--no-ext-diff', '--no-renames').stdout;
  patch.file = path.resolve(opt['patch-out'] || path.join(logDir, 'tests.patch')); patch.files = items.length; patch.lines = diff.split('\n').length - 1;
  fs.mkdirSync(path.dirname(patch.file), { recursive: true }); fs.writeFileSync(patch.file, diff);
  if (sha) {
    patch.ref = `${opt['mr-ref']} (${sha.slice(0, 8)})`;
    const wt = fs.mkdtempSync(path.join(os.tmpdir(), 'try-tests-wt-'));
    cleanups.push(() => { spawnSync('git', ['-C', coreGit, 'worktree', 'remove', '--force', wt]); fs.rmSync(wt, { recursive: true, force: true }); spawnSync('git', ['-C', coreGit, 'worktree', 'prune']); });
    const add = spawnSync('git', ['-C', coreGit, 'worktree', 'add', '--detach', '-q', wt, sha], { encoding: 'utf8' });
    const chk = add.status === 0 ? spawnSync('git', ['-C', wt, 'apply', '--check', patch.file], { encoding: 'utf8' }) : add;
    patch.applies = chk.status === 0; patch.detail = patch.applies ? '' : `${chk.stderr}`.trim().split('\n').slice(0, 2).join(' / ');
    cleanupAll();
  }
}

// 6. copy, run, lint; whatever happens, remove the copies
const run = (cmd, args, { cwd, timeout }) => new Promise((resolve) => {
  const child = spawn(cmd, args, { cwd }); let out = '', timedOut = false;
  const timer = setTimeout(() => { timedOut = true; child.kill('SIGTERM'); }, timeout);
  for (const s of [child.stdout, child.stderr]) s.on('data', (c) => { out += c; });
  child.on('error', (e) => { clearTimeout(timer); resolve({ status: 127, out: `${out}${e.message}`, timedOut }); });
  child.on('close', (code) => { clearTimeout(timer); resolve({ status: code ?? 1, out, timedOut }); });
});
const pre = Object.fromEntries(SIDES.map((s) => [s, gitStatus(sides[s].dir)]));
const copied = [], madeDirs = [];
cleanups.push(() => { for (const f of copied) fs.rmSync(f, { force: true }); for (const d of madeDirs.sort((a, b) => b.length - a.length)) { try { fs.rmdirSync(d); } catch { /* not empty: not ours to remove */ } } });
// DDEV with Mutagen syncs the checkout into the container a moment after a file changes (scripts/lab-site.sh waits the same way):
// a test copied in is not there to run until it has arrived, and a removed one is still there until the removal has.
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function settle(s, present) {
  if (!items.length) return true;
  spawnSync('ddev', ['mutagen', 'sync'], { cwd: sides[s].dir, stdio: 'ignore' });
  const test = items.map((it) => `test ${present ? '-f' : '! -e'} ${q(it.rel)}`).join(' && ');
  for (let i = 0; i < 30; i++) { if (spawnSync('ddev', ['exec', test], { cwd: sides[s].dir }).status === 0) return true; await sleep(1000); }
  return false;
}
const results = { before: {}, after: {} }, lint = {};
try {
  for (const s of SIDES) for (const it of items) {
    const dest = path.join(sides[s].dir, it.rel);
    for (let d = path.dirname(dest); !fs.existsSync(d); d = path.dirname(d)) madeDirs.push(d);
    fs.mkdirSync(path.dirname(dest), { recursive: true }); copied.push(dest); fs.copyFileSync(it.src, dest);
  }
  for (const [i, ok] of (await Promise.all(SIDES.map((s) => settle(s, true)))).entries()) if (!ok) throw new Error(`the copied files did not reach the container of ${sides[SIDES[i]].env} within 30 s (ddev mutagen status)`);
  const paths = [...classes.map((c) => c.rel), ...existing];
  note(`running ${paths.length} PHPUnit path(s) on both sides (each side one after the other, the sides in parallel)`);
  await Promise.all(SIDES.map(async (s) => {
    for (const p of paths) {
      const r = await run('ddev', ['phpunit', p], { cwd: sides[s].dir, timeout: RUN_TIMEOUT });
      fs.writeFileSync(path.join(logDir, `${s}-${path.basename(p)}.log`), r.out);
      const parsed = parsePhpunit(r.out); if (r.timedOut) { parsed.ok = null; parsed.detail = `timed out after ${RUN_TIMEOUT / 60000} min`; }
      results[s][p] = parsed;
    }
  }));
  if (lintable.length) {
    note(`PHPCS and PHPStan on ${lintable.length} file(s) in ${sides.after.env}`);
    const list = lintable.map((it) => q(it.rel)).join(' ');
    // one argument to `ddev exec`: it re-quotes separate arguments (see scripts/lint.mjs)
    const [cs, st] = await Promise.all([
      run('ddev', ['exec', `vendor/bin/phpcs --standard=core/phpcs.xml.dist ${list}`], { cwd: sides.after.dir, timeout: LINT_TIMEOUT }),
      run('ddev', ['exec', `php -d memory_limit=-1 vendor/bin/phpstan analyze --no-progress --memory-limit=2G -c core/phpstan.neon.dist ${list}`], { cwd: sides.after.dir, timeout: LINT_TIMEOUT }),
    ]);
    fs.writeFileSync(path.join(logDir, 'after-phpcs.log'), cs.out); fs.writeFileSync(path.join(logDir, 'after-phpstan.log'), st.out);
    lint.PHPCS = cs.timedOut ? { result: 'ERROR', lines: ['timed out'] } : classifyLint('phpcs', cs.status, cs.out, lintable.map((it) => it.rel));
    lint.PHPStan = st.timedOut ? { result: 'ERROR', lines: ['timed out'] } : classifyLint('phpstan', st.status, st.out, lintable.map((it) => it.rel));
  }
} finally { cleanupAll(); }

// 7. what the checkouts look like now
const problems = [];
const gone = items.every((it) => SIDES.every((s) => !fs.existsSync(path.join(sides[s].dir, it.rel))));
if (!gone) problems.push('copied files are still in a checkout');
const state = [];
for (const s of SIDES) {
  const post = gitStatus(sides[s].dir), x = sides[s];
  if (post !== pre[s]) { problems.push(`${s} tracked files changed during the run`); state.push(`${x.env}: tracked files CHANGED by the run:\n${post}`); }
  else if (s === 'before' && pre[s] && !(v.before.patches || []).length) { problems.push('the baseline already had tracked changes before the run'); state.push(`${x.env}: tracked changes that were there before the run, and the variant declares no before.patches:\n${pre[s]}`); }
  else state.push(`${x.env}: tracked files unchanged${pre[s] ? ' (the patched checkout, as it was)' : ' (clean)'}`);
}
const goneInContainers = (await Promise.all(SIDES.map((s) => settle(s, false)))).every(Boolean);
if (gone && !goneInContainers) problems.push('removed from the checkouts, but a container still has the copies (Mutagen has not synced the removal)');
state.push(!gone ? 'copied files NOT removed: check git status --short in both checkouts' : goneInContainers ? 'copied files removed from both checkouts (host and container)' : 'copied files removed on the host, still in a container: run ddev mutagen sync in both environments');

// 8. the result, as sections (printed as text; written as Markdown with --report)
const short = (p) => path.basename(p);
const cell = (p) => (p.ok === null ? 'crash' : p.ok ? `ok (${p.tests})` : `FAIL (${(p.counts.Failures || 0) + (p.counts.Errors || 0)} of ${p.tests})`);
const sections = [], failures = [], totals = [];
if (classes.length) {
  const rows = [];
  for (const c of classes) {
    const pb = results.before[c.rel], pa = results.after[c.rel];
    const names = [...new Set([...c.methods, ...[pb, pa].flatMap((p) => p.problems.filter((x) => x.class.split('\\').pop() === c.short).map((x) => x.method))])];
    for (const m of names) {
      const sb = methodStatus(pb, c.short, m), sa = methodStatus(pa, c.short, m), vd = verdictFor(sb, sa);
      if (vd.problem) problems.push(`${c.short}::${m}: ${vd.text.replace('PROBLEM: ', '')}`);
      rows.push([`${c.short}::${m}`, sb, sa, vd.text]);
    }
    for (const [s, p] of [['Before', pb], ['After', pa]]) {
      totals.push(`${c.short} ${s}: ${summaryLine(p)}${!c.provider && p.ok !== null && p.tests !== c.methods.length ? ` (the file declares ${c.methods.length} test methods, ${p.tests} ran)` : ''}`);
      if (p.ok === null) { problems.push(`${c.short} gave no result on ${s}`); failures.push(`${s} ${c.short}: ${p.detail}`); }
      for (const x of p.problems.filter((y) => ['FAIL', 'ERROR'].includes(y.kind))) failures.push(`${s} ${x.class.split('\\').pop()}::${x.method}: ${x.message}`);
    }
  }
  sections.push({ title: 'Tests', table: { header: ['Test', 'Before', 'After', 'Verdict'], rows }, lines: totals });
}
if (existing.length) {
  const rows = existing.map((e) => {
    const pb = results.before[e], pa = results.after[e], vd = verdictExisting(pb, pa);
    if (vd.problem) problems.push(`existing ${short(e)}: ${vd.text.replace('PROBLEM: ', '')}`);
    for (const [s, p] of [['Before', pb], ['After', pa]]) {
      if (p.ok === null) failures.push(`${s} ${short(e)}: ${p.detail}`);
      for (const x of p.problems.filter((y) => ['FAIL', 'ERROR'].includes(y.kind))) failures.push(`${s} ${x.class.split('\\').pop()}::${x.method}: ${x.message}`);
    }
    return [short(e), cell(pb), cell(pa), vd.text];
  });
  sections.push({ title: 'Existing core tests', table: { header: ['Path', 'Before', 'After', 'Verdict'], rows } });
}
if (failures.length) sections.push({ title: 'Failures (first line of each)', lines: [...failures.slice(0, 12).map((f) => f.slice(0, 200)), ...(failures.length > 12 ? [`... ${failures.length - 12} more in the raw logs`] : [])] });
if (Object.keys(lint).length) {
  for (const [tool, r] of Object.entries(lint)) if (r.result !== 'clean') problems.push(`${tool} ${r.result}`);
  sections.push({ title: `Lint (${sides.after.env})`, lines: Object.entries(lint).flatMap(([tool, r]) => [`${tool}: ${r.result}`, ...r.lines.slice(0, 10).map((l) => `  ${l}`), ...(r.lines.length > 10 ? [`  ... ${r.lines.length - 10} more`] : [])]) });
} else if (items.length) sections.push({ title: 'Lint', lines: ['no PHP files among the copied ones'] });
if (patch.file) {
  if (patch.applies === false) problems.push('the patch does not apply to the MR ref');
  sections.push({ title: 'Patch', lines: [`${patch.file} (${patch.files} file${patch.files === 1 ? '' : 's'}, ${patch.lines} lines)`, ...(patch.ref ? [patch.applies ? `applies to ${patch.ref}` : `does NOT apply to ${patch.ref}: ${patch.detail}`] : [])] });
}
sections.push({ title: 'Checkouts', lines: state });
const result = problems.length ? `PROBLEMS (${problems.length}): ${problems.join('; ')}` : 'nothing to flag';
const head = `try-tests ${slug}: Before ${sides.before.env}@${sides.before.commit}, After ${sides.after.env}@${sides.after.commit}${(v.after.patches || []).length ? ` plus ${(v.after.patches || []).length} patch(es)` : ''}${fromMain ? ' (environments from the main checkout)' : ''}`;

console.log([head, ...sections.map((s) => `\n${s.title}\n${s.table ? `${renderTable(s.table.header, s.table.rows)}\n` : ''}${(s.lines || []).join('\n')}`.replace(/\n$/, '')), `\nRaw logs: ${logDir}\nResult: ${result}`].join('\n'));

if (opt.report) {
  const md = `# Tests tried: ${slug} (${started.toISOString().slice(0, 10)})

DRAFT until a person has reviewed it. Generated by \`node scripts/try-tests.mjs ${argv.join(' ')}\`.

**Result: ${result}**

| | |
|---|---|
| Before | \`${sides.before.env}\`, core \`${sides.before.commit}\` |
| After | \`${sides.after.env}\`, core \`${sides.after.commit}\`${(v.after.patches || []).map((p) => `, plus \`${p}\``).join('')} |
| Test files | ${items.length ? items.map((it) => `\`${it.rel}\``).join('<br>') : 'none (existing core tests only)'} |
| Tools | PHPUnit ${Object.values(results.after).map((p) => p.phpunit).find(Boolean) || 'unknown'}, PHP ${Object.values(results.after).map((p) => p.php).find(Boolean) || 'unknown'}, run with \`ddev phpunit\` |
| Started | ${started.toISOString()} |

${sections.map((s) => `## ${s.title}\n${s.table ? `\n${renderMarkdownTable(s.table.header, s.table.rows)}\n` : ''}${(s.lines || []).length ? `\n${s.lines.map((l) => (/^\s/.test(l) ? `  - ${l.trim()}` : `- ${l}`)).join('\n')}\n` : ''}`).join('\n')}
## Not covered
- These tests are not in the issue's merge request and have not run in drupal.org's CI; the run uses the Chrome in DDEV and the theme each test sets.
- PHPCS and PHPStan are code style and static analysis, not accessibility evidence.
`;
  fs.mkdirSync(path.dirname(path.resolve(opt.report)), { recursive: true }); fs.writeFileSync(opt.report, md);
  console.log(`Report: ${opt.report}`);
}
process.exit(problems.length ? 1 : 0);
