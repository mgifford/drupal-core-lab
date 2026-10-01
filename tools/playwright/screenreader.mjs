// What a screen reader announces for the URL alias field, before and after, using the Guidepup
// virtual screen reader on a snapshot of the page's DOM (jsdom). No OS screen reader is involved,
// so this documents semantics (name, role, state, description), not a real VoiceOver/NVDA run.
//   node tools/playwright/screenreader.mjs [slug]
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from '@playwright/test';
import { JSDOM } from 'jsdom';
import { virtual } from '@guidepup/virtual-screen-reader';
import { labRoot, variants, envInfo, loginPath } from '../compare/lib.mjs';
import { setup } from './flow.mjs';

const v = variants().find((x) => x.slug === (process.argv[2] || variants()[0].slug));
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const out = path.join(labRoot, 'reports/issues', v.issue, 'screenreader', stamp);
fs.mkdirSync(out, { recursive: true });

async function announce(html) {
  const dom = new JSDOM(html, { pretendToBeVisual: true });
  const doc = dom.window.document;
  const container = doc.querySelector('.js-form-item-path-0-alias') || doc.querySelector('#edit-path-0');
  // jsdom has no layout engine: the globals the virtual screen reader expects come from the snapshot window.
  global.window = dom.window; global.document = doc; global.Node = dom.window.Node; global.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
  await virtual.start({ container });
  const phrases = [];
  for (let i = 0; i < 25; i++) {
    await virtual.next();
    const p = await virtual.lastSpokenPhrase();
    phrases.push(p);
    if (/textbox/i.test(p) && /URL alias/i.test(p)) break;
  }
  const log = await virtual.spokenPhraseLog();
  await virtual.stop();
  return { atField: phrases[phrases.length - 1], log };
}

const browser = await chromium.launch();
const res = {};
for (const side of ['before', 'after']) {
  const spec = v[side]; const info = envInfo(spec.env);
  const base = `http://${info.hosts.slice().sort((a, b) => a.length - b.length)[0]}`;
  const ctx = await browser.newContext({ viewport: { width: 480, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(base + loginPath(spec.env));
  const link = await setup(page, base);
  await link.click(); await page.waitForTimeout(1200);
  res[side] = await announce(await page.content());
  await ctx.close();
}
await browser.close();
fs.writeFileSync(path.join(out, 'results.json'), JSON.stringify(res, null, 2));
const same = res.before.atField === res.after.atField;
const md = `# Virtual screen reader: URL alias field (#${v.issue})\n\nGuidepup virtual screen reader (@guidepup/virtual-screen-reader) over a jsdom snapshot of the page after using the error link. This documents the field's accessible name, role, state and description. It is **not** a real VoiceOver or NVDA run.\n\n| Side | Announced for the field |\n|---|---|\n| Before | ${res.before.atField} |\n| After | ${res.after.atField} |\n\n**${same ? '✓ Identical on both sides: the change did not alter what is announced for this field.' : '✗ Differs: review below.'}**\n\n## Phrases, in order\n\n### Before\n${res.before.log.map((p) => `- ${p}`).join('\n')}\n\n### After\n${res.after.log.map((p) => `- ${p}`).join('\n')}\n`;
fs.writeFileSync(path.join(out, 'SUMMARY.md'), md);
console.log(`${same ? 'SAME' : 'DIFFERENT'}: ${path.relative(labRoot, out)}/SUMMARY.md`);
