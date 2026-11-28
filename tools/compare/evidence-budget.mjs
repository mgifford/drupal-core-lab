// Inventory and warn-only budgets for issue evidence. It classifies files, compares an issue against configurable limits and
// groups Playwright runs by their meaningful inputs (core, patches, recipe, browser, viewport, scheme, forced colours,
// direction, interaction and page). It never deletes, moves or untracks anything.
import fs from 'node:fs';
import path from 'node:path';
import { parseConfig } from './lab-config.mjs';

export const BUDGET_FILE = 'evidence-budgets.yml';
const DEFAULTS = { mode: 'warn', limits: { max_files_per_issue: 100, max_bytes_per_issue: 5 * 1024 ** 2, max_bytes_per_json: 250 * 1024, max_images_per_run: 8 } };
const KNOWN = new Set(Object.keys(DEFAULTS.limits));

export function loadBudgets(root) {
  const file = path.join(root, BUDGET_FILE);
  if (!fs.existsSync(file)) return { config: JSON.parse(JSON.stringify(DEFAULTS)), source: `defaults (no ${BUDGET_FILE})`, problems: [] };
  const parsed = parseConfig(fs.readFileSync(file, 'utf8'));
  const problems = [...parsed.problems], config = JSON.parse(JSON.stringify(DEFAULTS)), raw = parsed.value || {};
  if (raw.mode != null) { if (!['warn', 'strict'].includes(raw.mode)) problems.push('mode must be warn or strict'); else config.mode = raw.mode; }
  if (raw.limits && typeof raw.limits === 'object') for (const [k, v] of Object.entries(raw.limits)) {
    if (!KNOWN.has(k)) problems.push(`unknown evidence limit "${k}"`);
    else if (typeof v !== 'number' || v < 0) problems.push(`limit ${k} must be a non-negative number`);
    else config.limits[k] = v;
  }
  return { config, source: BUDGET_FILE, problems };
}

const RAW = [/\/design\/observations[^/]*\.json(?:\.gz)?$/, /\/design\/Archive\.zip$/, /\/playwright-trace-[^/]*\.zip$/, /\/design\/.*\.har$/, /\/observations[^/]*\.json(?:\.gz)?$/];
const IMAGE = /\.(png|jpe?g|webp|gif)$/i;
const JSON_RE = /\.json(?:\.gz)?$/i;

export function classifyPath(rel) {
  const p = String(rel).replace(/\\/g, '/');
  if (RAW.some((re) => re.test(p))) return 'raw';
  if (IMAGE.test(p)) return 'image';
  if (/(^|\/)playwright\/[^/]+\/results\.json$/.test(p) || /(^|\/)results\.json$/.test(p) || /(^|\/)(manifest|session|checkpoints?)[^/]*\.json$/.test(p)) return 'structured';
  if (JSON_RE.test(p)) return 'structured';
  if (p.endsWith('.md')) return 'human';
  return 'other';
}

function walk(dir, base, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, e.name), rel = path.join(base, e.name).replace(/\\/g, '/');
    if (e.isDirectory()) walk(abs, rel, out);
    else if (e.isFile()) { let bytes = 0; try { bytes = fs.statSync(abs).size; } catch { /* skip */ } out.push({ rel, bytes, category: classifyPath(rel) }); }
  }
  return out;
}

const sum = (xs) => xs.reduce((n, x) => n + x, 0);
const pct = (n, total) => (total ? `${(100 * n / total).toFixed(1)}%` : '—');

function runKey(results) {
  const e = results?.environment || {};
  const core = results?.core?.commit || null;
  const after = results?.patchState?.after?.recorded?.footprint || results?.patchState?.before?.recorded?.footprint || null;
  const recipe = results?.identity?.recipe?.current || null;
  return JSON.stringify([results?.variant || null, core, after, recipe, e.browser || null, e.browserVersion || null, e.colorScheme || null, !!e.forcedColors, e.reducedMotion || null, e.viewport?.width ?? null, e.viewport?.height ?? null, !!e.rtl, !!e.interaction, e.page || null]);
}

function readRuns(root, nid, files) {
  const runs = [];
  for (const f of files.filter((x) => /\/results\.json$/.test(x.rel))) {
    try {
      const results = JSON.parse(fs.readFileSync(path.join(root, 'reports/issues', nid, f.rel), 'utf8'));
      runs.push({ rel: f.rel, when: String(results.when || ''), key: runKey(results), superseded: results.superseded === true });
    } catch { /* a malformed run is reported by its own tools, not here */ }
  }
  return runs;
}

export function summarizeIssue(root, nid, config = DEFAULTS) {
  const dir = path.join(root, 'reports/issues', nid);
  const files = fs.existsSync(dir) ? walk(dir, '') : [];
  const by = Object.fromEntries(['human', 'structured', 'raw', 'image', 'other'].map((c) => [c, files.filter((f) => f.category === c)]));
  const runs = readRuns(root, nid, files);
  const groups = new Map();
  for (const r of runs) { const g = groups.get(r.key) || []; g.push(r); groups.set(r.key, g); }
  const duplicateGroups = [...groups.values()].filter((g) => g.length > 1);
  const duplicateRuns = sum(duplicateGroups.map((g) => g.length - 1));
  const over = [];
  const L = config.limits;
  if (L.max_files_per_issue && files.length > L.max_files_per_issue) over.push(`${files.length} files > ${L.max_files_per_issue}`);
  if (L.max_bytes_per_issue && sum(files.map((f) => f.bytes)) > L.max_bytes_per_issue) over.push(`${sum(files.map((f) => f.bytes))} bytes > ${L.max_bytes_per_issue}`);
  if (L.max_images_per_run && runs.length && by.image.length > runs.length * L.max_images_per_run) over.push(`${by.image.length} images > ${runs.length * L.max_images_per_run} allowed for ${runs.length} run(s)`);
  const largeJson = files.filter((f) => JSON_RE.test(f.rel) && L.max_bytes_per_json && f.bytes > L.max_bytes_per_json);
  const largeImages = by.image.length;
  return {
    nid: String(nid),
    files: files.length,
    bytes: sum(files.map((f) => f.bytes)),
    categories: Object.fromEntries(Object.entries(by).map(([k, v]) => [k, { files: v.length, bytes: sum(v.map((x) => x.bytes)) }])),
    runs: runs.length,
    duplicate_runs: duplicateRuns,
    duplicate_groups: duplicateGroups.length,
    large_json: largeJson.sort((a, b) => b.bytes - a.bytes).map((f) => ({ path: f.rel, bytes: f.bytes })),
    images: largeImages,
    over_budget: over,
    warnings: over.concat(duplicateRuns ? [`${duplicateRuns} duplicate run(s) for the same configuration/revision`] : []).concat(largeJson.length ? [`${largeJson.length} JSON file(s) over ${L.max_bytes_per_json} bytes`] : []),
  };
}

export function issueMarkdown(row) {
  const kb = (n) => `${(n / 1024).toFixed(1)} KiB`;
  const mb = (n) => `${(n / 1024 ** 2).toFixed(1)} MiB`;
  let md = `## #${row.nid}\n\n| Measure | Value |\n|---|---:|\n`;
  md += `| Files | ${row.files} |\n| Size | ${mb(row.bytes)} |\n| Human-readable | ${row.categories.human.files} files, ${mb(row.categories.human.bytes)} |\n`;
  md += `| Structured | ${row.categories.structured.files} files, ${mb(row.categories.structured.bytes)} |\n| Raw diagnostics | ${row.categories.raw.files} files, ${mb(row.categories.raw.bytes)} |\n`;
  md += `| Images | ${row.categories.image.files} files, ${mb(row.categories.image.bytes)} |\n| Playwright runs | ${row.runs} |\n| Duplicate runs | ${row.duplicate_runs} in ${row.duplicate_groups} group(s) |\n`;
  if (row.over_budget.length) md += `\n**Over budget:** ${row.over_budget.join('; ')}.\n`;
  if (row.large_json.length) md += `\nLargest JSON: ${row.large_json.slice(0, 3).map((x) => `\`${x.path}\` (${kb(x.bytes)})`).join(', ')}.\n`;
  return md;
}

export function aggregateMarkdown(rows, { source, mode, generated }) {
  const totalFiles = sum(rows.map((r) => r.files)), totalBytes = sum(rows.map((r) => r.bytes));
  let md = `# Evidence budget\n\nGenerated ${generated} by \`node scripts/evidence-budget.mjs --all --write\` from \`${source}\` (mode: **${mode}**). Warn-only: nothing is deleted, moved or untracked.\n\n`;
  md += `${rows.length} issue(s), ${totalFiles} files, ${(totalBytes / 1024 ** 2).toFixed(1)} MiB. ${rows.filter((r) => r.warnings.length).length} issue(s) have a warning.\n\n`;
  md += `| Issue | Files | Size | Human | Structured | Raw | Images | Runs | Duplicate runs | Warnings |\n|---|---:|---:|---:|---:|---:|---:|---:|---:|---|\n`;
  for (const r of rows.sort((a, b) => b.bytes - a.bytes)) {
    md += `| #${r.nid} | ${r.files} | ${(r.bytes / 1024 ** 2).toFixed(1)} MiB | ${r.categories.human.files} | ${r.categories.structured.files} | ${r.categories.raw.files} | ${r.images} | ${r.runs} | ${r.duplicate_runs} | ${r.warnings.length ? r.warnings.join('; ') : '—'} |\n`;
  }
  md += `\nCategories are path-based: human-readable documents, structured run/summary JSON, raw diagnostics (design observations, traces, archives) and images. Duplicate runs share variant, core commit, patch footprint, recipe, browser/version, viewport, scheme, forced colours, motion, direction, interaction and page. A duplicate is not automatically waste: keep the history that explains a behaviour change.\n`;
  return md;
}
