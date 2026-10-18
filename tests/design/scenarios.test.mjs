import test from 'node:test';
import assert from 'node:assert/strict';
import { designStates } from '../../tools/playwright/lib/design-scenarios.mjs';
test('default collection performs no scenario actions', async () => {
  const states = []; for await (const name of designStates({}, {})) states.push(name);
  assert.deepEqual(states, ['initial']);
});
test('multivalue scenario records initial, add and remove without content save', async () => {
  let rows = 2; const clicks = [], states = [];
  const page = {
    locator: selector => selector.startsWith('table') ? { waitFor: async () => {}, count: async () => 1,
      locator: selector => selector === 'tbody > tr' ? { count: async () => rows } : { last: () => ({ count: async () => 1, click: async () => { rows--; clicks.push('remove'); } }) } } :
      { count: async () => 1, click: async () => { rows++; clicks.push('add'); } },
    waitForFunction: async (fn, args) => { assert.ok(rows === args.rows || rows === args.rows + 1); },
  };
  for await (const state of designStates(page, { scenario: '3630425-multivalue', path: '/node/add/article', account: 'administrator' })) states.push([state, rows]);
  assert.deepEqual(states, [['initial', 2], ['after-add', 3], ['after-remove', 2]]); assert.deepEqual(clicks, ['add', 'remove']);
});
test('unknown scenarios and unsuitable account/path are rejected', async () => {
  for (const spec of [{ scenario: 'anything' }, { scenario: '3630425-multivalue', path: '/user/login', account: 'anonymous' }]) {
    await assert.rejects(async () => { for await (const state of designStates({}, spec)) void state; }, /scenario/);
  }
});
