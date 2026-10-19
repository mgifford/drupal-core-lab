// Label evidence for #3587661: the "Include file in display" checkbox of a file field with "Enable Display field" on.
// On /node/add/article (recipes/repro_3587661: three file fields) it uploads a real .txt file into each field, then for each
// field's display checkbox records its <label> elements (text and class), aria-label, aria-labelledby, the accessible name
// Chromium computes (ariaSnapshot), axe-core's "label" result and all WCAG 2.0 to 2.2 A/AA violations, the theme that rendered
// the form, and a screenshot of each field. One site per run; run it on Before and on each After.
// No Guidepup virtual screen reader here: on 2026-10-19 (html-aria 0.5.3, jsdom 30) it announced a checkbox as "textbox".
//   node tools/playwright/label-3587661.mjs --url <site> --side before|after-mr|after-proposal [--login <one-time link>] [--chromium <path>]
// The one-time link comes from `core/scripts/dr user:login --uid=1 --url=<site>` (or `ddev drupal login`); it is used, not saved.
// Writes reports/issues/3587661/playwright/<stamp>-<side>/ (results.json, SUMMARY.md, <field>.png).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { labRoot } from '../compare/lib.mjs';

const arg = (n) => { const i = process.argv.indexOf(`--${n}`); return i > 0 ? process.argv[i + 1] : undefined; };
const base = (arg('url') || '').replace(/\/$/, ''), side = arg('side'), login = arg('login');
if (!base || !['before', 'after-mr', 'after-proposal'].includes(side)) { console.error('usage: --url <site> --side before|after-mr|after-proposal [--login <one-time link>] [--chromium <path>]'); process.exit(2); }
const FIELDS = [
  { name: 'field_files_two', what: 'two values, not required' },
  { name: 'field_files_required', what: 'two values, required' },
  { name: 'field_file_single', what: 'one value (control)' },
];
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const out = path.join(labRoot, 'reports/issues/3587661/playwright', `${stamp}-${side}`);
fs.mkdirSync(out, { recursive: true });
const upload = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'lab-3587661-')), 'lab-3587661.txt');
fs.writeFileSync(upload, 'A small text file for #3587661.\n');

const browser = await chromium.launch(arg('chromium') ? { executablePath: arg('chromium') } : {});
const page = await (await browser.newContext({ viewport: { width: 1280, height: 900 } })).newPage();   // axe-core needs a page from a context
if (login) await page.goto(login);
const resp = await page.goto(`${base}/node/add/article`);
if (!resp || resp.status() !== 200 || !(await page.locator(`input[type=file][name^="files[${FIELDS[0].name}_0]"]`).count())) {
  console.error(`The article form or its file fields did not load (HTTP ${resp && resp.status()}). Apply recipes/repro_3587661 and log in with --login.`); await browser.close(); process.exit(1);
}
const theme = await page.evaluate(() => (window.drupalSettings && drupalSettings.ajaxPageState && drupalSettings.ajaxPageState.theme) || null);

// Real file input: the widget uploads by AJAX on change and then shows the file with its Remove button and display checkbox.
// Right after one upload's response, Drupal can drop the change event of the next file input (seen on 11.x: the second
// field never uploaded), so an upload that shows no display checkbox within 8 seconds is set again, up to 3 times, and the
// attempts are recorded.
const ajaxIdle = () => page.waitForFunction(() => !document.querySelector('.ajax-progress') && !(window.jQuery && window.jQuery.active), null, { timeout: 30000 });
const attempts = {};
for (const f of FIELDS) {
  for (attempts[f.name] = 1; ; attempts[f.name]++) {
    await ajaxIdle();
    await page.locator(`input[type=file][name^="files[${f.name}_0]"]`).setInputFiles(upload);
    try { await page.locator(`input[name="${f.name}[0][display]"]`).waitFor({ state: 'attached', timeout: 8000 }); break; }
    catch (e) { if (attempts[f.name] >= 3) throw e; }
  }
}
await ajaxIdle();

const results = [];
for (const f of FIELDS) {
  const box = page.locator(`input[name="${f.name}[0][display]"]`);
  const info = await box.evaluate((el) => ({
    id: el.id, type: el.type, checked: el.checked,
    labels: [...(el.labels || [])].map((l) => ({ text: l.textContent.replace(/\s+/g, ' ').trim(), class: l.className, visible: !!(l.offsetWidth || l.offsetHeight) && getComputedStyle(l).clip !== 'rect(0px, 0px, 0px, 0px)' && !l.classList.contains('visually-hidden') })),
    ariaLabel: el.getAttribute('aria-label'), ariaLabelledby: el.getAttribute('aria-labelledby'),
    inTable: !!el.closest('table'), columnHeader: (() => { const td = el.closest('td'); const table = el.closest('table'); if (!td || !table) return null; const i = [...td.parentElement.children].indexOf(td); const th = table.querySelectorAll('thead th')[i]; return th ? th.textContent.replace(/\s+/g, ' ').trim() : null; })(),
  }));
  const snap = await box.ariaSnapshot().catch(() => '');
  const name = ((snap.match(/checkbox "([^"]*)"/) || [])[1]) ?? '';
  const region = page.locator(`[data-drupal-selector="edit-${f.name.replace(/_/g, '-')}-wrapper"]`);
  const shot = `${f.name}.png`;
  if (await region.count()) await region.screenshot({ path: path.join(out, shot) }).catch(() => {});
  results.push({ ...f, ...info, uploadAttempts: attempts[f.name], ariaSnapshot: snap.trim(), accessibleName: name, screenshot: fs.existsSync(path.join(out, shot)) ? shot : null });
}
const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
const labelRule = axe.violations.find((v) => v.id === 'label');
const res = { issue: '3587661', side, url: `${base}/node/add/article`, when: new Date().toISOString(), browser: browser.version(), theme, fields: results,
  axe: { version: axe.testEngine.version, violations: axe.violations.map((v) => ({ id: v.id, impact: v.impact, targets: v.nodes.map((n) => n.target.join(' ')) })),
    labelTargets: labelRule ? labelRule.nodes.map((n) => n.target.join(' ')) : [] } };
await browser.close();

fs.writeFileSync(path.join(out, 'results.json'), `${JSON.stringify(res, null, 2)}\n`);
const cell = (s) => String(s ?? '').replace(/\|/g, '\\|');
const md = [`# #3587661 display checkbox label, ${side} (DRAFT)`, '',
  `${res.when}, ${res.url}, Chromium ${res.browser}, theme \`${theme}\`, axe-core ${res.axe.version}. A real .txt file was uploaded into each field first.`, '',
  '| Field | In the multiple-value table | `<label>` (class) | aria-label | Accessible name (Chromium) | axe "label" |', '|---|---|---|---|---|---|',
  ...results.map((r) => `| ${r.name} (${r.what}) | ${r.inTable ? `yes, column "${cell(r.columnHeader)}"` : 'no'} | ${r.labels.length ? r.labels.map((l) => `"${cell(l.text)}" (${cell(l.class) || 'no class'})`).join(', ') : '**none**'} | ${r.ariaLabel ? `"${cell(r.ariaLabel)}"` : 'none'} | ${r.accessibleName ? `"${cell(r.accessibleName)}"` : '**empty**'} | ${res.axe.labelTargets.some((t) => t.includes(r.id)) ? '**fails**' : 'passes'} |`),
  '', `All axe violations (WCAG 2.0 to 2.2 A/AA): ${res.axe.violations.length ? res.axe.violations.map((v) => `${v.id} (${v.targets.length})`).join(', ') : 'none'}.`, '',
  'Screenshots: ' + results.filter((r) => r.screenshot).map((r) => `[${r.name}](${r.screenshot})`).join(', ') + '.', ''].join('\n');
fs.writeFileSync(path.join(out, 'SUMMARY.md'), md);
console.log(md);
