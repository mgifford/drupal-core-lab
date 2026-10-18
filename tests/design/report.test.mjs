import test from 'node:test';
import assert from 'node:assert/strict';
import { renderDesignReport } from '../../tools/playwright/lib/design-report.mjs';
const entry = () => ({ screen: { context: { theme: null, source: 'unavailable', themeAssets: [{ name: 'default_admin' }] } }, printDelta: { hiddenInPrint: [], revealedInPrint: [], restyledInPrint: ['sample'], changes: [] } });
test('report exposes print restyling and distinct actual, asset and configured theme evidence', () => {
  const report = { slug: '<unsafe>', requested: {}, sites: { before: { configuration: { theme: { default: 'default_admin' } } }, after: {} },
    pages: [{ id: 1, spec: { path: '/user/login', account: 'anonymous' }, sides: { before: entry(), after: entry() }, screenComparison: { changes: [], referenceIdChanges: [{}] }, printComparison: { changes: [], referenceIdChanges: [] } }], themeTransitions: [], coverage: {}, limitations: [] };
  const { markdown, html } = renderDesignReport(report);
  assert.match(markdown, /actual theme unknown/); assert.match(markdown, /Stylesheet candidates: default_admin \(supporting only\)/);
  assert.match(markdown, /configured admin unknown/); assert.match(markdown, /Restyled elements/); assert.match(markdown, /\| before \| 0 \| 0 \| 1 \|/);
  assert.match(html, /&lt;unsafe&gt;/); assert.doesNotMatch(html, /Variant: <unsafe>/); assert.match(html, /<main>/); assert.match(html, /@media print/);
});
test('report distinguishes reduced-motion comparisons, persistent print overlap and missing editor/configuration evidence', () => {
  const b = entry(), a = entry();
  b.screen.motion = { running: [], declaredTransitions: ['transition'] };
  b.screen.editor = { uiElements: 4, contentElements: 1 };
  b.print = { sheets: [], printLayout: { navigation: ['nav'], overlapCount: 2 } };
  b.readiness = { sampledStable: false, editorExpected: true, editorReady: false };
  b.reducedMotion = { screen: { context: {}, motion: { running: [], declaredTransitions: [] } } };
  b.preferenceComparisons = { screen: { changes: [{}] }, print: { changes: [] } };
  const report = { slug: 'review', requested: {}, sites: { before: { configuration: { error: 'configuration unavailable' } }, after: {} }, pages: [{ id: 1, spec: { path: '/node/add/article', account: 'administrator' }, sides: { before: b, after: a }, screenComparison: { changes: [] }, reducedMotionComparisons: { screen: { changes: [] }, print: { changes: [] } } }], themeTransitions: [], coverage: {}, limitations: [] };
  const { markdown, html } = renderDesignReport(report);
  for (const output of [markdown, html]) {
    assert.match(output, /expected CKEditor editable surface missing/);
    assert.match(output, /configuration evidence unavailable/);
    assert.match(output, /2 print navigation rectangle intersections/);
    assert.match(output, /Default-to-reduced screen changes/);
    assert.match(output, /Reduced-motion Before\/After differences: 0 screen; 0 print/);
  }
});
