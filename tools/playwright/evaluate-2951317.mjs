// Replay #2951317 with trusted input. Run against a built registered pair.
import path from 'node:path';
import { runArgs, launch, openSide, axeScan, baseResults, writeRun, contextMarkdown, speechMarkdown } from './lib/lab-run.mjs';

const run = runArgs({ slug: '2951317-pinned' });
const route = '/admin/config/development/lab-radios-2951317';
const probe = (page) => page.evaluate(() => {
  const groups = {};
  for (const name of ['static_required', 'static_default', 'optional', 'dynamic']) {
    const inputs = [...document.querySelectorAll(`input[type=radio][name="${name}"]`)];
    if (!inputs.length) throw new Error(`Shared fixture missing group: ${name}`);
    const fieldset = inputs[0].closest('fieldset');
    groups[name] = {
      fieldsetRequired: fieldset.hasAttribute('required'),
      role: fieldset.getAttribute('role'),
      required: inputs.filter((e) => e.required).length,
      count: inputs.length,
      selected: inputs.find((e) => e.checked)?.value ?? null,
      valid: inputs.every((e) => e.validity.valid),
      noneVisible: inputs.find((e) => e.value === '_none')?.checkVisibility() ?? null,
      legendMarkers: fieldset.querySelectorAll('legend .form-required').length,
      optionMarkers: fieldset.querySelectorAll('label.form-required').length,
      markup: fieldset.outerHTML,
    };
  }
  return groups;
});

async function replay(side) {
  const { page, base, rec } = await openSide(run, side);
  const states = {};
  const capture = async (name) => {
    states[name] = await probe(page);
    states[name].aria = await page.locator('form#lab-radios-2951317').ariaSnapshot();
    states[name].axe = await axeScan(page);
    await page.screenshot({ path: path.join(run.out, `${side}-${name}.png`), fullPage: true });
  };
  try {
    await page.goto(base + route);
    await page.locator('input[name=dynamic]').first().waitFor();
    await capture('initial');
    await page.locator('input[name=require_dynamic]').check();
    await capture('empty-required');
    await page.locator('input[name=require_dynamic]').uncheck();
    await page.locator('input[name=dynamic][value="_none"]').check();
    await page.locator('input[name=require_dynamic]').check();
    await capture('none-required');
    await page.locator('input[name=static_required][value=red]').check();
    // Keyboard activation exercises native validation, without submitting through JS.
    await page.locator('input[type=submit]').focus();
    await page.keyboard.press('Enter');
    await page.waitForTimeout(300);
    states.submit = {
      stayedOnForm: new URL(page.url()).pathname === route,
      invalidDynamic: await page.locator('input[name=dynamic]:invalid').count(),
      focusedName: await page.evaluate(() => document.activeElement?.name ?? null),
    };
    await page.locator('input[name=require_dynamic]').uncheck();
    await capture('none-optional');
    await page.locator('input[name=dynamic][value=red]').check();
    await page.locator('input[name=require_dynamic]').check();
    await page.locator('input[name=dynamic][value=red]').focus();
    await page.keyboard.press('ArrowDown');
    await capture('real-required');
    await page.locator('input[name=require_dynamic]').uncheck();
    await page.locator('input[name=require_dynamic]').check();
    await capture('real-retoggled');
    rec.states = states;
    return rec;
  } finally {
    await rec.close(run.out);
  }
}

const { browser, environment } = await launch(run);
run.browser = browser;
const results = baseResults(run, environment);
try {
  for (const side of ['before', 'after']) results.sides[side] = await replay(side);
} finally { await browser.close(); }
const B = results.sides.before.states;
const A = results.sides.after.states;
const checks = [
  ['Static required attributes moved to inputs', B.initial.static_required.required === 0 && B.initial.static_required.fieldsetRequired && A.initial.static_required.required === 2 && !A.initial.static_required.fieldsetRequired],
  ['Dynamic empty group becomes invalid without selecting an option', !A['empty-required'].dynamic.valid && A['empty-required'].dynamic.selected === null],
  ['Hidden None stays selected and invalid while required', A['none-required'].dynamic.selected === '_none' && !A['none-required'].dynamic.noneVisible && !A['none-required'].dynamic.valid],
  ['Native validation blocks Save with hidden None', A.submit.stayedOnForm && A.submit.invalidDynamic > 0 && A.submit.focusedName === 'dynamic'],
  ['None reappears checked and valid when optional', A['none-optional'].dynamic.selected === '_none' && A['none-optional'].dynamic.noneVisible && A['none-optional'].dynamic.valid],
  ['Arrow key selects Blue and clears custom validity', A['real-required'].dynamic.selected === 'blue' && A['real-required'].dynamic.valid],
  ['Repeated toggles retain Blue and validity', A['real-retoggled'].dynamic.selected === 'blue' && A['real-retoggled'].dynamic.valid],
];
for (const [side, states] of Object.entries({ before: B, after: A })) {
  checks.push([`${side}: optional group remains optional`, Object.values(states).filter((s) => s.optional).every((s) => s.optional.required === 0)]);
  checks.push([`${side}: default Blue retained`, states.initial.static_default.selected === 'blue']);
}
const failed = checks.filter(([, pass]) => !pass);
results.verdict = failed.length ? 'mixed' : 'reproduced-and-fixed';
results.unexpected = failed.length;
let md = `# Required radio groups: ${run.v.slug}\n\nDRAFT automated evidence. ${results.when}.\n\n| Check | Result |\n|---|---|\n`;
for (const [label, pass] of checks) md += `| ${label} | ${pass ? 'as expected' : 'NOT as expected'} |\n`;
md += '\nFull stage markup, axe results, accessibility snapshots, native validity, and selection are in results.json. Screenshots capture each stage.\n';
md += contextMarkdown(results) + speechMarkdown(results);
md += '\nNot verified: person-led keyboard or screen-reader pass, JavaScript-disabled submission, other themes unless separately recorded, full core PHPUnit suite, contrib compatibility, or server enforcement of dynamic #states (client-side behavior).\n';
console.log(writeRun(run, results, md));
process.exitCode = failed.length ? 2 : 0;
