// #3083103: what the Guidepup virtual screen reader says about the invalid Name field, Before and After.
//   node tools/playwright/screenreader-3083103.mjs [slug] [--out=<dir>]
// The virtual screen reader reads a jsdom snapshot of the page (semantics only, no layout, no live-region speech).
// It is evidence about names/roles/descriptions and reading order, not a substitute for NVDA or VoiceOver.
import fs from 'node:fs';
import path from 'node:path';
import { JSDOM } from 'jsdom';
import { virtual } from '@guidepup/virtual-screen-reader';
import { runArgs, launch, openSide } from './lib/lab-run.mjs';
import { labRoot } from '../compare/lib.mjs';

const run = runArgs({ slug: '3083103-latest' });
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const out = path.resolve(process.argv.find((a) => a.startsWith('--out='))?.slice(6) || path.join(labRoot, 'reports/issues/3083103/screenreader', stamp));
fs.mkdirSync(out, { recursive: true });

async function speak(html, url) {
  const dom = new JSDOM(html, { pretendToBeVisual: true, url });
  const doc = dom.window.document;
  doc.querySelectorAll('script, style, link, noscript').forEach((n) => n.remove());
  global.window = dom.window;
  global.document = doc;
  global.Node = dom.window.Node;
  global.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
  global.CSS = dom.window.CSS || { escape: (v) => String(v) };
  const form = doc.querySelector('form#form-test-error-association-form') || doc.body;
  await virtual.start({ container: form });
  const phrases = [];
  for (let i = 0; i < 160; i++) {
    await virtual.next();
    const p = await virtual.lastSpokenPhrase();
    phrases.push(p);
    if (/end of/i.test(p)) break;
  }
  await virtual.stop();
  return phrases;
}

const { browser } = await launch(run);
run.browser = browser;
const results = { variant: run.v.slug, when: new Date().toISOString(), sides: {} };
try {
  for (const side of ['before', 'after']) {
    const { page, base, rec } = await openSide(run, side);
    const url = `${base}/form-test/error-association`;
    await page.goto(url);
    await page.waitForLoadState('load');
    await page.evaluate(() => { document.querySelectorAll('form').forEach((f) => { f.noValidate = true; }); });
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'load' }).catch(() => {}),
      page.locator('form#form-test-error-association-form [type="submit"]').first().click(),
    ]);
    const html = await page.content();
    results.sides[side] = { url, commit: rec.commit, phrases: await speak(html, url) };
    await rec.close(out);
  }
} finally {
  await browser.close();
}

for (const side of ['before', 'after']) {
  const idx = results.sides[side].phrases.findIndex((p) => /Name/i.test(p));
  results.sides[side].aroundName = idx >= 0 ? results.sides[side].phrases.slice(Math.max(0, idx - 2), idx + 5) : [];
}
fs.writeFileSync(path.join(out, 'results.json'), JSON.stringify(results, null, 2));
let md = `# #3083103 virtual screen reader: ${run.v.slug}\n\nGuidepup virtual screen reader over a jsdom snapshot of the invalid form. Semantics only; no live-region speech and no layout.\n\n`;
for (const side of ['before', 'after']) {
  md += `## ${side}\n\nPhrases around the Name field:\n\n`;
  for (const p of results.sides[side].aroundName) md += `- ${p}\n`;
  md += `\nFirst 40 phrases:\n\n`;
  for (const p of results.sides[side].phrases.slice(0, 40)) md += `- ${p}\n`;
  md += '\n';
}
fs.writeFileSync(path.join(out, 'SUMMARY.md'), md);
console.log(path.relative(labRoot, out));
