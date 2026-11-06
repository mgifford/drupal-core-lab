// #3155130, Edit summary toggle: real keyboard input on each side's Add Basic page form, then Save and Edit again.
//   node tools/playwright/evaluate-3155130.mjs [3155130-pinned]      (both sites running: node scripts/lab-env.mjs start 3155130-pinned)
// Writes reports/issues/3155130/playwright/<date>/results.json and results.md. DRAFT evidence: Chromium only, no screen reader.
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from '@playwright/test';
import { labRoot, resolveVariant, envInfo, loginPath, reportsDir } from '../compare/lib.mjs';
import { gitInfo } from './lib/lab-run.mjs';

const slug = process.argv.slice(2).find((a) => !a.startsWith('-')) || '3155130-pinned';
const r = resolveVariant(slug); if (r.error) { console.error(r.error); process.exit(2); }
const v = r.v;
const SUMMARY_TEXT = 'Summary typed by the evaluator';
const out = path.join(labRoot, reportsDir(v), 'playwright', new Date().toISOString().replace(/[:.]/g, '-'));
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
const results = {};

for (const side of ['before', 'after']) {
  const env = v[side].env, info = envInfo(env);
  const host = info.hosts.slice().sort((a, b) => a.length - b.length)[0];
  const base = `https://${host}${info.routerHttpsPort && info.routerHttpsPort !== 443 ? `:${info.routerHttpsPort}` : ''}`;
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, ignoreHTTPSErrors: true });
  const page = await ctx.newPage();
  await page.goto(base + loginPath(env), { waitUntil: 'load' });
  await page.goto(`${base}/node/add/page`, { waitUntil: 'load' });
  await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
  const res = { env, commit: gitInfo(env), steps: {} };

  // 1. The state as loaded.
  res.steps.asLoaded = await page.evaluate(() => {
    const s = document.querySelector('textarea[name$="[summary]"]'), b = document.querySelector('[name^="field_body"][name$="[value]"]');
    const btn = document.querySelector('label button, .field-edit-link button, details > summary, [aria-controls*="container"]');
    return {
      summaryName: s?.name, summaryVisible: !!s && s.getClientRects().length > 0,
      detailsAround: !!s?.closest('details'), detailsOpen: s?.closest('details')?.open ?? null,
      toggleInsideLabel: !!document.querySelector('label button, label .field-edit-link'),
      toggleText: btn?.textContent.trim().replace(/\s+/g, ' ') || null,
      summaryBeforeBody: s && b ? !!(s.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING) : null,
    };
  });

  // 2. Keyboard: Tab from the Title field to the first control that mentions "summary"; activate it with Enter.
  await page.locator('#edit-title-0-value').click();
  let reached = null;
  for (let i = 0; i < 6 && !reached; i++) {
    await page.keyboard.press('Tab');
    reached = await page.evaluate(() => { const a = document.activeElement; return /summary/i.test(a.textContent || '') && /^(BUTTON|SUMMARY)$/.test(a.tagName) ? `${a.tagName.toLowerCase()} "${a.textContent.trim()}"` : null; });
  }
  res.steps.keyboard = { reachedByTab: reached };
  if (reached) {
    await page.keyboard.press('Enter');
    await page.waitForTimeout(300);
    res.steps.keyboard.afterEnter = await page.evaluate(() => {
      const a = document.activeElement, s = document.querySelector('textarea[name$="[summary]"]');
      return { activeElement: a ? `${a.tagName.toLowerCase()} "${(a.textContent || '').trim().slice(0, 30)}"` : null, summaryVisible: !!s && s.getClientRects().length > 0, detailsOpen: s?.closest('details')?.open ?? null, toggleLabelNow: [...document.querySelectorAll('label button, details > summary')].map((x) => x.textContent.trim())[0] || null };
    });
  }

  // 3. Save and Edit again: does the summary survive?
  await page.locator('#edit-title-0-value').fill(`Evaluator ${side}`);
  await page.locator('.ck-editor__editable').first().click();
  await page.keyboard.type('Body typed by the evaluator');
  const sum = page.locator('textarea[name$="[summary]"]').first();
  const det = page.locator('details:has(textarea[name$="[summary]"])').first();
  if (await det.count()) { if (!(await det.evaluate((d) => d.open))) await det.locator('> summary').first().click(); }
  else if (!(await sum.isVisible())) { const t = page.locator('label button').first(); if (await t.count()) await t.click(); }
  await sum.fill(SUMMARY_TEXT).catch((e) => { res.steps.persist = { error: String(e.message).split('\n')[0] }; });
  if (!res.steps.persist) {
    await page.locator('#edit-submit').click();
    await page.waitForLoadState('load');
    const m = page.url().match(/\/node\/(\d+)/) || (await page.content()).match(/\/node\/(\d+)\/edit/);
    const nid = m && m[1];
    if (!nid) res.steps.persist = { error: `no node page after Save (landed on ${new URL(page.url()).pathname})` };
    else {
      await page.goto(`${base}/node/${nid}/edit`, { waitUntil: 'load' });
      const saved = await page.locator('textarea[name$="[summary]"]').first().inputValue().catch(() => null);
      res.steps.persist = { nid, savedSummary: saved, summaryKept: saved === SUMMARY_TEXT };
    }
  }
  await page.screenshot({ path: path.join(out, `${side}-edit-form.png`), fullPage: false });
  results[side] = res; await ctx.close();
}
await browser.close();
fs.writeFileSync(path.join(out, 'results.json'), `${JSON.stringify({ slug, when: new Date().toISOString(), results }, null, 2)}\n`);
const row = (label, f) => `| ${label} | ${f(results.before)} | ${f(results.after)} |`;
const md = `# #3155130 evaluator: ${slug}\n\nDRAFT. Chromium, real keyboard input (Tab, Enter) and clicks; no screen reader. Core ${results.before.commit}.\n\n| | Before | After |\n|---|---|---|\n${[
  row('Summary field name', (x) => `\`${x.steps.asLoaded.summaryName}\``),
  row('Toggle inside a label', (x) => x.steps.asLoaded.toggleInsideLabel),
  row('Summary inside a details element', (x) => x.steps.asLoaded.detailsAround),
  row('Summary visible as loaded', (x) => x.steps.asLoaded.summaryVisible),
  row('Summary field comes before the Body field', (x) => x.steps.asLoaded.summaryBeforeBody),
  row('Reached by Tab from Title', (x) => x.steps.keyboard.reachedByTab || 'no'),
  row('After Enter: focus, summary shown (details open)', (x) => x.steps.keyboard.afterEnter ? `${x.steps.keyboard.afterEnter.activeElement}; ${x.steps.keyboard.afterEnter.detailsOpen ?? x.steps.keyboard.afterEnter.summaryVisible}` : 'n/a'),
  row('Summary kept after Save and Edit', (x) => x.steps.persist.error ? `error: ${x.steps.persist.error}` : `${x.steps.persist.summaryKept} (${JSON.stringify(x.steps.persist.savedSummary)})`),
].join('\n')}\n`;
fs.writeFileSync(path.join(out, 'results.md'), md);
console.log(md);
console.log(`Wrote ${path.relative(labRoot, out)}/`);
