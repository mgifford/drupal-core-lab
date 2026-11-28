// Pure tests for the scenario representation and the Before/After comparison: no browser, no DDEV, no network.
//   node --test tests/lab/a11y-scenario.test.mjs
//
// They check that every file under scenarios/ is valid and internally consistent, that no scenario carries an
// MCP element reference or a sleep-style action, that every state-dependent checkpoint states what "equivalent"
// means, and that tools/playwright/scenario-run.mjs --check exits 0 for every scenario. The runner's browser path
// is not exercised here (the sites are not built in this checkout); --check is the offline contract it promises.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { labRoot, variants } from '../../tools/compare/lib.mjs';
import {
  ACTIONS, SCENARIO_SCHEMA, compareScenario, locatorOf, scenarioSummaryMarkdown, validateScenario,
} from '../../tools/playwright/lib/a11y/scenario.mjs';

const scenariosDir = path.join(labRoot, 'scenarios');
const scenarioRun = path.join(labRoot, 'tools/playwright/scenario-run.mjs');
const MCP_REF = /^e\d+$/;

function scenarioFiles() {
  const out = [];
  const walk = (dir) => {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith('.json') && entry.name !== 'schema.json') out.push(full);
    }
  };
  walk(scenariosDir);
  return out;
}

const load = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const rel = (file) => path.relative(labRoot, file);

// A minimal scenario that validates; each test mutates a clone so one broken field can be named.
function baseScenario() {
  return {
    schema: SCENARIO_SCHEMA,
    id: 'lab-fixture-minimal',
    issue: null,
    variant: null,
    title: 'Minimal fixture scenario',
    description: 'A minimal scenario used only by the pure tests.',
    preconditions: [],
    fixture: { standardInstall: true, notes: 'The test fixture is a plain Standard install.' },
    route: '/',
    login: false,
    viewport: { width: 1280, height: 900 },
    browser: 'chromium',
    colourScheme: 'light',
    forcedColors: false,
    reducedMotion: 'no-preference',
    steps: [
      { action: 'goto', path: '/', readiness: { selector: 'body', state: 'visible' } },
      { action: 'checkpoint', id: 'initial' },
    ],
    checkpoints: [{ id: 'initial', label: 'Initial page state' }],
    expected: [],
    regressionAssertions: [],
    resetInstructions: [],
    manualReview: [],
    limits: [],
    verified: false,
    notes: 'Written by tests/lab/a11y-scenario.test.mjs.',
  };
}

const clone = (value) => JSON.parse(JSON.stringify(value));

test('the scenario schema constant names the representation version', () => {
  assert.equal(SCENARIO_SCHEMA, 'lab-a11y-scenario/1');
  assert.equal(load(path.join(scenariosDir, 'schema.json')).$schema, 'https://json-schema.org/draft/2020-12/schema');
  assert.ok(ACTIONS.includes('checkpoint') && ACTIONS.includes('evaluate') && ACTIONS.includes('assert'));
  assert.ok(!ACTIONS.includes('sleep'));
});

test('every scenario file parses and validates against the hand-written rules', () => {
  const files = scenarioFiles();
  assert.ok(files.length >= 11, `expected the initial scenario set under scenarios/, found ${files.length}`);
  const problems = [];
  for (const file of files) {
    const data = load(file);
    const result = validateScenario(data);
    if (!result.ok) problems.push(`${rel(file)}: ${result.problems.join('; ')}`);
  }
  assert.deepEqual(problems, []);
});

test('scenario ids are unique, and no scenario claims it was verified', () => {
  const seen = new Map();
  for (const file of scenarioFiles()) {
    const data = load(file);
    assert.equal(typeof data.id, 'string', rel(file));
    assert.ok(!seen.has(data.id), `id "${data.id}" is used by ${seen.get(data.id)} and ${rel(file)}`);
    seen.set(data.id, rel(file));
    assert.equal(data.verified, false, `${rel(file)} must not claim verification: this session ran no Drupal sites`);
    assert.ok(String(data.notes || '').trim().length > 0, `${rel(file)} needs notes saying what was read and inferred`);
  }
});

test('a named variant exists in the registered variant list, or the scenario says it is unregistered', () => {
  const all = variants();
  for (const file of scenarioFiles()) {
    const data = load(file);
    if (data.variant === null) {
      const acknowledgement = `${(data.preconditions || []).join(' ')} ${data.notes || ''} ${data.limits || []}`;
      assert.match(acknowledgement, /not registered|unregistered|no (registered )?variant|no variant|no environment is registered|scenario will need a registered variant/i, `${rel(file)} names no variant, so it must say in notes/preconditions that the environment is not registered yet`);
      continue;
    }
    const variant = all.find((v) => v.slug === data.variant);
    assert.ok(variant, `${rel(file)} names variant "${data.variant}", which is not registered in tools/compare/variants.json`);
    if (data.issue != null) assert.equal(String(variant.issue), String(data.issue), `${rel(file)} is issue #${data.issue} but variant ${variant.slug} is issue #${variant.issue}`);
  }
});

test('no locator is an MCP element reference, and no step uses a sleep-style action', () => {
  for (const file of scenarioFiles()) {
    const data = load(file);
    const walkLocators = (value, where) => {
      if (Array.isArray(value)) { value.forEach((v, i) => walkLocators(v, `${where}[${i}]`)); return; }
      if (!value || typeof value !== 'object') return;
      if (Object.hasOwn(value, 'locator')) {
        const spec = value.locator;
        for (const key of ['role', 'name', 'label', 'text', 'testId', 'selector']) {
          if (typeof spec?.[key] === 'string') assert.ok(!MCP_REF.test(spec[key].trim()), `${rel(file)} ${where}.locator.${key} is an MCP element reference "${spec[key]}"`);
        }
      }
      for (const [key, child] of Object.entries(value)) if (child && typeof child === 'object') walkLocators(child, `${where}.${key}`);
    };
    walkLocators(data.steps, 'steps');
    data.steps.forEach((step, i) => {
      assert.ok(ACTIONS.includes(step.action), `${rel(file)} steps[${i}] has unsupported action "${step.action}"`);
      assert.doesNotMatch(String(step.action), /sleep|waitForTimeout|pause|delay/i, `${rel(file)} steps[${i}] waits with a fixed sleep, which the representation does not allow`);
    });
  }
});

test('every state-dependent checkpoint declares what makes the two sides equivalent', () => {
  for (const file of scenarioFiles()) {
    const data = load(file);
    let interacted = false;
    let checkpointsSeen = 0;
    for (const [i, step] of data.steps.entries()) {
      if (step.action === 'checkpoint') {
        checkpointsSeen += 1;
        const def = data.checkpoints.find((c) => c.id === step.id);
        assert.ok(def, `${rel(file)} steps[${i}] captures undeclared checkpoint "${step.id}"`);
        const stateDependent = interacted || checkpointsSeen > 1;
        if (stateDependent) assert.ok(def.expected, `${rel(file)} checkpoint "${step.id}" follows an interaction (or another checkpoint) and needs an expected equivalence object, otherwise a Before/After comparison cannot tell whether the states are the same`);
      } else if (['click', 'press', 'fill', 'check', 'uncheck', 'hover', 'selectOption'].includes(step.action)) interacted = true;
    }
  }
});

test('scenario-run.mjs --check exits 0 for every scenario (no browser, no DDEV)', () => {
  for (const file of scenarioFiles()) {
    const data = load(file);
    const args = [scenarioRun, rel(file), '--check'];
    if (data.variant) args.push(data.variant);
    const result = spawnSync(process.execPath, args, { cwd: labRoot, encoding: 'utf8', timeout: 120000 });
    assert.equal(result.status, 0, `${rel(file)} --check exited ${result.status}:\n${result.stdout}\n${result.stderr}`);
    assert.match(result.stdout, /^OK: /m, `${rel(file)} --check did not report OK:\n${result.stdout}${result.stderr}`);
  }
});

test('a deliberately broken scenario is rejected with named problems', () => {
  // Unknown top-level key.
  const top = clone(baseScenario()); top.typoField = true;
  let result = validateScenario(top);
  assert.equal(result.ok, false);
  assert.ok(result.problems.some((p) => p.includes('typoField')), `expected the unknown top-level key to be named: ${result.problems.join('; ')}`);

  // Missing id.
  const noId = clone(baseScenario()); delete noId.id;
  result = validateScenario(noId);
  assert.equal(result.ok, false);
  assert.ok(result.problems.some((p) => /^id /.test(p)), `expected a problem naming id: ${result.problems.join('; ')}`);

  // Unknown step key.
  const unknownStep = clone(baseScenario()); unknownStep.steps[0].sleep = 1000;
  result = validateScenario(unknownStep);
  assert.equal(result.ok, false);
  assert.ok(result.problems.some((p) => p.includes('unknown key "sleep"')), `expected the unknown step key to be named: ${result.problems.join('; ')}`);

  // Sleep-style action.
  const sleep = clone(baseScenario()); sleep.steps.splice(1, 0, { action: 'waitForTimeout', value: 500 });
  result = validateScenario(sleep);
  assert.equal(result.ok, false);
  assert.ok(result.problems.some((p) => /sleep|not supported/.test(p)), `expected the sleep action to be refused: ${result.problems.join('; ')}`);

  // MCP element reference as a locator.
  const mcp = clone(baseScenario());
  mcp.steps.splice(1, 0, { action: 'click', locator: { role: 'button', name: 'e12' } });
  result = validateScenario(mcp);
  assert.equal(result.ok, false);
  assert.ok(result.problems.some((p) => /MCP element reference/.test(p)), `expected the MCP reference to be refused: ${result.problems.join('; ')}`);

  // A checkpoint step with no declared checkpoint.
  const undeclared = clone(baseScenario()); undeclared.steps.push({ action: 'checkpoint', id: 'nowhere' });
  result = validateScenario(undeclared);
  assert.equal(result.ok, false);
  assert.ok(result.problems.some((p) => p.includes('nowhere')), `expected the undeclared checkpoint to be named: ${result.problems.join('; ')}`);

  // A state-changing evaluate expression.
  const mutating = clone(baseScenario());
  mutating.steps.splice(1, 0, { action: 'evaluate', expression: "document.querySelector('button').click()" });
  result = validateScenario(mutating);
  assert.equal(result.ok, false);
  assert.ok(result.problems.some((p) => p.includes('.click(')), `expected the mutation to be refused: ${result.problems.join('; ')}`);

  // The minimal scenario itself is valid.
  assert.deepEqual(validateScenario(baseScenario()).problems, []);
});

test('locatorOf uses semantic locators in order and refuses an MCP reference', () => {
  const calls = [];
  const scope = {
    getByRole: (role, options) => { calls.push({ kind: 'role', role, options }); return { kind: 'role' }; },
    getByLabel: (label, options) => { calls.push({ kind: 'label', label, options }); return { kind: 'label' }; },
    getByText: (text, options) => { calls.push({ kind: 'text', text, options }); return { kind: 'text' }; },
    getByTestId: (id) => { calls.push({ kind: 'testId', id }); return { kind: 'testId' }; },
    locator: (selector) => { calls.push({ kind: 'selector', selector }); return { kind: 'selector' }; },
  };
  assert.equal(locatorOf(scope, { role: 'button', name: 'Save' }).kind, 'role');
  assert.deepEqual(calls.pop(), { kind: 'role', role: 'button', options: { name: 'Save' } });
  assert.equal(locatorOf(scope, { label: 'Alternative text' }).kind, 'label');
  assert.equal(locatorOf(scope, { text: 'Insert Media' }).kind, 'text');
  assert.equal(locatorOf(scope, { testId: 'edit-submit' }).kind, 'testId');
  assert.equal(locatorOf(scope, { selector: '#edit-submit' }).kind, 'selector');
  assert.throws(() => locatorOf(scope, { selector: 'e12' }), /MCP element reference/);
  assert.throws(() => locatorOf(scope, {}), /locator has no/);
});

// A synthetic pair of checkpoint records: enough fields for equivalence() and nothing that needs a browser.
function record(side, overrides = {}) {
  return {
    schema: 'lab-a11y-checkpoint/1',
    id: 'state-after-save',
    sequence: 1,
    when: '2026-11-27T10:00:00.000Z',
    status: 'captured',
    label: 'State after save',
    side,
    scenario: { id: 'lab-fixture-minimal', step: 1, checkpoint: 'state-after-save' },
    page: { path: '/node/add/article', title: 'Add article', lang: 'en', dir: 'ltr' },
    environment: { browser: 'chromium', viewport: { width: 1280, height: 900 }, colorScheme: 'light', forcedColors: 'none', reducedMotion: 'no-preference', contrast: 'no-preference' },
    state: { readiness: { satisfied: true }, application: { messages: [{ text: 'Saved' }], formErrors: [], ckeditor: { present: true, editables: 1 } }, flags: [] },
    focus: { active: { role: 'button', name: 'Save' } },
    evidence: { engines: [{ engine: 'axe-core', status: 'executed' }] },
    findings: [],
    manual: [],
    limits: [],
    resources: {},
    provenance: { source: 'scripted', side },
    ...overrides,
  };
}

test('compareScenario refuses non-equivalent states instead of describing a difference', () => {
  const before = record('before');
  const after = record('after', { page: { path: '/node/1/edit', title: 'Edit', lang: 'en', dir: 'ltr' } });
  const comparison = compareScenario({}, { records: [before] }, { records: [after] }, baseScenario());
  assert.equal(comparison.pairs[0].equivalent, false);
  assert.equal(comparison.verdict, 'mixed');
  assert.ok(comparison.unexpected >= 1);
  assert.match(comparison.note, /equivalent states/);
});

test('compareScenario reports resolved assertions and new regressions from the paired assertions', () => {
  const before = record('before');
  const after = record('after');
  const scenario = clone(baseScenario());
  scenario.steps = [{ action: 'checkpoint', id: 'state-after-save' }];
  scenario.checkpoints = [{ id: 'state-after-save', label: 'State after save', expected: { states: [{ path: 'state.application.messages', countMin: 1 }] } }];
  const check = { focus: { within: '.ck-editor' } };
  const comparison = compareScenario({}, {
    records: [before],
    assertions: [{ source: 'expected', index: 0, check, described: 'focus within .ck-editor', pass: false }],
  }, {
    records: [after],
    assertions: [{ source: 'expected', index: 0, check, described: 'focus within .ck-editor', pass: true }],
  }, scenario);
  assert.equal(comparison.pairs[0].equivalent, true);
  assert.equal(comparison.verdict, 'reproduced-and-fixed');
  assert.ok(comparison.assertions.some((a) => a.change === 'resolved-assertion'));
  assert.ok(comparison.checks.some((c) => c.kind === 'assertion' && c.pass === true));

  const regressed = compareScenario({}, {
    records: [before],
    assertions: [{ source: 'regression', index: 0, check, described: 'focus within .ck-editor', pass: true }],
  }, {
    records: [after],
    assertions: [{ source: 'regression', index: 0, check, described: 'focus within .ck-editor', pass: false }],
  }, scenario);
  assert.equal(regressed.verdict, 'reproduced-not-fixed');
  assert.ok(regressed.unexpected >= 1);
});

test('scenarioSummaryMarkdown writes a Scenario section with checkpoints, comparison and manual review', () => {
  const scenario = clone(baseScenario());
  scenario.manualReview = ['A person must check the screen-reader result.'];
  scenario.limits = ['The runner was not executed in the offline tests.'];
  const before = record('before');
  const after = record('after');
  const comparison = compareScenario({}, { records: [before] }, { records: [after] }, scenario);
  const md = scenarioSummaryMarkdown({
    scenario,
    sides: {
      before: { steps: [{ index: 0, action: 'goto', label: 'Open', status: 'ok', detail: 'readiness met' }], checkpoints: [{ sequence: 1, id: 'initial', label: 'Initial page state', status: 'captured', findings: 0, file: 'x.json' }] },
      after: { steps: [], checkpoints: [] },
    },
    comparison,
  });
  assert.match(md, /^## Scenario/m);
  assert.match(md, /lab-fixture-minimal/);
  assert.match(md, /Verified \| \*\*no/);
  assert.match(md, /Manual review this scenario still needs/);
  assert.match(md, /A person must check the screen-reader result/);
});
