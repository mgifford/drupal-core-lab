// Explicit local Lab scenarios, never instructions taken from a crawled page.
export const designScenarioNames = ['3630425-multivalue'];
export async function* designStates(page, spec) {
  if (!spec.scenario) { yield 'initial'; return; }
  if (!designScenarioNames.includes(spec.scenario)) throw new Error('Unknown design scenario');
  if (spec.path !== '/node/add/article' || spec.account !== 'administrator') throw new Error('The multivalue scenario requires administrator /node/add/article');
  const selector = 'table[id^="field-lab-multivalue-values"]';
  const table = page.locator(selector);
  await table.waitFor();
  if (await table.count() !== 1) throw new Error('Expected one Lab multivalue table; apply repro_3630425 first');
  const rows = await table.locator('tbody > tr').count();
  yield 'initial';
  const add = page.locator('[name="field_lab_multivalue_add_more"]');
  if (await add.count() !== 1) throw new Error('Expected one Lab Add another item button');
  await add.click();
  await page.waitForFunction(({ selector, rows }) => document.querySelector(selector)?.tBodies[0].rows.length === rows + 1, { selector, rows });
  yield 'after-add';
  const remove = table.locator('[name$="_remove_button"]').last();
  if (!await remove.count()) throw new Error('Lab Remove button missing');
  await remove.click();
  await page.waitForFunction(({ selector, rows }) => document.querySelector(selector)?.tBodies[0].rows.length === rows, { selector, rows });
  yield 'after-remove';
}
