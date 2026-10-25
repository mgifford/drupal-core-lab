// What assistive technology is given, Before vs After, for each page of a variant: Chromium's accessibility tree, the ARIA
// attributes after JavaScript (ID references looked up) and what the Guidepup virtual screen reader says through the whole page.
//   node tools/playwright/tree-diff.mjs <issue|slug> [--page=/path]... [--viewport=WxH]
//   node tools/playwright/tree-diff.mjs --before=<url> --after=<url> --page=/path... --out=<dir> [--login-before=/path] [--login-after=/path]
// The first form uses the variant's two DDEV sites (local DDEV or DDEV Coder), logged in with one-time links when the variant has
// "login": true, and writes reports/issues/<nid>/tree-diff/<slug>/ (or <slug>-<WxH> for another viewport), replacing the last run.
// The second compares any two sites as they are; --login-* opens a path first (a one-time login link). --chromium=<path> picks the
// browser binary. Output: SUMMARY.md, one .diff per page and view that differ, each view in full in before/ and after/.
// See docs/ACCESSIBILITY-TREE-DIFF.md.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { labRoot, resolveVariant, envInfo, loginPath, reportsDir } from '../compare/lib.mjs';
import { VIEWS, normaliseTree, pageFile, summaryMarkdown, terminalReport } from './lib/tree-format.mjs';

const USAGE = `Accessibility tree, ARIA after JavaScript and Guidepup speech of each page, Before vs After.

  node tools/playwright/tree-diff.mjs <issue|slug> [--page=/path]... [--viewport=WxH]
      The variant's two DDEV sites (local DDEV or DDEV Coder), which must be built and running:
      node scripts/test-mr.mjs <issue> does both. Pages: the variant's, or each --page.
      Writes reports/issues/<issue>/tree-diff/<slug>/ (<slug>-<WxH> for another viewport).
  node tools/playwright/tree-diff.mjs --before=<url> --after=<url> --page=/path... --out=<dir> [--login-before=<path>] [--login-after=<path>]
      Any two sites as they are.
  --chromium=<path>  another Chromium binary.

Install once (in the lab root):  cd tools/playwright && npm install && npx playwright install chromium
How to read the result: docs/ACCESSIBILITY-TREE-DIFF.md`;

const argv = process.argv.slice(2);
if (argv.includes('--help') || argv.includes('-h')) { console.log(USAGE); process.exit(0); }
const opt = (n) => { const a = argv.find((x) => x.startsWith(`--${n}=`)); return a ? a.slice(n.length + 3) : ''; };
const fail = (msg) => { console.error(msg); process.exit(2); };
const INSTALL = `  cd ${path.relative(process.cwd(), path.join(labRoot, 'tools/playwright')) || '.'} && npm install && npx playwright install${process.env.CODER_AGENT_URL ? ' --with-deps' : ''} chromium`;

// Playwright, jsdom and Guidepup come from tools/playwright's own npm install: say how to get them instead of a stack trace.
let chromium, launch, gitInfo, capturePage;
try {
  ({ chromium } = await import('@playwright/test'));
  ({ launch, gitInfo } = await import('./lib/lab-run.mjs'));
  ({ capturePage } = await import('./lib/tree-capture.mjs'));
} catch (e) {
  if (e.code !== 'ERR_MODULE_NOT_FOUND') throw e;
  fail(`tools/playwright is not installed yet (${String(e.message).match(/'([^']+)'/)?.[1] || 'a package'} is missing). Install it once:\n${INSTALL}\nthen run this again.`);
}
const browserProblem = (e) => (/Executable doesn't exist|browserType\.launch/.test(String(e.message)) ? `Chromium for Playwright is not installed (or cannot start here). Install it once:\n${INSTALL}\n${String(e.message).split('\n')[0]}` : '');
const [vw, vh] = (opt('viewport') || '1280x900').split('x').map(Number);
if (!(vw > 0 && vh > 0)) fail('--viewport must look like 1280x900');
const viewport = { width: vw, height: vh };
const pagesArg = argv.filter((x) => x.startsWith('--page=')).map((x) => x.slice(7));
for (const p of pagesArg) if (!p.startsWith('/')) fail(`--page must be a path starting with /: ${p}`);

let title, pages, out, sides, login, browser, environment;
if (opt('before') || opt('after')) {
  if (!opt('before') || !opt('after') || !opt('out') || !pagesArg.length) fail('Comparing two sites needs --before=<url> --after=<url> --out=<dir> and at least one --page=/path.');
  const site = (side) => { const u = new URL(opt(side)); return { base: u.origin + u.pathname.replace(/\/$/, ''), login: opt(`login-${side}`), hosts: [u.host], label: u.origin }; };
  sides = { before: site('before'), after: site('after') };
  title = `${sides.before.label} vs ${sides.after.label}`; pages = pagesArg; out = path.resolve(opt('out'));
  login = Boolean(sides.before.login || sides.after.login);
  browser = await chromium.launch(opt('chromium') ? { executablePath: opt('chromium') } : {}).catch((e) => fail(browserProblem(e) || String(e.message)));
  environment = { browser: 'chromium', browserVersion: browser.version(), viewport };
} else {
  const r = resolveVariant(argv.find((a) => !a.startsWith('-')));
  if (r.error) fail(r.error);
  if (r.note) console.log(r.note);
  const v = r.v;
  title = v.slug; pages = pagesArg.length ? pagesArg : v.pages || ['/']; login = Boolean(v.login);
  out = path.join(labRoot, reportsDir(v), 'tree-diff', v.slug + (vw === 1280 && vh === 900 ? '' : `-${vw}x${vh}`));
  sides = {};
  for (const side of ['before', 'after']) {
    const env = v[side].env;
    let info; try { info = envInfo(env); } catch (e) { fail(`${side}: ${e.message.split('\n')[0]} (node scripts/test-mr.mjs ${v.issue} builds and starts both)`); }
    if (/^(stopped|paused)/.test(info.status || '')) fail(`${side}: ${env} is ${info.status}. Start both: node scripts/lab-env.mjs start ${v.slug}`);
    const host = info.hosts.slice().sort((a, b) => a.length - b.length)[0];
    const port = info.routerHttpsPort && info.routerHttpsPort !== 443 ? `:${info.routerHttpsPort}` : '';   // DDEV's router, wherever it listens
    let link = ''; try { link = login ? loginPath(env) : ''; } catch (e) { fail(`${side}: no one-time login link from \`ddev drupal login\` in envs/${env}: ${String(e.message).split('\n')[0]}`); }
    sides[side] = { base: `https://${host}${port}`, login: link, hosts: info.hosts, label: `\`${env}\` (${gitInfo(env)})` };
  }
  try { ({ browser, environment } = await launch({ v, browser: 'chromium', executablePath: opt('chromium') })); }   // refuses sides that are not what the variant says
  catch (e) { fail(browserProblem(e) || String(e.message)); }
  environment = { ...environment, viewport };
}

const hosts = [...sides.before.hosts, ...sides.after.hosts];
fs.mkdirSync(out, { recursive: true });
for (const f of fs.readdirSync(out)) if (/^(before|after)$|\.diff$|^SUMMARY\.md$/.test(f)) fs.rmSync(path.join(out, f), { recursive: true, force: true });
for (const side of ['before', 'after']) fs.mkdirSync(path.join(out, side));

const run = { title, when: new Date().toISOString(), sides, environment, login, pages: pages.map((p, i) => ({ path: p, file: pageFile(p, i), sides: {}, views: {} })), refs: { before: [], after: [] } };
try {
  for (const side of ['before', 'after']) {
    const s = sides[side];
    const ctx = await browser.newContext({ viewport, ignoreHTTPSErrors: true });
    const page = await ctx.newPage();
    console.log(`${side === 'before' ? 'Before' : 'After'}: ${s.base}${s.login ? ' (logging in with a one-time link)' : ''}`);
    if (s.login) await page.goto(s.base + s.login, { waitUntil: 'load' }).catch((e) => fail(`${side}: the login link did not open: ${String(e.message).split('\n')[0]}`));
    for (const p of run.pages) {
      try {
        const res = await page.goto(s.base + p.path, { waitUntil: 'load' });
        await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
        await page.waitForTimeout(500);   // Drupal behaviours that run after load
        const u = new URL(page.url());
        const got = await capturePage(page);
        p.sides[side] = { status: res ? res.status() : null, landed: u.pathname + u.search, spoken: got.spoken };
        for (const v of VIEWS) fs.writeFileSync(path.join(out, side, `${p.file}.${v.key}.txt`), normaliseTree(got[v.key], hosts));
        run.refs[side].push(...got.refs.map((r) => ({ ...r, page: p.path, element: normaliseTree(r.element, hosts), id: normaliseTree(r.id, hosts) })));
        console.log(`  ${p.path}: ${got.axtree.split('\n').length - 1} tree lines, ${got.spoken} items spoken, ${got.refs.length} unresolved ID references`);
      } catch (e) { p.sides[side] = { error: String(e.message || e).split('\n')[0] }; console.error(`  ${p.path}: ${p.sides[side].error}`); }
    }
    await ctx.close();
  }
} finally { await browser.close(); }

for (const p of run.pages) for (const v of VIEWS) {
  const [a, b] = ['before', 'after'].map((side) => path.join(out, side, `${p.file}.${v.key}.txt`));
  if (!fs.existsSync(a) || !fs.existsSync(b)) continue;
  const label = `${p.path} (${v.title})`;
  const d = spawnSync('diff', ['-u', '--label', `before ${label}`, '--label', `after ${label}`, a, b], { encoding: 'utf8' });
  if (d.status > 1 || d.error) fail(`diff failed: ${d.error?.message || d.stderr}`);
  const file = `${p.file}.${v.key}.diff`;
  if (d.stdout) fs.writeFileSync(path.join(out, file), d.stdout);
  p.views[v.key] = { diff: d.stdout, file };
}
fs.writeFileSync(path.join(out, 'SUMMARY.md'), summaryMarkdown(run));
console.log(terminalReport(run, path.relative(process.cwd(), out) || '.'));
if (run.pages.some((p) => p.sides.before.error || p.sides.after.error)) process.exit(1);
