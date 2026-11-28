// The checkpoint record (tools/playwright/lib/a11y/checkpoint.mjs): what makes a record publishable, what a compact
// record sent to an agent may contain, and when two Before/After states are equivalent. Pure: no browser, no disk.
//   node --test tests/lab/a11y-checkpoint.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SCHEMA, STATUSES, SIDES, validId, checkpointProblems, createCheckpoint, compactCheckpoint,
  READINESS, readinessOf, equivalence, checkpointManual,
} from '../../tools/playwright/lib/a11y/checkpoint.mjs';
import { normaliseFinding } from '../../tools/playwright/lib/a11y/findings.mjs';
import { resolvePageContext, loadEnvHosts } from '../../tools/playwright/lib/a11y/context.mjs';

const clone = (v) => JSON.parse(JSON.stringify(v));
const iso = '2026-11-27T10:00:00.000Z';

// A complete record: every field checkpointProblems() requires is present and real.
function checkpointInput(overrides = {}) {
  const provenance = {
    source: 'scenario', mcp: null, scenario: { id: 'dialog-open' }, variant: null,
    issue: '3534229', side: 'before', core: { commit: 'abcdef12' }, patchState: null,
    page: { origin: 'http://127.0.0.1:8123', host: '127.0.0.1', path: '/node/1', queryNames: [] },
  };
  return {
    id: 'home',
    sequence: 1,
    label: 'Home',
    status: 'captured',
    when: iso,
    provenance,
    scenario: { id: 'dialog-open', label: 'Dialog open' },
    environment: {
      browser: 'chromium', browserVersion: '140.0.0', os: 'test',
      viewport: { width: 1280, height: 720 }, colorScheme: 'light', forcedColors: 'none',
      reducedMotion: 'no-preference', contrast: 'no-preference', theme: 'olivero', lang: 'en', dir: 'ltr',
    },
    page: { origin: 'http://127.0.0.1:8123', host: '127.0.0.1', path: '/node/1', queryNames: [] },
    interaction: { history: [] },
    focus: { active: { role: 'button', name: 'Save' } },
    state: {
      readiness: { kind: 'selector', selector: 'main', state: 'visible', timeoutMs: 10000, satisfied: true },
      application: { dialogs: [], expanded: [], aria: { brokenRefs: [] }, visibleText: 'Saved' },
    },
    evidence: { engines: [{ engine: 'axe-core', version: '4.14.0', status: 'executed', counts: { distinct: 0 } }] },
    findings: [],
    manual: [],
    limits: ['No real screen reader was involved.'],
    resources: { scanMs: 12, screenshots: 0 },
    ...overrides,
  };
}
const complete = (overrides = {}) => createCheckpoint(checkpointInput(overrides));

function findingFor(i) {
  return normaliseFinding({
    engine: { id: 'axe-core', version: '4.14.0' },
    outcome: 'violation',
    ruleId: `rule-${i}`,
    ruleLabel: `Rule ${i}`,
    impact: ['critical', 'serious', 'moderate', 'minor'][i % 4],
    wcag: [`1.4.${(i % 3) + 1}`],
    actRuleIds: [`act${i}`],
    target: { targetTree: [`#target-${i}`], html: `<div id="target-${i}">${'text '.repeat(8)}</div>` },
    html: `<div id="target-${i}">${'text '.repeat(8)}</div>`,
    message: `Finding ${i}`,
  }, { side: 'before', checkpointId: 'home', pagePath: '/node/1' });
}

// ---------------------------------------------------------------- record completeness

test('a complete checkpoint has no problems, and a checkpoint records its provenance', () => {
  const c = complete();
  assert.equal(c.schema, SCHEMA);
  assert.deepEqual(checkpointProblems(c), []);
  // Provenance is part of the record, not of the caller's memory of it.
  assert.equal(c.provenance.source, 'scenario');
  assert.equal(c.provenance.side, 'before');
  assert.equal(c.issue, '3534229');
  assert.equal(c.side, 'before');
  assert.equal(c.provenance.core.commit, 'abcdef12');
  assert.equal(c.page.path, '/node/1');
  assert.ok(Array.isArray(c.findings) && Array.isArray(c.manual));
});

test('removing provenance, environment, page, state.readiness or evidence.engines produces a named problem', () => {
  const cases = [
    ['provenance', (c) => { delete c.provenance; }, 'provenance.source is required'],
    ['environment', (c) => { delete c.environment; }, 'environment.browser is required'],
    ['page', (c) => { delete c.page; }, 'page.path is required'],
    ['state.readiness', (c) => { delete c.state.readiness; }, 'state.readiness is required'],
    ['state', (c) => { delete c.state; }, 'state.readiness is required'],
    ['evidence.engines', (c) => { delete c.evidence; }, 'evidence.engines is required'],
    ['evidence.engines', (c) => { c.evidence = {}; }, 'evidence.engines is required'],
    ['provenance.source', (c) => { c.provenance = { source: '' }; }, 'provenance.source is required'],
  ];
  for (const [label, mutate, expected] of cases) {
    const c = complete();
    mutate(c);
    const problems = checkpointProblems(c);
    assert.ok(problems.includes(expected), `removing ${label} must report "${expected}"; got ${JSON.stringify(problems)}`);
  }
});

test('ids are lower-case identifiers bounded in length; bad ids are rejected by validId and checkpointProblems', () => {
  for (const id of ['Bad ID', '../x', '', 'has space', 'Aupper', '-leading-dash', 'x'.repeat(81)]) {
    assert.equal(validId(id), false, `${JSON.stringify(id)} must not be a valid id`);
  }
  for (const id of ['home', 'a', 'checkpoint-1', 'a.b_c-d', 'x'.repeat(80)]) {
    assert.equal(validId(id), true, `${JSON.stringify(id)} must be a valid id`);
  }
  for (const id of ['Bad ID', '../x', '']) {
    const problems = checkpointProblems(complete({ id }));
    assert.ok(problems.some((p) => p.includes('id must be a lower-case identifier')), `${JSON.stringify(id)} must be rejected; got ${JSON.stringify(problems)}`);
  }
});

test('status must be one of the four documented values', () => {
  assert.deepEqual(STATUSES, ['captured', 'state-not-reached', 'refused', 'tool-error']);
  assert.deepEqual(SIDES, ['before', 'after']);
  for (const status of STATUSES) assert.deepEqual(checkpointProblems(complete({ status })), [], `status ${status} must be accepted`);
  const problems = checkpointProblems(complete({ status: 'bogus' }));
  assert.ok(problems.some((p) => p.includes('status must be one of captured, state-not-reached, refused, tool-error')), JSON.stringify(problems));
});

// ---------------------------------------------------------------- compact record is bounded

test('compactCheckpoint is bounded to 12 findings, reports the rest, and reports distinct totals', () => {
  const findings = Array.from({ length: 40 }, (_, i) => findingFor(i));
  const record = complete({ findings });
  const c = compactCheckpoint(record);

  assert.equal(c.findings.length, 12, 'the compact record keeps at most 12 findings');
  assert.equal(c.moreFindings, 28, 'the remaining 28 findings are counted, not dropped silently');
  assert.equal(c.totals.distinct, 40, 'distinct findings, not observations');
  assert.equal(c.findings[0].target.length <= 140, true);
  assert.equal(c.findings[0].html.length <= 140, true);
  assert.ok(JSON.stringify(c).length < 8 * 1024, `compact JSON must stay under 8 KB, got ${JSON.stringify(c).length} bytes`);
  assert.ok(c.next.includes('Read the full findings'), 'an agent is told to read the full evidence');

  // The bound is a parameter, not a magic number buried in the module.
  const small = compactCheckpoint(record, { maxFindings: 3 });
  assert.equal(small.findings.length, 3);
  assert.equal(small.moreFindings, 37);

  // Distinct findings, not observations: 40 findings seen at 3 checkpoints each are still 40 distinct.
  const repeated = complete({ findings: findings.map((f) => ({ ...f, observations: [{ checkpointId: 'a' }, { checkpointId: 'b' }, { checkpointId: 'c' }] })) });
  const r = compactCheckpoint(repeated);
  assert.equal(r.totals.distinct, 40);
  assert.equal(r.totals.observations, 120);
  assert.equal(r.findings.length, 12);
  assert.equal(r.moreFindings, 28);
});

test('compactCheckpoint: a checkpoint with no findings says so without claiming accessibility', () => {
  const c = compactCheckpoint(complete({ findings: [] }));
  assert.equal(c.totals.distinct, 0);
  assert.equal(c.findings.length, 0);
  assert.equal(c.moreFindings, 0);
  assert.match(c.next, /not proof of accessibility/i);
});

// ---------------------------------------------------------------- equivalence

function eqState(overrides = {}) {
  return {
    id: 'home', sequence: 1, status: 'captured',
    scenario: { id: 'dialog-open' },
    page: { path: '/node/1' },
    environment: { viewport: { width: 1280, height: 720 }, colorScheme: 'light', forcedColors: 'none', reducedMotion: 'no-preference', contrast: 'no-preference' },
    state: { readiness: { satisfied: true }, application: { dialogs: [], expanded: [], visibleText: 'Saved' } },
    focus: { active: { role: 'button', name: 'Save' } },
    ...overrides,
  };
}
const withEnvironment = (state, patch) => ({ ...state, environment: { ...state.environment, ...patch } });
const namedCheck = (result, name) => {
  const check = result.checks.find((c) => c.name === name);
  assert.ok(check, `expected a check named "${name}"; got ${result.checks.map((c) => c.name).join(', ')}`);
  return check;
};

test('equivalence: identical states are equivalent and every check passes', () => {
  const result = equivalence(eqState(), eqState());
  assert.equal(result.equivalent, true);
  assert.ok(result.checks.length > 0);
  assert.deepEqual(result.checks.filter((c) => !c.pass), []);
  assert.ok(result.checks.every((c) => typeof c.name === 'string' && c.name.length));
});

test('equivalence: a different route, viewport or colour scheme fails with a named check', () => {
  const route = equivalence(eqState(), eqState({ page: { path: '/node/2' } }));
  assert.equal(route.equivalent, false);
  assert.equal(namedCheck(route, 'same route').pass, false);

  const viewport = equivalence(eqState(), withEnvironment(eqState(), { viewport: { width: 320, height: 720 } }));
  assert.equal(viewport.equivalent, false);
  assert.equal(namedCheck(viewport, 'same viewport').pass, false);

  const scheme = equivalence(eqState(), withEnvironment(eqState(), { colorScheme: 'dark' }));
  assert.equal(scheme.equivalent, false);
  assert.equal(namedCheck(scheme, 'same colorScheme').pass, false);

  const forced = equivalence(eqState(), withEnvironment(eqState(), { forcedColors: 'active' }));
  assert.equal(forced.equivalent, false);
  assert.equal(namedCheck(forced, 'same forcedColors').pass, false);
});

test('equivalence: a side that did not reach a captured state is not equivalent', () => {
  const result = equivalence(eqState(), eqState({ status: 'state-not-reached' }));
  assert.equal(result.equivalent, false);
  assert.equal(namedCheck(result, 'both reached a captured state').pass, false);
  // A missing side is refused, not silently compared.
  const missing = equivalence(eqState(), null);
  assert.equal(missing.equivalent, false);
  assert.equal(namedCheck(missing, 'both sides captured').pass, false);
});

test('equivalence: dialogOpen requires an open dialog on both sides', () => {
  const open = (on) => (on ? [{ open: true, role: 'dialog', name: 'Confirm' }] : [{ open: false, role: 'dialog', name: 'Confirm' }]);
  const both = equivalence(
    eqState({ state: { readiness: { satisfied: true }, application: { dialogs: open(true), visibleText: 'Saved' } } }),
    eqState({ state: { readiness: { satisfied: true }, application: { dialogs: open(true), visibleText: 'Saved' } } }),
    { dialogOpen: true },
  );
  assert.equal(namedCheck(both, 'a dialog is open on both sides').pass, true);
  assert.equal(both.equivalent, true);

  const oneSide = equivalence(
    eqState({ state: { readiness: { satisfied: true }, application: { dialogs: open(true), visibleText: 'Saved' } } }),
    eqState({ state: { readiness: { satisfied: true }, application: { dialogs: open(false), visibleText: 'Saved' } } }),
    { dialogOpen: true },
  );
  assert.equal(oneSide.equivalent, false);
  assert.equal(namedCheck(oneSide, 'a dialog is open on both sides').pass, false);
});

test('equivalence: expectations.states supports truthy, equals and countMin', () => {
  const truthy = equivalence(eqState(), eqState(), { states: [{ path: 'state.readiness.satisfied' }] });
  assert.equal(truthy.equivalent, true);
  assert.equal(namedCheck(truthy, 'state: state.readiness.satisfied').pass, true);

  const notTruthy = equivalence(
    eqState({ state: { readiness: { satisfied: false }, application: { visibleText: 'Saved' } } }),
    eqState({ state: { readiness: { satisfied: false }, application: { visibleText: 'Saved' } } }),
    { states: [{ path: 'state.readiness.satisfied', truthy: false }] },
  );
  assert.equal(notTruthy.equivalent, true);

  const wrongTruthy = equivalence(
    eqState({ state: { readiness: { satisfied: false }, application: { visibleText: 'Saved' } } }),
    eqState(),
    { states: [{ path: 'state.readiness.satisfied' }] },
  );
  assert.equal(wrongTruthy.equivalent, false);
  assert.equal(namedCheck(wrongTruthy, 'state: state.readiness.satisfied').pass, false);

  const equals = equivalence(eqState(), eqState(), { states: [{ path: 'page.path', equals: '/node/1' }] });
  assert.equal(equals.equivalent, true);
  const wrongEquals = equivalence(eqState(), eqState({ page: { path: '/node/2' } }), { states: [{ path: 'page.path', equals: '/node/1' }] });
  assert.equal(wrongEquals.equivalent, false);
  assert.equal(namedCheck(wrongEquals, 'state: page.path').pass, false);

  const count = equivalence(
    eqState({ state: { readiness: { satisfied: true }, application: { dialogs: [{ open: true }], visibleText: 'Saved' } } }),
    eqState({ state: { readiness: { satisfied: true }, application: { dialogs: [{ open: true }, { open: false }], visibleText: 'Saved' } } }),
    { states: [{ path: 'state.application.dialogs', countMin: 1 }] },
  );
  assert.equal(count.equivalent, true);
  const tooFew = equivalence(eqState(), eqState(), { states: [{ path: 'state.application.dialogs', countMin: 1 }] });
  assert.equal(tooFew.equivalent, false);
  assert.equal(namedCheck(tooFew, 'state: state.application.dialogs').pass, false);
});

test('equivalence: expectations.content fails when the text is missing on either side, and names which side', () => {
  const pass = equivalence(eqState(), eqState(), { content: ['Saved'] });
  assert.equal(pass.equivalent, true);
  assert.equal(namedCheck(pass, 'expected content present on both sides').pass, true);

  const missingAfter = equivalence(
    eqState(),
    eqState({ state: { readiness: { satisfied: true }, application: { dialogs: [], expanded: [], visibleText: 'Done' } } }),
    { content: ['Saved'] },
  );
  assert.equal(missingAfter.equivalent, false);
  const check = namedCheck(missingAfter, 'expected content present on both sides');
  assert.equal(check.pass, false);
  assert.match(check.detail, /missing After: \["Saved"\]/);

  const missingBefore = equivalence(
    eqState({ state: { readiness: { satisfied: true }, application: { dialogs: [], expanded: [], visibleText: 'Done' } } }),
    eqState(),
    { content: ['Saved'] },
  );
  assert.equal(missingBefore.equivalent, false);
  assert.match(namedCheck(missingBefore, 'expected content present on both sides').detail, /missing Before: \["Saved"\]/);
});

// ---------------------------------------------------------------- readiness helpers

test('readinessOf: an explicit condition, clamped, and a clear error otherwise', () => {
  assert.deepEqual(readinessOf('main'), { kind: 'selector', selector: 'main', state: 'visible', timeoutMs: 10000 });
  assert.deepEqual(readinessOf({ expression: '() => true', timeoutMs: 1 }), { kind: 'function', expression: '() => true', timeoutMs: 250 });
  assert.deepEqual(readinessOf({ networkIdle: true, timeoutMs: 999999 }), { kind: 'networkIdle', timeoutMs: 120000 });
  assert.deepEqual(readinessOf(null), READINESS.none());
  assert.throws(() => readinessOf({}), /readiness must be a selector string/);
});

test('checkpointManual: manual work is stored apart from automated findings', () => {
  const state = { dialogs: [{ open: true }], formErrors: [{ field: 'title' }] };
  const findings = [findingFor(0)];
  const manual = checkpointManual(state, { findings, side: 'after' });
  assert.ok(manual.length >= 3);
  for (const m of manual) {
    assert.equal(m.requiresPerson, true);
    assert.equal(m.result, 'not-run');
    assert.equal(m.automated, false);
    assert.equal(m.side, 'after');
  }
  // The checkpoint's manual list is a different list from its automated findings.
  assert.equal(manual.some((m) => Object.hasOwn(m, 'fingerprint')), false);
  assert.equal(findingFor(0).manual, false);
});

// ---------------------------------------------------------------- where a checkpoint came from

test('resolvePageContext: a production site is refused, a loopback fixture is allowed', () => {
  const refused = resolvePageContext('https://example.com/x');
  assert.equal(refused.allowed, false);
  assert.equal(refused.kind, 'not-a-lab-environment');
  assert.equal(typeof refused.reason, 'string');
  assert.ok(refused.reason.length > 20, 'a refusal must explain itself in a sentence');
  assert.match(refused.reason, /not a registered Lab environment|only scans Lab environments/);

  const loopback = resolvePageContext('http://127.0.0.1:8123/x');
  assert.equal(loopback.allowed, true);
  assert.equal(loopback.kind, 'local-fixture');
  assert.equal(loopback.variant, null, 'a local fixture has no variant');
  assert.equal(loopback.env, null);
  assert.equal(loopback.side, null);
  assert.equal(loopback.page.host, '127.0.0.1');
  assert.equal(loopback.page.path, '/x');
});

test('resolvePageContext: a .ddev.site host that is not a built environment is refused', (t) => {
  const hosts = loadEnvHosts();
  if (!hosts.size) {
    t.skip('envs/ has no .ddev/config.yaml files on this machine, so there is no built-environment set to test against');
    return;
  }
  assert.ok(hosts.size >= 1);
  let host = `a11y-test-${process.pid}.ddev.site`;
  while (hosts.has(host)) host = `a11y-test-${process.pid}-${Math.floor(Math.random() * 1e6)}.ddev.site`;
  const result = resolvePageContext(`http://${host}/node/1`);
  assert.equal(result.allowed, false);
  assert.equal(result.kind, 'not-a-lab-environment');
  assert.ok(result.reason.includes(host), `the reason must name the refused host; got ${result.reason}`);
  assert.match(result.reason, /not a registered Lab environment/);
});
