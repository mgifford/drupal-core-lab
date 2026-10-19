// Reads, from a page open in Playwright's Chromium, the three views tree-format.mjs describes: the accessibility tree (CDP),
// the ARIA attributes after JavaScript (with every ID reference looked up), and what the Guidepup virtual screen reader says
// moving through the page. Used by tools/playwright/tree-diff.mjs.
import { JSDOM, VirtualConsole } from 'jsdom';
import { virtual } from '@guidepup/virtual-screen-reader';
import { axTreeText } from './tree-format.mjs';

// Runs in the page. Lists the elements that carry ARIA or are controls, indented by how many listed elements contain them.
export const ARIA_VIEW = () => {
  const IDREFS = ['aria-activedescendant', 'aria-controls', 'aria-describedby', 'aria-details', 'aria-errormessage', 'aria-flowto', 'aria-labelledby', 'aria-owns', 'for', 'list', 'headers'];
  const LIST = new Set(['role', 'tabindex', 'hidden', 'inert', 'popover', 'contenteditable', ...IDREFS]);   // any of these lists an element
  const KEEP = new Set([...LIST, 'disabled', 'required', 'readonly', 'multiple', 'open', 'type', 'alt', 'autocomplete']);   // shown when listed
  const CONTROLS = new Set(['button', 'input', 'select', 'textarea', 'summary', 'details', 'dialog', 'iframe', 'img']);
  // Elements named from their content get their text as a hint (a container's would change whenever anything inside it moves).
  const FROM_CONTENT = new Set(['a', 'button', 'summary', 'label', 'legend', 'option', 'caption', 'th', 'td', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'dt', 'figcaption']);
  const FROM_CONTENT_ROLE = /^(button|link|tab|menuitem\w*|option|heading|cell|columnheader|rowheader|gridcell|treeitem|checkbox|radio|switch|tooltip)$/;
  const ids = new Map();
  for (const el of document.querySelectorAll('[id]')) ids.set(el.id, (ids.get(el.id) || 0) + 1);
  const short = (s, n = 40) => { const t = String(s ?? '').replace(/\s+/g, ' ').trim(); return t.length > n ? t.slice(0, n - 1) + '…' : t; };
  const who = (el) => el.localName + (el.id ? `#${el.id}` : el.getAttribute('name') ? `[name="${el.getAttribute('name')}"]` : el.classList.length ? '.' + [...el.classList].slice(0, 2).join('.') : '');
  const listed = (el) => {
    for (const a of el.attributes) if (a.name.startsWith('aria-') || LIST.has(a.name)) return true;
    return el.localName === 'a' || el.localName === 'area' ? el.hasAttribute('href') : CONTROLS.has(el.localName);
  };
  const lines = [], refs = [];
  const html = document.documentElement;
  lines.push(`html lang="${html.getAttribute('lang') ?? ''}" dir="${html.getAttribute('dir') ?? ''}"`);
  const walk = (el, depth) => {
    for (const c of el.children) {
      if (c.localName === 'head') continue;
      if (!listed(c)) { walk(c, depth); continue; }
      const parts = [who(c)];
      const text = short(c.getAttribute('aria-label') ?? (FROM_CONTENT.has(c.localName) || FROM_CONTENT_ROLE.test(c.getAttribute('role') || '') ? c.textContent : ''));
      if (text) parts.push(JSON.stringify(text));
      const attrs = [...c.attributes].filter((a) => a.name.startsWith('aria-') || KEEP.has(a.name)).sort((a, b) => (a.name === 'role' ? -1 : b.name === 'role' ? 1 : a.name.localeCompare(b.name)));
      for (const a of attrs) {
        let s = a.value === '' ? a.name : `${a.name}=${JSON.stringify(a.value)}`;
        if (IDREFS.includes(a.name)) for (const id of a.value.split(/\s+/).filter(Boolean)) {
          const count = ids.get(id) || 0;
          if (count === 1) continue;
          s += count ? ` [#${id} ×${count}]` : ` [missing #${id}]`;
          refs.push({ element: who(c), attr: a.name, id, problem: count ? 'duplicate' : 'missing', count });
        }
        parts.push(s);
      }
      if ((c.type === 'checkbox' || c.type === 'radio') && c.checked) parts.push('(checked)');
      if (getComputedStyle(c).display !== 'contents' && !c.checkVisibility({ visibilityProperty: true })) parts.push('(not rendered)');
      lines.push('  '.repeat(depth) + parts.join(' '));
      walk(c, depth + 1);
    }
  };
  walk(html, 0);
  return { text: lines.join('\n') + '\n', refs };
};

// Runs in the page. jsdom, where Guidepup runs, applies no stylesheets, so each element Chromium does not render (display:none,
// visibility:hidden, inside a closed <details>, ...) is marked to be hidden there, and an element with the hidden attribute that CSS
// shows anyway is marked to be shown. Returns the page's HTML with the marks and then removes them.
export const MARK_UNRENDERED = () => {
  let hidden = 0;
  const walk = (el) => {
    for (const c of el.children) {
      const contents = getComputedStyle(c).display === 'contents';   // no box of its own, but its children can have one
      if (!contents && !c.checkVisibility({ visibilityProperty: true })) { c.setAttribute('data-tree-diff', 'hidden'); hidden++; continue; }
      if (c.hidden) c.setAttribute('data-tree-diff', 'shown');
      if (!['svg', 'math', 'select', 'datalist'].includes(c.localName)) walk(c);   // their parts have no box of their own either
    }
  };
  walk(document.body);
  const html = '<!DOCTYPE html>\n' + document.documentElement.outerHTML;
  for (const el of document.querySelectorAll('[data-tree-diff]')) el.removeAttribute('data-tree-diff');
  return { html, hidden };
};

// CSS.escape (CSSOM spec), which Guidepup needs to look up ID references and Node does not have.
export function cssEscape(value) {
  const s = String(value); let out = '';
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    if (c === 0) out += '�';
    else if ((c >= 1 && c <= 31) || c === 127 || (i === 0 && c >= 48 && c <= 57) || (i === 1 && c >= 48 && c <= 57 && s.charCodeAt(0) === 45)) out += `\\${c.toString(16)} `;
    else if (i === 0 && s.length === 1 && c === 45) out += `\\${s[i]}`;
    else if (c >= 128 || c === 45 || c === 95 || (c >= 48 && c <= 57) || (c >= 65 && c <= 90) || (c >= 97 && c <= 122)) out += s[i];
    else out += `\\${s[i]}`;
  }
  return out;
}

// What Guidepup says from the start of the page to its end, one phrase per item, on HTML from MARK_UNRENDERED.
export async function speak(html, { maxItems = 5000 } = {}) {
  const dom = new JSDOM(html, { pretendToBeVisual: true, virtualConsole: new VirtualConsole() });
  const doc = dom.window.document;
  for (const el of doc.querySelectorAll('[data-tree-diff=hidden]')) el.hidden = true;
  for (const el of doc.querySelectorAll('[data-tree-diff=shown]')) el.hidden = false;
  for (const el of doc.querySelectorAll('style, link[rel~=stylesheet]')) el.remove();   // the marks say what is rendered, not jsdom's partial CSS
  for (const el of doc.querySelectorAll('[style]')) el.removeAttribute('style');
  const hadCss = 'CSS' in globalThis;
  if (!globalThis.CSS?.escape) globalThis.CSS = { escape: cssEscape };
  try {
    await virtual.start({ container: doc.body, window: dom.window, displayCursor: false });
    const phrases = [await virtual.lastSpokenPhrase()];
    for (let i = 0; i < maxItems; i++) {
      await virtual.next();
      const said = await virtual.lastSpokenPhrase();
      if (virtual.activeNode === doc.body) return said === phrases[0] ? phrases : [...phrases, said];   // "end of document", or back at the start
      phrases.push(said);
    }
    return [...phrases, `(stopped after ${maxItems} items)`];
  } finally {
    await virtual.stop().catch(() => {});
    dom.window.close();
    if (!hadCss) delete globalThis.CSS;
  }
}

// The three views of the page as it is now. Run MARK_UNRENDERED last: it changes the page for a moment.
export async function capturePage(page) {
  const cdp = await page.context().newCDPSession(page);
  let nodes;
  try { ({ nodes } = await cdp.send('Accessibility.getFullAXTree')); } finally { await cdp.detach().catch(() => {}); }
  const aria = await page.evaluate(ARIA_VIEW);
  const { html } = await page.evaluate(MARK_UNRENDERED);
  const phrases = await speak(html);
  return { axtree: axTreeText(nodes), aria: aria.text, refs: aria.refs, speech: phrases.join('\n') + '\n', spoken: phrases.length };
}
