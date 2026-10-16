import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { labRoot } from '../../tools/compare/lib.mjs';
import { renderIssueSummary } from '../../tools/compare/issue-summary.mjs';

test('scaffold is explicitly unverified and does not invent source evidence', () => {
  const text = renderIssueSummary({ nid: '1234567', title: 'Menu: focus disappears' });
  assert.match(text, /\*\*DRAFT\.\*\*/);
  assert.match(text, /not been verified by this generation step/);
  assert.match(text, /not yet been recorded/);
  assert.ok(!/\{\{[A-Z_]+\}\}/.test(text));
});

test('pack summary keeps source attribution, needs, setup and notes without interpreting inserted text', () => {
  const text = renderIssueSummary({
    nid: '1234567', title: 'Menu: focus disappears', generatedBy: 'an assistant',
    metadata: 'Merge request: !123', summary: 'Literal $& and {{NOT_A_TEMPLATE}} in supplied evidence.',
    sources: [{ url: 'https://www.drupal.org/project/drupal/issues/1234567', date: '2026-10-16', note: 'Comment #4' }],
    setup: ['- A configured menu'], unverified: ['Not tested with a screen reader', 'Needs a reproducible data fixture'], notes: 'Keep the old run.',
  });
  for (const value of ['!123', '$&', '{{NOT_A_TEMPLATE}}', 'Comment #4', '2026-10-16', 'A configured menu', 'Needs a reproducible data fixture', 'Keep the old run.']) assert.ok(text.includes(value));
});

test('summary generation reads the maintained template and rejects unknown fields', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'issue-summary-'));
  try {
    fs.mkdirSync(path.join(root, 'reports/_templates'), { recursive: true });
    const template = path.join(root, 'reports/_templates/SUMMARY.md');
    fs.copyFileSync(path.join(labRoot, 'reports/_templates/SUMMARY.md'), template);
    fs.appendFileSync(template, '\nShared instruction.\n');
    assert.match(renderIssueSummary({ nid: '1234567', title: 'A finding' }, root), /Shared instruction/);
    fs.appendFileSync(template, '{{UNKNOWN_FIELD}}');
    assert.throws(() => renderIssueSummary({ nid: '1234567', title: 'A finding' }, root), /Unknown SUMMARY template field/);
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});
