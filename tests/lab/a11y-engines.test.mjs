// The scanner-engine interface (tools/playwright/lib/a11y/engines.mjs): every adapter declares its capabilities before it
// is allowed near a live page, an engine that cannot inspect the reached state is refused rather than run against a
// different page, and a profile typo is an error rather than a smaller scan. No browser and no network: engines that need
// a page are exercised only up to the point where they are refused or reported not run.
//   node --test tests/lab/a11y-engines.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  REQUIRED_CAPABILITIES, PRODUCTION_ENGINES, FIXTURE_ENGINE, PROFILES, ALL_COLLECTORS,
  validateAdapter, resolveProfile, runEngines, describeEngines, executionLine,
} from '../../tools/playwright/lib/a11y/engines.mjs';

const adapter = (id) => PRODUCTION_ENGINES.find((a) => a.id === id);

test('every production engine adapter honours the interface (validateAdapter returns [])', () => {
  const problems = PRODUCTION_ENGINES.flatMap((a) => validateAdapter(a).map((p) => `${a.id}: ${p}`));
  assert.deepEqual(problems, []);
  assert.deepEqual(validateAdapter(FIXTURE_ENGINE), [], 'the fixture engine must honour the same interface');
});

test('the fixture engine is test-only and is not a production engine', () => {
  assert.equal(PRODUCTION_ENGINES.includes(FIXTURE_ENGINE), false);
  assert.equal(PRODUCTION_ENGINES.some((a) => a.id === FIXTURE_ENGINE.id), false);
  assert.equal(REQUIRED_CAPABILITIES.every((k) => typeof k === 'string'), true);
});

test('capability declarations are synchronous data and declare every required field', () => {
  const problems = [];
  for (const a of PRODUCTION_ENGINES) {
    const caps = a.capabilities();
    if (caps && typeof caps.then === 'function') {
      problems.push(`${a.id}: capabilities() returned a Promise; the declaration must be synchronous data`);
      continue;
    }
    for (const key of REQUIRED_CAPABILITIES) {
      if (!(key in (caps || {}))) problems.push(`${a.id}: capabilities() is missing ${key}`);
      else if (caps[key] === undefined) problems.push(`${a.id}: capabilities().${key} is undefined`);
    }
  }
  assert.deepEqual(problems, []);
});

test('axe-core and HTML_CodeSniffer declare they can read the live page without navigating', async () => {
  for (const id of ['axe-core', 'htmlcs']) {
    const caps = await adapter(id).capabilities();
    assert.equal(caps.id, id);
    assert.equal(caps.livePage, true, `${id} must declare livePage`);
    assert.equal(caps.preservesState, true, `${id} must not change the state it inspects`);
    assert.equal(caps.requiresNavigation, false, `${id} must not need its own navigation`);
    assert.equal(typeof caps.license, 'string');
    assert.ok(caps.license.length);
    assert.equal(typeof caps.ruleset, 'string');
  }
});

test('equal-access declares it cannot inspect the live page, so it is refused for live checkpoints', async () => {
  const caps = await adapter('equal-access').capabilities();
  assert.equal(caps.livePage === false || caps.requiresNavigation === true, true);
  assert.equal(caps.livePage, false, 'its API renders the page itself');
  assert.equal(caps.requiresNavigation, true);
  assert.equal(caps.preservesState, false);
});

test('describeEngines: production list excludes the fixture, and the fixture is listed only when allowed', async () => {
  const production = await describeEngines();
  assert.deepEqual(production.map((e) => e.id), ['axe-core', 'htmlcs', 'equal-access']);
  assert.equal(production.some((e) => e.id === FIXTURE_ENGINE.id), false);
  assert.equal(production.every((e) => typeof e.available === 'boolean'), true);

  const withFixtures = await describeEngines({ allowFixtures: true });
  assert.deepEqual(withFixtures.map((e) => e.id), ['axe-core', 'htmlcs', 'equal-access', FIXTURE_ENGINE.id]);
  const equalAccess = withFixtures.find((e) => e.id === 'equal-access');
  assert.equal(equalAccess.livePage, false);
  assert.equal(equalAccess.requiresNavigation, true);
  // Every declaration carries the fields the report prints.
  for (const e of withFixtures) for (const key of REQUIRED_CAPABILITIES) assert.ok(key in e, `${e.id} is missing ${key}`);
});

test('resolveProfile: the six documented profiles and their engine/collector sets', () => {
  assert.deepEqual(Object.keys(PROFILES).sort(), ['dynamic', 'full', 'multi-engine', 'quick', 'semantic', 'visual']);
  const expected = {
    quick: { engines: ['axe-core'], collectors: ['focus'] },
    semantic: { engines: [], collectors: ['tree', 'focus'] },
    visual: { engines: [], collectors: ['visual', 'screenshots', 'focus'] },
    dynamic: { engines: [], collectors: ['speech', 'ajax', 'focus', 'console'] },
    'multi-engine': { engines: ['axe-core', 'htmlcs'], collectors: ['focus'] },
    full: { engines: ['axe-core', 'htmlcs'], collectors: ['tree', 'focus', 'visual', 'screenshots', 'speech', 'ajax', 'console'] },
  };
  for (const [name, wanted] of Object.entries(expected)) {
    const resolved = resolveProfile(name);
    assert.equal(resolved.name, name);
    assert.deepEqual(resolved.engines, wanted.engines, `${name} engines`);
    assert.deepEqual(resolved.collectors, wanted.collectors, `${name} collectors`);
    assert.equal(typeof resolved.label, 'string');
    for (const c of resolved.collectors) assert.ok(ALL_COLLECTORS.includes(c), `${name}: ${c} is not a known collector`);
  }
  assert.deepEqual(resolveProfile('full').collectors, ALL_COLLECTORS, 'full is every collector');
});

test('resolveProfile: overrides work, but an unknown profile, engine or collector is an error', () => {
  assert.deepEqual(resolveProfile('quick', { engines: ['htmlcs'], collectors: ['tree'] }), {
    name: 'quick', label: PROFILES.quick.label, engines: ['htmlcs'], collectors: ['tree'], warnings: [],
  });
  assert.throws(() => resolveProfile('no-such-profile'), /unknown profile "no-such-profile"; use one of quick, semantic, visual, dynamic, multi-engine, full/);
  assert.throws(() => resolveProfile('quick', { engines: ['not-an-engine'] }), /unknown engine "not-an-engine"/);
  assert.throws(() => resolveProfile('quick', { collectors: ['not-a-collector'] }), /unknown collector "not-a-collector"/);
  // Fixtures are opt-in: an agent cannot select one by accident.
  assert.throws(() => resolveProfile('quick', { engines: [FIXTURE_ENGINE.id] }), /unknown engine "fixture-engine"/);
  assert.deepEqual(resolveProfile('quick', { engines: [FIXTURE_ENGINE.id] }, { allowFixtures: true }).engines, ['fixture-engine']);
});

test('resolveProfile: a missing engine is warned about, not silently dropped', () => {
  const warned = resolveProfile('quick', {}, { availableEngines: [] });
  assert.equal(warned.warnings.length, 1);
  assert.match(warned.warnings[0], /axe-core is not installed and will be reported as not run/);

  const quiet = resolveProfile('quick', {}, { availableEngines: ['axe-core'] });
  assert.deepEqual(quiet.warnings, []);
});

test('runEngines: an unknown or unavailable engine is reported, never dropped', async () => {
  const unknown = await runEngines(null, { engines: ['does-not-exist'] });
  assert.equal(unknown.length, 1);
  assert.equal(unknown[0].execution.status, 'not-run');
  assert.match(String(unknown[0].execution.error), /unknown engine/);
  assert.deepEqual(unknown[0].findings, []);

  // equal-access is unavailable here; when it is installed, runEngines must reach the capability refusal instead.
  const equalAccess = adapter('equal-access');
  const available = await equalAccess.available();
  const [result] = await runEngines(null, { engines: ['equal-access'] });
  assert.equal(result.execution.status, available ? 'unsupported' : 'not-run');
  if (available) assert.match(String(result.execution.error), /navigation|cannot inspect/i);
  else assert.match(String(result.execution.error), /not installed|unavailable/i);
  assert.deepEqual(result.findings, []);
});

test('runEngines: an engine that needs its own navigation refuses itself as unsupported', async () => {
  // No page object is passed: this is exactly the refusal path, not a run against some other page.
  const [result] = await runEngines(null, { engines: ['equal-access'] });
  const ownRefusal = await adapter('equal-access').run();
  assert.equal(ownRefusal.execution.status, 'unsupported');
  assert.match(String(ownRefusal.execution.error), /navigation|cannot inspect/i);
  assert.deepEqual(ownRefusal.findings, []);
  // Without its package installed, runEngines stops earlier: "not run" is still not a pass.
  assert.ok(['not-run', 'unsupported'].includes(result.execution.status), `unexpected status ${result.execution.status}`);
});

test('executionLine: one honest sentence per engine status', () => {
  const line = (execution, findings = [], engine = { label: 'axe-core', version: '4.14.0' }) => executionLine({ engine, execution, findings });
  assert.match(line({ status: 'executed' }, [{}, {}]), /axe-core 4\.14\.0: executed, 2 finding\(s\)/);
  assert.match(line({ status: 'executed' }, []), /axe-core 4\.14\.0: executed, no findings/);
  assert.match(line({ status: 'partial', skipped: [{}, {}] }), /partially executed \(2 frame\(s\) skipped\)/);
  assert.match(line({ status: 'failed', error: 'boom' }), /FAILED \(boom\)/);
  assert.match(line({ status: 'unsupported', error: 'needs its own navigation' }), /unsupported for live checkpoints/);
  assert.match(line({ status: 'not-run', error: 'not installed' }), /not run \(not installed\)/);
});
