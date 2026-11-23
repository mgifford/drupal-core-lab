// Claude Code adapter. It deliberately calls the existing scripts/session-usage.mjs and reads its JSON instead of
// re-implementing transcript parsing. That script already collapses repeated message ids, so usage is counted once.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync, execFileSync } from 'node:child_process';
import { labRoot } from '../ledger.mjs';
import { makeEvent, iso, totalTokens, safeText } from '../events.mjs';
import { allocateActivity, issueFromText, variantFromText, classifyTool } from '../classify.mjs';

const PROJECTS = path.join(os.homedir(), '.claude/projects');

export function currentCommit() {
  try { return execFileSync('git', ['-C', labRoot, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(); } catch { return null; }
}

export function collectClaude({ activity = null, issue = null, variant = null, files = [], since = null } = {}) {
  const tmp = path.join(labRoot, '.lab-cache/resource-ledger', `session-usage-${Date.now()}.json`);
  fs.mkdirSync(path.dirname(tmp), { recursive: true });
  const argv = [path.join(labRoot, 'scripts/session-usage.mjs'), '--json', tmp, '--sequences', ...files];
  const r = spawnSync(process.execPath, argv, { cwd: labRoot, encoding: 'utf8', timeout: 180000, maxBuffer: 64 * 1024 * 1024 });
  if (r.status !== 0) {
    const detail = String(r.stderr || r.stdout || '').trim().split('\n').slice(-3).join(' ');
    try { fs.rmSync(tmp, { force: true }); } catch { /* none */ }
    return { events: [], errors: [`session-usage.mjs failed: ${safeText(detail, 300)}`], metadata: { transcripts: 0 } };
  }
  let data;
  try { data = JSON.parse(fs.readFileSync(tmp, 'utf8')); } catch (e) { return { events: [], errors: [`session-usage JSON could not be read: ${e.message}`], metadata: {} }; }
  try { fs.rmSync(tmp, { force: true }); } catch { /* none */ }
  const sessions = Array.isArray(data) ? data : (data.sessions || []);
  const events = [];
  const errors = [];
  for (const s of sessions) {
    if (since && String(s.to || '').slice(0, 10) < since) continue;
    const title = s.title || '';
    const detectedIssue = issue || issueFromText(title);
    const detectedVariant = variant || variantFromText(title);
    const tokens = (Number(s.inputSide) || 0) + (Number(s.output) || 0);
    const allocation = allocateActivity(s.tools || {}, tokens, null);
    const activityForEvent = activity || allocation.activity || 'unknown';
    const models = String(s.models || '').split(',').map((x) => x.trim()).filter(Boolean);
    const provider = models.some((m) => /claude|anthropic/i.test(m)) ? 'anthropic' : null;
    const started = s.from || null, ended = s.to || null;
    const duration = started && ended ? Math.max(0, Date.parse(ended) - Date.parse(started)) : null;
    const missing = ['cpu', 'memory', 'io', 'network', 'exact_cost', 'outcome'];
    events.push(makeEvent({
      event_type: 'ai-usage',
      occurred_at: started || iso(),
      duration_ms: duration,
      issue: detectedIssue, variant: detectedVariant,
      task: { id: `claude-session:${s.file}`, label: title || 'Claude Code session', execution_id: s.file },
      activity: activityForEvent,
      tool: 'claude-code', model: models.join(', ') || null, provider,
      environment: { os: `${process.platform} ${process.arch}`, node: process.version, runner: 'local', ddev: null, docker: null },
      outcome: 'unknown', validation: 'unknown', commit: null, patch: null,
      source: { adapter: 'claude-transcripts', method: 'scripts/session-usage.mjs (message.id deduplication)', confidence: 'provider-reported', reference: s.file ? `local transcript: ${s.file}` : null },
      measurements: {
        tokens: {
          input_total: Number(s.inputSide) || 0,
          uncached_input: Number(s.input) || 0,
          output: Number(s.output) || 0,
          cache_creation: Number(s.cacheWrite) || 0,
          cache_read: Number(s.cacheRead) || 0,
          reasoning: Number(s.thinking) || 0,
          model_requests: Number(s.calls) || 0,
          token_basis: 'provider-reported',
        },
        cost: { reported_usd: null, estimated_usd: typeof s.usd === 'number' ? s.usd : null, basis: typeof s.usd === 'number' ? 'client-reported-estimate' : 'unavailable', note: 'Claude Code cost-state estimate; may be subscription allowance, not an invoice.' },
        tools: { invocations: Number(s.toolCalls) || 0, result_bytes: Number(s.toolResultBytes) || 0, repeated_reads: Number(s.repeatedReads) || 0, errors: Number(s.toolErrors) || 0 },
        context: { start_tokens: Number(s.firstCallContext) || null, average_tokens: Number(s.avgContext) || null, growth_tokens: null },
        latency: { api_ms: Number.isFinite(s.apiMs) ? s.apiMs : null, tool_ms: Number.isFinite(s.toolMs) ? s.toolMs : null },
        allocations: allocation.allocations,
      },
      quality: { completeness: 'partial', missing, notes: ['Token usage is provider-reported in the client transcript; cost is a client estimate, not an invoice. This event has no CPU or memory measurement for the session process.'] },
      source_key: `claude:${s.file}`,
      private: { title: safeText(title, 200), transcript: s.file, models, user_turns: s.userTurns, fixed_share: s.fixedShare, client: s.client, tools: s.tools },
    }));
  }
  return { events, errors, metadata: { transcripts: sessions.length, sequences: data.sequences || null } };
}

export { classifyTool };
