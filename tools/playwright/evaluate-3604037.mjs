// #3604037: measure and photograph the "group contains an error" indicators, Before and After, in several modes.
//   node tools/playwright/evaluate-3604037.mjs [slug] [--modes=light,dark,farsi,light-zindex,dark-zindex,forced,forced-dark,forced-currentcolor,forced-preserve,forced-linktext,forced-dark-currentcolor,forced-dark-preserve,forced-dark-linktext,rtl,nojs]
// For each mode it reaches the error state on two pages (a details section; a vertical tab), then records:
//   - screenshots of the marked element (Before, After, and a side-by-side image),
//   - computed colours of the summary text, the error border, the error icon and the background behind them, as WCAG contrast ratios,
//   - whether the error indicators are present at all (a mask icon, a border, a data-child-error-count attribute).
// "farsi" = the real Farsi language at /fa (right to left; needs `scripts/lab-site.sh language <env> fa` on both sites).
// "forced" = Windows-style forced colours (light palette); "forced-dark" = the dark (black) high-contrast palette.
// "*-currentcolor", "*-preserve", "*-linktext" re-run on After with the icon's `canvasText` replaced by a proposal (see PROPOSALS below).
// Plain `background: currentColor` is NOT enough: forced colours overrides it, so the icon would vanish.
// Output: reports/issues/3604037/playwright/<timestamp>-evaluate/ (SUMMARY.md, results.json, *.png)
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from '@playwright/test';
import { labRoot, variants, envInfo, loginPath } from '../compare/lib.mjs';

const argv = process.argv.slice(2);
const slug = argv.find((a) => !a.startsWith('--')) || '3604037-latest';
const MODES = (argv.find((a) => a.startsWith('--modes=')) || '--modes=light,dark,light-zindex,dark-zindex,forced,forced-dark,forced-currentcolor,forced-preserve,forced-linktext,forced-dark-currentcolor,forced-dark-preserve,forced-dark-linktext,rtl,nojs').split('=')[1].split(',');
const v = variants().find((x) => x.slug === slug);
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const out = path.join(labRoot, 'reports/issues', v.issue, 'playwright', `${stamp}-evaluate`);
fs.mkdirSync(out, { recursive: true });
const host = (env) => envInfo(env).hosts.slice().sort((a, b) => a.length - b.length)[0];
const SIDES = { before: v.before.env, after: v.after.env };

// ---- in-page helpers (serialised into the browser) ----
const pageFns = () => {
  const cv = document.createElement('canvas'); cv.width = cv.height = 1; const cx = cv.getContext('2d', { willReadFrequently: true });
  const rgba = (c) => { cx.clearRect(0, 0, 1, 1); cx.fillStyle = '#000'; cx.fillStyle = c; cx.fillRect(0, 0, 1, 1); const d = cx.getImageData(0, 0, 1, 1).data; return [d[0], d[1], d[2], d[3] / 255]; };
  const lum = ([r, g, b]) => { const f = (x) => { x /= 255; return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  const ratio = (a, b) => { const l1 = lum(a), l2 = lum(b); return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05); };
  const bgBehind = (el) => { const layers = []; let base = [255, 255, 255, 1];   // composite semi-transparent backgrounds over the first opaque one
    for (let e = el; e; e = e.parentElement) { const c = rgba(getComputedStyle(e).backgroundColor); if (c[3] > 0.95) { base = c; break; } if (c[3] > 0) layers.push(c); }
    return layers.reduceRight((under, c) => [0, 1, 2].map((i) => Math.round(c[i] * c[3] + under[i] * (1 - c[3]))).concat(1), base); };
  const hex = (c) => '#' + c.slice(0, 3).map((x) => x.toString(16).padStart(2, '0')).join('');
  window.__m = { rgba, ratio, bgBehind, hex };
};

const measure = (kind0) => {
  const kind = kind0 === 'accordion' || kind0 === 'tabsnarrow' ? 'details' : kind0;
  const { rgba, ratio, bgBehind, hex } = window.__m;
  const pick = (sel) => document.querySelector(sel);
  const row = (what, fg, bg, need) => ({ what, fg: hex(fg), bg: hex(bg), ratio: Math.round(ratio(fg, bg) * 100) / 100, need, pass: ratio(fg, bg) >= need });
  const rows = []; let found = false; const info = {};
  if (kind === 'details') {
    const d = pick('details.details.error');
    if (d) {
      found = true; const s = d.querySelector(':scope > .details__summary'); const lab = s.querySelector(':scope > span:first-child') || s;
      const bg = bgBehind(s); const cs = getComputedStyle(s);
      info.dataChildErrorCount = d.getAttribute('data-child-error-count'); info.open = d.open;
      info.summaryBackground = cs.backgroundColor; info.summaryColor = cs.color;
      rows.push(row('summary text (error colour) on its background', rgba(cs.color), bg, 4.5));
      const bb = getComputedStyle(d, '::before'); rows.push(row('left error bar vs background', rgba(bb.borderInlineStartColor), bgBehind(d), 3));
      const ic = getComputedStyle(lab, '::before'); rows.push(row('error icon vs background', rgba(ic.backgroundColor), bg, 3));
      info.iconMask = ic.maskImage !== 'none' && ic.maskImage !== '' ? 'present' : 'none'; info.barWidth = bb.borderInlineStartWidth;
      info.afterBorderLeft = getComputedStyle(s, '::after').borderLeftStyle;
      if (document.activeElement === s) { const o = getComputedStyle(s); info.focusOutline = `${o.outlineStyle} ${o.outlineWidth} ${o.outlineColor}`; if (o.outlineStyle !== 'none') rows.push(row('focus outline vs background', rgba(o.outlineColor), bg, 3)); else rows.push({ what: 'focus outline', fg: '-', bg: '-', ratio: 0, need: 3, pass: false, note: 'no outline on the focused summary' }); }
    }
  } else {
    const mi = pick('.vertical-tabs__menu-item.error');
    if (mi) {
      found = true; const link = mi.querySelector('.vertical-tabs__menu-link'); const title = mi.querySelector('.vertical-tabs__menu-item-title');
      const bg = bgBehind(link); const cs = getComputedStyle(link);
      info.menuItemColor = cs.color;
      rows.push(row('tab label (error colour) on its background', rgba(cs.color), bg, 4.5));
      const lb = getComputedStyle(link, '::before'); rows.push(row('tab error bar vs background', rgba(lb.borderInlineStartColor), bg, 3));
      const ic = getComputedStyle(title, '::before'); rows.push(row('tab error icon vs background', rgba(ic.backgroundColor), bg, 3));
      info.barWidth = lb.borderInlineStartWidth; info.iconMask = ic.maskImage !== 'none' ? 'present' : 'none';
      if (document.activeElement === link) { const o = getComputedStyle(link); info.focusOutline = `${o.outlineStyle} ${o.outlineWidth} ${o.outlineColor}`; if (o.outlineStyle !== 'none') rows.push(row('focus outline vs background', rgba(o.outlineColor), bg, 3)); else rows.push({ what: 'focus outline', fg: '-', bg: '-', ratio: 0, need: 3, pass: false, note: 'no outline on the focused tab' }); }
    }
  }
  info.dir = document.documentElement.dir || 'ltr'; info.darkClass = document.documentElement.classList.contains('dark-mode'); info.forced = matchMedia('(forced-colors: active)').matches;
  return { found, rows, info };
};

// ---- reaching the error states ----
async function reach(page, base, kind) {
  if (kind === 'details') {
    await page.goto(base + '/form_test/details-contains-required-fields'); await page.waitForTimeout(800);
    await page.locator('#edit-submit, form [type=submit]').first().click(); await page.waitForTimeout(1000);
    const s = page.locator('details.details > summary').first();
    if (await page.locator('details.details[open]').first().count()) await s.click();       // close the first section so the indicator is the only signal
    await page.waitForTimeout(400);
    return page.locator('details.details.error, details.details').first();
  }
  if (kind === 'accordion') {
    // The node form's sidebar sections are accordion-style details (the same URL alias section as #3619127).
    await page.goto(base + '/node/add/article'); await page.waitForTimeout(1500);
    const sum = page.locator('details.details:has([name="path[0][alias]"]) > summary').first();
    await sum.click(); await page.locator('[name="path[0][alias]"]').fill('no-slash'); await sum.click();      // an invalid alias, section closed again
    await page.locator('#edit-submit, [data-drupal-selector="edit-submit"]').first().click(); await page.waitForTimeout(1500);
    return page.locator('details.details.error').first();
  }
  if (kind === 'tabsnarrow') {
    await page.goto(base + '/admin/config/people/accounts'); await page.waitForTimeout(1000);
    await page.evaluate(() => { const i = document.querySelector('.vertical-tabs__items input[required]'); if (i) i.value = ''; });
    await page.locator('#edit-submit').click(); await page.waitForTimeout(1500);
    return page.locator('.vertical-tabs__items').first();
  }
  await page.goto(base + '/admin/config/people/accounts'); await page.waitForTimeout(1000);
  const req = page.locator('.vertical-tabs__pane:visible input[required], .vertical-tabs__pane:visible textarea[required]').first();
  await req.fill(''); await page.locator('#edit-submit').click(); await page.waitForTimeout(1200);
  await page.locator('.vertical-tabs__menu-link').first().click(); await page.waitForTimeout(400);       // look at a different tab
  return page.locator('.vertical-tabs__menu-item.error, .vertical-tabs__menu').first();
}

// The element each state is applied to, and how to put the page in that state (hover with the mouse; focus from the keyboard, so :focus-visible applies).
// The marked section (or its plain equivalent on Before). The accordion case is the node form's URL alias section on both sides.
const sectionSel = (kind) => ({ details: ['details.details.error', 'details.details'], accordion: ['details.details.error', 'details.details:has([name="path[0][alias]"])'], tabsnarrow: ['.vertical-tabs__items details.details.error', '.vertical-tabs__items details.details'], tabs: ['.vertical-tabs__menu-item.error', '.vertical-tabs__menu-item'] }[kind]);
const pickLoc = async (page, kind, inner = '') => { const [err, plain] = sectionSel(kind); const l = page.locator(err + inner); return (await l.count()) ? l.first() : page.locator(plain + inner).first(); };
const summaryOf = (kind) => (kind === 'tabs' ? ' .vertical-tabs__menu-link' : ' > .details__summary');
async function putInState(page, kind, state) {
  await page.mouse.move(0, 0); await page.keyboard.press('Escape'); await page.evaluate(() => document.activeElement && document.activeElement.blur());
  const t = await pickLoc(page, kind, summaryOf(kind));
  if (state === 'hover') await t.hover(); else if (state === 'focus') { await t.focus(); }
  await page.waitForTimeout(250);
}
const STATES = ['rest', 'hover', 'focus'];
// Proposals for the forced-colours icon, applied to After by rewriting the CSS in the browser (no environment is changed).
const forcedRewrite = (v) => (css) => css.replace(/background:\s*canvastext\s*;?/gi, v);
const PROPOSALS = {
  currentcolor: { text: 'background: currentColor; forced-color-adjust: none;', rewrite: forcedRewrite('background: currentColor; forced-color-adjust: none;') },
  preserve: { text: 'background: currentColor; forced-color-adjust: preserve-parent-color;', rewrite: forcedRewrite('background: currentColor; forced-color-adjust: preserve-parent-color;') },
  linktext: { text: 'background: LinkText;', rewrite: forcedRewrite('background: LinkText;') },
  // Keep each summary's normal background; instead lift the error bar above it.
  zindex: { text: "drop 'background: transparent' and set .details.error::before { z-index: 1; pointer-events: none }", rewrite: (css) => css.replace(/\/\*\s*Don't obscure error border\.\s*\*\/\s*background:\s*transparent;?/g, '') + '\n.details.error::before { z-index: 1; pointer-events: none; }\n' },
};
const proposalOf = (m) => Object.keys(PROPOSALS).find((k) => m.endsWith('-' + k));
const KINDS = ['details', 'tabs', 'accordion', 'tabsnarrow'];
const baseMode = (m) => (proposalOf(m) ? m.slice(0, -(proposalOf(m).length + 1)) : m);
const results = { variant: slug, when: new Date().toISOString(), modes: {} };
const browser = await chromium.launch();
for (const mode of MODES) {
  results.modes[mode] = {};
  const sides = proposalOf(mode) ? ['after'] : ['before', 'after'];
  for (const side of sides) {
    const env = SIDES[side]; const base = `https://${host(env)}`;
    const ctx = await browser.newContext({ viewport: { width: 1000, height: 900 }, ignoreHTTPSErrors: true, javaScriptEnabled: mode !== 'nojs',
      colorScheme: baseMode(mode) === 'dark' || mode.includes('forced-dark') ? 'dark' : 'light', forcedColors: mode.startsWith('forced') ? 'active' : 'none' });
    if (proposalOf(mode)) await ctx.route(/\.css(\?|$)/, async (route) => { const r = await route.fetch(); const body = PROPOSALS[proposalOf(mode)].rewrite(await r.text()); await route.fulfill({ response: r, body }); });
    const page = await ctx.newPage();
    await page.goto(base + loginPath(env));
    for (const kind of KINDS) {
      await page.setViewportSize(kind === 'accordion' ? { width: 1400, height: 1000 } : kind === 'tabsnarrow' ? { width: 480, height: 1000 } : { width: 1000, height: 900 });
      const key = `${side}-${kind}`; const entry = (results.modes[mode][key] = {});
      try {
        if (mode === 'nojs') {
          // Without JavaScript: submit the form natively and look at the server-rendered result.
          const url = kind === 'details' ? '/form_test/details-contains-required-fields' : kind === 'accordion' ? '/node/add/article' : '/admin/config/people/accounts';
          await page.goto(base + url); if (kind === 'details') await page.locator('#edit-submit, form [type=submit]').first().click(); await page.waitForTimeout(800);
          entry.noJsErrorMarkers = await page.evaluate(() => ({ detailsError: document.querySelectorAll('details.error').length, childErrorCount: [...document.querySelectorAll('[data-child-error-count]')].length, errorSummary: !!document.querySelector('[role=alert], .messages--error') }));
          await page.screenshot({ path: path.join(out, `${mode}-${key}.png`), fullPage: false }); continue;
        }
        const target = await reach(page, mode === 'farsi' ? base + '/fa' : base, kind);
        await page.evaluate(pageFns); if (baseMode(mode) === 'dark' && !(await page.evaluate(() => document.documentElement.classList.contains('dark-mode')))) await page.evaluate(() => document.documentElement.classList.add('dark-mode'));
        if (mode === 'rtl') { await page.evaluate(() => { document.documentElement.dir = 'rtl'; }); await page.waitForTimeout(300); }
        const box = kind === 'tabs' ? page.locator('.vertical-tabs').first() : kind === 'tabsnarrow' ? page.locator('.vertical-tabs__items').first() : await pickLoc(page, kind);
        for (const state of (['light', 'dark', 'forced', 'forced-dark', 'light-zindex', 'dark-zindex'].includes(mode) ? STATES : ['rest'])) {
          await putInState(page, kind, state);
          const e = (state === 'rest' ? entry : (results.modes[mode][`${key}-${state}`] = {}));
          Object.assign(e, await page.evaluate(measure, kind)); e.state = state;
          e.plainSummaryBg = await page.evaluate(() => { const x = document.querySelector('details.details:not(.error) > .details__summary'); return x ? getComputedStyle(x).backgroundColor : null; });
          await box.screenshot({ path: path.join(out, `${mode}-${key}${state === 'rest' ? '' : '-' + state}.png`) });
        }
      } catch (e) { entry.error = String(e.message).split('\n')[0]; }
    }
    await ctx.close();
  }
}
await browser.close();

// ---- side-by-side images (Before | After [| After with proposal]) ----
const b2 = await chromium.launch(); const ctxI = await b2.newContext({ viewport: { width: 1600, height: 900 } }); const pgI = await ctxI.newPage();
for (const mode of MODES) for (const kind of KINDS) for (const st of ['', '-hover', '-focus']) {
  const files = ['before', 'after'].map((s) => `${mode}-${s}-${kind}${st}.png`).filter((f) => fs.existsSync(path.join(out, f)));
  if (proposalOf(mode)) { const prev = `${baseMode(mode)}-after-${kind}${st}.png`; if (fs.existsSync(path.join(out, prev))) files.unshift(prev); }
  if (files.length < 1) continue;
  const label = (f) => (proposalOf(mode) && !f.startsWith(mode) ? 'After (as in the MR)' : f.includes('-before-') ? 'Before' : proposalOf(mode) ? `After with proposal: ${PROPOSALS[proposalOf(mode)].text}` : 'After');
  const html = `<body style="margin:0;font:14px system-ui;background:#fff;display:flex;gap:16px;padding:12px">${files.map((f) => `<figure style="margin:0"><figcaption><b>${label(f)}</b> (${mode}, ${kind}${st})</figcaption><img src="data:image/png;base64,${fs.readFileSync(path.join(out, f)).toString('base64')}" style="max-width:760px;border:1px solid #888"></figure>`).join('')}</body>`;
  await pgI.setContent(html); await pgI.screenshot({ path: path.join(out, `compare-${mode}-${kind}${st}.png`), fullPage: true });
}
await b2.close();
fs.writeFileSync(path.join(out, 'results.json'), JSON.stringify(results, null, 2));

// ---- summary ----
let md = `# #3604037 evaluation (${slug})\n\nRun ${results.when}. Before \`${v.before.env}\`, After \`${v.after.env}\` (the MR on current core). Automated measurements are a DRAFT: they do not replace a person's look in each mode.\n\n`;
for (const mode of MODES) {
  md += `## Mode: ${mode}\n\n`;
  for (const [key, e] of Object.entries(results.modes[mode])) {
    if (e.error) { md += `- **${key}**: could not measure (${e.error})\n`; continue; }
    if (e.noJsErrorMarkers) { md += `- **${key}** (JavaScript off): ${JSON.stringify(e.noJsErrorMarkers)}\n`; continue; }
    if (!e.found) { md += `- **${key}**: no "contains an error" marker found${key.startsWith('before') ? ' (expected on Before: the change is not there)' : ' (UNEXPECTED on After)'}\n`; continue; }
    md += `\n**${key}**: ${JSON.stringify(e.info)}\n\n| Check | Foreground | Background | Ratio | Needs | Result |\n|---|---|---|---|---|---|\n` + e.rows.map((r) => `| ${r.what} | ${r.fg} | ${r.bg} | ${r.ratio}:1 | ${r.need}:1 | ${r.pass ? '✓ pass' : '✗ FAIL'}${r.note ? ' (' + r.note + ')' : ''} |`).join('\n') + '\n\n';
  }
  md += `Images: \`compare-${mode}-details*.png\`, \`compare-${mode}-tabs*.png\` (\`-hover\` and \`-focus\` are the hover and keyboard-focus states)\n\n`;
}
fs.writeFileSync(path.join(out, 'SUMMARY.md'), md);
console.log(path.relative(labRoot, out) + '/SUMMARY.md');
