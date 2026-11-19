#!/usr/bin/env node
// Writes a README.md into every run folder under reports/issues/<nid>/playwright/ and an index README.md for the folder,
// so a person browsing GitHub can see what each run is, which images to open, and which Before goes with which After.
//   node scripts/run-readmes.mjs <nid> [--check]
// Read-only apart from the README.md files it writes. --check exits 1 when a README is missing or out of date.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const nid = process.argv[2];
const check = process.argv.includes('--check');
if (!nid || nid.startsWith('--')) { console.error('usage: node scripts/run-readmes.mjs <nid> [--check]'); process.exit(2); }
const base = path.join(root, 'reports/issues', nid, 'playwright');
if (!fs.existsSync(base)) { console.error(`No ${path.relative(root, base)}`); process.exit(2); }

const readJson = (f) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return null; } };
const variants = new Map();
for (const f of ['tools/compare/variants.json', `reports/issues/${nid}/variants.json`]) {
  const j = readJson(path.join(root, f)); for (const v of Array.isArray(j) ? j : Object.values(j || {})) if (v?.slug) variants.set(v.slug, v);
}

const TOGGLE_STATES = {
  default: 'Pointer away, no keyboard focus.',
  hover: 'Real mouse pointer over the toggle.',
  focus: 'Keyboard focus, reached by pressing Tab.',
  'focus+hover': 'Keyboard focus and the pointer over it together.',
};
const SKIP_STEPS = {
  'before-tab': 'Page loaded, nothing focused yet.',
  'skip-focused': 'First Tab press: the skip link has focus.',
  'control-focused': 'A comparable control has focus (reference for the focus style).',
  activated: 'Enter pressed on the skip link; focus moves to the main content.',
};
const FILES = [
  ['SUMMARY.md', 'The run report: verdict, measurements and what was not tested.'],
  ['results.json', 'The same results as data (environment, patch state, per-state measurements).'],
  ['ajax-before.json / ajax-after.json', 'AJAX commands seen on each side during the run.'],
  ['*-ax.txt', 'Accessibility tree text at that moment.'],
  ['*-axe-full.json', 'Full axe-core results at that moment.'],
];

const run = (name) => {
  const dir = path.join(base, name);
  const files = fs.readdirSync(dir).filter((f) => f !== 'README.md');
  const results = readJson(path.join(dir, 'results.json'));
  const md = fs.existsSync(path.join(dir, 'SUMMARY.md')) ? fs.readFileSync(path.join(dir, 'SUMMARY.md'), 'utf8') : '';
  return { name, dir, files, results, md, kind: files.some((f) => /-(skip-focused|before-tab)\.png$/.test(f)) ? 'skip' : 'toggle' };
};

const envLabel = (r) => {
  const e = r.results?.environment || {};
  const vp = e.viewport ? `${e.viewport.width}x${e.viewport.height}` : r.name.match(/\d+x\d+$/)?.[0];
  const bits = [e.colorScheme && `${e.colorScheme} OS scheme`, e.forcedColors && 'forced colors', vp && `${vp} viewport`, e.direction === 'rtl-simulation' && 'RTL simulated', e.reducedMotion && 'reduced motion'];
  return bits.filter(Boolean).join(', ') || r.name;
};

// Pairs a before-* image with its after-* image; returns rows in a readable order.
const pairs = (r) => {
  const imgs = r.files.filter((f) => f.endsWith('.png'));
  const keyOf = (f) => f.replace(/^(before|after)-/, '');
  const rows = new Map();
  for (const f of imgs) { const k = keyOf(f), side = f.startsWith('before-') ? 'before' : 'after'; if (!rows.has(k)) rows.set(k, {}); rows.get(k)[side] = f; }
  const entries = [...rows].map(([key, p]) => {
    let group = '', step = key, note = '';
    if (r.kind === 'skip') {
      const m = key.match(/^(.*?)(?:-trial(\d+))?-(before-tab|skip-focused|control-focused|activated)\.png$/);
      if (m) { group = `${m[1]}${m[2] ? `, trial ${m[2]}` : ''}`; step = m[3]; note = SKIP_STEPS[m[3]]; }
    } else {
      const m = key.match(/^(default|hover|focus\+hover|focus)-(expanded|collapsed)(-closeup)?\.png$/);
      if (m) { group = `Sidebar ${m[2]}`; step = m[1]; note = TOGGLE_STATES[m[1]]; if (m[3]) return null; }
    }
    return { key, p, group, step, note };
  }).filter(Boolean);
  const order = r.kind === 'skip' ? Object.keys(SKIP_STEPS) : Object.keys(TOGGLE_STATES);
  const rank = (e) => order.indexOf(e.step);
  return entries.sort((a, b) => a.group.localeCompare(b.group) || rank(a) - rank(b));
};

const img = (f, alt) => (f ? `[![${alt}](${f})](${f})` : '_not captured_');
const closeupOf = (f, r) => (f && r.files.includes(f.replace(/\.png$/, '-closeup.png')) ? f.replace(/\.png$/, '-closeup.png') : f);

const readme = (r) => {
  const slug = r.results?.variant;
  const v = variants.get(slug) || {};
  const e = r.results?.environment || {};
  const title = r.kind === 'skip'
    ? 'skip link: keyboard focus, saved Appearance and focus colour'
    : 'administration navigation toggle: hover, keyboard focus and activation';
  let out = `# #${nid} ${title}\n\n`;
  out += `**Run:** \`${r.name}\`  \n**Configuration:** ${envLabel(r)}  \n`;
  if (slug) out += `**Comparison:** \`${slug}\`${v.label ? ` (${v.label})` : ''}  \n`;
  if (r.results?.verdict) out += `**Verdict recorded by the script:** ${r.results.verdict} (a draft; a person has not reviewed it)${r.results.verdict === 'mixed' && !pairs(r).length ? '. "Mixed" here means the control was not displayed at this width, so nothing was compared' : ''}  \n`;
  if (r.results?.commits) out += `**Core commits:** Before ${r.results.commits.before}, After ${r.results.commits.after}  \n`;
  if (e.browser) out += `**Browser:** ${e.browser} ${e.browserVersion || ''}, ${e.os || ''}  \n`;
  out += `\n`;
  if (v.description) out += `**Before and After:** ${v.description}\n\n`;
  out += `Start with [SUMMARY.md](SUMMARY.md) for the measurements. The pictures below are the same states on both sides: **Before** is the left column, **After** is the right. Click an image to open it full size.\n\n`;

  const rows = pairs(r);
  if (!rows.length) {
    out += `## Images\n\nThis run has no screenshots. ${r.results?.environment?.viewport ? `At ${e.viewport.width}px wide the control is not displayed (responsive behaviour), so the run recorded only data.` : ''} See [SUMMARY.md](SUMMARY.md).\n\n`;
  } else {
    let group = null;
    if (r.kind === 'skip') out += `Each group is one saved-settings scenario, named \`<Appearance>-<accent>-<focus colour>\` (for example \`dark-pink-orange\` is saved Appearance Dark, Accent Pink, Focus Orange). "Trial 1" and "trial 2" are independent fresh page loads of the same scenario, repeated to show the result is stable.\n\n`;
    for (const row of rows) {
      if (row.group !== group) {
        group = row.group;
        out += `${group === null || out.endsWith('\n\n') ? '' : '\n'}${group ? `## ${group}\n\n` : '## Images\n\n'}| State | Before | After |\n|---|---|---|\n`;
      }
      const f = r.kind === 'toggle';
      const b = f ? closeupOf(row.p.before, r) : row.p.before, a = f ? closeupOf(row.p.after, r) : row.p.after;
      out += `| **${row.step}**${row.note ? `<br>${row.note}` : ''} | ${img(b, `Before: ${row.step} ${row.group}`)} | ${img(a, `After: ${row.step} ${row.group}`)} |\n`;
    }
    out += `\n${r.kind === 'toggle' ? 'Close-up crops are shown; the full-page screenshot has the same name without "-closeup", and carries a label in its top-left corner naming the side (BEFORE or AFTER).' : 'Each image is the full page.'}\n\n`;
  }

  out += `## Files in this folder\n\n| File | What it is |\n|---|---|\n`;
  for (const [f, d] of FILES) if (r.files.some((x) => f.split(' / ').some((p) => p.includes('*') ? x.endsWith(p.replace('*', '')) : x === p))) out += `| \`${f}\` | ${d} |\n`;
  out += `| \`before-*.png\`, \`after-*.png\` | Screenshots from the unmodified (Before) and patched (After) site. |\n\n`;
  out += `## Download\n\nOn GitHub, open a file and choose the download button, or clone the repository. To fetch just this folder:\n\n\`\`\`\ngit clone --depth 1 --filter=blob:none --sparse https://github.com/mgifford/drupal-core-lab.git\ncd drupal-core-lab\ngit sparse-checkout set reports/issues/${nid}/playwright/${r.name}\n\`\`\`\n\n`;
  out += `DRAFT, AI-assisted. Generated by \`node scripts/run-readmes.mjs ${nid}\`; do not edit by hand.\n`;
  return out;
};

const runs = fs.readdirSync(base, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => run(d.name)).sort((a, b) => a.name.localeCompare(b.name));
const cfgKey = (r) => JSON.stringify([r.results?.variant, r.kind, envLabel(r)]);
const newest = new Map(); for (const r of runs) newest.set(cfgKey(r), r.name);

let index = `# #${nid} Playwright runs\n\nEach folder is one scripted run comparing **Before** and **After** under one configuration. Open a folder's \`README.md\` to see the paired screenshots. Folder names are \`<UTC start time>-<browser>-<OS scheme>[-forced]-<viewport>\`.\n\n`;
index += `Two evaluations live here:\n\n- **Navigation toggle** (\`3636143-latest\`): the circular expand/collapse button; hover, focus and keyboard activation.\n- **Skip link** (\`3636143-with-skip-focus\`): the separate 3637339 focus proposal on top of the toggle MR.\n\n`;
index += `| Run | Evaluation | Configuration | Verdict | Screenshots | Status |\n|---|---|---|---|---|---|\n`;
for (const r of [...runs].reverse()) {
  const shots = r.files.filter((f) => f.endsWith('.png')).length;
  index += `| [${r.name}](${r.name}/README.md) | ${r.kind === 'skip' ? 'Skip link' : 'Navigation toggle'} | ${envLabel(r)} | ${r.results?.verdict || 'n/a'} | ${shots || 'none (control hidden)'} | ${newest.get(cfgKey(r)) === r.name ? 'latest for this configuration' : 'superseded by a later run'} |\n`;
}
index += `\nDRAFT, AI-assisted. Generated by \`node scripts/run-readmes.mjs ${nid}\`; do not edit by hand.\n`;

let stale = 0;
const write = (file, text) => {
  const cur = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;
  if (cur === text) return;
  stale++;
  if (check) console.log(`out of date: ${path.relative(root, file)}`); else fs.writeFileSync(file, text);
};
for (const r of runs) write(path.join(r.dir, 'README.md'), readme(r));
write(path.join(base, 'README.md'), index);
console.log(check ? (stale ? `${stale} README file(s) out of date` : 'READMEs up to date') : `${stale} README file(s) written for ${runs.length} runs`);
process.exitCode = check && stale ? 1 : 0;
