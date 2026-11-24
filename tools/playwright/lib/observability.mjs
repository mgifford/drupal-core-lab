// Playwright ⇄ Drupal correlation.
//
// A W3C traceparent is added to same-origin document, XHR and fetch requests only. The server (Drupal's
// core_lab_observability module) extracts it, continues the trace and returns x-core-lab-trace-id on the response. The
// browser evidence keeps its own ids (run, action, request) and never calls them OpenTelemetry ids: a Playwright trace
// file, a Playwright action id and an OTel trace id are three different things, and this module keeps them separate.
//
// No cookies, authorization headers, request bodies or query values are recorded. See tools/observability/sanitize.mjs.
import fs from 'node:fs';
import { randomBytes } from 'node:crypto';
import { sanitiseHeaders, sanitiseUrl, safeId, safeText } from '../../observability/sanitize.mjs';

export const OBSERVABILITY_VERSION = '1.0.0';

const hex = (bytes) => randomBytes(bytes).toString('hex');
const nowIso = () => new Date().toISOString();
const INJECTED = ['document', 'xhr', 'fetch'];

export function newTraceId() { return hex(16); }
export function newRunId(label = 'run') { return safeId(`${label}-${new Date().toISOString().replace(/[:.]/g, '-')}-${hex(3)}`); }

// Attach to one browser context/page. Returns a controller with action(), beginAction(), endAction(), flush() and a
// live record. Calling this twice for one page is a programming error: the second route would inject a second traceparent.
export function attachObservability({ context, page, base, side, environmentId, scenarioId, runId, traceId = newTraceId(), log = () => {} }) {
  const baseOrigin = new URL(base).origin;
  const trace = { run_id: safeId(runId || newRunId('run')), scenario_id: safeId(scenarioId || 'scenario'), side, environment_id: environmentId || side, trace_id: traceId, actions: [], requests: [] };
  const pending = new Map();
  const actionStack = [];
  let requestSeq = 0, actionSeq = 0, flushed = false;

  const openAction = () => actionStack[actionStack.length - 1] || null;

  awaitRoute();
  function awaitRoute() {
    context.route('**/*', async (route) => {
      const request = route.request();
      let url;
      try { url = new URL(request.url()); } catch { return route.continue().catch(() => {}); }
      if (!/^https?:$/.test(url.protocol) || url.origin !== baseOrigin) return route.continue().catch(() => {});
      if (url.pathname.startsWith('/__compare/')) return route.continue().catch(() => {});
      const type = request.resourceType();
      if (!INJECTED.includes(type)) return route.continue().catch(() => {});
      const id = 'r' + (++requestSeq);
      const spanId = hex(8);
      const traceparent = `00-${trace.trace_id}-${spanId}-01`;
      const action = openAction();
      const record = {
        id, side, environment_id: environmentId || side, action_id: action?.id || null,
        method: request.method(), url: sanitiseUrl(url.href), resource_type: type,
        started_at: nowIso(), duration_ms: null, status: null,
        client_trace_id: trace.trace_id, client_span_id: spanId,
        server_trace_id: null, server_root_span_id: null,
        correlation: 'pending', export_status: 'unknown', error: null,
        request_headers: { traceparent: `00-${trace.trace_id}-${spanId.slice(0, 4)}…` },
      };
      pending.set(id, record); trace.requests.push(record); if (action) action.request_ids.push(id);
      const headers = { ...request.headers() };
      // Remove a header a page may have set itself; the lab's value must be the one Drupal sees.
      headers.traceparent = traceparent;
      headers['x-core-lab-run'] = trace.run_id;
      headers['x-core-lab-scenario'] = trace.scenario_id;
      headers['x-core-lab-side'] = side;
      headers['x-core-lab-environment'] = environmentId || side;
      headers['x-core-lab-request'] = id;
      headers['x-core-lab-action'] = action?.id || '';
      try { await route.continue({ headers }); }
      catch (e) { record.error = safeText(e.message, 200); record.correlation = 'request-failed'; try { await route.continue(); } catch { /* already handled */ } }
    });

    page.on('response', (response) => {
      const request = response.request();
      let id = null;
      try { id = request.headers()['x-core-lab-request'] || null; } catch { /* gone */ }
      const record = id ? pending.get(id) : null;
      if (!record) return;
      const headers = response.headers();
      record.status = response.status();
      record.duration_ms = Math.max(0, Date.now() - Date.parse(record.started_at));
      record.response_headers = sanitiseHeaders(headers);
      record.server_trace_id = headers['x-core-lab-trace-id'] || null;
      record.server_root_span_id = headers['x-core-lab-root-span-id'] || null;
      record.observability_header = headers['x-core-lab-observability'] || null;
      record.export_status = headers['x-core-lab-export'] || 'unknown';
      record.server_ms = Number(headers['x-core-lab-server-ms']) || null;
      record.server_db_queries = Number(headers['x-core-lab-db-queries']) || null;
      const sent = record.client_trace_id;
      if (record.observability_header === 'disabled') record.correlation = 'not-instrumented';
      else if (record.export_status === 'failed') record.correlation = 'export-failed';
      else if (record.server_trace_id && record.server_trace_id === sent) record.correlation = 'matched';
      else if (record.server_trace_id) record.correlation = 'server-generated';
      else record.correlation = 'no-server-trace';
      pending.delete(id);
    });

    page.on('requestfailed', (request) => {
      let id = null;
      try { id = request.headers()['x-core-lab-request'] || null; } catch { /* gone */ }
      const record = id ? pending.get(id) : null;
      if (!record) return;
      record.error = safeText(request.failure()?.errorText || 'request failed', 200);
      record.duration_ms = Math.max(0, Date.now() - Date.parse(record.started_at));
      record.correlation = 'request-failed';
      pending.delete(id);
    });
  }

  function beginAction(kind, label) {
    const id = 'a' + (++actionSeq);
    const action = { id, side, environment_id: environmentId || side, kind, label: safeText(label || kind, 160), started_at: nowIso(), duration_ms: 0, request_ids: [] };
    actionStack.push(action); trace.actions.push(action);
    return action;
  }
  function endAction(action, error = null) {
    if (!action) return;
    action.duration_ms = Math.max(0, Date.now() - Date.parse(action.started_at));
    if (error) action.error = safeText(error.message || error, 200);
    const i = actionStack.lastIndexOf(action); if (i >= 0) actionStack.splice(i, 1);
  }
  async function action(kind, label, fn) {
    const a = beginAction(kind, label);
    try { return await fn(a); } catch (e) { endAction(a, e); throw e; } finally { if (actionStack.includes(a)) endAction(a); }
  }

  async function flush(file) {
    if (flushed) return trace;
    flushed = true;
    // A response can arrive after the last action; give the browser and Drupal a moment to finish. This is not a retry
    // loop: a request that still has no response is reported as pending, not invented.
    await new Promise((r) => setTimeout(r, 350));
    for (const r of trace.requests) if (r.correlation === 'pending') {
      // A page navigation can cancel an in-flight request (for example a redirect chain). Say so rather than guessing.
      r.correlation = r.status === null ? 'request-failed' : r.correlation;
      if (r.status === null && !r.error) r.error = 'no response observed before the run ended';
    }
    if (file) {
      fs.mkdirSync(file.substring(0, file.lastIndexOf('/')) || '.', { recursive: true });
      fs.writeFileSync(file, JSON.stringify(trace, null, 2));
    }
    log(`observability: ${trace.requests.length} request(s), ${trace.requests.filter((r) => r.correlation === 'matched').length} matched`);
    return trace;
  }

  return { trace, action, beginAction, endAction, flush };
}

// Correlation counts used by the run summary (not the manifest builder, which recomputes from the sanitised data).
export function correlationSummary(records = []) {
  const by = (s) => records.filter((r) => r.correlation === s).length;
  return {
    requests: records.length, matched: by('matched'), server_generated: by('server-generated'),
    missing: by('no-server-trace'), not_instrumented: by('not-instrumented'), failed: by('request-failed'), export_failed: by('export-failed'), pending: by('pending'),
  };
}
