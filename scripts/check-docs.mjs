// Check that the current documentation does not point at files that do not exist.
//   node scripts/check-docs.mjs          (exit 1 if anything is missing)
// Looks at Markdown links and at repository paths written in backticks (tools/..., scripts/..., reports/..., docs/...,
// recipes/..., bundles/...). Skips docs/legacy, third-party folders, and paths that contain placeholders such as <nid> or *.
import fs from 'node:fs';
import path from 'node:path';
import { labRoot } from '../tools/compare/lib.mjs';

const SKIP_DIRS = new Set(['.git', 'node_modules', '.deps', 'envs', 'legacy', '.agents', '.claude', 'bundles']);
const files = [];
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    if (e.isDirectory()) { if (!SKIP_DIRS.has(e.name) && !(d === path.join(labRoot, 'reports') && e.name === 'issues' && false)) walk(path.join(d, e.name)); }
    else if (e.name.endsWith('.md')) files.push(path.join(d, e.name));
  }
})(labRoot);

// Only hand-written, current documents: root README/AGENTS/MIGRATION, docs/*.md, tool and site READMEs, the issue index and
// templates, and each issue's REPRODUCE/VALIDATION/FINDINGS/STATUS/BRANCHES notes. Generated evidence, inherited root files
// (STYLES.md, ACCESSIBILITY.md) and migrated per-issue notes are not checked.
const handWritten = (f) => {
  const r = path.relative(labRoot, f);
  return /^(README|AGENTS|MIGRATION)\.md$/.test(r) || /^docs\/[^/]+\.md$/.test(r) || /^tools\/(compare|playwright)\/(site\/)?README\.md$/.test(r)
    || /^reports\/(issues\/README|_templates\/[^/]+)\.md$/.test(r) || /^reports\/issues\/\d+\/(REPRODUCE|VALIDATION|FINDINGS[^/]*|STATUS[^/]*|BRANCHES)\.md$/.test(r);
};
// Paths that are intentionally absent (MIGRATION.md lists what was left out on purpose) or are examples.
const INTENTIONALLY_ABSENT = /(\/shards\/|reports\/auth-state\.json|reports\/axe-results\/|scripts\/reset-site\.sh)/;
let bad = 0, checked = 0;
const tops = '(?:tools|scripts|reports|docs|recipes|bundles)';
for (const f of files.filter(handWritten)) {
  const text = fs.readFileSync(f, 'utf8'); const dir = path.dirname(f); const seen = new Set();
  const refs = [];
  for (const m of text.matchAll(/\]\(([^)\s]+)\)/g)) { const u = m[1].split('#')[0]; if (u && !/^(https?:|mailto:)/.test(u)) refs.push([path.resolve(dir, u), m[1]]); }
  for (const m of text.matchAll(new RegExp('`(' + tops + '/[^`\\s]+)`', 'g'))) {
    let u = m[1].replace(/[.,;:)]+$/, ''); if (/[<*${}]|\.\.\./.test(u) || INTENTIONALLY_ABSENT.test(u)) continue;
    refs.push([path.join(labRoot, u), u]);
    refs.push([path.resolve(dir, '../..', u), u]);   // paths written relative to an issue folder's parent are tolerated below
  }
  const byLabel = new Map();
  for (const [abs, label] of refs) { const ok = fs.existsSync(abs); byLabel.set(label, (byLabel.get(label) || false) || ok); }
  for (const [label, ok] of byLabel) { checked++; if (!ok && !seen.has(label)) { seen.add(label); bad++; console.log(`MISSING  ${path.relative(labRoot, f)}  ->  ${label}`); } }
}
console.log(`\n${checked} references checked in ${files.filter(handWritten).length} documents, ${bad} missing.`);
process.exit(bad ? 1 : 0);
