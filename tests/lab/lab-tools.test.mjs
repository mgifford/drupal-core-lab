// Tests for the lab tools added 2026-10-14: coverage matrices, the run results shape, the comment-draft checker, and marking
// runs superseded. No network, no DDEV. Run: node --test tests/lab/*.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { labRoot } from '../../tools/compare/lib.mjs';
import { NEW_ISSUE_MATRIX, matrixProblems } from '../../tools/compare/coverage-matrix.mjs';
import { runProblems } from '../../tools/playwright/lib/run-schema.mjs';

const node = (script, args) => spawnSync('node', [path.join(labRoot, script), ...args], { cwd: labRoot, encoding: 'utf8' });

test('the matrix written into new issues is valid', () => {
  assert.deepEqual(matrixProblems({ matrix: NEW_ISSUE_MATRIX }), []);
});

test('a bad matrix is reported cell by cell', () => {
  const p = matrixProblems({ matrix: [{ browser: 'edge', scheme: 'sepia', forced: 'yes', width: 10, extra: 1 }], other: 1 }).map(([at]) => at);
  for (const at of ['coverage.other', 'coverage.matrix[0].extra', 'coverage.matrix[0].browser', 'coverage.matrix[0].scheme', 'coverage.matrix[0].forced', 'coverage.matrix[0].width']) assert.ok(p.includes(at), at);
  assert.equal(matrixProblems({ matrix: [] }).length, 1);
  assert.equal(matrixProblems('x').length, 1);
});

const side = () => ({ site: { php: '8.5.7' }, pages: [{ path: '/', theme: 'default_admin' }], ajax: [], speech: { announce: [], live: [] } });
const goodRun = () => ({ variant: 'x-latest', issue: '1', when: 'now', environment: {}, commits: {}, sides: { before: side(), after: side() }, verdict: 'mixed', unexpected: 1 });

test('a complete run has no problems', () => assert.deepEqual(runProblems(goodRun()), []));

test('a run without verdict, theme or site context is incomplete', () => {
  const r = goodRun(); delete r.verdict; r.sides.after.pages = [{ path: '/' }]; r.sides.before.site = {};
  const p = runProblems(r).join('\n');
  assert.match(p, /verdict/); assert.match(p, /sides\.after\.pages records no theme/); assert.match(p, /sides\.before\.site has no php/);
  const r2 = goodRun(); delete r2.sides.before.ajax; assert.match(runProblems(r2).join(), /sides\.before\.ajax missing/);
});

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'lab-tools-'));
const draft = (name, body) => { const f = path.join(tmp, name); fs.writeFileSync(f, body); return node('scripts/check-draft.mjs', [f]); };
const GOOD = '<!-- notes for the reviewer: anything here, ### headers and all, is not counted -->\n\nTested on main (abc1234) with Default Admin in Chromium.\n\nWithout the MR, the Hide button is missing.\n\nWith the MR, the button is there.\n\nGenerated with the help of an LLM.\n';

test('a short factual draft passes', () => { const r = draft('good.md', GOOD); assert.equal(r.status, 0, r.stdout); });

test('the draft checker catches each rule (negative controls)', () => {
  const cases = [
    ['no-disclosure.md', GOOD.replace('Generated with the help of an LLM.', ''), /last line must be exactly/],
    ['header.md', GOOD.replace('Tested on', '### Result\nTested on'), /Markdown header/],
    ['long-sentence.md', GOOD.replace('the button is there.', `the button is there ${'and it works '.repeat(10)}.`), /sentence of \d+ words/],
    ['too-long.md', GOOD.replace('Without the MR', `${'Word '.repeat(190)}.\n\nWithout the MR`), /words; the limit is 180/],
    ['flourish.md', GOOD.replace('the button is there', 'the button is robust'), /robust/],
    ['formula.md', GOOD.replace('the button is there', 'the button is there rather than missing'), /rather than/],
    ['tool-name.md', GOOD.replace('in Chromium', 'with Claude in Chromium'), /names a tool or model/],
    ['em-dash.md', GOOD.replace('missing.', 'missing — sadly.'), /em dash/],
    ['placeholder.md', GOOD.replace('(abc1234)', '(<commit>)'), /placeholder/],
  ];
  for (const [name, body, re] of cases) { const r = draft(name, body); assert.equal(r.status, 1, `${name} should fail`); assert.match(r.stdout, re, name); }
});

test('run-mark supersedes a run, coverage skips it, and --clear undoes it', () => {
  const nid = '99000001', dir = path.join(labRoot, 'reports/issues', nid);
  assert.ok(!fs.existsSync(dir), `${dir} must not exist before the test`);
  try {
    for (const [d, verdict] of [['old', 'mixed'], ['new', 'reproduced-and-fixed']]) {
      fs.mkdirSync(path.join(dir, 'playwright', d), { recursive: true });
      const r = { ...goodRun(), issue: nid, variant: `${nid}-latest`, when: '2026-10-14T00:00:00Z', verdict, unexpected: 0, environment: { browser: 'chromium', colorScheme: 'light', forcedColors: false, viewport: { width: 1280 } }, commits: { after: 'abc 2026-10-14' } };
      fs.writeFileSync(path.join(dir, 'playwright', d, 'results.json'), JSON.stringify(r));
      fs.writeFileSync(path.join(dir, 'playwright', d, 'SUMMARY.md'), '# run\n');
    }
    let r = node('scripts/run-mark.mjs', ['old', '--issue', nid, '--superseded', '--reason', 'loose check', '--by', 'new']);
    assert.equal(r.status, 0, r.stderr);
    assert.match(fs.readFileSync(path.join(dir, 'playwright/old/SUMMARY.md'), 'utf8'), /^> \*\*Superseded\*\* .*loose check\. See `new`/);
    r = node('scripts/coverage.mjs', [nid]); assert.equal(r.status, 0, r.stderr);
    const cov = fs.readFileSync(path.join(dir, 'COVERAGE.md'), 'utf8');
    assert.match(cov, /Superseded runs \(kept, not counted\): `old` \(loose check; see `new`\)/);
    assert.match(cov, /Other runs: [^\n]*theme default_admin, ✓ reproduced and fixed/);
    assert.doesNotMatch(cov, /mixed result/);
    assert.equal(node('scripts/run-mark.mjs', ['old', '--issue', nid, '--superseded', '--reason', 'x', '--by', 'old']).status, 1, 'cannot supersede itself');
    r = node('scripts/run-mark.mjs', ['old', '--issue', nid, '--clear']); assert.equal(r.status, 0);
    assert.equal(fs.readFileSync(path.join(dir, 'playwright/old/SUMMARY.md'), 'utf8'), '# run\n');
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('findings: from-run logs Before violations once, keeps After-only ones out, and set/list work', () => {
  const fdir = fs.mkdtempSync(path.join(os.tmpdir(), 'lab-findings-')), run = fs.mkdtempSync(path.join(os.tmpdir(), 'lab-run-'));
  const env = { ...process.env, LAB_FINDINGS_DIR: fdir };
  const f = (a) => spawnSync('node', [path.join(labRoot, 'scripts/findings.mjs'), ...a], { cwd: labRoot, encoding: 'utf8', env });
  const viol = (id, target) => ({ id, impact: 'serious', help: `help for ${id}`, tags: ['wcag143'], nodes: [{ target, html: '<x>' }] });
  const r = goodRun(); r.issue = '1';
  r.sides.before.axe = { url: '/node/add', violations: [viol('color-contrast', '.a')] };
  r.sides.after.axe = { url: '/node/add', violations: [viol('color-contrast', '.a'), viol('label', '#new')] };
  fs.writeFileSync(path.join(run, 'results.json'), JSON.stringify(r));
  let o = f(['from-run', run]); assert.equal(o.status, 0, o.stderr);
  assert.match(o.stdout, /1 new finding/); assert.match(o.stdout, /appear only WITH the patch[\s\S]*label at \/node\/add #new/);
  o = f(['from-run', run]); assert.match(o.stdout, /0 new finding\(s\), 1 already logged/);
  const log = JSON.parse(fs.readFileSync(path.join(fdir, 'findings.json'), 'utf8'));
  assert.equal(log.length, 1); assert.equal(log[0].status, 'unconfirmed'); assert.equal(log[0].count, 2);
  assert.equal(f(['set', 'F001', '--status', 'reported']).status, 2, 'reported needs a link');
  assert.equal(f(['set', 'F001', '--status', 'reported', '--link', 'https://www.drupal.org/i/1']).status, 0);
  assert.equal(f(['add', '--issue', '1', '--where', 'x', '--what', 'y', '--source', 'telepathy']).status, 2, 'unknown source refused');
  assert.equal(f(['add', '--issue', '1', '--where', 'Hide button', '--what', 'focus stays on a hidden button', '--source', 'keyboard']).status, 0);
  assert.match(f(['list']).stdout, /## unconfirmed \(1\)[\s\S]*F002[\s\S]*## reported \(1\)[\s\S]*F001/);
  fs.rmSync(fdir, { recursive: true, force: true }); fs.rmSync(run, { recursive: true, force: true });
});
