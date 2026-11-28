// Deterministic replay of a scenario file (scenarios/**, schema lab-a11y-scenario/1) against Before and After.
//
//   node tools/playwright/scenario-run.mjs <scenario> [<slug>] [--side=both|before|after] [--out=<dir>]
//        [--browser=chromium|firefox|webkit] [--scheme=light|dark] [--forced-colors] [--viewport=WxH]
//        [--check] [--json]
//
//   <scenario>  a path in scenarios/ (or a bare file name/id resolved there)
//   <slug>      a registered variant in tools/compare/variants.json, or an issue number resolved with
//               resolveVariant(); when omitted the scenario's own `variant` is used
//
// `--check` validates the scenario file and the variant/report paths with no browser, no Playwright launch
// and no DDEV call. Exit 0 when the file would run, 1 when it would not. This is what tests/lab/a11y-scenario.test.mjs
// runs for every scenario.
//
// Without --check, the scenario is replayed with lib/lab-run.mjs: runArgs → launch → openSide per side →
// runScenario() → captureCheckpoint() per named checkpoint → compareScenario() → writeRun(). Results go to the
// variant's reports directory (results.json + SUMMARY.md keep the shape run-schema.mjs checks), and each side's
// checkpoint session is written under <reports>/checkpoints/<stamp>-<scenario-id>-<side>/ by SessionStore.
// With --side=before or --side=after only that side runs. run-schema.mjs requires both sides, so a one-sided
// replay writes SUMMARY.md and results-partial.json but NOT results.json, and the summary says plainly that no
// Before/After comparison was made; scripts/coverage.mjs never counts it as a comparison run.
//
// WHAT WAS EXERCISED: `--check` and the pure tests are the verified paths. The browser path was run once,
// partially: the Before side of one scenario captured its checkpoints against a real DDEV site, then the
// matching After side could not start in the writing session's sandbox (ddev could not read ~/.ddev), so the
// run stopped with exit 3 and wrote no results.json. A complete Before/After replay has therefore NOT been
// observed end to end. A run refused by a missing environment stops with the exact command instead of
// writing a fake result.
//
// Never pushes, never posts, never edits a patch file.
import fs from 'node:fs';
import path from 'node:path';
import { labRoot, reportsDir, resolveVariant, variants } from '../../tools/compare/lib.mjs';
import { SCENARIO_SCHEMA, validateScenario, runScenario, compareScenario, scenarioSummaryMarkdown } from './lib/a11y/scenario.mjs';

const USAGE = `Usage: node tools/playwright/scenario-run.mjs <scenario> [<slug>] [--side=both|before|after] [--out=<dir>] [--browser=] [--scheme=] [--forced-colors] [--viewport=WxH] [--check] [--json]`;

function parseArgs(argv) {
  const flags = { check: false, json: false, forcedColors: false, side: 'both', out: null, browser: null, scheme: null, viewport: null };
  const positional = [];
  for (const arg of argv) {
    if (!arg.startsWith('-')) { positional.push(arg); continue; }
    const eq = arg.indexOf('=');
    const name = eq === -1 ? arg.slice(2) : arg.slice(2, eq);
    const value = eq === -1 ? null : arg.slice(eq + 1);
    if (name === 'check') flags.check = true;
    else if (name === 'json') flags.json = true;
    else if (name === 'forced-colors') flags.forcedColors = true;
    else if (['side', 'out', 'browser', 'scheme', 'viewport'].includes(name)) {
      if (value == null || value === '') throw new Error(`--${name} needs a value`);
      flags[name === 'forced-colors' ? 'forcedColors' : name] = value;
    } else throw new Error(`unknown option --${name}\n${USAGE}`);
  }
  if (!['both', 'before', 'after'].includes(flags.side)) throw new Error('--side must be both, before or after');
  return { flags, positional };
}

// A scenario given as a path in scenarios/, a path relative to the repository root, or a bare name/id.
function resolveScenarioPath(input) {
  const candidates = [];
  const scenariosRoot = path.join(labRoot, 'scenarios');
  if (input.includes('/') || input.endsWith('.json')) {
    candidates.push(path.resolve(process.cwd(), input), path.join(labRoot, input), path.join(scenariosRoot, input));
  } else {
    const wanted = input.endsWith('.json') ? input : `${input}.json`;
    const walk = (dir, depth) => {
      if (depth > 4 || !fs.existsSync(dir)) return;
      for (const entry of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(full, depth + 1);
        else if (entry.name === wanted) candidates.push(full);
        else if (entry.name.endsWith('.json')) {
          try {
            const data = JSON.parse(fs.readFileSync(full, 'utf8'));
            if (data && data.id === input) candidates.push(full);
          } catch { /* a broken file is reported when it is the chosen scenario, not here */ }
        }
      }
    };
    walk(scenariosRoot, 0);
  }
  const found = candidates.find((file) => fs.existsSync(file));
  if (!found) throw new Error(`scenario ${input} was not found under scenarios/ (pass a path or a scenario id)`);
  return found;
}

function readScenario(file) {
  let data;
  try { data = JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch (error) { throw new Error(`${path.relative(labRoot, file)} is not valid JSON: ${String(error.message).split('\n')[0]}`); }
  return data;
}

function scenarioLabel(data) {
  return `scenario ${data && data.id ? data.id : '(no id)'}`;
}

// --check: the scenario file, the variant, and the directory the evidence would go to. No browser, no DDEV.
function checkScenario({ scenario, file, slugArg }) {
  const problems = [];
  const notes = [];
  const validation = validateScenario(scenario);
  problems.push(...validation.problems);
  const slug = slugArg || scenario.variant || null;
  let variant = null;
  if (!slug) {
    notes.push('no variant is named by the scenario or on the command line, so no Before/After pair can be resolved; --check only validates the scenario file');
  } else {
    if (scenario.variant && slug !== scenario.variant) problems.push(`the scenario names variant "${scenario.variant}" but "${slug}" was given; use the scenario's variant or update the scenario`);
    const resolved = resolveVariant(slug, variants());
    if (resolved.error) {
      problems.push(`${resolved.error} A scenario cannot run against an unregistered environment, and no fake result is written.`);
      notes.push(`register the variant first: node scripts/new-issue.mjs <issue> --branch <fork-branch> (docs/NEW-ISSUE.md), or use a registered slug`);
    } else {
      variant = resolved.v;
      if (resolved.note) notes.push(resolved.note);
      const dir = path.join(labRoot, reportsDir(variant));
      if (!fs.existsSync(dir)) {
        problems.push(`the variant's evidence directory ${reportsDir(variant)} does not exist, so a run would have nowhere to write its results`);
        notes.push(`scaffold the issue first: node scripts/new-issue.mjs ${variant.issue || '<issue>'} --branch <fork-branch> (docs/NEW-ISSUE.md)`);
      } else notes.push(`evidence would be written under ${reportsDir(variant)}/`);
      for (const side of ['before', 'after']) {
        const env = variant[side] && variant[side].env;
        if (!env) { problems.push(`variant ${variant.slug} has no ${side}.env entry`); continue; }
        if (!fs.existsSync(path.join(labRoot, 'envs', env, '.ddev', 'config.yaml'))) {
          // An unbuilt environment stops the browser run with the command below, but it does not make the
          // scenario file invalid: --check says what to run next and exits 0.
          notes.push(`the ${side} environment (${env}) has not been built; build both sides before replaying: node tools/compare/setup.mjs ${variant.slug}`);
        }
      }
    }
  }
  return { ok: problems.length === 0, file: path.relative(labRoot, file) || file, scenario: scenario.id, schema: scenario.schema, variant: variant ? variant.slug : null, problems, notes };
}

// runArgs reads process.argv and takes the first non-flag argument as the slug, but our first positional is the
// scenario path. The browser path below hides the scenario argument while runArgs reads the flags, then restores
// argv. It is imported lazily so --check never loads Playwright.

// Kept in one place so the dynamic import happens only on the browser path.
let labRunPromise = null;
async function loadLabRun() {
  labRunPromise = labRunPromise || import('./lib/lab-run.mjs');
  return labRunPromise;
}

function effectiveEnvironment(scenario, flags) {
  const [w, h] = String(flags.viewport || `${scenario.viewport.width}x${scenario.viewport.height}`).split('x').map(Number);
  return {
    browser: flags.browser || scenario.browser,
    scheme: flags.scheme || scenario.colourScheme,
    forced: flags.forcedColors || scenario.forcedColors,
    reducedMotion: scenario.reducedMotion,
    viewport: `${Number.isFinite(w) && w > 0 ? w : scenario.viewport.width}x${Number.isFinite(h) && h > 0 ? h : scenario.viewport.height}`,
  };
}

async function main() {
  const { flags, positional } = parseArgs(process.argv.slice(2));
  if (!positional.length) throw new Error(USAGE);
  if (positional.length > 2) throw new Error(`expected <scenario> and at most one <slug>, got: ${positional.join(' ')}\n${USAGE}`);

  const file = resolveScenarioPath(positional[0]);
  const scenario = readScenario(file);
  const scenarioRel = path.relative(labRoot, file);

  if (flags.check) {
    const report = checkScenario({ scenario, file, slugArg: positional[1] || null });
    if (flags.json) console.log(JSON.stringify(report, null, 2));
    else {
      console.log(`${report.ok ? 'OK' : 'FAIL'}: ${scenarioLabel(scenario)} (${report.file})`);
      for (const note of report.notes) console.log(`  note: ${note}`);
      for (const problem of report.problems) console.log(`  problem: ${problem}`);
      if (report.ok && report.variant) console.log(`  ready to replay: node tools/playwright/scenario-run.mjs ${report.file} ${report.variant}`);
      else if (report.ok) console.log(`  no variant is registered yet; replay becomes possible once one is: node tools/playwright/scenario-run.mjs ${report.file} <slug>`);
    }
    process.exit(report.ok ? 0 : 1);
  }

  const validation = validateScenario(scenario);
  if (!validation.ok) {
    console.error(`FAIL: ${scenarioRel} is not a valid ${SCENARIO_SCHEMA} scenario:`);
    for (const problem of validation.problems) console.error(`  - ${problem}`);
    process.exit(1);
  }
  const slugArg = positional[1] || scenario.variant || null;
  if (!slugArg) {
    console.error(`FAIL: name the variant to replay against, for example: node tools/playwright/scenario-run.mjs ${scenarioRel} 3419891-pinned`);
    process.exit(2);
  }
  if (scenario.variant && scenario.variant !== slugArg) {
    console.error(`FAIL: the scenario names variant "${scenario.variant}" but "${slugArg}" was given.`);
    process.exit(2);
  }
  const resolved = resolveVariant(slugArg, variants());
  if (resolved.error) {
    console.error(`FAIL: ${resolved.error}`);
    console.error('A scenario is never replayed against an unregistered environment and no fake result is written.');
    console.error(`Register it first (node scripts/new-issue.mjs <issue> --branch <fork-branch>, docs/NEW-ISSUE.md) or name a registered slug.`);
    process.exit(3);
  }
  const v = resolved.v;
  if (resolved.note) console.log(resolved.note);

  // The environment must exist before a browser is launched. Stop with the command, never with a fake result.
  const missing = ['before', 'after'].map((side) => ({ side, env: v[side] && v[side].env, file: v[side] && v[side].env ? path.join(labRoot, 'envs', v[side].env, '.ddev', 'config.yaml') : null }))
    .filter((x) => !x.file || !fs.existsSync(x.file));
  if (missing.length) {
    console.error(`BLOCKED: variant ${v.slug} is not built (${missing.map((x) => `${x.side} environment ${x.env || '(no env)'}`).join(', ')}).`);
    console.error(`Build both sides first: node tools/compare/setup.mjs ${v.slug}`);
    process.exit(3);
  }

  const env = effectiveEnvironment(scenario, flags);
  const sides = flags.side === 'both' ? ['before', 'after'] : [flags.side];

  const { runArgs, launch, openSide, baseResults, writeRun, contextMarkdown, ajaxMarkdown, speechMarkdown, gitInfo } = await loadLabRun();
  const savedArgv = process.argv;
  let run;
  try {
    const argv = savedArgv.slice(2);
    const index = argv.findIndex((a) => !a.startsWith('-') && (a === positional[0] || path.resolve(process.cwd(), a) === file));
    if (index !== -1) argv.splice(index, 1);
    // Pin the scenario's environment (browser, scheme, forced colours, viewport) unless the CLI overrides it.
    if (!flags.browser) argv.push(`--browser=${env.browser}`);
    if (!flags.scheme) argv.push(`--scheme=${env.scheme}`);
    if (env.forced) argv.push('--forced-colors');
    if (!flags.viewport) argv.push(`--viewport=${env.viewport}`);
    process.argv = [savedArgv[0], savedArgv[1], ...argv];
    run = runArgs({ slug: v.slug, viewport: env.viewport });
  } finally {
    process.argv = savedArgv;
  }

  let browser;
  let environment;
  try {
    ({ browser, environment } = await launch(run));
  } catch (error) {
    const message = String(error.message || error).split('\n')[0];
    console.error(`BLOCKED: ${message}`);
    console.error(`The environments exist but the run could not start. Start both sites and the viewer: node scripts/lab-env.mjs start ${v.slug}`);
    console.error(`If an environment is missing or broken, rebuild it: node tools/compare/setup.mjs ${v.slug}`);
    process.exit(3);
  }
  run.browser = browser;

  const results = baseResults(run, environment);
  const sideResults = {};
  const sideSessions = {};
  try {
    for (const side of sides) {
      console.log(`running ${side} (${v[side].env}) ...`);
      const { page, base, rec } = await openSide(run, side);
      // The shared openSide() does not take reducedMotion; apply it on the page, and re-assert the media
      // preferences the scenario and CLI agreed on so the checkpoint records what the page actually matched.
      await page.emulateMedia({ colorScheme: env.scheme, forcedColors: env.forced ? 'active' : 'none', reducedMotion: env.reducedMotion });
      const { helperSourceText } = await import('./lib/a11y/capture.mjs');
      await page.addInitScript({ content: helperSourceText() }).catch(() => {});
      // Where the page came from: resolved from the page URL and the registered environments, never assumed.
      const { resolvePageContext } = await import('./lib/a11y/context.mjs');
      const resolvedContext = resolvePageContext(page.url(), { hint: { variant: v.slug } });
      if (!resolvedContext.allowed) {
        await rec.close(run.out).catch(() => {});
        throw new Error(`${side}: cannot attribute this page: ${resolvedContext.reason}`);
      }
      const context = {
        ...resolvedContext,
        side,
        scenarioId: scenario.id,
        variant: v.slug,
        issue: String(v.issue ?? scenario.issue ?? ''),
        core: { ...(resolvedContext.core || {}), commit: gitInfo(v[side].env) },
      };
      // One session per side: the SessionStore directory is <reports>/checkpoints/<stamp>-<scenario-id>-<side>/.
      // With --out (a trial run that must not add evidence to the issue) the session goes under that directory.
      const { SessionStore } = await import('./lib/a11y/store.mjs');
      const stamp = new Date().toISOString().replace(/[:.]/g, '-');
      const hint = flags.out ? { out: path.join(run.out, 'checkpoints', `${stamp}-${scenario.id}-${side}`) } : { label: `${scenario.id}-${side}` };
      const session = new SessionStore({ context, hint, profile: 'quick' });
      sideSessions[side] = session;
      run.page = page;
      run.base = base;
      run.rec = rec;
      const sideResult = await runScenario(run, side, scenario, { session, checkpointContext: context, recorder: rec, out: run.out });
      await rec.close(run.out);
      sideResults[side] = sideResult;
      results.sides[side] = { ...rec, scenario: sideResult };
      const failed = sideResult.steps.filter((s) => s.status === 'failed').length;
      console.log(`  ${side}: ${sideResult.checkpoints.length} checkpoint(s), ${sideResult.assertions.length} assertion(s), ${failed} failed step(s)`);
    }
  } catch (error) {
    console.error(`FAIL: ${String(error.message || error).split('\n')[0]}`);
    await browser.close().catch(() => {});
    process.exit(3);
  } finally {
    await browser.close().catch(() => {});
  }

  let comparison;
  if (sides.length === 2) {
    comparison = compareScenario(run, { session: sideSessions.before, result: sideResults.before }, { session: sideSessions.after, result: sideResults.after }, scenario);
  } else {
    comparison = {
      verdict: 'mixed', unexpected: 0, pairs: [], checks: [], assertions: [], classificationSummary: {},
      note: `Only the ${sides[0]} side was run. No Before/After comparison was made.`,
    };
  }

  results.scenario = {
    schema: SCENARIO_SCHEMA, id: scenario.id, title: scenario.title, description: scenario.description,
    issue: scenario.issue ?? null, variant: v.slug, route: scenario.route, verified: scenario.verified,
    fixture: scenario.fixture, environment: { browser: env.browser, colourScheme: env.scheme, forcedColors: env.forced, reducedMotion: env.reducedMotion, viewport: env.viewport },
    file: scenarioRel, sides,
  };
  results.checkpoints = Object.fromEntries(sides.map((side) => [side, sideResults[side] ? sideResults[side].checkpoints : []]));
  results.assertions = Object.fromEntries(sides.map((side) => [side, sideResults[side] ? sideResults[side].assertions : []]));
  results.comparison = comparison;
  results.verdict = comparison.verdict;
  results.unexpected = comparison.unexpected;

  const summaries = Object.fromEntries(sides.map((side) => [side, sideResults[side]]));
  let md = `# Scenario replay: ${scenario.title}\n\n`;
  md += `Scenario \`${scenario.id}\`, file \`${scenarioRel}\`, run ${results.when}. Variant \`${v.slug}\` (issue #${v.issue}). ${environment.browser} ${environment.browserVersion}, ${env.scheme}${env.forced ? ', forced colours' : ''}, ${env.viewport}, ${environment.os}. Sides: ${sides.join(', ')}.\n\n`;
  md += `**DRAFT: automated evidence, not a human accessibility review.** This tool replays a scenario; it does not replace a person's keyboard and screen-reader pass.\n\n`;
  if (sides.length < 2) md += `**Only the ${sides[0]} side was run, so no Before/After comparison was made in this run.**\n\n`;
  md += scenarioSummaryMarkdown({ scenario: { ...scenario, file: scenarioRel }, sides: summaries, comparison, run });
  if (sides.length === 2) md += contextMarkdown(results) + ajaxMarkdown(results) + speechMarkdown(results);
  else md += `## Context\n\nOnly the ${sides[0]} side ran, so the Before/After context table and the AJAX/announcement sections are not written. Run both sides for a comparison.\n\n`;

  let written;
  if (sides.length === 2) {
    try { written = writeRun(run, results, md); }
    catch (error) { console.error(`FAIL: the results object is incomplete: ${String(error.message).split('\n')[0]}`); process.exit(1); }
  } else {
    // run-schema.mjs requires both sides, and scripts/coverage.mjs treats a results.json as a comparison run.
    // A one-sided replay therefore does not write results.json: it writes SUMMARY.md and a clearly named
    // partial results file, so no incomplete run is counted as evidence.
    fs.writeFileSync(path.join(run.out, 'SUMMARY.md'), md);
    fs.writeFileSync(path.join(run.out, 'results-partial.json'), JSON.stringify(results, null, 2));
    written = `${path.relative(labRoot, run.out) || run.out} (SUMMARY.md and results-partial.json; results.json is not written because it requires both sides)`;
  }
  console.log(`wrote ${written}`);
  console.log(`verdict: ${results.verdict}; unexpected: ${results.unexpected}${sides.length < 2 ? ' (single side: no comparison was made)' : ''}`);
  if (flags.json) console.log(JSON.stringify({ ok: true, scenario: scenario.id, variant: v.slug, sides, out: written, verdict: results.verdict, unexpected: results.unexpected, comparison: { note: comparison.note } }, null, 2));
}

main().catch((error) => {
  console.error(`FAIL: ${String(error.message || error).split('\n')[0]}`);
  process.exit(2);
});
