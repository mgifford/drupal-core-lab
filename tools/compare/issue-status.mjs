// Versioned shape for reports/issues/<nid>/status.json. The snapshots are written by scripts/issue-status.mjs, but older
// ones may hold a merge-request URL where the current code expects an object, or omit fields added later. Normalize first,
// validate second, and keep unknown fields so a migration never silently discards information.
import fs from 'node:fs';
import path from 'node:path';
import { validateAgainst } from '../observability/schema.mjs';
import { SCHEMA_VERSION, normalizeStatus, normalizeMr } from './issue-status-normalize.mjs';

export { SCHEMA_VERSION, normalizeStatus, normalizeMr };
export const SCHEMA_PATH = path.join(path.dirname(new URL(import.meta.url).pathname), 'issue-status.schema.json');
const schema = JSON.parse(fs.readFileSync(SCHEMA_PATH, 'utf8'));

export function validateStatus(raw) {
  const status = normalizeStatus(raw);
  return validateAgainst(status, schema);
}

export function readStatus(dir) {
  try { return normalizeStatus(JSON.parse(fs.readFileSync(path.join(dir, 'status.json'), 'utf8'))); } catch { return null; }
}
