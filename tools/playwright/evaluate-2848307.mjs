// #2848307: inline errors on table and tableselect form elements.
// Compares the lab's Before (core 0387fb94 + the test form only) and After (the simplified
// table error wrapper) under the same page, browser and input conditions.
//   node tools/playwright/evaluate-2848307.mjs [--out=<dir>]
// Records: full-page screenshots in light, dark and forced-colors mode; the rendered DOM
// association (summary link, aria-describedby targets, inline error count, duplicate IDs);
// a real keyboard pass from the summary link to the table; and Guidepup virtual screen reader
// phrases for the table. The virtual reader is synthetic evidence, not VoiceOver or NVDA.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { chromium } from '@playwright/test';
import { JSDOM } from 'jsdom';
import { virtual } from '@guidepup/virtual-screen-reader';
import { labRoot, variants, envInfo, loginPath, envDir } from '../compare/lib.mjs';

const v = variants().find((x) => x.slug === '2848307-latest');
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const arg = (name, fallback) => {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
};
const out = path.resolve(arg('out', path.join(labRoot, 'reports/issues/2848307/lab', stamp)));
fs.mkdirSync(out, { recursive: true });

const SCENARIOS = [
  { id: 'uninstall', path: '/admin/modules/uninstall', submit: '#edit-submit', table: '#system-modules-uninstall-table' },
  { id: 'table', path: '/form-test/table-error/table', submit: '#edit-submit', table: '#edit-table' },
  { id: 'tableselect-checkboxes', path: '/form-test/table-error/tableselect-checkboxes', submit: '#edit-submit', table: '#edit-tableselect' },
  { id: 'table-tableselect', path: '/form-test/table-error/table-tableselect', submit: '#edit-submit', table: '#edit-table' },
];

const DOM = () => {
  const norm = (s) => String(s ?? '').replace(/\s+/g, ' ').trim();
  const resolve = (value) => norm(value).split(' ').filter(Boolean).map((token) => {
    const els = [...document.querySelectorAll(`[id="${token.replace(/"/g, '\\"')}"]`)];
    return { token, count: els.length, text: els[0] ? norm(els[0].textContent).slice(0, 160) : null };
  });
  const ids = [...document.querySelectorAll('[id]')].map((e) => e.id);
  const duplicates = [...new Set(ids.filter((x, i) => ids.indexOf(x) !== i))];
  const tables = [...document.querySelectorAll('table')].map((t) => ({
    id: t.id,
    tabindex: t.getAttribute('tabindex'),
    describedby: t.getAttribute('aria-describedby'),
    describedbyResolved: t.hasAttribute('aria-describedby') ? resolve(t.getAttribute('aria-describedby')) : [],
    caption: norm(t.querySelector('caption')?.textContent),
    wrapper: t.parentElement ? norm(t.parentElement.className) : '',
  }));
  const inlineErrors = [...document.querySelectorAll('.form-item--error-message, .form-item__error-message')].map((e) => ({ id: e.id, text: norm(e.textContent) }));
  const summaryLinks = [...document.querySelectorAll('.messages a')].map((a) => ({ text: norm(a.textContent), href: a.getAttribute('href') }));
  const invalidControls = [...document.querySelectorAll('input[aria-invalid], select[aria-invalid], textarea[aria-invalid]')].map((i) => ({ id: i.id, name: i.name, invalid: i.getAttribute('aria-invalid') }));
  return { summaryLinks, tables, inlineErrors, invalidControls, duplicateIds: duplicates, errorMessageCount: document.querySelectorAll('.messages--error').length };
};

async function keyboardPath(page, expectedHref) {
  await page.evaluate(() => {
    document.activeElement?.blur();
    window.scrollTo(0, 0);
  });
  const trail = [];
  for (let i = 0; i < 160; i++) {
    await page.keyboard.press('Tab');
    const active = await page.evaluate(() => ({
      tag: document.activeElement?.tagName,
      text: String(document.activeElement?.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 80),
      href: document.activeElement?.getAttribute?.('href') || null,
    }));
    trail.push(active);
    if (active.href && active.href === expectedHref) break;
  }
  const reached = trail.some((x) => x.href === expectedHref);
  if (!reached) return { expectedHref, reached, trail: trail.slice(-8), hash: null, focused: null };
  await page.keyboard.press('Enter');
  await page.waitForTimeout(300);
  const focused = await page.evaluate(() => ({
    tag: document.activeElement?.tagName,
    id: document.activeElement?.id || null,
    describedby: document.activeElement?.getAttribute?.('aria-describedby') || null,
    hash: window.location.hash,
  }));
  return { expectedHref, reached, trail: trail.slice(-8), ...focused };
}

async function announceTable(html, selector) {
  const dom = new JSDOM(html, { pretendToBeVisual: true });
  const doc = dom.window.document;
  // Start outside the table so the table's accessible name and description are
  // spoken. Starting inside the table skips its own opening phrase.
  const container = selector === '#system-modules-uninstall-table'
    ? (doc.querySelector('form#system-modules-uninstall') || doc.querySelector(selector))
    : (doc.querySelector('.form-item--error') || doc.querySelector('form') || doc.querySelector(selector));
  if (!container) return { selector, phrases: [], error: 'table not in snapshot' };
  global.window = dom.window;
  global.document = doc;
  global.Node = dom.window.Node;
  global.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
  await virtual.start({ container });
  const phrases = [];
  for (let i = 0; i < 20; i++) {
    await virtual.next();
    const p = await virtual.lastSpokenPhrase();
    if (!p) break;
    phrases.push(p);
  }
  await virtual.stop();
  return { selector, phrases };
}

const CHROME = process.env.CHROME_PATH || (process.platform === 'darwin' ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' : undefined);
const browser = await chromium.launch(CHROME ? { executablePath: CHROME } : {});
const results = { variant: v.slug, core: v.core.commit, generatedAt: new Date().toISOString(), browser: browser.version(), sides: {} };

for (const side of ['before', 'after']) {
  const spec = v[side];
  const info = envInfo(spec.env);
  const raw = JSON.parse(execFileSync('ddev', ['describe', '-j'], { cwd: envDir(spec.env), encoding: 'utf8' })).raw;
  const base = (raw.httpsURLs || []).find((u) => u.includes('127.0.0.1')) || `https://${info.hosts.slice().sort((a, b) => a.length - b.length)[0]}`;
  results.sides[side] = { env: spec.env, base, scenarios: {} };
  for (const mode of ['light', 'dark', 'forced']) {
    const login = loginPath(spec.env);
    const context = await browser.newContext({
      ignoreHTTPSErrors: true,
      viewport: { width: 1280, height: 900 },
      colorScheme: mode === 'dark' ? 'dark' : 'light',
      forcedColors: mode === 'forced' ? 'active' : 'none',
    });
    const page = await context.newPage();
    await page.goto(base + login, { waitUntil: 'load' });
    for (const scenario of SCENARIOS) {
      await page.goto(base + scenario.path, { waitUntil: 'load' });
      await page.locator(scenario.submit).click();
      await page.waitForLoadState('load');
      const file = path.join(out, `${side}-${scenario.id}-${mode}.png`);
      await page.screenshot({ path: file, fullPage: true });
      if (mode === 'light') {
        const dom = await page.evaluate(DOM);
        const target = dom.summaryLinks.find((l) => l.href === scenario.table || l.href?.startsWith('#edit-'));
        const keyboard = await keyboardPath(page, target ? target.href : '#no-summary-link');
        const sr = await announceTable(await page.content(), scenario.table);
        results.sides[side].scenarios[scenario.id] = { path: scenario.path, screenshot: path.relative(labRoot, file), dom, keyboard, screenReader: sr };
      }
      else {
        results.sides[side].scenarios[scenario.id] ??= {};
        results.sides[side].scenarios[scenario.id][mode] = path.relative(labRoot, file);
      }
    }
    await context.close();
  }
}
await browser.close();
fs.writeFileSync(path.join(out, 'results.json'), `${JSON.stringify(results, null, 2)}\n`);

const md = [];
md.push('# #2848307 lab evidence');
md.push('');
md.push(`Generated ${results.generatedAt} with Chromium ${results.browser} on ${process.platform} ${process.arch}.`);
md.push(`Variant \`${v.slug}\`, core \`${v.core.commit}\`.`);
md.push('');
md.push('Screenshots are in this folder: `<side>-<scenario>-<light|dark|forced>.png`.');
md.push('');
for (const scenario of SCENARIOS) {
  md.push(`## ${scenario.id}`);
  md.push('');
  md.push('| | Before | After |');
  md.push('|---|---|---|');
  const b = results.sides.before.scenarios[scenario.id];
  const a = results.sides.after.scenarios[scenario.id];
  const cell = (s) => (s?.dom ? `summary links: ${JSON.stringify(s.dom.summaryLinks)}<br>inline errors: ${s.dom.inlineErrors.length}<br>table: \`${s.dom.tables.map((t) => `${t.id} describedby=${t.describedby ?? 'none'} tabindex=${t.tabindex ?? 'none'}`).join('; ')}\`<br>invalid controls: ${s.dom.invalidControls.length}<br>duplicate IDs: ${s.dom.duplicateIds.length}` : 'not run');
  md.push(`| DOM | ${cell(b)} | ${cell(a)} |`);
  md.push(`| Summary link focus | ${b?.keyboard ? JSON.stringify({ reached: b.keyboard.reached, focused: b.keyboard.focused ?? b.keyboard.tag ?? null, hash: b.keyboard.hash }) : 'n/a'} | ${a?.keyboard ? JSON.stringify({ reached: a.keyboard.reached, focused: a.keyboard.focused ?? a.keyboard.tag ?? null, hash: a.keyboard.hash }) : 'n/a'} |`);
  md.push('');
  md.push('Virtual screen reader, first phrases at the table:');
  md.push('');
  md.push(`- Before: ${b?.screenReader?.phrases?.slice(0, 8).map((p) => `"${p}"`).join(' → ') || 'n/a'}`);
  md.push(`- After: ${a?.screenReader?.phrases?.slice(0, 8).map((p) => `"${p}"`).join(' → ') || 'n/a'}`);
  md.push('');
}
md.push('The Guidepup virtual screen reader is synthetic evidence over a jsdom snapshot, not a real VoiceOver or NVDA run.');
fs.writeFileSync(path.join(out, 'SUMMARY.md'), `${md.join('\n')}\n`);
console.log(path.relative(labRoot, out));
