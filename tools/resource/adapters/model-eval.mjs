// Adapter for the recorded paired model evaluation. These are provider-reported tokens and client-reported costs from
// reports/ai-usage/model-eval/trials.json; importing them does not call a model.
import fs from 'node:fs';
import path from 'node:path';
import { labRoot } from '../ledger.mjs';
import { makeEvent, iso, safeText } from '../events.mjs';

const TRIALS = path.join(labRoot, 'reports/ai-usage/model-eval/trials.json');
const RESULTS = path.join(labRoot, 'reports/ai-usage/model-eval/RESULTS.md');

export function collectModelEval() {
  if (!fs.existsSync(TRIALS)) return { events: [], errors: [`no recorded trials at ${path.relative(labRoot, TRIALS)}`], metadata: {} };
  let trials;
  try { trials = JSON.parse(fs.readFileSync(TRIALS, 'utf8')); } catch (e) { return { events: [], errors: [`trials.json could not be read: ${e.message}`], metadata: {} }; }
  const text = fs.existsSync(RESULTS) ? fs.readFileSync(RESULTS, 'utf8') : '';
  const model = (text.match(/model `([^`]+)`/) || [])[1] || null;
  const events = (Array.isArray(trials) ? trials : []).map((t, i) => makeEvent({
    event_type: 'ai-usage',
    occurred_at: iso(new Date(Date.UTC(2026, 9, 15, 0, 0, t.trial || i))),
    duration_ms: Number.isFinite(t.ms) ? t.ms : null,
    issue: null, variant: null,
    task: { id: 'model-eval', label: 'Paired model evaluation (intake/repair)', execution_id: 'model-eval-2026-10-15' },
    activity: 'model-evaluation', tool: 'claude-cli', model, provider: model ? 'anthropic' : null,
    environment: { os: null, node: null, runner: 'local', ddev: null, docker: null },
    outcome: t.ok ? 'success' : 'failure', validation: 'not-run', commit: null, patch: null,
    source: { adapter: 'model-eval-trials', method: 'reports/ai-usage/model-eval/trials.json', confidence: 'provider-reported', reference: 'reports/ai-usage/model-eval/trials.json' },
    measurements: {
      tokens: { input_total: Number(t.inTok) || 0, uncached_input: null, output: Number(t.outTok) || 0, cache_creation: null, cache_read: null, reasoning: null, model_requests: 1, token_basis: 'provider-reported' },
      cost: { reported_usd: null, estimated_usd: Number.isFinite(t.usd) ? t.usd : null, basis: Number.isFinite(t.usd) ? 'client-reported-estimate' : 'unavailable', note: 'Client-reported cost for a `claude -p` call; subscription allowance, not an invoice.' },
      tools: { invocations: 0, result_bytes: null, repeated_reads: null, errors: t.ok ? 0 : 1 },
      context: { start_tokens: null, average_tokens: null, growth_tokens: null },
      latency: { api_ms: Number.isFinite(t.ms) ? t.ms : null, tool_ms: null },
    },
    quality: {
      completeness: 'partial', missing: ['input_token_split', 'cache_tokens', 'cpu', 'memory', 'io', 'network', 'exact_cost', 'validation'],
      notes: ['Recorded model-evaluation trial; no CPU, memory or infrastructure measurement was taken for these calls. The input total is reported by the client but not split into uncached/cache categories.'],
    },
    source_key: `model-eval:${t.eval}:${t.case}:${t.cond}:${t.trial}`,
    private: { eval: t.eval, case: t.case, condition: t.cond, trial: t.trial, score: t.score, parsed: t.parsed },
  }));
  return { events, errors: [], metadata: { trials: events.length, model, source: path.relative(labRoot, TRIALS) } };
}

export { safeText };
