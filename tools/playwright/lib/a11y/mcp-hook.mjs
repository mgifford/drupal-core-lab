// The Node side of the Playwright MCP integration: one hook per browser tab, attached by `--init-page`.
//
// What it does, and deliberately does not do:
//   - it adds the approved page helper (page-helper.js) and the lab's existing interaction recorder (recorder.mjs) to
//     every page before the page's own scripts, and exposes one narrow binding the page can call;
//   - the binding accepts only named actions with validated options, never code, never a filesystem path;
//   - a checkpoint runs the selected engines on the page Playwright MCP already has open, writes canonical JSON and raw
//     engine output to the issue's report folder, and returns a compact summary to the agent;
//   - it never navigates, reloads, focuses, scrolls, closes or clicks. If the requested state is not there, it says so.
//
// No second browser, no CDP bridge, no unrestricted evaluation endpoint. The scanning logic lives in this Node process
// and reuses the lab's existing Playwright and axe code (lib/a11y/*, lib/tree-capture.mjs).
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { labRoot } from '../../../compare/lib.mjs';
import { resolvePageContext, readEnvironment } from './context.mjs';
import { captureCheckpoint, helperSourceText, ensureHelper } from './capture.mjs';
import { describeEngines } from './engines.mjs';
import { readSessionHint, sessionFor, writeAtomic } from './store.mjs';
import { summariseAjaxResponse, limitRawCommands, AJAX_URL } from './drupal-ajax.mjs';
import { RECORDER } from '../recorder.mjs';
import { readLabConfig } from '../../../compare/lab-config.mjs';

const require = createRequire(import.meta.url);
let mcpVersion = null;
try { mcpVersion = require('@playwright/mcp/package.json').version; } catch { mcpVersion = 'unknown'; }

export const MCP_INFO = {
  version: mcpVersion,
  initPage: 'tools/a11y-mcp/init-page.cjs',
  initScript: 'tools/playwright/lib/a11y/page-helper.js',
  integration: 'playwright-mcp --init-page + --init-script; a single exposed binding; browser_evaluate calls the approved helper',
  // Verified against the installed Playwright MCP (see docs/DYNAMIC-A11Y-CHECKPOINTS.md): the WebMCP tool path evaluates
  // page-registered tools in an isolated world, so a page-defined polyfill is invisible; browser_evaluate is the
  // supported route for the installed version.
  webmcp: 'not used: Playwright MCP evaluates WebMCP tools in the utility world, where a page-registered tool is not visible. Verified 2026-11-27, @playwright/mcp 0.0.84.',
};

const REFUSALS = path.join(labRoot, '.lab-cache', 'a11y-mcp', 'refusals.jsonl');
function recordRefusal(page, reason, url) {
  try {
    fs.mkdirSync(path.dirname(REFUSALS), { recursive: true });
    const host = (() => { try { return new URL(url).host; } catch { return null; } })();
    fs.appendFileSync(REFUSALS, JSON.stringify({ when: new Date().toISOString(), host, reason, page: url, tool: 'playwright-mcp' }) + '\n');
  } catch { /* a refusal log is best effort; the refusal itself is returned to the agent */ }
}

// One registry per MCP server process: pages by object, sessions by issue/fixture.
const state = {
  pages: new WeakMap(),
  sessions: new Map(),
  queue: Promise.resolve(),          // checkpoint actions are serialised: sequence numbers must not race
  started: new Date().toISOString(),
};

function serialise(task) {
  const run = state.queue.then(task, task);
  state.queue = run.then(() => {}, () => {});
  return run;
}

function pageStateFor(page) {
  let ps = state.pages.get(page);
  if (ps) return ps;
  ps = {
    ajax: [],
    rawAjax: [],
    console: [],
    attached: new Date().toISOString(),
    takeAjax() { const a = this.ajax.splice(0); this.rawAjax.length = 0; return a; },
    takeConsole() { return this.console.splice(0); },
  };
  state.pages.set(page, ps);
  return ps;
}

// The response/console observers. They only read: a response body is parsed for Drupal AJAX commands, never modified.
function attachObservers(page, ps) {
  page.on('response', (response) => {
    let url;
    try { url = response.url(); } catch { return; }
    if (!AJAX_URL.test(url)) return;
    response.json().then((commands) => {
      if (!Array.isArray(commands)) return;
      ps.ajax.push(summariseAjaxResponse(url, response.status(), commands));
      ps.rawAjax.push({ url, status: response.status(), commands: limitRawCommands(commands) });
      if (ps.ajax.length > 100) ps.ajax.splice(0, ps.ajax.length - 100);
    }).catch(() => { /* not JSON or gone: not an AJAX command list */ });
  });
  page.on('console', (message) => {
    const type = message.type();
    if (type !== 'error' && type !== 'warning') return;
    ps.console.push({ when: new Date().toISOString(), type, text: String(message.text()).slice(0, 600), location: message.location()?.url || null });
    if (ps.console.length > 200) ps.console.splice(0, ps.console.length - 200);
  });
  page.on('pageerror', (error) => {
    const text = String(error.message || error);
    if (/ResizeObserver loop/.test(text)) return;
    ps.console.push({ when: new Date().toISOString(), type: 'pageerror', text: text.slice(0, 600), location: null });
    if (ps.console.length > 200) ps.console.splice(0, ps.console.length - 200);
  });
}

// Attach the hook to one tab. Called by Playwright MCP for every tab it opens.
export async function initMCPPage({ page }) {
  if (!page || typeof page.exposeBinding !== 'function') return;
  if (state.pages.has(page)) return;
  const ps = pageStateFor(page);
  attachObservers(page, ps);

  // The interaction recorder the lab already uses (lib/recorder.mjs): serialised from the same function, not copied.
  const recorderSource = `(${RECORDER.toString()})();`;
  await page.addInitScript({ content: recorderSource }).catch(() => {});
  await page.addInitScript({ content: helperSourceText() }).catch(() => {});
  // Changes after input arrive as each action window ends; keep them with the page and surface them at the next checkpoint.
  await page.exposeBinding('__labReport', (_source, record) => {
    ps.speechChanges = ps.speechChanges || [];
    ps.speechChanges.push(record);
    if (ps.speechChanges.length > 100) ps.speechChanges.splice(0, ps.speechChanges.length - 100);
  }).catch(() => {});

  await page.exposeBinding('__labA11yBridge', async (source, request) => {
    try {
      return await handleRequest(page, ps, source, request);
    } catch (error) {
      return { error: { code: error.code || 'tool-error', message: String(error.message || error).slice(0, 1500) } };
    }
  }).catch(() => {});
}

// The repository's own switch (lab.config.yml): when the integration is off, nothing is scanned and the caller is told.
function settings() {
  const { config } = readLabConfig(labRoot);
  return { enabled: config.a11y_mcp?.enabled !== false, fixtures: config.a11y_mcp?.fixtures !== false };
}

async function handleRequest(page, ps, source, request) {
  const action = request && typeof request === 'object' ? request.action : null;
  const payload = request && typeof request === 'object' ? request.payload || {} : {};
  const frame = source && source.frame ? source.frame : page.mainFrame();
  const pageUrl = (() => { let u; try { u = page.url(); } catch { u = frame.url(); } return u; })();
  const cfg = settings();
  if (!cfg.enabled) return { ok: false, error: { code: 'disabled', message: 'The accessibility checkpoint integration is disabled in lab.config.yml (a11y_mcp.enabled: false).' } };

  if (action === 'engines') return { ok: true, engines: await describeEngines({ allowFixtures: false }), mcp: MCP_INFO, helper: await ensureHelper(page).catch(() => null) };
  if (action === 'session') {
    const hint = readSessionHint();
    const context = resolvePageContext(pageUrl, { hint });
    if (!context.allowed) return { ok: false, error: { code: 'origin-not-allowed', message: context.reason } };
    return { ok: true, context: { kind: context.kind, issue: context.issue, variant: context.variant, side: context.side, env: context.env, core: context.core }, hint, mcp: MCP_INFO };
  }
  if (!['checkpoint', 'finish'].includes(action)) {
    return { error: { code: 'unknown-action', message: `unknown action "${String(action).slice(0, 40)}"; use checkpoint, finish, engines or session` } };
  }

  // A checkpoint is taken from the page the MCP controls. A call from a subframe would describe a different document
  // while claiming the main page's provenance, so it is refused rather than mislabelled.
  if (frame && page.mainFrame && frame !== page.mainFrame()) {
    return { error: { code: 'frame-not-supported', message: `checkpoint requested from frame ${frame.url() || '(unknown)'}; call it from the main page. Engines scan same-origin frames from the main page.` } };
  }

  const hint = readSessionHint();
  const context = resolvePageContext(pageUrl, { hint });
  if (!context.allowed) {
    recordRefusal(page, context.kind, pageUrl);
    return { error: { code: 'origin-not-allowed', message: context.reason } };
  }
  if (context.kind === 'local-fixture' && !cfg.fixtures) {
    recordRefusal(page, 'fixtures-disabled', pageUrl);
    return { error: { code: 'fixture-refused', message: 'Loopback fixture pages are disabled in lab.config.yml (a11y_mcp.fixtures: false).' } };
  }
  const scenarioId = hint?.scenario || (context.variant ? `${context.variant}-exploratory` : `fixture-${context.page?.host || 'local'}`);
  const ctx = { ...context, scenarioId };
  const mcp = { version: MCP_INFO.version, integration: MCP_INFO.integration, initScript: MCP_INFO.initScript, initPage: MCP_INFO.initPage, serverStarted: state.started };

  if (action === 'finish') {
    const session = state.sessions.get(issueKey(context));
    if (!session) return { ok: true, finished: false, message: 'No checkpoint was captured in this session yet.' };
    await session.refreshReports();
    const summary = {
      session: path.relative(labRoot, session.dir),
      summary: path.relative(labRoot, path.join(session.dir, 'SUMMARY.md')),
      report: path.relative(labRoot, path.join(session.dir, 'report.html')),
      checkpoints: session.session.checkpoints.length,
      findings: session.session.findings.length,
      resources: session.session.resources,
    };
    writeAtomic(path.join(session.dir, 'finish.json'), JSON.stringify({ ...summary, finishedAt: new Date().toISOString(), mcp }, null, 2) + '\n');
    return { ok: true, finished: true, ...summary };
  }

  return serialise(async () => {
    const session = sessionFor(state.sessions, { context: ctx, hint, mcp, profile: hint?.profile || 'quick' });
    session.addPage({ origin: ctx.page?.origin, path: ctx.page?.path, host: ctx.page?.host, contextId: null, variant: ctx.variant, side: ctx.side, env: ctx.env });
    const pageState = {
      takeAjax: () => ps.takeAjax(),
      takeConsole: () => ps.takeConsole(),
      takeSpeechChanges: () => (ps.speechChanges || []).splice(0),
    };
    const { compact, record, dir } = await captureCheckpoint(page, payload, { session, context: ctx, mcp, pageState, profile: hint?.profile || 'quick' });
    return { ok: compact.checkpoint.status === 'captured', checkpoint: compact, record: path.relative(labRoot, path.join(dir, 'checkpoints', `${String(record.sequence).padStart(3, '0')}-${record.id}.json`)) };
  });
}

const issueKey = (context) => (context.issue ? `issue:${context.issue}` : context.kind === 'local-fixture' ? `fixture:${context.page?.origin || 'loopback'}` : `env:${context.env || 'unknown'}`);

// Read-only helpers a person can call from a script or a test, without an MCP client.
export const _internals = { state, MCP_INFO };
