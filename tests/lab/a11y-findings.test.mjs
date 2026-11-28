// Normalising, fingerprinting, deduplicating and classifying engine findings (tools/playwright/lib/a11y/findings.mjs).
// These encode the rules the report depends on: one defect is one finding however many states it was seen in, an engine
// keeps its own identity, and absence from one side is never "fixed" or "new" without an explanation.
//   node --test tests/lab/a11y-findings.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normaliseFinding, normaliseSelector, frameAndShadowContext, dedupeFindings, mergeCheckpointFindings,
  classifyPair, findingTotals, manualChecks, CLASSIFICATIONS,
} from '../../tools/playwright/lib/a11y/findings.mjs';
import { checkpointManual } from '../../tools/playwright/lib/a11y/checkpoint.mjs';

const iso = '2026-11-27T10:00:00.000Z';

// An axe-like raw finding: one rule, one node, identifiers spread over the fields findings.mjs must not flatten.
function rawFinding(overrides = {}) {
  return {
    engine: { id: 'axe-core', version: '4.14.0' },
    outcome: 'violation',
    ruleId: 'color-contrast',
    ruleLabel: 'Elements must meet minimum colour contrast',
    impact: 'serious',
    wcag: ['1.4.3'],
    actRuleIds: ['2779a5'],
    helpUrl: 'https://dequeuniversity.com/rules/axe/4.14/color-contrast',
    target: { targetTree: ['#main a'], target: '#main a', html: '<a href="/x">Read more</a>', xpath: '/html/body/main/a' },
    html: '<a href="/x">Read more</a>',
    message: 'Contrast ratio 2.1:1 is below 4.5:1',
    ...overrides,
  };
}
const normalise = (overrides = {}, meta = {}) => normaliseFinding(rawFinding(overrides), {
  side: 'before', checkpointId: 'home', scenarioId: 'dialog-open', pagePath: '/node/1', ...meta,
});

// ---------------------------------------------------------------- normalisation

test('engine id/version and rule id are preserved, and WCAG/ACT identifiers stay arrays', () => {
  const f = normalise();
  assert.equal(f.engine.id, 'axe-core');
  assert.equal(f.engine.version, '4.14.0');
  assert.equal(f.ruleId, 'color-contrast');
  assert.equal(f.ruleLabel, 'Elements must meet minimum colour contrast');
  assert.ok(Array.isArray(f.wcag), 'wcag must be an array');
  assert.deepEqual(f.wcag, ['1.4.3']);
  assert.ok(Array.isArray(f.actRuleIds), 'actRuleIds must be an array');
  assert.deepEqual(f.actRuleIds, ['2779a5']);
  assert.equal(f.outcome, 'violation');
  assert.equal(f.impact, 'serious');
  assert.equal(f.schema, 'lab-a11y-finding/1');
  assert.equal(f.manual, false, 'an automated finding is not a manual check');
});

test('a nested frame/shadow selector tree is preserved, not flattened to one string', () => {
  const f = normalise({
    target: {
      targetTree: [['iframe#a'], ['button']],
      target: 'iframe#a >>> button',
      html: '<button>Save</button>',
    },
  });
  const tree = f.element.context.targetTree;
  assert.ok(Array.isArray(tree), 'targetTree must stay a list of levels');
  assert.equal(tree.length, 2, `expected two context levels, got ${JSON.stringify(tree)}`);
  assert.equal(tree[0], 'iframe#a');
  assert.equal(tree[1], 'button');
  assert.notEqual(tree[0], 'iframe#a >>> button', 'the tree must not be flattened into one string');
  assert.equal(f.element.selector, 'button', 'the element is the last level, not the whole tree');
  assert.deepEqual(f.element.context.contextPath, ['iframe#a']);
  assert.deepEqual(f.element.context.contextKinds, ['frame-or-shadow-boundary']);

  // frameAndShadowContext is the same decision without an engine attached.
  assert.deepEqual(frameAndShadowContext(['#frame', 'h1']), {
    targetTree: ['#frame', 'h1'], selector: 'h1', contextPath: ['#frame'], contextKinds: ['frame-or-shadow-boundary'],
  });
  assert.deepEqual(frameAndShadowContext([]), { targetTree: [], selector: null, contextPath: [], contextKinds: [] });
});

test('the same engine+rule+selector fingerprints the same across calls, sides and checkpoints', () => {
  const before = normalise({}, { side: 'before', checkpointId: 'home' });
  const after = normalise({}, { side: 'after', checkpointId: 'dialog-open' });
  assert.match(before.fingerprint, /^[0-9a-f]{64}$/);
  assert.equal(before.fingerprint, after.fingerprint, 'one rule failing one selector is one pattern');
  assert.equal(before.displayId, after.displayId);
  // Provenance differs; the identity does not.
  assert.equal(before.provenance.side, 'before');
  assert.equal(after.provenance.checkpointId, 'dialog-open');

  const otherSelector = normalise({ target: { targetTree: ['#main button'], html: '<button>x</button>' } });
  assert.notEqual(otherSelector.fingerprint, before.fingerprint, 'a different selector is a different pattern');

  const otherRule = normalise({ ruleId: 'link-name' });
  assert.notEqual(otherRule.fingerprint, before.fingerprint, 'a different rule is a different pattern');
  assert.equal(otherRule.ruleId, 'link-name');
});

test('positional :nth-of-type()/nth-child() is normalised out of the pattern selector', () => {
  assert.equal(normaliseSelector('div > button:nth-of-type(3)'), 'div > button');
  assert.equal(normaliseSelector('ul li:nth-child(2)'), 'ul li');
  assert.equal(normaliseSelector('section > p:nth-last-of-type(1)'), 'section > p');
  assert.equal(normaliseSelector(''), '(unknown target)');

  const positional = normalise({ target: { targetTree: ['div > button:nth-of-type(3)'], html: '<button>x</button>' } });
  const stable = normalise({ target: { targetTree: ['div > button'], html: '<button>x</button>' } });
  assert.equal(positional.element.normalizedSelector, 'div > button');
  assert.equal(positional.element.selector, 'div > button:nth-of-type(3)', 'the original selector is still recorded for reproduction');
  assert.equal(positional.fingerprint, stable.fingerprint, 'an element moving within its parent is the same defect');
});

// ---------------------------------------------------------------- deduplication

test('the same finding seen at three checkpoints is one distinct finding with three observations', () => {
  const running = new Map();
  const checkpoints = [
    { id: 'home', side: 'before', sequence: 1 },
    { id: 'dialog-open', side: 'after', sequence: 2 },
    { id: 'dialog-closed', side: 'after', sequence: 3 },
  ];
  for (const checkpoint of checkpoints) {
    mergeCheckpointFindings(running, [normalise({}, { side: checkpoint.side, checkpointId: checkpoint.id })], {
      checkpointId: checkpoint.id, side: checkpoint.side, scenarioId: 'dialog-open', when: iso,
      pagePath: '/node/1', sequence: checkpoint.sequence,
    });
  }
  const findings = [...running.values()];
  assert.equal(findings.length, 1, 'one fingerprint must produce one finding, not one per checkpoint');
  assert.equal(findings[0].observations.length, 3);
  assert.deepEqual(findings[0].observations.map((o) => o.checkpointId), ['home', 'dialog-open', 'dialog-closed']);
  assert.deepEqual(findings[0].observations.map((o) => o.sequence), [1, 2, 3]);

  const totals = findingTotals(findings);
  assert.equal(totals.distinct, 1, 'a persistent finding is counted once');
  assert.equal(totals.observations, 3, 'each checkpoint it was seen at is an observation');
  assert.deepEqual(totals.byEngine, { 'axe-core': 1 });
});

test('dedupeFindings merges identical findings and keeps their observations', () => {
  const one = normalise({}, { checkpointId: 'home' });
  one.observations = [{ checkpointId: 'home', sequence: 1 }];
  const two = normalise({}, { checkpointId: 'dialog-open', side: 'after' });
  two.observations = [{ checkpointId: 'dialog-open', sequence: 2 }];
  const different = normalise({ ruleId: 'link-name' });
  different.observations = [{ checkpointId: 'home', sequence: 1 }];

  const { findings, byFingerprint } = dedupeFindings([one, two, different]);
  assert.equal(findings.length, 2);
  assert.equal(byFingerprint.size, 2);
  const merged = findings.find((f) => f.ruleId === 'color-contrast');
  assert.equal(merged.observations.length, 2);
  assert.deepEqual(merged.observations.map((o) => o.checkpointId), ['home', 'dialog-open']);
  assert.equal(findingTotals(findings).distinct, 2);
});

// ---------------------------------------------------------------- classification

const findingOf = (ruleId, extra = {}) => normalise({ ruleId, ...extra }, { side: null, checkpointId: null });

test('classifyPair: new, resolved, existing and changed findings', () => {
  const shared = findingOf('color-contrast');
  const added = findingOf('link-name', { target: { targetTree: ['#main button'], html: '<button>Go</button>' } });

  // Present in After only -> new-regression; present in Before only -> resolved-failure.
  const addedRows = classifyPair({ before: [], after: [added], sameState: true });
  assert.equal(addedRows.length, 1);
  assert.equal(addedRows[0].change, 'new-regression');
  assert.equal(addedRows[0].engine, 'axe-core');
  assert.equal(addedRows[0].ruleId, 'link-name');

  const goneRows = classifyPair({ before: [shared], after: [], sameState: true });
  assert.equal(goneRows.length, 1);
  assert.equal(goneRows[0].change, 'resolved-failure');
  assert.equal(goneRows[0].fingerprint, shared.fingerprint);

  // On both sides, unchanged -> existing-failure.
  const existing = classifyPair({ before: [shared], after: [normalise({})], sameState: true });
  assert.equal(existing.length, 1);
  assert.equal(existing[0].change, 'existing-failure');
  assert.ok(existing[0].before, 'the Before finding is kept for comparison');

  // Any of outcome, impact or html changing turns the pair into changed-finding.
  const changedOutcome = classifyPair({ before: [shared], after: [normalise({ outcome: 'incomplete' })], sameState: true });
  assert.equal(changedOutcome[0].change, 'changed-finding');
  const changedImpact = classifyPair({ before: [shared], after: [normalise({ impact: 'minor' })], sameState: true });
  assert.equal(changedImpact[0].change, 'changed-finding');
  const changedHtml = classifyPair({ before: [shared], after: [normalise({ target: { targetTree: ['#main a'], html: '<a href="/y">Read more</a>' } })], sameState: true });
  assert.equal(changedHtml[0].change, 'changed-finding');
});

test('classifyPair: engines that did not run are rows, never silent passes', () => {
  const rows = classifyPair({
    before: [],
    after: [],
    sameState: true,
    enginesExecuted: ['axe-core'],
    enginesUnsupported: ['equal-access'],
  });
  const unsupported = rows.filter((r) => r.change === 'unsupported-capability');
  assert.equal(unsupported.length, 1);
  assert.equal(unsupported[0].engine, 'equal-access');
  assert.equal(unsupported[0].finding, null);
  const noChange = rows.filter((r) => r.change === 'no-change');
  assert.deepEqual(noChange.map((r) => r.engine), ['axe-core']);

  // An engine that produced a finding keeps its finding row instead of an extra no-change row.
  const withFinding = classifyPair({
    before: [findingOf('color-contrast')], after: [], sameState: true, enginesExecuted: ['axe-core'], enginesUnsupported: [],
  });
  assert.equal(withFinding.some((r) => r.change === 'no-change' && r.engine === 'axe-core'), false);
  assert.equal(withFinding.filter((r) => r.change === 'resolved-failure').length, 1);
});

test('classifyPair: on non-equivalent states, only new/resolved rows are marked unreliable', () => {
  const shared = findingOf('color-contrast');
  const rows = classifyPair({
    before: [shared, findingOf('image-alt')],
    after: [normalise({}), findingOf('link-name', { target: { targetTree: ['#main button'], html: '<button>Go</button>' } })],
    sameState: false,
  });
  const isNewOrResolved = (r) => r.change === 'new-regression' || r.change === 'resolved-failure';
  for (const r of rows.filter(isNewOrResolved)) assert.match(String(r.unreliableBecause), /equivalent states/);
  for (const r of rows.filter((r) => !isNewOrResolved(r))) assert.equal(r.unreliableBecause, undefined);

  // When the states are equivalent, nothing is marked unreliable.
  const reliable = classifyPair({ before: [], after: [shared], sameState: true });
  assert.equal(reliable[0].unreliableBecause, undefined);
  // Every change value is a documented classification.
  for (const r of rows) assert.ok(CLASSIFICATIONS.includes(r.change), `${r.change} must be a documented classification`);
});

// ---------------------------------------------------------------- manual checks

test('manualChecks: dialog questions only when a dialog is present, error association only for form errors', () => {
  const base = manualChecks({});
  assert.deepEqual(base.map((m) => m.id), ['screen-reader-repeat'], 'no component, no component question');

  const dialogs = manualChecks({ dialogs: [{ open: true }] });
  assert.deepEqual(dialogs.map((m) => m.id), ['dialog-context', 'dialog-focus-return', 'screen-reader-repeat']);
  assert.equal(manualChecks({ dialogs: [] }).some((m) => m.id.startsWith('dialog')), false);

  assert.equal(manualChecks({}).some((m) => m.id === 'error-association'), false);
  assert.equal(manualChecks({ formErrors: [{ field: 'title' }] }).some((m) => m.id === 'error-association'), true);

  for (const state of [{}, { dialogs: [{ open: true }] }, { formErrors: [{ field: 'title' }] }]) {
    for (const check of manualChecks(state)) {
      assert.equal(check.requiresPerson, true, `${check.id} must require a person`);
      assert.equal(check.result, 'not-run', `${check.id} has not been performed`);
      assert.equal(check.automated, false, `${check.id} is not an automated result`);
      assert.equal(typeof check.question, 'string');
      assert.equal(typeof check.procedure, 'string');
      assert.equal(typeof check.why, 'string');
    }
  }
});

test('manualChecks: a checkpoint manual item is separate from its automated findings', () => {
  const state = { dialogs: [{ open: true }], formErrors: [{ field: 'title', message: 'Required' }] };
  const automated = findingOf('color-contrast');
  const manual = checkpointManual(state, { findings: [automated], side: 'after' });
  assert.ok(manual.some((m) => m.id === 'dialog-context'));
  assert.ok(manual.some((m) => m.id === 'error-association'));
  for (const m of manual) {
    assert.equal(m.automated, false);
    assert.equal(m.requiresPerson, true);
    assert.equal(m.result, 'not-run');
    assert.equal(m.side, 'after', 'a manual check knows which side it belongs to');
  }
  assert.equal(automated.manual, false);
  assert.equal(manual.some((m) => Object.hasOwn(m, 'fingerprint')), false, 'manual checks are not findings');
});

test('site-random Drupal ids are normalised out of a finding, so two identical sites do not look different', async () => {
  const { normaliseSelector, normaliseHtml, normaliseFinding, classifyPair } = await import('../../tools/playwright/lib/a11y/findings.mjs');
  const one = normaliseSelector('#navigation-link--navigationcreate-1676520538 > button > span:nth-of-type(1)');
  const two = normaliseSelector('#navigation-link--navigationcreate-652154234 > button > span:nth-of-type(1)');
  assert.equal(one, two);
  assert.match(one, /-RANDOM/);
  assert.equal(normaliseSelector('#admin-toolbar__scroll-wrapper-935526640'), '#admin-toolbar__scroll-wrapper-RANDOM');
  assert.equal(normaliseSelector('#edit-field-body-0-value'), '#edit-field-body-0-value', 'a meaningful id is not touched');
  assert.equal(normaliseSelector('#e0a1b2c3d4e5f60718293a4b5c6d7e8f'), '#HEX');
  assert.equal(normaliseHtml('<span id="x--navigationcreate-1676520538">a</span>'), normaliseHtml('<span id="x--navigationcreate-652154234">a</span>'));

  const raw = (selector, id) => ({ engine: { id: 'htmlcs', version: '2.5.1' }, outcome: 'violation', ruleId: 'WCAG2AA.Principle1.Guideline1_4.1_4_3.G18.Abs', wcag: ['1.4.3'], target: { target: selector, html: '<span id="' + id + '">x</span>' }, html: '<span id="' + id + '">x</span>', message: 'contrast' });
  const before = normaliseFinding(raw('#navigation-link--navigationcreate-1676520538 > button > span', 'navigation-link--navigationcreate-1676520538'), { side: 'before', checkpointId: 'editor-initialized', pagePath: '/node/add/page' });
  const after = normaliseFinding(raw('#navigation-link--navigationcreate-652154234 > button > span', 'navigation-link--navigationcreate-652154234'), { side: 'after', checkpointId: 'editor-initialized', pagePath: '/node/add/page' });
  assert.equal(before.fingerprint, after.fingerprint, 'the same rule on the same element has one identity across two builds');
  const rows = classifyPair({ before: [before], after: [after], sameState: true, enginesExecuted: ['htmlcs'] });
  assert.deepEqual(rows.filter((r) => r.finding).map((r) => r.change), ['existing-failure'], 'it is an existing failure, not a new regression and a resolved one');
});
