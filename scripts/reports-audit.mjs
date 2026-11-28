#!/usr/bin/env node
// Read-only reports hygiene check. Finds tracked files that are too large, tracked files that .gitignore already
// intends to exclude, issue folders missing their canonical documents, and untracked report paths. It never moves,
// deletes or edits anything.
//
//   node scripts/reports-audit.mjs [--json] [--max-mb=5] [--warn]
//
// Exit 1 when a hard rule is broken; --warn always exits 0. Legacy reports are checked for size but not for the
// current issue-folder shape.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { labRoot } from '../tools/compare/lib.mjs';

const args = process.argv.slice(2);
const has = (name) => args.some((a) => a === `--${name}` || a.startsWith(`--${name}=`));
const val = (name, fallback) => { const a = args.find((x) => x.startsWith(`--${name}=`)); return a ? a.slice(name.length + 3) : fallback; };
const maxMb = Number(val('max-mb', '5'));
const json = has('json');
const warn = has('warn');
if (!Number.isFinite(maxMb) || maxMb <= 0) { console.error('reports-audit: --max-mb must be a positive number'); process.exit(2); }

const git = (a, opts = {}) => spawnSync('git', ['-C', labRoot, ...a], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, ...opts });
const tracked = (git(['ls-files', '-z', 'reports']).stdout || '').split('\0').filter(Boolean);
const ignored = new Set((git(['ls-files', '-ci', '--exclude-standard', '-z', 'reports']).stdout || '').split('\0').filter(Boolean));
const rows = tracked.map((file) => {
  const abs = path.join(labRoot, file);
  let bytes = null;
  try { bytes = fs.statSync(abs).size; } catch { /* deleted in the working tree */ }
  return { file, bytes, ignored: ignored.has(file) };
});
const totalBytes = rows.reduce((n, r) => n + (r.bytes || 0), 0);
const tooLarge = rows.filter((r) => r.bytes != null && r.bytes > maxMb * 1024 ** 2);
const trackedIgnored = rows.filter((r) => r.ignored);
const rootFiles = tracked.filter((f) => /^reports\/[^/]+$/.test(f) && f !== 'reports/README.md');
const latest = tracked.filter((f) => /-latest\.[^/]+$/.test(f) && !f.startsWith('reports/legacy/'));
const issueMissing = [];
const issuesDir = path.join(labRoot, 'reports/issues');
let issueDirs = [];
try { issueDirs = fs.readdirSync(issuesDir, { withFileTypes: true }).filter((d) => d.isDirectory() && /^\d{5,8}$/.test(d.name)).map((d) => d.name); } catch { /* no issues */ }
for (const nid of issueDirs) {
  const dir = path.join(issuesDir, nid);
  const missing = ['SUMMARY.md', 'EVIDENCE.md', 'REPRODUCE.md', 'STATUS.md'].filter((f) => !fs.existsSync(path.join(dir, f)));
  if (missing.length) issueMissing.push({ nid, missing });
}
const untracked = (git(['status', '--porcelain', '-z', 'reports']).stdout || '').split('\0').filter((l) => l.startsWith('?? ')).map((l) => l.slice(3));
const problems = tooLarge.length + trackedIgnored.length + issueMissing.length + rootFiles.length;
const result = {
  generated_at: new Date().toISOString(),
  max_mb: maxMb,
  tracked: { files: rows.length, bytes: totalBytes },
  too_large: tooLarge.map((r) => ({ file: r.file, bytes: r.bytes })),
  tracked_ignored: trackedIgnored.map((r) => r.file),
  root_files: rootFiles,
  issue_missing: issueMissing,
  latest_files: latest.length,
  untracked_report_paths: untracked.length,
  untracked_examples: untracked.slice(0, 20),
  problems,
};
if (json) console.log(JSON.stringify(result, null, 2));
else {
  console.log(`Reports audit: ${problems ? 'ATTENTION' : 'clean'}`);
  console.log(`  tracked: ${rows.length} files, ${(totalBytes / 1024 ** 2).toFixed(1)} MB; ceiling ${maxMb} MB per file`);
  if (tooLarge.length) { console.log(`  over ${maxMb} MB (${tooLarge.length}):`); for (const r of tooLarge) console.log(`    ${(r.bytes / 1024 ** 2).toFixed(1)} MB ${r.file}`); }
  if (trackedIgnored.length) { console.log(`  tracked but ignored by .gitignore (${trackedIgnored.length}):`); for (const r of trackedIgnored) console.log(`    ${r.file}`); }
  if (rootFiles.length) { console.log(`  files directly under reports/ (${rootFiles.length}):`); for (const f of rootFiles) console.log(`    ${f}`); }
  if (issueMissing.length) { console.log(`  issue folders missing canonical files (${issueMissing.length}):`); for (const i of issueMissing) console.log(`    ${i.nid}: ${i.missing.join(', ')}`); }
  console.log(`  current -latest files: ${latest.length}; untracked report paths: ${untracked.length}`);
  if (untracked.length) console.log(`  first untracked: ${untracked.slice(0, 8).join(', ')}`);
  console.log('  Read-only. See reports/README.md for the intended layout.');
}
process.exit(problems && !warn ? 1 : 0);
