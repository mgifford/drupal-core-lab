import test from 'node:test';
import assert from 'node:assert/strict';
import { PAPER_FORMATS, capturePaperLayouts, comparePaperFindings } from '../../tools/playwright/lib/design-print.mjs';
const paper = (keys = []) => ({ ...PAPER_FORMATS[0], method: 'paper-width-emulation', readiness: { sampledStable: true },
  snapshot: { viewport: PAPER_FORMATS[0].viewport, context: { theme: 'default_admin', language: 'en', direction: 'ltr', reducedMotion: 'no-preference' }, media: { print: true }, truncated: false,
    nodes: [{ key: 'nav' }, ...keys.map(key => ({ key }))], printLayout: { overlaps: keys.map(key => ({ navigation: 'nav', content: key })), horizontalOverflow: [], capped: false } } });
test('print identities classify persistent, introduced and resolved candidates rather than subtracting counts', () => {
  const review = comparePaperFindings(paper(['same', 'old']), paper(['same', 'new']));
  assert.equal(review.comparable, true);
  assert.deepEqual(review.findings.map(item => item.classification).sort(), ['introduced', 'persistent', 'resolved']);
  assert.ok(review.findings.every(item => item.rule.id === 'PRN-02' && item.rule.accepted === false));
  assert.ok(review.manualReviews.every(item => item.classification === 'inconclusive'));
  assert.equal(comparePaperFindings(paper(), paper()).findings.length, 0);
});
test('unknown theme, different preferences, incomplete geometry and different profiles remain inconclusive', () => {
  const variants = [
    p => { p.snapshot.context.theme = null; },
    p => { p.snapshot.context.reducedMotion = 'reduce'; },
    p => { p.snapshot.truncated = true; },
    p => { p.snapshot.viewport = { width: 1280, height: 900 }; },
    p => { p.format = 'Letter'; },
    p => { p.readiness.sampledStable = false; },
    p => { p.snapshot.nodes.push({ key: 'nav' }); },
  ];
  for (const change of variants) {
    const after = paper(['label']); change(after);
    const review = comparePaperFindings(paper(['label']), after);
    assert.equal(review.comparable, false); assert.ok(review.findings.every(item => item.classification === 'inconclusive'));
  }
  assert.equal(comparePaperFindings(undefined, paper()).findings[0].classification, 'inconclusive');
});
test('paper capture samples each width, exports at that width, and restores viewport/scroll even on failures', async () => {
  let viewport = { width: 1280, height: 900 }, scroll = { x: 12, y: 320 }, exports = [], count = 0;
  const page = {
    viewportSize: () => ({ ...viewport }),
    setViewportSize: async value => { viewport = { ...value }; },
    emulateMedia: async value => assert.equal(value.media, 'print'),
    evaluate: async (fn, value) => { if (fn.toString().includes('x: scrollX')) return { ...scroll }; scroll = value || { x: 0, y: 0 }; },
    pdf: async options => { exports.push([options.format, viewport.width]); if (options.format === 'A4') throw new Error('PDF export failure'); },
  };
  const adapters = {
    settle: async () => ({ sampledStable: true }),
    observe: async (_, options) => { assert.equal(options.geometryOnly, true); count++; return { viewport: { ...viewport }, nodes: [] }; },
  };
  const result = await capturePaperLayouts(page, { formats: ['A4', 'Letter'], pdfFile: format => ({ path: '/unused/' + format + '.pdf', name: format + '.pdf' }) }, adapters);
  assert.equal(count, 2); assert.deepEqual(exports, [['A4', 794], ['Letter', 816]]);
  assert.match(result[0].pdfError, /PDF export failure/); assert.equal(result[1].pdf, 'Letter.pdf');
  assert.deepEqual(viewport, { width: 1280, height: 900 }); assert.deepEqual(scroll, { x: 12, y: 320 });
  let first = true;
  const partial = await capturePaperLayouts(page, { formats: ['A4', 'Letter'] }, { ...adapters, settle: async () => { if (first) { first = false; throw new Error('Readiness failure'); } return { sampledStable: true }; } });
  assert.match(partial[0].error, /Readiness failure/); assert.ok(partial[1].snapshot);
  assert.deepEqual(viewport, { width: 1280, height: 900 }); assert.deepEqual(scroll, { x: 12, y: 320 });
});
test('Letter is the sole default profile and missing legacy paper evidence is inconclusive', async () => {
  let viewport = { width: 1280, height: 900 };
  const page = {
    viewportSize: () => viewport, setViewportSize: async value => { viewport = value; },
    emulateMedia: async () => {}, evaluate: async () => ({ x: 0, y: 0 }),
  };
  const profiles = await capturePaperLayouts(page, {}, { settle: async () => ({ sampledStable: true }), observe: async () => ({ viewport }) });
  assert.deepEqual(profiles.map(item => item.format), ['Letter']);
  assert.equal(comparePaperFindings(undefined, undefined).comparable, false);
});
