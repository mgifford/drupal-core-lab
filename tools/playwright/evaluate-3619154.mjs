// Evidence for #3619154: Default Admin meta sidebar toggle fixes (the merge request reworks the toggle, close button, overlay,
// stored state and resize handle on entity edit forms).
//   node tools/playwright/evaluate-3619154.mjs [slug] [--browser=chromium|firefox|webkit] [--scheme=light|dark] [--forced-colors] [--viewport=WxH] [--out=<dir>]
// Defaults: slug 3619154-latest (current core main; the comparison for a new merge request revision), chromium, light, 1280x900.
// The steps and checks are in sidebar-3619154.mjs: desktop 1280px, 1100px with Navigation, narrow 800px (or the --viewport width
// when it is below 1024px), and 960/1000px. Real input; axe on the open desktop sidebar, the closed one after reload, and the open
// narrow overlay. The context, AJAX commands and announcements are recorded by tools/playwright/lib/lab-run.mjs (see there).
// Writes reports/issues/3619154/playwright/<stamp>-<envTag>/ (results.json, SUMMARY.md, ajax-*.json, *.png) or --out.
// Replaces the 2026-10-14 script, whose "sidebar shown" probe used offsetParent: always null for this position:fixed sidebar.
import path from 'node:path';
import { runArgs, launch, openSide, axeScan, baseResults, writeRun, contextMarkdown, speechMarkdown } from './lib/lab-run.mjs';
import { replaySide, evaluate } from './sidebar-3619154.mjs';

const run = runArgs({ slug: '3619154-latest' });
const narrow = run.viewport.width < 1024 ? run.viewport.width : 800;

async function replay(side) {
  const { page, base, rec } = await openSide(run, side);
  try {
    rec.states = await replaySide(page, base, { out: run.out, side, axe: axeScan, path, narrow });
    return rec;
  } finally {
    await rec.close(run.out);
  }
}

const { browser, environment } = await launch(run);
run.browser = browser;
const results = baseResults(run, environment);
try {
  for (const side of ['before', 'after']) results.sides[side] = await replay(side);
} finally { await browser.close(); }

const B = results.sides.before.states, A = results.sides.after.states;
const ev = evaluate(B, A);
results.checks = ev.rows;
results.verdict = ev.verdict;
results.unexpected = ev.unexpected + results.sides.after.jsErrors.length;
const axeRow = (k, sub) => `| ${k} | ${B[sub[0]][sub[1]]?.total ?? '—'} | ${A[sub[0]][sub[1]]?.total ?? '—'} |`;
const cell = (x) => (x === null ? 'n/a' : typeof x === 'string' ? x.replace(/\|/g, '\\|').replace(/\n/g, ' ') : String(x));
let md = `# #3619154 sidebar toggle: ${run.v.slug}\n\nDRAFT automated evidence, not reviewed by a person. ${results.when}. Verdict: **${results.verdict}** (${results.unexpected} not as expected).\n`;
md += `Before \`${results.commits.before}\`, After \`${results.commits.after}\`. Patches on After: ${(run.v.after.patches || []).map((p) => `\`${path.basename(p)}\``).join(', ') || 'none'}. ${environment.browser} ${environment.browserVersion}, ${environment.colorScheme}${environment.forcedColors ? ', forced colours' : ''}; widths 1280, 1100, ${narrow}, 1000 and 960px.\n\n`;
md += `Fix: should fail Before and pass After. Regression: should pass After. Observed: recorded for a person to judge.\n\n| | Kind | Check | Before | After | Result |\n|---|---|---|---|---|---|\n`;
for (const r of ev.rows) md += `| ${r.id} | ${r.kind} | ${r.label} | ${cell(r.before)} | ${cell(r.after)} | ${r.status} |\n`;
md += `\n## axe (WCAG 2.2 A/AA tags), violations\n\n| Stage | Before | After |\n|---|---|---|\n${axeRow('Desktop, sidebar open', ['desktop', 'axeOpen'])}\n${axeRow('Desktop, closed after reload', ['desktop', 'axeClosed'])}\n${axeRow(`${narrow}px, sidebar open`, ['narrow', 'axeOpen'])}\n`;
md += `\nJavaScript errors: Before ${results.sides.before.jsErrors.length}, After ${results.sides.after.jsErrors.length}.\n`;
md += `\n## Screenshots\n\n\`{before,after}-desktop-initial\`, \`-desktop-closed-reloaded\`, \`-nav-initial\`, \`-nav-after-details\`, \`-narrow-open\`, \`-narrow-escape\`, \`-width-960-open\`, \`-width-1000-open\` (.png).\n\n`;
md += contextMarkdown(results) + speechMarkdown(results);
md += `## How to read it\n\n- F11 is "n/a" on a side where the sidebar and an expanded Navigation cannot both be open below 1280px: each closes the other when opened by a click. O10 shows what a page load from stored state gives.\n- A flash (F9, R11) is any animation frame, from document start for 3 s, with part of the sidebar inside the viewport while it should be closed.\n- Focus is placed with \`locator.focus()\` before each key press; the key presses, clicks and the drag are real input.\n\n`;
md += `Not verified: a person's keyboard pass, a screen reader (synthetic or real), touch resizing, right-to-left, resizing after an AJAX rebuild, other entity forms than /node/1/edit, and themes other than Default Admin.\n`;
console.log(writeRun(run, results, md));
process.exitCode = results.unexpected ? 2 : 0;
