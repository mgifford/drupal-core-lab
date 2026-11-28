#!/usr/bin/env node
/**
 * Measures the #3637246 (MR !17909) CSS against the #3534229 forced-colours
 * mask correction, using the standalone fixture next to this script.
 *
 * Run from the lab root:
 *   node reports/issues/3534229/compat-3637246/measure.mjs
 *
 * Writes:
 *   reports/issues/3534229/COMPATIBILITY-3637246.json
 *   reports/issues/3534229/compat-3637246-<context>.png  (one screenshot per context)
 *
 * Uses the lab's own Playwright install (Chromium only; Firefox crashes on this
 * machine, see reports/issues/3534229/fixture/probe.mjs).
 */
import { createRequire } from 'node:module';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const require = createRequire('/Users/mgifford/drupal-core-lab/tools/playwright/package.json');
const { chromium } = require('playwright');

const here = path.dirname(fileURLToPath(import.meta.url));
const reportDir = path.resolve(here, '..');
const fixtureUrl = 'file://' + path.join(here, 'index.html');
const outFile = path.join(reportDir, 'COMPATIBILITY-3637246.json');

const CORE_COMMIT = '8a7df6cc3e69b6b5d427cb25ce8f66dda8393c29';
const MR = {
  project: 'drupal',
  iid: '17909',
  branch: '3637246-ckeditor5-buttons-styling',
  head: '5917a35e0aaedcdc0403349b335cea6297833c99',
  target: 'main',
  file: 'core/modules/ckeditor5/css/toolbar.admin.css',
  diffBytes: 1095,
  diffSha256: '112c8136269dbbb9008c80d160a00ddb09ada1048e2f036726a3bb37069bbc30',
  baseBlob: '40b04dd951244e04e41468289d5ce8a86f137361',
  patchedBlobFromDiffHeader: '991972ac12f9274f127ede6089acb097e3d12dc7',
  note: 'Base blob equals the pinned core blob (verified with git rev-parse). The MR patch was not applied.',
};

const CONTEXTS = [
  { id: 'normal-light', colorScheme: 'light', forcedColors: 'none', darkMode: 'auto' },
  { id: 'normal-dark', colorScheme: 'dark', forcedColors: 'none', darkMode: 'auto' },
  { id: 'forced-light', colorScheme: 'light', forcedColors: 'active', darkMode: 'auto' },
  { id: 'forced-dark', colorScheme: 'dark', forcedColors: 'active', darkMode: 'auto' },
  {
    id: 'forced-light-dark-mode',
    colorScheme: 'light',
    forcedColors: 'active',
    darkMode: 'force',
    note: 'Default Admin dark mode set explicitly while the OS forced palette is light.',
  },
];

const BUTTON_PROBES = [
  {
    id: 'a-bg-image-current',
    role: 'core: black SVG background-image, no invert (control)',
  },
  {
    id: 'b-bg-image-invert',
    role: 'core background-image + MR !17909 .dark-mode filter: invert(1)',
  },
  {
    id: 'c-mask-canvastext',
    role: '#3534229 proposal: mask-image + background-color CanvasText, no invert',
  },
  {
    id: 'd-mask-canvastext-invert',
    role: '#3534229 proposal + MR !17909 filter: invert(1) (collision)',
  },
  {
    id: 'e-mask-invert-reset',
    role: 'collision + proposed forced-colours filter: none reset (positive control)',
  },
  {
    id: 'p-linktext-mask',
    role: 'palette: mask painted LinkText system colour, no invert',
  },
  {
    id: 'p-linktext-mask-invert',
    role: 'palette: mask painted LinkText + filter: invert(1)',
  },
];

const TRAY_PROBES = ['tray-current', 'tray-var-undefined', 'tray-var-defined'];

const SYSTEM_SWATCHES = [
  'sys-canvas',
  'sys-canvastext',
  'sys-linktext',
  'sys-buttonface',
  'sys-buttontext',
  'sys-graytext',
];

/* ------------------------------------------------------------------ *
 * Colour helpers
 * ------------------------------------------------------------------ */
function parseColor(value) {
  if (!value || typeof value !== 'string') return null;
  const match = value.match(/rgba?\(([^)]+)\)/);
  if (!match) return null;
  const parts = match[1].split(/[,\s/]+/).filter(Boolean).map(Number);
  if (parts.length < 3 || parts.some((n) => Number.isNaN(n))) return null;
  return [parts[0], parts[1], parts[2]];
}

function maxDiff(a, b) {
  return Math.max(Math.abs(a[0] - b[0]), Math.abs(a[1] - b[1]), Math.abs(a[2] - b[2]));
}

function invert(rgb) {
  return [255 - rgb[0], 255 - rgb[1], 255 - rgb[2]];
}

function luminance([r, g, b]) {
  const channel = (v) => {
    v /= 255;
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return +((hi + 0.05) / (lo + 0.05)).toFixed(2);
}

function nearestSystemColor(rgb, systems, tolerance = 8) {
  let best = null;
  for (const [name, value] of Object.entries(systems)) {
    const system = parseColor(value);
    if (!system) continue;
    const diff = maxDiff(rgb, system);
    if (diff <= tolerance) {
      best = { name, value, diff };
      break;
    }
  }
  return best;
}

/* ------------------------------------------------------------------ *
 * Screenshot pixel analysis (decoded in a plain helper page via canvas)
 * ------------------------------------------------------------------ */
async function makePixelHelper(browser) {
  const helper = await browser.newPage();
  await helper.setContent('<!doctype html><html><body></body></html>');
  return async function analysePng(buffer) {
    const base64 = buffer.toString('base64');
    return helper.evaluate(async (data) => {
      const image = new Image();
      image.src = 'data:image/png;base64,' + data;
      await image.decode();
      const canvas = document.createElement('canvas');
      canvas.width = image.width;
      canvas.height = image.height;
      const context = canvas.getContext('2d');
      context.drawImage(image, 0, 0);
      const data32 = context.getImageData(0, 0, canvas.width, canvas.height).data;
      const counts = new Map();
      for (let i = 0; i < data32.length; i += 4) {
        const key = `${data32[i]},${data32[i + 1]},${data32[i + 2]}`;
        counts.set(key, (counts.get(key) || 0) + 1);
      }
      const total = canvas.width * canvas.height;
      const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
      const pixel = (x, y) => {
        const i = (y * canvas.width + x) * 4;
        return [data32[i], data32[i + 1], data32[i + 2]];
      };
      return {
        size: [canvas.width, canvas.height],
        corner: pixel(2, 2),
        center: pixel(Math.floor(canvas.width / 2), Math.floor(canvas.height / 2)),
        distinctColours: sorted.length,
        topColours: sorted.slice(0, 10).map(([key, n]) => ({
          rgb: key.split(',').map(Number),
          share: +(n / total).toFixed(4),
        })),
      };
    }, base64);
  };
}

/**
 * Dominant colour = the box's backdrop. The icon is a solid colour region
 * that is not the backdrop. A minimum share of 1% is required so that
 * anti-aliased fringe pixels (filter: invert(1) can leave a few grey edge
 * pixels when the icon and its backdrop invert to the same colour) are not
 * mistaken for a visible icon.
 */
function analyseIconPixels(pixels, bodyRgb, systems) {
  const dominant = pixels.topColours[0].rgb;
  const candidates = pixels.topColours
    .slice(1)
    .filter((c) => c.share >= 0.01 && maxDiff(c.rgb, dominant) > 24);
  let icon = null;
  if (candidates.length) {
    icon = candidates
      .map((c) => c.rgb)
      .sort((a, b) => contrast(b, dominant) - contrast(a, dominant))[0];
  }
  const iconContrast = icon ? contrast(icon, dominant) : 1;
  return {
    dominant,
    dominantShare: pixels.topColours[0].share,
    icon,
    iconSolidShare: candidates.length
      ? Math.max(...candidates.map((c) => c.share))
      : 0,
    iconContrast,
    iconIsVisibleAt3To1: iconContrast >= 3,
    iconIsVisibleAt4Point5To1: iconContrast >= 4.5,
    distinctColours: pixels.distinctColours,
    centrePixel: pixels.center,
    cornerPixel: pixels.corner,
    dominantIsPageBackground: bodyRgb ? maxDiff(dominant, bodyRgb) <= 8 : null,
    dominantIsInvertedPageBackground: bodyRgb
      ? maxDiff(dominant, invert(bodyRgb)) <= 8
      : null,
    iconSystemColour: icon ? nearestSystemColor(icon, systems) : null,
  };
}

/* ------------------------------------------------------------------ *
 * Page readers
 * ------------------------------------------------------------------ */
async function readMediaAndClass(page) {
  return page.evaluate(() => ({
    forcedColorsActive: window.matchMedia('(forced-colors: active)').matches,
    prefersColorSchemeDark: window.matchMedia('(prefers-color-scheme: dark)').matches,
    computedColorScheme: getComputedStyle(document.documentElement).colorScheme,
    htmlClass: document.documentElement.className,
    statusText: document.getElementById('status')?.textContent ?? null,
  }));
}

async function readComputed(page, ids) {
  return page.evaluate((probeIds) => {
    const out = {};
    for (const id of probeIds) {
      const element = document.getElementById(id);
      if (!element) {
        out[id] = { missing: true };
        continue;
      }
      const style = getComputedStyle(element);
      out[id] = {
        backgroundColor: style.backgroundColor,
        backgroundImage: style.backgroundImage,
        maskImage: style.maskImage,
        filter: style.filter,
        color: style.color,
        borderColor: style.borderColor,
      };
    }
    return out;
  }, ids);
}

async function readBodyBackground(page) {
  return page.evaluate(() => getComputedStyle(document.body).backgroundColor);
}

/* ------------------------------------------------------------------ *
 * Main
 * ------------------------------------------------------------------ */
const startedAt = new Date().toISOString();
const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-gpu'] });
const result = {
  generatedAt: startedAt,
  fixture: fixtureUrl,
  inputs: {
    issue: 'https://www.drupal.org/project/drupal/issues/3534229',
    corePinned: CORE_COMMIT,
    mrUnderTest: MR,
    origin: {
      project: 'gin',
      workItem: 3506329,
      mergeRequest: 656,
      selectorInGin: '.gin--dark-mode .ckeditor5-toolbar-button',
      backgroundInGin: '.ckeditor5-toolbar-active__buttons { background: var(--gin-bg-layer3); }',
      note:
        'The MR comment by salmonek says the solution is based on their previous Gin commit (#3506329). ' +
        'Gin MR !656 uses the gin--dark-mode class and the --gin-bg-layer3 variable, not .dark-mode / ' +
        '--admin-color-bg. Core Default Admin renamed the class and the token.',
    },
    proposedCorrection: {
      source: 'https://www.drupal.org/project/drupal/issues/3534229',
      author: 'kentr',
      date: '2026-07-24',
      status: 'proof-of-concept comment, not a reviewed patch',
      technique:
        'background: buttontext (a system colour) + mask-image per button, inside ' +
        '@media (forced-colors: active)',
    },
  },
  browser: {
    name: 'chromium',
    version: browser.version(),
    playwright: require('playwright/package.json').version,
    platform: process.platform,
    release: process.release?.name ? `${process.release.name} ${process.version}` : process.version,
    arch: process.arch,
    note: 'Lab Playwright install at tools/playwright; Chromium only (Firefox crashes on this machine).',
  },
  contexts: {},
};

const analysePng = await makePixelHelper(browser);

for (const contextSpec of CONTEXTS) {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 1000 },
    colorScheme: contextSpec.colorScheme,
    forcedColors: contextSpec.forcedColors,
    deviceScaleFactor: 1,
  });
  if (contextSpec.darkMode === 'force') {
    await context.addInitScript(() => {
      document.addEventListener('DOMContentLoaded', () => {
        document.documentElement.classList.add('dark-mode');
      });
    });
  }
  const page = await context.newPage();
  const consoleErrors = [];
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(String(error)));

  await page.goto(fixtureUrl, { waitUntil: 'load' });
  await page.waitForTimeout(200);

  const media = await readMediaAndClass(page);
  const systemColours = await readComputed(page, SYSTEM_SWATCHES);
  const systems = {};
  for (const id of SYSTEM_SWATCHES) {
    systems[id.replace(/^sys-/, '')] = systemColours[id]?.backgroundColor ?? null;
  }
  const bodyBackgroundText = await readBodyBackground(page);
  const bodyRgb = parseColor(bodyBackgroundText);

  const probeIds = [...BUTTON_PROBES.map((p) => p.id), ...TRAY_PROBES];
  const computed = await readComputed(page, probeIds);

  const screenshotPath = path.join(reportDir, `compat-3637246-${contextSpec.id}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });

  const probes = {};
  for (const probe of BUTTON_PROBES) {
    const box = await page.locator('#' + probe.id).boundingBox();
    if (!box) {
      probes[probe.id] = { role: probe.role, error: 'no bounding box' };
      continue;
    }
    const shot = await page.screenshot({
      clip: {
        x: Math.round(box.x),
        y: Math.round(box.y),
        width: Math.round(box.width),
        height: Math.round(box.height),
      },
    });
    const pixels = await analysePng(shot);
    probes[probe.id] = {
      role: probe.role,
      computed: computed[probe.id] ?? null,
      pixels,
      analysis: analyseIconPixels(pixels, bodyRgb, systems),
    };
  }

  const trayProbes = {};
  for (const id of TRAY_PROBES) {
    const box = await page.locator('#' + id).boundingBox();
    if (!box) {
      trayProbes[id] = { error: 'no bounding box' };
      continue;
    }
    const shot = await page.screenshot({
      clip: {
        x: Math.round(box.x),
        y: Math.round(box.y),
        width: Math.round(box.width),
        height: Math.round(box.height),
      },
    });
    const pixels = await analysePng(shot);
    trayProbes[id] = {
      computed: computed[id] ?? null,
      pixelCentre: pixels.center,
      dominant: pixels.topColours[0]?.rgb ?? null,
      distinctColours: pixels.distinctColours,
      renderedBackgroundIsPageBackground: bodyRgb
        ? maxDiff(pixels.topColours[0].rgb, bodyRgb) <= 8
        : null,
    };
  }

  result.contexts[contextSpec.id] = {
    config: {
      colorScheme: contextSpec.colorScheme,
      forcedColors: contextSpec.forcedColors,
      darkMode: contextSpec.darkMode,
      note: contextSpec.note ?? null,
    },
    media,
    mrInvertConditionMet: media.htmlClass.split(/\s+/).includes('dark-mode'),
    bodyBackground: bodyBackgroundText,
    systemColours: systems,
    probes,
    trays: trayProbes,
    consoleErrors,
    screenshot: path.relative(reportDir, screenshotPath),
  };

  await context.close();
}

await browser.close();

/* ------------------------------------------------------------------ *
 * Derived summary (kept next to the raw measurements for the write-up)
 * ------------------------------------------------------------------ */
function probeContrast(contextId, probeId) {
  return result.contexts[contextId]?.probes?.[probeId]?.analysis?.iconContrast ?? null;
}
function probeVisible(contextId, probeId) {
  return result.contexts[contextId]?.probes?.[probeId]?.analysis?.iconIsVisibleAt3To1 ?? null;
}
function probeFilter(contextId, probeId) {
  return result.contexts[contextId]?.probes?.[probeId]?.computed?.filter ?? null;
}
function palette(contextId, probeId) {
  const analysis = result.contexts[contextId]?.probes?.[probeId]?.analysis;
  if (!analysis) return null;
  return {
    dominant: analysis.dominant,
    icon: analysis.icon,
    contrast: analysis.iconContrast,
    iconSystemColour: analysis.iconSystemColour,
  };
}

result.summary = {
  forcedDark: {
    aBgImageNoInvert: { contrast: probeContrast('forced-dark', 'a-bg-image-current'), visible: probeVisible('forced-dark', 'a-bg-image-current') },
    bBgImageInvert: {
      contrast: probeContrast('forced-dark', 'b-bg-image-invert'),
      visible: probeVisible('forced-dark', 'b-bg-image-invert'),
      surfaceInverted: result.contexts['forced-dark'].probes['b-bg-image-invert'].analysis.dominantIsInvertedPageBackground,
      filter: probeFilter('forced-dark', 'b-bg-image-invert'),
    },
    cMaskNoInvert: { contrast: probeContrast('forced-dark', 'c-mask-canvastext'), visible: probeVisible('forced-dark', 'c-mask-canvastext') },
    dMaskInvert: {
      contrast: probeContrast('forced-dark', 'd-mask-canvastext-invert'),
      visible: probeVisible('forced-dark', 'd-mask-canvastext-invert'),
      filter: probeFilter('forced-dark', 'd-mask-canvastext-invert'),
    },
    eMaskInvertReset: {
      contrast: probeContrast('forced-dark', 'e-mask-invert-reset'),
      visible: probeVisible('forced-dark', 'e-mask-invert-reset'),
      filter: probeFilter('forced-dark', 'e-mask-invert-reset'),
    },
    paletteNoInvert: palette('forced-dark', 'p-linktext-mask'),
    paletteInvert: palette('forced-dark', 'p-linktext-mask-invert'),
  },
  forcedLight: {
    aBgImageNoInvert: { contrast: probeContrast('forced-light', 'a-bg-image-current'), visible: probeVisible('forced-light', 'a-bg-image-current') },
    bBgImageInvert: {
      contrast: probeContrast('forced-light', 'b-bg-image-invert'),
      visible: probeVisible('forced-light', 'b-bg-image-invert'),
      surfaceInverted: result.contexts['forced-light'].probes['b-bg-image-invert'].analysis.dominantIsInvertedPageBackground,
      filter: probeFilter('forced-light', 'b-bg-image-invert'),
    },
    cMaskNoInvert: { contrast: probeContrast('forced-light', 'c-mask-canvastext'), visible: probeVisible('forced-light', 'c-mask-canvastext') },
    dMaskInvert: {
      contrast: probeContrast('forced-light', 'd-mask-canvastext-invert'),
      visible: probeVisible('forced-light', 'd-mask-canvastext-invert'),
      filter: probeFilter('forced-light', 'd-mask-canvastext-invert'),
    },
    eMaskInvertReset: {
      contrast: probeContrast('forced-light', 'e-mask-invert-reset'),
      visible: probeVisible('forced-light', 'e-mask-invert-reset'),
      filter: probeFilter('forced-light', 'e-mask-invert-reset'),
    },
    paletteNoInvert: palette('forced-light', 'p-linktext-mask'),
    paletteInvert: palette('forced-light', 'p-linktext-mask-invert'),
  },
  forcedLightDarkMode: {
    aBgImageNoInvert: { contrast: probeContrast('forced-light-dark-mode', 'a-bg-image-current'), visible: probeVisible('forced-light-dark-mode', 'a-bg-image-current') },
    bBgImageInvert: {
      contrast: probeContrast('forced-light-dark-mode', 'b-bg-image-invert'),
      visible: probeVisible('forced-light-dark-mode', 'b-bg-image-invert'),
      surfaceInverted: result.contexts['forced-light-dark-mode'].probes['b-bg-image-invert'].analysis
        .dominantIsInvertedPageBackground,
      filter: probeFilter('forced-light-dark-mode', 'b-bg-image-invert'),
    },
    cMaskNoInvert: { contrast: probeContrast('forced-light-dark-mode', 'c-mask-canvastext'), visible: probeVisible('forced-light-dark-mode', 'c-mask-canvastext') },
    dMaskInvert: {
      contrast: probeContrast('forced-light-dark-mode', 'd-mask-canvastext-invert'),
      visible: probeVisible('forced-light-dark-mode', 'd-mask-canvastext-invert'),
      filter: probeFilter('forced-light-dark-mode', 'd-mask-canvastext-invert'),
    },
    eMaskInvertReset: {
      contrast: probeContrast('forced-light-dark-mode', 'e-mask-invert-reset'),
      visible: probeVisible('forced-light-dark-mode', 'e-mask-invert-reset'),
      filter: probeFilter('forced-light-dark-mode', 'e-mask-invert-reset'),
    },
  },
  normalDark: {
    aBgImageNoInvert: { contrast: probeContrast('normal-dark', 'a-bg-image-current'), visible: probeVisible('normal-dark', 'a-bg-image-current') },
    bBgImageInvert: {
      contrast: probeContrast('normal-dark', 'b-bg-image-invert'),
      visible: probeVisible('normal-dark', 'b-bg-image-invert'),
      filter: probeFilter('normal-dark', 'b-bg-image-invert'),
    },
    trayCurrent: result.contexts['normal-dark'].trays['tray-current'],
    trayVarUndefined: result.contexts['normal-dark'].trays['tray-var-undefined'],
    trayVarDefined: result.contexts['normal-dark'].trays['tray-var-defined'],
  },
  normalLight: {
    trayCurrent: result.contexts['normal-light'].trays['tray-current'],
    trayVarUndefined: result.contexts['normal-light'].trays['tray-var-undefined'],
    trayVarDefined: result.contexts['normal-light'].trays['tray-var-defined'],
  },
  invertFilterIsResetByForcedColors: result.contexts['forced-dark'].probes['d-mask-canvastext-invert'].computed.filter !== 'none',
  forcedColorsPalette: {
    light: result.contexts['forced-light'].systemColours,
    dark: result.contexts['forced-dark'].systemColours,
  },
};

fs.writeFileSync(outFile, JSON.stringify(result, null, 2) + '\n');

/* ------------------------------------------------------------------ *
 * Human-readable stdout summary
 * ------------------------------------------------------------------ */
const line = (label, value) => console.log(label.padEnd(46, '.') + ' ' + value);
console.log('');
console.log('Fixture:', fixtureUrl);
console.log('Chromium:', result.browser.version, '| JSON:', path.relative(process.cwd(), outFile));
for (const contextId of Object.keys(result.contexts)) {
  const c = result.contexts[contextId];
  console.log('');
  console.log(`[${contextId}] forced=${c.media.forcedColorsActive} dark=${c.media.prefersColorSchemeDark} class="${c.media.htmlClass}"`);
  line('Canvas / CanvasText', `${c.systemColours.canvas} / ${c.systemColours.canvastext}`);
  line('LinkText', c.systemColours.linktext);
  for (const probe of BUTTON_PROBES) {
    const p = c.probes[probe.id];
    const a = p.analysis;
    line(`${probe.id} (${a.iconContrast}:1${a.iconIsVisibleAt3To1 ? ' visible' : ' NOT visible'})`, `filter=${p.computed.filter}`);
  }
  for (const id of TRAY_PROBES) {
    line(`  ${id}`, `computed=${c.trays[id].computed.backgroundColor}`);
  }
}
console.log('');
console.log('Summary:');
console.log(JSON.stringify(result.summary, null, 2));
