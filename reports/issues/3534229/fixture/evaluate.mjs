/**
 * Evaluate the #3534229 standalone fixture.
 *
 * Compares variant A (current core background-image), B (Kent's whole-element
 * mask experiment) and C (the proposed dedicated mask) for every toolbar item,
 * in normal light/dark and forced-colors light/dark, LTR and RTL, desktop and
 * narrow viewport, at rest / hover / focus.
 *
 * It records computed CSS *and* rendered pixels, because a non-empty
 * mask-image does not prove that an icon is visible. A known-invisible control
 * (the simulated contributed plugin in forced-colors dark) is included as a
 * negative control for the pixel check.
 *
 * Run: node reports/issues/3534229/fixture/evaluate.mjs [--browser=chromium|firefox|both]
 * Writes: results-<browser>.json, SUMMARY.md, screenshots/ under this folder.
 * Serve over HTTP only: mask-image requests fail from file:// (CORS), so this
 * script starts its own static server on 127.0.0.1.
 */
import { createRequire } from 'node:module';
import { Pixels } from '../../../../tools/playwright/lib/pixels.mjs';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(new URL('../../../../tools/playwright/package.json', import.meta.url));
const playwright = require('playwright');

const here = path.dirname(fileURLToPath(import.meta.url));
const arg = (name, fallback) => {
  const withValue = process.argv.find((a) => a.startsWith(`--${name}=`));
  if (withValue) return withValue.slice(name.length + 3);
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : fallback;
};
const wanted = arg('browser', 'both');
const quick = process.argv.includes('--quick');
const OUT = path.join(here, 'screenshots');
fs.mkdirSync(OUT, { recursive: true });

const manifest = JSON.parse(fs.readFileSync(path.join(here, 'manifest.json'), 'utf8'));
const VARIANTS = [
  { id: 'A', name: 'current core: background-image' },
  { id: 'B', name: "Kent's whole-element mask" },
  { id: 'C', name: 'proposed: dedicated mask (CanvasText)' },
];
const MODES = [
  { id: 'normal-light', colorScheme: 'light', forcedColors: 'none' },
  { id: 'normal-dark', colorScheme: 'dark', forcedColors: 'none' },
  { id: 'forced-light', colorScheme: 'light', forcedColors: 'active' },
  { id: 'forced-dark', colorScheme: 'dark', forcedColors: 'active' },
];
const VIEWPORTS = [{ id: 'desktop', width: 1280, height: 1200 }, { id: 'narrow', width: 390, height: 1200 }];

// ---------------------------------------------------------------- static server
const MIME = { '.html': 'text/html', '.css': 'text/css', '.svg': 'image/svg+xml', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png' };
const server = http.createServer((req, res) => {
  const rel = decodeURIComponent(req.url.split('?')[0]);
  const file = path.join(here, rel);
  if (!file.startsWith(here)) { res.writeHead(403); res.end(); return; }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'content-type': MIME[path.extname(file)] || 'application/octet-stream' });
    res.end(data);
  });
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const baseUrl = `http://127.0.0.1:${server.address().port}`;

// ---------------------------------------------------------------- pixel helpers
// ---------------------------------------------------------------- DOM probe
const PROBE = () => {
  const read = (el, pseudo) => {
    const s = getComputedStyle(el, pseudo);
    return {
      backgroundColor: s.backgroundColor,
      backgroundImage: s.backgroundImage,
      color: s.color,
      maskImage: s.maskImage,
      maskRepeat: s.maskRepeat,
      maskPosition: s.maskPosition,
      maskSize: s.maskSize,
      forcedColorAdjust: s.forcedColorAdjust,
      content: s.content,
      borderTopColor: s.borderTopColor,
      borderInlineStartColor: s.borderInlineStartColor,
      visibility: s.visibility,
      outlineStyle: s.outlineStyle,
      outlineColor: s.outlineColor,
      outlineWidth: s.outlineWidth,
    };
  };
  const items = [];
  for (const li of document.querySelectorAll('.ckeditor5-toolbar-item')) {
    const button = li.querySelector('.ckeditor5-toolbar-button');
    const tooltip = li.querySelector('.ckeditor5-tooltip, .ckeditor5-toolbar-tooltip');
    const rect = li.getBoundingClientRect();
    const btnRect = button.getBoundingClientRect();
    const hidden = button.querySelector('.visually-hidden');
    items.push({
      id: li.dataset.id,
      list: li.closest('.ckeditor5-toolbar-tray')?.dataset.buttonList || null,
      role: li.getAttribute('role'),
      tabIndex: li.tabIndex,
      label: li.dataset.label || null,
      accessibleName: hidden ? hidden.textContent.trim() : null,
      divider: li.dataset.divider === 'true',
      geometry: {
        item: { x: +rect.x.toFixed(1), y: +rect.y.toFixed(1), w: +rect.width.toFixed(1), h: +rect.height.toFixed(1) },
        button: { x: +btnRect.x.toFixed(1), y: +btnRect.y.toFixed(1), w: +btnRect.width.toFixed(1), h: +btnRect.height.toFixed(1) },
      },
      button: read(button),
      before: read(button, '::before'),
      after: read(button, '::after'),
      tooltip: tooltip ? { ...read(tooltip), text: tooltip.textContent.trim() } : null,
    });
  }
  return {
    media: { forcedColors: matchMedia('(forced-colors: active)').matches, dark: matchMedia('(prefers-color-scheme: dark)').matches },
    toolbar: {
      available: document.querySelectorAll('.ckeditor5-toolbar-available__buttons .ckeditor5-toolbar-item').length,
      divider: document.querySelectorAll('.ckeditor5-toolbar-divider__buttons .ckeditor5-toolbar-item').length,
      active: document.querySelectorAll('.ckeditor5-toolbar-active__buttons .ckeditor5-toolbar-item').length,
    },
    items,
  };
};

// ---------------------------------------------------------------- run one scenario
async function runScenario(browser, helper, scenario) {
  const states = scenario.states !== false;
  const ctx = await browser.newContext({
    colorScheme: scenario.mode.colorScheme,
    forcedColors: scenario.mode.forcedColors,
    viewport: { width: scenario.viewport.width, height: scenario.viewport.height },
    reducedMotion: 'reduce',
  });
  const page = await ctx.newPage();
  page.setDefaultTimeout(5000);
  page.setDefaultNavigationTimeout(15000);
  const withTimeout = (promise, ms, label) => Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(`timeout after ${ms}ms: ${label}`)), ms)),
  ]);
  const requests = [];
  page.on('requestfailed', (r) => requests.push({ url: r.url(), error: r.failure()?.errorText }));
  await page.goto(`${baseUrl}/toolbar.html?variant=${scenario.variant}${scenario.dir === 'rtl' ? '&dir=rtl' : ''}`);
  await page.waitForFunction(() => {
    const links = [...document.querySelectorAll('link[rel=stylesheet]')];
    const core = links.filter((l) => l.dataset.coreCss);
    return core.length >= 20 && core.every((l) => l.sheet);
  });
  const probe = await page.evaluate(PROBE);
  const pixels = new Pixels();

  const items = [];
  for (const item of probe.items) {
    const locator = page.locator(`.ckeditor5-toolbar-item[data-id="${item.id}"]`).first();
    try {
      await page.mouse.move(1, 1);
      await page.evaluate(() => { const active = document.activeElement; if (active && active.blur) active.blur(); });
      await page.waitForTimeout(30);
    const button = locator.locator('.ckeditor5-toolbar-button');
    const atRest = Pixels.visible(await pixels.colours(await button.screenshot(), { inset: 2 }));
    // Hover (real pointer move over the button).
    await locator.hover();
    await page.waitForTimeout(60);
    const hovered = Pixels.visible(await pixels.colours(await button.screenshot(), { inset: 2 }));
    const hoverState = await page.evaluate((id) => {
      const li = document.querySelector(`.ckeditor5-toolbar-item[data-id="${id}"]`);
      const button = li.querySelector('.ckeditor5-toolbar-button');
      const tooltip = li.querySelector('.ckeditor5-toolbar-tooltip');
      const s = getComputedStyle(button);
      const t = tooltip ? getComputedStyle(tooltip) : null;
      return {
        backgroundColor: s.backgroundColor,
        expanded: button.getAttribute('data-expanded'),
        tooltipVisibility: t?.visibility || null,
        tooltipColor: t?.color || null,
        tooltipBackground: t?.backgroundColor || null,
      };
    }, item.id);
    // Keyboard focus on the item (the list option is the focusable element).
    let focused = hovered;
    if (states) {
      await locator.focus();
      await page.waitForTimeout(60);
      focused = Pixels.visible(await pixels.colours(await button.screenshot(), { inset: 2 }));
    }
    const focusState = await page.evaluate((id) => {
      const li = document.querySelector(`.ckeditor5-toolbar-item[data-id="${id}"]`);
      const s = getComputedStyle(li);
      const b = getComputedStyle(li.querySelector('.ckeditor5-toolbar-button'));
      return { isActiveElement: document.activeElement === li, outline: `${s.outlineWidth} ${s.outlineStyle} ${s.outlineColor}`, buttonBackground: b.backgroundColor };
    }, item.id);
    items.push({ ...item, rendered: { atRest, hovered, focused }, interaction: { hover: hoverState, focus: focusState } });
    } catch (error) {
      items.push({ ...item, measurementError: String(error).slice(0, 200) });
    }
  }

  // Rendered screenshot of the fieldset for human review.
  const shot = path.join(OUT, `${scenario.variant}-${scenario.mode.id}-${scenario.dir}-${scenario.viewport.id}.png`);
  await page.locator('.ckeditor5-toolbar-fieldset').screenshot({ path: shot });
  await ctx.close();
  return {
    variant: scenario.variant,
    mode: scenario.mode.id,
    dir: scenario.dir,
    viewport: scenario.viewport.id,
    media: probe.media,
    toolbar: probe.toolbar,
    failedRequests: requests,
    screenshot: path.relative(here, shot),
    items,
  };
}

// ---------------------------------------------------------------- main
const results = { generated: new Date().toISOString(), fixture: manifest, browsers: {} };
const engines = wanted === 'both' ? ['chromium', 'firefox'] : [wanted];
const LAUNCH_ARGS = (name) => (name === 'chromium' ? ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'] : []);
const SCENARIO_LIST = [];
for (const mode of MODES) {
  for (const variant of ['A', 'B', 'C']) SCENARIO_LIST.push({ mode, variant, dir: 'ltr', viewport: VIEWPORTS[0], states: false });
}
for (const variant of ['A', 'C']) {
  SCENARIO_LIST.push({ mode: MODES[3], variant, dir: 'rtl', viewport: VIEWPORTS[0], states: false });
  SCENARIO_LIST.push({ mode: MODES[3], variant, dir: 'ltr', viewport: VIEWPORTS[1], states: false });
  SCENARIO_LIST.push({ mode: MODES[0], variant, dir: 'ltr', viewport: VIEWPORTS[0], states: false });
}
for (const variant of ['A', 'C']) SCENARIO_LIST.push({ mode: MODES[3], variant, dir: 'ltr', viewport: VIEWPORTS[0], states: true });
for (const variant of ['A', 'C']) SCENARIO_LIST.push({ mode: MODES[0], variant, dir: 'ltr', viewport: VIEWPORTS[0], states: true });
if (quick) {
  // Reduced matrix for loaded machines: the four palettes for A/B/C plus RTL and narrow for A/C.
  SCENARIO_LIST.length = 0;
  for (const mode of MODES) {
    for (const variant of ['A', 'B', 'C']) SCENARIO_LIST.push({ mode, variant, dir: 'ltr', viewport: VIEWPORTS[0], states: false });
  }
  for (const variant of ['A', 'C']) {
    SCENARIO_LIST.push({ mode: MODES[3], variant, dir: 'rtl', viewport: VIEWPORTS[0], states: false });
    SCENARIO_LIST.push({ mode: MODES[3], variant, dir: 'ltr', viewport: VIEWPORTS[1], states: false });
    SCENARIO_LIST.push({ mode: MODES[3], variant, dir: 'ltr', viewport: VIEWPORTS[0], states: true });
  }
}

for (const name of engines) {
  const engine = playwright[name];
  if (!engine) continue;
  const scenarios = [];
  const problems = [];
  let version = null;
  // One browser per scenario, with one retry: under the shared machine's load a
  // renderer occasionally crashes at newPage, and losing the whole run to that
  // would discard the scenarios that already rendered correctly.
  for (const sc of SCENARIO_LIST) {
    const label = `${sc.mode.id}/${sc.variant}/${sc.dir}/${sc.viewport.id}`;
    for (let attempt = 1; attempt <= 2; attempt += 1) {
      let browser;
      try {
        browser = await engine.launch({ args: LAUNCH_ARGS(name) });
        version = browser.version();
        const helper = await browser.newContext().then((c) => c.newPage());
        await helper.setContent('<!doctype html><html><body></body></html>');
        const result = await runScenario(browser, helper, sc);
        result.attempts = attempt;
        scenarios.push(result);
        break;
      } catch (error) {
        problems.push({ scenario: label, attempt, error: String(error).slice(0, 240) });
        if (attempt === 2) console.error(`scenario ${label} failed twice: ${String(error).slice(0, 160)}`);
      } finally {
        if (browser) await browser.close().catch(() => {});
      }
    }
  }
  results.browsers[name] = { version, scenarios, problems };
}

// ---------------------------------------------------------------- summaries
function scenarioSummary(s) {
  const items = s.items;
  const byList = (list) => items.filter((i) => i.list === list);
  const invisible = items.filter((i) => !i.rendered.atRest.visible).map((i) => i.id);
  const lowContrast = items
    .filter((i) => i.rendered.atRest.visible && i.rendered.atRest.icon.contrast < 4.5)
    .map((i) => ({ id: i.id, contrast: i.rendered.atRest.icon.contrast }));
  const hoverLost = items.filter((i) => i.rendered.atRest.visible && !i.rendered.hovered.visible).map((i) => i.id);
  const focusLost = items.filter((i) => i.rendered.atRest.visible && !i.rendered.focused.visible).map((i) => i.id);
  const tooltipBroken = items
    .filter((i) => i.tooltip && (i.interaction.hover.tooltipVisibility === 'hidden' || i.interaction.hover.tooltipVisibility === 'collapse'))
    .map((i) => i.id);
  const masksWithoutPixels = items.filter((i) => i.button.maskImage !== 'none' && !i.rendered.atRest.visible).map((i) => i.id);
  return {
    counts: { available: byList('ckeditor5-toolbar-available-buttons').length, divider: byList('ckeditor5-toolbar-divider-buttons').length, active: byList('ckeditor5-toolbar-active-buttons').length, total: items.length },
    invisible,
    lowContrast,
    hoverLost,
    focusLost,
    tooltipBroken,
    masksWithoutPixels,
    visible: items.length - invisible.length,
    allVisible: invisible.length === 0,
  };
}
for (const [name, data] of Object.entries(results.browsers)) {
  if (!data.scenarios) continue;
  for (const s of data.scenarios) s.summary = scenarioSummary(s);
}
fs.writeFileSync(path.join(here, `results-${engines.join('-')}.json`), JSON.stringify(results, null, 2) + '\n');

// Markdown summary
let md = `# Fixture evaluation (#3534229)\n\nDRAFT. Generated by \`evaluate.mjs\` on ${new Date().toISOString()}.\n\n`;
md += `Pinned core: \`${manifest.pin}\`. Patch: ${manifest.patch ? `\`${manifest.patch.file}\` (sha256 ${manifest.patch.sha256})` : 'none (variants A and B use pristine core CSS, variant C uses the patch)'}.\n\n`;
md += 'A = current core background-image. B = Kent\'s whole-element mask (comment #7, selector list extended to every item). C = proposed dedicated mask painted with CanvasText. The simulated contributed plugin (`contribExample`) only sets a background-image and is the backward-compatibility control.\n\n';
for (const [name, data] of Object.entries(results.browsers)) {
  md += `## ${name}${data.version ? ` ${data.version}` : ''}\n\n`;
  if (data.blocked) { md += `BLOCKED: \`${data.blocked}\`\n\n`; continue; }
  if (data.error) md += `Run error: \`${data.error}\`\n\n`;
  md += '| scenario | variant | items | visible | invisible | low contrast (<4.5) | hover lost | focus lost | mask set but no pixels |\n|---|---|---|---|---|---|---|---|---|\n';
  for (const s of data.scenarios) {
    md += `| ${s.mode} / ${s.dir} / ${s.viewport} | ${s.variant} | ${s.summary.counts.total} | ${s.summary.visible} | ${s.summary.invisible.length ? s.summary.invisible.join(', ') : '—'} | ${s.summary.lowContrast.length ? s.summary.lowContrast.map((x) => x.id).join(', ') : '—'} | ${s.summary.hoverLost.join(', ') || '—'} | ${s.summary.focusLost.join(', ') || '—'} | ${s.summary.masksWithoutPixels.join(', ') || '—'} |\n`;
  }
  md += '\n';
}
md += '## Reading the result\n\n- In forced-colors mode, background images whose value contains `url()` are **kept** (`background-image` is only forced to `none` for values without `url()`), so the black SVG icons stay black while `Canvas` turns black in the dark palette: every icon-only control loses its icon in forced-colors **dark**, and keeps it in forced-colors light.\n- A non-empty `mask-image` computed value is not proof of visibility: the `mask set but no pixels` column lists items where the mask exists but no distinguishable pixel was rendered.\n- The `contribExample` control must stay exactly as it is in A (visible in forced light, invisible in forced dark): an opt-in-only fix must not change it.\n';
fs.writeFileSync(path.join(here, 'SUMMARY.md'), md);
console.log(`wrote results and SUMMARY.md; ${Object.values(results.browsers).map((b) => `${b.version || 'blocked'}:${(b.scenarios || []).length} scenarios`).join(', ')}`);
server.close();
