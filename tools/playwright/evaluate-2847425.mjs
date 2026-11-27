// Evidence for #2847425: #states visibility and requirement of managed_file (MR !7305).
//   node tools/playwright/evaluate-2847425.mjs [slug] [--browser=chromium|firefox|webkit] [--scheme=light|dark] [--forced-colors] [--viewport=WxH] [--out=<dir>]
// Defaults: slug 2847425-pinned, chromium, light, 1280x900.
//
// Drives /file-test-states-form on both sides with real input: the three independent triggers (visibility,
// requirement, disabled), a real AJAX upload into a single and a multiple managed file, an invalid upload and its
// recovery, and removal of the last file. Managed file widgets are located by their stable form-item class
// (js-form-item-<name>), never by an id: the element id is regenerated with a unique suffix when the form is
// rebuilt for an AJAX response.
// For each state the run records: which element owns each data-drupal-states attribute, the rendered attributes of
// the wrapper div and of the file input, label and description associations, required and disabled semantics,
// focus, duplicate IDs and dangling label references, control visibility, axe findings and console errors.
// Output: reports/issues/2847425/playwright/<stamp>-<envTag>/ (results.json, SUMMARY.md, ajax-*.json, *.png).
import path from 'node:path';
import { runArgs, launch, openSide, axeScan, baseResults, writeRun, contextMarkdown, ajaxMarkdown, speechMarkdown } from './lib/lab-run.mjs';

const run = runArgs({ slug: '2847425-pinned' });
const { v, out } = run;
const URL_PATH = '/file-test-states-form';

const NAMES = [
  'managed_file_initially_visible',
  'managed_file_initially_hidden',
  'managed_file_initially_optional',
  'single_required',
  'single_optional_inverse',
  'multi_visible',
  'multi_required',
  'single_disabled',
  'multi_disabled',
  'combined',
  'no_states_file',
  'validated_file',
  'managed_file_in_details',
  'unrelated_in_details',
  'managed_file_in_fieldset',
  'managed_file_in_container',
];
const itemSel = (name) => '.js-form-item-' + name.replace(/_/g, '-');

// Runs in the page; everything is read from the live DOM after whatever replacement happened last.
const probe = (page) => page.evaluate((names) => {
  const vis = (el) => !!el && !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length) && getComputedStyle(el).visibility !== 'hidden';
  const attrs = (el) => (el ? Object.fromEntries([...el.attributes].map((a) => [a.name, a.value.length > 160 ? a.value.slice(0, 160) + '…' : a.value])) : null);
  const described = (el) => {
    if (!el) return null;
    const ids = (el.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean);
    return {
      ids,
      resolved: ids.every((id) => document.querySelectorAll('#' + CSS.escape(id)).length === 1),
      text: ids.map((id) => (document.getElementById(id) || {}).textContent || '(missing)').map((t) => t.replace(/\s+/g, ' ').trim()).join(' | '),
    };
  };
  const fields = {};
  for (const name of names) {
    const item = document.querySelector('.js-form-item-' + name.replace(/_/g, '-'));
    const wrapper = item ? item.querySelector('.js-form-managed-file') : null;
    const input = item ? item.querySelector('input[type="file"]') : null;
    const label = item ? item.querySelector('label') : null;
    const fids = item ? item.querySelector('input[type="hidden"][name$="[fids]"]') : null;
    const labels = input ? Array.from(input.labels || []) : [];
    fields[name] = {
      itemRendered: !!item,
      itemVisible: vis(item),
      wrapperRendered: !!wrapper,
      wrapperVisible: vis(wrapper),
      wrapperAttrs: attrs(wrapper),
      inputRendered: !!input,
      inputAttrs: attrs(input),
      statesOnWrapper: wrapper ? wrapper.getAttribute('data-drupal-states') : null,
      statesOnInput: input ? input.getAttribute('data-drupal-states') : null,
      statesOnFids: fids ? fids.getAttribute('data-drupal-states') : null,
      fidsAttrs: attrs(fids),
      labelText: label ? label.textContent.replace(/\s+/g, ' ').trim() : null,
      labelFor: label ? label.htmlFor : null,
      labelForResolves: !!(label && label.htmlFor && document.getElementById(label.htmlFor)),
      requiredMarker: !!(label && label.classList.contains('form-required')),
      labelCount: labels.length,
      required: input ? input.hasAttribute('required') : null,
      disabled: input ? input.hasAttribute('disabled') : null,
      described: described(input || wrapper),
      fileLinks: item ? item.querySelectorAll('.file a').length : 0,
    };
  }
  const ids = [...document.querySelectorAll('[id]')].map((e) => e.id);
  const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
  const dangling = [...document.querySelectorAll('label[for]')]
    .map((label) => label.getAttribute('for'))
    .filter((id) => document.querySelectorAll('#' + CSS.escape(id)).length !== 1);
  const a = document.activeElement;
  return {
    fields,
    group: {
      detailsVisible: vis(document.getElementById('edit-details')),
      detailsTextFieldVisible: vis(document.getElementById('edit-textfield-in-details')),
      detailsUnrelatedVisible: vis(document.querySelector('.js-form-item-unrelated-in-details')),
      fieldsetVisible: vis(document.getElementById('edit-fieldset-group')),
      fieldsetTextFieldVisible: vis(document.getElementById('edit-textfield-in-fieldset')),
      containerVisible: vis(document.getElementById('edit-container-group')),
      containerTextFieldVisible: vis(document.getElementById('edit-textfield-in-container')),
      plainTextFieldVisible: vis(document.getElementById('edit-plain-textfield')),
    },
    duplicateIds: [...new Set(dupes)],
    danglingLabelFor: [...new Set(dangling)],
    activeElement: a ? `${a.tagName.toLowerCase()}${a.id ? '#' + a.id : ''}` : null,
    errorText: [...document.querySelectorAll('.messages--error')].map((e) => e.textContent.replace(/\s+/g, ' ').trim()),
  };
}, NAMES);

async function waitForAjax(page, action) {
  const response = page.waitForResponse((r) => r.request().method() === 'POST' && r.url().includes('element_parents'), { timeout: 20000 });
  await action();
  await response;
  await page.waitForLoadState('networkidle');
}

// Real keyboard: from the top of the page, Tab until the given id has focus; record the focus indicator.
async function tabTo(page, id) {
  await page.evaluate(() => { if (document.activeElement && document.activeElement !== document.body) document.activeElement.blur(); });
  await page.keyboard.press('Tab');
  let presses = 1;
  while (presses < 80) {
    const at = await page.evaluate(() => document.activeElement && document.activeElement.id);
    if (at === id) break;
    await page.keyboard.press('Tab');
    presses++;
  }
  const focused = await page.evaluate((want) => {
    const a = document.activeElement;
    const s = a ? getComputedStyle(a) : null;
    return {
      reached: !!a && a.id === want,
      tag: a ? a.tagName.toLowerCase() : null,
      id: a ? a.id : null,
      name: a ? (a.labels && a.labels[0] ? a.labels[0].textContent : a.value || a.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 80) : null,
      outline: s ? `${s.outlineStyle} ${s.outlineWidth} ${s.outlineColor}` : null,
      boxShadow: s ? s.boxShadow : null,
    };
  }, id);
  return { ...focused, presses };
}

// Drupal.file.disableFields disables the other file inputs for one second while an upload starts.
// Wait for the control to be enabled rather than sleeping.
async function ensureEnabled(page, selector) {
  await page.waitForFunction((sel) => { const el = document.querySelector(sel); return !!el && !el.disabled; }, selector, { timeout: 15000 });
}

// File names must be unique across runs: a temporary file with the same name is refused.
const uniqueName = (prefix) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}.txt`;
const active = (page) => page.evaluate(() => {
  const a = document.activeElement;
  return a ? `${a.tagName.toLowerCase()}${a.id ? '#' + a.id : ''}` : null;
});

async function runSide(side) {
  const { page, base, rec } = await openSide(run, side);
  await page.goto(base + URL_PATH);
  await page.waitForSelector('#edit-toggle', { state: 'attached', timeout: 15000 });
  const formTheme = await page.evaluate(() => window.drupalSettings?.ajaxPageState?.theme ?? null);
  await rec.collect();

  const shots = {};
  const shot = async (name, selector) => {
    const target = selector ? page.locator(selector).first() : page;
    shots[name] = path.join(out, `${side}-${name}.png`);
    await target.screenshot({ path: shots[name] }).catch(() => page.screenshot({ path: shots[name] }));
  };

  // 1. As loaded.
  const load = await probe(page);
  await shot('1-load', itemSel('single_required'));
  const axeLoad = await axeScan(page);

  // 2. Visibility, requirement and disabled states, each with its own trigger.
  await page.locator('#edit-toggle').check();
  const visibility = await probe(page);
  await shot('2-visible', '#edit-details');
  await page.locator('#edit-toggle-required').check();
  const required = await probe(page);
  await shot('3-required', itemSel('single_required'));
  await page.locator('#edit-toggle-disabled').check();
  const disabled = await probe(page);
  await shot('4-disabled', itemSel('single_disabled'));
  const axeToggled = await axeScan(page);

  // 3. Real keyboard path to the first trigger.
  const keyboard = await tabTo(page, 'edit-toggle');

  // 4. AJAX upload into "combined" (visible and required at the same time, both triggers checked).
  const focusBeforeUpload = await active(page);
  await waitForAjax(page, () => page.locator('input[name="files[combined]"]').setInputFiles({ name: uniqueName('combined'), mimeType: 'text/plain', buffer: Buffer.from('combined upload\n') }));
  await page.waitForFunction(() => document.querySelectorAll('.js-form-item-combined .file a').length > 0, null, { timeout: 20000 });
  const afterUploadCombined = await probe(page);
  const focusAfterUpload = await active(page);
  await shot('5-after-upload', itemSel('combined'));

  // 4b. Does the trigger still control the replaced element? Toggle it off and on again.
  await page.locator('#edit-toggle').uncheck();
  const afterUploadToggleOff = await probe(page);
  await page.locator('#edit-toggle').check();
  await page.locator('#edit-toggle-required').uncheck();
  await page.locator('#edit-toggle-required').check();
  const afterUploadToggleOn = await probe(page);

  // 5. Upload to single_required, then remove the last file.
  await ensureEnabled(page, 'input[name="files[single_required]"]');
  await waitForAjax(page, () => page.locator('input[name="files[single_required]"]').setInputFiles({ name: uniqueName('single'), mimeType: 'text/plain', buffer: Buffer.from('single upload\n') }));
  await page.waitForFunction(() => document.querySelectorAll('.js-form-item-single-required .file a').length > 0, null, { timeout: 20000 });
  const afterUploadSingle = await probe(page);
  const focusBeforeRemove = await active(page);
  await waitForAjax(page, () => page.locator('.js-form-item-single-required input.remove-button').click());
  await page.waitForFunction(() => !!document.querySelector('.js-form-item-single-required input[type="file"]'), null, { timeout: 20000 });
  const afterRemove = await probe(page);
  const focusAfterRemove = await active(page);
  await page.locator('#edit-toggle-required').uncheck();
  await page.locator('#edit-toggle-required').check();
  const afterRemoveRetrigger = await probe(page);
  await shot('6-after-remove', itemSel('single_required'));

  // 6. An invalid upload, then a valid one: recovery. Reload first so that the
  // one-second temporary disable of the other file inputs (file.js) has cleared.
  await page.goto(base + URL_PATH);
  await page.waitForSelector('#edit-toggle', { state: 'attached', timeout: 15000 });
  await ensureEnabled(page, 'input[name="files[validated_file]"]');
  await waitForAjax(page, () => page.locator('input[name="files[validated_file]"]').setInputFiles({ name: uniqueName('too-big'), mimeType: 'text/plain', buffer: Buffer.alloc(2048, 'a') }));
  await page.waitForSelector('.messages--error', { timeout: 15000 });
  const afterInvalid = await probe(page);
  await shot('7-invalid', itemSel('validated_file'));
  await ensureEnabled(page, 'input[name="files[validated_file]"]');
  await waitForAjax(page, () => page.locator('input[name="files[validated_file]"]').setInputFiles({ name: uniqueName('recovered'), mimeType: 'text/plain', buffer: Buffer.from('recovered\n') }));
  await page.waitForFunction(() => document.querySelectorAll('.js-form-item-validated-file .file a').length > 0, null, { timeout: 20000 });
  const afterValid = await probe(page);
  const axeAfter = await axeScan(page);

  // 7. The page FormTest counts disabled elements on: the managed_file wrapper is a <div>.
  await page.goto(base + '/form-test/disabled-elements');
  await page.waitForSelector('#edit-managed-file', { state: 'attached', timeout: 15000 });
  const disabledPage = await page.evaluate(() => {
    const els = [...document.querySelectorAll('[disabled]')];
    const controls = new Set(['input', 'select', 'textarea', 'button', 'fieldset', 'optgroup', 'option']);
    return {
      count: els.length,
      nonControls: els.filter((e) => !controls.has(e.tagName.toLowerCase())).map((e) => `${e.tagName.toLowerCase()}${e.id ? '#' + e.id : ''}${e.className && typeof e.className === 'string' ? '.' + e.className.trim().split(/\s+/).join('.') : ''}`),
      managedFileInputDisabled: !!document.querySelector('#edit-managed-file-upload[disabled]'),
    };
  });
  await shot('8-form-test-disabled', '#edit-managed-file');
  await rec.collect();
  await rec.close(out);
  return Object.assign(rec, {
    formTheme, shots, keyboard, load, visibility, required, disabled, disabledPage,
    afterUploadCombined, afterUploadToggleOff, afterUploadToggleOn, afterUploadSingle,
    afterRemove, afterRemoveRetrigger, afterInvalid, afterValid,
    focus: { beforeUpload: focusBeforeUpload, afterUpload: focusAfterUpload, beforeRemove: focusBeforeRemove, afterRemove: focusAfterRemove },
    axe: { load: axeLoad, toggled: axeToggled, after: axeAfter },
  });
}

const { browser, environment } = await launch(run);
run.browser = browser;
const results = baseResults(run, environment);
try {
  for (const side of ['before', 'after']) { console.log(`running ${side} (${v[side].env}) ...`); results.sides[side] = await runSide(side); }
} finally { await browser.close(); }

const B = results.sides.before, A = results.sides.after;
const yn = (b) => (b ? 'yes' : 'no');
const owned = (state, name) => {
  const x = state.fields[name];
  if (!x) return 'missing';
  const on = [];
  if (x.statesOnWrapper) on.push('wrapper');
  if (x.statesOnInput) on.push('upload');
  if (x.statesOnFids) on.push('fids');
  return on.join('+') || 'none';
};
const f = (state, name) => (state.fields[name] || {});
const checks = [
  ['context', 'Theme that rendered the form', B.formTheme, A.formTheme, B.formTheme === A.formTheme],
  ['fix', 'Managed file whose visible state is false is hidden on load',
    yn(!f(B.load, 'managed_file_initially_hidden').itemVisible),
    yn(!f(A.load, 'managed_file_initially_hidden').itemVisible),
    f(B.load, 'managed_file_initially_hidden').itemVisible && !f(A.load, 'managed_file_initially_hidden').itemVisible],
  ['regression', 'The details textfield is visible on load', yn(B.load.group.detailsTextFieldVisible), yn(A.load.group.detailsTextFieldVisible), B.load.group.detailsTextFieldVisible && A.load.group.detailsTextFieldVisible],
  ['fix', 'After checking the visibility trigger the visible file hides and the hidden one shows',
    yn(!f(B.visibility, 'managed_file_initially_visible').itemVisible && f(B.visibility, 'managed_file_initially_hidden').itemVisible),
    yn(!f(A.visibility, 'managed_file_initially_visible').itemVisible && f(A.visibility, 'managed_file_initially_hidden').itemVisible),
    !(!f(B.visibility, 'managed_file_initially_visible').itemVisible && f(B.visibility, 'managed_file_initially_hidden').itemVisible) && !f(A.visibility, 'managed_file_initially_visible').itemVisible && f(A.visibility, 'managed_file_initially_hidden').itemVisible],
  ['regression', 'The details textfield stays visible after the toggles change', yn(B.visibility.group.detailsTextFieldVisible), yn(A.visibility.group.detailsTextFieldVisible), B.visibility.group.detailsTextFieldVisible && A.visibility.group.detailsTextFieldVisible],
  ['fix', 'Required marker and required attribute after checking the requirement trigger',
    yn(f(B.required, 'single_required').requiredMarker && f(B.required, 'single_required').required),
    yn(f(A.required, 'single_required').requiredMarker && f(A.required, 'single_required').required),
    !(f(B.required, 'single_required').requiredMarker && f(B.required, 'single_required').required) && f(A.required, 'single_required').requiredMarker && f(A.required, 'single_required').required],
  ['fix', 'The inverse "optional" state is not required on load and is required when its trigger is checked',
    yn(!f(B.load, 'single_optional_inverse').requiredMarker && f(B.required, 'single_optional_inverse').requiredMarker),
    yn(!f(A.load, 'single_optional_inverse').requiredMarker && f(A.required, 'single_optional_inverse').requiredMarker),
    !(!f(B.load, 'single_optional_inverse').requiredMarker && f(B.required, 'single_optional_inverse').requiredMarker) && !f(A.load, 'single_optional_inverse').requiredMarker && f(A.required, 'single_optional_inverse').requiredMarker],
  ['observe', 'data-drupal-states ownership on load: single_required', owned(B.load, 'single_required'), owned(A.load, 'single_required'), true],
  ['observe', 'data-drupal-states ownership on load: single_hidden (visibility)', owned(B.load, 'single_hidden'), owned(A.load, 'single_hidden'), true],
  ['observe', 'data-drupal-states ownership after a file exists: combined', owned(B.afterUploadCombined, 'combined'), owned(A.afterUploadCombined, 'combined'), true],
  ['observe', 'Server-rendered wrapper attributes while required: required/disabled present?', `${f(B.required, 'single_required').wrapperAttrs?.required || 'no'}/${f(B.required, 'single_required').wrapperAttrs?.disabled || 'no'}`, `${f(A.required, 'single_required').wrapperAttrs?.required || 'no'}/${f(A.required, 'single_required').wrapperAttrs?.disabled || 'no'}`, true],
  ['observe', 'After the upload: required attribute on the wrapper <div> / on the hidden file IDs input', `${f(B.afterUploadCombined, 'combined').wrapperAttrs?.required || 'no'} / ${f(B.afterUploadCombined, 'combined').fidsAttrs?.required || 'no'}`, `${f(A.afterUploadCombined, 'combined').wrapperAttrs?.required || 'no'} / ${f(A.afterUploadCombined, 'combined').fidsAttrs?.required || 'no'}`, true],
  ['regression', 'A managed file without states stays visible, optional and enabled',
    `${yn(f(B.load, 'no_states_file').itemVisible)}/${yn(f(B.load, 'no_states_file').requiredMarker)}/${yn(f(B.load, 'no_states_file').disabled)}`,
    `${yn(f(A.load, 'no_states_file').itemVisible)}/${yn(f(A.load, 'no_states_file').requiredMarker)}/${yn(f(A.load, 'no_states_file').disabled)}`,
    f(B.load, 'no_states_file').itemVisible && f(A.load, 'no_states_file').itemVisible && !f(A.load, 'no_states_file').requiredMarker && !f(A.load, 'no_states_file').disabled],
  ['fix', 'The file input is disabled after checking the disabled trigger', yn(f(B.disabled, 'single_disabled').disabled), yn(f(A.disabled, 'single_disabled').disabled), !f(B.disabled, 'single_disabled').disabled && f(A.disabled, 'single_disabled').disabled],
  ['observe', 'Dangling label[for] references after a file exists', B.afterUploadCombined.danglingLabelFor.join(', ') || 'none', A.afterUploadCombined.danglingLabelFor.join(', ') || 'none', true],
  ['regression', 'Duplicate IDs on load', B.load.duplicateIds.join(', ') || 'none', A.load.duplicateIds.join(', ') || 'none', B.load.duplicateIds.length === 0 && A.load.duplicateIds.length === 0],
  ['fix', 'The visibility trigger still controls the element after the AJAX replacement (hidden when unchecked)', yn(!f(B.afterUploadToggleOff, 'combined').itemVisible), yn(!f(A.afterUploadToggleOff, 'combined').itemVisible), f(B.afterUploadToggleOff, 'combined').itemVisible && !f(A.afterUploadToggleOff, 'combined').itemVisible],
  ['observe', 'Required marker after the AJAX upload, and after the trigger is changed again (#1091852)', `${yn(f(B.afterUploadCombined, 'combined').requiredMarker)} -> ${yn(f(B.afterUploadToggleOn, 'combined').requiredMarker)}`, `${yn(f(A.afterUploadCombined, 'combined').requiredMarker)} -> ${yn(f(A.afterUploadToggleOn, 'combined').requiredMarker)}`, true],
  ['observe', 'Required marker after removing the last file, and after its trigger is changed again', `${yn(f(B.afterRemove, 'single_required').requiredMarker)} -> ${yn(f(B.afterRemoveRetrigger, 'single_required').requiredMarker)}`, `${yn(f(A.afterRemove, 'single_required').requiredMarker)} -> ${yn(f(A.afterRemoveRetrigger, 'single_required').requiredMarker)}`, true],
  ['regression', 'The invalid upload shows an error and a valid one is then accepted', `${yn(B.afterInvalid.errorText.length > 0)}/${yn(f(B.afterValid, 'validated_file').fileLinks > 0)}`, `${yn(A.afterInvalid.errorText.length > 0)}/${yn(f(A.afterValid, 'validated_file').fileLinks > 0)}`, B.afterInvalid.errorText.length > 0 && A.afterInvalid.errorText.length > 0 && f(B.afterValid, 'validated_file').fileLinks > 0 && f(A.afterValid, 'validated_file').fileLinks > 0],
  ['observe', 'Focus after the AJAX upload / after removal', `${B.focus.afterUpload} / ${B.focus.afterRemove}`, `${A.focus.afterUpload} / ${A.focus.afterRemove}`, true],
  ['observe', 'First trigger reached with real Tab presses, and its focus indicator', `${yn(B.keyboard.reached)} (${B.keyboard.presses}) ${B.keyboard.outline}`, `${yn(A.keyboard.reached)} (${A.keyboard.presses}) ${A.keyboard.outline}`, true],
  ['regression', 'Non-control elements with a disabled attribute on /form-test/disabled-elements', B.disabledPage.nonControls.join(', ') || 'none', A.disabledPage.nonControls.join(', ') || 'none', B.disabledPage.nonControls.length === A.disabledPage.nonControls.length],
  ['regression', '[disabled] elements on /form-test/disabled-elements (the FormTest count)', String(B.disabledPage.count), String(A.disabledPage.count), B.disabledPage.count === A.disabledPage.count],
  ['regression', 'The disabled managed_file control itself is still disabled on /form-test/disabled-elements', yn(B.disabledPage.managedFileInputDisabled), yn(A.disabledPage.managedFileInputDisabled), B.disabledPage.managedFileInputDisabled && A.disabledPage.managedFileInputDisabled],
  ['regression', 'axe violations (elements) on load / after the upload', `${B.axe.load.total} / ${B.axe.after.total}`, `${A.axe.load.total} / ${A.axe.after.total}`, B.axe.load.total === A.axe.load.total && B.axe.after.total === A.axe.after.total],
  ['regression', 'JavaScript errors', String(B.jsErrors.length), String(A.jsErrors.length), B.jsErrors.length === 0 && A.jsErrors.length === 0],
];

let unexpected = 0;
let md = `# Playwright evidence: #${v.issue} (${v.slug})\n\nRun ${results.when}. Core Before \`${results.commits.before}\`, After \`${results.commits.after}\` plus \`${(results.patches.at(-1) || 'none').split('/').pop()}\`. ${environment.browser} ${environment.browserVersion}, ${environment.colorScheme}${environment.forcedColors ? ', forced colours' : ''}, ${run.viewport.width}x${run.viewport.height}, ${environment.os}. Real clicks, real Tab presses, real file inputs (Playwright setInputFiles), axe-core WCAG 2.0 to 2.2 A/AA. Recorders: tools/playwright/lib/lab-run.mjs.\n\nRule: **fix** rows differ as intended; **regression** rows match on both sides; **observe** and **context** rows are recorded, not judged.\n\n| Type | Check | Before | After | Verdict |\n|---|---|---|---|---|\n`;
for (const [t, label, b, a, good] of checks) { const judged = t !== 'observe' && t !== 'context'; if (judged && !good) unexpected++; md += `| ${t} | ${label} | ${b} | ${a} | ${judged ? (good ? 'as expected' : '**NOT as expected**') : 'recorded'} |\n`; }

md += `\n## State ownership, per element and moment\n\nEach cell names the element(s) that carry \`data-drupal-states\`: "wrapper" is the \`div.js-form-managed-file\`, "upload" the \`<input type="file">\`, "fids" the hidden file-IDs input.\n\n| Element | Before load | After load | Before, file present | After, file present |\n|---|---|---|---|---|\n`;
for (const name of ['single_required', 'managed_file_initially_hidden', 'combined', 'single_disabled', 'multi_required']) {
  md += `| ${name} | ${owned(B.load, name)} | ${owned(A.load, name)} | ${owned(B.afterUploadCombined, name)} | ${owned(A.afterUploadCombined, name)} |\n`;
}
md += `\n## Label and description associations on load\n\n| Element | Side | label | label for | resolves | aria-describedby resolves | description |\n|---|---|---|---|---|---|---|\n`;
for (const name of NAMES) for (const [side, s] of [['Before', B], ['After', A]]) {
  const x = s.load.fields[name];
  if (!x || !x.inputRendered) continue;
  md += `| ${name} | ${side} | ${x.labelText || '-'} | ${x.labelFor || '-'} | ${yn(x.labelForResolves)} | ${yn(x.described?.resolved)} | ${x.described?.text || '-'} |\n`;
}
md += `\n## Through the AJAX lifecycle\n\n|\u00a0| Before | After |\n|---|---|---|\n`;
md += `| Upload control rendered after the upload | ${yn(f(B.afterUploadCombined, 'combined').inputRendered)} | ${yn(f(A.afterUploadCombined, 'combined').inputRendered)} |\n`;
md += `| File link rendered after the upload | ${yn(f(B.afterUploadCombined, 'combined').fileLinks > 0)} | ${yn(f(A.afterUploadCombined, 'combined').fileLinks > 0)} |\n`;
md += `| Element hidden again when the visibility trigger is unchecked after the upload | ${yn(!f(B.afterUploadToggleOff, 'combined').itemVisible)} | ${yn(!f(A.afterUploadToggleOff, 'combined').itemVisible)} |\n`;
md += `| Upload control back after removing the last file | ${yn(f(B.afterRemove, 'single_required').inputRendered)} | ${yn(f(A.afterRemove, 'single_required').inputRendered)} |\n`;
md += `| Required attribute after removing the last file | ${yn(f(B.afterRemove, 'single_required').required)} | ${yn(f(A.afterRemove, 'single_required').required)} |\n`;
md += `| Required attribute after the trigger is changed again | ${yn(f(B.afterRemoveRetrigger, 'single_required').required)} | ${yn(f(A.afterRemoveRetrigger, 'single_required').required)} |\n`;
md += `| Dangling label[for] after the upload | ${B.afterUploadCombined.danglingLabelFor.join(', ') || 'none'} | ${A.afterUploadCombined.danglingLabelFor.join(', ') || 'none'} |\n`;
md += `| Focus before / after the upload | ${B.focus.beforeUpload} / ${B.focus.afterUpload} | ${A.focus.beforeUpload} / ${A.focus.afterUpload} |\n`;
md += `| Focus before / after the removal | ${B.focus.beforeRemove} / ${B.focus.afterRemove} | ${A.focus.beforeRemove} / ${A.focus.afterRemove} |\n`;
md += `| Error after the invalid upload | ${B.afterInvalid.errorText.join(' ') || 'none'} | ${A.afterInvalid.errorText.join(' ') || 'none'} |\n`;
md += `\n> After an AJAX replacement the new dependents do not receive the dependees' current state until a trigger changes (core issue #1091852). The rows above record that; they do not treat it as this MR's regression.\n`;
md += `\n## Screenshots\n\n${Object.keys(B.shots).map((k) => `- \`${path.basename(B.shots[k])}\` / \`${path.basename(A.shots[k])}\``).join('\n')}\n\n`;
md += contextMarkdown(results) + ajaxMarkdown(results) + speechMarkdown(results);
md += `axe rules: Before ${JSON.stringify(B.axe.load.rules)} then ${JSON.stringify(B.axe.after.rules)}, After ${JSON.stringify(A.axe.load.rules)} then ${JSON.stringify(A.axe.after.rules)}. JavaScript errors: Before ${JSON.stringify(B.jsErrors)}, After ${JSON.stringify(A.jsErrors)}.\n\n`;
md += unexpected === 0 ? `**Behaves as intended** on the judged rows. Read the observe rows (ownership, focus, dangling label references, #1091852) before drawing a conclusion.\n` : `**${unexpected} judged row(s) not as expected**: read the table before drawing a conclusion.\n`;
md += `\n---\nAutomated evidence is a DRAFT: DOM, AJAX and axe checks do not replace a keyboard and screen-reader pass by a person.\n`;
results.verdict = unexpected === 0 ? 'reproduced-and-fixed' : 'mixed';
results.unexpected = unexpected;
const where = writeRun(run, results, md);
console.log(`\n${unexpected === 0 ? 'OK' : 'UNEXPECTED'}: ${where}/SUMMARY.md`);
process.exit(unexpected === 0 ? 0 : 2);
