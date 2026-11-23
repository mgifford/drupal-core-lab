// Claude Code adapter. It deliberately calls the existing scripts/session-usage.mjs and reads its JSON instead of
// re-implementing transcript parsing. That script collapses repeated message ids, so usage is counted once.
//
// Two accounting scopes are produced:
//   * one `ai-request` event per observable provider message id (request-level, preferred);
//   * one session roll-up event for reconciliation, context, latency and prompt provenance.
// The roll-up is counted only when request usage cannot be reconciled; otherwise its token fields are null and the
// request events carry the usage. `accounting.counted` makes that choice explicit, so the two are never added together.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync, execFileSync } from 'node:child_process';
import { labRoot } from '../ledger.mjs';
import { makeEvent, iso, safeText } from '../events.mjs';
import {
  allocateActivity, allocateOperations, explorationSubcategories, classifyRequestOperations,
  CLASSIFIER_VERSION, issueFromText, variantFromText, classifyTool,
} from '../classify.mjs';
import { explorationDiagnostics } from '../exploration.mjs';
import { provenanceSummary } from '../artifacts.mjs';
import { loadTasks, taskForSession } from '../tasks.mjs';

const PROJECTS = path.join(os.homedir(), '.claude/projects');
export const REQUEST_ACCOUNTING_VERSION = 'request-level-v1';

export function currentCommit() {
  try { return execFileSync('git', ['-C', labRoot, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(); } catch { return null; }
}

const tokensOfRequest = (r) => r.usage.input + r.usage.cacheWrite + r.usage.cacheRead + r.usage.output;

function classificationOf(detail, operationCount) {
  const unknown = detail.activity === 'unknown';
  return {
    version: CLASSIFIER_VERSION,
    method: 'request-level',
    method_version: REQUEST_ACCOUNTING_VERSION,
    provenance: detail.provenance || 'unclassified',
    confidence: detail.confidence || (unknown ? 'unclassified' : 'deterministic'),
    subcategory: detail.subcategory || null,
    unknown_reasons: unknown ? [{ reason: detail.unknown_reason || 'unclassified_other', operations: operationCount }] : [],
    components: (detail.components?.length ? detail.components : [{ activity: detail.activity, rule_id: detail.rule_id }]).map((c) => ({
      activity: c.activity, operations: operationCount, unknown_reason: c.unknown_reason ?? null, subcategory: c.subcategory ?? null,
    })),
    notes: detail.notes || [],
  };
}

function reconcile({ session, requests }) {
  const sessionTokens = (Number(session.inputSide) || 0) + (Number(session.output) || 0);
  const requestTokens = requests.reduce((n, r) => n + tokensOfRequest(r), 0);
  const delta = requestTokens - sessionTokens;
  const expected = Number(session.calls) || 0;
  const status = !requests.length ? 'unavailable'
    : (delta === 0 && requests.length === expected && (session.requestsMissingUsage || 0) === 0 ? 'matched' : 'mismatch');
  return {
    session_tokens: sessionTokens,
    request_tokens: requestTokens,
    delta,
    expected_requests: expected,
    request_count: requests.length,
    missing_usage: Number(session.requestsMissingUsage) || 0,
    duplicate_ids: Number(session.duplicateUsageRecords) || 0,
    model_only_requests: requests.filter((r) => !r.ops.length).length,
    multi_tool_requests: requests.filter((r) => r.ops.length > 1).length,
    status,
  };
}

export function collectClaude({ activity = null, issue = null, variant = null, files = [], since = null, promptContent = false, inspectArtifacts = false, tasksFile = undefined } = {}) {
  const tasks = loadTasks(tasksFile ? { file: tasksFile } : {});
  const stamp = Date.now();
  const tmp = path.join(labRoot, '.lab-cache/resource-ledger', `session-usage-${stamp}.json`);
  const tmpProvenance = path.join(labRoot, '.lab-cache/resource-ledger', `session-provenance-${stamp}.json`);
  fs.mkdirSync(path.dirname(tmp), { recursive: true });
  const promptDir = path.join(labRoot, '.lab-cache/resource-ledger/prompt-content');
  const argv = [path.join(labRoot, 'scripts/session-usage.mjs'), '--json', tmp, '--sequences', '--requests', '--provenance', tmpProvenance, ...(promptContent ? ['--prompt-content', promptDir] : []), ...(inspectArtifacts ? ['--inspect-artifacts'] : []), ...files];
  const r = spawnSync(process.execPath, argv, { cwd: labRoot, encoding: 'utf8', timeout: 180000, maxBuffer: 128 * 1024 * 1024 });
  if (r.status !== 0) {
    const detail = String(r.stderr || r.stdout || '').trim().split('\n').slice(-3).join(' ');
    for (const f of [tmp, tmpProvenance]) { try { fs.rmSync(f, { force: true }); } catch { /* none */ } }
    return { events: [], errors: [`session-usage.mjs failed: ${safeText(detail, 300)}`], metadata: { transcripts: 0 } };
  }
  let data, provenance = { sessions: [] };
  try { data = JSON.parse(fs.readFileSync(tmp, 'utf8')); } catch (e) { return { events: [], errors: [`session-usage JSON could not be read: ${e.message}`], metadata: {} }; }
  try { provenance = JSON.parse(fs.readFileSync(tmpProvenance, 'utf8')); } catch { /* provenance is optional */ }
  const provenanceByFile = new Map((provenance.sessions || []).map((x) => [x.file, x.prompts || []]));
  for (const f of [tmp, tmpProvenance]) { try { fs.rmSync(f, { force: true }); } catch { /* none */ } }

  const sessions = Array.isArray(data) ? data : (data.sessions || []);
  const events = [];
  const errors = [];
  const metadata = { transcripts: sessions.length, request_level_sessions: 0, fallback_sessions: 0, reconciled_requests: 0, prompts: 0, prompt_bytes: 0, artifacts: 0, prompt_content: promptContent ? 'opt-in' : 'metadata-only', explicit_tasks: 0 };

  for (const s of sessions) {
    if (since && String(s.to || '').slice(0, 10) < since) continue;
    const title = s.title || '';
    const detectedIssue = issue || issueFromText(title);
    const detectedVariant = variant || variantFromText(title);
    const tokens = (Number(s.inputSide) || 0) + (Number(s.output) || 0);
    const models = String(s.models || '').split(',').map((x) => x.trim()).filter(Boolean);
    const provider = models.some((m) => /claude|anthropic/i.test(m)) ? 'anthropic' : null;
    const started = s.from || null, ended = s.to || null;
    const duration = started && ended ? Math.max(0, Date.parse(ended) - Date.parse(started)) : null;
    const requests = Array.isArray(s.requests) ? s.requests : [];
    const ops = requests.flatMap((x) => x.ops || []);
    const allocation = ops.length ? allocateOperations(ops, tokens, null) : allocateActivity(s.tools || {}, tokens, null);
    const reconciliation = reconcile({ session: s, requests });
    const requestLevel = reconciliation.status === 'matched';
    if (requestLevel) { metadata.request_level_sessions++; metadata.reconciled_requests += requests.length; } else metadata.fallback_sessions++;

    const explicitTask = taskForSession(tasks, s.file);
    if (explicitTask) metadata.explicit_tasks++;
    const taskInput = explicitTask ? {
      id: explicitTask.task_id, label: explicitTask.label || 'Explicit task', execution_id: s.file,
      kind: explicitTask.kind ?? null, state: explicitTask.state ?? null,
      expected_deliverable: explicitTask.expected_deliverable ?? null, verified: explicitTask.verified ?? null,
    } : { id: `claude-session:${s.file}`, label: title || 'Claude Code session', execution_id: s.file, kind: null, state: null, expected_deliverable: null, verified: null };
    const promptMeta = provenanceByFile.get(s.file) || [];
    const promptSummary = s.promptSummary || provenanceSummary(promptMeta);
    metadata.prompts += promptSummary.prompts || 0;
    metadata.prompt_bytes += promptSummary.prompt_bytes || 0;
    metadata.artifacts += promptSummary.artifacts || 0;

    const sessionClassification = {
      ...allocation.classification,
      method: requestLevel ? 'session-rollup' : 'tool-call-share',
      method_version: requestLevel ? REQUEST_ACCOUNTING_VERSION : allocation.classification.method_version,
      exploration_subcategories: explorationSubcategories(ops),
      notes: [
        ...(allocation.classification.notes || []),
        ...(requestLevel ? ['Session token fields are null because request-level events carry the usage.'] : []),
      ],
    };
    if (activity) {
      sessionClassification.provenance = 'explicit_task_metadata';
      sessionClassification.confidence = 'deterministic';
      sessionClassification.notes = ['Activity explicitly overridden by the collector.'];
    }

    // request-level events
    const requestEvents = [];
    let allocatedCost = 0;
    const sessionTokens = reconciliation.session_tokens;
    requests.forEach((req, index) => {
      const detailBase = activity ? { activity, provenance: 'explicit_task_metadata', confidence: 'deterministic', unknown_reason: null, subcategory: null, components: [{ activity, rule_id: 'collector.override' }], notes: [] } : classifyRequestOperations(req.ops || []);
      const detail = { ...detailBase, activity: activity || detailBase.activity };
      const classification = classificationOf(detail, Math.max(1, (req.ops || []).length));
      if (activity) { classification.provenance = 'explicit_task_metadata'; classification.confidence = 'deterministic'; classification.unknown_reasons = []; }
      const reqTokens = tokensOfRequest(req);
      let cost = null;
      if (typeof s.usd === 'number' && sessionTokens > 0) {
        cost = index === requests.length - 1 ? Math.max(0, s.usd - allocatedCost) : Math.round(s.usd * (reqTokens / sessionTokens) * 1e6) / 1e6;
        allocatedCost += cost;
      }
      requestEvents.push(makeEvent({
        event_type: 'ai-request',
        occurred_at: req.timestamp || started || iso(),
        duration_ms: null,
        issue: detectedIssue, variant: detectedVariant,
        task: taskInput,
        activity: detail.activity,
        tool: 'claude-code', model: req.model || models.join(', ') || null, provider,
        environment: { os: `${process.platform} ${process.arch}`, node: process.version, runner: 'local', ddev: null, docker: null },
        outcome: 'unknown', validation: 'unknown', commit: null, patch: null,
        source: { adapter: 'claude-transcripts', method: 'scripts/session-usage.mjs --requests (message.id deduplication)', confidence: 'provider-reported', reference: null },
        classification,
        accounting: { scope: 'request', counted: requestLevel, method_version: REQUEST_ACCOUNTING_VERSION, parent_source_key: `claude:${s.file}`, fallback_reason: requestLevel ? null : 'request totals did not reconcile with the session total' },
        measurements: {
          tokens: {
            input_total: req.usage.input + req.usage.cacheWrite + req.usage.cacheRead,
            uncached_input: req.usage.input,
            output: req.usage.output,
            cache_creation: req.usage.cacheWrite,
            cache_read: req.usage.cacheRead,
            reasoning: req.usage.thinking,
            model_requests: 1,
            token_basis: 'provider-reported',
          },
          cost: { reported_usd: null, estimated_usd: cost, basis: cost == null ? 'unavailable' : 'estimated', note: cost == null ? null : 'Derived: session cost-state estimate shared by request token total; not a per-request invoice.' },
          tools: { invocations: (req.ops || []).length, result_bytes: req.resultBytes ?? 0, repeated_reads: 0, errors: req.errors ?? 0 },
          context: { start_tokens: null, average_tokens: req.usage.input + req.usage.cacheWrite + req.usage.cacheRead, growth_tokens: null },
          latency: { api_ms: null, tool_ms: null },
        },
        quality: { completeness: 'partial', missing: ['cpu', 'memory', 'io', 'network', 'exact_cost', 'request_duration', 'outcome'].concat(req.missingResults ? ['tool_results'] : []), notes: ['One provider message id; tokens are provider-reported. Duration per request is not exposed by the client.'] },
        source_key: `claude:${s.file}:request:${req.id}`,
        private: { transcript: s.file, request_id: req.id, client: s.client, title: safeText(title, 200) },
      }));
    });

    // session roll-up: always present for context, latency, prompt provenance and reconciliation
    events.push(makeEvent({
      event_type: 'ai-usage',
      occurred_at: started || iso(),
      duration_ms: duration,
      issue: detectedIssue, variant: detectedVariant,
      task: taskInput,
      activity: activity || (requestLevel ? (allocation.activity || 'unknown') : sessionClassification.components?.[0]?.activity || allocation.activity || 'unknown'),
      tool: 'claude-code', model: models.join(', ') || null, provider,
      environment: { os: `${process.platform} ${process.arch}`, node: process.version, runner: 'local', ddev: null, docker: null },
      outcome: 'unknown', validation: 'unknown', commit: null, patch: null,
      source: { adapter: 'claude-transcripts', method: requestLevel ? 'scripts/session-usage.mjs; request-level message.id deduplication and reconciliation' : 'scripts/session-usage.mjs (message.id deduplication)', confidence: 'provider-reported', reference: null },
      classification: sessionClassification,
      accounting: { scope: 'session', counted: !requestLevel, method_version: requestLevel ? REQUEST_ACCOUNTING_VERSION : 'legacy-session-v1', fallback_reason: requestLevel ? null : (reconciliation.status === 'mismatch' ? 'request totals did not reconcile; session total counts' : null) },
      provenance: { ...promptSummary, capture: promptContent ? 'content' : 'metadata' },
      reconciliation,
      measurements: {
        tokens: requestLevel ? {
          input_total: null, uncached_input: null, output: null, cache_creation: null, cache_read: null,
          reasoning: null, model_requests: null, token_basis: 'unavailable',
        } : {
          input_total: Number(s.inputSide) || 0,
          uncached_input: Number(s.input) || 0,
          output: Number(s.output) || 0,
          cache_creation: Number(s.cacheWrite) || 0,
          cache_read: Number(s.cacheRead) || 0,
          reasoning: Number(s.thinking) || 0,
          model_requests: Number(s.calls) || 0,
          token_basis: 'provider-reported',
        },
        cost: requestLevel ? { reported_usd: null, estimated_usd: null, basis: 'unavailable', note: null } : { reported_usd: null, estimated_usd: typeof s.usd === 'number' ? s.usd : null, basis: typeof s.usd === 'number' ? 'client-reported-estimate' : 'unavailable', note: 'Claude Code cost-state estimate; may be subscription allowance, not an invoice.' },
        tools: { invocations: requestLevel ? null : Number(s.toolCalls) || 0, result_bytes: requestLevel ? null : Number(s.toolResultBytes) || 0, repeated_reads: Number(s.repeatedReads) || 0, errors: requestLevel ? null : Number(s.toolErrors) || 0 },
        context: { start_tokens: Number(s.firstCallContext) || null, average_tokens: Number(s.avgContext) || null, growth_tokens: null },
        latency: { api_ms: Number.isFinite(s.apiMs) ? s.apiMs : null, tool_ms: Number.isFinite(s.toolMs) ? s.toolMs : null },
        exploration: explorationDiagnostics(requests),
        allocations: allocation.allocations,
      },
      quality: { completeness: 'partial', missing: ['cpu', 'memory', 'io', 'network', 'exact_cost', 'outcome'], notes: [
        requestLevel ? 'Request-level events carry the token and cost usage; this session row is a reconciliation and context record.' : 'Session-level tokens are counted because request-level usage did not reconcile.',
        'Token usage is provider-reported in the client transcript; cost is a client estimate, not an invoice.',
      ] },
      source_key: `claude:${s.file}`,
      private: { title: safeText(title, 200), transcript: s.file, models, user_turns: s.userTurns, fixed_share: s.fixedShare, client: s.client, tools: s.tools, prompts: promptMeta },
    }));
    events.push(...requestEvents);
    if (requests.length && reconciliation.status === 'mismatch') errors.push(`request totals for ${safeText(s.file, 60)} did not reconcile (${reconciliation.delta}); the session total is counted and request rows are marked uncounted.`);
  }
  return { events, errors, metadata: { ...metadata, sequences: data.sequences || null } };
}

export { classifyTool };
