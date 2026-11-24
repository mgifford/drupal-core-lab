// Unit tests for the observability evidence layer. No DDEV, no browser, no network.
// Run: node --test tests/lab/observability.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { labRoot } from '../../tools/compare/lib.mjs';
import { validateEvidence, assertEvidence } from '../../tools/observability/schema.mjs';
import { buildEvidence, mergeRequest, compareEvidence, summaryMarkdown, summaryJson, referentialProblems, assertReferentialIntegrity } from '../../tools/observability/evidence.mjs';
import { sanitiseUrl, sanitiseHeaders, sanitiseAttributes, tablesOf, redactSecrets, safeId, isCacheTable, isCacheWrite } from '../../tools/observability/sanitize.mjs';

const EXAMPLE = path.join(labRoot, 'docs/observability/examples/evidence.example.json');
const example = () => JSON.parse(fs.readFileSync(EXAMPLE, 'utf8'));
const clone = (x) => JSON.parse(JSON.stringify(x));
const A = 'a'.repeat(40), B = 'b'.repeat(40);
const T1 = '1'.repeat(32), T2 = '2'.repeat(32), S1 = '1'.repeat(16), S2 = '2'.repeat(16);

function env(side, enabled = true, overrides = {}) {
  return {
    id: side, role: side, env: side === 'before' ? 'baseline-test' : 'issue-test', run_id: 'run-test',
    drupal_revision: side === 'before' ? B : A, drupal_version: '12.0-dev', php_version: '8.5',
    patches: [], recipe: null, modules: ['system', 'node'], configuration: {},
    observability: { enabled, status: enabled ? 'ok' : 'disabled', endpoint_configured: enabled, endpoint: enabled ? 'http://otel-collector:4318' : null, collector: null, export: { status: enabled ? 'exported' : 'disabled', received_traces: enabled ? 1 : 0, missing_traces: [] }, reason: enabled ? null : 'disabled for test' },
    ...overrides,
  };
}
function browser(side, trace, span, requests, actions = []) {
  return { run_id: 'run-test', scenario_id: 'scenario', side, environment_id: side, trace_id: trace, actions, requests };
}
function request(side, id, trace, span, overrides = {}) {
  return { id, side, environment_id: side, action_id: 'a1', method: 'GET', url: '/node/add/article', resource_type: 'document', started_at: '2026-11-23T12:00:00Z', duration_ms: 100, status: 200, client_trace_id: trace, client_span_id: span, server_trace_id: trace, server_root_span_id: span, correlation: 'matched', export_status: 'exported', error: null, ...overrides };
}
function summary(trace, span, side, overrides = {}) {
  return { request_id: 'r1', trace_id: trace, root_span_id: span, name: 'GET /node/add/article', method: 'GET', path: '/node/add/article', route: 'entity.node.add_form', controller: 'X::add', status: 200, started_at: '2026-11-23T12:00:00Z', duration_ms: 100, span_count: 2, db: { query_count: 10, total_ms: 5, slowest_ms: 1, cache_query_count: 3, cache_write_count: 0, targets: { default: 10 }, tables: ['cache_config'] }, exceptions: [], export: { status: 'exported', endpoint_configured: true, error: null }, run_id: 'run-test', side, environment: side, ...overrides };
}
function make({ beforeEnabled = true, afterEnabled = true, beforeServer = true, afterServer = true, requests = true } = {}) {
  const bReq = requests ? [request('before', 'r1', T1, S1)] : [];
  const aReq = requests ? [request('after', 'r1', T2, S2)] : [];
  const bActs = requests ? [{ id: 'a1', side: 'before', environment_id: 'before', kind: 'goto', label: 'Open', started_at: '2026-11-23T12:00:00Z', duration_ms: 100, request_ids: ['r1'] }] : [];
  const aActs = requests ? [{ id: 'a1', side: 'after', environment_id: 'after', kind: 'goto', label: 'Open', started_at: '2026-11-23T12:00:00Z', duration_ms: 100, request_ids: ['r1'] }] : [];
  if (!beforeEnabled) for (const r of bReq) { r.server_trace_id = null; r.server_root_span_id = null; r.correlation = 'not-instrumented'; }
  if (!afterEnabled) for (const r of aReq) { r.server_trace_id = null; r.server_root_span_id = null; r.correlation = 'not-instrumented'; }
  return buildEvidence({
    run: { id: 'run-test', scenario: { id: 'scenario', label: 'Scenario', variant: 'test-pinned' }, issue: { id: '3619127', url: 'https://www.drupal.org/project/drupal/issues/3619127', synthetic: false }, started_at: '2026-11-23T12:00:00Z', finished_at: '2026-11-23T12:00:05Z', tools: { node: 'v22', playwright: '1.65.1', browser: 'chromium', browser_version: '143', axe_core: '4.11.4', lighthouse: null, drupal: '12.0-dev', php: '8.5', otel_sdk: '1.15.0' } },
    environments: [env('before', beforeEnabled), env('after', afterEnabled)],
    browserSides: { before: browser('before', T1, S1, bReq, bActs), after: browser('after', T2, S2, aReq, aActs) },
    serverSides: { before: { summaries: beforeEnabled && beforeServer ? [summary(T1, S1, 'before')] : [] }, after: { summaries: afterEnabled && afterServer ? [summary(T2, S2, 'after')] : [] } },
    axeFindings: [], artifacts: [],
  });
}

test('the committed example manifest validates, including references', () => {
  const e = example();
  const r = validateEvidence(e);
  assert.equal(r.ok, true, JSON.stringify(r.errors));
  assert.deepEqual(referentialProblems(e), []);
  assert.equal(e.schema_version, '1.0.0');
});

test('schema validation rejects missing provenance, unknown fields and invalid enums', () => {
  for (const [name, mutate, pattern] of [
    ['missing issue url', (e) => { delete e.run.issue.url; }, /issue\/url|required property/],
    ['short commit', (e) => { e.environments[0].drupal_revision = 'abc123'; }, /drupal_revision/],
    ['unknown correlation', (e) => { e.correlation.status = 'probably-fine'; }, /correlation\/status/],
    ['unknown top-level field', (e) => { e.extra = true; }, /extra.*not allowed/],
    ['unknown request field', (e) => { e.requests[0].raw_headers = {}; }, /raw_headers.*not allowed/],
    ['bad timestamp', (e) => { e.run.started_at = 'yesterday'; }, /started_at/],
  ]) {
    const e = clone(example()); mutate(e);
    const r = validateEvidence(e);
    assert.equal(r.ok, false, `${name} should be rejected`);
    assert.ok(r.errors.some((x) => pattern.test(`${x.path} ${x.message}`)), `${name}: ${JSON.stringify(r.errors)}`);
  }
});

test('referential checks catch a request in an environment that does not exist, and a dangling artifact', () => {
  const e = clone(example());
  e.environments = e.environments.filter((x) => x.id !== 'after');
  assert.ok(referentialProblems(e).some((p) => /unknown environment_id "after"/.test(p)));
  const e2 = clone(example());
  e2.requests[0].server_trace_id = 'f'.repeat(32);
  assert.ok(referentialProblems(e2).some((p) => /has no matching trace record/.test(p)));
  const e3 = clone(example());
  e3.findings.axe[0].artifact_id = 'deleted-artifact';
  assert.ok(referentialProblems(e3).some((p) => /unknown artifact_id/.test(p)));
  assert.throws(() => assertReferentialIntegrity(e3));
});

test('mergeRequest distinguishes a matched trace, a server-generated trace, a missing trace, disabled instrumentation and a failed request', () => {
  const envOn = { id: 'before', role: 'before', observability: { enabled: true } };
  const base = { id: 'r1', method: 'GET', url: '/x?token=SECRET&a=1', status: 200, client_trace_id: T1, client_span_id: S1, correlation: 'pending', started_at: '2026-11-23T12:00:00Z' };
  assert.equal(mergeRequest({ ...base }, [{ request_id: 'r1', trace_id: T1, root_span_id: S1, export: { status: 'exported' } }], envOn).correlation, 'matched');
  assert.equal(mergeRequest({ ...base }, [{ request_id: 'r1', trace_id: T2, root_span_id: S2, export: { status: 'exported' } }], envOn).correlation, 'server-generated');
  assert.equal(mergeRequest({ ...base }, [], envOn).correlation, 'no-server-trace');
  assert.equal(mergeRequest({ ...base }, [], { ...envOn, observability: { enabled: false } }).correlation, 'not-instrumented');
  const failed = mergeRequest({ ...base, status: null, error: 'net::ERR_ABORTED' }, [], envOn);
  assert.equal(failed.correlation, 'request-failed');
  assert.equal(failed.url, '/x?a&token');
  assert.ok(!JSON.stringify(failed).includes('SECRET'));
});

test('buildEvidence keeps environments separate and supports one action to many requests and one request to many traces', () => {
  const e = make();
  assert.equal(e.environments.length, 2);
  assert.equal(e.requests.length, 2);
  assert.equal(e.traces.length, 2);
  assert.equal(e.correlation.status, 'correlated');
  assert.equal(e.requests.find((r) => r.side === 'before').environment_id, 'before');
  assert.equal(e.requests.find((r) => r.side === 'after').environment_id, 'after');
  assert.equal(e.traces.find((t) => t.side === 'before').environment_id, 'before');
  assert.equal(e.traces.find((t) => t.side === 'after').environment_id, 'after');
  assert.equal(validateEvidence(e).ok, true, JSON.stringify(validateEvidence(e).errors));
  assert.deepEqual(referentialProblems(e), []);
  // One action can own several requests.
  const more = make();
  more.playwright.actions[0].request_ids = ['r1', 'r2'];
  more.requests.push({ ...more.requests[0], id: 'r2' });
  more.correlation.matched_requests = 3;
  assert.deepEqual(referentialProblems(more), []);
});

test('a missing server trace is reported as partially correlated, not as a failed run', () => {
  const e = make({ beforeServer: true, afterServer: false });
  assert.equal(e.correlation.status, 'partially-correlated');
  assert.equal(e.requests.find((r) => r.side === 'after').correlation, 'matched');
  assert.equal(e.requests.find((r) => r.side === 'after').server_summary_available, false);
  assert.ok(e.correlation.notes.some((n) => /no detailed server summary/.test(n)));
  assert.equal(validateEvidence(e).ok, true, JSON.stringify(validateEvidence(e).errors));
  assert.deepEqual(referentialProblems(e), []);
});

test('disabled instrumentation is a valid run with its own correlation status', () => {
  const e = make({ beforeEnabled: false, afterEnabled: false });
  assert.equal(e.run.instrumented, false);
  assert.equal(e.correlation.status, 'observability-disabled');
  assert.equal(e.traces.length, 0);
  assert.equal(validateEvidence(e).ok, true, JSON.stringify(validateEvidence(e).errors));
  const md = summaryMarkdown(e, compareEvidence({ ...e, environments: e.environments.filter((x) => x.role === 'before'), requests: [], traces: [], findings: { ...e.findings, axe: [] } }, { ...e, environments: e.environments.filter((x) => x.role === 'after'), requests: [], traces: [], findings: { ...e.findings, axe: [] } }));
  assert.match(md, /Tracing was not enabled|Observability is disabled/);
});

test('a disabled environment does not get a trace from the other environment', () => {
  const e = make({ beforeEnabled: false, afterEnabled: true });
  assert.equal(e.environments.find((x) => x.id === 'before').observability.enabled, false);
  assert.equal(e.traces.filter((t) => t.environment_id === 'before').length, 0);
  assert.equal(e.traces.filter((t) => t.environment_id === 'after').length, 1);
});

test('summaryJson publishes only public artifacts and no raw span or request paths', () => {
  const e = make();
  e.artifacts.push({ id: 'raw-spans', kind: 'otel-local-spans', path: 'reports/issues/3619127/observability/x/raw/spans-before.jsonl', media_type: 'application/x-ndjson', bytes: 10, sha256: 'f'.repeat(64), environment_id: 'before', retention: 'local', public: false, sanitized: true });
  e.artifacts.push({ id: 'evidence', kind: 'evidence-manifest', path: 'reports/issues/3619127/observability/x/evidence.json', media_type: 'application/json', bytes: 10, sha256: 'e'.repeat(64), environment_id: null, retention: 'committed', public: true, sanitized: true });
  const before = { ...e, environments: e.environments.filter((x) => x.role === 'before'), requests: e.requests.filter((r) => r.side === 'before'), traces: e.traces.filter((t) => t.side === 'before'), findings: { ...e.findings, axe: [] } };
  const after = { ...e, environments: e.environments.filter((x) => x.role === 'after'), requests: e.requests.filter((r) => r.side === 'after'), traces: e.traces.filter((t) => t.side === 'after'), findings: { ...e.findings, axe: [] } };
  const s = summaryJson(e, compareEvidence(before, after));
  assert.ok(s.artifacts.some((a) => a.id === 'evidence'));
  assert.ok(!s.artifacts.some((a) => a.id === 'raw-spans'));
  assert.equal(s.before.requests, 1);
  assert.equal(s.after.requests, 1);
  assert.equal(s.rows.length > 0, true);
});

test('summaryMarkdown reports observed values and states the causal limitation', () => {
  const e = make();
  const md = summaryMarkdown(e, compareEvidence(
    { ...e, environments: e.environments.filter((x) => x.role === 'before'), requests: e.requests.filter((r) => r.side === 'before'), traces: e.traces.filter((t) => t.side === 'before'), findings: { ...e.findings, axe: [] } },
    { ...e, environments: e.environments.filter((x) => x.role === 'after'), requests: e.requests.filter((r) => r.side === 'after'), traces: e.traces.filter((t) => t.side === 'after'), findings: { ...e.findings, axe: [] } },
  ));
  assert.match(md, /Drupal execution evidence/);
  assert.match(md, /Database queries/);
  assert.match(md, /does not establish that the patch caused/i);
  assert.match(md, /not a WCAG conformance/i);
  assert.doesNotMatch(md, /\bregression confirmed\b/i);
});

test('compareEvidence marks timing non-comparable when one side is not instrumented, but keeps request counts comparable', () => {
  const e = make({ beforeEnabled: false, afterEnabled: true });
  const before = { ...e, environments: e.environments.filter((x) => x.role === 'before'), requests: e.requests.filter((r) => r.side === 'before'), traces: [], findings: { ...e.findings, axe: [] } };
  const after = { ...e, environments: e.environments.filter((x) => x.role === 'after'), requests: e.requests.filter((r) => r.side === 'after'), traces: e.traces.filter((t) => t.side === 'after'), findings: { ...e.findings, axe: [] } };
  const c = compareEvidence(before, after);
  assert.equal(c.rows.find((r) => r.metric === 'Browser requests').comparability, 'comparable');
  assert.equal(c.rows.find((r) => r.metric.includes('Server duration, median')).comparability, 'not-comparable');
  assert.equal(c.rows.find((r) => r.metric === 'Database queries').comparability, 'not-comparable');
  assert.equal('verdict' in c, false);
  assert.match(c.interpretation, /not a causal claim/i);
});

test('sanitisation removes query values, cookies, authorization headers and sensitive span attributes', () => {
  assert.equal(sanitiseUrl('https://example.test/node/1?token=SECRET&destination=/admin&a=1#frag'), '/node/1?a&destination&token');
  assert.equal(sanitiseUrl('/user/reset/1/123/abc/login?token=SECRET'), '/user/reset/[uid]/[timestamp]/[token]/login?token');
  assert.deepEqual(sanitiseHeaders({ cookie: 'SESS=abc', authorization: 'Bearer x', 'set-cookie': 'x', 'content-type': 'text/html', 'x-core-lab-trace-id': T1 }), { 'content-type': 'text/html', 'x-core-lab-trace-id': T1 });
  assert.deepEqual(sanitiseAttributes({ 'http.request.method': 'GET', cookie: 'x', 'drupal.route': 'x', 'drupal.db.raw_sql': 'SELECT 1' }), { 'http.request.method': 'GET', 'drupal.route': 'x' });
  assert.deepEqual(tablesOf('SELECT * FROM {cache_config} INNER JOIN {node} n ON n.nid = 1 UPDATE {path_alias} SET x = 1'), ['cache_config', 'node', 'path_alias']);
  assert.equal(isCacheTable('cache_render'), true);
  assert.equal(isCacheTable('cachetags'), true);
  assert.equal(isCacheTable('node'), false);
  assert.equal(isCacheWrite('INSERT INTO {cache_config}'), true);
  assert.equal(isCacheWrite('SELECT * FROM {cache_config}'), false);
  assert.doesNotMatch(redactSecrets('Authorization: Bearer SECRET and token=abc'), /SECRET|abc/);
  assert.equal(safeId('../../etc/passwd'), 'etc-passwd');
});

test('an empty run is still valid and does not invent traces', () => {
  const e = make({ requests: false, beforeServer: false, afterServer: false });
  assert.equal(e.requests.length, 0);
  assert.equal(e.traces.length, 0);
  assert.equal(e.correlation.status, 'not-correlated');
  assert.equal(validateEvidence(e).ok, true, JSON.stringify(validateEvidence(e).errors));
  assert.deepEqual(referentialProblems(e), []);
});

test('the schema file is the source of truth for the version', () => {
  const schema = JSON.parse(fs.readFileSync(path.join(labRoot, 'tools/observability/evidence.schema.json'), 'utf8'));
  assert.equal(schema.properties.schema_version.const, '1.0.0');
  assert.equal(example().schema_version, schema.properties.schema_version.const);
});
