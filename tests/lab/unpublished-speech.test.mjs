import test from 'node:test';
import assert from 'node:assert/strict';
import { checkStatusSnapshot } from '../../tools/playwright/lib/unpublished-speech.mjs';

const marker = (kind) => ({
  html: `<p class="unpublished-status"><strong><span class="visually-hidden">This ${kind} is </span>Unpublished</strong></p>`,
  visibleText: 'Unpublished', visible: true, contextHidden: true,
});

test('Guidepup reads contextual node and comment status exactly once', async () => {
  for (const kind of ['node', 'comment']) {
    const result = await checkStatusSnapshot({ kind, unpublished: true, markers: [marker(kind)] }, 'after');
    assert.equal(result.good, true, JSON.stringify(result.phrases));
  }
});

test('published controls have no marker; Before does not claim the fix', async () => {
  for (const kind of ['node', 'comment']) {
    assert.equal((await checkStatusSnapshot({ kind, unpublished: false, markers: [] }, 'after')).good, true);
    assert.equal((await checkStatusSnapshot({ kind, unpublished: true, markers: [] }, 'before')).good, true);
    assert.equal((await checkStatusSnapshot({ kind, unpublished: false, markers: [marker(kind)] }, 'after')).good, false);
  }
});

test('missing, duplicate, hidden and context-free markers fail', async () => {
  const check = (markers) => checkStatusSnapshot({ kind: 'node', unpublished: true, markers }, 'after');
  assert.equal((await check([])).good, false);
  assert.equal((await check([marker('node'), marker('node')])).good, false);
  assert.equal((await check([{ ...marker('node'), visible: false }])).good, false);
  assert.equal((await check([{ ...marker('node'), html: '<p>Unpublished</p>' }])).good, false);
  assert.equal((await check([{ ...marker('node'), contextHidden: false }])).good, false);
});
