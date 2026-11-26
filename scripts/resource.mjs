#!/usr/bin/env node
// Deterministic resource accounting CLI.
//   node scripts/resource.mjs collect [--source=claude,model-eval,measure-resources,github,docker,mutagen|all]
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
import { loadTasks } from '../tools/resource/tasks.mjs';
import { energySummary } from '../tools/resource/energy/bridge.mjs';
import { loadMapping } from '../tools/resource/energy/model-mapping.mjs';
import { assertPublic } from '../tools/resource/public.mjs';
import { collectClaude } from '../tools/resource/adapters/claude.mjs';
import { collectModelEval } from '../tools/resource/adapters/model-eval.mjs';
import { collectMeasureResources } from '../tools/resource/adapters/measure-resources.mjs';
import { collectDocker } from '../tools/resource/adapters/docker.mjs';
import { collectGithubActions } from '../tools/resource/adapters/github-actions.mjs';
import { collectMutagen } from '../tools/resource/adapters/mutagen.mjs';

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
  if (wants('mutagen')) { const r = collectMutagen(); all.push(...r.events); errors.push(...r.errors); metadata.mutagen = r.metadata; }
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
  const summary = aggregate(events, { tasks: loadTasks() });
  summary.monitoring = summary.totals.monitoring;
  summary.data_quality = summary.quality;
  summary.privacy = {
    public_fields: 'Aggregates and grouped rows only; no transcript titles, paths, prompts, responses, task descriptions, API keys or account ids. Evidence ids are opaque hashes, and the report timestamp (generated_at) is the only precise time published.',
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
    'Energy is estimated from a client-reported cost and a published CLEER energy-per-dollar intensity. It is not a measurement, it covers remote inference only, and it claims no conformance with any standard. See docs/CLEER.md.',
  ];
  attachEnergy(summary, events);
  summary.budget = (() => { const b = loadBudgets(); return { mode: b.config.mode, source: b.source, problems: b.problems, limits: b.config.limits }; })();
  assertPublic(summary, 'reports/resources/summary.json');
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outDir = path.resolve(labRoot, val('out', 'reports/resources'));
  const jsonFile = path.join(outDir, 'summary.json');
  const mdFile = path.join(outDir, has('baseline') ? 'BASELINE.md' : 'SUMMARY.md');
  const baselineJson = path.join(outDir, 'baseline.json');
  const md = markdown(summary);
  const canonical = (x) => { const c = JSON.parse(JSON.stringify(x)); delete c.generated_at; if (c.energy) { delete c.energy.generated_at; delete c.energy.overhead; } return `${JSON.stringify(c, null, 2)}\n`; };
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

// Derived energy: computed from events and the pinned dataset, never written to the ledger. One implementation, used by
// both the report and the public export, so `export` cannot silently drop the energy block the dashboard reads.
function attachEnergy(summary, events) {
  const energy = energySummary(events, { mapping: loadMapping(), now: summary.generated_at });
  summary.energy = energy;
  summary.events = publicRows(events, { energyByEvent: energy.event_estimates });
  const energyByModel = new Map(energy.by_model.map((r) => [r.model, r]));
  for (const row of summary.by_model || []) {
    const e = energyByModel.get(row.model);
    if (!e) continue;
    row.dataset_model = e.dataset_model; row.match_type = e.match_type; row.review_status = e.review_status;
    row.energy_requests = e.estimated; row.energy_unavailable = e.unavailable;
    row.energy_central_wh = e.central_wh; row.energy_workload_low_wh = e.workload_low_wh; row.energy_workload_high_wh = e.workload_high_wh;
  }
  const energyByActivity = new Map(energy.by_activity.map((r) => [r.activity, r]));
  for (const row of summary.by_activity || []) {
    const e = energyByActivity.get(row.activity);
    if (!e) continue;
    row.energy_requests = e.estimated; row.energy_unavailable = e.unavailable;
    row.energy_central_wh = e.central_wh; row.energy_workload_low_wh = e.workload_low_wh; row.energy_workload_high_wh = e.workload_high_wh;
  }
  return summary;
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
  md += `| Task ids observed | ${n(s.totals.tasks.measured)} (${n(s.totals.tasks.success)} success, ${n(s.totals.tasks.failure)} failure, ${n(s.totals.tasks.unknown)} unknown) | distinct task ids, including sessions, CI and Docker; declared-task rows are separate |\n`;
  md += `| Collection overhead | ${hours(s.totals.monitoring.cpu_seconds)} CPU, ${formatBytes(s.totals.monitoring.peak_memory_bytes)} peak | measured |\n\n`;
  if (s.energy) {
    const e = s.energy, et = e.totals, ec = e.coverage;
    const energy = (v) => (v == null ? '—' : v >= 1000 ? `${(v / 1000).toFixed(2)} kWh` : `${v.toFixed(1)} Wh`);
    const proxies = (e.by_model || []).filter((r) => r.match_type === 'proxy');
    const unreviewed = proxies.filter((r) => r.review_status !== 'reviewed').length;
    md += `## Energy estimate\n\nDerived from a client-reported cost and the pinned CLEER dataset. **Estimated, not measured.** The AI events behind it cover ${e.period.from || '—'} to ${e.period.to || '—'}; the report period above may be wider. [Full energy report](ENERGY-SUMMARY.md) and [method](../docs/CLEER.md).\n\n| Metric | Value | Basis |\n|---|---:|---|\n`;
    md += `| Remote inference energy (central) | ${energy(et.central_wh)} | estimated, cost-bridge; column \`${e.method.intensity_column || 'energy_wh_per_usd'}\` |\n`;
    md += `| Workload sensitivity (one-sided) | ${energy(et.workload_low_wh)} – ${energy(et.workload_high_wh)} | the three published tiers; the configured tier is inside the spread |\n`;
    md += `| CLEER configuration band | ${energy(et.configuration_low_wh)} – ${energy(et.configuration_high_wh)} | 1.96 × published relative SD; scenario spread, not a confidence interval |\n`;
    if (et.vadj_central_wh != null) md += `| Verbosity-adjusted intensity (sensitivity) | ${energy(et.vadj_central_wh)} | cost × \`${e.method.adjusted_column || 'vadj_energy_wh_per_usd'}\`; a modelling alternative, not the headline |\n`;
    md += `| AI events covered | ${n(ec.estimated)} of ${n(ec.ai_events)} (${pct(ec.estimated_share)}) | counted AI events |\n`;
    if (proxies.length) md += `| Mappings | ${n(proxies.length)} proxy mapping(s), ${n(unreviewed)} unreviewed | a proxy is not an exact match; see ENERGY-SUMMARY.md |\n`;
    md += `| Method | ${e.method.method_version} | ${e.method.boundary} |\n`;
    md += `| Dataset | ${e.method.dataset.version} (${e.method.dataset.release}) | ${e.method.dataset.licence} |\n\n`;
  }
  md += `## Consumption by activity\n\n| Activity | Events | Tasks | Tokens | Share | Model requests | CPU-hours | Estimated cost | Method |\n|---|---:|---:|---:|---:|---:|---:|---:|---|\n`;
  for (const a of s.by_activity) md += `| ${a.activity} | ${n(a.events)} | ${n(a.tasks)} | ${n(a.tokens)} | ${pct(a.share)} | ${n(a.model_requests)} | ${a.cpu_seconds == null ? '—' : (a.cpu_seconds / 3600).toFixed(3)} | ${a.cost_usd == null ? '—' : `$${a.cost_usd.toFixed(2)}`} | ${a.method || '—'} |\n`;
  md += `\nRows mix request-level activity, the older session tool-call-share allocation for historical records, and direct events (process, Docker, GitHub Actions) that were never session allocations. The method column above names them per activity; the dashboard keeps them distinguishable. Request-level activity is associated with the request context and is not proof that the activity caused every token in it.\n\n`;
  if (s.infrastructure?.roles?.length) {
    md += `## Infrastructure services (sampled)\n\nContainer statistics are sampled, not a live view. ${n(s.infrastructure.samples)} role-labelled sample(s) across ${n(s.infrastructure.containers)} container(s)${s.infrastructure.unclassified_samples ? `; ${n(s.infrastructure.unclassified_samples)} older sample(s) have no role and stay in By tool only` : ''}. CPU-seconds are derived from CPUPerc over the sample interval; memory is container usage. Mutagen file counts, Chrome on/off and Docker disk are local-only (\`lab-env resources\`).\n\n| Service | Containers | Samples | CPU-seconds | Peak memory |\n|---|---:|---:|---:|---:|\n`;
    for (const r of s.infrastructure.roles) md += `| ${r.role} | ${n(r.containers)} | ${n(r.events)} | ${n(r.cpu_seconds, 2)} | ${formatBytes(r.peak_memory_bytes)} |\n`;
    md += '\n';
    if (s.infrastructure.mutagen?.snapshots?.length) {
      md += `### Mutagen snapshots\n\nThe latest sampled Mutagen session per variant. These are session file counts and content sizes, not a directory walk or disk usage.\n\n| Variant | Files | Contents | Sessions | Sampled |\n|---|---:|---:|---:|---|\n`;
      for (const m of s.infrastructure.mutagen.snapshots) md += `| ${m.label} | ${n(m.files)} | ${formatBytes(m.bytes)} | ${n(m.sessions)} | ${m.occurred_at} |\n`;
      md += '\n';
    }
  }
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
  md += `| Task (declared) | ${n(a.task?.events_attributed)} attributed events | ${pct(a.task?.coverage)} | declared in tasks.jsonl or carried as explicit task metadata |\n`;
  md += `| Task ids (non-session) | ${n(a.task?.non_session_task_events)} attributed events | — | CI, Docker and wrapper ids; not declared development tasks |\n`;
  md += `| Task (session id) | ${n(a.task?.session_task_events)} events, ${n(a.task?.session_task_tokens)} tokens | — | a session is not one development task |\n`;
  md += `| Declared tasks | ${n(a.task?.declared_tasks)} declared, ${n(a.task?.verified_tasks)} verified | — | explicit local task records |\n`;
  md += `| Outcome | ${n(a.outcome?.success)} success / ${n(a.outcome?.failure)} failure / ${n(a.outcome?.unknown)} unknown | — | a command result is not a verified outcome |\n\n`;
  md += `Request-level sessions: ${n(a.data?.request_level_sessions)}; legacy sessions: ${n(a.data?.legacy_sessions)}. Uncounted roll-up events: ${n(a.data?.events_uncounted)}. Their token fields are null; they are not added to the totals.\n\n`;
  if (s.by_task?.length) {
    md += `## Task effectiveness\n\n| Task key | Issue | Kind | State | Deliverable | Verified | Sessions | Events | Requests | Tokens | Estimated cost | Data |\n|---|---|---|---|---|---|---:|---:|---:|---:|---:|---|\n`;
    for (const t of s.by_task) md += `| ${t.task_hash} | ${t.issue || '—'} | ${t.kind || '—'} | ${t.state || '—'} | ${t.expected_deliverable || '—'} | ${t.verified == null ? '—' : t.verified ? 'yes' : 'no'} | ${n(t.sessions)} | ${n(t.events)} | ${n(t.model_requests)} | ${n(t.tokens)} | ${t.cost_usd == null ? '—' : `$${t.cost_usd.toFixed(2)}`} | ${t.data_completeness} |\n`;
    md += `\nTask keys are hashes of local task ids. Descriptions, evidence paths and session names are never published. A completed claim is not a verified outcome.\n\n`;
  }
  if (s.by_unknown_reason?.length) {
    md += `## Unknown activity by reason\n\n| Reason | Events | Tokens | Model requests | Operations |\n|---|---:|---:|---:|---:|\n`;
    for (const r of s.by_unknown_reason) md += `| ${r.unknown_reason} | ${n(r.events)} | ${n(r.tokens)} | ${n(r.model_requests)} | ${n(r.operations)} |\n`;
    md += `\nUnknown is a measurement gap, not waste or a quality score. Missing issue attribution is reported separately above.\n\n`;
  }
  if (s.repetition?.groups?.length) {
    md += `## Repeated operations\n\nA repetition means the same command, revision, patch, environment and result signature. It is a diagnostic, not proof of waste.\n\n| Group | Activity | Runs | Success | Failure | Repeated runs | Unchanged failures | Unchanged successes | First | Last |\n|---|---|---:|---:|---:|---:|---:|---:|---|---|\n`;
    for (const r of s.repetition.groups) md += `| ${r.group_hash} | ${r.activity} | ${n(r.runs)} | ${n(r.success)} | ${n(r.failure)} | ${n(r.repeated_runs)} | ${n(r.unchanged_failures)} | ${n(r.unchanged_successes)} | ${r.first} | ${r.last} |\n`;
    md += `\n${s.repetition.note}\n\n`;
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
  const summary = aggregate(events, { tasks: loadTasks() });
  attachEnergy(summary, events);
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
  const s = aggregate(events, { tasks: loadTasks() });
  const out = {
    generated_at: iso(), period: s.period, methodology: s.methodology,
    totals: s.totals.ai, attribution: s.attribution, by_task: s.by_task, by_unknown_reason: s.by_unknown_reason,
    by_exploration_subcategory: s.by_exploration_subcategory, repetition: s.repetition, reconciliation: s.reconciliation,
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
  say('\nRepeated operations:');
  say(`  process operations ${n(s.repetition.process_operations)}; repeated groups ${n(s.repetition.repeated_groups)}; unchanged failure runs ${n(s.repetition.unchanged_failure_runs)}; unchanged success runs ${n(s.repetition.unchanged_success_runs)}.`);
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
