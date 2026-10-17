import test from 'node:test';
import assert from 'node:assert/strict';
import { contextIdentity, resolvedIdentity, navigationOutcome, designCoverage } from '../../tools/playwright/lib/design-crawl.mjs';
test('resolved identities retain account, language context and scenario while canonicalising context key order', () => {
  const a = { account: 'administrator', context: { language: 'fa', region: 'CA' } };
  const b = { ...a, context: { region: 'CA', language: 'fa' } };
  assert.equal(contextIdentity(a), contextIdentity(b));
  assert.notEqual(resolvedIdentity(a, '/node/add/article'), resolvedIdentity({ ...a, account: 'anonymous' }, '/node/add/article'));
  assert.notEqual(contextIdentity(a), contextIdentity({ ...a, scenario: '3630425-multivalue' }));
  assert.notEqual(contextIdentity(a), contextIdentity({ ...a, context: { language: 'en' } }));
});
test('coverage counts successful comparisons separately from missing, redirected, duplicate and failed attempts', () => {
  const entry = props => ({ status: 200, ...props });
  const row = props => ({ sides: { before: entry(props), after: entry(props) } });
  const pages = [
    { ...row({ screen: {} }), screenComparison: { changes: [] } },
    row({ status: 404, notCompared: 'HTTP error' }),
    row({ redirected: true, duplicateOf: { pageId: 1 } }),
    row({ error: 'Timeout' }),
    { sides: { before: entry({ screen: {} }), after: entry({ status: 500 }) } },
  ];
  const coverage = designCoverage(pages);
  assert.equal(coverage.attempted, 5); assert.equal(coverage.compared, 1); assert.equal(coverage.missing, 1);
  assert.equal(coverage.redirected, 1); assert.equal(coverage.duplicateRoutes, 1); assert.equal(coverage.failed, 2); assert.equal(coverage.partial, 1);
  assert.equal(navigationOutcome(pages[2].sides.before), 'redirect-duplicate');
  assert.equal(navigationOutcome({ status: 404, redirected: true }), 'missing');
  assert.equal(navigationOutcome({ status: 200, duplicateOf: { pageId: 1 } }), 'duplicate');
});
