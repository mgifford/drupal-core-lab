// AI-assisted draft: local, read-only navigation/observation of an EXISTING Lab variant.
// Usage: node tools/playwright/gather-design.mjs <slug> [--pages=file.json] [--contrast=more] [--motion=reduce] [--motion-matrix] [--forced-colors] [--crawl] [--max-pages=20] [--pdf]
import fs from 'node:fs';
import path from 'node:path';
import { writeDesignEvidence } from './lib/design-artifacts.mjs';
import { capturePaperLayouts, printReviewsForPage } from './lib/design-print.mjs';
import { contextIdentity, resolvedIdentity, navigationOutcome, designCoverage } from './lib/design-crawl.mjs';
import { runArgs, launch, openSide, siteContext, gitInfo } from './lib/lab-run.mjs';
import { compareLayout, settleDesign, takeNextPage, routeFamily } from './lib/design-review.mjs';
import { designStates, designScenarioNames } from './lib/design-scenarios.mjs';
import { renderDesignReport, designArtifactNames } from './lib/design-report.mjs';
import { observeDesign, compareObservations, printDelta } from './lib/design-observations.mjs';

const option = (name, fallback) => process.argv.find(value => value.startsWith('--' + name + '='))?.slice(name.length + 3) ?? fallback;
const help = `Usage: node tools/playwright/gather-design.mjs <registered-slug> [--pages=docs/design-pages.example.json] [--max-pages=20] [--crawl] [--contrast=more] [--motion=reduce] [--motion-matrix] [--forced-colors] [--scheme=dark] [--pdf] [--paper=Letter|A4|both] [--out=path]
Collects compressed .json.gz screen + print evidence, paper-width layout candidates, theme transitions and paired changes. --motion-matrix compares no-preference and reduce on the same document at each selected state. No content save, design verdict, or axe/Lighthouse crawl. The optional curated multivalue scenario submits AJAX add/remove controls only. --crawl only follows same-origin links under explicit crawlPrefixes in --pages. --pdf writes Chromium output for manual print review. Letter is the default; --paper=A4 or --paper=both selects alternatives. Paper-width geometry remains supporting evidence, not exact PDF layout.`;
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
const motionMatrix = process.argv.includes('--motion-matrix');
if (motionMatrix && motion !== 'no-preference') throw new Error('--motion-matrix starts at no-preference; omit --motion=reduce');
const paperOption = option('paper', 'Letter').toLowerCase();
if (!['letter', 'a4', 'both'].includes(paperOption)) throw new Error('--paper must be Letter, A4 or both');
const paperFormats = paperOption === 'both' ? ['A4', 'Letter'] : [paperOption === 'a4' ? 'A4' : 'Letter'];
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
  if (spec.editor !== undefined && typeof spec.editor !== 'boolean') throw new Error('editor must be a boolean');
  if (!['anonymous', 'administrator'].includes(spec.account)) throw new Error('account must be anonymous or administrator');
  const item = { ...spec, path: spec.path || left, beforePath: left, afterPath: right };
  const key = JSON.stringify([left, right, contextIdentity(item)]);
  if (seen.has(key)) { if (discovered) report.coverage.duplicateLinks++; return; } seen.add(key);
  queue.push({ ...item, discovered });
}
for (const spec of manifest.pages) enqueue(spec);
const { browser, environment } = await launch(run); run.browser = browser;
const output = path.join(run.out, 'design'); fs.mkdirSync(output, { recursive: true });
const report = { schema: 'lab-design-observations-3', status: 'DRAFT', slug: run.slug, when: new Date().toISOString(),
  environment, requested: { contrast, reducedMotion: motion, forcedColors: run.forced, colorScheme: run.scheme, motionMatrix, paperFormats, media: ['screen', 'print'] },
  commits: { before: gitInfo(run.v.before.env), after: gitInfo(run.v.after.env) },
  core: run.v.core, patchStacks: { before: run.v.before.patches || [], after: run.v.after.patches || [] },
  coverage: { maxPages, maxElements: limit, crawling: crawl, discoveryLimit: maxPages * 10, visited: 0, rejectedLinks: 0, discoveryCapped: false, queuedNotVisited: 0, duplicateLinks: 0, rejectionReasons: {}, routeFamilies: {} },
  sites: {}, pages: [], themeTransitions: [],
  limitations: ['Initial loads plus explicitly selected multivalue add/remove scenario; no general focus/invalid-state coverage', 'No rule violations inferred from appearance differences',
    'Browser theme hint may be unavailable; negotiation reasons are not instrumented', 'Seed pages first; route-family fair ordering of discovered URLs, not structural template inference',
    'Forced colours and prefers-contrast are browser emulation, not native OS palettes',
    'DOM element limit and CSSOM access gaps are explicit; no full cascade attribution', 'Print geometry is sampled at selected paper widths; CSS @page margins, print fragmentation, PDF page counts and near-empty sheets still need manual review', 'Editor observations separate UI and editable content; no content entry, formatting interaction, or saved frontend rendering',
    'GET navigation does not prove arbitrary contrib routes are side-effect-free; use disposable sites and narrow allowlists'],
};
report.artifacts = designArtifactNames(run.slug, report.when);
const contexts = {};
const previous = {};
const resolved = { before: new Map(), after: new Map() };
const save = () => writeDesignEvidence(path.join(output, report.artifacts.observations), report);
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
const rejected = new Set();
function rejectLink(reason, identity) {
  report.coverage.rejectedLinks++;
  const key = reason + ':' + identity;
  if (rejected.has(key)) return;
  rejected.add(key);
  report.coverage.rejectionReasons[reason] = (report.coverage.rejectionReasons[reason] || 0) + 1;
}
async function measure(page, spec, i, side, state, preference) {
  const measurement = {};
  await page.emulateMedia({ media: 'screen', contrast, reducedMotion: preference });
  measurement.readiness = await settleDesign(page, { editor: !!spec.editor });
  measurement.screen = await observeDesign(page, { limit });
  await page.emulateMedia({ media: 'print', contrast, reducedMotion: preference });
  measurement.printReadiness = await settleDesign(page, { editor: !!spec.editor });
  measurement.print = await observeDesign(page, { limit });
  measurement.printDelta = printDelta(measurement.screen, measurement.print);
  measurement.layoutMediaChanges = compareLayout(measurement.screen, measurement.print);
  measurement.papers = await capturePaperLayouts(page, {
    limit, editor: !!spec.editor, contrast, reducedMotion: preference, formats: paperFormats,
    pdfFile: pdf ? format => {
      const suffix = motionMatrix ? '-motion-' + preference : '';
      const file = `${report.artifacts.runId}-${i + 1}-${side}-${state}${suffix}-${format}.pdf`;
      return { path: path.join(output, file), name: file };
    } : undefined,
  });
  measurement.pdfs = measurement.papers.flatMap(paper => paper.pdf ? [paper.pdf] : []);
  await page.emulateMedia({ media: 'screen', contrast, reducedMotion: motion });
  return measurement;
}

try {
  // Configuration evidence is separate from actual request-theme evidence.
  for (const side of ['before', 'after']) {
    const { envInfo } = await import('../compare/lib.mjs');
    const info = envInfo(run.v[side].env);
    const host = info.hosts.slice().sort((a, b) => a.length - b.length)[0];
    report.sites[side] = { base: 'https://' + host, configuration: siteContext(run.v[side].env) };
  }
  for (let i = 0; queue.length && i < maxPages; i++) {
    const spec = queue.some(value => !value.discovered) ? queue.splice(queue.findIndex(value => !value.discovered), 1)[0] : takeNextPage(queue, report.pages.map(row => row.spec));
    const result = { id: i + 1, spec, paperFormats, sides: {} };
    for (const side of ['before', 'after']) {
      const { page, base } = await ensureContext(side, spec.account);
      const target = spec[side + 'Path'];
      console.log(`${i + 1}/${Math.min(i + queue.length + 1, maxPages)} ${side} ${spec.account} ${target}`);
      const entry = { requestedPath: target };
      try {
        const prior = resolved[side].get(resolvedIdentity(spec, target));
        if (prior) {
          Object.assign(entry, { status: prior.status, statusSource: 'Previous capture; no new request', finalPath: target, duplicateOf: prior, outcome: 'duplicate', notCompared: 'Already captured in this account, context and scenario' });
          result.sides[side] = entry;
          continue;
        }
        await page.emulateMedia({ media: 'screen', contrast, reducedMotion: motion });
        const response = await page.goto(base + target, { waitUntil: 'domcontentloaded', timeout: 30000 });
        entry.status = response?.status() ?? null;
        await page.locator('body').waitFor();
        entry.finalPath = new URL(page.url()).pathname;
        const finalURL = new URL(page.url());
        entry.redirected = entry.finalPath !== target || !!finalURL.search || !!finalURL.hash;
        entry.duplicateOf = resolved[side].get(resolvedIdentity(spec, entry.finalPath)) || null;
        entry.outcome = navigationOutcome(entry);
        if (entry.status == null || entry.status >= 400 || entry.redirected) {
          entry.notCompared = entry.status == null || entry.status >= 400 ? 'HTTP error or missing response' : entry.duplicateOf ? 'Redirected to an already captured page in this account, context and scenario' : 'Redirected; supply the resolved path explicitly for evidence';
        } else {
          entry.states = [];
          for await (const state of designStates(page, spec)) {
            const measurement = state === 'initial' ? entry : { name: state };
            Object.assign(measurement, await measure(page, spec, i, side, state, motion));
            const theme = measurement.screen.context.theme;
            const key = side + ':' + spec.account + ':' + JSON.stringify(spec.context || {});
            if (previous[key] && theme && previous[key].theme !== theme) report.themeTransitions.push({ side, account: spec.account, context: spec.context || {}, from: previous[key], to: { theme, path: target, state } });
            if (theme) previous[key] = { theme, path: target };
            if (motionMatrix) {
              measurement.reducedMotion = await measure(page, spec, i, side, state, 'reduce');
              measurement.preferenceComparisons = {};
              for (const media of ['screen', 'print']) measurement.preferenceComparisons[media] = compareObservations(measurement[media], measurement.reducedMotion[media]);
            }
            if (state !== 'initial') entry.states.push(measurement);
          }
          resolved[side].set(resolvedIdentity(spec, entry.finalPath), { pageId: result.id, path: entry.finalPath, status: entry.status });
          if (crawl) {
            const links = await page.locator('a[href]').evaluateAll(anchors => anchors.map(anchor => anchor.href));
            for (const link of links) {
              let url; try { url = new URL(link); } catch { rejectLink('invalid URL', '[invalid]'); continue; }
              const reason = url.origin !== new URL(base).origin ? 'other origin' : url.search ? 'query string' : url.hash ? 'fragment' : !safePath(url.pathname) ? 'unsafe path' : !allowed(url.pathname) ? 'outside crawl prefixes' : null;
              if (reason) { rejectLink(reason, url.origin + url.pathname); continue; }
              if (seen.size >= maxPages * 10) { report.coverage.discoveryCapped = true; break; }
              enqueue({ path: url.pathname, account: spec.account, context: spec.context || {} }, true);
            }
          }
        }
      } catch (error) { entry.outcome = 'failed'; entry.error = String(error.message).split('\n')[0].replace(/https?:\/\/\S+/g, '[URL]').slice(0, 300); }
      result.sides[side] = entry;
    }
    for (const medium of ['screen', 'print']) {
      const b = result.sides.before[medium], a = result.sides.after[medium];
      if (b && a) { result[medium + 'Comparison'] = compareObservations(b, a); result[medium + 'LayoutComparison'] = compareLayout(b, a); }
      const reducedBefore = result.sides.before.reducedMotion?.[medium], reducedAfter = result.sides.after.reducedMotion?.[medium];
      if (reducedBefore && reducedAfter) { result.reducedMotionComparisons ||= {}; result.reducedMotionComparisons[medium] = compareObservations(reducedBefore, reducedAfter); }
    }
    result.stateComparisons = [];
    for (const name of new Set(['before', 'after'].flatMap(side => (result.sides[side].states || []).map(state => state.name)))) {
      const state = { name };
      for (const media of ['screen', 'print']) {
        const before = result.sides.before.states?.find(value => value.name === name)?.[media];
        const after = result.sides.after.states?.find(value => value.name === name)?.[media];
        if (before && after) state[media + 'Comparison'] = compareObservations(before, after);
        const rb = result.sides.before.states?.find(value => value.name === name)?.reducedMotion?.[media];
        const ra = result.sides.after.states?.find(value => value.name === name)?.reducedMotion?.[media];
        if (rb && ra) { state.reducedMotionComparisons ||= {}; state.reducedMotionComparisons[media] = compareObservations(rb, ra); }
        if (!before || !after) state.notCompared = 'State unavailable on one or both sides';
      }
      result.stateComparisons.push(state);
    }
    result.printReviews = printReviewsForPage(result);
    report.pages.push(result); report.coverage.visited++;
    Object.assign(report.coverage, designCoverage(report.pages)); report.coverage.queuedNotVisited = queue.length;
    const family = routeFamily(spec.path); report.coverage.routeFamilies[family] = (report.coverage.routeFamilies[family] || 0) + 1;
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
const incomplete = measurement => measurement.error || (measurement.notCompared && !measurement.duplicateOf) || (measurement.readiness?.editorExpected && !measurement.readiness.editorReady) || measurement.papers?.some(paper => paper.error || paper.pdfError) || (measurement.reducedMotion && incomplete(measurement.reducedMotion)) || measurement.states?.some(incomplete);
if (report.pages.some(row => Object.values(row.sides).some(incomplete))) process.exitCode = 2;
