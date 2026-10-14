// #3618405: capture the views exposed filter form on /admin/content, Before and After.
//   node tools/playwright/evaluate-3618405.mjs [slug]        (default 3618405-pinned)
// For each side it logs in as user 1, opens /admin/content in the Default Admin theme, then records:
//   - whether the exposed filter form has a visible heading (tag, text, computed font-size),
//   - whether the form still carries an aria-label (the thing the MR removes),
//   - the page heading outline (h1..h6 in order), to show where the new h2 sits in the hierarchy,
//   - screenshots of the filter region and the full page, at a normal width and a zoomed-in (narrow) width.
// Output: reports/issues/3618405/playwright/<timestamp>-evaluate/ (SUMMARY.md, results.json, *.png)
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { chromium } from '@playwright/test';
import { labRoot, variants, envInfo, loginPath } from '../compare/lib.mjs';

const slug = process.argv.slice(2).find((a) => !a.startsWith('--')) || '3618405-pinned';
const v = variants().find((x) => x.slug === slug);
if (!v) { console.error(`no such variant: ${slug}`); process.exit(2); }
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const out = path.join(labRoot, 'reports/issues', v.issue, 'playwright', `${stamp}-evaluate`);
fs.mkdirSync(out, { recursive: true });
const shortHost = (env) => envInfo(env).hosts.slice().sort((a, b) => a.length - b.length)[0];
const SIDES = { before: v.before.env, after: v.after.env };

// Serialised into the browser: read the facts the issue is about.
const measure = () => {
  const form = document.querySelector('form.views-exposed-form') || document.querySelector('.views-exposed-form');
  const h2 = form ? form.querySelector('h2') : null;
  const root = getComputedStyle(document.documentElement);
  const outline = [...document.querySelectorAll('h1, h2, h3, h4, h5, h6')]
    .filter((h) => h.offsetParent !== null || getComputedStyle(h).position === 'fixed')
    .map((h) => ({ level: Number(h.tagName[1]), text: h.textContent.trim().replace(/\s+/g, ' ').slice(0, 60) }));
  return {
    formFound: !!form,
    ariaLabel: form ? form.getAttribute('aria-label') : null,
    headingTag: h2 ? h2.tagName.toLowerCase() : null,
    headingText: h2 ? h2.textContent.trim().replace(/\s+/g, ' ') : null,
    headingFontSize: h2 ? getComputedStyle(h2).fontSize : null,
    tokenH2: root.getPropertyValue('--admin-font-size-h2').trim() || null,
    tokenH3: root.getPropertyValue('--admin-font-size-h3').trim() || null,
    headingOutline: outline,
  };
};

const commit = (env) => {
  try { return execFileSync('git', ['-C', path.join(labRoot, 'envs', env), 'rev-parse', '--short', 'HEAD'], { encoding: 'utf8' }).trim(); }
  catch { return 'unknown'; }
};

const browser = await chromium.launch();
const results = {};
for (const [side, env] of Object.entries(SIDES)) {
  const host = shortHost(env);
  const base = `https://${host}`;
  const ctx = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  await page.goto(base + loginPath(env), { waitUntil: 'networkidle' });
  await page.goto(base + '/admin/content', { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);

  const data = await page.evaluate(measure);
  data.env = env;
  data.commit = commit(env);
  results[side] = data;

  const formLoc = page.locator('form.views-exposed-form, .views-exposed-form').first();
  if (await formLoc.count()) await formLoc.screenshot({ path: path.join(out, `${side}-filter-form.png`) });
  await page.screenshot({ path: path.join(out, `${side}-admin-content-full.png`), fullPage: true });

  // Zoomed-in state (the condition in the issue title): a narrow viewport forces the reflow users see when zoomed.
  await page.setViewportSize({ width: 560, height: 900 });
  await page.waitForTimeout(500);
  if (await formLoc.count()) await formLoc.screenshot({ path: path.join(out, `${side}-filter-form-zoomed.png`) });
  await page.screenshot({ path: path.join(out, `${side}-admin-content-zoomed.png`) });

  await ctx.close();
}
await browser.close();

fs.writeFileSync(path.join(out, 'results.json'), JSON.stringify(results, null, 2) + '\n');

const b = results.before, a = results.after;
const md = `# #3618405 evaluate — ${slug}

Generated ${new Date().toISOString()}.
Before: \`${b.env}\` @ ${b.commit}  ·  After: \`${a.env}\` @ ${a.commit}
Page: /admin/content (Default Admin theme). Logged in as user 1.

## Views exposed filter form

| Fact | Before | After |
|---|---|---|
| Form found | ${b.formFound} | ${a.formFound} |
| Visible heading | ${b.headingTag ? `\`<${b.headingTag}>\` "${b.headingText}"` : '—'} | ${a.headingTag ? `\`<${a.headingTag}>\` "${a.headingText}"` : '—'} |
| Heading font-size (computed) | ${b.headingFontSize || '—'} | ${a.headingFontSize || '—'} |
| aria-label on form | ${b.ariaLabel ? `"${b.ariaLabel}"` : '—'} | ${a.ariaLabel ? `"${a.ariaLabel}"` : '—'} |
| Theme tokens | h2=${b.tokenH2 || '?'} / h3=${b.tokenH3 || '?'} | h2=${a.tokenH2 || '?'} / h3=${a.tokenH3 || '?'} |

## Heading outline (main region, in order)

Before:
${b.headingOutline.map((h) => `- h${h.level}: ${h.text}`).join('\n') || '- (none)'}

After:
${a.headingOutline.map((h) => `- h${h.level}: ${h.text}`).join('\n') || '- (none)'}

## Screenshots
- before-filter-form.png / after-filter-form.png — the exposed filter region (1280px)
- before-filter-form-zoomed.png / after-filter-form-zoomed.png — the same at 560px (zoomed-in reflow)
- before-admin-content-full.png / after-admin-content-full.png — full page
- before-admin-content-zoomed.png / after-admin-content-zoomed.png — viewport at 560px

## Notes
- The MR replaces the screen-reader-only aria-label with a visible \`<h2>\`. Confirm Before shows the aria-label and no heading; After shows the heading and no aria-label.
- The h2 is styled with \`--admin-font-size-h3\` (open question in the issue, comments #18/#19): compare the computed heading font-size above with the h2/h3 tokens.
`;
fs.writeFileSync(path.join(out, 'SUMMARY.md'), md);
console.log(`Wrote ${path.relative(labRoot, out)}/`);
console.log(md);
