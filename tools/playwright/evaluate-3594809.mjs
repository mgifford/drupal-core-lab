// Evidence for #3594809: Use standard checkboxes on forms that require submission (MR !16770).
//   node tools/playwright/evaluate-3594809.mjs [slug] [--browser=chromium|firefox|webkit]
//     [--scheme=light|dark] [--forced-colors] [--viewport=WxH] [--rtl] [--reduced-motion] [--out=<dir>]
//
// The primary page is the real /admin/appearance/settings form from a Standard install. It records
// native semantics, computed presentation, trusted keyboard and pointer input, save/reload
// persistence, representative checkbox/radio regressions, axe results, screenshots and the
// accessibility snapshots produced by the browser.
import path from 'node:path';
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

const run = runArgs({ slug: '3594809-pinned' });
const { v, out } = run;
run.rtl = process.argv.includes('--rtl');
run.reducedMotion = process.argv.includes('--reduced-motion');

const PRIMARY_PAGE = '/admin/appearance/settings';
const PRIMARY = 'input[name="toggle_favicon"]';
const CONTROL = '.form-item:has(> input[name="toggle_favicon"])';

const probeInput = (page, selector) => page.evaluate((selector) => {
  const input = document.querySelector(selector);
  if (!input) return null;
  const clean = (value) => String(value || '').replace(/\s+/g, ' ').trim();
  const style = getComputedStyle(input);
  const before = getComputedStyle(input, '::before');
  const after = getComputedStyle(input, '::after');
  const labels = [...(input.labels || [])].map((label) => clean(label.textContent));
  return {
    tag: input.tagName.toLowerCase(),
    type: input.getAttribute('type'),
    role: input.getAttribute('role'),
    name: input.getAttribute('name'),
    id: input.id || null,
    checked: input.checked,
    disabled: input.disabled,
    ariaChecked: input.getAttribute('aria-checked'),
    ariaDisabled: input.getAttribute('aria-disabled'),
    labels,
    formItemClasses: input.closest('.form-item')?.className || null,
    style: {
      appearance: style.appearance,
      width: style.width,
      height: style.height,
      border: `${style.borderTopWidth} ${style.borderTopStyle} ${style.borderTopColor}`,
      borderRadius: style.borderRadius,
      backgroundColor: style.backgroundColor,
      backgroundImage: style.backgroundImage,
      boxShadow: style.boxShadow,
      outline: `${style.outlineWidth} ${style.outlineStyle} ${style.outlineColor}`,
      outlineOffset: style.outlineOffset,
      forcedColorAdjust: style.forcedColorAdjust,
    },
    pseudo: {
      beforeContent: before.content,
      beforeTransform: before.transform,
      beforeBackground: before.backgroundColor,
      afterContent: after.content,
      afterTransform: after.transform,
      afterBackground: after.backgroundColor,
      afterMaskImage: after.maskImage,
    },
  };
}, selector);

const pageProbe = (page) => page.evaluate(() => {
  const inputs = [...document.querySelectorAll('input[type="checkbox"]')];
  const switches = [...document.querySelectorAll('[role="switch"], input[aria-checked], .switch, .toggle')]
    .map((element) => ({
      tag: element.tagName.toLowerCase(),
      role: element.getAttribute('role'),
      type: element.getAttribute('type'),
      classes: element.className,
    }));
  return {
    title: document.querySelector('h1')?.textContent?.trim() || null,
    checkboxCount: inputs.length,
    disabledCheckboxCount: inputs.filter((input) => input.disabled).length,
    saveButtons: document.querySelectorAll('form#system-theme-settings input[type="submit"]').length,
    direction: document.documentElement.dir || 'ltr',
    darkMode: document.documentElement.classList.contains('dark-mode'),
    forcedColors: matchMedia('(forced-colors: active)').matches,
    reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
    colorScheme: matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
    switches,
  };
});

const waitForPage = async (page) => {
  await page.waitForLoadState('load');
  await page.locator(PRIMARY).waitFor({ state: 'visible', timeout: 15000 });
  if (run.scheme === 'dark') {
    await page.evaluate(() => document.documentElement.classList.add('dark-mode'));
  }
  if (run.rtl) {
    await page.evaluate(() => {
      document.documentElement.dir = 'rtl';
    });
  }
  if (run.reducedMotion) {
    await page.emulateMedia({
      reducedMotion: 'reduce',
      colorScheme: run.scheme,
      forcedColors: run.forced ? 'active' : 'none',
    });
  }
};

async function tabTo(page, target, limit = 160) {
  await page.evaluate(() => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
  });
  for (let tabs = 1; tabs <= limit; tabs++) {
    await page.keyboard.press('Tab');
    if (await target.evaluate((element) => document.activeElement === element)) {
      return { reached: true, tabs };
    }
  }
  return { reached: false, tabs: limit };
}

async function accessibilityAndAxe(page) {
  const input = page.locator(PRIMARY);
  return {
    aria: await input.ariaSnapshot(),
    axe: await axeScan(page),
  };
}

async function captureRepresentativePages(page, base, side) {
  const representative = {};

  await page.goto(base + '/admin/people/permissions');
  await page.waitForLoadState('load');
  const permission = page.locator('input[type="checkbox"]').first();
  representative.grouped = {
    count: await page.locator('input[type="checkbox"]').count(),
    present: await permission.count() > 0,
  };
  if (representative.grouped.present) {
    representative.grouped.input = await probeInput(page, 'input[type="checkbox"]');
    representative.grouped.aria = await permission.ariaSnapshot();
    representative.grouped.axe = await axeScan(page);
    await permission.locator('xpath=..').screenshot({
      path: path.join(out, `${side}-grouped-checkbox.png`),
    });
  }

  await page.goto(base + '/admin/config/development/performance');
  await page.waitForLoadState('load');
  const radio = page.locator('input[type="radio"]').first();
  representative.radio = {
    count: await page.locator('input[type="radio"]').count(),
    present: await radio.count() > 0,
  };
  if (representative.radio.present) {
    representative.radio.input = await probeInput(page, 'input[type="radio"]');
    representative.radio.aria = await radio.ariaSnapshot();
    representative.radio.axe = await axeScan(page);
    await radio.locator('xpath=..').screenshot({
      path: path.join(out, `${side}-radio.png`),
    });
  }

  return representative;
}

async function runSide(side) {
  const { page, base, rec } = await openSide(run, side);
  await page.goto(base + PRIMARY_PAGE);
  await waitForPage(page);
  const target = page.locator(PRIMARY);
  const item = page.locator(CONTROL).first();
  const initial = await probeInput(page, PRIMARY);
  const pageState = await pageProbe(page);
  const initialEvidence = await accessibilityAndAxe(page);
  await page.screenshot({
    path: path.join(out, `${side}-appearance-settings.png`),
    fullPage: true,
  });
  await item.screenshot({ path: path.join(out, `${side}-control-${initial.checked ? 'checked' : 'unchecked'}.png`) });

  const keyboard = await tabTo(page, target);
  const keyboardFocus = await probeInput(page, PRIMARY);
  await item.screenshot({ path: path.join(out, `${side}-control-focus.png`) });
  if (keyboard.reached) {
    await page.keyboard.press('Space');
  }
  const afterKeyboard = await probeInput(page, PRIMARY);
  await item.screenshot({
    path: path.join(out, `${side}-control-${afterKeyboard.checked ? 'checked' : 'unchecked'}-keyboard.png`),
  });

  await page.reload();
  await waitForPage(page);
  const afterDiscard = await probeInput(page, PRIMARY);

  await item.locator('label').first().click();
  const afterLabelActivation = await probeInput(page, PRIMARY);
  await page.reload();
  await waitForPage(page);

  await target.click();
  const pendingPointer = await probeInput(page, PRIMARY);
  await page.locator('form#system-theme-settings input[type="submit"]').first().click();
  await page.waitForLoadState('load');
  await waitForPage(page);
  const afterSubmit = await probeInput(page, PRIMARY);
  await page.reload();
  await waitForPage(page);
  const afterReload = await probeInput(page, PRIMARY);

  if (afterReload.checked !== initial.checked) {
    await target.click();
    await page.locator('form#system-theme-settings input[type="submit"]').first().click();
    await page.waitForLoadState('load');
    await waitForPage(page);
  }
  const restored = await probeInput(page, PRIMARY);
  const disabled = page.locator('input[type="checkbox"]:disabled').first();
  const disabledEvidence = await disabled.count() ? {
    present: true,
    input: await probeInput(page, 'input[type="checkbox"]:disabled'),
    aria: await disabled.ariaSnapshot(),
  } : { present: false, note: 'No disabled checkbox is present on the real Appearance settings form.' };
  if (disabledEvidence.present) {
    await disabled.locator('xpath=..').screenshot({
      path: path.join(out, `${side}-disabled-checkbox.png`),
    });
  }

  const representative = await captureRepresentativePages(page, base, side);
  await rec.collect();
  await rec.close(out);
  return Object.assign(rec, {
    pageState,
    initial,
    initialEvidence,
    keyboard: { ...keyboard, focus: keyboardFocus, afterToggle: afterKeyboard },
    afterDiscard,
    afterLabelActivation,
    pendingPointer,
    afterSubmit,
    afterReload,
    restored,
    disabled: disabledEvidence,
    representative,
  });
}

const { browser, environment } = await launch(run);
run.browser = browser;
const results = baseResults(run, {
  ...environment,
  direction: run.rtl ? 'rtl-simulation' : 'native',
  reducedMotion: run.reducedMotion,
  page: PRIMARY_PAGE,
});

try {
  for (const side of ['before', 'after']) {
    console.log(`running ${side} (${v[side].env}) ...`);
    results.sides[side] = await runSide(side);
  }
} finally {
  await browser.close();
}

const before = results.sides.before;
const after = results.sides.after;
const style = (side) => side.initial?.style || {};
const same = (left, right) => JSON.stringify(left) === JSON.stringify(right);
const yesNo = (value) => value ? 'yes' : 'no';
const axeFindings = (scan) => (scan.violations || [])
  .flatMap((violation) => violation.nodes.map((node) => `${violation.id}:${node.target}`))
  .sort();
const rows = [
  ['context', 'Appearance settings form rendered with Default Admin', before.pageState.title, after.pageState.title, before.pageState.title === after.pageState.title && before.pageState.checkboxCount > 0],
  ['fix', 'Shortcut icon control uses the shared 21px square checkbox width', style(before).width, style(after).width, style(before).width === '40px' && style(after).width === '21px'],
  ['fix', 'Toggle pseudo-element is removed from the checkbox', before.initial.pseudo.beforeContent, after.initial.pseudo.beforeContent, before.initial.pseudo.beforeContent !== 'none' && after.initial.pseudo.beforeContent === 'none'],
  ['regression', 'Native checkbox semantics are preserved', `${before.initial.tag}/${before.initial.type}/${before.initial.role || 'no role'}`, `${after.initial.tag}/${after.initial.type}/${after.initial.role || 'no role'}`, before.initial.tag === 'input' && before.initial.type === 'checkbox' && after.initial.type === 'checkbox' && before.initial.role === null && after.initial.role === null],
  ['regression', 'Accessible labels are unchanged', before.initial.labels.join('; '), after.initial.labels.join('; '), same(before.initial.labels, after.initial.labels) && before.initial.labels.length > 0],
  ['regression', 'The real Tab sequence reaches the checkbox', `${yesNo(before.keyboard.reached)} (${before.keyboard.tabs})`, `${yesNo(after.keyboard.reached)} (${after.keyboard.tabs})`, before.keyboard.reached && after.keyboard.reached],
  ['regression', 'Space toggles the focused checkbox with real keyboard input', `${before.initial.checked} → ${before.keyboard.afterToggle?.checked}`, `${after.initial.checked} → ${after.keyboard.afterToggle?.checked}`, before.initial.checked !== before.keyboard.afterToggle?.checked && after.initial.checked !== after.keyboard.afterToggle?.checked],
  ['regression', 'The associated label toggles the checkbox with a real pointer click', `${before.initial.checked} → ${before.afterLabelActivation?.checked}`, `${after.initial.checked} → ${after.afterLabelActivation?.checked}`, before.initial.checked !== before.afterLabelActivation?.checked && after.initial.checked !== after.afterLabelActivation?.checked],
  ['regression', 'A pending value is discarded on reload before submission', `${before.afterDiscard.checked === before.initial.checked}`, `${after.afterDiscard.checked === after.initial.checked}`, before.afterDiscard.checked === before.initial.checked && after.afterDiscard.checked === after.initial.checked],
  ['regression', 'A submitted value persists after reload', `${before.afterReload.checked === before.pendingPointer.checked}`, `${after.afterReload.checked === after.pendingPointer.checked}`, before.afterReload.checked === before.pendingPointer.checked && after.afterReload.checked === after.pendingPointer.checked],
  ['regression', 'Original saved value is restored after the test', `${before.restored.checked === before.initial.checked}`, `${after.restored.checked === after.initial.checked}`, before.restored.checked === before.initial.checked && after.restored.checked === after.initial.checked],
  ['observe', 'Disabled checkbox present on the real form', yesNo(before.disabled.present), yesNo(after.disabled.present), true],
  ['regression', 'Representative grouped permission checkbox remains 21px square', `${before.representative.grouped.input?.style?.width || 'not found'} × ${before.representative.grouped.input?.style?.height || 'not found'}`, `${after.representative.grouped.input?.style?.width || 'not found'} × ${after.representative.grouped.input?.style?.height || 'not found'}`, before.representative.grouped.input && after.representative.grouped.input && before.representative.grouped.input.style.width === '21px' && before.representative.grouped.input.style.height === '21px' && after.representative.grouped.input.style.width === '21px' && after.representative.grouped.input.style.height === '21px'],
  ['regression', 'Representative radio control is present and unchanged', JSON.stringify(before.representative.radio.input?.style || null), JSON.stringify(after.representative.radio.input?.style || null), before.representative.radio.present && after.representative.radio.present && same(before.representative.radio.input?.style, after.representative.radio.input?.style)],
  ['observe', 'Role=switch or explicit toggle controls on the tested form', before.pageState.switches.length, after.pageState.switches.length, true],
  ['regression', 'axe rule and element findings are unchanged', axeFindings(before.initialEvidence.axe).join('; ') || 'none', axeFindings(after.initialEvidence.axe).join('; ') || 'none', same(axeFindings(before.initialEvidence.axe), axeFindings(after.initialEvidence.axe))],
  ['regression', 'Core CSS source/output check does not fail the After stack', 'n/a', results.cssBuild?.overall || 'not recorded', results.cssBuild?.overall !== 'FAIL'],
  ['regression', 'JavaScript errors', before.jsErrors.length, after.jsErrors.length, before.jsErrors.length === 0 && after.jsErrors.length === 0],
];

let unexpected = 0;
let markdown = `# Playwright evidence: #${v.issue} (${v.slug})\n\nRun ${results.when}. Core Before \`${results.commits.before}\`, After \`${results.commits.after}\` plus \`${(results.patches[0] || 'none').split('/').pop()}\`. ${environment.browser} ${environment.browserVersion}, ${environment.colorScheme}${environment.forcedColors ? ', forced colors' : ''}, ${run.viewport.width}x${run.viewport.height}, ${environment.os}${run.rtl ? ', RTL direction simulation' : ''}${run.reducedMotion ? ', reduced motion' : ''}.\n\nThe primary evidence comes from the real Standard-install \`${PRIMARY_PAGE}\` form. The script uses Playwright trusted pointer and keyboard input. Axe covers WCAG 2.0 through 2.2 A/AA checks but does not establish conformance.\n\n| Type | Check | Before | After | Verdict |\n|---|---|---|---|---|\n`;
for (const [type, label, left, right, good] of rows) {
  const judged = type === 'fix' || type === 'regression';
  if (judged && !good) unexpected++;
  markdown += `| ${type} | ${label} | ${left} | ${right} | ${judged ? (good ? 'as expected' : '**NOT as expected**') : 'recorded'} |\n`;
}
for (const side of ['before', 'after']) {
  markdown += `\n## ${side === 'before' ? 'Before' : 'After'} browser accessibility snapshot\n\n\`\`\`yaml\n${results.sides[side].initialEvidence.aria.trim()}\n\`\`\`\n`;
}
markdown += contextMarkdown(results) + ajaxMarkdown(results) + speechMarkdown(results);
markdown += `## Visual and diagnostic evidence\n\n`;
markdown += `The checkbox crops are in \`before-control-checked.png\`, \`before-control-unchecked.png\`, \`after-control-checked.png\`, \`after-control-unchecked.png\`, plus focus captures and full-page images for each side. Representative grouped-checkbox and radio captures are also included.\n\n`;
markdown += `Forced colors are browser emulation, not a native Windows contrast theme. RTL is a direction-only simulation. The ${run.viewport.width}x${run.viewport.height} viewport records reflow conditions; it is not a substitute for a person testing 200% or 400% browser zoom. No real VoiceOver, NVDA, keyboard review by a person, or native contrast-theme test was performed.\n\n`;
markdown += unexpected === 0
  ? '**The imported patch behaves as intended on the judged rows.** The visual change aligns the rendered control with its existing native checkbox semantics while preserving save behavior.\n'
  : `**${unexpected} judged row(s) were not as expected.** Review the table before drawing a conclusion.\n`;
markdown += '\n---\nAutomated evidence is a DRAFT: DOM, CSS, screenshots and axe do not replace visual and assistive-technology testing by a person.\n';

results.verdict = unexpected === 0 ? 'reproduced-and-fixed' : 'mixed';
results.unexpected = unexpected;
const where = writeRun(run, results, markdown);
console.log(`\n${results.verdict} (${unexpected} judged row(s) not as expected): ${where}/SUMMARY.md`);
process.exit(unexpected === 0 ? 0 : 2);
