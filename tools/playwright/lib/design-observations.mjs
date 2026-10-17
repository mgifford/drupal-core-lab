// Read-only initial-state inventory. Does not infer intended design or conformance.
import { printLayoutEvidence, motionEvidence } from './design-review.mjs';
import { browserThemeContext } from '../../compare/theme-context.mjs';

export async function observeDesign(page, { limit = 4000 } = {}) {
  const context = await page.evaluate(browserThemeContext);
  const data = await page.evaluate(async ({ limit }) => {
    const properties = ['display', 'visibility', 'position', 'fontWeight', 'fontStyle', 'fontSize', 'fontFamily', 'lineHeight', 'color', 'backgroundColor', 'borderTopStyle', 'borderBottomStyle', 'borderInlineStartStyle', 'borderInlineStartWidth', 'borderInlineStartColor', 'outlineStyle', 'outlineWidth', 'forcedColorAdjust', 'overflowX', 'overflowY', 'animationName', 'animationDuration', 'animationDelay', 'animationIterationCount', 'animationTimingFunction', 'transitionProperty', 'transitionDuration', 'transitionDelay', 'scrollBehavior'];
    const selector = element => {
      if (element.id && !/\d{6,}|--|^ck(?:editor)?[-_]|^c[0-9a-f]{16,}$/i.test(element.id)) return '#' + CSS.escape(element.id);
      const parts = [];
      for (let node = element; node && node !== document.documentElement; node = node.parentElement) {
        const siblings = [...(node.parentElement?.children || [])].filter(other => other.tagName === node.tagName);
        parts.unshift(node.tagName.toLowerCase() + ':nth-of-type(' + (siblings.indexOf(node) + 1) + ')');
      }
      return 'html>' + parts.join('>');
    };
    const hidden = element => {
      const own = getComputedStyle(element);
      if (own.visibility === 'hidden' || own.visibility === 'collapse') return true;
      for (let node = element; node; node = node.parentElement) if (getComputedStyle(node).display === 'none') return true;
      return !element.getClientRects().length;
    };
    const elements = [...document.querySelectorAll('body *')].filter(element => !element.closest('script,style,noscript,template') && !element.matches('input[type=hidden]'));
    const ids = new Map();
    for (const element of document.querySelectorAll('[id]')) ids.set(element.id, (ids.get(element.id) || 0) + 1);
    const targets = new Map();
    const digest = async value => [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)))].map(byte => byte.toString(16).padStart(2, '0')).join('');
    const targetEvidence = async target => {
      if (!targets.has(target)) targets.set(target, (async () => {
        const copy = target.cloneNode(true);
        copy.querySelectorAll('script,style,noscript,template,input,textarea,select,[contenteditable]').forEach(node => node.remove());
        const sensitive = target.matches('input,textarea,select,[contenteditable]');
        const text = sensitive ? '' : (copy.textContent || '').replace(/\s+/g, ' ').trim();
        return { key: selector(target), tag: target.tagName.toLowerCase(), role: target.getAttribute('role'),
          textHash: await digest(text), ariaLabelHash: await digest(target.getAttribute('aria-label') || ''),
          hidden: hidden(target), nestedNameReference: target.hasAttribute('aria-labelledby') };
      })());
      return targets.get(target);
    };
    const nodes = await Promise.all(elements.slice(0, limit).map(async element => {
      const css = getComputedStyle(element);
      const pseudo = name => {
        const style = getComputedStyle(element, name);
        return Object.fromEntries(['borderInlineStartStyle', 'borderInlineStartWidth', 'borderInlineStartColor', 'display', 'forcedColorAdjust'].map(key => [key, style[key]]));
      };
      const refs = {};
      for (const name of ['aria-describedby', 'aria-labelledby', 'aria-errormessage']) {
        refs[name] = await Promise.all((element.getAttribute(name) || '').split(/\s+/).filter(Boolean).map(async id => {
          const target = document.getElementById(id);
          return { id, exists: !!target, count: ids.get(id) || 0, target: target ? await targetEvidence(target) : null };
        }));
      }
      const semantic = /^(?:h[1-6]|label|legend|caption|th|button|a|summary|dt|em|strong)$/i.test(element.tagName) || element.hasAttribute('aria-label');
      const signature = semantic ? await targetEvidence(element) : null;
      const r = element.getBoundingClientRect();
      return {
        rect: Object.fromEntries(['x', 'y', 'width', 'height'].map(key => [key, Math.round(r[key] * 100) / 100])),
        region: element.closest('.ck-editor__editable, .ck-content') ? 'editor-content' : element.closest('.ck, .ck-editor') ? 'editor-ui' : element.closest('aside,nav,[role=navigation]') ? 'navigation' : 'page',
        semanticText: signature ? { textHash: signature.textHash, ariaLabelHash: signature.ariaLabelHash } : null,
        key: selector(element), localThemeMode: element.closest('[data-theme-mode]')?.getAttribute('data-theme-mode') || null, runningAnimations: element.getAnimations ? element.getAnimations().filter(animation => animation.playState === 'running').length : null, tag: element.tagName.toLowerCase(),
        role: element.getAttribute('role'), classes: [...element.classList].filter(value => !/\d{6,}/.test(value)).slice(0, 30),
        childTags: [...element.children].map(child => child.tagName.toLowerCase()),
        references: refs, hidden: hidden(element),
        style: Object.fromEntries(properties.map(key => [key, css[key]])),
        before: pseudo('::before'), after: pseudo('::after'),
      };
    }));
    // Inventory declared print rules. Readability gaps are explicit; this is not cascade resolution.
    const sheets = [], printRules = [], preferenceRules = []; const visited = new Set();
    const walk = (rules, media = []) => {
      for (const rule of rules) {
        const next = rule.media ? [...media, rule.media.mediaText] : media;
        if (rule.type === CSSRule.IMPORT_RULE && rule.styleSheet) { inspect(rule.styleSheet, next); continue; }
        if (rule.type === CSSRule.PAGE_RULE) printRules.push({ type: 'page', selector: rule.selectorText || '', media: next });
        if (rule.selectorText && next.some(value => /prefers-|forced-colors/i.test(value))) preferenceRules.push({ selector: rule.selectorText, media: next, properties: [...rule.style] });
        if (rule.selectorText && next.some(value => /\bprint\b/i.test(value))) printRules.push({ type: 'selector', selector: rule.selectorText, media: next, properties: [...rule.style] });
        if (rule.cssRules) walk(rule.cssRules, next);
      }
    };
    const inspect = (sheet, inherited = []) => {
      if (visited.has(sheet)) return; visited.add(sheet);
      let source = 'inline';
      try { if (sheet.href) { const url = new URL(sheet.href); source = url.origin === location.origin ? url.pathname : '[external]' + url.pathname; } } catch { source = 'unknown'; }
      const media = sheet.media?.mediaText ? [...inherited, sheet.media.mediaText] : inherited;
      try { walk(sheet.cssRules, media); sheets.push({ source, media, readable: true }); }
      catch { sheets.push({ source, media, readable: false }); }
    };
    for (const sheet of document.styleSheets) inspect(sheet);
    return { nodes, availableElements: elements.length, truncated: elements.length > limit, sheets, printRules, preferenceRules, media: { print: matchMedia('print').matches } };
  }, { limit });
  const snapshot = { context, ...data };
  snapshot.motion = motionEvidence(snapshot);
  snapshot.printLayout = data.media.print ? printLayoutEvidence(snapshot) : null;
  snapshot.editor = { uiElements: data.nodes.filter(node => node.region === 'editor-ui').length, contentElements: data.nodes.filter(node => node.region === 'editor-content').length, note: 'Rendered editor UI and content styles only; no content entry, formatting actions, or saved frontend rendering.' };
  return snapshot;
}

// Keep raw IDs as evidence, but compare ordered resolved relationships. Older
// snapshots without target evidence retain exact comparison rather than guessing.
function normalizedReferences(references) {
  return Object.fromEntries(Object.entries(references || {}).map(([name, values]) => [name, values.map(ref => {
    if (!ref.exists || !ref.target || ref.target.nestedNameReference) return ref;
    const { id, ...relationship } = ref;
    return relationship;
  })]));
}

export function compareObservations(before, after) {
  const b = new Map(before.nodes.map(node => [node.key, node]));
  const a = new Map(after.nodes.map(node => [node.key, node]));
  const changes = [], referenceIdChanges = [];
  for (const key of new Set([...b.keys(), ...a.keys()])) {
    const left = b.get(key), right = a.get(key);
    if (!left || !right) { changes.push({ key, kind: left ? 'unmatched-before' : 'unmatched-after' }); continue; }
    const different = {};
    for (const field of ['tag', 'role', 'semanticText', 'localThemeMode', 'childTags', 'references', 'hidden', 'style', 'before', 'after']) {
      const l = field === 'references' ? normalizedReferences(left[field]) : left[field];
      const r = field === 'references' ? normalizedReferences(right[field]) : right[field];
      if (JSON.stringify(l) !== JSON.stringify(r)) different[field] = { before: left[field], after: right[field] };
      else if (field === 'references' && JSON.stringify(left[field]) !== JSON.stringify(right[field])) {
        referenceIdChanges.push({ key, before: left[field], after: right[field], reason: 'Different IDs; same ordered target keys and captured signatures. Full accessible name not computed.' });
      }
    }
    if (Object.keys(different).length) changes.push({ key, kind: 'changed', different });
  }
  return { themeChanged: !!before.context.theme && !!after.context.theme && before.context.theme !== after.context.theme,
    themeComparable: !!before.context.theme && !!after.context.theme,
    changes, referenceIdChanges, note: 'Observed differences, not rule violations. Structural keys can mismatch after insertions; review unmatched elements.' };
}

export function printDelta(screen, print) {
  const delta = compareObservations(screen, print);
  return { ...delta,
    hiddenInPrint: delta.changes.filter(row => row.different?.hidden?.before === false && row.different.hidden.after === true).map(row => row.key),
    revealedInPrint: delta.changes.filter(row => row.different?.hidden?.before === true && row.different.hidden.after === false).map(row => row.key),
    restyledInPrint: delta.changes.filter(row => row.different && ['style', 'before', 'after'].some(field => row.different[field])).map(row => row.key),
    notVerified: ['Pagination', 'Content importance', 'Grayscale printer output', 'Native operating-system contrast palettes', 'Accessible PDF output'],
  };
}
