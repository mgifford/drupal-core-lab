// Viewer-side comparison for #3636987: opens the registered `3636987-pinned` comparison in the Lab viewer,
// logs in both frames, sets a colour mode with browser-context media emulation, opens /admin/content and
// /admin/structure/block, takes a Before/After screenshot and presses the viewer's Run checks.
//   node tools/playwright/viewer-3636987.mjs [--modes=forced-dark,forced-light,dark,light]
//                                            [--pages=/admin/content,/admin/structure/block]
//                                            [--viewer=https://drupal-compare.ddev.site] [--out=<dir>]
// Media emulation is Playwright's browser-context emulation (the same mechanism the scripted runs use), not
// the viewer's separate preference-emulation window. It is browser emulation, not a native Windows contrast theme.
// The checks table is the viewer's own Table; a person still has to review the result.
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from '@playwright/test';

const argv = process.argv.slice(2);
const opt = (n, d) => { const a = argv.find((x) => x.startsWith(`--${n}=`)); return a ? a.slice(n.length + 3) : d; };
const viewer = opt('viewer', 'https://drupal-compare.ddev.site');
const out = path.resolve(opt('out', 'reports/issues/3636987/manual'));
const modes = opt('modes', 'forced-dark,forced-light,dark,light').split(',').filter(Boolean);
const pages = opt('pages', '/admin/content,/admin/structure/block').split(',').filter(Boolean);
const MEDIA = {
  'forced-dark': { colorScheme: 'dark', forcedColors: 'active' },
  'forced-light': { colorScheme: 'light', forcedColors: 'active' },
  dark: { colorScheme: 'dark', forcedColors: 'none' },
  light: { colorScheme: 'light', forcedColors: 'none' },
};
for (const m of modes) if (!MEDIA[m]) { console.error(`unknown mode ${m}`); process.exit(2); }
fs.mkdirSync(out, { recursive: true });

const slug = (p) => p.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'root';
const browser = await chromium.launch();
const version = browser.version();
const results = { viewer, variant: '3636987-pinned', browser: `chromium ${version}`, when: new Date().toISOString(), comparisons: [] };

const settle = async (page) => {
  await page.waitForFunction(() => document.querySelectorAll('iframe').length >= 2
    && !/Loading/i.test(document.getElementById('status')?.textContent || ''), null, { timeout: 45000 });
  await page.waitForTimeout(4200);
};

// What the viewer frames themselves report (not the scripted-run sites): media state and the computed
// caret values of the first select on the page. This is the viewer-side measurement.
const frameState = async (page) => {
  const frames = page.frames().filter((f) => f !== page.mainFrame());
  const out = [];
  for (const f of frames) {
    const side = /before/.test(f.url()) ? 'before' : /after/.test(f.url()) ? 'after' : f.url();
    out.push({ side, url: f.url(), ...(await f.evaluate(() => {
      const s = document.querySelector('select');
      return {
        forced: matchMedia('(forced-colors: active)').matches,
        darkClass: document.documentElement.classList.contains('dark-mode'),
        theme: window.drupalSettings?.ajaxPageState?.theme ?? null,
        select: s ? { id: s.id, backgroundImage: getComputedStyle(s).backgroundImage === 'none' ? 'none' : 'URL', appearance: getComputedStyle(s).appearance, paddingInlineEnd: getComputedStyle(s).paddingInlineEnd } : null,
      };
    })) });
  }
  return out;
};

// A select-level screenshot from inside each frame, saved beside the viewer screenshot.
const frameShots = async (page, mode, p) => {
  const files = {};
  const frames = page.frames().filter((f) => f !== page.mainFrame());
  for (const f of frames) {
    const side = /before/.test(f.url()) ? 'before' : /after/.test(f.url()) ? 'after' : 'frame';
    const loc = f.locator('select').first();
    if (!(await loc.count())) continue;
    const name = `viewer-${mode}-${slug(p)}-${side}-select.png`;
    await loc.screenshot({ path: path.join(out, name) }).catch(() => {});
    files[side] = name;
  }
  return files;
};


try {
  for (const mode of modes) {
    const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 }, ignoreHTTPSErrors: true, ...MEDIA[mode] });
    const page = await ctx.newPage();
    await page.goto(`${viewer}/?variant=3636987-pinned`, { waitUntil: 'load' });
    await page.waitForSelector('#login', { state: 'visible' });
    let logged = false;
    for (let attempt = 1; attempt <= 3 && !logged; attempt++) {
      await page.waitForFunction(() => !document.getElementById('login')?.disabled, null, { timeout: 30000 }).catch(() => {});
      await page.click('#login').catch(() => {});
      try {
        await page.waitForFunction(() => /Logged in on both sites/.test(document.getElementById('status')?.textContent || ''), null, { timeout: 90000 });
        logged = true;
      } catch {
        const st = await page.evaluate(() => document.getElementById('status')?.textContent || '');
        console.log(`login attempt ${attempt}: ${st}`);
        await page.waitForTimeout(2000);
      }
    }
    if (!logged) throw new Error('the viewer did not finish logging both frames in');
    await page.waitForTimeout(1000);
    for (const p of pages) {
      await page.fill('#goto', p);
      await page.click('#go');
      await settle(page);
      await page.waitForTimeout(500);
      const file = `viewer-${mode}-${slug(p)}.png`;
      await page.screenshot({ path: path.join(out, file), fullPage: true });
      const frames = await frameState(page);
      const selectShots = await frameShots(page, mode, p);
      let table = null, checkFile = null;
      if (mode.startsWith('forced')) {
        try {
          const tab = page.getByRole('tab', { name: /Checks/ });
          if (await tab.count()) await tab.click();
          await page.click('#runchecks');
          await page.waitForFunction(() => {
            const v = document.getElementById('verdict');
            return v && !v.hidden && v.textContent.trim().length > 0 && !/^Waiting/i.test(v.textContent);
          }, null, { timeout: 20000 });
        } catch { console.log(`    (viewer Run checks did not answer within 20 s on ${p}; the frame measurements and screenshots are still recorded)`); }
        table = await page.evaluate(() => ({
          status: document.getElementById('rcstat')?.textContent || '',
          verdict: document.getElementById('verdict')?.textContent || '',
          verdictClass: document.getElementById('verdict')?.className || '',
          rows: [...document.querySelectorAll('#checks tbody tr')].map((tr) => [...tr.querySelectorAll('th,td')].map((c) => c.textContent.trim())),
        }));
        checkFile = `viewer-${mode}-${slug(p)}-checks.png`;
        if (table && table.rows && table.rows.length) await page.screenshot({ path: path.join(out, checkFile), fullPage: true });
      }
      results.comparisons.push({ mode, page: p, screenshot: file, selectShots, frames, ...(table || {}) });
      console.log(`${mode.padEnd(12)} ${p.padEnd(28)} ${table ? `verdict: ${table.verdict.slice(0, 100)}` : 'visual only (no forced colours)'}`);
      for (const f of frames) console.log(`    ${f.side.padEnd(6)} forced=${f.forced} dark=${f.darkClass} theme=${f.theme} select=${f.select ? `${f.select.backgroundImage}/${f.select.appearance}/${f.select.paddingInlineEnd}` : 'none'}`);
      if (table) for (const r of table.rows) console.log(`    ${r.join(' | ')}`);
    }
    await ctx.close();
  }
} finally { await browser.close(); }

fs.writeFileSync(path.join(out, 'viewer-results.json'), JSON.stringify(results, null, 2) + '\n');
console.log(`\nWrote ${results.comparisons.length} comparison(s) to ${out}`);
