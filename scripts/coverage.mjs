// What has, and has not, been tested for an issue: browsers, colour modes, viewports, and manual checks.
//   node scripts/coverage.mjs <nid>      writes reports/issues/<nid>/COVERAGE.md
// Reads every reports/issues/<nid>/playwright/*/results.json (each records its browser, colour scheme, viewport and core commit)
// and optional viewer logs saved in reports/issues/<nid>/manual/*.json. Rows with no run are listed as NOT TESTED, so a gap is
// visible instead of forgotten. The standard matrix can be replaced per variant with a `coverage` field in variants.json.
import fs from 'node:fs';
import path from 'node:path';
import { labRoot, variants } from '../tools/compare/lib.mjs';

const nid = process.argv.slice(2).find((a) => /^\d+$/.test(a));
if (!nid) { console.error('usage: node scripts/coverage.mjs <nid>'); process.exit(2); }
const dir = path.join(labRoot, 'reports/issues', nid);
const vs = variants().filter((x) => String(x.issue) === nid);
const pinned = vs.find((x) => /-pinned$/.test(x.slug)) || vs[0];
const pinnedCommit = pinned && pinned.core && pinned.core.commit ? pinned.core.commit : '';

const DEFAULT_MATRIX = [
  { browser: 'chromium', scheme: 'light', forced: false, width: 480 }, { browser: 'chromium', scheme: 'dark', forced: false, width: 480 },
  { browser: 'chromium', scheme: 'light', forced: true, width: 480 },
  { browser: 'firefox', scheme: 'light', forced: false, width: 480 }, { browser: 'firefox', scheme: 'dark', forced: false, width: 480 },
  { browser: 'webkit', scheme: 'light', forced: false, width: 480 }, { browser: 'webkit', scheme: 'dark', forced: false, width: 480 },
];
const matrix = (pinned && pinned.coverage && pinned.coverage.matrix) || DEFAULT_MATRIX;
const blocked = (pinned && pinned.coverage && pinned.coverage.blocked) || {};
const MANUAL = (pinned && pinned.coverage && pinned.coverage.manual) || [
  'Keyboard-only pass by a person (Tab, Shift+Tab, Enter, Escape) in each frame',
  'Real screen reader (VoiceOver, NVDA, JAWS or TalkBack): deferred by decision 2026-10-01',
  'Right-to-left language (for example Hebrew: Locale module plus the language)',
  'Wide viewport (1280 px or more), where the sidebar starts open',
  'Text zoom to 200% and reflow at 400% (320 CSS px)',
  'Touch device, or touch emulation',
  'Increased-contrast / Windows High Contrast on a real OS (emulated forced colours does not replace it)',
];

// ---- automated runs
const runs = [];
const pw = path.join(dir, 'playwright');
if (fs.existsSync(pw)) for (const d of fs.readdirSync(pw)) {
  const f = path.join(pw, d, 'results.json'); if (!fs.existsSync(f)) continue;
  const r = JSON.parse(fs.readFileSync(f, 'utf8'));
  const env = r.environment || { browser: 'chromium', colorScheme: 'light', forcedColors: false, viewport: r.viewport, assumed: true };
  runs.push({ dir: d, variant: r.variant || '', when: r.when, env, verdict: r.verdict || (env.assumed ? 'recorded' : 'recorded'), unexpected: r.unexpected, commit: (r.commits && r.commits.after || '').split(' ')[0], date: (r.commits && r.commits.after || '').split(' ')[1] || '', browserVersion: env.browserVersion || '' });
}
const same = (m, e) => m.browser === e.browser && m.scheme === e.colorScheme && !!m.forced === !!e.forcedColors && m.width === (e.viewport && e.viewport.width);
const label = (m) => `${m.browser} · ${m.scheme}${m.forced ? ' · forced colours' : ''} · ${m.width}px wide`;
const mark = (v, u) => (v === 'reproduced-and-fixed' && u > 0 ? `⚠ reproduced and fixed, but ${u} regression check${u > 1 ? 's' : ''} differ${u > 1 ? '' : 's'} (read the summary)` : ({ 'reproduced-and-fixed': '✓ reproduced and fixed', 'not-reproduced': '⚠ does not reproduce on Before', 'reproduced-not-fixed': '✗ reproduced, NOT fixed', 'mixed': '⚠ mixed result', 'recorded': '✓ run recorded (older format)' }[v] || v));

const rows = []; const gaps = [];
const cell = (m, kind) => {
  const hits = runs.filter((r) => same(m, r.env) && (kind === 'latest' ? /-latest$/.test(r.variant) : !/-latest$/.test(r.variant))).sort((a, b) => (a.when < b.when ? 1 : -1));
  if (!hits.length) return null;
  const r = hits[0]; return { text: `${mark(r.verdict, r.unexpected)}${r.env.assumed ? ' (older run: browser and scheme assumed)' : ''}`, ver: r.env.browserVersion || '', core: `\`${(r.commit || '').slice(0, 12)}\` ${r.date}`, link: `[${r.when.slice(0, 10)}](playwright/${r.dir}/SUMMARY.md)` };
};
for (const m of matrix) {
  const p = cell(m, 'pinned'), l = cell(m, 'latest');
  const why = blocked[m.browser] ? `**NOT TESTED** (attempted, blocked: ${blocked[m.browser]})` : '**NOT TESTED**';
  if (!p) gaps.push(label(m) + (blocked[m.browser] ? ` (blocked: ${blocked[m.browser]})` : ''));
  rows.push(`| ${label(m)} | ${p ? p.text : why} | ${l ? l.text : '_not run_'} | ${(p || l || {}).ver || ''} | ${[p && p.link, l && l.link].filter(Boolean).join(' · ')} |`);
}
// runs that are not in the matrix (other widths, schemes)
const extra = runs.filter((r) => !matrix.some((m) => same(m, r.env)));

// ---- manual logs saved from the viewer
const manual = []; const md = path.join(dir, 'manual');
if (fs.existsSync(md)) for (const f of fs.readdirSync(md).filter((x) => x.endsWith('.json'))) { try { const j = JSON.parse(fs.readFileSync(path.join(md, f), 'utf8')); manual.push({ f, j }); } catch { /* ignore */ } }
const mrows = manual.map(({ f, j }) => { const e = j.environmentTested || {}; const obs = j.manualObservations || []; const answered = obs.filter((o) => o.answered && o.answered.before && o.answered.after).length;
  return `| ${(j.exported || '').slice(0, 10)} | ${e.browser || '?'} ${e.browserVersion || ''} | ${e.os || '?'} | ${(e.colourModes || []).join(', ') || '?'} | ${e.viewport || '?'} | ${(e.input || []).join(', ') || '?'} | ${e.assistiveTechnology || 'none'} | ${answered}/${obs.length} answered | \`manual/${f}\` |`; });

const out = `# Test coverage for #${nid}

Generated by \`node scripts/coverage.mjs ${nid}\`; do not edit by hand. Pinned core: ${pinnedCommit ? '`' + pinnedCommit.slice(0, 12) + '`' : 'not pinned'}.
A row says what the scripted walkthrough (\`tools/playwright/walkthrough.mjs\`) found in that environment. **A missing row is a gap, not a pass.**

${gaps.length ? `## Gaps: ${gaps.length} automated environment${gaps.length === 1 ? '' : 's'} NOT TESTED\n${gaps.map((g) => `- ${g}`).join('\n')}\n\nRun one with, for example: \`node tools/playwright/walkthrough.mjs ${pinned ? pinned.slug : '<slug>'} --browser=firefox --scheme=dark\` (add \`--forced-colors\` for forced colours; \`--viewport=1280x900\` for a wide window). Browsers are installed with \`cd tools/playwright && npx playwright install chromium firefox webkit\`.\n` : '## Gaps\nNone in the standard automated matrix.\n'}
## Automated matrix
| Environment | Pinned core | Latest core | Browser version | Evidence |
|---|---|---|---|---|
${rows.join('\n')}
${extra.length ? `\nOther runs: ${extra.map((r) => `${label({ browser: r.env.browser, scheme: r.env.colorScheme, forced: r.env.forcedColors, width: r.env.viewport && r.env.viewport.width })} (${r.when.slice(0, 10)})`).join('; ')}.\n` : ''}
## Manual checks (a person)
Save the viewer's "Download log" into \`reports/issues/${nid}/manual/\`; it records the environment you tested in.

${mrows.length ? `| Date | Browser | OS | Colour modes | Viewport | Input | Assistive technology | Observations | File |\n|---|---|---|---|---|---|---|---|---|\n${mrows.join('\n')}\n` : '**No manual logs recorded yet.**\n'}
Not yet covered by any recorded run (tick off by adding a manual log or a note here):
${MANUAL.map((m) => `- [ ] ${m}`).join('\n')}

## Limits
Automated runs use emulated colour scheme and forced colours (Playwright), not a real operating system setting. WebKit is Safari's
engine, not Safari itself. Results are a DRAFT until a person has reviewed them.
`;
fs.writeFileSync(path.join(dir, 'COVERAGE.md'), out);
console.log(`reports/issues/${nid}/COVERAGE.md  (${matrix.length - gaps.length} of ${matrix.length} automated environments tested, ${manual.length} manual log${manual.length === 1 ? '' : 's'})`);
