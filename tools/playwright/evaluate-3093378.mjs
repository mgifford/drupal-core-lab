// Evidence for #3093378: ARIA disclosure for vertical toolbar submenu buttons (contrib toolbar 2.x).
//   node tools/playwright/evaluate-3093378.mjs [slug]   (default 3093378-latest)
// For each side: logs in, opens the "Manage" tray, and inspects the submenu disclosure button for
// "Structure". Records its markup, its aria-expanded state (before and after a real click), its
// accessible name, its computed text-indent, an axe scan and any JavaScript errors, plus screenshots.
// Writes reports/issues/3093378/playwright/<stamp>/ (results.json, SUMMARY.md, *.png).
// Specific to #3093378; copy and adapt it for another variant.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { PNG } from 'pngjs';
import { labRoot, variants, envInfo, loginPath, envDir } from '../compare/lib.mjs';

const slug = process.argv.slice(2).find((a) => !a.startsWith('-')) || '3093378-latest';
const v = variants().find((x) => x.slug === slug);
if (!v) { console.error(`variant ${slug} not found`); process.exit(1); }
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const out = path.join(labRoot, 'reports/issues', v.issue, 'playwright', `${stamp}-chromium-480x900`);
fs.mkdirSync(out, { recursive: true });
const VIEWPORT = { width: 480, height: 900 };
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

const gitInfo = (env) => { try { return execFileSync('git', ['-C', envDir(env), 'log', '-1', '--format=%H %cs'], { encoding: 'utf8' }).trim(); } catch { return 'unknown'; } };

async function runSide(browser, side) {
  const spec = v[side];
  const info = envInfo(spec.env);
  const host = info.hosts.slice().sort((a, b) => a.length - b.length)[0];
  const base = `https://${host}`;
  const ctx = await browser.newContext({ viewport: VIEWPORT, colorScheme: 'light', forcedColors: 'none', ignoreHTTPSErrors: true });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e.message)));
  await page.goto(base + loginPath(spec.env));           // one-time login link
  await page.goto(base + '/');
  await page.locator('#toolbar-item-administration').click();   // open the Manage tray
  await page.waitForFunction(() => document.querySelectorAll('#toolbar-item-administration-tray .toolbar-handle').length > 0, null, { timeout: 15000 });
  const handle = page.locator('#toolbar-item-administration-tray .toolbar-handle').filter({ hasText: 'Structure' }).first();
  await handle.waitFor({ state: 'visible', timeout: 15000 });

  const probe = async () => handle.evaluate((el) => ({
    html: el.outerHTML.replace(/\s+/g, ' ').trim(),
    ariaExpanded: el.getAttribute('aria-expanded'),
    textIndent: getComputedStyle(el).textIndent,
    hasAction: !!el.querySelector('.action'),
    labelText: (el.querySelector('.label')?.textContent || '').trim(),
    labelVisuallyHidden: !!el.querySelector('.label.visually-hidden'),
    handleCount: document.querySelectorAll('#toolbar-item-administration-tray .toolbar-handle').length,
  }));

  const closed = await probe();
  let accessibleNameClosed = '';
  try { accessibleNameClosed = (await handle.ariaSnapshot()).trim(); } catch (e) { accessibleNameClosed = `(unavailable: ${e.message})`; }
  await page.screenshot({ path: path.join(out, `${side}-1-tray.png`) });

  await handle.click();                                    // real (trusted) click
  await page.waitForTimeout(400);
  const opened = await probe();
  let accessibleNameOpened = '';
  try { accessibleNameOpened = (await handle.ariaSnapshot()).trim(); } catch (e) { accessibleNameOpened = `(unavailable: ${e.message})`; }
  await page.screenshot({ path: path.join(out, `${side}-2-structure-open.png`) });

  const axe = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  const axeSummary = { total: axe.violations.reduce((n, x) => n + x.nodes.length, 0), rules: Object.fromEntries(axe.violations.map((x) => [x.id, x.nodes.length])) };
  await ctx.close();
  return {
    side, env: spec.env, host, closed, opened, accessibleNameClosed, accessibleNameOpened, axe: axeSummary,
    jsErrors: errors.filter((m) => !/ResizeObserver loop/.test(m)),
  };
}

function pixelDiff(aPng, bPng) {
  const a = PNG.sync.read(fs.readFileSync(aPng));
  const b = PNG.sync.read(fs.readFileSync(bPng));
  if (a.width !== b.width || a.height !== b.height) return { width: a.width, height: a.height, diffPixels: null, note: 'different dimensions' };
  const out = new PNG({ width: a.width, height: a.height });
  let diff = 0;
  for (let i = 0; i < a.data.length; i += 4) {
    const d = Math.abs(a.data[i] - b.data[i]) + Math.abs(a.data[i + 1] - b.data[i + 1]) + Math.abs(a.data[i + 2] - b.data[i + 2]) > 30;
    if (d) { diff++; out.data[i] = 255; out.data[i + 1] = 0; out.data[i + 2] = 0; out.data[i + 3] = 255; }
    else { out.data[i] = a.data[i]; out.data[i + 1] = a.data[i + 1]; out.data[i + 2] = a.data[i + 2]; out.data[i + 3] = a.data[i + 3]; }
  }
  return { width: a.width, height: a.height, diffPixels: diff, totalPixels: a.width * a.height, pct: +(100 * diff / (a.width * a.height)).toFixed(3), png: out };
}

const browser = await chromium.launch();
const environment = { browser: 'chromium', browserVersion: browser.version(), colorScheme: 'light', forcedColors: false, viewport: VIEWPORT, os: `${process.platform} ${process.arch}` };
const results = {
  variant: v.slug, issue: v.issue, when: new Date().toISOString(), environment,
  core: v.core, contrib: v.contrib || [], patches: (v.after.contribPatches || []).map((p) => p.patch),
  commits: { before: gitInfo(v.before.env), after: gitInfo(v.after.env) },
  sides: {},
};
for (const side of ['before', 'after']) { console.log(`running ${side} (${v[side].env}) ...`); results.sides[side] = await runSide(browser, side); }
await browser.close();

const diffResult = pixelDiff(path.join(out, 'before-1-tray.png'), path.join(out, 'after-1-tray.png'));
if (diffResult.png) fs.writeFileSync(path.join(out, 'pixel-diff.png'), PNG.sync.write(diffResult.png));
delete diffResult.png;
results.pixelDiff = diffResult;

const B = results.sides.before, A = results.sides.after;
const yn = (b) => (b ? 'yes' : 'no');
const eq = (x, y) => String(x) === String(y);
const checks = [
  ['fix', "Disclosure button carries aria-expanded", yn(B.closed.ariaExpanded != null), yn(A.closed.ariaExpanded != null), !(B.closed.ariaExpanded != null) && A.closed.ariaExpanded != null],
  ['fix', "Label reads 'Structure menu'", B.closed.labelText, A.closed.labelText, !eq(B.closed.labelText, 'Structure menu') && eq(A.closed.labelText, 'Structure menu')],
  ['fix', "Old 'Extend'/'Collapse' action span removed", yn(B.closed.hasAction), yn(A.closed.hasAction), B.closed.hasAction && !A.closed.hasAction],
  ['fix', "aria-expanded changes on click (real click)", `${B.closed.ariaExpanded} → ${B.opened.ariaExpanded}`, `${A.closed.ariaExpanded} → ${A.opened.ariaExpanded}`, !(B.opened.ariaExpanded === 'true') && A.opened.ariaExpanded === 'true'],
  ['regression', 'Disclosure buttons rendered (count)', B.closed.handleCount, A.closed.handleCount, eq(B.closed.handleCount, A.closed.handleCount)],
  ['regression', 'axe violations (elements)', B.axe.total, A.axe.total, eq(B.axe.total, A.axe.total)],
  ['regression', 'JavaScript errors', B.jsErrors.length, A.jsErrors.length, eq(B.jsErrors.length, A.jsErrors.length)],
];
let unexpected = 0;
let md = `# Playwright evidence: #${v.issue} (${v.slug})\n\nRun ${results.when}. Core Before \`${results.commits.before}\`, After \`${results.commits.after}\`. Contrib toolbar \`${(v.contrib[0] || {}).commit || ''}\`; patch on After: \`${(results.patches[0] || 'none').split('/').pop()}\`. Environment: **chromium ${environment.browserVersion}**, viewport ${VIEWPORT.width}x${VIEWPORT.height} (vertical toolbar — the disclosure handles only render when the tray is vertical, below the 1024px breakpoint), ${environment.os}. Trusted input (Playwright click), axe-core WCAG 2.0–2.2 A/AA.\n\nRule: **fix** checks fail on Before and pass on After; **regression** checks are equal.\n\n| Type | Check | Before | After | Verdict |\n|---|---|---|---|---|\n`;
for (const [t, label, b, a, good] of checks) { if (!good) unexpected++; md += `| ${t} | ${label} | ${b} | ${a} | ${good ? '✓ as expected' : '✗ NOT as expected'} |\n`; }

md += `\n## Markup of the "Structure" disclosure button\n\nBefore (closed):\n\n\`\`\`html\n${B.closed.html}\n\`\`\`\n\nBefore (open):\n\n\`\`\`html\n${B.opened.html}\n\`\`\`\n\nAfter (closed):\n\n\`\`\`html\n${A.closed.html}\n\`\`\`\n\nAfter (open):\n\n\`\`\`html\n${A.opened.html}\n\`\`\`\n\n`;
md += `## Accessibility tree of the button (ariaSnapshot)\n\nBefore (closed):\n\n\`\`\`yaml\n${B.accessibleNameClosed}\n\`\`\`\n\nAfter (closed):\n\n\`\`\`yaml\n${A.accessibleNameClosed}\n\`\`\`\n\n`;
md += `## Visual comparison\n\nScreenshots \`before-1-tray.png\` and \`after-1-tray.png\` (same page state) differ in **${diffResult.diffPixels}** of ${diffResult.totalPixels} pixels (${diffResult.pct}%). \`pixel-diff.png\` highlights any difference in red. The change is intended to be visually identical.\n\n`;
md += `Screenshots: \`before-2-structure-open.png\`, \`after-2-structure-open.png\`.\n\n`;
md += `## Interpretation\n\n`;
if (unexpected === 0) md += `✓ **Reproduced and fixed.** Before has no \`aria-expanded\` and a name that flips between "Extend" and "Collapse"; After reports the state with \`aria-expanded\` and keeps a stable name "Structure menu". No regression in the number of handles, axe results or JavaScript errors.\n`;
else md += `✗ **${unexpected} check(s) not as expected** — read the table above before drawing a conclusion.\n`;
md += `\n---\nAutomated evidence is a **DRAFT**: DOM/axe/pixel checks do not replace a keyboard and screen-reader pass by a person. Open the two sites in the viewer to compare by hand.\n`;
fs.writeFileSync(path.join(out, 'SUMMARY.md'), md);
results.verdict = unexpected === 0 ? 'reproduced-and-fixed' : 'mixed';
results.unexpected = unexpected;
fs.writeFileSync(path.join(out, 'results.json'), JSON.stringify(results, null, 2));
console.log(`\n${unexpected === 0 ? 'OK' : 'UNEXPECTED'}: ${path.relative(labRoot, out)}/SUMMARY.md`);
process.exit(unexpected === 0 ? 0 : 2);
