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
    // Core can intentionally disable native validation. Record that precondition
    // before activation; never equate validity.valid === false with blocked POST.
    const submitter = page.locator('input[type=submit]');
    const validation = await submitter.evaluate((button) => ({
      formNoValidate: button.form.noValidate,
      submitterNoValidate: button.formNoValidate,
    }));
    const nativeValidationEnabled = !validation.formNoValidate && !validation.submitterNoValidate;
    const beforeSubmit = await probe(page);
    const invalidBefore = beforeSubmit.dynamic.valid === false;
    let postCount = 0;
    const recordPost = (request) => {
      if (request.method() === 'POST' && new URL(request.url()).pathname === route) postCount++;
    };
    page.on('request', recordPost);
    // A valid form, or one with validation disabled, should navigate after POST.
    const submission = (!nativeValidationEnabled || !invalidBefore)
      ? page.waitForEvent('load', { timeout: 15000 }) : null;
    await submitter.focus();
    await page.keyboard.press('Enter');
    if (submission) await submission;
    else await page.waitForTimeout(300);
    page.off('request', recordPost);
    states.submit = {
      ...validation,
      nativeValidationEnabled,
      invalidBefore,
      postCount,
      acceptedMessage: (await page.locator('body').innerText()).includes('Test form accepted. No content was saved.'),
      stayedOnForm: new URL(page.url()).pathname === route,
      invalidDynamic: await page.locator('input[name=dynamic]:invalid').count(),
      focusedName: await page.evaluate(() => document.activeElement?.name ?? null),
      activeElement: await page.evaluate(() => ({ tag: document.activeElement?.tagName, id: document.activeElement?.id })),
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
  ['Native validation blocks Save with hidden None', A.submit.nativeValidationEnabled ? A.submit.postCount === 0 && A.submit.invalidDynamic > 0 && A.submit.focusedName === 'dynamic' : null],
  ['With native validation disabled, the fixture accepts the POST (no dynamic server validation supplied)', A.submit.nativeValidationEnabled ? null : A.submit.postCount > 0 && A.submit.acceptedMessage],
  ['None reappears checked and valid when optional', A['none-optional'].dynamic.selected === '_none' && A['none-optional'].dynamic.noneVisible && A['none-optional'].dynamic.valid],
  ['Arrow key selects Blue and clears custom validity', A['real-required'].dynamic.selected === 'blue' && A['real-required'].dynamic.valid],
  ['Repeated toggles retain Blue and validity', A['real-retoggled'].dynamic.selected === 'blue' && A['real-retoggled'].dynamic.valid],
];
for (const [side, states] of Object.entries({ before: B, after: A })) {
  checks.push([`${side}: optional group remains optional`, Object.values(states).filter((s) => s.optional).every((s) => s.optional.required === 0)]);
  checks.push([`${side}: default Blue retained`, states.initial.static_default.selected === 'blue']);
}
const failed = checks.filter(([, pass]) => pass === false);
const notApplicable = checks.filter(([, pass]) => pass === null);
results.verdict = failed.length || !A.submit.nativeValidationEnabled ? 'mixed' : 'reproduced-and-fixed';
results.nativeValidationTested = A.submit.nativeValidationEnabled;
results.notApplicable = notApplicable.map(([label]) => label);
results.unexpected = failed.length;
let md = `# Required radio groups: ${run.v.slug}\n\nDRAFT automated evidence. ${results.when}.\n\n| Check | Result |\n|---|---|\n`;
for (const [label, pass] of checks) md += `| ${label} | ${pass === null ? 'not applicable in this configuration' : pass ? 'as expected' : 'NOT as expected'} |\n`;
md += `\nNative validation enabled: Before ${B.submit.nativeValidationEnabled}, After ${A.submit.nativeValidationEnabled}. After POST requests: ${A.submit.postCount}; accepted message: ${A.submit.acceptedMessage}.\n`;
if (!A.submit.nativeValidationEnabled) md += '\n**Native submission blocking was not exercised:** core disabled it through novalidate or formnovalidate. Constraint validity and native submission blocking are separate. The fixture supplies no server-side validation for dynamic #states. Verdict remains mixed to preserve this coverage gap.\n';
md += '\nFull stage markup, axe results, accessibility snapshots, native validity, and selection are in results.json. Screenshots capture each stage.\n';
md += contextMarkdown(results) + speechMarkdown(results);
md += '\nNot verified: person-led keyboard or screen-reader pass, JavaScript-disabled submission, other themes unless separately recorded, full core PHPUnit suite, contrib compatibility, or server enforcement of dynamic #states (client-side behavior).\n';
console.log(writeRun(run, results, md));
process.exitCode = failed.length ? 2 : 0;
