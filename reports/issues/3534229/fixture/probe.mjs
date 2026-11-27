/**
 * Probe: what actually happens to CKEditor-style icons in forced-colors mode,
 * and which CSS scoping mechanisms are usable for the fix.
 *
 * Run: node reports/issues/3534229/fixture/probe.mjs
 * Writes: probe-results.json next to this file.
 */
import { createRequire } from 'node:module';
// The lab's own Playwright (tools/playwright) matches the browsers installed on this machine.
const require = createRequire(new URL('../../../../tools/playwright/package.json', import.meta.url));
const { chromium, firefox } = require('playwright');
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const url = 'file://' + path.join(here, 'probe.html');
const modes = [
  { name: 'normal-light', colorScheme: 'light', forcedColors: 'none' },
  { name: 'normal-dark', colorScheme: 'dark', forcedColors: 'none' },
  { name: 'forced-light', colorScheme: 'light', forcedColors: 'active' },
  { name: 'forced-dark', colorScheme: 'dark', forcedColors: 'active' },
];

const PROBES = {
  'p-bg-image': 'existing background-image icon',
  'p-mask-el': 'whole-element mask on CanvasText',
  'p-mask-pseudo': 'dedicated ::before mask on CanvasText',
  'p-mask-chip': 'whole-element mask over #eee chip',
  'p-text-pseudo': 'text ::before (Heading/Style/Language shape)',
  'p-sq-on-icon': 'style-query: property set on ancestor',
  'p-sq-off-icon': 'style-query: no property (control)',
  'p-sq-url-icon': 'style-query with url() value match',
};

function luminance([r, g, b]) {
  const f = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}
function contrast(a, b) {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

async function analyse(helper, buffer) {
  const b64 = buffer.toString('base64');
  return helper.evaluate(async (data) => {
    const img = new Image();
    img.src = 'data:image/png;base64,' + data;
    await img.decode();
    const c = document.createElement('canvas');
    c.width = img.width; c.height = img.height;
    const ctx = c.getContext('2d');
    ctx.drawImage(img, 0, 0);
    const d = ctx.getImageData(0, 0, c.width, c.height).data;
    const counts = new Map();
    for (let i = 0; i < d.length; i += 4) {
      const k = `${d[i]},${d[i + 1]},${d[i + 2]}`;
      counts.set(k, (counts.get(k) || 0) + 1);
    }
    const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
    const total = c.width * c.height;
    return {
      size: [c.width, c.height],
      colours: sorted.slice(0, 8).map(([k, n]) => ({ rgb: k.split(',').map(Number), share: +(n / total).toFixed(3) })),
      distinct: sorted.length,
    };
  }, b64);
}

const results = { url, modes: {} };
for (const [browserName, engine] of [['chromium', chromium], ['firefox', firefox]]) {
  let browser;
  results.modes[browserName] = {};
  try {
    browser = await engine.launch({ args: browserName === 'chromium' ? ['--no-sandbox', '--disable-gpu'] : [] });
  } catch (e) {
    results.modes[browserName] = { error: String(e).slice(0, 300) };
    continue;
  }
  try {
  const helper = await browser.newPage();
  await helper.setContent('<!doctype html><html><body></body></html>');
  results.modes[browserName] = { version: browser.version(), scenarios: {} };
  for (const mode of modes) {
    const ctx = await browser.newContext({
      viewport: { width: 900, height: 500 },
      colorScheme: mode.colorScheme,
      forcedColors: mode.forcedColors,
    });
    const page = await ctx.newPage();
    await page.goto(url);
    const media = await page.evaluate(() => ({
      forced: matchMedia('(forced-colors: active)').matches,
      dark: matchMedia('(prefers-color-scheme: dark)').matches,
    }));
    const system = {};
    for (const cls of ['c-canvas', 'c-canvastext', 'c-buttonface', 'c-buttontext', 'c-linktext', 'c-graytext']) {
      system[cls.replace('c-', '')] = await page.locator('.' + cls).evaluate((el) => getComputedStyle(el).backgroundColor);
    }
    const computed = {};
    for (const id of Object.keys(PROBES)) {
      computed[id] = await page.locator('#' + id).evaluate((el) => {
        const s = getComputedStyle(el);
        const b = getComputedStyle(el, '::before');
        return {
          backgroundColor: s.backgroundColor,
          backgroundImage: s.backgroundImage,
          color: s.color,
          maskImage: s.maskImage,
          maskRepeat: s.maskRepeat,
          maskSize: s.maskSize,
          beforeContent: b.content,
          beforeBackgroundColor: b.backgroundColor,
          beforeMaskImage: b.maskImage,
        };
      });
    }
    const pixels = {};
    for (const id of Object.keys(PROBES)) {
      const box = await page.locator('#' + id).boundingBox();
      if (!box) { pixels[id] = null; continue; }
      const shot = await page.screenshot({ clip: { x: Math.round(box.x), y: Math.round(box.y), width: Math.round(box.width), height: Math.round(box.height) } });
      const a = await analyse(helper, shot);
      const main = a.colours[0]?.rgb || [0, 0, 0];
      const icon = a.colours.slice(1).find((c) => c.share > 0.01)?.rgb;
      pixels[id] = {
        distinct: a.distinct,
        iconVisibleByPixels: a.distinct > 1,
        dominant: main,
        icon: icon || null,
        contrast: icon ? +contrast(main, icon).toFixed(2) : null,
      };
    }
    // Focus outline: does a mask clip it?
    const focus = {};
    for (const id of ['p-focus-pseudo', 'p-focus-el']) {
      await page.locator('#' + id).focus();
      const box = await page.locator('#' + id).boundingBox();
      const pad = 6;
      const shot = await page.screenshot({ clip: { x: Math.round(box.x - pad), y: Math.round(box.y - pad), width: Math.round(box.width + pad * 2), height: Math.round(box.height + pad * 2) } });
      const a = await analyse(helper, shot);
      // The outline colour should appear; count pixels that differ from the dominant background.
      focus[id] = { distinct: a.distinct, colours: a.colours.slice(0, 4) };
    }
    await page.screenshot({ path: path.join(here, `probe-${browserName}-${mode.name}.png`), fullPage: true });
    results.modes[browserName].scenarios[mode.name] = { media, system, computed, pixels, focus };
    await ctx.close();
  }
  } catch (e) { results.modes[browserName].error = String(e).slice(0, 400); }
  await browser.close();
}
fs.writeFileSync(path.join(here, 'probe-results.json'), JSON.stringify(results, null, 2) + '\n');
console.log(JSON.stringify(results, null, 2));
