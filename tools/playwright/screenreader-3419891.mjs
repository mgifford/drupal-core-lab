// What a screen reader announces for the alternative text form in the CKEditor 5 image dialog.
// Uses the Guidepup virtual screen reader over a jsdom snapshot of the live form. No OS screen
// reader is involved, so this documents semantics (name, role, state), not a real VoiceOver run.
//   node tools/playwright/screenreader-3419891.mjs [slug]
// Default slug: 3419891-followup.
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { chromium } from '@playwright/test';
import { PNG } from 'pngjs';
import { JSDOM } from 'jsdom';
import { virtual } from '@guidepup/virtual-screen-reader';
import { labRoot, variants, envInfo, loginPath } from '../compare/lib.mjs';

const v = variants().find((x) => x.slug === (process.argv[2] || '3419891-followup'));
if (!v) throw new Error('variant not found');
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const out = path.join(labRoot, 'reports/issues', v.issue, 'screenreader', `${stamp}-${v.slug}`);
fs.mkdirSync(out, { recursive: true });

const png = new PNG({ width: 32, height: 32 });
png.data.fill(200);
const IMAGE = { name: 'screenreader.png', mimeType: 'image/png', buffer: PNG.sync.write(png) };
const TEXT = Array.from({ length: 8 }, (_, i) => `Line ${i + 1} of alternative text.`).join('\n');

async function announceForm(html) {
  const dom = new JSDOM(html, { pretendToBeVisual: true });
  const doc = dom.window.document;
  const container = doc.querySelector('.ck-text-alternative-form');
  if (!container) throw new Error('form not found in snapshot');
  global.window = dom.window;
  global.document = doc;
  global.Node = dom.window.Node;
  global.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
  await virtual.start({ container });
  for (let i = 0; i < 40; i += 1) await virtual.next();
  const log = await virtual.spokenPhraseLog();
  await virtual.stop();
  return log;
}

async function openForm(page, base) {
  const link = loginPath(v.after.env);
  await page.goto(base + link, { waitUntil: 'domcontentloaded' });
  await page.goto(`${base}/node/add/page`, { waitUntil: 'domcontentloaded' });
  const editable = page.locator('.ck-editor__editable').first();
  await editable.waitFor({ state: 'visible', timeout: 30000 });
  await editable.click();
  const button = page.locator('.ck-file-dialog-button');
  await button.waitFor({ state: 'visible', timeout: 20000 });
  const input = page.locator('.ck-file-dialog-button input[type="file"]');
  await input.waitFor({ state: 'attached', timeout: 20000 });
  try {
    const [chooser] = await Promise.all([page.waitForEvent('filechooser', { timeout: 8000 }), button.click()]);
    await chooser.setFiles(IMAGE);
  } catch {
    await input.setInputFiles(IMAGE);
  }
  const form = page.locator('.ck.ck-balloon-panel .ck-text-alternative-form').first();
  await form.waitFor({ state: 'visible', timeout: 30000 });
  return { form, editable };
}

const info = envInfo(v.after.env);
const host = info.hosts.slice().sort((a, b) => a.length - b.length)[0];
const base = `https://${host}`;
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, ignoreHTTPSErrors: true });
const page = await ctx.newPage();

const first = await openForm(page, base);
const initial = await announceForm(await first.form.evaluate((el) => el.outerHTML));
await first.form.locator('textarea').click();
await page.keyboard.insertText(TEXT);
const grown = await first.form.locator('textarea').evaluate((el) => el.getBoundingClientRect().height);
await page.keyboard.press('Escape');
await first.form.waitFor({ state: 'hidden', timeout: 20000 });
await first.editable.click({ position: { x: 5, y: 5 } });
await page.locator('.image-alternative-text-missing button').waitFor({ state: 'visible', timeout: 20000 });
// The button sits under the image widget's drag handler; a pointer click is intercepted.
await page.locator('.image-alternative-text-missing button').evaluate((b) => b.click());
const reopened = page.locator('.ck.ck-balloon-panel .ck-text-alternative-form').first();
await reopened.waitFor({ state: 'visible', timeout: 20000 });
const afterReopen = await announceForm(await reopened.evaluate((el) => el.outerHTML));
const reopenedState = await reopened.evaluate((el) => {
  const t = el.querySelector('textarea');
  const save = [...el.querySelectorAll('button')].find((b) => (b.getAttribute('aria-label') || b.textContent || '').trim() === 'Save');
  return { value: t.value, height: t.getBoundingClientRect().height, saveDisabled: !!(save && (save.disabled || save.getAttribute('aria-disabled') === 'true')) };
});

await browser.close();
const result = { slug: v.slug, env: v.after.env, platformScrollbarWidth: null, grownHeight: grown, reopened: reopenedState, initial, afterReopen };
fs.writeFileSync(path.join(out, 'results.json'), JSON.stringify(result, null, 2));

const fieldLine = (log) => log.find((p) => /Alternative text/i.test(p)) || '(not announced)';
const saveLine = (log) => [...log].reverse().find((p) => /button, Save/i.test(p)) || '(not announced)';
const md = `# Virtual screen reader: alternative text form (#${v.issue}, ${v.slug})\n\nGuidepup virtual screen reader (@guidepup/virtual-screen-reader) over a jsdom snapshot of the live form. This documents the accessible name, role and state. It is **not** a real VoiceOver or NVDA run.\n\n| | Value |\n|---|---|\n| Variant | \`${v.slug}\` (After \`${v.after.env}\`) |\n| Field announced as | ${fieldLine(initial)} |\n| Save before typing | ${saveLine(initial)} |\n| Typed text; field height | ${TEXT.split('\n').length} lines, ${Math.round(grown)}px |\n| Reopened value / height | \`${reopenedState.value}\` / ${Math.round(reopenedState.height)}px |\n| Save after reopening | ${saveLine(afterReopen)} |\n\n## Phrases, in order\n\n### First open (empty)\n${initial.map((p) => `- ${p}`).join('\n')}\n\n### Reopened after cancel\n${afterReopen.map((p) => `- ${p}`).join('\n')}\n`;
fs.writeFileSync(path.join(out, 'SUMMARY.md'), md);
console.log(`${path.relative(labRoot, out)}/SUMMARY.md`);
console.log(`field: ${fieldLine(initial)} | save initial: ${saveLine(initial)} | save reopened: ${saveLine(afterReopen)}`);
