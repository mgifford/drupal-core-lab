#!/usr/bin/env node
/**
 * Configuration matrix for #3466040. One side per invocation, one login, many viewports /
 * zoom levels / colour preferences. Use review-3466040.mjs for the full Before+After run with
 * keyboard, repeated open/close and ResizeObserver lifecycle evidence; this script only answers
 * "does the dialog stay inside the viewport in this configuration, and is the action visible and
 * reachable?".
 *
 *   node tools/playwright/matrix-3466040.mjs 3466040-regression-pinned --side=after
 *   node tools/playwright/matrix-3466040.mjs 3466040-regression-pinned --side=before
 *   node tools/playwright/matrix-3466040.mjs 3466040-regression-pinned --side=after --only=zoom400,dark
 *
 * --zoom is the reflow-equivalent emulation (CSS viewport = source viewport / zoom). It is NOT a
 * real browser zoom: devicePixelRatio is unchanged and text is not rasterised at the zoom size.
 * Real Ctrl/Cmd +/- zoom remains a manual check.
 */
import fs from 'node:fs';
import path from 'node:path';
import { runArgs, launch, openSide, gitInfo } from './lib/lab-run.mjs';
import { installCapture, measureDialog, keyboardReach } from './evaluate-3466040.mjs';

const NID = '3466040';
const argv = process.argv.slice(2);
const opt = (n, d) => { const a = argv.find((x) => x.startsWith(`--${n}=`)); return a ? a.slice(n.length + 3) : d; };
const has = (n) => argv.includes(`--${n}`);
const sleep = (p, ms) => p.waitForTimeout(ms);
const round = (n) => Math.round(Number(n) * 10) / 10;

// Each config: viewport in CSS px, plus context preferences.
const CONFIGS = [
  { name: 'light-1920x1080', viewport: { width: 1920, height: 1080 } },
  { name: 'light-1280x720', viewport: { width: 1280, height: 720 } },
  { name: 'light-1024x768', viewport: { width: 1024, height: 768 } },
  { name: 'light-480x900', viewport: { width: 480, height: 900 } },
  { name: 'light-320x900', viewport: { width: 320, height: 900 } },
  { name: 'zoom90-1920x1080', viewport: { width: 2133, height: 1200 }, zoom: 90 },
  { name: 'zoom110-1920x1080', viewport: { width: 1745, height: 982 }, zoom: 110 },
  { name: 'zoom125-1920x1080', viewport: { width: 1536, height: 864 }, zoom: 125 },
  { name: 'zoom200-1920x1080', viewport: { width: 960, height: 540 }, zoom: 200 },
  { name: 'zoom400-1920x1080', viewport: { width: 480, height: 270 }, zoom: 400 },
  { name: 'dark-1024x768', viewport: { width: 1024, height: 768 }, colorScheme: 'dark' },
  { name: 'forced-colours-1024x768', viewport: { width: 1024, height: 768 }, forcedColors: 'active' },
  { name: 'reduced-motion-1024x768', viewport: { width: 1024, height: 768 }, reducedMotion: 'reduce' },
];

async function quick(page) {
  return page.evaluate(() => {
    const visible = (el) => { try { return el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }); } catch { return el.offsetHeight > 0; } };
    const d = [...document.querySelectorAll('.ui-dialog')].filter(visible).pop();
    if (!d) return { dialog: false };
    const r = d.getBoundingClientRect();
    const c = d.querySelector('.ui-dialog-content');
    const p = d.querySelector('.ui-dialog-buttonpane');
    const close = d.querySelector('.ui-dialog-titlebar-close');
    const cr = close ? close.getBoundingClientRect() : null;
    const pr = p ? p.getBoundingClientRect() : null;
    const btn = d.querySelector('.ui-dialog-buttonpane button');
    const br = btn ? btn.getBoundingClientRect() : null;
    const hit = (el) => {
      if (!el) return null;
      const x = el.getBoundingClientRect(); const cx = Math.round(x.left + x.width / 2); const cy = Math.round(x.top + x.height / 2);
      if (cx < 0 || cy < 0 || cx >= innerWidth || cy >= innerHeight) return false;
      const top = document.elementFromPoint(cx, cy);
      return !!top && (top === el || el.contains(top));
    };
    return {
      dialog: true,
      viewport: { width: innerWidth, height: innerHeight, dpr: devicePixelRatio },
      rect: { top: Math.round(r.top * 10) / 10, bottom: Math.round(r.bottom * 10) / 10, height: Math.round(r.height * 10) / 10, width: Math.round(r.width * 10) / 10 },
      fits: r.top >= -1 && r.bottom <= innerHeight + 1,
      overflowBottomPx: Math.round(Math.max(0, r.bottom - innerHeight) * 10) / 10,
      overflowTopPx: Math.round(Math.max(0, -r.top) * 10) / 10,
      content: c ? { clientHeight: c.clientHeight, scrollHeight: c.scrollHeight, scrollableY: c.scrollHeight > c.clientHeight + 1, overflowY: getComputedStyle(c).overflowY } : null,
      titlebarInViewport: (() => { const t = d.querySelector('.ui-dialog-titlebar'); if (!t) return null; const q = t.getBoundingClientRect(); return q.top >= -0.5 && q.bottom <= innerHeight + 0.5; })(),
      closeInViewport: cr ? cr.top >= -0.5 && cr.bottom <= innerHeight + 0.5 && cr.left >= -0.5 && cr.right <= innerWidth + 0.5 : null,
      closeHittable: hit(close),
      paneInViewport: pr ? pr.top >= -0.5 && pr.bottom <= innerHeight + 0.5 : null,
      primary: br ? { label: (btn.innerText || btn.value || '').trim(), inViewport: br.top >= -0.5 && br.bottom <= innerHeight + 0.5 && br.left >= -0.5 && br.right <= innerWidth + 0.5, hittable: hit(btn), rect: { top: Math.round(br.top * 10) / 10, bottom: Math.round(br.bottom * 10) / 10 } } : null,
      media: {
        forcedColors: matchMedia('(forced-colors: active)').matches,
        prefersDark: matchMedia('(prefers-color-scheme: dark)').matches,
        reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
      },
      active: { desc: (document.activeElement?.tagName || '') + (document.activeElement?.id ? `#${document.activeElement.id}` : ''), text: (document.activeElement?.innerText || '').trim().slice(0, 40) },
    };
  });
}

async function runConfig({ browser, side, base, storageState, cfg, out, initialPage }) {
  const errors = [];
  let page;
  if (cfg.colorScheme || cfg.forcedColors || cfg.reducedMotion) {
    const ctx = await browser.newContext({
      viewport: cfg.viewport,
      ignoreHTTPSErrors: true,
      storageState,
      colorScheme: cfg.colorScheme || 'light',
      forcedColors: cfg.forcedColors || 'none',
      reducedMotion: cfg.reducedMotion || 'no-preference',
    });
    page = await ctx.newPage();
    await installCapture(page);
  } else {
    page = initialPage;
    await page.setViewportSize(cfg.viewport);
  }
  page.setDefaultTimeout(60000);
  page.on('console', (m) => { if (m.type() === 'error') errors.push({ type: 'console', text: m.text().slice(0, 300) }); });
  page.on('pageerror', (e) => { if (!/ResizeObserver loop/.test(String(e.message))) errors.push({ type: 'pageerror', text: String(e.message).slice(0, 300) }); });

  const rec = { name: cfg.name, viewport: cfg.viewport, zoom: cfg.zoom || null, requested: { colorScheme: cfg.colorScheme || 'light', forcedColors: cfg.forcedColors || 'none', reducedMotion: cfg.reducedMotion || 'no-preference' }, errors, stages: {} };
  try {
    await page.goto(`${base}/dialog_renderer-test-links`, { waitUntil: 'load', timeout: 60000 });
    const link = page.getByRole('link', { name: 'Details modal!' });
    if (!(await link.count())) throw new Error('Details modal! link missing');
    await link.click();
    await page.locator('.ui-dialog').last().waitFor({ state: 'visible', timeout: 30000 });
    await sleep(page, 500);
    rec.stages.open = await quick(page);

    await page.locator('.ui-dialog').last().locator('summary').first().click();
    await sleep(page, 700);
    rec.stages.expanded = await quick(page);

    // Real Tab from the summary to the action button.
    rec.keyboard = await keyboardReach(page, { maxTabs: 12 });

    await page.screenshot({ path: path.join(out, `${side}-${cfg.name}-expanded.png`) }).catch(() => {});
    rec.screenshot = `${side}-${cfg.name}-expanded.png`;

    await page.keyboard.press('Escape').catch(() => {});
    await sleep(page, 200);
  } catch (error) {
    rec.error = String(error.message).slice(0, 400);
  } finally {
    if (page !== initialPage) await page.context().close().catch(() => {});
  }
  return rec;
}

async function main() {
  const run = runArgs({ slug: '3466040-regression-pinned', viewport: '1024x768' });
  const side = opt('side', 'after');
  if (!['before', 'after'].includes(side)) throw new Error('--side must be before or after');
  const only = opt('only', '');
  const configs = only ? CONFIGS.filter((c) => only.split(',').includes(c.name)) : CONFIGS;
  if (!configs.length) throw new Error(`--only matched no config. Names: ${CONFIGS.map((c) => c.name).join(', ')}`);
  const out = opt('out', '') || path.join(run.out, `matrix-${side}`);
  fs.mkdirSync(out, { recursive: true });

  const launched = await launch(run);
  run.browser = launched.browser;
  const { page, base, rec } = await openSide(run, side);
  await installCapture(page);
  await page.goto(`${base}/user`, { waitUntil: 'load', timeout: 60000 }).catch(() => {});
  const storageState = await page.context().storageState();

  const results = {
    schema: 'drupal-core-lab/review-3466040-matrix/1',
    issue: NID,
    mr: '!9088',
    reviewedRevision: 'aed1df5eeddf0b89c91bab47eb83847f44c58211',
    variant: run.v.slug,
    side,
    env: run.v[side].env,
    commit: gitInfo(run.v[side].env),
    when: new Date().toISOString(),
    browser: { name: launched.environment.browser, version: launched.environment.browserVersion, os: launched.environment.os },
    zoomMethod: 'reflow-equivalent CSS viewport (source viewport / zoom factor); NOT real browser zoom; devicePixelRatio unchanged',
    selector: { dialog: '.ui-dialog', titlebar: '.ui-dialog-titlebar', close: '.ui-dialog-titlebar-close', content: '.ui-dialog-content', buttonPane: '.ui-dialog-buttonpane', primary: '.ui-dialog-buttonpane button', summary: '.ui-dialog details summary', fixtureLink: 'a[href="/dialog_renderer-content-details"]' },
    configs: [],
  };

  for (const cfg of configs) {
    console.log(`  ${side} ${cfg.name} ${cfg.viewport.width}x${cfg.viewport.height}${cfg.zoom ? ` (zoom ${cfg.zoom}%)` : ''}`);
    const r = await runConfig({ browser: run.browser, side, base, storageState, cfg, out, initialPage: page });
    results.configs.push(r);
    console.log(`    fits=${r.stages.expanded?.fits} overflow=${r.stages.expanded?.overflowBottomPx} primary=${r.stages.expanded?.primary?.inViewport}`);
  }
  await page.context().close().catch(() => {});
  await rec.close(out).catch(() => {});
  await launched.browser.close().catch(() => {});

  const lines = [
    `# #3466040 configuration matrix — ${side} (${run.v[side].env})`,
    '',
    `Run ${results.when}. Core \`${results.commit}\`. ${results.browser.name} ${results.browser.version} on ${results.browser.os}. Variant \`${results.variant}\`.`,
    '',
    `Zoom is ${results.zoomMethod}.`,
    '',
    '| Config | CSS viewport | Dialog top→bottom | Fits | Overflow px | Content client/scroll | Titlebar | Close | Button pane | Primary button | Primary hittable | Keyboard: primary in viewport | Media matched |',
    '|---|---|---|---|---|---|---|---|---|---|---|---|---|',
  ];
  for (const r of results.configs) {
    const e = r.stages.expanded || {};
    const k = r.keyboard || {};
    lines.push(`| ${r.name} | ${e.viewport ? `${e.viewport.width}x${e.viewport.height}` : '–'} | ${e.rect ? `${e.rect.top}→${e.rect.bottom} (h ${e.rect.height})` : 'no dialog'} | ${e.fits} | ${e.overflowBottomPx} | ${e.content ? `${e.content.clientHeight}/${e.content.scrollHeight}` : '–'} | ${e.titlebarInViewport} | ${e.closeInViewport} | ${e.paneInViewport} | ${e.primary ? e.primary.inViewport : '–'} | ${e.primary ? e.primary.hittable : '–'} | ${k.primaryInViewport} | forced=${e.media?.forcedColors}, dark=${e.media?.prefersDark}, reduced=${e.media?.reducedMotion} |${r.error ? ` ERROR: ${r.error} |` : ''}`);
  }
  lines.push('');
  lines.push('| Config | Console/page errors |');
  lines.push('|---|---|');
  for (const r of results.configs) lines.push(`| ${r.name} | ${r.errors.length ? r.errors.map((x) => x.text).join('; ') : '0'} |`);
  lines.push('');
  lines.push('---');
  lines.push('Automated matrix. The Tab walk is not a person\'s keyboard pass; no screen reader ran; zoom is reflow-equivalent emulation.');
  const md = lines.join('\n');
  fs.writeFileSync(path.join(out, 'results.json'), `${JSON.stringify(results, null, 2)}\n`);
  fs.writeFileSync(path.join(out, 'SUMMARY.md'), `${md}\n`);
  console.log(`\n${out}`);
}

main().catch((e) => { console.error(e && e.stack ? e.stack : e); process.exit(1); });
