// Keeping an imported issue's branch patches up to date (AI-usage Phase 5): the two pure parts of `scripts/new-issue.mjs --refresh`.
import crypto from 'node:crypto';
import { patchFileList } from './patch-state.mjs';

export const BRANCHES_HEADER = '| Patch | Source | Tip | Base | Base date and subject | Files |\n|---|---|---|---|---|---|\n';
const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');

// Put one patch's row into BRANCHES.md: replace its row if it has one, else add it under the last row of the table. Every other line
// (the other patches' rows, notes a person wrote above the table) is kept. md may be empty; intro is used then.
export function upsertBranchRow(md, branch, row, intro = '') {
  if (!md || !md.trim()) return `${intro}${BRANCHES_HEADER}${row}\n`;
  const lines = md.replace(/\n+$/, '').split('\n'), key = `(branches/${branch}.patch)`;
  const i = lines.findIndex((l) => l.startsWith('|') && l.includes(key));
  if (i >= 0) lines[i] = row;
  else { const last = lines.reduce((n, l, j) => (l.startsWith('|') ? j : n), -1); if (last < 0) lines.push('', ...BRANCHES_HEADER.trimEnd().split('\n'), row); else lines.splice(last + 1, 0, row); }
  return `${lines.join('\n')}\n`;
}

// What differs between the stored patch and the one extracted now (Buffers or strings). The `index <old>..<new>` lines carry git's
// abbreviated object names, whose length git picks from how many objects the clone happens to hold (8 in one clone, 9 in another): the
// same change then differs byte for byte. Those lines are left out of the comparison, so only a change in the hunks counts, and
// `bytesDiffer` still says when the files are not identical.
const content = (buf) => buf.toString('utf8').split('\n').filter((l) => !/^index [0-9a-f]+\.\.[0-9a-f]+( \d+)?$/.test(l)).join('\n');
export function comparePatch(oldPatch, newPatch) {
  const a = Buffer.from(oldPatch), b = Buffer.from(newPatch), fa = patchFileList(a.toString('utf8')), fb = patchFileList(b.toString('utf8'));
  return { changed: content(a) !== content(b), bytesDiffer: !a.equals(b), oldSha: sha(a), newSha: sha(b), added: fb.filter((f) => !fa.includes(f)), removed: fa.filter((f) => !fb.includes(f)) };
}
