// The per-token coefficient import path. The public CLEER dataset publishes no per-token coefficients, so nothing here
// runs against real data today. It exists so a validated dataset can be supplied locally when one is available, and so
// the estimator's arithmetic is testable with clearly labelled synthetic fixtures. A synthetic estimate is never a real
// energy estimate and must be labelled as synthetic wherever it is shown.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateAgainst } from '../../observability/schema.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
export const FACTORS_SCHEMA_PATH = path.join(here, 'factors.schema.json');
export const COEFFICIENT_METHOD = 'coefficient-v1';
const schema = JSON.parse(fs.readFileSync(FACTORS_SCHEMA_PATH, 'utf8'));

export const TOKEN_CATEGORIES = Object.freeze(['uncached_input', 'cache_read', 'cache_creation', 'output']);
const UNIT_TO_WH = { Wh: 1, kWh: 1000, J: 1 / 3600 };

const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);
const round = (n, d = 6) => (num(n) == null ? null : Math.round(n * 10 ** d) / 10 ** d);

export function validateFactorSet(value, label = 'factor set') {
  const result = validateAgainst(value, schema);
  return { ok: result.ok, errors: result.errors.map((e) => `${label}${e.path || '/'} ${e.message}`) };
}

export function loadFactorSet(file) {
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  const check = validateFactorSet(data, path.basename(file));
  if (!check.ok) throw new Error(`factor set does not validate: ${check.errors.slice(0, 8).join('; ')}`);
  return data;
}

export function factorIndex(data, { name = null, provider = null } = {}) {
  const index = new Map();
  for (const model of data.models) {
    const entry = { ...model, provider: model.provider, dataset_name: data.source.dataset_name, dataset_version: data.source.dataset_version,
      dataset_release: data.source.release_date, checksum: data.source.checksum ?? null,
      licence: data.source.licence.name, redistribution: data.source.licence.redistribution,
      commercial_use: data.source.licence.commercial_use, methodology: data.source.methodology.name,
      methodology_version: data.source.methodology.version, boundary: data.source.methodology.boundary,
      synthetic: data.synthetic === true, energy_unit: data.units.energy };
    if (name && model.model !== name) continue;
    if (provider && model.provider !== provider) continue;
    index.set(model.model, entry);
    for (const alias of model.aliases || []) index.set(alias, entry);
  }
  return index;
}

const coefficient = (model, category, multiplier) => {
  const c = model.coefficients?.[category];
  if (!c || c.status === 'unavailable' || num(c.central) == null) return null;
  return {
    central: c.central * multiplier,
    lower: num(c.lower) == null ? null : c.lower * multiplier,
    upper: num(c.upper) == null ? null : c.upper * multiplier,
    status: c.status,
  };
};

// Estimate one event from a per-token coefficient set. The token categories are kept separate; reasoning is already
// inside output and is never added again. A category whose tokens exist but whose coefficient is unavailable makes the
// result partial rather than silently cheaper.
export function estimateWithCoefficients(event, factors, { match = null } = {}) {
  const multiplier = UNIT_TO_WH[factors.units.energy];
  if (!multiplier) return { status: 'unavailable', unavailable_code: 'unsupported_energy_unit' };
  const model = event.model || match?.input_model;
  const candidates = [...new Set([...(factors.models || []).filter((m) => m.model === model || (m.aliases || []).includes(model)).map((m) => m.model)])];
  if (candidates.length === 0) return { status: 'unavailable', unavailable_code: 'unsupported_model', model_mapping: { input_model: model ?? null, dataset_model: null, match_type: 'unsupported' } };
  if (candidates.length > 1) return { status: 'unavailable', unavailable_code: 'ambiguous_model', model_mapping: { input_model: model ?? null, dataset_model: null, match_type: 'ambiguous', candidates } };
  const entry = factorIndex(factors).get(model);
  const tokens = event.measurements?.tokens || {};
  const matchType = entry.model === model ? 'exact' : 'alias';

  // total_input is a fallback only when the detailed input categories are absent, so a detailed request is never charged
  // twice through a total.
  const detailedInput = TOKEN_CATEGORIES.filter((c) => c !== 'output').some((c) => num(tokens[c]) != null);
  const categories = detailedInput ? TOKEN_CATEGORIES : ['total_input', 'output'];
  const parts = [];
  const missing = [];
  for (const category of categories) {
    const tokenCount = num(tokens[category]);
    if (tokenCount == null) continue;
    const c = coefficient(entry, category, multiplier);
    if (!c) { missing.push(category); continue; }
    if (tokenCount === 0) { parts.push({ category, tokens: 0, wh: 0, lower: 0, upper: 0 }); continue; }
    parts.push({ category, tokens: tokenCount, wh: tokenCount * c.central, lower: num(c.lower) == null ? null : tokenCount * c.lower, upper: num(c.upper) == null ? null : tokenCount * c.upper });
  }
  if (parts.length === 0) {
    return { status: 'unavailable', unavailable_code: missing.length ? 'missing_coefficients' : 'missing_tokens', model_mapping: { input_model: model, dataset_model: entry.model, match_type: matchType } };
  }
  const central = parts.reduce((a, p) => a + p.wh, 0);
  const hasLow = parts.every((p) => num(p.lower) != null);
  const hasHigh = parts.every((p) => num(p.upper) != null);
  return {
    status: 'estimated',
    basis: 'coefficient',
    method_version: COEFFICIENT_METHOD,
    synthetic: entry.synthetic === true,
    dataset: {
      organization: null, version: `${entry.methodology}/${entry.dataset_version}`, release: entry.dataset_release,
      checksum: entry.checksum, licence: entry.licence, boundary: entry.boundary, methodology: entry.methodology,
    },
    model_mapping: { input_model: model, dataset_model: entry.model, match_type: matchType, confidence: null },
    energy_unit: factors.units.energy,
    central_wh: round(central),
    lower_wh: hasLow ? round(parts.reduce((a, p) => a + p.lower, 0)) : null,
    upper_wh: hasHigh ? round(parts.reduce((a, p) => a + p.upper, 0)) : null,
    categories: parts,
    coverage: { status: missing.length ? 'partial' : 'complete', missing_categories: missing },
    uncertainty: { semantics: entry.uncertainty?.semantics || 'unknown', source: entry.uncertainty?.source || null },
    limitations: [
      ...(entry.synthetic ? ['SYNTHETIC coefficients: this is a test fixture, not a real energy estimate.'] : []),
      ...(entry.limitations || []),
    ],
  };
}
