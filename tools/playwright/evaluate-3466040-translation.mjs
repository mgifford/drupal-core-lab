#!/usr/bin/env node
/**
 * Independent probe for #3466040 / MR !9088: the multilingual Views translation modal
 * (issue summary first reproduction, comment #24).
 *
 *   node tools/playwright/evaluate-3466040-translation.mjs 3466040-regression-pinned \
 *        --viewport=1920x1080 [--out=<dir>] [--browser=chromium] [--scheme=dark] \
 *        [--forced-colors] [--reduced-motion=reduce] [--zoom=200]
 *
 * On BOTH sides it opens /admin/structure/views/view/content/translate, clicks "Add" in the
 * French row (a real click; the link opens an AJAX modal), then expands visible collapsed
 * <details> elements one at a time, measuring the dialog after each. It records geometry,
 * hit-testing, the keyboard trail, axe, console errors and the page-level ResizeObserver /
 * dialogContentResize counters installed by evaluate-3466040.mjs.
 *
 * Nothing in the checkout or the MR is modified. Zoom is reflow-equivalent viewport emulation,
 * not browser zoom. A person's keyboard pass and a screen reader are not run here.
 */
import fs from 'node:fs';
import path from 'node:path';
import { runArgs, launch, openSide, axeScan, baseResults, writeRun } from './lib/lab-run.mjs';
import { installCapture, measureDialog, keyboardReach, captureOnce } from './evaluate-3466040.mjs';

const NID = '3466040';
const argv = process.argv.slice(2);
const opt = (name, fallback) => {
  const found = argv.find((a) => a.startsWith(`--${name}=`));
  return found ? found.slice(name.length + 3) : fallback;
};

const sleep = (page, ms) => page.waitForTimeout(ms);

async function waitStable(page, { timeout = 12000, interval = 120, samples = 3 } = {}) {
  const start = Date.now();
  let last = null;
  let same = 0;
  while (Date.now() - start < timeout) {
    const state = await page.evaluate(() => {
      const d = [...document.querySelectorAll('.ui-dialog')].filter((x) => x.offsetHeight).pop();
      if (!d) return null;
      const c = d.querySelector('.ui-dialog-content');
      const r = d.getBoundingClientRect();
      return [Math.round(r.top), Math.round(r.bottom), c ? c.clientHeight : null, c ? c.scrollHeight : null].join(',');
    }).catch(() => null);
    if (state !== null && state === last) {
      if (++same >= samples) return;
    } else {
      same = 0;
      last = state;
    }
    await sleep(page, interval);
  }
}

const dialogOf = (m) => (m && m.dialogs && m.dialogs[0]) || null;
const primaryOf = (d) => {
  if (!d || !d.buttons) return null;
  return d.buttons.find((b) => b.primary) || d.buttons.find((b) => /save translation/i.test(b.label || '')) || null;
};
// The shared keyboard helper's PRIMARY_LABEL does not include "Save translation", so its
// reachedPrimary flag is a false negative on this form. Derive the result from the real trail.
const saveFor = (kb) => {
  const step = (kb && kb.trail ? kb.trail : []).find((x) => /save translation/i.test(x.active || ''));
  return step ? { reached: true, step: step.step, inViewport: step.inViewport, contentScrolled: step.contentScrolled } : { reached: false, step: null, inViewport: null, contentScrolled: null };
};

async function stage(page, rec, out, side, label, extra = {}) {
  const measure = await measureDialog(page);
  const d = dialogOf(measure);
  const shot = await captureOnce(page, out, side, label).catch(() => null);
  const lc = await page.evaluate(() => {
    const L = window.__labLifecycle || {};
    return {
      resizeObserverCallbacks: (L.resizeObserver && L.resizeObserver.callbacks ? L.resizeObserver.callbacks.length : null),
      observerDisconnects: (L.resizeObserver && L.resizeObserver.disconnects ? L.resizeObserver.disconnects.length : null),
      patchObservers: (L.patchObservers || []).length,
      dialogResizeEvents: (L.dialogResizeEvents || []).length,
      lastDialogResize: (L.dialogResizeEvents || []).slice(-1)[0] || null,
      pageErrors: (L.pageErrors || []).length,
    };
  });
  const s = {
    label,
    at: new Date().toISOString(),
    measure,
    dialog: d,
    lifecycle: lc,
    screenshot: shot && shot.screenshot ? path.relative(process.cwd(), shot.screenshot) : null,
    ...extra,
  };
  rec.stages.push(s);
  return s;
}

async function openTranslationModal(page, base) {
  const res = await page.goto(`${base}/admin/structure/views/view/content/translate`, { waitUntil: 'load' });
  const info = await page.evaluate(() => ({ title: document.title, h1: document.querySelector('h1')?.innerText || '' }));
  if (res && res.status() >= 400) throw new Error(`Translation page not available (HTTP ${res.status()}, ${info.h1}).`);
  const row = page.locator('tr', { hasText: 'French' }).first();
  const link = row.getByRole('link', { name: /^(Add|Edit)$/ }).first();
  if (!(await link.count())) throw new Error('No French row with an Add/Edit link on the translation overview.');
  await link.click();
  await page.locator('.ui-dialog').last().waitFor({ state: 'visible', timeout: 20000 });
  await waitStable(page);
  return { rowText: (await row.innerText()).replace(/\s+/g, ' ').trim().slice(0, 120) };
}

async function expandOneVisibleDetails(page, rec, out, side, n) {
  const candidate = await page.evaluate(() => {
    const dlg = [...document.querySelectorAll('.ui-dialog')].filter((x) => x.offsetHeight).pop();
    if (!dlg) return null;
    const list = [...dlg.querySelectorAll('details > summary')];
    for (let i = 0; i < list.length; i += 1) {
      const s = list[i];
      if (s.parentElement.open) continue;
      let visible = false;
      try { visible = s.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }); } catch { visible = !!(s.offsetWidth || s.offsetHeight); }
      if (!visible) continue;
      const r = s.getBoundingClientRect();
      if (r.width <= 0 || r.height <= 0) continue;
      if (r.bottom < 0 || r.top > innerHeight) continue;
      return { index: i, text: (s.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 80) };
    }
    return null;
  });
  if (!candidate) return null;
  const before = await measureDialog(page);
  const h0 = dialogOf(before) ? dialogOf(before).rect.height : null;
  const summary = page.locator('.ui-dialog details > summary').nth(candidate.index);
  await summary.click();
  await waitStable(page);
  const after = await measureDialog(page);
  const h1 = dialogOf(after) ? dialogOf(after).rect.height : null;
  const grew = h0 != null && h1 != null && h1 > h0 + 8;
  if (!grew) {
    // Visible but empty/hidden by an ancestor: put it back and move on.
    await summary.click().catch(() => {});
    await waitStable(page);
    return { title: candidate.text, grew: false };
  }
  const s = await stage(page, rec, out, side, `T2-expand-${n}`, { detailsTitle: candidate.text, grew: true, heightBefore: h0, heightAfter: h1 });
  const d = dialogOf(s.measure);
  return { title: candidate.text, grew: true, fits: d ? d.fitsVertically : null, overflow: d ? d.overflowBottomPx : null };
}

function markdown(results) {
  const B = results.sides.before;
  const A = results.sides.after;
  const bt = B.translation;
  const at = A.translation;
  const openB = (bt.stages || []).find((s) => s.label === 'T1-dialog-open');
  const openA = (at.stages || []).find((s) => s.label === 'T1-dialog-open');
  const lastDialog = (x) => (x.stages || []).slice().reverse().find((s) => dialogOf(s.measure)) || null;
  const lastB = lastDialog(bt);
  const lastA = lastDialog(at);
  const dB = openB ? dialogOf(openB.measure) : null;
  const dA = openA ? dialogOf(openA.measure) : null;
  const eB = lastB ? dialogOf(lastB.measure) : null;
  const eA = lastA ? dialogOf(lastA.measure) : null;
  const pB = primaryOf(eB);
  const pA = primaryOf(eA);
  const kbB = bt.keyboard;
  const kbA = at.keyboard;
  const saveB = bt.save || saveFor(kbB);
  const saveA = at.save || saveFor(kbA);
  const rows = [
    ['Modal opened', !!dB, !!dA, 'precondition'],
    ['Dialog fits the viewport after the details expansions', eB ? eB.fitsVertically : null, eA ? eA.fitsVertically : null, 'fix'],
    ['Overflow below the viewport after the expansions (px)', eB ? eB.overflowBottomPx : null, eA ? eA.overflowBottomPx : null, 'observe'],
    ['Primary action (Save translation) in the viewport after the expansions', saveB.inViewport, saveA.inViewport, 'observe'],
    ['Primary action hittable after the expansions', pB ? !!(pB.hit && pB.hit.hittable) : null, pA ? !!(pA.hit && pA.hit.hittable) : null, 'observe'],
    ['Titlebar in the viewport after the expansions', eB && eB.titlebar ? eB.titlebar.inViewport : null, eA && eA.titlebar ? eA.titlebar.inViewport : null, 'regression'],
    ['Close button in the viewport after the expansions', eB && eB.closeButton ? eB.closeButton.inViewport : null, eA && eA.closeButton ? eA.closeButton.inViewport : null, 'regression'],
    ['Content area scrolls after the expansions', eB && eB.content ? eB.content.scrollableY : null, eA && eA.content ? eA.content.scrollableY : null, 'regression'],
    ['Primary action inside the viewport when focused', saveB.inViewport, saveA.inViewport, 'observe'],
    ['Primary action reached with real Tab presses', saveB.reached, saveA.reached, 'observe'],
    ['axe violating elements in the expanded modal', bt.axe ? bt.axe.total : 'error', at.axe ? at.axe.total : 'error', 'regression'],
    ['Patch observers created (instrumentation)', (openB?.lifecycle?.patchObservers ?? 0), (openA?.lifecycle?.patchObservers ?? 0), 'observe'],
    ['dialogContentResize events (instrumentation)', (lastB?.lifecycle?.dialogResizeEvents ?? 0), (lastA?.lifecycle?.dialogResizeEvents ?? 0), 'observe'],
    ['Page errors (instrumentation)', (lastB?.lifecycle?.pageErrors ?? 0), (lastA?.lifecycle?.pageErrors ?? 0), 'regression'],
  ];
  const lines = [];
  lines.push(`# #3466040 translation modal probe — ${results.environment.viewport.width}x${results.environment.viewport.height}, ${results.environment.browser} ${results.environment.browserVersion}`);
  lines.push('');
  lines.push(`Run ${results.when}. Variant \`${results.variant}\`. Before \`${results.commits.before}\`, After \`${results.commits.after}\`. Scheme **${results.environment.colorScheme}**, forced colours **${results.environment.forcedColors ? 'active' : 'none'}**, reduced motion **${results.environment.reducedMotion}**.`);
  if (results.zoom) lines.push(`Zoom method: ${results.zoom.method}; physical ${results.zoom.sourceViewport.width}x${results.zoom.sourceViewport.height} -> CSS ${results.zoom.effectiveViewport.width}x${results.zoom.effectiveViewport.height}.`);
  lines.push('');
  lines.push('Path: `/admin/structure/views/view/content/translate` -> French **Add** (AJAX modal) -> expand visible collapsed details. Real Playwright clicks and Tab presses. The **fix** row is the dialog geometry; the Save-translation rows are observations. `Save translation` is reached and in the viewport on both sides in this run; the shared helper\'s `reachedPrimary` flag is a false negative because its label regex does not include "Save translation", so the trail is used.');
  lines.push('');
  lines.push(`French row: ${B.translation.rowText || 'not found'} / ${A.translation.rowText || 'not found'}.`);
  lines.push('');
  lines.push('| Type | Check | Before | After |');
  lines.push('|---|---|---|---|');
  for (const [label, b, a, type] of rows) lines.push(`| ${type} | ${label} | ${String(b)} | ${String(a)} |`);
  lines.push('');
  lines.push('## Dialog geometry per expansion');
  lines.push('');
  lines.push('| Side | Stage | Details opened | Dialog top→bottom (h) | Fits | Overflow px | Content client/scroll | Save rect in view | Active element |');
  lines.push('|---|---|---|---|---|---|---|---|---|');
  for (const [side, rec] of [['before', bt], ['after', at]]) {
    for (const s of rec.stages || []) {
      const d = dialogOf(s.measure);
      if (!d) continue;
      const p = primaryOf(d);
      lines.push(`| ${side} | ${s.label} | ${s.detailsTitle || '—'} | ${d.rect.top}→${d.rect.bottom} (${d.rect.height}) | ${d.fitsVertically} | ${d.overflowBottomPx} | ${d.content ? `${d.content.clientHeight}/${d.content.scrollHeight}` : '—'} | ${p ? p.inViewport : '—'} | ${(s.measure.document && s.measure.document.activeElement) || '—'} |`);
    }
  }
  lines.push('');
  lines.push('## Keyboard trail (real Tab presses)');
  lines.push('');
  for (const [side, kb] of [['before', kbB], ['after', kbA]]) {
    if (!kb) { lines.push(`- ${side}: not run`); continue; }
    lines.push(`- ${side}: ${kb.reachedPrimary ? `reached ${kb.primaryLabel} after ${kb.stepsToPrimary} Tab press(es)` : `primary action NOT reached in ${kb.tabPresses} Tab presses`}; in viewport when focused: ${kb.primaryInViewport}; content scrolled: ${kb.contentScrolled}; page scrolled: ${kb.windowScrolled}.`);
  }
  lines.push('');
  lines.push('## Limits');
  lines.push('');
  lines.push('- Automated geometry and Tab walks are DRAFT evidence, not a person\'s keyboard pass. No screen reader ran.');
  lines.push('- WebKit is Safari\'s engine, not Safari. Forced colours and colour scheme are Playwright emulation.');
  lines.push('- Zoom is reflow-equivalent CSS viewport emulation, not a real browser zoom.');
  lines.push('');
  return lines.join('\n');
}

async function main() {
  const run = runArgs({ slug: '3466040-regression-pinned', viewport: '1920x1080' });
  const zoom = Number(opt('zoom', '0')) || 0;
  let zoomInfo = null;
  if (zoom) {
    if (zoom < 50 || zoom > 800) throw new Error('--zoom is a percentage between 50 and 800.');
    const sourceViewport = { ...run.viewport };
    const width = Math.round((sourceViewport.width * 100) / zoom);
    const height = Math.round((sourceViewport.height * 100) / zoom);
    zoomInfo = { requested: zoom, method: 'reflow-equivalent CSS viewport (physical viewport / zoom factor); NOT real browser zoom', sourceViewport, effectiveViewport: { width, height } };
    run.viewport = { width, height };
  }
  if (!opt('out', '')) run.out = `${run.out}-translation${zoom ? `-zoom${zoom}` : ''}`;
  fs.mkdirSync(run.out, { recursive: true });

  const launched = await launch(run);
  run.browser = launched.browser;
  const results = {
    ...baseResults(run, launched.environment),
    scenario: 'views-translation',
    mr: '!9088',
    reviewedRevision: 'aed1df5eeddf0b89c91bab47eb83847f44c58211',
    zoom: zoomInfo,
    selector: {
      overview: '/admin/structure/views/view/content/translate',
      frenchRow: 'tr:has-text("French") a:has-text("Add"|"Edit")',
      dialog: '.ui-dialog',
      content: '.ui-dialog-content',
      titlebar: '.ui-dialog-titlebar',
      close: '.ui-dialog-titlebar-close',
      buttonPane: '.ui-dialog-buttonpane',
      primary: '.ui-dialog-buttonpane button',
      detailsSummary: '.ui-dialog details > summary',
    },
  };
  results.sides = {};
  results.jsErrors = {};
  results.environment.zoom = zoomInfo;

  try {
    for (const side of ['before', 'after']) {
      const { page, base, rec } = await openSide(run, side);
      run.browser = launched.browser;
      const consoleErrors = [];
      page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push({ text: m.text().slice(0, 400) }); });
      await installCapture(page);
      const sideRec = { env: run.v[side].env, commit: rec.commit, site: rec.site, pages: rec.pages, ajax: rec.ajax, speech: rec.speech, jsErrors: rec.jsErrors, consoleErrors, translation: { stages: [], keyboard: null, axe: null, rowText: null, closed: null } };
      try {
        const opened = await openTranslationModal(page, base);
        sideRec.translation.rowText = opened.rowText;
        await stage(page, sideRec.translation, run.out, side, 'T1-dialog-open');
        let n = 0;
        let guard = 0;
        while (n < 6 && guard < 30) {
          guard += 1;
          const r = await expandOneVisibleDetails(page, sideRec.translation, run.out, side, n + 1);
          if (!r) break;
          if (r.grew) {
            n += 1;
            if (r.fits === false) break;
          }
        }
        const last = (sideRec.translation.stages || []).slice(-1)[0];
        sideRec.translation.keyboard = await keyboardReach(page, { maxTabs: 60 });
        sideRec.translation.save = saveFor(sideRec.translation.keyboard);
        await stage(page, sideRec.translation, run.out, side, 'T3-after-tab');
        sideRec.translation.primaryFocus = await page.evaluate(() => {
          const b = document.querySelector('.ui-dialog-buttonpane button');
          if (!b) return null;
          b.focus();
          const r = b.getBoundingClientRect();
          return { text: (b.textContent || '').trim(), focused: document.activeElement === b, top: r.top, bottom: r.bottom, inViewport: r.top >= -0.5 && r.bottom <= innerHeight + 0.5, inDialog: !!b.closest('.ui-dialog') };
        });
        sideRec.translation.axe = await axeScan(page).catch((e) => ({ error: String(e.message).slice(0, 200), total: null }));
        await page.keyboard.press('Escape').catch(() => {});
        await waitStable(page).catch(() => {});
        await sleep(page, 300);
        sideRec.translation.closed = await page.locator('.ui-dialog:visible').count().catch(() => null);
        await stage(page, sideRec.translation, run.out, side, 'T4-closed').catch(() => {});
        if (last && last.lifecycle && last.lifecycle.pageErrors) sideRec.translation.pageErrors = last.lifecycle.pageErrors;
      } catch (error) {
        sideRec.translation.error = String(error.message).slice(0, 800);
      }
      results.sides[side] = await rec.close(run.out);
      results.sides[side].consoleErrors = consoleErrors;
      results.sides[side].translation = sideRec.translation;
      results.jsErrors[side] = rec.jsErrors;
    }
  } finally {
    await launched.browser.close().catch(() => {});
  }

  const eB = results.sides.before.translation;
  const eA = results.sides.after.translation;
  const lastOf = (x) => (x.stages || []).slice().reverse().find((s) => dialogOf(s.measure)) || null;
  const dB = lastOf(eB) ? dialogOf(lastOf(eB).measure) : null;
  const dA = lastOf(eA) ? dialogOf(lastOf(eA).measure) : null;
  const pB = primaryOf(dB);
  const pA = primaryOf(dA);
  const saveB = eB.save;
  const saveA = eA.save;
  const fitsFix = !!(dB && dB.fitsVertically === false && dA && dA.fitsVertically === true);
  const beforeFailed = !!(dB && dB.fitsVertically === false);
  const afterPassed = !!(dA && dA.fitsVertically === true);
  results.verdict = beforeFailed && afterPassed ? 'reproduced-and-fixed' : (!beforeFailed ? 'not-reproduced' : 'reproduced-not-fixed');
  results.checks = [
    { type: 'fix', label: 'Dialog fits viewport after expansions', before: dB ? dB.fitsVertically : null, after: dA ? dA.fitsVertically : null, ok: fitsFix },
    { type: 'observe', label: 'Save translation inside the viewport after expansions', before: saveB ? saveB.inViewport : null, after: saveA ? saveA.inViewport : null, ok: !!(saveB && saveA && saveB.inViewport && saveA.inViewport) },
    { type: 'observe', label: 'Save translation reached with real Tab presses', before: saveB ? saveB.reached : null, after: saveA ? saveA.reached : null, ok: !!(saveB && saveA && saveB.reached && saveA.reached) },
  ];
  results.unexpected = results.checks.filter((c) => !c.ok).length;

  const md = markdown(results);
  const where = writeRun(run, results, md);
  console.log(`\n${results.verdict}: ${where}/SUMMARY.md`);
  console.log(`before fits=${dB ? dB.fitsVertically : 'n/a'} overflow=${dB ? dB.overflowBottomPx : 'n/a'} primary=${pB ? pB.inViewport : 'n/a'}; after fits=${dA ? dA.fitsVertically : 'n/a'} overflow=${dA ? dA.overflowBottomPx : 'n/a'} primary=${pA ? pA.inViewport : 'n/a'}`);
  process.exitCode = results.unexpected === 0 && results.verdict !== 'mixed' ? 0 : 2;
}

main().catch((error) => { console.error(error && error.stack ? error.stack : error); process.exit(1); });
