// Which patches are in an environment's checkout, decided by content (AI-usage Phase 1, slice A).
// setup.mjs used to keep a list of patch FILE NAMES: a patch whose bytes changed under the same name stayed "applied", and a modified
// tree without that list was "assumed" patched. Here the record is a hash of each patch plus the content of every file the patches
// touch. A tree is called verified only when that record matches, or, for a tree with no record, when the patches applied to a
// throwaway index give the same files. Nothing is reset unless refresh is asked for, and a refresh keeps a diff of what it discards.
// The record lives in the checkout's own git directory (<gitdir>/lab-patches/state.json): not in the web root, not in the tree.
// The old name list (<env>/.lab-patches-applied) is still written, so an older setup.mjs keeps working on the same environment.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';

export const MARKER = '.lab-patches-applied';
const ABSENT = 'ABSENT';
export const sha256 = (b) => crypto.createHash('sha256').update(b).digest('hex');
const git = (dir, args, o = {}) => spawnSync('git', ['--literal-pathspecs', ...args], { cwd: dir, encoding: o.buffer ? 'buffer' : 'utf8', maxBuffer: 1 << 28, env: o.env || process.env, input: o.input });
const firstLine = (r) => `${r.stderr || r.stdout || ''}`.trim().split('\n')[0].slice(0, 220);
const gitDir = (dir) => git(dir, ['rev-parse', '--absolute-git-dir']).stdout.trim();
const stateFile = (dir) => path.join(gitDir(dir), 'lab-patches', 'state.json');
const shown = (list, n = 6) => `${list.slice(0, n).join(', ')}${list.length > n ? `, and ${list.length - n} more` : ''}`;

// The files a patch changes: both names of a rename, the old name of a deleted file.
export function patchFileList(text) {
  const names = new Set();
  for (const m of String(text).matchAll(/^diff --git a\/(.+?) b\/(.+)$/gm)) { names.add(m[1].trim()); names.add(m[2].trim()); }
  for (const m of String(text).matchAll(/^(?:---|\+\+\+) [ab]\/(.+?)(?:\t.*)?$/gm)) names.add(m[1].trim());
  return [...names].sort();
}

// What the files are now: content hash and the executable bit, or ABSENT.
export function treeMap(dir, files) {
  const m = {};
  for (const f of files) {
    let st; try { st = fs.lstatSync(path.join(dir, f)); } catch { m[f] = ABSENT; continue; }
    m[f] = st.isFile() ? `${sha256(fs.readFileSync(path.join(dir, f)))}${st.mode & 0o100 ? ':x' : ''}` : `not-a-file:${st.isSymbolicLink() ? 'link' : 'dir'}`;
  }
  return m;
}
export const mapHash = (m) => sha256(Object.keys(m).sort().map((k) => `${k}\t${m[k]}`).join('\n'));

// What the files would be after the patches, worked out in a throwaway index (the checkout and its own index are not touched).
export function expectedMap(dir, bufs) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'lab-patch-index-')), env = { ...process.env, GIT_INDEX_FILE: path.join(tmp, 'index') };
  try {
    const rt = git(dir, ['read-tree', 'HEAD'], { env }); if (rt.status !== 0) return { ok: false, error: `could not read HEAD: ${firstLine(rt)}` };
    for (const [i, b] of bufs.entries()) { const r = git(dir, ['apply', '--cached', '-'], { env, input: b }); if (r.status !== 0) return { ok: false, failed: i, error: firstLine(r) }; }
    const files = [...new Set(bufs.flatMap((b) => patchFileList(b.toString('utf8'))))].sort(), map = {};
    for (const f of files) {
      const l = git(dir, ['ls-files', '-s', '--', f], { env }).stdout.trim();
      if (!l) { map[f] = ABSENT; continue; }
      const [mode, blob] = l.split(/\s+/);
      map[f] = `${sha256(git(dir, ['cat-file', 'blob', blob], { env, buffer: true }).stdout)}${mode === '100755' ? ':x' : ''}`;
    }
    return { ok: true, map };
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
}

export function readState(dir) { try { return JSON.parse(fs.readFileSync(stateFile(dir), 'utf8')); } catch { return null; } }
function writeState(dir, wanted, map) {
  const f = stateFile(dir); fs.mkdirSync(path.dirname(f), { recursive: true });
  const rec = { version: 1, recordedAt: new Date().toISOString(), base: git(dir, ['rev-parse', 'HEAD']).stdout.trim(), patches: wanted.map((w) => ({ path: w.path, sha256: w.sha256 })), files: map, footprint: mapHash(map) };
  fs.writeFileSync(f, `${JSON.stringify(rec, null, 1)}\n`);
  fs.writeFileSync(path.join(dir, MARKER), wanted.map((w) => `${w.path}\n`).join(''));
  return rec;
}

// What a checkout looks like against the patches a variant asks for. Read-only. state:
//   none      no patches wanted and none recorded
//   fresh     patches wanted, nothing recorded, tracked files clean: they still have to be applied
//   verified  recorded hashes equal the patch files now, and the files still hold what was recorded
//   upgrade   (deep) nothing recorded or only a name list, and the files equal what the patches produce: record it
//   unverified (not deep) as upgrade, but not checked
//   mismatch  anything else; reasons and differing say what
export function inspect(dir, labRoot, patchPaths, { deep = false } = {}) {
  const wanted = patchPaths.map((p) => {
    const f = path.join(labRoot, p); if (!fs.existsSync(f)) throw new Error(`patch missing: ${p}`);
    const buf = fs.readFileSync(f); return { path: p, sha256: sha256(buf), buf, files: patchFileList(buf.toString('utf8')) };
  });
  const wantedFiles = [...new Set(wanted.flatMap((w) => w.files))].sort();
  const rec = readState(dir);
  const dirty = git(dir, ['diff', 'HEAD', '--name-only', '-z']).stdout.split('\0').filter(Boolean);
  const known = new Set([...wantedFiles, ...(rec ? Object.keys(rec.files) : [])]);
  const out = { wanted, wantedFiles, rec, outside: dirty.filter((f) => !known.has(f)), reasons: [], differing: [], state: '' };
  if (rec) {
    const bad = []; const n = Math.max(rec.patches.length, wanted.length);
    for (let i = 0; i < n; i++) {
      const r = rec.patches[i], w = wanted[i];
      if (r && w && r.path === w.path && r.sha256 === w.sha256) continue;
      bad.push(!w ? `patch ${i + 1} (${r.path}) is applied but the variant no longer lists it` : !r ? `patch ${i + 1} (${w.path}) is not applied` : r.path !== w.path ? `patch ${i + 1} was applied as ${r.path}, the variant now lists ${w.path}` : `patch ${i + 1} (${w.path}) changed since it was applied (applied ${r.sha256.slice(0, 8)}, file now ${w.sha256.slice(0, 8)})`);
    }
    if (bad.length) return { ...out, state: 'mismatch', reasons: bad };
    const now = treeMap(dir, Object.keys(rec.files)), differing = Object.keys(rec.files).filter((f) => now[f] !== rec.files[f]);
    return differing.length ? { ...out, state: 'mismatch', differing, reasons: ['files the patches touch were changed after the patches were applied'] } : { ...out, state: 'verified' };
  }
  if (!wanted.length) return { ...out, state: 'none' };
  if (!fs.existsSync(path.join(dir, MARKER)) && !dirty.length) return { ...out, state: 'fresh' };
  const why = fs.existsSync(path.join(dir, MARKER)) ? 'the environment has only a list of patch names (no content record)' : 'the tree has changes and no record of any patch';
  if (!deep) return { ...out, state: 'unverified', reasons: [why] };
  const exp = expectedMap(dir, wanted.map((w) => w.buf));
  if (!exp.ok) return { ...out, state: 'mismatch', reasons: [why, exp.failed === undefined ? exp.error : `patch ${exp.failed + 1} (${wanted[exp.failed].path}) does not apply to the base commit: ${exp.error}`] };
  const now = treeMap(dir, wantedFiles), differing = wantedFiles.filter((f) => now[f] !== exp.map[f]);
  return differing.length ? { ...out, state: 'mismatch', differing, reasons: [why, 'and the files do not equal what the patches produce'] } : { ...out, state: 'upgrade', now };
}

const applyAll = (dir, labRoot, wanted) => {
  for (const w of wanted) { const r = spawnSync('git', ['apply', path.join(labRoot, w.path)], { cwd: dir, encoding: 'utf8' }); if (r.status !== 0) return `git apply ${w.path} failed: ${firstLine(r)}`; }
  return '';
};
const record = (dir, info) => writeState(dir, info.wanted, treeMap(dir, info.wantedFiles));

// Put the tree in the state the patches describe: the files the patches touch (and those the recorded patches touched) go back to the
// base commit, then the current patches are applied. Refuses before changing anything if the patches do not apply to the base.
function refreshTree(dir, labRoot, info) {
  const exp = expectedMap(dir, info.wanted.map((w) => w.buf));
  if (!exp.ok) return { error: exp.failed === undefined ? exp.error : `patch ${exp.failed + 1} (${info.wanted[exp.failed].path}) does not apply to the base commit (${exp.error}). Reroll it. Nothing was changed.` };
  const all = [...new Set([...info.wantedFiles, ...(info.rec ? Object.keys(info.rec.files) : [])])].sort();
  if (all.some((f) => path.isAbsolute(f) || f.split('/').includes('..'))) return { error: 'a patch names a path outside the checkout. Nothing was changed.' };
  const tracked = git(dir, ['ls-tree', '-r', '--name-only', '-z', 'HEAD', '--', ...all]).stdout.split('\0').filter(Boolean);
  let backup = '';
  if (tracked.length) {
    const d = git(dir, ['diff', 'HEAD', '--binary', '--', ...tracked], { buffer: true }).stdout;
    if (d.length) { backup = path.join(gitDir(dir), 'lab-patches', `backup-${new Date().toISOString().replace(/[:.]/g, '-')}.diff`); fs.mkdirSync(path.dirname(backup), { recursive: true }); fs.writeFileSync(backup, d); }
    const r = git(dir, ['checkout', 'HEAD', '--', ...tracked]); if (r.status !== 0) return { error: `could not restore the files: ${firstLine(r)}` };
  }
  for (const f of all.filter((x) => !tracked.includes(x))) fs.rmSync(path.join(dir, f), { force: true });   // files only a patch had added
  const err = applyAll(dir, labRoot, info.wanted); if (err) return { error: `${err}. The patched files are back at the base commit; no patch is applied.`, backup };
  record(dir, info);
  return { restored: tracked.length, removed: all.length - tracked.length, backup };
}

// What setup.mjs calls for each side. Returns { status, lines }: status is none, verified, applied, upgraded, refreshed (carry on),
// blocked (the checkout does not match its patches: stop, exit 4) or failed (a patch does not apply: stop, exit 1).
export function ensurePatches({ dir, labRoot, patchPaths, refresh = false, slug, env, side }) {
  const lines = [], say = (...s) => lines.push(...s);
  const info = inspect(dir, labRoot, patchPaths, { deep: true });
  const n = info.wanted.length, warnOutside = () => {
    if (!info.outside.length) return;
    say(side === 'before'
      ? `WARNING: ${env} is a baseline and has tracked changes its variant does not declare: ${shown(info.outside)}. Left as they are. Setup carries on, but a run refuses until they are reverted (git -C envs/${env} checkout -- <file>) or declared as before.patches.`
      : `WARNING: tracked files changed outside the patches in ${env}: ${shown(info.outside)}. Left as they are; a run records them.`);
  };
  const done = (status, msg) => { say(msg); warnOutside(); return { status, lines, info }; };
  if (info.state === 'none') { warnOutside(); return { status: 'none', lines, info }; }
  if (info.state === 'verified') return done('verified', `patches verified by content in ${env}: ${info.wanted.map((w) => `${path.basename(w.path)} ${w.sha256.slice(0, 8)}`).join(', ')}`);
  if (info.state === 'fresh') {
    const exp = expectedMap(dir, info.wanted.map((w) => w.buf));
    if (!exp.ok) return { status: 'failed', lines: [`patch ${exp.failed === undefined ? '' : `${exp.failed + 1} (${info.wanted[exp.failed].path}) `}does not apply to the base commit: ${exp.error}. Nothing was applied.`], info };
    const err = applyAll(dir, labRoot, info.wanted); if (err) return { status: 'failed', lines: [err], info };
    record(dir, info);
    return done('applied', `applied and recorded ${n} patch(es) in ${env}: ${info.wanted.map((w) => `${path.basename(w.path)} ${w.sha256.slice(0, 8)}`).join(', ')}`);
  }
  if (info.state === 'upgrade') { record(dir, info); return done('upgraded', `patches verified by content in ${env} (the environment had no content record; recorded now)`); }
  // mismatch (or, with deep, nothing else is possible here)
  if (refresh) {
    const r = refreshTree(dir, labRoot, info);
    if (r.error) return { status: 'failed', lines: [`refresh stopped in ${env}: ${r.error}${r.backup ? ` Your edits to those files are saved in ${r.backup}.` : ''}`], info };
    return done('refreshed', `refreshed ${env}: ${r.restored} file(s) restored to the base commit, ${r.removed} added file(s) removed, ${n} current patch(es) applied and recorded${r.backup ? `; local edits to those files were saved in ${r.backup}` : ''}`);
  }
  say(`BLOCKED: ${env} does not match its patches, so anything built on it would not be evidence of them.`, ...info.reasons.map((r) => `  - ${r}`));
  if (info.differing.length) say(`  - files that differ from what the patches produce: ${shown(info.differing)}`);
  say('  Nothing was changed. To restore the files the patches touch to the base commit and apply the current patch files:', `    node tools/compare/setup.mjs ${slug} --refresh-patches`, '  (local edits in those files are saved as a diff first; other files are left alone. Or delete the environment and rebuild.)');
  warnOutside();
  return { status: 'blocked', lines, info };
}

// For a run's results.json: one side's patches as the run found them, without the slow check. state is none, verified, unverified,
// fresh (not applied), mismatch or unknown (no checkout).
export function patchState(dir, labRoot, patchPaths) {
  try {
    const i = inspect(dir, labRoot, patchPaths);
    return { state: i.state, recorded: i.rec ? { base: i.rec.base, patches: i.rec.patches, footprint: i.rec.footprint } : null, current: i.wanted.map((w) => ({ path: w.path, sha256: w.sha256 })), reasons: i.reasons, outside: i.outside };
  } catch (e) { return { state: 'unknown', recorded: null, current: [], reasons: [String(e.message).split('\n')[0]], outside: [] }; }
}

// Why a run must not start, or '' if it may. A side whose files do not match its patches (or whose patches were never applied) would
// produce evidence about something else; so would a Before checkout with tracked changes its variant does not declare (AGENTS.md rule 1:
// the baseline is never edited). A side with only a name list (no content record) may run, and says so in its results. Extra edits on the
// After side do not stop a run; they are recorded. envs = { before, after } environment names, for the message.
export function runBlockReason(states, slug, envs = {}) {
  for (const side of ['before', 'after']) {
    const st = states[side]; if (!st || !['mismatch', 'fresh'].includes(st.state)) continue;
    const what = st.state === 'fresh' ? 'the patches are not applied' : st.reasons.join('; ');
    return `BLOCKED: the ${side} environment does not match its patches (${what}). Nothing was run. Fix it with: node tools/compare/setup.mjs ${slug} --refresh-patches`;
  }
  const b = states.before;
  if (b && b.outside && b.outside.length) {
    const env = envs.before || 'the Before environment', files = shown(b.outside, 8);
    return `BLOCKED: the Before environment (${env}) has tracked changes its variant does not declare: ${files}. A Before that is not the pristine commit is not evidence of the change. Nothing was run. Revert them: git -C envs/${envs.before || '<before env>'} checkout -- ${b.outside.slice(0, 8).join(' ')}${b.outside.length > 8 ? ' ...' : ''}   (or, if the change is meant, declare it as before.patches in the variant).`;
  }
  return '';
}
