// Evidence for #3534229: CKEditor 5 toolbar-configuration icons in forced-colors mode.
//   node tools/playwright/evaluate-3534229.mjs [slug] [--browser=chromium|firefox|webkit] [--scheme=light|dark] [--forced-colors]
//        [--viewport=WxH] [--rtl] [--interaction] [--out=<dir>]
// Defaults: slug 3534229-pinned, chromium, light, 1280x900.
//
// One run covers one browser/colour-mode/viewport combination (the Lab convention; scripts/coverage.mjs
// aggregates runs). It discovers every toolbar item in the DOM, then for each one records the plugin and
// toolbar-item identifier, accessible name and role, background image, mask image, background and
// foreground colours, forced-color-adjust, geometry, at-rest/hover/focus rendered pixels, a screenshot
// hash and tooltip state. Rendered pixels are measured from element screenshots, not from computed CSS:
// the Before side is the negative control that proves the measurement detects an invisible icon.
//
// --rtl sets dir="rtl" on <html> after load: this checks the [dir="rtl"] rules, it is not a translated UI.
// --interaction additionally exercises keyboard reordering, dragging, and saving/restoring the toolbar
// configuration (it changes site config; use it on the disposable Lab environments only).
//
// Writes reports/issues/3534229/playwright/<stamp>-<envTag>/ (results.json, SUMMARY.md, PNGs) or --out.
import path from 'node:path';
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { runArgs, launch, openSide, axeScan, baseResults, writeRun, contextMarkdown, speechMarkdown } from './lib/lab-run.mjs';
import { Pixels } from './lib/pixels.mjs';

const here = path.dirname(new URL(import.meta.url).pathname);
const labRoot = path.resolve(here, '../..');
const PAGE = '/admin/config/content/formats/manage/full_html';
const inventory = JSON.parse(fs.readFileSync(path.join(labRoot, 'reports/issues/3534229/TOOLBAR-INVENTORY.json'), 'utf8'));
const pluginOf = new Map(inventory.items.map((i) => [i.id, i.plugin]));

const run = runArgs({ slug: '3534229-pinned' });
const rtl = process.argv.includes('--rtl');
const interaction = process.argv.includes('--interaction');
run.environment = { ...(run.environment || {}) };

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
      filter: s.filter,
      content: s.content,
      borderTopColor: s.borderTopColor,
      borderTopWidth: s.borderTopWidth,
      borderInlineStartColor: s.borderInlineStartColor,
      outline: `${s.outlineWidth} ${s.outlineStyle} ${s.outlineColor}`,
    };
  };
  const listInfo = (selector) => {
    const list = document.querySelector(selector);
    if (!list) return null;
    const s = getComputedStyle(list);
    return { items: list.querySelectorAll('.ckeditor5-toolbar-item').length, border: `${s.borderTopWidth} ${s.borderTopStyle} ${s.borderTopColor}`, backgroundColor: s.backgroundColor };
  };
  return {
    media: { forcedColors: matchMedia('(forced-colors: active)').matches, dark: matchMedia('(prefers-color-scheme: dark)').matches, contrastMore: matchMedia('(prefers-contrast: more)').matches },
    direction: document.documentElement.dir || 'ltr',
    lists: {
      available: listInfo('.ckeditor5-toolbar-available__buttons'),
      divider: listInfo('.ckeditor5-toolbar-divider__buttons'),
      active: listInfo('.ckeditor5-toolbar-active__buttons'),
    },
    availableItemBorder: (() => {
      const li = document.querySelector('.ckeditor5-toolbar-disabled .ckeditor5-toolbar-item');
      if (!li) return null;
      const s = getComputedStyle(li);
      return `${s.borderTopWidth} ${s.borderTopStyle} ${s.borderTopColor}`;
    })(),
    items: [...document.querySelectorAll('.ckeditor5-toolbar-item')].map((li) => {
      const button = li.querySelector('.ckeditor5-toolbar-button');
      const tooltip = li.querySelector('.ckeditor5-toolbar-tooltip');
      const hidden = button.querySelector('.visually-hidden');
      const rect = li.getBoundingClientRect();
      const btnRect = button.getBoundingClientRect();
      return {
        id: li.dataset.id,
        list: li.closest('.ckeditor5-toolbar-tray')?.dataset.buttonList || null,
        role: li.getAttribute('role'),
        tabIndex: li.tabIndex,
        label: li.dataset.label || null,
        accessibleName: hidden ? hidden.textContent.trim().replace(/\s+/g, ' ') : null,
        divider: li.dataset.divider === 'true',
        geometry: {
          item: { x: +rect.x.toFixed(1), y: +rect.y.toFixed(1), w: +rect.width.toFixed(1), h: +rect.height.toFixed(1) },
          button: { x: +btnRect.x.toFixed(1), y: +btnRect.y.toFixed(1), w: +btnRect.width.toFixed(1), h: +btnRect.height.toFixed(1) },
        },
        button: read(button),
        before: read(button, '::before'),
        after: read(button, '::after'),
        tooltip: tooltip ? { ...read(tooltip), text: tooltip.textContent.trim() } : null,
        expanded: button.getAttribute('data-expanded'),
      };
    }),
  };
};

/** Hash of an element screenshot: identical bytes mean identical normal-mode rendering. */
const hash = (buffer) => createHash('sha256').update(buffer).digest('hex').slice(0, 16);

async function measureSide(run, side) {
  const { page, rec } = await openSide(run, side);
  const pixels = new Pixels();
  await page.goto(page.url().replace(/^(https?:\/\/[^/]+).*/, '$1') + PAGE);
  await page.locator('#ckeditor5-toolbar-app .ckeditor5-toolbar-item').first().waitFor({ state: 'visible', timeout: 30000 });
  if (rtl) {
    await page.evaluate(() => { document.documentElement.dir = 'rtl'; });
    await page.waitForTimeout(200);
  }
  await page.waitForTimeout(300);
  const probe = await page.evaluate(PROBE);

  const rows = [];
  for (const item of probe.items) {
    const li = page.locator(`.ckeditor5-toolbar-item[data-id="${item.id}"]`).first();
    const button = li.locator('.ckeditor5-toolbar-button');
    // Clear hover/focus left by the previous item: its tooltip is absolutely
    // positioned and can overlap this item's box, and a focused item paints an
    // outline. An at-rest screenshot must not contain either.
    await page.mouse.move(1, 1);
    await page.evaluate(() => { const active = document.activeElement; if (active && active.blur) active.blur(); });
    await page.waitForTimeout(40);
    const atRestBuffer = await button.screenshot();
    // Analyse the saved buffer: a second screenshot could catch a different state.
    const atRestColours = await pixels.colours(atRestBuffer, { inset: 1 });
    const atRestPixelHash = pixels.pixelHash(atRestBuffer, { inset: 2 });
    const measured = measureColours(atRestColours);
    await li.hover();
    await page.waitForTimeout(80);
    const hoverBuffer = await button.screenshot();
    const hover = measureColours(await pixels.colours(hoverBuffer, { inset: 1 }));
    const hoverState = await page.evaluate((id) => {
      const li = document.querySelector(`.ckeditor5-toolbar-item[data-id="${id}"]`);
      const button = li.querySelector('.ckeditor5-toolbar-button');
      const tooltip = li.querySelector('.ckeditor5-toolbar-tooltip');
      const s = getComputedStyle(button);
      const t = tooltip ? getComputedStyle(tooltip) : null;
      return {
        backgroundColor: s.backgroundColor,
        expanded: button.getAttribute('data-expanded'),
        tooltipVisible: t ? t.visibility === 'visible' : null,
        tooltipColor: t?.color || null,
        tooltipBackground: t?.backgroundColor || null,
      };
    }, item.id);
    await page.mouse.move(1, 1);
    rows.push({
      ...item,
      plugin: pluginOf.get(item.id) || null,
      rendered: { atRest: { ...measured, screenshotHash: hash(atRestBuffer), pixelHash: atRestPixelHash }, hover: { ...hover, screenshotHash: hash(hoverBuffer) } },
      hoverState,
    });
  }

  // Keyboard focus, with real keys: tab from the page start until a toolbar item has focus.
  const focusSamples = [];
  for (const listSelector of ['.ckeditor5-toolbar-active__buttons .ckeditor5-toolbar-item', '.ckeditor5-toolbar-available__buttons .ckeditor5-toolbar-item']) {
    const targetId = await page.locator(listSelector).first().getAttribute('data-id');
    await page.evaluate(() => { document.body.focus(); if (document.activeElement !== document.body) document.activeElement.blur(); });
    let tabs = 0, focused = false;
    while (tabs < 200 && !focused) {
      await page.keyboard.press('Tab');
      tabs += 1;
      focused = await page.evaluate((id) => document.activeElement?.closest?.('.ckeditor5-toolbar-item')?.dataset.id === id, targetId);
    }
    if (!focused) { focusSamples.push({ id: targetId, reached: false, tabs }); continue; }
    const li = page.locator(`.ckeditor5-toolbar-item[data-id="${targetId}"]`).first();
    const outline = await li.evaluate((el) => { const s = getComputedStyle(el); return { outline: `${s.outlineWidth} ${s.outlineStyle} ${s.outlineColor}`, matchesFocusVisible: el.matches(':focus-visible') }; });
    const shot = await li.screenshot();
    const measured = measureColours(await pixels.colours(shot, { inset: 0 }));
    await page.screenshot({ path: path.join(run.out, `${side}-focus-${targetId.replace(/[^\w-]/g, '_')}.png`), clip: await li.boundingBox().then((b) => ({ x: Math.max(0, b.x - 8), y: Math.max(0, b.y - 8), width: b.width + 16, height: b.height + 16 })).catch(() => undefined) }).catch(() => {});
    focusSamples.push({ id: targetId, reached: true, tabs, outline, rendered: measured });
    await page.keyboard.press('Escape').catch(() => {});
  }

  // Focus appearance of a control: the outline lives on the list option, not the masked button.
  const axe = await axeScan(page);

  let interactionResults = null;
  if (interaction) interactionResults = await runInteraction(page, side, pixels, rec);

  await page.locator('.ckeditor5-toolbar-fieldset').screenshot({ path: path.join(run.out, `${side}-fieldset.png`) }).catch(() => page.screenshot({ path: path.join(run.out, `${side}-fieldset.png`), fullPage: false }));
  await page.locator('.ckeditor5-toolbar-active__buttons').screenshot({ path: path.join(run.out, `${side}-active-toolbar.png`) }).catch(() => {});
  await page.locator('.ckeditor5-toolbar-available__buttons').screenshot({ path: path.join(run.out, `${side}-available-buttons.png`) }).catch(() => {});
  rec.axe = axe;
  rec.probe = probe;
  rec.rows = rows;
  rec.focusSamples = focusSamples;
  rec.interaction = interactionResults;
  await rec.close(run.out);
  delete rec.collect; delete rec.close;
  return rec;
}

function measureColours(colours) {
  const dominant = colours[0];
  let best = null;
  for (const c of colours.slice(1)) {
    if (c.share < 0.002) continue;
    const ratio = contrast(dominant.rgb, c.rgb);
    if (ratio >= 3 && (!best || ratio > best.contrast)) best = { colour: c.rgb, contrast: +ratio.toFixed(2), share: +c.share.toFixed(4) };
  }
  return { visible: !!best, dominant: dominant.rgb, dominantShare: +dominant.share.toFixed(4), icon: best, distinctColours: colours.length };
}

function contrast(a, b) {
  const lum = ([r, g, b2]) => {
    const f = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b2);
  };
  const [l1, l2] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

const order = (page) => page.$$eval('.ckeditor5-toolbar-active__buttons .ckeditor5-toolbar-item', (items) => items.map((i) => i.dataset.id));

async function runInteraction(page, side, pixels, rec) {
  const result = {};
  // Keyboard reordering: focus an active item with real keys, move it left, then put it back.
  const before = await order(page);
  const first = page.locator(`.ckeditor5-toolbar-active__buttons .ckeditor5-toolbar-item[data-id="${before[1]}"]`).first();
  await first.focus();
  const announcements = [];
  await page.keyboard.press('ArrowLeft');
  await page.waitForTimeout(400);
  result.keyboardMovedOrder = await order(page);
  result.keyboardReorderChanged = JSON.stringify(result.keyboardMovedOrder) !== JSON.stringify(before);
  // Where does focus land after the re-render? Recorded for both sides; the
  // admin UI restores focus through an AJAX focus event, which can differ
  // under automation. The test then re-focuses the moved item so the reverse
  // move is a fair test of the reorder, not of focus restoration.
  result.focusAfterMove = await page.evaluate(() => {
    const a = document.activeElement;
    return a ? { tag: a.tagName, id: a.dataset?.id || null, cls: String(a.className).slice(0, 60) } : null;
  });
  await page.locator(`[data-button-list="ckeditor5-toolbar-active-buttons"] [data-id="${before[1]}"]`).first().focus();
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(400);
  result.keyboardRestored = JSON.stringify(await order(page)) === JSON.stringify(before);
  // Core announces only add (ArrowDown) and remove (ArrowUp) for this UI; the
  // left/right moves are deliberately silent, so an empty list is expected.
  const speech = await rec.collect();
  result.announcements = [...(speech.speech?.announce || [])];
  result.liveRegion = await page.evaluate(() => {
    const l = document.getElementById('drupal-live-announce');
    return l ? l.textContent.trim().slice(-200) : null;
  });
  result.announcementNote = 'ArrowLeft/ArrowRight moves are silent in core (only ArrowUp/ArrowDown announce).';

  // Dragging: press on the first active item, move over the third, release.
  const target = before[0];
  const source = page.locator(`.ckeditor5-toolbar-active__buttons .ckeditor5-toolbar-item[data-id="${target}"]`).first();
  const destination = page.locator(`.ckeditor5-toolbar-active__buttons .ckeditor5-toolbar-item[data-id="${before[2]}"]`).first();
  try {
    await source.dragTo(destination, { timeout: 5000 });
    await page.waitForTimeout(400);
    result.dragOrder = await order(page);
    result.dragChanged = JSON.stringify(result.dragOrder) !== JSON.stringify(result.keyboardMovedOrder);
    const dragButton = page.locator(`.ckeditor5-toolbar-active__buttons .ckeditor5-toolbar-item[data-id="${target}"] .ckeditor5-toolbar-button`).first();
    const dragBuffer = await dragButton.screenshot();
    result.dragIcon = measureColours(await pixels.colours(dragBuffer, { inset: 1 }));
  } catch (e) {
    result.drag = `could not drag: ${String(e).slice(0, 160)}`;
  }

  // Save and restore: persist the order, reload, then put it back and save again.
  const changed = await order(page);
  // Core main renders the form action as #edit-actions-submit; older markup used #edit-submit.
  const save = page.locator('#edit-actions-submit, #edit-submit').first();
  await save.click();
  await page.waitForLoadState('load');
  await page.locator('#ckeditor5-toolbar-app .ckeditor5-toolbar-item').first().waitFor({ state: 'visible', timeout: 30000 });
  const afterReload = await order(page);
  result.savePersisted = JSON.stringify(afterReload) === JSON.stringify(changed);
  // Put the original order back using keyboard moves, then save again.
  for (let attempt = 0; attempt < 4 && JSON.stringify(await order(page)) !== JSON.stringify(before); attempt += 1) {
    const current = await order(page);
    const wanted = before.find((id, index) => current[index] !== id);
    if (!wanted) break;
    const item = page.locator(`.ckeditor5-toolbar-active__buttons .ckeditor5-toolbar-item[data-id="${wanted}"]`).first();
    await item.focus();
    const from = current.indexOf(wanted);
    const to = before.indexOf(wanted);
    for (let i = 0; i < Math.abs(from - to); i += 1) await page.keyboard.press(from > to ? 'ArrowLeft' : 'ArrowRight');
    await page.waitForTimeout(200);
  }
  result.restoredOrder = await order(page);
  if (JSON.stringify(result.restoredOrder) !== JSON.stringify(before)) result.restoreNote = 'order was not fully restored by keyboard';
  await page.locator('#edit-actions-submit, #edit-submit').first().click();
  await page.waitForLoadState('load');
  result.finalOrder = await order(page);
  result.restorePersisted = JSON.stringify(result.finalOrder) === JSON.stringify(before);
  result.savedConfig = { before, changed, afterReload, restored: result.finalOrder };
  void announcements;
  return result;
}

const { browser, environment } = await launch(run);
run.browser = browser;
const results = baseResults(run, environment);
results.environment = { ...results.environment, rtl, interaction, page: PAGE };
// The shared DDEV router is restarted by other work on this machine, which can
// reset a navigation mid-run; retry a side a few times before giving up.
async function measureSideWithRetry(side) {
  let lastError;
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    try {
      return await measureSide(run, side);
    } catch (error) {
      lastError = error;
      console.warn(`${side} attempt ${attempt} failed: ${String(error.message).slice(0, 120)}`);
      await new Promise((resolve) => setTimeout(resolve, attempt * 5000));
    }
  }
  throw lastError;
}

try {
  for (const side of ['before', 'after']) {
    console.log(`running ${side} (${run.v[side].env}) ...`);
    results.sides[side] = await measureSideWithRetry(side);
  }
} finally {
  await browser.close();
}

// ------------------------------------------------------------------ verdict
const B = results.sides.before, A = results.sides.after;
const forced = run.forced;
const invisibleIds = (side) => side.rows.filter((r) => !r.rendered.atRest.visible).map((r) => r.id);
const beforeInvisible = invisibleIds(B), afterInvisible = invisibleIds(A);
const hoverLost = A.rows.filter((r) => r.rendered.atRest.visible && !r.rendered.hover.visible).map((r) => r.id);
const focusLost = A.focusSamples.filter((f) => f.reached && f.rendered && !f.rendered.visible).map((f) => f.id);
const normalModeDiffs = forced ? [] : A.rows.map((r, index) => {
  const b = B.rows[index];
  const same = b && b.id === r.id && b.list === r.list
    && (r.rendered.atRest.pixelHash ? b.rendered.atRest.pixelHash === r.rendered.atRest.pixelHash : b.rendered.atRest.screenshotHash === r.rendered.atRest.screenshotHash);
  return same ? null : `${index}:${r.serverLabel || r.id}`;
}).filter(Boolean);
const checked = A.rows.filter((r) => !r.divider).length;
results.summary = {
  forcedColors: forced,
  colourScheme: run.scheme,
  items: { before: B.rows.length, after: A.rows.length },
  iconControl: {
    beforeInvisible,
    afterInvisible,
    hoverLost,
    focusLost,
    // The Before side is the negative control: if the measurement did not detect
    // its broken icons, it cannot be trusted to say the After side is fixed.
    negativeControlPassed: forced ? beforeInvisible.length > 0 || run.scheme === 'light' : null,
  },
  normalModeDiffs,
  normalModeRawHashDiffs: forced ? [] : A.rows.filter((r, index) => B.rows[index] && B.rows[index].rendered.atRest.screenshotHash !== r.rendered.atRest.screenshotHash).length,
  filteredButtons: A.rows.filter((r) => r.button.filter && r.button.filter !== 'none').length,
};
results.checks = [
  { label: 'Every toolbar item was found on both sides', probe: 'item count', expect: true, actual: B.rows.length === A.rows.length && A.rows.length >= 31, kind: 'precondition' },
  { label: forced ? 'Before: at least one icon is invisible (negative control)' : 'Before: rendered pixels recorded', probe: invisibleIds(B).length, expect: forced ? '>0' : 'recorded', actual: forced ? beforeInvisible.length : B.rows.length, kind: 'precondition' },
  ...(forced ? [
    { label: 'After: every toolbar item renders a distinguishable icon/text', probe: 'invisible items', expect: 0, actual: afterInvisible.length, kind: 'fix' },
    { label: 'After: hover does not lose a visible icon', probe: 'hover lost', expect: 0, actual: hoverLost.length, kind: 'fix' },
    { label: 'After: keyboard focus keeps the icon visible and the outline is on the list option', probe: 'focus lost', expect: 0, actual: focusLost.length, kind: 'fix' },
  ] : [
    { label: 'Normal mode: rendering is byte-identical to Before', probe: 'different screenshot hashes', expect: 0, actual: normalModeDiffs.length, kind: 'regression' },
  ]),
  ...(run.v.slug.includes('combined') ? [{ label: 'After: no colour filter is left on toolbar buttons in forced colors (the #3637246 invert is cancelled)', probe: 'buttons with filter', expect: 0, actual: results.summary.filteredButtons, kind: 'fix' }] : []),
];
results.unexpected = forced
  ? afterInvisible.length + hoverLost.length + focusLost.length + (run.v.slug.includes('combined') ? results.summary.filteredButtons : 0)
  : normalModeDiffs.length;
results.verdict = !forced
  ? 'mixed'
  : results.unexpected === 0 && beforeInvisible.length > 0
    ? 'reproduced-and-fixed'
    : afterInvisible.length === 0 && beforeInvisible.length === 0
      ? 'not-reproduced'
      : 'reproduced-not-fixed';

const md = `# #3534229 live Drupal comparison — ${run.browser} ${run.scheme}${forced ? ' forced-colors' : ''}${rtl ? ' RTL' : ''} ${run.viewport.width}x${run.viewport.height}\n\n`
  + `DRAFT. ${results.verdict}. ${forced ? 'Forced-colors mode: rendered pixels are the evidence.' : 'Normal mode: regression evidence only (screenshot hashes are compared with Before).'}\n\n`
  + `Page: \`${PAGE}\`. ${rtl ? 'RTL was checked by setting `dir="rtl"` on <html> after load (CSS-level direction, not a translated UI).\n\n' : ''}`
  + `Every toolbar item was discovered in the DOM (${A.rows.length} items). For each item: plugin, toolbar-item id, role, accessible name, background-image, mask-image, colours, forced-color-adjust, geometry, at-rest/hover/focus rendered pixels, screenshot hash and tooltip state are in \`results.json\` under \`sides.<side>.rows\`.\n\n`
  + `## Verdict rows\n\n`
  + results.checks.map((c) => `- ${c.kind}: **${c.label}** — expected ${c.expect}, got ${c.actual}`).join('\n') + '\n\n'
  + `## Invisible items\n\nBefore: ${beforeInvisible.length ? beforeInvisible.join(', ') : 'none'}. After: ${afterInvisible.length ? afterInvisible.join(', ') : 'none'}.\n\n`
  + `Low contrast is reported per item in \`rows[].rendered.atRest.icon.contrast\`; icons are expected to reach at least 3:1 against the dominant colour of the control.\n\n`
  + `## Not verified\n\nRendered forced-colors pixels in Firefox/Safari/Edge, a real Windows contrast theme, custom user palettes and a screen-reader pass were not verified by this run.\n\n`
  + contextMarkdown(results) + '\n' + speechMarkdown(results) + '\n';

const out = writeRun(run, results, md);
console.log(out);
console.log(`verdict ${results.verdict}; before invisible ${beforeInvisible.length}, after invisible ${afterInvisible.length}, unexpected ${results.unexpected}`);
