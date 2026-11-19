// #3636143: the circular expand/collapse toggle of the administration navigation: default, hover, keyboard focus, focus plus hover, keyboard
// activation and forced colours, Before and After, with the colours actually painted (not just token values).
//   node tools/playwright/evaluate-3636143.mjs [slug] [--browser=chromium] [--scheme=light|dark] [--forced-colors] [--viewport=1280x900]
//                                              [--rtl] [--reduced-motion] [--page=/admin/appearance/settings/default_admin] [--out=<dir>]
// Runs on lib/lab-run.mjs. Hover is a real pointer move; focus is reached by pressing Tab (never by forcing :focus-visible); activation is Enter, then Space.
// Contrast rows say what they are measured against: a design objective (the issue asks for 3:1 on the border) is not a WCAG verdict, and a
// passing axe-core scan does not say these visual states conform. Reduced motion only sets the preference; the change adds no animation.
// Not covered here (record as not tested): 200% browser zoom, real VoiceOver/NVDA, a person's keyboard pass.
import fs from 'node:fs';
import path from 'node:path';
import { runArgs, launch, openSide, axeScan, baseResults, writeRun, contextMarkdown } from './lib/lab-run.mjs';

const argv = process.argv.slice(2);
const opt = (n, d) => { const a = argv.find((x) => x.startsWith(`--${n}=`)); return a ? a.slice(n.length + 3) : d; };
const PAGE = opt('page', '/admin/appearance/settings/default_admin');
const TOGGLE = '.admin-toolbar__expand-button';
const run = runArgs({ slug: '3636143-latest' });
run.rtl = argv.includes('--rtl'); run.reducedMotion = argv.includes('--reduced-motion');

// Serialised into the page: effective colours and contrast.
const measure = (sel) => {
  const el = document.querySelector(sel); if (!el) return null;
  const cv = document.createElement('canvas'); cv.width = cv.height = 1; const cx = cv.getContext('2d', { willReadFrequently: true });
  const rgba = (c) => { cx.clearRect(0, 0, 1, 1); cx.fillStyle = '#000'; cx.fillStyle = c; cx.fillRect(0, 0, 1, 1); const d = cx.getImageData(0, 0, 1, 1).data; return [d[0], d[1], d[2], d[3] / 255]; };
  const lum = ([r, g, b]) => { const f = (x) => { x /= 255; return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  const ratio = (a, b) => Math.round(((Math.max(lum(a), lum(b)) + 0.05) / (Math.min(lum(a), lum(b)) + 0.05)) * 100) / 100;
  const over = (top, under) => [0, 1, 2].map((i) => Math.round(top[i] * top[3] + under[i] * (1 - top[3]))).concat(1);
  const bgBehind = (start) => { const layers = []; let base = [255, 255, 255, 1]; for (let e = start; e; e = e.parentElement) { const c = rgba(getComputedStyle(e).backgroundColor); if (c[3] > 0.95) { base = c; break; } if (c[3] > 0) layers.push(c); } return layers.reduceRight((u, c) => over(c, u), base); };
  const hex = (c) => '#' + c.slice(0, 3).map((x) => x.toString(16).padStart(2, '0')).join('');
  const cs = getComputedStyle(el), r = el.getBoundingClientRect();
  const outside = bgBehind(el.parentElement), inside = over(rgba(cs.backgroundColor), outside);
  const border = rgba(cs.borderTopColor), text = rgba(cs.color);
  const ring = cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0 ? rgba(cs.outlineColor) : null;
  const shadow = cs.boxShadow !== 'none' ? cs.boxShadow : null;
  // An outline is clipped when an ancestor that clips overflow ends before the outline's outer edge.
  const grow = ring ? parseFloat(cs.outlineOffset) + parseFloat(cs.outlineWidth) : 0;
  const box = { l: r.left - grow, t: r.top - grow, r: r.right + grow, b: r.bottom + grow };
  const clippers = []; for (let e = el.parentElement; e && e !== document.documentElement; e = e.parentElement) { const o = getComputedStyle(e); if (/(hidden|clip|auto|scroll)/.test(o.overflowX + o.overflowY)) { const q = e.getBoundingClientRect(); if (q.left > box.l + 0.5 || q.top > box.t + 0.5 || q.right < box.r - 0.5 || q.bottom < box.b - 0.5) clippers.push(e.className || e.tagName); } }
  const vp = { l: 0, t: 0, r: innerWidth, b: innerHeight }; const offscreen = box.l < vp.l || box.t < vp.t || box.r > vp.r || box.b > vp.b;
  return {
    focused: document.activeElement === el, expanded: el.getAttribute('aria-expanded'), size: `${Math.round(r.width * 100) / 100}x${Math.round(r.height * 100) / 100}`,
    rect: { x: Math.round(r.x), y: Math.round(r.y) }, borderColor: cs.borderTopColor, borderWidth: cs.borderTopWidth, background: cs.backgroundColor, color: cs.color,
    outline: ring ? `${cs.outlineStyle} ${cs.outlineWidth} ${cs.outlineColor} offset ${cs.outlineOffset}` : 'none', boxShadow: shadow, forcedColors: matchMedia('(forced-colors: active)').matches,
    colours: { outside: hex(outside), inside: hex(inside), border: hex(border), chevron: hex(text), ring: ring ? hex(ring) : null },
    contrast: {
      borderVsOutside: ratio(border, outside), borderVsInside: ratio(border, inside), chevronVsInside: ratio(text, inside),
      ringVsOutside: ring ? ratio(ring, outside) : null,
    },
    outlineClippedBy: ring ? clippers : [], outlineOutsideViewport: ring ? offscreen : null,
  };
};

const labelled = async (page, side, name, file) => {
  const text = `${side === 'before' ? 'BEFORE' : 'AFTER'} · ${run.v.slug} · ${name} · ${run.envTag}`;
  await page.evaluate((t) => { const d = document.createElement('div'); d.id = '__lab-label'; d.textContent = t; d.style.cssText = 'position:fixed;inset:4px auto auto 4px;z-index:2147483647;background:#fff;color:#000;border:1px solid #000;font:12px/1.2 monospace;padding:2px 4px;pointer-events:none'; document.body.append(d); }, text);
  const btn = await page.locator(TOGGLE).boundingBox();
  const full = path.join(run.out, `${side}-${file}.png`), crop = path.join(run.out, `${side}-${file}-closeup.png`);
  await page.screenshot({ path: full });
  if (btn) await page.screenshot({ path: crop, clip: { x: Math.max(0, btn.x - 40), y: Math.max(0, btn.y - 30), width: 140, height: btn.height + 60 } });
  await page.evaluate(() => document.getElementById('__lab-label')?.remove());
  return { full: path.basename(full), closeup: btn ? path.basename(crop) : null };
};

const tabTo = async (page) => { await page.evaluate(() => document.activeElement?.blur?.()); for (let i = 0; i < 120; i++) { await page.keyboard.press('Tab'); if (await page.evaluate((s) => document.activeElement === document.querySelector(s), TOGGLE)) return i + 1; } return 0; };

async function side(name) {
  const { page, rec } = await openSide(run, name);
  if (run.reducedMotion) await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(rec.host ? `https://${rec.host}${PAGE}` : PAGE); await page.waitForLoadState('load');
  if (run.rtl) await page.evaluate(() => { document.documentElement.dir = 'rtl'; });
  rec.states = []; rec.checks = {}; rec.notes = [];
  const t = page.locator(TOGGLE);
  if (!(await t.count()) || !(await t.isVisible())) { rec.notes.push(`The toggle is not displayed at ${run.viewport.width}px (responsive behaviour, not a failure).`); rec.toggleVisible = false; return rec; }
  rec.toggleVisible = true;
  const snap = async (state, hint) => { const m = await page.evaluate(measure, TOGGLE); const shots = await labelled(page, name, `${state}-${m.expanded === 'true' ? 'expanded' : 'collapsed'}`, `${state}-${m.expanded === 'true' ? 'expanded' : 'collapsed'}`); rec.states.push({ state, hint, ...m, shots }); return m; };
  const away = async () => { await page.mouse.move(run.viewport.width - 5, 5); };
  await away();
  await snap('default');
  await t.hover(); await snap('hover'); await away();
  const tabs = await tabTo(page); rec.checks.keyboardReachable = tabs > 0; rec.tabsToReach = tabs;
  await away(); await snap('focus', `after ${tabs} Tab presses`);
  await t.hover(); await snap('focus+hover'); await away();
  rec.axeFocused = await axeScan(page);
  // Keyboard activation: Enter collapses, Space expands; the toggle stays the active element.
  await page.keyboard.press('Enter'); await page.waitForTimeout(600);
  const afterEnter = await page.evaluate(measure, TOGGLE); rec.checks.enterCollapses = afterEnter.expanded === 'false'; rec.checks.focusKeptAfterEnter = afterEnter.focused;
  await snap('focus'); await t.hover(); await snap('focus+hover'); await away();
  await page.evaluate((s) => document.querySelector(s).blur(), TOGGLE); await snap('default'); await t.hover(); await snap('hover'); await away();
  rec.axeCollapsed = await axeScan(page);
  await page.evaluate((s) => document.querySelector(s).focus(), TOGGLE);   // Space needs the control focused; the state under test is the activation
  await page.keyboard.press('Space'); await page.waitForTimeout(600);
  const afterSpace = await page.evaluate(measure, TOGGLE); rec.checks.spaceExpands = afterSpace.expanded === 'true';
  rec.axeDefault = await axeScan(page);
  return rec;
}

const byState = (rec, state, expanded) => rec.states?.find((s) => s.state === state && s.expanded === expanded);
const emphasised = (rec, expanded) => { const d = byState(rec, 'default', expanded), h = byState(rec, 'hover', expanded), f = byState(rec, 'focus', expanded), fh = byState(rec, 'focus+hover', expanded); if (!d || !h || !f || !fh) return null;
  const hoverChanges = h.borderColor !== d.borderColor || h.boxShadow !== d.boxShadow || h.background !== d.background;
  return { hoverChangesCircle: hoverChanges, focusHasOutline: f.outline !== 'none', focusOutlineKeptOnHover: fh.outline !== 'none' && fh.outline === f.outline, sizeStable: [d, h, f, fh].every((s) => s.size === d.size) }; };

const summarize = (results) => {
  const rows = [];
  for (const name of ['before', 'after']) for (const s of results.sides[name].states || []) rows.push(`| ${name} | ${s.state} | ${s.expanded === 'true' ? 'expanded' : 'collapsed'} | ${s.borderColor} ${s.borderWidth} | ${s.boxShadow ? 'yes' : 'no'} | ${s.background} | ${s.outline} | ${s.contrast.borderVsOutside}:1 / ${s.contrast.borderVsInside}:1 | ${s.contrast.chevronVsInside}:1 | ${s.contrast.ringVsOutside == null ? '-' : s.contrast.ringVsOutside + ':1'} | ${s.outlineClippedBy.length ? 'clipped by ' + s.outlineClippedBy.join(', ') : s.outlineOutsideViewport ? 'outside viewport' : 'no'} | ${s.size} | [${s.shots.closeup || s.shots.full}](${s.shots.closeup || s.shots.full}) |`);
  let md = `# #3636143 navigation toggle evaluation (${results.variant}, ${results.environment.colorScheme}${results.environment.forcedColors ? ', forced colors' : ''}, ${results.environment.viewport.width}x${results.environment.viewport.height}${run.rtl ? ', RTL simulated by dir attribute' : ''}${run.reducedMotion ? ', reduced motion preference' : ''})\n\nDRAFT, AI-assisted; a person has not reviewed it. Verdict: ${results.verdict}; ${results.unexpected} After check(s) not met.\n\n`;
  md += `Real pointer hover, focus reached with Tab, Enter and Space for activation. Contrast is measured from rendered colours: the border against the background outside the circle and inside it (the hover background), the chevron against the inside, the focus outline against the outside. The border ratios are a **design objective** (the issue asks for 3:1); the chevron and focus outline ratios relate to WCAG 2.2 1.4.11 Non-text Contrast and 2.4.7 Focus Visible. Nothing here is a conformance claim, and axe-core results below do not establish conformance for these visual states. Box shadows are not reliable in forced colors.\n\n`;
  md += `Page: \`${PAGE}\`. Not covered by this run: 200% zoom, real screen readers, a person's keyboard pass.\n\n`;
  md += `| Side | State | Sidebar | Border | Shadow | Background | Outline | Border contrast (outside / inside) | Chevron | Outline contrast | Outline clipped | Size | Image |\n|---|---|---|---|---|---|---|---|---|---|---|---|---|\n${rows.join('\n')}\n\n`;
  md += `## Checks\n\n`;
  for (const name of ['before', 'after']) { const r = results.sides[name]; md += `- **${name}**: ${r.toggleVisible === false ? r.notes.join(' ') : `keyboard reachable: ${r.checks.keyboardReachable} (${r.tabsToReach} Tab); Enter collapses: ${r.checks.enterCollapses}; focus kept after Enter: ${r.checks.focusKeptAfterEnter}; Space expands: ${r.checks.spaceExpands}; emphasis (expanded): ${JSON.stringify(emphasised(r, 'true'))}; (collapsed): ${JSON.stringify(emphasised(r, 'false'))}`}\n`; }
  md += `\n## axe-core (WCAG 2.2 A/AA tags; Before → After violation counts)\n\n`;
  for (const k of ['axeFocused', 'axeCollapsed', 'axeDefault']) md += `- ${k}: ${results.sides.before[k]?.total ?? 'n/a'} → ${results.sides.after[k]?.total ?? 'n/a'}${results.axeRegressions.filter((x) => x.stage === k).length ? ` (new rules after: ${results.axeRegressions.filter((x) => x.stage === k).map((x) => x.rule).join(', ')})` : ''}\n`;
  return md + '\n' + contextMarkdown(results);
};

const { browser, environment } = await launch(run);
run.browser = browser;
const results = baseResults(run, { ...environment, direction: run.rtl ? 'rtl-simulation' : 'native', reducedMotion: run.reducedMotion, page: PAGE });
try {
  for (const name of ['before', 'after']) { const rec = await side(name); results.sides[name] = await rec.close(run.out); }
} finally { await browser.close(); }

const A = results.sides.after, B = results.sides.before;
const fails = [];
if (A.toggleVisible) {
  for (const [k, v] of Object.entries(A.checks)) if (!v) fails.push(`keyboard: ${k}`);
  for (const exp of ['true', 'false']) { const e = emphasised(A, exp); if (!e) { fails.push(`state missing (${exp})`); continue; } for (const [k, v] of Object.entries(e)) if (!v) fails.push(`${exp === 'true' ? 'expanded' : 'collapsed'}: ${k}`); }
  for (const s of A.states) if (s.outlineClippedBy.length || s.outlineOutsideViewport) fails.push(`${s.state}: focus outline clipped or outside viewport`);
  const sizes = new Set([...(A.states || []).map((s) => s.size), ...(B.states || []).map((s) => s.size)]); if (sizes.size > 1) fails.push(`toggle size differs between states or sides: ${[...sizes].join(', ')}`);
}
results.axeRegressions = [];
for (const k of ['axeFocused', 'axeCollapsed', 'axeDefault']) for (const [rule, n] of Object.entries(A[k]?.rules || {})) if (n > (B[k]?.rules?.[rule] || 0)) results.axeRegressions.push({ stage: k, rule, before: B[k]?.rules?.[rule] || 0, after: n });
results.unexpected = fails.length + results.axeRegressions.length; results.failures = fails;
const beforeWeak = B.toggleVisible ? !(emphasised(B, 'true')?.hoverChangesCircle && emphasised(B, 'true')?.focusHasOutline) : null;
results.verdict = !A.toggleVisible ? 'mixed' : results.unexpected ? (beforeWeak ? 'reproduced-not-fixed' : 'mixed') : beforeWeak ? 'reproduced-and-fixed' : 'not-reproduced';
console.log(writeRun(run, results, summarize(results)));
process.exitCode = results.unexpected ? 1 : 0;
