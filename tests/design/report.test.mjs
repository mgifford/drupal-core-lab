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
