// Tests for tools/compare/branch-patch.mjs (AI-usage Phase 5): updating an imported issue's branch patch without losing anything else.
// Pure functions, no git, no network. The command itself was run live against drupal.org (see reports/ai-usage/phase-5).
import test from 'node:test';
import assert from 'node:assert/strict';
import { upsertBranchRow, comparePatch, BRANCHES_HEADER } from '../../tools/compare/branch-patch.mjs';

const row = (b, tip) => `| [\`branches/${b}.patch\`](branches/${b}.patch) | https://example.test/fork.git \`${b}\` | ${tip} | f5e265802542 | 2026-08-20 base | 2 |`;
const intro = '# Branch patches for #1\n\nExtracted today.\n\n';

test('a first row creates the file text with the header and the intro', () => {
  const md = upsertBranchRow('', 'a', row('a', '11111111'), intro);
  assert.equal(md, `${intro}${BRANCHES_HEADER}${row('a', '11111111')}\n`);
});

test('a second branch adds a row and keeps the first, and a note a person wrote', () => {
  const first = `${intro}A note written by hand: the second row is a tests-only patch.\n\n${BRANCHES_HEADER}${row('a', '11111111')}\n`;
  const md = upsertBranchRow(first, 'b', row('b', '22222222'), intro);
  assert.ok(md.includes(row('a', '11111111'))); assert.ok(md.includes(row('b', '22222222'))); assert.ok(md.includes('A note written by hand'));
  assert.ok(md.indexOf(row('a', '11111111')) < md.indexOf(row('b', '22222222')), 'the new row goes under the last row');
});

test('refreshing a branch replaces only its own row', () => {
  const start = `${intro}${BRANCHES_HEADER}${row('a', '11111111')}\n${row('b', '22222222')}\n| hand-written row | no link to a patch | - | - | - | 1 |\n`;
  const md = upsertBranchRow(start, 'a', row('a', '33333333'), intro);
  assert.ok(md.includes(row('a', '33333333'))); assert.ok(!md.includes('11111111')); assert.ok(md.includes(row('b', '22222222'))); assert.ok(md.includes('hand-written row'));
  assert.equal(upsertBranchRow(md, 'a', row('a', '33333333'), intro), md, 'doing it twice changes nothing');
});

test('a branch whose name is the start of another is not mistaken for it', () => {
  const start = `${intro}${BRANCHES_HEADER}${row('fix', '11111111')}\n`;
  const md = upsertBranchRow(start, 'fix-2', row('fix-2', '22222222'), intro);
  assert.ok(md.includes(row('fix', '11111111')) && md.includes(row('fix-2', '22222222')));
});

const patch = (idx, word) => `diff --git a/core/a.txt b/core/a.txt\nindex ${idx}\n--- a/core/a.txt\n+++ b/core/a.txt\n@@ -1 +1 @@\n-one\n+${word}\n`;
test('comparePatch: the same hunks with differently abbreviated index lines are unchanged; a real change is changed', () => {
  const eight = patch('aae40978..5f475d9a 100644', 'two'), nine = patch('aae40978c..5f475d9ac 100644', 'two');
  let c = comparePatch(eight, nine); assert.equal(c.changed, false); assert.equal(c.bytesDiffer, true); assert.notEqual(c.oldSha, c.newSha);
  c = comparePatch(eight, eight); assert.equal(c.changed, false); assert.equal(c.bytesDiffer, false);
  c = comparePatch(eight, patch('aae40978..5f475d9a 100644', 'three')); assert.equal(c.changed, true);
  c = comparePatch(eight, `${eight}\n`); assert.equal(c.changed, true, 'a stray line is a change');
});

test('comparePatch names files added to or dropped from the patch', () => {
  const a = patch('1..2 100644', 'x'), b = `${a}diff --git a/core/b.txt b/core/b.txt\nnew file mode 100644\n--- /dev/null\n+++ b/core/b.txt\n@@ -0,0 +1 @@\n+n\n`;
  assert.deepEqual(comparePatch(a, b).added, ['core/b.txt']); assert.deepEqual(comparePatch(b, a).removed, ['core/b.txt']);
});
