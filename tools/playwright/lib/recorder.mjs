// The recorder lib/lab-run.mjs adds to every page of a run, before the page's own scripts. No imports: it runs in the browser, and
// tests load it without Playwright installed.
//
// It observes; it does not change what the page does (Drupal.announce is wrapped and passes every call through). window.__lab holds:
//   announce  every Drupal.announce() call (text, priority);
//   live      every change of text inside a live region ([role=alert|status|log], [aria-live]), with whether the page was loading;
//   changes   after each real (trusted) click, key press or typing: the text that appeared or changed on the page, and how a
//             screen reader user would learn of it (the "how" of each line):
//               live       inside a live region, so it is announced;
//               announced  Drupal.announce() was called after the same action;
//               focus      focus moved to it, or into the dialog holding it, or it describes the focused control;
//               disclosed  inside what the control the user pressed now shows as expanded (aria-expanded + aria-controls, or
//                          an opened <details>);
//               control    inside the control the user pressed or the focused one (its own label or value text);
//               name       the name of another control: a button, link, tab or field label that appeared or changed (a new
//                          control is not a status message; a toolbar that regroups when there is room shows these);
//               silent     none of these: a candidate for WCAG 2.2 SC 4.1.3 Status Messages, for a person to judge.
//             Each is sent to the run as soon as its window ends (window.__labReport, bound by lib/lab-run.mjs; kept in
//             window.__lab.changes when nothing listens). The window of an action ends at the next action, when lib/lab-run.mjs
//             collects (window.__lab.flush()), or after
//             10 seconds. What is compared is each text node the page renders (visually hidden text included), so text that
//             only became visible counts as new, and text a re-render put back unchanged does not.
export const RECORDER = () => {
  const speech = { announce: [], live: [], changes: [] };
  Object.defineProperty(window, '__lab', { value: speech });
  let win = null, timer = 0;   // the open action window
  const hook = (d) => {
    if (!d || typeof d !== 'object' || d.__labHooked) return;
    let real = d.announce;
    Object.defineProperty(d, '__labHooked', { value: true });
    Object.defineProperty(d, 'announce', {
      configurable: true,
      set(fn) { real = fn; },
      get() { return real && function (text, priority) { speech.announce.push({ t: Math.round(performance.now()), text: String(text), priority: priority || 'polite' }); if (win) win.announced.push(String(text).slice(0, 200)); return real.apply(this, arguments); }; },
    });
  };
  let D;
  Object.defineProperty(window, 'Drupal', { configurable: true, get() { return D; }, set(d) { D = d; hook(d); } });
  const SEL = '[role=alert],[role=status],[role=log],[aria-live]:not([aria-live=off])';
  const pending = new Set(); let queued = false;
  const flush = () => {
    queued = false;
    for (const r of pending) {
      const text = (r.textContent || '').replace(/\s+/g, ' ').trim();
      if (text && text !== r.__labLast) speech.live.push({ t: Math.round(performance.now()), role: r.getAttribute('role'), ariaLive: r.getAttribute('aria-live'), id: r.id || null, cls: (r.className && String(r.className).slice(0, 80)) || null, loading: document.readyState !== 'complete', text: text.slice(0, 400) });
      r.__labLast = text;
    }
    pending.clear();
  };
  new MutationObserver((ms) => {
    for (const m of ms) for (const n of [m.target, ...m.addedNodes]) {
      const el = n.nodeType === 1 ? n : n.parentElement; if (!el || !el.closest) continue;
      for (const r of [el.closest(SEL), ...(el.querySelectorAll ? el.querySelectorAll(SEL) : [])]) if (r && r.id !== 'drupal-live-announce') pending.add(r);
    }
    if (!queued && pending.size) { queued = true; queueMicrotask(flush); }
  }).observe(document, { childList: true, subtree: true, characterData: true });

  // ---- Changes after user input
  const LIVE = '[aria-live]:not([aria-live=off]),[role=alert],[role=status],[role=log],[role=marquee],[role=timer],output';
  const NAMES = 'a[href],button,summary,label,legend,[role=button],[role=link],[role=tab],[role=menuitem],[role=option],[role=checkbox],[role=radio],[role=switch]';
  const NO_TEXT = /^(script|style|noscript|template|title|select|option|optgroup|datalist|textarea)$/;   // not page text, or a field's value
  const short = (s, n = 40) => { const t = String(s ?? '').replace(/\s+/g, ' ').trim(); return t.length > n ? t.slice(0, n - 1) + '…' : t; };
  const who = (el) => (!el || el.nodeType !== 1 ? '' : el.localName + (el.id ? `#${el.id}` : el.getAttribute('name') ? `[name="${el.getAttribute('name')}"]` : el.classList.length ? '.' + [...el.classList].slice(0, 2).join('.') : ''));
  const control = (el) => { const e = el && el.nodeType === 1 ? el : el && el.parentElement; const c = e ? e.closest('a[href],button,input,select,textarea,summary,[role],[tabindex],[contenteditable]') || e : null; return c === document.body || c === document.documentElement ? null : c; };
  const editable = (el) => !!el && (el.isContentEditable || el.localName === 'textarea' || (el.localName === 'input' && !/^(button|submit|reset|checkbox|radio|file|image|range|color)$/.test(el.type)));
  // A control's name for the record: never a field's value (what was typed stays out of the results).
  const label = (c) => short(c.getAttribute('aria-label') || (c.labels && c.labels[0] ? c.labels[0].innerText : '') || (/^(input|select|textarea)$/.test(c.localName) ? '' : c.innerText) || c.getAttribute('title') || '');
  const describe = (c) => (c ? `${who(c)}${label(c) ? ` "${label(c)}"` : ''}` : 'the page');
  // Every text node the page renders (visually hidden text included), with its text: what a screen reader could reach.
  const rendered = () => {
    const out = new Map(); if (!document.body) return out;
    const seen = new Map();
    const shown = (el) => {
      if (!seen.has(el)) seen.set(el, !NO_TEXT.test(el.localName) && (el.checkVisibility({ visibilityProperty: true }) || (getComputedStyle(el).display === 'contents' && !!el.parentElement && shown(el.parentElement))));
      return seen.get(el);
    };
    const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let n = tw.nextNode(); n; n = tw.nextNode()) { const d = n.data.replace(/\s+/g, ' ').trim(); if (d && n.parentElement && shown(n.parentElement)) out.set(n, d); }
    return out;
  };
  const start = (action, target) => {
    close();
    const c = control(target);
    win = { t: Math.round(performance.now()), action, on: describe(c), target: c, focus: document.activeElement, before: rendered(), announced: [] };
    timer = setTimeout(close, 10000);
  };
  // The nearest ancestor that is not inline: the text that changed inside it is reported as one change.
  const box = (el) => { while (el && el !== document.body && getComputedStyle(el).display.startsWith('inline')) el = el.parentElement; return el || document.body; };
  const close = () => {
    clearTimeout(timer);
    const w = win; win = null;
    if (!w || !document.body) return;
    const now = rendered();
    // Text is new when no text shown before can account for it: the same node with the same text first, then the same text in a
    // node that replaced it (an AJAX response that renders the same form again changes nothing).
    const left = new Map();
    for (const d of w.before.values()) left.set(d, (left.get(d) || 0) + 1);
    const fresh = [];
    for (const [n, d] of now) if (w.before.get(n) === d) left.set(d, left.get(d) - 1);
    for (const [n, d] of now) { if (w.before.get(n) === d) continue; if (left.get(d) > 0) left.set(d, left.get(d) - 1); else fresh.push(n); }
    if (!fresh.length) return;
    const groups = new Map();
    for (const n of fresh) { const b = box(n.parentElement); if (!groups.has(b)) groups.set(b, []); groups.get(b).push(n); }
    const f = document.activeElement, focused = f && f !== document.body ? f : null;
    const target = w.target && w.target.isConnected ? w.target : null;
    const moved = focused && focused !== w.focus && focused !== target;   // focus went somewhere other than the control pressed
    const ids = (el, attr) => (el.getAttribute(attr) || '').split(/\s+/).filter(Boolean).map((id) => document.getElementById(id)).filter(Boolean);
    const describes = (e) => focused && ['aria-describedby', 'aria-labelledby', 'aria-errormessage', 'aria-details'].some((a) => ids(focused, a).some((d) => d === e || d.contains(e) || e.contains(d)));
    const disclosed = (e) => {
      if (!target) return false;
      if (target.getAttribute('aria-expanded') === 'true' && ids(target, 'aria-controls').some((c) => c.contains(e))) return true;
      const d = target.localName === 'summary' && target.parentElement;
      return !!(d && d.localName === 'details' && d.open && d.contains(e));
    };
    const dialog = focused && focused.closest('[role=dialog],[role=alertdialog],dialog');
    const names = (e) => { const id = e.closest('[id]'); return !!id && !!document.querySelector(`[aria-labelledby~="${CSS.escape(id.id)}"]`); };
    const changes = [];
    for (const nodes of [...groups.values()].slice(0, 30)) {
      let e = nodes[0].parentElement;
      for (const n of nodes.slice(1)) while (e && !e.contains(n)) e = e.parentElement;   // the smallest element holding them all
      if (!e || e.closest('#drupal-live-announce')) continue;   // Drupal.announce()'s own region: recorded as an announcement
      const live = e.closest(LIVE);
      let how = 'silent';
      if (live) how = 'live';
      else if (w.announced.length) how = 'announced';
      else if ((moved && (focused.contains(e) || e.contains(focused) || (dialog && dialog.contains(e)))) || describes(e)) how = 'focus';
      else if (disclosed(e)) how = 'disclosed';
      else if ((target && target.contains(e)) || (focused && focused.contains(e))) how = 'control';
      else if (e.closest(NAMES) || names(e)) how = 'name';
      changes.push({ text: nodes.map((n) => now.get(n)).join(' ').slice(0, 200), where: who(e), how, ...(live ? { live: live.getAttribute('role') || (live.getAttribute('aria-live') ? `aria-live=${live.getAttribute('aria-live')}` : live.localName) } : {}), ...(how === 'announced' ? { announced: w.announced[0] } : {}) });
    }
    if (!changes.length) return;
    const record = { t: w.t, page: location.pathname, action: w.action, on: w.on, changes, ...(groups.size > 30 ? { more: groups.size - 30 } : {}) };
    // Straight to the run when it listens (lib/lab-run.mjs binds __labReport), so a later page load cannot lose it.
    if (typeof window.__labReport === 'function') return window.__labReport(record).catch(() => {});
    speech.changes.push(record);
  };
  Object.defineProperty(speech, 'flush', { value: close });   // not enumerable: page.evaluate(() => window.__lab) leaves it out
  addEventListener('pointerdown', (e) => { if (e.isTrusted) start('click', e.target); }, true);
  addEventListener('keydown', (e) => {
    if (!e.isTrusted || ['Shift', 'Control', 'Alt', 'Meta'].includes(e.key)) return;
    const mods = [e.ctrlKey && 'Control', e.altKey && 'Alt', e.metaKey && 'Meta', e.shiftKey && e.key.length > 1 && 'Shift'].filter(Boolean);
    const typed = !mods.length && editable(e.target) && (e.key.length === 1 || e.key === 'Backspace' || e.key === 'Delete');
    start(typed ? 'typing' : `key ${[...mods, e.key].join('+')}`, e.target);   // a word typed into a field is one row in the summary
  }, true);
  addEventListener('input', (e) => { if (e.isTrusted && !(win && performance.now() - win.t < 200)) start('typing', e.target); }, true);   // a fill() has no keydown
  addEventListener('pagehide', () => { clearTimeout(timer); win = null; });   // a new page is read from its start
};
