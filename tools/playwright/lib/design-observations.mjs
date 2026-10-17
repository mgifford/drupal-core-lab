// Read-only initial-state inventory. Does not infer intended design or conformance.
import { browserThemeContext } from '../../compare/theme-context.mjs';

export async function observeDesign(page, { limit = 4000 } = {}) {
  const context = await page.evaluate(browserThemeContext);
  const data = await page.evaluate(({ limit }) => {
    const properties = ['display', 'visibility', 'fontWeight', 'fontStyle', 'fontSize', 'fontFamily', 'lineHeight', 'color', 'backgroundColor', 'borderTopStyle', 'borderBottomStyle', 'borderInlineStartStyle', 'borderInlineStartWidth', 'borderInlineStartColor', 'outlineStyle', 'outlineWidth', 'forcedColorAdjust', 'overflowX', 'overflowY', 'animationName', 'animationDuration', 'animationDelay', 'animationIterationCount', 'animationTimingFunction', 'transitionProperty', 'transitionDuration', 'transitionDelay', 'scrollBehavior'];
    const selector = element => {
      if (element.id && !/\d{6,}|--/.test(element.id)) return '#' + CSS.escape(element.id);
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
    const nodes = elements.slice(0, limit).map(element => {
      const css = getComputedStyle(element);
      const pseudo = name => {
        const style = getComputedStyle(element, name);
        return Object.fromEntries(['borderInlineStartStyle', 'borderInlineStartWidth', 'borderInlineStartColor', 'display', 'forcedColorAdjust'].map(key => [key, style[key]]));
      };
      const refs = {};
      for (const name of ['aria-describedby', 'aria-labelledby', 'aria-errormessage']) refs[name] = (element.getAttribute(name) || '').split(/\s+/).filter(Boolean).map(id => ({ id, exists: !!document.getElementById(id) }));
      return {
        key: selector(element), localThemeMode: element.closest('[data-theme-mode]')?.getAttribute('data-theme-mode') || null, runningAnimations: element.getAnimations ? element.getAnimations().filter(animation => animation.playState === 'running').length : null, tag: element.tagName.toLowerCase(),
        role: element.getAttribute('role'), classes: [...element.classList].filter(value => !/\d{6,}/.test(value)).slice(0, 30),
        childTags: [...element.children].map(child => child.tagName.toLowerCase()),
        references: refs, hidden: hidden(element),
        style: Object.fromEntries(properties.map(key => [key, css[key]])),
        before: pseudo('::before'), after: pseudo('::after'),
      };
    });
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
  return { context, ...data };
}

export function compareObservations(before, after) {
  const b = new Map(before.nodes.map(node => [node.key, node]));
  const a = new Map(after.nodes.map(node => [node.key, node]));
  const changes = [];
  for (const key of new Set([...b.keys(), ...a.keys()])) {
    const left = b.get(key), right = a.get(key);
    if (!left || !right) { changes.push({ key, kind: left ? 'unmatched-before' : 'unmatched-after' }); continue; }
    const different = {};
    for (const field of ['tag', 'role', 'localThemeMode', 'childTags', 'references', 'hidden', 'style', 'before', 'after']) {
      if (JSON.stringify(left[field]) !== JSON.stringify(right[field])) different[field] = { before: left[field], after: right[field] };
    }
    if (Object.keys(different).length) changes.push({ key, kind: 'changed', different });
  }
  return { themeChanged: !!before.context.theme && !!after.context.theme && before.context.theme !== after.context.theme,
    themeComparable: !!before.context.theme && !!after.context.theme,
    changes, note: 'Observed differences, not rule violations. Structural keys can mismatch after insertions; review unmatched elements.' };
}

export function printDelta(screen, print) {
  const delta = compareObservations(screen, print);
  return { ...delta,
    hiddenInPrint: delta.changes.filter(row => row.different?.hidden?.before === false && row.different.hidden.after === true).map(row => row.key),
    revealedInPrint: delta.changes.filter(row => row.different?.hidden?.before === true && row.different.hidden.after === false).map(row => row.key),
    notVerified: ['Pagination', 'Content importance', 'Grayscale printer output', 'Native operating-system contrast palettes', 'Accessible PDF output'],
  };
}
