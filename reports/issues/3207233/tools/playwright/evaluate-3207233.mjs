// Local replay for #3207233. Uses real link/button activation and the lab's run records.
// node tools/playwright/evaluate-3207233.mjs [3207233-pinned|3207233-latest]
// Also accepts the shared --browser, --scheme, --forced-colors, --viewport and --out flags.
import path from 'node:path';
import { expect } from '@playwright/test';
import { JSDOM } from 'jsdom';
import { virtual } from '@guidepup/virtual-screen-reader';
import { runArgs, launch, openSide, axeScan, baseResults, writeRun, contextMarkdown, ajaxMarkdown, speechMarkdown } from './lib/lab-run.mjs';

const run = runArgs({ slug: '3207233-pinned' });
if (run.v.issue !== '3207233') throw new Error('This replay only supports issue 3207233.');
const route = '/admin/config/workflow/workspaces';
const labels = ['Live', 'Lab stage', 'Lab nested campaign', 'Lab <em>literal</em> & review', 'Live'];

// A DOM snapshot simulation, not an OS screen reader or a test of spoken navigation timing.
async function simulatedSpeech(html) {
  const dom = new JSDOM(html, { pretendToBeVisual: true });
  const previous = Object.fromEntries(['window', 'document', 'Node', 'getComputedStyle'].map((k) => [k, Object.getOwnPropertyDescriptor(globalThis, k)]));
  const values = { window: dom.window, document: dom.window.document, Node: dom.window.Node, getComputedStyle: dom.window.getComputedStyle.bind(dom.window) };
  for (const [k, value] of Object.entries(values)) Object.defineProperty(globalThis, k, { value, configurable: true, writable: true });
  try {
    await virtual.start({ container: dom.window.document.querySelector('table') });
    for (let i = 0; i < 60; i++) await virtual.next();
    return await virtual.spokenPhraseLog();
  }
  finally {
    try { await virtual.stop(); }
    finally {
      dom.window.close();
      for (const [k, descriptor] of Object.entries(previous)) {
        if (descriptor) Object.defineProperty(globalThis, k, descriptor);
        else delete globalThis[k];
      }
    }
  }
}

async function switchTo(page, label) {
  const link = page.getByRole('link', { name: `Switch to ${label}`, exact: true });
  if (!(await link.count())) {
    // Only skip when the requested workspace really is already the active row.
    const active = await page.locator('tr.active-workspace td').first().innerText();
    if (active.trim() !== label && active.trim() !== `${label} (active)`) throw new Error(`No switch link for ${label}; current row: ${active}`);
    return;
  }
  await link.focus();
  await link.press('Enter');
  const confirm = page.getByRole('button', { name: 'Confirm', exact: true });
  await expect(confirm).toBeVisible();
  await confirm.focus();
  await Promise.all([page.waitForURL((url) => url.pathname === route), confirm.press('Enter')]);
  await expect(page.locator('tr.active-workspace')).toHaveCount(1);
}

async function probe(page) {
  return page.locator('table').first().evaluate((table) => {
    const row = table.querySelector('tr.active-workspace');
    const cell = row?.querySelector('td');
    return {
      activeCount: table.querySelectorAll('tr.active-workspace').length,
      text: cell?.textContent.trim(),
      link: cell?.querySelector('a')?.textContent.trim() || null,
      caption: table.querySelector('caption')?.textContent.trim() || null,
      strong: !!cell?.querySelector('strong'),
      indentation: !!cell?.querySelector('.indentation'),
      injectedEmphasis: !!cell?.querySelector('em'),
      switchLinks: [...table.querySelectorAll('a')].filter((a) => a.textContent.startsWith('Switch to ')).map((a) => a.textContent.trim()).sort(),
    };
  });
}

const { browser, environment } = await launch(run);
run.browser = browser;
const results = baseResults(run, environment);
const checks = [];
const add = (type, label, good) => checks.push({ type, label, pass: good });
try {
  for (const side of ['before', 'after']) {
    const { page, base, rec } = await openSide(run, side);
    rec.stages = [];
    try {
      await page.goto(base + route);
      for (const [i, label] of labels.entries()) {
        await switchTo(page, label);
        const table = page.locator('table').first();
        const stage = { label, ...await probe(page), aria: await table.ariaSnapshot(), axe: await axeScan(page) };
        // Record a real Tab path to the active named workspace link, without forcing focus onto it.
        if (i === 1) {
          await page.goto(base + route);
          stage.keyboard = { reached: false, tabs: 0, name: null };
          for (let tabs = 1; tabs <= 160; tabs++) {
            await page.keyboard.press('Tab');
            const activeName = await page.evaluate(() => {
              const el = document.activeElement;
              return el?.matches('tr.active-workspace td:first-child a') ? el.textContent.trim() : null;
            });
            if (activeName) { stage.keyboard = { reached: true, tabs, name: activeName }; break; }
          }
          stage.virtualSpeech = await simulatedSpeech(await page.content());
        }
        await page.screenshot({ path: path.join(run.out, `${side}-${i}-${label === 'Live' ? 'live' : 'workspace'}.png`), fullPage: true });
        rec.stages.push(stage);
      }
    }
    finally { results.sides[side] = await rec.close(run.out); }
  }
}
finally { await browser.close(); }

for (const [i, label] of labels.entries()) {
  const b = results.sides.before.stages[i], a = results.sides.after.stages[i];
  add('precondition', `${i}: Before has the requested active row`, b.text === label && b.activeCount === 1);
  add('fix', `${i}: After has explicit active text and emphasis`, a.text === `${label} (active)` && a.activeCount === 1 && a.strong);
  add('fix', `${i}: caption identifies the workspace`, b.caption === null && a.caption === `Current workspace: ${label}`);
  add('regression', `${i}: available switch operations match`, JSON.stringify(b.switchLinks) === JSON.stringify(a.switchLinks));
  if (label !== 'Live') add('fix', `${i}: active link includes the state`, b.link === label && a.link === `${label} (active)`);
  if (i === 2) add('regression', 'Nested indentation remains on both sides', b.indentation && a.indentation);
  if (i === 3) add('regression', 'Markup-like label remains literal on both sides', !b.injectedEmphasis && !a.injectedEmphasis);
  const introduced = a.axe.violations.filter((av) => ['critical', 'serious'].includes(av.impact) && av.nodes.some((n) => !b.axe.violations.some((bv) => bv.id === av.id && bv.nodes.some((bn) => bn.target === n.target))));
  add('regression', `${i}: no newly detected serious or critical axe findings`, introduced.length === 0);
}
const B = results.sides.before, A = results.sides.after;
add('regression', 'Active link reached through real Tab presses on both sides', B.stages[1].keyboard.reached && A.stages[1].keyboard.reached);
add('fix', 'Tabbed active link includes the state After', A.stages[1].keyboard.name === 'Lab stage (active)');
add('regression', 'No uncaught JavaScript errors', !B.jsErrors.length && !A.jsErrors.length);
results.checks = checks;
results.unexpected = checks.filter((c) => !c.pass).length;
results.verdict = results.unexpected ? 'mixed' : 'reproduced-and-fixed';
let md = `# DRAFT: #3207233 local replay\n\nRun ${results.when}. Variant: ${run.slug}.\n\n`;
md += '| Type | Check | Result |\n|---|---|---|\n' + checks.map((c) => `| ${c.type} | ${c.label} | ${c.pass ? 'as expected' : 'UNEXPECTED'} |`).join('\n') + '\n\n';
md += contextMarkdown(results) + ajaxMarkdown(results) + speechMarkdown(results);
md += '## Limits\n\nKeyboard activation uses real Enter presses. The named active link is also reached using real Tab presses. Visual focus quality still needs a person. Guidepup uses a jsdom snapshot and does not establish actual VoiceOver or NVDA behavior. Axe covers a subset of accessibility requirements and reports at most ten nodes per rule here. Tests use administrator access and four fixtures, not pagination, translated labels, or a read-only account. The off-canvas switcher is a manual regression check.\n\n';
md += 'ARIA snapshots, simulated speech, axe findings, commits, patch hashes, and site context are in results.json. Screenshots are beside this summary. A passing run applies only to the listing changes tested here.\n';
console.log(writeRun(run, results, md));
process.exitCode = results.unexpected ? 2 : 0;
