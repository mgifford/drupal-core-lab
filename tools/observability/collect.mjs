// Collect the evidence for one instrumented (or deliberately uninstrumented) Playwright run.
//
// Inputs: the run directory written by tools/playwright/lib/lab-run.mjs, the browser request catalogues written by
// tools/playwright/lib/observability.mjs, and the server summaries/spans the Drupal module writes inside the container.
// Outputs: a validated evidence manifest, a human-readable section for the existing run report, a sanitised static
// summary, and a before/after comparison. Raw artifacts stay under raw/ and are marked local-only.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync, execFileSync } from 'node:child_process';
import { labRoot, reportsDir, envDir } from '../compare/lib.mjs';
import { buildEvidence, compareEvidence, summaryJson, summaryMarkdown, SCHEMA_VERSION } from './evidence.mjs';
import { assertEvidence } from './schema.mjs';
import { assertReferentialIntegrity } from './evidence.mjs';
import { safeId, sanitiseUrl, sha256, redactSecrets } from './sanitize.mjs';

const STAMP = () => new Date().toISOString().replace(/[:.]/g, '-');
const read = (f, fallback = null) => { try { return fs.readFileSync(f, 'utf8'); } catch { return fallback; } };
const json = (f, fallback = null) => { const t = read(f); if (t === null) return fallback; try { return JSON.parse(t); } catch { return fallback; } };
const rel = (f) => path.relative(labRoot, f).split(path.sep).join('/');
const exists = (f) => { try { return fs.statSync(f).isFile(); } catch { return false; } };

function ddev(env, argv, { input, timeout = 120000 } = {}) {
  const r = spawnSync('ddev', argv, { cwd: envDir(env), encoding: 'utf8', input, timeout, maxBuffer: 64 * 1024 * 1024 });
  if (r.status !== 0) return '';
  return r.stdout || '';
}

function probe(env) {
  const out = ddev(env, ['exec', 'php'], { input: fs.readFileSync(path.join(labRoot, 'tools/observability/drupal/admin.php')) });
  const line = out.split('\n').find((l) => l.startsWith('CORE_LAB_JSON:'));
  if (!line) return { ok: false, error: 'no probe result' };
  try { return JSON.parse(line.slice('CORE_LAB_JSON:'.length)); } catch { return { ok: false, error: 'probe JSON invalid' }; }
}

function gitCommit(env) {
  try { return execFileSync('git', ['-C', envDir(env), 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(); } catch { return ''; }
}

function packageVersion(lockFile, name) {
  const lock = json(lockFile);
  if (!lock) return null;
  const all = [...(lock.packages || []), ...(lock['packages-dev'] || [])];
  return all.find((p) => p.name === name)?.version || null;
}

function readContainerRun(env, runId) {
  const base = '/tmp/core-lab-observability';
  const requestFile = `${base}/requests-${runId}.jsonl`;
  const spanFile = `${base}/spans-${runId}.jsonl`;
  const requests = ddev(env, ['exec', 'sh', '-c', `cat ${requestFile} 2>/dev/null || true`]);
  const spans = ddev(env, ['exec', 'sh', '-c', `cat ${spanFile} 2>/dev/null || true`]);
  const parse = (text) => String(text || '').split('\n').filter(Boolean).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
  return { requests: parse(requests), spans: parse(spans), requestFile, spanFile };
}

const TRACE_ID = /^[0-9a-f]{32}$/i;
function normaliseTraceId(v) {
  if (typeof v !== 'string' || !v) return null;
  if (TRACE_ID.test(v)) return v.toLowerCase();
  try { const b = Buffer.from(v, 'base64'); if (b.length === 16) return b.toString('hex'); } catch { /* not base64 */ }
  return null;
}
function exportedTraceIds(file) {
  if (!exists(file)) return null;
  const ids = new Set();
  const text = read(file, '');
  if (text.length > 40 * 1024 * 1024) return { ids, truncated: true };
  const walk = (value) => {
    if (!value || typeof value !== 'object') return;
    if (Array.isArray(value)) { for (const v of value) walk(v); return; }
    for (const [k, v] of Object.entries(value)) {
      if ((k === 'traceId' || k === 'trace_id') && typeof v === 'string') { const id = normaliseTraceId(v); if (id) ids.add(id); }
      else walk(v);
    }
  };
  for (const line of text.split('\n')) {
    if (!line.trim()) continue;
    try { walk(JSON.parse(line)); } catch { /* a partial line is not a reason to fail the report */ }
  }
  return { ids, truncated: false };
}

function axeVersion() {
  return json(path.join(labRoot, 'tools/compare/.deps/node_modules/axe-core/package.json'))?.version || '';
}
function playwrightVersion() {
  return json(path.join(labRoot, 'tools/playwright/node_modules/@playwright/test/package.json'))?.version || '';
}

// Walk a results object for axe summaries. The lab evaluators put them in different places (side.axe, stage.axe); the
// shape of the scanner output is the same, so this stays format-preserving rather than re-deriving findings.
function axeSummaries(results) {
  const out = [];
  for (const side of ['before', 'after']) {
    const root = results?.sides?.[side];
    if (!root) continue;
    const seen = new Set();
    const walk = (value, where) => {
      if (!value || typeof value !== 'object') return;
      if (Array.isArray(value)) { value.forEach((v, i) => walk(v, `${where}[${i}]`)); return; }
      if (Array.isArray(value.violations) && typeof value.total === 'number' && typeof value.url === 'string') {
        const key = `${side}|${value.url}|${value.total}|${where}`;
        if (!seen.has(key)) { seen.add(key); out.push({ side, summary: value, where }); }
        return;
      }
      for (const [k, v] of Object.entries(value)) {
        if (['system', 'environment', 'site'].includes(k)) continue;
        walk(v, `${where}.${k}`);
      }
    };
    walk(root, side);
  }
  return out;
}

function buildArtifact(id, kind, file, opts = {}) {
  if (!exists(file)) return null;
  const relative = rel(file);
  // A temporary run outside the repository (for example --out=/tmp/...) has no repository-relative artifact path.
  // The manifest stays valid and the report says the raw artifacts were temporary; it must not invent a ".." path.
  if (relative.startsWith('..') || path.isAbsolute(relative) || !/^[A-Za-z0-9._@+/-]+$/.test(relative)) return null;
  const buf = fs.readFileSync(file);
  return {
    id: safeId(id), kind, path: rel(file), media_type: opts.media_type || 'application/json',
    bytes: buf.length, sha256: sha256(buf), environment_id: opts.environment_id ?? null,
    retention: opts.retention || 'committed', public: opts.public ?? true, sanitized: opts.sanitized ?? false,
    ...(opts.description ? { description: opts.description } : {}),
  };
}

const sideEvidence = (e, role) => ({
  ...e,
  environments: e.environments.filter((x) => x.role === role),
  requests: e.requests.filter((r) => r.side === role),
  traces: e.traces.filter((t) => t.side === role),
  findings: { ...e.findings, axe: e.findings.axe.filter((f) => f.side === role), lighthouse: e.findings.lighthouse.filter((f) => f.side === role), resources: e.findings.resources.filter((f) => f.side === role) },
});

export async function collect(v, { runDir: runDirArg, out: outArg } = {}) {
  if (!runDirArg) throw new Error('usage: collect <slug> --run <reports/.../playwright/RUN>');
  const runDir = path.resolve(labRoot, runDirArg);
  if (!fs.existsSync(runDir)) throw new Error(`run directory not found: ${runDirArg}`);
  const resultsFile = path.join(runDir, 'results.json');
  const results = json(resultsFile, {});
  const browser = {};
  for (const side of ['before', 'after']) {
    const file = path.join(runDir, `observability-${side}.json`);
    if (exists(file)) browser[side] = json(file, {});
  }
  const runId = Object.values(browser).find((b) => b?.run_id)?.run_id || `obs-${STAMP()}`;
  const startedAt = Object.values(browser).flatMap((b) => (b.requests || []).map((r) => r.started_at)).filter(Boolean).sort()[0]
    || results.when || new Date().toISOString();
  const finishedAt = Object.values(browser).flatMap((b) => (b.requests || []).map((r) => r.started_at)).filter(Boolean).sort().at(-1)
    || results.when || new Date().toISOString();

  const out = outArg ? path.resolve(labRoot, outArg) : path.join(labRoot, reportsDir(v), 'observability', STAMP());
  const rawDir = path.join(out, 'raw');
  fs.mkdirSync(rawDir, { recursive: true, mode: 0o700 });
  try { fs.chmodSync(rawDir, 0o700); } catch { /* not supported */ }

  const environments = [];
  const serverSides = {};
  const artifacts = [];
  const warnings = [];
  const collectorArtifact = {};
  for (const side of ['before', 'after']) {
    const env = v[side].env;
    const state = probe(env);
    const commit = gitCommit(env);
    const run = readContainerRun(env, runId);
    serverSides[side] = { summaries: run.requests, spans: run.spans };
    const requestRaw = path.join(rawDir, `requests-${side}.jsonl`);
    const spanRaw = path.join(rawDir, `spans-${side}.jsonl`);
    if (run.requests.length) { fs.writeFileSync(requestRaw, run.requests.map((r) => JSON.stringify(r)).join('\n') + '\n'); try { fs.chmodSync(requestRaw, 0o600); } catch { /* not supported */ } }
    if (run.spans.length) { fs.writeFileSync(spanRaw, run.spans.map((r) => JSON.stringify(r)).join('\n') + '\n'); try { fs.chmodSync(spanRaw, 0o600); } catch { /* not supported */ } }
    const sites = results?.sides?.[side]?.site || {};
    const modules = state.modules || sites.modules || [];
    const enabled = !!state.enabled;
    const collectorFile = path.join(envDir(env), 'observability/data/traces.jsonl');
    const exported = exportedTraceIds(collectorFile);
    const localTraceIds = [...new Set(run.requests.map((r) => r.trace_id).filter((t) => TRACE_ID.test(t || '')))];
    const received = exported ? localTraceIds.filter((id) => exported.ids.has(id)) : [];
    const missing = localTraceIds.filter((id) => !received.includes(id));
    let exportStatus = 'disabled';
    if (enabled) exportStatus = !state.settings?.endpoint ? 'disabled' : !exported ? 'failed' : missing.length ? 'partial' : 'exported';
    const obsStatus = !enabled ? 'disabled' : !state.sdk ? 'unavailable' : run.requests.length === 0 ? 'partial' : exportStatus === 'failed' ? 'partial' : 'ok';
    environments.push({
      id: side, role: side, label: v[side].label || side, env, run_id: runId,
      drupal_revision: commit, drupal_version: state.drupal_version || sites.drupal || 'unknown', php_version: state.php_version || sites.php || 'unknown',
      patches: (v[side].patches || []).map((p) => {
        const file = path.join(labRoot, p);
        const content = read(file);
        return { name: path.basename(p), path: p, sha256: content === null ? null : sha256(Buffer.from(content)) };
      }),
      recipe: v.recipe || null,
      modules,
      configuration: {
        observability_status: obsStatus,
        endpoint: state.settings?.endpoint || '',
        sample_ratio: state.settings?.sample_ratio ?? null,
        database_capture: state.settings?.capture?.database ?? null,
        admin_theme: state.theme_admin || sites.theme?.admin || null,
      },
      observability: {
        enabled, status: obsStatus, endpoint_configured: !!state.settings?.endpoint, endpoint: state.settings?.endpoint || null,
        collector: fs.existsSync(path.join(envDir(env), '.ddev/docker-compose.observability.yaml')) ? 'otel/opentelemetry-collector-contrib:0.165.0' : null,
        export: {
          status: exportStatus, received_traces: received.length, missing_traces: missing,
          artifact_id: null, error: state.error ? redactSecrets(state.error) : (exported === null && enabled && state.settings?.endpoint ? 'collector trace file not found' : null),
        },
        reason: state.ok === false ? redactSecrets(state.error || 'Drupal probe failed') : (enabled ? null : 'Observability is disabled for this environment.'),
      },
    });
    if (run.requests.length) {
      const a = buildArtifact(`server-summary-${side}`, 'server-summary', requestRaw, { environment_id: side, retention: 'local', public: false, sanitized: true, description: 'Sanitised request summaries from the Drupal module (local only).' });
      if (a) artifacts.push(a);
    }
    if (run.spans.length) {
      const a = buildArtifact(`spans-${side}`, 'otel-local-spans', spanRaw, { environment_id: side, retention: 'local', public: false, sanitized: true, description: 'Local OpenTelemetry spans (allow-listed attributes; no SQL, headers or bodies).' });
      if (a) artifacts.push(a);
    }
    if (exists(collectorFile)) {
      const dest = path.join(rawDir, `collector-${side}.jsonl`);
      if (fs.statSync(collectorFile).size <= 20 * 1024 * 1024) fs.copyFileSync(collectorFile, dest);
      else fs.writeFileSync(dest, '');
      try { fs.chmodSync(dest, 0o600); } catch { /* not supported */ }
      const a = buildArtifact(`collector-${side}`, 'otel-export', dest, { environment_id: side, retention: 'local', public: false, sanitized: false, description: 'Collector output (raw OTLP JSON lines; local only).' });
      if (a) { artifacts.push(a); collectorArtifact[side] = a.id; }
    }
    if (sites.error) warnings.push(`${side}: ${sites.error}`);
  }
  // Fill the export artifact id now that the artifact list is known.
  for (const e of environments) if (collectorArtifact[e.id]) e.observability.export.artifact_id = collectorArtifact[e.id];

  // Findings: axe summaries from the run's results.json. The request link is a candidate (same side, same URL), not proof.
  const axe = [];
  const axeTool = { name: 'axe-core', version: axeVersion() };
  const requests = Object.values(browser).flatMap((b) => b.requests || []);
  for (const { side, summary } of axeSummaries(results)) {
    const sideRequests = requests.filter((r) => r.side === side);
    const match = sideRequests.find((r) => sanitiseUrl(r.url) === sanitiseUrl(summary.url)) || null;
    for (const [i, violation] of (summary.violations || []).entries()) {
      axe.push({
        id: `${side}-${violation.id}-${i + 1}`, side, environment_id: side, tool: axeTool,
        rule: violation.id, impact: violation.impact ?? null, help: violation.help || '', help_url: violation.helpUrl || '',
        wcag_tags: (violation.tags || []).filter((t) => /^wcag\d/.test(t)),
        nodes: (violation.nodes || []).map((n) => ({ target: Array.isArray(n.target) ? n.target.join(' ') : String(n.target || ''), html: String(n.html || '') })),
        action_id: match?.action_id || null, request_id: match?.id || null, trace_id: match?.server_trace_id || null,
        artifact_id: 'results', native: true,
        attribution: match ? { classification: 'candidate', method: 'same side and same URL as the scanned page' } : { classification: 'unknown', method: 'no request with the scanned URL in this run' },
      });
    }
  }

  if (exists(resultsFile)) {
    const a = buildArtifact('results', 'playwright-results', resultsFile, { sanitized: false, description: 'Existing Playwright run results (native format, unchanged).' });
    if (a) artifacts.push(a);
  }
  for (const side of ['before', 'after']) {
    const f = path.join(runDir, `observability-${side}.json`);
    if (!exists(f)) continue;
    const a = buildArtifact(`browser-${side}`, 'request-catalog', f, { environment_id: side, sanitized: true, description: 'Browser actions and correlation ids (no cookies, auth headers or query values).' });
    if (a) artifacts.push(a);
  }
  let shot = 0;
  for (const name of fs.existsSync(runDir) ? fs.readdirSync(runDir).sort() : []) {
    if (!/\.(png|jpg|jpeg|webp)$/i.test(name)) continue;
    const side = name.startsWith('after') ? 'after' : name.startsWith('before') ? 'before' : null;
    const a = buildArtifact(`screenshot-${++shot}`, 'screenshot', path.join(runDir, name), { environment_id: side, media_type: name.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg', public: true, sanitized: false, description: name });
    if (a) artifacts.push(a);
  }

  const issue = v.issue
    ? { id: String(v.issue), url: `https://www.drupal.org/project/drupal/issues/${v.issue}`, synthetic: false }
    : { id: `lab:${v.slug}`, url: `https://github.com/mgifford/drupal-core-lab`, synthetic: true, label: v.label };
  const evidence = buildEvidence({
    run: {
      id: runId,
      scenario: { id: v.slug, label: v.label, variant: v.slug },
      issue, started_at: startedAt, finished_at: finishedAt, instrumented: Object.keys(browser).length > 0,
      tools: {
        node: process.version, playwright: playwrightVersion(), browser: results?.environment?.browser || browser.before?.browser || '',
        browser_version: results?.environment?.browserVersion || '', axe_core: axeTool.version,
        lighthouse: json(path.join(labRoot, 'tools/compare/.deps/node_modules/lighthouse/package.json'))?.version || null,
        drupal: environments.map((e) => `${e.id}:${e.drupal_version}`).join(', '), php: environments.map((e) => `${e.id}:${e.php_version}`).join(', '),
        otel_sdk: packageVersion(path.join(envDir(v.after.env), 'composer.lock'), 'open-telemetry/sdk'),
      },
      limitations: warnings,
      playwrightTraceFile: results?.playwrightTrace ? rel(path.resolve(runDir, results.playwrightTrace)) : null,
    },
    environments, browserSides: browser, serverSides, axeFindings: axe,
    lighthouseFindings: [], resourceFindings: [], artifacts,
  });
  // The collector, not the module's flush return value, is the authority on whether a trace left Drupal. Make each
  // trace's status agree with the environment's collector file.
  for (const t of evidence.traces) {
    const env = environments.find((e) => e.id === t.environment_id);
    if (!env?.observability?.enabled) t.export_status = 'disabled';
    else if (env.observability.export.status === 'exported') t.export_status = 'exported';
    else if (env.observability.export.missing_traces.includes(t.id)) t.export_status = 'failed';
    else t.export_status = env.observability.export.status === 'disabled' ? 'disabled' : 'not-exported';
  }
  const beforeSide = sideEvidence(evidence, 'before'), afterSide = sideEvidence(evidence, 'after');
  const comparison = compareEvidence(beforeSide, afterSide);
  evidence.comparison = comparison;
  assertEvidence(evidence, 'evidence manifest');
  assertReferentialIntegrity(evidence, 'evidence manifest');

  fs.writeFileSync(path.join(out, 'evidence.json'), JSON.stringify(evidence, null, 2));
  fs.writeFileSync(path.join(out, 'comparison.json'), JSON.stringify(comparison, null, 2));
  fs.writeFileSync(path.join(out, 'requests.json'), JSON.stringify(evidence.requests, null, 2));
  fs.writeFileSync(path.join(out, 'actions.json'), JSON.stringify(evidence.playwright.actions, null, 2));
  fs.writeFileSync(path.join(out, `traces-before.json`), JSON.stringify(evidence.traces.filter((t) => t.side === 'before'), null, 2));
  fs.writeFileSync(path.join(out, `traces-after.json`), JSON.stringify(evidence.traces.filter((t) => t.side === 'after'), null, 2));
  const summary = summaryJson(evidence, comparison);
  const reportPath = rel(path.join(out, 'SUMMARY.md'));
  const manifestPath = rel(path.join(out, 'evidence.json'));
  const latest = { ...summary, report_path: reportPath, manifest_path: manifestPath, generated_at: new Date().toISOString(), run_dir: rel(runDir) };
  fs.writeFileSync(path.join(out, 'summary.json'), JSON.stringify(latest, null, 2));
  fs.writeFileSync(path.join(out, 'SUMMARY.md'), summaryMarkdown(evidence, comparison));
  const reportRoot = path.join(labRoot, reportsDir(v), 'observability');
  const latestFile = path.join(reportRoot, 'latest.json');
  // Only a run stored under this issue's reports folder may update the viewer/static summary. A trial run written to
  // /tmp must not make the published site point at evidence that is not in the repository.
  if (path.resolve(out).startsWith(path.resolve(reportRoot) + path.sep)) {
    fs.mkdirSync(path.dirname(latestFile), { recursive: true });
    fs.writeFileSync(latestFile, JSON.stringify(latest, null, 2));
  }

  // Integrate into the existing run report, not a separate dashboard. The marker makes this idempotent.
  const runSummary = path.join(runDir, 'SUMMARY.md');
  if (exists(runSummary)) {
    const section = `\n<!-- core-lab-observability:start -->\n${summaryMarkdown(evidence, comparison)}\n<!-- core-lab-observability:end -->\n`;
    let text = read(runSummary, '');
    text = text.replace(/\n?<!-- core-lab-observability:start -->[\s\S]*?<!-- core-lab-observability:end -->\n?/g, '\n');
    fs.writeFileSync(runSummary, text.replace(/\s*$/, '\n') + section);
  }

  console.log(`Evidence manifest: ${manifestPath}`);
  console.log(`Report:            ${reportPath}`);
  console.log(`Correlation:       ${evidence.correlation.status} (${evidence.correlation.matched_requests}/${evidence.requests.length} requests matched)`);
  console.log(`Traces:            before ${evidence.traces.filter((t) => t.side === 'before').length}, after ${evidence.traces.filter((t) => t.side === 'after').length}`);
  if (warnings.length) console.log(`Warnings:          ${warnings.join('; ')}`);
  if (!evidence.traces.length) console.log('No server traces: the manifest is still valid and the run report says tracing was unavailable.');
  return { out, evidence, comparison, summary };
}
