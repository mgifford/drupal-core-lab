// AI-assisted draft: local, read-only navigation/observation of an EXISTING Lab variant.
// Usage: node tools/playwright/gather-design.mjs <slug> [--pages=file.json] [--contrast=more] [--motion=reduce] [--forced-colors] [--crawl] [--max-pages=20] [--pdf]
import fs from 'node:fs';
import path from 'node:path';
import { runArgs, launch, openSide, siteContext, gitInfo } from './lib/lab-run.mjs';
import { designStates, designScenarioNames } from './lib/design-scenarios.mjs';
import { renderDesignReport, designArtifactNames } from './lib/design-report.mjs';
import { observeDesign, compareObservations, printDelta } from './lib/design-observations.mjs';

const option = (name, fallback) => process.argv.find(value => value.startsWith('--' + name + '='))?.slice(name.length + 3) ?? fallback;
const help = `Usage: node tools/playwright/gather-design.mjs <registered-slug> [--pages=docs/design-pages.example.json] [--max-pages=20] [--crawl] [--contrast=more] [--motion=reduce] [--forced-colors] [--scheme=dark] [--pdf] [--out=path]
Collects screen + print DOM/style evidence, theme transitions and paired changes. No content save, design verdict, or axe/Lighthouse crawl. The optional curated multivalue scenario submits AJAX add/remove controls only. --crawl only follows same-origin links under explicit crawlPrefixes in --pages. --pdf writes Chromium A4 and Letter output for manual pagination review.`;
if (process.argv.includes('--help')) { console.log(help); process.exit(0); }
const run = runArgs();
const maxPages = Number(option('max-pages', '20'));
if (!Number.isInteger(maxPages) || maxPages < 1 || maxPages > 500) throw new Error('--max-pages must be 1..500');
const limit = Number(option('max-elements', '4000'));
if (!Number.isInteger(limit) || limit < 1 || limit > 20000) throw new Error('--max-elements must be 1..20000');
const contrast = option('contrast', 'no-preference');
if (!['more', 'no-preference'].includes(contrast)) throw new Error('--contrast must be more or no-preference');
const motion = option('motion', 'no-preference');
if (!['reduce', 'no-preference'].includes(motion)) throw new Error('--motion must be reduce or no-preference');
const crawl = process.argv.includes('--crawl'), pdf = process.argv.includes('--pdf');
if (pdf && run.browser !== 'chromium') throw new Error('--pdf requires Chromium');
const manifest = option('pages', null) ? JSON.parse(fs.readFileSync(option('pages'), 'utf8')) : {
  pages: [{ path: '/user/login', account: 'anonymous' }, { path: '/user/password', account: 'anonymous' },
    ...(run.v.pages || []).slice(0, 8).map(value => ({ path: value, account: 'administrator' }))],
  crawlPrefixes: [],
};
if (!Array.isArray(manifest.pages) || !manifest.pages.length) throw new Error('Manifest needs pages');
const safePath = value => typeof value === 'string' && /^\/(?!\/)/.test(value) && !/[?#\\\r\n]/.test(value) && !/%(?:2f|5c|2e)/i.test(value) && !value.split('/').includes('..') && !/\/(?:logout|reset|delete|remove|uninstall|cancel|rebuild|cron|batch|update\.php)(?:\/|$)/i.test(value);
const prefixes = manifest.crawlPrefixes || [];
if (!Array.isArray(prefixes) || prefixes.some(value => !safePath(value))) throw new Error('crawlPrefixes must be safe relative paths');
if (crawl && !prefixes.length) throw new Error('--crawl requires explicit crawlPrefixes in the pages manifest');
const allowed = value => safePath(value) && prefixes.some(prefix => value === prefix || value.startsWith(prefix.replace(/\/$/, '') + '/'));
const queue = [], seen = new Set();
function enqueue(spec, discovered = false) {
  const left = spec.beforePath || spec.path, right = spec.afterPath || spec.path;
  if (![left, right].every(safePath)) throw new Error('Unsafe path in manifest/discovery');
  if (spec.scenario && (!designScenarioNames.includes(spec.scenario) || spec.path !== '/node/add/article' || spec.account !== 'administrator')) throw new Error('Unsupported scenario or scenario precondition');
  if (!['anonymous', 'administrator'].includes(spec.account)) throw new Error('account must be anonymous or administrator');
  const item = { ...spec, path: spec.path || left, beforePath: left, afterPath: right };
  const key = JSON.stringify([left, right, item.account, item.context || {}]);
  if (seen.has(key)) return; seen.add(key);
  queue.push({ ...item, discovered });
}
for (const spec of manifest.pages) enqueue(spec);
const { browser, environment } = await launch(run); run.browser = browser;
const output = path.join(run.out, 'design'); fs.mkdirSync(output, { recursive: true });
const report = { schema: 'lab-design-observations-2', status: 'DRAFT', slug: run.slug, when: new Date().toISOString(),
  environment, requested: { contrast, reducedMotion: motion, forcedColors: run.forced, colorScheme: run.scheme, media: ['screen', 'print'] },
  commits: { before: gitInfo(run.v.before.env), after: gitInfo(run.v.after.env) },
  core: run.v.core, patchStacks: { before: run.v.before.patches || [], after: run.v.after.patches || [] },
  coverage: { maxPages, maxElements: limit, crawling: crawl, discoveryLimit: maxPages * 10, visited: 0, rejectedLinks: 0, discoveryCapped: false, queuedNotVisited: 0 },
  sites: {}, pages: [], themeTransitions: [],
  limitations: ['Initial loads plus explicitly selected multivalue add/remove scenario; no general focus/invalid-state coverage', 'No rule violations inferred from appearance differences',
    'Browser theme hint may be unavailable; negotiation reasons are not instrumented', 'No structural sampling; visited pages only',
    'Forced colours and prefers-contrast are browser emulation, not native OS palettes',
    'DOM element limit and CSSOM access gaps are explicit; no full cascade attribution',
    'GET navigation does not prove arbitrary contrib routes are side-effect-free; use disposable sites and narrow allowlists'],
};
report.artifacts = designArtifactNames(run.slug, report.when);
const contexts = {};
const previous = {};
const save = () => fs.writeFileSync(path.join(output, report.artifacts.observations), JSON.stringify(report, null, 2));
async function ensureContext(side, account) {
  const key = side + ':' + account;
  if (contexts[key]) return contexts[key];
  let opened;
  if (account === 'administrator') opened = await openSide(run, side);
  else {
    const site = report.sites[side];
    const ctx = await browser.newContext({ viewport: run.viewport, colorScheme: run.scheme, forcedColors: run.forced ? 'active' : 'none', ignoreHTTPSErrors: true });
    opened = { page: await ctx.newPage(), base: site.base, rec: null };
  }
  const baseOrigin = new URL(opened.base).origin;
  // Prevent links/redirects leaving this site's origin, including authentication hosts.
  await opened.page.route('**/*', route => {
    const req = route.request();
    if (req.isNavigationRequest() && new URL(req.url()).origin !== baseOrigin) return route.abort();
    return route.continue();
  });
  contexts[key] = opened; return opened;
}
async function ready(page) {
  await page.waitForLoadState('domcontentloaded');
  await page.locator('body').waitFor();
  await page.evaluate(() => Promise.race([document.fonts?.ready, new Promise(resolve => setTimeout(resolve, 3000))]));
}
try {
  // Configuration evidence is separate from actual request-theme evidence.
  for (const side of ['before', 'after']) {
    const { envInfo } = await import('../compare/lib.mjs');
    const info = envInfo(run.v[side].env);
    const host = info.hosts.slice().sort((a, b) => a.length - b.length)[0];
    report.sites[side] = { base: 'https://' + host, configuration: siteContext(run.v[side].env) };
  }
  for (let i = 0; i < queue.length && i < maxPages; i++) {
    const spec = queue[i]; const result = { id: i + 1, spec, sides: {} };
    for (const side of ['before', 'after']) {
      const { page, base } = await ensureContext(side, spec.account);
      const target = spec[side + 'Path'];
      console.log(`${i + 1}/${Math.min(queue.length, maxPages)} ${side} ${spec.account} ${target}`);
      const entry = { requestedPath: target };
      try {
        await page.emulateMedia({ media: 'screen', contrast, reducedMotion: motion });
        const response = await page.goto(base + target, { waitUntil: 'domcontentloaded', timeout: 30000 });
        entry.status = response?.status() ?? null;
        await ready(page);
        entry.finalPath = new URL(page.url()).pathname;
        entry.redirected = entry.finalPath !== target;
        if (entry.status >= 400 || entry.redirected) {
          entry.notCompared = entry.status >= 400 ? 'HTTP error' : 'Redirected; supply the resolved path explicitly for evidence';
        } else {
          entry.states = [];
          for await (const state of designStates(page, spec)) {
            const measurement = state === 'initial' ? entry : { name: state };
            measurement.screen = await observeDesign(page, { limit });
            const theme = measurement.screen.context.theme;
            const key = side + ':' + spec.account + ':' + JSON.stringify(spec.context || {});
            if (previous[key] && theme && previous[key].theme !== theme) report.themeTransitions.push({ side, account: spec.account, context: spec.context || {}, from: previous[key], to: { theme, path: target, state } });
            if (theme) previous[key] = { theme, path: target };
            // Same document is observed in print to isolate media changes from reload noise.
            await page.emulateMedia({ media: 'print', contrast, reducedMotion: motion });
            await ready(page); measurement.print = await observeDesign(page, { limit });
            measurement.printDelta = printDelta(measurement.screen, measurement.print);
            if (pdf) {
              measurement.pdfs = [];
              for (const format of ['A4', 'Letter']) {
                const file = `${report.artifacts.runId}-${i + 1}-${side}-${state}-${format}.pdf`;
                await page.pdf({ path: path.join(output, file), format, printBackground: false, preferCSSPageSize: false }); measurement.pdfs.push(file);
              }
            }
            await page.emulateMedia({ media: 'screen', contrast, reducedMotion: motion });
            if (state !== 'initial') entry.states.push(measurement);
          }
          if (crawl) {
            const links = await page.locator('a[href]').evaluateAll(anchors => anchors.map(anchor => anchor.href));
            for (const link of links) {
              let url; try { url = new URL(link); } catch { report.coverage.rejectedLinks++; continue; }
              if (url.origin !== new URL(base).origin || url.search || url.hash || !allowed(url.pathname)) { report.coverage.rejectedLinks++; continue; }
              if (seen.size >= maxPages * 10) { report.coverage.discoveryCapped = true; break; }
              enqueue({ path: url.pathname, account: spec.account, context: spec.context || {} }, true);
            }
          }
        }
      } catch (error) { entry.error = String(error.message).split('\n')[0].replace(/https?:\/\/\S+/g, '[URL]').slice(0, 300); }
      result.sides[side] = entry;
    }
    for (const medium of ['screen', 'print']) {
      const b = result.sides.before[medium], a = result.sides.after[medium];
      if (b && a) result[medium + 'Comparison'] = compareObservations(b, a);
    }
    result.stateComparisons = [];
    for (const name of new Set(['before', 'after'].flatMap(side => (result.sides[side].states || []).map(state => state.name)))) {
      const state = { name };
      for (const media of ['screen', 'print']) {
        const before = result.sides.before.states?.find(value => value.name === name)?.[media];
        const after = result.sides.after.states?.find(value => value.name === name)?.[media];
        if (before && after) state[media + 'Comparison'] = compareObservations(before, after);
        else state.notCompared = 'State unavailable on one or both sides';
      }
      result.stateComparisons.push(state);
    }
    report.pages.push(result); report.coverage.visited++; report.coverage.queuedNotVisited = queue.length - report.coverage.visited;
    save();
  }
} finally {
  for (const item of Object.values(contexts)) await item.page.context().close().catch(() => {});
  await browser.close(); save();
}
const rendered = renderDesignReport(report);
fs.writeFileSync(path.join(output, report.artifacts.summary), rendered.markdown);
fs.writeFileSync(path.join(output, report.artifacts.html), rendered.html);
console.log('Evidence saved to ' + output);
for (const name of [report.artifacts.observations, report.artifacts.summary, report.artifacts.html]) console.log('  ' + name);
if (report.pages.some(row => Object.values(row.sides).some(side => side.error || side.notCompared))) process.exitCode = 2;
