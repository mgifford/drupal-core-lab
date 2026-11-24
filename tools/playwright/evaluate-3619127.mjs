// Scripted, real-input evaluation of #3619127 with optional execution tracing.
//
//   node tools/playwright/evaluate-3619127.mjs [3619127-pinned] [--observe] [--playwright-trace]
//
// Without --observe this is an ordinary Core Lab run. With --observe, every same-origin document/XHR/fetch request gets a
// W3C traceparent, and the Drupal module records the matching server spans. The browser request catalogue is written next
// to results.json; run tools/observability/cli.mjs collect afterwards to build the evidence manifest.
import fs from 'node:fs';
import path from 'node:path';
import { runArgs, launch, openSide, axeScan, baseResults, writeRun, contextMarkdown, ajaxMarkdown, speechMarkdown } from './lib/lab-run.mjs';
import { correlationSummary } from './lib/observability.mjs';

const run = runArgs({ slug: '3619127-pinned', viewport: '480x900' });
const { browser, environment } = await launch(run);
run.browser = browser;
const results = baseResults(run, environment);

const pageState = (page) => page.evaluate(() => {
  const field = document.querySelector('[name="path[0][alias]"]');
  const active = document.activeElement;
  const r = field && field.getBoundingClientRect();
  return {
    sidebarOpen: document.body.getAttribute('data-meta-sidebar') === 'open',
    aliasFieldFocused: !!active && active.name === 'path[0][alias]',
    aliasFieldInViewport: !!r && r.width > 0 && r.left >= 0 && r.right <= innerWidth && r.top >= 0 && r.bottom <= innerHeight,
    focused: active ? `${active.tagName.toLowerCase()}${active.name ? `[name=${active.name}]` : ''}` : 'none',
    savedMobilePreference: localStorage.getItem('Drupal.defaultAdmin.sidebarExpanded.mobile'),
    path: location.pathname,
  };
});

const act = (obs, kind, label, fn) => (obs ? obs.action(kind, label, fn) : fn());

async function prepare(page, base, obs, mode) {
  const go = (kind, label, fn) => act(obs, kind, label, fn);
  await go('goto', 'Open Create Article', () => page.goto(base + '/node/add/article'));
  await page.locator('[name="path[0][alias]"], .meta-sidebar__trigger').first().waitFor();
  await go('click', 'Open the advanced-fields sidebar', () => page.locator('.meta-sidebar__trigger').click());
  await go('click', 'Open the URL alias section', () => page.locator('#edit-path-0 > summary').click());
  await go('fill', 'Enter an invalid URL alias (no-slash)', () => page.locator('[name="path[0][alias]"]').fill('no-slash'));
  await go('click', 'Close the advanced-fields sidebar', () => page.locator('.meta-sidebar__trigger').click());
  await go('click', 'Save the article and wait for the validation error', async () => {
    await page.locator('#edit-submit').click();
    await page.locator('a[href$="#edit-path-0-alias"]').first().waitFor({ state: 'visible', timeout: 20000 });
  });
  await page.waitForTimeout(500);
  return { mode, state: await pageState(page), axe: await axeScan(page) };
}

async function useErrorLink(page, obs, mode) {
  const link = page.locator('a[href$="#edit-path-0-alias"]').first();
  if (mode === 'mouse') await act(obs, 'click', 'Use the URL alias error link (mouse)', () => link.click());
  else await act(obs, 'press', 'Focus the URL alias error link and press Enter', async () => { await link.focus(); await page.keyboard.press('Enter'); });
  // The form script focuses the field 300 ms after the link is used.
  await page.waitForTimeout(1200);
  return { state: await pageState(page), axe: await axeScan(page) };
}

for (const side of ['before', 'after']) {
  const { page, base, rec, obs } = await openSide(run, side);
  try {
    rec.runs = {};
    for (const mode of ['mouse', 'keyboard']) {
      await page.goto(base + '/node/add/article');
      await page.waitForLoadState('load');
      const prepared = await prepare(page, base, obs, mode);
      await page.screenshot({ path: path.join(run.out, `${side}-${mode}-1-error-state.png`) });
      const afterUse = await useErrorLink(page, obs, mode);
      await page.screenshot({ path: path.join(run.out, `${side}-${mode}-2-after-link.png`) });
      let tree = '';
      try { tree = await page.locator('[name="path[0][alias]"]').ariaSnapshot(); } catch (e) { tree = `(not available: ${e.message})`; }
      rec.runs[mode] = { prepared, afterUse, fieldAccessibilityTree: tree };
      // Return to a clean form for the second mode in the same browser context.
      await page.goto(base + '/node/add/article');
      await page.waitForLoadState('load');
    }
    await rec.close(run.out);
    results.sides[side] = rec;
  } catch (e) {
    try { await rec.close(run.out); } catch { /* already closed */ }
    throw e;
  }
}
await browser.close();
results.playwrightTraces = { before: results.sides.before.playwrightTrace || null, after: results.sides.after.playwrightTrace || null };

// ---- Verdict: the fix checks should fail on Before and pass on After; regression checks should be equal.
const fix = (r) => r.afterUse.state.sidebarOpen && r.afterUse.state.aliasFieldFocused && r.afterUse.state.aliasFieldInViewport;
const rows = [];
let unexpected = 0;
for (const mode of ['mouse', 'keyboard']) {
  const B = results.sides.before.runs[mode], A = results.sides.after.runs[mode];
  for (const [label, get] of [
    ['Sidebar opens after using the error link', (r) => r.afterUse.state.sidebarOpen],
    ['URL alias field receives focus', (r) => r.afterUse.state.aliasFieldFocused],
    ['URL alias field is in the viewport', (r) => r.afterUse.state.aliasFieldInViewport],
  ]) {
    const b = get(B), a = get(A); const good = !b && a; if (!good) unexpected++;
    rows.push({ mode, type: 'fix', label, before: b, after: a, good });
  }
  for (const [label, get] of [
    ['Saved sidebar preference unchanged (still "false")', (r) => r.afterUse.state.savedMobilePreference],
    ['axe violating elements after using the link', (r) => r.afterUse.axe.total],
    ['axe violating elements before using the link', (r) => r.prepared.axe.total],
  ]) {
    const b = get(B), a = get(A); const good = String(b) === String(a); if (!good) unexpected++;
    rows.push({ mode, type: 'regression', label, before: b, after: a, good });
  }
}
const reproduced = results.sides.before.runs.mouse && !fix(results.sides.before.runs.mouse) && !fix(results.sides.before.runs.keyboard);
const fixed = fix(results.sides.after.runs.mouse) && fix(results.sides.after.runs.keyboard);
results.unexpected = unexpected;
results.verdict = reproduced && fixed ? 'reproduced-and-fixed' : reproduced ? 'reproduced-not-fixed' : 'mixed';

const obsRows = ['before', 'after'].map((side) => {
  const rec = results.sides[side];
  const c = correlationSummary(rec.observability?.requests || []);
  return `| ${side} | ${c.requests} | ${c.matched} | ${c.server_generated} | ${c.missing} | ${c.not_instrumented} | ${c.failed} |`;
}).join('\n');
const table = rows.map((r) => `| ${r.mode} | ${r.type} | ${r.label} | ${r.before} | ${r.after} | ${r.good ? '✓' : '✗ not as expected'} |`).join('\n');
const summary = `# #3619127 execution evidence: ${results.verdict}\n\n`
  + `Run ${results.when}. Core: Before \`${results.commits.before}\`, After \`${results.commits.after}\`. Patches on After: ${(results.patches || []).map((p) => `\`${path.basename(p)}\``).join(', ') || 'none'}. Environment: **${environment.browser} ${environment.browserVersion}**, colour scheme **${environment.colorScheme}**, viewport ${environment.viewport.width}x${environment.viewport.height}, ${environment.os}. Tracing: **${run.observe ? 'enabled' : 'disabled'}**${run.playwrightTrace ? ', Playwright trace zip recorded' : ''}.\n\n`
  + `The scenario opens the article form, enters an invalid URL alias, saves, then uses the error link with a real mouse click and, separately, with the keyboard. Automated evidence is a DRAFT; it does not replace a keyboard and screen-reader pass by a person.\n\n`
  + `| Mode | Type | Check | Before | After | Verdict |\n|---|---|---|---|---|---|\n${table}\n\n`
  + `## Trace correlation in this run\n\n| Side | Same-origin requests | Matched | Server-generated | No server trace | Not instrumented | Failed |\n|---|---:|---:|---:|---:|---:|---:|\n${obsRows}\n\n`
  + `A matched request means the Drupal server continued the browser's W3C trace. It does not mean the patch caused what was observed. ${run.observe ? 'Use `node tools/observability/cli.mjs collect ' + run.v.slug + ' --run ' + path.relative(process.cwd(), run.out) + '` to build the manifest and the before/after execution comparison.' : 'Run with `--observe` to collect Drupal execution traces.'}\n\n`
  + `${contextMarkdown(results)}\n${ajaxMarkdown(results)}\n${speechMarkdown(results)}\n`;

console.log(writeRun(run, results, summary));
if (run.observe) console.log(`Browser evidence: ${path.relative(process.cwd(), run.out)}/observability-before.json and observability-after.json`);
if (unexpected) process.exitCode = 1;
