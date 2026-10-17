// The #3619154 scenario (Default Admin meta sidebar on the node edit form), used by evaluate-3619154.mjs.
// Kept apart from the lab wrapper so the same steps and checks can be replayed against any two logged-in pages.
// Real input only (Playwright clicks, key presses and mouse drags); focus is placed with locator.focus() before a key press.
// Each sub-scenario clears the sidebar and Navigation keys in localStorage first, so one side's earlier steps do not leak in.
//
// What it records, per side:
//   desktop  1280px: the toggle and close controls; mouse, Enter, Space and Alt+S on the toggle; drag the resize handle and
//            reload (width kept?); close, reload (stays closed? any frame with the sidebar on screen = flash); open, reload.
//   nav      1100px (between 1024 and 1280, where opening the sidebar collapses Navigation): with the sidebar open, expand
//            Navigation, then open and close the Image details in the main column (does Navigation collapse?).
//   narrow   800px (or the --viewport width when below 1024px): first visit (flash?), open with Enter (where focus goes, what
//            is inert), 20 Tabs (does focus reach the covered page?), Escape, overlay click, close button.
//   widths   960px and 1000px: is the resize handle shown; does the sidebar start below the top bar.
// Frames: from document start, every animation frame for 3 s records how much of the sidebar is inside the viewport.

export const SEL = {
  toggle: '.meta-sidebar__trigger',
  close: '.meta-sidebar__close',
  overlay: '.meta-sidebar__overlay',
  handle: '#sidebar-draggable',
  navExpand: '.admin-toolbar__expand-button',
  imageDetails: 'details:not(#default_admin_sidebar details) > summary',
};
const EDIT = '/node/1/edit';

// Runs in every page before its own scripts (added once per context).
const FRAMES = () => {
  const frames = [];
  Object.defineProperty(window, '__sidebarFrames', { value: frames });
  const t0 = performance.now();
  const tick = () => {
    const sb = document.getElementById('default_admin_sidebar');
    if (sb) {
      const r = sb.getBoundingClientRect();
      const w = Math.max(0, Math.min(r.right, innerWidth) - Math.max(r.left, 0));
      frames.push({ t: Math.round(performance.now()), w: Math.round(w), top: Math.round(r.top), state: document.documentElement.getAttribute('data-meta-sidebar') || document.body?.getAttribute('data-meta-sidebar') || null });
    }
    if (performance.now() - t0 < 3000) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
};

// Serialised into the page: the controls, the sidebar, focus, inert, Navigation and the bars above the sidebar.
const STATE = (sel) => {
  const t = document.querySelector(sel.toggle);
  const c = document.querySelector(sel.close);
  const sb = document.getElementById(t?.getAttribute('aria-controls') || 'default_admin_sidebar') || document.getElementById('default_admin_sidebar');
  const rect = (el) => (el ? el.getBoundingClientRect() : null);
  const onScreen = (el) => {
    if (!el || !el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })) return 0;
    const r = el.getBoundingClientRect();
    const h = Math.max(0, Math.min(r.bottom, innerHeight) - Math.max(r.top, 0));
    return h > 0 ? Math.round(Math.max(0, Math.min(r.right, innerWidth) - Math.max(r.left, 0))) : 0;
  };
  const desc = (el) => (el ? {
    tag: el.tagName.toLowerCase(), type: el.getAttribute('type'), role: el.getAttribute('role'), href: el.getAttribute('href'),
    ariaControls: el.getAttribute('aria-controls'), ariaExpanded: el.getAttribute('aria-expanded'), title: el.getAttribute('title'),
    text: el.textContent.replace(/\s+/g, ' ').trim(), inert: !!el.closest('[inert]'), visible: el.checkVisibility(),
  } : null);
  const a = document.activeElement;
  const where = (el) => {
    if (!el || el === document.body || el === document.documentElement) return 'body';
    if (el === t) return 'toggle';
    if (el === c) return 'close';
    if (sb && sb.contains(el)) return 'sidebar';
    if (el.closest('#admin-toolbar, .admin-toolbar, .admin-toolbar-control-bar')) return 'navigation';
    if (el.closest('.admin--navigation-top-bar')) return 'top-bar';
    if (el.closest(sel.overlay)) return 'overlay';
    if (el.closest('.dialog-off-canvas-main-canvas')) return 'covered';
    return 'other';
  };
  const label = (el) => (el ? `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}${typeof el.className === 'string' && el.className.trim() ? '.' + el.className.trim().split(/\s+/)[0] : ''}` : null);
  const focusables = sb ? [...sb.querySelectorAll('a[href], button, input, select, textarea, summary, [tabindex]:not([tabindex="-1"])')].filter((e) => e.checkVisibility() && !e.disabled) : [];
  const bars = ['.admin--navigation-top-bar', '.admin-toolbar-control-bar'].map((s) => rect(document.querySelector(s))).filter((r) => r && r.height > 0);
  const title = document.querySelector('[name="title[0][value]"]');
  const handle = document.querySelector(sel.handle);
  return {
    toggle: desc(t), close: desc(c),
    sidebar: sb ? { id: sb.id, shownWidth: onScreen(sb), width: Math.round(parseFloat(getComputedStyle(sb).width)), top: Math.round(rect(sb).top), position: getComputedStyle(sb).position } : null,
    dataMetaSidebar: { html: document.documentElement.getAttribute('data-meta-sidebar'), body: document.body.getAttribute('data-meta-sidebar') },
    active: { where: where(a), label: label(a) },
    firstFocusableInSidebar: label(focusables[0]),
    inertCount: document.querySelectorAll('[inert]').length,
    titleFieldInert: title ? !!title.closest('[inert]') : null,
    overlayShown: onScreen(document.querySelector(sel.overlay)) > 0,
    handleShown: !!handle && handle.checkVisibility() && handle.getBoundingClientRect().width > 0,
    barBottom: bars.length ? Math.round(Math.max(...bars.map((r) => r.bottom))) : null,
    navigation: document.documentElement.getAttribute('data-admin-toolbar'),
    htmlHeight: Math.round(document.documentElement.getBoundingClientRect().height),
    storage: Object.fromEntries(Object.entries(localStorage).filter(([k]) => /^Drupal\.(defaultAdmin|navigation)\./.test(k))),
    url: location.pathname,
  };
};

// Set the viewport, let the old page's resize handlers run (Before writes localStorage from a ResizeObserver), then clear the
// sidebar and Navigation keys and set any given ones, so the next load starts from a known state.
async function fresh(page, width, set = {}) {
  await page.setViewportSize({ width, height: 900 });
  await page.waitForTimeout(300);
  await page.evaluate((set) => { for (const k of Object.keys(localStorage)) if (/^Drupal\.(defaultAdmin|navigation|gin)\./.test(k)) localStorage.removeItem(k); for (const [k, v] of Object.entries(set)) localStorage.setItem(k, v); }, set);
}

// Wait until the sidebar has stopped moving (transitions), at most 2 s.
async function settle(page) {
  let last = null, same = 0;
  for (let i = 0; i < 40 && same < 3; i++) {
    await page.waitForTimeout(50);
    const now = await page.evaluate(() => { const r = document.getElementById('default_admin_sidebar')?.getBoundingClientRect(); return r ? `${Math.round(r.left)},${Math.round(r.width)},${Math.round(r.top)}` : ''; });
    same = now === last ? same + 1 : 0; last = now;
  }
}

async function load(page, base) {
  await page.goto(base + EDIT, { waitUntil: 'load' });
  // A revision that renames the toggle would otherwise fail later as an unrelated timeout.
  await page.locator(SEL.toggle).first().waitFor({ state: 'attached', timeout: 20000 }).catch(() => {
    throw new Error(`No ${SEL.toggle} on ${EDIT} at ${base}. Check the recipe ran (Default Admin as admin theme, node 1 exists); if the change under test renamed the toggle, update SEL in tools/playwright/sidebar-3619154.mjs.`);
  });
  await page.waitForTimeout(400);                                    // behaviours attach and ResizeObservers fire
  await settle(page);
  const frames = await page.evaluate(async () => { await new Promise((r) => setTimeout(r, Math.max(0, 3100 - performance.now()))); return window.__sidebarFrames.slice(); });
  return summariseFrames(frames);
}

// Frames from document start: was the sidebar ever on screen, and did its top move once painted.
const summariseFrames = (frames) => {
  const painted = frames.filter((f) => f.w > 1);
  const tops = painted.map((f) => f.top);
  return { count: frames.length, everShown: painted.length > 0, shownFrames: painted.length, maxShownWidth: painted.length ? Math.max(...painted.map((f) => f.w)) : 0, firstShownAt: painted[0]?.t ?? null, topRange: tops.length ? [Math.min(...tops), Math.max(...tops)] : null, states: [...new Set(frames.map((f) => f.state))] };
};

export async function replaySide(page, base, { out, side, axe, path, narrow = 800 } = {}) {
  const S = { narrowWidth: narrow };
  const state = async (extra = {}) => ({ ...(await page.evaluate(STATE, SEL)), ...extra });
  const aria = async () => (await page.locator(SEL.toggle).first().ariaSnapshot().catch(() => null));
  const shot = async (name) => { if (out && path) await page.screenshot({ path: path.join(out, `${side}-${name}.png`) }); };
  const toggle = page.locator(SEL.toggle).first();
  // A real click that cannot crash the run: what is on top at the control's centre is recorded first, so a control covered by
  // another element (Before: the close button under the top bar below 1024px) is a result, not a timeout.
  const click = async (loc) => {
    const coveredBy = await loc.evaluate((el) => { const r = el.getBoundingClientRect(); const e = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); if (!e || el === e || el.contains(e)) return null; const region = e.closest('[aria-label]')?.getAttribute('aria-label'); return `${e.tagName.toLowerCase()}${typeof e.className === 'string' && e.className.trim() ? '.' + e.className.trim().split(/\s+/)[0] : ''}${region ? ` in "${region}"` : ''}`; }).catch(() => 'not found');
    try { await loc.click({ timeout: 3000 }); await settle(page); return { ok: true, coveredBy }; } catch (e) { return { ok: false, coveredBy, error: e.message.split('\n')[0] }; }
  };
  // Press a key on the focused toggle; record the state, and press again to undo if it changed anything.
  const keyOnToggle = async (key) => {
    await toggle.focus();
    const before = await state();
    await page.keyboard.press(key); await settle(page);
    const after = await state({ aria: await aria() });
    const changed = after.toggle?.ariaExpanded !== before.toggle?.ariaExpanded || (after.sidebar?.shownWidth > 1) !== (before.sidebar?.shownWidth > 1);
    if (changed) { await toggle.focus(); await page.keyboard.press(key); await settle(page); }
    return { before, after, changed, restored: await state() };
  };
  await page.context().addInitScript(FRAMES);

  // ---- desktop, 1280px
  await page.goto(base + EDIT);
  await fresh(page, 1280);
  const d = S.desktop = {};
  d.loadFrames = await load(page, base);
  d.initial = await state({ aria: await aria(), closeAria: await page.locator(SEL.close).first().ariaSnapshot().catch(() => null) });
  await shot('desktop-initial');
  if (axe) d.axeOpen = await axe(page);
  await toggle.click(); await settle(page);
  d.click1 = await state({ aria: await aria() });
  await toggle.click(); await settle(page);
  d.click2 = await state({ aria: await aria() });
  d.enter = await keyOnToggle('Enter');
  d.space = await keyOnToggle('Space');
  await page.evaluate(() => document.activeElement?.blur());
  { const before = await state(); await page.keyboard.press('Alt+s'); await settle(page); const after = await state(); d.altS = { before, after, changed: (after.sidebar?.shownWidth > 1) !== (before.sidebar?.shownWidth > 1) }; if (d.altS.changed) { await page.keyboard.press('Alt+s'); await settle(page); } }
  if (!((await state()).sidebar?.shownWidth > 1)) { await toggle.click(); await settle(page); }
  // Drag the handle 120px outward (left in LTR), then reload.
  const handle = page.locator(SEL.handle).first();
  const box = await handle.boundingBox().catch(() => null);
  d.width = { start: (await state()).sidebar?.width, handleBox: box };
  if (box && box.width > 0) {
    const x = box.x + box.width / 2, y = box.y + Math.min(box.height / 2, 200);
    await page.mouse.move(x, y); await page.mouse.down(); await page.mouse.move(x - 120, y, { steps: 12 }); await page.mouse.up(); await settle(page);
    d.width.dragged = (await state()).sidebar?.width;
    d.width.reloadFrames = await load(page, base);
    d.width.afterReload = (await state()).sidebar?.width;
  }
  // Close, reload: stays closed, no frame with the sidebar on screen.
  await toggle.click(); await settle(page);
  d.closed = await state({ aria: await aria() });
  d.closedReloadFrames = await load(page, base);
  d.closedAfterReload = await state({ aria: await aria() });
  await shot('desktop-closed-reloaded');
  if (axe) d.axeClosed = await axe(page);
  // Open, reload: stays open.
  await toggle.click(); await settle(page);
  d.openReloadFrames = await load(page, base);
  d.openAfterReload = await state();

  // ---- Navigation and a details element, 1100px
  // A returning user with both stored open (the defaults after a first visit).
  await fresh(page, 1100, { 'Drupal.defaultAdmin.sidebarExpanded.desktop': 'true', 'Drupal.navigation.sidebarExpanded': 'true' });
  const n = S.nav = {};
  n.loadFrames = await load(page, base);
  n.initial = await state();
  await shot('nav-initial');
  // Precondition: the meta sidebar open and Navigation expanded at the same time. Below 1280px each one closes the other when
  // opened by a click (sidebar.js / sidebar-toggle.js, and Default Admin's navigation.js on both sides), so only a page load from
  // stored state can give both; when it does not, F11 is not applicable on that side.
  if (!shown(n.initial)) { await toggle.click(); await settle(page); }
  const expand = page.locator(SEL.navExpand).first();
  if ((await state()).navigation !== 'expanded' && await expand.isVisible().catch(() => false)) { await expand.click(); await page.waitForTimeout(600); }
  n.navExpanded = await state();
  const summary = page.locator(SEL.imageDetails).first();
  if (await summary.count()) {
    await summary.click(); await page.waitForTimeout(800);
    n.afterDetails1 = await state();
    await summary.click(); await page.waitForTimeout(800);
    n.afterDetails2 = await state();
  }
  await shot('nav-after-details');

  // ---- narrow, 800px (or the run's own width when that is below 1024px)
  await fresh(page, narrow);
  const m = S.narrow = {};
  m.firstVisitFrames = await load(page, base);
  m.initial = await state({ aria: await aria() });
  await toggle.focus(); await page.keyboard.press('Enter'); await settle(page);
  m.opened = await state({ aria: await aria() });
  await shot('narrow-open');
  if (axe) m.axeOpen = await axe(page);
  m.tabs = [];
  for (let i = 0; i < 20; i++) { await page.keyboard.press('Tab'); m.tabs.push((await state()).active); }
  await page.keyboard.press('Escape'); await settle(page);
  m.escape = await state({ aria: await aria() });
  await shot('narrow-escape');
  // Mouse: open, close with the overlay; open, close with the close button.
  if (!((await state()).sidebar?.shownWidth > 1)) { await toggle.click(); await settle(page); }
  m.reopened = await state();
  const point = await page.evaluate((sel) => { const sb = document.getElementById('default_admin_sidebar'); const r = sb?.getBoundingClientRect(); if (!r) return null; const y = Math.round(innerHeight * 0.6); for (let x = 5; x < Math.max(10, r.left - 5); x += 10) { const e = document.elementFromPoint(x, y); if (e && e.closest(sel.overlay)) return { x, y }; } return null; }, SEL);
  m.overlayPoint = point;
  if (point) { await page.mouse.click(point.x, point.y); await settle(page); }
  m.overlayClick = await state();
  if (!((await state()).sidebar?.shownWidth > 1)) { await toggle.click(); await settle(page); }
  m.closeClickResult = await click(page.locator(SEL.close).first());
  m.closeClick = await state();
  if (shown(m.closeClick)) { await toggle.click(); await settle(page); }
  m.reloadFrames = await load(page, base);
  m.afterReload = await state();

  // ---- resize handle and top alignment, 960px and 1000px (sidebar opened)
  S.widths = {};
  for (const w of [960, 1000]) {
    await fresh(page, w);
    const frames = await load(page, base);
    if (!((await state()).sidebar?.shownWidth > 1)) { await toggle.click(); await settle(page); }
    S.widths[w] = { frames, open: await state() };
    await shot(`width-${w}-open`);
  }
  return S;
}

// ---- checks: [id, kind, label, value(side) -> true | false | null (not applicable)]
// fix: expected false Before and true After. regression: expected true After (Before shown for comparison).
// observe: a value recorded for a person to judge; no pass or fail.
const shown = (s) => (s?.sidebar?.shownWidth ?? 0) > 1;
const tracks = (s) => s?.toggle?.ariaExpanded === String(shown(s));
export const CHECKS = [
  ['F1', 'fix', 'The toggle is a native `<button>`', (S) => S.desktop.initial.toggle ? S.desktop.initial.toggle.tag === 'button' : null],
  ['F2', 'fix', 'Space on the focused toggle opens or closes the sidebar', (S) => S.desktop.initial.toggle ? S.desktop.space.changed : null],
  ['F3', 'fix', 'The close control is a native `<button>`', (S) => S.desktop.initial.close ? S.desktop.initial.close.tag === 'button' : null],
  // The close button is hidden at 1024px and wider on both sides, so focus order is read with the sidebar open at 800px.
  ['F4', 'fix', 'Below 1024px, the close button is the first focusable element in the open sidebar', (S) => shown(S.narrow.opened) && S.narrow.opened.firstFocusableInSidebar ? /\.meta-sidebar__close$/.test(S.narrow.opened.firstFocusableInSidebar) : null],
  ['F5', 'fix', 'Below 1024px, opening with Enter moves focus into the sidebar', (S) => shown(S.narrow.opened) ? ['close', 'sidebar'].includes(S.narrow.opened.active.where) : null],
  ['F6', 'fix', 'Below 1024px, the page under the overlay is inert while the sidebar is open', (S) => shown(S.narrow.opened) ? S.narrow.opened.titleFieldInert === true : null],
  ['F7', 'fix', 'Below 1024px, 20 Tabs from the open sidebar never reach the covered page', (S) => shown(S.narrow.opened) ? !S.narrow.tabs.some((t) => t.where === 'covered') : null],
  ['F8', 'fix', 'Below 1024px, Escape closes the sidebar and returns focus to the toggle', (S) => shown(S.narrow.opened) ? !shown(S.narrow.escape) && S.narrow.escape.active.where === 'toggle' : null],
  ['F9', 'fix', 'First visit below 1024px: the sidebar is never painted on screen while the page loads', (S) => S.narrow.firstVisitFrames.count ? !S.narrow.firstVisitFrames.everShown : null],
  ['F11', 'fix', '1100px, sidebar open and Navigation expanded: opening and closing a details element does not collapse Navigation', (S) => shown(S.nav.navExpanded) && S.nav.navExpanded.navigation === 'expanded' && S.nav.afterDetails1 ? S.nav.afterDetails1.navigation === 'expanded' && S.nav.afterDetails2.navigation === 'expanded' : null],
  ['F12', 'fix', '1000px: the open sidebar starts at or below the bottom of the bars above it (no overlap)', (S) => shown(S.widths[1000].open) && S.widths[1000].open.barBottom != null ? S.widths[1000].open.sidebar.top >= S.widths[1000].open.barBottom - 1 : null],
  ['R1', 'regression', 'Mouse click on the toggle closes and reopens the sidebar', (S) => shown(S.desktop.initial) && !shown(S.desktop.click1) && shown(S.desktop.click2)],
  ['R2', 'regression', 'Enter on the focused toggle opens or closes the sidebar', (S) => S.desktop.enter.changed],
  ['R3', 'regression', 'aria-expanded on the toggle matches the sidebar after every desktop action', (S) => [S.desktop.initial, S.desktop.click1, S.desktop.click2, S.desktop.enter.after, S.desktop.space.after, S.desktop.closed, S.desktop.closedAfterReload, S.desktop.openAfterReload].every(tracks)],
  ['R4', 'regression', 'Desktop: a closed sidebar stays closed after reload', (S) => !shown(S.desktop.closedAfterReload)],
  ['R5', 'regression', 'Desktop: an open sidebar stays open after reload', (S) => shown(S.desktop.openAfterReload)],
  ['R6', 'regression', 'Desktop: dragging the handle changes the width, and the width is kept after reload', (S) => S.desktop.width.dragged != null ? S.desktop.width.dragged !== S.desktop.width.start && S.desktop.width.afterReload === S.desktop.width.dragged : null],
  ['R7', 'regression', 'Below 1024px: a click on the overlay closes the sidebar', (S) => shown(S.narrow.reopened) && S.narrow.overlayPoint ? !shown(S.narrow.overlayClick) : null],
  ['R8', 'regression', 'Below 1024px: the close button closes the sidebar', (S) => !shown(S.narrow.closeClick)],
  ['R9', 'regression', 'Below 1024px: the sidebar is closed on load, and after reload', (S) => !shown(S.narrow.initial) && !shown(S.narrow.afterReload)],
  // The page has inert elements of its own (14 on both sides at the pinned core), so compare with the count before opening.
  ['R10', 'regression', 'Below 1024px: after closing, nothing more is inert than before opening', (S) => S.narrow.escape.inertCount === S.narrow.initial.inertCount && S.narrow.closeClick.inertCount === S.narrow.initial.inertCount && S.narrow.escape.titleFieldInert === false],
  ['R11', 'regression', 'Desktop, closed then reloaded: the sidebar is never painted on screen while the page loads', (S) => S.desktop.closedReloadFrames.count ? !S.desktop.closedReloadFrames.everShown : null],
  ['O1', 'observe', 'Toggle in the accessibility tree: open / closed', (S) => `${S.desktop.initial.aria ?? '—'} / ${S.desktop.click1.aria ?? '—'}`],
  ['O2', 'observe', 'Alt+S toggles the sidebar (keyboard shortcut)', (S) => S.desktop.altS.changed],
  ['O3', 'observe', 'Resize handle shown with the sidebar open at 960px / 1000px / 1280px', (S) => `${S.widths[960].open.handleShown} / ${S.widths[1000].open.handleShown} / ${S.desktop.initial.handleShown}`],
  ['O4', 'observe', 'Sidebar top minus bottom of the bars above it at 1000px / 1280px (px; negative = overlap)', (S) => `${gap(S.widths[1000].open)} / ${gap(S.desktop.initial)}`],
  ['O5', 'observe', 'Sidebar top moved after first paint during load at 1280px (range, px)', (S) => S.desktop.loadFrames.topRange ? S.desktop.loadFrames.topRange.join('–') : '—'],
  ['O6', 'observe', 'Focus after the narrow open / after Escape / after the close button', (S) => `${S.narrow.opened.active.label} / ${S.narrow.escape.active.label} / ${S.narrow.closeClick.active.label}`],
  ['O7', 'observe', 'Where 20 Tabs went from the open narrow sidebar', (S) => tally(S.narrow.tabs)],
  ['O8', 'observe', '1100px: Navigation, sidebar shown (px) before / after opening details / after closing details (html height)', (S) => S.nav.afterDetails1 ? [S.nav.navExpanded, S.nav.afterDetails1, S.nav.afterDetails2].map((x) => `${x.navigation}, ${x.sidebar?.shownWidth ?? '—'}`).join(' / ') + ` (${S.nav.navExpanded.htmlHeight}→${S.nav.afterDetails1.htmlHeight})` : 'details not found'],
  ['O9', 'observe', 'Below 1024px: what covers the close button (mouse click blocked?)', (S) => S.narrow.closeClickResult.coveredBy ? `${S.narrow.closeClickResult.coveredBy}${S.narrow.closeClickResult.ok ? '' : ', click blocked'}` : 'nothing'],
  ['O10', 'observe', '1100px, both stored open, first load: sidebar shown (px) / Navigation', (S) => `${S.nav.initial.sidebar?.shownWidth ?? '—'} / ${S.nav.initial.navigation}`],
];
const gap = (s) => (s?.sidebar && s.barBottom != null ? s.sidebar.top - s.barBottom : '—');
const tally = (tabs) => Object.entries(tabs.reduce((o, t) => ({ ...o, [t.where]: (o[t.where] || 0) + 1 }), {})).map(([k, v]) => `${k} ${v}`).join(', ');

// Evaluate every check on both sides, and the verdict (tools/playwright/lib/run-schema.mjs VERDICTS).
export function evaluate(B, A) {
  const rows = CHECKS.map(([id, kind, label, fn]) => {
    const val = (S) => { try { return fn(S); } catch (e) { return `error: ${e.message}`; } };
    const before = val(B), after = val(A);
    let status = 'recorded';
    if (kind === 'fix') status = before === null || after === null ? 'not applicable' : before === false && after === true ? 'as expected' : before === true ? 'NOT REPRODUCED on Before' : 'NOT FIXED on After';
    if (kind === 'regression') status = after === null ? 'not applicable' : after === true ? (before === true ? 'as expected' : 'as expected (Before also fails)') : before === true ? 'REGRESSION on After' : 'fails on both';
    return { id, kind, label, before, after, status };
  });
  const fix = rows.filter((r) => r.kind === 'fix' && r.status !== 'not applicable');
  const reproduced = fix.filter((r) => r.before === false);
  const fixed = reproduced.filter((r) => r.after === true);
  const regressions = rows.filter((r) => r.status === 'REGRESSION on After');
  const unexpected = rows.filter((r) => /NOT|REGRESSION|fails on both|error/.test(r.status) || String(r.before).startsWith('error') || String(r.after).startsWith('error')).length;
  let verdict = 'mixed';
  if (!reproduced.length) verdict = 'not-reproduced';
  else if (!fixed.length) verdict = 'reproduced-not-fixed';
  else if (fixed.length === fix.length && !regressions.length && !unexpected) verdict = 'reproduced-and-fixed';
  return { rows, verdict, unexpected };
}
