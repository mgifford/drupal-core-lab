// Scripted walkthrough of a comparison against both sites, with trusted (real) input.
//   node tools/playwright/walkthrough.mjs [slug]
// For each side it: logs in with a one-time link, follows the issue's steps (once with the mouse,
// once with the keyboard only), runs axe-core at the key moments, records the page state and the
// accessibility tree of the field that should receive focus, and saves screenshots. Output goes to
// reports/issues/<nid>/playwright/<timestamp>/ (SUMMARY.md, results.json, *.png).
// Specific to #3619127 (the selectors below); copy and adapt it for another variant.
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { labRoot, variants, envInfo, loginPath } from '../compare/lib.mjs';
import { setup } from './flow.mjs';

const v = variants().find((x) => x.slug === (process.argv[2] || variants()[0].slug));
if (!v) { console.error('unknown variant'); process.exit(1); }
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const out = path.join(labRoot, 'reports/issues', v.issue, 'playwright', stamp);
fs.mkdirSync(out, { recursive: true });
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];
const VIEWPORT = { width: 480, height: 900 }; // below 1024, so the sidebar of advanced fields is collapsed

async function axeScan(page) {
  const r = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  return { total: r.violations.reduce((n, x) => n + x.nodes.length, 0), rules: Object.fromEntries(r.violations.map((x) => [x.id, x.nodes.length])) };
}
const pageState = (page) => page.evaluate(() => {
  const f = document.querySelector('[name="path[0][alias]"]');
  const a = document.activeElement;
  const r = f && f.getBoundingClientRect();
  return {
    sidebarOpen: document.body.getAttribute('data-meta-sidebar') === 'open',
    aliasFieldFocused: !!a && a.name === 'path[0][alias]',
    aliasFieldInViewport: !!r && r.width > 0 && r.left >= 0 && r.right <= innerWidth && r.top >= 0 && r.bottom <= innerHeight,
    savedMobilePreference: localStorage.getItem('Drupal.defaultAdmin.sidebarExpanded.mobile'),
    focused: a ? `${a.tagName.toLowerCase()}${a.name ? `[name=${a.name}]` : ''}` : 'none',
  };
});

async function runSide(browser, side) {
  const spec = v[side]; const info = envInfo(spec.env);
  const host = info.hosts.slice().sort((a, b) => a.length - b.length)[0];
  const base = `http://${host}`;
  const results = { side, env: spec.env, host, runs: {} };
  for (const mode of ['mouse', 'keyboard']) {
    const ctx = await browser.newContext({ viewport: VIEWPORT });
    const page = await ctx.newPage();
    const errors = []; page.on('pageerror', (e) => errors.push(String(e.message)));
    await page.goto(base + loginPath(spec.env));                          // one-time login link
    const link = await setup(page, base);
    const beforeUse = { state: await pageState(page), axe: await axeScan(page) };
    await page.screenshot({ path: path.join(out, `${side}-${mode}-1-error-state.png`) });
    if (mode === 'mouse') await link.click(); else { await link.focus(); await page.keyboard.press('Enter'); }  // 10 use the error link
    await page.waitForTimeout(1200);                                       // the form script focuses the field after 300 ms
    const state = await pageState(page);
    const axe = await axeScan(page);
    let tree = '';
    try { tree = await page.locator('[name="path[0][alias]"]').ariaSnapshot(); } catch (e) { tree = `(not available: ${e.message})`; }
    await page.screenshot({ path: path.join(out, `${side}-${mode}-2-after-link.png`) });
    results.runs[mode] = { beforeUse, afterLink: { state, axe }, fieldAccessibilityTree: tree, jsErrors: errors.filter((m) => !/ResizeObserver loop/.test(m)) };
    await ctx.close();
  }
  return results;
}

const browser = await chromium.launch();
const results = { variant: v.slug, issue: v.issue, when: new Date().toISOString(), viewport: VIEWPORT, sides: {} };
for (const side of ['before', 'after']) { console.log(`running ${side} (${v[side].env}) ...`); results.sides[side] = await runSide(browser, side); }
await browser.close();
fs.writeFileSync(path.join(out, 'results.json'), JSON.stringify(results, null, 2));

// ---- summary: the old version should fail the fix checks, the new one should pass; nothing else should change
const ok = (b) => (b ? '✓ yes' : '✗ no');
let md = `# Playwright walkthrough: #${v.issue} (${v.slug})\n\nRun ${results.when}. Viewport ${VIEWPORT.width}x${VIEWPORT.height}. Trusted input (Playwright clicks and key presses), axe-core WCAG 2.0 to 2.2 A/AA.\n\nRule: **fix** checks should fail on Before and pass on After; **regression** checks should be equal.\n\n`;
let unexpected = 0;
for (const mode of ['mouse', 'keyboard']) {
  const B = results.sides.before.runs[mode], A = results.sides.after.runs[mode];
  const rows = [
    ['fix', 'Sidebar opens after using the error link', B.afterLink.state.sidebarOpen, A.afterLink.state.sidebarOpen],
    ['fix', 'URL alias field receives focus', B.afterLink.state.aliasFieldFocused, A.afterLink.state.aliasFieldFocused],
    ['fix', 'URL alias field is in the viewport', B.afterLink.state.aliasFieldInViewport, A.afterLink.state.aliasFieldInViewport],
  ];
  const reg = [
    ['regression', 'Saved sidebar preference unchanged (still \"false\")', B.afterLink.state.savedMobilePreference, A.afterLink.state.savedMobilePreference],
    ['regression', 'axe violations (elements) after using the link', B.afterLink.axe.total, A.afterLink.axe.total],
    ['regression', 'axe violations before using the link', B.beforeUse.axe.total, A.beforeUse.axe.total],
    ['regression', 'JavaScript errors', B.jsErrors.length, A.jsErrors.length],
  ];
  md += `## ${mode === 'mouse' ? 'Mouse' : 'Keyboard only (Tab/focus the link, press Enter)'}\n\n| Type | Check | Before | After | Verdict |\n|---|---|---|---|---|\n`;
  for (const [t, label, b, a] of rows) { const good = !b && a; if (!good) unexpected++; md += `| ${t} | ${label} | ${ok(b)} | ${ok(a)} | ${good ? '✓ as expected: fails before, passes after' : '✗ NOT as expected'} |\n`; }
  for (const [t, label, b, a] of reg) { const good = String(b) === String(a); if (!good) unexpected++; md += `| ${t} | ${label} | ${b} | ${a} | ${good ? '✓ unchanged' : '✗ differs'} |\n`; }
  md += `\nField as exposed to assistive technology after using the link (After):\n\n\`\`\`yaml\n${A.fieldAccessibilityTree}\n\`\`\`\n\nScreenshots: \`before-${mode}-2-after-link.png\`, \`after-${mode}-2-after-link.png\`.\n\n`;
}
md += `---\n**${unexpected === 0 ? '✓ All checks behave as expected' : `✗ ${unexpected} check(s) not as expected`}.** Automated results are a DRAFT: they do not replace a keyboard and screen-reader pass by a person.\n`;
fs.writeFileSync(path.join(out, 'SUMMARY.md'), md);
console.log(`\n${unexpected === 0 ? 'OK' : 'UNEXPECTED RESULTS'}: ${path.relative(labRoot, out)}/SUMMARY.md`);
process.exit(unexpected === 0 ? 0 : 2);
