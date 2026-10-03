// The chat prompt keeps the person's inputs at the very top, clearly marked, and its worked example stays valid.
// Run: node --test tests/issue-pack/prompt.test.mjs   (needs js-yaml in tools/compare/.deps)
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { labRoot } from '../../tools/compare/lib.mjs';
import { validatePack, loadYaml } from '../../tools/compare/pack-validate.mjs';

const prompt = spawnSync('node', [path.join(labRoot, 'scripts/issue-pack.mjs'), 'prompt'], { encoding: 'utf8' }).stdout;

test('the three inputs come first, each marked @@MISSING@@, before any instruction', () => {
  const lines = prompt.split('\n');
  const endOfInputs = lines.findIndex((l) => l.includes('END OF INPUTS'));
  const instructions = lines.findIndex((l) => l.startsWith('You are helping prepare'));
  assert.ok(endOfInputs > 0 && endOfInputs < instructions, 'inputs must end before the instructions start');
  assert.ok(lines.slice(0, 3).join(' ').includes('FOR THE PERSON'), 'the banner is the first thing in the file');
  for (const n of [1, 2, 3]) assert.ok(lines.slice(0, endOfInputs).some((l) => l.startsWith(`>>> INPUT ${n} OF 3`)), `input ${n} is labelled`);
  assert.equal(lines.slice(0, endOfInputs).filter((l) => l.startsWith('@@MISSING@@')).length, 3);
});

test('the assistant is told to stop and ask while any input is still missing', () => {
  assert.match(prompt, /0\. FIRST check the three inputs[^\n]*@@MISSING@@[^\n]*do not write a pack/);
});

test('@@MISSING@@ appears only on the placeholder lines and once in rule 0, so a filled-in prompt has none left outside that rule', () => {
  const filled = prompt.replace(/^@@MISSING@@ \([^\n]*\)$/gm, 'FILLED');
  assert.equal((filled.match(/@@MISSING@@/g) || []).length, 1, 'only the mention in rule 0 remains');
});

test('the worked example inside the prompt validates', () => {
  const m = prompt.match(/```yaml\n([\s\S]*?)\n```/);
  assert.ok(m, 'an example block is present');
  assert.deepEqual(validatePack(m[1] + '\n', { yaml: loadYaml() }).errors, []);
});

test('rule 11 is a checklist: list the state each step needs, find where the recipe creates it, never write "the configured limit" otherwise', () => {
  assert.match(prompt, /^11\. Before you write the steps, list for yourself the exact state/m);
  assert.match(prompt, /find where the recipe creates it/);
  assert.match(prompt, /Never write "the configured limit" or "ensure X is configured" unless the recipe sets it/);
});
