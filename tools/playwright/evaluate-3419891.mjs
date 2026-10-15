// Evidence for #3419891: the alternative text field in the CKEditor5 image dialog
// is a single-line input (~35 chars visible). Patch makes it a textarea that grows
// vertically (minRows=1, maxRows=6).
//   node tools/playwright/evaluate-3419891.mjs [slug] [--browser=chromium|firefox|webkit] [--scheme=light|dark]
//        [--forced-colors] [--viewport=WxH] [--out=<dir>]
// Defaults: slug 3419891-pinned, chromium, light, 1280x900.
import path from 'node:path';
import { runArgs, launch, openSide, axeScan, baseResults, writeRun, contextMarkdown, ajaxMarkdown, speechMarkdown } from './lib/lab-run.mjs';

const run = runArgs({ slug: '3419891-pinned' });
const { v, out } = run;
const PAGE = '/node/add/page';
const MAX_WAIT = 10000;

async function openImageDialog(page) {
  // Wait for the page to load and CKEditor5 to initialize
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);

  // Click in the body field to activate CKEditor5
  const bodyField = page.locator('.ck-editor__editable_inline, .ck-editor__editable').first();
  await bodyField.waitFor({ state: 'visible', timeout: MAX_WAIT });
  await bodyField.click();
  await page.waitForTimeout(500);

  // Click the Image button in the toolbar (has class ck-file-dialog-button)
  const imageButton = page.locator('.ck-file-dialog-button');
  await imageButton.waitFor({ state: 'visible', timeout: MAX_WAIT });
  await imageButton.click();
  await page.waitForTimeout(500);

  // The image dialog opens a rotator with file upload first.
  // Use the hidden file input to upload a test image, which advances to the alt text form.
  const fileInput = page.locator('.ck-file-dialog-button input[type="file"]');
  await fileInput.setInputFiles('/tmp/test.png');
  await page.waitForTimeout(3000);

  // Wait for the alternative text form to appear in the rotator
  const dialog = page.locator('.ck.ck-balloon-panel .ck-text-alternative-form');
  await dialog.waitFor({ state: 'visible', timeout: MAX_WAIT });
  await page.waitForTimeout(300);

  return dialog;
}

const measure = async (page) => {
  const dialog = await openImageDialog(page);
  const field = dialog.locator('.ck-labeled-field-view__input-wrapper input, .ck-labeled-field-view__input-wrapper textarea').first();
  const tagName = await field.evaluate(el => el.tagName.toLowerCase());
  const isTextarea = tagName === 'textarea';
  const minRows = isTextarea ? await field.getAttribute('minRows') : null;
  const maxRows = isTextarea ? await field.getAttribute('maxRows') : null;
  const width = await field.evaluate(el => getComputedStyle(el).width);
  const placeholder = await field.getAttribute('placeholder');
  const value = await field.inputValue();

  // Type a long string and observe behavior
  const longText = '012345678 12345678 22345678 32345678 42345678 52345678 62345678 72345678';
  await field.fill(longText);
  await page.waitForTimeout(500);

  const afterValue = await field.inputValue();
  const afterHeight = await field.evaluate(el => el.scrollHeight);
  const afterWidth = await field.evaluate(el => getComputedStyle(el).width);
  const afterRows = isTextarea ? await field.getAttribute('rows') : null;

  // Check if content is fully visible (no horizontal scroll)
  const scrollWidth = await field.evaluate(el => el.scrollWidth);
  const clientWidth = await field.evaluate(el => el.clientWidth);
  const hasHorizontalScroll = scrollWidth > clientWidth;

  // Get the form rect for context
  const formRect = await dialog.evaluate(el => el.getBoundingClientRect());

  return {
    dialogVisible: true,
    fieldTag: tagName,
    isTextarea,
    minRows: minRows ? parseInt(minRows) : null,
    maxRows: maxRows ? parseInt(maxRows) : null,
    fieldWidth: width,
    placeholder: placeholder || null,
    initialValue: value,
    longTextTyped: longText,
    afterValue,
    afterHeight,
    afterWidth,
    afterRows: afterRows ? parseInt(afterRows) : null,
    hasHorizontalScroll,
    formRect: { w: Math.round(formRect.width), h: Math.round(formRect.height) },
  };
};

async function runSide(side) {
  const { page, base, rec } = await openSide(run, side);
  const url = `${base}${PAGE}`;
  await page.goto(url, { waitUntil: 'networkidle' });

  const data = { env: v[side].env, url: PAGE };
  data.measured = await measure(page);
  data.axe = await axeScan(page);

  // Screenshot the dialog
  const dialog = page.locator('.ck.ck-balloon-panel .ck-text-alternative-form');
  await dialog.screenshot({ path: path.join(out, `${side}-dialog.png`) }).catch(() => {});
  await page.screenshot({ path: path.join(out, `${side}-page.png`) }).catch(() => {});

  await rec.collect();
  await rec.close(out);
  return Object.assign(rec, data);
}

const { browser, environment } = await launch(run);
run.browser = browser;
const results = baseResults(run, environment);
try {
  for (const side of ['before', 'after']) { console.log(`running ${side} (${v[side].env}) ...`); results.sides[side] = await runSide(side); }
} finally { await browser.close(); }

const B = results.sides.before, A = results.sides.after;

results.verdict = B.measured.isTextarea === false && A.measured.isTextarea === true
  ? 'reproduced-and-fixed'
  : B.measured.isTextarea === false && A.measured.isTextarea === false
    ? 'not-reproduced'
    : B.measured.isTextarea === true && A.measured.isTextarea === true
      ? 'reproduced-not-fixed'
      : 'mixed';
results.unexpected = results.verdict === 'reproduced-and-fixed' ? 0 : 1;

const formatMeasure = (m) => {
  const lines = [
    `  fieldTag: ${m.fieldTag}`,
    `  isTextarea: ${m.isTextarea}`,
    `  minRows: ${m.minRows ?? 'N/A'}`,
    `  maxRows: ${m.maxRows ?? 'N/A'}`,
    `  fieldWidth: ${m.fieldWidth}`,
    `  placeholder: ${m.placeholder ?? 'N/A'}`,
    `  afterValue: ${m.afterValue.slice(0, 60)}...`,
    `  afterHeight: ${m.afterHeight}px`,
    `  afterWidth: ${m.afterWidth}`,
    `  afterRows: ${m.afterRows ?? 'N/A'}`,
    `  hasHorizontalScroll: ${m.hasHorizontalScroll}`,
    `  formRect: ${m.formRect.w}x${m.formRect.h}`,
  ];
  return lines.map(l => `| ${l} |`).join('\n');
};

let md = `# Playwright evidence: #${v.issue} (${v.slug})\n\nRun ${results.when}. Core Before \`${results.commits.before}\`, After \`${results.commits.after}\`${results.patches.length ? ` plus \`${results.patches.map((p) => p.split('/').pop()).join('`, `')}\`` : ''}. ${environment.browser} ${environment.browserVersion}, ${environment.colorScheme}${environment.forcedColors ? ', forced colours' : ''}, ${run.viewport.width}x${run.viewport.height}, ${environment.os}. Recorders: tools/playwright/lib/lab-run.mjs.\n\n`;
md += `**Verdict: ${results.verdict}.** `;
md += results.verdict === 'reproduced-and-fixed'
  ? `Before has single-line input; After has textarea with vertical growth.\n\n`
  : results.verdict === 'not-reproduced'
    ? `Neither side has the expected difference.\n\n`
    : `Unexpected state: read the measurements below.\n\n`;

md += `Rule: **fix** rows must differ (Before fails, After passes); **precondition** and **regression** rows must hold on both sides; **observe** rows are recorded, not judged.\n\n`;

const checks = [
  ['precondition', 'CKEditor5 image dialog opens and shows Alternative text field', B.measured.dialogVisible && A.measured.dialogVisible],
  ['fix', 'Before: field is input; After: field is textarea', `input / ${A.measured.fieldTag}`, B.measured.fieldTag === 'input' && A.measured.fieldTag === 'textarea'],
  ['fix', 'After: textarea has minRows=1', A.measured.minRows === 1],
  ['fix', 'After: textarea has maxRows=6', A.measured.maxRows === 6],
  ['fix', 'After: textarea width is 100%', A.measured.afterWidth === '100%' || A.measured.fieldWidth === '100%'],
  ['observe', 'Before: long text scrolls horizontally', B.measured.hasHorizontalScroll ? 'yes' : 'no'],
  ['observe', 'After: long text stays visible (no horizontal scroll)', A.measured.hasHorizontalScroll ? 'yes (unexpected)' : 'no (good)'],
  ['regression', 'axe violations', B.axe.total === 0 && A.axe.total === 0],
];

md += `| Type | Check | Before | After | Verdict |\n|---|---|---|---|---|\n`;
for (const [t, label, b, a, good] of checks) md += `| ${t} | ${label} | ${b} | ${a} | ${good ? 'as expected' : '**NOT as expected**'} |\n`;
md += '\n';

md += `## Alternative text field measurements\n\nBefore:\n\n\`\`\`\n${formatMeasure(B.measured)}\n\`\`\`\n\nAfter:\n\n\`\`\`\n${formatMeasure(A.measured)}\n\`\`\`\n\n`;

md += contextMarkdown(results) + ajaxMarkdown(results) + speechMarkdown(results);
md += `axe rules: Before ${JSON.stringify(B.axe.rules)}, After ${JSON.stringify(A.axe.rules)}.\n\n`;
md += `Screenshots: \`before-dialog.png\`, \`after-dialog.png\`, \`before-page.png\`, \`after-page.png\`.\n\n`;
md += `Limits: this records the field type and dimensions after typing a long string. Whether the growth behavior is *usable* is a person's call; forced-colours and dark mode runs are separate.\n`;

console.log(writeRun(run, results, md));
console.log(`verdict: ${results.verdict}`);