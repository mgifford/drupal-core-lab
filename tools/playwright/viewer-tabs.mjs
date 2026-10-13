// Check the viewer's own dock tab strip (tools/compare/index.html): it must be a valid tablist
// (only role=tab children) and its controls must still work. The viewer must be running.
//   node tools/playwright/viewer-tabs.mjs [--url=http://localhost:8100/]
// Runs axe-core on the viewer page and checks the #docksize / #dockhide buttons.
import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const url = (process.argv.find((a) => a.startsWith('--url=')) || '').split('=')[1] || 'http://localhost:8100/';
const browser = await chromium.launch();
const context = await browser.newContext();
const page = await context.newPage();
const problems = [];
try {
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#tabs', { timeout: 10000 });

  const structure = await page.evaluate(() => {
    const tabs = document.getElementById('tabs');
    const tablist = tabs && tabs.querySelector('[role=tablist]');
    return {
      tabsRole: tabs && tabs.getAttribute('role'),
      tablists: document.querySelectorAll('#tabs [role=tablist]').length,
      tabsInTablist: tablist ? tablist.querySelectorAll(':scope > [role=tab]').length : 0,
      foreignInTablist: tablist ? tablist.querySelectorAll(':scope > :not([role=tab])').length : 0,
      controlsOutsideTablist: !!document.querySelector('#tabs > .sp #docksize') && !!document.querySelector('#tabs > .sp #dockhide'),
      labels: [...document.querySelectorAll('#tabs [role=tab]')].map((t) => t.id),
    };
  });

  if (structure.tabsRole) problems.push(`#tabs still has role="${structure.tabsRole}" (should be a plain container)`);
  if (structure.tablists !== 1) problems.push(`expected 1 tablist inside #tabs, found ${structure.tablists}`);
  if (structure.tabsInTablist !== 6) problems.push(`expected 6 tabs in the tablist, found ${structure.tabsInTablist}`);
  if (structure.foreignInTablist !== 0) problems.push(`tablist has ${structure.foreignInTablist} non-tab child element(s)`);
  if (!structure.controlsOutsideTablist) problems.push('#docksize / #dockhide are not siblings of the tablist inside #tabs');

  const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
  const requiredChildren = axe.violations.filter((v) => v.id === 'aria-required-children').flatMap((v) => v.nodes.map((n) => n.target.join(' ')));
  if (requiredChildren.length) problems.push(`aria-required-children still reported on: ${requiredChildren.join(', ')}`);

  await page.locator('#tab-env').click();
  const envVisible = await page.locator('#p-env').isVisible();
  if (!envVisible) problems.push('clicking the Environment tab did not show its panel');
  await page.locator('#docksize').click();
  const pressed = await page.locator('#docksize').getAttribute('aria-pressed');
  if (pressed !== 'true') problems.push(`#docksize aria-pressed did not toggle to true (got ${pressed})`);
  await page.locator('#dockhide').click();
  const expanded = await page.locator('#dockhide').getAttribute('aria-expanded');
  if (expanded !== 'false') problems.push(`#dockhide aria-expanded did not toggle to false (got ${expanded})`);

  console.log(`URL: ${url}`);
  console.log(`#tabs: role=${structure.tabsRole || 'none'}, tablists=${structure.tablists}, tabs=${structure.tabsInTablist}, foreign=${structure.foreignInTablist}`);
  console.log(`Tabs: ${structure.labels.join(', ')}`);
  console.log(`axe violation 'aria-required-children' on #tabs: ${requiredChildren.length ? requiredChildren.join(', ') : 'none'}`);
  if (problems.length) { console.log('\nFAIL:'); for (const p of problems) console.log(` - ${p}`); }
  else console.log('\nOK: #tabs is a valid tablist and the controls still work.');
} catch (e) {
  problems.push(`error: ${e.message}`);
  console.log(`FAIL: ${e.message}`);
}
await browser.close();
process.exit(problems.length ? 2 : 0);
