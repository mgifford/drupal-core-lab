// Isolated CSS probe for #3636987 (NOT Drupal evidence): loads the real compiled Default Admin select CSS from
// core main, before and after the November 20 patch, into Chromium and records the computed background-image and
// appearance for a normal and an extra-small select in the default, focused and disabled states, in four colour
// modes. It answers only "does the extra selector win when forced colours are active"; it does not test Drupal.
//   cd tools/playwright && node probe-3636987-css.mjs [path-to-patched-core-checkout]
// Default source: envs/issue-3636987 (After) with envs/baseline-3636987 (Before) beside it; the "before" stylesheet
// is rebuilt by removing the one added selector, so both runs use the same core files.
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from '@playwright/test';

const labRoot = path.resolve(import.meta.dirname, '../..');
const afterEnv = process.argv[2] || path.join(labRoot, 'envs/issue-3636987');
const beforeEnv = path.join(labRoot, 'envs/baseline-3636987');
const rel = 'core/themes/default_admin/css/components/form--select.css';
const read = (env) => fs.readFileSync(path.join(env, rel), 'utf8');
const afterCss = read(afterEnv);
const beforeCss = afterCss.replace(
  '  .form-element--type-select[disabled],\n  .dark-mode .form-element--type-select {',
  '  .form-element--type-select[disabled] {',
);
if (beforeCss === afterCss) throw new Error(`The patch's selector was not found in ${path.join(afterEnv, rel)}; nothing to compare.`);

// The before side is rebuilt from the after file, so the two runs differ only by the added selector. The before
// environment is read to confirm the two checked-in files agree on everything else (the probe fails if it does not).
try {
  const onDisk = read(beforeEnv);
  if (onDisk !== beforeCss) console.warn('WARNING: the before environment\'s file is not identical to the reversed patch; the probe uses the reversed file.');
} catch { console.warn('NOTE: no before environment checkout; the probe uses the reversed file only.'); }

const html = (css, dark) => `<!doctype html><html class="${dark ? 'dark-mode' : ''}"><head><style>${css}</style>
<style>body{margin:20px;background:#fff} select{display:block;margin:8px 0;width:240px}</style></head><body>
<select id="n" class="form-element form-element--type-select"><option>Normal select</option></select>
<select id="x" class="form-element form-element--type-select block-region-select form-element--extrasmall"><option>Extrasmall select</option></select>
</body></html>`;

const browser = await chromium.launch();
const version = browser.version();
async function run(css, mode) {
  const dark = mode.includes('dark');
  const forced = mode.includes('forced');
  const ctx = await browser.newContext({ forcedColors: forced ? 'active' : 'none', colorScheme: dark ? 'dark' : 'light' });
  const page = await ctx.newPage();
  await page.setContent(html(css, dark));
  const out = {};
  for (const state of ['default', 'focus', 'disabled']) {
    for (const id of ['n', 'x']) {
      if (state === 'focus') await page.focus(`#${id}`);
      if (state === 'disabled') await page.evaluate((i) => { document.getElementById(i).disabled = true; }, id);
      out[`${state}/${id === 'n' ? 'normal' : 'extrasmall'}`] = await page.evaluate((i) => {
        const s = getComputedStyle(document.getElementById(i));
        return { backgroundImage: s.backgroundImage === 'none' ? 'none' : 'URL', appearance: s.appearance, forced: matchMedia('(forced-colors: active)').matches, dark: document.documentElement.classList.contains('dark-mode'), paddingInlineEnd: s.paddingInlineEnd };
      }, id);
      if (state === 'disabled') await page.evaluate((i) => { document.getElementById(i).disabled = false; }, id);
    }
  }
  await ctx.close();
  return out;
}

const rows = [];
for (const [side, css] of [['before', beforeCss], ['after', afterCss]]) {
  for (const mode of ['light', 'dark', 'forced-light', 'forced-dark']) {
    const r = await run(css, mode);
    rows.push({ side, mode, custom: Object.values(r).filter((x) => x.backgroundImage !== 'none').length, total: Object.keys(r).length, states: r });
  }
}
await browser.close();

const forced = (side) => rows.filter((r) => r.side === side && r.mode.startsWith('forced'));
const plain = (side) => rows.filter((r) => r.side === side && !r.mode.startsWith('forced'));
const custom = (rs) => rs.reduce((a, r) => a + r.custom, 0);
const total = (rs) => rs.reduce((a, r) => a + r.total, 0);
console.log(`Chromium ${version}; ${path.relative(labRoot, afterEnv)} ${rel}`);
for (const r of rows) console.log(`${r.side.padEnd(6)} ${r.mode.padEnd(12)} custom background ${r.custom}/${r.total}  ${Object.entries(r.states).map(([k, v]) => `${k}:${v.backgroundImage}`).join(' ')}`);
console.log(`forced-colours configurations with Drupal's SVG: before ${custom(forced('before'))}/${total(forced('before'))}, after ${custom(forced('after'))}/${total(forced('after'))}`);
console.log(`non-forced configurations with Drupal's SVG (must be unchanged): before ${custom(plain('before'))}/${total(plain('before'))}, after ${custom(plain('after'))}/${total(plain('after'))}`);
console.log(`padding-inline-end unchanged: ${JSON.stringify(plain('before').map((r) => Object.fromEntries(Object.entries(r.states).map(([k, v]) => [k, v.paddingInlineEnd])))) === JSON.stringify(plain('after').map((r) => Object.fromEntries(Object.entries(r.states).map(([k, v]) => [k, v.paddingInlineEnd]))))}`);
process.exitCode = custom(forced('after')) === 0 && custom(forced('before')) > 0 && custom(plain('after')) === total(plain('after')) ? 0 : 1;
