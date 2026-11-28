// Evidence for #3466040: a modal dialog does not adjust when its inner content grows (buttons pushed out of reach).
//
//   node tools/playwright/evaluate-3466040.mjs [3466040-pinned] [--scenario=both|field-ui|views]
//        [--browser=chromium|firefox|webkit] [--scheme=light|dark] [--forced-colors]
//        [--viewport=WxH] [--zoom=N] [--text-zoom=N] [--max-tabs=80] [--settle=800] [--out=<dir>]
//
// Defaults: slug 3466040-pinned, both scenarios, chromium, light, 1280x900, no zoom.
//
// Two scenarios from the issue, each run on BOTH sides of the variant from the same pinned commits:
//   A. Field UI: open the Article (or the first available content type's) "Manage fields" page, add a
//      "Date and time" (datetime) field through the modal steps, reach the field config edit form in the
//      dialog, then tick "Set default value" (the related issue #3640810 case). The dialog grows.
//   B. Views: open /admin/structure/views/view/content, click the "Content: Content type" filter to open
//      its modal, then expand/collapse the details elements ("Administrative title", "More") inside it.
//
// Per stage it records geometry and operability (see measureDialog()), the keyboard trail (real Tab
// presses, no programmatic scrolling), screenshots, and page-level lifecycle counters (ResizeObserver
// callbacks, autoResize executions, console errors). See reports/issues/3466040/reviews/harness-plan.md
// and reports/issues/3466040/reviews/lifecycle-instrumentation.md.
//
// The context, AJAX commands and announcements of every side are recorded by lib/lab-run.mjs (login with
// a one-time link, patches by content, axe helpers, results.json with the schema scripts/coverage.mjs
// reads). This file adds only what is issue-specific.
//
// Writes reports/issues/3466040/playwright/<stamp>-<envTag>[-zoom<N>]/ (results.json, SUMMARY.md,
// ajax-*.json, *.png) or --out. A precondition failure writes ABORTED.md and exits 3 without results.json,
// so scripts/coverage.mjs does not count it as evidence.
//
// Reusable helpers are exported at the bottom (measureDialog, activeState, keyboardReach, captureOnce,
// installCapture) so a person can run the same capture by hand later:
//
//   import { chromium } from '@playwright/test';
//   import { installCapture, measureDialog, keyboardReach } from './evaluate-3466040.mjs';
//   const b = await chromium.launch(); const p = await (await b.newContext()).newPage();
//   await installCapture(p); await p.goto(url); ... await measureDialog(p);
//
// LIMITS (also stated in every SUMMARY.md): automated geometry is a DRAFT and does not replace a
// person's keyboard pass. WebKit is Safari's engine, not Safari. Forced colours and colour scheme are
// Playwright emulation, not an OS setting. --zoom is a reflow-equivalent viewport change, not a real
// browser zoom. No screen reader is run here.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { runArgs, launch, openSide, axeScan, baseResults, writeRun, contextMarkdown, ajaxMarkdown, speechMarkdown } from './lib/lab-run.mjs';

const NID = '3466040';
const PRIMARY_LABEL = /^(save|save settings|continue|apply|update|ok)$/i;
const SET_DEFAULT_VALUE = 'input[name="set_default_value"]';

const argv = process.argv.slice(2);
const opt = (name, fallback) => {
  const found = argv.find((a) => a.startsWith(`--${name}=`));
  return found ? found.slice(name.length + 3) : fallback;
};
const has = (name) => argv.some((a) => a === `--${name}` || a.startsWith(`--${name}=`));

// ---------------------------------------------------------------------------------------------------
// Page-side source: geometry, hit-testing, dialog measurement and lifecycle probes. It is installed
// with page.addInitScript() so it runs before the page's own scripts on every navigation, and it is also
// the code path the exported helpers below use. Nothing here changes what the page does except wrapping
// window.ResizeObserver (pass-through) and console.error (pass-through).
// ---------------------------------------------------------------------------------------------------
function CAPTURE_INIT() {
  // Page-side copy: an addInitScript function is serialised on its own, so it cannot close over module
  // constants such as PRIMARY_LABEL. Keep these in sync with the Node-side ones above.
  const PRIMARY_LABEL = /^(save|save settings|continue|apply|update|ok)$/i;
  const round = (n) => Math.round(Number(n) * 10) / 10;
  const str = (s, n = 100) => String(s == null ? '' : s).replace(/\s+/g, ' ').trim().slice(0, n);
  const isVisible = (el) => {
    if (!el || !el.getClientRects) return false;
    try {
      return el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true });
    } catch {
      try { return !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length); } catch { return false; }
    }
  };
  const rectOf = (r) => (r ? { top: round(r.top), right: round(r.right), bottom: round(r.bottom), left: round(r.left), width: round(r.width), height: round(r.height) } : null);
  const elRect = (el) => (el ? rectOf(el.getBoundingClientRect()) : null);
  const classNames = (el) => {
    if (!el) return [];
    const c = el.getAttribute && el.getAttribute('class');
    return c ? String(c).trim().split(/\s+/).filter(Boolean) : [];
  };
  const labelOf = (el) => {
    if (!el) return null;
    try {
      if (el.labels && el.labels.length) return str(el.labels[0].textContent);
      if (el.tagName === 'INPUT' || el.tagName === 'BUTTON') return str(el.value || el.getAttribute('aria-label') || el.textContent);
      if (el.tagName === 'SUMMARY') return str(el.textContent);
      return str(el.getAttribute('aria-label') || el.getAttribute('title') || el.textContent);
    } catch { return null; }
  };
  const desc = (el) => {
    if (!el) return null;
    if (el === document.documentElement) return 'html';
    if (el === document.body) return 'body';
    const tag = String(el.tagName || '').toLowerCase();
    const bits = [tag];
    if (el.id) bits.push(`#${el.id}`);
    const cls = classNames(el);
    if (cls.length) bits.push(`.${cls.slice(0, 3).join('.')}`);
    const label = labelOf(el);
    return bits.join('') + (label ? ` "${label}"` : '');
  };
  const css = (el, props) => {
    if (!el) return null;
    const s = getComputedStyle(el); const out = {};
    for (const p of props) out[p] = s.getPropertyValue(p);
    return out;
  };
  const inViewport = (r) => !!r && r.width > 0 && r.height > 0 && r.left >= -0.5 && r.top >= -0.5 && r.right <= innerWidth + 0.5 && r.bottom <= innerHeight + 0.5;
  const partlyInViewport = (r) => !!r && r.width > 0 && r.height > 0 && r.right > 0 && r.bottom > 0 && r.left < innerWidth && r.top < innerHeight;
  const hitAt = (el, x, y) => {
    if (!el) return { ok: false, reason: 'no element' };
    if (!(x >= 0 && y >= 0 && x <= innerWidth - 1 && y <= innerHeight - 1)) return { ok: false, reason: 'point outside viewport' };
    const top = document.elementFromPoint(x, y);
    if (!top) return { ok: false, reason: 'nothing at point' };
    if (top === el || el.contains(top)) return { ok: true, by: desc(top) };
    return { ok: false, reason: 'covered', by: desc(top) };
  };
  const hitTest = (el) => {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const points = [];
    const cx = Math.round(r.left + r.width / 2); const cy = Math.round(r.top + r.height / 2);
    points.push({ where: 'center', ...hitAt(el, cx, cy) });
    const inset = 3;
    for (const [wx, wy] of [[r.left + inset, r.top + inset], [r.right - inset, r.top + inset], [r.left + inset, r.bottom - inset], [r.right - inset, r.bottom - inset]]) points.push({ where: 'corner', ...hitAt(el, Math.round(wx), Math.round(wy)) });
    const center = points[0];
    const ok = points.filter((p) => p.ok).length;
    return { hittable: center.ok && ok >= 3, points: ok, of: points.length, center, blockedBy: points.filter((p) => !p.ok && p.by).map((p) => p.by).slice(0, 2) };
  };
  const enabled = (el) => {
    if (!el) return false;
    if (el.disabled === true) return false;
    if (el.getAttribute && (el.getAttribute('aria-disabled') === 'true' || el.getAttribute('disabled') !== null)) return false;
    return true;
  };
  // One element: rect, visibility, hit-test and the computed layout properties the issue is about.
  const measure = (el, props = []) => {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return {
      desc: desc(el),
      rect: rectOf(r),
      inViewport: inViewport(r),
      partlyInViewport: partlyInViewport(r),
      visible: isVisible(el),
      enabled: enabled(el),
      hit: hitTest(el),
      clientHeight: el.clientHeight, scrollHeight: el.scrollHeight, clientWidth: el.clientWidth, scrollWidth: el.scrollWidth,
      scrollableY: el.scrollHeight > el.clientHeight + 1,
      scrollTop: el.scrollTop, scrollLeft: el.scrollLeft,
      computed: css(el, ['display', 'visibility', 'position', 'overflow-x', 'overflow-y', 'height', 'max-height', 'min-height', 'max-width', 'width', 'pointer-events', 'z-index', ...props]),
    };
  };
  const media = () => {
    const m = (q) => { try { return matchMedia(q).matches; } catch { return null; } };
    return {
      forcedColors: m('(forced-colors: active)'),
      prefersDark: m('(prefers-color-scheme: dark)'),
      prefersContrastMore: m('(prefers-contrast: more)'),
      reducedMotion: m('(prefers-reduced-motion: reduce)'),
    };
  };
  const displace = () => {
    try {
      const o = window.Drupal && window.Drupal.displace && window.Drupal.displace.offsets;
      return o ? { top: round(o.top), right: round(o.right), bottom: round(o.bottom), left: round(o.left) } : null;
    } catch { return null; }
  };
  const visibleDialogs = () => [...document.querySelectorAll('.ui-dialog')]
    .map((el, domIndex) => ({ el, domIndex, z: parseInt(getComputedStyle(el).zIndex, 10) || 0 }))
    .filter((d) => isVisible(d.el))
    .sort((a, b) => (b.z - a.z) || (b.domIndex - a.domIndex));
  const isButton = (el) => !!el && ['button', 'a', 'input'].includes(String(el.tagName || '').toLowerCase()) && (el.tagName !== 'INPUT' || /^(submit|button|reset)$/i.test(el.type || ''));
  const actionButtons = (dialog, content) => {
    const pane = dialog.querySelector('.ui-dialog-buttonpane');
    const fromPane = pane ? [...pane.querySelectorAll('button, a.ui-button, input[type=submit], input[type=button]')] : [];
    const fromForm = content ? [...content.querySelectorAll('.form-actions a, .form-actions button, .form-actions input[type=submit], .form-actions input[type=button], input[type=submit][id^="edit-submit"], button[type=submit], input[type=submit].button--primary')] : [];
    const seen = new Set();
    return [...fromPane, ...fromForm].filter((el) => (seen.has(el) ? false : (seen.add(el), true))).map((el) => {
      const label = labelOf(el);
      return {
        label,
        tag: String(el.tagName).toLowerCase(),
        kind: pane && pane.contains(el) ? 'buttonpane' : (el.closest && el.closest('.form-actions') ? 'form-actions' : 'content'),
        primary: PRIMARY_LABEL.test(label || ''),
        ...measure(el),
      };
    });
  };
  const dialogDetails = (content) => (content ? [...content.querySelectorAll('details')].map((d, i) => {
    const summary = d.querySelector('summary');
    return { index: i, open: d.open, summary: summary ? str(summary.textContent) : null, summaryMeasure: summary ? measure(summary) : null, rect: elRect(d), visible: isVisible(d) };
  }) : []);
  const measureDialog = () => {
    const dialogs = visibleDialogs().map((d) => {
      const el = d.el;
      const content = el.querySelector('.ui-dialog-content');
      const titlebar = el.querySelector('.ui-dialog-titlebar');
      const close = el.querySelector('.ui-dialog-titlebar-close');
      const pane = el.querySelector('.ui-dialog-buttonpane');
      const scroll = content ? content.querySelector('[data-drupal-views-scroll], .scroll') : null;
      const r = el.getBoundingClientRect();
      return {
        id: el.id || null,
        class: classNames(el).join(' '),
        zIndex: d.z,
        domIndex: d.domIndex,
        rect: rectOf(r),
        fitsVertically: r.top >= -1 && r.bottom <= innerHeight + 1,
        overflowBottomPx: round(Math.max(0, r.bottom - innerHeight)),
        overflowTopPx: round(Math.max(0, -r.top)),
        computed: css(el, ['height', 'max-height', 'overflow', 'overflow-y', 'position']),
        titlebar: measure(titlebar),
        closeButton: measure(close),
        content: content ? {
          ...measure(content),
          formPresent: !!content.querySelector('form'),
          detailsOpen: [...content.querySelectorAll('details')].filter((x) => x.open).length,
        } : null,
        buttonPane: pane ? measure(pane) : null,
        buttons: actionButtons(el, content),
        formActions: content && content.querySelector('.form-actions') ? measure(content.querySelector('.form-actions')) : null,
        details: dialogDetails(content),
        scrollContainer: scroll ? measure(scroll) : null,
        scrollContainerStyle: scroll ? { height: scroll.style.height, overflow: scroll.style.overflow } : null,
        text: str(content ? content.textContent : '', 120),
      };
    });
    return {
      at: Date.now(),
      url: location.pathname + location.search,
      title: document.title,
      viewport: {
        innerWidth, innerHeight,
        scrollX: round(scrollX), scrollY: round(scrollY),
        dpr: round(devicePixelRatio || 1),
        visualViewport: window.visualViewport ? { width: round(window.visualViewport.width), height: round(window.visualViewport.height), scale: round(window.visualViewport.scale || 1) } : null,
      },
      media: media(),
      displace: displace(),
      document: {
        activeElement: desc(document.activeElement),
        scrollHeight: Math.round(document.documentElement.scrollHeight),
        clientHeight: Math.round(document.documentElement.clientHeight),
        bodyOverflow: css(document.body, ['overflow', 'overflow-y']),
        overlays: document.querySelectorAll('.ui-widget-overlay').length,
      },
      dialogs,
    };
  };
  const activeState = (step) => {
    const a = document.activeElement;
    const dialog = a && a.closest ? a.closest('.ui-dialog') : null;
    const content = a && a.closest ? a.closest('.ui-dialog-content') : null;
    const label = labelOf(a);
    const r = a ? a.getBoundingClientRect() : null;
    return {
      step: step == null ? null : step,
      active: desc(a),
      tag: a ? String(a.tagName).toLowerCase() : null,
      label,
      rect: rectOf(r),
      inViewport: inViewport(r),
      partlyInViewport: partlyInViewport(r),
      hit: hitTest(a),
      inDialog: !!dialog,
      inButtonPane: !!(a && a.closest && a.closest('.ui-dialog-buttonpane')),
      inFormActions: !!(a && a.closest && a.closest('.form-actions')),
      isButton: isButton(a),
      isPrimaryAction: !!label && PRIMARY_LABEL.test(label) && !!dialog,
      windowScrollY: round(scrollY),
      contentScrollTop: content ? content.scrollTop : null,
      dialogRect: dialog ? elRect(dialog) : null,
      innerHeight,
    };
  };

  window.__labCapture = { desc, elRect, measure, measureDialog, activeState, hitTest, media, displace, isVisible };

  // ---- Lifecycle probes (read-only observation; see reviews/lifecycle-instrumentation.md) -----------
  const L = (window.__labLifecycle = {
    startedAt: Math.round(performance.now()),
    resizeObserver: { callbacks: [], observers: [], disconnects: [] },
    autoResize: { calls: 0, wrapped: 0, perDialog: {} },
    patchObservers: [],
    dialogResizeEvents: [],
    pageErrors: [],
    consoleErrors: [],
  });
  const cap = (arr, n) => { if (arr.length > n) arr.splice(0, arr.length - n); };
  const tag = (el) => { try { return window.__labCapture.desc(el); } catch { return null; } };

  // Count ResizeObserver callbacks and remember which observer/target each one came from. The patch under
  // test creates one observer per dialog on dialog:aftercreate, so this wrapper sees it too.
  const NativeRO = window.ResizeObserver;
  if (typeof NativeRO === 'function') {
    let nextId = 1;
    class LabResizeObserver extends NativeRO {
      constructor(callback) {
        const id = nextId++;
        const targets = [];
        super((entries, observer) => {
          try {
            L.resizeObserver.callbacks.push({
              t: Math.round(performance.now()),
              observer: id,
              targets: entries.map((entry) => ({
                el: tag(entry.target),
                width: round(entry.contentRect.width),
                height: round(entry.contentRect.height),
                time: Math.round(entry.time),
              })),
            });
            cap(L.resizeObserver.callbacks, 400);
          } catch { /* never break the page */ }
          return callback(entries, observer);
        });
        this.__labId = id;
        this.__labTargets = targets;
        L.resizeObserver.observers.push({ id, at: Math.round(performance.now()) });
      }
      observe(target, options) {
        try { this.__labTargets.push(tag(target)); } catch { /* ignore */ }
        return super.observe(target, options);
      }
      unobserve(target) {
        try { this.__labTargets = this.__labTargets.filter((t) => t !== tag(target)); } catch { /* ignore */ }
        return super.unobserve(target);
      }
      disconnect() {
        try {
          L.resizeObserver.disconnects.push({ observer: this.__labId, at: Math.round(performance.now()), targets: this.__labTargets.slice() });
          for (const p of L.patchObservers) if (p.id === this.__labId) p.disconnected = true;
          cap(L.resizeObserver.disconnects, 100);
        } catch { /* ignore */ }
        return super.disconnect();
      }
    }
    window.ResizeObserver = LabResizeObserver;
  }

  // Console errors the page's own script logs. Browser/network console errors are collected on the Node side
  // with page.on('console'); both are reported per stage, separately.
  const nativeError = console.error.bind(console);
  console.error = function (...args) {
    try {
      const text = args.map((a) => { try { return typeof a === 'string' ? a : JSON.stringify(a); } catch { return String(a); } }).join(' ');
      L.consoleErrors.push({ t: Math.round(performance.now()), text: str(text, 500), stack: (new Error().stack || '').split('\n').slice(1, 4).join(' | ') });
      cap(L.consoleErrors, 100);
    } catch { /* ignore */ }
    return nativeError(...args);
  };

  window.addEventListener('error', (event) => {
    try {
      L.pageErrors.push({
        t: Math.round(performance.now()),
        message: str(event.message, 400),
        file: event.filename || null,
        line: event.lineno || null,
        stack: event.error && event.error.stack ? str(event.error.stack, 400) : null,
      });
      cap(L.pageErrors, 100);
    } catch { /* ignore */ }
  }, true);
  window.addEventListener('unhandledrejection', (event) => {
    try {
      L.pageErrors.push({ t: Math.round(performance.now()), message: `unhandledrejection: ${str(event.reason && (event.reason.message || event.reason), 400)}`, file: null, line: null, stack: null });
      cap(L.pageErrors, 100);
    } catch { /* ignore */ }
  });

  // Registered on load. Core's own dialog:aftercreate listener can be registered *after* ours (the dialog
  // library is attached lazily on some pages), so the values it stores are read in a microtask: by then every
  // listener for the event has run, and it is still before the ResizeObserver's first delivery. Drupal's
  // dialog.position.js stores $element.data('drupalAutoResize') and, on the patched After side,
  // $element.data('drupalAutoResizeObserver').
  const registerDialogObservers = () => {
    window.addEventListener('dialog:aftercreate', (event) => {
      const target = event.target;
      queueMicrotask(() => {
      try {
        const $ = window.jQuery;
        if (!$) return;
        const $element = $(target);
        const key = tag(target);
        // autoResize executions: wrap the debounced function the page itself will call.
        const fn = $element.data('drupalAutoResize');
        if (typeof fn === 'function' && !fn.__labWrapped) {
          const wrapped = function (...args) {
            try { L.autoResize.calls += 1; L.autoResize.perDialog[key] = (L.autoResize.perDialog[key] || 0) + 1; } catch { /* ignore */ }
            return fn.apply(this, args);
          };
          wrapped.__labWrapped = true;
          wrapped.cancel = () => (typeof fn.cancel === 'function' ? fn.cancel() : undefined);
          $element.data('drupalAutoResize', wrapped);
          L.autoResize.wrapped += 1;
        }
        // Only the patched side stores an observer here. Read it (do not set anything): its id lets the
        // snapshot count that observer's callbacks and see it disconnected on close.
        const patchObserver = $element.data('drupalAutoResizeObserver');
        if (patchObserver) {
          L.patchObservers.push({
            dialog: key,
            at: Math.round(performance.now()),
            id: patchObserver.__labId || null,
            targets: patchObserver.__labTargets ? patchObserver.__labTargets.slice() : [],
            disconnected: false,
          });
          cap(L.patchObservers, 20);
        }
      } catch { /* ignore */ }
      });
    });
    // resetSize (the function autoResize debounces to) dispatches dialogContentResize on the dialog content.
    // Views UI dispatches the same event from its own summary-click workaround, so the target is recorded.
    // The dialog's rect and the content's client/scroll heights are captured at delivery time, which is what
    // makes an "event count / did it settle" question answerable without a separate screenshot per event.
    window.addEventListener('dialogContentResize', (event) => {
      try {
        const content = event.target;
        const dialog = content && content.closest ? content.closest('.ui-dialog') : null;
        const r = dialog ? dialog.getBoundingClientRect() : null;
        L.dialogResizeEvents.push({
          t: Math.round(performance.now()),
          target: tag(content),
          inDialogContent: !!(content && content.classList && content.classList.contains('ui-dialog-content')),
          rect: r ? { top: round(r.top), bottom: round(r.bottom), height: round(r.height) } : null,
          clientHeight: content ? content.clientHeight : null,
          scrollHeight: content ? content.scrollHeight : null,
        });
        cap(L.dialogResizeEvents, 200);
      } catch { /* ignore */ }
    }, true);
    // Close ordering: compare the timestamps of resize work with the close events. beforeclose is where the
    // patch disconnects, so an event after it is work done on a closing/closed dialog.
    for (const name of ['dialog:beforeclose', 'dialog:afterclose']) {
      window.addEventListener(name, (event) => {
        try {
          L.dialogEvents = L.dialogEvents || [];
          L.dialogEvents.push({ t: Math.round(performance.now()), event: name, target: tag(event.target) });
          cap(L.dialogEvents, 50);
        } catch { /* ignore */ }
      }, true);
    }
  };
  if (document.readyState === 'complete') registerDialogObservers();
  else window.addEventListener('load', registerDialogObservers, { once: true });
}

// ---------------------------------------------------------------------------------------------------
// Node-side wrappers around the page-side helpers (also exported for manual use, see the header).
// ---------------------------------------------------------------------------------------------------
export async function installCapture(page) {
  await page.addInitScript(CAPTURE_INIT);
}

export async function measureDialog(page) {
  return page.evaluate(() => window.__labCapture.measureDialog());
}

export async function activeState(page, step = 0) {
  return page.evaluate((n) => window.__labCapture.activeState(n), step);
}

// Real Tab presses from whatever is focused now. No element.focus(), no scrollIntoView(): what the browser
// does to keep the focused element visible is exactly what a keyboard user gets, and every scroll change is
// recorded so "reachable" and "was already visible" can be reported separately.
export async function keyboardReach(page, { maxTabs = 80 } = {}) {
  const steps = [await activeState(page, 0)];
  for (let i = 1; i <= maxTabs; i += 1) {
    await page.keyboard.press('Tab');
    steps.push(await activeState(page, i));
    const last = steps[steps.length - 1];
    if (last.inDialog && last.isPrimaryAction) break;
  }
  // Fill in the scroll deltas after the fact so each row says whether the browser scrolled to it.
  for (let i = 1; i < steps.length; i += 1) {
    steps[i].windowScrolled = steps[i].windowScrollY !== steps[i - 1].windowScrollY;
    steps[i].contentScrolled = steps[i].contentScrollTop !== steps[i - 1].contentScrollTop;
  }
  const primaryIndex = steps.findIndex((s) => s.inDialog && s.isPrimaryAction);
  const primary = primaryIndex >= 0 ? steps[primaryIndex] : null;
  return {
    maxTabs,
    tabPresses: steps.length - 1,
    reachedPrimary: !!primary,
    primaryLabel: primary ? primary.label : null,
    stepsToPrimary: primaryIndex >= 0 ? primaryIndex : null,
    primaryInViewport: primary ? primary.inViewport : null,
    primaryHittable: primary ? (primary.hit ? primary.hit.hittable : null) : null,
    windowScrolled: primary ? steps.slice(1, primaryIndex + 1).some((s) => s.windowScrolled) : steps.some((s) => s.windowScrolled),
    contentScrolled: primary ? steps.slice(1, primaryIndex + 1).some((s) => s.contentScrolled) : steps.some((s) => s.contentScrolled),
    start: steps[0],
    trail: steps.map((s) => ({ step: s.step, active: s.active, inDialog: s.inDialog, inViewport: s.inViewport, windowScrolled: s.windowScrolled || false, contentScrolled: s.contentScrolled || false, isPrimaryAction: s.isPrimaryAction })),
    steps,
  };
}

// A minimal manual capture: measure + a viewport screenshot, for someone driving a page by hand.
export async function captureOnce(page, outDir, side = 'before', label = 'manual') {
  fs.mkdirSync(outDir, { recursive: true });
  const measure = await measureDialog(page);
  const file = path.join(outDir, `${side}-${label}-viewport.png`);
  await page.screenshot({ path: file }).catch(() => {});
  return { measure, screenshot: file };
}

// ---------------------------------------------------------------------------------------------------
// Node-side run helpers.
// ---------------------------------------------------------------------------------------------------
const sleep = (page, ms) => page.waitForTimeout(ms);

class PreconditionError extends Error {}

async function waitForStable(page, { timeout = 10000, interval = 150, samples = 3 } = {}) {
  const signature = () => page.evaluate(() => {
    const visible = (el) => { try { return el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }); } catch { return el.offsetWidth > 0; } };
    return JSON.stringify({
      w: innerWidth, h: innerHeight, x: Math.round(scrollX), y: Math.round(scrollY),
      d: [...document.querySelectorAll('.ui-dialog')].filter(visible).map((el) => {
        const r = el.getBoundingClientRect();
        const c = el.querySelector('.ui-dialog-content');
        return [Math.round(r.top), Math.round(r.bottom), Math.round(r.height), Math.round(r.width), c ? c.scrollHeight : 0, c ? c.clientHeight : 0, c ? c.scrollTop : 0];
      }),
      a: document.activeElement ? document.activeElement.tagName : null,
    });
  }).catch(() => null);
  const start = Date.now();
  let last = await signature(); let same = 0;
  while (Date.now() - start < timeout) {
    await sleep(page, interval);
    const now = await signature();
    if (now && now === last) { same += 1; if (same >= samples - 1) return true; } else { same = 0; last = now; }
  }
  return false;
}

async function applyTextZoom(page, textZoom) {
  if (!textZoom) return;
  await page.evaluate((v) => { document.documentElement.style.fontSize = `${v}%`; }, textZoom).catch(() => {});
  await sleep(page, 200);
}

async function waitForDialog(page, timeout = 20000) {
  await page.locator('.ui-dialog').last().waitFor({ state: 'visible', timeout });
  return page.locator('.ui-dialog').last();
}

const topDialog = (page) => page.locator('.ui-dialog').last();

async function clickIfVisible(locator, timeout = 5000) {
  try {
    if (!(await locator.count())) return false;
    const first = locator.first();
    if (!(await first.isVisible().catch(() => false))) return false;
    await first.click({ timeout });
    return true;
  } catch { return false; }
}

// Try a list of candidate locators in order; returns the name of the one that worked or null.
// A candidate is a selector string, a Locator, or { name, locator }.
async function clickCandidate(page, candidates, scope = page) {
  for (const candidate of candidates) {
    const locator = typeof candidate === 'string' ? scope.locator(candidate) : (candidate && candidate.locator ? candidate.locator : candidate);
    if (!locator) continue;
    if (await clickIfVisible(locator)) return typeof candidate === 'string' ? candidate : (candidate.name || 'locator');
  }
  return null;
}

// ---------------------------------------------------------------------------------------------------
// Lifecycle snapshots: cumulative counts from the page, per-stage deltas against the previous stage, and
// the Node-side console error/warning counts. See reviews/lifecycle-instrumentation.md.
// ---------------------------------------------------------------------------------------------------
const LIFECYCLE_COUNTERS = ['resizeObserverCallbacks', 'observersCreated', 'observerDisconnects', 'autoResizeCalls', 'autoResizeWrappedDialogs', 'patchObservers', 'patchObserverCallbacks', 'patchObserverDisconnected', 'dialogResizeEvents', 'dialogResizeFromDialogContent', 'pageErrors', 'consoleErrorsPage'];

async function lifecycleSnapshot(page, ctx) {
  const counts = await page.evaluate(() => {
    const L = window.__labLifecycle;
    if (!L) return null;
    const patchObservers = (L.patchObservers || []).map((p) => ({ ...p, callbacks: (L.resizeObserver.callbacks || []).filter((c) => c.observer === p.id).length }));
    return {
      probes: true,
      resizeObserverCallbacks: L.resizeObserver.callbacks.length,
      observersCreated: L.resizeObserver.observers.length,
      observerDisconnects: L.resizeObserver.disconnects.length,
      autoResizeCalls: L.autoResize.calls,
      autoResizeWrappedDialogs: L.autoResize.wrapped,
      autoResizePerDialog: L.autoResize.perDialog,
      patchObservers: L.patchObservers.length,
      patchObserverCallbacks: patchObservers.reduce((n, o) => n + o.callbacks, 0),
      patchObserverDisconnected: patchObservers.some((o) => o.disconnected),
      patchObserverDetail: patchObservers.map((o) => ({ dialog: o.dialog, id: o.id, targets: o.targets, callbacks: o.callbacks, disconnected: !!o.disconnected })),
      dialogResizeEvents: L.dialogResizeEvents.length,
      dialogResizeFromDialogContent: L.dialogResizeEvents.filter((e) => e.inDialogContent).length,
      dialogResizeTargets: [...new Set(L.dialogResizeEvents.map((e) => e.target))].slice(-6),
      pageErrors: L.pageErrors.length,
      consoleErrorsPage: L.consoleErrors.length,
      lastResizeObserver: L.resizeObserver.callbacks.slice(-3),
      lastDisconnects: L.resizeObserver.disconnects.slice(-3),
      lastDialogResize: L.dialogResizeEvents.slice(-3),
      lastPageErrors: L.pageErrors.slice(-3),
      lastConsoleErrors: L.consoleErrors.slice(-3),
    };
  }).catch(() => null);
  const node = { consoleErrors: ctx.consoleErrors.length, consoleWarnings: ctx.consoleWarnings.length };
  const prev = ctx.lcPrev || {};
  const delta = {};
  let epochReset = false;
  if (counts) {
    for (const key of LIFECYCLE_COUNTERS) {
      const current = typeof counts[key] === 'number' ? counts[key] : (counts[key] ? 1 : 0);
      const before = typeof prev[key] === 'number' ? prev[key] : 0;
      if (current < before) epochReset = true;
      delta[key] = current - before;
    }
  }
  delta.consoleErrorsNode = node.consoleErrors - (typeof prev.consoleErrorsNode === 'number' ? prev.consoleErrorsNode : 0);
  delta.consoleWarningsNode = node.consoleWarnings - (typeof prev.consoleWarningsNode === 'number' ? prev.consoleWarningsNode : 0);
  if (epochReset) for (const key of Object.keys(delta)) delta[key] = key in counts || key === 'consoleErrorsNode' || key === 'consoleWarningsNode' ? (key in counts ? counts[key] : (key === 'consoleErrorsNode' ? node.consoleErrors : node.consoleWarnings)) : 0;
  ctx.lcPrev = { ...(counts || {}), consoleErrorsNode: node.consoleErrors, consoleWarningsNode: node.consoleWarnings };
  return {
    available: !!counts,
    epochReset,
    counts: counts ? Object.fromEntries(LIFECYCLE_COUNTERS.map((k) => [k, counts[k]])) : null,
    delta,
    node,
    recent: {
      resizeObserver: counts ? counts.lastResizeObserver : [],
      dialogResize: counts ? counts.lastDialogResize : [],
      pageErrors: counts ? counts.lastPageErrors : [],
      consoleErrors: counts ? counts.lastConsoleErrors : [],
      consoleErrorsNode: ctx.consoleErrors.slice(-3),
    },
    patchObserverDetail: counts ? counts.patchObserverDetail : [],
  };
}

// Capture one stage: full dialog measurement, lifecycle delta, viewport screenshot and a clipped dialog
// screenshot (a clip never scrolls the page; element screenshots would). Returns the stored stage.
async function captureStage(page, ctx, label, extra = {}) {
  const measure = await page.evaluate(() => window.__labCapture.measureDialog()).catch((e) => ({ error: String(e.message) }));
  const lifecycle = await lifecycleSnapshot(page, ctx);
  const screenshots = {};
  const base = `${ctx.side}-${label}`;
  try {
    await page.screenshot({ path: path.join(ctx.out, `${base}-viewport.png`) });
    screenshots.viewport = `${base}-viewport.png`;
  } catch { /* page may be gone */ }
  const dialog = measure && measure.dialogs && measure.dialogs[0];
  if (dialog && dialog.rect && measure.viewport && measure.viewport.scrollY === 0) {
    const r = dialog.rect;
    const clip = { x: Math.max(0, r.left), y: Math.max(0, r.top), width: Math.min(r.width, measure.viewport.innerWidth), height: Math.min(r.height, measure.viewport.innerHeight) };
    if (clip.width > 20 && clip.height > 20) {
      try {
        await page.screenshot({ path: path.join(ctx.out, `${base}-dialog.png`), clip });
        screenshots.dialog = `${base}-dialog.png`;
      } catch { /* clip outside page */ }
    }
  }
  const stage = { label, at: new Date().toISOString(), measure, lifecycle, screenshots, ...extra };
  ctx.stages.push(stage);
  return stage;
}

const stageWith = (rec, prefix) => (rec.stages || []).find((s) => String(s.label).startsWith(prefix)) || null;
const lastStage = (rec) => (rec.stages || []).slice(-1)[0] || null;

async function axeOf(page) {
  try { return await axeScan(page); } catch (e) { return { error: String(e.message).slice(0, 200), total: null, rules: {} }; }
}

// ---------------------------------------------------------------------------------------------------
// Scenario A: Field UI — add a Date and time field and enable "Set default value" in the modal.
// ---------------------------------------------------------------------------------------------------
const CONFIG_FORM_HINT = SET_DEFAULT_VALUE;

async function contentTypeFieldsPath(page, base) {
  // Article first (the issue's wording and the recipe's intent); otherwise the first content type listed.
  const article = `${base}/admin/structure/types/manage/article/fields`;
  const response = await page.goto(article, { waitUntil: 'load' }).catch(() => null);
  if (response && response.status() < 400) {
    const hasAdd = await page.locator('a[href*="fields/add-field"], a:has-text("Create a new field"), a:has-text("Add field")').count().catch(() => 0);
    if (hasAdd) return { url: article, type: 'article' };
  }
  await page.goto(`${base}/admin/structure/types`, { waitUntil: 'load' });
  const hrefs = await page.evaluate(() => [...document.querySelectorAll('a[href*="/manage/"]')].map((a) => a.getAttribute('href') || '').filter((h) => /\/manage\/[^/]+\/fields$/.test(h)));
  const first = hrefs[0];
  if (!first) throw new PreconditionError('#3466040 scenario A: no content type with a "Manage fields" page was found. The recipe must install a content type (Standard gives Article) plus Field UI. Set it up, then run `node scripts/lab-env.mjs reset 3466040-pinned --yes`.');
  const type = (first.match(/\/manage\/([^/]+)\/fields/) || [])[1] || 'unknown';
  await page.goto(`${base}${first}`, { waitUntil: 'load' });
  return { url: `${base}${first}`, type };
}

// Pick the Date and time field type in whatever shape the pinned core's Add field modal has: a select
// (older UI), a radio choice (grouped field types), or a field-option card (new grouped UI).
async function pickDateTimeType(dialog) {
  const radioInfo = await dialog.evaluate((root) => [...root.querySelectorAll('input[type=radio]')].map((r, i) => ({
    i, id: r.id || null, value: r.value, checked: r.checked,
    label: (r.labels && r.labels[0] ? r.labels[0].textContent : '').replace(/\s+/g, ' ').trim(),
  })));
  const radio = radioInfo.find((r) => /date and time|datetime/i.test(`${r.label} ${r.value}`) && !/date only/i.test(r.label));
  if (radio && radio.id) {
    await dialog.locator(`#${radio.id}`).check({ timeout: 5000 });
    return { kind: 'radio', label: radio.label, value: radio.value };
  }
  const select = dialog.locator('select[name="new_storage_type"], select[name="field_options_wrapper"], select[name*="storage_type"]');
  if (await select.count()) {
    const options = await select.first().evaluate((s) => [...s.options].map((o) => ({ value: o.value, text: (o.textContent || '').trim() })));
    const match = options.find((o) => /datetime|date and time/i.test(`${o.value} ${o.text}`) && !/date only/i.test(o.text));
    if (match) { await select.first().selectOption(match.value); return { kind: 'select', label: match.text, value: match.value }; }
  }
  const cards = await dialog.evaluate((root) => [...root.querySelectorAll('a[href]')].map((a, i) => ({ i, href: a.getAttribute('href'), text: (a.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 120) })).filter((a) => /date\s*(and\s*)?time|datetime/i.test(`${a.text} ${a.href}`)));
  const card = cards.find((c) => !/date only/i.test(c.text));
  if (card) {
    await dialog.locator('a[href]').nth(card.i).click({ timeout: 5000 });
    return { kind: 'card', label: card.text, href: card.href };
  }
  return null;
}

async function fillFieldLabel(dialog, ctx) {
  const label = dialog.locator('input[name="label"]');
  if (!(await label.count())) return null;
  const current = await label.first().inputValue().catch(() => '');
  const wanted = `Test date ${Date.now().toString().slice(-5)}`;
  if (!current) {
    await label.first().fill(wanted, { timeout: 5000 });
    // The machine name is generated from the label by core's machine_name element; wait for it rather than
    // typing into it (typing there would be a different interaction than a person does).
    await pageWaitFor(pageOf(dialog), (expected) => {
      const m = document.querySelector('.ui-dialog input[name="field_name"]');
      return !!m && !!m.value && m.value !== expected;
    }, '').catch(() => {});
    const machine = await dialog.locator('input[name="field_name"]').first().inputValue().catch(() => '');
    if (!machine) await dialog.locator('input[name="field_name"]').first().fill('test_date', { timeout: 5000 }).catch(() => {});
    return wanted;
  }
  return current;
}

function pageOf(dialog) { return dialog.page(); }

async function pageWaitFor(page, fn, arg, timeout = 4000) {
  try { await page.waitForFunction(fn, arg, { timeout }); return true; } catch { return false; }
}

async function clickContinue(dialog) {
  return clickCandidate(dialog, [
    'input[type=submit][value="Continue" i]',
    'input[type=submit][value*="Continue" i]',
    'button:has-text("Continue")',
    'input[value="Continue" i]',
  ]);
}

async function visibleModalError(dialog) {
  const errors = await dialog.evaluate((root) => [...root.querySelectorAll('.messages--error, [data-drupal-message-type="error"], .form-item--error-message')]
    .filter((el) => { try { return el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }); } catch { return el.offsetWidth > 0; } })
    .map((el) => (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 300)));
  return errors;
}

async function runFieldUi(ctx) {
  const { page, base } = ctx;
  const rec = { scenario: 'field-ui', method: null, contentType: null, stages: [], keyboard: null, axe: null, error: null, createdField: null, reusedField: null, closed: null };
  ctx.stages = rec.stages;

  const fields = await contentTypeFieldsPath(page, base);
  rec.contentType = fields.type;
  await waitForStable(page, { timeout: 15000 });
  await captureStage(page, ctx, 'A1-fields-page');

  // 1. "Add field" / "Create a new field" modal. If the control is missing, fall back to editing an existing
  // Date and time field (a repeat run on a site where the field was saved).
  let opened = await clickCandidate(page, [
    { name: 'add-field', locator: page.getByRole('link', { name: /create a new field|add field/i }) },
    'a[href*="fields/add-field"]',
    'a.use-ajax[href*="/fields/add-field"]',
  ]);
  if (opened) {
    rec.method = 'add-field';
  } else {
    const existing = await page.evaluate(() => [...document.querySelectorAll('table tr')]
      .filter((tr) => /date and time|date only/i.test(tr.textContent || ''))
      .map((tr) => {
        const edit = [...tr.querySelectorAll('a[href]')].find((a) => /^edit$/i.test((a.textContent || '').trim()));
        return edit ? { href: edit.getAttribute('href'), text: (tr.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 120) } : null;
      })
      .filter(Boolean));
    if (!existing.length) {
      throw new PreconditionError(`#3466040 scenario A: the fields page (${fields.url}) has no "Add field" control and no existing Date and time field. Is Field UI enabled for the admin user, and is the Datetime module installed?`);
    }
    // Operations may live in a collapsed dropbutton; open it if needed.
    await clickCandidate(page, ['table tr .dropbutton-toggle button', 'table tr button.dropbutton__toggle', 'table tr .dropbutton__toggle button'], page.locator('table tr').filter({ hasText: /date and time|date only/i }).first());
    const clicked = await clickCandidate(page, [`a[href="${String(existing[0].href).replace(/"/g, '\\"')}"]`]);
    if (!clicked) throw new Error(`Found an existing Date and time field but could not click its Edit link (${existing[0].href}).`);
    rec.method = 'edit-existing';
    rec.reusedField = existing[0].text;
  }
  const dialog = await waitForDialog(page);
  await waitForStable(page, { timeout: 15000 });
  await captureStage(page, ctx, 'A2-add-field-modal');

  if (rec.method === 'add-field') {
    const picked = await pickDateTimeType(dialog);
    if (!picked) {
      throw new PreconditionError('#3466040 scenario A: the Add field modal lists no "Date and time" (datetime) field type. Enable the Datetime module for this variant, then re-run. If core changed the field-type UI, update pickDateTimeType() in tools/playwright/evaluate-3466040.mjs.');
    }
    rec.typeChosen = picked;
    // The type card/radio opens the storage form by AJAX in the same modal element. On pristine core the content
    // replacement can land after the stability window (observed 2026-11-27: step 1 found only the type chooser), so
    // wait for a control that only the next step has, then re-acquire the visible dialog on every loop iteration.
    await pageWaitFor(page, () => {
      const dlg = [...document.querySelectorAll('.ui-dialog')].find((d) => (d.checkVisibility ? d.checkVisibility() : d.offsetParent));
      if (!dlg) return false;
      return !!dlg.querySelector('input[name="label"]') || [...dlg.querySelectorAll('input[type=submit], button')].some((b) => /continue/i.test(b.value || b.textContent || ''));
    }, null, 15000);
    await waitForStable(page, { timeout: 15000 });
    await captureStage(page, ctx, 'A3-type-chosen');

    // Fill the label, then press Continue until the field config edit form (with "Set default value") is open.
    let reachedConfig = false;
    for (let step = 1; step <= 4; step += 1) {
      const stepDialog = await waitForDialog(page);
      if (await stepDialog.locator(CONFIG_FORM_HINT).count()) { reachedConfig = true; break; }
      // A grouped field-type step may ask for the sub-type radio before Continue; choose it if it is there.
      if (!(await stepDialog.locator('input[type=radio]:checked').count())) await pickDateTimeType(stepDialog).catch(() => null);
      await fillFieldLabel(stepDialog, ctx).catch(() => {});
      const errors = await visibleModalError(stepDialog);
      if (errors.length) throw new Error(`Modal reports: ${errors.join(' / ')}`);
      const clicked = await clickContinue(stepDialog);
      if (!clicked) {
        const again = await stepDialog.locator(CONFIG_FORM_HINT).count();
        if (again) { reachedConfig = true; break; }
        throw new Error(`Scenario A: no Continue button and no field config form in the modal (step ${step}).`);
      }
      await waitForStable(page, { timeout: 15000 });
      await captureStage(page, ctx, `A4-continue-${step}`);
    }
    if (!reachedConfig) throw new Error('Scenario A: the field config edit form did not open after 4 modal steps.');
  } else {
    // Editing an existing field opens the field config edit form directly.
    if (!(await dialog.locator(CONFIG_FORM_HINT).count())) {
      throw new Error('Scenario A: the existing field\'s Edit modal does not contain input[name="set_default_value"].');
    }
  }
  rec.createdField = rec.method === 'add-field' ? 'new datetime field (not saved)' : null;
  await waitForStable(page, { timeout: 10000 });
  const before = await captureStage(page, ctx, 'A5-config-form-open');

  // 2. Tick "Set default value" with a real click. Record the scroll positions around it, because Playwright
  // scrolls a control into view before clicking it (the keyboard walk below then starts from this state).
  const checkbox = topDialog(page).locator(SET_DEFAULT_VALUE).first();
  if (!(await checkbox.count())) throw new Error('Scenario A: "Set default value" checkbox input[name="set_default_value"] is not in the dialog.');
  const beforeClick = await page.evaluate(() => ({ y: Math.round(scrollY), content: (() => { const c = document.querySelector('.ui-dialog .ui-dialog-content'); return c ? c.scrollTop : null; })() }));
  const wasChecked = await checkbox.isChecked().catch(() => false);
  if (!wasChecked) await checkbox.click({ timeout: 10000 });
  const afterClick = await page.evaluate(() => ({ y: Math.round(scrollY), content: (() => { const c = document.querySelector('.ui-dialog .ui-dialog-content'); return c ? c.scrollTop : null; })() }));
  // The default value widget is revealed by core's #states (display changes), then the dialog should resize.
  await pageWaitFor(page, () => {
    const d = document.querySelector('.ui-dialog');
    if (!d) return false;
    const details = [...d.querySelectorAll('details')].find((x) => /default value/i.test(x.textContent || ''));
    if (!details) return false;
    try { return details.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }); } catch { return details.offsetHeight > 0; }
  }, null, 5000).catch(() => {});
  await waitForStable(page, { timeout: 20000 });
  await sleep(page, 400);                            // let a debounced autoResize (20 ms) and any observer settle
  await waitForStable(page, { timeout: 10000 });
  const grown = await captureStage(page, ctx, 'A6-default-value-on', { checkbox: { wasChecked, beforeClick, afterClick } });

  rec.axe = await axeOf(page);

  // 3. Keyboard-only reach from the checkbox: real Tab presses, no programmatic scrolling.
  rec.keyboard = await keyboardReach(page, { maxTabs: ctx.maxTabs });
  await captureStage(page, ctx, 'A7-after-tab');

  // 4. Close with Escape (real key) so the teardown path runs (the patch disconnects its observer on
  // dialog:beforeclose). Evidence for the code review's NEEDS RUNTIME CHECK items.
  await page.keyboard.press('Escape').catch(() => {});
  await waitForStable(page, { timeout: 10000 });
  await sleep(page, 400);
  rec.closed = await captureStage(page, ctx, 'A8-dialog-closed', { dialogVisible: (await page.locator('.ui-dialog:visible').count().catch(() => 0)) > 0 });

  rec.open = { dialogVisible: !!(before.measure && before.measure.dialogs && before.measure.dialogs.length), grown: !!(grown.measure && grown.measure.dialogs && grown.measure.dialogs.length) };
  return rec;
}

// ---------------------------------------------------------------------------------------------------
// Scenario B: Views — open the Content type filter modal and expand/collapse its details elements.
// ---------------------------------------------------------------------------------------------------
async function openViewsFilterDialog(page, status = null) {
  // Judge availability from the HTTP status and the page's own heading/title, not from the whole body text:
  // admin pages legitimately contain words such as "access" in help text and in the navigation, and a
  // body-wide regex has produced a false "not available" abort on a Views page that answers 200.
  const pageInfo = await page.evaluate(() => ({
    title: document.title || '',
    h1: (document.querySelector('h1')?.innerText || '').replace(/\s+/g, ' ').trim(),
    path: location.pathname,
  }));
  const errorHeading = /^(access denied|page not found)/i;
  const notFound = (typeof status === 'number' && status >= 400)
    || errorHeading.test(pageInfo.h1)
    || errorHeading.test(pageInfo.title);
  if (notFound) {
    throw new Error(`Views edit page /admin/structure/views/view/content is not available (HTTP ${status ?? 'unknown'}, title "${pageInfo.title}", h1 "${pageInfo.h1}", path ${pageInfo.path}).`);
  }
  let target = await page.evaluate(() => {
    const anchors = [...document.querySelectorAll('a[href]')];
    const match = anchors.find((a) => /content:\s*content type/i.test((a.textContent || '').replace(/\s+/g, ' ')));
    return match ? { href: match.getAttribute('href'), text: (match.textContent || '').replace(/\s+/g, ' ').trim() } : null;
  });
  if (!target) {
    // Fall back to any AJAX link whose text mentions "Content type" inside the filter bucket.
    target = await page.evaluate(() => {
      const anchors = [...document.querySelectorAll('.views-ui-display-tab-bucket a[href], .views-ui-display-tab a[href]')];
      const match = anchors.find((a) => /content type/i.test(a.textContent || ''));
      return match ? { href: match.getAttribute('href'), text: (match.textContent || '').replace(/\s+/g, ' ').trim() } : null;
    });
  }
  if (!target) throw new Error('Scenario B: could not find the "Content: Content type" filter link on the Views edit page.');
  const clicked = await clickCandidate(page, [`a[href="${String(target.href).replace(/"/g, '\\"')}"]`]);
  if (!clicked) {
    // href may be rewritten by the browser; try by text.
    const byText = await clickCandidate(page, [{ name: 'views-filter', locator: page.getByRole('link', { name: /content:\s*content type/i }) }]);
    if (!byText) throw new Error('Scenario B: found the filter link but could not click it.');
  }
  const dialog = await waitForDialog(page);
  await waitForStable(page, { timeout: 20000 });
  return { dialog, target };
}

async function runViews(ctx) {
  const { page, base } = ctx;
  const rec = { scenario: 'views', stages: [], keyboard: null, axe: null, error: null, target: null, toggles: [], closed: null };
  ctx.stages = rec.stages;
  const viewsResponse = await page.goto(`${base}/admin/structure/views/view/content`, { waitUntil: 'load' });
  const viewsStatus = viewsResponse ? viewsResponse.status() : null;
  await waitForStable(page, { timeout: 15000 });
  await captureStage(page, ctx, 'B0-views-page');
  const { dialog, target } = await openViewsFilterDialog(page, viewsStatus);
  rec.target = target;
  await captureStage(page, ctx, 'B1-filter-dialog-open');

  // Expand each collapsed details element inside the dialog, one at a time, capturing geometry after each.
  const detailsInfo = async () => {
    const measure = await page.evaluate(() => window.__labCapture.measureDialog());
    const d = measure && measure.dialogs && measure.dialogs[0];
    return d ? d.details : [];
  };
  let details = await detailsInfo();
  const collapsed = details.filter((d) => !d.open);
  for (let i = 0; i < Math.min(collapsed.length, 3); i += 1) {
    const title = collapsed[i].summary;
    const summary = title ? dialog.locator('details').filter({ hasText: title }).locator('summary').first() : dialog.locator('details').nth(collapsed[i].index).locator('summary');
    const clicked = await clickCandidate(page, [summary]);
    if (!clicked) break;
    await waitForStable(page, { timeout: 12000 });
    await sleep(page, 400);
    await captureStage(page, ctx, `B2-details-open-${i + 1}`, { detailsTitle: title });
    rec.toggles.push({ action: 'expand', title });
  }
  // Close them again ("Open/close the details until things get out of hands" in the issue).
  details = await detailsInfo();
  const opened = details.filter((d) => d.open);
  for (let i = 0; i < Math.min(opened.length, 3); i += 1) {
    const title = opened[i].summary;
    const summary = title ? dialog.locator('details').filter({ hasText: title }).locator('summary').first() : dialog.locator('details').nth(opened[i].index).locator('summary');
    const clicked = await clickCandidate(page, [summary]);
    if (!clicked) break;
    await waitForStable(page, { timeout: 12000 });
    await sleep(page, 400);
    await captureStage(page, ctx, `B3-details-closed-${i + 1}`, { detailsTitle: title });
    rec.toggles.push({ action: 'collapse', title });
  }
  rec.axe = await axeOf(page);
  rec.keyboard = await keyboardReach(page, { maxTabs: ctx.maxTabs });
  await captureStage(page, ctx, 'B4-after-tab');
  await page.keyboard.press('Escape').catch(() => {});
  await waitForStable(page, { timeout: 10000 });
  await sleep(page, 300);
  rec.closed = await captureStage(page, ctx, 'B5-dialog-closed');
  return rec;
}

// ---------------------------------------------------------------------------------------------------
// Checks and summary.
// ---------------------------------------------------------------------------------------------------
const scenarioOf = (results, side, name) => (results.sides[side] && results.sides[side].scenarios && results.sides[side].scenarios[name]) || {};
const stageOf = (results, side, name, prefix) => stageWith(scenarioOf(results, side, name), prefix);
const dialogOf = (stage) => (stage && stage.measure && stage.measure.dialogs && stage.measure.dialogs[0]) || null;
const primaryOf = (stage) => {
  const d = dialogOf(stage);
  return d && d.buttons ? d.buttons.find((b) => b.primary) || null : null;
};
const primaryOperable = (stage) => {
  const b = primaryOf(stage);
  return !!b && b.inViewport && b.enabled && b.visible && b.hit && b.hit.hittable;
};
const fits = (stage) => { const d = dialogOf(stage); return !!d && d.fitsVertically; };
const displayRect = (stage) => {
  const d = dialogOf(stage);
  if (!d) return 'no dialog';
  const r = d.rect;
  return `top ${r.top}, bottom ${r.bottom} (viewport ${stage.measure.viewport.innerHeight})`;
};
const displayPrimary = (stage) => {
  const b = primaryOf(stage);
  if (!b) return 'no primary action button found';
  return `${b.label || b.tag}${b.inViewport ? ' in viewport' : ' OUTSIDE viewport'}${b.hit && b.hit.hittable ? ', hittable' : ', NOT hittable'}`;
};
const kbOf = (results, side, name) => scenarioOf(results, side, name).keyboard || null;
const kbReachable = (results, side, name) => {
  const k = kbOf(results, side, name);
  return !!k && !!k.reachedPrimary && !!k.primaryInViewport;
};
const kbDisplay = (results, side, name) => {
  const k = kbOf(results, side, name);
  if (!k) return 'not run';
  if (!k.reachedPrimary) return `no primary button reached in ${k.tabPresses} Tab presses`;
  return `${k.primaryLabel} after ${k.stepsToPrimary} Tab press(es)${k.primaryInViewport ? ', in viewport' : ', NOT in viewport'}${k.contentScrolled ? ' (content scrolled)' : ''}${k.windowScrolled ? ' (page scrolled)' : ''}`;
};
const deltaOf = (results, side, name, prefix, key) => {
  const s = stageOf(results, side, name, prefix);
  return s && s.lifecycle && s.lifecycle.delta ? s.lifecycle.delta[key] : null;
};
const dv = (results, side, name, prefix, key) => { const v = deltaOf(results, side, name, prefix, key); return v == null ? 'not captured' : v; };
const yn = (v) => (v ? 'yes' : 'no');
const short = (s, n = 44) => { const t = String(s == null ? '' : s); return t.length > n ? `${t.slice(0, n - 1)}…` : t; };

export function buildChecks(results, scenariosRequested) {
  const rows = [];
  const add = (row) => rows.push(row);
  const A = (side, prefix) => stageOf(results, side, 'field-ui', prefix);
  const have = (name) => scenariosRequested.includes(name);
  // A scenario is only judged when both sides got far enough to produce stages; otherwise it is recorded
  // as an observe row with the error, so a setup gap cannot look like a fixed or unfixed result.
  const ran = (side, name) => { const rec = scenarioOf(results, side, name); return !rec.error && (rec.stages || []).length > 0; };
  const skip = (scenario, name) => {
    add({ type: 'observe', scenario, label: `Scenario ${scenario} was not evaluated: ${[scenarioOf(results, 'before', name).error, scenarioOf(results, 'after', name).error].filter(Boolean).join(' / ') || 'no stages recorded'}`, before: 'not evaluated', after: 'not evaluated' });
  };

  if (have('field-ui') && ran('before', 'field-ui') && ran('after', 'field-ui')) {
    const openB = A('before', 'A5-config-form-open'); const openA = A('after', 'A5-config-form-open');
    const grownB = A('before', 'A6-default-value-on'); const grownA = A('after', 'A6-default-value-on');
    add({ type: 'fix', scenario: 'A', label: 'After "Set default value" is enabled, the dialog stays inside the viewport', before: fits(grownB), after: fits(grownA), good: !fits(grownB) && fits(grownA) });
    add({ type: 'fix', scenario: 'A', label: 'Primary action button (Save/Continue) is in the viewport and hit-testable after the growth', before: primaryOperable(grownB), after: primaryOperable(grownA), good: !primaryOperable(grownB) && primaryOperable(grownA) });
    add({ type: 'fix', scenario: 'A', label: 'Primary action button is reached with Tab (real keys) and is inside the viewport when focused', before: kbReachable(results, 'before', 'field-ui'), after: kbReachable(results, 'after', 'field-ui'), good: !kbReachable(results, 'before', 'field-ui') && kbReachable(results, 'after', 'field-ui') });
    add({ type: 'observe', scenario: 'A', label: 'Dialog rect after the growth', before: displayRect(grownB), after: displayRect(grownA) });
    add({ type: 'observe', scenario: 'A', label: 'Primary action button after the growth', before: displayPrimary(grownB), after: displayPrimary(grownA) });
    add({ type: 'observe', scenario: 'A', label: 'Keyboard trail to the primary action', before: kbDisplay(results, 'before', 'field-ui'), after: kbDisplay(results, 'after', 'field-ui') });
    add({ type: 'observe', scenario: 'A', label: 'ResizeObserver callbacks during the growth step (instrumentation)', before: dv(results, 'before', 'field-ui', 'A6', 'resizeObserverCallbacks'), after: dv(results, 'after', 'field-ui', 'A6', 'resizeObserverCallbacks') });
    add({ type: 'observe', scenario: 'A', label: 'autoResize executions during the growth step (instrumentation)', before: dv(results, 'before', 'field-ui', 'A6', 'autoResizeCalls'), after: dv(results, 'after', 'field-ui', 'A6', 'autoResizeCalls') });
    add({ type: 'observe', scenario: 'A', label: 'Observer stored in $element.data("drupalAutoResizeObserver") (instrumentation; only the patched side has one)', before: (scenarioOf(results, 'before', 'field-ui').stages || []).some((s) => s.lifecycle && s.lifecycle.counts && s.lifecycle.counts.patchObservers > 0), after: (scenarioOf(results, 'after', 'field-ui').stages || []).some((s) => s.lifecycle && s.lifecycle.counts && s.lifecycle.counts.patchObservers > 0) });
    add({ type: 'observe', scenario: 'A', label: 'Observer disconnected on dialog close (instrumentation)', before: dv(results, 'before', 'field-ui', 'A8', 'observerDisconnects'), after: dv(results, 'after', 'field-ui', 'A8', 'observerDisconnects') });
    add({ type: 'regression', scenario: 'A', label: 'Dialog size when the field config form opens (before any growth) is equal on both sides (within 4 px)', before: openB && dialogOf(openB) ? `${dialogOf(openB).rect.width}x${dialogOf(openB).rect.height}` : 'no dialog', after: openA && dialogOf(openA) ? `${dialogOf(openA).rect.width}x${dialogOf(openA).rect.height}` : 'no dialog', good: (() => { const b = dialogOf(openB); const a = dialogOf(openA); return !!b && !!a && Math.abs(b.rect.width - a.rect.width) <= 4 && Math.abs(b.rect.height - a.rect.height) <= 4; })() });
    add({ type: 'regression', scenario: 'A', label: 'Drupal.displace offsets are equal when the dialog opens', before: openB && openB.measure.displace ? JSON.stringify(openB.measure.displace) : null, after: openA && openA.measure.displace ? JSON.stringify(openA.measure.displace) : null, good: JSON.stringify(openB && openB.measure.displace) === JSON.stringify(openA && openA.measure.displace) });
    add({ type: 'regression', scenario: 'A', label: 'axe violating elements in the modal after the growth', before: scenarioOf(results, 'before', 'field-ui').axe ? scenarioOf(results, 'before', 'field-ui').axe.total : null, after: scenarioOf(results, 'after', 'field-ui').axe ? scenarioOf(results, 'after', 'field-ui').axe.total : null, good: (scenarioOf(results, 'before', 'field-ui').axe || {}).total === (scenarioOf(results, 'after', 'field-ui').axe || {}).total });
    add({ type: 'regression', scenario: 'A', label: 'Uncaught page errors (lab-run jsErrors, ResizeObserver loop notice excluded)', before: (results.sides.before.jsErrors || []).length, after: (results.sides.after.jsErrors || []).length, good: (results.sides.before.jsErrors || []).length === (results.sides.after.jsErrors || []).length });
    add({ type: 'regression', scenario: 'A', label: 'Console errors (page-level probe + page.on("console"))', before: consoleErrorsOf(results, 'before'), after: consoleErrorsOf(results, 'after'), good: consoleErrorsOf(results, 'before') === consoleErrorsOf(results, 'after') });
  } else if (have('field-ui')) {
    skip('A', 'field-ui');
  }
  if (have('views') && ran('before', 'views') && ran('after', 'views')) {
    const lastOpenB = lastStageMatching(results, 'before', 'views', /^B2-details-open-/);
    const lastOpenA = lastStageMatching(results, 'after', 'views', /^B2-details-open-/);
    add({ type: 'fix', scenario: 'B', label: 'After the filter dialog\'s details elements are expanded, the dialog stays inside the viewport', before: fits(lastOpenB), after: fits(lastOpenA), good: !fits(lastOpenB) && fits(lastOpenA) });
    add({ type: 'fix', scenario: 'B', label: 'Primary action button (Apply) is in the viewport and hit-testable after the details are expanded', before: primaryOperable(lastOpenB), after: primaryOperable(lastOpenA), good: !primaryOperable(lastOpenB) && primaryOperable(lastOpenA) });
    add({ type: 'fix', scenario: 'B', label: 'Primary action button is reached with Tab (real keys) and is inside the viewport when focused', before: kbReachable(results, 'before', 'views'), after: kbReachable(results, 'after', 'views'), good: !kbReachable(results, 'before', 'views') && kbReachable(results, 'after', 'views') });
    add({ type: 'observe', scenario: 'B', label: 'Dialog rect after the last details toggle', before: displayRect(lastOpenB), after: displayRect(lastOpenA) });
    add({ type: 'observe', scenario: 'B', label: 'Keyboard trail to the primary action', before: kbDisplay(results, 'before', 'views'), after: kbDisplay(results, 'after', 'views') });
    add({ type: 'observe', scenario: 'B', label: 'ResizeObserver callbacks during the first details expansion (instrumentation)', before: dv(results, 'before', 'views', 'B2-details-open-1', 'resizeObserverCallbacks'), after: dv(results, 'after', 'views', 'B2-details-open-1', 'resizeObserverCallbacks') });
    add({ type: 'observe', scenario: 'B', label: 'autoResize executions during the first details expansion (instrumentation)', before: dv(results, 'before', 'views', 'B2-details-open-1', 'autoResizeCalls'), after: dv(results, 'after', 'views', 'B2-details-open-1', 'autoResizeCalls') });
    add({ type: 'observe', scenario: 'B', label: 'Views UI dispatches dialogContentResize itself on summary clicks (pre-existing workaround; instrumentation)', before: dv(results, 'before', 'views', 'B2-details-open-1', 'dialogResizeEvents'), after: dv(results, 'after', 'views', 'B2-details-open-1', 'dialogResizeEvents') });
    add({ type: 'regression', scenario: 'B', label: 'Dialog size when the filter dialog opens is equal on both sides (within 4 px)', before: dialogSize(stageOf(results, 'before', 'views', 'B1-filter-dialog-open')), after: dialogSize(stageOf(results, 'after', 'views', 'B1-filter-dialog-open')), good: sizesClose(stageOf(results, 'before', 'views', 'B1-filter-dialog-open'), stageOf(results, 'after', 'views', 'B1-filter-dialog-open')) });
    add({ type: 'regression', scenario: 'B', label: 'axe violating elements in the filter dialog', before: (scenarioOf(results, 'before', 'views').axe || {}).total, after: (scenarioOf(results, 'after', 'views').axe || {}).total, good: (scenarioOf(results, 'before', 'views').axe || {}).total === (scenarioOf(results, 'after', 'views').axe || {}).total });
    add({ type: 'regression', scenario: 'B', label: 'Console errors (page-level probe + page.on("console"))', before: consoleErrorsOf(results, 'before'), after: consoleErrorsOf(results, 'after'), good: consoleErrorsOf(results, 'before') === consoleErrorsOf(results, 'after') });
  } else if (have('views')) {
    skip('B', 'views');
  }
  return rows;
}

function consoleErrorsOf(results, side) {
  const scenarios = (results.sides[side] || {}).scenarios || {};
  const pageCount = Object.values(scenarios).reduce((n, rec) => {
    const stages = (rec && rec.stages) || [];
    const last = stages.slice(-1)[0];
    return n + (last && last.lifecycle && last.lifecycle.counts ? (last.lifecycle.counts.consoleErrorsPage || 0) : 0);
  }, 0);
  const nodeCount = ((results.sides[side] || {}).consoleErrors || []).length;
  return pageCount + nodeCount;
}
function lastStageMatching(results, side, name, re) {
  const stages = (scenarioOf(results, side, name).stages || []).filter((s) => re.test(String(s.label)));
  return stages.slice(-1)[0] || (scenarioOf(results, side, name).stages || []).slice(-1)[0] || null;
}
function dialogSize(stage) { const d = dialogOf(stage); return d ? `${d.rect.width}x${d.rect.height}` : 'no dialog'; }
function sizesClose(b, a) { const db = dialogOf(b); const da = dialogOf(a); return !!db && !!da && Math.abs(db.rect.width - da.rect.width) <= 4 && Math.abs(db.rect.height - da.rect.height) <= 4; }

function stageTable(results, scenario, include) {
  let md = '| Stage | Viewport | Dialog (top→bottom) | Fits | Content client/scroll | Content overflow-y | Button pane | Primary button | Active element | RO cb Δ | autoResize Δ | dialogContentResize Δ |\n|---|---|---|---|---|---|---|---|---|---|---|---|\n';
  for (const side of ['before', 'after']) {
    const stages = (scenarioOf(results, side, scenario).stages || []).filter((s) => include.test(String(s.label)));
    for (const st of stages) {
      const m = st.measure || {};
      const d = (m.dialogs || [])[0];
      if (!d) {
        md += `| ${side} ${st.label} | ${m.viewport ? `${m.viewport.innerWidth}x${m.viewport.innerHeight}` : '?'} | no dialog | – | – | – | – | – | ${short(m.document && m.document.activeElement, 30)} | – | – | – |\n`;
        continue;
      }
      const c = d.content || {};
      const lc = st.lifecycle && st.lifecycle.delta ? st.lifecycle.delta : {};
      const p = d.buttons ? d.buttons.find((b) => b.primary) : null;
      md += `| ${side} ${st.label} | ${m.viewport.innerWidth}x${m.viewport.innerHeight} | ${d.rect.top}→${d.rect.bottom} (h ${d.rect.height})${d.fitsVertically ? '' : ` **+${d.overflowBottomPx}px below**`} | ${d.fitsVertically ? 'yes' : '**no**'} | ${c.clientHeight}/${c.scrollHeight}${c.scrollableY ? ' (scrolls)' : ''} | ${c.computed ? c.computed['overflow-y'] : '?'} | ${d.buttonPane ? `${d.buttonPane.rect.height}px ${d.buttonPane.inViewport ? 'in view' : '**out**'}` : 'none'} | ${p ? `${short(p.label, 18)} ${p.inViewport ? 'in view' : '**OUT**'}${p.hit && p.hit.hittable ? ', hit' : ', no hit'}` : 'none'} | ${short(m.document && m.document.activeElement, 28)} | ${lc.resizeObserverCallbacks == null ? '?' : lc.resizeObserverCallbacks} | ${lc.autoResizeCalls == null ? '?' : lc.autoResizeCalls} | ${lc.dialogResizeEvents == null ? '?' : lc.dialogResizeEvents} |\n`;
    }
  }
  return md;
}

function lifecycleTable(results, scenario) {
  let md = '| Side | Stage | RO callbacks | observer(s) created | patch observer stored | patch observer callbacks | autoResize calls | autoResize wrapped | dialogContentResize | of which from .ui-dialog-content | page errors | console errors (page) | console errors (Node) |\n|---|---|---|---|---|---|---|---|---|---|---|---|---|\n';
  for (const side of ['before', 'after']) {
    for (const st of (scenarioOf(results, side, scenario).stages || [])) {
      const c = st.lifecycle && st.lifecycle.counts;
      if (!c) continue;
      md += `| ${side} | ${st.label} | ${c.resizeObserverCallbacks} | ${c.observersCreated} | ${c.patchObservers} | ${c.patchObserverCallbacks} | ${c.autoResizeCalls} | ${c.autoResizeWrappedDialogs} | ${c.dialogResizeEvents} | ${c.dialogResizeFromDialogContent} | ${c.pageErrors} | ${c.consoleErrorsPage} | ${st.lifecycle.node.consoleErrors} |\n`;
    }
  }
  return md;
}

function keyboardTable(results, scenario) {
  let md = '| Side | Step | Focused element | In dialog | In viewport | Page scrolled | Content scrolled |\n|---|---|---|---|---|---|---|\n';
  for (const side of ['before', 'after']) {
    const k = kbOf(results, side, scenario);
    if (!k) { md += `| ${side} | not run | | | | | |\n`; continue; }
    for (const s of k.trail) {
      if (!s.inDialog && s.step !== 0 && !s.isPrimaryAction) continue;
      md += `| ${side} | ${s.step} | ${short(s.active, 52)} | ${yn(s.inDialog)} | ${yn(s.inViewport)} | ${yn(s.windowScrolled)} | ${yn(s.contentScrolled)} |\n`;
    }
  }
  return md;
}

function scenarioInterpretation(rows, scenario) {
  const fix = rows.filter((r) => r.type === 'fix' && r.scenario === scenario);
  if (!fix.length) return null;
  const reproduced = fix.every((r) => !r.before);
  const fixed = fix.every((r) => r.after);
  if (reproduced && fixed) return { verdict: 'reproduced-and-fixed', text: 'Before fails every fix check and After passes every one.' };
  if (reproduced) return { verdict: 'reproduced-not-fixed', text: 'Before fails the fix checks but After does not pass all of them.' };
  if (fix.every((r) => r.before)) return { verdict: 'not-reproduced', text: 'Before passes every fix check, so the problem did not reproduce in this scenario on this core/these steps.' };
  return { verdict: 'mixed', text: 'Some fix checks already pass on Before and some do not: read the table and the screenshots before drawing a conclusion.' };
}

export function buildSummary(results, rows, scenariosRequested, environment, run) {
  const fixRows = rows.filter((r) => r.type === 'fix');
  const judged = rows.filter((r) => ['fix', 'regression', 'same'].includes(r.type));
  const scenarioErrors = scenariosRequested
    .map((name) => ({ name, before: scenarioOf(results, 'before', name).error || null, after: scenarioOf(results, 'after', name).error || null }))
    .filter((e) => e.before || e.after);
  const unexpected = judged.filter((r) => r.type !== 'observe' && !r.good).length + scenarioErrors.length;
  const interpA = scenarioInterpretation(rows, 'A');
  const interpB = scenarioInterpretation(rows, 'B');
  let verdict = 'mixed';
  if (scenarioErrors.length) {
    verdict = 'mixed';
  } else if (scenariosRequested.includes('field-ui')) {
    verdict = interpA ? interpA.verdict : 'mixed';
    if (scenariosRequested.includes('views') && interpB) {
      if (verdict === 'reproduced-and-fixed' && interpB.verdict === 'reproduced-and-fixed') verdict = 'reproduced-and-fixed';
      else if (verdict === 'reproduced-and-fixed' && interpB.verdict === 'not-reproduced') verdict = 'reproduced-and-fixed';
      else if (verdict === 'reproduced-and-fixed') verdict = 'mixed';
    }
  } else if (interpB) verdict = interpB.verdict;

  const zoomLine = results.zoom && results.zoom.requested ? `, \`--zoom=${results.zoom.requested}\` (reflow-equivalent CSS viewport ${run.viewport.width}x${run.viewport.height} from ${results.zoom.sourceViewport.width}x${results.zoom.sourceViewport.height}; **not** a real browser zoom)` : '';
  const textLine = results.textZoom ? `, synthetic root font-size ${results.textZoom}% (text-resize approximation, not browser zoom)` : '';
  let md = `# Playwright evidence: #${results.issue} (${results.variant})\n\n`
    + `Run ${results.when}. Scenario(s): **${scenariosRequested.join(', ')}**. Core Before \`${results.commits.before}\`, After \`${results.commits.after}\``
    + `${(results.patches || []).length ? ` plus \`${(results.patches || []).map((p) => path.basename(p)).join('`, `')}\`` : ''}. `
    + `${environment.browser} ${environment.browserVersion}, colour scheme **${environment.colorScheme}**, forced colours **${environment.forcedColors ? 'active' : 'none'}**${zoomLine}, viewport ${run.viewport.width}x${run.viewport.height}${textLine}, ${environment.os}. Trusted Playwright input (clicks, Tab, Escape); axe-core WCAG 2.0–2.2 A/AA. Recorders: tools/playwright/lib/lab-run.mjs; geometry and lifecycle probes: this evaluator.\n\n`
    + `Rule: **fix** rows are expected to be false on Before and true on After; **regression** rows are expected to be equal on both sides; **observe** rows are recorded, not judged. Verdict: **${verdict}**.\n\n`
    + `## Checks\n\n| Type | Scenario | Check | Before | After | Verdict |\n|---|---|---|---|---|---|\n`;
  for (const r of rows) {
    const verdictCell = r.type === 'observe' ? 'recorded' : (r.good ? 'as expected' : '**NOT as expected**');
    md += `| ${r.type} | ${r.scenario || '–'} | ${r.label} | ${r.before} | ${r.after} | ${verdictCell} |\n`;
  }
  md += '\n';
  if (interpA) md += `Scenario A (Field UI): ${interpA.text}\n\n`;
  if (interpB) md += `Scenario B (Views): ${interpB.text}${interpB.verdict === 'not-reproduced' ? ' Note that Views UI already has its own resize workaround (`core/modules/views_ui/js/dialog.views.js` dispatches `dialogContentResize` on summary clicks), so Before is not a naive baseline here.' : ''}\n\n`;
  if (scenarioErrors.length) {
    md += `## Scenario errors (this run is not evidence of a fix or a regression)\n\n`;
    for (const e of scenarioErrors) md += `- **${e.name}**: ${[e.before && `Before — ${e.before}`, e.after && `After — ${e.after}`].filter(Boolean).join('; ')}\n`;
    md += `\nFix the setup and re-run; see reports/issues/3466040/reviews/harness-plan.md for the preconditions.\n\n`;
  }
  md += `## Stage geometry\n\n### Scenario A: Field UI (Add field → field config → "Set default value")\n\n${stageTable(results, 'field-ui', /^A[1-8]-/)}\n`;
  md += `### Scenario B: Views (Content type filter modal → details)\n\n${stageTable(results, 'views', /^B[0-5]-/)}\n`;
  md += `## Keyboard trail (real Tab presses; no programmatic scrolling)\n\n`;
  md += 'Scenario A (from the "Set default value" checkbox after the click):\n\n';
  md += keyboardTable(results, 'field-ui') + '\n';
  md += 'Scenario B (from the last clicked summary):\n\n';
  md += keyboardTable(results, 'views') + '\n';
  md += `## Lifecycle instrumentation (page-level, no patch change)\n\nCounts are cumulative for the page; the stage tables above show per-stage deltas. \`patch observer\` is read from the \`drupalAutoResizeObserver\` jQuery data the patch stores — Before has none, After does. Instrumentation explains *whether the fix ran*; it is not a user-facing pass/fail.\n\n`;
  md += `### Scenario A\n\n${lifecycleTable(results, 'field-ui')}\n`;
  md += `### Scenario B\n\n${lifecycleTable(results, 'views')}\n`;
  md += evidenceDetails(results);
  md += contextMarkdown(results) + ajaxMarkdown(results) + speechMarkdown(results);
  md += `## Limits\n\n`
    + `- Geometry and lifecycle numbers are automated evidence: a DRAFT, not a substitute for a person's keyboard and screen-reader pass.\n`
    + `- WebKit here is Playwright's WebKit build (Safari's engine); it is **not** Safari, and this run does not test Safari, Safari's keyboard behaviour on macOS, or VoiceOver.\n`
    + `- Colour scheme and forced colours are Playwright emulation, not a real OS setting; a real Windows contrast theme still needs a person.\n`
    + `- ${results.zoom && results.zoom.requested ? '`--zoom` changes the CSS viewport (reflow-equivalent: 1280 at 400% = 320 CSS px); real browser zoom (Ctrl/Cmd +), pinch zoom and native magnifiers were not run.' : 'Real browser zoom (Ctrl/Cmd +), text-only zoom, pinch zoom and native magnifiers were not run; `--zoom` is the reflow-equivalent approximation described in the harness plan.'}\n`
    + `- The field config change is never saved: the run stops in the modal, so the site's configuration is unchanged (the private temp store may keep the half-finished field).\n`
    + `- axe-core finds only a subset of problems and does not evaluate dialog reflow.\n\n`
    + `---\nAutomated evidence is a DRAFT. Run \`node tools/playwright/evaluate-3466040.mjs 3466040-latest --scenario=both\` after re-pinning, and have a person check the keyboard path.\n`;
  return { md, verdict, unexpected };
}

function evidenceDetails(results) {
  let md = '';
  const sides = ['before', 'after'];
  const anyPatchObserver = sides.some((side) => (scenarioOf(results, side, 'field-ui').stages || []).some((s) => s.lifecycle && s.lifecycle.counts && s.lifecycle.counts.patchObservers > 0));
  md += `## What was measured\n\n`;
  md += `Per stage: \`window.innerWidth/innerHeight\`, \`window.scrollY\`, \`Drupal.displace.offsets\`, every visible \`.ui-dialog\` (rect, computed height/max-height/overflow, titlebar and \`.ui-dialog-titlebar-close\` rects, \`.ui-dialog-content\` clientHeight/scrollHeight/scrollTop/overflow-y, \`.ui-dialog-buttonpane\` rect, each action button rect/visibility/disabled/hit-test, \`.form-actions\`, \`details\` open state, the Views \`.scroll\` container), \`document.activeElement\`, emulated media features, and a hit-test with \`document.elementFromPoint\` at the centre and four inset corners (an element is reported as operable only when the topmost element there is it or a descendant, and it is inside the viewport).\n\n`;
  md += `Screenshots per stage: \`<side>-<stage>-viewport.png\` and \`<side>-<stage>-dialog.png\` (the dialog crop is a screenshot clip, which never scrolls the page; element screenshots would).\n\n`;
  md += anyPatchObserver
    ? `The After side stores a ResizeObserver in \`$element.data('drupalAutoResizeObserver')\`; the Before side has none. That is read-only instrumentation (see reviews/lifecycle-instrumentation.md) and is also the direct signal that the patch executed.\n\n`
    : `No \`drupalAutoResizeObserver\` jQuery data was found on either side. Either the dialogs did not reach \`dialog:aftercreate\` with autoResize on, or the After environment does not carry the patch — check \`results.json\` → \`patchState\`/\`commits\` before reading the geometry.\n\n`;
  return md;
}

// ---------------------------------------------------------------------------------------------------
// Entry point.
// ---------------------------------------------------------------------------------------------------
async function main() {
  const run = runArgs({ slug: `${NID}-pinned` });
  const scenarioArg = String(opt('scenario', 'both')).toLowerCase();
  const scenariosRequested = scenarioArg === 'both' ? ['field-ui', 'views'] : scenarioArg === 'field-ui' ? ['field-ui'] : scenarioArg === 'views' ? ['views'] : null;
  if (!scenariosRequested) throw new Error('--scenario must be both, field-ui or views');
  const zoom = Number(opt('zoom', '0')) || 0;
  const textZoom = Number(opt('text-zoom', '0')) || 0;
  const maxTabs = Math.max(1, Number(opt('max-tabs', '80')) || 80);
  const settle = Number(opt('settle', '800')) || 800;
  const outGiven = argv.some((a) => a.startsWith('--out='));

  // Browser zoom approximation: browser zoom reduces the CSS viewport (1920x1080 at 200% behaves like a
  // 960x540 CSS window). Playwright has no cross-browser zoom API, so the CSS viewport is divided by the
  // zoom factor and the method is recorded. This is the reflow-equivalent, not a real zoom; see the plan.
  let zoomInfo = null;
  if (zoom) {
    if (!(zoom >= 100) || zoom > 800) throw new Error('--zoom is a percentage (100 to 800), for example --zoom=200');
    const source = { ...run.viewport };
    const width = Math.round((source.width * 100) / zoom);
    const height = Math.round((source.height * 100) / zoom);
    if (width < 160 || height < 120) throw new Error(`--zoom=${zoom} with --viewport=${source.width}x${source.height} gives a ${width}x${height} CSS viewport, which is too small to open an admin dialog. Try --viewport=1920x1080 --zoom=${zoom}.`);
    zoomInfo = { requested: zoom, method: 'reflow-equivalent CSS viewport (physical viewport / zoom factor); NOT a real browser zoom', sourceViewport: source, effectiveViewport: { width, height } };
    run.viewport = { width, height };
    if (!outGiven) {
      const oldOut = run.out;
      run.envTag = `${run.envTag}-zoom${zoom}`;
      run.out = path.join(path.dirname(oldOut), `${path.basename(oldOut)}-zoom${zoom}`);
      try { fs.rmdirSync(oldOut); } catch { /* not empty or already gone */ }
      fs.mkdirSync(run.out, { recursive: true });
    }
  }

  const launched = await launch(run);
  run.browser = launched.browser;
  const results = baseResults(run, launched.environment);
  results.zoom = zoomInfo;
  results.textZoom = textZoom || null;
  results.scenariosRequested = scenariosRequested;
  results.instrumentation = {
    method: 'page-level only: window.ResizeObserver wrapped (pass-through), $element.data("drupalAutoResize") wrapped after dialog:aftercreate, dialogContentResize listener, window error/rejection listeners, console.error wrapper; plus page.on("console") on the Node side',
    patchChange: 'none',
    counters: LIFECYCLE_COUNTERS,
  };
  results.sides = {};

  const abort = async (browser, rec, message) => {
    if (rec) await rec.close(run.out).catch(() => {});
    await browser.close().catch(() => {});
    fs.writeFileSync(path.join(run.out, 'ABORTED.md'), `# Run aborted: precondition not met\n\n${message}\n\nNo results.json is written, so scripts/coverage.mjs does not count this run as evidence. Fix the precondition and re-run; the command is in reports/issues/${NID}/reviews/harness-plan.md.\n`);
    console.error(`ABORTED: ${message}`);
    return 3;
  };

  try {
    for (const side of ['before', 'after']) {
      console.log(`running ${side} (${run.v[side].env}) ...`);
      const { page, base, rec } = await openSide(run, side);
      const ctx = {
        run, out: run.out, side, page, base, rec,
        stages: [], consoleErrors: [], consoleWarnings: [], lcPrev: null,
        textZoom, maxTabs, settle,
      };
      page.on('console', (message) => {
        if (message.type() === 'error') ctx.consoleErrors.push({ type: 'error', text: short(message.text(), 500), location: message.location ? `${message.location().url || ''}:${message.location().lineNumber || ''}` : null });
        if (message.type() === 'warning') ctx.consoleWarnings.push({ type: 'warning', text: short(message.text(), 300) });
      });
      await installCapture(page);
      rec.scenarios = {};
      try {
        for (const name of scenariosRequested) {
          ctx.stages = [];
          try {
            const scenarioRec = name === 'field-ui' ? await runFieldUi(ctx) : await runViews(ctx);
            rec.scenarios[name] = scenarioRec;
            console.log(`  ${name}: ${(scenarioRec.stages || []).length} stage(s)${scenarioRec.error ? ` — ERROR: ${scenarioRec.error}` : ''}`);
          } catch (error) {
            if (error instanceof PreconditionError) {
              rec.consoleErrors = ctx.consoleErrors;
              rec.consoleWarnings = ctx.consoleWarnings;
              await rec.close(run.out).catch(() => {});
              process.exitCode = await abort(run.browser, null, error.message);
              return;
            }
            rec.scenarios[name] = { scenario: name, error: String(error.message).slice(0, 600), stages: ctx.stages, keyboard: null, axe: null };
            console.error(`  ${name}: ERROR ${error.message}`);
          }
        }
        rec.consoleErrors = ctx.consoleErrors;
        rec.consoleWarnings = ctx.consoleWarnings;
        if (textZoom) rec.textZoomApplied = true;
      } finally {
        try { await rec.close(run.out); } catch (e) { console.error(`  warning: closing the ${side} side failed: ${e.message}`); }
      }
      results.sides[side] = rec;
    }
  } finally {
    await run.browser.close().catch(() => {});
  }

  if (!results.sides.before || !results.sides.after) {
    fs.writeFileSync(path.join(run.out, 'ABORTED.md'), '# Run aborted\n\nA side could not be opened; see the console output.\n\n');
    console.error('ABORTED: a side could not be opened.');
    process.exitCode = 3;
    return;
  }

  results.environment.zoom = zoomInfo;
  results.environment.textZoom = textZoom || null;
  const rows = buildChecks(results, scenariosRequested);
  const summary = buildSummary(results, rows, scenariosRequested, results.environment, run);
  const { md, verdict, unexpected } = summary;
  results.checks = rows;
  results.verdict = verdict;
  results.unexpected = unexpected;
  // Keep results.json small: the stage tables above the truncation are the evidence; drop nothing here except
  // the per-step keyboard geometry, which is duplicated in the trail summary.
  for (const side of ['before', 'after']) for (const scenario of Object.keys(results.sides[side].scenarios || {})) {
    const k = results.sides[side].scenarios[scenario].keyboard;
    if (k && Array.isArray(k.steps)) k.steps = k.steps.map((s) => ({ step: s.step, active: s.active, inDialog: s.inDialog, inViewport: s.inViewport, isPrimaryAction: s.isPrimaryAction }));
  }
  const where = writeRun(run, results, md);
  console.log(`\n${verdict}: ${where}/SUMMARY.md`);
  process.exitCode = unexpected === 0 && verdict !== 'mixed' ? 0 : 2;
}

const isMain = (() => {
  try { return process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href; } catch { return false; }
})();
if (isMain) {
  main().catch((error) => { console.error(error && error.stack ? error.stack : error); process.exit(1); });
}
