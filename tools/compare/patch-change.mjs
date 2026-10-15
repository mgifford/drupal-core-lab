// A patch file that was changed must say so (AI-usage, auto-fix transparency).
// reports/issues/<nid>/branches/*.patch are the patches under test, as received from a merge request or written in the lab. Evidence is about
// those bytes (patch identity, slice A). Anyone, a person or an auto-fix, who changes one afterwards leaves a record in
// reports/issues/<nid>/PATCH-CHANGES.md (date, the hash it was and is now, lines changed, who, why) and the version it replaced is kept in
// reports/issues/<nid>/original-patches/. `check` finds changes against a base branch that have no record. Nothing here edits a patch.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';

const GLOB = ':(glob)reports/issues/*/branches/*.patch';
const sha8 = (b) => crypto.createHash('sha256').update(b).digest('hex').slice(0, 8);
const git = (cwd, args, o = {}) => spawnSync('git', args, { cwd, encoding: o.buffer ? 'buffer' : 'utf8', maxBuffer: 1 << 28 });
const HEADER = '| Date | Patch | Was | Now | Lines | By | Why | The version it replaced |\n|---|---|---|---|---|---|---|---|\n';
const nidOf = (p) => (p.match(/^reports\/issues\/(\d+)\/branches\/[^/]+\.patch$/) || [])[1];

export const recordFile = (nid) => `reports/issues/${nid}/PATCH-CHANGES.md`;

// The base to compare with: the given ref, else origin/main, else main. null when none resolves (a shallow CI checkout).
export function resolveBase(labRoot, ref) {
  for (const c of ref ? [ref] : ['origin/main', 'main']) if (git(labRoot, ['rev-parse', '--verify', '--quiet', `${c}^{commit}`]).status === 0) return c;
  return null;
}

// Patch files modified, deleted or renamed since base (added ones are new, not changed). [{ status, path, oldPath, nid }]
export function changedPatches(labRoot, base) {
  const out = git(labRoot, ['diff', '--name-status', '-M', '--diff-filter=MDR', '-z', base, 'HEAD', '--', GLOB]).stdout.split('\0').filter(Boolean);
  const list = [];
  for (let i = 0; i < out.length;) {
    const s = out[i][0];
    if (s === 'R') { list.push({ status: 'R', oldPath: out[i + 1], path: out[i + 2] }); i += 3; } else { list.push({ status: s, oldPath: out[i + 1], path: out[i + 1] }); i += 2; }
  }
  // the working tree counts too: a change not yet committed is still a change
  const wt = git(labRoot, ['diff', '--name-status', '--diff-filter=MD', '-z', 'HEAD', '--', GLOB]).stdout.split('\0').filter(Boolean);
  for (let i = 0; i + 1 < wt.length; i += 2) if (!list.some((x) => x.path === wt[i + 1])) list.push({ status: wt[i][0], oldPath: wt[i + 1], path: wt[i + 1] });
  return list.map((x) => ({ ...x, nid: nidOf(x.path) })).filter((x) => x.nid);
}

export function readRecord(labRoot, nid) {
  const f = path.join(labRoot, recordFile(nid)); if (!fs.existsSync(f)) return [];
  return fs.readFileSync(f, 'utf8').split('\n').filter((l) => l.startsWith('| ') && !/^\| (Date|-)/.test(l)).map((l) => {
    const c = l.split(/\s\|\s/).map((x) => x.replace(/^\|\s*|\s*\|$/g, '').replace(/`/g, '').trim());
    return { date: c[0], patch: c[1], was: c[2], now: c[3], lines: c[4], by: c[5], why: c[6] };
  });
}

// What is missing a record: for each changed patch, an entry for that patch whose "Now" is the hash it has today (or "deleted").
export function unrecorded(labRoot, base) {
  return changedPatches(labRoot, base).filter((c) => {
    const file = path.join(labRoot, c.path), now = fs.existsSync(file) ? sha8(fs.readFileSync(file)) : 'deleted', name = `branches/${path.basename(c.path)}`;
    return !readRecord(labRoot, c.nid).some((e) => e.patch === name && e.now === now);
  });
}

// Write the record for one changed patch: keep the version it replaced, add a row. Idempotent.
export function recordChange(labRoot, patchPath, { base, by, reason, date = new Date().toISOString().slice(0, 10) }) {
  const nid = nidOf(patchPath); if (!nid) return { status: 'error', error: `${patchPath} is not reports/issues/<nid>/branches/<name>.patch` };
  if (!by || !reason) return { status: 'error', error: 'say who changed it (--by) and why (--reason)' };
  const old = git(labRoot, ['show', `${base}:${patchPath}`], { buffer: true });
  if (old.status !== 0) return { status: 'error', error: `${patchPath} does not exist at ${base}, so it is a new patch, not a changed one` };
  const file = path.join(labRoot, patchPath), exists = fs.existsSync(file), now = exists ? sha8(fs.readFileSync(file)) : 'deleted', was = sha8(old.stdout);
  if (was === now) return { status: 'unchanged', was, now };
  const name = `branches/${path.basename(patchPath)}`;
  if (readRecord(labRoot, nid).some((e) => e.patch === name && e.was === was && e.now === now)) return { status: 'already recorded', was, now };
  const keepRel = `reports/issues/${nid}/original-patches/${path.basename(patchPath, '.patch')}.${was}.patch`, keep = path.join(labRoot, keepRel);
  fs.mkdirSync(path.dirname(keep), { recursive: true }); if (!fs.existsSync(keep)) fs.writeFileSync(keep, old.stdout);
  const ns = exists ? git(labRoot, ['diff', '--no-index', '--numstat', keep, file]).stdout.trim().split(/\s+/) : [];
  const lines = exists ? `+${ns[0] || 0} -${ns[1] || 0}` : 'deleted';
  const clean = (s) => String(s).replace(/\s*\n\s*/g, ' ').replace(/\|/g, '/').trim();
  const row = `| ${date} | \`${name}\` | \`${was}\` | \`${now}\` | ${lines} | ${clean(by)} | ${clean(reason)} | [${path.basename(keepRel)}](original-patches/${path.basename(keepRel)}) |\n`;
  const rf = path.join(labRoot, recordFile(nid));
  if (fs.existsSync(rf)) fs.appendFileSync(rf, (fs.readFileSync(rf, 'utf8').endsWith('\n') ? '' : '\n') + row);
  else fs.writeFileSync(rf, `# Changes to the patches of #${nid}\n\nA patch under \`branches/\` is the change that was tested. When one is changed afterwards, by a person or by an auto-fix, this file says when, by whom and why, with the\nhash it was and the hash it is now, and the version it replaced is kept in \`original-patches/\`. Generated by \`node scripts/patch-change.mjs record\`; do not edit by hand.\n\n${HEADER}${row}`);
  return { status: 'recorded', was, now, kept: keepRel, lines, row: recordFile(nid) };
}
