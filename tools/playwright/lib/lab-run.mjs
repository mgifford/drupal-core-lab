// Shared parts of a lab run (evaluate-<nid>.mjs scripts): arguments, where output goes, opening a side with recorders,
// the context of every run, axe, and a results.json with one shape that scripts/coverage.mjs and scripts/selftest.mjs can read.
//
// What every side records without the issue script asking:
//   site     server side (tools/playwright/lib/site-context.php, piped into the container): PHP, Drupal, profile, default and
//            admin theme, enabled modules and themes, languages. Read-only.
//   pages    every page loaded: path, the theme that rendered it (drupalSettings.ajaxPageState.theme), lang, dir.
//   ajax     every Drupal AJAX response: its commands, summarised (command, method, selector, message type and text, size).
//            The raw commands go to ajax-<side>.json next to the summary.
//   speech   every Drupal.announce() call (text, priority), and every change of text inside a live region
//            ([role=alert|status|log], [aria-live]) with its role, politeness and whether the page was still loading.
//   jsErrors uncaught page errors (the ResizeObserver loop notice is left out).
// Recorders observe; they do not change what the page does (Drupal.announce is wrapped and passes every call through).
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { chromium, firefox, webkit } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { labRoot, variants, envInfo, loginPath, envDir } from '../../compare/lib.mjs';
import { runProblems, SCHEMA } from './run-schema.mjs';
import { patchState, runBlockReason } from '../../compare/patch-state.mjs';
import { identity, blockMessage, identityRecord } from '../../compare/env-state.mjs';
export { VERDICTS } from './run-schema.mjs';

export const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];
const BROWSERS = { chromium, firefox, webkit };

// --browser, --scheme, --forced-colors, --viewport=WxH, --out=<dir> (default reports/issues/<nid>/playwright/<stamp>-<envTag>).
// --out is for trial runs (scripts/selftest.mjs) that must not add evidence to the issue.
export function runArgs({ slug: defaultSlug, viewport = '1280x900' } = {}) {
  const argv = process.argv.slice(2);
  const opt = (n, d) => { const a = argv.find((x) => x.startsWith(`--${n}=`)); return a ? a.slice(n.length + 3) : d; };
  const browser = opt('browser', 'chromium'), scheme = opt('scheme', 'light'), forced = argv.includes('--forced-colors');
  if (!BROWSERS[browser]) throw new Error('--browser must be chromium, firefox or webkit');
  const [vw, vh] = opt('viewport', viewport).split('x').map(Number);
  const slug = argv.find((a) => !a.startsWith('-')) || defaultSlug;
  const v = variants().find((x) => x.slug === slug);
  if (!v) throw new Error(`variant ${slug} not found`);
  const envTag = `${browser}-${scheme}${forced ? '-forced' : ''}-${vw}x${vh}`;
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const out = path.resolve(opt('out', '') || path.join(labRoot, 'reports/issues', v.issue, 'playwright', `${stamp}-${envTag}`));
  fs.mkdirSync(out, { recursive: true });
  return { v, slug, browser, scheme, forced, viewport: { width: vw, height: vh }, envTag, out };
}

// What each side's patches are, by content (tools/compare/patch-state.mjs). Recorded in every run; a run does not start on a mismatch.
export const sidePatchStates = (v) => ({ before: patchState(envDir(v.before.env), labRoot, v.before.patches || []), after: patchState(envDir(v.after.env), labRoot, v.after.patches || []) });

export async function launch(a) {
  const ps = sidePatchStates(a.v), blocked = runBlockReason(ps, a.v.slug, { before: a.v.before.env, after: a.v.after.env });
  if (blocked) throw new Error(blocked);
  const idn = identity(a.v, { labRoot, envDir });   // common base, pinned commit, recipe: observed against what the variant asks for
  if (idn.problems.length) throw new Error(blockMessage(idn));
  if (ps.after.outside && ps.after.outside.length) console.warn(`WARNING: tracked files changed outside the patches in ${a.v.after.env}: ${ps.after.outside.slice(0, 6).join(', ')}${ps.after.outside.length > 6 ? ', ...' : ''}. The run goes ahead and records them in results.json (patchState.after.outside).`);
  for (const side of ['before', 'after']) if (ps[side].state === 'unverified') console.warn(`WARNING: the ${side} environment's patches are recorded by name only, not by content; run \`node tools/compare/setup.mjs ${a.v.slug}\` once to verify and record them.`);
  const b = await BROWSERS[a.browser].launch({ handleSIGINT: false, handleSIGTERM: false, handleSIGHUP: false });
  const environment = { browser: a.browser, browserVersion: b.version(), colorScheme: a.scheme, forcedColors: a.forced, viewport: a.viewport, os: `${process.platform} ${process.arch}` };
  return { browser: b, environment };
}

export const gitInfo = (env) => { try { return execFileSync('git', ['-C', envDir(env), 'log', '-1', '--format=%h %cs'], { encoding: 'utf8' }).trim(); } catch { return 'unknown'; } };

export function siteContext(env) {
  const r = spawnSync('ddev', ['exec', 'php'], { cwd: envDir(env), input: fs.readFileSync(new URL('./site-context.php', import.meta.url)), encoding: 'utf8', timeout: 60000 });
  const line = (r.stdout || '').trim().split('\n').pop();
  try { return JSON.parse(line); } catch { return { error: `site context not read: ${(r.stderr || r.stdout || 'no output').trim().split('\n')[0]}` }; }
}

// Runs in every page before its own scripts.
const RECORDER = () => {
  const speech = { announce: [], live: [] };
  Object.defineProperty(window, '__lab', { value: speech });
  const hook = (d) => {
    if (!d || typeof d !== 'object' || d.__labHooked) return;
    let real;
    Object.defineProperty(d, '__labHooked', { value: true });
    Object.defineProperty(d, 'announce', {
      configurable: true,
      set(fn) { real = fn; },
      get() { return real && function (text, priority) { speech.announce.push({ t: Math.round(performance.now()), text: String(text), priority: priority || 'polite' }); return real.apply(this, arguments); }; },
    });
  };
  let D;
  Object.defineProperty(window, 'Drupal', { configurable: true, get() { return D; }, set(d) { D = d; hook(d); } });
  const SEL = '[role=alert],[role=status],[role=log],[aria-live]:not([aria-live=off])';
  const pending = new Set(); let queued = false;
  const flush = () => {
    queued = false;
    for (const r of pending) {
      const text = (r.textContent || '').replace(/\s+/g, ' ').trim();
      if (text && text !== r.__labLast) speech.live.push({ t: Math.round(performance.now()), role: r.getAttribute('role'), ariaLive: r.getAttribute('aria-live'), id: r.id || null, cls: (r.className && String(r.className).slice(0, 80)) || null, loading: document.readyState !== 'complete', text: text.slice(0, 400) });
      r.__labLast = text;
    }
    pending.clear();
  };
  new MutationObserver((ms) => {
    for (const m of ms) for (const n of [m.target, ...m.addedNodes]) {
      const el = n.nodeType === 1 ? n : n.parentElement; if (!el || !el.closest) continue;
      for (const r of [el.closest(SEL), ...(el.querySelectorAll ? el.querySelectorAll(SEL) : [])]) if (r && r.id !== 'drupal-live-announce') pending.add(r);
    }
    if (!queued && pending.size) { queued = true; queueMicrotask(flush); }
  }).observe(document, { childList: true, subtree: true, characterData: true });
};

const strip = (s) => String(s ?? '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
const summarise = (c) => ({
  command: c.command, method: c.method ?? null, selector: c.selector ?? null,
  messageWrapperQuerySelector: c.messageWrapperQuerySelector ?? null, clearPrevious: c.clearPrevious ?? null,
  messageType: c.messageOptions?.type ?? null, message: c.message != null ? strip(c.message).slice(0, 300) : null,
  dataBytes: typeof c.data === 'string' ? c.data.length : null,
  dataLiveRoles: typeof c.data === 'string' ? [...new Set([...c.data.matchAll(/role="(alert|status|log)"|aria-live="(polite|assertive)"/g)].map((m) => m[1] || m[2]))] : [],
});

// Open one side: a fresh browser context with the recorders, logged in with a one-time link.
export async function openSide(run, side) {
  const spec = run.v[side];
  const info = envInfo(spec.env);
  const host = info.hosts.slice().sort((a, b) => a.length - b.length)[0];
  const base = `https://${host}`;
  const ctx = await run.browser.newContext({ viewport: run.viewport, colorScheme: run.scheme, forcedColors: run.forced ? 'active' : 'none', ignoreHTTPSErrors: true });
  await ctx.addInitScript(RECORDER);
  const page = await ctx.newPage();
  const rec = { side, env: spec.env, host, commit: gitInfo(spec.env), site: siteContext(spec.env), pages: [], ajax: [], speech: { announce: [], live: [] }, jsErrors: [] };
  const raw = []; const waits = [];
  page.on('pageerror', (e) => { const m = String(e.message); if (!/ResizeObserver loop/.test(m)) rec.jsErrors.push(m); });
  page.on('response', (r) => {
    const u = r.url(); if (!/_wrapper_format=drupal_ajax|ajax_form=1|element_parents=/.test(u)) return;
    waits.push(r.json().then((cmds) => {
      if (!Array.isArray(cmds)) return;
      const p = new URL(u); const where = p.pathname + (p.search ? '?' + [...new Set(p.searchParams.keys())].join('&') : '');
      rec.ajax.push({ url: where, status: r.status(), commands: cmds.map(summarise) });
      raw.push({ url: where, status: r.status(), commands: cmds.map((c) => (typeof c.data === 'string' && c.data.length > 20000 ? { ...c, data: c.data.slice(0, 20000) + '…(cut)' } : c)) });
    }).catch(() => {}));
  });
  page.on('load', () => { waits.push(pageContext(page).then((c) => rec.pages.push(c)).catch(() => {})); });
  // Collect what the recorders saw so far (call before closing, and whenever a snapshot is wanted).
  rec.collect = async () => {
    await Promise.all(waits.splice(0));
    try { const s = await page.evaluate(() => window.__lab); rec.speech.announce.push(...s.announce.splice(0)); rec.speech.live.push(...s.live.splice(0)); await page.evaluate(() => { window.__lab.announce.length = 0; window.__lab.live.length = 0; }); } catch { /* page gone */ }
    return rec;
  };
  rec.close = async (out) => { await rec.collect(); fs.writeFileSync(path.join(out, `ajax-${side}.json`), JSON.stringify(raw, null, 2)); await ctx.close(); delete rec.collect; delete rec.close; return rec; };
  await page.goto(base + loginPath(spec.env));
  await page.waitForLoadState('load');
  await Promise.all(waits.splice(0));
  if (!rec.pages.length) rec.pages.push(await pageContext(page));
  return { page, base, rec };
}

export const pageContext = (page) => page.evaluate(() => ({
  path: location.pathname, theme: window.drupalSettings?.ajaxPageState?.theme ?? null,
  lang: document.documentElement.lang || null, dir: document.documentElement.dir || null, title: document.title,
}));

export async function axeScan(page) {
  const r = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  return {
    total: r.violations.reduce((n, x) => n + x.nodes.length, 0),
    rules: Object.fromEntries(r.violations.map((x) => [x.id, x.nodes.length])),
    violations: r.violations.map((x) => ({ id: x.id, impact: x.impact, help: x.help, helpUrl: x.helpUrl, tags: x.tags.filter((t) => /^wcag\d/.test(t)), nodes: x.nodes.slice(0, 10).map((n) => ({ target: n.target.join(' '), html: n.html.slice(0, 300) })) })),
    url: page.url().replace(/^https?:\/\/[^/]+/, ''),
  };
}

// ---- Markdown sections every run summary carries
const list = (a) => (a && a.length ? a.join(', ') : 'none');
export function contextMarkdown(results) {
  const B = results.sides.before, A = results.sides.after;
  const themes = (s) => [...new Set(s.pages.map((p) => `${p.path} → ${p.theme}`))].join('<br>') || 'none recorded';
  const onlyIn = (x, y) => (x.site.modules || []).filter((m) => !(y.site.modules || []).includes(m));
  let md = `## Context\n\n| | Before | After |\n|---|---|---|\n`;
  md += `| Core commit | \`${B.commit}\` | \`${A.commit}\` |\n| Drupal, PHP | ${B.site.drupal}, ${B.site.php} | ${A.site.drupal}, ${A.site.php} |\n`;
  md += `| Profile; default / admin theme (config) | ${B.site.profile}; ${B.site.theme?.default} / ${B.site.theme?.admin} | ${A.site.profile}; ${A.site.theme?.default} / ${A.site.theme?.admin} |\n`;
  md += `| Theme that rendered each page | ${themes(B)} | ${themes(A)} |\n| Languages (default) | ${list(B.site.languages)} (${B.site.defaultLangcode}) | ${list(A.site.languages)} (${A.site.defaultLangcode}) |\n`;
  md += `| Modules only on this side | ${list(onlyIn(B, A))} | ${list(onlyIn(A, B))} |\n| Enabled modules | ${(B.site.modules || []).length} | ${(A.site.modules || []).length} |\n`;
  for (const s of [B, A]) if (s.site.error || s.site.dbError) md += `\n${s.side}: ${s.site.error || s.site.dbError}\n`;
  return md + '\n';
}
export function ajaxMarkdown(results) {
  let md = `## AJAX responses\n\nEvery Drupal AJAX response, in order; raw commands in \`ajax-before.json\` and \`ajax-after.json\`.\n\n`;
  for (const s of ['before', 'after']) {
    const calls = results.sides[s].ajax;
    md += `**${s === 'before' ? 'Before' : 'After'}** (${calls.length} response${calls.length === 1 ? '' : 's'})\n\n`;
    for (const c of calls) md += `- \`${c.url}\` ${c.status}: ${c.commands.map((x) => x.command + (x.method ? `:${x.method}` : '') + (x.messageType ? `(${x.messageType} → ${x.messageWrapperQuerySelector || 'default'})` : '') + (x.dataLiveRoles.length ? ` [markup has ${x.dataLiveRoles.join('/')}]` : '')).join(', ')}\n`;
    md += '\n';
  }
  return md;
}
export function speechMarkdown(results) {
  let md = `## What could be announced\n\n\`Drupal.announce()\` calls, and text changes inside live regions (role alert/status/log or aria-live). A recorded change is not proof that a screen reader spoke it; see the screen-reader run for that.\n\n| Side | Source | Politeness | Text |\n|---|---|---|---|\n`;
  for (const s of ['before', 'after']) {
    const sp = results.sides[s].speech; let n = 0;
    for (const a of sp.announce) { n++; md += `| ${s} | Drupal.announce | ${a.priority} | ${strip(a.text).slice(0, 160)} |\n`; }
    for (const l of sp.live) { if (l.loading) continue; n++; md += `| ${s} | live region ${l.role ? `role=${l.role}` : ''}${l.ariaLive ? ` aria-live=${l.ariaLive}` : ''} | ${l.ariaLive || (l.role === 'alert' ? 'assertive (role)' : 'polite (role)')} | ${l.text.slice(0, 160)} |\n`; }
    if (!n) md += `| ${s} | none | | |\n`;
  }
  return md + '\n';
}

// results.json with the fields scripts/coverage.mjs and selftest.mjs rely on (checked by run-schema.mjs). Throws if one is missing.
export function writeRun(run, results, md) {
  const problems = runProblems(results);
  if (problems.length) throw new Error(`results.json is incomplete: ${problems.join('; ')}`);
  results.schema = SCHEMA;
  fs.writeFileSync(path.join(run.out, 'results.json'), JSON.stringify(results, null, 2));
  fs.writeFileSync(path.join(run.out, 'SUMMARY.md'), md);
  return path.relative(labRoot, run.out) || run.out;
}

export function baseResults(run, environment) {
  return { variant: run.v.slug, issue: run.v.issue, when: new Date().toISOString(), environment, core: run.v.core, patches: run.v.after.patches || [], patchState: sidePatchStates(run.v), identity: identityRecord(identity(run.v, { labRoot, envDir })), commits: { before: gitInfo(run.v.before.env), after: gitInfo(run.v.after.env) }, sides: {} };
}
