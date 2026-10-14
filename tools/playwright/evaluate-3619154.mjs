// #3619154 / MR !16911: exercise the Default Admin sidebar toggle, Before and After.
//   node tools/playwright/evaluate-3619154.mjs [slug]        (default 3619154-pinned)
// On the node edit form it records, for each side:
//   - the toggle and close control: tag, role, aria-controls, aria-expanded,
//   - whether a mouse click toggles the sidebar and flips aria-expanded,
//   - whether the keyboard activates it: Enter and (the telling one) Space,
//   - whether the close button is the first focusable element in the sidebar (focus order),
//   - screenshots of the expanded and collapsed states.
// Output: reports/issues/3619154/playwright/<timestamp>-evaluate/ (SUMMARY.md, results.json, *.png)
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { chromium } from '@playwright/test';
import { labRoot, variants, envInfo, loginPath } from '../compare/lib.mjs';

const slug = process.argv.slice(2).find((a) => !a.startsWith('--')) || '3619154-pinned';
const v = variants().find((x) => x.slug === slug);
if (!v) { console.error(`no such variant: ${slug}`); process.exit(2); }
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const out = path.join(labRoot, 'reports/issues', v.issue, 'playwright', `${stamp}-evaluate`);
fs.mkdirSync(out, { recursive: true });
const shortHost = (env) => envInfo(env).hosts.slice().sort((a, b) => a.length - b.length)[0];
const commit = (env) => { try { return execFileSync('git', ['-C', path.join(labRoot, 'envs', env), 'rev-parse', '--short', 'HEAD'], { encoding: 'utf8' }).trim(); } catch { return 'unknown'; } };
const SIDES = { before: v.before.env, after: v.after.env };

// Serialised into the browser: read the toggle, the close control, and whether the sidebar is shown.
const measure = () => {
  const t = document.querySelector('.meta-sidebar__trigger');
  const c = document.querySelector('.meta-sidebar__close');
  const sbId = t && t.getAttribute('aria-controls');
  const sb = sbId ? document.getElementById(sbId) : null;
  const visible = (el) => !!el && !!el.offsetParent && getComputedStyle(el).visibility !== 'hidden';
  // First focusable element inside the sidebar (focus order check).
  let firstFocusable = null;
  if (sb) {
    const f = sb.querySelector('a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (f) firstFocusable = (f.className || f.tagName).toString().split(' ')[0];
  }
  const desc = (el) => el ? { tag: el.tagName.toLowerCase(), role: el.getAttribute('role'), ariaControls: el.getAttribute('aria-controls'), ariaExpanded: el.getAttribute('aria-expanded') } : null;
  return { toggle: desc(t), close: desc(c), sidebarVisible: visible(sb), firstFocusableInSidebar: firstFocusable };
};

const browser = await chromium.launch();
const results = {};
for (const [side, env] of Object.entries(SIDES)) {
  const base = `https://${shortHost(env)}`;
  const ctx = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  await page.goto(base + loginPath(env), { waitUntil: 'networkidle' });
  await page.goto(base + '/node/1/edit', { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  const toggle = page.locator('.meta-sidebar__trigger').first();

  const data = { env, commit: commit(env), initial: await page.evaluate(measure) };
  await page.screenshot({ path: path.join(out, `${side}-1-initial.png`), fullPage: false });

  // Mouse click toggles the sidebar.
  if (await toggle.count()) { await toggle.click({ trial: false }); await page.waitForTimeout(600); }
  data.afterMouseClick = await page.evaluate(measure);
  await page.screenshot({ path: path.join(out, `${side}-2-after-click.png`), fullPage: false });

  // Restore, then keyboard: focus the toggle and press Enter.
  if (await toggle.count()) { await toggle.click(); await page.waitForTimeout(500); }           // back to initial
  if (await toggle.count()) { await toggle.focus(); await page.keyboard.press('Enter'); await page.waitForTimeout(500); }
  data.afterEnter = await page.evaluate(measure);

  // Restore, then press Space (anchors do NOT activate on Space; real buttons do).
  if (await toggle.count()) { await toggle.click(); await page.waitForTimeout(500); }           // back to initial
  if (await toggle.count()) { await toggle.focus(); await page.keyboard.press('Space'); await page.waitForTimeout(500); }
  data.afterSpace = await page.evaluate(measure);

  results[side] = data;
  await ctx.close();
}
await browser.close();
fs.writeFileSync(path.join(out, 'results.json'), JSON.stringify(results, null, 2) + '\n');

const row = (label, pick) => `| ${label} | ${pick(results.before)} | ${pick(results.after)} |`;
const t = (d) => d.initial.toggle;
const flipped = (d, state) => (d.initial.toggle && d[state].toggle) ? `${d.initial.toggle.ariaExpanded} → ${d[state].toggle.ariaExpanded}` : 'n/a';
const vis = (d, state) => `${d.initial.sidebarVisible} → ${d[state].sidebarVisible}`;
const md = `# #3619154 / MR !16911 evaluate — ${slug}

Generated ${new Date().toISOString()}.
Before: \`${results.before.env}\` @ ${results.before.commit}  ·  After: \`${results.after.env}\` @ ${results.after.commit}
Page: /node/1/edit (Default Admin). Logged in as user 1. Viewport 1280×900.

## Sidebar toggle control
${row('Element', (d) => t(d) ? `\`<${t(d).tag}${t(d).role ? ` role=${t(d).role}` : ''}>\`` : '—')}
${row('aria-controls', (d) => t(d)?.ariaControls || '—')}
${row('aria-expanded (initial)', (d) => t(d)?.ariaExpanded ?? '— (absent)')}

## Does it toggle? (aria-expanded, and sidebar visibility)
${row('Mouse click — aria-expanded', (d) => flipped(d, 'afterMouseClick'))}
${row('Mouse click — sidebar shown', (d) => vis(d, 'afterMouseClick'))}
${row('Keyboard Enter — aria-expanded', (d) => flipped(d, 'afterEnter'))}
${row('Keyboard **Space** — aria-expanded', (d) => flipped(d, 'afterSpace'))}

## Focus order
${row('Close control', (d) => d.initial.close ? `\`<${d.initial.close.tag}${d.initial.close.role ? ` role=${d.initial.close.role}` : ''}>\`` : '—')}
${row('First focusable in sidebar', (d) => d.initial.firstFocusableInSidebar || '—')}

## Screenshots
- {before,after}-1-initial.png — sidebar in its initial state
- {before,after}-2-after-click.png — after activating the toggle

## Notes
- The telling keyboard row is **Space**: a native \`<button>\` activates on Space, an \`<a role="button">\` does not. Compare the Before/After Space rows.
- aria-expanded absent in Before means assistive tech cannot tell whether the sidebar is open.
`;
fs.writeFileSync(path.join(out, 'SUMMARY.md'), md);
console.log(`Wrote ${path.relative(labRoot, out)}/`);
console.log(md);
