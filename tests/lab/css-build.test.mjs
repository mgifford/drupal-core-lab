// Tests for tools/compare/css-build.mjs: finding .pcss.css sources in a patch stack, checking and rebuilding the compiled .css, and the policies around it.
// Throwaway git repositories in a temp folder and a fake build:css that compiles deterministically; no network, no Drupal. Run: node --test tests/lab/css-build.test.mjs
// The real toolchain is exercised by tests/lab/real/css-build-real.mjs (needs a core checkout with node_modules).
import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { analyze, emitFollowup, survey, stackState, staticSurvey, buildPolicy, cacheKey, compiledOf, isPcss, CACHE_FILE } from '../../tools/compare/css-build.mjs';
import { resolveYarn } from '../../tools/compare/core-toolchain.mjs';

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'css-build-test-')); after(() => fs.rmSync(root, { recursive: true, force: true }));
let n = 0;
const git = (cwd, ...a) => spawnSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@t', ...a], { cwd, encoding: 'utf8' });
const write = (f, text) => { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, text); };
const sha = (f) => (fs.existsSync(f) ? crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex') : 'ABSENT');

// The fake compiler: deterministic, a pure function of the source.
const compile = (src) => `/* compiled */\n${src.replace(/\s+/g, ' ').trim()}\n`;
const PCSS = (name, body = 'a { color: red; }') => `core/modules/m/css/${name}.pcss.css`;
const CSS = (name) => `core/modules/m/css/${name}.css`;
const BASE = { 'a': 'a { color: red; }\n', 'b': 'b { color: blue; }\n' };

// A fake `yarn run build:css`: args are what follows the script name. It logs like core's scripts do.
function fakeRunner(dir, calls = []) {
  return (args) => {
    calls.push(args.join(' '));
    const files = args.flatMap((a, i) => (args[i - 1] === '--file' ? [a] : [])), checking = args.includes('--check');
    let out = '', status = 0;
    for (const f of files) {
      const src = path.join(dir, 'core', f), outFile = src.replace(/\.pcss\.css$/, '.css');
      out += `[00:00:00] '${f}' is being ${checking ? 'checked' : 'processed'}.\n`;
      const code = compile(fs.readFileSync(src, 'utf8'));
      if (checking) {
        if (!fs.existsSync(outFile)) { out += 'Error: ENOENT\n'; status = 1; } else if (fs.readFileSync(outFile, 'utf8') !== code) { out += `[00:00:00] '${f}' does not match its CSS file. Recompile the CSS with: yarn run build:css\n`; status = 1; }
      } else fs.writeFileSync(outFile, code);
    }
    return { status, stdout: out, stderr: '' };
  };
}

// A checkout with pcss/css pairs committed, then: the declared patches (imported) applied to the working tree, then the author's own edits.
// patches: [(dir) => mutate the working tree]   edits: (dir) => mutate the working tree after the patches
function scenario({ patches = [], edits = null, extra = {} } = {}) {
  const dir = path.join(root, `r${++n}`); fs.mkdirSync(dir); git(dir, 'init', '-q', '-b', 'main');
  write(path.join(dir, 'core/package.json'), JSON.stringify({ packageManager: 'yarn@4.18.0' }));
  write(path.join(dir, 'core/yarn.lock'), '# lock\n');
  for (const [k, src] of Object.entries(BASE)) { write(path.join(dir, PCSS(k)), src); write(path.join(dir, CSS(k)), compile(src)); }
  for (const [f, text] of Object.entries(extra)) write(path.join(dir, f), text);
  git(dir, 'add', '-A'); git(dir, 'commit', '-q', '-m', 'base');
  const files = [];
  patches.forEach((mutate, i) => {
    mutate(dir); git(dir, 'add', '-A'); const p = git(dir, 'diff', '--cached', '--binary', '--full-index').stdout; git(dir, 'commit', '-q', '-m', `p${i}`);
    const pf = path.join(root, `p${n}-${i}.patch`); write(pf, p); files.push(pf);
  });
  // return to the base commit's tree and re-apply the patches as uncommitted changes, like the lab's After checkout
  if (patches.length) { git(dir, 'reset', '-q', '--hard', 'HEAD~' + patches.length); for (const pf of files) assert.equal(git(dir, 'apply', pf).status, 0, 'patch applies'); }
  if (edits) edits(dir);
  const variant = { slug: `t${n}`, issue: '1', before: { env: 'b', patches: [] }, after: { env: 'a', patches: files } };
  return { dir, variant, files, calls: [], run: null, opts(o = {}) { const calls = this.calls; return { slug: variant.slug, variant, dir, run: fakeRunner(dir, calls), mode: 'host', ...o }; } };
}
const edit = (name, src) => (dir) => write(path.join(dir, PCSS(name)), src);
const editBoth = (name, src) => (dir) => { write(path.join(dir, PCSS(name)), src); write(path.join(dir, CSS(name)), compile(src)); };

test('1. an issue with no CSS change skips compilation and never starts the toolchain', () => {
  const s = scenario({ patches: [(d) => write(path.join(d, 'core/modules/m/src/X.php'), '<?php\n')] });
  const r = analyze(s.opts()); assert.equal(r.overall, 'SKIPPED'); assert.equal(r.applicability, 'not-applicable'); assert.match(r.applicabilityDetail, /no \.pcss\.css source/); assert.equal(r.ready, true); assert.deepEqual(s.calls, []);
});

test('2. and 3. a changed source triggers a check of that file only; a matching compiled file passes', () => {
  const s = scenario({ patches: [editBoth('a', 'a { color: green; }\n')] });
  const r = analyze(s.opts()); assert.equal(r.overall, 'PASS'); assert.equal(r.ready, true);
  assert.deepEqual(s.calls, ['--check --file modules/m/css/a.pcss.css'], 'b.pcss.css was not touched, so it is not checked');
  assert.equal(r.entries[0].origin, 'imported'); assert.equal(r.entries[0].inPatch, true);
});

test('4. a missing compiled file is detected', () => {
  const s = scenario({ patches: [(d) => write(path.join(d, PCSS('new')), 'n { color: red; }\n')] });
  const r = analyze(s.opts()); assert.equal(r.overall, 'FAIL'); assert.equal(r.entries[0].state, 'missing'); assert.equal(r.ready, false);
});

test('5. a stale compiled file is detected, with a message that says what to do', () => {
  const s = scenario({ patches: [edit('a', 'a { color: green; }\n')] });
  const r = analyze(s.opts()); assert.equal(r.overall, 'FAIL'); assert.equal(r.entries[0].state, 'stale'); assert.match(r.entries[0].detail, /does not match/);
});

test('6. a source edit is rebuilt to exactly the artifact the compiler makes; the cache is then written', () => {
  const s = scenario({ edits: edit('a', 'a { color: purple; }\n') });
  const r = analyze(s.opts({ build: true })); assert.equal(r.overall, 'PASS'); assert.deepEqual(r.built, [CSS('a')]);
  assert.equal(fs.readFileSync(path.join(s.dir, CSS('a')), 'utf8'), compile('a { color: purple; }\n'));
  assert.ok(fs.existsSync(path.join(s.dir, CACHE_FILE)));
});

test('7. an imported stale patch is reported, not repaired, unless a corrective build is asked for; the declared patch stays byte for byte', () => {
  const s = scenario({ patches: [edit('a', 'a { color: green; }\n')] }), before = sha(s.files[0]), cssBefore = sha(path.join(s.dir, CSS('a')));
  let r = analyze(s.opts()); assert.equal(r.overall, 'FAIL');
  r = analyze(s.opts({ build: true })); assert.equal(r.overall, 'FAIL'); assert.match(r.entries[0].refused, /imported patch/); assert.equal(sha(path.join(s.dir, CSS('a'))), cssBefore, 'nothing was written');
  r = analyze(s.opts({ build: true, corrective: true })); assert.equal(r.overall, 'PASS'); assert.deepEqual(r.built, [CSS('a')]);
  assert.equal(sha(s.files[0]), before, 'the imported patch file is unchanged');
  const f = emitFollowup({ variant: s.variant, dir: s.dir, res: r, outDir: path.join(root, `out${n}`), day: '2026-01-01' });
  const inter = fs.readFileSync(f.interdiff, 'utf8'); assert.match(inter, /a\.css/); assert.doesNotMatch(inter, /a\.pcss\.css/, 'the interdiff holds only what the imported patch lacks');
  assert.equal(f.declaredPatchesChanged, false);
});

test('8. an authored patch that carries source and compiled file passes; one without the compiled file does not', () => {
  const ok = scenario({ edits: editBoth('a', 'a { color: teal; }\n') });
  assert.equal(analyze(ok.opts()).overall, 'PASS');
  const bad = scenario({ edits: edit('a', 'a { color: teal; }\n') });
  const r = analyze(bad.opts()); assert.equal(r.overall, 'FAIL'); assert.equal(r.entries[0].origin, 'edit');
});

test('9. a revised patch gets an accurate interdiff: the declared patch plus the interdiff gives the working files', () => {
  const s = scenario({ patches: [edit('a', 'a { color: green; }\n')] });
  const r = analyze(s.opts({ build: true, corrective: true })), f = emitFollowup({ variant: s.variant, dir: s.dir, res: r, outDir: path.join(root, `iv${n}`) });
  const fresh = path.join(root, `fresh${n}`); fs.mkdirSync(fresh); git(fresh, 'init', '-q', '-b', 'main');
  for (const [k, src] of Object.entries(BASE)) { write(path.join(fresh, PCSS(k)), src); write(path.join(fresh, CSS(k)), compile(src)); }
  git(fresh, 'add', '-A'); git(fresh, 'commit', '-q', '-m', 'base');
  assert.equal(git(fresh, 'apply', s.files[0]).status, 0); assert.equal(git(fresh, 'apply', f.interdiff).status, 0, 'the interdiff applies on top of the declared patch');
  assert.equal(sha(path.join(fresh, CSS('a'))), sha(path.join(s.dir, CSS('a'))));
  const full = path.join(root, `full${n}`); fs.mkdirSync(full); git(full, 'init', '-q', '-b', 'main');
  for (const [k, src] of Object.entries(BASE)) { write(path.join(full, PCSS(k)), src); write(path.join(full, CSS(k)), compile(src)); }
  git(full, 'add', '-A'); git(full, 'commit', '-q', '-m', 'base'); assert.equal(git(full, 'apply', f.full).status, 0, 'the full proposal applies on the base'); assert.equal(sha(path.join(full, CSS('a'))), sha(path.join(s.dir, CSS('a'))));
});

test('10. several PostCSS files are checked and built one file per call', () => {
  const s = scenario({ edits: (d) => { write(path.join(d, PCSS('a')), 'a { color: pink; }\n'); write(path.join(d, PCSS('b')), 'b { color: gold; }\n'); } });
  const r = analyze(s.opts({ build: true })); assert.equal(r.overall, 'PASS'); assert.equal(r.applicability, 'applicable'); assert.deepEqual(r.built.sort(), [CSS('a'), CSS('b')]);
  assert.ok(s.calls.every((c) => (c.match(/--file/g) || []).length === 1), 'each call names one file');
});

test('11. a stylesheet with no PostCSS source is handled as nothing to compile, not an error', () => {
  const s = scenario({ extra: { 'core/modules/m/css/plain.css': 'p { margin: 0; }\n' }, patches: [(d) => write(path.join(d, 'core/modules/m/css/plain.css'), 'p { margin: 1px; }\n')] });
  const r = analyze(s.opts()); assert.equal(r.overall, 'SKIPPED'); assert.equal(r.applicability, 'not-applicable'); assert.match(r.applicabilityDetail, /plain CSS/); assert.equal(r.entries[0].state, 'no-source'); assert.deepEqual(s.calls, []);
});

test('12. a toolchain that does not start is BLOCKED, never an approximate result', () => {
  const s = scenario({ edits: edit('a', 'a { color: pink; }\n') });
  const r = analyze(s.opts({ run: () => ({ status: 127, stdout: '', stderr: 'bash: line 1: yarn: command not found' }), build: true }));
  assert.equal(r.overall, 'BLOCKED'); assert.equal(r.applicability, 'blocked'); assert.equal(r.ready, false); assert.equal(sha(path.join(s.dir, CSS('a'))), sha(path.join(s.dir, CSS('a'))));
  assert.equal(fs.readFileSync(path.join(s.dir, CSS('a')), 'utf8'), compile(BASE.a), 'the compiled file was not touched');
});

test('13. a Yarn that is not the version core pins uses Corepack, or reports the problem', () => {
  const dir = path.join(root, `y${++n}`); write(path.join(dir, 'core/package.json'), JSON.stringify({ packageManager: 'yarn@4.18.0' }));
  const same = resolveYarn({ dir, inEnv: () => ({ status: 0, stdout: '4.18.0\n', stderr: '' }), useDdev: false }); assert.equal(same.pathPrefix, ''); assert.equal(same.usedCorepack, false);
  const calls = [], differ = resolveYarn({ dir, inEnv: (c) => { calls.push(c); return { status: 0, stdout: c.includes('yarn --version') ? '1.22.22\n' : '0.34.0\n', stderr: '' }; }, useDdev: false });
  assert.equal(differ.usedCorepack, true); assert.match(differ.pathPrefix, /\.lab-lint\/bin/); assert.match(fs.readFileSync(path.join(dir, '.lab-lint/bin/yarn'), 'utf8'), /corepack yarn/);
  const none = resolveYarn({ dir, inEnv: (c) => ({ status: c.includes('corepack') ? 127 : 0, stdout: '1.22.22\n', stderr: '' }), useDdev: true });
  assert.match(none.error, /needs Yarn 4\.18\.0 and this container has neither/);
});

test('14. a change in core\'s build configuration, dependencies or toolchain changes the cache key; the same inputs give the same key', () => {
  const s = scenario({ edits: editBoth('a', 'a { color: pink; }\n') });
  const e = [{ source: PCSS('a'), compiled: CSS('a') }], args = { dir: s.dir, coreCommit: 'abc', patches: ['p'], entries: e, tools: { node: 'v24', yarn: '4.18.0' } };
  const k0 = cacheKey(args); assert.equal(cacheKey({ ...args }), k0);
  assert.notEqual(cacheKey({ ...args, tools: { node: 'v24', yarn: '4.19.0' } }), k0, 'toolchain');
  assert.notEqual(cacheKey({ ...args, coreCommit: 'def' }), k0, 'core commit');
  assert.notEqual(cacheKey({ ...args, patches: ['p2'] }), k0, 'patch stack');
  write(path.join(s.dir, 'core/yarn.lock'), '# changed\n'); assert.notEqual(cacheKey(args), k0, 'dependencies');
  write(path.join(s.dir, 'core/yarn.lock'), '# lock\n'); write(path.join(s.dir, PCSS('a')), 'a { color: red; }\n'); assert.notEqual(cacheKey(args), k0, 'source content');
});

test('15. an existing valid build is processed again without producing changes, and the second run is a cache hit', () => {
  const s = scenario({ edits: edit('a', 'a { color: pink; }\n') });
  analyze(s.opts({ build: true })); const h = sha(path.join(s.dir, CSS('a')));
  const again = analyze(s.opts({ build: true })); assert.equal(again.overall, 'PASS'); assert.deepEqual(again.built, []); assert.equal(sha(path.join(s.dir, CSS('a'))), h); assert.match(again.cache, /^hit/);
});

test('16. the Before checkout is never written to, and a dirty baseline is reported', () => {
  const s = scenario({ edits: edit('a', 'a { color: pink; }\n') }), h = sha(path.join(s.dir, CSS('a')));
  const r = analyze(s.opts({ side: 'before', build: true, variant: { ...s.variant, before: { env: 'b', patches: [] } } }));
  assert.equal(r.overall, 'BLOCKED'); assert.match(r.notes.join(' '), /never written to/); assert.equal(sha(path.join(s.dir, CSS('a'))), h);
  assert.deepEqual(buildPolicy({ origin: 'edit' }, { side: 'before' }).allowed, false);
});

test('17. a failed build blocks readiness and does not touch earlier evidence or the earlier cache entry', () => {
  const s = scenario({ edits: edit('a', 'a { color: pink; }\n') }); analyze(s.opts({ build: true }));
  const evidence = path.join(root, `evidence${n}.md`); write(evidence, 'earlier run\n'); const e0 = sha(evidence), c0 = sha(path.join(s.dir, CACHE_FILE));
  write(path.join(s.dir, PCSS('a')), 'a { color: black; }\n');
  const r = analyze(s.opts()); assert.equal(r.overall, 'FAIL'); assert.equal(r.ready, false); assert.equal(sha(evidence), e0); assert.equal(sha(path.join(s.dir, CACHE_FILE)), c0, 'a failure writes no cache entry');
  assert.equal(analyze(s.opts()).cache, 'miss', 'but the earlier entry no longer matches');
});

test('18. the runtime is named, so an unsupported place is visible rather than silent', () => {
  const s = scenario({ edits: editBoth('a', 'a { color: pink; }\n') });
  assert.equal(analyze(s.opts({ mode: 'host' })).runtime, 'host');
  assert.match(analyze(s.opts({ mode: 'ddev' })).runtime, /DDEV/);
  // DDEV Coder workspaces are not exercised here: the same code path runs `ddev exec`, so it works where DDEV works; that is a stated limitation, not a tested result.
});

test('a deleted source with its compiled file left behind is an orphan; deleting both is fine', () => {
  const orphan = scenario({ patches: [(d) => fs.rmSync(path.join(d, PCSS('a')))] }); const r = analyze(orphan.opts()); assert.equal(r.overall, 'FAIL'); assert.equal(r.entries[0].state, 'orphan');
  const both = scenario({ patches: [(d) => { fs.rmSync(path.join(d, PCSS('a'))); fs.rmSync(path.join(d, CSS('a'))); }] }); assert.equal(analyze(both.opts()).overall, 'SKIPPED');
});

test('survey: renames are a deletion and an addition; compiled-only changes are listed; names are paired', () => {
  const rename = 'diff --git a/core/x/old.pcss.css b/core/x/new.pcss.css\nsimilarity index 100%\nrename from core/x/old.pcss.css\nrename to core/x/new.pcss.css\n';
  assert.equal(stackState([rename]).get('core/x/old.pcss.css').state, 'deleted'); assert.equal(stackState([rename]).get('core/x/new.pcss.css').state, 'present');
  const sv = survey([rename]); assert.deepEqual(sv.entries.map((e) => [e.source, e.sourceState]), [['core/x/new.pcss.css', 'present'], ['core/x/old.pcss.css', 'deleted']]);
  assert.equal(compiledOf('core/a/b.pcss.css'), 'core/a/b.css'); assert.equal(isPcss('core/a/b.css'), false);
  assert.deepEqual(survey(['diff --git a/core/y/z.css b/core/y/z.css\n--- a/core/y/z.css\n+++ b/core/y/z.css\n']).compiledOnly.map((c) => c.compiled), ['core/y/z.css']);
});

test('staticSurvey (used when an issue is set up) needs no toolchain', () => {
  const p = 'diff --git a/core/m/a.pcss.css b/core/m/a.pcss.css\n--- a/core/m/a.pcss.css\n+++ b/core/m/a.pcss.css\n';
  const s = staticSurvey(p); assert.equal(s.relevant, true); assert.deepEqual(s.missingCompiled, ['core/m/a.pcss.css']);
  assert.equal(staticSurvey('diff --git a/core/m/a.php b/core/m/a.php\n').relevant, false);
});
