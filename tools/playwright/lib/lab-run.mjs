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
//            ([role=alert|status|log], [aria-live]) with its role, politeness and whether the page was still loading; and
//            (speech.changes) after each real click, key press or typing, the text that appeared or changed and how a screen
//            reader user learns of it, "silent" when nothing tells them (lib/recorder.mjs, docs/SILENT-CHANGES.md).
//   jsErrors uncaught page errors (the ResizeObserver loop notice is left out).
// Recorders observe; they do not change what the page does (Drupal.announce is wrapped and passes every call through).
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { chromium, firefox, webkit } from '@playwright/test';
import { summariseAjaxResponse, limitRawCommands, AJAX_URL } from './a11y/drupal-ajax.mjs';
import { labRoot, variants, envInfo, loginPath, envDir, reportsDir } from '../../compare/lib.mjs';
import { runProblems, SCHEMA } from './run-schema.mjs';
import { runBlockReason } from '../../compare/patch-state.mjs';
import { sideState } from '../../compare/contrib-state.mjs';
import { identity, blockMessage, identityRecord } from '../../compare/env-state.mjs';
import { noChangeProblem } from '../../compare/change-under-test.mjs';
import { analyze as cssAnalyze } from '../../compare/css-build.mjs';
import { RECORDER } from './recorder.mjs';
import { silentMarkdown } from './silent-changes.mjs';
import { attachObservability, newRunId } from './observability.mjs';
export { VERDICTS } from './run-schema.mjs';

export const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];
const BROWSERS = { chromium, firefox, webkit };

// --browser, --scheme, --forced-colors, --viewport=WxH, --out=<dir> (default reports/issues/<nid>/playwright/<stamp>-<envTag>).
// --out is for trial runs (scripts/selftest.mjs) that must not add evidence to the issue.
export function runArgs({ slug: defaultSlug, viewport = '1280x900' } = {}) {
  const argv = process.argv.slice(2);
  const opt = (n, d) => { const a = argv.find((x) => x.startsWith(`--${n}=`)); return a ? a.slice(n.length + 3) : d; };
  const browser = opt('browser', 'chromium'), scheme = opt('scheme', 'light'), forced = argv.includes('--forced-colors'), reducedMotion = opt('reduced-motion', 'no-preference');
  if (!['no-preference', 'reduce'].includes(reducedMotion)) throw new Error('--reduced-motion must be reduce or no-preference');
  if (!BROWSERS[browser]) throw new Error('--browser must be chromium, firefox or webkit');
  const [vw, vh] = opt('viewport', viewport).split('x').map(Number);
  const slug = argv.find((a) => !a.startsWith('-')) || defaultSlug;
  const v = variants().find((x) => x.slug === slug);
  if (!v) throw new Error(`variant ${slug} not found`);
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const envTag = `${browser}-${scheme}${forced ? '-forced' : ''}${reducedMotion === 'reduce' ? '-reduced' : ''}-${vw}x${vh}`;
  const out = path.resolve(opt('out', '') || path.join(labRoot, reportsDir(v), 'playwright', `${stamp}-${envTag}`));
  fs.mkdirSync(out, { recursive: true });
  // Observability is opt-in. --observe adds W3C trace context to same-origin document/XHR/fetch requests and writes a
  // browser request catalogue; --playwright-trace also records a Playwright trace zip, which is a different artifact.
  const observe = argv.includes('--observe');
  const playwrightTrace = argv.includes('--playwright-trace');
  const runId = observe ? newRunId(v.slug) : null;
  return { v, slug, browser, scheme, forced, reducedMotion, viewport: { width: vw, height: vh }, envTag, out, observe, playwrightTrace, runId, scenarioId: v.slug };
}

// What each side's patches are, by content (tools/compare/patch-state.mjs). Recorded in every run; a run does not start on a mismatch.
export const sidePatchStates = (v) => Object.fromEntries(['before', 'after'].map((side) => [side, sideState(envDir(v[side].env), labRoot, v[side].patches || [], { modules: v.contrib || [], patches: v[side].contribPatches || [] })]));

export async function launch(a) {
  const none = noChangeProblem(a.v); if (none) throw new Error(`BLOCKED: ${none}.`);
  const ps = sidePatchStates(a.v), blocked = runBlockReason(ps, a.v.slug, { before: a.v.before.env, after: a.v.after.env });
  if (blocked) throw new Error(blocked);
  const idn = identity(a.v, { labRoot, envDir });   // common base, pinned commit, recipe: observed against what the variant asks for
  if (idn.problems.length) throw new Error(blockMessage(idn));
  if (ps.after.outside && ps.after.outside.length) console.warn(`WARNING: tracked files changed outside the patches in ${a.v.after.env}: ${ps.after.outside.slice(0, 6).join(', ')}${ps.after.outside.length > 6 ? ', ...' : ''}. The run goes ahead and records them in results.json (patchState.after.outside).`);
  for (const side of ['before', 'after']) if (ps[side].state === 'unverified') console.warn(`WARNING: the ${side} environment's patches are recorded by name only, not by content; run \`node tools/compare/setup.mjs ${a.v.slug}\` once to verify and record them.`);
  // Is the generated CSS the browser will load the CSS the patch's PostCSS source produces? Read-only; a mismatch is stated, not repaired, and the run goes on.
  try {
    const css = cssAnalyze({ slug: a.v.slug, side: 'after', mode: 'host', install: false });
    a.cssBuild = css.relevant ? { overall: css.overall, files: css.entries.map((e) => ({ source: e.source, state: e.state, origin: e.origin })) } : { overall: 'SKIPPED', files: [] };
    if (css.relevant && css.overall !== 'PASS') console.warn(`WARNING: CSS build ${css.overall} for ${a.v.slug} (After): ${css.entries.filter((e) => e.result !== 'PASS').map((e) => `${path.basename(e.source)} ${e.state}`).join(', ') || css.notes.join(' ')}. The browser may not be testing the CSS this patch's source produces, so this run does not validate the submitted patch. Details: node scripts/css-build.mjs ${a.v.slug}`);
  } catch (e) { a.cssBuild = { overall: 'NOT VERIFIED', files: [], error: String(e.message).slice(0, 160) }; }
  const b = await BROWSERS[a.browser].launch({ handleSIGINT: false, handleSIGTERM: false, handleSIGHUP: false, ...(a.executablePath ? { executablePath: a.executablePath } : {}) });   // executablePath: tree-diff.mjs --chromium=
  const environment = { browser: a.browser, browserVersion: b.version(), colorScheme: a.scheme, forcedColors: a.forced, reducedMotion: a.reducedMotion || 'no-preference', viewport: a.viewport, os: `${process.platform} ${process.arch}` };
  return { browser: b, environment };
}

export const gitInfo = (env) => { try { return execFileSync('git', ['-C', envDir(env), 'log', '-1', '--format=%h %cs'], { encoding: 'utf8' }).trim(); } catch { return 'unknown'; } };

export function siteContext(env) {
  const r = spawnSync('ddev', ['exec', 'php'], { cwd: envDir(env), input: fs.readFileSync(new URL('./site-context.php', import.meta.url)), encoding: 'utf8', timeout: 60000 });
  const line = (r.stdout || '').trim().split('\n').pop();
  try { return JSON.parse(line); } catch { return { error: `site context not read: ${(r.stderr || r.stdout || 'no output').trim().split('\n')[0]}` }; }
}

// Runs in every page before its own scripts: lib/recorder.mjs.

// AJAX commands are summarised by lib/a11y/drupal-ajax.mjs, shared with the checkpoint integration.

// Open one side: a fresh browser context with the recorders, logged in with a one-time link.
export async function openSide(run, side) {
  const spec = run.v[side];
  const info = envInfo(spec.env);
  const host = info.hosts.slice().sort((a, b) => a.length - b.length)[0];
  const base = `https://${host}`;
  const ctx = await run.browser.newContext({ viewport: run.viewport, colorScheme: run.scheme, forcedColors: run.forced ? 'active' : 'none', reducedMotion: run.reducedMotion || 'no-preference', ignoreHTTPSErrors: true });
  await ctx.addInitScript(RECORDER);
  const changes = [];   // changes after input arrive as each action's window ends, from every page of this side
  await ctx.exposeBinding('__labReport', (source, record) => { changes.push(record); });
  const page = await ctx.newPage();
  const obs = run.observe ? attachObservability({ context: ctx, page, base, side, environmentId: spec.env, scenarioId: run.scenarioId, runId: run.runId }) : null;
  if (run.playwrightTrace) await ctx.tracing.start({ screenshots: true, snapshots: true, sources: false });
  const rec = { side, env: spec.env, host, commit: gitInfo(spec.env), site: siteContext(spec.env), pages: [], ajax: [], speech: { announce: [], live: [], changes }, jsErrors: [], observability: obs ? obs.trace : null };
  const raw = []; const waits = [];
  page.on('pageerror', (e) => { const m = String(e.message); if (!/ResizeObserver loop/.test(m)) rec.jsErrors.push(m); });
  page.on('response', (r) => {
    const u = r.url(); if (!AJAX_URL.test(u)) return;
    waits.push(r.json().then((cmds) => {
      if (!Array.isArray(cmds)) return;
      const summary = summariseAjaxResponse(u, r.status(), cmds);
      rec.ajax.push(summary);
      raw.push({ url: summary.url, status: summary.status, commands: limitRawCommands(cmds) });
    }).catch(() => {}));
  });
  page.on('load', () => { waits.push(pageContext(page).then((c) => rec.pages.push(c)).catch(() => {})); });
  // Collect what the recorders saw so far (call before closing, and whenever a snapshot is wanted).
  rec.collect = async () => {
    await Promise.all(waits.splice(0));
    try { await page.evaluate(() => window.__lab.flush()); const s = await page.evaluate(() => window.__lab); rec.speech.announce.push(...s.announce.splice(0)); rec.speech.live.push(...s.live.splice(0)); rec.speech.changes.push(...(s.changes || []).splice(0)); await page.evaluate(() => { window.__lab.announce.length = 0; window.__lab.live.length = 0; window.__lab.changes.length = 0; }); } catch { /* page gone */ }
    return rec;
  };
  rec.close = async (out) => {
    await rec.collect();
    if (obs) rec.observability = await obs.flush(path.join(out, `observability-${side}.json`));
    if (run.playwrightTrace) { const file = path.join(out, `playwright-trace-${side}.zip`); await ctx.tracing.stop({ path: file }); rec.playwrightTrace = path.basename(file); }
    fs.writeFileSync(path.join(out, `ajax-${side}.json`), JSON.stringify(raw, null, 2));
    await ctx.close();
    delete rec.collect; delete rec.close; return rec;
  };
  await page.goto(base + loginPath(spec.env));
  await page.waitForLoadState('load');
  await Promise.all(waits.splice(0));
  if (!rec.pages.length) rec.pages.push(await pageContext(page));
  return { page, base, rec, obs };
}

export const pageContext = (page) => page.evaluate(() => ({
  path: location.pathname, theme: window.drupalSettings?.labActiveTheme ?? window.drupalSettings?.ajaxPageState?.theme ?? null,
  lang: document.documentElement.lang || null, dir: document.documentElement.dir || null, title: document.title,
}));

// axe on the page as it is now. The no-argument shape is unchanged for every existing evaluator; the options are the
// checkpoint-aware extension (component scope, rule lists, best practice, tags) and the compact report still keeps at
// most ten nodes a rule. Complete engine output is available with axeScanFull() for evidence files.
export async function axeScan(page, options = {}) {
  const { runAxe } = await import('./a11y/axe-engine.mjs');
  const r = await runAxe(page, {
    tags: options.tags || TAGS, rules: options.rules, include: options.include, exclude: options.exclude,
    bestPractice: options.bestPractice === true, nodes: 10, raw: false, resultTypes: ['violations'],
  }, { nodes: 10 });
  const c = r.compact;
  return {
    total: c.total,
    rules: c.rules,
    violations: (c.violations || []).map((v) => ({ id: v.id, impact: v.impact, help: v.help, helpUrl: v.helpUrl, tags: (v.tags || []).filter((t) => /^wcag\d/.test(t)), wcag: v.wcag || [], nodes: (v.nodes || []).slice(0, 10).map((n) => ({ target: n.target, targetTree: n.targetTree, framePath: n.framePath, html: n.html.slice(0, 300) })) })),
    url: page.url().replace(/^https?:\/\/[^/]+/, ''),
    incomplete: (c.incomplete || []).map((v) => ({ id: v.id, impact: v.impact, nodes: (v.nodes || []).slice(0, 10).map((n) => ({ target: n.target, html: n.html.slice(0, 300) })) })),
    incompleteTotal: c.incompleteTotal,
    engineVersion: r.engine.version,
    execution: r.execution,
  };
}

// The complete axe results for persistence as raw evidence (checkpoint capture uses this through capture.mjs).
export async function axeScanFull(page, options = {}) {
  const { runAxe } = await import('./a11y/axe-engine.mjs');
  return runAxe(page, { ...options, raw: true }, { nodes: options.nodes });
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
  if (results.cssBuild && results.cssBuild.overall !== 'SKIPPED') md += `\nCSS build of the After patch stack (core's build:css, separate from accessibility results): **${results.cssBuild.overall}**${results.cssBuild.overall === 'PASS' ? '' : ': the browser may not be loading the CSS this patch\'s PostCSS source produces, so this run does not validate the submitted patch'}.\n`;
  if (results.observability?.enabled) md += `\nObservability: **enabled** for this run (\`${results.observability.run_id}\`). Browser requests carry a W3C traceparent; the Drupal execution evidence is added after collection with \`node tools/observability/cli.mjs collect <slug> --run <this directory>\`.\n`;
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
  return md + '\n' + silentMarkdown(results);
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
  return { variant: run.v.slug, issue: run.v.issue, when: new Date().toISOString(), environment, core: run.v.core, patches: run.v.after.patches || [], patchState: sidePatchStates(run.v), identity: identityRecord(identity(run.v, { labRoot, envDir })), commits: { before: gitInfo(run.v.before.env), after: gitInfo(run.v.after.env) }, cssBuild: run.cssBuild || null, observability: { enabled: !!run.observe, run_id: run.runId, scenario_id: run.scenarioId, playwright_trace: !!run.playwrightTrace }, sides: {} };
}
