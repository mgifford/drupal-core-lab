// AI-assisted draft: local, read-only navigation/observation of an EXISTING Lab variant.
// Usage: node tools/playwright/gather-design.mjs <slug> [--pages=file.json] [--contrast=more] [--motion=reduce] [--forced-colors] [--crawl] [--max-pages=20] [--pdf]
import fs from 'node:fs';
import path from 'node:path';
import { runArgs, launch, openSide, siteContext, gitInfo } from './lib/lab-run.mjs';
import { observeDesign, compareObservations, printDelta } from './lib/design-observations.mjs';

const option = (name, fallback) => process.argv.find(value => value.startsWith('--' + name + '='))?.slice(name.length + 3) ?? fallback;
const help = `Usage: node tools/playwright/gather-design.mjs <registered-slug> [--pages=docs/design-pages.example.json] [--max-pages=20] [--crawl] [--contrast=more] [--motion=reduce] [--forced-colors] [--scheme=dark] [--pdf] [--out=path]
Collects screen + print DOM/style evidence, theme transitions and paired changes. No form submission, design verdict, or axe/Lighthouse crawl. --crawl only follows same-origin links under explicit crawlPrefixes in --pages. --pdf writes Chromium A4 and Letter output for manual pagination review.`;
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
  if (!['anonymous', 'administrator'].includes(spec.account)) throw new Error('account must be anonymous or administrator');
  const item = { ...spec, path: spec.path || left, beforePath: left, afterPath: right };
  const key = JSON.stringify([left, right, item.account, item.context || {}]);
  if (seen.has(key)) return; seen.add(key);
  queue.push({ ...item, discovered });
}
for (const spec of manifest.pages) enqueue(spec);
const { browser, environment } = await launch(run); run.browser = browser;
const output = path.join(run.out, 'design'); fs.mkdirSync(output, { recursive: true });
const report = { schema: 'lab-design-observations-1', status: 'DRAFT', slug: run.slug, when: new Date().toISOString(),
  environment, requested: { contrast, reducedMotion: motion, forcedColors: run.forced, colorScheme: run.scheme, media: ['screen', 'print'] },
  commits: { before: gitInfo(run.v.before.env), after: gitInfo(run.v.after.env) },
  core: run.v.core, patchStacks: { before: run.v.before.patches || [], after: run.v.after.patches || [] },
  coverage: { maxPages, maxElements: limit, crawling: crawl, discoveryLimit: maxPages * 10, visited: 0, rejectedLinks: 0, discoveryCapped: false, queuedNotVisited: 0 },
  sites: {}, pages: [], themeTransitions: [],
  limitations: ['Initial page loads only; no authored AJAX/focus/invalid states', 'No rule violations inferred from appearance differences',
    'Browser theme hint may be unavailable; negotiation reasons are not instrumented', 'No structural sampling; visited pages only',
    'Forced colours and prefers-contrast are browser emulation, not native OS palettes',
    'DOM element limit and CSSOM access gaps are explicit; no full cascade attribution',
    'GET navigation does not prove arbitrary contrib routes are side-effect-free; use disposable sites and narrow allowlists'],
};
const contexts = {};
const previous = {};
const save = () => fs.writeFileSync(path.join(output, 'observations.json'), JSON.stringify(report, null, 2));
const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const cell = value => String(value ?? 'unknown').replace(/\|/g, '\\|').replace(/[\r\n]/g, ' ');
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
          entry.screen = await observeDesign(page, { limit });
          const theme = entry.screen.context.theme;
          const key = side + ':' + spec.account + ':' + JSON.stringify(spec.context || {});
          if (previous[key] && theme && previous[key].theme !== theme) report.themeTransitions.push({ side, account: spec.account, context: spec.context || {}, from: previous[key], to: { theme, path: target } });
          if (theme) previous[key] = { theme, path: target };
          // Same document is observed in print to isolate media changes from reload noise.
          await page.emulateMedia({ media: 'print', contrast, reducedMotion: motion });
          await ready(page); entry.print = await observeDesign(page, { limit });
          entry.printDelta = printDelta(entry.screen, entry.print);
          if (pdf) {
            entry.pdfs = [];
            for (const format of ['A4', 'Letter']) {
              const file = `${i + 1}-${side}-${format}.pdf`;
              await page.pdf({ path: path.join(output, file), format, printBackground: false, preferCSSPageSize: false }); entry.pdfs.push(file);
            }
          }
          await page.emulateMedia({ media: 'screen', contrast, reducedMotion: motion });
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
    report.pages.push(result); report.coverage.visited++; report.coverage.queuedNotVisited = queue.length - report.coverage.visited;
    save();
  }
} finally {
  for (const item of Object.values(contexts)) await item.page.context().close().catch(() => {});
  await browser.close(); save();
}
const rows = report.pages.map(row => {
  const b = row.sides.before, a = row.sides.after;
  return [row.id, row.spec.path, row.spec.account, b.screen?.context.theme || 'unknown', a.screen?.context.theme || 'unknown', row.screenComparison?.themeChanged ? 'THEME CHANGE' : row.screenComparison?.themeComparable ? 'same theme' : 'not compared', row.screenComparison?.changes.length ?? 'not compared', b.screen ? JSON.stringify({contrast:b.screen.context.prefersContrast,forced:b.screen.context.forcedColors,motion:b.screen.context.reducedMotion,transparency:b.screen.context.reducedTransparency,data:b.screen.context.reducedData,markers:b.screen.context.themeModeMarkers}) : 'not observed', a.screen ? JSON.stringify({contrast:a.screen.context.prefersContrast,forced:a.screen.context.forcedColors,motion:a.screen.context.reducedMotion,transparency:a.screen.context.reducedTransparency,data:a.screen.context.reducedData,markers:a.screen.context.themeModeMarkers}) : 'not observed', b.printDelta?.hiddenInPrint.length ?? 'not checked', a.printDelta?.hiddenInPrint.length ?? 'not checked', b.printDelta?.revealedInPrint.length ?? 'not checked', a.printDelta?.revealedInPrint.length ?? 'not checked'];
});
const headers = ['#', 'Page', 'Account', 'Before theme', 'After theme', 'Theme comparison', 'Screen differences', 'Observed modes B', 'Observed modes A', 'Hidden in print B', 'Hidden in print A', 'Revealed in print B', 'Revealed in print A'];
const notes = report.pages.flatMap(row => ['before', 'after'].flatMap(side => {
  const entry = row.sides[side];
  return [entry.error || entry.notCompared ? `${row.id} ${side}: ${entry.error || entry.notCompared}` : null,
    entry.screen?.truncated || entry.print?.truncated ? `${row.id} ${side}: element inventory truncated` : null,
    entry.print?.sheets.some(sheet => !sheet.readable) ? `${row.id} ${side}: unreadable stylesheet(s); print CSS inventory incomplete` : null].filter(Boolean);
}));
const transitions = report.themeTransitions.map(event => `${event.side} (${event.account}): ${event.from.theme} ${event.from.path} -> ${event.to.theme} ${event.to.path}`);
const md = '# Design, theme and print observations\n\nDRAFT. Differences are review candidates, not violations.\n\n' +
  `Variant: ${run.slug}. Requested prefers-contrast: ${contrast}; reduced motion: ${motion}; forced colours: ${run.forced}; colour scheme: ${run.scheme}.\n\n` +
  '| ' + headers.join(' | ') + ' |\n|' + headers.map(() => '---').join('|') + '|\n' + rows.map(row => '| ' + row.map(cell).join(' | ') + ' |').join('\n') +
  '\n\n## Configured theme settings (request/user overrides may differ)\n\n' + JSON.stringify(Object.fromEntries(Object.entries(report.sites).map(([side, site]) => [side, site.configuration.themeSettings || null]))) + '\n\n## Theme transitions during navigation\n\n' + (transitions.join('\n\n') || 'None observed (not proof of a single-theme site).') +
  '\n\n## Gaps and errors\n\n' + (notes.join('\n\n') || 'No page-level errors recorded. See limitations and element caps in JSON.') +
  '\n\n## Coverage\n\n' + JSON.stringify(report.coverage) + '\n\nInspect observations.json for per-element screen/print removals, additions, restyling, pseudo-element borders, observed media values and CSSOM gaps.\n\n' + report.limitations.join('\n\n') + '\n';
fs.writeFileSync(path.join(output, 'SUMMARY.md'), md);
const style = `body{font:1rem/1.5 system-ui;max-width:100rem;margin:2rem}table{border-collapse:collapse}th,td{padding:.4rem;border:1px solid #555;text-align:left}pre{white-space:pre-wrap;overflow-wrap:anywhere}table{width:100%;table-layout:fixed}td,th{overflow-wrap:anywhere}a{color:#003ecc}@media print{body{margin:0;color:#000;background:#fff;font-size:10pt}thead{display:table-header-group}tr{break-inside:avoid}h2{break-after:avoid}th,td{padding:3pt}pre{white-space:pre-wrap}@page{margin:12mm}}`;
const summaryColumns = [0, 1, 3, 4, 5, 6];
const detailsHtml = rows.map(row => '<section><h2>Page ' + esc(row[0]) + ': ' + esc(row[1]) + '</h2><p>Account: ' + esc(row[2]) + '</p><ul>' + [
  'Before observed modes: ' + row[7], 'After observed modes: ' + row[8],
  'Hidden in print: Before ' + row[9] + '; After ' + row[10],
  'Revealed in print: Before ' + row[11] + '; After ' + row[12],
].map(value => '<li>' + esc(value) + '</li>').join('') + '</ul></section>').join('');
fs.writeFileSync(path.join(output, 'report.html'), '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Design, theme and print observations</title><style>' + style + '</style><body><h1>Design, theme and print observations</h1><p>DRAFT. Differences are review candidates. Element counts include descendants, not unique content blocks.</p><p>Variant: ' + esc(run.slug) + '; requested contrast: ' + esc(contrast) + '; reduced motion: ' + esc(motion) + '; forced colours: ' + esc(run.forced) + '; scheme: ' + esc(run.scheme) + '</p><table><caption>Paired page observations</caption><thead><tr>' + summaryColumns.map(index => '<th scope="col">' + esc(headers[index]) + '</th>').join('') + '</tr></thead><tbody>' + rows.map(row => '<tr>' + summaryColumns.map(index => '<td>' + esc(row[index]) + '</td>').join('') + '</tr>').join('') + '</tbody></table>' + detailsHtml + '<h2>Theme transitions</h2><pre>' + esc(transitions.join('\n') || 'None observed') + '</pre><h2>Gaps and errors</h2><pre>' + esc(notes.join('\n') || 'See JSON for element caps and stylesheet inventory') + '</pre><h2>Coverage</h2><pre>' + esc(JSON.stringify(report.coverage, null, 2)) + '</pre><h2>Limitations</h2><ul>' + report.limitations.map(value => '<li>' + esc(value) + '</li>').join('') + '</ul><p>Full per-element evidence is in observations.json.</p></body></html>');
console.log('Evidence saved to ' + output);
if (report.pages.some(row => Object.values(row.sides).some(side => side.error || side.notCompared))) process.exitCode = 2;
