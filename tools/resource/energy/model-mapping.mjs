// Model identification for energy estimation. The only way a lab model gets a dataset model is an explicit entry in
// mapping.json, or an exact normalized name match. Anything else is unsupported. A proxy keeps its review status and
// the dataset's own confidence, so a guess is always visible as a guess.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { dataset } from './cleer.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
export const MAPPING_FILE = path.join(here, 'mapping.json');
export const MATCH_TYPES = Object.freeze(['exact', 'alias', 'proxy', 'unsupported', 'ambiguous', 'unknown']);
export const REVIEW_STATES = Object.freeze(['unreviewed', 'reviewed']);

export function loadMapping(file = MAPPING_FILE) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

// Case, spaces, dots, underscores and dashes are not meaningful in a model name comparison. Everything else is.
export const normalizeModelName = (s) => String(s ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');

export function validateMapping(mapping, { models = dataset().models.models } = {}) {
  const problems = [];
  const names = new Set(models.map((m) => m.name));
  const normalized = new Map();
  for (const m of models) normalized.set(normalizeModelName(m.name), (normalized.get(normalizeModelName(m.name)) || 0) + 1);
  const seen = new Set();
  for (const [i, entry] of (mapping.models || []).entries()) {
    const at = `models[${i}]`;
    if (!entry.input_model) problems.push(`${at}: missing input_model`);
    if (!entry.dataset_model) problems.push(`${at}: missing dataset_model`);
    if (entry.match_type && !MATCH_TYPES.includes(entry.match_type)) problems.push(`${at}: invalid match_type "${entry.match_type}"`);
    if (entry.review_status && !REVIEW_STATES.includes(entry.review_status)) problems.push(`${at}: invalid review_status "${entry.review_status}"`);
    if (entry.dataset_model && !names.has(entry.dataset_model)) problems.push(`${at}: dataset_model "${entry.dataset_model}" is not in the dataset`);
    const key = normalizeModelName(entry.input_model);
    if (seen.has(key)) problems.push(`${at}: duplicate mapping for "${entry.input_model}"`);
    seen.add(key);
  }
  for (const uc of Object.values(mapping.use_case_by_activity || {})) {
    if (!['chat', 'agentic'].includes(uc)) problems.push(`use_case_by_activity: "${uc}" is not chat or agentic`);
  }
  if (mapping.default_tier && !['light', 'typical', 'heavy'].includes(mapping.default_tier)) problems.push(`default_tier "${mapping.default_tier}" is not light, typical or heavy`);
  return problems;
}

const UNSUPPORTED = (inputModel, reason) => ({
  input_model: inputModel, dataset_model: null, match_type: 'unsupported', review_status: null,
  confidence: null, rationale: reason,
});

// Resolve one lab model. Returns a plain object; never throws for an unknown model.
export function resolveModel(inputModel, { mapping = loadMapping(), models } = {}) {
  const modelList = models || dataset().models.models;
  if (!inputModel) return UNSUPPORTED(inputModel, 'No model identifier was recorded on the event.');
  const explicit = (mapping.models || []).find((m) => normalizeModelName(m.input_model) === normalizeModelName(inputModel));
  if (explicit) {
    const info = modelList.find((m) => m.name === explicit.dataset_model) || null;
    return {
      input_model: inputModel,
      dataset_model: explicit.dataset_model,
      match_type: explicit.match_type || 'proxy',
      review_status: explicit.review_status || 'unreviewed',
      // CLEER's own proxy-match confidence, not a probability that the estimate is correct.
      confidence: info && typeof info.confidence === 'number' ? info.confidence : null,
      rationale: explicit.rationale || null,
      reviewed_by: explicit.reviewed_by ?? null,
      reviewed_at: explicit.reviewed_at ?? null,
    };
  }
  const key = normalizeModelName(inputModel);
  const exact = modelList.filter((m) => normalizeModelName(m.name) === key);
  if (exact.length === 1) {
    return { input_model: inputModel, dataset_model: exact[0].name, match_type: 'exact', review_status: 'reviewed', confidence: exact[0].confidence ?? null, rationale: 'Exact normalized-name match against the dataset.', reviewed_by: null, reviewed_at: null };
  }
  if (exact.length > 1) {
    return { input_model: inputModel, dataset_model: null, match_type: 'ambiguous', review_status: null, confidence: null, rationale: `More than one dataset model normalizes to "${inputModel}".`, candidates: exact.map((m) => m.name) };
  }
  return UNSUPPORTED(inputModel, `No mapping.json entry and no exact dataset name match for "${inputModel}".`);
}

// Which CLEER use case a request belongs to. Configured, not inferred from tokens or duration.
export function useCaseFor(activity, mapping = loadMapping()) {
  const map = mapping.use_case_by_activity || {};
  return map[activity] || map.default || 'agentic';
}

export function tierFor(mapping = loadMapping()) {
  return mapping.default_tier || 'typical';
}
