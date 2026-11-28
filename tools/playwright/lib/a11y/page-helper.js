/* global window, document, navigator, MutationObserver, getComputedStyle, CSS, matchMedia, Element */
// The approved in-page helper for accessibility checkpoints.
//
// It is added by Playwright MCP as an initialization script (before the page's own scripts) and by the scenario runner
// before a scenario starts. It has two jobs:
//
//   1. Observe, never change: trusted pointer/key events, focus transitions, disclosure/selection changes, live-region
//      text and Drupal.announce() calls, kept in a bounded journal so a checkpoint can say how the page got here.
//   2. Answer read-only questions about the CURRENT state: what is focused, what is open, what references are broken,
//      what the computed styles and geometry of an element are. Nothing here clicks, focuses, scrolls or re-renders.
//
// The scanning itself does not happen here. window.__labA11y.checkpoint() asks the Node side (the Playwright MCP
// --init-page hook) over an exposed binding, so axe-core, the accessibility tree and the evidence files all use the
// lab's existing Node code on this same page. If no bridge is attached, checkpoint() says so instead of faking a scan.
(function labA11yHelper() {
  if (globalThis.__labA11y && globalThis.__labA11y.version) return;
  const MAX = { events: 200, focus: 100, live: 100, announcements: 100, text: 4000, selectors: 20 };
  const now = () => Math.round(performance.now());
  const clean = (s, n) => { const t = String(s == null ? '' : s).replace(/\s+/g, ' ').trim(); return t.length > n ? t.slice(0, n - 1) + '…' : t; };

  const journal = { started: Date.now(), events: [], focus: [], mutations: 0 };
  const getDrupal = () => { try { return window.Drupal || null; } catch (e) { return null; } };

  // ---- element description: what a person would call it, and how to find it again without an MCP element ref.
  function uniqueSelector(el) {
    if (!el || el.nodeType !== 1) return null;
    const unique = (sel) => { try { return document.querySelectorAll(sel).length === 1; } catch (e) { return false; } };
    if (el.id && unique('#' + CSS.escape(el.id))) return '#' + CSS.escape(el.id);
    const parts = [];
    for (let node = el; node && node.nodeType === 1 && node !== document.documentElement && parts.length < 8; node = node.parentElement) {
      if (node.id && unique('#' + CSS.escape(node.id))) { parts.unshift('#' + CSS.escape(node.id)); break; }
      let part = node.localName;
      const parent = node.parentElement;
      if (parent) {
        const same = [].slice.call(parent.children).filter(function (c) { return c.localName === node.localName; });
        if (same.length > 1) part += ':nth-of-type(' + (same.indexOf(node) + 1) + ')';
      }
      parts.unshift(part);
    }
    return parts.length ? parts.join(' > ') : null;
  }

  function labelText(el) {
    if (!el || el.nodeType !== 1) return null;
    const fromIds = (attr) => {
      const ids = String(el.getAttribute(attr) || '').split(/\s+/).filter(Boolean);
      if (!ids.length) return null;
      return ids.map(function (id) { const t = document.getElementById(id); return t ? clean(t.textContent, 160) : null; }).filter(Boolean).join(' ') || null;
    };
    const labelled = fromIds('aria-labelledby');
    if (labelled) return labelled;
    if (el.getAttribute('aria-label')) return clean(el.getAttribute('aria-label'), 160);
    if (el.labels && el.labels.length) return clean(el.labels[0].textContent, 160);
    if (el.localName === 'img' || el.localName === 'area') return el.getAttribute('alt') !== null ? clean(el.getAttribute('alt'), 160) : null;
    if (el.localName === 'input' || el.localName === 'select' || el.localName === 'textarea') {
      if (el.type === 'button' || el.type === 'submit' || el.type === 'reset') return clean(el.value, 160) || null;
      return null;   // a field's value is never evidence
    }
    if (/^(button|a|summary|option|label|legend|h1|h2|h3|h4|h5|h6|td|th|caption|figcaption|dt)$/.test(el.localName)) return clean(el.textContent, 160) || null;
    const role = el.getAttribute('role');
    if (role && /^(button|link|tab|menuitem|option|heading|checkbox|radio|switch|treeitem|cell|columnheader)$/.test(role)) return clean(el.textContent, 160) || null;
    return clean(el.getAttribute('title'), 160) || null;
  }

  function describe(el) {
    if (!el || el.nodeType !== 1) return null;
    if (el === document.body) return { tag: 'body', selector: 'body', role: null, name: null };
    const role = el.getAttribute('role') || implicitRole(el);
    return {
      tag: el.localName,
      id: el.id || null,
      selector: uniqueSelector(el),
      role: role || null,
      name: labelText(el),
      type: el.getAttribute('type') || null,
      expanded: el.hasAttribute('aria-expanded') ? el.getAttribute('aria-expanded') : null,
      selected: el.hasAttribute('aria-selected') ? el.getAttribute('aria-selected') : null,
      checked: el.localName === 'input' && (el.type === 'checkbox' || el.type === 'radio') ? !!el.checked : (el.hasAttribute('aria-checked') ? el.getAttribute('aria-checked') : null),
      disabled: el.disabled === true || el.getAttribute('aria-disabled') === 'true',
      focused: true,
      focusVisible: (function () { try { return el.matches(':focus-visible'); } catch (e) { return null; } })(),
      inDialog: !!el.closest('[role=dialog],[role=alertdialog],dialog[open]'),
    };
  }

  function implicitRole(el) {
    const t = el.localName;
    if (t === 'a' && el.hasAttribute('href')) return 'link';
    if (t === 'button' || t === 'summary') return 'button';
    if (t === 'h1' || t === 'h2' || t === 'h3' || t === 'h4' || t === 'h5' || t === 'h6') return 'heading';
    if (t === 'nav') return 'navigation';
    if (t === 'main') return 'main';
    if (t === 'header') return 'banner';
    if (t === 'footer') return 'contentinfo';
    if (t === 'aside') return 'complementary';
    if (t === 'ul' || t === 'ol') return 'list';
    if (t === 'li') return 'listitem';
    if (t === 'img') return 'img';
    if (t === 'dialog') return 'dialog';
    if (t === 'input') {
      const type = (el.getAttribute('type') || 'text').toLowerCase();
      if (type === 'checkbox') return 'checkbox';
      if (type === 'radio') return 'radio';
      if (type === 'range') return 'slider';
      if (type === 'button' || type === 'submit' || type === 'reset') return 'button';
      if (type === 'search') return 'searchbox';
      return 'textbox';
    }
    if (t === 'select') return el.multiple ? 'listbox' : 'combobox';
    if (t === 'textarea') return 'textbox';
    return null;
  }

  // ---- observation only: no preventDefault, no focus(), no click(). Capture phase so the record is complete even if
  // the page stops propagation.
  function recordEvent(kind, target, extra) {
    try {
      const d = describe(target);
      journal.events.push(Object.assign({ t: now(), kind: kind, target: d, trusted: true, page: location.pathname }, extra || {}));
      if (journal.events.length > MAX.events) journal.events.splice(0, journal.events.length - MAX.events);
    } catch (e) { /* a page that throws in a getter must not break the run */ }
  }
  addEventListener('pointerdown', function (e) { if (e.isTrusted) recordEvent('pointerdown', e.target, { button: e.button }); }, true);
  addEventListener('keydown', function (e) {
    if (!e.isTrusted) return;
    if (['Shift', 'Control', 'Alt', 'Meta', 'OS'].includes(e.key)) return;
    const mods = [e.ctrlKey && 'Control', e.altKey && 'Alt', e.metaKey && 'Meta', e.shiftKey && e.key.length > 1 && 'Shift'].filter(Boolean);
    // Never the typed character: a field's value is private. A named key is enough to reproduce the interaction.
    const typed = e.key.length === 1;
    recordEvent(typed ? 'typing' : 'key', e.target, { key: typed ? 'character' : [].concat(mods, [e.key]).join('+'), modifiers: mods });
  }, true);
  addEventListener('focusin', function (e) {
    if (!e.isTrusted) return;
    journal.focus.push({ t: now(), to: describe(e.target), from: describe(e.relatedTarget) });
    if (journal.focus.length > MAX.focus) journal.focus.splice(0, journal.focus.length - MAX.focus);
  }, true);
  addEventListener('focusout', function (e) { if (e.isTrusted) journal.lastBlur = { t: now(), from: describe(e.target), to: describe(e.relatedTarget) }; }, true);

  // Open/expanded/selected state changes: the journal records the change even when nothing visible moves.
  try {
    new MutationObserver(function (records) {
      journal.mutations += records.length;
      for (let i = 0; i < records.length && i < 20; i++) {
        const r = records[i];
        const el = r.target && r.target.nodeType === 1 ? r.target : (r.target && r.target.parentElement);
        if (!el || !el.getAttribute) continue;
        if (!el.hasAttribute('aria-expanded') && !el.hasAttribute('aria-selected') && !el.hasAttribute('open') && !el.hasAttribute('aria-hidden') && r.type !== 'attributes') continue;
        journal.events.push({ t: now(), kind: 'state-change', target: describe(el), attribute: r.attributeName || null, page: location.pathname, trusted: false });
        if (journal.events.length > MAX.events) journal.events.shift();
      }
    }).observe(document.documentElement, { attributes: true, attributeFilter: ['aria-expanded', 'aria-selected', 'open', 'aria-hidden', 'hidden', 'disabled', 'aria-disabled', 'aria-checked', 'value'], subtree: true, childList: true });
  } catch (e) { /* no MutationObserver: the journal is smaller, the helper still works */ }

  // ---- state(): the application facts a checkpoint records. Read-only.
  function accessibleRefs() {
    const IDREFS = ['aria-labelledby', 'aria-describedby', 'aria-controls', 'aria-errormessage', 'aria-details', 'aria-owns', 'aria-activedescendant', 'aria-flowto', 'for', 'headers'];
    const ids = new Map();
    document.querySelectorAll('[id]').forEach(function (el) { ids.set(el.id, (ids.get(el.id) || 0) + 1); });
    const broken = [];
    for (const el of document.querySelectorAll('[aria-labelledby],[aria-describedby],[aria-controls],[aria-errormessage],[aria-details],[aria-owns],[aria-activedescendant],[aria-flowto],[for],[headers]')) {
      for (const attr of IDREFS) {
        if (!el.hasAttribute(attr)) continue;
        for (const id of String(el.getAttribute(attr)).split(/\s+/).filter(Boolean)) {
          const count = ids.get(id) || 0;
          const label = attr === 'for' ? (el.getAttribute('aria-label') || el.localName) : (el.getAttribute('aria-label') || labelText(el) || el.localName);
          if (count === 1) continue;
          broken.push({ element: describe(el), selector: uniqueSelector(el), attr: attr, id: id, count: count, problem: count ? 'duplicate' : 'missing', name: clean(label, 80) });
        }
      }
    }
    return broken.slice(0, 200);
  }

  function isOpenDialog(el) {
    if (el.localName === 'dialog') return !!el.open;
    if (el.getAttribute('aria-hidden') === 'true' || el.hidden) return false;
    try { return el.checkVisibility({ visibilityProperty: true }); } catch (e) { return true; }
  }

  function collect(selector) {
    const out = { dialogs: [], details: [], expanded: [], selected: [], formErrors: [], landmarks: [], headings: [], messages: [], tooltips: [], tabs: [], menus: [], listboxes: [] };
    document.querySelectorAll('dialog, [role=dialog], [role=alertdialog]').forEach(function (el) {
      const open = el.localName === 'dialog' ? el.hasAttribute('open') : (el.getAttribute('aria-hidden') !== 'true' && !el.hidden);
      out.dialogs.push({ selector: uniqueSelector(el), tag: el.localName, role: el.getAttribute('role'), name: labelText(el), open: open && isOpenDialog(el), modal: el.getAttribute('aria-modal') === 'true' || (el.localName === 'dialog' && el.showModal && el.hasAttribute('open')) });
    });
    document.querySelectorAll('details').forEach(function (el) { out.details.push({ selector: uniqueSelector(el), open: !!el.open, summary: clean(el.querySelector('summary') && el.querySelector('summary').textContent, 120) }); });
    document.querySelectorAll('[aria-expanded]').forEach(function (el) { out.expanded.push({ selector: uniqueSelector(el), tag: el.localName, role: el.getAttribute('role') || implicitRole(el), name: labelText(el), expanded: el.getAttribute('aria-expanded'), controls: el.getAttribute('aria-controls'), controlsResolved: (function () { const ids = String(el.getAttribute('aria-controls') || '').split(/\s+/).filter(Boolean); return ids.length ? ids.map(function (id) { return !!document.getElementById(id); }) : []; })() }); });
    document.querySelectorAll('[aria-selected], [aria-checked], input:checked').forEach(function (el) {
      out.selected.push({ selector: uniqueSelector(el), tag: el.localName, role: el.getAttribute('role') || implicitRole(el), name: labelText(el), selected: el.getAttribute('aria-selected'), checked: el.localName === 'input' ? !!el.checked : el.getAttribute('aria-checked') });
    });
    document.querySelectorAll('[aria-invalid="true"], [aria-errormessage], .form-item--error, [id$="-error"]').forEach(function (el) {
      const errId = el.getAttribute('aria-errormessage') || el.getAttribute('aria-describedby');
      const errEl = errId ? document.getElementById(String(errId).split(/\s+/)[0]) : null;
      const item = el.closest ? el.closest('.form-item, [data-drupal-form-item], fieldset') : null;
      const visibleError = errEl || (item && item.querySelector('.form-item--error-message, .messages--error, [id$="-error"]')) || (el.classList.contains('form-item--error') ? el : null);
      out.formErrors.push({ selector: uniqueSelector(el), tag: el.localName, name: labelText(el), invalid: el.getAttribute('aria-invalid'), errormessage: errId || null, errormessageResolved: !!errEl, errorText: clean(visibleError ? visibleError.textContent : '', 300) });
    });
    document.querySelectorAll('main, nav, aside, header, footer, form, section[aria-label], section[aria-labelledby], [role=main], [role=navigation], [role=complementary], [role=banner], [role=contentinfo], [role=search], [role=region], [role=form]').forEach(function (el) {
      out.landmarks.push({ selector: uniqueSelector(el), tag: el.localName, role: el.getAttribute('role') || implicitRole(el), name: labelText(el) });
    });
    document.querySelectorAll('h1,h2,h3,h4,h5,h6,[role=heading]').forEach(function (el) {
      const level = el.localName === 'h' || /^h[1-6]$/.test(el.localName) ? Number(el.localName[1]) : Number(el.getAttribute('aria-level')) || null;
      out.headings.push({ selector: uniqueSelector(el), level: level, name: clean(el.textContent, 160) });
    });
    document.querySelectorAll('[role=alert],[role=status],[role=log],[role=tooltip],[aria-live]:not([aria-live=off])').forEach(function (el) {
      const rec = { selector: uniqueSelector(el), role: el.getAttribute('role'), ariaLive: el.getAttribute('aria-live'), text: clean(el.textContent, 400), hidden: el.getAttribute('aria-hidden') === 'true' || !el.checkVisibility || !el.checkVisibility({ visibilityProperty: true }) };
      if (el.getAttribute('role') === 'tooltip') out.tooltips.push(rec); else out.messages.push(rec);
    });
    document.querySelectorAll('[role=tablist],[role=tab]').forEach(function (el) { out.tabs.push({ selector: uniqueSelector(el), role: el.getAttribute('role'), name: labelText(el), selected: el.getAttribute('aria-selected') }); });
    document.querySelectorAll('[role=menu],[role=menubar],[role=menuitem]').forEach(function (el) { out.menus.push({ selector: uniqueSelector(el), role: el.getAttribute('role'), name: labelText(el), expanded: el.getAttribute('aria-expanded') }); });
    document.querySelectorAll('[role=listbox],[role=option]').forEach(function (el) { out.listboxes.push({ selector: uniqueSelector(el), role: el.getAttribute('role'), name: labelText(el), selected: el.getAttribute('aria-selected') }); });
    if (selector) {
      const root = document.querySelector(selector);
      out.scope = root ? { selector: selector, found: true, name: labelText(root), role: root.getAttribute('role') || implicitRole(root) } : { selector: selector, found: false };
    }
    out.visibleText = clean(document.body ? document.body.innerText : '', MAX.text);
    out.activeElement = describe(document.activeElement);
    out.ariaBrokenRefs = accessibleRefs();
    out.openedDialogs = out.dialogs.filter(function (d) { return d.open; }).length;
    out.ckeditor = { present: !!document.querySelector('.ck-editor__editable, .ck.ck-editor, [data-ckeditor5-root]'), editables: document.querySelectorAll('.ck-editor__editable,[contenteditable=true]').length, toolbars: document.querySelectorAll('.ck-toolbar, [role=toolbar]').length };
    return out;
  }

  // ---- visual(): computed styles, geometry, contrast, clipping, occlusion, pseudo-elements and icons for one element.
  function parseColor(value) {
    if (!value) return null;
    const m = /^rgba?\(([^)]+)\)$/.exec(String(value).trim());
    if (!m) return null;
    const parts = m[1].split(/[,\s/]+/).filter(Boolean).map(Number);
    if (parts.length < 3 || parts.some(function (n) { return Number.isNaN(n); })) return null;
    return { r: parts[0], g: parts[1], b: parts[2], a: parts.length > 3 ? parts[3] : 1, css: String(value) };
  }
  function luminance(c) {
    const f = function (v) { const s = v / 255; return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b);
  }
  function blend(fg, bg) {
    const a = fg.a == null ? 1 : fg.a;
    return { r: fg.r * a + bg.r * (1 - a), g: fg.g * a + bg.g * (1 - a), b: fg.b * a + bg.b * (1 - a), a: 1 };
  }
  function contrastRatio(a, b) { const l1 = luminance(a), l2 = luminance(b); const hi = Math.max(l1, l2), lo = Math.min(l1, l2); return (hi + 0.05) / (lo + 0.05); }
  function effectiveBackground(el) {
    const chain = [];
    let node = el;
    let background = { r: 255, g: 255, b: 255, a: 1 };
    const layers = [];
    while (node && node.nodeType === 1) {
      const cs = getComputedStyle(node);
      const bg = parseColor(cs.backgroundColor);
      if (bg && bg.a > 0) layers.push({ selector: uniqueSelector(node), color: bg, image: cs.backgroundImage && cs.backgroundImage !== 'none' ? 'present' : null });
      node = node.parentElement;
    }
    for (let i = layers.length - 1; i >= 0; i--) background = blend(layers[i].color, background);
    for (const l of layers) chain.push({ selector: l.selector, backgroundColor: l.color.css, backgroundImage: l.image });
    return { effectiveBackground: 'rgb(' + Math.round(background.r) + ', ' + Math.round(background.g) + ', ' + Math.round(background.b) + ')', backgroundChain: chain, approximation: 'background layers blended without images or gradients; re-check by eye where an image or gradient is present' };
  }
  function clippingAncestors(el) {
    const out = [];
    const rect = el.getBoundingClientRect();
    for (let node = el.parentElement; node && node.nodeType === 1 && out.length < 12; node = node.parentElement) {
      const cs = getComputedStyle(node);
      const clips = /(hidden|clip|auto|scroll)/.test(cs.overflow + ' ' + cs.overflowX + ' ' + cs.overflowY) || cs.clip !== 'auto' || cs.clipPath !== 'none';
      if (!clips) continue;
      const r = node.getBoundingClientRect();
      const clipped = rect.left < r.left - 0.5 || rect.top < r.top - 0.5 || rect.right > r.right + 0.5 || rect.bottom > r.bottom + 0.5;
      out.push({ selector: uniqueSelector(node), overflow: [cs.overflowX, cs.overflowY].join('/'), scrollable: node.scrollHeight > node.clientHeight + 1 || node.scrollWidth > node.clientWidth + 1, scrollSize: [node.scrollWidth, node.scrollHeight], clientSize: [node.clientWidth, node.clientHeight], clipsElement: clipped });
    }
    return out;
  }
  function occlusion(el, rect) {
    if (!document.elementFromPoint) return { checked: false, reason: 'elementFromPoint unavailable' };
    const points = [[rect.left + rect.width / 2, rect.top + rect.height / 2], [rect.left + 2, rect.top + 2], [rect.right - 2, rect.top + 2], [rect.left + 2, rect.bottom - 2], [rect.right - 2, rect.bottom - 2]];
    const hits = [];
    for (const p of points) {
      if (p[0] < 0 || p[1] < 0 || p[0] > innerWidth || p[1] > innerHeight) { hits.push({ point: p.map(Math.round), result: 'outside-viewport' }); continue; }
      const hit = document.elementFromPoint(p[0], p[1]);
      if (!hit) { hits.push({ point: p.map(Math.round), result: 'none' }); continue; }
      const related = hit === el || el.contains(hit) || hit.contains(el);
      hits.push({ point: p.map(Math.round), result: related ? 'element' : 'occluded', occludedBy: related ? null : describe(hit) });
    }
    return { checked: true, points: hits, occluded: hits.some(function (h) { return h.result === 'occluded'; }), obscuredByFocus: hits.some(function (h) { return h.result === 'occluded' && h.occludedBy && h.occludedBy.focused; }) };
  }
  function iconEvidence(cs) {
    const image = cs.backgroundImage || 'none';
    const mask = cs.maskImage || cs.webkitMaskImage || 'none';
    const urls = [];
    const grab = function (v) { const r = /url\("?([^")]+)"?\)/g; let m; while ((m = r.exec(v || ''))) urls.push(m[1]); };
    grab(image); grab(mask);
    return { backgroundImage: image, maskImage: mask, declared: image !== 'none' || mask !== 'none', backgroundSize: cs.backgroundSize, maskSize: cs.maskSize || cs.webkitMaskSize || null, urls: urls.slice(0, 4), note: 'A declaration is not proof the icon is visible. Check the rendered screenshot and forced-colours mode.' };
  }
  function pseudo(el, which) {
    const cs = getComputedStyle(el, which);
    if (!cs) return null;
    return {
      content: cs.content, display: cs.display, color: cs.color, backgroundColor: cs.backgroundColor, backgroundImage: cs.backgroundImage, maskImage: cs.maskImage || cs.webkitMaskImage || null,
      width: cs.width, height: cs.height, position: cs.position, visibility: cs.visibility, opacity: cs.opacity, icon: iconEvidence(cs),
    };
  }
  function visual(options) {
    const selector = typeof options === 'string' ? options : (options && options.selector) || null;
    const el = selector ? document.querySelector(selector) : (document.activeElement && document.activeElement !== document.body ? document.activeElement : (options && options.fallback ? document.querySelector(options.fallback) : null));
    if (!el) return { ok: false, reason: selector ? 'selector not found: ' + selector : 'no element selected and nothing is focused' };
    const cs = getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    const fg = parseColor(cs.color);
    const bg = effectiveBackground(el);
    const bgColor = parseColor(bg.effectiveBackground);
    const ratio = fg && bgColor ? Math.round(contrastRatio(blend(fg, bgColor), bgColor) * 100) / 100 : null;
    const fontSize = parseFloat(cs.fontSize) || null;
    const bold = (Number(cs.fontWeight) || 400) >= 700;
    const large = !!fontSize && (fontSize >= 24 || (fontSize >= 18.66 && bold));
    const viewport = { width: innerWidth, height: innerHeight };
    const intersection = { inside: rect.left >= 0 && rect.top >= 0 && rect.right <= viewport.width && rect.bottom <= viewport.height, visibleWidth: Math.max(0, Math.min(rect.right, viewport.width) - Math.max(rect.left, 0)), visibleHeight: Math.max(0, Math.min(rect.bottom, viewport.height) - Math.max(rect.top, 0)), viewport: viewport };
    const outline = { style: cs.outlineStyle, width: cs.outlineWidth, color: cs.outlineColor, offset: cs.outlineOffset, boxShadow: cs.boxShadow };
    const focusVisible = (function () { try { return el.matches(':focus-visible'); } catch (e) { return null; } })();
    return {
      ok: true,
      selector: selector || uniqueSelector(el),
      element: describe(el),
      computedStyle: {
        display: cs.display, visibility: cs.visibility, opacity: cs.opacity, position: cs.position, zIndex: cs.zIndex,
        color: cs.color, backgroundColor: cs.backgroundColor, backgroundImage: cs.backgroundImage,
        font: [cs.fontSize, cs.fontWeight, cs.fontFamily].join(' '), lineHeight: cs.lineHeight, letterSpacing: cs.letterSpacing,
        border: [cs.borderTopWidth, cs.borderStyle, cs.borderTopColor].join(' '), borderRadius: cs.borderRadius,
        overflow: [cs.overflowX, cs.overflowY].join('/'), transform: cs.transform, filter: cs.filter, clipPath: cs.clipPath,
      },
      contrast: {
        foreground: cs.color, background: bg.effectiveBackground, ratio: ratio,
        required: large ? 3 : 4.5, meets: ratio == null ? null : ratio >= (large ? 3 : 4.5),
        textSize: { px: fontSize, bold: bold, large: large }, method: 'computed colors, background layers blended; ' + bg.approximation,
        limitations: 'Does not evaluate text over images or gradients; that is a manual check.',
      },
      geometry: {
        rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height, top: rect.top, left: rect.left, right: rect.right, bottom: rect.bottom },
        scroll: { width: el.scrollWidth, height: el.scrollHeight, clientWidth: el.clientWidth, clientHeight: el.clientHeight },
        viewportIntersection: intersection,
        clippingAncestors: clippingAncestors(el),
        occlusion: occlusion(el, rect),
        scrollable: el.scrollHeight > el.clientHeight + 1 || el.scrollWidth > el.clientWidth + 1,
      },
      focus: { focused: document.activeElement === el, focusVisible: focusVisible, indicator: outline, indicatorPresent: !!(outline.style && outline.style !== 'none' && parseFloat(outline.width) > 0) || (outline.boxShadow && outline.boxShadow !== 'none'), note: document.activeElement === el ? 'The element is focused; the indicator was read, not triggered.' : 'The element is not focused. Use trusted keyboard input to focus it, then capture the checkpoint; this helper never moves focus.' },
      pseudo: { before: pseudo(el, '::before'), after: pseudo(el, '::after') },
      icon: iconEvidence(cs),
      screenshotHints: { needsScroll: !intersection.inside, rectInPage: { x: rect.x + scrollX, y: rect.y + scrollY, width: rect.width, height: rect.height } },
    };
  }

  function focusState() {
    const el = document.activeElement;
    const dialogs = [].slice.call(document.querySelectorAll('dialog, [role=dialog], [role=alertdialog]')).filter(isOpenDialog).map(function (d) { return { selector: uniqueSelector(d), name: labelText(d) }; });
    return {
      active: describe(el),
      focusVisible: (function () { try { return el ? el.matches(':focus-visible') : null; } catch (e) { return null; } })(),
      trail: journal.focus.slice(-20),
      lastBlur: journal.lastBlur || null,
      dialog: el && el.closest ? (function () { const d = el.closest('[role=dialog],[role=alertdialog],dialog[open]'); return d ? { selector: uniqueSelector(d), name: labelText(d) } : null; })() : null,
      dialogsOpen: dialogs.length,
      bodyFocus: !el || el === document.body,
    };
  }

  function speechState() {
    const lab = window.__lab || null;
    try { if (lab && typeof lab.flush === 'function') lab.flush(); } catch (e) { /* recorder unavailable */ }
    return {
      recorder: lab ? { announce: (lab.announce || []).slice(-MAX.announcements), live: (lab.live || []).slice(-MAX.live), changes: (lab.changes || []).slice(-MAX.live) } : null,
      helperEvents: journal.events.slice(-MAX.events),
      mutationsObserved: journal.mutations,
    };
  }

  const bridge = function () { return typeof window.__labA11yBridge === 'function' ? window.__labA11yBridge : null; };
  async function callBridge(action, payload) {
    const fn = bridge();
    if (!fn) {
      throw new Error('No accessibility checkpoint bridge is attached to this page. Launch Playwright MCP with the Lab config (.mcp.json --init-page), then call this from the MCP page. Nothing was scanned.');
    }
    return fn({ action: action, payload: payload || {} });
  }

  const api = {
    version: '1.0.0',
    // Agent entry points: the scan/evidence work happens on the Node side, over the exposed binding.
    checkpoint: function (options) { return callBridge('checkpoint', options || {}); },
    finish: function (options) { return callBridge('finish', options || {}); },
    engines: function () { return callBridge('engines', {}); },
    session: function () { return callBridge('session', {}); },
    // Local, read-only probe entry points (also used by the Node side).
    state: function (options) { return collect(options && options.scope); },
    focus: focusState,
    speech: speechState,
    journal: function () { return { events: journal.events.slice(), focus: journal.focus.slice(), started: journal.started }; },
    visual: visual,
    describe: describe,
    helper: function () {
      return 'Lab accessibility checkpoints. Call one at a meaningful application state (never just after page load only):\n' +
        '  __labA11y.checkpoint({ id: "dialog-open", label: "Image dialog open", profile: "quick" })\n' +
        '  profiles: quick (axe + focus), semantic (tree/relations), visual (styles/geometry), dynamic (announcements/AJAX/focus), multi-engine, full\n' +
        '  options: scope/selector, include, exclude, tags, rules, bestPractice, readiness (selector or expression), note, question\n' +
        '  __labA11y.state() / focus() / visual({ selector }) / speech() / journal() are read-only probes.\n' +
        '  __labA11y.finish() writes and summarises the session. Nothing here reloads the page or changes state.';
    },
  };
  Object.defineProperty(globalThis, '__labA11y', { value: api, configurable: true, writable: false });
})();
