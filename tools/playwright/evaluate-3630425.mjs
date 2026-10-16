// Default Admin multi-value actions header: original state, AJAX add, AJAX remove.
// node tools/playwright/evaluate-3630425.mjs [3630425-pinned] [--browser=firefox] [--scheme=dark] [--forced-colors]
import fs from 'node:fs';
import path from 'node:path';
import AxeBuilder from '@axe-core/playwright';
import { runArgs, launch, openSide, axeScan, baseResults, writeRun, contextMarkdown } from './lib/lab-run.mjs';
const run = runArgs({ slug: '3630425-pinned' });
const TABLE = 'table[id^="field-lab-multivalue-values"]';
const { browser, environment } = await launch(run);
run.browser = browser;
const results = baseResults(run, environment);
async function capture(page, side, stage) {
  const table = page.locator(TABLE);
  if (await table.count() !== 1) throw new Error('Expected exactly one Lab multi-value field table');
  const state = await table.evaluate(table => ({
    theme: window.drupalSettings?.ajaxPageState?.theme,
    rows: table.tBodies[0].rows.length,
    headers: Array.from(table.tHead.rows[0].cells).map(cell => ({ text: cell.textContent.trim(), html: cell.outerHTML, colspan: cell.colSpan })),
    removes: Array.from(table.querySelectorAll('input[type=submit],button')).filter(button => /Remove/.test(button.value || button.textContent)).length,
  }));
  if (state.theme !== 'default_admin') throw new Error(`Expected Default Admin, got ${state.theme}`);
  if (!state.removes) throw new Error('No Remove controls: widget precondition failed');
  if (state.headers.length !== 3 || state.headers[0].colspan !== 2) throw new Error('Unexpected header structure; inspect before interpreting results');
  // empty-table-header is a best-practice rule; WCAG tags alone can omit it.
  const audit = await new AxeBuilder({ page }).include(TABLE).withRules(['empty-table-header']).analyze();
  state.emptyHeaderNodes = audit.violations.filter(rule => rule.id === 'empty-table-header').flatMap(rule => rule.nodes.map(node => ({ target: node.target, html: node.html })));
  state.labelled = state.headers[1].text === 'Operations';
  state.passes = state.labelled && state.emptyHeaderNodes.length === 0;
  state.aria = await table.ariaSnapshot();
  await table.screenshot({ path: path.join(run.out, `${side}-${stage}.png`) });
  fs.writeFileSync(path.join(run.out, `${side}-${stage}-table.html`), await table.evaluate(table => table.outerHTML));
  fs.writeFileSync(path.join(run.out, `${side}-${stage}-aria.txt`), state.aria);
  return state;
}
try {
  for (const side of ['before', 'after']) {
    const { page, base, rec } = await openSide(run, side);
    try {
      await page.goto(base + '/node/add/article');
      await page.locator(TABLE).waitFor();
      rec.stages = { initial: await capture(page, side, 'initial') };
      const add = page.locator('[name="field_lab_multivalue_add_more"]');
      if (await add.count() !== 1) throw new Error('Add another item control missing');
      const initialRows = rec.stages.initial.rows;
      await add.click();
      await page.waitForFunction(({ selector, count }) => document.querySelector(selector)?.tBodies[0].rows.length === count + 1, { selector: TABLE, count: initialRows });
      rec.stages.add = await capture(page, side, 'add');
      // Core string widgets use input submits. Limit the fallback to named remove buttons.
      const lastRemove = page.locator(TABLE).locator('[name$="_remove_button"]').last();
      if (!await lastRemove.count()) throw new Error('Per-item Remove control missing after AJAX add');
      await lastRemove.click();
      await page.waitForFunction(({ selector, count }) => document.querySelector(selector)?.tBodies[0].rows.length === count, { selector: TABLE, count: initialRows });
      rec.stages.remove = await capture(page, side, 'remove');
      rec.axe = await axeScan(page);
    } finally { await rec.close(run.out); }
    results.sides[side] = rec;
  }
} finally { await browser.close(); }
const before = Object.values(results.sides.before.stages), after = Object.values(results.sides.after.stages);
results.unexpected = after.filter(stage => !stage.passes).length;
results.verdict = results.unexpected ? 'reproduced-not-fixed' : before.every(stage => !stage.labelled && stage.emptyHeaderNodes.length > 0) ? 'reproduced-and-fixed' : 'not-reproduced';
if (before.length !== after.length || before.some((stage, i) => stage.rows !== after[i].rows || stage.removes !== after[i].removes)) {
  results.unexpected++; results.verdict = 'mixed';
}
const rows = ['before', 'after'].flatMap(side => Object.entries(results.sides[side].stages).map(([stage, data]) => `| ${side} | ${stage} | ${data.headers[1].text || '(empty)'} | ${data.emptyHeaderNodes.length} | ${data.rows} | ${data.removes} |`));
console.log(writeRun(run, results, `# #3630425 evaluation\n\nDRAFT: ${results.verdict}. Theme: Default Admin. Explicit axe rule: empty-table-header. No Article was saved. Header DOM, aria snapshots and screenshots accompany this report.\n\n| Side | Stage | Actions header | Rule failures | Rows | Remove controls |\n|---|---|---|---|---|---|\n${rows.join('\n')}\n\n${contextMarkdown(results)}\nKeyboard focus and screen-reader announcement quality require human review.\n`));
if (results.unexpected) process.exitCode = 1;
