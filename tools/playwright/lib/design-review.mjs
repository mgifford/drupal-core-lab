// Evidence helpers. Geometry and motion are review candidates, never verdicts.
export function compareLayout(before, after, tolerance = 1) {
  const right = new Map((after.nodes || []).map(node => [node.key, node]));
  return (before.nodes || []).flatMap(node => {
    const next = right.get(node.key);
    if (!node.rect || !next?.rect || node.hidden || next.hidden) return [];
    const fields = ['x', 'y', 'width', 'height'].filter(key => Math.abs(node.rect[key] - next.rect[key]) > tolerance);
    return fields.length ? [{ key: node.key, fields, before: node.rect, after: next.rect }] : [];
  });
}
export function motionEvidence(snapshot) {
  const nonzero = value => String(value || '').split(',').some(part => parseFloat(part) > 0);
  const nodes = (snapshot.nodes || []).filter(node => !node.hidden);
  return {
    preference: snapshot.context?.reducedMotion ?? null,
    running: nodes.filter(node => node.runningAnimations > 0).map(node => node.key),
    declaredAnimations: nodes.filter(node => node.style?.animationName && node.style.animationName !== 'none' && nonzero(node.style.animationDuration)).map(node => node.key),
    declaredTransitions: nodes.filter(node => node.style?.transitionProperty !== 'none' && nonzero(node.style?.transitionDuration)).map(node => node.key),
    smoothScroll: nodes.filter(node => node.style?.scrollBehavior === 'smooth').map(node => node.key),
    note: 'Declared transitions need a trigger; running animation counts include transitions. Remaining motion is not automatically a failure. No inference about equivalent cues or task completion.',
  };
}
export function printLayoutEvidence(snapshot) {
  const visible = (snapshot.nodes || []).filter(node => !node.hidden && node.rect?.width > 0 && node.rect?.height > 0);
  const navigation = visible.filter(node => ['fixed', 'sticky'].includes(node.style?.position));
  const byKey = new Map(visible.map(node => [node.key, node]));
  const contains = (ancestor, node) => {
    const seen = new Set();
    for (let key = node.parentKey; key && !seen.has(key); key = byKey.get(key)?.parentKey) {
      if (key === ancestor.key) return true;
      seen.add(key);
    }
    return false;
  };
  const content = visible.filter(node => node.region !== 'navigation' && /^(h[1-6]|label|legend|input|textarea|select|button|summary|th|td|p)$/.test(node.tag));
  const overlaps = [];
  for (const nav of navigation) for (const node of content) {
    if (nav.key === node.key || contains(nav, node) || contains(node, nav)) continue;
    const a = nav.rect, b = node.rect;
    if (Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x) > 1 && Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y) > 1) {
      overlaps.push({ navigation: nav.key, content: node.key });
    }
  }
  return { navigation: navigation.map(node => node.key), overlapCount: overlaps.length, overlaps: overlaps.slice(0, 100), capped: overlaps.length > 100,
    horizontalOverflow: snapshot.viewport ? content.filter(node => node.rect.x < -1 || node.rect.x + node.rect.width > snapshot.viewport.width + 1).map(node => node.key) : [],
    note: 'Persistent-panel rectangle intersections and horizontal overflow at the recorded viewport. This is not occlusion, CSS page-margin resolution or fragmentation proof; confirm in the exported PDF. Sticky positioning and intentional overflow can produce false positives.' };
}
export function routeFamily(path) {
  if (/^\/admin\/help\/topic\//.test(path)) return '/admin/help/topic/*';
  return path.replace(/\/[0-9]+(?=\/|$)/g, '/:id');
}
// Fair ordering only, never silently excludes a discovered URL. Account/context
// are included so language or role variants do not consume each other's turn.
export function takeNextPage(queue, visited) {
  const key = spec => JSON.stringify([spec.account, spec.context || {}, routeFamily(spec.path)]);
  const counts = new Map();
  for (const spec of visited) counts.set(key(spec), (counts.get(key(spec)) || 0) + 1);
  let index = 0;
  for (let i = 1; i < queue.length; i++) if ((counts.get(key(queue[i])) || 0) < (counts.get(key(queue[index])) || 0)) index = i;
  return queue.splice(index, 1)[0];
}
export async function settleDesign(page, { editor = false } = {}) {
  await page.waitForLoadState('domcontentloaded');
  await page.locator('body').waitFor();
  return page.evaluate(async ({ editor }) => {
    const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
    await Promise.race([document.fonts?.ready, wait(2000)]);
    const started = performance.now();
    let previous = '', stable = 0, samples = 0;
    // Bounded sampling, not network-idle and not animation suppression. Includes
    // text digests only in memory, never returned. Avoid recording input values.
    while (performance.now() - started < (editor ? 8000 : 2500)) {
      const nodes = [...document.querySelectorAll('body *')].filter(node => !node.closest('script,style,noscript')).slice(0, 500);
      const signature = JSON.stringify([document.querySelectorAll('body *').length, !!document.querySelector('.ck-editor__editable[contenteditable="true"]'), ...nodes.map(node => {
        const c = getComputedStyle(node), r = node.getBoundingClientRect();
        return [node.tagName, c.color, c.backgroundColor, c.fontWeight, c.fontSize, c.display, Math.round(r.width), Math.round(r.height)];
      })]);
      stable = signature === previous ? stable + 1 : 0; previous = signature; samples++;
      if (stable >= 2 && (!editor || document.querySelector('.ck-editor__editable[contenteditable="true"]'))) break;
      await wait(200);
    }
    return { sampledStable: stable >= 2, samples, elapsedMs: Math.round(performance.now() - started), editorExpected: editor,
      editorReady: !!document.querySelector('.ck-editor__editable[contenteditable="true"]'),
      runningAnimations: document.getAnimations?.().filter(animation => animation.playState === 'running').length ?? null,
      note: 'Bounded sample of at most 500 elements; not proof that all scripts or animations have settled.' };
  }, { editor });
}
