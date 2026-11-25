// Read-only access to the vendored CLEER dataset. Everything here is offline and deterministic: no fetch, no clock,
// no interpretation beyond picking a published field. The dataset publishes per-session energy and, in the CSV, an
// energy-per-dollar intensity. It does not publish per-token coefficients; this module never invents one.
import fs from 'node:fs';
import path from 'node:path';
import { CLEER_DIR, PROVENANCE_FILE, readProvenance, assertDataset } from './provenance.mjs';

export const MODELS_FILE = path.join(CLEER_DIR, 'models.json');
export const META_FILE = path.join(CLEER_DIR, 'meta.json');
export const CSV_FILE = path.join(CLEER_DIR, 'cleer-dashboard-data.csv');

export const USE_CASES = ['chat', 'agentic'];
export const TIERS = ['light', 'typical', 'heavy'];
export const WORKLOADS = USE_CASES.flatMap((u) => TIERS.map((t) => `${u}.${t}`));

// Minimal RFC 4180 parser. The upstream CSV quotes the workload description, which contains commas, so a split(',')
// would corrupt every row. Fields are addressed by header name, never by position.
export function parseCsv(text) {
  const rows = [];
  let row = [], field = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else quoted = false; }
      else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',') { row.push(field); field = ''; }
    else if (ch === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else if (ch === '\r') continue;
    else field += ch;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  const header = rows.shift() || [];
  return rows.filter((r) => r.length && r.some((v) => v !== '')).map((r) => Object.fromEntries(header.map((h, i) => [h, r[i] ?? ''])));
}

const numOrNull = (v) => { const n = Number(v); return v === '' || !Number.isFinite(n) ? null : n; };
export const round = (n, d = 6) => (typeof n === 'number' && Number.isFinite(n) ? Math.round(n * 10 ** d) / 10 ** d : null);

export function loadModels() {
  return JSON.parse(fs.readFileSync(MODELS_FILE, 'utf8'));
}

export function loadMeta() {
  return JSON.parse(fs.readFileSync(META_FILE, 'utf8'));
}

export function loadRatios() {
  const rows = parseCsv(fs.readFileSync(CSV_FILE, 'utf8'));
  const byKey = new Map();
  for (const r of rows) {
    const useCase = String(r.use_case || '').toLowerCase();
    const tier = String(r.tier || '').toLowerCase();
    if (!useCase || !tier) continue;
    byKey.set(`${r.model_name}|${useCase}|${tier}`, {
      model_name: r.model_name,
      provider: r.provider || null,
      kind: r.kind || null,
      estimation_basis: r.estimation_basis || null,
      confidence: numOrNull(r.confidence),
      hardware: r.hardware || null,
      use_case: useCase,
      tier,
      // The published intensity. Upstream rounds it to 2 decimal places.
      energy_wh_per_usd: numOrNull(r.energy_wh_per_usd),
      // Verbosity-adjusted intensity (CLEER's robust "vadj" column). Reported as a sensitivity, never used silently.
      vadj_energy_wh_per_usd: numOrNull(r.vadj_energy_wh_per_usd),
      energy_wh_mean: numOrNull(r.energy_wh_mean),
      energy_wh_sd: numOrNull(r.energy_wh_sd),
      cost_usd: numOrNull(r.cost_usd),
      components_wh: {
        accelerator: numOrNull(r.e_accelerator_wh), host: numOrNull(r.e_host_wh),
        idle: numOrNull(r.e_idle_wh), cooling: numOrNull(r.e_cooling_wh),
      },
    });
  }
  return byKey;
}

let cache = null;
export function dataset() {
  if (cache) return cache;
  assertDataset();
  const provenance = readProvenance();
  const models = loadModels();
  const meta = loadMeta();
  const ratios = loadRatios();
  // The published intensity must agree with its own components for every row, not only the rows an estimate happens to
  // look up: a stale or mixed dataset would otherwise pass unnoticed until someone used that row.
  for (const [key, entry] of ratios) {
    const c = checkRatioConsistency(entry);
    if (!c.ok) throw new Error(`CLEER dataset is inconsistent at load (${key}): ${c.problem || `published ${c.published} vs energy_wh_mean/cost_usd ${c.computed.toFixed(4)}`}`);
  }
  cache = { provenance, meta, models, ratios, byName: new Map(models.models.map((m) => [m.name, m])) };
  return cache;
}

// Recompute the ratio from mean and cost and compare it with the published field. A disagreement larger than one
// percent means the CSV and JSON are no longer consistent, so the estimator refuses rather than choosing one.
export function checkRatioConsistency(entry) {
  if (entry.energy_wh_per_usd == null || entry.energy_wh_mean == null || entry.cost_usd == null || entry.cost_usd <= 0) return { ok: false, problem: 'missing published ratio inputs' };
  const computed = entry.energy_wh_mean / entry.cost_usd;
  const relative = Math.abs(computed - entry.energy_wh_per_usd) / Math.abs(entry.energy_wh_per_usd);
  return { ok: relative <= 0.01, computed, published: entry.energy_wh_per_usd, relative };
}

export function ratioFor(modelName, useCase, tier) {
  const entry = dataset().ratios.get(`${modelName}|${useCase}|${tier}`);
  if (!entry) return null;
  const consistency = checkRatioConsistency(entry);
  if (!consistency.ok) throw new Error(`CLEER ratio inconsistency for ${modelName} ${useCase}.${tier}: ${consistency.problem || `published ${consistency.published} vs computed ${consistency.computed.toFixed(4)}`}`);
  const relativeSd = entry.energy_wh_mean && entry.energy_wh_sd != null ? entry.energy_wh_sd / entry.energy_wh_mean : null;
  return { ...entry, relative_sd: relativeSd };
}

// The three tiers of one use case, for the workload band. Missing tiers are simply absent, never zero.
export function tierRatios(modelName, useCase) {
  const out = {};
  for (const tier of TIERS) { const r = ratioFor(modelName, useCase, tier); if (r) out[tier] = r; }
  return out;
}

export function modelInfo(name) {
  return dataset().byName.get(name) || null;
}
