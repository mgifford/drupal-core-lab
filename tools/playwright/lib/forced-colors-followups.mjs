// Shared live Drupal evaluator. Uses trusted Playwright input; no style injection.
import path from 'node:path';
import { runArgs, launch, openSide, axeScan, baseResults, writeRun, contextMarkdown } from './lab-run.mjs';
export async function evaluate(nid) {
  const run = runArgs({ slug: `${nid}-pinned` });
  const { browser, environment } = await launch(run);
  run.browser = browser;
  const results = baseResults(run, environment);
  const rtl = process.argv.includes('--rtl');
  environment.scenarioDirection = rtl ? 'rtl' : 'ltr';
  const rows = [];
  const probe = page => page.locator('.vertical-tabs__menu-item:not(.vertical-tab--hidden)').evaluateAll(items => items.map(li => {
    const a = li.querySelector('.vertical-tabs__menu-link');
    const c = getComputedStyle(a), b = getComputedStyle(a, '::before');
    return { text: a.textContent.trim(), selected: li.classList.contains('is-selected'), error: li.classList.contains('error'), top: c.borderBlockStartStyle, bottom: c.borderBlockEndStyle, start: c.borderInlineStartStyle, errorStyle: b.borderInlineStartStyle, errorWidth: b.borderInlineStartWidth, color: b.borderInlineStartColor, focus: document.activeElement === a };
  }));
  try {
    for (const side of ['before', 'after']) {
      const { page, base, rec } = await openSide(run, side);
      try {
        await page.emulateMedia({ contrast: 'more' });
        await page.goto(base + (rtl ? '/fa' : '') + '/admin/config/people/accounts');
        const direction = await page.locator('html').getAttribute('dir');
        if (rtl && direction !== 'rtl') throw new Error('Farsi route did not render RTL');
        const theme = await page.evaluate(() => window.drupalSettings?.ajaxPageState?.theme);
        if (theme !== 'default_admin') throw new Error(`Expected Default Admin, got ${theme}`);
        const links = page.locator('.vertical-tabs__menu-item:not(.vertical-tab--hidden) > .vertical-tabs__menu-link');
        const count = await links.count();
        if (count < 3) throw new Error('Need at least three visible email tabs at desktop width');
        rec.states = [];
        for (const index of [0, Math.floor(count / 2), count - 1]) {
          await links.nth(index).click();
          const state = await probe(page);
          rec.states.push({ index, tabs: state });
          await page.locator('.vertical-tabs').screenshot({ path: path.join(run.out, `${side}-selected-${index}.png`) });
          if (nid === '3631321' && run.forced) {
            const other = state.filter(t => !t.selected);
            rows.push({ side, stage: `selected-${index}`, passed: other.length > 0 && other.every(t => t.start === 'dotted') });
          }
        }
        // Create real server-side errors in the first and last email tabs, leaving a middle tab valid.
        for (const index of [0, count - 1]) {
          await links.nth(index).click();
          const subject = page.locator('.vertical-tabs__pane:visible input[required]').first();
          if (!await subject.count()) throw new Error(`No required email Subject in tab ${index}`);
          await subject.fill('');
        }
        await page.locator('#edit-submit').click();
        await page.locator('.vertical-tabs__menu-item.error').first().waitFor();
        await links.nth(Math.floor(count / 2)).click();
        rec.errors = await probe(page);
        if (rec.errors.filter(t => t.error).length < 2) throw new Error('Did not produce two erroneous tabs');
        rec.aria = await page.locator('.vertical-tabs__menu').ariaSnapshot();
        rec.axe = await axeScan(page);
        await page.locator('.vertical-tabs').screenshot({ path: path.join(run.out, `${side}-errors.png`) });
        if (nid === '3631337' && run.forced) rows.push({ side, stage: 'errors', passed: rec.errors.filter(t => t.error).every(t => t.errorStyle === 'double') });
        const errorLink = page.locator('.vertical-tabs__menu-item.error .vertical-tabs__menu-link').first();
        await errorLink.click();
        await page.keyboard.press('Tab');
        await page.keyboard.press('Shift+Tab');
        rec.selectedError = await probe(page);
        rec.focus = await page.evaluate(() => { const a = document.activeElement, c = getComputedStyle(a); return { tag: a.tagName, text: a.textContent.trim(), outline: `${c.outlineWidth} ${c.outlineStyle}`, visible: a.matches(':focus-visible') }; });
        await page.locator('.vertical-tabs').screenshot({ path: path.join(run.out, `${side}-selected-error-focus.png`) });
        // Additional parent scenarios: ordinary details and node-sidebar accordion.
        rec.details = [];
        for (const kind of ['details', 'accordion']) {
          await page.goto(base + (rtl ? '/fa' : '') + (kind === 'details' ? '/form_test/details-contains-required-fields' : '/node/add/article'));
          if (kind === 'accordion') {
            await page.locator('[name="title[0][value]"]').fill('Forced colors test');
            const sum = page.locator('details:has([name="path[0][alias]"]) > summary');
            if (!await page.locator('[name="path[0][alias]"]').isVisible()) await sum.click();
            await page.locator('[name="path[0][alias]"]').fill('no-slash');
          }
          await page.locator('#edit-submit, form [type=submit]').first().click();
          const details = page.locator('details.details.error').first();
          await details.waitFor();
          const bar = await details.evaluate(d => { const s = getComputedStyle(d, '::before'); return { style: s.borderInlineStartStyle, width: s.borderInlineStartWidth, color: s.borderInlineStartColor }; });
          rec.details.push({ kind, bar });
          await details.screenshot({ path: path.join(run.out, `${side}-${kind}-error.png`) });
          if (nid === '3631337' && run.forced) rows.push({ side, stage: kind, passed: bar.style === 'double' });
        }
      } finally { await rec.close(run.out); }
      results.sides[side] = rec;
    }
  } finally { await browser.close(); }
  results.checks = rows;
  results.unexpected = rows.filter(r => r.side === 'after' && !r.passed).length;
  results.verdict = !run.forced ? 'mixed' : results.unexpected ? 'reproduced-not-fixed' : rows.some(r => r.side === 'before' && !r.passed) ? 'reproduced-and-fixed' : 'not-reproduced';
  const md = `# #${nid} live Drupal comparison\n\nDRAFT. ${results.verdict}. Normal-color runs are regression evidence only. Screenshots and focus appearance require human review.\n\n` + contextMarkdown(results) + '\n```json\n' + JSON.stringify(rows, null, 2) + '\n```\n';
  console.log(writeRun(run, results, md));
  if (results.unexpected) process.exitCode = 1;
}
