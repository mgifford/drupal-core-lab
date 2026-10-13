// Synthetic screen-reader evidence for #3093378: what the Guidepup virtual screen reader announces
// for the toolbar "Structure" submenu disclosure button, on both sides, closed and open.
// It runs over a jsdom snapshot of the button (no layout engine, no operating-system screen reader),
// so it documents role, accessible name and expanded state — it is NOT a real VoiceOver or NVDA run.
//   node tools/playwright/screenreader-3093378.mjs [slug]   (default 3093378-pinned)
// Writes reports/issues/3093378/screenreader/<stamp>/ (results.json, SUMMARY.md).
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from '@playwright/test';
import { JSDOM } from 'jsdom';
import { virtual } from '@guidepup/virtual-screen-reader';
import { labRoot, variants, envInfo, loginPath } from '../compare/lib.mjs';

const slug = process.argv.slice(2).find((a) => !a.startsWith('-')) || '3093378-pinned';
const v = variants().find((x) => x.slug === slug);
if (!v) { console.error(`variant ${slug} not found`); process.exit(1); }
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const out = path.join(labRoot, 'reports/issues', v.issue, 'screenreader', stamp);
fs.mkdirSync(out, { recursive: true });

// Announce a single element snapshot with the Guidepup virtual screen reader.
async function announce(html) {
  const dom = new JSDOM(`<!DOCTYPE html><html><body><div id="sr-root">${html}</div></body></html>`, { pretendToBeVisual: true });
  const doc = dom.window.document;
  const container = doc.getElementById('sr-root');
  global.window = dom.window; global.document = doc; global.Node = dom.window.Node;
  global.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
  await virtual.start({ container });
  for (let i = 0; i < 8; i++) await virtual.next();
  const log = await virtual.spokenPhraseLog();
  await virtual.stop();
  // The opening announcement of the button (starts with "button,"), e.g. "button, Structure menu, not expanded".
  const button = log.find((p) => /^button,/.test(p)) || log[0] || '';
  return { button, log };
}

const browser = await chromium.launch();
const res = { variant: v.slug, issue: v.issue, when: new Date().toISOString(), sides: {} };
for (const side of ['before', 'after']) {
  const spec = v[side]; const info = envInfo(spec.env);
  const host = info.hosts.slice().sort((a, b) => a.length - b.length)[0];
  const base = `https://${host}`;
  const ctx = await browser.newContext({ viewport: { width: 480, height: 900 }, ignoreHTTPSErrors: true });
  const page = await ctx.newPage();
  await page.goto(base + loginPath(spec.env));
  await page.goto(base + '/');
  await page.locator('#toolbar-item-administration').click();
  await page.waitForFunction(() => document.querySelectorAll('#toolbar-item-administration-tray .toolbar-handle').length > 0, null, { timeout: 15000 });
  const handle = page.locator('#toolbar-item-administration-tray .toolbar-handle').filter({ hasText: 'Structure' }).first();
  await handle.waitFor({ state: 'visible', timeout: 15000 });
  const html = () => handle.evaluate((el) => el.outerHTML);
  const closedHtml = await html();
  await handle.click();
  await page.waitForTimeout(300);
  const openedHtml = await html();
  res.sides[side] = { env: spec.env, closed: await announce(closedHtml), opened: await announce(openedHtml), html: { closed: closedHtml, opened: openedHtml } };
  await ctx.close();
  console.log(`announced ${side}`);
}
await browser.close();
fs.writeFileSync(path.join(out, 'results.json'), JSON.stringify(res, null, 2));

const B = res.sides.before, A = res.sides.after;
const same = B.closed.button === A.closed.button && B.opened.button === A.opened.button;
const md = `# Virtual screen reader: the "Structure" disclosure button (#${v.issue}, ${v.slug})

Guidepup virtual screen reader (@guidepup/virtual-screen-reader) over a jsdom snapshot of the toolbar button, closed and after opening the tray. It documents the button's role, accessible name and expanded state. It is **not** a real VoiceOver or NVDA run, and it does not test interaction (the button is read from markup after a real click in the browser).

| Side | Closed | Open |
|---|---|---|
| Before | ${B.closed.button} | ${B.opened.button} |
| After | ${A.closed.button} | ${A.opened.button} |

**${same ? 'Unchanged on both sides.' : 'Before and After differ — this is the change under test.'}**

## Markup snapshots

Before (closed): \`${B.html.closed}\`
Before (open): \`${B.html.opened}\`
After (closed): \`${A.html.closed}\`
After (open): \`${A.html.opened}\`

## Read phrases, in order

### Before (closed)
${B.closed.log.map((p) => `- ${p}`).join('\n')}

### Before (open)
${B.opened.log.map((p) => `- ${p}`).join('\n')}

### After (closed)
${A.closed.log.map((p) => `- ${p}`).join('\n')}

### After (open)
${A.opened.log.map((p) => `- ${p}`).join('\n')}

## Interpretation

Before, the button announces a name that changes with state ("${B.closed.button}" → "${B.opened.button}") and never announces expanded or collapsed. After, it keeps one name and announces the state ("${A.closed.button}" → "${A.opened.button}"). This is the disposable evidence that the change conveys state to assistive technology through \`aria-expanded\` instead of a word swap. Synthetic output; a person must still confirm with a real screen reader.
`;
fs.writeFileSync(path.join(out, 'SUMMARY.md'), md);
console.log(`${same ? 'SAME' : 'CHANGED'}: ${path.relative(labRoot, out)}/SUMMARY.md`);
