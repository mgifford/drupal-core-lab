// #3083103: programmatic association of form errors with their controls.
// Compares two After states against one shared Before (current main + the lab fixture):
//   3083103-latest  MR !15692 ported to main        (see reports/issues/3083103/branches/*-main.patch)
//   3083103-aug6    the August 6 proposal ported    (originally an 11.4.x diff at b2ce2022)
//   node tools/playwright/evaluate-3083103.mjs [slug] [--browser=chromium] [--scheme=light] [--forced-colors] [--out=<dir>]
// For every invalid control it records the ARIA state, resolves every IDREF to the element it actually points at, reads the
// Chromium accessibility tree (role, name, description, invalid), and scans with axe. A zero axe count is not a pass.
// Not covered here: Firefox/WebKit accessibility trees, real NVDA/VoiceOver speech (see screenreader-3083103.mjs and
// SCREENREADER.md), and a person's keyboard pass.
import path from 'node:path';
import { runArgs, launch, openSide, axeScan, baseResults, writeRun, contextMarkdown, ajaxMarkdown } from './lib/lab-run.mjs';

const run = runArgs({ slug: '3083103-latest' });

const BASE = '/form-test/error-association';
const FIELDS = {
  name: { sel: '#edit-name', kind: 'textfield' },
  message: { sel: '#edit-message', kind: 'textarea' },
  choice: { sel: '#edit-choice', kind: 'select' },
  colour: { sel: '#edit-colour--wrapper', kind: 'radios-group' },
  colour_input: { sel: 'input[name="colour"]', kind: 'radio-input' },
  features: { sel: '#edit-features--wrapper', kind: 'checkboxes-group' },
  features_input: { sel: 'input[name="features[one]"]', kind: 'checkbox-input' },
  tag0: { sel: '#edit-tags-tag0', kind: 'textfield-multivalue' },
  phone: { sel: '#edit-phone', kind: 'textfield-in-details' },
  street: { sel: '#edit-street', kind: 'textfield-in-fieldset' },
  postcode: { sel: '#edit-postcode', kind: 'textfield-in-nested-container' },
  table: { sel: '#edit-table', kind: 'table' },
  table_select: { sel: '#edit-table-select', kind: 'tableselect' },
  email_primary: { sel: '#edit-email-primary', kind: 'textfield-same-text' },
  email_secondary: { sel: '#edit-email-secondary', kind: 'textfield-same-text' },
  custom: { sel: '#lab-custom-id', kind: 'explicit-id' },
  suppressed: { sel: '#edit-suppressed', kind: 'error-no-message' },
  more: { sel: '#edit-more', kind: 'checkbox-ajax' },
  extra_tag: { sel: 'input[name="extra_tag"]', kind: 'ajax-added' },
};

// Runs in the page.
const measure = () => {
  const norm = (s) => String(s ?? '').replace(/\s+/g, ' ').trim();
  const idCount = new Map();
  for (const el of document.querySelectorAll('[id]')) idCount.set(el.id, (idCount.get(el.id) || 0) + 1);
  const describeEl = (el) => ({
    tag: el.tagName.toLowerCase(),
    id: el.id || null,
    classes: typeof el.className === 'string' ? el.className.split(/\s+/).filter(Boolean).slice(0, 4) : [],
    text: norm(el.textContent).slice(0, 160),
    visible: !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length),
    role: el.getAttribute('role'),
  });
  const resolveTokens = (value) => {
    const tokens = norm(value).split(' ').filter(Boolean);
    return {
      raw: value ?? null,
      tokens,
      resolved: tokens.map((t) => {
        const els = [...document.querySelectorAll(`[id="${t.replace(/"/g, '\\"')}"]`)];
        return { token: t, count: els.length, elements: els.slice(0, 3).map(describeEl) };
      }),
      dangling: tokens.filter((t) => (idCount.get(t) || 0) !== 1),
    };
  };
  const control = (sel) => {
    const el = document.querySelector(sel);
    if (!el) return { selector: sel, present: false };
    const described = el.getAttribute('aria-describedby');
    const errmsg = el.getAttribute('aria-errormessage');
    const label = el.labels && el.labels[0] ? norm(el.labels[0].textContent) : null;
    return {
      selector: sel, present: true, ...describeEl(el),
      tag: el.tagName.toLowerCase(),
      type: el.getAttribute('type'),
      name: el.getAttribute('name'),
      label,
      ariaInvalid: el.getAttribute('aria-invalid'),
      ariaErrormessage: errmsg,
      errormessage: errmsg ? resolveTokens(errmsg) : null,
      ariaDescribedby: described,
      describedby: described ? resolveTokens(described) : null,
      invalid: typeof el.checkValidity === 'function' ? !el.checkValidity() : null,
      required: el.required === true,
    };
  };
  const errorContainers = [...document.querySelectorAll('.form-item--error-message, .form-item__error-message, .fieldset__error-message, .messages--error, [class*="error-message"]')]
    .map((el) => ({ ...describeEl(el), id: el.id || null, parentField: el.closest('.form-item, .form-item--error-message, fieldset')?.querySelector('input,select,textarea')?.id || null }));
  const summaryLinks = [...document.querySelectorAll('.messages--error a[href*="#"], [data-drupal-messages] a[href*="#"]')].map((a) => {
    const fragment = a.getAttribute('href').split('#').pop();
    return { text: norm(a.textContent), fragment, targetCount: fragment ? document.querySelectorAll(`[id="${fragment.replace(/"/g, '\\"')}"]`).length : 0 };
  });
  const helpText = [...document.querySelectorAll('[id$="--description"], [id^="lab-existing-help"]')].map((el) => ({ id: el.id, text: norm(el.textContent).slice(0, 120), visible: !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length) }));
  const duplicates = [...idCount.entries()].filter(([, n]) => n > 1).map(([id, n]) => ({ id, count: n, elements: [...document.querySelectorAll(`[id="${id.replace(/"/g, '\\"')}"]`)].slice(0, 4).map(describeEl) }));
  const forms = [...document.querySelectorAll('form')].map((f) => ({ id: f.id, novalidate: f.hasAttribute('novalidate'), action: f.getAttribute('action') }));
  return {
    path: location.pathname, title: document.title, theme: window.drupalSettings?.ajaxPageState?.theme || null,
    forms, errorContainers, summaryLinks, helpText, duplicates,
    invalids: [...document.querySelectorAll('[aria-invalid="true"], [aria-errormessage], [aria-describedby]')].map(describeEl).slice(0, 80),
    errorsOnPage: norm(document.querySelector('[data-drupal-messages]')?.textContent || '').slice(0, 500),
    bodyHasErrors: !!document.querySelector('.messages--error, [data-drupal-messages] .messages--error'),
  };
};

async function axTree(page, selectors) {
  try {
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('DOM.enable');
    await cdp.send('Accessibility.enable');
    const { root } = await cdp.send('DOM.getDocument', { depth: -1 });
    const out = {};
    for (const sel of selectors) {
      let nodeId;
      try { ({ nodeId } = await cdp.send('DOM.querySelector', { nodeId: root.nodeId, selector: sel })); } catch { nodeId = 0; }
      if (!nodeId) { out[sel] = null; continue; }
      try {
        const { nodes } = await cdp.send('Accessibility.getPartialAXTree', { nodeId, fetchRelatives: false });
        const n = nodes.find((x) => !x.ignored) || nodes[0];
        out[sel] = n ? {
          role: n.role?.value ?? null,
          name: n.name?.value ?? null,
          description: n.description?.value ?? null,
          ignored: !!n.ignored,
          properties: Object.fromEntries((n.properties || []).map((p) => [p.name, p.value?.value])),
        } : null;
      } catch { out[sel] = null; }
    }
    await cdp.detach();
    return out;
  } catch (e) {
    return { error: String(e.message).slice(0, 200) };
  }
}

const FORM_SUBMIT = 'form#form-test-error-association-form [type="submit"]';
const submit = async (page) => {
  await page.waitForSelector(FORM_SUBMIT, { timeout: 15000 }).catch(async () => {
    await page.reload({ waitUntil: 'load' });
    await page.waitForSelector(FORM_SUBMIT, { timeout: 15000 }).catch(async () => {
      throw new Error(`fixture form not on ${page.url()} ("${await page.title()}")`);
    });
  });
  await page.evaluate(() => { document.querySelectorAll('form').forEach((f) => { f.noValidate = true; f.setAttribute('novalidate', ''); }); });
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'load' }).catch(() => {}),
    page.locator(FORM_SUBMIT).first().click(),
  ]);
};

async function snapshotScenario(page, id, what, selectors = Object.keys(FIELDS)) {
  await page.waitForTimeout(400);
  const m = await page.evaluate(measure);
  const fields = {};
  for (const key of selectors) fields[key] = await page.evaluate(controlFn, FIELDS[key].sel);
  const ax = await axTree(page, selectors.map((k) => FIELDS[k].sel));
  const axe = await axeScan(page);
  return {
    id, what, path: m.path, theme: m.theme,
    forms: m.forms, errorsOnPage: m.errorsOnPage, bodyHasErrors: m.bodyHasErrors,
    fields: Object.fromEntries(selectors.map((k) => [k, { ...FIELDS[k], ...fields[k], ax: ax[FIELDS[k].sel] ?? (ax.error ? { error: ax.error } : null) }])),
    errorContainers: m.errorContainers, summaryLinks: m.summaryLinks, helpText: m.helpText, duplicates: m.duplicates,
    axe: { total: axe.total, rules: axe.rules, violations: axe.violations },
  };
}

// Passed into the page by name (Playwright serialises the function).
function controlFn(sel) {
  const norm = (s) => String(s ?? '').replace(/\s+/g, ' ').trim();
  const el = document.querySelector(sel);
  if (!el) return { selector: sel, present: false };
  const resolve = (value) => {
    const tokens = norm(value).split(' ').filter(Boolean);
    return { raw: value, tokens, resolved: tokens.map((t) => ({ token: t, count: document.querySelectorAll(`[id="${t}"]`).length })), dangling: tokens.filter((t) => document.querySelectorAll(`[id="${t}"]`).length !== 1) };
  };
  const errmsg = el.getAttribute('aria-errormessage');
  const described = el.getAttribute('aria-describedby');
  return {
    selector: sel, present: true, tag: el.tagName.toLowerCase(), id: el.id || null, type: el.getAttribute('type'), name: el.getAttribute('name'),
    label: el.labels && el.labels[0] ? norm(el.labels[0].textContent) : null,
    ariaInvalid: el.getAttribute('aria-invalid'), ariaErrormessage: errmsg, errormessage: errmsg ? resolve(errmsg) : null,
    ariaDescribedby: described, describedby: described ? resolve(described) : null,
    invalid: typeof el.checkValidity === 'function' ? !el.checkValidity() : null, required: el.required === true,
    visible: !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length),
  };
}

async function side(name) {
  const { page, rec, base } = await openSide(run, name);
  rec.scenarios = [];
  const scenario = async (id, what, selectors) => {
    const s = await snapshotScenario(page, id, what, selectors);
    s.image = `${name}-${id}.png`;
    await page.screenshot({ path: path.join(run.out, s.image) }).catch(() => {});
    rec.scenarios.push(s);
    return s;
  };

  // 1. Initial valid page: no stale invalid state.
  await page.goto(base + BASE); await page.waitForLoadState('load');
  await page.waitForSelector('#edit-name', { timeout: 20000 });
  await scenario('initial', 'Initial form, no submission');

  // 2. Empty submission: every required field errors.
  await submit(page);
  await page.waitForSelector('.messages--error, [id$="--error-message"]', { timeout: 20000 }).catch(() => {});
  await scenario('invalid', 'Empty submit: all required fields invalid');

  // 3. Repeated invalid submission: no duplicated IDs or doubled references.
  await submit(page);
  await scenario('invalid-repeat', 'Second empty submit');

  // 4. Identical error text on two different fields.
  await scenario('identical-text', 'Two fields titled "Email address", both invalid', ['email_primary', 'email_secondary']);

  // 5. Partial correction.
  await page.goto(base + BASE); await page.waitForLoadState('load');
  await page.locator('#edit-name').fill('Ada');
  await page.locator('#edit-message').fill('Hello');
  await submit(page);
  await scenario('partial-correction', 'Name and message corrected; the rest still invalid', ['name', 'message', 'choice', 'email_primary']);

  // 6. AJAX add-more, then submit: the AJAX-added field has an error.
  await page.goto(base + BASE); await page.waitForLoadState('load');
  await page.locator('#edit-more').check();
  await page.waitForSelector('input[name="extra_tag"]', { timeout: 20000 });
  await submit(page);
  await scenario('ajax-add-more', 'AJAX add-more then empty submit', ['more', 'extra_tag', 'name']);

  // 7. Successful submission: no invalid state remains.
  await page.goto(base + BASE); await page.waitForLoadState('load');
  await page.locator('#edit-name').fill('Ada');
  await page.locator('#edit-message').fill('Hello');
  await page.locator('#edit-choice').selectOption('foo');
  await page.locator('input[name="colour"]').first().check();
  await page.locator('input[name="features[one]"]').check();
  await page.locator('#edit-tags-tag0').fill('one');
  await page.locator('#edit-tags-tag1').fill('two');
  await page.locator('#edit-phone').fill('555');
  await page.locator('#edit-street').fill('Main');
  await page.locator('#edit-postcode').fill('12345');
  await page.locator('#edit-table-select-alpha').check();
  await page.locator('#edit-email-primary').fill('a@example.com');
  await page.locator('#edit-email-secondary').fill('b@example.com');
  await page.locator('#lab-custom-id').fill('custom');
  await page.locator('#edit-suppressed').fill('kept');
  await submit(page);
  await scenario('valid-submit', 'All required values supplied');

  // 8. Form opted out of inline errors (#disable_inline_form_errors).
  await page.goto(base + BASE + '/no-ife'); await page.waitForLoadState('load');
  await submit(page);
  await scenario('disable-inline-form-errors', 'Form with #disable_inline_form_errors, empty submit');

  // 9. Two instances of the same form on one page.
  await page.goto(base + BASE + '/two'); await page.waitForLoadState('load');
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'load' }).catch(() => {}),
    page.locator('form#form-test-error-association-form [type="submit"]').first().click().catch(() => {}),
  ]);
  await scenario('two-instances', 'Two instances of the same form, first submitted empty');

  // 10. Error-summary link.
  await page.goto(base + BASE); await page.waitForLoadState('load');
  await submit(page);
  const linkInfo = await page.evaluate(() => {
    const a = document.querySelector('.messages--error a[href*="#"]');
    if (!a) return { present: false };
    return { present: true, href: a.getAttribute('href'), text: a.textContent.trim(), target: document.querySelectorAll(`[id="${a.getAttribute('href').split('#').pop()}"]`).length };
  });
  let focusAfterLink = null;
  if (linkInfo.present) {
    await page.locator('.messages--error a[href*="#"]').first().click();
    await page.waitForTimeout(300);
    focusAfterLink = await page.evaluate(() => { const a = document.activeElement; return a && a !== document.body ? `${a.tagName.toLowerCase()}${a.id ? '#' + a.id : ''}` : 'body'; });
  }
  rec.summaryLink = { ...linkInfo, focusAfterLink };

  rec.scenarios = rec.scenarios.map((s) => s);
  return { ...(await rec.close(run.out)), scenarios: rec.scenarios, summaryLink: rec.summaryLink };
}

const { browser, environment } = await launch(run);
run.browser = browser;
const results = baseResults(run, { ...environment, direction: 'native' });
try {
  for (const name of ['before', 'after']) results.sides[name] = await side(name);
} finally { await browser.close(); }

// ---- Assertions over the recorded data, per side ----
const invalids = (s) => s.scenarios.flatMap((sc) => Object.values(sc.fields).filter((f) => f && f.present && (f.ariaInvalid === 'true' || f.ariaErrormessage)));
const allRefsResolve = (s) => invalids(s).every((f) => {
  const errOk = !f.errormessage || f.errormessage.dangling.length === 0;
  const descOk = !f.describedby || f.describedby.dangling.length === 0;
  return errOk && descOk;
});
const danglingList = (s) => invalids(s).flatMap((f) => [...(f.errormessage?.dangling || []).map((t) => `${f.id || f.selector} -> ${t}`), ...(f.describedby?.dangling || []).map((t) => `${f.id || f.selector} -> ${t}`)]);

for (const n of ['before', 'after']) {
  const s = results.sides[n];
  const sc = Object.fromEntries(s.scenarios.map((x) => [x.id, x]));
  s.checks = {
    initialHasNoInvalidState: Object.values(sc.initial.fields).every((f) => !f.present || (f.ariaInvalid !== 'true' && !f.ariaErrormessage)),
    invalidShowsErrors: sc.invalid.bodyHasErrors || sc.invalid.errorContainers.length > 0,
    everyReferenceResolves: allRefsResolve(s),
    everyErrorTargetExists: sc.invalid.fields.name.errormessage ? sc.invalid.fields.name.errormessage.dangling.length === 0 : false,
    noDuplicateIds: sc.invalid.duplicates.length === 0,
    correctedFieldsDropInvalid: ['name', 'message'].every((k) => sc['partial-correction'].fields[k].ariaInvalid !== 'true'),
    helpTextPreserved: (sc.invalid.fields.name.describedby?.tokens || []).some((t) => t.endsWith('--description')),
    authorDescribedbyPreserved: (sc.invalid.fields.custom.describedby?.tokens || []).some((t) => t.startsWith('lab-existing-help')),
    suppressedHasNoDanglingRef: (() => { const f = sc.invalid.fields.suppressed; return !f.present || (!f.ariaErrormessage && !f.ariaDescribedby) || (f.errormessage?.dangling.length === 0 && f.describedby?.dangling.length === 0); })(),
    compositeGroupTargetResolves: (() => { const f = sc.invalid.fields.colour; return !f.present || !f.ariaErrormessage || f.errormessage?.dangling.length === 0; })(),
    twoInstancesUniqueErrorIds: sc['two-instances'].duplicates.filter((d) => /error-message/.test(d.id)).length === 0,
    summaryLinkTargetExists: s.summaryLink?.present ? s.summaryLink.target === 1 : false,
    validSubmitClean: Object.values(sc['valid-submit'].fields).every((f) => !f.present || f.ariaInvalid !== 'true'),
  };
  s.dangling = danglingList(s);
  s.axeRegressions = [];
}

const A = results.sides.after, B = results.sides.before;
const fails = Object.entries(A.checks).filter(([, v]) => !v).map(([k]) => `after: ${k}`);
results.axeRegressions = [];
for (const s of A.scenarios) {
  const b = B.scenarios.find((x) => x.id === s.id);
  for (const [rule, n] of Object.entries(s.axe.rules)) if (n > (b?.axe.rules[rule] || 0)) results.axeRegressions.push({ stage: s.id, rule, before: b?.axe.rules[rule] || 0, after: n });
}
results.unexpected = fails.length + results.axeRegressions.length;
results.failures = fails;

// "Reproduced" = Before has invalid controls with no resolving association; "fixed" = After resolves everything.
const beforeBroken = !B.checks.everyReferenceResolves || !B.checks.everyErrorTargetExists;
const afterFixed = A.checks.everyReferenceResolves && A.checks.everyErrorTargetExists && A.checks.noDuplicateIds;
results.verdict = beforeBroken && afterFixed ? 'reproduced-and-fixed' : beforeBroken ? 'reproduced-not-fixed' : 'not-reproduced';

const summarize = (r) => {
  const S = r.sides;
  let md = `# #3083103 error association: ${r.variant}\n\n`;
  md += `Verdict: **${r.verdict}**. Before ${S.before.checks.everyReferenceResolves ? 'all references resolve' : 'has dangling references'}; After ${S.after.checks.everyReferenceResolves ? 'all references resolve' : 'has dangling references'}.\n\n`;
  md += `## Checks (After; Before in brackets)\n\n| Check | Before | After |\n|---|---|---|\n`;
  for (const k of Object.keys(S.after.checks)) md += `| ${k} | ${S.before.checks[k] ? 'PASS' : 'FAIL'} | ${S.after.checks[k] ? 'PASS' : 'FAIL'} |\n`;
  md += `\n## Dangling references\n\n- Before: ${S.before.dangling.length ? S.before.dangling.slice(0, 20).map((x) => '`' + x + '`').join(', ') : 'none'}\n`;
  md += `- After: ${S.after.dangling.length ? S.after.dangling.slice(0, 20).map((x) => '`' + x + '`').join(', ') : 'none'}\n\n`;
  md += `## Per-scenario invalid controls (After)\n\n| Scenario | Control | aria-invalid | aria-errormessage | describedby tokens | ax role / name / description |\n|---|---|---|---|---|---|\n`;
  for (const sc of S.after.scenarios) for (const [k, f] of Object.entries(sc.fields)) {
    if (!f.present || (!f.ariaInvalid && !f.ariaErrormessage)) continue;
    md += `| ${sc.id} | ${k} (\`${f.id || 'no id'}\`) | ${f.ariaInvalid || ''} | ${f.ariaErrormessage || ''} | ${(f.describedby?.tokens || []).join(' ') || ''} | ${f.ax ? `${f.ax.role || ''} / ${f.ax.name || ''} / ${f.ax.description || ''}` : 'n/a'} |\n`;
  }
  md += `\n## Error containers and summary links (After, invalid scenario)\n\n`;
  const inv = S.after.scenarios.find((x) => x.id === 'invalid');
  md += `- Error containers: ${inv.errorContainers.map((c) => `<${c.tag}${c.id ? ' id=' + c.id : ' NO ID'}> "${c.text.slice(0, 40)}"`).join('; ') || 'none'}\n`;
  md += `- Summary links: ${inv.summaryLinks.map((l) => `"${l.text}" -> #${l.fragment} (${l.targetCount} target${l.targetCount === 1 ? '' : 's'})`).join('; ') || 'none'}\n`;
  md += `- Summary link click focus: ${S.after.summaryLink?.focusAfterLink || 'not tested'}\n\n`;
  md += `## axe-core\n\n`;
  for (const sc of S.after.scenarios) { const b = S.before.scenarios.find((x) => x.id === sc.id); md += `- ${sc.id}: ${b?.axe.total ?? '?'} → ${sc.axe.total}${Object.keys(sc.axe.rules).length ? ` (${Object.entries(sc.axe.rules).map(([k, v]) => `${k} ${v}`).join(', ')})` : ''}\n`; }
  return md + '\n' + contextMarkdown(r) + '\n' + ajaxMarkdown(r);
};

console.log(writeRun(run, results, summarize(results)));
process.exitCode = results.unexpected ? 1 : 0;
