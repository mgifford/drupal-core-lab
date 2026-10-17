// The two legacy .js commands must be real JavaScript, including their templates.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { stripTypeScriptTypes } from 'node:module';
import { labRoot } from '../../tools/compare/lib.mjs';
const execute = (args, opts = {}) => spawnSync(process.execPath, args, { cwd: labRoot, encoding: 'utf8', ...opts });
test('legacy commands parse as JavaScript without TypeScript declarations', () => {
  for (const script of ['generate-test.js', 'interpret-results.js']) {
    const source = fs.readFileSync(path.join(labRoot, 'tests/playwright/scripts', script), 'utf8');
    const result = execute(['--input-type=module', '--check'], { input: source });
    assert.equal(result.status, 0, result.stderr);
  }
});
test('all generator templates run offline and produce parseable TypeScript', () => {
  for (const template of ['basic', 'detailed', 'voiceover']) {
    const result = execute(['tests/playwright/scripts/generate-test.js', 'https://www.drupal.org/project/drupal/issues/3630425', '--template', template, '--dry-run']);
    assert.equal(result.status, 0, result.stderr);
    const source = result.stdout.split('=== Generated Test (dry run) ===\n')[1]?.split('\nWould write to:')[0];
    assert.ok(source); assert.doesNotThrow(() => stripTypeScriptTypes(source));
    assert.match(source, /Issue #3630425/);
  }
});
test('interpreter resolves its ESM paths and writes the expected report', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'legacy-cli-'));
  try {
    const scripts = path.join(root, 'scripts'); fs.mkdirSync(scripts);
    const script = path.join(scripts, 'interpret-results.mjs');
    fs.copyFileSync(path.join(labRoot, 'tests/playwright/scripts/interpret-results.js'), script);
    const input = path.join(root, 'input.json'); fs.writeFileSync(input, JSON.stringify({ suites: [{ specs: [{ title: 'example', ok: true }] }] }));
    const result = execute([script, input]); assert.equal(result.status, 0, result.stderr);
    const report = JSON.parse(fs.readFileSync(path.join(root, 'reports/analysis/analysis.json'), 'utf8'));
    assert.equal(report.summary.totalTests, 1); assert.equal(report.summary.passed, 1);
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});
