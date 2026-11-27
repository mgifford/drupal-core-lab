// Evidence for #3636987: select elements keep Drupal's SVG chevron in forced-colors + dark mode, next to the
// browser's native caret (two carets), because `.dark-mode .form-element--type-select` (0-2-0) out-ranks the
// forced-colors rule (0-1-0) for background-image. The November 20 patch adds `.dark-mode .form-element--type-select`
// to the forced-colors selector list.
//   node tools/playwright/evaluate-3636987.mjs [slug] [--browser=chromium] [--scheme=light|dark] [--forced-colors]
//                                              [--viewport=1280x900] [--out=<dir>]
// One invocation = one colour mode (light, dark, forced-colors light, forced-colors dark). Each side is measured on
// /admin/content (normal selects) and /admin/structure/block (extrasmall `.block-region-select`), including a real Tab
// focus state, a disabled state (attribute set in the page: no naturally disabled select exists on these pages) and
// RTL (document dir attribute set: a simulation, not a native RTL install).
// For every select it records the computed background-image, appearance, padding-inline-end, background-size and
// background-position. The custom caret count is the count of selects whose background-image is not `none`; the
// native caret is painted by the browser and cannot be counted from script, so "exactly one caret" is
// (custom background none) + (appearance native) plus a visual check of the screenshots.
// Not covered: real screen readers, a person's keyboard pass, Firefox/WebKit, a native RTL language, 200% zoom.
import fs from 'node:fs';
import path from 'node:path';
import { runArgs, launch, openSide, axeScan, baseResults, writeRun, contextMarkdown } from './lib/lab-run.mjs';

const run = runArgs({ slug: '3636987-pinned' });
const CONTENT = '/admin/content';
const BLOCKS = '/admin/structure/block';

// Serialised into the page. Pure DOM/CSSOM reading; nothing is changed here.
const measure = () => {
  const rows = [...document.querySelectorAll('select')].map((el, i) => {
    const s = getComputedStyle(el), r = el.getBoundingClientRect();
    const bg = s.backgroundImage;
    return {
      index: i,
      id: el.id || null,
      name: el.name || null,
      classes: [...el.classList],
      extrasmall: el.classList.contains('form-element--extrasmall'),
      multiple: el.multiple,
      focused: document.activeElement === el,
      disabled: el.disabled,
      visible: el.getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden',
      backgroundImage: bg,
      customCaret: bg !== 'none',
      appearance: s.appearance,
      paddingInlineEnd: s.paddingInlineEnd,
      paddingRight: s.paddingRight,
      paddingLeft: s.paddingLeft,
      backgroundSize: s.backgroundSize,
      backgroundPosition: s.backgroundPosition,
      forcedColorAdjust: s.forcedColorAdjust,
      colorScheme: s.colorScheme,
      color: s.color,
      backgroundColor: s.backgroundColor,
      borderTopWidth: s.borderTopWidth,
      direction: s.direction,
      width: Math.round(r.width),
      height: Math.round(r.height),
    };
  });
  return {
    forcedColors: matchMedia('(forced-colors: active)').matches,
    darkClass: document.documentElement.classList.contains('dark-mode'),
    darkModeSetting: window.defaultAdminDarkMode ?? null,
    dir: document.documentElement.dir || 'ltr',
    theme: window.drupalSettings?.ajaxPageState?.theme ?? null,
    selectCount: rows.length,
    customCaretCount: rows.filter((r) => r.customCaret).length,
    extrasmallCount: rows.filter((r) => r.extrasmall).length,
    forcedColorAdjustAuto: rows.filter((r) => r.forcedColorAdjust !== 'none').length,
    rows,
  };
};

const firstNormal = (m) => m.rows.find((r) => r.visible && !r.extrasmall && !r.multiple);
const firstExtrasmall = (m) => m.rows.find((r) => r.visible && r.extrasmall);

const addLabel = async (page, text) => {
  await page.evaluate((t) => {
    let d = document.getElementById('__lab-label');
    if (!d) { d = document.createElement('div'); d.id = '__lab-label'; d.style.cssText = 'position:fixed;inset:4px auto auto 4px;z-index:2147483647;background:#fff;color:#000;border:1px solid #000;font:12px/1.2 monospace;padding:2px 4px;pointer-events:none'; document.body.append(d); }
    d.textContent = t;
  }, text);
};
const removeLabel = (page) => page.evaluate(() => document.getElementById('__lab-label')?.remove());

// Full viewport (page context) and a crop of the caret end of one select.
async function shoot(page, base, label, index) {
  const out = {};
  await addLabel(page, label);
  out.full = `${base}-full.png`;
  await page.screenshot({ path: path.join(run.out, out.full) });
  await removeLabel(page);
  if (Number.isInteger(index)) {
    const loc = page.locator('select').nth(index);
    if ((await loc.count()) && (await loc.isVisible())) {
      await loc.scrollIntoViewIfNeeded();
      const b = await loc.boundingBox();
      if (b) {
        out.crop = `${base}-caret.png`;
        await page.screenshot({ path: path.join(run.out, out.crop), clip: { x: Math.max(0, b.x + b.width - 100), y: Math.max(0, b.y - 6), width: 100, height: b.height + 12 } });
      }
    }
  }
  return out;
}

// Press Tab with real keyboard input until a select is focused. Returns how many presses it took (0 = not reached).
async function tabToSelect(page, onlyExtrasmall) {
  await page.evaluate(() => document.activeElement?.blur?.());
  for (let i = 0; i < 260; i++) {
    await page.keyboard.press('Tab');
    const hit = await page.evaluate((only) => {
      const a = document.activeElement;
      if (!a || a.tagName !== 'SELECT') return false;
      return only ? a.classList.contains('form-element--extrasmall') : !a.classList.contains('form-element--extrasmall');
    }, !!onlyExtrasmall);
    if (hit) return i + 1;
  }
  return 0;
}

async function side(name) {
  const { page, rec } = await openSide(run, name);
  rec.notes = []; rec.shots = {}; rec.measurements = {};
  const host = rec.host ? `https://${rec.host}` : '';
  const go = async (p) => { await page.goto(host + p, { waitUntil: 'load' }); await page.waitForTimeout(400); };

  await go(CONTENT);
  const contentDefault = await page.evaluate(measure);
  rec.measurements.contentDefault = contentDefault;
  rec.shots['content-default'] = await shoot(page, `${name}-content-default`, `${name.toUpperCase()} · ${run.v.slug} · ${run.envTag} · /admin/content · default`, firstNormal(contentDefault)?.index ?? 0);

  // Real keyboard focus on a normal select.
  const contentTabs = await tabToSelect(page, false);
  rec.contentTabsToFocus = contentTabs;
  const contentFocus = await page.evaluate(measure);
  rec.measurements.contentFocus = contentFocus;
  rec.shots['content-focus'] = await shoot(page, `${name}-content-focus`, `${name.toUpperCase()} · ${run.v.slug} · ${run.envTag} · /admin/content · keyboard focus after ${contentTabs} Tab`, contentFocus.rows.find((r) => r.focused)?.index ?? null);
  await page.evaluate(() => document.activeElement?.blur?.());

  // Disabled state: set the attribute on the first normal select (disclosed as simulated).
  const target = firstNormal(contentDefault);
  const contentDisabled = await page.evaluate((i) => {
    const el = document.querySelectorAll('select')[i]; if (!el) return null;
    el.dataset.labWasDisabled = el.disabled ? '1' : '0'; el.disabled = true;
    const s = getComputedStyle(el), r = el.getBoundingClientRect();
    return { index: i, id: el.id || null, backgroundImage: s.backgroundImage, customCaret: s.backgroundImage !== 'none', appearance: s.appearance, paddingInlineEnd: s.paddingInlineEnd, disabled: el.disabled, width: Math.round(r.width), height: Math.round(r.height), simulated: true };
  }, target.index);
  rec.measurements.contentDisabled = contentDisabled;
  rec.shots['content-disabled'] = await shoot(page, `${name}-content-disabled`, `${name.toUpperCase()} · ${run.v.slug} · ${run.envTag} · /admin/content · disabled (attribute set in page)`, contentDisabled?.index ?? null);
  await page.evaluate((i) => { const el = document.querySelectorAll('select')[i]; if (el && el.dataset.labWasDisabled === '0') el.disabled = false; }, target.index);

  // RTL: set the document direction (simulation, not a native RTL install).
  await page.evaluate(() => { document.documentElement.dir = 'rtl'; });
  await page.waitForTimeout(300);
  const contentRtl = await page.evaluate(measure);
  rec.measurements.contentRtl = contentRtl;
  rec.shots['content-rtl'] = await shoot(page, `${name}-content-rtl`, `${name.toUpperCase()} · ${run.v.slug} · ${run.envTag} · /admin/content · dir=rtl (simulated)`, firstNormal(contentRtl)?.index ?? 0);
  await page.evaluate(() => { document.documentElement.dir = 'ltr'; });

  rec.axeContent = await axeScan(page);

  // Block layout: normal and extrasmall selects on the same admin page.
  await go(BLOCKS);
  const blockDefault = await page.evaluate(measure);
  rec.measurements.blockDefault = blockDefault;
  const ex = firstExtrasmall(blockDefault);
  rec.shots['block-default'] = await shoot(page, `${name}-block-default`, `${name.toUpperCase()} · ${run.v.slug} · ${run.envTag} · /admin/structure/block · default`, ex?.index ?? 0);

  const blockTabs = await tabToSelect(page, true);
  rec.blockTabsToExtrasmall = blockTabs;
  const blockFocus = await page.evaluate(measure);
  rec.measurements.blockFocus = blockFocus;
  const focusedEx = blockFocus.rows.find((r) => r.focused);
  rec.shots['block-focus'] = await shoot(page, `${name}-block-focus`, `${name.toUpperCase()} · ${run.v.slug} · ${run.envTag} · /admin/structure/block · extrasmall keyboard focus after ${blockTabs} Tab`, focusedEx?.index ?? null);
  await page.evaluate(() => document.activeElement?.blur?.());

  const blockDisabled = ex ? await page.evaluate((i) => {
    const el = document.querySelectorAll('select')[i]; if (!el) return null;
    el.dataset.labWasDisabled = el.disabled ? '1' : '0'; el.disabled = true;
    const s = getComputedStyle(el), r = el.getBoundingClientRect();
    return { index: i, id: el.id || null, classes: [...el.classList], backgroundImage: s.backgroundImage, customCaret: s.backgroundImage !== 'none', appearance: s.appearance, paddingInlineEnd: s.paddingInlineEnd, disabled: el.disabled, width: Math.round(r.width), height: Math.round(r.height), simulated: true };
  }, ex.index) : null;
  rec.measurements.blockDisabled = blockDisabled;
  rec.shots['block-disabled'] = await shoot(page, `${name}-block-disabled`, `${name.toUpperCase()} · ${run.v.slug} · ${run.envTag} · /admin/structure/block · extrasmall disabled (attribute set in page)`, blockDisabled?.index ?? null);
  if (ex) await page.evaluate((i) => { const el = document.querySelectorAll('select')[i]; if (el && el.dataset.labWasDisabled === '0') el.disabled = false; }, ex.index);

  rec.axeBlocks = await axeScan(page);
  return rec.close(run.out);
}

const { browser, environment } = await launch(run);
run.browser = browser;
const results = baseResults(run, { ...environment, page: CONTENT, pages: [CONTENT, BLOCKS], rtl: 'simulated via document dir', disabled: 'simulated via attribute for the disabled state', caretMethod: 'custom background-image count + computed appearance + screenshots' });
try {
  for (const name of ['before', 'after']) { console.log(`running ${name} (${run.v[name].env}) ...`); results.sides[name] = await side(name); }
} finally { await browser.close(); }

const S = results.sides;
const mode = `${environment.colorScheme}${environment.forcedColors ? ' + forced colors' : ''}`;
const shortBg = (bg) => (bg === 'none' ? 'none' : bg.length > 64 ? `${bg.slice(0, 61)}...` : bg);
const exCustom = (m) => m.rows.filter((r) => r.extrasmall && r.customCaret).length;

function sideTable(side) {
  const s = S[side], st = s.measurements, lines = [];
  const d = st.contentDefault, f = st.contentFocus, dis = st.contentDisabled, rtl = st.contentRtl, bd = st.blockDefault, bf = st.blockFocus, bdis = st.blockDisabled;
  const dn = firstNormal(d), rn = firstNormal(rtl), be = firstExtrasmall(bd), fr = f.rows.find((r) => r.focused), bfr = bf.rows.find((r) => r.focused);
  lines.push(`| Page | State | Selects | Custom caret | appearance | padding-inline-end | background-image |`);
  lines.push(`|---|---|---|---|---|---|---|`);
  lines.push(`| /admin/content | default (${dn?.id ?? 'first select'}) | ${d.selectCount} | ${d.customCaretCount} | ${dn?.appearance ?? '-'} | ${dn?.paddingInlineEnd ?? '-'} | ${shortBg(dn?.backgroundImage ?? '-')} |`);
  lines.push(`| /admin/content | keyboard focus (${s.contentTabsToFocus} Tab, ${fr?.id ?? '-'}) | 1 | ${fr ? (fr.customCaret ? 1 : 0) : '-'} | ${fr?.appearance ?? '-'} | ${fr?.paddingInlineEnd ?? '-'} | ${shortBg(fr?.backgroundImage ?? '-')} |`);
  lines.push(`| /admin/content | disabled (simulated, ${dis?.id ?? '-'}) | 1 | ${dis ? (dis.customCaret ? 1 : 0) : '-'} | ${dis?.appearance ?? '-'} | ${dis?.paddingInlineEnd ?? '-'} | ${shortBg(dis?.backgroundImage ?? '-')} |`);
  lines.push(`| /admin/content | dir=rtl (simulated) | ${rtl.selectCount} | ${rtl.customCaretCount} | ${rn?.appearance ?? '-'} | ${rn?.paddingInlineEnd ?? '-'} | ${shortBg(rn?.backgroundImage ?? '-')} (position ${rn?.backgroundPosition ?? '-'}) |`);
  lines.push(`| /admin/structure/block | default extrasmall (${be?.id ?? 'none'}) | ${bd.extrasmallCount} of ${bd.selectCount} | ${exCustom(bd)} | ${be?.appearance ?? '-'} | ${be?.paddingInlineEnd ?? '-'} | ${shortBg(be?.backgroundImage ?? '-')} |`);
  lines.push(`| /admin/structure/block | extrasmall focus (${s.blockTabsToExtrasmall} Tab, ${bfr?.id ?? '-'}) | 1 | ${bfr ? (bfr.customCaret ? 1 : 0) : '-'} | ${bfr?.appearance ?? '-'} | ${bfr?.paddingInlineEnd ?? '-'} | ${shortBg(bfr?.backgroundImage ?? '-')} |`);
  lines.push(`| /admin/structure/block | extrasmall disabled (simulated, ${bdis?.id ?? '-'}) | 1 | ${bdis ? (bdis.customCaret ? 1 : 0) : '-'} | ${bdis?.appearance ?? '-'} | ${bdis?.paddingInlineEnd ?? '-'} | ${shortBg(bdis?.backgroundImage ?? '-')} |`);
  return lines.join('\n');
}

// Every select in the default state, so the computed properties are recorded per control, not only per page.
function detailTable(side) {
  const s = S[side], lines = [`| Page | # | id | classes | extrasmall | background-image | appearance | padding-inline-end |`];
  lines.push(`|---|---|---|---|---|---|---|---|`);
  for (const [page, m] of [['/admin/content', s.measurements.contentDefault], ['/admin/structure/block', s.measurements.blockDefault]]) {
    for (const r of m.rows) lines.push(`| ${page} | ${r.index} | ${r.id ?? '-'} | ${r.classes.join(' ') || '-'} | ${r.extrasmall} | ${shortBg(r.backgroundImage)} | ${r.appearance} | ${r.paddingInlineEnd} |`);
  }
  return lines.join('\n');
}

// What the run found.
for (const side of ['before', 'after']) {
  const s = S[side];
  s.checks = {
    darkClassAsExpected: s.measurements.contentDefault.darkClass === (environment.colorScheme === 'dark'),
    forcedColorsAsExpected: s.measurements.contentDefault.forcedColors === environment.forcedColors,
    normalSelectsFound: s.measurements.contentDefault.selectCount > 0,
    extrasmallSelectsFound: s.measurements.blockDefault.extrasmallCount > 0,
    extrasmallFocused: (s.blockTabsToExtrasmall || 0) > 0,
    // The defect: a select whose custom SVG background survives forced colors. Only counted in forced modes.
    customCaretInForcedColours: s.measurements.contentDefault.customCaretCount + s.measurements.blockDefault.customCaretCount,
    focusKeepsCustomCaret: (s.measurements.contentFocus.rows.find((r) => r.focused)?.customCaret ? 1 : 0) + (s.measurements.blockFocus.rows.find((r) => r.focused)?.customCaret ? 1 : 0),
    disabledKeepsCustomCaret: (s.measurements.contentDisabled?.customCaret ? 1 : 0) + (s.measurements.blockDisabled?.customCaret ? 1 : 0),
    nativeAppearance: [s.measurements.contentDefault, s.measurements.blockDefault].every((m) => m.rows.every((r) => r.appearance !== 'none')),
  };
}

const B = S.before, A = S.after;
const cmp = (fn) => ({ before: fn(B), after: fn(A) });
const paddingCmp = cmp((s) => ({ normal: firstNormal(s.measurements.contentDefault)?.paddingInlineEnd, extrasmall: firstExtrasmall(s.measurements.blockDefault)?.paddingInlineEnd }));
const sizeCmp = cmp((s) => ({ normal: firstNormal(s.measurements.contentDefault) ? `${firstNormal(s.measurements.contentDefault).width}x${firstNormal(s.measurements.contentDefault).height}` : null, extrasmall: firstExtrasmall(s.measurements.blockDefault) ? `${firstExtrasmall(s.measurements.blockDefault).width}x${firstExtrasmall(s.measurements.blockDefault).height}` : null }));
const sizeChanges = Object.keys(paddingCmp.before).filter((k) => paddingCmp.before[k] !== paddingCmp.after[k]);
const geometryChanges = Object.keys(sizeCmp.before).filter((k) => JSON.stringify(sizeCmp.before[k]) !== JSON.stringify(sizeCmp.after[k]));

const fails = [];
if (!B.checks.normalSelectsFound || !A.checks.normalSelectsFound) fails.push('no select found on /admin/content');
if (!B.checks.extrasmallSelectsFound || !A.checks.extrasmallSelectsFound) fails.push('no extrasmall select found on /admin/structure/block');
if (!B.checks.extrasmallFocused || !A.checks.extrasmallFocused) fails.push('could not reach an extrasmall select with Tab');
if (!B.checks.darkClassAsExpected || !A.checks.darkClassAsExpected) fails.push('.dark-mode class does not match the requested colour scheme');
if (!B.checks.forcedColorsAsExpected || !A.checks.forcedColorsAsExpected) fails.push('forced-colors media query does not match the requested mode');
if (sizeChanges.length) fails.push(`computed padding-inline-end changed: ${sizeChanges.join(', ')}`);
if (geometryChanges.length) fails.push(`select box size changed: ${geometryChanges.join(', ')}`);
if (environment.forcedColors && A.checks.customCaretInForcedColours > 0) fails.push(`After still paints ${A.checks.customCaretInForcedColours} custom caret(s) in forced colors`);
if (environment.forcedColors && A.checks.focusKeepsCustomCaret > 0) fails.push('After still paints a custom caret on keyboard focus in forced colors');
if (environment.forcedColors && A.checks.disabledKeepsCustomCaret > 0) fails.push('After still paints a custom caret on a disabled select in forced colors');

const beforeDefect = B.checks.customCaretInForcedColours > 0;
const afterDefect = A.checks.customCaretInForcedColours > 0;
results.beforeDefect = beforeDefect; results.afterDefect = afterDefect;
results.caretComparison = { padding: paddingCmp, geometry: sizeCmp };
results.verdict = environment.forcedColors
  ? (beforeDefect && !afterDefect ? 'reproduced-and-fixed' : beforeDefect && afterDefect ? 'reproduced-not-fixed' : !beforeDefect && !afterDefect ? 'not-reproduced' : 'mixed')
  : 'not-reproduced';   // without forced colours the custom chevron is the normal design on both sides: a control run, not a defect
results.failures = fails; results.unexpected = fails.length;

const md = (() => {
  let t = `# #3636987 select caret in forced colors (${results.variant}, ${mode}, ${environment.viewport.width}x${environment.viewport.height}, ${environment.browser} ${environment.browserVersion})\n\nDRAFT, AI-assisted; a person has not reviewed it. Verdict: ${results.verdict}. `;
  t += `\n\nOne invocation is one colour mode. This run: **${mode}**.${environment.forcedColors ? '' : ' Without forced colours the defect is not expected: this is a control run, and Drupal\'s custom chevron should be present on both sides.'} A select keeps Drupal's SVG background-image when its computed \`background-image\` is not \`none\`; the native caret is painted by the browser and cannot be counted from script, so "one visible caret" is \`background-image: none\` plus a native \`appearance\` plus the screenshots. Disabled is simulated by setting the \`disabled\` attribute; RTL is simulated with the document \`dir\` attribute, not a native RTL install. Not covered: Firefox/WebKit, real screen readers, a person's keyboard pass.\n\n`;
  t += `## Before\n\n${sideTable('before')}\n\n`;
  t += `## After\n\n${sideTable('after')}\n\n`;
  t += `## Computed properties, default state, every select\n\n${detailTable('before')}\n\n${detailTable('after')}\n\n## Checks\n\n`;
  t += `| Check | Before | After |\n|---|---|---|\n`;
  t += `| .dark-mode class matches the requested mode | ${B.checks.darkClassAsExpected} | ${A.checks.darkClassAsExpected} |\n`;
  t += `| forced-colors media query matches the requested mode | ${B.checks.forcedColorsAsExpected} | ${A.checks.forcedColorsAsExpected} |\n`;
  t += `| normal selects found | ${B.checks.normalSelectsFound} | ${A.checks.normalSelectsFound} |\n`;
  t += `| extrasmall selects found | ${B.checks.extrasmallSelectsFound} | ${A.checks.extrasmallSelectsFound} |\n`;
  t += `| extrasmall reached with Tab | ${B.checks.extrasmallFocused} (${B.blockTabsToExtrasmall} Tab) | ${A.checks.extrasmallFocused} (${A.blockTabsToExtrasmall} Tab) |\n`;
  t += `| selects with a custom SVG background (default, both pages; 0 is expected only in forced colours) | ${B.checks.customCaretInForcedColours} | ${A.checks.customCaretInForcedColours} |\n`;
  t += `| custom SVG background on keyboard focus | ${B.checks.focusKeepsCustomCaret} | ${A.checks.focusKeepsCustomCaret} |\n`;
  t += `| custom SVG background on disabled | ${B.checks.disabledKeepsCustomCaret} | ${A.checks.disabledKeepsCustomCaret} |\n\n`;
  t += `Padding-inline-end (Before → After): normal ${paddingCmp.before.normal} → ${paddingCmp.after.normal}; extrasmall ${paddingCmp.before.extrasmall} → ${paddingCmp.after.extrasmall}. Select box (Before → After): normal ${sizeCmp.before.normal} → ${sizeCmp.after.normal}; extrasmall ${sizeCmp.before.extrasmall} → ${sizeCmp.after.extrasmall}.\n\n`;
  t += `Screenshots (full page and caret-end crop):\n\n`;
  for (const side of ['before', 'after']) for (const [k, v] of Object.entries(S[side].shots || {})) t += `- ${side} ${k}: [${v.full}](${v.full})${v.crop ? `, [caret crop](${v.crop})` : ''}\n`;
  t += `\n## axe-core (WCAG 2.2 A/AA, before → after violation counts)\n\n`;
  for (const k of ['axeContent', 'axeBlocks']) t += `- ${k}: ${B[k]?.total ?? 'n/a'} → ${A[k]?.total ?? 'n/a'}\n`;
  t += `\n## Failures in this run\n\n${fails.length ? fails.map((f) => `- ${f}`).join('\n') : '- none'}\n`;
  t += `\n${contextMarkdown(results)}`;
  return t;
})();

console.log(writeRun(run, results, md));
process.exitCode = results.unexpected || (environment.forcedColors && results.verdict === 'reproduced-not-fixed') ? 1 : 0;
