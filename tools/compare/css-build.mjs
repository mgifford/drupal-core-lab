// Drupal core's .pcss.css sources and their compiled .css files: find them in a patch stack, check them with core's own build:css, and (only where the
// policy allows) rebuild them. Core's toolchain does the work: `yarn run build:css [--check] --file <path>` run from the checkout's core/ folder, with the
// Yarn that core's package.json pins. Nothing is compiled by anything else. See docs/COMMANDS.md and AGENTS.md ("Generated CSS").
//
// The two workflows, which are never mixed up:
//   authoring   the After checkout holds the author's own edits (working-tree changes beyond the declared patches, or patches authored in the lab):
//               a stale or missing compiled file is rebuilt automatically before a patch is captured.
//   reviewing   a declared patch that was imported (a merge request, a drupal.org patch): it is checked and reported, never rewritten. A corrective
//               build needs --corrective, writes only into the After checkout's working tree, and is captured as a SEPARATE follow-up patch.
// The Before checkout is never written to.
//
// Values used in results: PASS, FAIL, BLOCKED (a tool or file the check needs is missing), SKIPPED, NOT VERIFIED.
// `applicability` says why: not-applicable (plain CSS has no .pcss.css source), skipped (source exists but no build was run),
// applicable, or blocked. It is separate from the PASS/FAIL result so existing callers keep their exit codes.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { labRoot, variants, envDir } from './lib.mjs';
import { patchFileList } from './patch-state.mjs';
import { captureEdits, labFiles } from './capture.mjs';
import { makeInEnv, resolveYarn, ensureNodeModules, firstLine, withEnv } from './core-toolchain.mjs';

export const isPcss = (f) => /\.pcss\.css$/.test(f);
export const compiledOf = (f) => f.replace(/\.pcss\.css$/, '.css');
export const sourceOf = (f) => f.replace(/\.css$/, '.pcss.css');
export const inCore = (f) => f.replace(/^core\//, '');
const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');
const q = (s) => `'${String(s).replace(/'/g, `'\\''`)}'`;

// ---- what the patch stack does to each path
// Walks the patches in order. Returns Map path -> { state: 'present' | 'deleted', patches: [indexes that touch it] }.
// A rename is a deletion of the old path and a presence of the new one.
export function stackState(patchTexts) {
  const map = new Map();
  const set = (p, state, i) => { const e = map.get(p) || { state, patches: [] }; e.state = state; if (!e.patches.includes(i)) e.patches.push(i); map.set(p, e); };
  patchTexts.forEach((text, i) => {
    for (const block of String(text).split(/^(?=diff --git )/m)) {
      const m = block.match(/^diff --git a\/(.+?) b\/(.+)$/m); if (!m) continue;
      const [, from, to] = m;
      if (/^deleted file mode/m.test(block)) set(from, 'deleted', i);
      else { if (from !== to) set(from, 'deleted', i); set(to, 'present', i); }
    }
  });
  return map;
}

// The PostCSS entries of a change set: every .pcss.css file the patches or the working-tree edits add, change, rename or delete, and the compiled
// .css files that changed without their source (those matter only if a source exists; the check decides).
//   patchTexts   the declared patches in order, as text      authored   parallel booleans: was that patch written in the lab?
//   edits        [{ status, path }] changes in the working tree beyond the declared patches (capture.mjs)
export function survey(patchTexts, authored = [], edits = []) {
  const stack = stackState(patchTexts);
  const editState = new Map(edits.map((e) => [e.path, e.status === 'D' ? 'deleted' : 'present']));
  const all = new Set([...stack.keys(), ...editState.keys()]);
  const entries = [], compiledOnly = [];
  for (const p of [...all].sort()) {
    const st = editState.has(p) ? editState.get(p) : stack.get(p).state;
    const touchedBy = stack.get(p)?.patches || [];
    const origin = editState.has(p) ? 'edit' : touchedBy.some((i) => authored[i]) ? 'authored' : 'imported';
    if (isPcss(p)) {
      const c = compiledOf(p);
      const cState = editState.has(c) ? editState.get(c) : stack.get(c)?.state || 'absent';
      entries.push({ source: p, compiled: c, sourceState: st, origin, compiledInStack: cState });
    } else if (/\.css$/.test(p) && !all.has(sourceOf(p))) compiledOnly.push({ compiled: p, source: sourceOf(p), origin, state: st });
  }
  return { relevant: entries.length > 0 || compiledOnly.length > 0, entries, compiledOnly };
}

// ---- running core's script
// run(args) -> { status, stdout, stderr } where args follow `yarn run build:css`.
export function makeCssRunner({ inEnv, pathPrefix = '' }) {
  return (args) => inEnv(withEnv(pathPrefix, `cd core && yarn run build:css ${args.map(q).join(' ')}`));
}
const failedToStart = (r) => r.status === null || /command not found|Cannot find module|packageManager|ENOENT: no such file or directory, (?:open|scandir) '[^']*node_modules/i.test(`${r.stdout}${r.stderr}`) || (r.status !== 0 && !/\bis being (?:checked|processed)\b/.test(`${r.stdout}${r.stderr}`));

// One entry, checked on its own. state: ok | missing | stale | orphan | blocked | not-built
export function checkEntry(dir, e, run, exists = (f) => fs.existsSync(f)) {
  const src = path.join(dir, e.source), out = path.join(dir, e.compiled);
  if (e.sourceState === 'deleted') return exists(out) ? { ...e, state: 'orphan', result: 'FAIL', detail: `${e.source} is deleted but ${e.compiled} is still there.` } : { ...e, state: 'ok', result: 'SKIPPED', detail: 'The source is deleted and so is its compiled file.' };
  if (!exists(src)) return { ...e, state: 'blocked', result: 'BLOCKED', detail: `${e.source} is not in the checkout. Are the patches applied?` };
  if (!exists(out)) return { ...e, state: 'missing', result: 'FAIL', detail: `${e.source} has no compiled ${path.basename(e.compiled)}.` };
  const r = run(['--check', '--file', inCore(e.source)]), text = `${r.stdout || ''}${r.stderr || ''}`;
  if (/does not match its CSS file/.test(text)) return { ...e, state: 'stale', result: 'FAIL', detail: `${path.basename(e.source)} was changed, but ${path.basename(e.compiled)} does not match what core's build produces.` };
  if (failedToStart(r)) return { ...e, state: 'blocked', result: 'BLOCKED', detail: `core's build:css did not run: ${firstLine(r).slice(0, 160)}` };
  return { ...e, state: r.status === 0 ? 'ok' : 'stale', result: r.status === 0 ? 'PASS' : 'FAIL', detail: r.status === 0 ? 'The compiled file matches its source.' : `build:css --check exited ${r.status}: ${firstLine(r).slice(0, 160)}` };
}

// Compiled files that changed without their source: PASS when there is no PostCSS source at all (a plain stylesheet), otherwise they are checked.
export function checkCompiledOnly(dir, list, run, exists = (f) => fs.existsSync(f)) {
  return list.map((c) => (exists(path.join(dir, c.source))
    ? checkEntry(dir, { source: c.source, compiled: c.compiled, sourceState: 'present', origin: c.origin, compiledInStack: c.state }, run, exists)
    : { source: c.source, compiled: c.compiled, sourceState: 'absent', origin: c.origin, compiledInStack: c.state, state: 'no-source', result: 'SKIPPED', detail: `${c.compiled} has no .pcss.css source in core, so there is nothing to compile.` }));
}

// May this entry be rebuilt? The Before side never; an imported patch's files only with --corrective.
export function buildPolicy(e, { side = 'after', corrective = false } = {}) {
  if (side !== 'after') return { allowed: false, why: 'The Before checkout is never written to.' };
  if (e.origin === 'imported' && !corrective) return { allowed: false, why: `${e.source} comes from an imported patch, which is preserved as it is. To build a corrective follow-up in the After checkout: node scripts/css-build.mjs <slug> --build --corrective, then capture it as a separate patch.` };
  return { allowed: true, why: e.origin === 'imported' ? 'corrective build (recorded; the imported patch stays unchanged)' : 'authoring' };
}

// Rebuild the entries that need it and are allowed to be rebuilt, one file at a time, then check them again.
export function buildEntries(dir, checked, run, policy, exists = (f) => fs.existsSync(f)) {
  const out = [];
  for (const e of checked) {
    if (!['missing', 'stale'].includes(e.state)) { out.push(e); continue; }
    const pol = buildPolicy(e, policy);
    if (!pol.allowed) { out.push({ ...e, built: false, refused: pol.why }); continue; }
    const before = exists(path.join(dir, e.compiled)) ? sha(fs.readFileSync(path.join(dir, e.compiled))) : null;
    const r = run(['--file', inCore(e.source)]);
    if (failedToStart(r)) { out.push({ ...e, state: 'blocked', result: 'BLOCKED', built: false, detail: `core's build:css did not run: ${firstLine(r).slice(0, 160)}` }); continue; }
    const after = exists(path.join(dir, e.compiled)) ? sha(fs.readFileSync(path.join(dir, e.compiled))) : null;
    const again = checkEntry(dir, e, run, exists);
    out.push({ ...again, built: true, changed: before !== after, reason: pol.why });
  }
  return out;
}

// ---- cache: has this exact build already been verified?
const KEY_FILES = ['core/package.json', 'core/yarn.lock', 'core/scripts/css/postcss-build.js', 'core/scripts/css/compile.js', 'core/scripts/css/check.js', 'core/scripts/css/changeOrAdded.js', 'core/scripts/css/remove-unwanted-comments.js', 'core/postcss.config.js', 'core/.browserslistrc'];
export function cacheKey({ dir, coreCommit, patches, entries, tools }) {
  const files = Object.fromEntries(KEY_FILES.filter((f) => fs.existsSync(path.join(dir, f))).map((f) => [f, sha(fs.readFileSync(path.join(dir, f)))]));
  const content = Object.fromEntries(entries.flatMap((e) => [e.source, e.compiled]).map((f) => [f, fs.existsSync(path.join(dir, f)) ? sha(fs.readFileSync(path.join(dir, f))) : 'ABSENT']));
  return sha(JSON.stringify({ coreCommit, patches, files, content, tools }));
}
export const CACHE_FILE = '.lab-css-build.json';
export const readCache = (dir) => { try { return JSON.parse(fs.readFileSync(path.join(dir, CACHE_FILE), 'utf8')); } catch { return null; } };
export const writeCache = (dir, c) => fs.writeFileSync(path.join(dir, CACHE_FILE), `${JSON.stringify(c, null, 2)}\n`);

// ---- patches written in the lab versus imported ones (BRANCHES.md says which)
export function isAuthoredPatch(rel) {
  const nid = rel.match(/reports\/issues\/(\d+)\//)?.[1]; if (!nid) return false;
  try { return fs.readFileSync(path.join(labRoot, 'reports/issues', nid, 'BRANCHES.md'), 'utf8').split('\n').some((l) => l.includes(path.basename(rel)) && /authored in the lab/.test(l)); } catch { return false; }
}

// A one-line static look at a patch for the issue-setup step: is there PostCSS source, and does the patch carry the compiled file? (No toolchain.)
export function staticSurvey(patchText) {
  const s = survey([patchText]);
  const entries = s.entries.map((e) => ({ source: e.source, compiled: e.compiled, sourceState: e.sourceState, compiledInPatch: e.compiledInStack !== 'absent' }));
  return { relevant: entries.length > 0, sources: entries.length, missingCompiled: entries.filter((e) => e.sourceState === 'present' && !e.compiledInPatch).map((e) => e.source), entries };
}

// ---- the whole job for one variant side
// opts: { slug, side='after', build=false, corrective=false, mode='auto'|'host'|'ddev', install=true, dryRun=false, run (inject for tests), now }
export function analyze(opts) {
  const { slug, side = 'after', build = false, corrective = false, dryRun = false } = opts;
  const v = opts.variant || variants().find((x) => x.slug === slug);
  const res = { slug, side, env: null, generated: new Date().toISOString(), commands: [], notes: [], entries: [], built: [], overall: 'NOT VERIFIED', applicability: null, applicabilityDetail: null, ready: false };
  if (!v) return { ...res, overall: 'BLOCKED', notes: [`unknown variant ${slug}`] };
  const spec = v[side]; res.env = spec.env; const dir = opts.dir || envDir(spec.env);
  if (!fs.existsSync(path.join(dir, 'core/package.json'))) return { ...res, overall: 'BLOCKED', notes: [`${spec.env} has no core checkout. Build it: node tools/compare/setup.mjs ${slug}   (or --checkout-only)`] };
  const patches = spec.patches || [];
  const texts = patches.map((p) => fs.readFileSync(path.resolve(labRoot, p), 'utf8'));
  const authored = patches.map(isAuthoredPatch);
  res.patches = patches.map((p, i) => ({ path: p, sha256: sha(Buffer.from(texts[i])), authored: authored[i] }));
  res.coreCommit = spawnSync('git', ['rev-parse', '--short=12', 'HEAD'], { cwd: dir, encoding: 'utf8' }).stdout.trim();
  const cap = captureEdits(dir, texts.map((t) => Buffer.from(t)), { exclude: [...labFiles(v.recipe, v.contrib || []), CACHE_FILE, '.lab-css', '.lab-lint'] });
  if (!cap.ok) return { ...res, overall: 'BLOCKED', notes: [`could not compare the checkout with its declared patches: ${cap.error}`] };
  res.editsBeyondPatches = cap.files.length;
  if (side === 'before' && cap.files.length) res.notes.push(`The Before checkout has ${cap.files.length} change(s) beyond its declared patches. That is not the pristine baseline.`);
  const s = survey(texts, authored, cap.files);
  res.relevant = s.relevant;
  if (!s.relevant) return { ...res, overall: 'SKIPPED', applicability: 'not-applicable', applicabilityDetail: 'no .pcss.css source is changed by the patch stack or the working tree', ready: true, notes: [...res.notes, 'No .pcss.css source is changed by the patch stack or the working tree, so no CSS build is needed.'] };
  if (side === 'before' && build) return { ...res, overall: 'BLOCKED', notes: [...res.notes, 'The Before checkout is never written to, so --build is refused for it.'] };

  // the toolchain
  const useDdev = opts.mode === 'ddev' || (opts.mode !== 'host' && !fs.existsSync(path.join(dir, 'core/node_modules')) && fs.existsSync(path.join(dir, '.ddev/config.yaml')));
  res.runtime = useDdev ? 'DDEV web container' : 'host';
  let run = opts.run, cleanup = () => {};
  if (!run) {
    const inEnv = makeInEnv({ dir, useDdev });
    const yarn = resolveYarn({ dir, inEnv, useDdev, binDir: '.lab-css/bin' });
    cleanup = () => fs.rmSync(path.join(dir, '.lab-css'), { recursive: true, force: true });
    if (yarn.error) { cleanup(); return { ...res, overall: 'BLOCKED', notes: [...res.notes, yarn.error] }; }
    res.tools = { node: firstLine(inEnv('node --version')), yarn: firstLine(inEnv(withEnv(yarn.pathPrefix, 'cd core && yarn --version'))), yarnWanted: yarn.want, corepack: yarn.usedCorepack };
    const nm = fs.existsSync(path.join(dir, 'core/node_modules/.bin/stylelint')) || fs.existsSync(path.join(dir, 'core/node_modules/postcss'));
    if (!nm) {
      if (opts.install === false || dryRun) { cleanup(); return { ...res, overall: 'BLOCKED', notes: [...res.notes, 'core/node_modules is missing. Install core\'s own tools (never a separate PostCSS): run without --no-install, or: cd core && yarn install --immutable'] }; }
      res.commands.push('cd core && yarn install --immutable');
      const ins = ensureNodeModules({ dir, inEnv, prefix: withEnv(yarn.pathPrefix, ''), marker: 'core/node_modules/postcss', stdio: 'pipe' });
      if (!ins.ok) { cleanup(); return { ...res, overall: 'BLOCKED', notes: [...res.notes, ins.error || 'yarn install failed'] }; }
    }
    run = makeCssRunner({ inEnv, pathPrefix: yarn.pathPrefix });
  } else res.tools = res.tools || { node: 'injected', yarn: 'injected' };
  const log = (args) => { res.commands.push(`cd core && yarn run build:css ${args.join(' ')}`); };
  const traced = (args) => { log(args); return run(args); };

  try {
    const key = cacheKey({ dir, coreCommit: res.coreCommit, patches: res.patches.map((p) => p.sha256), entries: [...s.entries, ...s.compiledOnly.map((c) => ({ source: c.source, compiled: c.compiled }))], tools: res.tools });
    const cache = readCache(dir); res.cache = cache && cache.key === key && cache.overall === 'PASS' ? 'hit (verified before; the check below still runs)' : 'miss';
    let checked = [...s.entries.map((e) => checkEntry(dir, e, traced)), ...checkCompiledOnly(dir, s.compiledOnly, traced)];
    if (build && !dryRun) {
      const needs = checked.filter((e) => ['missing', 'stale'].includes(e.state));
      if (needs.length && cache && cache.key === key && cache.overall === 'PASS') res.notes.push('The cache said this build was verified, but the check found a difference; the cache is ignored.');
      const rebuilt = buildEntries(dir, checked, traced, { side, corrective });
      checked = rebuilt; res.built = rebuilt.filter((e) => e.built && e.changed).map((e) => e.compiled);
    } else if (build && dryRun) {
      checked = checked.map((e) => (['missing', 'stale'].includes(e.state) ? { ...e, wouldBuild: buildPolicy(e, { side, corrective }) } : e));
    }
    res.entries = checked;
    const bad = checked.filter((e) => ['FAIL', 'BLOCKED'].includes(e.result));
    // is each compiled file part of what is submitted? yes when the stack or the edits carry it, or when the source change leaves its output unchanged
    for (const e of res.entries) e.inPatch = e.sourceState === 'deleted' ? e.compiledInStack === 'deleted' : (e.compiledInStack === 'present' || e.built === true || e.state === 'ok');
    res.overall = checked.some((e) => e.result === 'BLOCKED') ? 'BLOCKED' : bad.length ? 'FAIL' : checked.every((e) => e.result === 'SKIPPED') ? 'SKIPPED' : 'PASS';
    const allNoSource = checked.length > 0 && checked.every((e) => e.state === 'no-source');
    res.applicability = res.overall === 'BLOCKED' ? 'blocked' : res.overall === 'FAIL' ? 'applicable' : allNoSource ? 'not-applicable' : res.overall === 'PASS' ? 'applicable' : 'skipped';
    res.applicabilityDetail = allNoSource
      ? 'the changed .css files have no .pcss.css source; plain CSS does not need compilation'
      : res.overall === 'SKIPPED' ? 'the source exists but no build was run (check-only or a skipped build)' : null;
    res.ready = res.overall === 'PASS' || res.overall === 'SKIPPED';
    if (res.overall === 'PASS' && !dryRun) writeCache(dir, { key: cacheKey({ dir, coreCommit: res.coreCommit, patches: res.patches.map((p) => p.sha256), entries: [...s.entries, ...s.compiledOnly.map((c) => ({ source: c.source, compiled: c.compiled }))], tools: res.tools }), overall: 'PASS', coreCommit: res.coreCommit, verifiedAt: res.generated, files: checked.map((e) => e.source) });
    return res;
  } finally { cleanup(); }
}

// A build in the After checkout leaves a working-tree change. Write it up without touching any declared patch: the interdiff (what the declared patches
// do not yet contain) and the full proposal from the checkout's base commit. Both are checked to apply: captureEdits only returns a patch that round-trips.
export function emitFollowup({ variant, side = 'after', dir, res, outDir, day = new Date().toISOString().slice(0, 10) }) {
  const texts = (variant[side].patches || []).map((p) => fs.readFileSync(path.resolve(labRoot, p)));
  const cap = captureEdits(dir, texts, { exclude: [...labFiles(variant.recipe, variant.contrib || []), CACHE_FILE, '.lab-css', '.lab-lint'] });
  if (!cap.ok) return { error: cap.error };
  if (!cap.patch.length) return null;
  fs.mkdirSync(outDir, { recursive: true });
  const interdiff = path.join(outDir, `${day}-${res.slug}-followup-interdiff.patch`), full = path.join(outDir, `${day}-${res.slug}-followup-full.patch`);
  fs.writeFileSync(interdiff, cap.patch);
  fs.writeFileSync(full, spawnSync('git', ['diff', '--binary', '--full-index', 'HEAD', cap.actualTree], { cwd: dir, maxBuffer: 1 << 28 }).stdout);
  return { interdiff, full, base: res.coreCommit, files: cap.files.map((f) => `${f.status} ${f.path}`), declaredPatchesChanged: false };
}
