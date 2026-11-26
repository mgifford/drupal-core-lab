// Accessibility probe for #3606655 (MR !16432 @ 170be9e3).
// Real input (Playwright keyboard), axe-core, accessibility tree, screenshots.
//
//   node reports/issues/3606655/tests/probe-a11y.mjs --base=https://repro-issue-3606655.ddev.site \
//     --side=after --outdir=reports/issues/3606655/playwright
//
// Logs in as admin / admin through the form. Writes JSON + PNGs.

import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const argv = Object.fromEntries(process.argv.slice(2).map((a) => {
  const [k, ...v] = a.replace(/^--/, '').split('=');
  return [k, v.join('=')];
}));
const BASE = (argv.base || '').replace(/\/$/, '');
const SIDE = argv.side || 'after';
const OUT = argv.outdir || 'reports/issues/3606655/playwright';
const AXE = path.resolve('node_modules/axe-core/axe.min.js');
fs.mkdirSync(OUT, { recursive: true });

const result = { side: SIDE, base: BASE, at: new Date().toISOString(), checks: {}, axe: {}, screenshots: [] };

async function login(page) {
  await page.goto(`${BASE}/user/login`, { waitUntil: 'domcontentloaded' });
  await page.fill('#edit-name', 'admin');
  await page.fill('#edit-pass', 'admin');
  await Promise.all([page.waitForLoadState('domcontentloaded'), page.click('#edit-submit')]);
  return !/user\/login/.test(page.url());
}

async function axe(page, label) {
  await page.addScriptTag({ path: AXE });
  const res = await page.evaluate(async () => {
    const r = await window.axe.run(document, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] },
    });
    return {
      violations: r.violations.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length, help: v.help })),
      passes: r.passes.length,
      incomplete: r.incomplete.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length })),
    };
  }).catch((e) => ({ error: String(e) }));
  result.axe[label] = res;
}

async function shot(page, name) {
  const file = path.join(OUT, `${SIDE}-${name}.png`);
  await page.screenshot({ path: file, fullPage: false });
  result.screenshots.push(file);
  return file;
}

async function main() {
  const browser = await chromium.launch({ channel: 'chrome' });
  for (const scheme of ['light', 'dark']) {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, colorScheme: scheme });
    const page = await context.newPage();
    const ok = await login(page);
    result.checks[`login-${scheme}`] = ok;
    if (!ok) { await context.close(); continue; }

    await page.goto(`${BASE}/user/edit`, { waitUntil: 'domcontentloaded' });
    const groups = page.locator('#edit-color-scheme--wrapper');
    result.checks[`fieldset-${scheme}`] = await groups.count();

    if (await groups.count()) {
      const fieldset = groups.first();
      await fieldset.scrollIntoViewIfNeeded();
      await shot(page, `profile-color-scheme-${scheme}`);

      result.checks[`group-name-${scheme}`] = await fieldset.evaluate((el) => {
        const legend = el.querySelector('legend');
        return { tag: el.tagName, legend: legend ? legend.textContent.trim() : null, ariaLabel: el.getAttribute('aria-label') };
      });
      result.checks[`description-${scheme}`] = await fieldset.evaluate((el) => {
        const id = el.getAttribute('aria-describedby');
        const d = id ? document.getElementById(id) : null;
        return { describedBy: id, text: d ? d.textContent.trim() : null };
      });
      result.checks[`radios-${scheme}`] = await fieldset.evaluate((el) => [...el.querySelectorAll('input[type=radio]')].map((r) => ({
        value: r.value,
        checked: r.checked,
        disabled: r.disabled,
        label: (el.querySelector(`label[for="${r.id}"]`) || {}).textContent?.trim() || null,
        accessibleName: (el.querySelector(`label[for="${r.id}"]`) || {}).textContent?.trim() || null,
      })));

      // Keyboard: Tab from the legend into the group, then arrows and space.
      await fieldset.scrollIntoViewIfNeeded();
      await page.locator('#edit-color-scheme-light').focus();
      const before = await page.evaluate(() => ({ id: document.activeElement.id, checked: document.querySelector('input[name="color_scheme"]:checked')?.value }));
      const outline = await page.evaluate(() => {
        const el = document.activeElement;
        const cs = getComputedStyle(el);
        return { outline: `${cs.outlineStyle} ${cs.outlineWidth} ${cs.outlineColor}`, boxShadow: cs.boxShadow, active: el.id };
      });
      await page.keyboard.press('ArrowDown');
      const afterDown = await page.evaluate(() => ({ id: document.activeElement.id, checked: document.querySelector('input[name="color_scheme"]:checked')?.value }));
      await page.keyboard.press('ArrowRight');
      const afterRight = await page.evaluate(() => ({ id: document.activeElement.id, checked: document.querySelector('input[name="color_scheme"]:checked')?.value }));
      await page.keyboard.press(' ');
      const afterSpace = await page.evaluate(() => ({ id: document.activeElement.id, checked: document.querySelector('input[name="color_scheme"]:checked')?.value }));
      result.checks[`keyboard-${scheme}`] = { before, outline, afterDown, afterRight, afterSpace };

      // Tab order: does Tab reach each radio, and does Shift+Tab come back?
      await page.evaluate(() => document.querySelector('#edit-color-scheme-light').focus());
      const order = [];
      for (let i = 0; i < 4; i++) {
        await page.keyboard.press('Tab');
        order.push(await page.evaluate(() => ({ tag: document.activeElement.tagName, id: document.activeElement.id, name: document.activeElement.name || null })));
      }
      result.checks[`tab-order-${scheme}`] = order;

      // Accessibility tree of the group.
      result.checks[`aria-snapshot-${scheme}`] = await fieldset.ariaSnapshot().catch((e) => String(e));

      await axe(page, `profile-${scheme}`);
    }
    else {
      // Before the patch there is no fieldset: still capture the form area.
      await page.locator('#edit-user-settings, fieldset').first().scrollIntoViewIfNeeded().catch(() => {});
      await shot(page, `profile-no-color-scheme-${scheme}`);
      await axe(page, `profile-${scheme}`);
    }
    await context.close();
  }

  // Forced colours, light scheme, same page.
  const forced = await browser.newContext({ viewport: { width: 1280, height: 900 }, colorScheme: 'light', forcedColors: 'active' });
  const fp = await forced.newPage();
  if (await login(fp)) {
    await fp.goto(`${BASE}/user/edit`, { waitUntil: 'domcontentloaded' });
    const group = fp.locator('#edit-color-scheme--wrapper');
    if (await group.count()) {
      await group.first().scrollIntoViewIfNeeded();
      await shot(fp, 'profile-color-scheme-forced-colours');
      result.checks['forced-colours-border'] = await group.first().evaluate((el) => {
        const input = el.querySelector('input[type=radio]:checked') || el.querySelector('input[type=radio]');
        const cs = getComputedStyle(input);
        return { border: `${cs.borderWidth} ${cs.borderStyle} ${cs.borderColor}`, appearance: cs.appearance, forcedColorAdjust: cs.forcedColorAdjust };
      });
    }
    await axe(fp, 'profile-forced-colours');
  }
  await forced.close();

  // Narrow viewport (320 CSS px = reflow at 400%).
  const narrow = await browser.newContext({ viewport: { width: 320, height: 900 }, colorScheme: 'light' });
  const np = await narrow.newPage();
  if (await login(np)) {
    await np.goto(`${BASE}/user/edit`, { waitUntil: 'domcontentloaded' });
    const group = np.locator('#edit-color-scheme--wrapper');
    if (await group.count()) {
      await group.first().scrollIntoViewIfNeeded();
      await shot(np, 'profile-color-scheme-320px');
      result.checks['reflow'] = await np.evaluate(() => ({
        viewport: window.innerWidth,
        scrollWidth: document.documentElement.scrollWidth,
        overflows: document.documentElement.scrollWidth > window.innerWidth + 1,
        radioBox: (() => { const r = document.querySelector('#edit-color-scheme-auto')?.getBoundingClientRect(); return r ? { w: Math.round(r.width), h: Math.round(r.height) } : null; })(),
      }));
    }
  }
  await narrow.close();

  await browser.close();
  const out = path.join(OUT, `a11y-${SIDE}.json`);
  fs.writeFileSync(out, `${JSON.stringify(result, null, 2)}\n`);
  console.log(`wrote ${out}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
