// Compare MR !16609 on two existing lab sites without submitting the maintenance form.
// node tools/playwright/evaluate-3615469.mjs [3615469-pinned|3615469-latest]
// Shared flags: --browser=chromium|firefox|webkit --scheme=light|dark --forced-colors --viewport=WxH --out=...
import path from 'node:path';
import { expect } from '@playwright/test';
import { JSDOM } from 'jsdom';
import { virtual } from '@guidepup/virtual-screen-reader';
import { runArgs, launch, openSide, axeScan, baseResults, writeRun, contextMarkdown, ajaxMarkdown, speechMarkdown } from './lib/lab-run.mjs';

const run = runArgs({ slug: '3615469-pinned' });
if (run.v.issue !== '3615469') throw Error('This replay only supports issue 3615469.');
const route = '/admin/config/development/maintenance';
const selector = 'input[name="maintenance_mode"]';

async function speech(html) {
  const dom = new JSDOM(`<!doctype html><html lang="en"><body><div id="sample">${html}</div></body></html>`, { pretendToBeVisual: true });
  const values = { window: dom.window, document: dom.window.document, Node: dom.window.Node, getComputedStyle: dom.window.getComputedStyle.bind(dom.window) };
  const old = Object.fromEntries(Object.keys(values).map((k) => [k, Object.getOwnPropertyDescriptor(globalThis, k)]));
  try {
    for (const [k, value] of Object.entries(values)) Object.defineProperty(globalThis, k, { value, configurable: true, writable: true });
    await virtual.start({ container: dom.window.document.getElementById('sample') });
    for (let i = 0; i < 40; i++) {
      await virtual.next();
      const log = await virtual.spokenPhraseLog();
      if (log.length > 2 && log.at(-1) === log[0]) return log.slice(0, -1);
    }
    return await virtual.spokenPhraseLog();
  }
  finally {
    try { await virtual.stop(); }
    finally {
      dom.window.close();
      for (const [k, descriptor] of Object.entries(old)) {
        if (descriptor) Object.defineProperty(globalThis, k, descriptor);
        else delete globalThis[k];
      }
    }
  }
}

const { browser, environment } = await launch(run);
run.browser = browser;
const results = baseResults(run, environment);
try {
  for (const side of ['before', 'after']) {
    const { page, base, rec } = await openSide(run, side);
    try {
      const response = await page.goto(base + route);
      if (response?.status() !== 200) throw Error(`${side}: maintenance form did not return HTTP 200`);
      const box = page.locator(selector);
      await expect(box).toBeVisible();
      rec.form = await box.evaluate((b) => {
        const ids = (b.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean);
        const parts = ids.map((id) => document.getElementById(id));
        const links = parts.filter(Boolean).flatMap((el) => [...el.querySelectorAll('a')]);
        return {
          checked: b.checked, describedBy: ids, missingIds: ids.filter((id) => !document.getElementById(id)),
          text: parts.filter(Boolean).map((el) => el.textContent).join(' ').replace(/\s+/g, ' ').trim(),
          html: parts.filter(Boolean).map((el) => el.outerHTML).join('\n'),
          links: links.map((a) => ({ text: a.textContent.trim(), path: new URL(a.href).pathname, trailingText: a.nextSibling?.textContent || '' })),
        };
      });
      rec.descriptionMatches = await expect(box).toHaveAccessibleDescription(rec.form.text).then(() => true, () => false);
      const login = page.getByRole('link', { name: side === 'before' ? 'user login' : 'user login page', exact: true });
      rec.loginNameFound = await login.count() === 1;
      rec.aria = await page.locator('main').ariaSnapshot();
      rec.reader = await speech(rec.form.html);
      rec.axe = await axeScan(page);
      // Reload so the Tab sequence begins from a fresh document, then use trusted key presses.
      await page.goto(base + route);
      rec.tabs = [];
      for (let i = 0; i < 160; i++) {
        await page.keyboard.press('Tab');
        const item = await page.evaluate(() => {
          const el = document.activeElement;
          if (el?.matches('input[name="maintenance_mode"]')) return { kind: 'checkbox', name: 'Put site into maintenance mode' };
          if (el?.matches('a') && document.querySelector('input[name="maintenance_mode"]')?.getAttribute('aria-describedby')?.split(/\s+/).some((id) => document.getElementById(id)?.contains(el))) return { kind: 'link', name: el.textContent.trim() };
          return null;
        });
        if (item) rec.tabs.push(item);
        if (rec.tabs.some((t) => t.kind === 'checkbox') && rec.tabs.filter((t) => t.kind === 'link').length >= 2) break;
      }
      await page.screenshot({ path: path.join(run.out, `${side}-maintenance.png`), fullPage: true });
    }
    finally { results.sides[side] = await rec.close(run.out); }
  }
}
finally { await browser.close(); }

const B = results.sides.before, A = results.sides.after;
const login = (r) => r.form.links.filter((l) => l.path.endsWith('/user/login'));
const checks = [];
const check = (kind, label, pass) => checks.push({ kind, label, pass });
check('precondition', 'Both descriptions and referenced IDs exist', [B, A].every((r) => r.form.describedBy.length && !r.form.missingIds.length && r.form.text));
check('precondition', 'Before exposes the original login link', B.loginNameFound && login(B).length === 1 && login(B)[0].text === 'user login');
check('fix', 'After exposes the complete login link phrase', A.loginNameFound && login(A).length === 1 && login(A)[0].text === 'user login page');
check('regression', 'Full description text is unchanged', B.form.text === A.form.text);
check('regression', 'Browser accessible description matches the description text', B.descriptionMatches && A.descriptionMatches);
check('regression', 'Both description links keep their destinations', B.form.links.length === 2 && A.form.links.length === 2 && JSON.stringify(B.form.links.map((l) => l.path)) === JSON.stringify(A.form.links.map((l) => l.path)));
check('regression', 'Maintenance mode remains off', !B.form.checked && !A.form.checked);
check('regression', 'Tab reaches checkbox and both description links', [B, A].every((r) => r.tabs.some((t) => t.kind === 'checkbox') && new Set(r.tabs.filter((t) => t.kind === 'link').map((t) => t.name)).size === 2));
check('regression', 'No new axe rule counts', Object.entries(A.axe.rules).every(([id, count]) => count <= (B.axe.rules[id] || 0)));
check('regression', 'No uncaught JavaScript errors', !B.jsErrors.length && !A.jsErrors.length);
results.checks = checks;
results.unexpected = checks.filter((c) => !c.pass).length;
results.verdict = results.unexpected ? 'mixed' : 'reproduced-and-fixed';
let md = `# DRAFT: #3615469 link text comparison\n\n${results.when}. Variant ${run.slug}. The form was not submitted; maintenance mode was not enabled.\n\n`;
md += '| Kind | Check | Result |\n|---|---|---|\n' + checks.map((c) => `| ${c.kind} | ${c.label} | ${c.pass ? 'as expected' : 'UNEXPECTED'} |`).join('\n') + '\n\n';
md += contextMarkdown(results) + ajaxMarkdown(results) + speechMarkdown(results);
md += '## Limits\n\nThe schema verdict reproduced-and-fixed means the link-text change was confirmed, not that iOS speech was reproduced or fixed. Guidepup uses a DOM snapshot. Playwright WebKit on desktop is not real iOS VoiceOver. Visible focus still needs a person. No criterion-conformance or translation assessment is established. Complete MR review threads were inaccessible during package preparation.\n\nDescription HTML, link destinations, ARIA snapshots, simulated phrases, Tab observations, axe findings, site context, and exact revisions are in results.json.\n';
console.log(writeRun(run, results, md));
process.exitCode = results.unexpected ? 2 : 0;
