// Dataset provenance for the vendored CLEER data. This module never contacts the network: it reads the committed
// provenance.json and the vendored files, and reports whether they still match. Updating the dataset is an explicit
// `node scripts/resource-energy.mjs sync` step; nothing here replaces historical coefficients automatically.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
export const ENERGY_DIR = here;
export const CLEER_DIR = path.join(here, 'cleer');
export const PROVENANCE_FILE = path.join(CLEER_DIR, 'provenance.json');

export const sha256File = (file) => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');

export function readProvenance(file = PROVENANCE_FILE) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

// A single, small object for reports. It deliberately omits the vendoring timestamp and any path, so a report is
// reproducible and nothing local leaks. No key here is on the public allowlist's forbidden list.
export function datasetMeta(provenance = readProvenance()) {
  return {
    organization: provenance.source.organization,
    dataset: provenance.source.dataset_name,
    version: `${provenance.methodology.engine}/${provenance.methodology.dataset_schema_version}`,
    engine: provenance.methodology.engine,
    schema_version: provenance.methodology.dataset_schema_version,
    accounting: provenance.methodology.accounting,
    release: provenance.methodology.data_updated,
    built: provenance.methodology.generated_at,
    pin: provenance.source.pin,
    checksum: provenance.files['models.json'].sha256,
    licence: provenance.licence.data,
    citation: provenance.source.citation,
  };
}

// Recompute every vendored checksum and compare it with the recorded value and with the checksum upstream publishes in
// meta.json for models.json. Any mismatch is a hard failure: an estimator must never silently use altered coefficients.
export function verifyDataset({ strict = true, dir = CLEER_DIR, provenanceFile = path.join(dir, 'provenance.json') } = {}) {
  const provenance = readProvenance(provenanceFile);
  const problems = [];
  const files = {};
  for (const [name, record] of Object.entries(provenance.files)) {
    const file = path.join(dir, name);
    if (!fs.existsSync(file)) { problems.push(`missing vendored file: ${name}`); files[name] = { exists: false }; continue; }
    const actual = sha256File(file);
    const ok = actual === record.sha256;
    files[name] = { exists: true, bytes: fs.statSync(file).size, sha256: actual, recorded: record.sha256, ok };
    if (!ok) problems.push(`checksum mismatch: ${name}`);
  }
  const metaFile = path.join(dir, 'meta.json');
  let published = null;
  if (fs.existsSync(metaFile)) {
    const meta = JSON.parse(fs.readFileSync(metaFile, 'utf8'));
    published = meta.sha256 || null;
    const models = provenance.files['models.json']?.sha256;
    if (published && models && published !== models) problems.push('models.json checksum does not equal the checksum published in meta.json');
    if (meta.schemaVersion !== provenance.methodology.dataset_schema_version) problems.push('dataset schema version differs from provenance');
    if (meta.methodology?.engine !== provenance.methodology.engine) problems.push('methodology engine differs from provenance');
  }
  const result = { ok: problems.length === 0, problems, files, published_checksum: published, pin: provenance.source.pin };
  if (strict && !result.ok) return result;
  return result;
}

export function assertDataset() {
  const result = verifyDataset();
  if (!result.ok) throw new Error(`CLEER dataset failed verification: ${result.problems.join('; ')}`);
  return result;
}
