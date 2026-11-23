// Build, compare and summarise the execution evidence manifest. Pure functions: no DDEV, no Playwright, no filesystem
// writes (the CLI does that). Keeping this module pure is what makes the schema, correlation and comparison testable
// without a running Drupal site.
import { safeId, safeText, sanitiseUrl, sanitisePath, sanitiseAttributes, redactSecrets } from './sanitize.mjs';

export const SCHEMA_VERSION = '1.0.0';

const now = () => new Date().toISOString();
const median = (xs) => { const a = xs.filter((x) => Number.isFinite(x)).sort((x, y) => x - y); if (!a.length) return null; const m = Math.floor(a.length / 2); return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2; };
const sum = (xs) => xs.filter((x) => Number.isFinite(x)).reduce((a, b) => a + b, 0);
const round = (n, d = 2) => (Number.isFinite(n) ? Math.round(n * 10 ** d) / 10 ** d : n);

// One request, from the browser record and the matching server summary. The browser is authoritative for what was
// requested; the server is authoritative for what Drupal executed. A request can legitimately have no server trace.
export function mergeRequest(browserRequest, serverSummaries = [], environment = {}) {
  const b = browserRequest;
  const match = serverSummaries.find((s) => s.request_id && s.request_id === b.id)
    || serverSummaries.find((s) => s.trace_id && b.server_trace_id && s.trace_id === b.server_trace_id)
    || null;
  const serverTrace = match?.trace_id || b.server_trace_id || null;
  const serverRoot = match?.root_span_id || b.server_root_span_id || null;
  let correlation = b.correlation || 'pending';
  if (correlation === 'pending' && serverTrace) correlation = serverTrace === b.client_trace_id ? 'matched' : 'server-generated';
  if (!serverTrace && environment.observability?.enabled === false) correlation = 'not-instrumented';
  if (!serverTrace && environment.observability?.enabled !== false && b.status !== null && correlation === 'pending') correlation = 'no-server-trace';
  if (!serverTrace && b.error) correlation = 'request-failed';
  return {
    id: safeId(b.id), side: environment.role || b.side || 'variant', environment_id: environment.id || b.environment_id || 'unknown',
    action_id: b.action_id ? safeId(b.action_id) : null, method: String(b.method || 'GET').toUpperCase(),
    url: sanitiseUrl(b.url), resource_type: safeText(b.resource_type || 'other', 40), started_at: b.started_at || now(),
    duration_ms: Number.isFinite(b.duration_ms) ? round(b.duration_ms) : null,
    status: Number.isInteger(b.status) ? b.status : null,
    client_trace_id: b.client_trace_id || '00000000000000000000000000000000',
    client_span_id: b.client_span_id || '0000000000000000',
    server_trace_id: serverTrace, server_root_span_id: serverRoot,
    server_summary_available: !!match,
    correlation,
    export_status: match?.export?.status || ({ configured: 'unknown', 'local-only': 'disabled', failed: 'failed', exported: 'exported' }[b.export_status] || b.export_status || 'unknown'),
    error: b.error ? redactSecrets(b.error) : null,
  };
}

function traceFromSummary(summary, environment, requestId = null) {
  const db = summary.db || {};
  return {
    id: summary.trace_id,
    environment_id: environment.id,
    side: environment.role,
    request_id: requestId || summary.request_id || null,
    root_span_id: summary.root_span_id,
    name: safeText(`${summary.method || 'GET'} ${sanitisePath(summary.path || '/')}`, 160),
    started_at: summary.started_at || now(),
    duration_ms: round(Number(summary.duration_ms) || 0),
    span_count: Math.max(1, Number(summary.span_count) || (summary.spans?.length ?? 1)),
    db: {
      query_count: Number(db.query_count) || 0,
      total_ms: round(Number(db.total_ms) || 0),
      slowest_ms: Number.isFinite(db.slowest_ms) ? round(db.slowest_ms) : null,
      cache_query_count: Number(db.cache_query_count) || 0,
      cache_write_count: Number(db.cache_write_count) || 0,
      targets: Object.fromEntries(Object.entries(db.targets || {}).map(([k, v]) => [safeText(k, 40), Number(v) || 0])),
      tables: (db.tables || []).map((t) => safeText(t, 80)).slice(0, 60),
    },
    exceptions: (summary.exceptions || []).map((e) => ({ class: safeText(e.class || 'Throwable', 160), code: e.code ?? null, count: Math.max(1, Number(e.count) || 1) })),
    export_status: summary.export?.status || environment.observability?.export?.status || 'unknown',
    artifact_ids: [],
    attributes: sanitiseAttributes({ ...(summary.attributes || {}), 'drupal.route': summary.route, 'drupal.controller': summary.controller, 'http.response.status_code': summary.status }),
  };
}

// buildEvidence is the only place that turns raw run data into the public shape. It is strict about provenance:
// an environment without a full 40-character revision is a hard error, because a manifest without it cannot be
// reproduced and should not be committed.
export function buildEvidence({
  run,
  environments,
  browserSides = {},
  serverSides = {},
  axeFindings = [],
  lighthouseFindings = [],
  resourceFindings = [],
  artifacts = [],
  generatedAt = now(),
}) {
  if (!run?.id) throw new Error('run.id is required');
  if (!run.issue?.id || !run.issue?.url) throw new Error('run.issue.id and run.issue.url are required provenance');
  const envs = environments.map((e) => {
    if (!/^[0-9a-f]{40}$/.test(e.drupal_revision || '')) throw new Error(`environment ${e.id}: drupal_revision must be the full 40-character commit, not "${e.drupal_revision || ''}"`);
    return {
      id: safeId(e.id), role: e.role, label: e.label || e.id, env: e.env, run_id: e.run_id || run.id,
      drupal_revision: e.drupal_revision, drupal_version: e.drupal_version || 'unknown', php_version: e.php_version || 'unknown',
      patches: (e.patches || []).map((p) => ({ name: p.name, path: p.path, sha256: p.sha256 || null })),
      recipe: e.recipe ?? null, modules: (e.modules || []).map((m) => safeText(m, 120)),
      configuration: e.configuration || {},
      observability: {
        enabled: !!e.observability?.enabled, status: e.observability?.status || (e.observability?.enabled ? 'partial' : 'disabled'),
        endpoint_configured: !!e.observability?.endpoint_configured, endpoint: e.observability?.endpoint || null,
        collector: e.observability?.collector || null,
        export: {
          status: e.observability?.export?.status || (e.observability?.enabled ? 'unknown' : 'disabled'),
          received_traces: Number(e.observability?.export?.received_traces) || 0,
          missing_traces: (e.observability?.export?.missing_traces || []).map((t) => safeText(t, 40)),
          artifact_id: e.observability?.export?.artifact_id || null, error: e.observability?.export?.error || null,
        },
        reason: e.observability?.reason || null,
      },
    };
  });
  const envById = Object.fromEntries(envs.map((e) => [e.id, e]));
  const byRole = Object.fromEntries(envs.map((e) => [e.role, e]));

  const actions = [], requests = [];
  for (const [side, data] of Object.entries(browserSides)) {
    const env = envById[side] || byRole[side];
    if (!env) throw new Error(`browser evidence for "${side}" has no matching environment`);
    for (const a of data.actions || []) {
      actions.push({
        id: a.id, side: env.role, environment_id: env.id, kind: a.kind || 'other', label: safeText(a.label || a.kind || 'action', 160),
        started_at: a.started_at || now(), duration_ms: round(Number(a.duration_ms) || 0),
        request_ids: (a.request_ids || []).map(safeId), screenshot_artifact_id: a.screenshot_artifact_id || null,
      });
    }
    const summaries = serverSides[side]?.summaries || serverSides[env.id]?.summaries || [];
    for (const r of data.requests || []) requests.push(mergeRequest(r, summaries, env));
  }

  const traces = [];
  for (const [side, data] of Object.entries(serverSides)) {
    const env = envById[side] || byRole[side];
    if (!env) continue;
    for (const s of data.summaries || []) {
      if (!s.trace_id || !s.root_span_id) continue;
      // One OTel trace can contain several HTTP requests (several root spans). Keep one record per root span so a
      // request can be followed to its own duration, database work and exceptions.
      if (traces.some((t) => t.id === s.trace_id && t.root_span_id === s.root_span_id)) continue;
      traces.push(traceFromSummary(s, env, requests.find((r) => r.id === s.request_id)?.id || null));
    }
  }
  // A trace can exist without a browser request (a redirect, a background AJAX call, or a request the browser catalog
  // missed). Keep it, with request_id null, rather than dropping evidence.
  const requestIds = new Set(requests.map((r) => r.id));
  for (const t of traces) if (t.request_id && !requestIds.has(t.request_id)) t.request_id = null;

  const matched = requests.filter((r) => r.correlation === 'matched').length;
  const partial = requests.filter((r) => ['server-generated', 'export-failed'].includes(r.correlation)).length;
  const missing = requests.filter((r) => ['no-server-trace', 'request-failed'].includes(r.correlation)).length;
  const tracedRequests = new Set(traces.map((t) => t.request_id).filter(Boolean));
  const orphanTraces = traces.filter((t) => !t.request_id).length;
  const withoutDetails = requests.filter((r) => r.server_trace_id && r.server_summary_available === false).length;
  const instrumented = typeof run.instrumented === 'boolean' ? run.instrumented : envs.some((e) => e.observability.enabled);
  let status;
  if (!instrumented) status = 'observability-disabled';
  else if (!requests.length) status = 'not-correlated';
  else if (matched === requests.length && partial === 0 && missing === 0 && orphanTraces === 0 && withoutDetails === 0) status = 'correlated';
  else if (matched > 0 || partial > 0) status = 'partially-correlated';
  else status = 'not-correlated';
  const notes = [];
  if (!instrumented) notes.push('Observability is disabled for every environment in this run; browser and accessibility evidence is unaffected.');
  if (missing) notes.push(`${missing} browser request(s) have no server trace. A cached response, a page-cache hit, a request that failed before Drupal ran, or a trace export failure can all produce this.`);
  if (partial && !missing) notes.push(`${partial} request(s) reached Drupal but the server used a different trace id than the browser sent (server-generated correlation).`);
  if (orphanTraces) notes.push(`${orphanTraces} server trace(s) have no browser request id; they may come from redirects, redirect targets or background requests.`);
  if (withoutDetails) notes.push(`${withoutDetails} request(s) returned a server trace id but no detailed server summary was read. The trace id is known; its spans, database and cache details are not.`);
  if (traces.length > requests.length) notes.push(`${traces.length} server traces were recorded for ${requests.length} browser requests. A redirect, a re-issued request or an internal forward can produce more than one Drupal request for one browser request; the request id is shared, the root span is not.`);

  const evidence = {
    schema_version: SCHEMA_VERSION,
    producer: { name: 'drupal-core-lab', version: '1.0.0', repository: 'https://github.com/mgifford/drupal-core-lab' },
    run: {
      id: safeId(run.id), scenario: { id: safeId(run.scenario?.id || run.id), label: run.scenario?.label || '', variant: run.scenario?.variant || '' },
      issue: { id: String(run.issue.id), url: run.issue.url, synthetic: !!run.issue.synthetic, ...(run.issue.label ? { label: run.issue.label } : {}) },
      started_at: run.started_at || generatedAt, finished_at: run.finished_at || generatedAt, instrumented,
      tools: { node: run.tools?.node || process.version, playwright: run.tools?.playwright || '', browser: run.tools?.browser || '', browser_version: run.tools?.browser_version || '', axe_core: run.tools?.axe_core || '', lighthouse: run.tools?.lighthouse ?? null, drupal: run.tools?.drupal || '', php: run.tools?.php || '', otel_sdk: run.tools?.otel_sdk ?? null },
    },
    environments: envs,
    playwright: {
      run_id: safeId(run.id), trace_file: run.playwrightTraceFile || null,
      actions,
    },
    requests, traces,
    correlation: { status, matched_requests: matched, partially_matched_requests: partial, requests_without_server_trace: missing, requests_without_server_details: withoutDetails, server_traces_without_request: orphanTraces, notes },
    findings: {
      axe: axeFindings.map((f, i) => ({
        id: safeId(f.id || `axe-${i + 1}`), side: f.side, environment_id: f.environment_id, tool: { name: f.tool?.name || 'axe-core', version: f.tool?.version || '' },
        rule: f.rule, impact: f.impact ?? null, help: safeText(f.help || '', 300), help_url: f.help_url || '',
        wcag_tags: f.wcag_tags || [], nodes: (f.nodes || []).map((n) => ({ target: safeText(n.target, 300), html: safeText(n.html, 300) })),
        action_id: f.action_id || null, request_id: f.request_id || null, trace_id: f.trace_id || null, artifact_id: f.artifact_id || null,
        native: true, attribution: f.attribution || { classification: 'unknown', method: 'not attempted' },
      })),
      lighthouse: lighthouseFindings.map((f) => ({ ...f })), resources: resourceFindings.map((f) => ({ ...f })),
    },
    artifacts: artifacts.map((a) => ({ ...a })),
    limitations: [
      'Automated accessibility rules cover only part of WCAG; a finding is not a conformance verdict.',
      'A correlated trace shows that a request reached Drupal with the same trace id. It does not show that the patch caused the observed behaviour.',
      'Server timings include tracing and database-logging overhead when instrumentation is on. Do not compare them with a benchmark run.',
      'Drupal page-cache and dynamic-page-cache hits can serve a response without the instrumented request path; those requests may have no server trace.',
      ...(run.limitations || []),
    ],
  };
  return evidence;
}

// Compare only metrics that exist on both sides and are meaningfully comparable. This deliberately has no "verdict"
// field: a difference is an observation, not a regression.
export function compareEvidence(before, after) {
  const metric = (e) => {
    const reqs = e.requests || [], traces = e.traces || [];
    const instrumented = !!e.environments?.[0]?.observability?.enabled;
    const dbQueries = traces.map((t) => t.db.query_count);
    const dbMs = traces.map((t) => t.db.total_ms);
    const cacheQueries = traces.map((t) => t.db.cache_query_count);
    const exceptions = traces.reduce((n, t) => n + t.exceptions.reduce((m, x) => m + x.count, 0), 0);
    const axeNodes = (e.findings.axe || []).reduce((n, f) => n + (f.nodes?.length || 0), 0);
    return {
      requests: reqs.length, traces: traces.length, axeNodes,
      serverMsMedian: median(traces.map((t) => t.duration_ms)), serverMsTotal: sum(traces.map((t) => t.duration_ms)),
      dbQueries: sum(dbQueries), dbQueriesMedian: median(dbQueries), dbMs: sum(dbMs), cacheQueries: sum(cacheQueries), exceptions,
      instrumented, correlation: e.correlation.status,
      lighthouse: Object.fromEntries((e.findings.lighthouse || []).map((l) => [l.side + ':' + l.url, l])),
    };
  };
  const b = metric(before), a = metric(after);
  const rows = [];
  const comparable = b.instrumented && a.instrumented;
  const add = (name, bv, av, opts = {}) => rows.push({
    metric: name, before: bv, after: av,
    delta: typeof bv === 'number' && typeof av === 'number' ? round(av - bv) : null,
    comparability: opts.comparable === true ? 'comparable' : opts.comparable === false ? 'not-comparable' : (comparable ? 'comparable' : 'not-comparable'),
    observed: bv !== null || av !== null,
    note: opts.note || (comparable ? '' : 'One or both sides were not instrumented, so this is not a like-for-like comparison.'),
  });
  add('Browser requests', b.requests, a.requests, { comparable: true, note: 'The same scenario can issue a different number of requests, for example after an AJAX response.' });
  add('Server traces', b.traces, a.traces);
  add('Server duration, median (ms)', b.serverMsMedian, a.serverMsMedian, { comparable: comparable && b.traces > 0 && a.traces > 0, note: 'Instrumented runs include database-logging and export overhead. A single pair is also noisy; repeat the run before drawing any inference, and treat the difference as diagnostic, not as a benchmark.' });
  add('Server duration, total (ms)', b.serverMsTotal, a.serverMsTotal, { comparable: comparable && b.traces > 0 && a.traces > 0, note: 'Total depends on how many requests the scenario made; compare the median as well.' });
  add('Database queries', b.dbQueries, a.dbQueries, { note: 'Cache state and the number of requests affect this. A difference is not by itself a problem.' });
  add('Database queries, median per request', b.dbQueriesMedian, a.dbQueriesMedian);
  add('Database time (ms)', b.dbMs, a.dbMs, { note: 'Query logging measures statement time only; it excludes PHP and rendering.' });
  add('Cache-table queries', b.cacheQueries, a.cacheQueries, { note: 'Inferred from queries against cache tables. This is not a cache hit/miss ratio.' });
  add('Exceptions recorded', b.exceptions, a.exceptions, { note: 'Only exception class and count are recorded; messages are not exported.' });
  add('axe violating elements', b.axeNodes, a.axeNodes, { comparable: true, note: 'Scanner findings, not a WCAG conformance result. Compare only when both sides were scanned at the same step.' });
  if (Object.keys(a.lighthouse).length && Object.keys(b.lighthouse).length) {
    add('Lighthouse performance score', b.lighthouse[Object.keys(b.lighthouse)[0]]?.categories?.performance ?? null, a.lighthouse[Object.keys(a.lighthouse)[0]]?.categories?.performance ?? null, { comparable: !comparable && !b.instrumented && !a.instrumented, note: 'Only comparable between non-instrumented runs. Instrumentation can change performance measurements.' });
  }
  return {
    before_environment_id: before.environments.find((e) => e.role === 'before')?.id || before.environments[0].id,
    after_environment_id: after.environments.find((e) => e.role === 'after')?.id || after.environments.at(-1).id,
    rows,
    interpretation: ('Observed data, not a causal claim. A difference in duration, query count or cache activity describes what happened in these two runs under these conditions. '
      + 'It does not establish that the patch caused a performance or functional regression; tracing overhead, cache state, request count and environment differences can all change these numbers. '
      + 'Use the per-request traces and the native browser, axe-core and Lighthouse artifacts to investigate, and re-run without instrumentation before making a performance claim.'),
  };
}

// A small, sanitised summary for the static site and the viewer. No raw spans, SQL, headers or filesystem paths that
// would expose a local machine.
export function summaryJson(evidence, comparison = null) {
  const m = (e, role) => {
    const traces = (e.traces || []).filter((t) => t.side === role);
    const requests = (e.requests || []).filter((r) => r.side === role);
    const axe = (e.findings.axe || []).filter((f) => f.side === role);
    return {
      id: e.environments.find((x) => x.role === role)?.id,
      requests: requests.length, traces: traces.length,
      server_ms_median: median(traces.map((t) => t.duration_ms)),
      db_queries: traces.reduce((n, t) => n + t.db.query_count, 0),
      cache_queries: traces.reduce((n, t) => n + t.db.cache_query_count, 0),
      exceptions: traces.reduce((n, t) => n + t.exceptions.reduce((s, x) => s + x.count, 0), 0),
      axe_nodes: axe.reduce((n, f) => n + (f.nodes?.length || 0), 0),
      correlation: e.correlation.status,
    };
  };
  return {
    schema_version: evidence.schema_version,
    run_id: evidence.run.id,
    generated_at: evidence.run.finished_at,
    issue: { id: evidence.run.issue.id, url: evidence.run.issue.url, synthetic: evidence.run.issue.synthetic },
    scenario: evidence.run.scenario,
    instrumented: evidence.run.instrumented,
    correlation: evidence.correlation,
    environments: evidence.environments.map((e) => ({ id: e.id, role: e.role, label: e.label, env: e.env, drupal_revision: e.drupal_revision, drupal_version: e.drupal_version, php_version: e.php_version, patches: e.patches.map((p) => p.name), recipe: e.recipe, modules: e.modules.length, observability: { enabled: e.observability.enabled, status: e.observability.status, export: e.observability.export.status } })),
    before: m(evidence, 'before'),
    after: m(evidence, 'after'),
    rows: comparison?.rows || [],
    interpretation: comparison?.interpretation || '',
    artifacts: evidence.artifacts.filter((a) => a.public).map((a) => ({ id: a.id, kind: a.kind, path: a.path, retention: a.retention })),
    limitations: evidence.limitations,
  };
}

export function summaryMarkdown(evidence, comparison = null) {
  const L = (s) => `[${s}]`;
  const e = evidence;
  const env = (role) => e.environments.find((x) => x.role === role);
  const B = env('before'), A = env('after');
  const side = (x) => (x ? `**${x.label}** (\`${x.env}\`, core \`${x.drupal_revision.slice(0, 12)}\`${x.patches.length ? `, ${x.patches.length} patch(es)` : ''})` : '**not present**');
  let md = `## Drupal execution evidence\n\n`;
  md += `Run \`${e.run.id}\`, scenario \`${e.run.scenario.id}\`, generated ${e.run.finished_at}. Instrumented: **${e.run.instrumented ? 'yes' : 'no'}**. Correlation: **${e.correlation.status}**.\n\n`;
  md += `| | Before | After |\n|---|---|---|\n| Environment | ${B ? B.env : '—'} | ${A ? A.env : '—'} |\n| Drupal core | ${B ? `\`${B.drupal_revision.slice(0, 12)}\`` : '—'} | ${A ? `\`${A.drupal_revision.slice(0, 12)}\`` : '—'} |\n| Patches | ${B ? (B.patches.map((p) => `\`${p.name}\``).join(', ') || 'none') : '—'} | ${A ? (A.patches.map((p) => `\`${p.name}\``).join(', ') || 'none') : '—'} |\n| Observability | ${B ? B.observability.status : '—'} | ${A ? A.observability.status : '—'} |\n| Requests with a matching server trace | ${e.requests.filter((r) => r.side === 'before' && r.correlation === 'matched').length} | ${e.requests.filter((r) => r.side === 'after' && r.correlation === 'matched').length} |\n\n`;
  if (B && A) md += `${side(B)} compared with ${side(A)}.\n\n`;
  if (!e.correlation.notes.length) md += `All browser requests with a trace id were matched to a Drupal server trace.\n\n`;
  else md += e.correlation.notes.map((n) => `- ${n}`).join('\n') + '\n\n';
  if (comparison) {
    md += `### Before-and-after measurements\n\n| Metric | Before | After | Difference | Comparable? | Note |\n|---|---:|---:|---:|---|---|\n`;
    for (const r of comparison.rows) md += `| ${r.metric} | ${r.before ?? '—'} | ${r.after ?? '—'} | ${r.delta ?? '—'} | ${r.comparability === 'comparable' ? 'yes' : 'no'} | ${r.note || ''} |\n`;
    md += `\n${comparison.interpretation}\n\n`;
  }
  md += `### Per-request traces\n\n`;
  const traces = e.traces.slice(0, 40);
  if (!traces.length) md += `No server traces were recorded. ${e.instrumented ? 'Tracing was enabled, so this is a finding to investigate (collector, export or page cache).' : 'Tracing was not enabled for this run.'}\n\n`;
  else {
    md += `| Side | Trace id | Request | Route | Duration | DB queries | Cache queries | Exceptions | Export |\n|---|---|---|---|---:|---:|---:|---:|---|\n`;
    for (const t of traces) {
      const req = e.requests.find((r) => r.id === t.request_id);
      md += `| ${t.side} | \`${t.id.slice(0, 16)}…\` | ${req ? `\`${req.method} ${req.url}\`` : '—'} | ${t.attributes?.['drupal.route'] || '—'} | ${t.duration_ms} ms | ${t.db.query_count} | ${t.db.cache_query_count} | ${t.exceptions.reduce((n, x) => n + x.count, 0)} | ${t.export_status} |\n`;
    }
    md += `\nOnly the first ${traces.length} of ${e.traces.length} traces are shown here; the full set is in the evidence manifest.\n\n`;
  }
  const axe = e.findings.axe || [];
  if (axe.length) {
    md += `### Accessibility findings\n\n`;
    md += `| Side | Rule | Impact | Nodes | Related request | Attribution |\n|---|---|---|---:|---|---|\n`;
    for (const f of axe.slice(0, 20)) md += `| ${f.side} | \`${f.rule}\` | ${f.impact || '—'} | ${f.nodes.length} | ${f.request_id || '—'} | ${f.attribution.classification} |\n`;
    md += `\nThese are axe-core findings as the scanner reported them. They are not a WCAG conformance determination and the request/trace association is a candidate link, not proof of cause.\n\n`;
  }
  if (e.artifacts.length) {
    md += `### Artifacts\n\n`;
    for (const a of e.artifacts) md += `- ${a.kind}: \`${a.path}\`${a.public ? '' : ' (local only; not published)'}${a.sanitized ? ', sanitised' : ''}\n`;
    md += '\n';
  }
  md += `### Limitations\n\n`;
  for (const l of e.limitations) md += `- ${l}\n`;
  md += `\nThe manifest validates against schema ${e.schema_version}. Raw Playwright, OpenTelemetry, axe-core and Lighthouse artifacts keep their native formats and are referenced above; they are not rewritten by this report.\n`;
  return md;
}

export const rfc3339 = (d = new Date()) => new Date(d).toISOString().replace(/\.\d{3}Z$/, 'Z');

// Structural validation cannot see that an id points at nothing. This checks the relationships the schema cannot
// express, and the correlation counts the report relies on. It is deliberately strict: a manifest with a dangling
// artifact reference must not be published.
export function referentialProblems(e) {
  const problems = [];
  const env = new Set((e.environments || []).map((x) => x.id));
  const actions = new Map((e.playwright?.actions || []).map((a) => [a.id, a]));
  const requests = new Map((e.requests || []).map((r) => [r.id, r]));
  const traceList = e.traces || [];
  const traceIds = new Set(traceList.map((t) => t.id));
  const artifacts = new Set((e.artifacts || []).map((a) => a.id));
  const dup = (items, what) => { const seen = new Set(); for (const x of items) { if (seen.has(x)) problems.push(`${what} id "${x}" is used more than once`); seen.add(x); } };
  dup(env, 'environment'); dup([...actions.keys()], 'action'); dup([...requests.keys()], 'request'); dup([...(e.traces || [])].map((t) => `${t.id}:${t.root_span_id}`), 'trace (id + root span)'); dup([...artifacts], 'artifact');
  const envOf = new Map((e.environments || []).map((x) => [x.id, x.role]));
  for (const r of e.requests || []) {
    if (!env.has(r.environment_id)) problems.push(`request ${r.id}: unknown environment_id "${r.environment_id}"`);
    else if (envOf.get(r.environment_id) !== r.side) problems.push(`request ${r.id}: side "${r.side}" does not match environment ${r.environment_id} (${envOf.get(r.environment_id)})`);
    if (r.action_id && !actions.has(r.action_id)) problems.push(`request ${r.id}: unknown action_id "${r.action_id}"`);
    if (r.server_trace_id && r.server_summary_available !== false) {
      const match = traceList.some((t) => t.id === r.server_trace_id && (!r.server_root_span_id || t.root_span_id === r.server_root_span_id));
      if (!match) problems.push(`request ${r.id}: server_trace_id "${r.server_trace_id}" has no matching trace record`);
    }
  }
  for (const a of e.playwright?.actions || []) {
    if (!env.has(a.environment_id)) problems.push(`action ${a.id}: unknown environment_id "${a.environment_id}"`);
    for (const id of a.request_ids || []) if (!requests.has(id)) problems.push(`action ${a.id}: unknown request_id "${id}"`);
    if (a.screenshot_artifact_id && !artifacts.has(a.screenshot_artifact_id)) problems.push(`action ${a.id}: unknown screenshot_artifact_id "${a.screenshot_artifact_id}"`);
  }
  for (const t of e.traces || []) {
    if (!env.has(t.environment_id)) problems.push(`trace ${t.id}: unknown environment_id "${t.environment_id}"`);
    else if (envOf.get(t.environment_id) !== t.side) problems.push(`trace ${t.id}: side "${t.side}" does not match environment ${t.environment_id}`);
    if (t.request_id && !requests.has(t.request_id)) problems.push(`trace ${t.id}: unknown request_id "${t.request_id}"`);
    for (const id of t.artifact_ids || []) if (!artifacts.has(id)) problems.push(`trace ${t.id}: unknown artifact_id "${id}"`);
  }
  for (const f of e.findings?.axe || []) {
    if (!env.has(f.environment_id)) problems.push(`axe finding ${f.id}: unknown environment_id "${f.environment_id}"`);
    if (f.request_id && !requests.has(f.request_id)) problems.push(`axe finding ${f.id}: unknown request_id "${f.request_id}"`);
    if (f.trace_id && !traceIds.has(f.trace_id)) problems.push(`axe finding ${f.id}: unknown trace_id "${f.trace_id}"`);
    if (f.artifact_id && !artifacts.has(f.artifact_id)) problems.push(`axe finding ${f.id}: unknown artifact_id "${f.artifact_id}"`);
  }
  for (const a of e.artifacts || []) {
    if (a.environment_id && !env.has(a.environment_id)) problems.push(`artifact ${a.id}: unknown environment_id "${a.environment_id}"`);
    if (/^(?:\/|[A-Za-z]:\\)/.test(a.path) || a.path.includes('..')) problems.push(`artifact ${a.id}: path must be repository-relative and must not contain "..": ${a.path}`);
  }
  const c = e.correlation || {};
  const count = (s) => (e.requests || []).filter((r) => r.correlation === s).length;
  if (c.matched_requests !== count('matched')) problems.push(`correlation.matched_requests is ${c.matched_requests}, but ${count('matched')} request(s) have correlation "matched"`);
  if (c.partially_matched_requests !== count('server-generated') + count('export-failed')) problems.push(`correlation.partially_matched_requests does not match the requests`);
  if (c.requests_without_server_trace !== count('no-server-trace') + count('request-failed')) problems.push(`correlation.requests_without_server_trace does not match the requests`);
  const noDetails = (e.requests || []).filter((r) => r.server_trace_id && r.server_summary_available === false).length;
  if (c.requests_without_server_details !== undefined && c.requests_without_server_details !== noDetails) problems.push(`correlation.requests_without_server_details is ${c.requests_without_server_details}, but ${noDetails} request(s) have a trace id without a summary`);
  return problems;
}

export function assertReferentialIntegrity(e, label = 'evidence manifest') {
  const problems = referentialProblems(e);
  if (problems.length) throw new Error(`${label} has ${problems.length} reference problem(s):\n${problems.slice(0, 30).map((p) => `  ${p}`).join('\n')}`);
  return e;
}
