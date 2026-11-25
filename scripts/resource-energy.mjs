#!/usr/bin/env node
// Deterministic energy accounting. It reads the vendored CLEER dataset and the local resource ledger, and produces a
// derived energy report. It never calls a model, never writes to the ledger, and never contacts the network except in
// the explicit `sync` command.
//
//   node scripts/resource-energy.mjs verify
//   node scripts/resource-energy.mjs report [--write] [--check] [--json=<file>] [--out=<dir>]
//   node scripts/resource-energy.mjs page [--write]
//   node scripts/resource-energy.mjs estimate --model=<id> --cost=<usd> [--use-case=chat|agentic] [--tier=light|typical|heavy]
//   node scripts/resource-energy.mjs factors --file=<path> [--check]
//   node scripts/resource-energy.mjs sync [--sha=<commit>] [--force]
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { performance } from 'node:perf_hooks';
import { labRoot, loadEvents, LEDGER_FILE } from '../tools/resource/ledger.mjs';
import { loadMapping, validateMapping } from '../tools/resource/energy/model-mapping.mjs';
import { verifyDataset, PROVENANCE_FILE, CLEER_DIR } from '../tools/resource/energy/provenance.mjs';
import { energySummary, estimateEvent, METHOD, SIGMA } from '../tools/resource/energy/bridge.mjs';
import { loadFactorSet, estimateWithCoefficients, validateFactorSet } from '../tools/resource/energy/factor-loader.mjs';
import { assertPublic } from '../tools/resource/public.mjs';

const args = process.argv.slice(2), cmd = args[0];
const val = (n, d = null) => {
  const a = args.find((x) => x.startsWith(`--${n}=`)); if (a) return a.slice(n.length + 3);
  const i = args.indexOf(`--${n}`); return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : d;
};
const has = (n) => args.some((x) => x === `--${n}` || x.startsWith(`--${n}=`));
const say = (s = '') => console.log(s);
const OUT_DIR = path.resolve(labRoot, val('out', 'reports/resources'));

const n = (v, d = 0) => (v == null ? '—' : Number(v).toLocaleString('en-US', { maximumFractionDigits: d }));
const wh = (v) => {
  if (v == null) return '—';
  if (Math.abs(v) >= 1000) return `${(v / 1000).toFixed(2)} kWh`;
  if (Math.abs(v) >= 1) return `${v.toFixed(1)} Wh`;
  return `${v.toFixed(3)} Wh`;
};
const usd = (v) => (v == null ? '—' : `$${Number(v).toFixed(2)}`);
const pct = (v) => (v == null ? '—' : `${(v * 100).toFixed(1)}%`);
const ratio = (v) => (v == null ? '—' : Number(v).toFixed(2));
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const sha256 = (buf) => crypto.createHash('sha256').update(buf).digest('hex');

function writeJson(file, value) { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`); }

function verify() {
  const dataset = verifyDataset();
  const mapping = loadMapping();
  const mappingProblems = validateMapping(mapping);
  const lines = [`CLEER dataset (${dataset.pin}): ${dataset.ok ? 'OK' : 'FAILED'}`];
  for (const [name, f] of Object.entries(dataset.files)) lines.push(`  ${f.ok ? 'ok  ' : 'FAIL'} ${name} ${f.bytes} bytes ${f.sha256?.slice(0, 16)}…`);
  if (dataset.published_checksum) lines.push(`  published models.json checksum: ${dataset.published_checksum.slice(0, 16)}… (matches: ${dataset.published_checksum === dataset.files['models.json']?.sha256})`);
  if (!dataset.ok) lines.push(...dataset.problems.map((p) => `  problem: ${p}`));
  lines.push(`Mapping: ${mappingProblems.length ? 'FAILED' : 'OK'} (${(mapping.models || []).length} explicit mapping(s))`);
  if (mappingProblems.length) lines.push(...mappingProblems.map((p) => `  problem: ${p}`));
  const file = val('file');
  if (file) {
    const factor = loadFactorSet(path.resolve(file));
    lines.push(`Factor set: OK (${factor.models.length} model(s), synthetic=${factor.synthetic === true})`);
  }
  say(lines.join('\n'));
  if (!dataset.ok || mappingProblems.length) process.exit(1);
}

function buildSummary() {
  const { events } = loadEvents({ includeMonitoring: true });
  const mapping = loadMapping();
  const started = performance.now();
  const summary = energySummary(events, { mapping });
  const computeMs = Math.round((performance.now() - started) * 100) / 100;
  summary.overhead = {
    compute_ms: computeMs,
    ledger_events_read: events.length,
    dataset_bytes: ['models.json', 'cleer-dashboard-data.csv', 'meta.json', 'schema.md'].reduce((a, f) => a + (fs.existsSync(path.join(CLEER_DIR, f)) ? fs.statSync(path.join(CLEER_DIR, f)).size : 0), 0),
    note: 'Cost of computing this report on this host. It is monitoring overhead, separate from the workloads it describes.',
  };
  assertPublic(summary, 'reports/resources/energy-summary.json');
  return summary;
}

const canon = (x) => {
  const c = JSON.parse(JSON.stringify(x));
  delete c.generated_at; delete c.overhead;
  const scrub = (v) => {
    if (Array.isArray(v)) return v.map(scrub);
    if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, scrub(x)]));
    return v;
  };
  return `${JSON.stringify(scrub(c), null, 2)}\n`;
};

function markdown(s) {
  const m = s.method, c = s.coverage, t = s.totals;
  let md = `# Energy estimate\n\nGenerated ${s.generated_at}. Period: ${s.period.from || '—'} to ${s.period.to || '—'}. Method **${m.method_version}** (${m.name}). No AI model was called to produce this report.\n\n`;
  md += `This is an **estimate**, not a measurement. It multiplies each AI event's client-reported cost by a published CLEER energy-per-dollar intensity. CLEER publishes no per-token coefficients; its token counts per workload are withheld. Read the limitations before quoting a number.\n\n`;
  md += `## Headline\n\n| Metric | Value | Basis |\n|---|---:|---|\n`;
  md += `| Remote inference energy (central) | ${wh(t.central_wh)} | estimated, cost-bridge |\n`;
  md += `| Workload-tier band | ${wh(t.workload_low_wh)} – ${wh(t.workload_high_wh)} | published intensity across the three tiers of the use case |\n`;
  md += `| CLEER configuration band | ${wh(t.configuration_low_wh)} – ${wh(t.configuration_high_wh)} | ${SIGMA} × the published per-session relative standard deviation; a scenario spread, not a confidence interval |\n`;
  md += `| AI events covered | ${n(c.estimated)} of ${n(c.ai_events)} (${pct(c.estimated_share)}) | counted AI events carrying a model |\n`;
  md += `| Cost covered | ${usd(c.cost_covered_usd)} of ${usd(c.cost_total_usd)} (${pct(c.cost_covered_share)}) | client-reported estimate, not an invoice |\n`;
  md += `| Boundary | ${m.boundary} | facility energy in CLEER's published scenario |\n`;
  md += `| Dataset | ${m.dataset.version} (${m.dataset.release}) | ${m.dataset.licence} |\n`;
  md += `| Dataset pin | \`${m.dataset.pin.slice(0, 12)}…\` | checksum \`${(m.dataset.checksum || '').slice(0, 12)}…\` |\n\n`;

  md += `## Use-case sensitivity\n\n${s.use_case_sensitivity.note}\n\n| Use case | Central | Events covered |\n|---|---:|---:|\n`;
  md += `| chat | ${wh(s.use_case_sensitivity.chat.central_wh)} | ${n(s.use_case_sensitivity.chat.events_covered)} |\n`;
  md += `| agentic | ${wh(s.use_case_sensitivity.agentic.central_wh)} | ${n(s.use_case_sensitivity.agentic.events_covered)} |\n`;
  if (s.use_case_sensitivity.ratio_chat_over_agentic) md += `\nChoosing chat instead of agentic would change the headline by **${s.use_case_sensitivity.ratio_chat_over_agentic}×**. The use case is configured per activity, not inferred.\n`;
  md += '\n';

  md += `## By model\n\n| Model | Dataset model | Match | Review | Confidence | Requests | Cost | Energy (central) | Workload band |\n|---|---|---|---|---:|---:|---:|---:|---:|\n`;
  for (const r of s.by_model) {
    md += `| ${r.model} | ${r.dataset_model || '—'} | ${r.match_type || '—'} | ${r.review_status || '—'} | ${r.confidence == null ? '—' : r.confidence.toFixed(3)} | ${n(r.estimated)} | ${usd(r.cost_usd)} | ${wh(r.central_wh)} | ${wh(r.workload_low_wh)}–${wh(r.workload_high_wh)} |\n`;
  }
  md += `\nCLEER confidence is the dataset's own proxy-match score (0–1), not the probability that the estimate is correct. An "unreviewed" proxy is a labelled best guess.\n\n`;

  md += `## By activity\n\n| Activity | Requests | Cost | Energy (central) | Estimated / unavailable |\n|---|---:|---:|---:|---:|\n`;
  for (const r of s.by_activity) md += `| ${r.activity} | ${n(r.events)} | ${usd(r.cost_usd)} | ${wh(r.central_wh)} | ${n(r.estimated)} / ${n(r.unavailable)} |\n`;
  md += `\nActivity association is not causation, and energy here follows cost, not activity. A request's cost covers its whole context.\n\n`;

  md += `## By Drupal issue\n\n| Issue | Requests | Cost | Energy (central) |\n|---|---:|---:|---:|\n`;
  for (const r of s.by_issue) md += `| ${r.issue} | ${n(r.events)} | ${usd(r.cost_usd)} | ${wh(r.central_wh)} |\n`;
  md += '\n';

  if (s.trend.length > 1) {
    md += `## Daily trend\n\n| Date | Events | Cost | Energy (central) |\n|---|---:|---:|---:|\n`;
    for (const r of s.trend) md += `| ${r.date} | ${n(r.events)} | ${usd(r.cost_usd)} | ${wh(r.central_wh)} |\n`;
    md += `\nA day with no events is not proof that no work happened; collection is on demand.\n\n`;
  }

  md += `## Published CLEER reference\n\nThese are CLEER's own published figures for the models this repository maps to. They are **not** an estimate of this repository's usage.\n\n| Dataset model | Workload | Wh per session (mean) | SD | Wh per USD | Cost per session |\n|---|---|---:|---:|---:|---:|\n`;
  for (const r of s.reference) md += `| ${r.dataset_model} | ${r.workload} | ${n(r.energy_wh_mean, 2)} | ${n(r.energy_wh_sd, 2)} | ${ratio(r.energy_wh_per_usd)} | ${usd(r.cost_usd)} |\n`;
  md += `\nSource: ${m.dataset.organization}, ${m.dataset.dataset}, ${m.dataset.version}, release ${m.dataset.release}, commit \`${m.dataset.pin}\`. Licensed ${m.dataset.licence}; non-commercial use with attribution. See [docs/CLEER.md](../docs/CLEER.md) and [the notice](../tools/resource/energy/cleer/NOTICE.md).\n\n`;

  md += `## Coverage\n\n| Measure | Value | Denominator |\n|---|---:|---|\n`;
  md += `| AI events estimated | ${n(c.estimated)} | ${n(c.ai_events)} (${c.denominator}) |\n`;
  md += `| AI events unavailable | ${n(c.unavailable)} | ${n(c.ai_events)} |\n`;
  md += `| Models observed | ${n(c.models_observed)} | — |\n`;
  md += `| Models mapped (exact) | ${n(c.models_with_exact_match)} | ${n(c.models_observed)} |\n`;
  md += `| Models mapped (proxy) | ${n(c.models_with_proxy_match)} | ${n(c.models_observed)} |\n`;
  md += `| Proxies unreviewed | ${n(c.models_with_unreviewed_proxy)} | ${n(c.models_observed)} |\n`;
  for (const [code, events] of Object.entries(c.unavailable_by_code)) md += `| Unavailable: ${code} | ${n(events)} | ${n(c.ai_events)} |\n`;
  md += '\n';

  md += `## Limitations\n\n`;
  for (const l of s.limitations) md += `- ${l}\n`;
  md += `\nMonitoring overhead: ${n(s.overhead?.compute_ms, 2)} ms to compute this report from ${n(s.overhead?.ledger_events_read)} ledger events; dataset ${n(s.overhead?.dataset_bytes)} bytes on disk.\n\n`;
  md += `The dashboard reads only static files. This report required no AI inference.\n`;
  return md;
}

function coverageMarkdown(s) {
  const c = s.coverage, m = s.method;
  let md = `# Energy estimation coverage\n\nGenerated ${s.generated_at}. Method **${m.method_version}**.\n\n`;
  md += `## Denominator\n\n${c.denominator}. A request is counted once; a reconciled session roll-up is excluded, so no request is estimated twice.\n\n`;
  md += `## Counts\n\n| Measure | Absolute | Share | Denominator |\n|---|---:|---:|---|\n`;
  md += `| AI events | ${n(c.ai_events)} | 100.0% | itself |\n`;
  md += `| Estimated | ${n(c.estimated)} | ${pct(c.estimated_share)} | ${n(c.ai_events)} AI events |\n`;
  md += `| Unavailable | ${n(c.unavailable)} | ${pct(c.ai_events ? c.unavailable / c.ai_events : null)} | ${n(c.ai_events)} AI events |\n`;
  md += `| Cost covered | ${usd(c.cost_covered_usd)} | ${pct(c.cost_covered_share)} | ${usd(c.cost_total_usd)} client-estimated cost |\n\n`;
  md += `## Per-model mapping\n\n| Input model | Data model | Match | Review | CLEER confidence | Estimated | Unavailable | Cost |\n|---|---|---|---|---:|---:|---:|---:|\n`;
  for (const r of s.by_model) md += `| ${r.model} | ${r.dataset_model || '—'} | ${r.match_type || '—'} | ${r.review_status || '—'} | ${r.confidence == null ? '—' : r.confidence.toFixed(3)} | ${n(r.estimated)} | ${n(r.unavailable)} | ${usd(r.cost_usd)} |\n`;
  md += `\n## Unavailable reasons\n\n`;
  if (!s.unavailable.length) md += `None.\n`;
  else {
    md += `| Code | Events | Meaning |\n|---|---:|---|\n`;
    const meaning = {
      unsupported_model: 'No explicit mapping and no exact dataset name match. Energy is unavailable; the tokens are still counted by the resource report.',
      ambiguous_model: 'More than one dataset model matches. No proxy is chosen automatically.',
      missing_cost: 'No client-reported or provider-reported cost, so the bridge has no input.',
      invalid_cost: 'A negative cost was recorded.',
      cost_not_a_charge: 'The cost is a subscription allowance, not a charge; bridging it would invent a number.',
      no_published_intensity: 'The dataset has no intensity for this model and workload.',
      dataset_inconsistent: 'The published intensity disagrees with energy ÷ cost; estimation stops rather than choosing.',
      unknown_model: 'No model identifier on the event.',
    };
    for (const u of s.unavailable) md += `| ${u.code} | ${n(u.events)} | ${meaning[u.code] || '—'} |\n`;
  }
  md += `\n## What is not covered\n\n`;
  md += `- Per-token coefficients: CLEER publishes none, and this project does not reconstruct them.\n`;
  md += `- Direct measurement of provider infrastructure: unavailable from outside the provider.\n`;
  md += `- Local and CI energy: not part of this phase. The resource report measures CPU-seconds and GitHub Actions time separately.\n`;
  md += `- Carbon: not part of this phase. CLEER publishes carbon per session; it will be added with its own boundary and scenario.\n`;
  return md;
}

function page(s) {
  const t = s.totals, c = s.coverage;
  const rows = (list, cells) => list.map((r) => `<tr>${cells(r)}</tr>`).join('\n');
  const modelRows = rows(s.by_model, (r) => `<td>${esc(r.model)}</td><td>${esc(r.dataset_model || '—')}</td><td>${esc(r.match_type || '—')}</td><td>${esc(r.review_status || '—')}</td><td class="num">${r.confidence == null ? '—' : r.confidence.toFixed(3)}</td><td class="num">${n(r.estimated)}</td><td class="num">${usd(r.cost_usd)}</td><td class="num">${wh(r.central_wh)}</td><td class="num">${wh(r.workload_low_wh)}–${wh(r.workload_high_wh)}</td>`);
  const activityRows = rows(s.by_activity, (r) => `<td>${esc(r.activity)}</td><td class="num">${n(r.events)}</td><td class="num">${usd(r.cost_usd)}</td><td class="num">${wh(r.central_wh)}</td><td class="num">${n(r.estimated)} / ${n(r.unavailable)}</td>`);
  const refRows = rows(s.reference, (r) => `<td>${esc(r.dataset_model)}</td><td>${esc(r.workload)}</td><td class="num">${n(r.energy_wh_mean, 2)}</td><td class="num">${n(r.energy_wh_sd, 2)}</td><td class="num">${ratio(r.energy_wh_per_usd)}</td><td class="num">${usd(r.cost_usd)}</td>`);
  const unavailableRows = s.unavailable.length ? rows(s.unavailable, (u) => `<td>${esc(u.code)}</td><td class="num">${n(u.events)}</td>`) : `<tr><td colspan="2">None</td></tr>`;
  const md = `# CLEER energy estimates — Drupal Core Lab`;
  void md;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Energy estimates — Drupal Core Lab</title>
<style>
  :root { color-scheme: light dark; --bg: #f7f7f5; --surface: #fff; --text: #1d1d1b; --muted: #55554f; --line: #c9c9c1; --accent: #0b5fff; --accent-weak: #dbe6ff; --warn: #7a4b00; }
  @media (prefers-color-scheme: dark) { :root { --bg: #171716; --surface: #232321; --text: #f1f1ec; --muted: #c3c3b8; --line: #55554c; --accent: #8fb3ff; --accent-weak: #25324a; --warn: #f1c27d; } }
  * { box-sizing: border-box; }
  body { margin: 0; background: var(--bg); color: var(--text); font: 16px/1.5 system-ui, -apple-system, "Segoe UI", sans-serif; }
  a { color: var(--accent); }
  a:focus-visible, .tablewrap:focus-visible, summary:focus-visible { outline: 3px solid var(--accent); outline-offset: 2px; }
  .skip { position: absolute; left: -999px; top: 0; background: var(--surface); padding: .5rem .75rem; z-index: 10; } .skip:focus { left: .5rem; }
  header { background: var(--surface); border-bottom: 1px solid var(--line); padding: .8rem 1rem; }
  header .inner, main { max-width: 78rem; margin: 0 auto; }
  header .inner { display: flex; flex-wrap: wrap; gap: .75rem; align-items: baseline; justify-content: space-between; }
  header nav { display: flex; gap: 1rem; flex-wrap: wrap; font-size: .9rem; }
  main { padding: 1rem; }
  h1 { font-size: 1.55rem; margin: .4rem 0 .2rem; } h2 { font-size: 1.2rem; margin: 1.6rem 0 .5rem; } h3 { font-size: 1rem; margin: .2rem 0 .35rem; }
  .note { color: var(--muted); font-size: .9rem; }
  .cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(13rem, 1fr)); gap: .7rem; margin: .6rem 0 1rem; }
  .card { background: var(--surface); border: 1px solid var(--line); border-radius: .5rem; padding: .7rem .8rem; }
  .card h3 { font-size: .85rem; color: var(--muted); font-weight: 600; margin: 0 0 .2rem; }
  .card .value { font-size: 1.45rem; font-weight: 700; margin: 0; overflow-wrap: anywhere; }
  .card .quality { font-size: .8rem; color: var(--muted); margin: .2rem 0 0; }
  .tablewrap { max-width: 100%; overflow-x: auto; margin: .4rem 0 .8rem; }
  table { border-collapse: collapse; width: 100%; font-size: .88rem; }
  caption { text-align: left; color: var(--muted); font-size: .85rem; padding: .1rem 0 .3rem; }
  th, td { border: 1px solid var(--line); padding: .32rem .45rem; text-align: left; vertical-align: top; }
  th { background: var(--surface); font-size: .82rem; }
  td.num, th.num { text-align: right; font-variant-numeric: tabular-nums; }
  code { overflow-wrap: anywhere; }
  .callout { background: var(--surface); border: 1px solid var(--line); border-left: .35rem solid var(--warn); border-radius: .4rem; padding: .65rem .8rem; margin: .8rem 0; }
  footer { border-top: 1px solid var(--line); margin-top: 2rem; padding: 1rem; color: var(--muted); font-size: .85rem; }
  @media (prefers-reduced-motion: reduce) { * { transition: none !important; animation: none !important; scroll-behavior: auto !important; } }
  @media (forced-colors: active) {
    body, header, main, footer, .card, .callout, table, th, td { forced-color-adjust: auto; }
    .card, .callout, table, th, td { border-color: CanvasText; }
  }
  @media print { header nav, .skip { display: none; } body { background: #fff; color: #000; } a { color: #000; } }
</style>
</head>
<body>
<a class="skip" href="#main">Skip to energy data</a>
<header><div class="inner"><strong>Drupal Core Lab</strong><nav aria-label="Site"><a href="resources.html">Resource usage</a><a href="index.html">Compare issues</a><a href="../docs/CLEER.md">CLEER method</a></nav></div></header>
<main id="main">
<h1>Energy estimates</h1>
<p class="note">Generated ${esc(s.generated_at)}. Period ${esc(s.period.from || '—')} to ${esc(s.period.to || '—')}. Method ${esc(s.method.method_version)}. No AI model was called to produce this page.</p>

<div class="callout">
  <h2>Read this first</h2>
  <p><strong>This is an estimate, not a measurement.</strong> It multiplies each AI event's client-reported cost by a published CLEER energy-per-dollar intensity. CLEER publishes <strong>no per-token coefficients</strong>: its token counts per workload are withheld, and this project does not reconstruct them. The figure is an order of magnitude, not an invoice.</p>
</div>

<div class="cards">
  <div class="card"><h3>Remote inference energy (central)</h3><p class="value">${wh(t.central_wh)}</p><p class="quality">estimated, cost bridge</p></div>
  <div class="card"><h3>Workload-tier band</h3><p class="value">${wh(t.workload_low_wh)} – ${wh(t.workload_high_wh)}</p><p class="quality">published intensity across three tiers</p></div>
  <div class="card"><h3>CLEER configuration band</h3><p class="value">${wh(t.configuration_low_wh)} – ${wh(t.configuration_high_wh)}</p><p class="quality">scenario spread, not a confidence interval</p></div>
  <div class="card"><h3>Events covered</h3><p class="value">${pct(c.estimated_share)}</p><p class="quality">${n(c.estimated)} of ${n(c.ai_events)} AI events</p></div>
  <div class="card"><h3>Cost covered</h3><p class="value">${usd(c.cost_covered_usd)}</p><p class="quality">client-reported estimate, not an invoice</p></div>
</div>

<h2>Method and boundary</h2>
<div class="tablewrap" role="region" aria-label="Method and boundary table" tabindex="0">
<table>
  <caption>How the estimate is produced</caption>
  <thead><tr><th scope="col">Item</th><th scope="col">Value</th></tr></thead>
  <tbody>
    <tr><th scope="row">Basis</th><td>${esc(s.method.basis)} (${esc(s.method.method_version)})</td></tr>
    <tr><th scope="row">Boundary</th><td>${esc(s.method.boundary)}</td></tr>
    <tr><th scope="row">Measured</th><td>${esc(s.method.what_is_measured)}</td></tr>
    <tr><th scope="row">Estimated</th><td>${esc(s.method.what_is_estimated)}</td></tr>
    <tr><th scope="row">Unavailable</th><td>${esc(s.method.what_is_unavailable)}</td></tr>
    <tr><th scope="row">Uncertainty</th><td>${esc(s.method.uncertainty)}</td></tr>
    <tr><th scope="row">Calibration</th><td>${esc(s.method.calibration)}</td></tr>
  </tbody>
</table>
</div>

<h2>Dataset provenance and licence</h2>
<div class="tablewrap" role="region" aria-label="Dataset provenance table" tabindex="0">
<table>
  <caption>Vendored CLEER dataset</caption>
  <thead><tr><th scope="col">Item</th><th scope="col">Value</th></tr></thead>
  <tbody>
    <tr><th scope="row">Source</th><td>${esc(s.method.dataset.organization)}, ${esc(s.method.dataset.dataset)}</td></tr>
    <tr><th scope="row">Version</th><td>${esc(s.method.dataset.version)} (engine ${esc(s.method.dataset.engine)}, schema ${esc(s.method.dataset.schema_version)})</td></tr>
    <tr><th scope="row">Release</th><td>${esc(s.method.dataset.release)}</td></tr>
    <tr><th scope="row">Commit</th><td><code>${esc(s.method.dataset.pin)}</code></td></tr>
    <tr><th scope="row">Checksum</th><td><code>${esc(s.method.dataset.checksum || '—')}</code></td></tr>
    <tr><th scope="row">Licence</th><td>${esc(s.method.dataset.licence)}; non-commercial use with attribution. Commercial use needs written permission.</td></tr>
    <tr><th scope="row">Citation</th><td>${esc(s.method.dataset.citation)}</td></tr>
  </tbody>
</table>
</div>

<h2>Use-case sensitivity</h2>
<p>${esc(s.use_case_sensitivity.note)}</p>
<div class="tablewrap" role="region" aria-label="Use-case sensitivity table" tabindex="0">
<table>
  <caption>What the same measured spend would imply under each use case</caption>
  <thead><tr><th scope="col">Use case</th><th scope="col" class="num">Central</th><th scope="col" class="num">Events covered</th></tr></thead>
  <tbody>
    <tr><th scope="row">chat</th><td class="num">${wh(s.use_case_sensitivity.chat.central_wh)}</td><td class="num">${n(s.use_case_sensitivity.chat.events_covered)}</td></tr>
    <tr><th scope="row">agentic</th><td class="num">${wh(s.use_case_sensitivity.agentic.central_wh)}</td><td class="num">${n(s.use_case_sensitivity.agentic.events_covered)}</td></tr>
  </tbody>
</table>
</div>
<p class="note">Choosing chat instead of agentic would change the headline by ${s.use_case_sensitivity.ratio_chat_over_agentic == null ? '—' : `${s.use_case_sensitivity.ratio_chat_over_agentic}×`}. The use case is configured per activity, not inferred.</p>

<h2>By model</h2>
<div class="tablewrap" role="region" aria-label="Energy by model table" tabindex="0">
<table>
  <caption>Estimated energy and mapping status per model</caption>
  <thead><tr><th scope="col">Model</th><th scope="col">Dataset model</th><th scope="col">Match</th><th scope="col">Review</th><th scope="col" class="num">CLEER confidence</th><th scope="col" class="num">Requests</th><th scope="col" class="num">Cost</th><th scope="col" class="num">Energy</th><th scope="col" class="num">Workload band</th></tr></thead>
  <tbody>${modelRows}</tbody>
</table>
</div>
<p class="note">CLEER confidence is the dataset's own proxy-match score (0–1), not the probability that the estimate is correct. An "unreviewed" proxy is a labelled best guess.</p>

<h2>By activity</h2>
<div class="tablewrap" role="region" aria-label="Energy by activity table" tabindex="0">
<table>
  <caption>Estimated energy by activity</caption>
  <thead><tr><th scope="col">Activity</th><th scope="col" class="num">Requests</th><th scope="col" class="num">Cost</th><th scope="col" class="num">Energy</th><th scope="col" class="num">Estimated / unavailable</th></tr></thead>
  <tbody>${activityRows}</tbody>
</table>
</div>
<p class="note">Activity association is not causation, and energy follows cost, not activity.</p>

<h2>Published CLEER reference</h2>
<p>These are CLEER's own published figures for the models this repository maps to. They are <strong>not</strong> an estimate of this repository's usage.</p>
<div class="tablewrap" role="region" aria-label="CLEER reference table" tabindex="0">
<table>
  <caption>Published CLEER energy and cost per session; these are not an estimate of this repository's usage</caption>
  <thead><tr><th scope="col">Dataset model</th><th scope="col">Workload</th><th scope="col" class="num">Wh per session (mean)</th><th scope="col" class="num">SD</th><th scope="col" class="num">Wh per USD</th><th scope="col" class="num">Cost per session</th></tr></thead>
  <tbody>${refRows}</tbody>
</table>
</div>

<h2>Coverage</h2>
<div class="tablewrap" role="region" aria-label="Coverage table" tabindex="0">
<table>
  <caption>How much of the AI activity has an estimate</caption>
  <thead><tr><th scope="col">Measure</th><th scope="col" class="num">Absolute</th><th scope="col" class="num">Share</th><th scope="col">Denominator</th></tr></thead>
  <tbody>
    <tr><th scope="row">AI events</th><td class="num">${n(c.ai_events)}</td><td class="num">100.0%</td><td>itself</td></tr>
    <tr><th scope="row">Estimated</th><td class="num">${n(c.estimated)}</td><td class="num">${pct(c.estimated_share)}</td><td>${n(c.ai_events)} AI events</td></tr>
    <tr><th scope="row">Unavailable</th><td class="num">${n(c.unavailable)}</td><td class="num">${pct(c.ai_events ? c.unavailable / c.ai_events : null)}</td><td>${n(c.ai_events)} AI events</td></tr>
    <tr><th scope="row">Cost covered</th><td class="num">${usd(c.cost_covered_usd)}</td><td class="num">${pct(c.cost_covered_share)}</td><td>${usd(c.cost_total_usd)} client-estimated</td></tr>
    <tr><th scope="row">Models with exact match</th><td class="num">${n(c.models_with_exact_match)}</td><td class="num">—</td><td>${n(c.models_observed)} models</td></tr>
    <tr><th scope="row">Models with proxy match</th><td class="num">${n(c.models_with_proxy_match)}</td><td class="num">—</td><td>${n(c.models_observed)} models</td></tr>
  </tbody>
</table>
</div>

<h2>Unavailable reasons</h2>
<div class="tablewrap" role="region" aria-label="Unavailable reasons table" tabindex="0">
<table>
  <caption>Why some events have no estimate</caption>
  <thead><tr><th scope="col">Code</th><th scope="col" class="num">Events</th></tr></thead>
  <tbody>${unavailableRows}</tbody>
</table>
</div>

<h2>Limitations</h2>
<ul>
${s.limitations.map((l) => `<li>${esc(l)}</li>`).join('\n')}
</ul>

<h2>Monitoring overhead</h2>
<p class="note">Computing this report took ${n(s.overhead?.compute_ms, 2)} ms from ${n(s.overhead?.ledger_events_read)} ledger events; the vendored dataset is ${n(s.overhead?.dataset_bytes)} bytes on disk. This page is static and makes no network request beyond the files it is served with.</p>
</main>
<footer>Generated from local telemetry and a pinned public dataset. No AI inference was used. Missing data is shown as “—”, never as zero.</footer>
</body>
</html>
`;
}

function report() {
  const summary = buildSummary();
  const jsonText = `${JSON.stringify(summary, null, 2)}\n`;
  const md = markdown(summary);
  const cov = coverageMarkdown(summary);
  const pageHtml = page(summary);
  const files = {
    json: path.join(OUT_DIR, 'energy-summary.json'),
    md: path.join(OUT_DIR, 'ENERGY-SUMMARY.md'),
    coverage: path.join(OUT_DIR, 'ENERGY-COVERAGE.md'),
    page: path.resolve(labRoot, 'cloud/cleer.html'),
  };
  if (has('check')) {
    const same = fs.existsSync(files.json) && canon(JSON.parse(fs.readFileSync(files.json, 'utf8'))) === canon(summary);
    const scrubMd = (t) => t.replace(/^Generated [^.]+\..*/m, 'Generated [time].').replace(/Monitoring overhead: [\d.]+ ms/, 'Monitoring overhead: [time] ms');
    const sameMd = (file, text) => fs.existsSync(file) && scrubMd(fs.readFileSync(file, 'utf8')) === scrubMd(text);
    const scrubPage = (t) => t.replace(/Generated [^<]+/, 'Generated [time]').replace(/Computing this report took [\d.]+ ms/, 'Computing this report took [time] ms');
    const samePage = fs.existsSync(files.page) && scrubPage(fs.readFileSync(files.page, 'utf8')) === scrubPage(pageHtml);
    const ok = same && sameMd(files.md, md) && sameMd(files.coverage, cov) && samePage;
    say(ok ? 'reports/resources energy outputs are up to date.' : 'energy outputs are out of date. Run: node scripts/resource-energy.mjs report --write');
    if (!ok) process.exit(1);
    return;
  }
  if (has('write')) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
    fs.writeFileSync(files.json, jsonText);
    fs.writeFileSync(files.md, md);
    fs.writeFileSync(files.coverage, cov);
    fs.writeFileSync(files.page, pageHtml);
    say(`Wrote ${path.relative(labRoot, files.json)}, ENERGY-SUMMARY.md, ENERGY-COVERAGE.md and cloud/cleer.html.`);
  }
  if (val('json')) writeJson(val('json'), summary);
  if (!has('write') && !val('json')) say(md);
}

function pageOnly() {
  const summary = buildSummary();
  const file = path.resolve(labRoot, 'cloud/cleer.html');
  if (has('write')) { fs.writeFileSync(file, page(summary)); say(`Wrote ${path.relative(labRoot, file)}.`); return; }
  say(`Would write ${path.relative(labRoot, file)} (${Buffer.byteLength(page(summary))} bytes). Use --write.`);
}

function estimate() {
  const model = val('model');
  const cost = Number(val('cost'));
  if (!model || !Number.isFinite(cost)) { say('Usage: node scripts/resource-energy.mjs estimate --model=<id> --cost=<usd>'); process.exit(2); }
  const mapping = loadMapping();
  const useCase = val('use-case'), tier = val('tier');
  const event = {
    event_type: 'ai-request', activity: 'validation', model, occurred_at: new Date().toISOString(),
    measurements: { cost: { estimated_usd: cost, basis: 'client-estimated' }, tokens: {} },
  };
  const effective = { ...mapping, use_case_by_activity: { ...(mapping.use_case_by_activity || {}), default: useCase || mapping.use_case_by_activity?.default || 'agentic' }, default_tier: tier || mapping.default_tier };
  const result = estimateEvent(event, { mapping: effective });
  say(JSON.stringify(result, null, 2));
}

async function sync() {
  const sha = val('sha');
  const provenance = JSON.parse(fs.readFileSync(PROVENANCE_FILE, 'utf8'));
  const pin = sha || provenance.source.pin;
  if (sha && sha !== provenance.source.pin && !has('force')) {
    say(`Refusing to change the pin from ${provenance.source.pin} to ${sha} without --force.`);
    process.exit(2);
  }
  const base = `https://raw.githubusercontent.com/sustainableaigroup/CLEER/${pin}/data/v1`;
  const files = ['meta.json', 'models.json', 'cleer-dashboard-data.csv', 'schema.md'];
  const fetched = {};
  for (const name of files) {
    const res = await fetch(`${base}/${name}`);
    if (!res.ok) throw new Error(`fetch failed for ${name}: HTTP ${res.status}`);
    fetched[name] = Buffer.from(await res.arrayBuffer());
  }
  const meta = JSON.parse(fetched['meta.json'].toString('utf8'));
  const modelsHash = sha256(fetched['models.json']);
  if (meta.sha256 && meta.sha256 !== modelsHash) throw new Error(`models.json checksum ${modelsHash} does not equal the published ${meta.sha256}`);
  fs.mkdirSync(CLEER_DIR, { recursive: true });
  const recorded = {};
  for (const name of files) {
    fs.writeFileSync(path.join(CLEER_DIR, name), fetched[name]);
    recorded[name] = { sha256: sha256(fetched[name]), bytes: fetched[name].length };
  }
  recorded['models.json'].published_checksum = true;
  const next = {
    schema_version: '1.0.0',
    source: { ...provenance.source, pin, vendored_at: new Date().toISOString().replace(/\.\d{3}Z$/, 'Z') },
    licence: provenance.licence,
    methodology: {
      engine: meta.methodology.engine, accounting: meta.methodology.accounting,
      dataset_schema_version: meta.schemaVersion, data_updated: meta.dataUpdated, generated_at: meta.generatedAt,
      capability_and_cost_snapshot: meta.methodology.capability_and_cost_snapshot,
    },
    files: recorded,
  };
  fs.writeFileSync(PROVENANCE_FILE, `${JSON.stringify(next, null, 2)}\n`);
  say(`Synced CLEER ${pin} into ${path.relative(labRoot, CLEER_DIR)} and rewrote provenance.json.`);
}

async function main() {
  if (cmd === 'verify') return verify();
  if (cmd === 'report') return report();
  if (cmd === 'page') return pageOnly();
  if (cmd === 'estimate') return estimate();
  if (cmd === 'factors') {
    const file = val('file');
    if (!file) { say('Usage: node scripts/resource-energy.mjs factors --file=<path> [--check]'); process.exit(2); }
    const data = JSON.parse(fs.readFileSync(path.resolve(file), 'utf8'));
    const check = validateFactorSet(data, path.basename(file));
    if (!check.ok) { say(check.errors.join('\n')); process.exit(1); }
    say(`Factor set is valid. ${data.models.length} model(s); synthetic=${data.synthetic === true}; energy unit ${data.units.energy}.`);
    if (val('model') && val('cost') != null) {
      const event = { model: val('model'), measurements: { tokens: { uncached_input: Number(val('tokens-in') ?? 0), cache_read: Number(val('tokens-cache') ?? 0), cache_creation: Number(val('tokens-create') ?? 0), output: Number(val('tokens-out') ?? 0) } } };
      say(JSON.stringify(estimateWithCoefficients(event, data), null, 2));
    }
    return;
  }
  if (cmd === 'sync') return sync();
  say('Usage: node scripts/resource-energy.mjs verify|report|page|estimate|factors|sync');
  process.exit(2);
}

main().catch((e) => { console.error(e.message); process.exit(1); });
