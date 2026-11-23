// Browser-side integration test for trace-context injection and correlation. No Drupal and no network: two local HTTP
// servers stand in for the site and a third-party host. Skipped when Playwright Chromium is not installed (CI installs
// the package without browsers; developers run it locally and in the live check).
import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { attachObservability, newTraceId, correlationSummary } from '../../tools/playwright/lib/observability.mjs';

const PLAYWRIGHT = path.join(process.cwd(), 'tools/playwright/node_modules/@playwright/test/index.js');
let playwright = null;
try { if (fs.existsSync(PLAYWRIGHT)) playwright = (await import(PLAYWRIGHT)).default; } catch { /* not installed */ }
let executable = null;
try { executable = playwright?.chromium.executablePath(); } catch { executable = null; }
const skip = !playwright || !executable || !fs.existsSync(executable);

test('Playwright correlation: same-origin only, multiple requests, failures, disabled tracing and third parties', { skip: skip ? 'Playwright Chromium is not installed' : false }, async () => {
  const siteRequests = [], thirdRequests = [];
  const site = http.createServer((req, res) => {
    siteRequests.push({ url: req.url, ...req.headers });
    if (req.url === '/fail') { req.socket.destroy(); return; }
    if (req.url === '/no-trace' || req.url === '/disabled') {
      res.writeHead(200, { 'content-type': 'text/html', ...(req.url === '/disabled' ? { 'x-core-lab-observability': 'disabled' } : {}) });
      res.end('<h1>no trace</h1>');
      return;
    }
    const trace = String(req.headers.traceparent || '').split('-')[1] || '';
    res.writeHead(200, {
      'content-type': req.url.endsWith('.png') ? 'image/png' : 'text/html',
      'x-core-lab-trace-id': trace, 'x-core-lab-root-span-id': 'a'.repeat(16),
      'x-core-lab-observability': 'enabled', 'x-core-lab-export': 'configured',
      'x-core-lab-request-id': String(req.headers['x-core-lab-request'] || ''),
    });
    res.end(req.url.endsWith('.png') ? Buffer.from([137, 80, 78, 71]) : '<h1>ok</h1><img src="/img.png" alt="">');
  });
  const third = http.createServer((req, res) => { thirdRequests.push({ url: req.url, traceparent: req.headers.traceparent || null }); res.writeHead(200, { 'content-type': 'application/json', 'access-control-allow-origin': '*' }); res.end('{"ok":true}'); });
  await new Promise((r) => site.listen(0, '127.0.0.1', r));
  await new Promise((r) => third.listen(0, '127.0.0.1', r));
  const siteBase = `http://127.0.0.1:${site.address().port}`;
  const thirdBase = `http://127.0.0.1:${third.address().port}`;
  const browser = await playwright.chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  const runId = 'browser-test-' + Date.now();
  const traceId = newTraceId();
  const obs = attachObservability({ context, page, base: siteBase, side: 'before', environmentId: 'before', scenarioId: 'browser-test', runId, traceId });
  try {
    await obs.action('goto', 'Open the test page', () => page.goto(siteBase + '/'));
    await obs.action('click', 'Load two same-origin fragments', async () => {
      await page.evaluate(async () => { await fetch('/a'); await fetch('/b'); });
    });
    await obs.action('click', 'Call a third-party host', async () => {
      await page.evaluate(async (url) => { await fetch(url + '/third', { mode: 'cors' }); }, thirdBase);
    });
    await obs.action('click', 'Make a failed request', async () => {
      await page.evaluate(async () => { try { await fetch('/fail'); } catch { /* expected */ } });
    });
    await page.goto(siteBase + '/disabled');
    await obs.action('wait', 'Settle', () => page.waitForTimeout(300));
    const out = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'obs-browser-')), 'catalog.json');
    const trace = await obs.flush(out);
    const saved = JSON.parse(fs.readFileSync(out, 'utf8'));
    assert.equal(saved.requests.length, trace.requests.length);

    // Every same-origin document/XHR/fetch request has the run's trace id and its own span id.
    const same = trace.requests.filter((r) => r.url.startsWith('/') && !['/fail', '/disabled'].includes(r.url));
    assert.ok(same.length >= 3, `expected at least 3 same-origin requests, got ${same.length}`);
    for (const r of same) {
      assert.equal(r.client_trace_id, traceId);
      assert.match(r.client_span_id, /^[0-9a-f]{16}$/);
      assert.equal(r.server_trace_id, traceId);
      assert.equal(r.correlation, 'matched');
    }
    assert.equal(new Set(same.map((r) => r.client_span_id)).size, same.length, 'each request must get a distinct span id');

    // A third-party request must not receive a traceparent or any lab header.
    assert.equal(thirdRequests.length, 1);
    assert.equal(thirdRequests[0].traceparent, null);
    const thirdBrowserRecord = trace.requests.find((r) => r.url.includes('/third'));
    assert.equal(thirdBrowserRecord, undefined, 'third-party requests must not enter the correlation catalogue');

    // A failed request is recorded as failed, not invented as matched.
    const failed = trace.requests.find((r) => r.url === '/fail');
    assert.ok(failed);
    assert.equal(failed.correlation, 'request-failed');
    assert.ok(failed.error);

    // A response with x-core-lab-observability: disabled is not-correlated, not "matched".
    const disabled = trace.requests.find((r) => r.url === '/disabled');
    assert.ok(disabled);
    assert.equal(disabled.correlation, 'not-instrumented');

    // The action association is preserved, and the counts add up.
    assert.ok(same.every((r) => r.action_id && /^a[0-9]+$/.test(r.action_id)));
    const summary = correlationSummary(trace.requests);
    assert.equal(summary.matched, same.length);
    assert.equal(summary.not_instrumented, 1);
    assert.equal(summary.failed, 1);
    assert.equal(summary.requests, trace.requests.length);

    // The catalogue does not contain cookies, authorization headers or query values.
    const json = fs.readFileSync(out, 'utf8');
    assert.doesNotMatch(json, /cookie|authorization|set-cookie/i);
    assert.equal(saved.run_id, runId);
  }
  finally {
    await context.close(); await browser.close();
    await new Promise((r) => site.close(r)); await new Promise((r) => third.close(r));
  }
});

test('two concurrent controllers use different trace ids and keep their request ids separate', { skip: skip ? 'Playwright Chromium is not installed' : false }, async () => {
  const site = http.createServer((req, res) => {
    const trace = String(req.headers.traceparent || '').split('-')[1] || '';
    res.writeHead(200, { 'content-type': 'text/html', 'x-core-lab-trace-id': trace, 'x-core-lab-root-span-id': 'b'.repeat(16), 'x-core-lab-observability': 'enabled' });
    res.end('<h1>ok</h1>');
  });
  await new Promise((r) => site.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${site.address().port}`;
  const browser = await playwright.chromium.launch();
  try {
    const one = await attachPair(browser, base, 'run-a');
    const two = await attachPair(browser, base, 'run-b');
    assert.notEqual(one.trace_id, two.trace_id);
    assert.equal(one.requests.length, 1);
    assert.equal(two.requests.length, 1);
    assert.notEqual(one.run_id, two.run_id);
    assert.equal(one.requests[0].client_trace_id, one.trace_id);
    assert.equal(two.requests[0].client_trace_id, two.trace_id);
  }
  finally { await browser.close(); await new Promise((r) => site.close(r)); }
});

async function attachPair(browser, base, runId) {
  const context = await browser.newContext();
  const page = await context.newPage();
  const obs = attachObservability({ context, page, base, side: 'before', environmentId: 'before', scenarioId: 'concurrent', runId });
  await obs.action('goto', 'Open', () => page.goto(base + '/'));
  const trace = await obs.flush();
  await context.close();
  return trace;
}
