// Link-purpose evidence for #3615469: the links in the "Put site into maintenance mode" description at
// /admin/config/development/maintenance. For one site it records the description's HTML and text, each link's
// accessible name and target, the page's whole list of link names (what a screen reader's links list offers,
// out of context), and what the Guidepup virtual screen reader announces for the description. The reader runs
// over a jsdom snapshot: it documents names and reading order, it is NOT a real VoiceOver or NVDA run.
//   node tools/playwright/linktext-3615469.mjs --url <site> --side before|after [--login <one-time link>] [--chromium <path>]
// The one-time link comes from `core/scripts/dr user:login --uid=1 --url=<site>` (or `ddev drupal login`); it is used, not saved.
// Writes reports/issues/3615469/screenreader/<stamp>-<side>/ (results.json, SUMMARY.md).
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from '@playwright/test';
import { JSDOM } from 'jsdom';
import { virtual } from '@guidepup/virtual-screen-reader';
import { labRoot } from '../compare/lib.mjs';

const arg = (n) => { const i = process.argv.indexOf(`--${n}`); return i > 0 ? process.argv[i + 1] : undefined; };
const base = (arg('url') || '').replace(/\/$/, ''), side = arg('side'), login = arg('login');
if (!base || !['before', 'after'].includes(side)) { console.error('usage: --url <site> --side before|after [--login <one-time link>] [--chromium <path>]'); process.exit(2); }
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const out = path.join(labRoot, 'reports/issues/3615469/screenreader', `${stamp}-${side}`);

async function announce(html) {
  const dom = new JSDOM(`<!DOCTYPE html><html lang="en"><body><div id="sr-root">${html}</div></body></html>`, { pretendToBeVisual: true });
  const doc = dom.window.document;
  global.window = dom.window; global.document = doc; global.Node = dom.window.Node;
  global.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
  await virtual.start({ container: doc.getElementById('sr-root') });
  // One pass only: the virtual reader wraps to the start after the last item, so stop when the first phrase comes round again.
  for (let i = 0; i < 40; i++) { await virtual.next(); const l = await virtual.spokenPhraseLog(); if (l.length > 2 && l[l.length - 1] === l[0]) break; }
  const log = await virtual.spokenPhraseLog();
  await virtual.stop();
  const once = log.length > 2 && log[log.length - 1] === log[0] ? log.slice(0, -1) : log;
  return once.filter((p, i) => i === 0 || p !== once[i - 1]);
}

const browser = await chromium.launch(arg('chromium') ? { executablePath: arg('chromium') } : {});
const page = await browser.newPage();
if (login) await page.goto(login);
const resp = await page.goto(`${base}/admin/config/development/maintenance`);
const status = resp ? resp.status() : null;
const box = page.locator('input[name="maintenance_mode"]');
if (status !== 200 || !(await box.count())) { console.error(`The maintenance form did not load (HTTP ${status}); log in with --login.`); await browser.close(); process.exit(1); }
const descId = (await box.getAttribute('aria-describedby') || '').split(/\s+/).find(Boolean);
const desc = descId ? page.locator(`[id="${descId}"]`) : box.locator('xpath=ancestor::*[contains(@class,"form-item")][1]').locator('.description, [class*="description"]').first();
const html = (await desc.innerHTML()).trim(), text = (await desc.innerText()).replace(/\s+/g, ' ').trim();
const links = [];
for (const a of await desc.locator('a').all()) {
  links.push({ text: (await a.innerText()).trim(), accessibleName: await a.evaluate((el) => el.textContent.replace(/\s+/g, ' ').trim()),
    ariaLabel: await a.getAttribute('aria-label'), href: await a.getAttribute('href'), after: await a.evaluate((el) => (el.nextSibling && el.nextSibling.textContent || '').replace(/\s+/g, ' ').slice(0, 24)) });   // not trimmed: a leading space is the point
}
const snapshot = await page.locator('body').ariaSnapshot().catch(() => '');   // the whole page, as a screen reader's links list offers it
const pageLinks = (snapshot.match(/- link "([^"]*)"/g) || []).map((l) => l.replace(/^- link "|"$/g, ''));
const res = { issue: '3615469', side, url: `${base}/admin/config/development/maintenance`, when: new Date().toISOString(), describedBy: descId || null,
  descriptionHtml: html, descriptionText: text, links, pageLinkNames: pageLinks, reader: await announce(html), browser: browser.version() };
await browser.close();

fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(path.join(out, 'results.json'), `${JSON.stringify(res, null, 2)}\n`);
const md = [`# #3615469 link text, ${side} (DRAFT)`, '', `${res.when}, ${res.url}, Chromium ${res.browser}. Synthetic: Guidepup virtual screen reader over jsdom, not a real screen reader.`, '',
  `Checkbox description (aria-describedby \`${res.describedBy || 'none'}\`):`, '', '```html', html, '```', '', '| Link text (accessible name) | Target | Text right after the link |', '|---|---|---|',
  ...links.map((l) => `| "${l.accessibleName}"${l.ariaLabel ? ` (aria-label "${l.ariaLabel}")` : ''} | \`${l.href}\` | \`${JSON.stringify(l.after)}\`${/^\s/.test(l.after) ? ' (starts with a space)' : l.after ? ' (**no space**)' : ''} |`), '',
  'Virtual screen reader, reading the description:', '', ...res.reader.map((p) => `- ${p}`), '',
  `All link names on the page, out of context, as a screen reader's links list offers them (${pageLinks.length}):`, '', pageLinks.map((n) => `"${n}"`).join(', '), ''];
fs.writeFileSync(path.join(out, 'SUMMARY.md'), md.join('\n'));
console.log(`${side}: ${links.map((l) => `"${l.accessibleName}"`).join(', ')}; wrote ${path.relative(labRoot, out)}/`);
