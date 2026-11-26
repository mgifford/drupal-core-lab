// Evidence for #3426468: the Navigation active-state indicator.
//
//   node tools/playwright/evaluate-3426468.mjs [slug] [--browser=chromium|firefox|webkit]
//     [--scheme=light|dark] [--forced-colors] [--viewport=WxH] [--collapse] [--rtl] [--out=<dir>]
//
// The script is built on lib/lab-run.mjs, so every side records the core commit, the site context (Drupal, PHP,
// profile, themes, modules), every page load, AJAX commands, announcements, JavaScript errors and axe results.
// It does not provision anything and does not change an environment.
//
// What it measures, on the three routes named in the issue (#/admin/appearance,
// /admin/structure/display-modes/form, /admin/content):
//   - the element type, classes, aria-current, aria-expanded and level of every Navigation item;
//   - current-page items, active ancestors, expanded controls and current submenu items, kept distinct;
//   - text colour, background, font weight, and the ::before/::after indicator (size, colour, position);
//   - contrast of text against its own background AND the state-to-state delta (kept apart: a low delta between
//     active and inactive text is not an SC 1.4.3 failure);
//   - whether the indicator is clipped by an overflow ancestor, whether it is on the logical inline-start side in
//     RTL, whether it overlaps the focus outline, and whether the item box shifts between Before and After;
//   - real keyboard focus (Tab) and real pointer hover styles, with screenshots of the sidebar.
//
// Two modes are deliberately recorded rather than assumed: the rendered colour scheme (matchMedia + computed
// colours) and the forced-colours state. RTL is emulated by setting dir="rtl" on <html>; that is not the same as an
// installed RTL language, and the run says so. A person still has to confirm the rendering and keyboard behaviour.
import fs from 'node:fs';
import path from 'node:path';
import { axeScan, baseResults, contextMarkdown, launch, openSide, runArgs, writeRun } from './lib/lab-run.mjs';

const argv = process.argv.slice(2);
const COLLAPSE = argv.includes('--collapse');
const RTL = argv.includes('--rtl');

const ROUTES = [
  { path: '/admin/appearance', key: 'appearance', expect: 'Current top-level item (Appearance).' },
  { path: '/admin/structure/display-modes/form', key: 'form-modes', expect: 'Top-level ancestor (Structure), open submenu, current submenu item (Form modes).' },
  { path: '/admin/content', key: 'content', expect: 'Current top-level item (Content); no shortcuts block on this core version (module removed).' },
];

const run = runArgs({ slug: '3426468-latest' });
const { v, out } = run;

const settle = async (page) => {
  await page.waitForLoadState('load');
  await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(300); // navigation JS adds .current/.is-active after load
};

// The sidebar slides in from translateX(-100%); measuring during that transition puts items at a negative x and
// invents a clipping failure. Wait until the transform is settled before reading any rectangle.
async function waitForStableSidebar(page) {
  await page.waitForFunction(() => {
    const n = document.querySelector('#admin-toolbar');
    if (!n) return true;
    return n.getBoundingClientRect().left >= -0.5 && !document.documentElement.hasAttribute('data-admin-toolbar-animating');
  }, null, { timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(250);
}

// #3438046: the current submenu item does not expand its ancestors on load. Record whether it was open, then open
// the trail with real clicks so the current submenu item is actually visible and focusable.
async function openActiveTrail(page) {
  const wasOpen = await page.evaluate(() => {
    const n = document.querySelector('#admin-toolbar');
    const link = n?.querySelector('.is-active');
    return !!link && !link.closest('[inert]') && link.getBoundingClientRect().width > 0;
  });
  let opened = 0;
  for (let i = 0; i < 4; i++) {
    let target = null;
    for (const h of await page.locator('#admin-toolbar [aria-expanded="false"]').all()) {
      if (await h.evaluate((el) => !!el.nextElementSibling && !!el.nextElementSibling.querySelector('.is-active'))) { target = h; break; }
    }
    if (!target) break;
    // Enter on the focused trigger is a real keyboard activation. A pointer click can be intercepted by the open
    // popover's safe-triangle in RTL, which is not something a keyboard user experiences.
    try {
      await target.focus();
      await page.keyboard.press('Enter');
    }
    catch {
      try { await target.click({ force: true }); } catch { break; }
    }
    opened++;
    await page.waitForTimeout(400);
  }
  return { wasOpen, opened };
}

// Open the sidebar when the viewport is narrow (it is an off-canvas drawer there).
async function ensureSidebarOpen(page) {
  const hidden = await page.evaluate(() => {
    const n = document.querySelector('#admin-toolbar');
    if (!n) return true;
    const s = getComputedStyle(n);
    const r = n.getBoundingClientRect();
    return s.visibility === 'hidden' || r.width === 0 || r.right <= 0;
  });
  if (!hidden) return false;
  const trigger = page.locator('[data-drupal-selector="admin-toolbar-mobile-trigger"]').first();
  if (await trigger.count()) {
    await trigger.click();
    await page.waitForTimeout(500);
    return true;
  }
  return false;
}

// Everything inside the page: styles, pseudo-elements, indicators, clipping, clipping candidates.
function INVENTORY() {
  const px = (v) => { const n = parseFloat(v); return Number.isFinite(n) ? n : 0; };
  const rectOf = (el) => {
    const r = el.getBoundingClientRect();
    const f = (n) => Math.round(n * 100) / 100;
    return { x: f(r.x), y: f(r.y), width: f(r.width), height: f(r.height), left: f(r.left), right: f(r.right), top: f(r.top), bottom: f(r.bottom) };
  };
  const labelOf = (el) => {
    if (!el) return null;
    const cls = String(el.className || '').split(/\s+/).filter(Boolean).slice(0, 3).join('.');
    return el.tagName.toLowerCase() + (cls ? '.' + cls : '');
  };
  // Chromium serialises the Default Admin theme's lch() colours verbatim; canvas normalises any CSS colour to
  // sRGB so the contrast maths does not silently become null in dark mode.
  const cv = document.createElement('canvas'); cv.width = cv.height = 1;
  const ctx = cv.getContext('2d', { willReadFrequently: true });
  const rgbOf = (c) => {
    if (!c) return c;
    try {
      ctx.clearRect(0, 0, 1, 1);
      ctx.fillStyle = '#000';
      ctx.fillStyle = c;
      ctx.fillRect(0, 0, 1, 1);
      const d = ctx.getImageData(0, 0, 1, 1).data;
      return d[3] === 255 ? `rgb(${d[0]}, ${d[1]}, ${d[2]})` : `rgba(${d[0]}, ${d[1]}, ${d[2]}, ${(d[3] / 255).toFixed(3)})`;
    } catch { return c; }
  };
  const alphaOf = (c) => {
    const m = /rgba?\(\s*[\d.]+[,\s]+[\d.]+[,\s]+[\d.]+(?:[,\s/]+([\d.]+))?\s*\)/.exec(c || '');
    return m && m[1] !== undefined ? Number(m[1]) : 1;
  };
  const bgBehind = (el) => {
    let node = el;
    const images = [];
    while (node) {
      const s = getComputedStyle(node);
      if (s.backgroundImage && s.backgroundImage !== 'none') images.push(s.backgroundImage.slice(0, 80));
      const c = s.backgroundColor;
      if (c && alphaOf(c) > 0) return { color: rgbOf(c), colorRaw: c, images };
      node = node.parentElement;
    }
    return { color: 'rgb(255, 255, 255)', colorRaw: 'rgb(255, 255, 255)', images };
  };
  const pseudo = (el, which) => {
    const s = getComputedStyle(el, which);
    const content = s.content;
    const none = !content || content === 'none' || content === 'normal';
    return {
      content: none ? null : content.slice(0, 60),
      display: s.display, position: s.position,
      color: rgbOf(s.color), backgroundColor: rgbOf(s.backgroundColor),
      width: s.width, height: s.height,
      borderInlineStartStyle: s.borderInlineStartStyle,
      borderInlineStartWidth: s.borderInlineStartWidth,
      borderInlineStartColor: rgbOf(s.borderInlineStartColor),
      insetInlineStart: s.insetInlineStart, insetInlineEnd: s.insetInlineEnd,
      insetBlockStart: s.insetBlockStart,
      borderRadius: s.borderRadius, zIndex: s.zIndex,
    };
  };
  const indicatorsOf = (el, r, dir) => {
    const found = [];
    const b = pseudo(el, '::before');
    if (b.content && b.borderInlineStartStyle !== 'none' && px(b.borderInlineStartWidth) > 0) {
      const width = px(b.borderInlineStartWidth);
      const height = /px$/.test(b.height) ? px(b.height) : r.height;
      // `inset-inline-end` computes to a used px value for a positioned box (e.g. 237px for a 232px item + 5px),
      // so subtract the item width; a calc()/percentage value keeps only its px addend.
      const rawInset = b.insetInlineEnd || '';
      const m = /(-?\d+(?:\.\d+)?)px/.exec(rawInset);
      const gap = /calc|%/.test(rawInset) ? (m ? Math.abs(px(m[1])) : 5) : Math.max(0, px(rawInset) - r.width);
      const box = dir === 'rtl'
        ? { left: r.right + gap, right: r.right + gap + width, top: r.top, bottom: r.top + height }
        : { left: r.left - gap - width, right: r.left - gap, top: r.top, bottom: r.top + height };
      found.push({ via: '::before', kind: 'bar', color: b.borderInlineStartColor, width, height, gap, rawInset: b.insetInlineEnd, rect: box });
    }
    const a = pseudo(el, '::after');
    if (a.backgroundColor && a.backgroundColor !== 'rgba(0, 0, 0, 0)' && a.backgroundColor !== 'transparent' && px(a.width) > 0 && px(a.height) > 0) {
      const width = px(a.width), height = px(a.height);
      const m = /(-?\d+(?:\.\d+)?)px/.exec(a.insetInlineStart || '');
      const offset = m ? px(m[1]) : -width / 2;
      const left = dir === 'rtl' ? r.right - offset - width : r.left + offset;
      const top = r.top + r.height / 2 - height / 2;
      found.push({ via: '::after', kind: 'dot', color: a.backgroundColor, width, height, offset, rawInset: a.insetInlineStart, rect: { left, right: left + width, top, bottom: top + height } });
    }
    return found;
  };
  const containersOf = (el) => {
    const list = [];
    let p = el.parentElement;
    while (p && p !== document.documentElement) {
      const s = getComputedStyle(p);
      if (/(hidden|clip|auto|scroll)/.test(s.overflowX + ' ' + s.overflowY) || s.clipPath !== 'none') {
        list.push({ node: labelOf(p), rect: rectOf(p), overflowX: s.overflowX, overflowY: s.overflowY, clipPath: s.clipPath });
      }
      p = p.parentElement;
    }
    return list;
  };
  const inside = (r, box, tol = 0.75, axis = 'both') => {
    const x = r.left >= box.left - tol && r.right <= box.right + tol;
    const y = r.top >= box.top - tol && r.bottom <= box.bottom + tol;
    return axis === 'x' ? x : axis === 'y' ? y : x && y;
  };

  const nav = document.querySelector('#admin-toolbar');
  const dir = getComputedStyle(document.documentElement).direction || 'ltr';
  const items = [...document.querySelectorAll('a.toolbar-button, button.toolbar-button, a.toolbar-menu__link, button.toolbar-menu__link')]
    .filter((el) => (nav ? nav.contains(el) : true));

  const rows = items.map((el) => {
    const r = rectOf(el);
    const s = getComputedStyle(el);
    const inPopover = !!el.closest('[data-toolbar-popover-wrapper]');
    const inNestedMenu = !!el.closest('.toolbar-menu');
    // Visual depth, not the template's 0-based class number: count the toolbar-menu ancestors, so the popover's
    // first menu is level 2 and a nested menu is level 3.
    let menuDepth = 0;
    for (let m = el.closest('.toolbar-menu'); m; m = m.parentElement ? m.parentElement.closest('.toolbar-menu') : null) menuDepth++;
    const isCurrent = el.matches('.current') || el.getAttribute('aria-current') === 'page';
    const isActiveClass = el.classList.contains('is-active');
    const isTopAncestor = el.matches('.toolbar-button:has(+ .toolbar-popover__wrapper .is-active)');
    const isSubAncestor = el.matches(':has(+ .toolbar-menu .is-active)');
    const isExpanded = el.getAttribute('aria-expanded') === 'true';
    const level = !inPopover && !inNestedMenu ? 'top' : `level-${inNestedMenu ? menuDepth + 1 : 2}`;
    const indicators = indicatorsOf(el, r, dir);
    const containers = containersOf(el);
    const background = bgBehind(el);
    const icon = el.querySelector('.toolbar-button__icon, svg');
    const label = el.querySelector('.toolbar-button__label, .toolbar-menu__link-title');
    const item = {
      tag: el.tagName.toLowerCase(),
      text: (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 80),
      href: el.getAttribute('href'),
      classes: String(el.className || '').split(/\s+/).filter(Boolean),
      level,
      inPopover,
      inNestedMenu,
      isCurrent,
      isActiveClass,
      isTopAncestor,
      isSubAncestor,
      isExpanded,
      ariaCurrent: el.getAttribute('aria-current'),
      ariaExpanded: el.getAttribute('aria-expanded'),
      hasIcon: !!icon,
      hasLabel: !!label,
      rect: r,
      styles: {
        color: rgbOf(s.color),
        colorRaw: s.color,
        backgroundColor: rgbOf(s.backgroundColor),
        backgroundColorRaw: s.backgroundColor,
        fontWeight: s.fontWeight,
        fontVariationSettings: s.fontVariationSettings,
        display: s.display,
        visibility: s.visibility,
        opacity: s.opacity,
        direction: s.direction,
        outlineStyle: s.outlineStyle, outlineWidth: s.outlineWidth, outlineColor: s.outlineColor, outlineOffset: s.outlineOffset,
      },
      cssVars: {
        currentColor: s.getPropertyValue('--toolbar-button-current-color').trim(),
        currentBg: s.getPropertyValue('--toolbar-button-current-bg').trim(),
        ancestorColor: s.getPropertyValue('--toolbar-button-has-active-child-color').trim(),
        ancestorBg: s.getPropertyValue('--toolbar-button-has-active-child-bg').trim(),
        indicatorWidth: s.getPropertyValue('--toolbar-button-current-indicator-width').trim(),
      },
      background,
      backgroundParent: bgBehind(el.parentElement),
      before: pseudo(el, '::before'),
      after: pseudo(el, '::after'),
      indicators,
      iconRect: icon ? rectOf(icon) : null,
      labelRect: label ? rectOf(label) : null,
      containers,
      indicatorClipping: indicators.map((ind) => ({
        via: ind.via,
        insideViewport: ind.rect.left >= 0 && ind.rect.right <= window.innerWidth && ind.rect.top >= 0 && ind.rect.bottom <= window.innerHeight,
        // Horizontal overflow is the clipping risk for an indicator at the inline edge. Being below a scroll
        // container's visible area is a scroll position, not clipping, so it is recorded separately.
        outside: containers.filter((c) => !inside(ind.rect, c.rect, 0.75, 'x')).map((c) => c.node),
        belowScroll: containers.filter((c) => !inside(ind.rect, c.rect, 0.75, 'y')).map((c) => c.node),
        hit: (() => {
          const cx = (ind.rect.left + ind.rect.right) / 2, cy = (ind.rect.top + ind.rect.bottom) / 2;
          if (cx < 0 || cy < 0 || cx > window.innerWidth || cy > window.innerHeight) return null;
          const hit = document.elementFromPoint(cx, cy);
          return hit ? { node: labelOf(hit), isItem: hit === el, contains: el.contains(hit) } : null;
        })(),
      })),
      overlaps: {
        icon: indicators.some((i) => icon && !(i.rect.right <= rectOf(icon).left || i.rect.left >= rectOf(icon).right || i.rect.bottom <= rectOf(icon).top || i.rect.top >= rectOf(icon).bottom)),
        label: indicators.some((i) => label && !(i.rect.right <= rectOf(label).left || i.rect.left >= rectOf(label).right || i.rect.bottom <= rectOf(label).top || i.rect.top >= rectOf(label).bottom)),
      },
    };
    return item;
  });

  const sidebar = document.querySelector('.admin-toolbar') || nav;
  return {
    path: location.pathname,
    url: location.href,
    title: document.title,
    dir,
    lang: document.documentElement.lang || null,
    adminToolbarAttr: document.documentElement.getAttribute('data-admin-toolbar'),
    localStorageExpanded: (() => { try { return localStorage.getItem('Drupal.navigation.sidebarExpanded'); } catch { return null; } })(),
    media: {
      prefersDark: matchMedia('(prefers-color-scheme: dark)').matches,
      forcedColors: matchMedia('(forced-colors: active)').matches,
      reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
    },
    rendered: {
      bodyBackground: getComputedStyle(document.body).backgroundColor,
      bodyBackgroundRgb: rgbOf(getComputedStyle(document.body).backgroundColor),
      canvas: (() => { const d = document.createElement('div'); d.style.color = 'CanvasText'; d.style.backgroundColor = 'Canvas'; d.style.display = 'none'; document.body.appendChild(d); const x = getComputedStyle(d); const v = { color: x.color, background: x.backgroundColor }; d.remove(); return v; })(),
      linkColor: (() => { const d = document.createElement('a'); d.href = '#'; d.style.display = 'none'; document.body.appendChild(d); const c = getComputedStyle(d).color; d.remove(); return c; })(),
    },
    viewport: { width: window.innerWidth, height: window.innerHeight },
    scroll: { x: window.scrollX, y: window.scrollY },
    navRect: nav ? rectOf(nav) : null,
    sidebarRect: sidebar ? rectOf(sidebar) : null,
    items: rows,
  };
}

// Send Tab from the top of the document; stop after leaving the sidebar, having entered it. Real key presses only.
async function focusPass(page, base, route, out, side, key) {
  await page.goto(base + route, { waitUntil: 'load' });
  await settle(page);
  await waitForStableSidebar(page);
  await ensureSidebarOpen(page);
  await waitForStableSidebar(page);
  if (RTL) {
    await page.evaluate(() => { document.documentElement.dir = 'rtl'; });
    await page.waitForTimeout(200);
  }
  await openActiveTrail(page);
  await waitForStableSidebar(page);
  const frames = [];
  let entered = false;
  const taken = new Set();
  for (let i = 0; i < 90; i++) {
    await page.keyboard.press('Tab');
    const f = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body || el === document.documentElement) return null;
      const s = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return {
        tag: el.tagName.toLowerCase(),
        classes: String(el.className || ''),
        text: (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 60),
        href: el.getAttribute('href'),
        inNav: !!el.closest('#admin-toolbar'),
        isCurrent: el.matches('.current') || el.getAttribute('aria-current') === 'page',
        outlineStyle: s.outlineStyle, outlineWidth: s.outlineWidth, outlineColor: s.outlineColor, outlineOffset: s.outlineOffset,
        rect: { x: r.x, y: r.y, width: r.width, height: r.height },
      };
    });
    if (!f) break;
    if (f.inNav) {
      entered = true;
      frames.push(f);
      const focusShot = f.isCurrent ? `${side}-${key}-focus-current-nav.png` : frames.length === 1 ? `${side}-${key}-focus-first-nav.png` : null;
      if (focusShot && !taken.has(focusShot)) {
        taken.add(focusShot);
        const nav = page.locator('#admin-toolbar');
        if (await nav.count()) await nav.screenshot({ path: path.join(out, focusShot) }).catch(() => {});
      }
    }
    else if (entered) break;
  }
  return frames;
}

async function hoverPass(page, target) {
  const el = typeof target === 'string' ? page.locator(target).first() : target;
  if (!(await el.count())) return null;
  try { await el.hover({ timeout: 3000 }); } catch { return null; } // a narrow open popover can cover the trigger
  await page.waitForTimeout(120);
  return el.evaluate((node) => {
    const s = getComputedStyle(node);
    const b = getComputedStyle(node, '::before');
    const a = getComputedStyle(node, '::after');
    return {
      text: (node.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 60),
      color: s.color,
      backgroundColor: s.backgroundColor,
      outlineStyle: s.outlineStyle,
      outlineWidth: s.outlineWidth,
      outlineColor: s.outlineColor,
      beforeContent: b.content,
      beforeWidth: b.borderInlineStartWidth,
      beforeColor: b.borderInlineStartColor,
      afterContent: a.content,
      afterBackground: a.backgroundColor,
      afterWidth: a.width,
      afterHeight: a.height,
    };
  });
}

async function runSide(side) {
  const { page, base, rec } = await openSide(run, side);
  if (COLLAPSE) {
    // The sidebar remembers this preference (localStorage); setting it before the route loads is the same state a
    // person reaches with the collapse control. Recorded so the method is not mistaken for a click.
    await page.addInitScript(() => { try { localStorage.setItem('Drupal.navigation.sidebarExpanded', 'false'); } catch { /* ignore */ } });
  }
  const routes = [];
  for (const route of ROUTES) {
    console.log(`  ${side} ${route.path} ...`);
    await page.goto(base + route.path, { waitUntil: 'load' });
    await settle(page);
    await waitForStableSidebar(page);
    const openedByScript = await ensureSidebarOpen(page);
    await waitForStableSidebar(page);
    if (RTL) {
      await page.evaluate(() => { document.documentElement.dir = 'rtl'; });
      await page.waitForTimeout(300);
    }
    const inventoryClosed = await page.evaluate(INVENTORY);
    const trail = await openActiveTrail(page);
    await waitForStableSidebar(page);
    const inventory = await page.evaluate(INVENTORY);
    const navShot = path.join(out, `${side}-${route.key}-nav.png`);
    const fullShot = path.join(out, `${side}-${route.key}-full.png`);
    await page.screenshot({ path: fullShot, fullPage: true });
    const nav = page.locator('#admin-toolbar');
    if (await nav.count()) await nav.screenshot({ path: navShot }).catch(() => {});
    const axe = await axeScan(page);
    const hover = run.viewport.width < 768 ? null : await hoverPass(page, route.key === 'form-modes' ? '.toolbar-button:has(+ .toolbar-popover__wrapper .is-active)' : '.toolbar-button.current');
    if (hover) {
      const navEl = page.locator('#admin-toolbar');
      if (await navEl.count()) await navEl.screenshot({ path: path.join(out, `${side}-${route.key}-hover-nav.png`) }).catch(() => {});
    }
    // An inactive top-level item: hover must not acquire the active indicator.
    const inactiveIndex = await page.evaluate(() => {
      const els = [...document.querySelectorAll('.toolbar-block__list > .toolbar-block__list-item > .toolbar-button')];
      return els.findIndex((el) => !el.matches('.current') && !el.matches(':has(+ .toolbar-popover__wrapper .is-active)') && el.getAttribute('aria-expanded') !== 'true');
    });
    const hoverInactive = run.viewport.width < 768 || inactiveIndex < 0 ? null : await hoverPass(page, page.locator('.toolbar-block__list > .toolbar-block__list-item > .toolbar-button').nth(inactiveIndex));
    const focus = await focusPass(page, base, route.path, out, side, route.key);
    routes.push({ ...route, method: { openedByScript, rtlEmulated: RTL, collapseByPreference: COLLAPSE, trail }, inventory, inventoryClosed, axe, hover, hoverInactive, focus });
  }
  await rec.close(out);
  return Object.assign(rec, { routes });
}

// ---- Contrast (WCAG relative luminance; composited alpha; rendered colours only)
const parseColor = (s) => {
  if (!s) return null;
  const m = /rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s/]+([\d.]+))?\s*\)/.exec(s);
  if (!m) return null;
  return { r: +m[1], g: +m[2], b: +m[3], a: m[4] === undefined ? 1 : +m[4] };
};
const over = (fg, bg) => fg && bg ? ({ r: fg.r * fg.a + bg.r * (1 - fg.a), g: fg.g * fg.a + bg.g * (1 - fg.a), b: fg.b * fg.a + bg.b * (1 - fg.a), a: 1 }) : null;
const lum = (c) => {
  if (!c) return null;
  const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b);
};
const ratio = (a, b) => { const l1 = lum(a), l2 = lum(b); if (l1 == null || l2 == null) return null; const [hi, lo] = l1 >= l2 ? [l1, l2] : [l2, l1]; return Math.round(((hi + 0.05) / (lo + 0.05)) * 100) / 100; };
const fmt = (c) => c ? `rgb(${Math.round(c.r)}, ${Math.round(c.g)}, ${Math.round(c.b)})` : null;

const contrastOf = (item) => {
  const bg = parseColor(item.background.color) || { r: 255, g: 255, b: 255, a: 1 };
  const text = over(parseColor(item.styles.color), bg);
  return {
    background: fmt(bg),
    text: fmt(text),
    textContrast: ratio(text, bg),
    indicators: item.indicators.map((i) => {
      // A bar sits outside the item, so measure it against the surface behind the item; a dot sits on the item.
      const adjacent = i.kind === 'bar' ? (parseColor(item.backgroundParent?.color) || bg) : bg;
      const ic = over(parseColor(i.color), adjacent);
      return { ...i, adjacent: fmt(adjacent), resolvedColor: fmt(ic), contrast: ratio(ic, adjacent) };
    }),
  };
};

const { browser, environment } = await launch(run);
run.browser = browser;
const results = baseResults(run, environment);
results.method = { collapse: COLLAPSE ? 'sidebar preference set to collapsed before load' : 'default (expanded at this viewport)', rtl: RTL ? 'dir="rtl" set on <html> after load (emulated, not an installed RTL language)' : 'LTR as rendered' };
try {
  for (const side of ['before', 'after']) {
    console.log(`running ${side} (${v[side].env}) ...`);
    results.sides[side] = await runSide(side);
  }
}
finally {
  await browser.close();
}

const B = results.sides.before;
const A = results.sides.after;
const routeOf = (side, key) => side.routes.find((r) => r.key === key);
const itemsOf = (side, key) => routeOf(side, key)?.inventory?.items || [];
const pick = (side, key, pred) => itemsOf(side, key).find(pred) || null;
const currentTop = (side, key) => pick(side, key, (i) => i.isCurrent && i.level === 'top');
const currentSub = (side, key) => pick(side, key, (i) => i.isCurrent && i.level !== 'top');
const topAncestor = (side, key) => pick(side, key, (i) => i.isTopAncestor);
const subAncestor = (side, key) => pick(side, key, (i) => i.isSubAncestor && i.isExpanded);

const withContrast = (side, key) => itemsOf(side, key).map((i) => ({ ...i, contrast: contrastOf(i) }));
const stateDelta = (side, key, item) => {
  if (!item) return null;
  const peer = itemsOf(side, key).find((i) => !i.isCurrent && !i.isTopAncestor && !i.isSubAncestor && i.level === item.level);
  if (!peer) return null;
  return ratio(parseColor(item.styles.color), parseColor(peer.styles.color));
};

const checks = [];
const add = (type, label, before, after, good) => checks.push({ type, label, before, after, good });

const routesLoaded = ['appearance', 'form-modes', 'content'].every((k) => routeOf(B, k) && routeOf(A, k));
add('precondition', 'All three routes loaded on both sides', routesLoaded, routesLoaded, routesLoaded);
add('precondition', 'Current top-level item identified on appearance and content (both sides)', ['appearance', 'content'].every((k) => !!currentTop(B, k)), ['appearance', 'content'].every((k) => !!currentTop(A, k)), ['appearance', 'content'].every((k) => !!currentTop(A, k)));
add('precondition', 'Current item found on every route (both sides)', ['appearance', 'form-modes', 'content'].every((k) => itemsOf(B, k).some((i) => i.isCurrent)), ['appearance', 'form-modes', 'content'].every((k) => itemsOf(A, k).some((i) => i.isCurrent)), ['appearance', 'form-modes', 'content'].every((k) => itemsOf(A, k).some((i) => i.isCurrent)));

for (const key of ['appearance', 'content']) {
  const b = currentTop(B, key), a = currentTop(A, key);
  add('fix', `${key}: current top-level item is marked by more than colour`, b ? b.indicators.length : null, a ? a.indicators.length : null, !!a && a.indicators.length > 0);
  const bc = b ? contrastOf(b) : null, ac = a ? contrastOf(a) : null;
  add('fix', `${key}: current top-level indicator contrast >= 3:1 (SC 1.4.11)`, bc?.indicators?.[0]?.contrast ?? null, ac?.indicators?.[0]?.contrast ?? null, !!ac?.indicators?.[0] && ac.indicators[0].contrast >= 3);
  add('regression', `${key}: current top-level text contrast >= 4.5:1 (SC 1.4.3)`, bc?.textContrast ?? null, ac?.textContrast ?? null, !!ac?.textContrast && ac.textContrast >= 4.5);
  add('observe', `${key}: active-vs-inactive text delta (state signal, not 1.4.3)`, stateDelta(B, key, b), stateDelta(A, key, a), null);
  add('regression', `${key}: current top-level indicator is not clipped (expanded)`, b?.indicatorClipping?.map((x) => x.outside.length) ?? null, a?.indicatorClipping?.map((x) => x.outside.length) ?? null, !!a && a.indicatorClipping.every((x) => x.outside.length === 0));
  add('regression', `${key}: current top-level indicator does not overlap icon or label`, b ? (b.overlaps.icon || b.overlaps.label) : null, a ? (a.overlaps.icon || a.overlaps.label) : null, !!a && !a.overlaps.icon && !a.overlaps.label);
  add('observe', `${key}: aria-current on the current top-level item (null is a pre-existing gap, not this patch)`, b?.ariaCurrent ?? null, a?.ariaCurrent ?? null, null);
  add('regression', `${key}: the patch does not change aria-current on the current item`, b?.ariaCurrent ?? null, a?.ariaCurrent ?? null, (b?.ariaCurrent ?? null) === (a?.ariaCurrent ?? null));
  add('observe', `${key}: rendered current text colour`, b ? { rgb: b.styles.color, raw: b.styles.colorRaw } : null, a ? { rgb: a.styles.color, raw: a.styles.colorRaw } : null, null);
}

{
  const b = topAncestor(B, 'form-modes'), a = topAncestor(A, 'form-modes');
  add('fix', 'form-modes: top-level ancestor (Structure) is marked by more than colour', b ? b.indicators.length : null, a ? a.indicators.length : null, !!a && a.indicators.length > 0);
  const ac = a ? contrastOf(a) : null;
  add('fix', 'form-modes: top-level ancestor indicator contrast >= 3:1 (SC 1.4.11)', b ? contrastOf(b)?.indicators?.[0]?.contrast ?? null : null, ac?.indicators?.[0]?.contrast ?? null, !!ac?.indicators?.[0] && ac.indicators[0].contrast >= 3);
  add('regression', 'form-modes: top-level ancestor indicator is not clipped (expanded)', b?.indicatorClipping?.map((x) => x.outside.length) ?? null, a?.indicatorClipping?.map((x) => x.outside.length) ?? null, !!a && a.indicatorClipping.every((x) => x.outside.length === 0));
  add('regression', 'form-modes: top-level ancestor is not marked aria-current', b?.ariaCurrent ?? null, a?.ariaCurrent ?? null, !a?.ariaCurrent);
  add('observe', 'Shortcut module present (the issue\'s case c needs it; it is absent from core at this commit)', (B.site.modules || []).includes('shortcut'), (A.site.modules || []).includes('shortcut'), null);
  const sa = subAncestor(A, 'form-modes');
  add('observe', 'form-modes: submenu ancestor (open trigger containing the current item) has its own non-colour marker', null, sa ? sa.indicators.length : 0, null);
  const cs = currentSub(A, 'form-modes');
  add('observe', 'form-modes: current submenu item keeps its dot/indicator', null, cs ? cs.indicators.length : 0, null);
  add('regression', 'form-modes: current submenu item has aria-current="page"', currentSub(B, 'form-modes')?.ariaCurrent ?? null, cs?.ariaCurrent ?? null, cs?.ariaCurrent === 'page');
}

for (const key of ['appearance', 'form-modes', 'content']) {
  add('observe', `${key}: active trail was already expanded when the page loaded`, routeOf(B, key)?.method?.trail?.wasOpen ?? null, routeOf(A, key)?.method?.trail?.wasOpen ?? null, null);
  add('observe', `${key}: active trail expanded by the evaluator (real clicks)`, null, routeOf(A, key)?.method?.trail?.opened ?? null, null);
  const marked = itemsOf(A, key).filter((i) => (i.isTopAncestor || i.isSubAncestor) && i.ariaCurrent);
  add('regression', `${key}: no active ancestor is marked aria-current`, null, marked.map((i) => i.text), marked.length === 0);
}

// Hover: the active indicator must survive it, and an inactive item must not acquire it. Hover is not a touch
// gesture, so at a narrow viewport the rows are recorded as not tested rather than as failures.
const ind = (x) => {
  if (!x) return false;
  const after = parseColor(x.afterBackground);
  return parseFloat(x.beforeWidth) > 0 || (!!after && after.a > 0);
};
if (run.viewport.width >= 768) {
  for (const key of ['appearance', 'form-modes', 'content']) {
    const h = routeOf(A, key)?.hover;
    const hi = routeOf(A, key)?.hoverInactive;
    add('fix', `${key}: the active item keeps its indicator on hover`, null, h ? { text: h.text, indicator: ind(h), beforeWidth: h.beforeWidth } : null, !!h && ind(h));
    add('regression', `${key}: hovering an inactive item does not add the active indicator`, null, hi ? { text: hi.text, indicator: ind(hi), beforeWidth: hi.beforeWidth } : null, hi ? !ind(hi) : null);
  }
}
else {
  add('observe', 'hover not tested at this touch-width viewport', null, null, null);
}

// Keyboard focus and hover: real input, recorded for the After side (the state under test).
{
  const focusItems = [];
  for (const key of ['appearance', 'form-modes', 'content']) {
    const f = routeOf(A, key)?.focus || [];
    if (!f.length) continue;
    focusItems.push(...f);
    const invisible = f.filter((x) => x.outlineStyle === 'none' || parseFloat(x.outlineWidth) < 1);
    const thin = f.filter((x) => x.outlineStyle !== 'none' && parseFloat(x.outlineWidth) < 2);
    add('regression', `${key}: keyboard focus outline visible on every focused Navigation control`, null, { focused: f.length, withoutOutline: invisible.length }, invisible.length === 0);
    add('observe', `${key}: focused controls using a visible but non-theme focus outline (<2px)`, null, thin.map((x) => `${x.tag}.${x.classes.split(' ')[0] || ''} ${x.outlineWidth} ${x.outlineStyle}`), null);
    const current = f.find((x) => x.isCurrent);
    add('regression', `${key}: focus outline still visible on the current item`, null, current ? { outline: current.outlineStyle, width: current.outlineWidth, color: current.outlineColor } : null, !!current && current.outlineStyle !== 'none' && parseFloat(current.outlineWidth) >= 2);
    if (current) {
      const inv = itemsOf(A, key).find((i) => i.isCurrent && i.href && i.href === current.href);
      const ringOut = (parseFloat(current.outlineOffset) || 0) + (parseFloat(current.outlineWidth) || 0);
      const ring = { left: current.rect.x - ringOut, right: current.rect.x + current.rect.width + ringOut };
      const overlapOf = (x) => !(x.rect.right <= ring.left || x.rect.left >= ring.right);
      const bars = inv ? inv.indicators.filter((i) => i.kind === 'bar') : [];
      const dots = inv ? inv.indicators.filter((i) => i.kind === 'dot') : [];
      if (bars.length) {
        add('regression', `${key}: the new bar does not intersect the focus ring (SC 2.4.11)`, null, { ring: Math.round(ringOut * 10) / 10, overlap: bars.some(overlapOf) }, !bars.some(overlapOf));
      }
      if (dots.length) {
        // The existing submenu dot sits on the link edge and the submenu focus ring is inset by -2px; any touch is
        // recorded as pre-existing, not as a regression of this patch.
        add('observe', `${key}: existing submenu dot and the inset focus ring touch (pre-existing)`, null, { ring: Math.round(ringOut * 10) / 10, overlap: dots.some(overlapOf) }, null);
      }
    }
  }
  add('observe', 'keyboard focus reached Navigation controls on the After side', null, focusItems.length, null);
}

if (COLLAPSE) {
  for (const key of ['appearance', 'content']) {
    const a = currentTop(A, key);
    add('fix', `${key}: current top-level indicator visible with the sidebar collapsed`, null, a ? { attr: routeOf(A, key)?.inventory?.adminToolbarAttr, indicators: a.indicators.length, clipped: a.indicatorClipping.map((x) => x.outside) } : null, !!a && a.indicators.length > 0 && a.indicatorClipping.every((x) => x.outside.length === 0));
  }
}
if (RTL) {
  for (const key of ['appearance', 'content']) {
    const a = currentTop(A, key);
    const side = a?.indicators?.[0] ? (a.indicators[0].rect.left >= a.rect.right ? 'inline-start (right)' : a.indicators[0].rect.right <= a.rect.left ? 'inline-end (left)' : 'overlapping') : null;
    add('fix', `${key}: indicator is on the logical inline-start side in RTL`, null, side, side === 'inline-start (right)');
  }
}
if (environment && run.forced) {
  add('observe', 'forced colours: rendered CanvasText and Canvas', null, A.routes[0]?.inventory?.rendered, null);
}

// Layout shift: the same items before and after must keep their box (the indicator is absolutely positioned).
{
  const shifts = [];
  for (const key of ['appearance', 'form-modes', 'content']) {
    for (const a of itemsOf(A, key)) {
      const b = itemsOf(B, key).find((x) => x.text === a.text && x.level === a.level);
      if (!b) continue;
      const d = Math.max(Math.abs(a.rect.width - b.rect.width), Math.abs(a.rect.height - b.rect.height));
      if (d > 1) shifts.push({ key, text: a.text, delta: Math.round(d * 100) / 100 });
    }
  }
  add('regression', 'Indicator does not shift the Navigation item box', shifts, shifts, shifts.length === 0);
}

// axe-core is a floor, not a conclusion.
for (const key of ['appearance', 'form-modes', 'content']) {
  const b = routeOf(B, key)?.axe, a = routeOf(A, key)?.axe;
  add('regression', `${key}: axe violations (elements) do not increase`, b?.total ?? null, a?.total ?? null, !!b && !!a && a.total <= b.total);
}
{
  const b = B.jsErrors.length, a = A.jsErrors.length;
  add('regression', 'No uncaught JavaScript errors', b, a, a === 0);
}

let unexpected = 0;
for (const c of checks) if (['precondition', 'fix', 'regression'].includes(c.type) && !c.good) unexpected++;

// In forced-colours mode the baseline already draws the bar (that is the rule the patch moved out of the media
// query), so that run is a regression check: did the bar survive, and did the text colour change apply? It cannot
// "reproduce" a colour-only state that the forced-colours fallback already avoids.
const reproduced = run.forced ? true : ['appearance', 'content'].every((k) => {
  const b = currentTop(B, k);
  return b && b.indicators.length === 0;
}) && (() => { const b = topAncestor(B, 'form-modes'); return b && b.indicators.length === 0; })();
const fixed = ['appearance', 'content'].every((k) => (currentTop(A, k)?.indicators.length || 0) > 0)
  && (topAncestor(A, 'form-modes')?.indicators.length || 0) > 0
  && checks.filter((c) => c.type === 'fix' || c.type === 'regression').every((c) => c.good);
results.verdict = !reproduced ? 'not-reproduced' : fixed && unexpected === 0 ? 'reproduced-and-fixed' : 'reproduced-not-fixed';
results.unexpected = unexpected;
results.checks = checks;

// ---- Summary
const stateName = (i) => i.isCurrent ? 'current' : i.isTopAncestor ? 'ancestor (top level)' : i.isSubAncestor ? 'ancestor (submenu)' : i.isExpanded ? 'expanded' : 'inactive';
let md = `# Playwright evidence: #${v.issue} (${v.slug})\n\nDRAFT. ${environment.browser} ${environment.browserVersion}, requested ${run.scheme} scheme${run.forced ? ', forced colours' : ''}, ${run.viewport.width}x${run.viewport.height}${COLLAPSE ? ', sidebar collapsed' : ''}${RTL ? ', dir=rtl emulated' : ''}. Real Tab and pointer input was used for the focus and hover rows. axe-core uses the WCAG 2.0-2.2 A/AA tags. Contrast is computed from rendered colours, not token names; a low delta between active and inactive text is reported as a state signal, not as an SC 1.4.3 failure.\n\n`;
md += `| Type | Check | Before | After | Result |\n|---|---|---|---|---|\n`;
for (const c of checks) {
  const judged = ['precondition', 'fix', 'regression'].includes(c.type);
  md += `| ${c.type} | ${c.label} | ${JSON.stringify(c.before)} | ${JSON.stringify(c.after)} | ${judged ? (c.good ? 'as expected' : '**NOT as expected**') : 'recorded'} |\n`;
}

md += `\n## Rendered state (not the requested emulation)\n\n| Route | dir | prefers-color-scheme: dark | forced-colors: active | data-admin-toolbar | body background | CanvasText / Canvas |\n|---|---|---|---|---|---|---|\n`;
for (const key of ['appearance', 'form-modes', 'content']) {
  const inv = routeOf(A, key)?.inventory;
  if (!inv) continue;
  md += `| ${routeOf(A, key).path} | ${inv.dir} | ${inv.media.prefersDark} | ${inv.media.forcedColors} | ${inv.adminToolbarAttr} | ${inv.rendered.bodyBackground} | ${inv.rendered.canvas.color} / ${inv.rendered.canvas.background} |\n`;
}

md += `\n## Navigation items (After)\n\n| Route | Level | State | Element | Text | aria-current | aria-expanded | Indicator | Indicator contrast | Text contrast | Clipped by |\n|---|---|---|---|---|---|---|---|---|---|---|\n`;
for (const key of ['appearance', 'form-modes', 'content']) {
  for (const i of withContrast(A, key)) {
    const ind = i.contrast.indicators[0];
    md += `| ${routeOf(A, key).path} | ${i.level} | ${stateName(i)} | ${i.tag}.${i.classes.find((c) => c === 'current') || i.classes[0] || ''} | ${i.text.replace(/\|/g, '\\|')} | ${i.ariaCurrent || '—'} | ${i.ariaExpanded || '—'} | ${ind ? `${ind.kind} ${ind.via} ${Math.round(ind.width)}x${Math.round(ind.height)}px ${ind.resolvedColor}` : '—'} | ${ind ? ind.contrast : '—'} | ${i.contrast.textContrast} | ${i.indicatorClipping[0]?.outside?.join(', ') || 'none'} |\n`;
  }
}

md += `\n## Screenshots\n\n`;
for (const side of ['before', 'after']) {
  for (const key of ['appearance', 'form-modes', 'content']) {
    for (const suffix of ['full', 'nav', 'hover-nav', 'focus-first-nav', 'focus-current-nav']) {
      const f = `${side}-${key}-${suffix}.png`;
      if (fs.existsSync(path.join(out, f))) md += `- \`${f}\`\n`;
    }
  }
}
md += `\n${contextMarkdown(results)}`;
md += `\n## Limits\n\n- ${run.forced ? 'This is the forced-colours mode: the baseline already has the system-colour bar, so the run checks that the bar survives and the text colour change applies; it is not a reproduction of the normal-mode colour-only state.' : 'Normal display modes only; the forced-colours evidence is a separate run.'}\n- WebKit does not reproduce Safari’s macOS Full Keyboard Access preference in Playwright, so a WebKit Tab pass records what the engine does, not what a person with that preference sees.\n- RTL is emulated with \`dir="rtl"\` on \`<html>\`; an installed RTL language (and its translated menu) was not used.\n- Forced colours are emulated by the browser; the actual palette is recorded above. Firefox and WebKit do not support the same emulation.\n- Keyboard focus was reached with real Tab presses; a person still has to judge whether the focus ring is easy to follow in context.\n- axe-core does not decide SC 1.4.1 or SC 1.4.11; the indicator and contrast rows do that for the measured states only.\n`;

const where = writeRun(run, results, md);
console.log(`\n${results.verdict}: ${where}/SUMMARY.md`);
process.exit(unexpected === 0 ? 0 : 2);
