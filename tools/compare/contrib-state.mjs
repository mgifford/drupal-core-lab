// Contrib modules and their patches, tracked by content (AI-usage slice E; the contrib half of what patch-state.mjs does for core).
// A variant may list contrib modules (`contrib: [{ name, url, commit }]`) that are cloned once into envs/.contrib/<name>.git, extracted
// at the pinned commit WITHOUT a .git directory into <env>/modules/contrib/<name>, and patched on the side that lists `contribPatches`.
// setup.mjs used to remember a module by an existing marker file (and print the variant's commit, not the recorded one) and a patch by its
// file name. Here a record in the checkout's git directory (<gitdir>/lab-patches/contrib.json) holds, per module, the commit, each patch's
// sha256 and the content hash of every file in the module. Without a record (every environment built so far) the expected files are built
// in a temporary folder from the commit and the patches and compared; equal means verified and recorded, different means blocked.
// The old marker files (.lab-contrib-<name>, .lab-contrib-patches-applied) are still written, so an older setup.mjs keeps working.
// Nothing is replaced unless refresh is asked for, and a refresh moves the old module folder to a backup instead of deleting it.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { sha256, patchFileList, gitDir, patchState } from './patch-state.mjs';

const SUB = 'modules/contrib';
const stateFile = (dir) => path.join(gitDir(dir), 'lab-patches', 'contrib.json');
const shown = (list, n = 6) => `${list.slice(0, n).join(', ')}${list.length > n ? `, and ${list.length - n} more` : ''}`;
const errLine = (r) => `${r.stderr || r.stdout || ''}`.trim().split('\n')[0].slice(0, 220);
const rank = { none: 0, verified: 1, unverified: 2, upgrade: 3, fresh: 4, mismatch: 5 };

// Every file of a folder: relative path to content hash and executable bit (a link: its target). Relative paths use '/'.
export function treeMapOf(root) {
  const m = {};
  const walk = (d, rel) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name), r = `${rel}${e.name}`;
      if (e.isDirectory()) walk(p, `${r}/`);
      else if (e.isSymbolicLink()) m[r] = `link:${fs.readlinkSync(p)}`;
      else m[r] = `${sha256(fs.readFileSync(p))}${fs.statSync(p).mode & 0o100 ? ':x' : ''}`;
    }
  };
  if (fs.existsSync(root)) walk(root, '');
  return m;
}

function readRecord(dir) { try { return JSON.parse(fs.readFileSync(stateFile(dir), 'utf8')); } catch { return { version: 1, modules: {} }; } }
function writeRecord(dir, rec, modules, patches) {
  const f = stateFile(dir); fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, `${JSON.stringify({ ...rec, version: 1, recordedAt: new Date().toISOString() }, null, 1)}\n`);
  for (const m of modules) if (rec.modules[m.name]) fs.writeFileSync(path.join(dir, `.lab-contrib-${m.name}`), `${m.commit}\n`);   // the old markers
  if (patches.length) fs.writeFileSync(path.join(dir, '.lab-contrib-patches-applied'), patches.map((p) => `${p.path}\n`).join(''));
}

// The shared bare clone has the commit (a clone from the module's url, a fetch of the commit if it is missing).
export function ensureShared(m, sharedRoot, log = () => {}) {
  const shared = path.join(sharedRoot, `${m.name}.git`);
  if (!fs.existsSync(shared)) { fs.mkdirSync(path.dirname(shared), { recursive: true }); log(`$ git clone --bare ${m.url} ${shared}`); const r = spawnSync('git', ['clone', '--bare', m.url, shared], { encoding: 'utf8' }); if (r.status !== 0) return `could not clone ${m.url}: ${errLine(r)}`; }
  if (spawnSync('git', ['-C', shared, 'rev-parse', '--verify', '-q', `${m.commit}^{commit}`], { stdio: 'ignore' }).status !== 0) { log(`$ git -C ${shared} fetch --depth 1 origin ${m.commit}`); const r = spawnSync('git', ['-C', shared, 'fetch', '--depth', '1', 'origin', m.commit], { encoding: 'utf8' }); if (r.status !== 0) return `could not fetch ${m.commit.slice(0, 12)} for ${m.name}: ${errLine(r)}`; }
  return '';
}

// What the module folder should hold: the commit extracted, then the patches applied in order, in a temporary folder.
// Returns { ok, tmp, folder, map } (the caller removes tmp) or { ok: false, error }.
export function buildExpected(m, patchFiles, sharedRoot) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'lab-contrib-')), folder = path.join(tmp, SUB, m.name); fs.mkdirSync(folder, { recursive: true });
  const shared = path.join(sharedRoot, `${m.name}.git`);
  const x = spawnSync('bash', ['-c', `set -o pipefail; git -C '${shared}' archive '${m.commit}' | tar -x -C '${folder}'`], { encoding: 'utf8' });
  if (x.status !== 0) { fs.rmSync(tmp, { recursive: true, force: true }); return { ok: false, error: `could not extract ${m.commit.slice(0, 12)} of ${m.name}: ${errLine(x)}` }; }
  for (const [i, pf] of patchFiles.entries()) {
    const r = spawnSync('git', ['apply', `--directory=${path.posix.join(SUB, m.name)}`, pf], { cwd: tmp, encoding: 'utf8' });
    if (r.status !== 0) { fs.rmSync(tmp, { recursive: true, force: true }); return { ok: false, failed: i, error: errLine(r) }; }
  }
  return { ok: true, tmp, folder, map: treeMapOf(folder) };
}

function patchesOf(labRoot, patches, name) {
  return patches.filter((p) => p.module === name).map((p) => {
    const f = path.join(labRoot, p.patch); if (!fs.existsSync(f)) throw new Error(`contrib patch missing: ${p.patch}`);
    const buf = fs.readFileSync(f); return { module: p.module, path: p.patch, file: f, sha256: sha256(buf), footprint: patchFileList(buf.toString('utf8')) };
  });
}

// Read-only. deep: without a record, build the expected files (needs the shared clone) instead of answering 'unverified'.
export function inspectContrib({ dir, labRoot, modules = [], patches = [], deep = false, sharedRoot }) {
  const out = { state: 'none', reasons: [], differing: [], outside: [], mods: {} };
  for (const p of patches) if (!modules.some((m) => m.name === p.module)) throw new Error(`contrib patch ${p.patch} is for module "${p.module}", which the variant does not list under contrib`);
  const rec = readRecord(dir);
  for (const m of modules) {
    const dest = path.join(dir, SUB, m.name), mine = patchesOf(labRoot, patches, m.name), r = rec.modules[m.name], foot = new Set(mine.flatMap((p) => p.footprint));
    const info = { name: m.name, state: 'none', reasons: [], differing: [], outside: [], patches: mine, dest };
    const mark = path.join(dir, `.lab-contrib-${m.name}`);
    if (r) {
      const bad = [];
      if (r.commit !== m.commit) bad.push(`module ${m.name} is at ${r.commit.slice(0, 12)} but the variant pins ${m.commit.slice(0, 12)}`);
      for (let i = 0; i < Math.max(r.patches.length, mine.length); i++) {
        const a = r.patches[i], b = mine[i];
        if (a && b && a.path === b.path && a.sha256 === b.sha256) continue;
        bad.push(!b ? `contrib patch ${a.path} is applied but the variant no longer lists it` : !a ? `contrib patch ${b.path} is not applied` : a.path !== b.path ? `contrib patch ${i + 1} of ${m.name} was applied as ${a.path}, the variant now lists ${b.path}` : `contrib patch ${b.path} changed since it was applied (applied ${a.sha256.slice(0, 8)}, file now ${b.sha256.slice(0, 8)})`);
      }
      if (!fs.existsSync(dest)) bad.push(`the folder ${SUB}/${m.name} is missing`);
      if (bad.length) { Object.assign(info, { state: 'mismatch', reasons: bad }); }
      else {
        const now = treeMapOf(dest), all = new Set([...Object.keys(now), ...Object.keys(r.files)]), diff = [...all].filter((f) => now[f] !== r.files[f]).sort();
        const inFoot = diff.filter((f) => (r.footprint || []).includes(f)), other = diff.filter((f) => !inFoot.includes(f));
        if (inFoot.length) Object.assign(info, { state: 'mismatch', reasons: [`files patched in ${m.name} were changed after the patches were applied`], differing: inFoot.map((f) => `${SUB}/${m.name}/${f}`) });
        else Object.assign(info, { state: 'verified', outside: other.map((f) => `${SUB}/${m.name}/${f}`) });
      }
    } else if (!fs.existsSync(dest)) Object.assign(info, { state: 'fresh', reasons: [`module ${m.name} is not extracted into ${SUB}/${m.name}`] });
    else {
      const why = fs.existsSync(mark) ? `module ${m.name} has only a marker file (no content record)` : `module ${m.name} exists with no record of it`;
      const markCommit = fs.existsSync(mark) ? fs.readFileSync(mark, 'utf8').trim() : '';
      if (markCommit && markCommit !== m.commit) Object.assign(info, { state: 'mismatch', reasons: [why, `the marker says ${markCommit.slice(0, 12)} but the variant pins ${m.commit.slice(0, 12)}`] });
      else if (!deep) Object.assign(info, { state: 'unverified', reasons: [why] });
      else {
        const err = ensureShared(m, sharedRoot); const exp = err ? { ok: false, error: err } : buildExpected(m, mine.map((p) => p.file), sharedRoot);
        if (!exp.ok) Object.assign(info, { state: 'mismatch', reasons: [why, exp.failed === undefined ? exp.error : `contrib patch ${mine[exp.failed].path} does not apply to ${m.commit.slice(0, 12)}: ${exp.error}`] });
        else {
          const now = treeMapOf(dest), all = new Set([...Object.keys(now), ...Object.keys(exp.map)]), diff = [...all].filter((f) => now[f] !== exp.map[f]).sort(); fs.rmSync(exp.tmp, { recursive: true, force: true });
          if (diff.length) Object.assign(info, { state: 'mismatch', reasons: [why, 'and its files do not equal the commit with the patches applied'], differing: diff.map((f) => `${SUB}/${m.name}/${f}`) });
          else Object.assign(info, { state: 'upgrade', now });
        }
      }
    }
    out.mods[m.name] = info;
    if (rank[info.state] > rank[out.state]) out.state = info.state;
    out.reasons.push(...info.reasons); out.differing.push(...info.differing); out.outside.push(...info.outside);
  }
  return out;
}

const recordOf = (m, info, map) => ({ commit: m.commit, url: m.url, patches: info.patches.map((p) => ({ module: p.module, path: p.path, sha256: p.sha256 })), footprint: [...new Set(info.patches.flatMap((p) => p.footprint))].sort(), files: map });

// What setup.mjs calls for each side. status: none, verified, applied, upgraded, refreshed (carry on), blocked (exit 4), failed (exit 1).
export function ensureContrib({ dir, labRoot, modules = [], patches = [], refresh = false, slug, env, side, sharedRoot, log = () => {} }) {
  const lines = [], say = (...s) => lines.push(...s);
  let info; try { info = inspectContrib({ dir, labRoot, modules, patches, deep: true, sharedRoot }); } catch (e) { return { status: 'failed', lines: [e.message] }; }
  if (!modules.length) return { status: 'none', lines, info };
  const rec = readRecord(dir), all = [], did = {};
  const place = (m, mi) => {   // build the expected module in a temporary folder, put it in place, record it
    const err = ensureShared(m, sharedRoot, log); if (err) return err;
    const exp = buildExpected(m, mi.patches.map((p) => p.file), sharedRoot);
    if (!exp.ok) return exp.failed === undefined ? exp.error : `contrib patch ${mi.patches[exp.failed].path} does not apply to ${m.commit.slice(0, 12)}: ${exp.error}`;
    try {
      let backup = '';
      if (fs.existsSync(mi.dest)) { backup = path.join(gitDir(dir), 'lab-patches', `backup-contrib-${m.name}-${new Date().toISOString().replace(/[:.]/g, '-')}`); fs.mkdirSync(path.dirname(backup), { recursive: true }); fs.cpSync(mi.dest, backup, { recursive: true }); fs.rmSync(mi.dest, { recursive: true, force: true }); did.backup = backup; }
      fs.mkdirSync(path.dirname(mi.dest), { recursive: true }); fs.cpSync(exp.folder, mi.dest, { recursive: true });
      rec.modules[m.name] = recordOf(m, mi, treeMapOf(mi.dest));
    } finally { fs.rmSync(exp.tmp, { recursive: true, force: true }); }
    return '';
  };
  const blocked = [];
  for (const m of modules) {
    const mi = info.mods[m.name], tag = `${m.name} @ ${m.commit.slice(0, 12)}`; all.push(...mi.patches);
    if (mi.state === 'verified') { say(`contrib ${tag} verified by content in ${env}${mi.patches.length ? `: ${mi.patches.map((p) => `${path.basename(p.path)} ${p.sha256.slice(0, 8)}`).join(', ')}` : ''}`); if (mi.outside.length) say(`WARNING: ${side === 'before' ? `${env} is a baseline and has files in ${SUB}/${m.name} its variant does not declare` : `files in ${SUB}/${m.name} changed outside the patches in ${env}`}: ${shown(mi.outside.map((f) => f.slice(`${SUB}/${m.name}/`.length)))}. Left as they are${side === 'before' ? '; setup carries on, but a run refuses until they are restored (setup.mjs --refresh-patches) or removed' : '; a run records them'}.`); continue; }
    if (mi.state === 'upgrade') { rec.modules[m.name] = recordOf(m, mi, mi.now); say(`contrib ${tag} verified by content in ${env} (it had no content record; recorded now)`); did.upgraded = true; continue; }
    if (mi.state === 'fresh' || (mi.state === 'mismatch' && refresh)) {
      const err = place(m, mi);
      if (err) return { status: 'failed', lines: [`contrib ${tag} in ${env}: ${err}. Nothing was changed.`], info };
      say(mi.state === 'fresh' ? `extracted contrib ${tag} into ${env}${mi.patches.length ? ` and applied ${mi.patches.map((p) => `${path.basename(p.path)} ${p.sha256.slice(0, 8)}`).join(', ')}` : ''}` : `refreshed contrib ${tag} in ${env} (old folder saved in ${did.backup}), extracted again and patched`);
      did[mi.state === 'fresh' ? 'applied' : 'refreshed'] = true; continue;
    }
    blocked.push(mi);
  }
  if (blocked.length) {
    say(`BLOCKED: ${env} does not match its contrib modules and patches, so anything built on it would not be evidence of them.`);
    for (const mi of blocked) { say(...mi.reasons.map((r) => `  - ${r}`)); if (mi.differing.length) say(`  - files that differ: ${shown(mi.differing)}`); }
    say('  Nothing was changed. To extract the modules again at their pinned commits and apply the current patches:', `    node tools/compare/setup.mjs ${slug} --refresh-patches`, '  (the old module folder is moved to a backup in the checkout\'s git directory first. Or delete the environment and rebuild.)');
    return { status: 'blocked', lines, info };
  }
  if (did.applied || did.refreshed || did.upgraded) writeRecord(dir, rec, modules, all);
  return { status: did.refreshed ? 'refreshed' : did.applied ? 'applied' : did.upgraded ? 'upgraded' : 'verified', lines, info };
}

// The quick state of one side's contrib modules, for results.json and the run: no shared clone, no network.
export function contribState(args) {
  try { const i = inspectContrib({ ...args, deep: false }); return { state: i.state, reasons: i.reasons, differing: i.differing, outside: i.outside, modules: Object.fromEntries(Object.entries(i.mods).map(([k, x]) => [k, { state: x.state, patches: x.patches.map((p) => ({ path: p.path, sha256: p.sha256 })) }])) }; }
  catch (e) { return { state: 'unknown', reasons: [String(e.message).split('\n')[0]], differing: [], outside: [], modules: {} }; }
}

// One side's patches as a run finds them: core patches (patchState) and contrib modules and patches together, quick, no network.
// state is the worst of the two (mismatch, fresh, unverified, verified, none); outside lists tracked core files and module files the
// variant does not declare (on the Before side that is a dirty baseline, see runBlockReason).
export function sideState(dir, labRoot, patchPaths, { modules = [], patches = [] } = {}) {
  const core = patchState(dir, labRoot, patchPaths);
  if (!modules.length) return core;
  const c = contribState({ dir, labRoot, modules, patches });
  const order = ['mismatch', 'fresh', 'unverified', 'verified', 'none'], pick = (a, b) => (core.state === 'unknown' ? 'unknown' : order.find((x) => a === x || b === x) || a);
  return { ...core, state: pick(core.state, c.state), reasons: [...core.reasons, ...c.reasons], outside: [...core.outside, ...c.outside], contrib: c.modules };
}
