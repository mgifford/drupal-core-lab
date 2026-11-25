// Evidence for #3594809: Use standard checkboxes on forms that require submission.
//   node tools/playwright/evaluate-3594809.mjs [slug] [--browser=chromium|firefox|webkit] [--scheme=light|dark]
//     [--forced-colors] [--viewport=WxH] [--reduced-motion] [--theme-mode=dark|high-contrast] [--text-scale=2]
//     [--sweep] [--out=<dir>]
//
// The fixture form at /admin/lab/checkboxes (recipes/repro_3594809/lab_checkbox_fixture) holds real Form API checkboxes
// in each state. This script drives it with Playwright's trusted keyboard and pointer input and records semantics,
// computed presentation, the CSS rules behind it, save and reload, #states, AJAX, a dialog, right to left, target
// sizes, the stylesheets requested and axe. --sweep also visits the real administration pages in the variant.
// --theme-mode sets a Default Admin theme setting on both sites for the run and puts the old value back afterwards.
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { envDir } from '../compare/lib.mjs';
import { runArgs, launch, openSide, axeScan, baseResults, writeRun, contextMarkdown, ajaxMarkdown, speechMarkdown } from './lib/lab-run.mjs';

const argv = process.argv.slice(2);
const flag = (n) => argv.includes(`--${n}`);
const opt = (n, d) => { const a = argv.find((x) => x.startsWith(`--${n}=`)); return a ? a.slice(n.length + 3) : d; };

const run = runArgs({ slug: '3594809-latest' });
const { v, out } = run;
const mode = { sweep: flag('sweep'), reducedMotion: flag('reduced-motion'), themeMode: opt('theme-mode', null), textScale: Number(opt('text-scale', '1')) };
const THEME_MODES = { dark: ['enable_dark_mode', '1'], 'high-contrast': ['high_contrast_mode', true] };
if (mode.themeMode && !THEME_MODES[mode.themeMode]) throw new Error('--theme-mode must be dark or high-contrast');

const FIXTURE = '/admin/lab/checkboxes';
const FORM = 'form#lab-checkbox-fixture-form';
const sel = (name) => `input[name="${name}"]`;
const itemOf = (page, name) => page.locator(`.form-item:has(> input[name="${name}"])`).first();
const fieldsetOf = (page, name) => page.locator(`fieldset:has(input[name="${name}"])`).first();
// The conventional checkbox floats outside its form item's box, so a state crop is the control and its label together.
// The crop is taken inside the viewport: a full-page screenshot blurs the focused element in Chromium, which would
// lose the focus ring in the image and send the next key press to <body>.
async function shotControl(page, selector, name) {
  const clip = await page.evaluate((selector) => {
    const input = document.querySelector(selector); if (!input) return null;
    const rect = () => {
      const parts = [input, input.labels?.[0], input.closest('.form-item')].filter(Boolean).map((e) => e.getBoundingClientRect());
      return { x0: Math.min(...parts.map((r) => r.left)), y0: Math.min(...parts.map((r) => r.top)), x1: Math.max(...parts.map((r) => r.right)), y1: Math.max(...parts.map((r) => r.bottom)) };
    };
    let r = rect();
    if (r.y0 < 12 || r.y1 > innerHeight - 12) { input.scrollIntoView({ block: 'center' }); r = rect(); }
    const x = Math.max(0, r.x0 - 12), y = Math.max(0, r.y0 - 12);
    return { x, y, width: Math.min(r.x1 - r.x0 + 24, 560, innerWidth - x), height: Math.min(r.y1 - r.y0 + 24, innerHeight - y) };
  }, selector);
  if (!clip) return;
  await page.screenshot({ path: path.join(out, name), clip }).catch((e) => console.warn(`screenshot ${name}: ${String(e.message).split('\n')[0]}`));
}
const shot = (locator, name) => locator.screenshot({ path: path.join(out, name) }).catch((e) => console.warn(`screenshot ${name}: ${String(e.message).split('\n')[0]}`));

// Checkboxes that are enabled and visible when the form first loads, in DOM order: the keyboard pass must reach each.
const ENABLED = ['default_unchecked', 'default_checked', 'required_checkbox', 'with_description', 'long_label', 'indeterminate', 'error_unchecked', 'error_checked', 'group[one]', 'group[two]', 'table[r1]', 'table[r2]', 'table[r3]', 'states_controller', 'states_checked', 'ajax_checkbox'];
const DISABLED = ['disabled_unchecked', 'disabled_checked', 'group[three]', 'states_enabled'];
const STANDALONE = ['default_unchecked', 'default_checked', 'disabled_unchecked', 'disabled_checked', 'required_checkbox', 'with_description', 'long_label', 'indeterminate', 'error_unchecked', 'error_checked', 'states_controller', 'states_checked', 'ajax_checkbox'];
const PROBED = [...new Set([...STANDALONE, ...ENABLED, ...DISABLED, 'states_visible'])];

// One control: what it is, how it looks, where it sits relative to its label.
const probe = (page, selector) => page.evaluate((selector) => {
  const input = document.querySelector(selector);
  if (!input) return null;
  const clean = (t) => String(t || '').replace(/\s+/g, ' ').trim();
  const short = (t) => (t && t.length > 110 ? `${t.slice(0, 70)}…${t.slice(-24)}` : t);
  const box = (r) => ({ x: Math.round(r.x * 10) / 10, y: Math.round(r.y * 10) / 10, w: Math.round(r.width * 10) / 10, h: Math.round(r.height * 10) / 10 });
  const s = getComputedStyle(input), b = getComputedStyle(input, '::before'), a = getComputedStyle(input, '::after');
  const r = input.getBoundingClientRect();
  const item = input.closest('.form-item');
  const label = input.labels && input.labels[0];
  let labelBox = null, firstLine = null, lines = 0, overlap = false;
  if (label) {
    const range = document.createRange(); range.selectNodeContents(label);
    const rects = [...range.getClientRects()].filter((x) => x.width > 0 && x.height > 0);
    lines = new Set(rects.map((x) => Math.round(x.top))).size;
    firstLine = rects[0] ? box(rects[0]) : null;
    labelBox = box(label.getBoundingClientRect());
    // A visually hidden label (table rows) sits on its control by design: only a label that is shown can overlap.
    const shown = !label.classList.contains('visually-hidden') && labelBox.w > 1 && labelBox.h > 1;
    overlap = shown && rects.some((x) => x.left < r.right - 0.5 && x.right > r.left + 0.5 && x.top < r.bottom - 0.5 && x.bottom > r.top + 0.5);
  }
  // Contrast from computed colours: the label against the first opaque background behind it, and the control's edge
  // (its border when it has one, else its fill) against the background around it. null when it cannot be worked out.
  const rgb = (c) => { const m = /^rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)$/.exec(c || ''); return m ? { c: [+m[1], +m[2], +m[3]], a: m[4] === undefined ? 1 : +m[4] } : null; };
  const lum = (c) => { const [R, G, B] = c.map((v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * R + 0.7152 * G + 0.0722 * B; };
  const ratio = (x, y) => { if (!x || !y) return null; const [hi, lo] = [lum(x.c), lum(y.c)].sort((p, q) => q - p); return Math.round(((hi + 0.05) / (lo + 0.05)) * 100) / 100; };
  const behind = (el) => { for (let e = el; e; e = e.parentElement) { const c = rgb(getComputedStyle(e).backgroundColor); if (c && c.a === 1) return c; } return { c: [255, 255, 255], a: 1 }; };
  // No figure when the browser draws the control itself (appearance is not none, as in forced colours) or when the
  // border colour is not a plain opaque rgb(): the computed colours then say nothing about what is painted.
  const edge = (() => {
    if (s.appearance !== 'none') return null;
    const bc = rgb(s.borderTopColor), hasBorder = parseFloat(s.borderTopWidth) > 0;
    if (hasBorder && (!bc || (bc.a > 0 && bc.a < 1))) return null;
    return hasBorder && bc.a === 1 ? bc : rgb(s.backgroundColor);
  })();
  const contrast = { label: label ? ratio(rgb(getComputedStyle(label).color), behind(label)) : null, controlEdge: edge && edge.a === 1 ? ratio(edge, behind(input.parentElement)) : null };
  const cx = r.x + r.width / 2, cy = r.y + r.height / 2;
  const inViewport = r.width > 0 && r.top >= 0 && r.left >= 0 && r.bottom <= innerHeight && r.right <= innerWidth;
  const top = inViewport ? document.elementFromPoint(cx, cy) : null;
  return {
    semantics: {
      tag: input.tagName.toLowerCase(), type: input.getAttribute('type'), role: input.getAttribute('role'),
      checked: input.checked, disabled: input.disabled, required: input.required, indeterminate: input.indeterminate,
      ariaChecked: input.getAttribute('aria-checked'), ariaInvalid: input.getAttribute('aria-invalid'), tabIndex: input.tabIndex,
      labels: [...(input.labels || [])].map((l) => clean(l.textContent)),
      description: (input.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean).map((id) => clean(document.getElementById(id)?.textContent)).join(' | '),
    },
    classes: input.className, itemClasses: item?.className || null, parentClasses: item?.parentElement?.className || null,
    visible: r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && input.offsetParent !== null,
    box: box(r), labelBox, firstLine, labelLines: lines,
    alignDeltaY: firstLine ? Math.round((firstLine.y + firstLine.h / 2 - cy) * 10) / 10 : null,
    labelOverlapsControl: overlap,
    contrast,
    controlSide: labelBox ? (cx < labelBox.x + labelBox.w / 2 ? 'left' : 'right') : null,
    focus: { active: document.activeElement === input, focusVisible: input.matches(':focus-visible'), inViewport, topElementIsControl: !!top && (top === input || (!!label && label.contains(top))) },
    style: {
      appearance: s.appearance, display: s.display, width: s.width, height: s.height, borderRadius: s.borderRadius,
      border: `${s.borderTopWidth} ${s.borderTopStyle} ${s.borderTopColor}`, backgroundColor: s.backgroundColor,
      backgroundImage: short(s.backgroundImage), boxShadow: s.boxShadow,
      outline: `${s.outlineWidth} ${s.outlineStyle} ${s.outlineColor}`, outlineOffset: s.outlineOffset,
      opacity: s.opacity, cursor: s.cursor, clipPath: s.clipPath, float: s.float, position: s.position,
      marginInlineStart: s.marginInlineStart, transitionDuration: s.transitionDuration, forcedColorAdjust: s.forcedColorAdjust,
      labelColor: label ? getComputedStyle(label).color : null, labelPaddingInlineStart: label ? getComputedStyle(label).paddingInlineStart : null,
      itemMarginInlineStart: item ? getComputedStyle(item).marginInlineStart : null,
    },
    pseudo: {
      before: { content: b.content, display: b.display, width: b.width, height: b.height, backgroundColor: b.backgroundColor, transform: b.transform, transitionDuration: b.transitionDuration },
      after: { content: a.content, display: a.display, backgroundColor: a.backgroundColor, maskImage: short(a.maskImage), transform: a.transform },
    },
  };
}, selector);

const pageState = (page) => page.evaluate(() => {
  const cbs = [...document.querySelectorAll('input[type="checkbox"]')];   // also those in an inactive vertical tab
  const wide = (i) => { const s = getComputedStyle(i); return parseFloat(s.width) > parseFloat(s.height) * 1.4; };
  const clean = (t) => String(t || '').replace(/\s+/g, ' ').trim();
  const sheets = [...document.styleSheets];
  const toggleRule = sheets.some((s) => { try { return [...s.cssRules].some((r) => (r.selectorText || '').includes(':not(.form-checkboxes') && (r.selectorText || '').includes('> .form-type--checkbox')); } catch { return false; } });
  return {
    path: location.pathname, theme: window.drupalSettings?.ajaxPageState?.theme ?? null, title: clean(document.querySelector('h1')?.textContent),
    dir: document.documentElement.dir || 'ltr', lang: document.documentElement.lang || null,
    darkModeClass: document.documentElement.classList.contains('dark-mode'), highContrastClass: document.documentElement.classList.contains('high-contrast-mode'),
    media: { forcedColors: matchMedia('(forced-colors: active)').matches, prefersDark: matchMedia('(prefers-color-scheme: dark)').matches, reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches },
    rootFontSize: getComputedStyle(document.documentElement).fontSize, viewport: { w: innerWidth, h: innerHeight },
    horizontalScroll: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    checkboxes: cbs.length, visibleCheckboxes: cbs.filter((i) => i.offsetParent !== null).length, switchLike: cbs.filter(wide).length, switchLikeLabels: cbs.filter(wide).slice(0, 12).map((i) => clean(i.labels?.[0]?.textContent).slice(0, 70)),
    roleSwitch: document.querySelectorAll('[role="switch"]').length, disabledCheckboxes: cbs.filter((i) => i.disabled).length,
    stylesheets: sheets.length, toggleStylesheetLinked: sheets.some((s) => (s.href || '').includes('form--checkbox-toggle')), toggleRuleLoaded: toggleRule,
  };
});

// The size of each standalone checkbox and how far its centre is from the nearest other checkbox (WCAG 2.5.8 spacing).
const targetSizes = (page, names) => page.evaluate((names) => {
  const all = [...document.querySelectorAll('input[type="checkbox"], input[type="radio"]')].filter((i) => i.offsetParent !== null);
  const centre = (i) => { const r = i.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; };
  return names.map((n) => document.querySelector(`input[name="${n}"]`)).filter((i) => i && i.offsetParent !== null && !i.disabled).map((i) => {
    const r = i.getBoundingClientRect(), [x, y] = centre(i), l = i.labels?.[0]?.getBoundingClientRect();
    const nearest = Math.min(...all.filter((o) => o !== i).map((o) => { const [ox, oy] = centre(o); return Math.hypot(ox - x, oy - y); }));
    return { name: i.name, w: Math.round(r.width * 10) / 10, h: Math.round(r.height * 10) / 10, labelH: l ? Math.round(l.height * 10) / 10 : null, labelW: l ? Math.round(l.width * 10) / 10 : null, nearestCentre: Math.round(nearest * 10) / 10, atLeast24: r.width >= 24 && r.height >= 24, spacing24: nearest >= 24 };
  });
}, names);

const active = (page) => page.evaluate(() => {
  const e = document.activeElement;
  if (!e || e === document.body) return { tag: 'body' };
  return { tag: e.tagName.toLowerCase(), type: e.getAttribute('type'), name: e.getAttribute('name'), id: e.id || null, text: String(e.value || e.textContent || e.title || '').replace(/\s+/g, ' ').trim().slice(0, 50), inForm: !!e.closest('form#lab-checkbox-fixture-form') };
});

// Chromium only: the rules that give the control its box, with the stylesheet each comes from.
async function matchedRules(page, selector) {
  if (run.browser.browserType().name() !== 'chromium') return null;
  const cdp = await page.context().newCDPSession(page);
  try {
    const sheets = new Map();
    cdp.on('CSS.styleSheetAdded', (e) => sheets.set(e.header.styleSheetId, e.header.sourceURL));
    await cdp.send('DOM.enable'); await cdp.send('CSS.enable');
    const { root } = await cdp.send('DOM.getDocument');
    const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: root.nodeId, selector });
    if (!nodeId) return [];
    const { matchedCSSRules = [] } = await cdp.send('CSS.getMatchedStylesForNode', { nodeId });
    const wanted = ['width', 'height', 'border-radius', 'appearance', 'all', 'background-color', 'background-image', 'border', 'outline', 'clip-path'];
    return matchedCSSRules.filter((m) => m.rule.origin === 'regular').map((m) => {
      const url = sheets.get(m.rule.styleSheetId) || '';
      const props = m.rule.style.cssProperties.filter((p) => wanted.includes(p.name) && !p.disabled && p.text !== undefined).map((p) => `${p.name}: ${String(p.value).slice(0, 60)}`);
      return { file: url.replace(/^https?:\/\/[^/]+/, '').replace(/\?.*$/, ''), selector: [...(m.rule.nestingSelectors || []).slice().reverse(), m.rule.selectorList.text].join(' ⟩ ').slice(0, 220), props };
    }).filter((x) => x.props.length);
  } catch (e) { return { error: String(e.message).slice(0, 160) }; } finally { await cdp.detach().catch(() => {}); }
}

// Chromium only: main-thread time since the side was opened. The Performance domain counts from when it is enabled,
// so the session is opened once per side (startMetrics) and read later.
async function startMetrics(page) {
  if (run.browser.browserType().name() !== 'chromium') return null;
  try { const cdp = await page.context().newCDPSession(page); await cdp.send('Performance.enable'); return cdp; } catch { return null; }
}
async function chromiumMetrics(cdp) {
  if (!cdp) return null;
  try {
    const { metrics } = await cdp.send('Performance.getMetrics');
    return Object.fromEntries(metrics.filter((m) => ['TaskDuration', 'ScriptDuration', 'LayoutDuration', 'RecalcStyleDuration', 'LayoutCount', 'RecalcStyleCount'].includes(m.name)).map((m) => [m.name, Math.round(m.value * 10000) / 10000]));
  } catch (e) { return { error: String(e.message).slice(0, 160) }; }
}

// One uncached load of the fixture: every stylesheet requested, its status and size. Routing a request turns the HTTP cache off.
async function measureCss(page, url) {
  const sheets = [], pending = [];
  const onResponse = (r) => {
    if (r.request().resourceType() !== 'stylesheet') return;
    pending.push((async () => {
      let decoded = null, sizes = null;
      try { decoded = (await r.body()).length; } catch { /* no body */ }
      try { sizes = await r.request().sizes(); } catch { /* not available */ }
      sheets.push({ url: r.url().replace(/^https?:\/\/[^/]+/, '').replace(/\?.*$/, ''), status: r.status(), decodedBytes: decoded, encodedBodyBytes: sizes?.responseBodySize ?? null });
    })());
  };
  await page.route('**/*', (route) => route.continue());
  page.on('response', onResponse);
  const t0 = Date.now();
  await page.goto(url); await page.waitForLoadState('load'); await page.waitForTimeout(400);
  const loadMs = Date.now() - t0;
  page.off('response', onResponse);
  await page.unroute('**/*');
  await Promise.all(pending);
  const sum = (k) => sheets.reduce((n, s) => n + (s[k] || 0), 0);
  const toggle = sheets.find((s) => s.url.includes('form--checkbox-toggle')) || null;
  return { requests: sheets.length, decodedBytes: sum('decodedBytes'), encodedBodyBytes: sum('encodedBodyBytes'), failed: sheets.filter((s) => s.status >= 400), toggleRequested: !!toggle, toggle, loadMs, defaultAdminSheets: sheets.filter((s) => s.url.includes('/themes/default_admin/')).length };
}

async function gotoFixture(page, base, prefix = '') {
  const r = await page.goto(base + prefix + FIXTURE);
  await page.waitForLoadState('load');
  await page.locator(sel('default_unchecked')).waitFor({ state: 'visible', timeout: 15000 });
  if (mode.reducedMotion) await page.emulateMedia({ reducedMotion: 'reduce' });
  return r.status();
}

async function submit(page, name) {
  await Promise.all([page.waitForNavigation({ waitUntil: 'load' }), page.locator(`${FORM} input[name="${name}"]`).click()]);
  await page.locator(sel('default_unchecked')).waitFor({ state: 'visible', timeout: 15000 });
}

async function fixture(page, base, side, R) {
  R.status = await gotoFixture(page, base);
  await submit(page, 'reset');
  R.css = await measureCss(page, base + FIXTURE);
  await gotoFixture(page, base);
  R.state = await pageState(page);
  R.metricsAfterLoad = await chromiumMetrics(R.cdp);
  R.controls = {};
  for (const n of PROBED) R.controls[n] = await probe(page, sel(n));
  R.controls.radio_a = await probe(page, 'input[name="radio_group"][value="a"]');
  R.controls.radio_b = await probe(page, 'input[name="radio_group"][value="b"]');
  R.controls.select_all = await probe(page, `${FORM} th.select-all input`);
  R.aria = await page.locator(FORM).ariaSnapshot();
  R.axe = await axeScan(page);
  R.targets = await targetSizes(page, STANDALONE);
  R.rules = { unchecked: await matchedRules(page, sel('default_unchecked')), checked: await matchedRules(page, sel('default_checked')) };

  await page.screenshot({ path: path.join(out, `${side}-fixture.png`), fullPage: true });
  await shot(fieldsetOf(page, 'default_unchecked'), `${side}-standalone.png`);
  await shot(fieldsetOf(page, 'group[one]'), `${side}-group.png`);
  await shot(page.locator(`table:has(${sel('table[r1]')})`).first(), `${side}-table.png`);
  for (const [state, a, b] of [['default', 'default_unchecked', 'default_checked'], ['disabled', 'disabled_unchecked', 'disabled_checked']]) {
    await shotControl(page, sel(a), `${side}-state-${state}-unchecked.png`);
    await shotControl(page, sel(b), `${side}-state-${state}-checked.png`);
  }
  await shotControl(page, sel('indeterminate'), `${side}-state-indeterminate.png`);

  // Hover, with a real pointer.
  R.hover = {};
  for (const [k, n] of [['unchecked', 'default_unchecked'], ['checked', 'default_checked']]) {
    await page.locator(sel(n)).hover();
    R.hover[k] = (await probe(page, sel(n))).style;
    await shotControl(page, sel(n), `${side}-state-hover-${k}.png`);
  }
  await page.mouse.move(1, 1);

  // Keyboard, with real Tab and Space presses.
  const K = R.keyboard = { reached: false, tabsToFirst: 0, sequence: [] };
  await page.evaluate(() => { if (document.activeElement instanceof HTMLElement) document.activeElement.blur(); window.scrollTo(0, 0); });
  for (let i = 1; i <= 200 && !K.reached; i++) {
    await page.keyboard.press('Tab');
    K.tabsToFirst = i;
    K.reached = await page.locator(sel('default_unchecked')).evaluate((e) => document.activeElement === e);
  }
  if (K.reached) {
    K.focusUnchecked = await probe(page, sel('default_unchecked'));
    await shotControl(page, sel('default_unchecked'), `${side}-state-focus-unchecked.png`);
    await page.keyboard.press('Space');
    K.afterSpace = (await probe(page, sel('default_unchecked'))).semantics.checked;
    await page.keyboard.press('Space');
    K.afterSecondSpace = (await probe(page, sel('default_unchecked'))).semantics.checked;
    for (let i = 0; i < 60; i++) {
      await page.keyboard.press('Tab');
      const a = await active(page);
      K.sequence.push(a);
      if (i === 0 && a.name === 'default_checked') {
        K.focusChecked = await probe(page, sel('default_checked'));
        await shotControl(page, sel('default_checked'), `${side}-state-focus-checked.png`);
      }
      if (a.type === 'submit' && a.text === 'Save configuration') break;
      if (!a.inForm) break;
    }
  }
  const names = K.sequence.map((a) => a.name).filter(Boolean);
  K.order = K.sequence.map((a) => a.name || (a.type === 'checkbox' ? '(select all)' : a.id || a.tag));
  K.missed = ENABLED.filter((n) => n !== 'default_unchecked' && !names.includes(n));
  K.disabledReached = DISABLED.filter((n) => names.includes(n));

  // A change that is not saved is gone after a reload.
  await page.locator(sel('default_unchecked')).click();
  R.pendingBeforeReload = (await probe(page, sel('default_unchecked'))).semantics.checked;
  await gotoFixture(page, base);
  R.afterDiscard = (await probe(page, sel('default_unchecked'))).semantics.checked;

  // Pointer: the label activates the control; a disabled control does not change; nothing is submitted.
  let navigations = 0;
  const onNav = (f) => { if (f === page.mainFrame()) navigations++; };
  page.on('framenavigated', onNav);
  await itemOf(page, 'default_unchecked').locator('label').click();
  R.afterLabelClick = (await probe(page, sel('default_unchecked'))).semantics.checked;
  // Playwright will not click the label of a disabled control, so this one is a pointer click at the label's position.
  const dl = await itemOf(page, 'disabled_unchecked').locator('label').boundingBox();
  await page.mouse.click(dl.x + Math.min(20, dl.width / 2), dl.y + dl.height / 2);
  R.disabledAfterLabelClick = (await probe(page, sel('disabled_unchecked'))).semantics.checked;
  const d = await page.locator(sel('disabled_checked')).boundingBox();
  await page.mouse.click(d.x + d.width / 2, d.y + d.height / 2);
  R.disabledCheckedAfterClick = (await probe(page, sel('disabled_checked'))).semantics.checked;
  await page.waitForTimeout(300);
  page.off('framenavigated', onNav);
  R.navigationsFromActivation = navigations;

  // Save keeps the value; it is still there after a reload; then put it back.
  await submit(page, 'op');
  R.afterSave = { checked: (await probe(page, sel('default_unchecked'))).semantics.checked, message: await page.locator('[data-drupal-messages]').first().innerText().then((t) => t.replace(/\s+/g, ' ').trim().slice(0, 120)).catch(() => null) };
  await gotoFixture(page, base);
  R.afterSaveReload = (await probe(page, sel('default_unchecked'))).semantics.checked;
  await submit(page, 'reset');
  R.afterReset = (await probe(page, sel('default_unchecked'))).semantics.checked;

  // Validation errors.
  await submit(page, 'show_errors');
  R.errors = { unchecked: await probe(page, sel('error_unchecked')), checked: await probe(page, sel('error_checked')), messages: await page.locator('.messages--error').count(), axe: (await axeScan(page)).rules };
  await shotControl(page, sel('error_unchecked'), `${side}-state-error-unchecked.png`);
  await shotControl(page, sel('error_checked'), `${side}-state-error-checked.png`);
  await shot(fieldsetOf(page, 'error_unchecked'), `${side}-errors.png`);

  // Form API #states.
  await gotoFixture(page, base);
  const states = async () => ({ visible: (await probe(page, sel('states_visible'))).visible, enabled: !(await probe(page, sel('states_enabled'))).semantics.disabled, checked: (await probe(page, sel('states_checked'))).semantics.checked });
  R.states = { before: await states() };
  await page.locator(sel('states_controller')).press('Space');
  await page.waitForTimeout(300);
  R.states.after = await states();
  R.states.dependent = await probe(page, sel('states_visible'));
  await shot(fieldsetOf(page, 'states_controller'), `${side}-states.png`);

  // AJAX replacement.
  R.ajaxReplace = { before: await probe(page, sel('ajax_checkbox')) };
  await page.locator(`${FORM} input[name="ajax_replace"]`).click();
  await page.locator('label', { hasText: 'Checkbox replaced by AJAX 1 time' }).waitFor({ state: 'visible', timeout: 15000 }).catch(() => { R.ajaxReplace.error = 'the replaced checkbox did not appear'; });
  await page.waitForTimeout(600);
  R.ajaxReplace.after = await probe(page, sel('ajax_checkbox'));
  await shot(fieldsetOf(page, 'ajax_checkbox'), `${side}-ajax.png`);

  // Dialog.
  R.dialog = {};
  try {
    await page.locator('#lab-checkbox-dialog-link').click();
    await page.locator('.ui-dialog input[name="dialog_unchecked"]').waitFor({ state: 'visible', timeout: 15000 });
    await page.waitForTimeout(400);
    R.dialog.unchecked = await probe(page, '.ui-dialog input[name="dialog_unchecked"]');
    R.dialog.checked = await probe(page, '.ui-dialog input[name="dialog_checked"]');
    R.dialog.group = await probe(page, '.ui-dialog input[name="dialog_group[one]"]');
    R.dialog.aria = await page.locator('.ui-dialog').first().ariaSnapshot();
    await shot(page.locator('.ui-dialog').first(), `${side}-dialog.png`);
    await page.keyboard.press('Escape');
    await page.locator('.ui-dialog').first().waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
  } catch (e) { R.dialog.error = String(e.message).split('\n')[0]; }
  R.metricsAfterInteractions = await chromiumMetrics(R.cdp);

  // Right to left: the same form under the Farsi URL prefix the variant adds.
  R.rtl = { status: await gotoFixture(page, base, '/fa') };
  R.rtl.state = await pageState(page);
  R.rtl.unchecked = await probe(page, sel('default_unchecked'));
  R.rtl.longLabel = await probe(page, sel('long_label'));
  R.rtl.group = await probe(page, sel('group[one]'));
  await shot(fieldsetOf(page, 'default_unchecked'), `${side}-rtl-standalone.png`);
}

// The real administration pages of the variant: is each one served, which checkboxes look like switches, axe.
async function sweep(page, base, side, R) {
  R.realPages = [];
  for (const p of v.pages.filter((x) => !x.endsWith(FIXTURE))) {
    const entry = { path: p };
    try {
      const r = await page.goto(base + p); await page.waitForLoadState('load');
      entry.status = r.status();
      Object.assign(entry, await pageState(page));
      entry.axe = (await axeScan(page)).rules;
      await page.screenshot({ path: path.join(out, `${side}-page${p.replace(/[^a-z0-9]+/gi, '-')}.png`) });
    } catch (e) { entry.error = String(e.message).split('\n')[0]; }
    R.realPages.push(entry);
  }

  // Bulk selection on /admin/content.
  const bulk = R.bulk = {};
  try {
    await page.goto(base + '/admin/content'); await page.waitForLoadState('load');
    const rows = page.locator('table tbody input[type="checkbox"]');
    const all = page.locator('table th.select-all input[type="checkbox"]').first();
    bulk.rows = await rows.count();
    await all.click();
    bulk.allCheckedAfterSelectAll = await rows.evaluateAll((list) => list.every((i) => i.checked));
    await rows.first().click();
    bulk.selectAllAfterOneUnchecked = await all.evaluate((i) => ({ checked: i.checked, indeterminate: i.indeterminate }));
    await rows.first().click();
    bulk.selectAllAfterRechecked = await all.evaluate((i) => ({ checked: i.checked, indeterminate: i.indeterminate }));
    bulk.rowBox = await probe(page, 'table tbody input[type="checkbox"]');
    await shot(page.locator('table').first(), `${side}-bulk-selection.png`);
    await all.click();
  } catch (e) { bulk.error = String(e.message).split('\n')[0]; }

  // A real configuration form: change the first setting, save, reload, put it back.
  const real = R.realForm = { path: '/admin/appearance/settings' };
  try {
    await page.goto(base + real.path); await page.waitForLoadState('load');
    const form = 'form#system-theme-settings';
    real.name = await page.locator(`${form} input[type="checkbox"]:not(:disabled)`).first().getAttribute('name');
    const target = page.locator(`${form} ${sel(real.name)}`);
    real.label = await target.evaluate((i) => i.labels[0]?.textContent.replace(/\s+/g, ' ').trim());
    real.initial = await target.isChecked();
    real.control = await probe(page, `${form} ${sel(real.name)}`);
    await shotControl(page, `${form} ${sel(real.name)}`, `${side}-real-setting.png`);
    const save = async () => { await Promise.all([page.waitForNavigation({ waitUntil: 'load' }), page.locator(`${form} input[type="submit"]`).first().click()]); };
    await target.click();
    await page.reload(); await page.waitForLoadState('load');
    real.afterDiscard = await target.isChecked();
    await target.click(); await save();
    await page.goto(base + real.path); await page.waitForLoadState('load');
    real.afterSaveReload = await target.isChecked();
    await target.click(); await save();
    await page.goto(base + real.path); await page.waitForLoadState('load');
    real.restored = await target.isChecked();
  } catch (e) { real.error = String(e.message).split('\n')[0]; }

  // Views UI: the settings form, and the "Add filter criteria" dialog of the Content view.
  const views = R.views = {};
  try {
    await page.goto(base + '/admin/structure/views/settings'); await page.waitForLoadState('load');
    views.settings = await pageState(page);
    await page.screenshot({ path: path.join(out, `${side}-page-views-settings.png`) });
    await page.goto(base + '/admin/structure/views/view/content'); await page.waitForLoadState('load');
    await page.locator('#views-add-filter').first().click();
    await page.locator('.ui-dialog input[type="checkbox"]').first().waitFor({ state: 'visible', timeout: 20000 });
    await page.waitForTimeout(500);
    views.dialog = await page.evaluate(() => {
      const cbs = [...document.querySelectorAll('.ui-dialog input[type="checkbox"]')].filter((i) => i.offsetParent !== null);
      const wide = cbs.filter((i) => { const s = getComputedStyle(i); return parseFloat(s.width) > parseFloat(s.height) * 1.4; });
      return { checkboxes: cbs.length, switchLike: wide.length, switchLikeLabels: wide.slice(0, 6).map((i) => String(i.labels?.[0]?.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 60)) };
    });
    await shot(page.locator('.ui-dialog').first(), `${side}-views-dialog.png`);
    await page.keyboard.press('Escape');
  } catch (e) { views.error = String(e.message).split('\n')[0]; }
}

async function runSide(side) {
  const { page, base, rec } = await openSide(run, side);
  const R = { failedRequests: [], consoleErrors: [] };
  page.on('response', (r) => { if (r.status() >= 400) R.failedRequests.push({ status: r.status(), url: r.url().replace(/^https?:\/\/[^/]+/, '').replace(/\?.*$/, '') }); });
  page.on('requestfailed', (r) => { if (!/ERR_ABORTED/.test(r.failure()?.errorText || '')) R.failedRequests.push({ status: r.failure()?.errorText || 'failed', url: r.url().replace(/^https?:\/\/[^/]+/, '').replace(/\?.*$/, '') }); });
  page.on('console', (m) => { if (m.type() === 'error') R.consoleErrors.push(m.text().slice(0, 200)); });
  if (mode.textScale !== 1) await page.context().addInitScript((scale) => { document.addEventListener('DOMContentLoaded', () => { const s = document.createElement('style'); s.textContent = `html{font-size:${scale * 100}% !important}`; document.head.append(s); }); }, mode.textScale);
  R.cdp = await startMetrics(page);
  const t0 = Date.now();
  await fixture(page, base, side, R);
  if (mode.sweep) await sweep(page, base, side, R);
  R.durationMs = Date.now() - t0;
  if (R.cdp) await R.cdp.detach().catch(() => {});
  delete R.cdp;
  await rec.collect();
  await rec.close(out);
  return Object.assign(rec, R);
}

// --theme-mode: a Default Admin theme setting, set on both sites for the run and restored afterwards.
function themeSetting(env, key, value) {
  const boot = `$a = require 'autoload.php'; $r = Symfony\\Component\\HttpFoundation\\Request::create('/'); $k = Drupal\\Core\\DrupalKernel::createFromRequest($r, $a, 'prod'); $k->boot(); $k->preHandle($r);`;
  const set = value === undefined ? '' : `$c->set(${JSON.stringify(key)}, json_decode(${JSON.stringify(JSON.stringify(value))}))->save();`;
  const php = `<?php ${boot} $c = \\Drupal::configFactory()->getEditable('default_admin.settings'); $prev = $c->get(${JSON.stringify(key)}); ${set} echo "\\n" . json_encode(['prev' => $prev]);`;
  const r = spawnSync('ddev', ['exec', 'php'], { cwd: envDir(env), input: php, encoding: 'utf8', timeout: 120000 });
  try { return JSON.parse((r.stdout || '').trim().split('\n').pop()).prev; } catch { throw new Error(`could not set ${key} on ${env}: ${(r.stderr || r.stdout || 'no output').trim().split('\n')[0]}`); }
}

const restore = [];
const { browser, environment } = await launch(run);
run.browser = browser;
const results = baseResults(run, { ...environment, reducedMotion: mode.reducedMotion, themeMode: mode.themeMode, textScale: mode.textScale, sweep: mode.sweep, page: FIXTURE });
try {
  if (mode.themeMode) {
    const [key, value] = THEME_MODES[mode.themeMode];
    for (const side of ['before', 'after']) {
      const env = v[side].env, prev = themeSetting(env, key, value);
      restore.push(() => themeSetting(env, key, prev));
    }
  }
  for (const side of ['before', 'after']) {
    console.log(`running ${side} (${v[side].env}) ...`);
    results.sides[side] = await runSide(side);
  }
} finally {
  await browser.close();
  for (const undo of restore) { try { undo(); } catch (e) { console.error(`RESTORE FAILED: ${e.message}`); } }
}

// ---- Verdicts
const B = results.sides.before, A = results.sides.after;
const same = (x, y) => JSON.stringify(x) === JSON.stringify(y);
const yn = (x) => (x ? 'yes' : 'no');
const size = (c) => (c ? `${c.style.width} × ${c.style.height}` : 'not found');
const semanticsOf = (S) => Object.fromEntries(PROBED.map((n) => [n, S.controls[n]?.semantics]));
const diffNames = PROBED.filter((n) => !same(B.controls[n]?.semantics, A.controls[n]?.semantics));
const axeIds = (scan) => (scan.violations || []).flatMap((x) => x.nodes.map((n) => `${x.id}: ${n.target}`)).sort();
const focusShown = (c) => !!c && ((parseFloat(c.style.outline) > 0 && !/ none /.test(` ${c.style.outline} `)) || (c.style.boxShadow && c.style.boxShadow !== 'none'));
const boxLike = (c, ref) => !!c && !!ref && c.style.width === ref.style.width && c.style.height === ref.style.height;
const groupRef = (S) => S.controls['group[one]'];
const standaloneLikeGroup = (S) => STANDALONE.filter((n) => S.controls[n] && S.controls[n].visible).every((n) => boxLike(S.controls[n], groupRef(S)));
const unchangedBox = (n) => same(B.controls[n]?.style, A.controls[n]?.style);
const looksDifferent = (x, y) => !!x && !!y && ['border', 'backgroundColor', 'backgroundImage', 'boxShadow'].some((k) => x.style[k] !== y.style[k]);
const expectDark = run.scheme === 'dark' || mode.themeMode === 'dark';

const rows = [
  ['context', 'The fixture is served and rendered by Default Admin', `${B.status}, ${B.state.theme}`, `${A.status}, ${A.state.theme}`, B.status === 200 && A.status === 200 && B.state.theme === 'default_admin' && A.state.theme === 'default_admin'],
  ['context', 'The requested conditions are in effect (dark class / forced colours / reduced motion / high contrast class)', `${yn(B.state.darkModeClass)} / ${yn(B.state.media.forcedColors)} / ${yn(B.state.media.reducedMotion)} / ${yn(B.state.highContrastClass)}`, `${yn(A.state.darkModeClass)} / ${yn(A.state.media.forcedColors)} / ${yn(A.state.media.reducedMotion)} / ${yn(A.state.highContrastClass)}`, [B, A].every((S) => S.state.darkModeClass === expectDark && S.state.media.forcedColors === run.forced && S.state.media.reducedMotion === mode.reducedMotion && S.state.highContrastClass === (mode.themeMode === 'high-contrast'))],
  ['fix', 'form--checkbox-toggle.css is requested by the page', yn(B.css.toggleRequested), yn(A.css.toggleRequested), B.css.toggleRequested && !A.css.toggleRequested],
  ['fix', 'The automatic switch rule is present in a loaded stylesheet', yn(B.state.toggleRuleLoaded), yn(A.state.toggleRuleLoaded), B.state.toggleRuleLoaded && !A.state.toggleRuleLoaded],
  ['fix', 'Checkboxes on the fixture that are wider than they are tall (switch shape)', B.state.switchLike, A.state.switchLike, B.state.switchLike > 0 && A.state.switchLike === 0],
  ['fix', 'A standalone checkbox has the box of a checkbox in a group', `${size(B.controls.default_unchecked)} against ${size(groupRef(B))}`, `${size(A.controls.default_unchecked)} against ${size(groupRef(A))}`, !standaloneLikeGroup(B) && standaloneLikeGroup(A)],
  ['fix', 'The switch thumb (::before) is drawn on a standalone checkbox', B.controls.default_unchecked.pseudo.before.content, A.controls.default_unchecked.pseudo.before.content, B.controls.default_unchecked.pseudo.before.content !== 'none' && A.controls.default_unchecked.pseudo.before.content === 'none'],
  ['regression', 'No stylesheet request fails, and none is missing', `${B.css.requests} requested, ${B.css.failed.length} failed`, `${A.css.requests} requested, ${A.css.failed.length} failed`, B.css.failed.length === 0 && A.css.failed.length === 0 && A.css.requests === B.css.requests - 1],
  ['regression', 'Failed requests and console errors during the run', `${B.failedRequests.length} / ${B.consoleErrors.length}`, `${A.failedRequests.length} / ${A.consoleErrors.length}`, A.failedRequests.length <= B.failedRequests.length && A.consoleErrors.length <= B.consoleErrors.length],
  ['regression', 'JavaScript errors', B.jsErrors.length, A.jsErrors.length, A.jsErrors.length === 0 && B.jsErrors.length === 0],
  ['regression', 'Type, role, checked, disabled, required, indeterminate, label and description of every probed checkbox are the same', `${PROBED.length} controls`, diffNames.length ? `differs: ${diffNames.join(', ')}` : 'identical', diffNames.length === 0],
  ['regression', 'No checkbox carries a role attribute; no role="switch" on the page', `${B.state.roleSwitch} switch roles`, `${A.state.roleSwitch} switch roles`, [B, A].every((S) => S.state.roleSwitch === 0 && PROBED.every((n) => !S.controls[n] || S.controls[n].semantics.role === null))],
  ['regression', 'The browser accessibility snapshot of the form is the same', `${B.aria.split('\n').length} lines`, same(B.aria, A.aria) ? 'identical' : 'differs', same(B.aria, A.aria)],
  ['regression', 'The indeterminate example is exposed as indeterminate', yn(B.controls.indeterminate.semantics.indeterminate), yn(A.controls.indeterminate.semantics.indeterminate), B.controls.indeterminate.semantics.indeterminate && A.controls.indeterminate.semantics.indeterminate],
  ['regression', 'Tab reaches the first standalone checkbox', `${yn(B.keyboard.reached)} (${B.keyboard.tabsToFirst} presses)`, `${yn(A.keyboard.reached)} (${A.keyboard.tabsToFirst} presses)`, B.keyboard.reached && A.keyboard.reached && B.keyboard.tabsToFirst === A.keyboard.tabsToFirst],
  ['regression', 'Tab reaches every enabled checkbox and no disabled one, in the same order', B.keyboard.missed.length || B.keyboard.disabledReached.length ? `missed: ${B.keyboard.missed.join(', ') || 'none'}; disabled reached: ${B.keyboard.disabledReached.join(', ') || 'none'}` : `${B.keyboard.sequence.length} stops`, A.keyboard.missed.length || A.keyboard.disabledReached.length ? `missed: ${A.keyboard.missed.join(', ') || 'none'}; disabled reached: ${A.keyboard.disabledReached.join(', ') || 'none'}` : `${A.keyboard.sequence.length} stops`, [B, A].every((S) => S.keyboard.missed.length === 0 && S.keyboard.disabledReached.length === 0) && same(B.keyboard.order, A.keyboard.order)],
  ['regression', 'Space changes the focused checkbox, and changes it back', `${B.keyboard.afterSpace} then ${B.keyboard.afterSecondSpace}`, `${A.keyboard.afterSpace} then ${A.keyboard.afterSecondSpace}`, [B, A].every((S) => S.keyboard.afterSpace === true && S.keyboard.afterSecondSpace === false)],
  ['regression', 'The focused checkbox has a focus indicator (outline or box shadow), unchecked / checked', `${yn(focusShown(B.keyboard.focusUnchecked))} / ${yn(focusShown(B.keyboard.focusChecked))}`, `${yn(focusShown(A.keyboard.focusUnchecked))} / ${yn(focusShown(A.keyboard.focusChecked))}`, focusShown(A.keyboard.focusUnchecked) && focusShown(A.keyboard.focusChecked)],
  ['regression', 'The focused checkbox is in the viewport and nothing covers its centre', yn(B.keyboard.focusUnchecked?.focus.topElementIsControl), yn(A.keyboard.focusUnchecked?.focus.topElementIsControl), !!A.keyboard.focusUnchecked?.focus.topElementIsControl],
  ['regression', 'A change that is not saved is gone after a reload', `${B.pendingBeforeReload} then ${B.afterDiscard}`, `${A.pendingBeforeReload} then ${A.afterDiscard}`, [B, A].every((S) => S.pendingBeforeReload === true && S.afterDiscard === false)],
  ['regression', 'A real click on the label checks the checkbox', B.afterLabelClick, A.afterLabelClick, B.afterLabelClick === true && A.afterLabelClick === true],
  ['regression', 'Disabled checkboxes do not change on a real click (label of the unchecked one / the checked one itself)', `${B.disabledAfterLabelClick} / ${B.disabledCheckedAfterClick}`, `${A.disabledAfterLabelClick} / ${A.disabledCheckedAfterClick}`, [B, A].every((S) => S.disabledAfterLabelClick === false && S.disabledCheckedAfterClick === true)],
  ['regression', 'Activating a checkbox does not submit the form or navigate', `${B.navigationsFromActivation} navigations`, `${A.navigationsFromActivation} navigations`, B.navigationsFromActivation === 0 && A.navigationsFromActivation === 0],
  ['regression', 'Save configuration keeps the value, and it is still set after a reload', `${B.afterSave.checked} then ${B.afterSaveReload}`, `${A.afterSave.checked} then ${A.afterSaveReload}`, [B, A].every((S) => S.afterSave.checked === true && S.afterSaveReload === true)],
  ['regression', 'Reset puts the saved value back (the site is left as it was found)', B.afterReset, A.afterReset, B.afterReset === false && A.afterReset === false],
  ['regression', 'Both validation-error examples are marked invalid (error class and aria-invalid)', `${yn(/\berror\b/.test(B.errors.unchecked.classes))}/${B.errors.unchecked.semantics.ariaInvalid}, ${yn(/\berror\b/.test(B.errors.checked.classes))}/${B.errors.checked.semantics.ariaInvalid}`, `${yn(/\berror\b/.test(A.errors.unchecked.classes))}/${A.errors.unchecked.semantics.ariaInvalid}, ${yn(/\berror\b/.test(A.errors.checked.classes))}/${A.errors.checked.semantics.ariaInvalid}`, [B, A].every((S) => ['unchecked', 'checked'].every((k) => /\berror\b/.test(S.errors[k].classes) && S.errors[k].semantics.ariaInvalid === 'true'))],
  ['regression', '#states: the dependents are hidden, disabled and unchecked, then shown, enabled and checked', `${JSON.stringify(B.states.before)} then ${JSON.stringify(B.states.after)}`, `${JSON.stringify(A.states.before)} then ${JSON.stringify(A.states.after)}`, [B, A].every((S) => same(S.states.before, { visible: false, enabled: false, checked: false }) && same(S.states.after, { visible: true, enabled: true, checked: true }))],
  ['fix', 'The checkbox replaced by AJAX has the box of a checkbox in a group', size(B.ajaxReplace.after), size(A.ajaxReplace.after), !A.ajaxReplace.error && boxLike(A.ajaxReplace.after, groupRef(A))],
  ['fix', 'Checkboxes in a dialog have the box of a checkbox in a group', B.dialog.error || size(B.dialog.unchecked), A.dialog.error || size(A.dialog.unchecked), !A.dialog.error && boxLike(A.dialog.unchecked, groupRef(A)) && boxLike(A.dialog.checked, groupRef(A))],
  ['regression', 'Checkboxes in a group, in a table and the select-all box have the same computed presentation', `${size(groupRef(B))}; ${size(B.controls['table[r1]'])}; ${size(B.controls.select_all)}`, `${size(groupRef(A))}; ${size(A.controls['table[r1]'])}; ${size(A.controls.select_all)}`, ['group[one]', 'group[two]', 'group[three]', 'table[r1]', 'table[r2]', 'select_all'].every(unchangedBox)],
  ['regression', 'Radio buttons have the same computed presentation', size(B.controls.radio_a), size(A.controls.radio_a), unchangedBox('radio_a') && unchangedBox('radio_b')],
  ['regression', 'Label text contrast of the enabled checkboxes is at least 4.5:1 (lowest; default standalone; in a group)', `${Math.min(...ENABLED.map((n) => B.controls[n].contrast.label ?? 99))}; ${B.controls.default_unchecked.contrast.label}; ${groupRef(B).contrast.label}`, `${Math.min(...ENABLED.map((n) => A.controls[n].contrast.label ?? 99))}; ${A.controls.default_unchecked.contrast.label}; ${groupRef(A).contrast.label}`, ENABLED.every((n) => A.controls[n].contrast.label === null || A.controls[n].contrast.label >= 4.5)],
  ['observe', 'Contrast of the control edge against the background around it, unchecked / checked (WCAG 1.4.11 asks for 3:1); a group checkbox for reference', `${B.controls.default_unchecked.contrast.controlEdge} / ${B.controls.default_checked.contrast.controlEdge}; group ${groupRef(B).contrast.controlEdge}`, `${A.controls.default_unchecked.contrast.controlEdge} / ${A.controls.default_checked.contrast.controlEdge}; group ${groupRef(A).contrast.controlEdge}`, true],
  // Forced colours replace author border and fill colours, so there the difference is recorded, not judged.
  [run.forced ? 'observe' : 'regression', 'An invalid checkbox looks different from a valid one (border, fill or shadow), unchecked / checked', `${yn(looksDifferent(B.errors.unchecked, B.controls.default_unchecked))} / ${yn(looksDifferent(B.errors.checked, B.controls.default_checked))}`, `${yn(looksDifferent(A.errors.unchecked, A.controls.default_unchecked))} / ${yn(looksDifferent(A.errors.checked, A.controls.default_checked))}`, looksDifferent(A.errors.unchecked, A.controls.default_unchecked) && looksDifferent(A.errors.checked, A.controls.default_checked)],
  ['observe', 'The indeterminate example looks different from an unchecked one', yn(looksDifferent(B.controls.indeterminate, B.controls.default_unchecked) || !same(B.controls.indeterminate.pseudo, B.controls.default_unchecked.pseudo)), yn(looksDifferent(A.controls.indeterminate, A.controls.default_unchecked) || !same(A.controls.indeterminate.pseudo, A.controls.default_unchecked.pseudo)), true],
  ['regression', 'No label overlaps its control, including the long label', yn(!PROBED.some((n) => B.controls[n]?.visible && B.controls[n].labelOverlapsControl)), yn(!PROBED.some((n) => A.controls[n]?.visible && A.controls[n].labelOverlapsControl)), !PROBED.some((n) => A.controls[n]?.visible && A.controls[n].labelOverlapsControl)],
  ['regression', 'The control lines up with the first line of its label (centre offset, default / long label)', `${B.controls.default_unchecked.alignDeltaY}px / ${B.controls.long_label.alignDeltaY}px (${B.controls.long_label.labelLines} lines)`, `${A.controls.default_unchecked.alignDeltaY}px / ${A.controls.long_label.alignDeltaY}px (${A.controls.long_label.labelLines} lines)`, Math.abs(A.controls.default_unchecked.alignDeltaY) <= 4 && Math.abs(A.controls.long_label.alignDeltaY) <= 4],
  ['regression', 'Right to left: the page is rtl, the control is at the right of its label and the long label does not overlap it', `${B.rtl.state.dir}, ${B.rtl.unchecked.controlSide}, overlap ${yn(B.rtl.longLabel.labelOverlapsControl)}`, `${A.rtl.state.dir}, ${A.rtl.unchecked.controlSide}, overlap ${yn(A.rtl.longLabel.labelOverlapsControl)}`, A.rtl.status === 200 && A.rtl.state.dir === 'rtl' && A.rtl.unchecked.controlSide === 'right' && !A.rtl.longLabel.labelOverlapsControl && A.rtl.state.switchLike === 0],
  ['regression', 'The page does not scroll horizontally (left to right / right to left)', `${yn(!B.state.horizontalScroll)} / ${yn(!B.rtl.state.horizontalScroll)}`, `${yn(!A.state.horizontalScroll)} / ${yn(!A.rtl.state.horizontalScroll)}`, A.state.horizontalScroll === B.state.horizontalScroll && A.rtl.state.horizontalScroll === B.rtl.state.horizontalScroll],
  ['observe', 'Standalone checkbox size; smallest centre-to-centre distance to another control (WCAG 2.5.8 asks for 24 by 24, or 24 of spacing)', `${B.targets[0]?.w} × ${B.targets[0]?.h}; ${Math.min(...B.targets.map((t) => t.nearestCentre))}px`, `${A.targets[0]?.w} × ${A.targets[0]?.h}; ${Math.min(...A.targets.map((t) => t.nearestCentre))}px`, true],
  ['observe', 'Transition on the control or its thumb', `${B.controls.default_unchecked.style.transitionDuration} / ${B.controls.default_unchecked.pseudo.before.transitionDuration}`, `${A.controls.default_unchecked.style.transitionDuration} / ${A.controls.default_unchecked.pseudo.before.transitionDuration}`, true],
  ['observe', 'Stylesheet payload of the page: requests, decoded bytes, bytes on the wire', `${B.css.requests}, ${B.css.decodedBytes}, ${B.css.encodedBodyBytes}`, `${A.css.requests}, ${A.css.decodedBytes}, ${A.css.encodedBodyBytes}`, true],
  ['regression', 'axe findings on the fixture (rule: element) are the same or fewer', axeIds(B.axe).join('; ') || 'none', axeIds(A.axe).join('; ') || 'none', axeIds(A.axe).every((x) => axeIds(B.axe).includes(x))],
  ['regression', 'axe rules with findings while the validation errors show', JSON.stringify(B.errors.axe), JSON.stringify(A.errors.axe), Object.keys(A.errors.axe).every((k) => (B.errors.axe[k] || 0) >= A.errors.axe[k])],
];
if (mode.sweep) {
  const pb = B.realPages, pa = A.realPages;
  rows.push(
    ['context', 'Every real page in the variant answers 200 on both sides', pb.map((p) => p.status).join(' '), pa.map((p) => p.status).join(' '), [...pb, ...pa].every((p) => p.status === 200)],
    ['fix', 'Switch-shaped checkboxes on the real pages (total)', pb.reduce((n, p) => n + (p.switchLike || 0), 0), pa.reduce((n, p) => n + (p.switchLike || 0), 0), pb.some((p) => p.switchLike > 0) && pa.every((p) => p.switchLike === 0)],
    ['regression', 'The number of checkboxes on each real page is the same', pb.map((p) => p.checkboxes).join(' '), pa.map((p) => p.checkboxes).join(' '), same(pb.map((p) => p.checkboxes), pa.map((p) => p.checkboxes))],
    ['regression', 'axe rules with findings on each real page are the same or fewer', pb.map((p) => Object.keys(p.axe || {}).length).join(' '), pa.map((p) => Object.keys(p.axe || {}).length).join(' '), pa.every((p, i) => Object.keys(p.axe || {}).every((k) => (pb[i].axe?.[k] || 0) >= p.axe[k]))],
    ['regression', '/admin/content: select all checks every row; unchecking one row clears select all', `${B.bulk.allCheckedAfterSelectAll}; ${JSON.stringify(B.bulk.selectAllAfterOneUnchecked)}`, `${A.bulk.allCheckedAfterSelectAll}; ${JSON.stringify(A.bulk.selectAllAfterOneUnchecked)}`, !A.bulk.error && A.bulk.allCheckedAfterSelectAll === true && same(B.bulk.selectAllAfterOneUnchecked, A.bulk.selectAllAfterOneUnchecked) && same(B.bulk.rowBox?.style, A.bulk.rowBox?.style)],
    ['regression', `Real form ${B.realForm.path} ("${B.realForm.label}"): discarded on reload, kept after Save, then restored`, B.realForm.error || `${B.realForm.initial} → ${B.realForm.afterDiscard} → ${B.realForm.afterSaveReload} → ${B.realForm.restored}`, A.realForm.error || `${A.realForm.initial} → ${A.realForm.afterDiscard} → ${A.realForm.afterSaveReload} → ${A.realForm.restored}`, [B, A].every((S) => !S.realForm.error && S.realForm.afterDiscard === S.realForm.initial && S.realForm.afterSaveReload === !S.realForm.initial && S.realForm.restored === S.realForm.initial)],
    ['fix', 'The real setting has the box of a conventional checkbox', size(B.realForm.control), size(A.realForm.control), !!A.realForm.control && A.realForm.control.style.width === groupRef(A).style.width && B.realForm.control?.style.width !== A.realForm.control.style.width],
    ['fix', 'Views UI: switch-shaped checkboxes on the settings form / in the Add filter criteria dialog', B.views.error || `${B.views.settings.switchLike} / ${B.views.dialog.switchLike} of ${B.views.dialog.checkboxes}`, A.views.error || `${A.views.settings.switchLike} / ${A.views.dialog.switchLike} of ${A.views.dialog.checkboxes}`, !A.views.error && A.views.settings.switchLike === 0 && A.views.dialog.switchLike === 0],
  );
}

let unexpected = 0;
const conditions = [`${environment.browser} ${environment.browserVersion}`, `${environment.colorScheme} colour scheme`, environment.forcedColors ? 'forced colours (emulated)' : null, `${run.viewport.width}x${run.viewport.height}`, mode.reducedMotion ? 'reduced motion' : null, mode.themeMode ? `Default Admin theme setting: ${mode.themeMode}` : null, mode.textScale !== 1 ? `root font size ${mode.textScale * 100}%` : null, environment.os].filter(Boolean).join(', ');
let md = `# Playwright evidence: #${v.issue} (${v.slug})\n\nRun ${results.when}. Core Before \`${results.commits.before}\`, After \`${results.commits.after}\` plus \`${(results.patches[0] || 'none').split('/').pop()}\`. ${conditions}.\n\nThe page is the lab fixture \`${FIXTURE}\` (real Form API elements rendered by Default Admin)${mode.sweep ? ', followed by the real administration pages listed in the variant' : ''}. Keyboard and pointer input is Playwright's trusted input, not script-generated events. axe covers WCAG 2.0 to 2.2 A and AA rules and does not establish conformance.\n\n| Type | Check | Before | After | Verdict |\n|---|---|---|---|---|\n`;
for (const [type, label, left, right, good] of rows) {
  const judged = type !== 'observe';
  if (judged && !good) unexpected++;
  md += `| ${type} | ${label} | ${String(left).replace(/\|/g, '\\|')} | ${String(right).replace(/\|/g, '\\|')} | ${judged ? (good ? 'as expected' : '**NOT as expected**') : 'recorded'} |\n`;
}

const styleKeys = ['appearance', 'width', 'height', 'borderRadius', 'border', 'backgroundColor', 'backgroundImage', 'boxShadow', 'outline', 'clipPath', 'float', 'marginInlineStart', 'itemMarginInlineStart', 'labelPaddingInlineStart', 'labelColor', 'transitionDuration'];
const styleTable = (title, b, a) => {
  let t = `\n### ${title}\n\n| Property | Before | After |\n|---|---|---|\n`;
  for (const k of styleKeys) t += `| ${k} | ${b?.style?.[k] ?? b?.[k] ?? ''} | ${a?.style?.[k] ?? a?.[k] ?? ''} |\n`;
  if (b?.pseudo) t += `| ::before content, size, transform | ${b.pseudo.before.content}, ${b.pseudo.before.width} × ${b.pseudo.before.height}, ${b.pseudo.before.transform} | ${a.pseudo.before.content}, ${a.pseudo.before.width} × ${a.pseudo.before.height}, ${a.pseudo.before.transform} |\n| ::after content, mask | ${b.pseudo.after.content}, ${b.pseudo.after.maskImage} | ${a.pseudo.after.content}, ${a.pseudo.after.maskImage} |\n`;
  return t;
};
md += `\n## Computed presentation\n`;
md += styleTable('Standalone checkbox, unchecked', B.controls.default_unchecked, A.controls.default_unchecked);
md += styleTable('Standalone checkbox, checked', B.controls.default_checked, A.controls.default_checked);
md += styleTable('Standalone checkbox, unchecked, pointer over it', B.hover.unchecked, A.hover.unchecked);
md += styleTable('Standalone checkbox, unchecked, keyboard focus', B.keyboard.focusUnchecked, A.keyboard.focusUnchecked);
md += styleTable('Standalone checkbox, disabled and checked', B.controls.disabled_checked, A.controls.disabled_checked);
md += styleTable('Validation error, checked', B.errors.checked, A.errors.checked);
md += styleTable('Reference: checkbox in a group (not a switch on either side)', groupRef(B), groupRef(A));

if (Array.isArray(B.rules.unchecked)) {
  md += `\n## Which rules give the control its box (Chromium)\n\nRules that set the size, radius, appearance, colours or outline of the unchecked standalone checkbox, in cascade order.\n`;
  for (const [name, S] of [['Before', B], ['After', A]]) {
    md += `\n**${name}**\n\n`;
    for (const r of S.rules.unchecked) md += `- \`${r.file.split('/').pop()}\` \`${r.selector.replace(/`/g, '')}\`: ${r.props.join('; ')}\n`;
  }
}

md += `\n## Target size\n\nSize of each enabled standalone checkbox, the height of its label (a click on the label also activates it) and the distance from its centre to the centre of the nearest other checkbox or radio. A person has to judge WCAG 2.5.8: the 24 by 24 pixel minimum has a spacing exception.\n\n| Control | Before box | Before label height | Before nearest centre | After box | After label height | After nearest centre |\n|---|---|---|---|---|---|---|\n`;
for (const t of A.targets) { const b = B.targets.find((x) => x.name === t.name) || {}; md += `| ${t.name} | ${b.w} × ${b.h} | ${b.labelH} | ${b.nearestCentre} | ${t.w} × ${t.h} | ${t.labelH} | ${t.nearestCentre} |\n`; }

md += `\n## Keyboard order\n\nTab stops after the first standalone checkbox, to Save configuration. Before: ${B.keyboard.order.join(', ')}.\n\nAfter: ${same(B.keyboard.order, A.keyboard.order) ? 'the same.' : A.keyboard.order.join(', ')}\n`;

if (mode.sweep) {
  md += `\n## Real administration pages\n\n| Page | Status B / A | Checkboxes B / A | Switch-shaped B / A | role=switch B / A | axe rules with findings B / A |\n|---|---|---|---|---|---|\n`;
  B.realPages.forEach((p, i) => { const a = A.realPages[i]; md += `| \`${p.path}\` | ${p.status} / ${a.status} | ${p.checkboxes} / ${a.checkboxes} | ${p.switchLike} / ${a.switchLike} | ${p.roleSwitch} / ${a.roleSwitch} | ${Object.keys(p.axe || {}).join(', ') || 'none'} / ${Object.keys(a.axe || {}).join(', ') || 'none'} |\n`; });
  md += `\nSwitch-shaped settings Before: ${B.realPages.filter((p) => p.switchLike).map((p) => `\`${p.path}\` (${p.switchLikeLabels.join('; ')})`).join('; ') || 'none'}.\n`;
}

md += `\n## Stylesheets\n\n| | Before | After |\n|---|---|---|\n| Stylesheet requests (uncached load of the fixture) | ${B.css.requests} | ${A.css.requests} |\n| Decoded bytes | ${B.css.decodedBytes} | ${A.css.decodedBytes} |\n| Body bytes on the wire | ${B.css.encodedBodyBytes} | ${A.css.encodedBodyBytes} |\n| form--checkbox-toggle.css | ${B.css.toggle ? `${B.css.toggle.status}, ${B.css.toggle.decodedBytes} bytes decoded, ${B.css.toggle.encodedBodyBytes} on the wire` : 'not requested'} | ${A.css.toggle ? `${A.css.toggle.status}, ${A.css.toggle.decodedBytes} bytes` : 'not requested'} |\n| Failed stylesheet requests | ${B.css.failed.length} | ${A.css.failed.length} |\n`;
if (B.metricsAfterInteractions && !B.metricsAfterInteractions.error && B.metricsAfterInteractions.TaskDuration > 0) md += `| Chromium main-thread time from opening the side to the end of the fixture steps: task / style recalculation / layout (seconds, one sample) | ${B.metricsAfterInteractions.TaskDuration} / ${B.metricsAfterInteractions.RecalcStyleDuration} / ${B.metricsAfterInteractions.LayoutDuration} | ${A.metricsAfterInteractions.TaskDuration} / ${A.metricsAfterInteractions.RecalcStyleDuration} / ${A.metricsAfterInteractions.LayoutDuration} |\n`;
md += `| Duration of this side of the run (ms) | ${B.durationMs} | ${A.durationMs} |\n\nCSS aggregation is off on these development sites, so each stylesheet is its own request; a production site aggregates them. The timings are one sample each and are not a benchmark.\n`;

md += `\n## Browser accessibility snapshot of the form (After${same(B.aria, A.aria) ? '; Before is identical' : ''})\n\n\`\`\`yaml\n${A.aria.trim()}\n\`\`\`\n`;
if (!same(B.aria, A.aria)) md += `\n### Before\n\n\`\`\`yaml\n${B.aria.trim()}\n\`\`\`\n`;
md += '\n' + contextMarkdown(results) + ajaxMarkdown(results) + speechMarkdown(results);
md += `## Images\n\nFor each side (\`before-\`, \`after-\`): \`fixture.png\` (whole form), \`standalone.png\`, \`group.png\`, \`table.png\`, \`errors.png\`, \`states.png\`, \`ajax.png\`, \`dialog.png\`, \`rtl-standalone.png\`, and one crop per state: \`state-default-\`, \`state-hover-\`, \`state-focus-\`, \`state-disabled-\`, \`state-error-\` each with \`unchecked\` and \`checked\`, plus \`state-indeterminate.png\`.${mode.sweep ? ' The real pages are `page-*.png` (viewport only), `bulk-selection.png`, `real-setting.png` and `views-dialog.png`.' : ''}\n\n`;
md += `## Limits of this run\n\nForced colours, the colour scheme and reduced motion are browser emulation, not an operating-system setting: emulated forced colours do not replace a test with a Windows contrast theme. A narrow viewport stands in for browser zoom (640 CSS pixels wide is 1280 at 200%, 320 is 1280 at 400%) and is not the same as a person zooming. ${mode.textScale !== 1 ? 'The larger text size is a root font-size override, an approximation of a larger default font size. ' : ''}Whether a focus indicator or a check mark is easy to see is a judgement for a person; the script records that an indicator exists and takes the image. No screen reader was run.\n\n`;
md += unexpected === 0
  ? '**Every judged row is as expected.** After the change the standalone checkboxes have the presentation of the existing checkbox, and their semantics, keyboard and pointer behaviour and saving are the same as before.\n'
  : `**${unexpected} judged row(s) were not as expected.** Read the table before drawing a conclusion.\n`;
md += '\n---\nAutomated evidence is a DRAFT: DOM, CSS, screenshots and axe do not replace visual and assistive-technology testing by a person.\n';

results.verdict = unexpected === 0 ? 'reproduced-and-fixed' : 'mixed';
results.unexpected = unexpected;
results.rows = rows.map(([type, label, before, after, good]) => ({ type, label, before, after, asExpected: type === 'observe' ? null : !!good }));
results.semantics = { before: semanticsOf(B), after: semanticsOf(A) };
const where = writeRun(run, results, md);
console.log(`\n${results.verdict} (${unexpected} judged row(s) not as expected): ${where}/SUMMARY.md`);
process.exit(unexpected === 0 ? 0 : 2);
