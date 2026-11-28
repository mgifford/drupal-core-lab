// Curated contribution records: stable ids, section grouping, a credit draft that only states recorded facts, and validation.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { normalizeEntry, normalizeFile, validateFile, writeContributions, readContributions, contributionPath, issueMarkdown, draftMarkdown, nextId } from '../../tools/compare/contributions.mjs';

const root = () => { const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'contributions-')); fs.mkdirSync(path.join(dir, 'reports/issues/3534229'), { recursive: true }); return dir; };
const entry = (over = {}) => normalizeEntry({ id: 'K001', kind: 'human-origin', by: 'kentr', what: 'identified CSS masks and system colours as the mechanism', date: '2026-11-27', links: ['https://www.drupal.org/project/drupal/issues/3534229#comment-1'], ...over });

test('ids are stable and a record round-trips', () => {
  const dir = root();
  try {
    const file = normalizeFile({ issue: '3534229', entries: [entry()] }, '3534229');
    assert.equal(validateFile(file).ok, true);
    writeContributions(dir, '3534229', file);
    const back = readContributions(dir, '3534229');
    assert.equal(back.entries[0].id, 'K001');
    assert.equal(nextId(back), 'K002');
    assert.match(issueMarkdown('3534229', back), /Original human contributions/);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('an invalid kind is rejected rather than rewritten', () => {
  const file = normalizeFile({ issue: '3534229', entries: [entry({ kind: 'human-vibes' })] }, '3534229');
  assert.equal(validateFile(file).ok, false);
  assert.match(validateFile(file).errors.map((e) => e.message).join(' '), /must be one of/);
  const dir = root();
  try { assert.throws(() => writeContributions(dir, '3534229', file), /refusing to write contributions\.json/); }
  finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('the generated contribution account separates human origin, AI additions, corrections and uncertainty', () => {
  const file = normalizeFile({ issue: '3534229', entries: [
    entry(),
    entry({ id: 'K002', kind: 'ai-addition', by: 'AI-assisted work', what: 'extended the mask across the toolbar inventory' }),
    entry({ id: 'K003', kind: 'human-correction', by: 'kentr', what: 'corrected the fixture before it was relied on', verified_by_human: true }),
    entry({ id: 'K004', kind: 'uncertainty', by: 'lab', what: 'the contributed-plugin regression is not fully reproduced' }),
  ] }, '3534229');
  const md = issueMarkdown('3534229', file);
  assert.match(md, /Original human contributions/);
  assert.match(md, /AI-generated additions/);
  assert.match(md, /Human corrections/);
  assert.match(md, /Remaining uncertainties/);
  assert.match(md, /independently verified/);
});

test('a contribution draft needs a human-origin entry and never invents one', () => {
  const none = normalizeFile({ issue: '3534229', entries: [entry({ kind: 'ai-addition' })] }, '3534229');
  assert.throws(() => draftMarkdown('3534229', none), /at least one human-origin/);
  const file = normalizeFile({ issue: '3534229', entries: [entry(), entry({ id: 'K002', kind: 'human-correction', by: 'kentr', what: 'corrected the regression coverage' })] }, '3534229');
  const draft = draftMarkdown('3534229', file);
  assert.match(draft, /kentr/);
  assert.match(draft, /Human review corrected/);
  assert.match(draft, /DRAFT/);
  assert.doesNotMatch(draft, /automatic/i);
});

test('a missing file reads empty and creates nothing', () => {
  const dir = root();
  try {
    assert.equal(readContributions(dir, '3534229').entries.length, 0);
    assert.equal(fs.existsSync(contributionPath(dir, '3534229')), false);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});
