// Evidence for #3273054: the text-format permission checkboxes on /admin/people/permissions have a
// visually-hidden label, and (until core commit 12b38bdace) that label held a link to the text format,
// so the tab sequence contained a focus stop with no visible focus.
//   node tools/playwright/evaluate-3273054.mjs [slug] [--browser=chromium|firefox|webkit] [--scheme=light|dark]
//        [--forced-colors] [--viewport=WxH] [--out=<dir>]
// Defaults: slug 3273054-pinned, chromium, light, 1280x900.
//
// It does not accept a fix on trust and does not assume the problem is still there. For each side it:
//   - opens /admin/people/permissions, filters the table to the text-format permissions,
//     by typing into the Filter permissions field with real keys (the filter listens on keyup; a
//     scripted fill() does not fire keyup and leaves the table unfiltered),
//   - records every text-format permission label: its markup, and whether it contains a focusable element,
//   - checks that the filter actually hid rows before walking, so the walk provably covers the text-format rows,
//   - clicks into the Filter permissions field and presses Tab once per stop (real keys, up to MAX_TABS),
//     recording for every stop the element, its accessible name, its box size, whether it sits inside a
//     visually-hidden label, and its computed outline / box-shadow;
//   - calls a stop "invisible" when it is inside a visually-hidden label or its box is under 4x4 CSS px;
//   - runs axe over the page.
// Verdict: Before has invisible stops and After has none -> reproduced-and-fixed; neither -> not-reproduced;
// both -> reproduced-not-fixed.
// Writes reports/issues/3273054/playwright/<stamp>-<envTag>/ (results.json, SUMMARY.md, ajax-*.json, *.png).
import path from 'node:path';
import { runArgs, launch, openSide, axeScan, baseResults, writeRun, contextMarkdown, ajaxMarkdown, speechMarkdown } from './lib/lab-run.mjs';

const run = runArgs({ slug: '3273054-pinned' });
const { v, out } = run;
const PAGE = '/admin/people/permissions';
const FILTER = '#edit-text';
const FILTER_TEXT = 'text format';
const MAX_TABS = 40;
const INVISIBLE_PX = 4;

// Serialised into the page: the labels and any focusable element hiding inside a visually-hidden label.
const measure = () => {
  const norm = (s) => String(s || '').replace(/\s+/g, ' ').trim();
  const rect = (el) => { const r = el.getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height) }; };
  const focusableSelector = 'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])';
  const labels = [...document.querySelectorAll('label')];
  const hiddenLabels = labels.filter((l) => l.classList.contains('visually-hidden'));
  return {
    filterFieldPresent: !!document.querySelector('#edit-text'),
    permissionsTablePresent: !!document.querySelector('#permissions'),
    checkboxesInTable: document.querySelectorAll('#permissions input[type="checkbox"]').length,
    labelsTotal: labels.length,
    labelsVisuallyHidden: hiddenLabels.length,
    // the defect, if it is present: a focusable element inside a visually-hidden label
    focusableInVisuallyHiddenLabels: hiddenLabels.flatMap((l) => [...l.querySelectorAll(focusableSelector)].map((el) => ({
      tag: el.tagName.toLowerCase(),
      html: el.outerHTML.replace(/\s+/g, ' ').slice(0, 200),
      labelFor: l.getAttribute('for'),
      labelText: norm(l.textContent).slice(0, 120),
      rect: rect(el),
    }))),
    textFormatLabels: labels
      .filter((l) => /text-format/.test(l.getAttribute('for') || ''))
      .map((l) => ({
        for: l.getAttribute('for'),
        visuallyHidden: l.classList.contains('visually-hidden'),
        hasLink: !!l.querySelector('a[href]'),
        innerHTML: l.innerHTML.replace(/\s+/g, ' ').trim().slice(0, 300),
      })),
    // permission titles in the table (the source of the label text)
    textFormatTitles: [...document.querySelectorAll('.permission .title')]
      .filter((t) => /text format$/i.test(norm(t.textContent)))
      .map((t) => t.innerHTML.replace(/\s+/g, ' ').trim().slice(0, 200)),
    // did the filter actually hide rows? (the filter uses jQuery .toggle() -> display:none)
    tableRowsTotal: document.querySelectorAll('#permissions tbody tr').length,
    tableRowsVisible: [...document.querySelectorAll('#permissions tbody tr')].filter((r) => getComputedStyle(r).display !== 'none').length,
    // the markup of one text-format permission row, so the label/control structure is visible in the report
    textFormatRowHtml: (() => {
      const cb = document.querySelector('#permissions input[type="checkbox"][id*="text-format"]');
      const row = cb && cb.closest('tr');
      return row ? row.outerHTML.replace(/\s+/g, ' ').trim().slice(0, 900) : null;
    })(),
  };
};

// One Tab press with real keys; describe where focus landed and whether that stop can be seen.
const stopHere = (page) => page.evaluate(() => {
  const el = document.activeElement;
  if (!el || el === document.body) return null;
  const r = el.getBoundingClientRect();
  const s = getComputedStyle(el);
  const label = el.closest('label');
  const hiddenAncestor = el.closest('.visually-hidden');
  return {
    tag: el.tagName.toLowerCase(),
    type: el.getAttribute('type'),
    id: el.id || null,
    name: el.getAttribute('name'),
    text: (el.getAttribute('aria-label') || el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 90),
    w: Math.round(r.width),
    h: Math.round(r.height),
    inPermissionsTable: !!el.closest('#permissions'),
    insideLabel: !!label,
    labelFor: label ? label.getAttribute('for') : null,
    inVisuallyHiddenLabel: !!hiddenAncestor,
    focusVisible: (() => { try { return el.matches(':focus-visible'); } catch { return null; } })(),
    outline: `${s.outlineStyle} ${s.outlineWidth} ${s.outlineColor}`.replace(/\s+/g, ' ').trim(),
    boxShadow: s.boxShadow === 'none' ? 'none' : 'set',
  };
});

async function walkTabs(page) {
  await page.locator(FILTER).click();          // real click into the Filter permissions field
  const stops = [];
  for (let i = 0; i < MAX_TABS; i++) {
    await page.keyboard.press('Tab');
    const s = await stopHere(page);
    if (!s) break;
    s.invisible = s.inVisuallyHiddenLabel || s.w < INVISIBLE_PX || s.h < INVISIBLE_PX;
    s.textFormat = /text-format/.test(s.id || '');
    stops.push(s);
  }
  return stops;
}

// The page filter (core/modules/user/js/user.permissions.js) listens on keyup and runs 200 ms later.
// A Playwright fill() fires input/change but not keyup, so the table would stay unfiltered; type instead.
async function applyFilter(page) {
  const field = page.locator(FILTER);
  await field.click();
  await field.selectText();
  await page.keyboard.press('Backspace');
  await page.keyboard.type(FILTER_TEXT, { delay: 25 });
  await page.waitForFunction(() => {
    const rows = [...document.querySelectorAll('#permissions tbody tr')];
    const visible = rows.filter((r) => getComputedStyle(r).display !== 'none');
    return visible.length > 0 && visible.length < rows.length;
  }, null, { timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(400);
}

async function runSide(side) {
  const { page, base, rec } = await openSide(run, side);
  const url = `${base}${PAGE}`;
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);

  await applyFilter(page);                     // narrow the table to the text-format permissions

  const data = { env: v[side].env, url: PAGE };
  data.measured = await page.evaluate(measure);
  data.stops = await walkTabs(page);
  data.invisibleStops = data.stops.filter((s) => s.invisible);
  data.axe = await axeScan(page);

  const table = page.locator('#permissions');
  if (await table.count()) await table.screenshot({ path: path.join(out, `${side}-permissions-table.png`) }).catch(() => {});
  await page.screenshot({ path: path.join(out, `${side}-page.png`) }).catch(() => {});

  await rec.collect();
  await rec.close(out);
  return Object.assign(rec, data);
}

const { browser, environment } = await launch(run);
run.browser = browser;
const results = baseResults(run, environment);
try {
  for (const side of ['before', 'after']) { console.log(`running ${side} (${v[side].env}) ...`); results.sides[side] = await runSide(side); }
} finally { await browser.close(); }

const B = results.sides.before, A = results.sides.after;
const hiddenLinks = (s) => s.measured.focusableInVisuallyHiddenLabels.length;
const yaml = (x) => JSON.stringify(x, null, 2);

results.verdict = B.invisibleStops.length > 0 && A.invisibleStops.length === 0 ? 'reproduced-and-fixed'
  : B.invisibleStops.length === 0 && A.invisibleStops.length === 0 ? 'not-reproduced'
  : B.invisibleStops.length > 0 && A.invisibleStops.length > 0 ? 'reproduced-not-fixed'
  : 'mixed';
results.unexpected = results.verdict === 'reproduced-and-fixed' ? 0 : 1;

const stopRow = (s) => `| ${s.tag}${s.type ? `[type=${s.type}]` : ''}${s.id ? `#${s.id}` : ''} | ${s.inPermissionsTable ? 'yes' : 'no'} | ${s.inVisuallyHiddenLabel ? 'yes' : 'no'} | ${s.textFormat ? 'yes' : 'no'} | ${s.w}x${s.h} | ${s.focusVisible} | ${s.outline || '-'} | ${s.text.slice(0, 50)} |`;

const checks = [
  ['precondition', 'The permissions page has the Filter permissions field and the permissions table', `${B.measured.filterFieldPresent}/${B.measured.permissionsTablePresent}`, `${A.measured.filterFieldPresent}/${A.measured.permissionsTablePresent}`, B.measured.filterFieldPresent && B.measured.permissionsTablePresent && A.measured.filterFieldPresent && A.measured.permissionsTablePresent],
  ['precondition', 'Text-format permission labels found (after filtering)', B.measured.textFormatLabels.length, A.measured.textFormatLabels.length, B.measured.textFormatLabels.length > 0 && A.measured.textFormatLabels.length > 0],
  ['precondition', 'Permission rows hidden by the filter (the walk provably covers the text-format rows)', `${B.measured.tableRowsVisible}/${B.measured.tableRowsTotal}`, `${A.measured.tableRowsVisible}/${A.measured.tableRowsTotal}`, B.measured.tableRowsVisible > 0 && B.measured.tableRowsVisible < B.measured.tableRowsTotal && A.measured.tableRowsVisible > 0 && A.measured.tableRowsVisible < A.measured.tableRowsTotal],
  ['precondition', 'Keyboard stops that are text-format checkboxes (reached by the walk)', B.stops.filter((s) => s.textFormat).length, A.stops.filter((s) => s.textFormat).length, B.stops.filter((s) => s.textFormat).length > 0 && A.stops.filter((s) => s.textFormat).length > 0],
  ['fix', 'Focusable elements inside a visually-hidden label', hiddenLinks(B), hiddenLinks(A), hiddenLinks(B) > 0 && hiddenLinks(A) === 0],
  ['fix', 'Invisible keyboard stops from the filter field (under 4x4 px or in a visually-hidden label)', B.invisibleStops.length, A.invisibleStops.length, B.invisibleStops.length > 0 && A.invisibleStops.length === 0],
  ['regression', 'Checkboxes in the permissions table', B.measured.checkboxesInTable, A.measured.checkboxesInTable, B.measured.checkboxesInTable === A.measured.checkboxesInTable],
  ['regression', 'Labels on the page / of them visually hidden', `${B.measured.labelsTotal} / ${B.measured.labelsVisuallyHidden}`, `${A.measured.labelsTotal} / ${A.measured.labelsVisuallyHidden}`, B.measured.labelsTotal === A.measured.labelsTotal],
  ['regression', 'axe violations (elements)', B.axe.total, A.axe.total, B.axe.total === A.axe.total],
  ['regression', 'JavaScript errors', B.jsErrors.length, A.jsErrors.length, B.jsErrors.length === 0 && A.jsErrors.length === 0],
  ['observe', 'Keyboard stops recorded from the filter field', B.stops.length, A.stops.length, true],
];

let md = `# Playwright evidence: #${v.issue} (${v.slug})\n\nRun ${results.when}. Core Before \`${results.commits.before}\`, After \`${results.commits.after}\`${results.patches.length ? ` plus \`${results.patches.map((p) => p.split('/').pop()).join('`, `')}\`` : ' (no patch: authored in the lab)'}. ${environment.browser} ${environment.browserVersion}, ${environment.colorScheme}${environment.forcedColors ? ', forced colours' : ''}, ${run.viewport.width}x${run.viewport.height}, ${environment.os}. Real keys (Playwright Tab) and a real click into the filter field; axe-core WCAG 2.0 to 2.2 A/AA. Recorders: tools/playwright/lib/lab-run.mjs.\n\n`;
md += `**Verdict: ${results.verdict}.** `;
md += results.verdict === 'not-reproduced'
  ? `Neither side has an invisible stop. On this core the link is already gone from the permission title, so there is nothing here to fix (see SUMMARY.md: #3619751 removed it on main).\n\n`
  : results.verdict === 'reproduced-and-fixed'
    ? `Before has invisible stops; After has none.\n\n`
    : `Both sides still have invisible stops (or the pair is asymmetric): read the stops below.\n\n`;

md += `Rule: **fix** rows must differ (Before fails, After passes); **precondition** and **regression** rows must hold on both sides; **observe** rows are recorded, not judged.\n\n| Type | Check | Before | After | Verdict |\n|---|---|---|---|---|\n`;
for (const [t, label, b, a, good] of checks) md += `| ${t} | ${label} | ${b} | ${a} | ${good ? 'as expected' : '**NOT as expected**'} |\n`;
md += `\n`;

md += `## Text-format permission labels (the thing the issue is about)\n\nBefore:\n\n\`\`\`yaml\n${yaml(B.measured.textFormatLabels)}\n\`\`\`\n\nAfter:\n\n\`\`\`yaml\n${yaml(A.measured.textFormatLabels)}\n\`\`\`\n\n`;
md += `Permission titles in the table (text formats) — Before: ${yaml(B.measured.textFormatTitles)}; After: ${yaml(A.measured.textFormatTitles)}.\n\n`;
md += `One text-format permission row (markup) — Before: \`${B.measured.textFormatRowHtml}\`\n\nAfter: \`${A.measured.textFormatRowHtml}\`\n\n`;
md += `Permission rows after filtering — Before ${B.measured.tableRowsVisible} of ${B.measured.tableRowsTotal} visible; After ${A.measured.tableRowsVisible} of ${A.measured.tableRowsTotal}. The filter listens on keyup, so the walk types into the field; a scripted \`fill()\` leaves the table unfiltered.\n\n`;

md += `## Keyboard stops after the Filter permissions field\n\nBefore (${B.stops.length} stops, ${B.invisibleStops.length} invisible, ${B.stops.filter((s) => s.textFormat).length} on text-format checkboxes):\n\n| Focused element | In table | In a visually-hidden label | Text format | Box (px) | :focus-visible | Outline | Name |\n|---|---|---|---|---|---|---|---|\n${B.stops.map(stopRow).join('\n')}\n\n`;
md += `After (${A.stops.length} stops, ${A.invisibleStops.length} invisible, ${A.stops.filter((s) => s.textFormat).length} on text-format checkboxes):\n\n| Focused element | In table | In a visually-hidden label | Text format | Box (px) | :focus-visible | Outline | Name |\n|---|---|---|---|---|---|---|---|\n${A.stops.map(stopRow).join('\n')}\n\n`;

md += `<details><summary>Every focusable element found inside a visually-hidden label before the keyboard walk</summary>\n\nBefore:\n\n\`\`\`yaml\n${yaml(B.measured.focusableInVisuallyHiddenLabels)}\n\`\`\`\n\nAfter:\n\n\`\`\`yaml\n${yaml(A.measured.focusableInVisuallyHiddenLabels)}\n\`\`\`\n\n</details>\n\n`;

md += contextMarkdown(results) + ajaxMarkdown(results) + speechMarkdown(results);
md += `axe rules: Before ${JSON.stringify(B.axe.rules)}, After ${JSON.stringify(A.axe.rules)}. JavaScript errors: Before ${JSON.stringify(B.jsErrors)}, After ${JSON.stringify(A.jsErrors)}.\n\nScreenshots: \`before-permissions-table.png\`, \`after-permissions-table.png\`, \`before-page.png\`, \`after-page.png\`.\n\n`;
md += `Limits: this records where focus goes and how big the focused box is. Whether a focus indicator is *legible* is a person's call; the forced-colours and dark rows of the variant's coverage matrix are separate runs.\n`;

console.log(writeRun(run, results, md));
console.log(`verdict: ${results.verdict}`);
