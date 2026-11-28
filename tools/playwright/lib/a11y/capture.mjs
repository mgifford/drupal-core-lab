// Capture one named checkpoint from the page that is already open: readiness, application state, focus, journal,
// engines, collectors, screenshots, findings. The same function serves the Playwright MCP bridge and the deterministic
// scenario runner, so the two workflows cannot drift apart.
//
// It never navigates, reloads, focuses, clicks, scrolls or closes anything. When a readiness condition fails, it records
// `state-not-reached` with the evidence it could gather, and does not run the checks that need the expected state.
import fs from 'node:fs';
import path from 'node:path';
import { labRoot } from '../../../compare/lib.mjs';
import { readEnvironment } from './context.mjs';
import { createCheckpoint, compactCheckpoint, checkpointManual, readinessOf, validId } from './checkpoint.mjs';
import { dedupeFindings, normaliseFinding } from './findings.mjs';
import { runEngines, resolveProfile, describeEngines, validateAdapter } from './engines.mjs';
import { RECORDER } from '../recorder.mjs';

const HELPER_FILE = new URL('./page-helper.js', import.meta.url);
let helperSource = null;
export function helperSourceText() {
  if (helperSource == null) helperSource = fs.readFileSync(HELPER_FILE, 'utf8');
  return helperSource;
}

// For a page the integration controls directly (the scenario runner, the tests): add the approved helper and the lab's
// interaction recorder before the page's own scripts, and collect the recorder's post-action windows.
export async function installObservation(page) {
  await page.addInitScript({ content: `(${RECORDER.toString()})();` });
  await page.addInitScript({ content: helperSourceText() });
  const changes = [];
  await page.exposeBinding('__labReport', (_source, record) => { changes.push(record); });
  return { changes };
}

// Install the approved helper in the current document if it is not there yet (it is normally there already: MCP
// --init-script and the scenario runner both add it before the page's own scripts).
export async function ensureHelper(page) {
  const present = await page.evaluate(() => !!globalThis.__labA11y).catch(() => false);
  if (!present) await page.evaluate(helperSourceText());
  return page.evaluate(() => globalThis.__labA11y.version);
}

const MAX_ENGINE_RAW_BYTES = 2 * 1024 * 1024;

// axe's full output is the canonical raw evidence, but `passes` and `inapplicable` node lists can be megabytes and are
// not needed to reproduce a finding. They are reduced to rule ids (with a note) instead of being dropped silently.
export function trimAxeRaw(full) {
  if (!full) return { value: null, trimmed: false, note: null };
  const bytes = Buffer.byteLength(JSON.stringify(full));
  if (bytes <= MAX_ENGINE_RAW_BYTES) return { value: full, trimmed: false, note: null, bytes };
  const clone = JSON.parse(JSON.stringify(full));
  const reduce = (list) => (list || []).map((r) => ({ id: r.id, impact: r.impact, help: r.help, helpUrl: r.helpUrl, tags: r.tags, nodes: r.id && clone.violations?.some((v) => v.id === r.id) ? r.nodes : r.nodes }));
  clone.passes = (clone.passes || []).map((r) => ({ id: r.id, nodeCount: (r.nodes || []).length }));
  clone.inapplicable = (clone.inapplicable || []).map((r) => ({ id: r.id }));
  clone.incomplete = (clone.incomplete || []).map((r) => ({ ...r, nodes: (r.nodes || []).map((n) => ({ target: n.target, html: String(n.html || '').slice(0, 500), impact: n.impact, failureSummary: String(n.failureSummary || '').slice(0, 800) })) }));
  clone.violations = (clone.violations || []).map((r) => ({ ...r, nodes: (r.nodes || []).map((n) => ({ target: n.target, html: String(n.html || '').slice(0, 500), impact: n.impact, failureSummary: String(n.failureSummary || '').slice(0, 800) })) }));
  clone._labTrimmed = 'passes and inapplicable reduced to rule ids: the complete raw output exceeded 2 MB';
  void reduce;
  return { value: clone, trimmed: true, note: 'raw axe output reduced (passes/inapplicable rule ids only) because it exceeded 2 MB', bytes: Buffer.byteLength(JSON.stringify(clone)) };
}

const selectorFile = (s) => String(s || 'element').replace(/[^A-Za-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'element';

// Screenshots: the viewport as it is, plus the element's own area when it is in view. Never scroll to reach an element:
// scrolling is a state change, and a checkpoint must not cause one.
async function takeScreenshots(page, dir, { selector, rectInPage, viewport }) {
  const shots = [];
  const pageFile = path.join(dir, 'viewport.png');
  try {
    await page.screenshot({ path: pageFile, animations: 'disabled', caret: 'hide', scale: 'css' });
    shots.push({ kind: 'viewport', file: path.relative(labRoot, pageFile), viewport: page.viewportSize() });
  } catch (error) {
    shots.push({ kind: 'viewport', error: String(error.message).split('\n')[0].slice(0, 200) });
  }
  if (!rectInPage || !viewport || rectInPage.width <= 0 || rectInPage.height <= 0) return shots;
  const scroll = await page.evaluate(() => ({ x: scrollX, y: scrollY })).catch(() => ({ x: 0, y: 0 }));
  const clip = {
    x: Math.max(0, rectInPage.x - scroll.x),
    y: Math.max(0, rectInPage.y - scroll.y),
    width: Math.min(rectInPage.width, viewport.width || rectInPage.width),
    height: Math.min(rectInPage.height, viewport.height || rectInPage.height),
  };
  const inView = clip.x + clip.width > 0 && clip.y + clip.height > 0 && clip.x < (viewport.width || 0) && clip.y < (viewport.height || 0) && clip.width >= 1 && clip.height >= 1;
  if (!inView) {
    shots.push({ kind: 'element', selector, skipped: 'element is outside the viewport; the checkpoint does not scroll the page to reach it' });
    return shots;
  }
  const file = path.join(dir, `element-${selectorFile(selector)}.png`);
  try {
    await page.screenshot({ path: file, clip, animations: 'disabled', caret: 'hide', scale: 'css' });
    shots.push({ kind: 'element', selector, file: path.relative(labRoot, file), clip });
  } catch (error) {
    shots.push({ kind: 'element', selector, error: String(error.message).split('\n')[0].slice(0, 200) });
  }
  return shots;
}

// Wait for an explicit readiness condition. No arbitrary sleeps: selector state, a function expression, or network idle.
export async function waitForReadiness(page, readiness) {
  const started = Date.now();
  const r = readinessOf(readiness);
  if (r.kind === 'none') return { condition: 'none', satisfied: true, waitedMs: 0 };
  try {
    if (r.kind === 'selector') {
      await page.waitForSelector(r.selector, { state: r.state, timeout: r.timeoutMs });
    } else if (r.kind === 'function') {
      // The expression is a boolean expression evaluated in the page, not a script with side effects. It is bounded in
      // checkpoint.mjs and evaluated once per poll by Playwright.
      await page.waitForFunction(`Boolean(${String(r.expression).slice(0, 2000)})`, undefined, { timeout: r.timeoutMs, polling: 100 });
    } else if (r.kind === 'networkIdle') {
      await page.waitForLoadState('networkidle', { timeout: r.timeoutMs });
    }
    return { condition: r, satisfied: true, waitedMs: Date.now() - started };
  } catch (error) {
    return { condition: r, satisfied: false, waitedMs: Date.now() - started, error: String(error.message).split('\n')[0].slice(0, 400) };
  }
}

// Validate a checkpoint request from an agent. Strict: unknown fields are refused rather than ignored, so a typo in an
// option cannot silently produce a different scan than the agent asked for.
const ALLOWED_REQUEST = new Set(['id', 'label', 'profile', 'scope', 'selector', 'include', 'exclude', 'tags', 'rules', 'bestPractice', 'readiness', 'note', 'question', 'engines', 'collectors', 'screenshots', 'nodes', 'standard', 'types', 'expected', 'raw']);
export function validateCheckpointRequest(payload) {
  const p = payload && typeof payload === 'object' ? payload : {};
  const problems = [];
  const unknown = Object.keys(p).filter((k) => !ALLOWED_REQUEST.has(k));
  if (unknown.length) problems.push(`unknown option(s): ${unknown.join(', ')}. Allowed: ${[...ALLOWED_REQUEST].join(', ')}`);
  if (!validId(p.id)) problems.push('id is required and must be a lower-case identifier ([a-z0-9._-], 1-80 characters starting with a letter or digit), for example "dialog-open"');
  const str = (v, n, name) => { if (v == null) return; if (typeof v !== 'string') problems.push(`${name} must be a string`); else if (v.length > n) problems.push(`${name} is longer than ${n} characters`); };
  str(p.label, 200, 'label');
  str(p.note, 1000, 'note');
  str(p.question, 500, 'question');
  str(p.scope, 300, 'scope');
  str(p.selector, 300, 'selector');
  str(p.standard, 20, 'standard');
  if (p.profile != null && typeof p.profile !== 'string') problems.push('profile must be a string');
  const arr = (v, n, name) => { if (v == null) return; if (!Array.isArray(v)) problems.push(`${name} must be an array of strings`); else if (v.length > n) problems.push(`${name} has more than ${n} entries`); else if (v.some((x) => typeof x !== 'string' || x.length > 300)) problems.push(`${name} entries must be strings of at most 300 characters`); };
  arr(p.include, 50, 'include');
  arr(p.exclude, 50, 'exclude');
  arr(p.tags, 30, 'tags');
  arr(p.rules, 200, 'rules');
  arr(p.engines, 10, 'engines');
  arr(p.collectors, 10, 'collectors');
  if (p.bestPractice != null && typeof p.bestPractice !== 'boolean') problems.push('bestPractice must be true or false');
  if (p.raw != null && typeof p.raw !== 'boolean') problems.push('raw must be true or false (false keeps the compact evidence only, no raw engine file)');
  if (p.readiness != null && typeof p.readiness !== 'object' && typeof p.readiness !== 'string') problems.push('readiness must be a string or an object');
  if (p.readiness && typeof p.readiness === 'object') {
    const allowed = new Set(['selector', 'state', 'expression', 'networkIdle', 'timeoutMs', 'kind']);
    for (const k of Object.keys(p.readiness)) if (!allowed.has(k)) problems.push(`readiness has an unknown option: ${k}`);
    // A readiness expression is a bounded boolean expression evaluated in the page by Playwright; it is not a
    // scripting hook (no braces, no backticks, no statements). Escaped quotes and non-ASCII names are allowed because
    // a selector for a translated label needs them.
    if (p.readiness.expression && !/^[\s\w.\[\]'"()=!<>&|?:+\-*/%,;#@$\\\u00a0-\uffff]*$/.test(String(p.readiness.expression))) problems.push('readiness.expression contains characters that are not allowed in a boolean expression');
    if (p.readiness.selector && /[\u0000-\u001f]/.test(p.readiness.selector)) problems.push('readiness.selector contains control characters');
  }
  if (p.expected != null && typeof p.expected !== 'object') problems.push('expected must be an object');
  if (problems.length) { const e = new Error(problems.join('; ')); e.code = 'invalid-request'; throw e; }
  return p;
}

// The full capture. `pageState` is the per-page observation buffer the MCP hook keeps (ajax responses, console, errors).
export async function captureCheckpoint(page, request, {
  session, context, mcp = null, allowFixtures = false, profile = null, pageState = null, screenshot = true,
} = {}) {
  const started = Date.now();
  const req = validateCheckpointRequest(request);
  const chosenProfile = req.profile || profile || 'quick';
  const resolved = resolveProfile(chosenProfile, { engines: req.engines, collectors: req.collectors }, { allowFixtures });
  const readiness = await waitForReadiness(page, req.readiness || (req.scope ? { selector: req.scope } : null));
  const sequence = session.session.checkpoints.length + 1;
  const when = new Date().toISOString();

  const existing = session.session.checkpoints.find((c) => c.id === req.id && c.side === (context.side || null));
  if (existing && !['state-not-reached', 'tool-error'].includes(existing.status)) {
    const e = new Error(`checkpoint id "${req.id}" was already captured at this side (sequence ${existing.sequence}). Use a new id for a new state, or finish() the session.`);
    e.code = 'duplicate-checkpoint';
    throw e;
  }

  const evidenceDir = session.checkpointPaths({ sequence, id: req.id }).evidenceDir;
  fs.mkdirSync(evidenceDir, { recursive: true });

  // State that does not need an engine: read from the page through the approved helper.
  const helperVersion = await ensureHelper(page);
  const scopeSelector = req.scope || req.selector || null;
  const environment = await readEnvironment(page);
  const state = await page.evaluate((scope) => globalThis.__labA11y.state({ scope }), scopeSelector).catch((e) => ({ error: String(e.message).slice(0, 300) }));
  const focus = await page.evaluate(() => globalThis.__labA11y.focus()).catch((e) => ({ error: String(e.message).slice(0, 300) }));
  const journal = await page.evaluate(() => globalThis.__labA11y.journal()).catch(() => ({ events: [], focus: [] }));
  const speech = req.collectors?.includes('speech') || resolved.collectors.includes('speech')
    ? await page.evaluate(() => globalThis.__labA11y.speech()).catch((e) => ({ error: String(e.message).slice(0, 300) }))
    : { skipped: 'the speech collector was not selected for this checkpoint (use profile dynamic or full, or collectors: ["speech"])' };
  // The recorder sends a finished action window to the run through __labReport as soon as it closes, so those changes
  // are in the caller's buffer, not in window.__lab. Merge them rather than losing the very evidence a dynamic
  // checkpoint is for. (The MCP hook and the scenario runner both provide takeSpeechChanges.)
  if (pageState && typeof pageState.takeSpeechChanges === 'function') {
    const extra = pageState.takeSpeechChanges();
    if (Array.isArray(extra) && extra.length) {
      speech.recorder = speech.recorder || { announce: [], live: [], changes: [] };
      speech.recorder.changes = [...(speech.recorder.changes || []), ...extra];
    }
  }

  // Visual evidence for the selected element (or the focused one), read only.
  let visual = null;
  if (resolved.collectors.includes('visual') || scopeSelector) {
    visual = await page.evaluate((sel) => globalThis.__labA11y.visual({ selector: sel }), scopeSelector).catch((e) => ({ ok: false, reason: String(e.message).slice(0, 300) }));
    if (visual && visual.ok) fs.writeFileSync(path.join(evidenceDir, 'visual.json'), JSON.stringify(visual, null, 2) + '\n');
  }

  // Engines on the live page. Cheapest first (the registry orders them), one browser, same state.
  const engineResults = readiness.satisfied
    ? await runEngines(page, {
      engines: resolved.engines,
      allowFixtures,
      options: {
        tags: req.tags, rules: req.rules, bestPractice: req.bestPractice, include: req.include || (scopeSelector ? [scopeSelector] : undefined), exclude: req.exclude,
        nodes: req.nodes, standard: req.standard, types: req.types, raw: req.raw !== false,
        context: { checkpointId: req.id, side: context.side, scenarioId: context.scenarioId || null },
      },
    })
    : resolved.engines.map((id) => ({ engine: { id }, execution: { engine: id, status: 'not-run', error: 'readiness condition was not met, so the checks that need the expected state were not run', executedRuns: 0, failedRuns: 0, skipped: [] }, findings: [], compact: null, timings: { ms: 0 } }));

  // The accessibility tree and relationships (expensive; only when asked).
  let tree = null;
  if (resolved.collectors.includes('tree') && readiness.satisfied) {
    const treeStarted = Date.now();
    try {
      const { capturePage } = await import('../tree-capture.mjs');
      const captured = await capturePage(page);
      tree = {
        spoken: captured.spoken,
        refs: captured.refs || [],
        files: {
          axtree: path.relative(labRoot, write(path.join(evidenceDir, 'tree-axtree.txt'), captured.axtree)),
          aria: path.relative(labRoot, write(path.join(evidenceDir, 'tree-aria.txt'), captured.aria)),
          speech: path.relative(labRoot, write(path.join(evidenceDir, 'tree-speech.txt'), captured.speech)),
          refs: path.relative(labRoot, write(path.join(evidenceDir, 'tree-refs.json'), JSON.stringify(captured.refs || [], null, 2) + '\n')),
        },
        ms: Date.now() - treeStarted,
        note: 'Three different views: Chromium accessibility tree (CDP), ARIA after JavaScript with ID references resolved, and Guidepup virtual screen reader speech. They are not equivalent representations.',
      };
    } catch (error) {
      tree = { error: String(error.message).split('\n')[0].slice(0, 400), ms: Date.now() - treeStarted };
    }
  }

  // Screenshots (viewport first, then the element if it is already in view).
  let screenshots = [];
  if (screenshot && resolved.collectors.includes('screenshots')) {
    screenshots = await takeScreenshots(page, evidenceDir, { selector: scopeSelector, rectInPage: visual?.screenshotHints?.rectInPage || null, viewport: environment.viewport });
  }

  // Findings: normalise, keep the raw engine output as evidence, dedupe within the checkpoint.
  const normalised = [];
  const engineEvidence = [];
  for (const r of engineResults) {
    const rawFile = r.full ? path.join(evidenceDir, `${String(r.engine?.id || r.execution?.engine || 'engine').replace(/[^A-Za-z0-9._-]+/g, '-')}.json`) : null;
    if (r.full) {
      const trimmed = trimAxeRaw(r.full);
      const data = trimmed.value ?? r.full;
      write(rawFile, JSON.stringify(data, null, 2) + '\n');
      if (trimmed.note) r.execution.note = trimmed.note;
    }
    const rawRef = rawFile ? path.relative(labRoot, rawFile) : null;
    for (const f of r.findings || []) {
      const nf = normaliseFinding(f, {
        side: context.side || null,
        checkpointId: req.id,
        scenarioId: context.scenarioId || null,
        pagePath: context.page?.path || pageURLPath(page),
        testProfile: chosenProfile,
      });
      nf.evidenceRef = rawRef;
      nf.provenance = { ...nf.provenance, checkpointId: req.id, side: context.side || null, scenarioId: context.scenarioId || null };
      normalised.push(nf);
    }
    engineEvidence.push({
      engine: r.engine?.id || r.execution?.engine,
      label: r.engine?.label || null,
      version: r.engine?.version || r.execution?.version || 'unknown',
      license: r.engine?.license || null,
      status: r.execution?.status || 'not-run',
      error: r.execution?.error || null,
      note: r.execution?.note || null,
      skipped: r.execution?.skipped || [],
      executedRuns: r.execution?.executedRuns ?? 0,
      failedRuns: r.execution?.failedRuns ?? 0,
      counts: r.compact ? { violations: r.compact.total, incomplete: r.compact.incompleteTotal, rules: Object.keys(r.compact.rules || {}).length } : null,
      options: r.options || null,
      timings: r.timings || null,
      raw: rawRef,
    });
  }
  const { findings } = dedupeFindings(normalised);

  // The observation buffer (AJAX commands, console errors) is read and cleared per checkpoint: it belongs to the
  // interaction that led here, not to the whole session.
  const ajax = pageState ? pageState.takeAjax() : [];
  const consoleMessages = pageState ? pageState.takeConsole() : [];
  if (ajax.length) write(path.join(evidenceDir, 'ajax.json'), JSON.stringify(ajax, null, 2) + '\n');
  if (consoleMessages.length) write(path.join(evidenceDir, 'console.json'), JSON.stringify(consoleMessages, null, 2) + '\n');
  write(path.join(evidenceDir, 'journal.json'), JSON.stringify(journal, null, 2) + '\n');

  const capped = capState(state);
  const manual = checkpointManual(capped && !capped.error ? capped : {}, { findings, side: context.side || null });
  const resources = {
    scanMs: Date.now() - started,
    engines: engineResults.map((r) => ({ engine: r.execution?.engine, ms: r.timings?.ms ?? 0, status: r.execution?.status })),
    helperVersion,
    treeMs: tree?.ms ?? null,
  };
  // Add the size after the record's evidence directory has been written, below.

  const provenanceSource = mcp ? 'playwright-mcp' : 'scripted';
  const record = createCheckpoint({
    id: req.id,
    sequence,
    label: req.label || req.id,
    status: readiness.satisfied ? 'captured' : 'state-not-reached',
    when,
    provenance: {
      source: provenanceSource,
      mcp: mcp || null,
      scenario: { id: context.scenarioId || session.session.id, step: sequence, checkpoint: req.id },
      variant: context.variant || null,
      issue: context.issue || null,
      side: context.side || null,
      core: context.core || null,
      patchState: context.patchState || null,
      page: context.page || null,
    },
    scenario: { id: context.scenarioId || session.session.id, step: sequence, checkpoint: req.id },
    environment: { ...environment, contextId: environment.contextId, preferencesSource: 'reported by the page through matchMedia' },
    page: {
      url: context.page?.path ? `${context.page.path}${context.page.queryNames?.length ? '?' + context.page.queryNames.join('&') : ''}` : pageURLPath(page),
      origin: context.page?.origin || null,
      host: context.page?.host || null,
      path: context.page?.path || pageURLPath(page),
      queryNames: context.page?.queryNames || [],
      title: environment.title || null,
      lang: environment.lang || null,
      dir: environment.dir || null,
      theme: environment.theme || null,
    },
    interaction: {
      history: (journal.events || []).map((e) => ({ t: e.t, kind: e.kind, target: e.target ? { tag: e.target.tag, selector: e.target.selector, role: e.target.role, name: e.target.name } : null, key: e.key || null, page: e.page || null, trusted: e.trusted, attribute: e.attribute || null })),
      focusHistory: (journal.focus || []).map((f) => ({ t: f.t, from: f.from ? { role: f.from.role, name: f.from.name, selector: f.from.selector } : null, to: f.to ? { role: f.to.role, name: f.to.name, selector: f.to.selector } : null })),
      lastBlur: focus?.lastBlur || null,
      mutationsObserved: journal.mutations ?? null,
    },
    focus: {
      active: focus?.active || null,
      focusVisible: focus?.focusVisible ?? null,
      dialog: focus?.dialog || null,
      dialogsOpen: focus?.dialogsOpen ?? null,
      bodyFocus: focus?.bodyFocus ?? null,
      trail: focus?.trail || [],
      note: 'Focus was read, never moved. A checkpoint cannot tell you what a screen reader said; it records what the browser exposes.',
    },
    state: {
      readiness,
      application: {
        visibleText: capped?.visibleText || null,
        dialogs: capped?.dialogs || [],
        details: capped?.details || [],
        expanded: capped?.expanded || [],
        selected: capped?.selected || [],
        formErrors: capped?.formErrors || [],
        landmarks: capped?.landmarks || [],
        headings: capped?.headings || [],
        messages: capped?.messages || [],
        tooltips: capped?.tooltips || [],
        tabs: capped?.tabs || [],
        menus: capped?.menus || [],
        listboxes: capped?.listboxes || [],
        ckeditor: capped?.ckeditor || null,
        aria: { brokenRefs: capped?.ariaBrokenRefs || (tree?.refs || []) },
        scope: capped?.scope || null,
        error: capped?.error || null,
      },
      flags: [],
    },
    evidence: {
      engines: engineEvidence,
      tree,
      visual,
      speech,
      ajax: ajax.length ? path.relative(labRoot, path.join(evidenceDir, 'ajax.json')) : null,
      console: consoleMessages.length ? path.relative(labRoot, path.join(evidenceDir, 'console.json')) : null,
      journal: path.relative(labRoot, path.join(evidenceDir, 'journal.json')),
      screenshots,
      raw: [],
      dir: null,
    },
    findings,
    manual,
    limits: checkpointLimits({ resolved, engineResults, readiness, helpers: helperVersion, mcp }),
    resources,
    note: req.note || null,
  });
  if (req.question) record.manual.unshift({ id: 'checkpoint-question', question: String(req.question).slice(0, 500), procedure: 'Answer from this checkpoint evidence, and state what was observed rather than inferred.', why: 'The agent recorded a question with the checkpoint.', side: context.side || null, result: 'not-run', requiresPerson: true, automated: false });

  // Record the state-not-reached reason as a finding of a distinct kind, not as a clean result.
  if (!readiness.satisfied) {
    record.state.flags.push('state-not-reached');
    record.evidence.engines = record.evidence.engines.map((e) => (e.status === 'not-run' ? e : { ...e, status: 'not-run', error: e.error || 'readiness not met' }));
  }
  record.resources = { ...record.resources, evidenceBytes: null };
  session.noteVariant(context);
  if (!session.session.engineCapabilities) {
    try { session.session.engineCapabilities = await describeEngines({ allowFixtures }); } catch { /* reported per checkpoint instead */ }
  }
  session.addResource({ engineRuns: engineResults.filter((r) => r.execution?.status === 'executed').length, scanMs: resources.scanMs });
  session.saveCheckpoint(record);
  await session.refreshReports();
  const saved = JSON.parse(fs.readFileSync(session.checkpointPaths(record).json, 'utf8'));
  return { record: saved, compact: compactCheckpoint(saved), dir: session.dir };
}

const capList = (list, n) => (Array.isArray(list) ? list.slice(0, n) : []);
// Bound the per-checkpoint state so a big page cannot produce a multi-megabyte record. The counts stay exact; the lists
// are capped and say so in the record.
function capState(state) {
  if (!state || state.error) return state;
  const out = { ...state };
  for (const [key, n] of [['dialogs', 25], ['details', 100], ['expanded', 200], ['selected', 200], ['formErrors', 100], ['landmarks', 120], ['headings', 250], ['messages', 100], ['tooltips', 50], ['tabs', 100], ['menus', 100], ['listboxes', 100], ['ariaBrokenRefs', 200]]) out[key] = capList(state[key], n);
  for (const [key, n] of [['expanded', 200], ['selected', 200], ['formErrors', 100], ['landmarks', 120], ['headings', 250], ['messages', 100], ['tabs', 100], ['menus', 100], ['listboxes', 100], ['ariaBrokenRefs', 200]]) if ((state[key] || []).length > n) out['truncated_' + key] = `showing ${n} of ${state[key].length}`;
  return out;
}

function checkpointLimits({ resolved, engineResults, readiness, helpers, mcp }) {
  const limits = [];
  if (!readiness.satisfied) limits.push(`The readiness condition was not met, so this checkpoint describes an unexpected state: ${readiness.error || 'timeout'}. A missing finding here may mean the state was never reached.`);
  for (const r of engineResults) {
    if (r.execution?.status === 'failed') limits.push(`${r.engine?.label || r.execution.engine} failed: ${r.execution.error}`);
    if (r.execution?.status === 'not-run') limits.push(`${r.engine?.label || r.execution.engine} did not run: ${r.execution.error || 'not available'}`);
    if (r.execution?.status === 'unsupported') limits.push(`${r.engine?.label || r.execution.engine} is unsupported for live checkpoints: ${r.execution.error}`);
  }
  if (!resolved.collectors.includes('tree')) limits.push('The accessibility tree was not captured for this checkpoint (profile quick/multi-engine/visual/dynamic do not include it; use semantic or full).');
  if (!resolved.collectors.includes('speech')) limits.push('Announcements and silent changes were not collected for this checkpoint (use profile dynamic or full).');
  limits.push('Chromium only. A different engine or browser would build different evidence; nothing here is extrapolated to them.');
  limits.push('Automated results are a DRAFT: a clean scan is not an accessibility pass. The manual checks in this record were not performed by a person unless a result says so.');
  limits.push(`Page helper ${helpers || 'unknown'}; ${mcp ? `Playwright MCP ${mcp.version || ''} via ${mcp.integration || 'init-page'}` : 'scripted runner'}.`);
  return limits;
}

const pageURLPath = (page) => {
  try { return new URL(page.url()).pathname; } catch { return '/'; }
};

function write(file, content) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
  return file;
}

export { validateAdapter };
