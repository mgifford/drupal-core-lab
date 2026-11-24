// Evidence for #3466040: percentage-height dialogs stay inside the viewport
// after their content grows. Run with the registered comparison slug.
import path from 'node:path';
import {
  axeScan,
  baseResults,
  contextMarkdown,
  launch,
  openSide,
  runArgs,
  writeRun,
} from './lib/lab-run.mjs';

const run = runArgs({ slug: '3466040-latest', viewport: '1920x1080' });
const { v, out } = run;
const PAGE = '/lab/dialog-3466040';

async function measure(page) {
  return page.evaluate(() => {
    const content = document.querySelector('#lab-dialog-content');
    const wrapper = content?.closest('.ui-dialog');
    const actions = wrapper?.querySelector('.ui-dialog-buttonpane');
    if (!content || !wrapper || !actions) return null;
    const rect = (element) => {
      const value = element.getBoundingClientRect();
      return {
        top: value.top,
        right: value.right,
        bottom: value.bottom,
        left: value.left,
        width: value.width,
        height: value.height,
      };
    };
    const actionRect = rect(actions);
    const save = actions.querySelector('button');
    const saveRect = save ? rect(save) : null;
    const fits = (bounds) => !!bounds &&
      bounds.top >= 0 &&
      bounds.left >= 0 &&
      bounds.bottom <= window.innerHeight + 0.5 &&
      bounds.right <= window.innerWidth + 0.5;
    return {
      wrapper: rect(wrapper),
      content: {
        ...rect(content),
        clientHeight: content.clientHeight,
        scrollHeight: content.scrollHeight,
      },
      actions: actionRect,
      save: saveRect,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
      requestedHeight: jQuery(content).dialog('option', 'height'),
      actionFits: fits(actionRect) && fits(saveRect),
    };
  });
}

async function runSide(side) {
  const { page, base, rec } = await openSide(run, side);
  await page.goto(base + PAGE, { waitUntil: 'load' });
  await page.getByRole('button', { name: 'Open percentage-height dialog', exact: true }).click();
  await page.locator('#lab-dialog-content').waitFor({ state: 'visible' });
  await page.waitForTimeout(100);
  const initial = await measure(page);
  await page.getByRole('button', { name: 'Expand content', exact: true }).click();
  await page.waitForTimeout(300);
  const expanded = await measure(page);
  await page.keyboard.press('Tab');
  const keyboard = await page.evaluate(() => ({
    tag: document.activeElement?.tagName ?? null,
    text: document.activeElement?.textContent?.replace(/\s+/g, ' ').trim() ?? null,
    withinDialog: !!document.activeElement?.closest('.ui-dialog[aria-modal="true"]'),
    saveFits: (() => {
      const rect = document.activeElement?.getBoundingClientRect();
      return !!rect &&
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= window.innerHeight + 0.5 &&
        rect.right <= window.innerWidth + 0.5;
    })(),
  }));
  await page.screenshot({
    path: path.join(out, `${side}-${run.viewport.width}x${run.viewport.height}.png`),
    fullPage: false,
  });
  const axe = await axeScan(page);
  await rec.close(out);
  return Object.assign(rec, { initial, expanded, keyboard, axe });
}

const { browser, environment } = await launch(run);
run.browser = browser;
const results = baseResults(run, environment);
try {
  for (const side of ['before', 'after']) {
    console.log(`running ${side} (${v[side].env}) ...`);
    results.sides[side] = await runSide(side);
  }
}
finally {
  await browser.close();
}

const before = results.sides.before;
const after = results.sides.after;
const checks = [
  ['precondition', 'The lab dialog opens on both sides', !!before.initial, !!after.initial, !!before.initial && !!after.initial],
  ['fix', 'Before changes the requested height to auto', before.initial?.requestedHeight, after.initial?.requestedHeight, before.initial?.requestedHeight === 'auto'],
  ['fix', 'After keeps a 50% pixel height', before.initial?.requestedHeight, after.initial?.requestedHeight, typeof after.initial?.requestedHeight === 'number' && Math.abs(after.initial.requestedHeight - run.viewport.height / 2) < 1],
  ['fix', 'Expanded action pane and Save fit After', before.expanded?.actionFits, after.expanded?.actionFits, after.expanded?.actionFits === true],
  ['fix', 'Expanded content scrolls After', before.expanded?.content.scrollHeight, after.expanded?.content.scrollHeight, after.expanded?.content.scrollHeight > after.expanded?.content.clientHeight],
  ['regression', 'One Tab reaches a visible Save After', before.keyboard?.saveFits, after.keyboard?.saveFits, after.keyboard?.withinDialog && after.keyboard?.text === 'Save' && after.keyboard?.saveFits === true],
  ['regression', 'No JavaScript errors', before.jsErrors.length, after.jsErrors.length, before.jsErrors.length === 0 && after.jsErrors.length === 0],
  ['regression', 'axe violation elements do not increase', before.axe.total, after.axe.total, after.axe.total <= before.axe.total],
];

let unexpected = 0;
let markdown = `# Playwright evidence: #${v.issue} (${v.slug})\n\nDRAFT. ${environment.browser} ${environment.browserVersion}, ${run.scheme} scheme, ${run.viewport.width}x${run.viewport.height}. Real pointer input opened and expanded the dialog, then one Tab press moved focus to the dialog action.\n\n| Type | Check | Before | After | Result |\n|---|---|---|---|---|\n`;
for (const [type, label, beforeValue, afterValue, good] of checks) {
  if (!good) unexpected += 1;
  markdown += `| ${type} | ${label} | ${JSON.stringify(beforeValue)} | ${JSON.stringify(afterValue)} | ${good ? 'as expected' : '**NOT as expected**'} |\n`;
}
markdown += '\nExpanded screenshots are saved beside this report. The test-support dialog is installed identically on both sides by the issue recipe.\n\n';
markdown += contextMarkdown(results);
markdown += '\nThis run does not replace a person testing keyboard navigation or a screen reader.\n';

const reproduced = before.expanded?.actionFits === false && before.initial?.requestedHeight === 'auto';
const fixed = after.expanded?.actionFits === true && typeof after.initial?.requestedHeight === 'number';
results.verdict = reproduced ? (fixed && unexpected === 0 ? 'reproduced-and-fixed' : 'reproduced-not-fixed') : 'not-reproduced';
results.unexpected = unexpected;
const where = writeRun(run, results, markdown);
console.log(`\n${results.verdict}: ${where}/SUMMARY.md`);
process.exit(unexpected === 0 ? 0 : 2);
