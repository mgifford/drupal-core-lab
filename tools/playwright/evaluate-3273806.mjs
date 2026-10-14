// #3273806: capture the real Toolbar orientation toggle icon, Before and After.
//   node tools/playwright/evaluate-3273806.mjs [slug]        (default 3273806-latest)
// Logs in, opens an admin page with the Toolbar, makes the orientation toggle visible,
// and records for each side:
//   - the toggle's ::before background-image icon colour (bebebe vs 787878),
//   - the toggle's :focus-visible outline (keyboard focus), via getComputedStyle after focusing,
//   - screenshots of the toolbar and of the focused toggle.
// Output: reports/issues/3273806/playwright/<timestamp>-evaluate/ (SUMMARY.md, results.json, *.png)
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { chromium } from '@playwright/test';
import { labRoot, variants, envInfo, loginPath } from '../compare/lib.mjs';

const slug = process.argv.slice(2).find((a) => !a.startsWith('--')) || '3273806-latest';
const v = variants().find((x) => x.slug === slug);
if (!v) { console.error(`no such variant: ${slug}`); process.exit(2); }
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const out = path.join(labRoot, 'reports/issues', v.issue, 'playwright', `${stamp}-evaluate`);
fs.mkdirSync(out, { recursive: true });
const shortHost = (env) => envInfo(env).hosts.slice().sort((a, b) => a.length - b.length)[0];
const commit = (env) => { try { return execFileSync('git', ['-C', path.join(labRoot, 'envs', env), 'rev-parse', '--short', 'HEAD'], { encoding: 'utf8' }).trim(); } catch { return 'unknown'; } };
const SIDES = { before: v.before.env, after: v.after.env };

// Read the orientation toggle's icon colour and (when focused) its outline.
const measure = () => {
  const btn = document.querySelector('.toolbar-toggle-orientation button');
  if (!btn) return { found: false };
  const before = getComputedStyle(btn, '::before');
  const img = before.backgroundImage || '';
  const m = img.match(/%23([0-9a-fA-F]{6})/) || img.match(/#([0-9a-fA-F]{6})/);
  const o = getComputedStyle(btn);
  return {
    found: true,
    iconColor: m ? '#' + m[1].toLowerCase() : null,
    focusOutlineStyle: o.outlineStyle,
    focusOutlineWidth: o.outlineWidth,
    focusOutlineColor: o.outlineColor,
  };
};

const browser = await chromium.launch();
const results = {};
for (const [side, env] of Object.entries(SIDES)) {
  const base = `https://${shortHost(env)}`;
  const ctx = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.goto(base + loginPath(env), { waitUntil: 'networkidle' });
  await page.goto(base + '/admin/content', { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);

  // Open the management tray so the orientation toggle is shown.
  const manage = page.locator('#toolbar-item-administration, .toolbar-tab a.toolbar-icon-menu, .toolbar-menu-administration > .toolbar-toggle').first();
  if (await manage.count()) { try { await manage.click(); await page.waitForTimeout(800); } catch { /* may already be open */ } }

  const toggle = page.locator('.toolbar-toggle-orientation button').first();
  const data = { env, commit: commit(env) };
  if (await toggle.count()) {
    data.rest = await page.evaluate(measure);
    await page.screenshot({ path: path.join(out, `${side}-toolbar.png`) });
    try { await toggle.scrollIntoViewIfNeeded(); await toggle.screenshot({ path: path.join(out, `${side}-toggle-rest.png`) }); } catch { /* not visible */ }
    // Force :focus-visible via CDP so the computed outline reflects the rule
    // deterministically (programmatic .focus() does not trigger :focus-visible,
    // and the toggle is not in the normal Tab order). This shows the ring a
    // keyboard user sees.
    try {
      const client = await page.context().newCDPSession(page);
      await client.send('DOM.enable');
      await client.send('CSS.enable');
      const doc = await client.send('DOM.getDocument', { depth: -1 });
      const q = await client.send('DOM.querySelector', { nodeId: doc.root.nodeId, selector: '.toolbar-toggle-orientation button' });
      if (q.nodeId) {
        await client.send('CSS.forcePseudoState', { nodeId: q.nodeId, forcedPseudoClasses: ['focus', 'focus-visible'] });
        await page.waitForTimeout(150);
        data.focused = await page.evaluate(measure);
        try { await toggle.screenshot({ path: path.join(out, `${side}-toggle-focus.png`) }); } catch { /* not visible */ }
        await client.send('CSS.forcePseudoState', { nodeId: q.nodeId, forcedPseudoClasses: [] });
      }
    } catch (e) { data.focusError = String(e.message).split('\n')[0]; }
  } else {
    data.rest = { found: false };
  }
  results[side] = data;
  await ctx.close();
}
await browser.close();
fs.writeFileSync(path.join(out, 'results.json'), JSON.stringify(results, null, 2) + '\n');

const b = results.before, a = results.after;
const ring = (d) => d.focused && d.focused.focusOutlineStyle && d.focused.focusOutlineStyle !== 'none'
  ? `${d.focused.focusOutlineWidth} ${d.focused.focusOutlineStyle} ${d.focused.focusOutlineColor}` : 'none';
const md = `# #3273806 evaluate (live Toolbar) — ${slug}

Generated ${new Date().toISOString()}.
Before: \`${b.env}\` @ ${b.commit}  ·  After: \`${a.env}\` @ ${a.commit}
Page: /admin/content, Toolbar management tray open. Viewport 1280.

## Orientation toggle icon

| | Before | After |
|---|---|---|
| Toggle found | ${b.rest?.found} | ${a.rest?.found} |
| Rest icon colour | ${b.rest?.iconColor || '—'} | ${a.rest?.iconColor || '—'} |
| Focus outline (keyboard) | ${ring(b)} | ${ring(a)} |

## Screenshots
- {before,after}-toolbar.png — the toolbar with the management tray open
- {before,after}-toggle-rest.png — the orientation toggle icon at rest
- {before,after}-toggle-focus.png — the orientation toggle with keyboard focus

## Reading
- Before: rest icon should be \`#bebebe\` (1.7:1, fails WCAG 1.4.11) and no focus outline.
- After: rest icon should be \`#787878\` (4.05:1, passes) and a visible \`:focus-visible\` outline.
`;
fs.writeFileSync(path.join(out, 'SUMMARY.md'), md);
console.log(`Wrote ${path.relative(labRoot, out)}/`);
console.log(md);
