// Evidence for #3593502: MR !15975 plus the lab review interdiff.
//
//   node tools/playwright/evaluate-3593502.mjs [slug]
//     [--browser=chromium|firefox|webkit] [--scheme=light|dark]
//     [--forced-colors] [--viewport=WxH] [--out=<dir>]
//
// Defaults: 3593502-latest, Chromium, light, 1280x900. The After run delays
// /session/token for three seconds, immediately toggles an Enabled checkbox,
// verifies that the eventual update carries a non-empty token and persists,
// then restores the original value. It also uses real Escape and click input
// to test both search-dismissal paths and records forced-colours styles.
import {
  axeScan,
  baseResults,
  contextMarkdown,
  launch,
  openSide,
  runArgs,
  writeRun,
} from './lib/lab-run.mjs';

const run = runArgs({ slug: '3593502-latest' });
const { v } = run;
const comparesPatchStacks = (v.before.patches || []).length > 0;
const TREE_PATH = '/admin/structure/menu/manage/main/tree';
const CHECKBOX =
  'drupal-treegrid input.treegrid-cell-checkbox[data-column-id="enabled"]';
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function runSide(side) {
  const { page, rec } = await openSide(run, side);
  let delayedTokenRequests = 0;

  if (side === 'after' || comparesPatchStacks) {
    await page.route('**/session/token', async (route) => {
      delayedTokenRequests += 1;
      await wait(3000);
      await route.continue();
    });
  }

  const origin = page.url().match(/^(https?:\/\/[^/]+)/)?.[1];
  const response = await page.goto(`${origin}${TREE_PATH}`, {
    waitUntil: 'domcontentloaded',
  });
  const navigation = await page.evaluate(() => {
    const entry = performance.getEntriesByType('navigation')[0];
    return entry
      ? {
          responseEndMs: Math.round(entry.responseEnd),
          domContentLoadedMs: Math.round(entry.domContentLoadedEventEnd),
          loadMs: Math.round(entry.loadEventEnd),
          transferBytes: entry.transferSize,
        }
      : null;
  });
  const result = {
    status: response?.status() ?? null,
    tree: false,
    delayedTokenRequests,
    toggle: null,
    search: null,
    forcedColors: null,
    axe: null,
    navigation,
    initialRows: 0,
  };

  const tree = page.locator('drupal-treegrid');
  result.tree = (await tree.count()) === 1;
  if (!result.tree) {
    result.axe = await axeScan(page);
    await rec.close(run.out);
    return Object.assign(rec, result);
  }
  result.initialRows = await page.locator('drupal-treegrid tbody tr[role="row"]').count();

  const checkbox = page.locator(CHECKBOX).first();
  await checkbox.waitFor({ state: 'attached', timeout: 20000 });
  const rowId = await checkbox.locator('xpath=ancestor::tr[1]').getAttribute('data-id');
  const original = await checkbox.isChecked();
  const readyBeforeClick =
    (await tree.getAttribute('data-treegrid-reorder-ready')) === 'true';
  const updateResponse = page.waitForResponse(
    (candidate) =>
      candidate.request().method() === 'POST' &&
      candidate.url().includes('/column-update'),
    { timeout: 20000 },
  );
  await checkbox.click();
  const disabledWhileWaiting = await checkbox.isDisabled();
  const updated = await updateResponse;
  await checkbox.waitFor({ state: 'attached' });
  const tokenHeader =
    updated.request().headers()['x-csrf-token'] ?? '';

  await page.reload({ waitUntil: 'domcontentloaded' });
  const persistedCheckbox = page.locator(
    `tr[role="row"][data-id="${rowId}"] ` +
      'input.treegrid-cell-checkbox[data-column-id="enabled"]',
  );
  await persistedCheckbox.waitFor({ state: 'attached', timeout: 20000 });
  const persisted = (await persistedCheckbox.isChecked()) === !original;
  await page
    .locator('drupal-treegrid[data-treegrid-reorder-ready="true"]')
    .waitFor({ state: 'attached', timeout: 20000 });

  let restoreStatus = null;
  if (persisted) {
    const restoreResponse = page.waitForResponse(
      (candidate) =>
        candidate.request().method() === 'POST' &&
        candidate.url().includes('/column-update'),
      { timeout: 20000 },
    );
    await persistedCheckbox.click();
    restoreStatus = (await restoreResponse).status();
  }
  result.toggle = {
    readyBeforeClick,
    disabledWhileWaiting,
    updateStatus: updated.status(),
    tokenHeaderPresent: tokenHeader.length > 0,
    persisted,
    restoreStatus,
  };

  const input = page.locator('#menu-tree-ui-search-input');
  await input.fill('Lab seed 1.1');
  await page
    .locator('#menu-tree-ui-search-results .menu-tree-ui-search-results__list')
    .waitFor({ state: 'visible', timeout: 20000 });
  await input.press('Escape');
  await page
    .locator('#menu-tree-ui-search-results > *')
    .waitFor({ state: 'detached', timeout: 10000 });
  const escapeKeptQuery = (await input.inputValue()) === 'Lab seed 1.1';

  await input.fill('Lab seed 1.1');
  await page
    .locator('#menu-tree-ui-search-results .menu-tree-ui-search-results__list')
    .waitFor({ state: 'visible', timeout: 20000 });
  await page.locator('h1').click();
  await page
    .locator('#menu-tree-ui-search-results > *')
    .waitFor({ state: 'detached', timeout: 10000 });
  result.search = {
    escapeKeptQuery,
    outsideClickKeptQuery:
      (await input.inputValue()) === 'Lab seed 1.1',
  };

  result.forcedColors = await page.evaluate(() => {
    const style = (selector) => {
      const element = document.querySelector(selector);
      if (!element) {
        return null;
      }
      const computed = getComputedStyle(element);
      return {
        background: computed.backgroundColor,
        borderBlockStart: computed.borderBlockStart,
        outlineColor: computed.outlineColor,
      };
    };
    return {
      active: matchMedia('(forced-colors: active)').matches,
      handle: style('.menu-tree-ui-row__handle-icon'),
      indicator: style('.menu-tree-ui-drop-indicator'),
    };
  });
  result.axe = await axeScan(page);
  result.delayedTokenRequests = delayedTokenRequests;
  await rec.close(run.out);
  return Object.assign(rec, result);
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

const before = results.sides.before;
const after = results.sides.after;
const checks = comparesPatchStacks ? [
  [
    'precondition',
    'Tree UI route and treegrid on both patch stacks',
    `${before.status}, ${before.tree ? 'present' : 'absent'}`,
    `${after.status}, ${after.tree ? 'present' : 'absent'}`,
    before.status === 200 && before.tree && after.status === 200 && after.tree,
  ],
  [
    'fix',
    'Immediate Enabled change with a delayed CSRF token',
    before.toggle
      ? `disabled=${before.toggle.disabledWhileWaiting}, token=${before.toggle.tokenHeaderPresent}, HTTP ${before.toggle.updateStatus}, persisted=${before.toggle.persisted}`
      : 'not run',
    after.toggle
      ? `disabled=${after.toggle.disabledWhileWaiting}, token=${after.toggle.tokenHeaderPresent}, HTTP ${after.toggle.updateStatus}, persisted=${after.toggle.persisted}`
      : 'not run',
    !!before.toggle && !before.toggle.tokenHeaderPresent && !before.toggle.persisted &&
      !!after.toggle && after.toggle.disabledWhileWaiting && after.toggle.tokenHeaderPresent &&
      after.toggle.updateStatus === 200 && after.toggle.persisted && after.toggle.restoreStatus === 200,
  ],
  [
    'regression',
    'Escape and outside-click search dismissal',
    before.search ? `Escape=${before.search.escapeKeptQuery}, outside=${before.search.outsideClickKeptQuery}` : 'not run',
    after.search ? `Escape=${after.search.escapeKeptQuery}, outside=${after.search.outsideClickKeptQuery}` : 'not run',
    !!before.search?.escapeKeptQuery && !!before.search?.outsideClickKeptQuery &&
      !!after.search?.escapeKeptQuery && !!after.search?.outsideClickKeptQuery,
  ],
  [
    'observe',
    'Initial navigation and rendered rows',
    `${JSON.stringify(before.navigation)}, rows=${before.initialRows}`,
    `${JSON.stringify(after.navigation)}, rows=${after.initialRows}`,
    true,
  ],
  [
    'regression',
    'JavaScript errors',
    before.jsErrors.length,
    after.jsErrors.length,
    before.jsErrors.length === 0 && after.jsErrors.length === 0,
  ],
  [
    'observe',
    'axe violations by affected elements',
    before.axe.total,
    after.axe.total,
    true,
  ],
] : [
  [
    'fix',
    'Tree UI route and treegrid',
    `${before.status}, ${before.tree ? 'present' : 'absent'}`,
    `${after.status}, ${after.tree ? 'present' : 'absent'}`,
    !before.tree && after.status === 200 && after.tree,
  ],
  [
    'fix',
    'Early Enabled toggle waited and used a non-empty CSRF token',
    'not available',
    after.toggle
      ? [
          `ready before click=${after.toggle.readyBeforeClick}`,
          `disabled=${after.toggle.disabledWhileWaiting}`,
          `token=${after.toggle.tokenHeaderPresent}`,
          `HTTP ${after.toggle.updateStatus}`,
        ].join(', ')
      : 'not run',
    !!after.toggle &&
      !after.toggle.readyBeforeClick &&
      after.toggle.disabledWhileWaiting &&
      after.toggle.tokenHeaderPresent &&
      after.toggle.updateStatus === 200,
  ],
  [
    'fix',
    'Early Enabled change persisted and was restored',
    'not available',
    after.toggle
      ? `persisted=${after.toggle.persisted}, restore HTTP ${after.toggle.restoreStatus}`
      : 'not run',
    !!after.toggle && after.toggle.persisted && after.toggle.restoreStatus === 200,
  ],
  [
    'fix',
    'Escape dismissed results and retained the query',
    'not available',
    after.search?.escapeKeptQuery ? 'yes' : 'no',
    after.search?.escapeKeptQuery === true,
  ],
  [
    'fix',
    'Outside click dismissed results and retained the query',
    'not available',
    after.search?.outsideClickKeptQuery ? 'yes' : 'no',
    after.search?.outsideClickKeptQuery === true,
  ],
  [
    'regression',
    'JavaScript errors on After',
    before.jsErrors.length,
    after.jsErrors.length,
    after.jsErrors.length === 0,
  ],
  [
    'observe',
    'axe violations by affected elements',
    before.axe.total,
    after.axe.total,
    true,
  ],
];

let unexpected = 0;
let markdown = `# Playwright evidence: #${v.issue} (${v.slug})\n\n`;
markdown += `Run ${results.when}. Before \`${results.commits.before}\``;
markdown += comparesPatchStacks ? ' plus MR !15975; After ' : '; After ';
markdown += `\`${results.commits.after}\` plus MR !15975 and the review interdiff. `;
markdown += `${environment.browser} ${environment.browserVersion}, `;
markdown += `${environment.colorScheme}${environment.forcedColors ? ', forced colours' : ''}, `;
markdown += `${run.viewport.width}x${run.viewport.height}, ${environment.os}. `;
markdown += `Real Playwright click and keyboard input; ${comparesPatchStacks ? 'both token responses were' : 'the After token response was'} delayed by three seconds.\n\n`;
markdown += '| Type | Check | Before | After | Verdict |\n';
markdown += '|---|---|---|---|---|\n';
for (const [type, label, oldValue, newValue, good] of checks) {
  const judged = type !== 'observe';
  if (judged && !good) {
    unexpected += 1;
  }
  markdown += `| ${type} | ${label} | ${oldValue} | ${newValue} | `;
  markdown += `${judged ? (good ? 'as expected' : '**NOT as expected**') : 'recorded'} |\n`;
}

markdown += '\n## Forced-colours record\n\n';
markdown += `\`forced-colors: active\`: ${after.forcedColors?.active ? 'yes' : 'no'}\n\n`;
markdown += `\`handle\`: \`${JSON.stringify(after.forcedColors?.handle)}\`\n\n`;
markdown += `\`drop indicator\`: \`${JSON.stringify(after.forcedColors?.indicator)}\`\n\n`;
markdown += contextMarkdown(results);
markdown += '\nAutomated evidence remains DRAFT. The style record does not establish that a person can perceive each state. ';
markdown += 'Keyboard, screen-reader, zoom, reflow, touch, and real Windows High Contrast checks remain manual.\n';

results.verdict = unexpected === 0 ? 'reproduced-and-fixed' : 'mixed';
results.unexpected = unexpected;
const where = writeRun(run, results, markdown);
console.log(`\n${unexpected === 0 ? 'OK' : 'UNEXPECTED'}: ${where}/SUMMARY.md`);
process.exit(unexpected === 0 ? 0 : 2);
