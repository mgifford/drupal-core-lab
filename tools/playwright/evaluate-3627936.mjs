// Evidence for #3627936: the active workspace row on /admin/config/workflow/workspaces has a hard-coded light background in dark mode.
//   node tools/playwright/evaluate-3627936.mjs [slug] [--browser=chromium|firefox|webkit] [--scheme=light|dark] [--forced-colors] [--viewport=WxH] [--out=<dir>]
// Defaults: slug 3627936-latest, chromium, light, 1280x900. Run it with --scheme=dark for the reported problem and with --scheme=light to see what must not change.
// For each side: logs in, makes the workspace "Stage" the active one with the real confirmation form (real clicks), opens the overview and records, for the
// active row and for a row that is not active: the effective background (ancestors composited), the text colour, the contrast of the text on that
// background (WCAG 1.4.3), the contrast of the active row against the other row (what makes the state visible by colour), whether anything other than colour
// marks the row (a border, an outline, the word "active", aria-current), the row on hover, and an axe scan. Contrast is computed here from the
// browser's computed colours; the thresholds are WCAG 2.2: 4.5:1 for text, 3:1 for a state indicator (SC 1.4.11), the second recorded not judged.
// The context, AJAX commands and announcements are recorded by tools/playwright/lib/lab-run.mjs.
// Writes reports/issues/3627936/playwright/<stamp>-<envTag>/ (results.json, SUMMARY.md, *.png) or --out.
import path from 'node:path';
import { runArgs, launch, openSide, axeScan, baseResults, writeRun, contextMarkdown } from './lib/lab-run.mjs';

const run = runArgs({ slug: '3627936-latest' });
const { v, out } = run;
const LIST = '/admin/config/workflow/workspaces';

// WCAG relative luminance and contrast ratio from [r, g, b, a?] (0-255).
const lin = (c) => { const s = c / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; };
const lum = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
const contrast = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const r2 = (n) => (n == null ? null : Math.round(n * 100) / 100);

// Serialised into the browser: facts about one table row. Backgrounds are composited down the ancestors, so a transparent row reports what is seen.
const measureRow = (sel) => {
  const row = document.querySelector(sel); if (!row) return null;
  // Any CSS colour syntax (rgb with a percentage alpha, color-mix, oklch) becomes exact sRGB through a canvas, instead of being parsed by hand.
  const cv = document.createElement('canvas'); cv.width = cv.height = 1; const cx = cv.getContext('2d', { willReadFrequently: true });
  const parse = (s) => { cx.clearRect(0, 0, 1, 1); cx.fillStyle = '#000'; cx.fillStyle = String(s); cx.fillRect(0, 0, 1, 1); const d = cx.getImageData(0, 0, 1, 1).data; return [d[0], d[1], d[2], d[3] / 255]; };
  const over = (top, under) => { const a = top[3]; return [0, 1, 2].map((i) => top[i] * a + under[i] * (1 - a)).concat([1]); };
  const chain = []; for (let e = row; e; e = e.parentElement) chain.push(e);
  let bg = [255, 255, 255, 1]; const dark = matchMedia('(prefers-color-scheme: dark)').matches; if (dark) bg = [18, 18, 18, 1];
  for (const e of chain.reverse()) { const c = parse(getComputedStyle(e).backgroundColor); if (c && c[3] > 0) bg = over(c, bg); }
  const cell = row.querySelector('td') || row, link = row.querySelector('a'), cs = getComputedStyle(row), cellCs = getComputedStyle(cell);
  const border = (el) => { const c = getComputedStyle(el); return ['Left', 'Right', 'Top', 'Bottom'].map((s) => `${s[0]}${c['border' + s + 'Width']} ${c['border' + s + 'Style']}`).join(' '); };
  return {
    classes: row.className, bg, rawBg: cs.backgroundColor, text: parse(cellCs.color), linkColor: link ? parse(getComputedStyle(link).color) : null,
    rowBorder: border(row), cellBorder: border(cell), rowOutline: cs.outlineStyle !== 'none' ? `${cs.outlineWidth} ${cs.outlineStyle}` : 'none', boxShadow: cs.boxShadow,
    ariaCurrent: row.getAttribute('aria-current'), hasActiveWord: /\bactive\b/i.test(row.textContent), rowText: row.textContent.replace(/\s+/g, ' ').trim().slice(0, 120),
    fontWeight: cellCs.fontWeight, colorScheme: cs.colorScheme,
  };
};

async function runSide(side) {
  const { page, base, rec } = await openSide(run, side);
  // make Stage the active workspace the way a person does: the activation form, a real click on its button
  await page.goto(`${base}/admin/config/workflow/workspaces/manage/stage/activate`, { waitUntil: 'load' });
  const confirm = page.locator('form input[type="submit"], form button[type="submit"]').first();
  const confirmLabel = (await confirm.getAttribute('value').catch(() => null)) || (await confirm.textContent().catch(() => '')) || '';
  await confirm.click(); await page.waitForLoadState('load');
  await page.goto(base + LIST, { waitUntil: 'load' }); await page.waitForTimeout(400);
  const theme = await page.evaluate(() => window.drupalSettings?.ajaxPageState?.theme ?? null);
  const colorScheme = await page.evaluate(() => ({ prefersDark: matchMedia('(prefers-color-scheme: dark)').matches, forced: matchMedia('(forced-colors: active)').matches, htmlColorScheme: getComputedStyle(document.documentElement).colorScheme }));
  const active = await page.evaluate(measureRow, 'tr.active-workspace');
  const other = await page.evaluate(measureRow, 'table tbody tr:not(.active-workspace)');
  await page.locator('table').first().screenshot({ path: path.join(out, `${side}-overview.png`) }).catch(() => page.screenshot({ path: path.join(out, `${side}-overview.png`) }));
  let hover = null;
  if (active) { await page.locator('tr.active-workspace').hover(); await page.waitForTimeout(250); hover = await page.evaluate(measureRow, 'tr.active-workspace'); await page.mouse.move(0, 0); }
  const axe = await axeScan(page);
  const table = await page.evaluate(() => [...document.querySelectorAll('table tbody tr')].map((r) => `${r.className || '(no class)'}: ${r.textContent.replace(/\s+/g, ' ').trim().slice(0, 90)}`));
  await rec.close(out);
  const m = (r) => (r ? { bg: r.bg.slice(0, 3).map((x) => Math.round(x)), text: r.text.slice(0, 3).map((x) => Math.round(x)) } : null);
  const textContrast = (r) => (r ? r2(contrast(r.text, r.bg)) : null);
  return Object.assign(rec, { theme, colorScheme, confirmLabel: String(confirmLabel).trim(), active, other, hover, axe, table,
    activeTextContrast: textContrast(active), activeLinkContrast: active && active.linkColor ? r2(contrast(active.linkColor, active.bg)) : null, otherTextContrast: textContrast(other),
    activeVsOther: active && other ? r2(contrast(active.bg, other.bg)) : null, activeBgRgb: m(active), otherBgRgb: m(other), hoverTextContrast: textContrast(hover) });
}

const { browser, environment } = await launch(run);
run.browser = browser;
const results = baseResults(run, environment);
try {
  for (const side of ['before', 'after']) { console.log(`running ${side} (${v[side].env}) ...`); results.sides[side] = await runSide(side); }
} finally { await browser.close(); }

const B = results.sides.before, A = results.sides.after, dark = run.scheme === 'dark' && !run.forced;
const yn = (x) => (x ? 'yes' : 'no'), rgb = (x) => (x ? `rgb(${x.bg.join(', ')})` : 'none'), ratio = (x) => (x == null ? 'n/a' : `${x}:1`);
const noncolour = (s) => (s.active ? [/[1-9]/.test(s.active.rowBorder.replace(/\b0px\b/g, '')) && s.active.rowBorder !== (s.other || {}).rowBorder ? 'border' : null, s.active.cellBorder !== (s.other || {}).cellBorder ? 'cell border' : null, s.active.rowOutline !== 'none' ? 'outline' : null, s.active.boxShadow !== 'none' && s.active.boxShadow !== (s.other || {}).boxShadow ? 'shadow' : null, s.active.ariaCurrent ? 'aria-current' : null, s.active.hasActiveWord && !(s.other && s.other.hasActiveWord) ? 'the word "active"' : null].filter(Boolean) : []);
const checks = [
  ['context', 'Admin theme (drupalSettings)', B.theme, A.theme, B.theme === A.theme],
  ['context', 'Colour scheme the browser reports', JSON.stringify(B.colorScheme), JSON.stringify(A.colorScheme), JSON.stringify(B.colorScheme) === JSON.stringify(A.colorScheme)],
  ['precondition', 'Stage is the active workspace (a tr.active-workspace row exists)', yn(B.active), yn(A.active), !!B.active && !!A.active],
  ['precondition', 'A row that is not active exists to compare with', yn(B.other), yn(A.other), !!B.other && !!A.other],
  ['fix', `Active row background, effective${dark ? ' (dark mode: must not be a light bar)' : ''}`, rgb(B.active), rgb(A.active), dark ? lum(B.active.bg) > 0.5 && lum(A.active.bg) < 0.3 : JSON.stringify(B.active.bg) === JSON.stringify(A.active.bg)],
  ['fix', 'Contrast of the active row text on its background (SC 1.4.3, needs 4.5:1)', ratio(B.activeTextContrast), ratio(A.activeTextContrast), dark ? B.activeTextContrast < 4.5 && A.activeTextContrast >= 4.5 : A.activeTextContrast >= 4.5 && B.activeTextContrast >= 4.5],
  ['observe', 'Contrast of the active link text on its background', ratio(B.activeLinkContrast), ratio(A.activeLinkContrast), true],
  ['observe', 'Contrast of the active row against a row that is not active (what colour alone shows; SC 1.4.11 asks 3:1 of a state indicator)', ratio(B.activeVsOther), ratio(A.activeVsOther), true],
  ['observe', 'Anything other than colour that marks the active row', noncolour(B).join(', ') || 'nothing found', noncolour(A).join(', ') || 'nothing found', true],
  ['observe', 'Active row on hover: text contrast', ratio(B.hoverTextContrast), ratio(A.hoverTextContrast), true],
  ['regression', 'Text contrast of the row that is not active', ratio(B.otherTextContrast), ratio(A.otherTextContrast), B.otherTextContrast === A.otherTextContrast],
  ['regression', 'axe violations (elements)', B.axe.total, A.axe.total, A.axe.total <= B.axe.total],
  ['regression', 'JavaScript errors', B.jsErrors.length, A.jsErrors.length, B.jsErrors.length === 0 && A.jsErrors.length === 0],
];
let unexpected = 0;
let md = `# Playwright evidence: #${v.issue} (${v.slug})\n\nRun ${results.when}. Core Before \`${results.commits.before}\`, After \`${results.commits.after}\`${results.patches.length ? ` plus \`${results.patches.map((p) => p.split('/').pop()).join(', ')}\`` : ' with **no patch** (After is the same as Before: the fix is still to be written and captured)'}. ${environment.browser} ${environment.browserVersion || ''}, ${run.scheme} scheme${run.forced ? ', forced colours' : ''}, ${run.viewport.width}x${run.viewport.height}.\n\n| Type | Check | Before | After | Result |\n|---|---|---|---|---|\n`;
for (const [t, label, b, a, good] of checks) { const judged = t === 'fix' || t === 'precondition' || t === 'regression'; if (judged && !good) unexpected++; md += `| ${t} | ${label} | ${b} | ${a} | ${judged ? (good ? 'as expected' : '**NOT as expected**') : 'recorded'} |\n`; }
md += `\n## Rows\n\nBefore: ${B.table.join(' | ')}\n\nAfter: ${A.table.join(' | ')}\n\nScreenshots: \`before-overview.png\`, \`after-overview.png\`.\n\n`;
md += contextMarkdown(results);
md += `axe rules: Before ${JSON.stringify(B.axe.rules)}, After ${JSON.stringify(A.axe.rules)}.\n`;
const reproduced = dark ? B.active && lum(B.active.bg) > 0.5 && B.activeTextContrast < 4.5 : null;
const fixed = dark ? A.active && lum(A.active.bg) < 0.3 && A.activeTextContrast >= 4.5 : null;
md += dark ? `\n**${reproduced ? 'Reproduced on Before' : 'NOT reproduced on Before'}: the active row is ${reproduced ? 'a light bar with text at ' + ratio(B.activeTextContrast) : 'not light with unreadable text'}. ${fixed ? 'After reads correctly.' : 'After is still wrong (or has no patch yet).'}**\n` : `\nLight scheme: recorded to show what must not change.\n`;
md += `\n---\nAutomated evidence is a DRAFT: colours are computed from the browser's styles, not seen by a person, and a screen reader and a keyboard pass are not covered (this page has no new interaction).\n`;
// light and forced colours: the problem is not there on Before, so nothing is "reproduced"; the run says whether After changed anything it should not
results.verdict = !dark ? (unexpected === 0 ? 'not-reproduced' : 'mixed') : (!reproduced ? 'not-reproduced' : fixed ? (unexpected === 0 ? 'reproduced-and-fixed' : 'mixed') : 'reproduced-not-fixed');
results.unexpected = unexpected;
const where = writeRun(run, results, md);
console.log(`\n${results.verdict}${unexpected ? ` (${unexpected} judged row(s) not as expected)` : ''}: ${where}/SUMMARY.md`);
process.exit(unexpected === 0 || results.verdict === 'reproduced-not-fixed' ? 0 : 2);
