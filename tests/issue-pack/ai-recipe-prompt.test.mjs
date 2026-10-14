// The --ai-recipe prompt mode (docs/ISSUE-TO-LAB.md): it swaps rule 6 for the recipe-drafting rule and shows the recipe.files
// shape, and the default prompt is left exactly as it was. Needs js-yaml, like the other pack tests.
import test from 'node:test';
import { spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';
import path from 'node:path';
import { labRoot } from '../../tools/compare/lib.mjs';

const prompt = (extra = []) => {
  const r = spawnSync('node', [path.join(labRoot, 'scripts/issue-pack.mjs'), 'prompt', ...extra], { encoding: 'utf8', cwd: labRoot });
  assert.equal(r.status, 0, r.stderr);
  return r.stdout;
};

test('the default prompt forbids recipe files and shows no recipe format', () => {
  const out = prompt();
  assert.match(out, /^6\. Setup: do NOT write recipe files/m);
  assert.doesNotMatch(out, /^RECIPE FORMAT/m);
});

test('--ai-recipe swaps rule 6 and shows the recipe.files shape', () => {
  const out = prompt(['--ai-recipe']);
  assert.match(out, /^6\. SETUP, recipe-drafting mode/m);
  assert.doesNotMatch(out, /^6\. Setup: do NOT write recipe files/m);
  assert.match(out, /^RECIPE FORMAT/m);
  assert.match(out, /^\s+files:$/m);
  assert.match(out, /config\/<config object name>\.yml/);
});

test('--ai-recipe leaves the rest of the prompt alone', () => {
  const normalize = (s, ai) => {
    let lines = s.split('\n').filter((l) => !/^6\. /.test(l));
    if (ai) {
      const start = lines.findIndex((l) => l.startsWith('RECIPE FORMAT'));
      const end = lines.findIndex((l) => l.startsWith('WORKED EXAMPLE'));
      lines = [...lines.slice(0, start), ...lines.slice(end)];
    }
    return lines.join('\n');
  };
  assert.equal(normalize(prompt(['--ai-recipe']), true), normalize(prompt(), false));
  assert.match(prompt(['--ai-recipe']), /WORKED EXAMPLE \(for issue 3415961/);
});
