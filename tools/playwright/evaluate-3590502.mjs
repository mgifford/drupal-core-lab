// Evidence for #3590502: move local tasks out of the Navigation More actions menu.
import path from 'node:path';
import {
  ajaxMarkdown,
  axeScan,
  baseResults,
  contextMarkdown,
  launch,
  openSide,
  runArgs,
  speechMarkdown,
  writeRun,
} from './lib/lab-run.mjs';

const run = runArgs({ slug: '3590502-latest' });
const { v, out } = run;

const probe = (page) => page.evaluate(() => {
  const links = (selector) => [...document.querySelectorAll(selector)].map((link) => ({
    text: link.textContent.replace(/\s+/g, ' ').trim(),
    href: link.getAttribute('href'),
    active: link.getAttribute('aria-current') === 'page' || !!link.closest('.is-active'),
  }));
  return {
    path: location.pathname,
    localTasks: links('.tabs--primary a'),
    topBarActions: links('#top-bar-page-actions a'),
    featuredActions: links('.top-bar__actions > a, .top-bar__actions .toolbar-button--primary[href]'),
    topBarPresent: !!document.querySelector('.top-bar'),
    moreActionsPresent: !!document.querySelector('.top-bar__actions button[aria-controls^="top-bar-page-actions"]'),
  };
});

async function followViewByKeyboard(page) {
  await page.evaluate(() => document.activeElement?.blur?.());
  let openedMoreActions = false;
  let openedLocalTasks = false;
  let presses = 0;
  while (presses < 80) {
    await page.keyboard.press('Tab');
    presses++;
    const focused = await page.evaluate(() => {
      const element = document.activeElement;
      const text = element?.textContent?.replace(/\s+/g, ' ').trim() || '';
      return {
        text,
        href: element?.getAttribute?.('href') || null,
        controls: element?.getAttribute?.('aria-controls') || null,
        localTabsTrigger: element?.matches?.('[data-drupal-nav-tabs-trigger]') || false,
        inLocalTasks: !!element?.closest?.('.tabs--primary'),
        inTopBarActions: !!element?.closest?.('#top-bar-page-actions'),
      };
    });
    if (focused.controls?.startsWith('top-bar-page-actions') && !openedMoreActions) {
      await page.keyboard.press('Enter');
      openedMoreActions = true;
      await page.waitForTimeout(250);
      continue;
    }
    if (focused.localTabsTrigger && !openedLocalTasks) {
      await page.keyboard.press('Enter');
      openedLocalTasks = true;
      await page.waitForTimeout(250);
      continue;
    }
    if (focused.text === 'View' && (focused.inLocalTasks || focused.inTopBarActions)) {
      await Promise.all([
        page.waitForURL((url) => url.pathname === '/user/1', { timeout: 15000 }),
        page.keyboard.press('Enter'),
      ]);
      await page.waitForLoadState('domcontentloaded');
      return {
        reached: true,
        presses,
        route: focused.inLocalTasks ? 'local task' : 'More actions menu',
        finalPath: await page.evaluate(() => location.pathname),
      };
    }
  }
  return { reached: false, presses, route: openedMoreActions ? 'More actions menu' : 'none', finalPath: await page.evaluate(() => location.pathname) };
}

async function runSide(side) {
  const { page, base, rec } = await openSide(run, side);

  await page.goto(`${base}/user/1/edit`);
  const edit = await probe(page);
  const editAxe = await axeScan(page);
  await page.screenshot({ path: path.join(out, `${side}-edit.png`), fullPage: true });
  await rec.collect();

  const keyboard = await followViewByKeyboard(page);
  const view = await probe(page);
  const viewAxe = await axeScan(page);
  await page.screenshot({ path: path.join(out, `${side}-view.png`), fullPage: true });

  await rec.close(out);
  return Object.assign(rec, { edit, editAxe, keyboard, view, viewAxe });
}

const { browser, environment } = await launch(run);
run.browser = browser;
const results = baseResults(run, environment);
try {
  for (const side of ['before', 'after']) {
    console.log(`running ${side} (${v[side].env}) ...`);
    results.sides[side] = await runSide(side);
  }
} finally {
  await browser.close();
}

const B = results.sides.before;
const A = results.sides.after;
const hasText = (items, text) => items.some((item) => item.text === text);
const checks = [
  ['precondition', 'Navigation top bar on the user edit page', B.edit.topBarPresent, A.edit.topBarPresent, B.edit.topBarPresent && A.edit.topBarPresent],
  ['fix', 'View is a primary local task on /user/1/edit', hasText(B.edit.localTasks, 'View'), hasText(A.edit.localTasks, 'View'), !hasText(B.edit.localTasks, 'View') && hasText(A.edit.localTasks, 'View')],
  ['fix', 'Edit is a primary local task on /user/1/edit', hasText(B.edit.localTasks, 'Edit'), hasText(A.edit.localTasks, 'Edit'), !hasText(B.edit.localTasks, 'Edit') && hasText(A.edit.localTasks, 'Edit')],
  ['fix', 'View is absent from the top-bar actions on /user/1/edit', hasText(B.edit.topBarActions, 'View'), hasText(A.edit.topBarActions, 'View'), hasText(B.edit.topBarActions, 'View') && !hasText(A.edit.topBarActions, 'View')],
  ['fix', 'Edit is a primary local task on /user/1', hasText(B.view.localTasks, 'Edit'), hasText(A.view.localTasks, 'Edit'), !hasText(B.view.localTasks, 'Edit') && hasText(A.view.localTasks, 'Edit')],
  ['fix', 'Edit is absent from featured top-bar actions on /user/1', hasText(B.view.featuredActions, 'Edit'), hasText(A.view.featuredActions, 'Edit'), hasText(B.view.featuredActions, 'Edit') && !hasText(A.view.featuredActions, 'Edit')],
  ['observe', 'Keyboard route to View from /user/1/edit', B.keyboard.route, A.keyboard.route, true],
  ['regression', 'Keyboard reaches the View page', B.keyboard.reached && B.keyboard.finalPath === '/user/1', A.keyboard.reached && A.keyboard.finalPath === '/user/1', B.keyboard.reached && B.keyboard.finalPath === '/user/1' && A.keyboard.reached && A.keyboard.finalPath === '/user/1'],
  ['regression', 'axe violations on /user/1/edit', B.editAxe.total, A.editAxe.total, A.editAxe.total <= B.editAxe.total],
  ['regression', 'axe violations on /user/1', B.viewAxe.total, A.viewAxe.total, A.viewAxe.total <= B.viewAxe.total],
  ['regression', 'JavaScript errors', B.jsErrors.length, A.jsErrors.length, B.jsErrors.length === 0 && A.jsErrors.length === 0],
];

let unexpected = 0;
let md = `# Playwright evidence: #${v.issue} (${v.slug})\n\n`;
md += `Run ${results.when}. Core Before \`${results.commits.before}\`, After \`${results.commits.after}\` plus \`${path.basename(results.patches[0])}\`. `;
md += `${environment.browser} ${environment.browserVersion}, ${environment.colorScheme}${environment.forcedColors ? ', forced colours' : ''}, `;
md += `${run.viewport.width}x${run.viewport.height}, ${environment.os}. Trusted keyboard input and axe-core WCAG 2.0 to 2.2 A/AA.\n\n`;
md += `| Type | Check | Before | After | Verdict |\n|---|---|---|---|---|\n`;
for (const [type, label, before, after, good] of checks) {
  const judged = type !== 'observe';
  if (judged && !good) unexpected++;
  md += `| ${type} | ${label} | ${before} | ${after} | ${judged ? (good ? 'as expected' : '**NOT as expected**') : 'recorded'} |\n`;
}
md += '\n## Keyboard route\n\n';
md += `Before reached View through ${B.keyboard.route || 'no route'} after ${B.keyboard.presses} Tab presses. `;
md += `After reached View through ${A.keyboard.route || 'no route'} after ${A.keyboard.presses} Tab presses.\n\n`;
md += contextMarkdown(results);
md += ajaxMarkdown(results);
md += speechMarkdown(results);
md += `Screenshots: \`before-edit.png\`, \`after-edit.png\`, \`before-view.png\`, and \`after-view.png\`.\n\n`;
md += `Axe rules on edit: Before ${JSON.stringify(B.editAxe.rules)}, After ${JSON.stringify(A.editAxe.rules)}. `;
md += `Axe rules on view: Before ${JSON.stringify(B.viewAxe.rules)}, After ${JSON.stringify(A.viewAxe.rules)}.\n\n`;
md += unexpected === 0
  ? '**The observed movement matches the MR intention.** A person still needs to assess keyboard focus visibility, active-state clarity and forced-colours presentation.\n'
  : `**${unexpected} judged row(s) did not match the expected Before/After behavior.**\n`;
md += '\n---\nAutomated evidence is DRAFT. DOM, keyboard replay and axe checks do not replace a screen-reader or human keyboard review.\n';

results.verdict = unexpected === 0 ? 'reproduced-and-fixed' : 'mixed';
results.unexpected = unexpected;
const where = writeRun(run, results, md);
console.log(`\n${unexpected === 0 ? 'OK' : 'UNEXPECTED'}: ${where}/SUMMARY.md`);
process.exit(unexpected === 0 ? 0 : 2);
