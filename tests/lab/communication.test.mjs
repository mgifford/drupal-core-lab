// Unit tests for upstream communication tracking. No network and no posting: this records state, it does not act.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { normalizeEntry, normalizeFile, validateFile, readCommunication, writeCommunication, communicationPath, issueMarkdown, aggregateMarkdown, needsUpdate, rows } from '../../tools/compare/communication.mjs';

const root = () => { const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'communication-')); fs.mkdirSync(path.join(dir, 'reports/issues/3534229'), { recursive: true }); return dir; };
const entry = (over = {}) => normalizeEntry({ id: 'C001', summary: 'Toolbar icons are invisible in forced-colors mode', state: 'new', discovered: { by: 'joint', date: '2026-11-27' }, tested_revision: 'MR !18007 @ 50833b75', evidence: ['reports/issues/3534229/EVIDENCE.md'], updated: '2026-11-27', ...over });

test('a new finding is actionable and survives a round trip', () => {
  const dir = root();
  try {
    const file = normalizeFile({ issue: '3534229', entries: [entry()] }, '3534229');
    assert.equal(validateFile(file).ok, true);
    writeCommunication(dir, '3534229', file);
    const back = readCommunication(dir, '3534229');
    assert.equal(back.entries[0].id, 'C001');
    assert.equal(back.entries[0].state, 'new');
    assert.equal(needsUpdate(back.entries[0]), true);
    assert.match(issueMarkdown('3534229', back), /Needs an update|needing a next human step/);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('posted and independently addressed are terminal for the needs-update view', () => {
  assert.equal(needsUpdate(entry({ state: 'posted' })), false);
  assert.equal(needsUpdate(entry({ state: 'independently-addressed' })), false);
  assert.equal(needsUpdate(entry({ state: 'ready-to-post' })), true);
});

test('an invalid state is rejected, not silently rewritten', () => {
  const file = normalizeFile({ issue: '3534229', entries: [entry({ state: 'published-somewhere' })] }, '3534229');
  assert.equal(validateFile(file).ok, false);
  assert.match(validateFile(file).errors.map((e) => e.message).join(' '), /must be one of/);
});

test('writeCommunication refuses an invalid record', () => {
  const dir = root();
  try { assert.throws(() => writeCommunication(dir, '3534229', { issue: '3534229', entries: [entry({ state: 'bad' })] }), /refusing to write communication\.json/); }
  finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('the aggregate view puts actionable findings first and links each issue', () => {
  const files = [
    { issue: '3534229', file: normalizeFile({ issue: '3534229', entries: [entry({ id: 'C001', state: 'new' })] }, '3534229') },
    { issue: '3083103', file: normalizeFile({ issue: '3083103', entries: [entry({ id: 'C002', state: 'posted', summary: 'A human corrected the recursion', posted: { url: 'https://www.drupal.org/comment/1', date: '2026-11-27' } })] }, '3083103') },
  ];
  const md = aggregateMarkdown(files);
  assert.match(md, /Needs an update/);
  assert.match(md, /#3534229/);
  assert.match(md, /https:\/\/www\.drupal\.org\/comment\/1/);
  assert.equal(rows(files)[0].state, 'new');
});

test('a missing communication file reads as an empty record and does not create one', () => {
  const dir = root();
  try {
    assert.equal(readCommunication(dir, '3534229').entries.length, 0);
    assert.equal(fs.existsSync(communicationPath(dir, '3534229')), false);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});
