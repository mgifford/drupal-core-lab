// Evidence inventory and warn-only budgets: category classification, per-issue summary and duplicate run grouping.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { classifyPath, loadBudgets, summarizeIssue, aggregateMarkdown } from '../../tools/compare/evidence-budget.mjs';

const root = () => fs.mkdtempSync(path.join(os.tmpdir(), 'evidence-budget-'));
const write = (dir, rel, body = 'x') => { const f = path.join(dir, 'reports/issues/1', rel); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, body); };

test('paths are classified as human, structured, raw and image', () => {
  assert.equal(classifyPath('SUMMARY.md'), 'human');
  assert.equal(classifyPath('playwright/run/results.json'), 'structured');
  assert.equal(classifyPath('playwright/run/design/observations.json'), 'raw');
  assert.equal(classifyPath('playwright/run/playwright-trace-before.zip'), 'raw');
  assert.equal(classifyPath('playwright/run/after.png'), 'image');
});

test('an issue summary counts categories and sizes', () => {
  const dir = root();
  try {
    write(dir, 'SUMMARY.md', 'summary');
    write(dir, 'playwright/run/results.json', '{}');
    write(dir, 'playwright/run/after.png', 'png');
    write(dir, 'playwright/run/design/observations.json', 'raw');
    const row = summarizeIssue(dir, '1', { limits: { max_files_per_issue: 100, max_bytes_per_issue: 10 ** 9, max_bytes_per_json: 250 * 1024, max_images_per_run: 8 } });
    assert.equal(row.files, 4);
    assert.equal(row.categories.human.files, 1);
    assert.equal(row.categories.structured.files, 1);
    assert.equal(row.categories.raw.files, 1);
    assert.equal(row.categories.image.files, 1);
    assert.equal(row.warnings.length, 0);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('duplicate runs are grouped by core, patch, recipe and browser configuration', () => {
  const dir = root();
  try {
    const run = (when) => JSON.stringify({ variant: '1-pinned', when, environment: { browser: 'chromium', browserVersion: '1', colorScheme: 'light', forcedColors: false, viewport: { width: 1280, height: 900 }, page: '/x' }, core: { commit: 'abc' }, patchState: { after: { recorded: { footprint: 'fp' } } }, identity: { recipe: { current: 'r' } } });
    write(dir, 'playwright/a/results.json', run('2026-11-27T10:00:00Z'));
    write(dir, 'playwright/b/results.json', run('2026-11-27T11:00:00Z'));
    write(dir, 'playwright/c/results.json', run('2026-11-27T12:00:00Z').replace('"light"', '"dark"'));
    const row = summarizeIssue(dir, '1', { limits: { max_files_per_issue: 100, max_bytes_per_issue: 10 ** 9, max_bytes_per_json: 10 ** 9, max_images_per_run: 8 } });
    assert.equal(row.runs, 3);
    assert.equal(row.duplicate_groups, 1);
    assert.equal(row.duplicate_runs, 1);
    assert.match(row.warnings.join(' '), /duplicate/);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('the budget report is generated from the rows and carries the warn-only note', () => {
  const dir = root();
  try {
    write(dir, 'SUMMARY.md');
    const row = summarizeIssue(dir, '1', { limits: { max_files_per_issue: 100, max_bytes_per_issue: 10 ** 9, max_bytes_per_json: 10 ** 9, max_images_per_run: 8 } });
    const md = aggregateMarkdown([row], { source: 'evidence-budgets.yml', mode: 'warn', generated: '2026-11-27T00:00:00Z' });
    assert.match(md, /#1/);
    assert.match(md, /Warn-only/);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('an invalid budget config is reported, not silently defaulted', () => {
  const dir = root();
  try {
    fs.writeFileSync(path.join(dir, 'evidence-budgets.yml'), 'mode: enforce\nlimits:\n  unknown_limit: 1\n');
    const loaded = loadBudgets(dir);
    assert.ok(loaded.problems.length >= 2);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});
