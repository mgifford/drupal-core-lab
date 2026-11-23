#!/usr/bin/env node
// Deterministic resource accounting CLI.
//   node scripts/resource.mjs collect [--source=claude,model-eval,measure-resources,github,docker|all]
//        [--activity=...] [--issue=...] [--variant=...] [--since=YYYY-MM-DD] [--samples=3] [--interval=1000] [--dry-run] [--json]
//        [--prompt-content] [--inspect-artifacts]   prompt/artifact metadata is the default; content and ZIP/patch reads are opt-in
//   node scripts/resource.mjs recent [--limit=20] [--json]
//   node scripts/resource.mjs report [--write] [--check] [--baseline] [--out=directory] [--json]
//   node scripts/resource.mjs export [--out=cloud/resources.json] [--json]
//   node scripts/resource.mjs audit [--json=<file>]   deterministic Unknown/attribution investigation
//   node scripts/resource.mjs verify
// It never calls a model. Raw source references stay in .lab-cache/resource-ledger/; reports contain only the public
// allowlist in tools/resource/events.mjs.
import fs from 'node:fs';
import path from 'node:path';
import { labRoot, loadEvents, appendEvents, recent as recentLedger, monitoringEvent, LEDGER_FILE } from '../tools/resource/ledger.mjs';
import { makeEvent, publicEvent, totalTokens, iso, validateEvent } from '../tools/resource/events.mjs';
import { aggregate, publicRows } from '../tools/resource/aggregate.mjs';
import { formatBytes } from '../tools/resource/units.mjs';
import { loadBudgets } from '../tools/resource/budgets.mjs';
import { assertPublic } from '../tools/resource/public.mjs';
import { collectClaude } from '../tools/resource/adapters/claude.mjs';
import { collectModelEval } from '../tools/resource/adapters/model-eval.mjs';
import { collectMeasureResources } from '../tools/resource/adapters/measure-resources.mjs';
import { collectDocker } from '../tools/resource/adapters/docker.mjs';
import { collectGithubActions } from '../tools/resource/adapters/github-actions.mjs';

const args = process.argv.slice(2), cmd = args[0];
const val = (n, d = null) => {
  const a = args.find((x) => x.startsWith(`--${n}=`)); if (a) return a.slice(n.length + 3);
  const i = args.indexOf(`--${n}`); return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : d;
};
const has = (n) => args.some((x) => x === `--${n}` || x.startsWith(`--${n}=`));
const say = (s = '') => console.log(s);
const sources = (val('source', 'claude,model-eval,measure-resources') || '').split(',').map((x) => x.trim()).filter(Boolean);
const wants = (name) => sources.includes('all') || sources.includes(name);

function writeJson(file, value) { fs.mkdirSync(path.dirname(path.resolve(file)), { recursive: true }); fs.writeFileSync(path.resolve(file), `${JSON.stringify(value, null, 2)}\n`); }

async function collect() {
  const startedAt = iso(), started = performance.now();
  const all = [], errors = [], metadata = {};
  if (wants('claude')) { const r = collectClaude({ activity: val('activity'), issue: val('issue'), variant: val('variant'), since: val('since'), promptContent: has('prompt-content'), inspectArtifacts: has('inspect-artifacts') }); all.push(...r.events); errors.push(...r.errors); metadata.claude = r.metadata; }
  if (wants('model-eval')) { const r = collectModelEval(); all.push(...r.events); errors.push(...r.errors); metadata.modelEval = r.metadata; }
  if (wants('measure-resources')) { const r = collectMeasureResources({ issue: val('issue'), variant: val('variant') }); all.push(...r.events); errors.push(...r.errors); metadata.measureResources = r.metadata; }
  if (wants('github')) { const r = await collectGithubActions({ limit: Number(val('limit', '100')), jobsFor: Number(val('jobs', '20')), issue: val('issue'), variant: val('variant') }); all.push(...r.events); errors.push(...r.errors); metadata.github = r.metadata; }
  if (wants('docker')) { const r = await collectDocker({ samples: Number(val('samples', '1')), intervalMs: Number(val('interval', '1000')), issue: val('issue'), variant: val('variant') }); all.push(...r.events); errors.push(...r.errors); metadata.docker = r.metadata; }
  // Explicit labels are a deliberate human override; otherwise the adapter's deterministic classification stands.
  const label = val('activity'), issue = val('issue'), variant = val('variant');
  const events = all.filter((e) => !val('since') || String(e.occurred_at).slice(0, 10) >= val('since'))
    .map((e) => (label || issue || variant) ? makeEvent({ ...e, activity: label || e.activity, issue: e.issue ?? issue, variant: e.variant ?? variant }) : e);
  if (has('dry-run')) {
    for (const e of events) { const check = validateEvent(e); if (!check.ok) errors.push(`invalid event from ${e.source.adapter}: ${check.errors.slice(0, 3).map((x) => `${x.path || '/'} ${x.message}`).join('; ')}`); }
  }
  let appended = { added: [], skipped: [] };
  if (!has('dry-run') && events.length) appended = appendEvents(events);
  if (!has('dry-run')) appendEvents([monitoringEvent({ adapter: 'resource-collect', startedAt, durationMs: Math.round(performance.now() - started), note: 'This collector run only; source parsing and ledger I/O.' })]);
  const out = { generated_at: iso(), sources, metadata, collected: events.length, added: appended.added.length, skipped: appended.skipped.length, errors };
  if (val('json')) writeJson(val('json'), out);
  say(has('dry-run') ? `Would collect ${events.length} event(s).` : `Collected ${events.length} event(s); ${appended.added.length} new, ${appended.skipped.length} already recorded.`);
  for (const [name, m] of Object.entries(metadata)) if (m && Object.keys(m).length) say(`  ${name}: ${Object.entries(m).filter(([k]) => !['sequences'].includes(k)).map(([k, v]) => `${k}=${typeof v === 'object' ? JSON.stringify(v).slice(0, 80) : v}`).join(', ')}`);
  if (errors.length) { say('\nSource problems:'); for (const e of errors) say(`  - ${e}`); }
  if (has('dry-run')) say('Dry run: nothing was written.');
  say(`Ledger: ${path.relative(labRoot, LEDGER_FILE)}`);
}

function recent() {
  const { events, invalid } = recentLedger({ limit: Number(val('limit', '20')) });
  if (val('json')) { writeJson(val('json'), { generated_at: iso(), events: events.map(publicEvent), invalid }); say(`${events.length} recent event(s).`); return; }
  say('date        activity                 tool                 issue      tokens      est. USD   CPU s   quality    adapter');
  for (const e of events) {
    const p = publicEvent(e);
    say([p.date.padEnd(10), String(p.activity).padEnd(24), String(p.tool).padEnd(21), String(p.issue || '—').padEnd(10), String(p.tokens.total ?? '—').padStart(10), String(p.cost.estimated_usd ?? '—').padStart(9), String(p.cpu.total_seconds ?? '—').padStart(7), p.quality.completeness.padEnd(10), p.source.adapter].join('  '));
  }
  if (invalid.length) say(`\n${invalid.length} invalid ledger line(s) skipped; run \`node scripts/resource.mjs verify\`.`);
  say(`\nLedger: ${path.relative(labRoot, LEDGER_FILE)}`);
}

function report() {
  const { events, invalid } = loadEvents({ includeMonitoring: true });
  const summary = aggregate(events);
  summary.events = publicRows(events);
  summary.monitoring = summary.totals.monitoring;
  summary.data_quality = summary.quality;
  summary.privacy = {
    public_fields: 'Aggregates and grouped rows only; no transcript titles, paths, prompts, responses, API keys, account ids or precise work timestamps.',
    raw_ledger: 'Local-only ledger; not committed and not published.',
    missing_is_not_zero: true,
  };
  summary.limitations = [
    'AI token and cost values are only as complete as the local Claude Code transcripts and recorded model-eval trials. Other agents and API clients are not represented yet.',
    'Cost is a client-reported estimate (or an estimate where no provider cost exists), not an invoice or subscription statement. Per-request cost is derived from the session estimate by token share. Missing cost is null, never zero.',
    'Request-level activity is associated with the context processed at that request; it is not proof that the activity caused every token. Legacy session rows use a different method and are not directly comparable.',
    'Unknown is a measurement gap, not waste. Tool-free requests have no tool-based activity evidence; unrecognized inline code and unsupported clients remain explicitly Unknown.',
    'Prompt and artifact provenance is metadata-only by default. The effective provider request, hidden instructions and client-added attachments are only partly observable; a reference does not prove ingestion.',
    'CPU-seconds come from measured processes, or are derived from sampled Docker percentages. They are not hardware cycle counts and do not include host-wide work such as Mutagen, the DDEV router or the OS.',
    'GitHub Actions duration comes from the API; billable minutes and runner CPU are unavailable. Overlap/supersession is inferred.',
    'The collector runs on demand; a period with no events is not proof that no work happened.',
    'Recorded duration is the sum of event spans and may include idle time; it is not active development time.',
    'This report does not claim that lower resource use means lower energy use or emissions.',
  ];
  summary.budget = (() => { const b = loadBudgets(); return { mode: b.config.mode, source: b.source, problems: b.problems, limits: b.config.limits }; })();
  assertPublic(summary, 'reports/resources/summary.json');
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outDir = path.resolve(labRoot, val('out', 'reports/resources'));
  const jsonFile = path.join(outDir, 'summary.json');
  const mdFile = path.join(outDir, has('baseline') ? 'BASELINE.md' : 'SUMMARY.md');
  const baselineJson = path.join(outDir, 'baseline.json');
  const md = markdown(summary);
  const canonical = (x) => { const c = JSON.parse(JSON.stringify(x)); delete c.generated_at; return `${JSON.stringify(c, null, 2)}\n`; };
  const canonicalMd = (x) => x.replace(/^Generated .*?\. Period:/m, 'Generated [time]. Period:');
  if (has('check')) {
    const same = fs.existsSync(jsonFile) && canonical(JSON.parse(fs.readFileSync(jsonFile, 'utf8'))) === canonical(summary)
      && fs.existsSync(path.join(outDir, 'SUMMARY.md')) && canonicalMd(fs.readFileSync(path.join(outDir, 'SUMMARY.md'), 'utf8')) === canonicalMd(markdown(summary, false));
    say(same ? 'reports/resources is up to date.' : 'reports/resources is out of date. Run: node scripts/resource.mjs report --write');
    if (!same) process.exit(1);
    return;
  }
  if (has('write') || has('baseline')) {
    fs.mkdirSync(outDir, { recursive: true });
    writeJson(jsonFile, summary);
    fs.writeFileSync(path.join(outDir, 'SUMMARY.md'), markdown(summary, false));
    if (has('baseline')) {
      fs.writeFileSync(path.join(outDir, 'BASELINE.md'), markdown(summary, true));
      writeJson(baselineJson, { ...summary, baseline_generated: stamp });
    }
    say(`Wrote ${path.relative(labRoot, jsonFile)}, SUMMARY.md${has('baseline') ? ' and BASELINE.md' : ''}.`);
  }
  if (val('json')) writeJson(val('json'), summary);
  if (!has('write') && !has('baseline') && !has('json')) say(md);
  if (invalid.length) say(`\nWARNING: ${invalid.length} invalid ledger line(s) skipped; run verify.`);
}

function markdown(s, baseline = false) {
  const n = (v, d = 0) => (v == null ? '—' : Number(v).toLocaleString('en-US', { maximumFractionDigits: d }));
  const money = (v) => (v == null ? '—' : `$${Number(v).toFixed(2)} (estimate)`);
  const hours = (v) => (v == null ? '—' : `${(v / 3600).toFixed(3)} h`);
  const pct = (v) => (v == null ? '—' : `${(v * 100).toFixed(1)}%`);
  let md = `# Resource usage${baseline ? ' baseline' : ''}\n\n`;
  md += `Generated ${s.generated_at}. Period: ${s.period.from || '—'} to ${s.period.to || '—'}. Completeness: **${s.completeness}**. No AI model was called to produce this report.\n\n`;
  md += `## Totals\n\n| Metric | Value | Quality |\n|---|---:|---|\n`;
  md += `| Provider-reported AI tokens | ${n(s.totals.ai.tokens)} | ${s.quality.tokens.status} |\n`;
  md += `| — uncached input | ${n(s.totals.ai.uncached_input)} | provider-reported where available |\n`;
  md += `| — cache creation | ${n(s.totals.ai.cache_creation)} | provider-reported where available |\n`;
  md += `| — cache read | ${n(s.totals.ai.cache_read)} | provider-reported where available |\n`;
  md += `| — output | ${n(s.totals.ai.output)} | provider-reported where available |\n`;
  md += `| — reasoning (already inside output) | ${n(s.totals.ai.reasoning)} | provider-reported where available; not added again |\n`;
  md += `| Estimated prompt tokens (bytes/4, not a tokenizer count) | ${n(s.totals.ai.estimated_tokens)} | ${s.totals.ai.estimated_tokens == null ? 'unavailable' : 'estimated'} |\n`;
  md += `| Model requests | ${n(s.totals.ai.model_requests)} | ${s.totals.ai.model_requests == null ? 'unavailable' : 'provider-reported'} |\n`;
  md += `| Estimated AI cost | ${money(s.totals.ai.cost_estimated_usd)} | ${s.quality.cost.status}; not an invoice |\n`;
  md += `| Provider-reported AI cost | ${s.totals.ai.cost_reported_usd == null ? '—' : `$${s.totals.ai.cost_reported_usd.toFixed(2)}`} | ${s.totals.ai.cost_reported_usd == null ? 'unavailable' : 'provider-reported'} |\n`;
  md += `| Process CPU-seconds | ${n(s.totals.cpu.total_seconds, 2)} | ${s.quality.cpu.status} |\n`;
  md += `| CPU-hours | ${hours(s.totals.cpu.total_seconds)} | ${s.quality.cpu.status} |\n`;
  md += `| Peak memory | ${formatBytes(s.totals.cpu.peak_memory_bytes)} | ${s.quality.memory.status} |\n`;
  md += `| GitHub Actions duration | ${hours(s.totals.github.duration_seconds)} (${n(s.totals.github.runs)} runs / ${n(s.totals.github.jobs)} jobs) | ${s.quality.github.status} |\n`;
  md += `| Tasks measured | ${n(s.totals.tasks.measured)} (${n(s.totals.tasks.success)} success, ${n(s.totals.tasks.failure)} failure, ${n(s.totals.tasks.unknown)} unknown) | derived from event outcomes |\n`;
  md += `| Collection overhead | ${hours(s.totals.monitoring.cpu_seconds)} CPU, ${formatBytes(s.totals.monitoring.peak_memory_bytes)} peak | measured |\n\n`;
  md += `## Consumption by activity\n\n| Activity | Events | Tasks | Tokens | Share | Model requests | CPU-hours | Estimated cost | Method |\n|---|---:|---:|---:|---:|---:|---:|---:|---|\n`;
  for (const a of s.by_activity) md += `| ${a.activity} | ${n(a.events)} | ${n(a.tasks)} | ${n(a.tokens)} | ${pct(a.share)} | ${n(a.model_requests)} | ${a.cpu_seconds == null ? '—' : (a.cpu_seconds / 3600).toFixed(3)} | ${a.cost_usd == null ? '—' : `$${a.cost_usd.toFixed(2)}`} | ${a.method || '—'} |\n`;
  md += `\nRows mix two accounting methods: request-level activity where a transcript reconciles, and the older session tool-call-share allocation for historical records. The method column above names them per activity; the dashboard keeps them distinguishable. Request-level activity is associated with the request context and is not proof that the activity caused every token in it.\n\n`;
  if (s.by_exploration_subcategory?.length) {
    md += `## Code exploration subcategories\n\n| Subcategory | Events | Tokens | Share |\n|---|---:|---:|---:|\n`;
    for (const x of s.by_exploration_subcategory) md += `| ${x.subcategory} | ${n(x.events)} | ${n(x.tokens)} | ${pct(x.share)} |\n`;
    md += `\nSubcategories are deterministic from the tool and operation. A repeated lookup is a diagnostic, not proof of waste.\n\n`;
  }
  const a = s.attribution || {};
  md += `## Attribution quality\n\n| Dimension | Measure | Coverage | Basis |\n|---|---:|---:|---|\n`;
  md += `| Activity (events) | ${n(a.activity?.classified)} classified / ${n(a.activity?.unknown)} unknown | ${pct(a.activity?.coverage_events)} | deterministic rules; Unknown kept explicit |\n`;
  md += `| Activity (tokens) | ${n(a.activity?.tokens_classified)} classified / ${n(a.activity?.tokens_unknown)} unknown | ${pct(a.activity?.coverage_tokens)} | provider tokens with derived activity association |\n`;
  md += `| Model requests | ${n(a.model_requests?.classified)} classified / ${n(a.model_requests?.unknown)} unknown | ${pct(a.model_requests?.coverage)} | one event per observable message id |\n`;
  md += `| Tool operations | ${n(a.tool_operations?.total)} recorded / ${n(a.tool_operations?.unknown)} in Unknown events | ${pct(a.tool_operations?.coverage)} | provider/client tool records |\n`;
  md += `| Drupal issue | ${n(a.issue?.events_attributed)} attributed events | ${pct(a.issue?.coverage)} | independent of activity; missing issue is not Unknown activity |\n`;
  md += `| Task (explicit) | ${n(a.task?.events_attributed)} attributed events | ${pct(a.task?.coverage)} | explicit task metadata; session task ids are reported separately |\n`;
  md += `| Task (session id) | ${n(a.task?.session_task_events)} events, ${n(a.task?.session_task_tokens)} tokens | — | a session is not one development task |\n`;
  md += `| Outcome | ${n(a.outcome?.success)} success / ${n(a.outcome?.failure)} failure / ${n(a.outcome?.unknown)} unknown | — | a command result is not a verified outcome |\n\n`;
  md += `Request-level sessions: ${n(a.data?.request_level_sessions)}; legacy sessions: ${n(a.data?.legacy_sessions)}. Uncounted roll-up events: ${n(a.data?.events_uncounted)}. Their token fields are null; they are not added to the totals.\n\n`;
  if (s.by_unknown_reason?.length) {
    md += `## Unknown activity by reason\n\n| Reason | Events | Tokens | Model requests | Operations |\n|---|---:|---:|---:|---:|\n`;
    for (const r of s.by_unknown_reason) md += `| ${r.unknown_reason} | ${n(r.events)} | ${n(r.tokens)} | ${n(r.model_requests)} | ${n(r.operations)} |\n`;
    md += `\nUnknown is a measurement gap, not waste or a quality score. Missing issue attribution is reported separately above.\n\n`;
  }
  if (s.provenance?.prompts) {
    md += `## Prompt and artifact provenance\n\n| Measure | Value |\n|---|---:|\n`;
    md += `| Prompts recorded | ${n(s.provenance.prompts)} |\n| Prompt bytes (recorded text) | ${n(s.provenance.prompt_bytes)} |\n| Repeated prompts within a session | ${n(s.provenance.repeated_prompts)} |\n| Artifact references | ${n(s.provenance.artifacts)} |\n| Artifacts inspected locally | ${n(s.provenance.artifacts_inspected)} |\n| Capture mode | ${s.provenance.capture} |\n\n`;
    md += `Purpose distribution: ${Object.entries(s.provenance.purposes || {}).sort((x, y) => y[1] - x[1]).map(([k, v]) => `${k}=${v}`).join(', ') || '—'}.\n\n`;
    md += `Artifact kinds: ${Object.entries(s.provenance.artifact_kinds || {}).sort((x, y) => y[1] - x[1]).map(([k, v]) => `${k}=${v}`).join(', ') || '—'}. ${s.provenance.note}\n\n`;
  }
  if (s.reconciliation) {
    md += `## Request reconciliation\n\n| Measure | Value |\n|---|---:|\n`;
    md += `| Sessions with request data | ${n(s.reconciliation.sessions_with_request_data)} |\n| Matched / mismatch / unavailable | ${n(s.reconciliation.status.matched)} / ${n(s.reconciliation.status.mismatch)} / ${n(s.reconciliation.status.unavailable)} |\n`;
    md += `| Session tokens | ${n(s.reconciliation.session_tokens)} |\n| Request tokens | ${n(s.reconciliation.request_tokens)} |\n| Difference | ${n(s.reconciliation.delta)} |\n| Requests recorded / expected | ${n(s.reconciliation.request_count)} / ${n(s.reconciliation.expected_requests)} |\n`;
    md += `| Missing usage | ${n(s.reconciliation.missing_usage)} |\n| Duplicate usage records collapsed | ${n(s.reconciliation.duplicate_usage_records)} |\n| Tool-free requests | ${n(s.reconciliation.model_only_requests)} |\n| Multi-tool requests | ${n(s.reconciliation.multi_tool_requests)} |\n\n`;
    md += `${s.reconciliation.method}\n\n`;
  }
  if (s.exploration?.sessions_with_data) {
    md += `## Exploration diagnostics\n\n| Measure | Value |\n|---|---:|\n`;
    for (const k of ['unique_targets', 'repeated_targets', 'repeated_lookups', 'failed_searches', 'exploration_after_failure', 'exploration_after_edit', 'loop_sequences', 'code_map_calls', 'unique_files', 'result_bytes']) md += `| ${k.replace(/_/g, ' ')} | ${n(s.exploration[k])} |\n`;
    md += `\n${s.exploration.note}\n\n`;
  }
  md += `## Classification method versions\n\nClassifier: ${s.methodology?.classifier_version || '—'}. Accounting versions: ${(s.methodology?.accounting_versions || []).join(', ') || '—'}. ${s.methodology?.note || ''}\n\n`;
  md += `## Resource usage by Drupal issue\n\n| Issue | Events | Tasks | Tokens | Model requests | CPU-hours | Duration (h) | Peak memory | Estimated cost | Success / failure |\n|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|\n`;
  for (const i of s.by_issue) md += `| ${i.issue || 'Unattributed'} | ${n(i.events)} | ${n(i.tasks)} | ${n(i.tokens)} | ${n(i.model_requests)} | ${i.cpu_seconds == null ? '—' : (i.cpu_seconds / 3600).toFixed(3)} | ${i.duration_seconds == null ? '—' : (i.duration_seconds / 3600).toFixed(3)} | ${formatBytes(i.peak_memory_bytes)} | ${i.cost_usd == null ? '—' : `${i.cost_usd.toFixed(2)}`} | ${n(i.success)} / ${n(i.failure)} |\n`;
  if (s.by_model.length) { md += `\n## By model\n\n| Model | Provider | Events | Tokens | Requests | Estimated cost |\n|---|---|---:|---:|---:|---:|\n`; for (const m of s.by_model) md += `| ${m.model} | ${m.provider || '—'} | ${n(m.events)} | ${n(m.tokens)} | ${n(m.model_requests)} | ${m.cost_usd == null ? '—' : `$${m.cost_usd.toFixed(2)}`} |\n`; }
  if (s.by_tool.length) { md += `\n## By tool\n\n| Tool | Events | Tokens | CPU-hours | Requests | Estimated cost |\n|---|---:|---:|---:|---:|---:|\n`; for (const t of s.by_tool) md += `| ${t.tool} | ${n(t.events)} | ${n(t.tokens)} | ${t.cpu_seconds == null ? '—' : (t.cpu_seconds / 3600).toFixed(3)} | ${n(t.model_requests)} | ${t.cost_usd == null ? '—' : `$${t.cost_usd.toFixed(2)}`} |\n`; }
  md += `\n## Trend\n\n| Date | Events | Tokens | Model requests | CPU-hours | Estimated cost | GitHub hours |\n|---|---:|---:|---:|---:|---:|---:|\n`;
  for (const d of s.trend) md += `| ${d.date} | ${n(d.events)} | ${n(d.tokens)} | ${n(d.model_requests)} | ${d.cpu_seconds == null ? '—' : (d.cpu_seconds / 3600).toFixed(3)} | ${d.cost_usd == null ? '—' : `$${d.cost_usd.toFixed(2)}`} | ${d.github_seconds == null ? '—' : (d.github_seconds / 3600).toFixed(3)} |\n`;
  if (s.github_workflows?.length) { md += `\n## GitHub Actions by workflow\n\n| Workflow | Runs | Jobs | Duration (h) | Success | Failure | Other | Potentially superseded |\n|---|---:|---:|---:|---:|---:|---:|---:|\n`; for (const w of s.github_workflows) md += `| ${w.workflow} | ${n(w.runs)} | ${n(w.jobs)} | ${w.duration_seconds == null ? '—' : (w.duration_seconds / 3600).toFixed(3)} | ${n(w.success)} | ${n(w.failure)} | ${n(w.other)} | ${n(w.potentially_superseded)} |\n`; md += `\n“Potentially superseded” is inferred from overlapping runs on the same workflow, branch and trigger; it is not a confirmed waste.\n`; }
  md += `\n## Data quality\n\n| Metric | Status | Events | Note |\n|---|---|---:|---|\n`;
  for (const [k, q] of Object.entries(s.data_quality)) if (q && typeof q === 'object' && q.status) md += `| ${k} | ${q.status} | ${q.events ?? '—'} | ${q.note || ''} |\n`;
  md += `\nMissing values are shown as “—” and are not zero. Sources: ${Object.entries(s.data_quality.sources || {}).map(([k, v]) => `${k} (${v})`).join(', ') || 'none'}.\n`;
  md += `\n## Possible opportunities\n\n`;
  if (!s.opportunities.length) md += `No threshold in the current deterministic rules was met. That is not evidence that there is no waste; it means the available measurements do not support a recommendation.\n`;
  for (const o of s.opportunities) {
    md += `### ${o.heading}\n\n- Priority: **${o.priority}** · classification: **${o.classification}** (${o.confidence})\n- Measurement: ${Object.entries(o.measurement).map(([k, v]) => `${k}=${v}`).join(', ')}\n- Evidence event ids: ${o.evidence_event_ids.join(', ') || 'none'}\n- Recommendation: ${o.recommendation}\n- Limitation: ${o.limitations}\n\n`;
  }
  md += `## Monitoring overhead and method\n\nThis report is generated by deterministic code from the local ledger. The collector's own CPU, memory and duration are recorded as \`monitoring\` events and shown in the totals; they are not mixed into activity totals. The ledger is append-only, a later snapshot of a growing transcript supersedes the earlier one, and identical immutable events are skipped.\n\n`;
  md += `## Limitations\n\n${s.limitations.map((x) => `- ${x}`).join('\n')}\n\n`;
  md += `## Privacy\n\n${Object.entries(s.privacy).map(([k, v]) => `- ${k}: ${v}`).join('\n')}\n\n`;
  md += `The public dashboard reads \`cloud/resources.json\`; it does not call an AI provider. Public data contains aggregates only.\n`;
  return md;
}

function exportPublic() {
  const { events } = loadEvents({ includeMonitoring: true });
  const summary = aggregate(events);
  summary.events = publicRows(events);
  summary.monitoring = summary.totals.monitoring;
  summary.data_quality = summary.quality;
  summary.privacy = { public_fields: 'Aggregates and grouped rows only.', raw_ledger: 'local', missing_is_not_zero: true };
  summary.limitations = ['See reports/resources/SUMMARY.md and reports/resources/METHODOLOGY-COMPARISON.md; missing data is null, not zero.', 'Request-level activity is associated with request context, not proven causation; legacy session rows are not directly comparable.', 'Unknown is a measurement gap, not waste. Prompt provenance is metadata-only by default.', 'No AI model is called to build this export.'];
  summary.budget = (() => { const b = loadBudgets(); return { mode: b.config.mode, source: b.source, problems: b.problems, limits: b.config.limits }; })();
  assertPublic(summary, 'cloud/resources.json');
  const out = path.resolve(labRoot, val('out', 'cloud/resources.json'));
  writeJson(out, summary);
  say(`Wrote ${path.relative(labRoot, out)} (${summary.events.length} public rows; no private records).`);
  if (val('json')) writeJson(val('json'), summary);
}

function audit() {
  const { events, invalid } = loadEvents({ includeMonitoring: true });
  const s = aggregate(events);
  const out = {
    generated_at: iso(), period: s.period, methodology: s.methodology,
    totals: s.totals.ai, attribution: s.attribution, by_unknown_reason: s.by_unknown_reason,
    by_exploration_subcategory: s.by_exploration_subcategory, reconciliation: s.reconciliation,
    exploration: s.exploration, provenance: s.provenance, quality: s.quality,
  };
  assertPublic(out, 'resource attribution audit');
  if (val('json')) { writeJson(val('json'), out); say(`Wrote ${val('json')}.`); return; }
  const n = (v) => (v == null ? '—' : Number(v).toLocaleString('en-US'));
  say(`Resource attribution audit — ${s.period.from || '—'} to ${s.period.to || '—'} (no model called)`);
  say(`Activity: ${n(s.attribution.activity.classified)} classified / ${n(s.attribution.activity.unknown)} Unknown events; token coverage ${(100 * (s.attribution.activity.coverage_tokens || 0)).toFixed(1)}%.`);
  say(`Model requests: ${n(s.attribution.model_requests.total)} total, ${n(s.attribution.model_requests.unknown)} Unknown.`);
  say(`Issue attribution: ${(100 * (s.attribution.issue.coverage || 0)).toFixed(1)}% of tokens; missing issue is not Unknown activity.`);
  say('\nUnknown by reason:');
  for (const r of s.by_unknown_reason) say(`  ${r.unknown_reason.padEnd(24)} events ${n(r.events).padStart(6)}  tokens ${n(r.tokens).padStart(12)}  requests ${n(r.model_requests).padStart(6)}`);
  say('\nRequest reconciliation:');
  say(`  sessions ${n(s.reconciliation.sessions_with_request_data)}; matched ${n(s.reconciliation.status.matched)}, mismatch ${n(s.reconciliation.status.mismatch)}, unavailable ${n(s.reconciliation.status.unavailable)}; delta ${n(s.reconciliation.delta)}.`);
  say(`  requests ${n(s.reconciliation.request_count)} / expected ${n(s.reconciliation.expected_requests)}; missing usage ${n(s.reconciliation.missing_usage)}; duplicate records collapsed ${n(s.reconciliation.duplicate_usage_records)}.`);
  say('\nExploration:');
  for (const k of ['unique_targets', 'repeated_targets', 'repeated_lookups', 'failed_searches', 'exploration_after_failure', 'exploration_after_edit', 'loop_sequences', 'code_map_calls', 'unique_files', 'result_bytes']) if (s.exploration[k] != null) say(`  ${k.replace(/_/g, ' ').padEnd(28)} ${n(s.exploration[k])}`);
  say('\nPrompt provenance:');
  say(`  prompts ${n(s.provenance.prompts)}; bytes ${n(s.provenance.prompt_bytes)}; capture ${s.provenance.capture}; artifacts referenced ${n(s.provenance.artifacts)}; inspected locally ${n(s.provenance.artifacts_inspected)}.`);
  say(`  purposes: ${Object.entries(s.provenance.purposes).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}=${v}`).join(', ') || '—'}`);
  if (invalid.length) say(`\nWARNING: ${invalid.length} invalid ledger line(s) skipped; run verify.`);
}

function verify() {
  const { events, invalid, lines } = loadEvents({ includeMonitoring: true });
  say(`Ledger: ${path.relative(labRoot, LEDGER_FILE)}`);
  say(`  lines: ${lines}; valid: ${events.length}; skipped: ${invalid.length}`);
  for (const x of invalid.slice(0, 20)) say(`  line ${x.line}: ${x.problems.join('; ')}`);
  const budgets = loadBudgets(); if (budgets.problems.length) { say('Budget problems:'); for (const p of budgets.problems) say(`  - ${p}`); }
  process.exit(invalid.length || budgets.problems.length ? 1 : 0);
}

if (cmd === 'collect') await collect();
else if (cmd === 'recent') recent();
else if (cmd === 'report') report();
else if (cmd === 'export') exportPublic();
else if (cmd === 'audit') audit();
else if (cmd === 'verify') verify();
else { console.error('usage: node scripts/resource.mjs collect|recent|report|export|audit|verify [options]'); process.exit(2); }
