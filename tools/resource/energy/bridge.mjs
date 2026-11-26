// Deterministic energy estimation from the vendored CLEER dataset. No model, no network, no clock-dependent decision
// except the report timestamp. Raw events are never modified: an estimate is derived from an event's measured cost and
// a published CLEER intensity. The method is a documented bridge, not a measurement, and every result says so.
import { dataset, ratioFor, tierRatios, WORKLOADS, round } from './cleer.mjs';
import { datasetMeta } from './provenance.mjs';
import { resolveModel, useCaseFor, tierFor, loadMapping } from './model-mapping.mjs';

export const METHOD = 'cost-bridge-v1';
export const BASIS = 'cost-bridge';
export const BOUNDARY = 'facility-inference (accelerator + host + idle + cooling)';
export const SIGMA = 1.96;

const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);
const counted = (e) => !e.accounting || e.accounting.counted !== false;

export function costOf(event) {
  const c = event.measurements?.cost || {};
  if (num(c.reported_usd) != null) return { usd: c.reported_usd, basis: c.basis || 'provider-reported' };
  if (num(c.estimated_usd) != null) return { usd: c.estimated_usd, basis: c.basis || 'estimated' };
  return { usd: null, basis: 'unavailable' };
}

// The events this estimator applies to: counted AI events, with or without a model (a model-less event is reported as
// unavailable, not dropped). A session roll-up that reconciliation marked uncounted is excluded, so a request is never
// estimated twice through its session.
export function isAiEvent(event) {
  return counted(event) && event.activity !== 'monitoring'
    && (event.event_type === 'ai-request' || event.event_type === 'ai-usage');
}

const SHARED_LIMITATIONS = [
  'Estimated, not measured. The figure is a published CLEER energy-per-dollar intensity multiplied by a client-reported cost.',
  'CLEER publishes no per-token coefficients; the token counts behind its workloads are withheld. This project does not reconstruct them.',
  'CLEER\'s workload is a fixed token mix; our request mix may differ. Our cache-read share is very high, and CLEER\'s workload cache share is unpublished.',
  'The headline uses the published energy_wh_per_usd. CLEER also publishes a verbosity-adjusted vadj_energy_wh_per_usd; using it would raise the agentic estimate for the mapped models by roughly 28-31%. That alternative is reported as a sensitivity, never folded into the headline.',
  'Cost is a client-reported estimate, not an invoice or subscription statement, and may price tokens differently from CLEER\'s Artificial Analysis snapshot.',
  'One ratio per model drives every request, so the aggregate uncertainty is correlated and does not narrow with more requests.',
  'The bridge and any future per-token coefficient method are shown separately and are never merged.',
];

export function modelResolver(mapping = loadMapping(), models) {
  const cache = new Map();
  return (inputModel) => {
    if (!cache.has(inputModel)) cache.set(inputModel, resolveModel(inputModel, { mapping, models }));
    return cache.get(inputModel);
  };
}

// An unavailable estimate still keeps the cost it was given, so the coverage metric can show spend that could not be
// bridged. It never carries an energy figure.
const unavailable = (base, code, cost = null) => ({
  ...base, status: 'unavailable', unavailable_code: code,
  ...(cost && num(cost.usd) != null && cost.usd >= 0 ? { cost: { usd: round(cost.usd, 6), basis: cost.basis } } : {}),
  central_wh: null, workload_low_wh: null, workload_high_wh: null, configuration_low_wh: null, configuration_high_wh: null,
});

// Estimate one AI event. Returns null when the event is not an AI event; otherwise an object whose `status` is
// "estimated" or "unavailable". A measured zero cost stays a zero estimate when a ratio exists.
export function estimateEvent(event, { mapping = loadMapping(), resolve = null, now = null } = {}) {
  if (!isAiEvent(event)) return null;
  const resolveOne = resolve || modelResolver(mapping);
  const meta = datasetMeta(dataset().provenance);
  const cost = costOf(event);
  const model = resolveOne(event.model);
  const useCase = useCaseFor(event.activity, mapping);
  const tier = tierFor(mapping);
  const base = {
    status: null, basis: BASIS, method_version: METHOD,
    dataset: { version: meta.version, release: meta.release, checksum: meta.checksum, pin: meta.pin, licence: meta.licence },
    model_mapping: {
      input_model: model.input_model, dataset_model: model.dataset_model, match_type: model.match_type,
      review_status: model.review_status, confidence: model.confidence,
    },
    use_case: useCase, workload: `${useCase}.${tier}`,
    boundary: BOUNDARY,
    intensity_column: 'energy_wh_per_usd',
    computed_at: now,
  };
  if (!event.model) return unavailable(base, 'missing_model', cost);
  if (model.match_type === 'unsupported') return unavailable(base, 'unsupported_model', cost);
  if (model.match_type === 'ambiguous') return unavailable(base, 'ambiguous_model', cost);
  if (model.match_type === 'unknown') return unavailable(base, 'unknown_model', cost);
  if (cost.usd == null) return unavailable(base, 'missing_cost');
  if (cost.usd < 0) return unavailable(base, 'invalid_cost');
  if (cost.basis === 'subscription-allowance') return unavailable(base, 'cost_not_a_charge', cost);

  let ratio, tiers;
  try { ratio = ratioFor(model.dataset_model, useCase, tier); tiers = tierRatios(model.dataset_model, useCase); } catch (e) { return unavailable(base, 'dataset_inconsistent', cost); }
  if (!ratio) return unavailable(base, 'no_published_intensity', cost);
  const ratios = Object.values(tiers).map((t) => t.energy_wh_per_usd).filter((v) => num(v) != null);
  const central = cost.usd * ratio.energy_wh_per_usd;
  const rel = num(ratio.relative_sd);
  // The configuration band propagates CLEER's own per-session dispersion. It is a scenario spread, not a confidence
  // interval, and it is never merged with the workload band. A negative lower bound is not physically meaningful, so it
  // is clamped at zero (per event and again on the aggregate); the band is conservative, not a quantile.
  const configLow = rel == null ? null : Math.max(0, central * (1 - SIGMA * rel));
  const configHigh = rel == null ? null : central * (1 + SIGMA * rel);
  const vadjWh = cost.usd * (num(ratio.vadj_energy_wh_per_usd) ?? NaN);
  return {
    ...base,
    status: 'estimated',
    energy_wh_per_usd: ratio.energy_wh_per_usd,
    cost: { usd: round(cost.usd, 6), basis: cost.basis },
    central_wh: round(central),
    vadj_central_wh: Number.isFinite(vadjWh) ? round(vadjWh) : null,
    workload_low_wh: ratios.length ? round(cost.usd * Math.min(...ratios)) : null,
    workload_high_wh: ratios.length ? round(cost.usd * Math.max(...ratios)) : null,
    configuration_low_wh: round(configLow),
    configuration_high_wh: round(configHigh),
    uncertainty: {
      kind: 'scenario-band',
      relative_sd: rel == null ? null : round(rel, 4),
      note: 'Configuration band is 1.96 x the published per-session relative standard deviation. It is a scenario spread, not a confidence interval.',
    },
    coverage: { status: 'complete', missing_categories: [] },
  };
}

function blankBucket() {
  return { events: 0, estimated: 0, unavailable: 0, cost_usd: 0, cost_covered_usd: 0, central_wh: 0, vadj_wh: 0, workload_low_wh: 0, workload_high_wh: 0, configuration_low_wh: 0, configuration_high_wh: 0, has_workload_band: true, has_config_band: true, has_vadj: true, use_cases: new Set(), models: new Set() };
}

function addTo(bucket, estimate) {
  bucket.events++;
  const cost = num(estimate.cost?.usd);
  if (estimate.status === 'estimated') {
    bucket.estimated++;
    if (cost != null) { bucket.cost_covered_usd += cost; }
    bucket.central_wh += estimate.central_wh || 0;
    if (estimate.vadj_central_wh == null) bucket.has_vadj = false; else bucket.vadj_wh += estimate.vadj_central_wh;
    if (estimate.workload_low_wh == null) bucket.has_workload_band = false; else { bucket.workload_low_wh += estimate.workload_low_wh; bucket.workload_high_wh += estimate.workload_high_wh; }
    if (estimate.configuration_low_wh == null) bucket.has_config_band = false; else { bucket.configuration_low_wh += estimate.configuration_low_wh; bucket.configuration_high_wh += estimate.configuration_high_wh; }
    if (estimate.use_case) bucket.use_cases.add(estimate.use_case);
    bucket.models.add(estimate.model_mapping?.dataset_model || estimate.model_mapping?.input_model);
  } else {
    bucket.unavailable++;
  }
  if (cost != null) bucket.cost_usd += cost;
}

function finalise(bucket, extra = {}) {
  return {
    ...extra,
    events: bucket.events,
    estimated: bucket.estimated,
    unavailable: bucket.unavailable,
    cost_usd: round(bucket.cost_usd, 2),
    cost_covered_usd: round(bucket.cost_covered_usd, 2),
    central_wh: bucket.estimated ? round(bucket.central_wh) : null,
    vadj_central_wh: bucket.estimated && bucket.has_vadj ? round(bucket.vadj_wh) : null,
    workload_low_wh: bucket.estimated && bucket.has_workload_band ? round(bucket.workload_low_wh) : null,
    workload_high_wh: bucket.estimated && bucket.has_workload_band ? round(bucket.workload_high_wh) : null,
    configuration_low_wh: bucket.estimated && bucket.has_config_band ? round(Math.max(0, bucket.configuration_low_wh)) : null,
    configuration_high_wh: bucket.estimated && bucket.has_config_band ? round(bucket.configuration_high_wh) : null,
    use_cases: [...bucket.use_cases].sort(),
    dataset_models: [...bucket.models].filter(Boolean).sort(),
  };
}

// Public reference rows: the published numbers for the models this repository maps to. Real CLEER data, not an
// estimate of our usage. Every row carries its provenance and its components.
export function referenceTable(mapping = loadMapping()) {
  const names = [...new Set((mapping.models || []).map((m) => m.dataset_model))].filter(Boolean);
  const info = new Map(dataset().models.models.map((m) => [m.name, m]));
  const rows = [];
  for (const name of names) {
    const model = info.get(name);
    for (const workload of WORKLOADS) {
      const [useCase, tier] = workload.split('.');
      let ratio = null;
      try { ratio = ratioFor(name, useCase, tier); } catch { ratio = null; }
      const published = dataset().ratios.get(`${name}|${useCase}|${tier}`);
      if (!ratio || !published) continue;
      rows.push({
        dataset_model: name, provider: model?.provider || published.provider || null,
        estimation_basis: model?.estimation_basis || published.estimation_basis || null,
        confidence: model?.confidence ?? published.confidence ?? null, hardware: model?.hardware || published.hardware || null,
        workload, use_case: useCase, tier,
        energy_wh_per_usd: ratio.energy_wh_per_usd,
        vadj_energy_wh_per_usd: published.vadj_energy_wh_per_usd ?? null,
        energy_wh_mean: published.energy_wh_mean, energy_wh_sd: published.energy_wh_sd, cost_usd: published.cost_usd,
        components_wh: published.components_wh,
      });
    }
  }
  return rows;
}

// The full derived report. It takes events and the mapping; it never writes to the ledger.
export function energySummary(events, { mapping = loadMapping(), now = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'), models } = {}) {
  const meta = datasetMeta();
  const resolve = modelResolver(mapping, models);
  const ai = (events || []).filter(isAiEvent);
  const estimates = [];
  const byModel = new Map(), byActivity = new Map(), byUse = new Map(), byIssue = new Map(), byDay = new Map();
  const unavailableCodes = new Map();

  for (const event of ai) {
    const estimate = estimateEvent(event, { mapping, resolve, now });
    estimates.push({ event, estimate });
    const cost = num(estimate.cost?.usd);
    if (estimate.status !== 'estimated') unavailableCodes.set(estimate.unavailable_code || 'unknown', (unavailableCodes.get(estimate.unavailable_code || 'unknown') || 0) + 1);
    const modelKey = estimate.model_mapping?.input_model || 'unknown';
    if (!byModel.has(modelKey)) byModel.set(modelKey, blankBucket());
    addTo(byModel.get(modelKey), estimate);
    const activityKey = event.activity || 'unknown';
    if (!byActivity.has(activityKey)) byActivity.set(activityKey, blankBucket());
    addTo(byActivity.get(activityKey), estimate);
    const useKey = estimate.use_case || 'unknown';
    if (!byUse.has(useKey)) byUse.set(useKey, blankBucket());
    addTo(byUse.get(useKey), estimate);
    const issueKey = event.issue || 'unattributed';
    if (!byIssue.has(issueKey)) byIssue.set(issueKey, blankBucket());
    addTo(byIssue.get(issueKey), estimate);
    const day = String(event.occurred_at).slice(0, 10);
    if (!byDay.has(day)) byDay.set(day, blankBucket());
    addTo(byDay.get(day), estimate);
    void cost;
  }

  const totalsBucket = blankBucket();
  for (const { estimate } of estimates) addTo(totalsBucket, estimate);
  const totals = finalise(totalsBucket);

  const modelRows = [...byModel.entries()].map(([model, bucket]) => {
    const sample = estimates.find((e) => (e.estimate.model_mapping?.input_model || 'unknown') === model)?.estimate;
    return finalise(bucket, {
      model,
      provider: sample?.model_mapping ? (dataset().models.models.find((m) => m.name === sample.model_mapping.dataset_model)?.provider || null) : null,
      dataset_model: sample?.model_mapping?.dataset_model ?? null,
      match_type: sample?.model_mapping?.match_type ?? null,
      review_status: sample?.model_mapping?.review_status ?? null,
      confidence: sample?.model_mapping?.confidence ?? null,
      energy_wh_per_usd: sample?.energy_wh_per_usd ?? null,
    });
  }).sort((a, b) => (b.cost_usd || 0) - (a.cost_usd || 0));

  // Use-case sensitivity: what the same spend would imply under the other use case. Reported separately, never
  // folded into the headline.
  const alternate = {};
  for (const useCase of ['chat', 'agentic']) {
    let central = 0, covered = 0;
    for (const event of ai) {
      const model = resolve(event.model);
      if (!['exact', 'alias', 'proxy'].includes(model.match_type)) continue;
      const cost = costOf(event);
      if (cost.usd == null || cost.usd < 0) continue;
      try {
        const ratio = ratioFor(model.dataset_model, useCase, tierFor(mapping));
        if (ratio) { central += cost.usd * ratio.energy_wh_per_usd; covered++; }
      } catch { /* a dataset inconsistency is reported through unavailable_code */ }
    }
    alternate[useCase] = { central_wh: covered ? round(central) : null, events_covered: covered };
  }

  const activityRows = [...byActivity.entries()].map(([activity, bucket]) => finalise(bucket, { activity })).sort((a, b) => (b.central_wh || 0) - (a.central_wh || 0));
  const useRows = [...byUse.entries()].map(([use_case, bucket]) => finalise(bucket, { use_case })).sort((a, b) => (String(a.use_case) < String(b.use_case) ? -1 : String(a.use_case) > String(b.use_case) ? 1 : 0));
  const issueRows = [...byIssue.entries()].map(([issue, bucket]) => finalise(bucket, { issue })).sort((a, b) => (b.central_wh || 0) - (a.central_wh || 0));
  const trendRows = [...byDay.entries()].map(([date, bucket]) => ({ date, ...finalise(bucket) })).sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));

  const modelsObserved = [...new Set(ai.map((e) => e.model).filter(Boolean))].sort();
  const modelStatus = modelsObserved.map((m) => resolve(m));
  const mapped = modelStatus.filter((m) => ['exact', 'alias', 'proxy'].includes(m.match_type));
  const unmapped = modelStatus.filter((m) => !['exact', 'alias', 'proxy'].includes(m.match_type));

  const coverage = {
    denominator: 'counted AI events (ai-request and counted ai-usage)',
    ai_events: ai.length,
    estimated: totals.estimated,
    unavailable: totals.unavailable,
    estimated_share: ai.length ? round(totals.estimated / ai.length, 4) : null,
    cost_total_usd: totals.cost_usd,
    cost_covered_usd: totals.cost_covered_usd,
    cost_covered_share: totals.cost_usd ? round(totals.cost_covered_usd / totals.cost_usd, 4) : null,
    models_observed: modelsObserved.length,
    models_mapped: mapped.length,
    models_unmapped: unmapped.length,
    models_with_exact_match: modelStatus.filter((m) => m.match_type === 'exact').length,
    models_with_proxy_match: modelStatus.filter((m) => m.match_type === 'proxy').length,
    models_with_unreviewed_proxy: modelStatus.filter((m) => m.match_type === 'proxy' && m.review_status === 'unreviewed').length,
    unavailable_by_code: Object.fromEntries([...unavailableCodes.entries()].sort()),
  };

  const eventEstimates = new Map();
  for (const { event, estimate } of estimates) if (event.event_id) eventEstimates.set(event.event_id, estimate);
  const result = {
    schema_version: '1.0.0',
    generated_at: now,
    period: { from: ai.length ? String(ai.map((e) => e.occurred_at).sort()[0]).slice(0, 10) : null, to: ai.length ? String(ai.map((e) => e.occurred_at).sort().at(-1)).slice(0, 10) : null },
    method: {
      name: 'CLEER cost bridge',
      basis: BASIS,
      method_version: METHOD,
      boundary: BOUNDARY,
      what_is_measured: 'client-reported cost per AI event; provider-reported token counts',
      what_is_estimated: 'remote inference energy, from a published CLEER energy-per-dollar intensity',
      what_is_unavailable: 'per-token energy coefficients; direct measurement of provider infrastructure',
      uncertainty: 'CLEER per-session standard deviation propagated as 1.96 x relative sd; scenario spread, not a confidence interval',
      dataset: meta,
      use_case_by_activity: mapping.use_case_by_activity || {},
      default_tier: tierFor(mapping),
      sigma: SIGMA,
      intensity_column: 'energy_wh_per_usd',
      adjusted_column: 'vadj_energy_wh_per_usd',
      calibration: 'At dataset load, every row is checked: its published energy_wh_per_usd must agree with energy_wh_mean / cost_usd within 1%, or estimation stops. The same check also runs on each lookup.',
    },
    coverage,
    totals,
    use_case_sensitivity: {
      note: 'What the same measured spend would imply under each use case. These are alternatives, not a range. The use case is configured per activity in mapping.json.',
      chat: alternate.chat,
      agentic: alternate.agentic,
      ratio_chat_over_agentic: alternate.chat.central_wh && alternate.agentic.central_wh ? round(alternate.chat.central_wh / alternate.agentic.central_wh, 2) : null,
    },
    by_model: modelRows,
    by_activity: activityRows,
    by_use_case: useRows,
    by_issue: issueRows,
    trend: trendRows,
    reference: referenceTable(mapping),
    unavailable: [...unavailableCodes.entries()].map(([code, events]) => ({ code, events })).sort((a, b) => b.events - a.events),
    limitations: SHARED_LIMITATIONS,
    privacy: {
      public_fields: 'Aggregates only: model identifiers, dataset identifiers, costs, estimated energy, coverage counts. No prompts, transcripts, paths, hosts, usernames, session ids, task descriptions or evidence paths. Evidence ids are opaque hashes; generated_at is the only precise time.',
      estimate_grid: 'Per-request estimates are computed deterministically and are available through the estimate command; the published report aggregates them.',
      missing_is_not_zero: true,
    },
  };
  // Per-event estimates are available to the dashboard composer but are never serialised into a report.
  Object.defineProperty(result, 'event_estimates', { value: eventEstimates, enumerable: false });
  return result;
}
