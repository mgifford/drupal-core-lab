// Deterministic energy accounting tests. No DDEV, no network, no model. Synthetic coefficients are labelled synthetic;
// the bridge tests use the real pinned CLEER dataset, whose values are fixed by the committed checksum.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { makeEvent, validateEvent } from '../../tools/resource/events.mjs';
import { assertPublic, publicProblems } from '../../tools/resource/public.mjs';
import { dataset, checkRatioConsistency, ratioFor, tierRatios } from '../../tools/resource/energy/cleer.mjs';
import { verifyDataset } from '../../tools/resource/energy/provenance.mjs';
import { loadMapping, validateMapping, resolveModel, useCaseFor } from '../../tools/resource/energy/model-mapping.mjs';
import { estimateEvent, energySummary, isAiEvent, costOf, METHOD } from '../../tools/resource/energy/bridge.mjs';
import { loadFactorSet, estimateWithCoefficients, validateFactorSet } from '../../tools/resource/energy/factor-loader.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES = path.join(here, '..', 'fixtures', 'energy');
const NOW = '2026-01-01T00:00:00Z';
const mapping = loadMapping();

const event = (over = {}) => ({
  event_type: 'ai-request', occurred_at: '2026-10-05T10:00:00Z', activity: 'validation',
  tool: 'claude-code', model: 'claude-sonnet-5-5', provider: 'anthropic', issue: '123',
  measurements: {
    tokens: { input_total: 1000, uncached_input: 100, output: 20, cache_creation: 30, cache_read: 850, reasoning: 5, model_requests: 1, token_basis: 'provider-reported' },
    cost: { reported_usd: null, estimated_usd: 1.0, basis: 'client-reported-estimate', note: null },
  },
  accounting: { counted: true },
  source: { adapter: 'test' },
  ...over,
});

test('the vendored dataset is intact and every published ratio matches energy / cost', () => {
  const verify = verifyDataset();
  assert.equal(verify.ok, true, verify.problems.join('; '));
  assert.equal(verify.published_checksum, verify.files['models.json'].sha256);
  let checked = 0;
  for (const entry of dataset().ratios.values()) {
    const result = checkRatioConsistency(entry);
    assert.equal(result.ok, true, `${entry.model_name} ${entry.use_case}.${entry.tier}: published ${result.published} computed ${result.computed}`);
    checked++;
  }
  assert.equal(checked, 306);
});

test('a checksum mismatch fails closed', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'energy-tamper-'));
  const models = '{"models":[]}';
  const meta = JSON.stringify({ schemaVersion: '1.1.0', methodology: { engine: 'x' }, sha256: 'deadbeef' });
  fs.writeFileSync(path.join(dir, 'models.json'), models);
  fs.writeFileSync(path.join(dir, 'meta.json'), meta);
  fs.writeFileSync(path.join(dir, 'provenance.json'), JSON.stringify({
    source: { pin: 'x' }, methodology: { dataset_schema_version: '1.1.0', engine: 'x' }, files: { 'models.json': { sha256: 'deadbeef' } },
  }));
  const bad = verifyDataset({ dir });
  assert.equal(bad.ok, false);
  assert.ok(bad.problems.some((p) => p.includes('checksum mismatch')));
});

test('the bridge multiplies the published intensity by the measured cost', () => {
  const e = estimateEvent(event(), { mapping });
  assert.equal(e.status, 'estimated');
  assert.equal(e.basis, 'cost-bridge');
  assert.equal(e.method_version, METHOD);
  assert.equal(e.energy_wh_per_usd, 8.14);
  assert.equal(e.central_wh, 8.14);
  assert.equal(e.workload_low_wh, 8.14);
  assert.equal(e.workload_high_wh, 8.35);
  assert.equal(e.dataset.licence, 'CC BY-NC 4.0');
  assert.equal(e.model_mapping.match_type, 'proxy');
  assert.equal(e.model_mapping.review_status, 'unreviewed');
  assert.equal(e.uncertainty.kind, 'scenario-band');
});

test('a measured zero cost stays a zero estimate', () => {
  const e = estimateEvent(event({ measurements: { ...event().measurements, cost: { reported_usd: null, estimated_usd: 0, basis: 'client-reported-estimate', note: null } } }), { mapping });
  assert.equal(e.status, 'estimated');
  assert.equal(e.central_wh, 0);
  assert.equal(e.workload_low_wh, 0);
  assert.equal(e.configuration_low_wh, 0);
});

test('missing, negative and allowance costs are unavailable, not zero', () => {
  const base = event();
  const missing = estimateEvent({ ...base, measurements: { ...base.measurements, cost: { reported_usd: null, estimated_usd: null, basis: 'unavailable', note: null } } }, { mapping });
  assert.equal(missing.status, 'unavailable');
  assert.equal(missing.unavailable_code, 'missing_cost');
  const negative = estimateEvent({ ...base, measurements: { ...base.measurements, cost: { reported_usd: null, estimated_usd: -1, basis: 'estimated', note: null } } }, { mapping });
  assert.equal(negative.unavailable_code, 'invalid_cost');
  const allowance = estimateEvent({ ...base, measurements: { ...base.measurements, cost: { reported_usd: null, estimated_usd: 5, basis: 'subscription-allowance', note: null } } }, { mapping });
  assert.equal(allowance.unavailable_code, 'cost_not_a_charge');
});

test('an unmapped model keeps its tokens but has no energy estimate', () => {
  const e = estimateEvent(event({ model: 'some-unknown-model' }), { mapping });
  assert.equal(e.status, 'unavailable');
  assert.equal(e.unavailable_code, 'unsupported_model');
  assert.equal(e.model_mapping.match_type, 'unsupported');
});

test('model matching is exact, alias, proxy, ambiguous or unsupported, never fuzzy', () => {
  assert.equal(resolveModel('Claude Sonnet 5', { mapping: { models: [] } }).match_type, 'exact');
  assert.equal(resolveModel('claude-sonnet-9', { mapping: { models: [] } }).match_type, 'unsupported');
  assert.equal(resolveModel('claude-sonnet-5-5', { mapping }).match_type, 'proxy');
  const alias = resolveModel('lab-alias', { mapping: { models: [{ input_model: 'lab-alias', dataset_model: 'Claude Sonnet 5', match_type: 'alias' }] } });
  assert.equal(alias.match_type, 'alias');
  const ambiguous = resolveModel('Claude Sonnet 5', { mapping: { models: [] }, models: [{ name: 'Claude Sonnet-5' }, { name: 'Claude Sonnet 5' }] });
  assert.equal(ambiguous.match_type, 'ambiguous');
  assert.equal(resolveModel('nothing', { mapping }).match_type, 'unsupported');
});

test('mapping validation rejects an unknown dataset model and a bad use case', () => {
  const problems = validateMapping({ models: [{ input_model: 'x', dataset_model: 'Not A Model' }], use_case_by_activity: { default: 'sideways' }, default_tier: 'medium' });
  assert.ok(problems.some((p) => p.includes('not in the dataset')));
  assert.ok(problems.some((p) => p.includes('sideways')));
  assert.ok(problems.some((p) => p.includes('medium')));
});

test('use case is configured per activity, not inferred', () => {
  assert.equal(useCaseFor('model-evaluation', mapping), 'chat');
  assert.equal(useCaseFor('validation', mapping), 'agentic');
  assert.equal(useCaseFor('something-else', mapping), 'agentic');
});

test('a model whose SD is null has no configuration band, and it is null, not zero', () => {
  const custom = { ...mapping, models: [{ input_model: 'deepseek-v3', dataset_model: 'DeepSeek V3', match_type: 'exact', review_status: 'reviewed' }] };
  const e = estimateEvent(event({ model: 'deepseek-v3' }), { mapping: custom });
  assert.equal(e.status, 'estimated');
  assert.equal(e.configuration_low_wh, null);
  assert.equal(e.configuration_high_wh, null);
  assert.ok(e.workload_low_wh > 0);
});

test('the workload band spans the three published tiers', () => {
  const tiers = tierRatios('Claude Sonnet 5', 'agentic');
  assert.deepEqual(Object.keys(tiers).sort(), ['heavy', 'light', 'typical']);
  const e = estimateEvent(event({ measurements: { ...event().measurements, cost: { reported_usd: null, estimated_usd: 10, basis: 'client-reported-estimate', note: null } } }), { mapping });
  assert.equal(e.central_wh, 81.4);
  assert.equal(e.workload_low_wh, 81.4);
  assert.equal(e.workload_high_wh, 83.5);
});

test('two methods exist and are labelled separately; they are never merged', () => {
  const factor = loadFactorSet(path.join(FIXTURES, 'factors-synthetic.json'));
  const e = estimateWithCoefficients({ model: 'Synthetic Model A', measurements: { tokens: { uncached_input: 1000, output: 2000 } } }, factor);
  assert.equal(e.basis, 'coefficient');
  assert.equal(e.method_version, 'coefficient-v1');
  assert.equal(e.synthetic, true);
  const b = estimateEvent(event(), { mapping });
  assert.equal(b.basis, 'cost-bridge');
  assert.notEqual(b.basis, e.basis);
  assert.ok(!('synthetic' in b));
});

test('synthetic coefficients: categories are summed and reasoning is not added twice', () => {
  const factor = loadFactorSet(path.join(FIXTURES, 'factors-synthetic.json'));
  const e = estimateWithCoefficients({
    model: 'Synthetic Model A',
    measurements: { tokens: { uncached_input: 1000, cache_read: 10000, cache_creation: 5000, output: 2000, reasoning: 500 } },
  }, factor);
  assert.equal(e.central_wh, 12);
  assert.equal(e.lower_wh, 6);
  assert.equal(e.upper_wh, 18);
  assert.equal(e.coverage.status, 'complete');
  const withMoreReasoning = estimateWithCoefficients({
    model: 'Synthetic Model A',
    measurements: { tokens: { uncached_input: 1000, cache_read: 10000, cache_creation: 5000, output: 2000, reasoning: 50000 } },
  }, factor);
  assert.equal(withMoreReasoning.central_wh, 12);
});

test('a missing coefficient makes the result partial and lists the category', () => {
  const factor = loadFactorSet(path.join(FIXTURES, 'factors-synthetic.json'));
  const e = estimateWithCoefficients({
    model: 'Synthetic Model A',
    measurements: { tokens: { uncached_input: 1000, cache_read: 10000, cache_creation: 5000, output: 2000, total_input: 16000 } },
  }, { ...factor, models: factor.models.map((m) => m.model === 'Synthetic Model A' ? { ...m, coefficients: { ...m.coefficients, cache_creation: { central: null, lower: null, upper: null, status: 'unavailable' } } } : m) });
  assert.equal(e.coverage.status, 'partial');
  assert.deepEqual(e.coverage.missing_categories, ['cache_creation']);
  assert.equal(e.central_wh, 1 + 1 + 4);
});

test('a synthetic zero-token category contributes zero, not a missing value', () => {
  const factor = loadFactorSet(path.join(FIXTURES, 'factors-synthetic.json'));
  const e = estimateWithCoefficients({ model: 'Synthetic Model A', measurements: { tokens: { uncached_input: 0, cache_read: 1000, cache_creation: 0, output: 0 } } }, factor);
  assert.equal(e.central_wh, 0.1);
  assert.equal(e.coverage.status, 'complete');
});

test('energy units convert to Wh: kWh and J', () => {
  const kwh = loadFactorSet(path.join(FIXTURES, 'factors-synthetic-kwh.json'));
  const e = estimateWithCoefficients({ model: 'Synthetic kWh Model', measurements: { tokens: { uncached_input: 1000, output: 2000 } } }, kwh);
  assert.equal(e.central_wh, 5);
  assert.equal(e.lower_wh, 2.5);
  assert.equal(e.upper_wh, 7.5);
  const joules = { ...loadFactorSet(path.join(FIXTURES, 'factors-synthetic.json')), units: { energy: 'J', tokens: 'count' } };
  const j = estimateWithCoefficients({ model: 'Synthetic Model A', measurements: { tokens: { uncached_input: 1000, cache_read: 10000, cache_creation: 5000, output: 2000 } } }, joules);
  assert.ok(Math.abs(j.central_wh - 12 / 3600) < 1e-6, String(j.central_wh));
});

test('aggregate uncertainty is correlated: the band is a sum, not a root-sum-square', () => {
  const events = [
    event({ measurements: { ...event().measurements, cost: { reported_usd: null, estimated_usd: 10, basis: 'client-reported-estimate', note: null } } }),
    event({ model: 'claude-opus-5-5', measurements: { ...event().measurements, cost: { reported_usd: null, estimated_usd: 10, basis: 'client-reported-estimate', note: null } } }),
  ];
  const s = energySummary(events, { mapping, now: NOW });
  const per = events.map((e) => estimateEvent(e, { mapping }));
  assert.equal(s.totals.events, 2);
  assert.equal(s.totals.central_wh, 125.7);
  assert.equal(s.totals.workload_low_wh, 125.7);
  assert.equal(s.totals.workload_high_wh, 129.9);
  // Correlated aggregation: the total band is the sum of the per-event bands, not a root-sum-square.
  assert.equal(s.totals.configuration_low_wh, Number(per.reduce((a, e) => a + e.configuration_low_wh, 0).toFixed(6)));
  assert.equal(s.totals.configuration_high_wh, Number(per.reduce((a, e) => a + e.configuration_high_wh, 0).toFixed(6)));
});

test('the golden totals fixture matches the estimator', () => {
  const expected = JSON.parse(fs.readFileSync(path.join(FIXTURES, 'expected-totals.json'), 'utf8'));
  const events = [
    event({ measurements: { ...event().measurements, cost: { reported_usd: null, estimated_usd: 10, basis: 'client-reported-estimate', note: null } } }),
    event({ model: 'claude-opus-5-5', measurements: { ...event().measurements, cost: { reported_usd: null, estimated_usd: 10, basis: 'client-reported-estimate', note: null } } }),
  ];
  const s = energySummary(events, { mapping, now: NOW });
  for (const key of ['events', 'central_wh', 'workload_low_wh', 'workload_high_wh', 'configuration_low_wh', 'configuration_high_wh']) {
    assert.equal(s.totals[key], expected[key], key);
  }
  assert.equal(s.totals.cost_usd, expected.cost_usd);
});

test('an uncounted session roll-up is excluded and a counted one is included', () => {
  const rollup = event({ event_type: 'ai-usage', accounting: { counted: false } });
  const counted = event({ event_type: 'ai-usage', accounting: { counted: true } });
  const monitor = event({ activity: 'monitoring', accounting: undefined });
  assert.equal(isAiEvent(rollup), false);
  assert.equal(isAiEvent(counted), true);
  assert.equal(isAiEvent(monitor), false);
  const s = energySummary([rollup, counted, monitor], { mapping, now: NOW });
  assert.equal(s.totals.events, 1);
  assert.equal(s.totals.central_wh, 8.14);
});

test('the summary is reproducible and sanitised', () => {
  const events = [event()];
  const a = energySummary(events, { mapping, now: NOW });
  const b = energySummary(events, { mapping, now: NOW });
  assert.equal(JSON.stringify(a), JSON.stringify(b));
  assert.doesNotThrow(() => assertPublic(a, 'energy summary'));
  assert.deepEqual(publicProblems(a), []);
  const text = JSON.stringify(a);
  assert.ok(!/\/Users\/|\/home\/|\.lab-cache|~\/\.claude/.test(text));
});

test('the event schema accepts an energy block and still accepts a 1.0.0 event', () => {
  const withEnergy = makeEvent({
    event_type: 'ai-request', occurred_at: '2026-10-05T10:00:00Z', activity: 'validation', tool: 'test', model: 'claude-sonnet-5-5', provider: 'anthropic',
    measurements: { energy: { status: 'estimated', basis: 'cost-bridge', method_version: METHOD, central_wh: 8.14, dataset: { version: 'CLEER-Text-0926/1.1.0', checksum: 'x' }, model_mapping: { input_model: 'claude-sonnet-5-5', dataset_model: 'Claude Sonnet 5', match_type: 'proxy', review_status: 'unreviewed', confidence: 0.75 }, coverage: { status: 'complete', missing_categories: [] } } },
    source: { adapter: 'test' },
  });
  assert.equal(validateEvent(withEnergy).ok, true, validateEvent(withEnergy).errors.map((e) => e.message).join('; '));
  const legacy = { ...withEnergy, schema_version: '1.0.0' };
  delete legacy.measurements.energy;
  assert.equal(validateEvent(legacy).ok, true);
  const bad = { ...withEnergy, measurements: { ...withEnergy.measurements, energy: { status: 'estimated', basis: 'cost-bridge', bogus: 1 } } };
  assert.equal(validateEvent(bad).ok, false);
});

test('an estimate from the bridge validates as a measurements.energy block', () => {
  const est = estimateEvent(event(), { mapping });
  assert.equal(est.status, 'estimated');
  const ev = makeEvent({
    event_type: 'ai-request', occurred_at: '2026-10-05T10:00:00Z', activity: 'validation', tool: 'test',
    model: 'claude-sonnet-5-5', provider: 'anthropic',
    measurements: { energy: est },
    source: { adapter: 'test' },
  });
  const v = validateEvent(ev);
  assert.equal(v.ok, true, v.errors.map((e) => e.message).join('; '));
});

test('unavailable estimates keep their cost, so cost coverage can fall below 100%', () => {
  const ev = event({ model: 'a-model-not-in-clever', measurements: { ...event().measurements, cost: { reported_usd: null, estimated_usd: 10, basis: 'client-reported-estimate', note: null } } });
  const est = estimateEvent(ev, { mapping });
  assert.equal(est.status, 'unavailable');
  assert.equal(est.unavailable_code, 'unsupported_model');
  assert.equal(est.cost.usd, 10);
  const s = energySummary([ev], { mapping, now: NOW });
  assert.equal(s.totals.cost_usd, 10);
  assert.equal(s.totals.cost_covered_usd, 0);
  assert.equal(s.coverage.cost_covered_share, 0);
});

test('a model-less AI event is counted as unavailable, not dropped', () => {
  const ev = event({ model: null });
  assert.equal(isAiEvent(ev), true);
  const est = estimateEvent(ev, { mapping });
  assert.equal(est.status, 'unavailable');
  assert.equal(est.unavailable_code, 'missing_model');
  const s = energySummary([ev], { mapping, now: NOW });
  assert.equal(s.coverage.ai_events, 1);
  assert.equal(s.coverage.estimated, 0);
});

test('the verbosity-adjusted intensity is a sensitivity, not part of the headline', () => {
  const est = estimateEvent(event(), { mapping });
  assert.ok(est.vadj_central_wh > est.central_wh, 'the adjusted column should be higher for the mapped agentic models');
  const s = energySummary([event()], { mapping, now: NOW });
  assert.equal(s.method.intensity_column, 'energy_wh_per_usd');
  assert.equal(s.method.adjusted_column, 'vadj_energy_wh_per_usd');
  assert.ok(s.totals.vadj_central_wh > s.totals.central_wh);
  assert.equal(s.totals.central_wh, est.central_wh);
});

test('the library modules never touch the network', () => {
  for (const file of ['cleer.mjs', 'bridge.mjs', 'model-mapping.mjs', 'factor-loader.mjs', 'provenance.mjs']) {
    const text = fs.readFileSync(path.join(here, '..', '..', 'tools', 'resource', 'energy', file), 'utf8');
    assert.ok(!/\bfetch\s*\(/.test(text), `${file} must not fetch`);
    assert.ok(!/https?:\/\//.test(text), `${file} must not hard-code a URL`);
  }
});

test('a factor set that does not validate is refused', () => {
  const broken = JSON.parse(fs.readFileSync(path.join(FIXTURES, 'factors-synthetic.json'), 'utf8'));
  broken.units.energy = 'BTU';
  broken.models[0].coefficients.output.central = -1;
  const check = validateFactorSet(broken, 'broken.json');
  assert.equal(check.ok, false);
  assert.ok(check.errors.length >= 2);
});

test('costOf prefers a provider-reported cost and never invents one', () => {
  assert.deepEqual(costOf({ measurements: { cost: { reported_usd: 2, estimated_usd: 3, basis: 'provider-reported' } } }), { usd: 2, basis: 'provider-reported' });
  assert.deepEqual(costOf({ measurements: { cost: { reported_usd: null, estimated_usd: 3, basis: 'estimated' } } }), { usd: 3, basis: 'estimated' });
  assert.deepEqual(costOf({ measurements: { cost: { reported_usd: null, estimated_usd: null, basis: 'unavailable' } } }), { usd: null, basis: 'unavailable' });
});

test('ratio and tier helpers expose only published numbers', () => {
  const r = ratioFor('Claude Sonnet 5', 'agentic', 'typical');
  assert.equal(r.energy_wh_per_usd, 8.14);
  assert.ok(r.relative_sd > 0 && r.relative_sd < 1);
  assert.equal(ratioFor('Not A Model', 'agentic', 'typical'), null);
});
