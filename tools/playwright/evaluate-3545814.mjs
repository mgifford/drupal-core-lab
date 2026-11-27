// Evidence for #3545814: exposed filters with exposed operators are missing accessible names.
//   node tools/playwright/evaluate-3545814.mjs [slug] [--browser=chromium|firefox|webkit] [--scheme=light|dark] [--forced-colors] [--viewport=WxH] [--out=<dir>]
// Defaults: slug 3545814-pinned (Before: core at the MR base; After: the same core + MR !13201), chromium, light, 1280x900.
// For each side it opens /repro-3545814 (the recipe's View), records the native label association and the
// computed accessible name of every value and operator control, runs axe, then submits real filter values
// (ID greater than, ID between, ID empty, content type, Tags) and records the results. It then opens the View
// configuration preview, clicks "Update preview" and records the same controls there. The second numeric filter
// with a fixed operator is the visual-regression case from the issue summary.
// Writes reports/issues/3545814/playwright/<stamp>-<envTag>/ (results.json, SUMMARY.md, ax-*.json, *.png) or --out.
// Real input only (Playwright click/selectOption/fill); the context, AJAX and announcements are recorded by lib/lab-run.mjs.
import path from 'node:path';
import { runArgs, launch, openSide, axeScan, baseResults, writeRun, contextMarkdown, ajaxMarkdown, speechMarkdown } from './lib/lab-run.mjs';

const run = runArgs({ slug: '3545814-pinned' });
const { out } = run;
const PAGE = '/repro-3545814';
const PREVIEW = '/admin/structure/views/view/repro_3545814/edit';
const CONTROLS = [
  ['numeric', 'input[name="id_open[value]"]'],
  ['numeric_operator', 'select[name="id_open_op"]'],
  ['bundle', 'select[name="type"]'],
  ['bundle_operator', 'select[name="type_op"]'],
  ['taxonomy', 'select[name="tags"]'],
  ['taxonomy_operator', 'select[name="tags_op"]'],
  ['fixed', 'input[name="id_fixed"]'],
];
const yn = (v) => (v ? 'yes' : 'no');
const clean = (s) => String(s ?? '').replace(/\s+/g, ' ').trim();

// Read the native labels an element really has, plus the fieldset that groups it.
const readOne = async (page, selector, scope = '') => {
  const loc = page.locator(scope + selector).first();
  if (!(await loc.count())) return { missing: true };
  const dom = await loc.evaluate((el) => {
    const labels = el.labels ? [...el.labels].map((l) => ({
      text: l.textContent.trim(),
      for: l.getAttribute('for'),
      visuallyHidden: /(^|\s)visually-hidden(\s|$)/.test(l.className || ''),
      visible: !!(l.offsetWidth || l.offsetHeight || l.getClientRects().length),
    })) : [];
    const fs = el.closest('fieldset');
    const legend = fs ? fs.querySelector('legend') : null;
    return {
      tag: el.tagName.toLowerCase(),
      id: el.id,
      name: el.getAttribute('name'),
      labels,
      ariaLabel: el.getAttribute('aria-label'),
      ariaLabelledby: el.getAttribute('aria-labelledby'),
      fieldset: fs ? { id: fs.id, legend: legend ? legend.textContent.replace(/\s+/g, ' ').trim() : null } : null,
      visible: !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length),
    };
  });
  let aria = '';
  try {
    aria = clean((await loc.ariaSnapshot()).split('\n')[0]);
  }
  catch (e) { aria = 'unavailable: ' + e.message; }
  const m = aria.match(/^-\s+([a-z]+)\s+"([^"]*)"/);
  return { ...dom, aria, role: m ? m[1] : null, accessibleName: m && m[2] !== undefined ? m[2] : '', labelTexts: dom.labels.map((l) => l.text) };
};

async function readControls(page, scope = '') {
  const all = {};
  for (const [key, sel] of CONTROLS) all[key] = await readOne(page, sel, scope);
  return all;
}

const resultsOf = (page) => page.evaluate(() => ({
  query: location.search.replace(/^\?/, ''),
  rows: [...document.querySelectorAll('.views-row')].map((r) => (r.querySelector('.views-field-title') || r).textContent.replace(/\s+/g, ' ').trim()),
  operator: document.querySelector('select[name="id_open_op"]')?.selectedOptions?.[0]?.textContent.trim() ?? null,
  value: document.querySelector('input[name="id_open[value]"]')?.value ?? null,
  min: document.querySelector('input[name="id_open[min]"]')?.value ?? null,
  max: document.querySelector('input[name="id_open[max]"]')?.value ?? null,
  type: document.querySelector('select[name="type"]')?.selectedOptions?.[0]?.textContent.trim() ?? null,
  tags: document.querySelector('select[name="tags"]')?.selectedOptions?.[0]?.textContent.trim() ?? null,
}));

const submitButton = (page) => page.locator('form.views-exposed-form input[type="submit"], form.views-exposed-form button[type="submit"]').first();

async function submit(page, base, { op, value, min, max, type, tags } = {}) {
  await page.goto(base + PAGE, { waitUntil: 'load' });
  if (op) await page.selectOption('select[name="id_open_op"]', { label: op });
  if (value !== undefined) {
    await page.locator('input[name="id_open[value]"]').waitFor({ state: 'visible' });
    await page.fill('input[name="id_open[value]"]', String(value));
  }
  if (min !== undefined) {
    await page.locator('input[name="id_open[min]"]').waitFor({ state: 'visible' });
    await page.fill('input[name="id_open[min]"]', String(min));
  }
  if (max !== undefined) {
    await page.locator('input[name="id_open[max]"]').waitFor({ state: 'visible' });
    await page.fill('input[name="id_open[max]"]', String(max));
  }
  if (type) await page.selectOption('select[name="type"]', { label: type });
  if (tags) await page.selectOption('select[name="tags"]', { label: tags });
  await Promise.all([page.waitForNavigation({ waitUntil: 'load' }), submitButton(page).click()]);
  return resultsOf(page);
}

async function preview(page, base) {
  await page.goto(base + PREVIEW, { waitUntil: 'load' });
  const btn = page.locator('input[value="Update preview"], button:has-text("Update preview")').first();
  let clicked = false;
  if (await btn.count()) {
    await Promise.all([
      page.waitForResponse((r) => /views\/ajax|views_ajax|ajax/i.test(r.url()) && r.request().method() === 'POST', { timeout: 30000 }).catch(() => null),
      btn.click(),
    ]);
    await page.waitForTimeout(2000);
    clicked = true;
  }
  const has = await page.locator('#views-preview-wrapper').count();
  const controls = has ? await readControls(page, '#views-preview-wrapper ') : {};
  return { clicked, previewPresent: !!has, controls };
}

async function keyboard(page, base) {
  await page.goto(base + PAGE, { waitUntil: 'load' });
  await page.evaluate(() => { if (document.activeElement && document.activeElement !== document.body) document.activeElement.blur(); });
  const stops = [];
  for (let i = 0; i < 80; i++) {
    await page.keyboard.press('Tab');
    const f = await page.evaluate(() => {
      const a = document.activeElement;
      if (!a) return null;
      return {
        tag: a.tagName.toLowerCase(),
        name: a.name || a.id || '',
        label: a.labels && a.labels[0] ? a.labels[0].textContent.trim() : (a.getAttribute('aria-label') || ''),
      };
    });
    if (!f) break;
    stops.push(f);
    if (f.name === 'id_open[value]') break;
  }
  const valueStop = stops.find((s) => s.name === 'id_open[value]');
  return { stops, reachedValue: !!valueStop, valueStop: valueStop || null };
}

async function replay(side) {
  const { page, base, rec } = await openSide(run, side);
  try {
    await page.goto(base + PAGE, { waitUntil: 'load' });
    const axePage = await axeScan(page);
    const controls = await readControls(page);
    await page.screenshot({ path: path.join(out, `${side}-page.png`), fullPage: true });
    const fieldset = page.locator('fieldset#edit-id-open-wrapper');
    if (await fieldset.count()) await fieldset.screenshot({ path: path.join(out, `${side}-numeric.png`) }).catch(() => {});
    const numericSection = page.locator('form.views-exposed-form');
    if (await numericSection.count()) await numericSection.screenshot({ path: path.join(out, `${side}-filters.png`) }).catch(() => {});

    const submissions = {
      greaterThan: await submit(page, base, { op: 'Is greater than', value: 2 }),
      between: await submit(page, base, { op: 'Is between', min: 2, max: 3 }),
      empty: await submit(page, base, { op: 'Is empty (NULL)' }),
      bundleArticle: await submit(page, base, { type: 'Article' }),
      tagsNews: await submit(page, base, { tags: 'News' }),
    };
    // The fixed filter uses a different field name.
    await page.goto(base + PAGE, { waitUntil: 'load' });
    await page.fill('input[name="id_fixed"]', '3');
    await Promise.all([page.waitForNavigation({ waitUntil: 'load' }), submitButton(page).click()]);
    submissions.fixedId = await resultsOf(page);
    const fixedLabel = await readOne(page, 'input[name="id_fixed"]');

    const pv = await preview(page, base);
    const kb = await keyboard(page, base);
    const axePreview = pv.previewPresent ? await axeScan(page) : { total: null, rules: {}, violations: [] };
    return { axePage, axePreview, controls, fixedLabel, pv, kb, submissions, rec };
  } finally {
    await rec.close(out);
  }
}

const { browser, environment } = await launch(run);
run.browser = browser;
const results = baseResults(run, environment);
try {
  for (const side of ['before', 'after']) {
    const r = await replay(side);
    results.sides[side] = { ...r.rec, ...r };
  }
} finally { await browser.close(); }

const B = results.sides.before, A = results.sides.after;
const named = (c) => !!(c && !c.missing && c.accessibleName && c.accessibleName.length);
const labelVisible = (c) => !!(c && c.labels && c.labels.some((l) => l.visible && !l.visuallyHidden));
const same = (x, y) => JSON.stringify(x) === JSON.stringify(y);
const namingViolations = (r) => (r.rules.label || 0) + (r.rules['select-name'] || 0) + (r.rules['form-field-multiple-labels'] || 0);

const checks = [
  ['precondition', 'The exposed filter form is on /repro-3545814', yn(B.controls.numeric && !B.controls.numeric.missing), yn(A.controls.numeric && !A.controls.numeric.missing), !!(B.controls.numeric && !B.controls.numeric.missing) && !!(A.controls.numeric && !A.controls.numeric.missing)],
  ['fix', 'Numeric ID value field: accessible name', B.controls.numeric.accessibleName || '(none)', A.controls.numeric.accessibleName || '(none)', named(A.controls.numeric) && !named(B.controls.numeric)],
  ['fix', 'Content type select: accessible name', B.controls.bundle.accessibleName || '(none)', A.controls.bundle.accessibleName || '(none)', named(A.controls.bundle) && !named(B.controls.bundle)],
  ['fix', 'Taxonomy Tags select: accessible name', B.controls.taxonomy.accessibleName || '(none)', A.controls.taxonomy.accessibleName || '(none)', named(A.controls.taxonomy) && !named(B.controls.taxonomy)],
  ['fix', 'View configuration preview: numeric value field has a name', B.pv.controls.numeric ? (B.pv.controls.numeric.accessibleName || '(none)') : 'no preview', A.pv.controls.numeric ? (A.pv.controls.numeric.accessibleName || '(none)') : 'no preview', !!(A.pv.controls.numeric && named(A.pv.controls.numeric)) && !(B.pv.controls.numeric && named(B.pv.controls.numeric))],
  ['fix', 'View configuration preview: content type select has a name', B.pv.controls.bundle ? (B.pv.controls.bundle.accessibleName || '(none)') : 'no preview', A.pv.controls.bundle ? (A.pv.controls.bundle.accessibleName || '(none)') : 'no preview', !!(A.pv.controls.bundle && named(A.pv.controls.bundle)) && !(B.pv.controls.bundle && named(B.pv.controls.bundle))],
  ['regression', 'Operator selects: accessible name', [B.controls.numeric_operator.accessibleName, B.controls.bundle_operator.accessibleName, B.controls.taxonomy_operator.accessibleName].join(' / '), [A.controls.numeric_operator.accessibleName, A.controls.bundle_operator.accessibleName, A.controls.taxonomy_operator.accessibleName].join(' / '), same([B.controls.numeric_operator.accessibleName, B.controls.bundle_operator.accessibleName, B.controls.taxonomy_operator.accessibleName], [A.controls.numeric_operator.accessibleName, A.controls.bundle_operator.accessibleName, A.controls.taxonomy_operator.accessibleName])],
  ['regression', 'Fieldset legends (filter labels)', [B.controls.numeric?.fieldset?.legend, B.controls.bundle?.fieldset?.legend, B.controls.taxonomy?.fieldset?.legend].join(' / '), [A.controls.numeric?.fieldset?.legend, A.controls.bundle?.fieldset?.legend, A.controls.taxonomy?.fieldset?.legend].join(' / '), same([B.controls.numeric?.fieldset?.legend, B.controls.bundle?.fieldset?.legend, B.controls.taxonomy?.fieldset?.legend], [A.controls.numeric?.fieldset?.legend, A.controls.bundle?.fieldset?.legend, A.controls.taxonomy?.fieldset?.legend])],
  ['observe', 'Numeric ID value label is visible (visual change)', B.controls.numeric?.labels?.length ? yn(labelVisible(B.controls.numeric)) : 'no label', A.controls.numeric?.labels?.length ? yn(labelVisible(A.controls.numeric)) : 'no label', true],
  ['observe', 'Content type select label is visually hidden', B.controls.bundle?.labels?.length ? yn(B.controls.bundle.labels.some((l) => l.visuallyHidden)) : 'no label', A.controls.bundle?.labels?.length ? yn(A.controls.bundle.labels.some((l) => l.visuallyHidden)) : 'no label', true],
  ['regression', 'Fixed-operator numeric filter: label text and visibility', `${B.fixedLabel.labelTexts.join('|')} ${yn(labelVisible(B.fixedLabel))}`, `${A.fixedLabel.labelTexts.join('|')} ${yn(labelVisible(A.fixedLabel))}`, same(B.fixedLabel.labelTexts, A.fixedLabel.labelTexts) && labelVisible(A.fixedLabel)],
  ['regression', 'Filter results: ID greater than 2', B.submissions.greaterThan.rows.join(', '), A.submissions.greaterThan.rows.join(', '), same(B.submissions.greaterThan.rows, A.submissions.greaterThan.rows) && B.submissions.greaterThan.rows.length > 0],
  ['regression', 'Filter results: ID between 2 and 3', B.submissions.between.rows.join(', '), A.submissions.between.rows.join(', '), same(B.submissions.between.rows, A.submissions.between.rows)],
  ['regression', 'Filter results: ID is empty', B.submissions.empty.rows.join(', '), A.submissions.empty.rows.join(', '), same(B.submissions.empty.rows, A.submissions.empty.rows)],
  ['regression', 'Filter results: content type Article', B.submissions.bundleArticle.rows.join(', '), A.submissions.bundleArticle.rows.join(', '), same(B.submissions.bundleArticle.rows, A.submissions.bundleArticle.rows)],
  ['regression', 'Filter results: Tags News', B.submissions.tagsNews.rows.join(', '), A.submissions.tagsNews.rows.join(', '), same(B.submissions.tagsNews.rows, A.submissions.tagsNews.rows)],
  ['regression', 'Filter results: fixed ID 3', B.submissions.fixedId.rows.join(', '), A.submissions.fixedId.rows.join(', '), same(B.submissions.fixedId.rows, A.submissions.fixedId.rows)],
  ['fix', 'axe naming violations (label, select-name), View page', namingViolations(B.axePage), namingViolations(A.axePage), namingViolations(B.axePage) > 0 && namingViolations(A.axePage) === 0],
  ['observe', 'axe rule ids on the View page', Object.keys(B.axePage.rules).join(', ') || 'none', Object.keys(A.axePage.rules).join(', ') || 'none', true],
  ['observe', 'Tab reaches the numeric value field', yn(B.kb.reachedValue), yn(A.kb.reachedValue), true],
  ['regression', 'JavaScript errors', B.jsErrors.length, A.jsErrors.length, B.jsErrors.length === 0 && A.jsErrors.length === 0],
];
let unexpected = 0;
let md = `# Playwright evidence: #${results.issue} (${run.v.slug})\n\nRun ${results.when}. Before \`${results.commits.before}\`, After \`${results.commits.after}\` plus \`${(run.v.after.patches || ['none'])[0].split('/').pop()}\`. ${environment.browser} ${environment.browserVersion}, ${environment.colorScheme}${environment.forcedColors ? ', forced colours' : ''}, ${run.viewport.width}x${run.viewport.height}, ${environment.os}. axe-core WCAG 2.0 to 2.2 A/AA.\n\nRule: **fix** rows change as the MR intends; **regression** rows match on both sides; **observe** rows are recorded, not judged.\n\n| Type | Check | Before | After | Verdict |\n|---|---|---|---|---|\n`;
for (const [t, label, b, a, good] of checks) {
  const judged = t === 'fix' || t === 'regression';
  if (judged && !good) unexpected++;
  md += `| ${t} | ${label.replace(/\|/g, '\\|')} | ${clean(b).replace(/\|/g, '\\|')} | ${clean(a).replace(/\|/g, '\\|')} | ${judged ? (good ? 'as expected' : '**NOT as expected**') : 'recorded'} |\n`;
}
md += `\n## Controls on the View page\n\n| Control | Before: labels / accessible name | After: labels / accessible name |\n|---|---|---|\n`;
for (const [key] of CONTROLS) {
  const b = B.controls[key], a = A.controls[key];
  const cell = (c) => (c && !c.missing ? `${c.labels.length ? c.labels.map((l) => `"${l.text}"${l.visuallyHidden ? ' (visually hidden)' : ''}`).join(', ') : 'none'} / ${c.accessibleName ? `"${c.accessibleName}"` : '(no name)'}` : 'missing');
  md += `| ${key} | ${cell(b)} | ${cell(a)} |\n`;
}
md += `\nBefore fieldset grouping: numeric \`${B.controls.numeric?.fieldset?.legend}\`, bundle \`${B.controls.bundle.fieldset?.legend}\`, taxonomy \`${B.controls.taxonomy?.fieldset?.legend}\`. After: numeric \`${A.controls.numeric?.fieldset?.legend}\`, bundle \`${A.controls.bundle?.fieldset?.legend}\`, taxonomy \`${A.controls.taxonomy?.fieldset?.legend}\`.\n`;
md += `\n## Submissions (real input, results read after the page reloaded)\n\n| Submission | Before rows | After rows |\n|---|---|---|\n`;
for (const [k, r] of Object.entries(B.submissions)) md += `| ${k} | ${r.rows.join(', ') || '(none)'} | ${(A.submissions[k] || { rows: [] }).rows.join(', ') || '(none)'} |\n`;
md += `\nExample query strings. Before: ID greater than 2 \`?${B.submissions.greaterThan.query}\`; After \`?${A.submissions.greaterThan.query}\`.\n`;
md += `\n## axe\n\nView page: Before ${JSON.stringify(B.axePage.rules)}, After ${JSON.stringify(A.axePage.rules)}. Preview: Before ${JSON.stringify(B.axePreview ? B.axePreview.rules : {})}, After ${JSON.stringify(A.axePreview ? A.axePreview.rules : {})}.\n`;
md += `\nKeyboard: first Tab stops recorded; reached the numeric value field: Before ${yn(B.kb.reachedValue)}, After ${yn(A.kb.reachedValue)}. Stops Before: ${B.kb.stops.map((s) => `${s.tag}#${s.name}${s.label ? ` "${s.label}"` : ''}`).join(' → ')}. After: ${A.kb.stops.map((s) => `${s.tag}#${s.name}${s.label ? ` "${s.label}"` : ''}`).join(' → ')}.\n`;
md += `\nScreenshots: \`before-page.png\`, \`after-page.png\`, \`before-filters.png\`, \`after-filters.png\`, \`before-numeric.png\`, \`after-numeric.png\`.\n\n`;
md += contextMarkdown(results) + ajaxMarkdown(results) + speechMarkdown(results);
md += `\n---\nAutomated evidence is a DRAFT: DOM, axe and scripted input do not replace a keyboard and screen-reader pass by a person.\n`;
results.checks = checks.map(([kind, label, before, after, good]) => ({ kind, label, before, after, status: good }));
results.verdict = unexpected === 0 ? 'reproduced-and-fixed' : 'mixed';
results.unexpected = unexpected;
const where = writeRun(run, results, md);
console.log(`\n${unexpected === 0 ? 'OK' : 'UNEXPECTED'} (${unexpected} judged rows not as expected): ${where}/SUMMARY.md`);
process.exitCode = unexpected === 0 ? 0 : 2;
