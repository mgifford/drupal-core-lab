// The integration the feature is for: Playwright MCP on a live page, a named accessibility checkpoint, and proof that the
// page was not reloaded or reset. This drives a real `@playwright/mcp` server over stdio, with the repository's own
// .mcp.json configuration, against a local fixture page (no Drupal environment needed).
//
// What it verifies (the acceptance criteria that need a real MCP client):
//   1. an agent opens a dynamic component with Playwright MCP;
//   2. axe-core evaluates the exact current browser state;
//   3. the scan does not reload the page or lose the state (same document, same open dialog, same focus);
//   4. the result records a named checkpoint, and the evidence is on disk in canonical JSON;
//   5. a state-dependent defect that an initial page-load scan misses is found after the interaction.
//
// Needs tools/playwright installed with Chromium; skipped otherwise. LAB_CHROMIUM names another Chromium binary.
// Chromium's own sandbox cannot run inside another OS sandbox (the DSH host is one), so when DSH_SHELL/DSH_PROFILE is
// present the MCP server is started with --no-sandbox for this test only. Production .mcp.json keeps the sandbox.
//   node --test tests/lab/a11y-mcp-integration.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const labRoot = fileURLToPath(new URL('../..', import.meta.url));
const log = (...a) => { if (process.env.LAB_VERBOSE) console.error('[a11y-mcp]', ...a); };
const PW = path.join(labRoot, 'tools/playwright/node_modules/@playwright/test/index.mjs');
const MCP_CLI = path.join(labRoot, 'tools/playwright/node_modules/@playwright/mcp/cli.js');

const PAGE = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>Checkpoint fixture</title>
<style>.sr-only{position:absolute;clip:rect(1px,1px,1px,1px);width:1px;height:1px;overflow:hidden}</style></head>
<body><h1>Checkpoint fixture</h1>
<button id="open">Open dialog</button>
<dialog id="d" aria-label="Example dialog"><h2>Example</h2>
  <button id="nameless"><svg width="18" height="18" aria-hidden="true"><rect width="18" height="18"></rect></svg></button>
  <button id="close">Close</button></dialog>
<p id="help">A dialog opens here.</p>
<script>
document.getElementById('open').addEventListener('click', function () { document.getElementById('d').showModal(); document.getElementById('close').focus(); });
document.getElementById('close').addEventListener('click', function () { document.getElementById('d').close(); });
</script></body></html>`;

async function chromiumAvailable() {
  if (!fs.existsSync(PW) || !fs.existsSync(MCP_CLI)) return false;
  const { chromium } = await import(pathToFileURL(PW).href);
  if (process.env.LAB_CHROMIUM) return true;
  try { return fs.existsSync(chromium.executablePath()); } catch { return false; }
}

// The shared client starts the repository's Playwright MCP server exactly as .mcp.json configures it (headless for a test).
import { startMcpClient } from '../../tools/a11y-mcp/mcp-client.mjs';
const startMcp = (opts = {}) => startMcpClient({ labRoot, headless: true, ...opts });

test('Playwright MCP + axe-core on the same live page: a named checkpoint keeps the state', { skip: !(await chromiumAvailable()) ? 'tools/playwright or Chromium is not installed (see docs/TESTING-TOOLS.md)' : false }, async (t) => {
  const server = http.createServer((req, res) => { res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }); res.end(PAGE); });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const url = `http://127.0.0.1:${server.address().port}/checkpoint-fixture`;
  const out = path.join(labRoot, '.lab-cache', 'a11y-mcp', `test-${process.pid}-${Date.now()}`);
  const hintFile = path.join(labRoot, '.lab-cache', 'a11y-mcp', 'session.json');
  const previousHint = fs.existsSync(hintFile) ? fs.readFileSync(hintFile, 'utf8') : null;
  // The session hint is how a person/agent names the scenario and the output folder before exploring.
  fs.mkdirSync(path.dirname(hintFile), { recursive: true });
  fs.writeFileSync(hintFile, JSON.stringify({ scenario: 'mcp-integration-test', label: 'mcp-integration', out: path.relative(labRoot, out), profile: 'quick' }, null, 2));
  let mcp;
  try {
    mcp = startMcp();
    log('spawned MCP');
    await mcp.init();
    log('initialized');
    const tools = await mcp.request('tools/list', {});
    const names = (tools.result?.tools || []).map((x) => x.name);
    assert.ok(names.includes('browser_evaluate'), 'the MCP client exposes browser_evaluate (the narrow route the feature uses)');
    assert.ok(names.includes('browser_navigate') && names.includes('browser_click'), 'the MCP client exposes navigation and trusted clicks');

    log('navigating');
    const nav = await mcp.call('browser_navigate', { url });
    log('navigated', nav.isError);
    assert.equal(nav.isError, false, `navigate failed: ${nav.text}`);

    // The approved helper is present before the page's own scripts ran (MCP --init-script).
    const helper = await mcp.evaluate('() => ({ version: window.__labA11y && window.__labA11y.version, helper: typeof window.__labA11y?.checkpoint })');
    assert.equal(helper.version, '1.0.0', 'window.__labA11y is installed in the page');
    assert.equal(helper.helper, 'function', 'the checkpoint call is available');

    // A page-load checkpoint: the unlabelled button is inside a closed dialog, so axe reports no button-name finding.
    log('initial checkpoint');
    const initial = await mcp.evaluate('() => window.__labA11y.checkpoint({ id: "initial-load", label: "Initial page load", profile: "quick" })');
    assert.equal(initial.ok, true, `initial checkpoint failed: ${JSON.stringify(initial)}`);
    assert.equal(initial.checkpoint.checkpoint.status, 'captured');
    assert.equal(initial.checkpoint.engines.find((e) => e.engine === 'axe-core').status, 'executed', 'axe ran on the live page');
    assert.equal(initial.checkpoint.findings.some((f) => f.rule === 'button-name'), false, 'a page-load scan cannot see the closed dialog defect');

    // Reach the dynamic state with a real MCP click (a Playwright trusted click, not a script-generated event).
    const beforeActions = await mcp.evaluate('() => ({ timeOrigin: performance.timeOrigin, nav: performance.getEntriesByType("navigation").length, loaded: performance.getEntriesByType("navigation")[0]?.responseEnd || 0 })');
    const snapshot = await mcp.call('browser_snapshot', {});
    const ref = (/button "Open dialog" \[ref=([^\]]+)\]/.exec(snapshot.text) || [])[1];
    assert.ok(ref, 'the snapshot exposes the opening button with an element reference');
    const click = await mcp.call('browser_click', { element: 'Open dialog button', target: ref });
    assert.equal(click.isError, false, `click failed: ${click.text}`);

    // The checkpoint: axe + focus on the exact state the click produced.
    log('opening dialog checkpoint');
    const open = await mcp.evaluate('() => window.__labA11y.checkpoint({ id: "dialog-open", label: "Dialog open", profile: "full", scope: "#d" })');
    assert.equal(open.ok, true, `dialog checkpoint failed: ${JSON.stringify(open)}`);
    const c = open.checkpoint;
    assert.equal(c.checkpoint.id, 'dialog-open');
    assert.equal(c.checkpoint.status, 'captured');
    assert.equal(c.state.ready, true);
    assert.equal(c.state.dialogs, 1, 'the checkpoint sees the dialog open');
    const axe = c.engines.find((e) => e.engine === 'axe-core');
    assert.equal(axe.status, 'executed');
    assert.ok(c.findings.some((f) => f.engine === 'axe-core' && f.rule === 'button-name'), `expected an axe button-name finding, got ${JSON.stringify(c.findings.map((f) => `${f.engine}:${f.rule}`))}`);
    assert.ok(c.engines.some((e) => e.engine === 'htmlcs'), 'a second engine is declared for the same live page');
    assert.ok(c.evidence?.dir, 'the checkpoint names its evidence directory');
    assert.ok(fs.existsSync(path.join(labRoot, c.evidence.dir)), 'the evidence directory exists');

    // THE requirement: the page was not reloaded and the state was not lost.
    const afterActions = await mcp.evaluate('() => ({ timeOrigin: performance.timeOrigin, nav: performance.getEntriesByType("navigation").length, dialogs: document.querySelectorAll("dialog[open]").length, active: document.activeElement.id, url: location.pathname, axeInjected: typeof window.axe !== "undefined" })');
    assert.equal(afterActions.timeOrigin, beforeActions.timeOrigin, 'the document was not reloaded (same performance.timeOrigin)');
    assert.equal(afterActions.nav, beforeActions.nav, 'no new navigation entry was created');
    assert.equal(afterActions.dialogs, 1, 'the dialog is still open after the scan');
    assert.equal(afterActions.active, 'close', 'focus was not moved by the scan');
    assert.equal(afterActions.url, '/checkpoint-fixture');

    // Canonical evidence on disk, and a session index that can be checked without a browser.
    const session = JSON.parse(fs.readFileSync(path.join(out, 'session.json'), 'utf8'));
    assert.equal(session.checkpoints.length, 2);
    const record = JSON.parse(fs.readFileSync(path.join(labRoot, session.checkpoints[1].file), 'utf8'));
    assert.equal(record.provenance.source, 'playwright-mcp');
    assert.equal(record.provenance.mcp.version, '0.0.84');
    assert.ok(record.interaction.history.some((e) => e.kind === 'pointerdown' && e.trusted), 'the trusted click is in the interaction history');
    assert.ok(record.focus.active.selector, 'the focused element is recorded');
    assert.ok(record.findings.every((f) => f.engine.id && f.ruleId && f.fingerprint), 'each finding keeps its engine, rule and fingerprint');
    const axeRaw = record.evidence.engines.find((e) => e.engine === 'axe-core').raw;
    assert.ok(axeRaw && fs.existsSync(path.join(labRoot, axeRaw)), 'the complete raw axe output is kept next to the summary');
    assert.ok(fs.existsSync(path.join(out, 'SUMMARY.md')) && fs.existsSync(path.join(out, 'report.html')), 'the reports were generated');

    log('finishing');
    const finish = await mcp.evaluate('() => window.__labA11y.finish()');
    assert.equal(finish.ok, true, `finish failed: ${JSON.stringify(finish)}`);
    assert.equal(finish.checkpoints, 2);

    // The CLI can validate the session without a browser.
    const { execFileSync } = await import('node:child_process');
    log('cli check');
    const cli = execFileSync(process.execPath, [path.join(labRoot, 'tools/a11y-mcp/cli.mjs'), 'check', path.relative(labRoot, out)], { encoding: 'utf8' });
    assert.match(cli, /^OK: 2 checkpoint/);
  } finally {
    log('cleanup');
    if (mcp) await mcp.close();
    server.close();
    if (previousHint == null) { try { fs.rmSync(hintFile); } catch { /* already gone */ } } else fs.writeFileSync(hintFile, previousHint);
    try { fs.rmSync(out, { recursive: true, force: true }); } catch { /* evidence is disposable in the test */ }
  }
});
