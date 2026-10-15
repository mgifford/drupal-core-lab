// Turn edits made in an After environment into a patch file (AI-usage Phase 5, the no-merge-request case).
// Everything is worked out in throwaway indexes: the checkout, its own index and its branch are not touched.
//   expected  the base commit with the variant's declared patches applied (what the environment should hold without any edit)
//   actual    the same index after adding every change in the working tree: modified, deleted and new files that git does not ignore
//   patch     git diff between the two, the file that scripts/capture-patch.mjs writes
// A patch is only returned when it round-trips: expected plus the patch gives exactly the tree of the working files.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { MARKER } from './patch-state.mjs';

const git = (dir, args, o = {}) => spawnSync('git', args, { cwd: dir, encoding: o.buffer ? 'buffer' : 'utf8', maxBuffer: 1 << 28, env: o.env || process.env, input: o.input });
const firstLine = (r) => `${r.stderr || r.stdout || ''}`.trim().split('\n')[0].slice(0, 220);

// Files the lab itself puts in a checkout: never part of a change under test. The contrib modules it extracts into modules/contrib are its
// own too (they have their own patches, `contribPatches`; writing a patch for one is not what this does).
export const labFiles = (recipe, contribNames = []) => [MARKER, '.lab-contrib-patches-applied', ...(recipe ? [`recipes/${recipe}`] : []), ...contribNames.flatMap((n) => [`.lab-contrib-${n}`, `modules/contrib/${n}`])];

// patchBufs: the declared patches, in order (Buffers). exclude: extra paths to leave out. Returns
//   { ok: true, patch: Buffer, files: [{ status, path }], expectedTree, actualTree }   (patch is empty when there is nothing to capture)
//   { ok: false, error }
export function captureEdits(dir, patchBufs, { exclude = [] } = {}) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'lab-capture-')), a = { ...process.env, GIT_INDEX_FILE: path.join(tmp, 'expected') }, b = { ...process.env, GIT_INDEX_FILE: path.join(tmp, 'actual') };
  try {
    let r = git(dir, ['read-tree', 'HEAD'], { env: a }); if (r.status !== 0) return { ok: false, error: `could not read HEAD: ${firstLine(r)}` };
    for (const [i, buf] of patchBufs.entries()) { r = git(dir, ['apply', '--cached', '-'], { env: a, input: buf }); if (r.status !== 0) return { ok: false, error: `declared patch ${i + 1} does not apply to the base commit: ${firstLine(r)}` }; }
    const expectedTree = git(dir, ['write-tree'], { env: a }).stdout.trim();
    fs.copyFileSync(a.GIT_INDEX_FILE, b.GIT_INDEX_FILE);
    r = git(dir, ['add', '-A', '--', '.'], { env: b }); if (r.status !== 0) return { ok: false, error: `could not read the working files: ${firstLine(r)}` };
    for (const x of exclude) git(dir, ['rm', '--cached', '-r', '-q', '--ignore-unmatch', '--', x], { env: b });
    const actualTree = git(dir, ['write-tree'], { env: b }).stdout.trim();
    const names = git(dir, ['diff-tree', '-r', '--name-status', '-z', expectedTree, actualTree]).stdout.split('\0').filter(Boolean);
    const files = []; for (let i = 0; i + 1 < names.length; i += 2) files.push({ status: names[i], path: names[i + 1] });
    if (expectedTree === actualTree) return { ok: true, patch: Buffer.alloc(0), files, expectedTree, actualTree };
    const patch = git(dir, ['diff', '--binary', '--full-index', expectedTree, actualTree], { buffer: true }).stdout;
    // the round trip: the declared patches plus this one must give exactly the working files
    const c = { ...process.env, GIT_INDEX_FILE: path.join(tmp, 'check') }; fs.copyFileSync(a.GIT_INDEX_FILE, c.GIT_INDEX_FILE);
    r = git(dir, ['apply', '--cached', '-'], { env: c, input: patch }); if (r.status !== 0) return { ok: false, error: `the captured patch does not apply on top of the declared patches: ${firstLine(r)}` };
    const again = git(dir, ['write-tree'], { env: c }).stdout.trim();
    if (again !== actualTree) return { ok: false, error: `the captured patch does not reproduce the working files (tree ${again.slice(0, 12)}, expected ${actualTree.slice(0, 12)})` };
    return { ok: true, patch, files, expectedTree, actualTree };
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
}
