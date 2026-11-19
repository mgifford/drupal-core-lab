// #3637163: the custom Accent and Focus colour fields of the Default Admin appearance settings. An invalid value used to reach the live styling
// when the field lost focus; this checks that it no longer does, that a valid value and the presets still work, that keyboard focus stays visible,
// that the server rejects an invalid value when the browser's own validation is bypassed, and that the error is announced.
//   node tools/playwright/evaluate-3637163.mjs [slug] [--browser=chromium] [--scheme=light|dark] [--forced-colors] [--viewport=1280x900] [--out=<dir>]
// Runs on lib/lab-run.mjs. Text is typed with the keyboard and the field is left with Tab (the change event a person causes); the one script-assisted
// step is turning off the browser's form validation to test the server, and the report says so. Not covered: real screen readers, a person's keyboard pass.
import fs from 'node:fs';
import path from 'node:path';
import { runArgs, launch, openSide, axeScan, baseResults, writeRun, contextMarkdown } from './lib/lab-run.mjs';

const PAGE = '/admin/appearance/settings/default_admin';
const run = runArgs({ slug: '3637163-latest' });
const ACCENT = 'input[name="accent_color"]', FOCUS = 'input[name="focus_color"]';

// Serialised into the page.
const measure = () => {
  const html = document.documentElement, cs = (e) => getComputedStyle(e);
  const parse = (c) => { const m = c.match(/[\d.]+/g)?.map(Number) || [0, 0, 0, 1]; return [m[0], m[1], m[2], m[3] ?? 1]; };
  const lum = ([r, g, b]) => { const f = (x) => { x /= 255; return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  const ratio = (a, b) => Math.round(((Math.max(lum(a), lum(b)) + 0.05) / (Math.min(lum(a), lum(b)) + 0.05)) * 100) / 100;
  const save = document.querySelector('#edit-submit');
  const sc = save ? cs(save) : null;
  // The button's own background may be transparent: composite it over what is behind it, otherwise an invisible button measures as readable.
  const over = (top, under) => [0, 1, 2].map((i) => top[i] * top[3] + under[i] * (1 - top[3])).concat(1);
  const behind = (el) => { const layers = []; let base = [255, 255, 255, 1]; for (let e = el; e; e = e.parentElement) { const c = parse(cs(e).backgroundColor); if (c[3] > 0.95) { base = c; break; } if (c[3] > 0) layers.push(c); } return layers.reduceRight((u, t) => over(t, u), base); };
  const saveBg = save ? over(parse(sc.backgroundColor), behind(save.parentElement)) : null;
  const a = document.activeElement;
  const ac = a && a !== document.body ? cs(a) : null;
  return {
    accentBase: html.style.getPropertyValue('--accent-base').trim() || null,
    accentBaseComputed: cs(html).getPropertyValue('--accent-base').trim() || null,
    dataFocus: html.getAttribute('data-admin-focus'),
    customFocusStyle: !!document.querySelector('style.custom-focus'),
    focusVar: cs(html).getPropertyValue('--admin-color-focus').trim() || null,
    saveText: sc ? sc.color : null, saveBackground: sc ? sc.backgroundColor : null,
    saveContrast: sc ? ratio(parse(sc.color), saveBg) : null,
    accentValue: document.querySelector('input[name="accent_color"]')?.value ?? null,
    accentInvalidFlag: document.querySelector('input[name="accent_color"]')?.getAttribute('aria-invalid') || null,
    accentMessage: document.getElementById('edit-accent-color--color-error')?.textContent.trim() || null,
    accentMessageRole: document.getElementById('edit-accent-color--color-error')?.getAttribute('role') || null,
    accentDescribedBy: document.querySelector('input[name="accent_color"]')?.getAttribute('aria-describedby') || null,
    focusMessage: document.getElementById('edit-focus-color--color-error')?.textContent.trim() || null,
    serverErrors: [...document.querySelectorAll('.messages--error, [data-drupal-messages] [role="alert"], .form-item--error-message, .form-item__error-message')].map((e) => e.textContent.trim().replace(/\s+/g, ' ')).filter(Boolean),
    activeOutline: ac ? { style: ac.outlineStyle, width: ac.outlineWidth, color: ac.outlineColor, boxShadow: ac.boxShadow === 'none' ? null : ac.boxShadow } : null,
    activeTag: a ? `${a.tagName.toLowerCase()}${a.id ? '#' + a.id : ''}` : null,
  };
};

const labelled = async (page, side, name) => {
  const text = `${side === 'before' ? 'BEFORE' : 'AFTER'} · ${run.v.slug} · ${name} · ${run.envTag}`;
  await page.evaluate((t) => { const d = document.createElement('div'); d.id = '__lab-label'; d.textContent = t; d.style.cssText = 'position:fixed;inset:auto auto 4px 4px;z-index:2147483647;background:#fff;color:#000;border:1px solid #000;font:12px/1.2 monospace;padding:2px 4px'; document.body.append(d); }, text);
  const file = `${side}-${name}.png`;
  await page.screenshot({ path: path.join(run.out, file) });
  await page.evaluate(() => document.getElementById('__lab-label')?.remove());
  return file;
};

const typeInto = async (page, sel, value) => {
  await page.locator(sel).click();
  await page.keyboard.press('ControlOrMeta+A');
  if (value === '') await page.keyboard.press('Backspace'); else await page.keyboard.type(value);
  await page.keyboard.press('Tab');
  await page.waitForTimeout(250);
};

async function side(name) {
  const { page, rec } = await openSide(run, name);
  await page.goto(rec.host ? `https://${rec.host}${PAGE}` : PAGE); await page.waitForLoadState('load');
  rec.states = []; rec.checks = {}; rec.notes = [];
  const snap = async (state, extra = {}) => { const m = await page.evaluate(measure); const shot = await labelled(page, name, state); const s = { state, ...m, ...extra, image: shot }; rec.states.push(s); return s; };

  const initial = await snap('initial');
  await page.locator('input#edit-preset-accent-color-custom').click();
  await page.waitForTimeout(250);
  const custom = await snap('custom-selected');

  // Invalid values typed as a person would, then Tab out of the field.
  const invalid = [];
  for (const v of ['777777', '#zzzzzz']) { await typeInto(page, ACCENT, v); invalid.push(await snap(`accent-invalid-${v.replace('#', '')}`, { typed: v })); }
  const valueKept = (await page.locator(ACCENT).inputValue()) === '#zzzzzz';
  rec.checks.invalidAccentNotApplied = invalid.every((s) => s.accentBase === custom.accentBase);
  rec.checks.invalidAccentTextKeptForEditing = valueKept;
  const last = invalid[invalid.length - 1];
  rec.checks.invalidAccentMessageAnnounced = !!last.accentMessage && last.accentMessageRole === 'alert' && last.accentInvalidFlag === 'true' && /error|accentColorMessage|--color-error/.test(String(last.accentDescribedBy));
  rec.checks.saveButtonReadableWhileInvalid = invalid.every((s) => s.saveContrast >= 3);
  rec.axeInvalid = await axeScan(page);

  await typeInto(page, ACCENT, '#336699');
  const valid = await snap('accent-valid', { typed: '#336699' });
  rec.checks.validAccentApplied = valid.accentBase === '#336699';
  rec.checks.errorClearedWhenCorrected = !valid.accentMessage && valid.accentInvalidFlag === null;
  rec.checks.pickerFollowsTextField = (await page.locator('input[name="accent_picker"]').inputValue()) === '#336699';

  // Presets still work, and returning to Custom with an invalid value never installs the black fallback.
  await typeInto(page, ACCENT, 'zzz');
  await page.locator('input#edit-preset-accent-color-red').click(); await page.waitForTimeout(250);
  const red = await snap('preset-red');
  await page.locator('input#edit-preset-accent-color-custom').click(); await page.waitForTimeout(250);
  const back = await snap('back-to-custom-with-invalid');
  rec.checks.presetStillApplies = /d8002f/i.test(red.accentBase || '');
  rec.checks.customWithInvalidKeepsLastValidColor = back.accentBase === red.accentBase;

  // Focus colour.
  await page.selectOption('select[name="preset_focus_color"]', 'orange'); await page.waitForTimeout(250);
  const orange = await snap('focus-preset-orange');
  await page.selectOption('select[name="preset_focus_color"]', 'custom'); await page.waitForTimeout(250);
  await typeInto(page, FOCUS, 'abc');
  const badFocus = await snap('focus-invalid-abc', { typed: 'abc' });
  rec.checks.invalidFocusNotApplied = !badFocus.customFocusStyle && badFocus.dataFocus === orange.dataFocus;
  rec.checks.invalidFocusMessageShown = !!badFocus.focusMessage;
  await page.evaluate(() => document.activeElement?.blur?.());
  const tabbed = [];
  for (let i = 0; i < 4; i++) { await page.keyboard.press('Tab'); tabbed.push(await page.evaluate(measure)); }
  rec.tabFocus = tabbed.map((m) => ({ element: m.activeTag, outline: m.activeOutline }));
  rec.checks.focusIndicatorStaysVisible = tabbed.every((m) => m.activeOutline && ((m.activeOutline.style !== 'none' && parseFloat(m.activeOutline.width) > 0) || m.activeOutline.boxShadow));
  await typeInto(page, FOCUS, '#aa5500');
  const goodFocus = await snap('focus-valid-aa5500', { typed: '#aa5500' });
  rec.checks.validFocusApplied = goodFocus.customFocusStyle && goodFocus.dataFocus === 'custom';

  // Server side: the browser's own validation is switched off (script-assisted), then an invalid value is submitted.
  await page.goto(`https://${rec.host}${PAGE}`); await page.waitForLoadState('load');
  await page.evaluate(() => { const f = document.querySelector('input[name="accent_color"]').form; f.noValidate = true; });
  await page.locator('input#edit-preset-accent-color-custom').click();
  await page.locator(ACCENT).fill('zzzzzz');
  await page.locator('#edit-submit').click(); await page.waitForLoadState('load');
  const serverResult = await snap('server-submit-invalid');
  rec.checks.serverRejectsInvalid = serverResult.serverErrors.some((m) => /valid hex color/i.test(m)) && serverResult.accentBase !== 'zzzzzz';
  await page.goto(`https://${rec.host}${PAGE}`); await page.waitForLoadState('load');
  const stored = await page.evaluate(measure);
  rec.storedAfterInvalidSubmit = stored.accentValue;
  rec.checks.invalidValueNotStored = stored.accentValue !== 'zzzzzz';
  rec.axeAfterServerError = await axeScan(page);

  // Restore a clean state: the Blue preset and an empty custom field (set by script, with validation off).
  await page.waitForTimeout(300);
  await Promise.all([page.waitForResponse((r) => r.request().method() === 'POST' && /appearance\/settings/.test(r.url())), page.evaluate(() => { const f = document.querySelector('input[name="accent_color"]').form; f.noValidate = true; document.querySelector('input[name="accent_color"]').value = ''; document.querySelector('input[name="focus_color"]').value = ''; document.querySelector('#edit-preset-accent-color-blue').checked = true; document.querySelector('select[name="preset_focus_color"]').value = 'default'; f.requestSubmit(document.querySelector('#edit-submit')); }).catch(() => {})]);
  await page.waitForLoadState('load'); await page.waitForTimeout(800);
  rec.restored = (await page.evaluate(measure)).accentBase;
  rec.initial = initial.accentBase;
  return rec;
}

const summarize = (results) => {
  const rows = [];
  for (const n of ['before', 'after']) for (const s of results.sides[n].states || []) rows.push(`| ${n} | ${s.state} | ${s.typed ?? ''} | ${s.accentBase ?? 'none'} | ${s.dataFocus ?? ''}${s.customFocusStyle ? ' + custom style' : ''} | ${s.saveContrast ?? '-'} | ${s.accentMessage ? 'yes' : 'no'} | ${s.serverErrors.length ? s.serverErrors.join('; ').slice(0, 90) : '-'} | [${s.image}](${s.image}) |`);
  let md = `# #3637163 custom colour validation evaluation (${results.variant}, ${results.environment.colorScheme}${results.environment.forcedColors ? ', forced colors' : ''}, ${results.environment.viewport.width}x${results.environment.viewport.height})\n\n`;
  md += `DRAFT, AI-assisted; a person has not reviewed it. Verdict: ${results.verdict}; ${results.unexpected} After check(s) not met.\n\n`;
  md += `Text is typed with the keyboard and the field left with Tab. The only script-assisted steps are turning off the browser's own form validation to test the server, and restoring the Blue preset at the end. Not covered: real screen readers, a person's keyboard pass, other browsers (run --browser=firefox|webkit), 200% zoom.\n\n`;
  md += `| Side | State | Typed | --accent-base on html | Focus attribute | Save button contrast | Client message | Server messages | Image |\n|---|---|---|---|---|---|---|---|---|\n${rows.join('\n')}\n\n## Checks\n\n`;
  for (const n of ['before', 'after']) md += `- **${n}**: ${Object.entries(results.sides[n].checks).map(([k, v]) => `${k}: ${v}`).join('; ')}\n`;
  md += `\n## axe-core (WCAG 2.2 A/AA tags; Before → After violation counts)\n\n`;
  for (const k of ['axeInvalid', 'axeAfterServerError']) md += `- ${k}: ${results.sides.before[k]?.total ?? 'n/a'} → ${results.sides.after[k]?.total ?? 'n/a'}${results.axeRegressions.filter((x) => x.stage === k).length ? ` (new rules after: ${results.axeRegressions.filter((x) => x.stage === k).map((x) => x.rule).join(', ')})` : ''}\n`;
  return md + '\n' + contextMarkdown(results);
};

const { browser, environment } = await launch(run);
run.browser = browser;
const results = baseResults(run, { ...environment, direction: 'native', page: PAGE });
try {
  for (const name of ['before', 'after']) { const rec = await side(name); results.sides[name] = await rec.close(run.out); }
} finally { await browser.close(); }

const A = results.sides.after, B = results.sides.before;
const fails = Object.entries(A.checks).filter(([, v]) => !v).map(([k]) => `after: ${k}`);
results.axeRegressions = [];
for (const k of ['axeInvalid', 'axeAfterServerError']) for (const [rule, n] of Object.entries(A[k]?.rules || {})) if (n > (B[k]?.rules?.[rule] || 0)) results.axeRegressions.push({ stage: k, rule, before: B[k]?.rules?.[rule] || 0, after: n });
results.unexpected = fails.length + results.axeRegressions.length; results.failures = fails;
const reproduced = !B.checks.invalidAccentNotApplied || !B.checks.serverRejectsInvalid;
results.verdict = results.unexpected ? (reproduced ? 'reproduced-not-fixed' : 'mixed') : reproduced ? 'reproduced-and-fixed' : 'not-reproduced';
console.log(writeRun(run, results, summarize(results)));
process.exitCode = results.unexpected ? 1 : 0;
