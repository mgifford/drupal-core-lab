import test from 'node:test';
import assert from 'node:assert/strict';
import { compareLayout, motionEvidence, printLayoutEvidence, routeFamily, takeNextPage } from '../../tools/playwright/lib/design-review.mjs';
const rect = (x, y, width = 100, height = 30) => ({ x, y, width, height });
test('print overlap candidates retain an existing navigation problem independently of patch changes', () => {
  const snapshot = { nodes: [
    { key: 'nav', tag: 'aside', region: 'navigation', rect: rect(0, 0, 200, 900), style: { position: 'fixed' } },
    { key: 'label', tag: 'label', region: 'page', rect: rect(100, 40) },
    { key: 'outside', tag: 'label', region: 'page', rect: rect(300, 40) },
    { key: 'nav-label', tag: 'label', region: 'navigation', rect: rect(0, 40) },
    { key: 'hidden', tag: 'input', hidden: true, rect: rect(100, 40) },
  ] };
  assert.deepEqual(printLayoutEvidence(snapshot).overlaps, [{ navigation: 'nav', content: 'label' }]);
  snapshot.nodes[0].style.position = 'static';
  assert.equal(printLayoutEvidence(snapshot).overlapCount, 0);
});
test('geometry detects wrapping without making small rounding noise a change or pairing hidden elements', () => {
  const a = { nodes: [{ key: 'field', rect: rect(10, 10) }, { key: 'hidden', rect: rect(0, 0), hidden: true }] };
  const b = { nodes: [{ key: 'field', rect: rect(10.5, 30) }, { key: 'hidden', rect: rect(100, 0) }] };
  assert.deepEqual(compareLayout(a, b).map(row => row.fields), [['y']]);
  assert.deepEqual(compareLayout(a, a), []);
});
test('motion distinguishes declarations, active animations and hidden components', () => {
  const snapshot = { context: { reducedMotion: 'reduce' }, nodes: [
    { key: 'declared', style: { transitionDuration: '0s, 0.2s', transitionProperty: 'opacity' }, runningAnimations: 0 },
    { key: 'active', style: { animationName: 'pulse', animationDuration: '2s' }, runningAnimations: 1 },
    { key: 'hidden', hidden: true, style: { animationName: 'pulse', animationDuration: '2s' }, runningAnimations: 1 },
    { key: 'zero', style: { transitionDuration: '0s' }, runningAnimations: 0 },
  ] };
  const evidence = motionEvidence(snapshot);
  assert.deepEqual(evidence.declaredTransitions, ['declared']); assert.deepEqual(evidence.running, ['active']);
  assert.deepEqual(evidence.declaredAnimations, ['active']); assert.equal(evidence.preference, 'reduce');
});
test('family ordering favours uncovered component routes without dropping queued help topics or role contexts', () => {
  const spec = path => ({ path, account: 'administrator' });
  const queue = [spec('/admin/help/topic/a'), spec('/node/add/article'), spec('/admin/help/topic/b')];
  assert.equal(takeNextPage(queue, [spec('/admin/help/topic/seen')]).path, '/node/add/article');
  assert.equal(queue.length, 2);
  assert.equal(routeFamily('/node/15000/edit'), '/node/:id/edit');
  assert.equal(routeFamily('/admin/config/people/accounts'), '/admin/config/people/accounts');
  queue.push({ path: '/admin/help/topic/c', account: 'anonymous' });
  assert.equal(takeNextPage(queue, [spec('/admin/help/topic/seen')]).account, 'anonymous');
});
