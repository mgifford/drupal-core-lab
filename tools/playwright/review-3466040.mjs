#!/usr/bin/env node
/**
 * Independent review probe for Drupal core #3466040 / MR !9088.
 *
 * Reproduces the dialog overflow with the MR's own fixture (/dialog_renderer-test-links ->
 * "Details modal!" -> "Show more content") on BOTH sides, runs the keyboard and repeated
 * open/close paths, and records ResizeObserver / dialogContentResize / geometry evidence.
 * It also runs component-level checks for explicit height, explicit max-height, autoResize:false
 * and two simultaneous Drupal dialogs.
 *
 * Usage (from the Lab repository root, both sites running):
 *
 *   node tools/playwright/review-3466040.mjs 3466040-regression-pinned
 *   node tools/playwright/review-3466040.mjs 3466040-regression-pinned --viewport=1024x768
 *   node tools/playwright/review-3466040.mjs 3466040-regression-pinned --viewport=1920x1080 --zoom=200
 *   node tools/playwright/review-3466040.mjs 3466040-regression-pinned --scheme=dark
 *   node tools/playwright/review-3466040.mjs 3466040-regression-pinned --forced-colors
 *   node tools/playwright/review-3466040.mjs 3466040-regression-pinned --reduced-motion=reduce
 *
 * --zoom divides the CSS viewport by the zoom factor (reflow-equivalent emulation). It is NOT
 * a real browser zoom: devicePixelRatio does not change and text is not rasterised at the zoomed
 * size. Results say which method was used.
 *
 * Nothing in the checkout or the MR is modified. The probe only reads the page, clicks and types
 * with trusted Playwright input, and writes evidence under reports/issues/3466040/playwright/.
 */
import fs from 'node:fs';
import path from 'node:path';
import { runArgs, launch, openSide, axeScan } from './lib/lab-run.mjs';
import { installCapture, measureDialog, keyboardReach } from './evaluate-3466040.mjs';

const NID = '3466040';
const SCENARIO = 'fixture';
const argv = process.argv.slice(2);
const opt = (n, d) => { const a = argv.find((x) => x.startsWith(`--${n}=`)); return a ? a.slice(n.length + 3) : d; };
const has = (n) => argv.includes(`--${n}`);
const sleep = (p, ms) => p.waitForTimeout(ms);

class PreconditionError extends Error {}

const round = (n) => Math.round(Number(n) * 10) / 10;
const compactRect = (r) => (r ? { top: round(r.top), right: round(r.right), bottom: round(r.bottom), left: round(r.left), width: round(r.width), height: round(r.height) } : null);

// ---------------------------------------------------------------------------------------------
// Lifecycle counters (installed by evaluate-3466040's installCapture before any page script).
// ---------------------------------------------------------------------------------------------
async function lifeRaw(page) {
  return page.evaluate(() => {
    const L = window.__labLifecycle || {};
    const ro = L.resizeObserver || { callbacks: [], observers: [], disconnects: [] };
    return {
      now: Math.round(performance.now()),
      ro: {
        callbacks: ro.callbacks.map((c) => ({ t: c.t, observer: c.observer, targets: c.targets })),
        observers: ro.observers.slice(),
        disconnects: ro.disconnects.slice(),
      },
      autoResize: L.autoResize || { calls: 0, wrapped: 0 },
      patch: (L.patchObservers || []).map((p) => ({ dialog: p.dialog, at: p.at, id: p.id, targets: p.targets, disconnected: p.disconnected })),
      events: (L.dialogResizeEvents || []).map((e) => ({ t: e.t, target: e.target, inDialogContent: e.inDialogContent })),
      pageErrors: (L.pageErrors || []).map((e) => ({ t: e.t, message: e.message })),
      consoleErrors: (L.consoleErrors || []).map((e) => ({ t: e.t, text: e.text })),
    };
  });
}

function summarize(raw, patchList = raw.patch) {
  const byObserver = {};
  for (const c of raw.ro.callbacks) byObserver[c.observer] = (byObserver[c.observer] || 0) + 1;
  const disconnectedIds = new Set(raw.ro.disconnects.map((d) => d.observer));
  const detail = patchList.map((p) => ({
    dialog: p.dialog,
    id: p.id,
    targets: p.targets,
    callbacks: byObserver[p.id] || 0,
    disconnected: !!p.disconnected || disconnectedIds.has(p.id),
  }));
  return {
    counts: {
      resizeObserverCallbacks: raw.ro.callbacks.length,
      observersCreated: raw.ro.observers.length,
      observerDisconnects: raw.ro.disconnects.length,
      autoResizeCalls: raw.autoResize.calls,
      autoResizeWrappedDialogs: raw.autoResize.wrapped,
      patchObservers: detail.length,
      patchObserverCallbacks: detail.reduce((n, d) => n + d.callbacks, 0),
      patchObserverDisconnected: detail.filter((d) => d.disconnected).length,
      dialogResizeEvents: raw.events.length,
      dialogResizeFromDialogContent: raw.events.filter((e) => e.inDialogContent).length,
      pageErrors: raw.pageErrors.length,
      consoleErrorsPage: raw.consoleErrors.length,
    },
    detail,
  };
}

// The patch stores the observer as jQuery data on the dialog content element. Reading it here
// (rather than in a dialog:aftercreate listener) is independent of listener order: on this
// fixture the dialog library is loaded by the AJAX response, after the page's own listeners.
async function patchObserversLive(page) {
  return page.evaluate(() => {
    const $ = window.jQuery;
    if (!$) return [];
    const out = [];
    for (const el of document.querySelectorAll('.ui-dialog-content')) {
      const observer = $(el).data('drupalAutoResizeObserver');
      if (observer) out.push({ dialog: el.id || el.className, id: observer.__labId || null, targets: observer.__labTargets ? observer.__labTargets.slice() : [], at: Math.round(performance.now()) });
    }
    return out;
  });
}

async function snapshot(ctx) {
  const raw = await lifeRaw(ctx.page);
  for (const p of await patchObserversLive(ctx.page)) if (p.id && !ctx.patch.has(p.id)) ctx.patch.set(p.id, p);
  const patchList = [...ctx.patch.values()];
  const s = summarize(raw, patchList);
  return { raw, ...s };
}

const COUNTERS = ['resizeObserverCallbacks', 'observersCreated', 'observerDisconnects', 'autoResizeCalls', 'autoResizeWrappedDialogs', 'patchObservers', 'patchObserverCallbacks', 'patchObserverDisconnected', 'dialogResizeEvents', 'dialogResizeFromDialogContent', 'pageErrors', 'consoleErrorsPage'];
function diffCounts(prev, next) {
  const d = {};
  for (const k of COUNTERS) d[k] = next[k] - (prev ? prev[k] : 0);
  return d;
}

// ---------------------------------------------------------------------------------------------
// Geometry helpers
// ---------------------------------------------------------------------------------------------
async function quick(page) {
  return page.evaluate(() => {
    const visible = (el) => { try { return el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }); } catch { return el.offsetHeight > 0; } };
    const d = [...document.querySelectorAll('.ui-dialog')].filter(visible).pop();
    if (!d) return { dialog: false };
    const c = d.querySelector('.ui-dialog-content');
    const p = d.querySelector('.ui-dialog-buttonpane');
    const close = d.querySelector('.ui-dialog-titlebar-close');
    const r = d.getBoundingClientRect();
    const cr = close ? close.getBoundingClientRect() : null;
    const btn = (el) => { const b = el.getBoundingClientRect(); return { text: (el.innerText || el.value || '').trim().slice(0, 30), top: Math.round(b.top), bottom: Math.round(b.bottom), inViewport: b.top >= -0.5 && b.bottom <= innerHeight + 0.5 && b.left >= -0.5 && b.right <= innerWidth + 0.5 }; };
    const L = window.__labLifecycle || {};
    const ro = L.resizeObserver || { callbacks: [], disconnects: [] };
    return {
      dialog: true,
      viewport: { width: innerWidth, height: innerHeight, dpr: devicePixelRatio },
      id: d.id || null,
      title: d.querySelector('.ui-dialog-title')?.innerText || null,
      rect: { top: Math.round(r.top * 10) / 10, bottom: Math.round(r.bottom * 10) / 10, height: Math.round(r.height * 10) / 10 },
      fits: r.top >= -1 && r.bottom <= innerHeight + 1,
      overflowBottomPx: Math.round(Math.max(0, r.bottom - innerHeight) * 10) / 10,
      content: c ? { clientHeight: c.clientHeight, scrollHeight: c.scrollHeight, scrollTop: c.scrollTop, scrollableY: c.scrollHeight > c.clientHeight + 1, overflowY: getComputedStyle(c).overflowY } : null,
      buttonPane: p ? { top: Math.round(p.getBoundingClientRect().top), bottom: Math.round(p.getBoundingClientRect().bottom), inViewport: p.getBoundingClientRect().bottom <= innerHeight + 0.5 } : null,
      closeButton: cr ? { top: Math.round(cr.top), bottom: Math.round(cr.bottom), inViewport: cr.top >= -0.5 && cr.bottom <= innerHeight + 0.5 } : null,
      buttons: [...d.querySelectorAll('.ui-dialog-buttonpane button')].map(btn),
      detailsOpen: [...d.querySelectorAll('details')].filter((x) => x.open).length,
      active: { tag: document.activeElement?.tagName || null, text: (document.activeElement?.innerText || '').trim().slice(0, 40) },
      lifecycle: {
        roCallbacks: (ro.callbacks || []).length,
        events: (L.dialogResizeEvents || []).length,
        patchObservers: (L.patchObservers || []).length,
        disconnects: (ro.disconnects || []).length,
      },
    };
  });
}

async function waitStable(page, { timeout = 10000, interval = 120, samples = 4 } = {}) {
  const sig = () => page.evaluate(() => {
    const visible = (el) => { try { return el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }); } catch { return el.offsetHeight > 0; } };
    const d = [...document.querySelectorAll('.ui-dialog')].filter(visible).pop();
    if (!d) return 'none';
    const c = d.querySelector('.ui-dialog-content');
    const r = d.getBoundingClientRect();
    return JSON.stringify([Math.round(r.top), Math.round(r.bottom), Math.round(r.height), c ? c.clientHeight : 0, c ? c.scrollHeight : 0, [...d.querySelectorAll('details')].filter((x) => x.open).length]);
  }).catch(() => null);
  const start = Date.now();
  let last = await sig();
  let same = 0;
  while (Date.now() - start < timeout) {
    await sleep(page, interval);
    const now = await sig();
    if (now && now === last) { same += 1; if (same >= samples - 1) return true; } else { same = 0; last = now; }
  }
  return false;
}

// ---------------------------------------------------------------------------------------------
// Stage capture
// ---------------------------------------------------------------------------------------------
async function stage(ctx, label, extra = {}) {
  const measure = await measureDialog(ctx.page).catch((e) => ({ error: String(e.message) }));
  const { raw, counts } = await snapshot(ctx);
  const delta = diffCounts(ctx.prev, counts);
  ctx.prev = counts;
  const file = path.join(ctx.out, `${ctx.side}-${label}-viewport.png`);
  await ctx.page.screenshot({ path: file }).catch(() => {});
  const st = {
    label,
    at: new Date().toISOString(),
    measure,
    lifecycle: { counts, delta, recentEvents: raw.events.slice(-8), pageErrors: raw.pageErrors.slice(-3), consoleErrors: raw.consoleErrors.slice(-3) },
    screenshot: path.basename(file),
    ...extra,
  };
  ctx.stages.push(st);
  console.log(`    ${ctx.side} ${label}`);
  return st;
}

const firstDialog = (st) => (st && st.measure && st.measure.dialogs ? st.measure.dialogs[0] || null : null);
const primaryOf = (d) => (d && d.buttons ? d.buttons.find((b) => b.primary) || null : null);
const vis = (m) => (m ? { inViewport: m.inViewport, partlyInViewport: m.partlyInViewport, visible: m.visible, hittable: m.hit ? m.hit.hittable : null, rect: compactRect(m.rect), hitBy: m.hit && m.hit.center ? m.hit.center.by || null : null } : null);

function geometry(st) {
  const d = firstDialog(st);
  if (!d) return { dialog: false };
  const p = primaryOf(d);
  return {
    dialog: true,
    title: st.measure.dialogs[0].title || null,
    rect: compactRect(d.rect),
    fitsVertically: d.fitsVertically,
    overflowBottomPx: d.overflowBottomPx,
    content: d.content ? { clientHeight: d.content.clientHeight, scrollHeight: d.content.scrollHeight, scrollableY: d.content.scrollableY, overflowY: d.content.computed ? d.content.computed['overflow-y'] : null } : null,
    titlebar: vis(d.titlebar),
    closeButton: vis(d.closeButton),
    buttonPane: vis(d.buttonPane),
    primary: p ? { label: p.label, ...vis(p) } : null,
    viewport: st.measure.viewport,
    media: st.measure.media,
  };
}

// ---------------------------------------------------------------------------------------------
// Scenario: the MR fixture
// ---------------------------------------------------------------------------------------------
async function runFixture(ctx) {
  const { page, base } = ctx;
  const rec = { scenario: SCENARIO, stages: [], keyboard: null, axe: null, samples: [], cycles: [], reopen: [], race: [], idle: null, close: null, postClose: null, errors: [] };
  const lite = !!ctx.lite;
  ctx.stages = rec.stages;
  ctx.prev = null;
  ctx.patch = new Map();
  console.log(`  ${ctx.side}: fixture${lite ? ' (lite)' : ''}`);

  await page.goto(`${base}/dialog_renderer-test-links`, { waitUntil: 'load' });
  await waitStable(page);
  const link = page.getByRole('link', { name: 'Details modal!' });
  if (!(await link.count())) {
    throw new PreconditionError('The "Details modal!" link is missing at /dialog_renderer-test-links. The test-support fixture must be applied and the dialog_renderer_test module enabled on BOTH sides (ddev drupal test:extensions-enable; ddev drupal module:install dialog_renderer_test).');
  }
  rec.fixtureLink = 'a[href="/dialog_renderer-content-details"] (text "Details modal!")';
  await stage(ctx, 'F0-links-page');

  await link.click();
  const dialog = page.locator('.ui-dialog').last();
  await dialog.waitFor({ state: 'visible', timeout: 15000 });
  await waitStable(page);
  await sleep(page, 400);
  const open = await stage(ctx, 'F1-dialog-open');
  rec.open = geometry(open);

  // Expand the details (real click) and sample the growth for 1.5 s.
  const t0 = Date.now();
  await dialog.locator('summary').first().click();
  for (let i = 0; i < 30; i += 1) {
    await sleep(page, 50);
    const q = await quick(page);
    rec.samples.push({ t: Date.now() - t0, bottom: q.rect ? q.rect.bottom : null, overflowBottomPx: q.overflowBottomPx, contentClient: q.content ? q.content.clientHeight : null, contentScroll: q.content ? q.content.scrollHeight : null, ro: q.lifecycle.roCallbacks, events: q.lifecycle.events, patchCallbacks: q.lifecycle.patchObservers });
  }
  await waitStable(page);
  await sleep(page, 300);
  const expanded = await stage(ctx, 'F2-expanded');
  rec.expanded = geometry(expanded);
  rec.expansion = { roCallbacks: expanded.lifecycle.delta.resizeObserverCallbacks, dialogResizeEvents: expanded.lifecycle.delta.dialogResizeEvents, patchObserverCallbacks: expanded.lifecycle.delta.patchObserverCallbacks };

  // Idle: is the observer quiet 400-1200 ms after the growth?
  await sleep(page, 400);
  const idleA = await snapshot(ctx);
  await sleep(page, 800);
  const idleB = await snapshot(ctx);
  rec.idle = {
    windowMs: 800,
    resizeObserverCallbacks: idleB.counts.resizeObserverCallbacks - idleA.counts.resizeObserverCallbacks,
    patchObserverCallbacks: idleB.counts.patchObserverCallbacks - idleA.counts.patchObserverCallbacks,
    dialogResizeEvents: idleB.counts.dialogResizeEvents - idleA.counts.dialogResizeEvents,
    pageErrors: idleB.counts.pageErrors - idleA.counts.pageErrors,
  };

  // Reachability: scroll the content, then Tab from the summary to the primary button.
  await page.evaluate(() => { const c = document.querySelector('.ui-dialog-content'); if (c) c.scrollTop = c.scrollHeight; });
  await sleep(page, 150);
  const scrolled = await stage(ctx, 'F3-content-scrolled');
  rec.scrolled = geometry(scrolled);
  rec.contentScrolled = await page.evaluate(() => { const c = document.querySelector('.ui-dialog-content'); return c ? { scrollTop: c.scrollTop, clientHeight: c.clientHeight, scrollHeight: c.scrollHeight } : null; });

  rec.keyboard = await keyboardReach(page, { maxTabs: 20 });
  await stage(ctx, 'F4-after-tab');
  if (!lite) rec.axe = await axeScan(page).catch((e) => ({ error: String(e.message).slice(0, 200), total: null, rules: {} }));

  if (lite) {
    // Close from the expanded state; the repeat and component checks run in the primary run.
  } else {
  // Collapse it again.
  await dialog.locator('summary').first().click();
  await waitStable(page);
  await sleep(page, 400);
  const collapsed = await stage(ctx, 'F5-collapsed');
  rec.collapsed = geometry(collapsed);

  // Expand/collapse cycles: does the dialog return to the same rect, or drift?
  for (let i = 0; i < ctx.cycles; i += 1) {
    await dialog.locator('summary').first().click();
    await waitStable(page);
    await sleep(page, 250);
    const e = await quick(page);
    await dialog.locator('summary').first().click();
    await waitStable(page);
    await sleep(page, 250);
    const c = await quick(page);
    rec.cycles.push({ cycle: i + 1, expanded: { bottom: e.rect ? e.rect.bottom : null, overflowBottomPx: e.overflowBottomPx, ro: e.lifecycle.roCallbacks, events: e.lifecycle.events }, collapsed: { bottom: c.rect ? c.rect.bottom : null, overflowBottomPx: c.overflowBottomPx, ro: c.lifecycle.roCallbacks, events: c.lifecycle.events } });
  }

  // A stage after the cycles separates their resets from the close path.
  const afterCycles = await stage(ctx, 'F5b-after-cycles');
  rec.afterCycles = geometry(afterCycles);
  }

  // Close with the close button (real click), then check no callbacks/events continue after close.
  await dialog.locator('.ui-dialog-titlebar-close').click();
  await waitStable(page);
  await sleep(page, 300);
  const closed = await stage(ctx, 'F6-closed');
  const afterClose = await snapshot(ctx);
  await sleep(page, 900);
  const later = await snapshot(ctx);
  rec.close = { closeButtonClicked: true, dialogVisible: (await page.locator('.ui-dialog:visible').count().catch(() => 0)) > 0, patchObservers: afterClose.counts.patchObservers, disconnected: afterClose.counts.patchObserverDisconnected, observerCallbacks: afterClose.counts.patchObserverCallbacks };
  rec.postClose = {
    windowMs: 900,
    resizeObserverCallbacks: later.counts.resizeObserverCallbacks - afterClose.counts.resizeObserverCallbacks,
    patchObserverCallbacks: later.counts.patchObserverCallbacks - afterClose.counts.patchObserverCallbacks,
    dialogResizeEvents: later.counts.dialogResizeEvents - afterClose.counts.dialogResizeEvents,
    pageErrors: later.counts.pageErrors - afterClose.counts.pageErrors,
    consoleErrors: later.counts.consoleErrorsPage - afterClose.counts.consoleErrorsPage,
  };
  rec.closed = geometry(closed);

  if (!lite) {
  // Open/close several times; the observer must be created once per dialog and disconnected on close.
  for (let i = 0; i < ctx.reopen; i += 1) {
    await link.click();
    await dialog.waitFor({ state: 'visible', timeout: 15000 });
    await waitStable(page);
    await sleep(page, 250);
    const st = await stage(ctx, `F7-reopen-${i + 1}`);
    const s = st.lifecycle.counts;
    await page.keyboard.press('Escape');
    await waitStable(page);
    await sleep(page, 250);
    const end = (await snapshot(ctx)).counts;
    rec.reopen.push({ open: i + 1, patchObservers: s.patchObservers, patchObserverCallbacks: s.patchObserverCallbacks, primaryInViewport: geometry(st).primary ? geometry(st).primary.inViewport : null, fits: geometry(st).fitsVertically, afterCloseObservers: end.patchObservers, afterCloseDisconnected: end.patchObserverDisconnected, afterCloseEvents: end.dialogResizeEvents });
  }

  // Race: expand and close immediately (inside the 20 ms debounce window).
  for (let i = 0; i < ctx.raceTrials; i += 1) {
    await link.click();
    await dialog.waitFor({ state: 'visible', timeout: 15000 });
    await waitStable(page);
    const pre = (await snapshot(ctx)).counts;
    await dialog.locator('summary').first().click();
    await page.keyboard.press('Escape');
    await sleep(page, 700);
    const post = (await snapshot(ctx)).counts;
    rec.race.push({ trial: i + 1, pageErrors: post.pageErrors - pre.pageErrors, dialogResizeAfterClose: post.dialogResizeEvents - pre.dialogResizeEvents, newObserverCallbacks: post.resizeObserverCallbacks - pre.resizeObserverCallbacks, patchObserverCallbacks: post.patchObserverCallbacks - pre.patchObserverCallbacks });
  }
  }

  return rec;
}

// ---------------------------------------------------------------------------------------------
// Component checks: explicit height/maxHeight, autoResize:false, two dialogs at once
// ---------------------------------------------------------------------------------------------
async function makeDialog(page, id, options = {}, modal = true) {
  await page.evaluate(([key, opts, isModal]) => {
    const el = document.createElement('div');
    el.id = key;
    el.innerHTML = '<p>Short content</p><details><summary>Grow</summary><div style="height: 1200px;">Tall content added after the dialog opened.</div></details>';
    document.body.appendChild(el);
    window.__labDlg = window.__labDlg || {};
    const dialog = Drupal.dialog(el, Object.assign({ title: `Lab ${key}`, buttons: { OK() {} } }, opts));
    window.__labDlg[key] = dialog;
    if (isModal) dialog.showModal();
    else dialog.show();
  }, [id, options, modal]);
  await sleep(page, 400);
}

async function dialogState(page) {
  return page.evaluate(() => {
    const visible = (el) => { try { return el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }); } catch { return el.offsetHeight > 0; } };
    return [...document.querySelectorAll('.ui-dialog')].filter(visible).map((d) => {
      const c = d.querySelector('.ui-dialog-content');
      const r = d.getBoundingClientRect();
      return {
        title: d.querySelector('.ui-dialog-title')?.innerText || null,
        rect: { top: Math.round(r.top * 10) / 10, bottom: Math.round(r.bottom * 10) / 10, height: Math.round(r.height * 10) / 10 },
        fits: r.top >= -1 && r.bottom <= innerHeight + 1,
        overflowBottomPx: Math.round(Math.max(0, r.bottom - innerHeight) * 10) / 10,
        content: c ? { clientHeight: c.clientHeight, scrollHeight: c.scrollHeight, scrollableY: c.scrollHeight > c.clientHeight + 1 } : null,
        primaryInViewport: (() => { const b = d.querySelector('.ui-dialog-buttonpane button'); if (!b) return null; const br = b.getBoundingClientRect(); return br.top >= -0.5 && br.bottom <= innerHeight + 0.5; })(),
        autoResizeObserver: !!(window.jQuery && c && window.jQuery(c).data('drupalAutoResizeObserver')),
        viewport: { width: innerWidth, height: innerHeight },
      };
    });
  });
}

async function runComponents(ctx) {
  const { page, base } = ctx;
  const rec = { scenario: 'components', results: [] };
  await page.goto(`${base}/dialog_renderer-test-links`, { waitUntil: 'load' });
  await waitStable(page);
  ctx.prev = null;
  ctx.patch = new Map();

  // The links page does not attach the dialog library until a dialog is opened, so open and close
  // the fixture modal once; this is also a real open/close cycle before the component checks.
  const loader = page.getByRole('link', { name: 'Details modal!' });
  if (await loader.count()) {
    await loader.click();
    await page.locator('.ui-dialog').last().waitFor({ state: 'visible', timeout: 15000 });
    await waitStable(page);
    await page.keyboard.press('Escape');
    await waitStable(page);
    await sleep(page, 250);
  }
  const hasDialog = await page.evaluate(() => typeof Drupal.dialog === 'function');
  if (!hasDialog) {
    rec.error = 'Drupal.dialog is not available on /dialog_renderer-test-links after opening the fixture modal; the component checks cannot run on this page.';
    return rec;
  }

  const one = async (label, id, options, growSelector = `#${id} summary`) => {
    await makeDialog(page, id, options, true);
    const before = await dialogState(page);
    const pre = (await snapshot(ctx)).counts;
    const summary = page.locator(growSelector).first();
    const clicked = await summary.isVisible().catch(() => false);
    if (clicked) await summary.click();
    await waitStable(page);
    await sleep(page, 400);
    const after = await dialogState(page);
    const post = (await snapshot(ctx)).counts;
    const mine = after.find((d) => d.title === `Lab ${id}`) || null;
    const beforeMine = before.find((d) => d.title === `Lab ${id}`) || null;
    rec.results.push({ label, id, clicked, before: beforeMine, after: mine, lifecycleDelta: diffCounts(pre, post) });
    await page.evaluate((key) => { try { window.__labDlg[key]?.close(); } catch { /* already closed */ } const el = document.getElementById(key); if (el && window.jQuery && window.jQuery(el).data('ui-dialog')) window.jQuery(el).dialog('destroy').remove(); }, id);
    await sleep(page, 300);
    return mine;
  };

  await one('explicit height: 300 (modal)', 'lab-height', { height: 300 });
  await one('explicit maxHeight: 400 (modal)', 'lab-maxheight', { maxHeight: 400 });
  await one('autoResize: false (control, modal)', 'lab-noautoresize', { autoResize: false });

  // Two simultaneous Drupal dialogs: growth in one must not move the other.
  await makeDialog(page, 'lab-multi-1', {}, false);
  await makeDialog(page, 'lab-multi-2', {}, false);
  // dialog.position.js re-centres non-modal dialogs after create; place them apart afterwards so the
  // second one cannot cover the first one's summary. This does not change the code under test.
  await page.evaluate(() => {
    const place = (id, left) => {
      const el = document.getElementById(id);
      const dlg = el && el.closest('.ui-dialog');
      if (dlg) { dlg.style.left = `${left}px`; dlg.style.top = '120px'; }
    };
    place('lab-multi-1', 20);
    place('lab-multi-2', 420);
  });
  await sleep(page, 250);
  const before = await dialogState(page);
  const pre = (await snapshot(ctx)).counts;
  await page.locator('#lab-multi-1 summary').first().click();
  await waitStable(page);
  await sleep(page, 400);
  const after = await dialogState(page);
  const post = (await snapshot(ctx)).counts;
  rec.multiple = {
    before: before.map((d) => ({ title: d.title, rect: d.rect, top: d.rect.top })),
    after: after.map((d) => ({ title: d.title, rect: d.rect, top: d.rect.top, autoResizeObserver: d.autoResizeObserver, primaryInViewport: d.primaryInViewport })),
    lifecycleDelta: diffCounts(pre, post),
  };
  await page.evaluate(() => {
    for (const id of ['lab-multi-1', 'lab-multi-2']) {
      try { window.__labDlg[id]?.close(); } catch { /* already closed */ }
      const el = document.getElementById(id);
      if (el && window.jQuery && window.jQuery(el).data('ui-dialog')) window.jQuery(el).dialog('destroy').remove();
    }
  });
  return rec;
}

// ---------------------------------------------------------------------------------------------
// Markdown for one run
// ---------------------------------------------------------------------------------------------
function runMarkdown(results) {
  const B = results.sides.before;
  const A = results.sides.after;
  const bf = B.fixture;
  const af = A.fixture;
  const bE = bf.expanded;
  const aE = af.expanded;
  const bK = bf.keyboard;
  const aK = af.keyboard;
  const rows = [
    ['Dialog fits inside the viewport after the details expands', bE.fitsVertically, aE.fitsVertically, 'fix'],
    ['Overflow below the viewport after the expansion (px)', bE.overflowBottomPx, aE.overflowBottomPx, 'observe'],
    ['Primary (OK) button is inside the viewport after the expansion', bE.primary ? bE.primary.inViewport : null, aE.primary ? aE.primary.inViewport : null, 'fix'],
    ['Primary (OK) button is hit-testable after the expansion', bE.primary ? bE.primary.hittable : null, aE.primary ? aE.primary.hittable : null, 'fix'],
    ['Titlebar is inside the viewport after the expansion', bE.titlebar ? bE.titlebar.inViewport : null, aE.titlebar ? aE.titlebar.inViewport : null, 'regression'],
    ['Close button is inside the viewport after the expansion', bE.closeButton ? bE.closeButton.inViewport : null, aE.closeButton ? aE.closeButton.inViewport : null, 'regression'],
    ['Content area scrolls after the expansion (scrollHeight > clientHeight)', bE.content ? bE.content.scrollableY : null, aE.content ? aE.content.scrollableY : null, 'regression'],
    ['Primary button reached with real Tab presses', bK ? bK.reachedPrimary : null, aK ? aK.reachedPrimary : null, 'observe'],
    ['Primary button inside the viewport when focused', bK ? bK.primaryInViewport : null, aK ? aK.primaryInViewport : null, 'fix'],
    ['Primary button hit-testable when focused', bK ? bK.primaryHittable : null, aK ? aK.primaryHittable : null, 'fix'],
    ['ResizeObserver callbacks during the expansion', bf.expansion.roCallbacks, af.expansion.roCallbacks, 'observe'],
    ['dialogContentResize events during the expansion (resetSize ran)', bf.expansion.dialogResizeEvents, af.expansion.dialogResizeEvents, 'observe'],
    ['Patch observer callbacks during the expansion', bf.expansion.patchObserverCallbacks, af.expansion.patchObserverCallbacks, 'observe'],
    ['Observer callbacks in the 800 ms idle window after settling', bf.idle.resizeObserverCallbacks, af.idle.resizeObserverCallbacks, 'regression'],
    ['Dialog becomes visible again on re-open (all three)', bf.reopen.every((r) => r.fits !== null), af.reopen.every((r) => r.fits !== null), 'observe'],
    ['Observer disconnected after close (patch observers)', bf.close.disconnected, af.close.disconnected, 'observe'],
    ['Callbacks after close (900 ms)', bf.postClose.resizeObserverCallbacks, af.postClose.resizeObserverCallbacks, 'regression'],
    ['Page errors after close (900 ms)', bf.postClose.pageErrors, af.postClose.pageErrors, 'regression'],
    ['Race: expand then Escape immediately, page errors', bf.race.length ? bf.race.reduce((n, r) => n + r.pageErrors, 0) : 'not run', af.race.length ? af.race.reduce((n, r) => n + r.pageErrors, 0) : 'not run', 'regression'],
    ['axe violations in the expanded dialog', bf.axe ? bf.axe.total : 'not run', af.axe ? af.axe.total : 'not run', 'regression'],
  ];
  const lines = [];
  lines.push(`# #3466040 fixture probe — ${results.environment.viewport.width}x${results.environment.viewport.height}${results.zoom ? ` (zoom emulation ${results.zoom.requested}%)` : ''}, ${results.environment.browser} ${results.environment.browserVersion}`);
  lines.push('');
  lines.push(`Run ${results.when}. Variant \`${results.variant}\`. Before \`${results.commits.before}\`, After \`${results.commits.after}\`. Scheme **${results.environment.colorScheme}**, forced colours **${results.environment.forcedColors ? 'active' : 'none'}**, reduced motion **${results.environment.reducedMotion}**.`);
  if (results.zoom) lines.push(`Zoom method: ${results.zoom.method}; physical ${results.zoom.sourceViewport.width}x${results.zoom.sourceViewport.height} -> CSS ${results.zoom.effectiveViewport.width}x${results.zoom.effectiveViewport.height}.`);
  lines.push('');
  lines.push('Fix rows: Before is expected false and After true. Regression rows: expected equal. Observe rows: recorded, not judged.');
  lines.push('');
  lines.push('| Type | Check | Before | After |');
  lines.push('|---|---|---|---|');
  for (const [label, b, a, type] of rows) lines.push(`| ${type} | ${label} | ${String(b)} | ${String(a)} |`);
  lines.push('');
  lines.push('## Stages');
  lines.push('');
  lines.push('| Side | Stage | Dialog top→bottom | Fits | Overflow px | Content client/scroll | RO Δ | dialogContentResize Δ | patch cb Δ |');
  lines.push('|---|---|---|---|---|---|---|---|---|');
  for (const [side, rec] of [['before', bf], ['after', af]]) {
    for (const st of rec.stages) {
      const g = geometry(st);
      const d = st.lifecycle.delta;
      if (!g.dialog) { lines.push(`| ${side} | ${st.label} | no dialog | – | – | – | ${d.resizeObserverCallbacks} | ${d.dialogResizeEvents} | ${d.patchObserverCallbacks} |`); continue; }
      lines.push(`| ${side} | ${st.label} | ${g.rect.top}→${g.rect.bottom} (h ${g.rect.height}) | ${g.fitsVertically} | ${g.overflowBottomPx} | ${g.content ? `${g.content.clientHeight}/${g.content.scrollHeight}` : '–'} | ${d.resizeObserverCallbacks} | ${d.dialogResizeEvents} | ${d.patchObserverCallbacks} |`);
    }
  }
  lines.push('');
  lines.push('## Expansion timeline (50 ms samples)');
  lines.push('');
  lines.push('| t (ms) | Before bottom / overflow / RO / events | After bottom / overflow / RO / events |');
  lines.push('|---|---|---|');
  for (let i = 0; i < Math.min(bf.samples.length, af.samples.length); i += 1) {
    const b = bf.samples[i]; const a = af.samples[i];
    lines.push(`| ${b.t} | ${b.bottom} / ${b.overflowBottomPx} / ${b.ro} / ${b.events} | ${a.bottom} / ${a.overflowBottomPx} / ${a.ro} / ${a.events} |`);
  }
  lines.push('');
  lines.push('## Keyboard trail (real Tab presses)');
  lines.push('');
  lines.push('| Side | Step | Focused element | In dialog | In viewport | Hittable | Content scrolled |');
  lines.push('|---|---|---|---|---|---|---|');
  for (const [side, k] of [['before', bK], ['after', aK]]) {
    if (!k) { lines.push(`| ${side} | not run | | | | | |`); continue; }
    for (const [i, s] of k.trail.entries()) {
      const full = k.steps && k.steps[i] ? k.steps[i] : null;
      lines.push(`| ${side} | ${s.step} | ${s.active} | ${s.inDialog} | ${s.inViewport} | ${full && full.hit ? full.hit.hittable : '–'} | ${s.contentScrolled} |`);
    }
  }
  lines.push('');
  lines.push('## Lifecycle');
  lines.push('');
  lines.push(`| Measure | Before | After |`);
  lines.push(`|---|---|---|`);
  lines.push(`| Observers created (page) | ${bf.stages.at(-1).lifecycle.counts.observersCreated} | ${af.stages.at(-1).lifecycle.counts.observersCreated} |`);
  lines.push(`| Observer disconnects (page) | ${bf.stages.at(-1).lifecycle.counts.observerDisconnects} | ${af.stages.at(-1).lifecycle.counts.observerDisconnects} |`);
  lines.push(`| Patch observers stored | ${bf.stages.at(-1).lifecycle.counts.patchObservers} | ${af.stages.at(-1).lifecycle.counts.patchObservers} |`);
  lines.push(`| Patch observer callbacks | ${bf.stages.at(-1).lifecycle.counts.patchObserverCallbacks} | ${af.stages.at(-1).lifecycle.counts.patchObserverCallbacks} |`);
  lines.push(`| Patch observer callbacks after close (900 ms) | ${bf.postClose.patchObserverCallbacks} | ${af.postClose.patchObserverCallbacks} |`);
  lines.push(`| Observer callbacks, page-wide, after close (900 ms) | ${bf.postClose.resizeObserverCallbacks} | ${af.postClose.resizeObserverCallbacks} |`);
  lines.push(`| dialogContentResize after close (900 ms) | ${bf.postClose.dialogResizeEvents} | ${af.postClose.dialogResizeEvents} |`);
  lines.push('');
  lines.push('## Components');
  lines.push('');
  lines.push('| Case | Observed (After) |');
  lines.push('|---|---|');
  if (!af.components) {
    lines.push('| component checks | not run |');
  } else if (af.components.skipped) {
    lines.push(`| component checks | skipped (${af.components.skipped}) |`);
  } else if (af.components.error) {
    lines.push(`| component checks | ERROR: ${af.components.error} |`);
  } else if (!Array.isArray(af.components.results)) {
    lines.push('| component checks | no results |');
  } else {
    for (const r of af.components.results) {
      lines.push(`| ${r.label} | ${r.after ? `dialog ${r.after.rect.height}px, fits ${r.after.fits}, overflow ${r.after.overflowBottomPx}px, content ${r.after.content ? `${r.after.content.clientHeight}/${r.after.content.scrollHeight}` : '–'}, observer ${r.after.autoResizeObserver}` : 'not created'} |`);
    }
    if (af.components.multiple) lines.push(`| two dialogs at once | ${af.components.multiple.after.map((d) => `${d.title}: top ${d.rect.top}, observer ${d.autoResizeObserver}`).join('; ')} |`);
  }
  lines.push('');
  lines.push(`Screenshots: ${[...bf.stages, ...af.stages].map((s) => s.screenshot).join(', ')}`);
  lines.push('');
  lines.push('---');
  lines.push('Automated probe output. It is DRAFT evidence: the keyboard trail is not a person\'s keyboard pass, no screen reader ran, and the zoom is reflow-equivalent emulation, not browser zoom.');
  return lines.join('\n');
}

// ---------------------------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------------------------
async function main() {
  const run = runArgs({ slug: '3466040-regression-pinned', viewport: '1280x900' });
  const zoom = Number(opt('zoom', '0')) || 0;
  let zoomInfo = null;
  if (zoom) {
    if (zoom < 50 || zoom > 800) throw new Error('--zoom is a percentage between 50 and 800, for example --zoom=200');
    const sourceViewport = { ...run.viewport };
    const width = Math.round((sourceViewport.width * 100) / zoom);
    const height = Math.round((sourceViewport.height * 100) / zoom);
    if (width < 160 || height < 120) throw new Error(`--zoom=${zoom} with --viewport=${sourceViewport.width}x${sourceViewport.height} gives ${width}x${height} CSS pixels, too small to open the dialog.`);
    zoomInfo = { requested: zoom, method: 'reflow-equivalent CSS viewport (physical viewport / zoom factor); NOT real browser zoom', sourceViewport, effectiveViewport: { width, height } };
    run.viewport = { width, height };
  }
  if (!opt('out', '')) run.out = `${run.out}-fixture${zoom ? `-zoom${zoom}` : ''}`;
  fs.mkdirSync(run.out, { recursive: true });

  const lite = has('lite');
  const launched = await launch(run);
  run.browser = launched.browser;
  const results = {
    schema: 'drupal-core-lab/review-3466040/1',
    issue: NID,
    mr: '!9088',
    reviewedRevision: 'aed1df5eeddf0b89c91bab47eb83847f44c58211',
    variant: run.v.slug,
    when: new Date().toISOString(),
    environment: launched.environment,
    zoom: zoomInfo,
    core: run.v.core,
    commits: { before: null, after: null },
    patches: { before: run.v.before.patches || [], after: run.v.after.patches || [] },
    selector: {
      dialog: '.ui-dialog', titlebar: '.ui-dialog-titlebar', close: '.ui-dialog-titlebar-close', content: '.ui-dialog-content', buttonPane: '.ui-dialog-buttonpane', primary: '.ui-dialog-buttonpane button', details: '.ui-dialog details', summary: '.ui-dialog details summary', fixtureLink: 'a[href="/dialog_renderer-content-details"]',
    },
    sides: {},
  };
  results.commits = { before: (await import('./lib/lab-run.mjs')).gitInfo(run.v.before.env), after: (await import('./lib/lab-run.mjs')).gitInfo(run.v.after.env) };

  try {
    for (const side of ['before', 'after']) {
      console.log(`running ${side} (${run.v[side].env}) ...`);
      const { page, base, rec } = await openSide(run, side);
      const consoleErrors = [];
      page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push({ text: m.text().slice(0, 400), location: m.location ? `${m.location().url || ''}:${m.location().lineNumber || ''}` : null }); });
      await installCapture(page);
      page.setDefaultTimeout(15000);
      const ctx = { run, out: run.out, side, page, base, rec, stages: [], prev: null, lite, cycles: Number(opt('cycles', '5')) || 5, reopen: Number(opt('reopen', '3')) || 3, raceTrials: Number(opt('race-trials', '3')) || 3 };
      const sideRec = { env: run.v[side].env, commit: results.commits[side], site: rec.site, pages: rec.pages, ajax: rec.ajax, speech: rec.speech, jsErrors: rec.jsErrors, consoleErrors, fixture: null, components: null };
      try {
        sideRec.fixture = await runFixture(ctx);
        sideRec.components = lite ? { scenario: 'components', skipped: 'lite mode' } : await runComponents(ctx);
      } catch (error) {
        if (error instanceof PreconditionError) {
          await rec.close(run.out).catch(() => {});
          await launched.browser.close().catch(() => {});
          fs.writeFileSync(path.join(run.out, 'ABORTED.md'), `# Run aborted: precondition not met\n\n${error.message}\n`);
          console.error(`ABORTED: ${error.message}`);
          process.exitCode = 3;
          return;
        }
        sideRec.error = String(error.message).slice(0, 800);
        console.error(`  ${side}: ERROR ${error.message}`);
      }
      await rec.close(run.out).catch(() => {});
      results.sides[side] = sideRec;
    }
  } finally {
    await launched.browser.close().catch(() => {});
  }
  if (!results.sides.before || !results.sides.after) {
    fs.writeFileSync(path.join(run.out, 'ABORTED.md'), '# Run aborted: a side did not finish\n');
    process.exitCode = 3;
    return;
  }
  results.jsErrors = { before: results.sides.before.jsErrors, after: results.sides.after.jsErrors };
  results.consoleErrors = { before: results.sides.before.consoleErrors, after: results.sides.after.consoleErrors };
  const md = runMarkdown(results);
  fs.writeFileSync(path.join(run.out, 'results.json'), `${JSON.stringify(results, null, 2)}\n`);
  fs.writeFileSync(path.join(run.out, 'SUMMARY.md'), `${md}\n`);
  const b = results.sides.before.fixture.expanded;
  const a = results.sides.after.fixture.expanded;
  console.log(`\nfixture expanded: before fits=${b.fitsVertically} overflow=${b.overflowBottomPx}px primary=${b.primary ? b.primary.inViewport : 'n/a'}; after fits=${a.fitsVertically} overflow=${a.overflowBottomPx}px primary=${a.primary ? a.primary.inViewport : 'n/a'}`);
  console.log(`evidence: ${path.relative(process.cwd(), run.out)}`);
  process.exitCode = (b.fitsVertically === false && a.fitsVertically === true) ? 0 : 2;
}

main().catch((error) => { console.error(error && error.stack ? error.stack : error); process.exit(1); });
