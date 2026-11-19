// #3637339 / MR !17818. Real UI saves and independent, one-key-at-a-time focus traces.
// No core changes, injected focus styles, locator.focus(), or concurrent focus mirroring.
import fs from 'node:fs';
import path from 'node:path';
import AxeBuilder from '@axe-core/playwright';
import {
  runArgs, launch, openSide, axeScan, TAGS, baseResults, writeRun,
  contextMarkdown, ajaxMarkdown, speechMarkdown,
} from './lib/lab-run.mjs';

const DEFAULT_SCENARIOS = [
  { id: 'light-default-orange', appearance: 'Light', accent: 'default', focus: 'Orange' },
  { id: 'dark-default-green', appearance: 'Dark', accent: 'default', focus: 'Green' },
  { id: 'light-pink-accent', appearance: 'Light', accent: 'Pink', focus: 'Same as Accent color' },
  { id: 'dark-pink-accent', appearance: 'Dark', accent: 'Pink', focus: 'Same as Accent color' },
  { id: 'light-pink-orange', appearance: 'Light', accent: 'Pink', focus: 'Orange' },
  { id: 'dark-pink-orange', appearance: 'Dark', accent: 'Pink', focus: 'Orange' },
];
const SCENARIOS = [
  ...DEFAULT_SCENARIOS,
  { id: 'light-pink-focus-default', appearance: 'Light', accent: 'Pink', focus: 'default' },
  { id: 'dark-pink-focus-default', appearance: 'Dark', accent: 'Pink', focus: 'default' },
];
const HELP = `Usage: node tools/playwright/evaluate-3637339.mjs [registered-issue-3637339-slug]
  Examples: 3637339-latest, 3637339-pinned, 3637339-focus-clearance (when registered).
  --browser=chromium|firefox|webkit   Default chromium; browser must already be installed.
  --viewport=1280x900                One viewport per run (also 768x900, 375x900, 480x900).
  --scheme=light|dark                OS preference, independent of explicitly saved Appearance.
  --forced-colors                    Emulate forced colors; combine with --scheme=light or dark.
  --rtl                             Direction-only simulation, NOT a translated RTL installation.
  --tab-key=Tab|Alt+Tab              Default Tab. Explicit Alt+Tab diagnostic for WebKit/macOS
                                    link-navigation preference; never silently substituted.
  --scenarios=all|ID,ID              Default all six UI configurations:
    ${DEFAULT_SCENARIOS.map(s => s.id).join('\n    ')}
  Optional diagnostics (not included in all):
    light-pink-focus-default, dark-pink-focus-default
    These select the actual Focus color option marked (Default), independently of Pink accent.
  --repeat=2                        Independent fresh-document keyboard trials (minimum 2).
  --out=/absolute/path              Shared lab-run output override.
  --help                            Print this help without opening sites or creating evidence.
Settings are changed and restored via the actual theme settings form; do not run concurrently.
Full axe JSON, AX snapshots, keyboard traces and viewport PNGs accompany results.json.
Exit 0: measured checks pass; 1: After product/expectation failure; 2: infrastructure error or incomplete comparison.
Paint/contrast judgments remain manual: geometry alone cannot establish WCAG conformance.
Example: ... 3637339-latest --viewport=375x900 --rtl --forced-colors --scheme=dark
`;
const argv = process.argv.slice(2);
const option = (name, fallback) => argv.find(a => a.startsWith(`--${name}=`))?.slice(name.length + 3) ?? fallback;
const SETTINGS = '/admin/appearance/settings/default_admin';
const FORM = '#system-theme-settings';
const names = ['enable_dark_mode', 'preset_accent_color', 'preset_focus_color'];
const json = (run, file, value) => fs.writeFileSync(path.join(run.out, file), JSON.stringify(value, null, 2));
const cleanError = error => String(error?.message || error).replace(/https?:\/\/\S+/g, '[URL]').slice(0, 1800);

async function readiness(page, run, rec) {
  await page.locator(FORM).waitFor({ state: 'visible' });
  await page.waitForFunction(() => !!window.Drupal?.adminAccent && !!window.drupalSettings?.defaultAdmin);
  await page.evaluate(() => document.fonts.ready);
  if (run.rtl) {
    // Explicit, recorded direction-only simulation; never use DOM classes to set colors or focus.
    await page.evaluate(() => { document.documentElement.dir = 'rtl'; });
  }
  await page.mouse.move(run.viewport.width - 1, run.viewport.height - 1);
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  const state = await page.evaluate(() => {
    const themes = [...new Set([...document.querySelectorAll('script[src],link[rel="stylesheet"][href]')]
      .map(e => new URL(e.src || e.href, location.href).searchParams.get('theme')).filter(Boolean))];
    return {
      path: location.pathname, lang: document.documentElement.lang, dir: document.documentElement.dir,
      theme: window.drupalSettings?.ajaxPageState?.theme || (themes.length === 1 ? themes[0] : null),
      themeEvidence: window.drupalSettings?.ajaxPageState?.theme ? 'ajaxPageState' : 'asset-query-parameter inference',
      assetThemes: themes, settings: window.drupalSettings.defaultAdmin,
      darkClass: document.documentElement.classList.contains('dark-mode'),
      colorScheme: getComputedStyle(document.documentElement).colorScheme,
      osDark: matchMedia('(prefers-color-scheme: dark)').matches,
      forcedColors: matchMedia('(forced-colors: active)').matches,
      skipCount: document.querySelectorAll('a.skip-link[href="#main-content"]').length,
      targetCount: document.querySelectorAll('[id="main-content"]').length,
    };
  });
  rec.pages.push(state);
  if (state.theme !== 'default_admin' || state.skipCount !== 1 || state.targetCount !== 1)
    throw new Error(`Readiness precondition failed: ${JSON.stringify(state)}`);
  if (state.forcedColors !== run.forced)
    throw new Error('Requested forced-colors emulation is unavailable in this browser');
  return state;
}

async function formState(page) {
  return page.locator(FORM).evaluate((form, fields) => Object.fromEntries(fields.map(name => {
    const elements = [...form.elements].filter(e => e.name === name);
    const first = elements[0];
    const choices = first?.tagName === 'SELECT'
      ? [...first.options].map(o => ({ value: o.value, label: o.label }))
      : elements.map(e => ({ value: e.value, label: [...e.labels].map(l => l.textContent.trim()).join(' ') }));
    return [name, { value: first?.tagName === 'SELECT' ? first.value : elements.find(e => e.checked)?.value, choices }];
  })), names);
}

function resolveScenario(scenario, available) {
  const wanted = [scenario.appearance, scenario.accent, scenario.focus];
  const selected = {};
  for (const [i, name] of names.entries()) {
    const choice = available[name].choices.find(c => wanted[i] === 'default' ? /\(Default\)/i.test(c.label) : c.label === wanted[i]);
    if (!choice) return { available: false, reason: `${name}: requested "${wanted[i]}" not offered`, actualChoices: available };
    selected[name] = choice;
  }
  return { available: true, selected };
}

async function saveSettings(page, base, run, rec, selected) {
  await page.goto(base + SETTINGS);
  await readiness(page, run, rec);
  const form = page.locator(FORM);
  for (const name of names) {
    const choice = selected[name];
    if (name === 'preset_focus_color') await form.getByRole('combobox', { name: 'Focus color', exact: true }).selectOption({ label: choice.label });
    else await form.getByRole('radio', { name: choice.label, exact: true }).check();
  }
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'load' }),
    form.getByRole('button', { name: 'Save configuration', exact: true }).click(),
  ]);
  const ready = await readiness(page, run, rec);
  const saved = await formState(page);
  for (const name of names) {
    if (saved[name].value !== selected[name].value) throw new Error(`UI save did not persist ${name}`);
  }
  const effective = ready.settings;
  if (effective.preset_accent_color !== saved.preset_accent_color.value ||
      effective.preset_focus_color !== saved.preset_focus_color.value ||
      String(effective.dark_mode) !== saved.enable_dark_mode.value)
    throw new Error('Effective user settings differ from saved global settings; user override/precondition needs investigation');
  return { saved, effective, readiness: ready };
}

// Read-only measurement; no hidden probe elements or temporary CSS declarations.
async function measure(page) {
  return page.evaluate(() => {
    const el = document.activeElement;
    const rect = e => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, top: r.top, right: r.right, bottom: r.bottom, left: r.left, width: r.width, height: r.height }; };
    const cs = getComputedStyle(el);
    const props = ['--focus-outline', '--outline-size', '--outline-offset', '--admin-color-focus',
      '--admin-color-primary', '--accent-base', '--admin-color-bg-raised', '--admin-color-text-loud'];
    const ancestors = [];
    for (let e = el.parentElement; e; e = e.parentElement) {
      const s = getComputedStyle(e);
      ancestors.push({ tag: e.tagName, id: e.id, classes: e.className, rect: rect(e), overflowX: s.overflowX,
        overflowY: s.overflowY, clipPath: s.clipPath, contain: s.contain, background: s.backgroundColor,
        backgroundImage: s.backgroundImage, position: s.position, zIndex: s.zIndex });
    }
    const r = rect(el), outset = Math.max(0, parseFloat(cs.outlineWidth) + parseFloat(cs.outlineOffset));
    const outer = { top: r.top - outset, left: r.left - outset, right: r.right + outset, bottom: r.bottom + outset };
    const edges = {
      top: Math.max(0, -outer.top), left: Math.max(0, -outer.left),
      right: Math.max(0, outer.right - innerWidth), bottom: Math.max(0, outer.bottom - innerHeight),
    };
    const points = [[r.left + r.width / 2, r.top + r.height / 2], [r.left + 1, r.top + 1], [r.right - 1, r.bottom - 1]];
    const hits = points.map(([x, y]) => {
      const hit = document.elementFromPoint(x, y);
      return { x, y, tag: hit?.tagName, id: hit?.id, classes: hit?.className, focusedElementOrChild: !!hit && (hit === el || el.contains(hit)) };
    });
    // Canvas resolves computed color syntax (including oklch/color()) into sRGB.
    // Ratios are estimates against solid computed surfaces, NOT sampled painted pixels.
    const ctx = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
    const rgb = color => {
      if (!CSS.supports('color', color)) return null;
      ctx.clearRect(0, 0, 1, 1); ctx.fillStyle = color; ctx.fillRect(0, 0, 1, 1);
      return [...ctx.getImageData(0, 0, 1, 1).data];
    };
    const contrast = (a, b) => {
      if (!a || !b || a[3] !== 255 || b[3] !== 255) return null;
      const lum = c => c.slice(0, 3).map(n => { n /= 255; return n <= 0.04045 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4; })
        .reduce((v, n, i) => v + n * [0.2126, 0.7152, 0.0722][i], 0);
      return (Math.max(lum(a), lum(b)) + 0.05) / (Math.min(lum(a), lum(b)) + 0.05);
    };
    const adjacent = ancestors.find(a => rgb(a.background)?.[3] === 255)?.background || null;
    return {
      tag: el.tagName, id: el.id, name: el.getAttribute('name'), text: (el.textContent || '').trim().slice(0, 180),
      html: el.outerHTML.slice(0, 1600), href: el.getAttribute('href'), tabindex: el.getAttribute('tabindex'),
      focus: el.matches(':focus'), focusVisible: el.matches(':focus-visible'), skip: el.matches('a.skip-link[href="#main-content"]'),
      comparable: el.matches('input[type="radio"][name="enable_dark_mode"]'), hash: location.hash, scroll: { x: scrollX, y: scrollY },
      rect: r, outline: { color: cs.outlineColor, rgba: rgb(cs.outlineColor), width: cs.outlineWidth, style: cs.outlineStyle, offset: cs.outlineOffset },
      shadow: cs.boxShadow, color: cs.color, background: cs.backgroundColor, adjacentSolidBackground: adjacent,
      contrastEstimates: { method: 'computed solid colors only; no composited pixel or gradient proof',
        textOnOwnBackground: contrast(rgb(cs.color), rgb(cs.backgroundColor)),
        outlineOnAdjacentSolidBackground: contrast(rgb(cs.outlineColor), adjacent ? rgb(adjacent) : null) },
      position: cs.position, zIndex: cs.zIndex, clip: cs.clip, clipPath: cs.clipPath, overflow: cs.overflow,
      customProperties: Object.fromEntries(props.map(p => [p, cs.getPropertyValue(p).trim()])),
      root: { dir: document.documentElement.dir, focusPreset: document.documentElement.getAttribute('data-admin-focus'),
        accent: document.documentElement.getAttribute('data-accent'), scheme: getComputedStyle(document.documentElement).colorScheme },
      clipping: { outlineBoundsEstimate: outer, outsideViewportPixels: edges,
        risk: cs.outlineStyle !== 'none' && Object.values(edges).some(n => n > 0),
        ancestors, hitTests: hits, paintJudgment: 'inconclusive: inspect PNG; bounds and hit tests do not prove painted clipping or WCAG failure' },
    };
  });
}

async function audit(page, run, prefix, stage) {
  const summary = await axeScan(page);
  // lab-run's summary intentionally limits node detail; preserve the full unfiltered result too.
  const full = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  const file = `${prefix}-${stage}-axe-full.json`;
  json(run, file, full);
  return { ...summary, fullResults: file, fullViolationCount: full.violations.length };
}

async function snapshot(page, run, prefix, stage, scan = true) {
  const state = await measure(page);
  state.screenshot = `${prefix}-${stage}.png`;
  await page.screenshot({ path: path.join(run.out, state.screenshot), fullPage: false, animations: 'disabled' });
  state.ax = `${prefix}-${stage}-ax.txt`;
  fs.writeFileSync(path.join(run.out, state.ax), await page.locator('body').ariaSnapshot());
  if (scan) state.axe = await audit(page, run, prefix, stage);
  return state;
}

async function trial(page, base, run, rec, prefix, scan) {
  await page.goto(base + SETTINGS); // fresh document, not reload retaining form-control focus
  const ready = await readiness(page, run, rec);
  const trace = [{ key: null, stage: 'before-first-Tab', state: await measure(page) }];
  const before = await snapshot(page, run, prefix, 'before-tab', scan);
  let skip = null;
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press(run.tabKey);
    const state = await measure(page);
    trace.push({ key: run.tabKey, state });
    if (state.skip) { skip = await snapshot(page, run, prefix, 'skip-focused', scan); break; }
  }
  if (!skip) return { readiness: ready, before, trace, reachability: false, checks: { skipReachable: false }, paintJudgment: 'not tested: skip link not reached' };
  await page.keyboard.press('Enter');
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  trace.push({ key: 'Enter', state: await measure(page) });
  const activated = await snapshot(page, run, prefix, 'activated', scan);
  let control = null;
  // Observe every key; never jump to the control with focus(), clicks, or synthetic events.
  for (let i = 0; i < 100; i++) {
    await page.keyboard.press(run.tabKey);
    const state = await measure(page);
    trace.push({ key: run.tabKey, state });
    if (state.comparable) { control = await snapshot(page, run, prefix, 'control-focused', scan); break; }
  }
  const checks = {
    skipReachable: true, firstTabIsSkip: trace[1].state.skip,
    skipRevealed: skip.rect.width > 1 && skip.rect.height > 1 && skip.clip === 'auto' &&
      skip.rect.right > 0 && skip.rect.bottom > 0,
    activationFocusTarget: activated.id === 'main-content',
    activationHash: activated.hash === '#main-content',
    comparableReachable: !!control,
    outlineMatchesComparable: !!control && skip.outline.color === control.outline.color &&
      skip.outline.width === control.outline.width && skip.outline.style === control.outline.style &&
      skip.outline.offset === control.outline.offset && parseFloat(skip.outline.width) > 0 && skip.outline.style !== 'none',
    // An explicit full-ring geometry expectation, NOT an automated WCAG AA verdict.
    fullIndicatorBoundsInsideViewport: !skip.clipping.risk,
  };
  return {
    readiness: ready, before, skip, activated, control, trace, reachability: true, checks,
    resolvedFocusColor: control ? { value: control.outline.color, rgba: control.outline.rgba, source: 'computed outline-color of keyboard-focused Appearance radio (general theme focus rule)' } : null,
    paintJudgment: 'inconclusive pending visual review: viewport/ancestor clipping risk is not a blanket AA or AAA verdict',
  };
}

function summarize(results) {
  let md = `# #3637339 skip-link evaluation\n\nDRAFT, AI-assisted. ${results.verdict}; ${results.unexpected} After measured-check failures (including the explicit full-indicator-bounds expectation, not a WCAG verdict). Infrastructure errors: ${results.infrastructureErrors.length}.\n\n`;
  md += `Real UI saves, sequential trusted ${results.environment.keyboardNavigationKey || 'Tab'}/Enter, independent fresh-document repeats. OS scheme is distinct from saved Appearance. RTL is direction-only simulation. Forced colors is browser emulation, not Windows AT testing.\n\n`;
  md += `WCAG mapping: 2.4.7 Focus Visible (AA), 2.4.11 Focus Not Obscured (Minimum, AA), 2.4.13 Focus Appearance (AAA). Color preference mismatch and partial ring clipping alone do not establish failure of these criteria. No blanket conformance claim; no human keyboard or real VoiceOver/NVDA pass was done. Some loaded skills have outdated criterion numbering; this report uses final WCAG 2.2 numbering.\n\n`;
  md += `| Configuration | Before match | After match | After activation | Before → After edge risk | Geometry/navigation unchanged | Comparison |\n|---|---|---|---|---|---|---|\n`;
  for (const c of results.comparisons) md += `| ${c.id} | ${c.beforeMatches} | ${c.afterMatches} | ${c.afterActivation} | ${c.beforeClippingRisk} → ${c.afterClippingRisk} | ${c.geometryNavigationUnchanged} | ${c.status} |\n`;
  md += `\nPaired trials compare skip size, comparable-control viewport rect, activation target/scroll and the observed focus sequence, with a 0.5 CSS px geometry tolerance. Raw Before/After values and individual checks are in comparisons[].pairedTrials. These scoped measurements do not prove absence of all layout shifts or visual regressions.\n\n`;
  for (const side of ['before', 'after']) {
    const rec = results.sides[side];
    md += `\n## ${side}\n\nSettings restore: ${rec.restoration?.status || 'not attempted'}. Theme inference provenance is retained per readiness record.\n\n`;
    for (const s of rec.scenarios) {
      md += `### ${s.id}\n\nReadiness: ${s.status}. ${s.reason || ''}\n\n`;
      if (!s.configuration) continue;
      md += `Saved UI choices: ${JSON.stringify(s.configuration.saved)}\n\n`;
      for (const [i, t] of s.trials.entries()) {
        md += `Trial ${i + 1}: ${JSON.stringify(t.checks)}. Resolved focus: ${t.resolvedFocusColor?.value || 'unavailable'}. Paint: inconclusive; review required.\n\n`;
        if (t.skip) md += `[Skip focused](${t.skip.screenshot}) · ${t.control ? `[Comparable focused](${t.control.screenshot})` : 'Comparable not reached'} · [Activated](${t.activated.screenshot})\n\n`;
      }
    }
  }
  md += `\n## Evidence limits\n\nFull axe results (violations, passes, incomplete and inapplicable) and body AX snapshots accompany important states on the first independent trial. Subsequent trials repeat navigation and measurements without repeated axe scans. Computed-color contrast estimates are not sampled/composited paint proof. Geometry/hit tests flag risks only. Each configuration carries per-scenario JS errors. Unavailable options are NOT TESTED, not substituted with invented presets.\n\nMR review threads were HTTP 401. The caller read all seven public issue comments and the migrated Gin #3506305 work-item summary ("[PP-1] Improve the Skip to main content-link", referencing !581, text contrast and focus color); full Gin comments were unavailable. The obsolete drupal.org URL was not found; that does not mean the related issue does not exist.\n\n`;
  if (results.infrastructureErrors.length) md += `Infrastructure errors:\n${results.infrastructureErrors.map(e => `- ${e}`).join('\n')}\n\n`;
  return md + contextMarkdown(results) + ajaxMarkdown(results) + speechMarkdown(results);
}

async function main() {
  if (argv.includes('--help') || argv.includes('-h')) { console.log(HELP); return; }
  const allowed = /^(--(?:browser|scheme|viewport|out|scenarios|repeat|tab-key)=.+|--forced-colors|--rtl)$/;
  for (const arg of argv.filter(a => a.startsWith('-'))) if (!allowed.test(arg)) throw new Error(`Unknown option ${arg}; use --help`);
  const repeat = Number(option('repeat', '2'));
  if (!Number.isInteger(repeat) || repeat < 2 || repeat > 5) throw new Error('--repeat must be an integer from 2 to 5');
  const ids = option('scenarios', 'all').split(',');
  if (ids[0] !== 'all' && ids.some(id => !SCENARIOS.some(s => s.id === id))) throw new Error('Unknown scenario; use --help');
  const scenarios = ids[0] === 'all' ? DEFAULT_SCENARIOS : SCENARIOS.filter(s => ids.includes(s.id));
  if (!['light', 'dark'].includes(option('scheme', 'light'))) throw new Error('--scheme must be light or dark');
  const run = runArgs({ slug: '3637339-latest' });
  if (String(run.v.issue) !== '3637339') throw new Error('This evaluator only supports issue 3637339 variants');
  if (!Object.values(run.viewport).every(n => Number.isInteger(n) && n > 0)) throw new Error('Invalid viewport');
  run.rtl = argv.includes('--rtl');
  run.tabKey = option('tab-key', 'Tab');
  if (!['Tab', 'Alt+Tab'].includes(run.tabKey)) throw new Error('--tab-key must be Tab or Alt+Tab');
  const { browser, environment } = await launch(run);
  run.browser = browser;
  const results = baseResults(run, { ...environment, direction: run.rtl ? 'rtl-simulation' : 'native', keyboardNavigationKey: run.tabKey, repeat, scenarioIds: scenarios.map(s => s.id) });
  results.infrastructureErrors = [];
  try {
    for (const side of ['before', 'after']) {
      let session;
      try { session = await openSide(run, side); }
      catch (error) { results.infrastructureErrors.push(`${side}: openSide: ${cleanError(error)}`); break; }
      const { page, base, rec } = session;
      results.sides[side] = rec;
      rec.scenarios = [];
      let initial;
      try {
        if (rec.site.error || rec.site.dbError) throw new Error(rec.site.error || rec.site.dbError);
        await page.goto(base + SETTINGS);
        await readiness(page, run, rec);
        initial = await formState(page);
        rec.initialSettings = initial;
        for (const scenario of scenarios) {
          const entry = { id: scenario.id, requested: scenario, status: 'not-tested', trials: [] };
          rec.scenarios.push(entry);
          const errorStart = rec.jsErrors.length;
          try {
            const resolved = resolveScenario(scenario, initial);
            entry.resolution = resolved;
            if (!resolved.available) { entry.reason = resolved.reason; continue; }
            console.log(`${side}: ${scenario.id}`);
            entry.configuration = await saveSettings(page, base, run, rec, resolved.selected);
            entry.status = 'ready';
            const darkExpected = scenario.appearance === 'Dark';
            if (entry.configuration.readiness.darkClass !== darkExpected) throw new Error('Saved appearance did not resolve to the requested mode');
            for (let i = 0; i < repeat; i++) entry.trials.push(await trial(page, base, run, rec, `${side}-${scenario.id}-trial${i + 1}`, i === 0));
            entry.status = 'measured';
          } catch (error) {
            entry.status = 'infrastructure-error'; entry.reason = cleanError(error);
            results.infrastructureErrors.push(`${side}/${scenario.id}: ${entry.reason}`);
            break;
          } finally {
            await rec.collect();
            entry.jsErrors = rec.jsErrors.slice(errorStart);
          }
        }
      } catch (error) { results.infrastructureErrors.push(`${side}: ${cleanError(error)}`); }
      finally {
        if (initial) {
          try {
            const selected = Object.fromEntries(names.map(name => [name, initial[name].choices.find(c => c.value === initial[name].value)]));
            await saveSettings(page, base, run, rec, selected);
            rec.restoration = { status: 'restored through UI', actual: await formState(page) };
          } catch (error) {
            rec.restoration = { status: 'failed', error: cleanError(error) };
            results.infrastructureErrors.push(`${side} settings restoration: ${rec.restoration.error}`);
          }
        }
        await rec.close(run.out);
      }
    }
  } finally { await browser.close(); }
  results.comparisons = scenarios.map(s => {
    const b = results.sides.before?.scenarios.find(e => e.id === s.id), a = results.sides.after?.scenarios.find(e => e.id === s.id);
    const ready = b?.status === 'measured' && a?.status === 'measured';
    const reached = e => e?.trials?.length && e.trials.every(t => t.reachability);
    const checks = e => reached(e) ? e.trials.every(t => t.checks.outlineMatchesComparable) : null;
    const sameGeometry = (x, y, keys) => !!x && !!y && keys.every(k => Math.abs(x[k] - y[k]) <= 0.5);
    const sequence = t => t.trace.map(({ key, state }) => ({ key, tag: state.tag, id: state.id, name: state.name, href: state.href }));
    const pairedTrials = reached(b) && reached(a) ? a.trials.map((at, i) => {
      const bt = b.trials[i];
      return {
        trial: i + 1, geometryToleranceCssPx: 0.5,
        checks: {
          skipSizeUnchanged: sameGeometry(bt?.skip?.rect, at.skip?.rect, ['width', 'height']),
          comparableControlRectUnchanged: sameGeometry(bt?.control?.rect, at.control?.rect, ['x', 'y', 'width', 'height']),
          activationScrollUnchanged: sameGeometry(bt?.activated?.scroll, at.activated?.scroll, ['x', 'y']),
          activationTargetUnchanged: !!bt?.activated && bt.activated.id === at.activated?.id && bt.activated.hash === at.activated?.hash,
          focusSequenceUnchanged: !!bt && JSON.stringify(sequence(bt)) === JSON.stringify(sequence(at)),
        },
        before: { skipRect: bt?.skip?.rect, controlRect: bt?.control?.rect, activationScroll: bt?.activated?.scroll },
        after: { skipRect: at.skip?.rect, controlRect: at.control?.rect, activationScroll: at.activated?.scroll },
      };
    }) : [];
    const beforeClippingRisk = reached(b) ? b.trials.some(t => t.skip?.clipping.risk) : null;
    const afterClippingRisk = reached(a) ? a.trials.some(t => t.skip?.clipping.risk) : null;
    return { id: s.id, readiness: ready, beforeMatches: checks(b), afterMatches: checks(a),
      afterActivation: reached(a) ? a.trials.every(t => t.checks.activationFocusTarget && t.checks.activationHash) : null,
      beforeClippingRisk, afterClippingRisk, pairedTrials,
      geometryNavigationUnchanged: pairedTrials.length ? pairedTrials.every(t => Object.values(t.checks).every(Boolean)) : null,
      status: !ready || !reached(b) || !reached(a) ? 'not-tested/inconclusive: if skip is unreachable, investigate browser link-navigation preference' : !checks(a) ? 'residual measured mismatch' :
        beforeClippingRisk && !afterClippingRisk ? 'full-ring bounds corrected; configured outline retained; paint review pending' : checks(b) ? 'color mismatch not reproduced' :
        a.trials.some(t => t.skip?.clipping.risk) ? 'configured outline corrected; full-ring bounds expectation unmet; paint review pending' : 'configured outline corrected; paint review pending',
      paintJudgment: 'inconclusive pending visual review',
      screenshots: { before: b?.trials?.[0]?.skip?.screenshot || null, after: a?.trials?.[0]?.skip?.screenshot || null },
    };
  });
  const after = results.sides.after?.scenarios || [];
  results.unexpected = after.reduce((n, s) => n + (s.trials || []).reduce((m, t) => m + Object.values(t.checks).filter(v => !v).length, 0), 0);
  results.layoutRegressions = results.comparisons.flatMap(c => c.pairedTrials.flatMap(t =>
    Object.entries(t.checks).filter(([, passes]) => !passes).map(([check]) => ({ scenario: c.id, trial: t.trial, check }))));
  results.unexpected += results.layoutRegressions.length;
  // Regressions are evaluated against equivalent baseline states, not all pre-existing axe findings.
  results.axeRegressions = [];
  for (const a of after) {
    const b = results.sides.before?.scenarios.find(s => s.id === a.id);
    for (const stage of ['before', 'skip', 'activated', 'control']) {
      const beforeRules = b?.trials?.[0]?.[stage]?.axe?.rules, afterRules = a.trials?.[0]?.[stage]?.axe?.rules;
      if (!beforeRules || !afterRules) continue;
      for (const [rule, count] of Object.entries(afterRules)) if (count > (beforeRules[rule] || 0))
        results.axeRegressions.push({ scenario: a.id, stage, rule, before: beforeRules[rule] || 0, after: count });
    }
    const prior = new Set(b?.jsErrors || []);
    results.unexpected += (a.jsErrors || []).filter(e => !prior.has(e)).length;
  }
  results.unexpected += results.axeRegressions.length;
  const allReady = results.comparisons.every(c => c.readiness && c.beforeMatches !== null && c.afterMatches !== null);
  const colorCorrected = results.comparisons.every(c => c.afterMatches);
  results.verdict = results.infrastructureErrors.length || !allReady ? 'mixed' : results.unexpected ? (colorCorrected ? 'mixed' : 'reproduced-not-fixed') :
    results.comparisons.some(c => !c.beforeMatches || c.beforeClippingRisk && !c.afterClippingRisk) ? 'reproduced-and-fixed' : 'not-reproduced';
  // Keep the run schema honest: never manufacture a side when opening a site failed.
  if (results.sides.before && results.sides.after) console.log(writeRun(run, results, summarize(results)));
  else {
    json(run, 'infrastructure-error.json', results);
    console.error('Incomplete infrastructure run; no schema-valid comparison claimed.');
  }
  if (!allReady) console.error('Incomplete comparison: an option or keyboard-reached state was unavailable; inspect the per-scenario results.');
  process.exitCode = results.infrastructureErrors.length || !allReady ? 2 : results.unexpected ? 1 : 0;
}

main().catch(error => { console.error(`Infrastructure error: ${cleanError(error)}`); process.exitCode = 2; });
