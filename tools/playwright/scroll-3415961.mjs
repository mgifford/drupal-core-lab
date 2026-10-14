// Reproduce the #3415961 "window scrolls after Insert Media" symptom directly against both DDEV sites.
// The media library is pre-seeded with one Image media item, so the dialog needs no file chooser.
// Usage: node tools/playwright/scroll-3415961.mjs <before-env> <after-env>
import { chromium } from '@playwright/test';
import { loginPath, envInfo } from '../compare/lib.mjs';

const [envBefore, envAfter] = process.argv.slice(2);
if (!envBefore || !envAfter) {
  console.error('usage: node tools/playwright/scroll-3415961.mjs <before-env> <after-env>');
  process.exit(2);
}

const sides = [
  { name: 'Before', env: envBefore },
  { name: 'After', env: envAfter },
].map((s) => ({ ...s, login: `https://${envInfo(s.env).host}${loginPath(s.env)}` }));

const browser = await chromium.launch();
const results = {};
for (const side of sides) {
  const ctx = await browser.newContext({ viewport: { width: 1000, height: 400 }, ignoreHTTPSErrors: true });
  const page = await ctx.newPage();
  await page.goto(side.login, { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle');
  const base = new URL(page.url()).origin;

  await page.goto(base + '/node/add/article', { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle');

  // Full HTML is the format whose CKEditor 5 toolbar has the Insert Media button.
  const fmt = page.locator('select[name="body[0][format]"]');
  if (await fmt.count()) {
    const opts = await fmt.locator('option').allTextContents();
    console.log(`[${side.name}] formats: ${opts.join(', ')}`);
    const full = opts.find((o) => /full html/i.test(o));
    if (full) await fmt.selectOption({ label: full });
  }
  await page.waitForSelector('.ck-editor__editable', { timeout: 15000 });

  // Make the page tall, then put the editor near the top of a short window.
  await page.locator('.ck-editor__editable').click();
  await page.keyboard.type(Array.from({ length: 60 }, (_, i) => `line ${i}`).join('\n'), { delay: 0 });
  await page.waitForTimeout(300);
  await page.evaluate(() => document.querySelector('.ck-editor').scrollIntoView({ block: 'start' }));
  await page.evaluate(() => window.scrollBy(0, -20));
  await page.waitForTimeout(300);
  const before = await page.evaluate(() => ({
    scrollY: window.scrollY,
    active: document.activeElement && document.activeElement.outerHTML.slice(0, 120),
  }));

  // Open the media library from the editor toolbar.
  let btn = page.getByRole('button', { name: 'Insert Media' }).first();
  if ((await btn.count()) === 0) {
    const labels = await page.locator('.ck-toolbar button').evaluateAll((els) => els.map((e) => e.getAttribute('data-cke-tooltip-text') || e.getAttribute('aria-label') || e.textContent.trim()));
    console.log(`[${side.name}] toolbar buttons: ${labels.join(' | ')}`);
    const more = page.getByRole('button', { name: 'Show more items' }).first();
    if (await more.count()) { await more.click(); await page.waitForTimeout(300); }
    btn = page.getByRole('button', { name: 'Insert Media' }).first();
  }
  await btn.click();
  await page.waitForSelector('#drupal-modal #media-library-content', { state: 'visible', timeout: 15000 });
  await page.waitForTimeout(500);

  // Pick the seeded item and insert it. The button pane lives outside #drupal-modal.
  const item = page.locator('.ui-dialog .js-media-library-item').first();
  await item.waitFor({ state: 'visible', timeout: 15000 });
  await item.click();
  await page.locator('.ui-dialog-buttonpane').getByRole('button', { name: 'Insert selected' }).click();
  await page.waitForSelector('.ck-content .ck-widget.drupal-media .media', { timeout: 15000 });
  await page.waitForTimeout(700);

  const after = await page.evaluate(() => {
    const r = document.querySelector('.ck-editor').getBoundingClientRect();
    return {
      scrollY: window.scrollY,
      active: document.activeElement && document.activeElement.outerHTML.slice(0, 120),
      editorTop: Math.round(r.top),
      editorBottom: Math.round(r.bottom),
      innerHeight: window.innerHeight,
    };
  });
  if (process.env.OUTDIR) {
    await page.screenshot({ path: `${process.env.OUTDIR}/${side.name.toLowerCase()}-after-insert.png` });
  }
  results[side.name] = { before, after };
  console.log(`[${side.name}] scrollY ${before.scrollY} -> ${after.scrollY}; editor top ${after.editorTop} bottom ${after.editorBottom} (viewport ${after.innerHeight}); active: ${after.active}`);
  await ctx.close();
}
await browser.close();
console.log(JSON.stringify(results, null, 2));
