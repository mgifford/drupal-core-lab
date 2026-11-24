// Evidence for #2574721: module operation links remain visible and usable when
// the description column is hidden on narrow screens.
// node tools/playwright/evaluate-2574721.mjs [slug] [--browser=...] [--scheme=...] [--forced-colors] [--viewport=WxH]
import path from 'node:path';
import { axeScan, baseResults, contextMarkdown, launch, openSide, runArgs, writeRun } from './lib/lab-run.mjs';

const run = runArgs({ slug: '2574721-latest' });
const { v, out } = run;
const PAGE = '/admin/modules';

async function runSide(side) {
  const { page, base, rec } = await openSide(run, side);
  await page.goto(base + PAGE, { waitUntil: 'load' });
  await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(300);

  const loaded = await page.evaluate(() => {
    const operations = [...document.querySelectorAll('td.operations, td.module-list__operations')];
    const sample = operations.find((cell) => cell.querySelectorAll('.dropbutton li').length > 1);
    const table = document.querySelector('table.module-list, table.responsive-enabled');
    const description = document.querySelector('td.module-list__description, td.description');
    const rect = sample?.querySelector('.dropbutton-wrapper')?.getBoundingClientRect();
    return {
      operationsCells: operations.length,
      operationLinks: operations.reduce((count, cell) => count + cell.querySelectorAll('a').length, 0),
      descriptionHidden: description ? getComputedStyle(description).display === 'none' : null,
      tableWidth: table ? Math.round(table.getBoundingClientRect().width) : null,
      tableScrollWidth: table?.scrollWidth ?? null,
      viewportWidth: window.innerWidth,
      sample: sample ? {
        row: sample.closest('tr')?.dataset.drupalSelector ?? null,
        wrapper: rect ? {
          left: Math.round(rect.left),
          right: Math.round(rect.right),
          width: Math.round(rect.width),
          withinViewport: rect.left >= 0 && rect.right <= window.innerWidth,
        } : null,
        primaryText: sample.querySelector('.dropbutton > li a')?.textContent.replace(/\s+/g, ' ').trim() ?? null,
        linkCount: sample.querySelectorAll('.dropbutton > li a').length,
      } : null,
    };
  });

  let mouse = null;
  let keyboard = null;
  if (loaded.sample?.row) {
    const row = page.locator(`tr[data-drupal-selector="${loaded.sample.row}"]`);
    const toggle = row.locator('.dropbutton__toggle, .dropbutton-toggle button').first();
    const primary = row.locator('.dropbutton > li a').first();
    await primary.focus();
    await page.keyboard.press('Tab');
    keyboard = {
      focusAfterTab: await page.evaluate(() => {
        const active = document.activeElement;
        return {
          tag: active?.tagName.toLowerCase() ?? null,
          class: active?.className ?? null,
          text: active?.textContent?.replace(/\s+/g, ' ').trim() ?? null,
        };
      }),
    };
    await page.keyboard.press('Enter');
    await page.waitForTimeout(100);
    keyboard.afterEnter = await row.evaluate((element) => ({
      open: element.querySelector('.dropbutton-wrapper')?.classList.contains('open') ?? false,
      visibleSecondaryLinks: [...element.querySelectorAll('.secondary-action, .dropbutton > li:nth-child(n+2)')]
        .filter((item) => getComputedStyle(item).display !== 'none')
        .map((item) => item.textContent.replace(/\s+/g, ' ').trim()),
    }));
    await page.keyboard.press(environment.browser === 'webkit' ? 'Alt+Tab' : 'Tab');
    keyboard.focusAfterOpenTab = await page.evaluate(() => ({
      tag: document.activeElement?.tagName.toLowerCase() ?? null,
      text: document.activeElement?.textContent?.replace(/\s+/g, ' ').trim() ?? null,
      href: document.activeElement?.getAttribute('href') ?? null,
    }));
    if (await toggle.count()) {
      await toggle.click();
      await page.waitForTimeout(100);
      mouse = {
        openAfterClick: await row.evaluate((element) => element.querySelector('.dropbutton-wrapper')?.classList.contains('open') ?? false),
      };
    }
  }

  await page.screenshot({ path: path.join(out, `${side}-${run.viewport.width}x${run.viewport.height}.png`), fullPage: false });
  const axe = await axeScan(page);
  await rec.close(out);
  return Object.assign(rec, { loaded, mouse, keyboard, axe });
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

const B = results.sides.before;
const A = results.sides.after;
const narrow = run.viewport.width < 768;
const checks = [
  ['precondition', 'Modules page loaded on both sides', B.pages.some((page) => page.path === PAGE), A.pages.some((page) => page.path === PAGE), B.pages.some((page) => page.path === PAGE) && A.pages.some((page) => page.path === PAGE)],
  ['fix', 'Dedicated operations cells', B.loaded.operationsCells, A.loaded.operationsCells, A.loaded.operationsCells > B.loaded.operationsCells],
  ['fix', 'Visible module operation links on After', B.loaded.operationLinks, A.loaded.operationLinks, A.loaded.operationLinks > 0],
  ['fix', 'Description column hidden at this narrow viewport', B.loaded.descriptionHidden, A.loaded.descriptionHidden, !narrow || (B.loaded.descriptionHidden && A.loaded.descriptionHidden)],
  ['fix', 'Dropbutton remains inside the viewport', B.loaded.sample?.wrapper?.withinViewport ?? null, A.loaded.sample?.wrapper?.withinViewport ?? null, !!A.loaded.sample?.wrapper?.withinViewport],
  ['fix', 'Keyboard reaches the dropbutton toggle', B.keyboard?.focusAfterTab?.class ?? null, A.keyboard?.focusAfterTab?.class ?? null, A.keyboard?.focusAfterTab?.tag === 'button'],
  ['fix', 'Keyboard opens secondary operations', B.keyboard?.afterEnter?.open ?? null, A.keyboard?.afterEnter?.open ?? null, !!A.keyboard?.afterEnter?.open && A.keyboard.afterEnter.visibleSecondaryLinks.length > 0],
  [environment.browser === 'webkit' ? 'observe' : 'fix', 'Tab reaches a secondary action', B.keyboard?.focusAfterOpenTab?.text ?? null, A.keyboard?.focusAfterOpenTab?.text ?? null, environment.browser === 'webkit' || !!A.keyboard?.focusAfterOpenTab?.href],
  ['regression', 'axe violations (elements)', B.axe.total, A.axe.total, A.axe.total <= B.axe.total],
  ['regression', 'JavaScript errors', B.jsErrors.length, A.jsErrors.length, B.jsErrors.length === 0 && A.jsErrors.length === 0],
];
let unexpected = 0;
let markdown = `# Playwright evidence: #${v.issue} (${v.slug})\n\nDRAFT. ${environment.browser} ${environment.browserVersion}, ${run.scheme} scheme${run.forced ? ', forced colours' : ''}, ${run.viewport.width}x${run.viewport.height}. Real pointer and keyboard input was used on the After operations dropbutton. axe-core uses WCAG 2.0-2.2 A/AA tags.\n\n| Type | Check | Before | After | Result |\n|---|---|---|---|---|\n`;
for (const [type, label, before, after, good] of checks) {
  const judged = ['precondition', 'fix', 'regression'].includes(type);
  if (judged && !good) unexpected++;
  markdown += `| ${type} | ${label} | ${JSON.stringify(before)} | ${JSON.stringify(after)} | ${judged ? (good ? 'as expected' : '**NOT as expected**') : 'recorded'} |\n`;
}
markdown += `\nScreenshots: \`before-${run.viewport.width}x${run.viewport.height}.png\` and \`after-${run.viewport.width}x${run.viewport.height}.png\`.\n\n`;
markdown += contextMarkdown(results);
markdown += `\naxe rules: Before ${JSON.stringify(B.axe.rules)}, After ${JSON.stringify(A.axe.rules)}.\n\n`;
markdown += 'This run does not replace a person using a real screen reader or inspecting focus and forced-colour rendering.';
if (environment.browser === 'webkit') {
  markdown += ' WebKit does not reproduce Safari’s macOS Full Keyboard Access preference in Playwright, so link traversal after the toggle is recorded but requires a person to verify in Safari.\n';
}
else {
  markdown += '\n';
}

const reproduced = B.loaded.operationsCells === 0 && (narrow ? B.loaded.descriptionHidden === true : true);
const fixed = A.loaded.operationsCells > 0 && A.loaded.operationLinks > 0 && A.loaded.sample?.wrapper?.withinViewport;
results.verdict = !reproduced ? 'not-reproduced' : fixed && unexpected === 0 ? 'reproduced-and-fixed' : 'reproduced-not-fixed';
results.unexpected = unexpected;
const where = writeRun(run, results, markdown);
console.log(`\n${results.verdict}: ${where}/SUMMARY.md`);
process.exit(unexpected === 0 ? 0 : 2);
