// Evidence for #3419891: the alternative text field in the CKEditor5 image dialog.
//
// The issue's requirement is functional, not structural: a content editor must be able to enter
// and review alternative text of any practical length without losing sight of it. The MR changes
// the field from a single-line <input> to a CKEditor5 TextareaView (minRows=1, maxRows=6).
// This evaluator therefore judges what the field does, not only which element it is:
//
//   grow        field height increases with wrapped content
//   cap         height stops at the maxRows limit instead of growing without bound
//   scrollable  content beyond the limit stays reachable (scrollHeight > clientHeight and it scrolls)
//   no h-scroll wrapped and unbroken text do not scroll horizontally out of view
//   shrink      removing text returns the field to its small height
//   reopen      closing and reopening restores the saved value *and* a height for that value
//   controls    Save and Cancel stay visible, inside the viewport and clickable
//   focus       focus enters the field, Escape closes the form, focus returns to the editor
//   decorative  the decorative-image toggle still hides/shows the field and enables Save
//
// A visible scrollbar is NOT a requirement: macOS uses overlay scrollbars that are only painted
// while scrolling. The report records scrollbar width and overflow so an invisible overlay
// scrollbar is distinguished from content that cannot be reached.
//
// Usage:
//   node tools/playwright/evaluate-3419891.mjs [slug] [--browser=chromium|firefox|webkit]
//        [--scheme=light|dark] [--forced-colors] [--viewport=WxH] [--out=<dir>]
// Defaults: slug 3419891-pinned, chromium, light, 1280x900.
// The image fixture is generated in memory (pngjs), so no /tmp file is needed and every run uses
// the same bytes.
import path from 'node:path';
import { PNG } from 'pngjs';
import {
  runArgs,
  launch,
  openSide,
  axeScan,
  baseResults,
  writeRun,
  contextMarkdown,
  ajaxMarkdown,
  speechMarkdown,
} from './lib/lab-run.mjs';

const run = runArgs({ slug: '3419891-pinned' });
const { v, out } = run;
const PAGE = '/node/add/page';
const WAIT = 20000;
const SETTLE = 2; // frames

// ---- deterministic fixture -------------------------------------------------------------------
function fixturePng() {
  const size = 64;
  const png = new PNG({ width: size, height: size });
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const i = (size * y + x) << 2;
      const dark = (x < size / 2) !== (y < size / 2);
      const c = dark ? 0x33 : 0xcc;
      png.data[i] = c;
      png.data[i + 1] = c;
      png.data[i + 2] = c;
      png.data[i + 3] = 255;
    }
  }
  return PNG.sync.write(png);
}
const IMAGE = { name: 'lab-alt-text-3419891.png', mimeType: 'image/png', buffer: fixturePng() };

// ---- text fixtures --------------------------------------------------------------------------
// Roughly 35-40 characters fit on one line at 1280px. Lines are explicit where a count matters,
// so the grow/cap checks do not depend on the font.
const TEXT = {
  short: 'A kitten',
  wrapped3: 'A grey kitten asleep on a folded blue blanket beside a tall window, with a lamp behind it.',
  lines6: [
    'Line one of the alternative text.',
    'Line two of the alternative text.',
    'Line three of the alternative text.',
    'Line four of the alternative text.',
    'Line five of the alternative text.',
    'Line six of the alternative text.',
  ].join('\n'),
  lines10: [
    'Line one of the alternative text.',
    'Line two of the alternative text.',
    'Line three of the alternative text.',
    'Line four of the alternative text.',
    'Line five of the alternative text.',
    'Line six of the alternative text.',
    'Line seven of the alternative text.',
    'Line eight of the alternative text.',
    'Line nine of the alternative text.',
    'Line ten of the alternative text.',
  ].join('\n'),
  unbroken: `Kitten${'x'.repeat(200)}`,
  pasted: [
    'A paragraph pasted from another document.',
    'It has several lines and ends with a full stop.',
    'The field should show six rows and scroll for the rest.',
    'Line four.',
    'Line five.',
    'Line six.',
    'Line seven.',
    'Line eight.',
  ].join('\n'),
};

// ---- helpers --------------------------------------------------------------------------------
const SELECT_ALL = process.platform === 'darwin' ? 'Meta+A' : 'Control+A';
const TO_START = process.platform === 'darwin' ? 'Meta+ArrowUp' : 'Control+Home';

async function settle(page) {
  await page.evaluate((n) => new Promise((resolve) => {
    let i = 0;
    const step = () => { i += 1; if (i >= n) resolve(); else requestAnimationFrame(step); };
    requestAnimationFrame(step);
  }), SETTLE);
}

async function replaceText(page, field, text) {
  await field.click();
  await page.keyboard.press(SELECT_ALL);
  await page.keyboard.press('Backspace');
  await page.keyboard.insertText(text);
  await settle(page);
}

async function clearText(page, field) {
  await field.click();
  await page.keyboard.press(SELECT_ALL);
  await page.keyboard.press('Backspace');
  await settle(page);
}

const formLocator = (page) => page.locator('.ck.ck-balloon-panel .ck-text-alternative-form').first();
const fieldLocator = (form) => form.locator('textarea, input[type="text"]').first();

// Read both the DOM (what the user and the browser see) and the CKEditor view (why it is that
// height). The view is private API used only for evidence; every assertion is on the DOM.
async function measure(page, form) {
  await settle(page);
  const dom = await form.evaluate((el) => {
    const field = el.querySelector('textarea, input[type="text"]');
    if (!field) return null;
    const cs = getComputedStyle(field);
    const rect = field.getBoundingClientRect();
    const formRect = el.getBoundingClientRect();
    const label = el.querySelector(`label[for="${CSS.escape(field.id)}"]`);
    const byName = (name) => [...el.querySelectorAll('button')].find((b) => {
      const n = (b.getAttribute('aria-label') || b.textContent || '').trim();
      return n === name;
    }) || null;
    const hit = (b) => {
      if (!b) return false;
      const r = b.getBoundingClientRect();
      if (!r.width || !r.height) return false;
      const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      return !!top && (top === b || b.contains(top));
    };
    const save = byName('Save');
    const cancel = byName('Cancel');
    const inViewport = (r) => r.top >= 0 && r.left >= 0 && r.bottom <= innerHeight && r.right <= innerWidth;
    return {
      tag: field.tagName.toLowerCase(),
      type: field.getAttribute('type'),
      value: field.value,
      rowsAttr: field.getAttribute('rows'),
      id: field.id,
      labelText: label ? label.textContent.trim() : null,
      ariaLabel: field.getAttribute('aria-label'),
      rect: { top: rect.top, left: rect.left, width: rect.width, height: rect.height, bottom: rect.bottom, right: rect.right },
      formRect: { top: formRect.top, left: formRect.left, width: formRect.width, height: formRect.height, bottom: formRect.bottom, right: formRect.right },
      clientHeight: field.clientHeight, scrollHeight: field.scrollHeight,
      clientWidth: field.clientWidth, scrollWidth: field.scrollWidth,
      scrollTop: field.scrollTop,
      overflowY: cs.overflowY, overflowX: cs.overflowX,
      lineHeight: parseFloat(cs.lineHeight), fontSize: parseFloat(cs.fontSize),
      paddingTop: parseFloat(cs.paddingTop), paddingBottom: parseFloat(cs.paddingBottom),
      borderTop: parseFloat(cs.borderTopWidth), borderBottom: parseFloat(cs.borderBottomWidth),
      boxSizing: cs.boxSizing,
      whiteSpace: cs.whiteSpace,
      fieldInViewport: inViewport(rect),
      formInViewport: inViewport(formRect),
      save: save ? { visible: !!(save.offsetWidth && save.offsetHeight), hit: hit(save), inViewport: inViewport(save.getBoundingClientRect()), enabled: !save.disabled && save.getAttribute('aria-disabled') !== 'true' } : null,
      cancel: cancel ? { visible: !!(cancel.offsetWidth && cancel.offsetHeight), hit: hit(cancel), inViewport: inViewport(cancel.getBoundingClientRect()), enabled: !cancel.disabled && cancel.getAttribute('aria-disabled') !== 'true' } : null,
      activeIsField: document.activeElement === field,
      activeInEditable: !!(document.activeElement && document.activeElement.closest && document.activeElement.closest('.ck-editor__editable')),
      // 0 means the platform paints overlay scrollbars (macOS default); the scrollbar is not
      // expected to be visible until the user scrolls, and that is not a failure.
      platformScrollbarWidth: (() => {
        const d = document.createElement('div');
        d.style.cssText = 'position:absolute;top:-9999px;left:-9999px;width:100px;height:100px;overflow:scroll';
        document.body.appendChild(d);
        const w = d.offsetWidth - d.clientWidth;
        d.remove();
        return w;
      })(),
    };
  });
  const view = await page.evaluate(() => {
    const editor = [...((window.Drupal && window.Drupal.CKEditor5Instances && window.Drupal.CKEditor5Instances.values && window.Drupal.CKEditor5Instances.values()) || [])][0];
    if (!editor) return null;
    const plugin = editor.plugins.get('DrupalImageTextAlternativeUI');
    const fv = plugin && plugin._form && plugin._form.labeledInput && plugin._form.labeledInput.fieldView;
    if (!fv) return null;
    return {
      ctor: fv.constructor ? fv.constructor.name : null,
      minRows: fv.minRows ?? null,
      maxRows: fv.maxRows ?? null,
      height: fv._height ?? null,
      viewValue: fv.value ?? null,
      isTextarea: fv.element ? fv.element.tagName === 'TEXTAREA' : false,
    };
  });
  return { ...dom, view };
}

const maxHeight = (m) => m.lineHeight * (m.view?.maxRows ?? 6) + m.paddingTop + m.paddingBottom + m.borderTop + m.borderBottom;
const minHeight = (m) => m.lineHeight + m.paddingTop + m.paddingBottom + m.borderTop + m.borderBottom;

// ---- page flow ------------------------------------------------------------------------------
async function loadEditor(page) {
  await page.goto(`${page.base || ''}${PAGE}`, { waitUntil: 'domcontentloaded' });
  const editable = page.locator('.ck-editor__editable_inline, .ck-editor__editable').first();
  await editable.waitFor({ state: 'visible', timeout: WAIT });
  await editable.click();
  return editable;
}

async function uploadImage(page) {
  const imageButton = page.locator('.ck-file-dialog-button');
  await imageButton.waitFor({ state: 'visible', timeout: WAIT });
  const input = page.locator('.ck-file-dialog-button input[type="file"]');
  await input.waitFor({ state: 'attached', timeout: WAIT });
  try {
    const [chooser] = await Promise.all([
      page.waitForEvent('filechooser', { timeout: 8000 }),
      imageButton.click(),
    ]);
    await chooser.setFiles(IMAGE);
  } catch {
    // The button did not open a native file chooser in this browser; set the hidden input directly.
    await input.setInputFiles(IMAGE);
  }
  const form = formLocator(page);
  await form.waitFor({ state: 'visible', timeout: WAIT });
  await fieldLocator(form).waitFor({ state: 'visible', timeout: WAIT });
  await settle(page);
  return form;
}

// Reopen through the UI: select the image widget, then either the "Add missing alternative text"
// overlay (image has no alt yet) or the balloon toolbar button opens the form. A programmatic
// fallback is recorded rather than silently used.
async function reopenForm(page) {
  const widget = page.locator('.ck-widget.image, .ck-widget.image-inline').first();
  await widget.scrollIntoViewIfNeeded();
  await widget.click({ position: { x: 8, y: 8 } });
  const form = formLocator(page);
  const openedByOverlay = await form.waitFor({ state: 'visible', timeout: 2000 }).then(() => true).catch(() => false);
  if (openedByOverlay) {
    await settle(page);
    return { form, fallback: false, path: 'missing-alt-overlay' };
  }
  const button = page.locator('.ck-balloon-panel').getByRole('button', { name: 'Change image alternative text' }).first();
  try {
    await button.waitFor({ state: 'visible', timeout: 5000 });
    await button.click();
  } catch {
    await page.evaluate(() => {
      const editor = [...Drupal.CKEditor5Instances.values()][0];
      editor.plugins.get('DrupalImageTextAlternativeUI')._showForm();
    });
    await form.waitFor({ state: 'visible', timeout: WAIT });
    return { form, fallback: true, path: 'programmatic' };
  }
  await form.waitFor({ state: 'visible', timeout: WAIT });
  await settle(page);
  return { form, fallback: false, path: 'image-toolbar' };
}

async function saveForm(page, form) {
  await form.getByRole('button', { name: 'Save' }).click();
  await form.waitFor({ state: 'hidden', timeout: WAIT });
}

async function escapeForm(page, form) {
  await page.keyboard.press('Escape');
  await form.waitFor({ state: 'hidden', timeout: WAIT });
}

async function clickOutsideForm(page, editable, form) {
  await editable.click({ position: { x: 5, y: 5 } });
  await form.waitFor({ state: 'hidden', timeout: WAIT });
}

// ---- scenarios ------------------------------------------------------------------------------
async function runSide(side) {
  const { page, base, rec } = await openSide(run, side);
  page.base = base;
  const data = { env: v[side].env, url: PAGE, steps: {}, notes: [] };
  const screenshot = async (name) => {
    const form = formLocator(page);
    if (await form.isVisible().catch(() => false)) await form.screenshot({ path: path.join(out, `${side}-${name}-form.png`) }).catch(() => {});
    await page.screenshot({ path: path.join(out, `${side}-${name}-page.png`) }).catch(() => {});
  };

  const editable = await loadEditor(page);
  let form = await uploadImage(page);
  data.steps.initial = { measure: await measure(page, form) };

  // Focus enters the field on first open (decorative is off).
  data.steps.initial.focusInField = data.steps.initial.measure.activeIsField;

  // Short text: one row.
  await replaceText(page, fieldLocator(form), TEXT.short);
  data.steps.short = { measure: await measure(page, form) };
  await screenshot('short');

  // Wrapped text: grows.
  await replaceText(page, fieldLocator(form), TEXT.wrapped3);
  data.steps.wrapped = { measure: await measure(page, form) };

  // Exactly the maximum number of rows.
  await replaceText(page, fieldLocator(form), TEXT.lines6);
  data.steps.max = { measure: await measure(page, form) };
  await screenshot('max');

  // More than the maximum: height stops, content remains reachable.
  await replaceText(page, fieldLocator(form), TEXT.lines10);
  data.steps.overflow = { measure: await measure(page, form) };
  // Keyboard scrolling at the overflow height: to the top, then one page down.
  await fieldLocator(form).click();
  await page.keyboard.press(TO_START);
  const scrollTopAfterHome = await fieldLocator(form).evaluate((el) => el.scrollTop);
  await page.keyboard.press('PageDown');
  await settle(page);
  const afterPageDown = await measure(page, form);
  data.steps.overflow.keyboardScroll = { scrollTopAfterHome, scrollTopAfterPageDown: afterPageDown.scrollTop, measure: afterPageDown };
  await screenshot('overflow');

  // Unbroken word: no horizontal scrolling.
  await replaceText(page, fieldLocator(form), TEXT.unbroken);
  data.steps.unbroken = { measure: await measure(page, form) };

  // Pasted-style multiline content.
  await clearText(page, fieldLocator(form));
  await page.keyboard.insertText(TEXT.pasted);
  await settle(page);
  data.steps.pasted = { measure: await measure(page, form) };

  // Shrink: remove the text again.
  await replaceText(page, fieldLocator(form), TEXT.short);
  data.steps.shrink = { measure: await measure(page, form) };

  // Tab order and Escape.
  await fieldLocator(form).click();
  await page.keyboard.press('Tab');
  data.steps.tab = { afterTab1: await page.evaluate(() => document.activeElement && (document.activeElement.getAttribute('aria-label') || document.activeElement.textContent || '').trim().slice(0, 40)) };
  await page.keyboard.press('Tab');
  data.steps.tab.afterTab2 = await page.evaluate(() => document.activeElement && (document.activeElement.getAttribute('aria-label') || document.activeElement.textContent || '').trim().slice(0, 40));
  await page.keyboard.press('Shift+Tab');
  data.steps.tab.afterShiftTab = await page.evaluate(() => document.activeElement && (document.activeElement.getAttribute('aria-label') || document.activeElement.textContent || '').trim().slice(0, 40));

  // Reviewer concern 2, part 1: long text, cancel, reopen. Nothing was saved, so the saved value
  // is empty and the field must be back at its one-row height, not the height of the long text.
  await replaceText(page, fieldLocator(form), TEXT.lines10);
  const beforeEscape = await measure(page, form);
  await escapeForm(page, form);
  data.steps.escape = { heightBeforeEscape: beforeEscape.rect.height, focusInEditable: await page.evaluate(() => !!(document.activeElement && document.activeElement.closest && document.activeElement.closest('.ck-editor__editable'))) };
  let reopened = await reopenForm(page); form = reopened.form;
  data.steps.reopenCancelPath = { fallback: reopened.fallback, path: reopened.path };
  data.steps.reopenAfterCancel = { measure: await measure(page, form) };
  await screenshot('reopen-after-cancel');

  // Reviewer concern 2, part 2: save long text, reopen: value and height both come back.
  await replaceText(page, fieldLocator(form), TEXT.lines10);
  await saveForm(page, form);
  reopened = await reopenForm(page); form = reopened.form;
  data.steps.reopenSavedPath = { fallback: reopened.fallback, path: reopened.path };
  data.steps.reopenSavedLong = { measure: await measure(page, form) };
  await screenshot('reopen-saved-long');

  // Replace long with short and save, then reopen.
  await replaceText(page, fieldLocator(form), TEXT.short);
  await saveForm(page, form);
  reopened = await reopenForm(page); form = reopened.form;
  data.steps.reopenShortPath = { fallback: reopened.fallback, path: reopened.path };
  data.steps.reopenSavedShort = { measure: await measure(page, form) };

  // Repeated reopen with the same value.
  const repeats = [];
  for (let i = 0; i < 3; i += 1) {
    await escapeForm(page, form);
    ({ form } = await reopenForm(page));
    repeats.push((await measure(page, form)).rect.height);
  }
  data.steps.repeatedReopen = { heights: repeats };

  // Decorative toggle hides the field and enables Save; untoggling shows it again.
  await form.getByRole('button', { name: 'Decorative image' }).click();
  await settle(page);
  data.steps.decorativeOn = {
    fieldVisible: await fieldLocator(form).isVisible().catch(() => false),
    saveEnabled: await form.getByRole('button', { name: 'Save' }).isEnabled().catch(() => false),
  };
  await form.getByRole('button', { name: 'Decorative image' }).click();
  await settle(page);
  data.steps.decorativeOff = { measure: await measure(page, form) };

  // Controls and form inside the viewport (also checked for dark/forced colours runs).
  data.steps.controls = { measure: await measure(page, form) };
  await screenshot('controls');

  // Click outside (reviewer's "by accident" path) and reopen once more.
  await clickOutsideForm(page, editable, form);
  ({ form } = await reopenForm(page));
  data.steps.reopenAfterOutside = { measure: await measure(page, form) };

  data.axe = await axeScan(page);
  data.notes.push(`platform scrollbar width ${data.steps.initial.measure.platformScrollbarWidth}px (0 means overlay scrollbars; an unpainted scrollbar is not a failure)`);

  await rec.collect();
  await rec.close(out);
  return Object.assign(rec, data);
}

const { browser, environment } = await launch(run);
run.browser = browser;
const results = baseResults(run, environment);
try {
  for (const side of ['before', 'after']) {
    console.log(`running ${side} (${v[side].env}) ...`);
    results.sides[side] = await runSide(side);
  }
} finally { await browser.close(); }

// ---- requirements ---------------------------------------------------------------------------
// `core: true` requirements gate the verdict on the After side. Before-side core requirements are
// recorded as baseline information (the issue is that they fail there), not as run failures.
function requirements(side) {
  const s = results.sides[side].steps;
  const h = (step) => s[step].measure.rect.height;
  const cap = maxHeight(s.max.measure);
  const min = minHeight(s.short.measure);
  const near = (a, b, tol = 2) => Math.abs(a - b) <= tol;
  const out = [];
  const add = (id, label, pass, detail, core = true) => out.push({ id, label, pass: !!pass, detail, core, side });

  add('name', 'Accessible name is "Alternative text"', s.initial.measure.labelText === 'Alternative text' || s.initial.measure.ariaLabel === 'Alternative text', `label ${s.initial.measure.labelText || '(none)'}, aria-label ${s.initial.measure.ariaLabel || '(none)'}`, false);
  add('multiline', 'Field is a multiline textarea', s.initial.measure.tag === 'textarea', `<${s.initial.measure.tag}>`, false);
  add('grow', 'Field grows when text wraps', h('wrapped') > h('short') + 2, `${h('short')}px short → ${h('wrapped')}px wrapped`);
  add('cap', 'Field stops growing at the 6-row limit', near(h('overflow'), h('max'), 2) && h('overflow') <= cap + 2, `${h('max')}px at 6 rows, ${h('overflow')}px at 10 rows, limit ${cap.toFixed(1)}px`);
  add('scrollable', 'Text beyond the limit is reachable (vertical scroll)', s.overflow.measure.scrollHeight > s.overflow.measure.clientHeight + 1 && !['hidden', 'clip'].includes(s.overflow.measure.overflowY) && s.overflow.keyboardScroll.scrollTopAfterPageDown > s.overflow.keyboardScroll.scrollTopAfterHome, `scrollHeight ${s.overflow.measure.scrollHeight}, clientHeight ${s.overflow.measure.clientHeight}, overflow-y ${s.overflow.measure.overflowY}, scrollTop ${s.overflow.keyboardScroll.scrollTopAfterHome}→${s.overflow.keyboardScroll.scrollTopAfterPageDown}`);
  add('no-h-scroll', 'Unbroken long text does not scroll sideways', s.unbroken.measure.scrollWidth <= s.unbroken.measure.clientWidth + 1, `scrollWidth ${s.unbroken.measure.scrollWidth}, clientWidth ${s.unbroken.measure.clientWidth}`);
  add('shrink', 'Field shrinks when text is removed', h('shrink') <= min + 2, `${h('shrink')}px after clearing, one-row height ~${min.toFixed(1)}px`);
  add('reopen-cancel', 'Cancel then reopen restores the saved (empty) value, a small field and a disabled Save', s.reopenAfterCancel.measure.value === '' && s.reopenAfterCancel.measure.rect.height <= min + 2 && s.reopenAfterCancel.measure.save && s.reopenAfterCancel.measure.save.enabled === false, `value "${s.reopenAfterCancel.measure.value}", height ${s.reopenAfterCancel.measure.rect.height}px, Save enabled ${s.reopenAfterCancel.measure.save && s.reopenAfterCancel.measure.save.enabled} (long text before Escape was ${s.escape.heightBeforeEscape}px)`);
  add('save-state', 'Save is disabled for empty text and enabled once text is typed', s.initial.measure.save && s.initial.measure.save.enabled === false && s.short.measure.save && s.short.measure.save.enabled === true, `initial enabled ${s.initial.measure.save && s.initial.measure.save.enabled}, after typing enabled ${s.short.measure.save && s.short.measure.save.enabled}`);
  add('reopen-long', 'Save long text then reopen restores value and capped height', s.reopenSavedLong.measure.value === TEXT.lines10 && near(s.reopenSavedLong.measure.rect.height, h('overflow'), 2), `value length ${s.reopenSavedLong.measure.value.length}, height ${s.reopenSavedLong.measure.rect.height}px`);
  add('reopen-short', 'Save short text over long then reopen restores value and small height', s.reopenSavedShort.measure.value === TEXT.short && s.reopenSavedShort.measure.rect.height <= min + 2, `value "${s.reopenSavedShort.measure.value}", height ${s.reopenSavedShort.measure.rect.height}px`);
  add('repeated-reopen', 'Repeated reopen keeps a stable height', new Set(s.repeatedReopen.heights.map((x) => Math.round(x))).size <= 1, `heights ${s.repeatedReopen.heights.map((x) => `${x}px`).join(', ')}`);
  const c = s.controls.measure;
  add('controls', 'Save and Cancel are visible, inside the viewport and clickable', !!(c.save && c.save.visible && c.save.hit && c.save.inViewport && c.cancel && c.cancel.visible && c.cancel.hit && c.cancel.inViewport) && c.formInViewport, `Save ${JSON.stringify(c.save)}, Cancel ${JSON.stringify(c.cancel)}, form in viewport ${c.formInViewport}`);
  add('focus', 'Focus enters the field; Escape returns focus to the editor', s.initial.focusInField && s.escape.focusInEditable, `initial focus in field ${s.initial.focusInField}, focus in editor after Escape ${s.escape.focusInEditable}`);
  add('tab-order', 'Tab and Shift+Tab reach Save and Cancel predictably', /Save/.test(s.tab.afterTab1 || '') && /Cancel/.test(s.tab.afterTab2 || ''), `Tab→"${s.tab.afterTab1}", Tab→"${s.tab.afterTab2}", Shift+Tab→"${s.tab.afterShiftTab}"`, false);
  add('decorative', 'Decorative toggle hides the field, enables Save and restores it', s.decorativeOn.fieldVisible === false && s.decorativeOn.saveEnabled === true && s.decorativeOff.measure.rect.height <= min + 2, `hidden ${!s.decorativeOn.fieldVisible}, Save enabled ${s.decorativeOn.saveEnabled}, height after untoggle ${s.decorativeOff.measure.rect.height}px`);
  add('axe', 'No axe-core violations (WCAG 2.0/2.1/2.2 A/AA) with the form open', results.sides[side].axe.total === 0, `${results.sides[side].axe.total} node(s): ${JSON.stringify(results.sides[side].axe.rules)}`, false);
  return out;
}

results.requirements = { before: requirements('before'), after: requirements('after') };
const afterCore = results.requirements.after.filter((r) => r.core);
const beforeInitial = results.sides.before.steps.initial.measure;
const beforeOverflow = results.sides.before.steps.overflow.measure;
const beforeReproduces = beforeInitial.tag === 'input' && beforeOverflow.scrollWidth > beforeOverflow.clientWidth;
const afterFailures = afterCore.filter((r) => !r.pass);

results.verdict = beforeInitial.tag !== 'input'
  ? 'mixed'
  : !beforeReproduces
    ? 'not-reproduced'
    : afterFailures.length === 0
      ? 'reproduced-and-fixed'
      : 'reproduced-not-fixed';
results.unexpected = afterFailures.length;
results.observations = {
  platformScrollbarWidth: results.sides.after.steps.initial.measure.platformScrollbarWidth,
  beforeOverflow: { overflowY: beforeOverflow.overflowY, scrollHeight: beforeOverflow.scrollHeight, clientHeight: beforeOverflow.clientHeight },
  afterOverflow: { overflowY: results.sides.after.steps.overflow.measure.overflowY, scrollHeight: results.sides.after.steps.overflow.measure.scrollHeight, clientHeight: results.sides.after.steps.overflow.measure.clientHeight },
  reopenPaths: ['reopenCancelPath', 'reopenSavedPath', 'reopenShortPath'].map((k) => results.sides.after.steps[k]).filter(Boolean),
  reopenFallbackUsed: ['reopenCancelPath', 'reopenSavedPath', 'reopenShortPath'].some((k) => results.sides.after.steps[k] && results.sides.after.steps[k].fallback),
};

// ---- report ---------------------------------------------------------------------------------
const px = (n) => `${Math.round(n * 10) / 10}px`;
const row = (label, value) => `| ${label} | ${value} |`;

const table = (step) => {
  const m = step.measure;
  return [
    row('Value length', `${(m.value || '').length} characters`),
    row('Element', `<${m.tag}>${m.type ? ` type="${m.type}"` : ''}${m.rowsAttr ? ` rows="${m.rowsAttr}"` : ''}`),
    row('CKEditor view', m.view ? `\`${m.view.ctor}\` minRows=${m.view.minRows} maxRows=${m.view.maxRows} _height=${m.view.height}` : 'not readable'),
    row('Rendered height (getBoundingClientRect)', px(m.rect.height)),
    row('clientHeight / scrollHeight', `${m.clientHeight} / ${m.scrollHeight}`),
    row('clientWidth / scrollWidth', `${m.clientWidth} / ${m.scrollWidth}`),
    row('computed overflow-y / overflow-x', `${m.overflowY} / ${m.overflowX}`),
    row('line-height, padding, borders, box-sizing', `${m.lineHeight}px, ${m.paddingTop}/${m.paddingBottom}px, ${m.borderTop}/${m.borderBottom}px, ${m.boxSizing}`),
    row('scrollTop after the interaction', `${m.scrollTop}`),
  ].join('\n');
};

let md = `# Playwright evidence: #${v.issue} (${v.slug})\n\n`;
md += `Run ${results.when}. Before \`${results.commits.before}\`, After \`${results.commits.after}\`${results.patches.length ? ` plus \`${results.patches.map((p) => p.split('/').pop()).join('`, `')}\`` : ''}. ${environment.browser} ${environment.browserVersion}, ${environment.colorScheme}${environment.forcedColors ? ', forced colours' : ''}, ${run.viewport.width}x${run.viewport.height}, ${environment.os}. Recorders: tools/playwright/lib/lab-run.mjs. Image fixture: 64x64 PNG generated in memory (no /tmp file).\n\n`;
md += `**Verdict: ${results.verdict}.** `;
if (results.verdict === 'reproduced-and-fixed') md += `The Baseline (Before) single-line field scrolls long alternative text out of view; the After field grows, stops at six rows, stays scrollable, shrinks, and restores its value and height when reopened.\n\n`;
else if (results.verdict === 'reproduced-not-fixed') md += `${afterFailures.length} After-side requirement(s) failed: ${afterFailures.map((r) => r.id).join(', ')}.\n\n`;
else if (results.verdict === 'not-reproduced') md += `The Before field did not behave as the issue describes (it did not scroll long text horizontally), so there is nothing to compare.\n\n`;
else md += `Unexpected state: the Before field is not the single-line input this issue is about.\n\n`;

md += `Rule: requirements marked \`core\` are functional and decide the verdict on the After side. Before-side core rows are baseline evidence (failing there is the issue). \`observe\` rows are not judged. A scrollbar that is not painted is not a failure when the content still scrolls (macOS overlay scrollbars).\n\n`;
md += `| Side | Requirement | Result | Detail |\n|---|---|---|---|\n`;
for (const side of ['before', 'after']) for (const r of results.requirements[side]) md += `| ${side} | ${r.label}${r.core ? '' : ' (observe)'} | ${r.pass ? 'pass' : 'FAIL'} | ${r.detail.replace(/\|/g, '/')} |\n`;
md += '\n';
md += `## Measurements\n\n### Before — ${beforeInitial.tag}\n\n${table(results.sides.before.steps.initial)}\n\nOverflow state:\n\n${table(results.sides.before.steps.overflow)}\n\n`;
md += `### After — ${results.sides.after.steps.initial.measure.tag}\n\nInitial (empty):\n\n${table(results.sides.after.steps.initial)}\n\nShort text:\n\n${table(results.sides.after.steps.short)}\n\nWrapped text:\n\n${table(results.sides.after.steps.wrapped)}\n\nSix rows:\n\n${table(results.sides.after.steps.max)}\n\nTen rows (overflow):\n\n${table(results.sides.after.steps.overflow)}\n\nAfter clearing back to short:\n\n${table(results.sides.after.steps.shrink)}\n\nReopened after Cancel:\n\n${table(results.sides.after.steps.reopenAfterCancel)}\n\nReopened after saving long text:\n\n${table(results.sides.after.steps.reopenSavedLong)}\n\nReopened after saving short text:\n\n${table(results.sides.after.steps.reopenSavedShort)}\n\n`;
md += `## Observations\n\n`;
md += `- Platform scrollbar width: **${results.observations.platformScrollbarWidth}px** (0 = overlay scrollbars; the scrollbar is painted only while scrolling).\n`;
md += `- Reopen path: ${results.observations.reopenPaths.map((x) => x.path).join(', ') || 'not recorded'}${results.observations.reopenFallbackUsed ? ' (at least one reopen used the programmatic fallback; see results.json)' : ''}.\n`;
md += `- Repeated reopen heights: ${results.sides.after.steps.repeatedReopen.heights.map((x) => `${Math.round(x)}px`).join(', ')}.\n`;
md += `- Before overflow: scrollHeight ${beforeOverflow.scrollHeight} vs clientHeight ${beforeOverflow.clientHeight}, overflow-y ${beforeOverflow.overflowY}.\n`;
md += `- After overflow: scrollHeight ${results.sides.after.steps.overflow.measure.scrollHeight} vs clientHeight ${results.sides.after.steps.overflow.measure.clientHeight}, overflow-y ${results.sides.after.steps.overflow.measure.overflowY}.\n\n`;
md += contextMarkdown(results) + ajaxMarkdown(results) + speechMarkdown(results);
md += `axe rules: Before ${JSON.stringify(results.sides.before.axe.rules)}, After ${JSON.stringify(results.sides.after.axe.rules)}.\n\n`;
md += `Screenshots: \`before-*-form.png\`, \`before-*-page.png\`, \`after-*-form.png\`, \`after-*-page.png\` (short, max, overflow, reopen-after-cancel, reopen-saved-long, controls).\n\n`;
md += `Limits: this records one browser, one scheme, one viewport per run. Zoom, real Safari (as opposed to Playwright WebKit), VoiceOver and a person's keyboard pass are separate evidence.\n`;

console.log(writeRun(run, results, md));
console.log(`verdict: ${results.verdict}; failed After requirements: ${afterFailures.length}`);
