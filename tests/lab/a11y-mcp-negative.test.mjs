// Negative controls for dynamic accessibility checkpoints.
//
// Each control is a self-contained fixture page that is clean (or clean for the defect in question) at page load and only
// shows its defect after a trusted interaction or a media-state change. The expectations are hand-written in
// tests/fixtures/a11y-mcp/expected.json, independently of the scanner: this file asserts them against the live evidence
// captureCheckpoint() produces (findings, application state, focus, visual styles, recorder changes).
//
//   node --test tests/lab/a11y-mcp-negative.test.mjs
//
// Needs Chromium from tools/playwright (skipped cleanly with a reason when it is unavailable; LAB_CHROMIUM=<path> names
// another Chromium binary). One browser is launched for the file, one context and page per fixture, and everything is
// closed in after(). Fixtures are served over loopback by tests/fixtures/a11y-mcp/serve.mjs; no network is used.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { startFixtureServer } from '../fixtures/a11y-mcp/serve.mjs';
import { installObservation, captureCheckpoint } from '../../tools/playwright/lib/a11y/capture.mjs';
import { SessionStore, SESSION_SCHEMA } from '../../tools/playwright/lib/a11y/store.mjs';
import { resolvePageContext } from '../../tools/playwright/lib/a11y/context.mjs';

const labRoot = fileURLToPath(new URL('../..', import.meta.url));
const EXPECTED_FILE = path.join(labRoot, 'tests/fixtures/a11y-mcp/expected.json');
const PLAYWRIGHT_TEST = path.join(labRoot, 'tools/playwright/node_modules/@playwright/test/index.mjs');
const EXPECTED = JSON.parse(fs.readFileSync(EXPECTED_FILE, 'utf8'));

// ---- launching Chromium

// This environment runs commands under a host sandbox Chromium cannot use, so --no-sandbox is added only when DSH_SHELL is
// set (as the task's instructions require; the flag is not set inside the test for other environments).
const launchArgs = () => (process.env.DSH_SHELL ? ['--no-sandbox'] : []);

async function launchBrowser() {
  if (!fs.existsSync(PLAYWRIGHT_TEST)) {
    return { ok: false, reason: `Playwright is not installed at tools/playwright/node_modules (run: cd tools/playwright && npm install && npx playwright install chromium)` };
  }
  let chromium;
  try {
    ({ chromium } = await import(pathToFileURL(PLAYWRIGHT_TEST).href));
  } catch (error) {
    return { ok: false, reason: `Playwright could not be imported: ${oneLine(error)}` };
  }
  const launch = (executablePath) => chromium.launch({ args: launchArgs(), ...(executablePath ? { executablePath } : {}) });
  if (process.env.LAB_CHROMIUM) {
    try {
      return { ok: true, browser: await launch(process.env.LAB_CHROMIUM) };
    } catch (error) {
      return { ok: false, reason: `LAB_CHROMIUM could not be launched (${process.env.LAB_CHROMIUM}): ${oneLine(error)}` };
    }
  }
  let executable;
  try {
    executable = chromium.executablePath();
  } catch (error) {
    return { ok: false, reason: `Playwright does not know a Chromium executable: ${oneLine(error)}` };
  }
  if (!fs.existsSync(executable)) {
    return { ok: false, reason: `Chromium is not installed at ${executable} (run: cd tools/playwright && npx playwright install chromium)` };
  }
  try {
    return { ok: true, browser: await launch() };
  } catch (error) {
    return { ok: false, reason: `Chromium is installed at ${executable} but could not be launched: ${oneLine(error)}` };
  }
}

const oneLine = (error) => String(error && error.message ? error.message : error).split('\n')[0].slice(0, 300);

// ---- shared assertions (independent of the scanner implementation: they read the record's documented shape)

const findingSelector = (finding) => String(finding.element?.selector || finding.element?.context?.selector || '');
const ruleText = (exp) => exp.ruleId || exp.ruleStartsWith || '';
const describeFinding = (finding) => `${finding.engine?.id || '?'} ${finding.ruleId || '?'} on ${findingSelector(finding) || '?'} (${finding.outcome || '?'})`;
const labelOf = (fixture, checkpoint) => `${fixture.file}/${checkpoint.id}`;

// Does one recorded finding match one expectation? engine.id + ruleId (or ruleStartsWith) + optional target.
function matchFinding(finding, exp) {
  if (exp.engine && finding.engine?.id !== exp.engine) return false;
  if (exp.ruleId && finding.ruleId !== exp.ruleId) return false;
  if (exp.ruleStartsWith && !String(finding.ruleId || '').startsWith(exp.ruleStartsWith)) return false;
  if (exp.outcome && finding.outcome !== exp.outcome) return false;
  if (exp.targetContains && !findingSelector(finding).includes(exp.targetContains)) return false;
  return true;
}

function assertEnginesRan(record, label) {
  for (const engine of record.evidence.engines || []) {
    assert.ok(['executed', 'partial'].includes(engine.status), `${label}: ${engine.engine} did not run (${engine.status}${engine.error ? `: ${engine.error}` : ''}); a missing engine must not be read as a clean result`);
  }
}

function assertFindings(record, expect, fixture, checkpoint) {
  const label = labelOf(fixture, checkpoint);
  for (const exp of expect.findings || []) {
    const matches = record.findings.filter((finding) => matchFinding(finding, exp));
    if (exp.absent) {
      assert.equal(matches.length, 0, `${label}: ${exp.engine} ${ruleText(exp)} must NOT be reported in this state; got ${matches.map(describeFinding).join('; ')}`);
    } else {
      assert.ok(matches.length > 0, `${label}: expected ${exp.engine} ${ruleText(exp)}${exp.targetContains ? ` on ${exp.targetContains}` : ''}; findings: ${record.findings.map(describeFinding).join('; ') || '(none)'}`);
    }
  }
  for (const engine of expect.noFindings || []) {
    const engineFindings = record.findings.filter((finding) => finding.engine?.id === engine);
    assert.equal(engineFindings.length, 0, `${label}: ${engine} must report nothing, got ${engineFindings.map(describeFinding).join('; ')}`);
  }
  // A correctly implemented control may never be the target of an asserted defect finding.
  for (const exp of (expect.findings || []).filter((finding) => !finding.absent)) {
    for (const control of fixture.validControls || []) {
      const wronglyFlagged = record.findings.filter((finding) => matchFinding(finding, exp) && findingSelector(finding).includes(control));
      assert.equal(wronglyFlagged.length, 0, `${label}: valid control ${control} was reported as ${exp.engine} ${ruleText(exp)}`);
    }
  }
}

function assertState(record, expect, label) {
  const state = record.state.application;
  if (expect.dialogsOpen !== undefined) {
    // state.application.dialogs.open is the authoritative count. record.focus.dialogsOpen is NOT used: page-helper.js
    // focusState() counts every [role=dialog]/[role=alertdialog] as open, including one hidden with the hidden attribute
    // (observed 1 at page load and after close for modal-no-focus-restore.html, where 0 are actually open).
    const open = (state.dialogs || []).filter((dialog) => dialog.open).length;
    assert.equal(open, expect.dialogsOpen, `${label}: expected ${expect.dialogsOpen} open dialog(s) in state.application.dialogs, got ${open} (${JSON.stringify(state.dialogs)})`);
  }
  if (expect.ariaBrokenRefsEmpty) {
    assert.equal((state.aria?.brokenRefs || []).length, 0, `${label}: expected no broken ARIA references, got ${JSON.stringify(state.aria?.brokenRefs)}`);
  }
  for (const exp of expect.ariaBrokenRefs || []) {
    const found = (state.aria?.brokenRefs || []).some((ref) => ref.attr === exp.attr && ref.id === exp.id
      && (exp.problem === undefined || ref.problem === exp.problem)
      && (exp.selectorContains === undefined || String(ref.selector || '').includes(exp.selectorContains)));
    assert.ok(found, `${label}: expected broken reference ${JSON.stringify({ attr: exp.attr, id: exp.id, problem: exp.problem })}; got ${JSON.stringify(state.aria?.brokenRefs)}`);
  }
  for (const exp of expect.expanded || []) {
    const found = (state.expanded || []).some((entry) => entry.selector === exp.selector
      && (exp.expanded === undefined || entry.expanded === exp.expanded)
      && (exp.controls === undefined || entry.controls === exp.controls)
      && (exp.controlsResolved === undefined || JSON.stringify(entry.controlsResolved) === JSON.stringify(exp.controlsResolved)));
    assert.ok(found, `${label}: expected expanded entry ${JSON.stringify(exp)}; got ${JSON.stringify(state.expanded)}`);
  }
  if (expect.messagesEmpty) {
    assert.equal((state.messages || []).length, 0, `${label}: expected no live-region status messages, got ${JSON.stringify(state.messages)}`);
  }
  for (const exp of expect.messages || []) {
    const found = (state.messages || []).some((message) => (exp.role === undefined || message.role === exp.role)
      && (exp.textContains === undefined || String(message.text || '').includes(exp.textContains))
      && (exp.hidden === undefined || message.hidden === exp.hidden));
    assert.ok(found, `${label}: expected a status message ${JSON.stringify(exp)}; got ${JSON.stringify(state.messages)}`);
  }
  for (const exp of expect.formErrors || []) {
    const found = (state.formErrors || []).some((error) => error.selector === exp.selector
      && (exp.errormessage === undefined || error.errormessage === exp.errormessage)
      && (exp.errormessageResolved === undefined || error.errormessageResolved === exp.errormessageResolved));
    assert.ok(found, `${label}: expected form error ${JSON.stringify(exp)}; got ${JSON.stringify(state.formErrors)}`);
  }
  for (const text of expect.visibleTextContains || []) {
    assert.ok(String(state.visibleText || '').includes(text), `${label}: expected visible text to contain ${JSON.stringify(text)}`);
  }
  for (const text of expect.visibleTextNotContains || []) {
    assert.ok(!String(state.visibleText || '').includes(text), `${label}: expected visible text NOT to contain ${JSON.stringify(text)}`);
  }
  for (const exp of expect.details || []) {
    const found = (state.details || []).some((detail) => detail.selector === exp.selector && (exp.open === undefined || detail.open === exp.open));
    assert.ok(found, `${label}: expected details entry ${JSON.stringify(exp)}; got ${JSON.stringify(state.details)}`);
  }
}

// focus.bodyFocus/focusVisible/dialogsOpen live on record.focus; everything else is an exact match on record.focus.active.
const FOCUS_TOP_LEVEL = new Set(['bodyFocus', 'focusVisible', 'dialogsOpen']);
function assertFocus(record, expect, label) {
  for (const [key, value] of Object.entries(expect)) {
    const actual = FOCUS_TOP_LEVEL.has(key) ? record.focus[key] : record.focus.active?.[key];
    assert.deepEqual(actual, value, `${label}: expected focus.${FOCUS_TOP_LEVEL.has(key) ? key : `active.${key}`} = ${JSON.stringify(value)}, got ${JSON.stringify(actual)} (active: ${JSON.stringify(record.focus.active)})`);
  }
}

function assertVisual(record, expect, label) {
  const visual = record.evidence.visual;
  assert.ok(visual && visual.ok, `${label}: expected visual evidence for the checked element, got ${JSON.stringify(visual)}`);
  if (expect.selector !== undefined) assert.equal(visual.selector, expect.selector, `${label}: visual evidence is for ${visual.selector}, expected ${expect.selector}`);
  if (expect.focused !== undefined) assert.equal(visual.focus.focused, expect.focused, `${label}: visual.focus.focused`);
  if (expect.focusVisible !== undefined) assert.equal(visual.focus.focusVisible, expect.focusVisible, `${label}: visual.focus.focusVisible`);
  if (expect.indicatorPresent !== undefined) assert.equal(visual.focus.indicatorPresent, expect.indicatorPresent, `${label}: expected indicatorPresent ${expect.indicatorPresent}, got ${visual.focus.indicatorPresent} (indicator ${JSON.stringify(visual.focus.indicator)})`);
  if (expect.indicatorStyle !== undefined) assert.equal(visual.focus.indicator.style, expect.indicatorStyle, `${label}: expected outline style ${expect.indicatorStyle}, got ${visual.focus.indicator.style}`);
  if (expect.iconDeclared !== undefined) assert.equal(visual.icon.declared, expect.iconDeclared, `${label}: expected icon declared=${expect.iconDeclared}, got ${JSON.stringify({ backgroundImage: visual.icon.backgroundImage, maskImage: visual.icon.maskImage })}`);
  if (expect.iconBackgroundImageNone) assert.equal(visual.icon.backgroundImage, 'none', `${label}: the icon's background-image must be removed, got ${visual.icon.backgroundImage}`);
}

function assertEnvironment(record, expect, label) {
  for (const [key, value] of Object.entries(expect)) {
    assert.equal(record.environment?.[key], value, `${label}: expected environment.${key} = ${JSON.stringify(value)}, got ${JSON.stringify(record.environment?.[key])}`);
  }
}

// Recorder evidence. installObservation() binds window.__labReport, so the recorder delivers each action's changes to the
// run's binding buffer instead of window.__lab.changes; that is why the checkpoint's own
// record.evidence.speech.recorder.changes is normally empty here and the binding buffer is the same evidence. Both are
// read so the assertion does not depend on which path the recorder took.
function recorderChanges(record, bindingChanges) {
  const fromRecord = record.evidence?.speech?.recorder?.changes || [];
  return [...fromRecord, ...bindingChanges].flatMap((observation) => (observation.changes || []).map((change) => ({
    ...change, action: observation.action, on: observation.on,
  })));
}

function assertChanges(record, bindingChanges, expect, label) {
  const changes = recorderChanges(record, bindingChanges);
  for (const exp of expect) {
    const matches = changes.filter((change) => (exp.whereContains === undefined || String(change.where || '').includes(exp.whereContains))
      && (exp.textContains === undefined || String(change.text || '').includes(exp.textContains)));
    assert.ok(matches.length > 0, `${label}: expected a recorded change where~${JSON.stringify(exp.whereContains)} text~${JSON.stringify(exp.textContains)}; recorder changes: ${JSON.stringify(changes)}`);
    if (exp.how !== undefined) {
      assert.ok(matches.some((change) => change.how === exp.how), `${label}: expected the change to be classified "${exp.how}", got ${JSON.stringify(matches.map((change) => change.how))}`);
      if (exp.how !== 'silent') {
        assert.ok(!matches.some((change) => change.how === 'silent'), `${label}: the change must not be silent, but a silent change also matches: ${JSON.stringify(matches)}`);
      }
    }
  }
}

async function assertAttributes(page, specs, label) {
  for (const spec of specs) {
    const value = await page.getAttribute(spec.selector, spec.attribute);
    if (spec.absent) assert.equal(value, null, `${label}: ${spec.selector} must not have ${spec.attribute}, got ${JSON.stringify(value)}`);
    if (spec.equals !== undefined) assert.equal(value, spec.equals, `${label}: ${spec.selector}[${spec.attribute}] expected ${JSON.stringify(spec.equals)}, got ${JSON.stringify(value)}`);
  }
}

async function assertVisibility(page, specs, label) {
  for (const spec of specs) {
    const locator = spec.selector ? page.locator(spec.selector) : page.getByRole(spec.role, { name: spec.name, exact: true });
    assert.equal(await locator.isVisible(), spec.visible, `${label}: ${spec.selector || `${spec.role} "${spec.name}"`} visible expected ${spec.visible}`);
  }
}

async function assertCheckpoint(page, fixture, checkpoint, record, changes) {
  const label = labelOf(fixture, checkpoint);
  const expect = checkpoint.expect || {};
  assert.equal(record.status, 'captured', `${label}: the checkpoint was not captured (${record.status}): ${JSON.stringify(record.state?.readiness)}`);
  assert.equal(record.state.readiness.satisfied, true, `${label}: the readiness condition was not met: ${JSON.stringify(record.state.readiness)}`);
  assert.equal(record.page.path, `/${fixture.file}`, `${label}: checkpoint recorded for the wrong page`);
  assert.ok(record.evidence.dir && fs.existsSync(path.join(labRoot, record.evidence.dir)), `${label}: the checkpoint's evidence directory was not written`);
  assertEnginesRan(record, label);
  assertFindings(record, expect, fixture, checkpoint);
  if (expect.state) assertState(record, expect.state, label);
  if (expect.focus) assertFocus(record, expect.focus, label);
  if (expect.visual) assertVisual(record, expect.visual, label);
  if (expect.environment) assertEnvironment(record, expect.environment, label);
  if (expect.changes) assertChanges(record, changes, expect.changes, label);
  if (expect.attributes) await assertAttributes(page, expect.attributes, label);
  if (expect.visibility) await assertVisibility(page, expect.visibility, label);
}

// One defect observed at several checkpoints is one session finding with one observation per checkpoint.
function assertDedupe(session, fixture) {
  const dedupe = fixture.dedupe;
  const matches = session.session.findings.filter((finding) => matchFinding(finding, dedupe.match));
  assert.equal(matches.length, dedupe.distinct, `${fixture.file}: expected ${dedupe.distinct} distinct finding(s) for ${dedupe.match.engine} ${dedupe.match.ruleId}, got ${matches.length}: ${matches.map(describeFinding).join('; ')}`);
  const expectedCheckpoints = fixture.checkpoints.map((checkpoint) => checkpoint.id).sort();
  for (const finding of matches) {
    assert.equal(finding.observations.length, dedupe.observations, `${fixture.file}: expected ${dedupe.observations} observations, got ${finding.observations.length}`);
    assert.deepEqual([...new Set(finding.observations.map((observation) => observation.checkpointId))].sort(), expectedCheckpoints,
      `${fixture.file}: the deduplicated finding must be observed at every checkpoint`);
  }
}

// Report generation must not throw: the session index and the human-readable summary exist and agree with the records.
function assertReports(session, fixture) {
  const sessionFile = path.join(session.dir, 'session.json');
  const summaryFile = path.join(session.dir, 'SUMMARY.md');
  const reportFile = path.join(session.dir, 'report.html');
  assert.ok(fs.existsSync(sessionFile), `${fixture.file}: session.json was not written`);
  assert.ok(fs.existsSync(summaryFile), `${fixture.file}: SUMMARY.md was not written`);
  assert.ok(fs.existsSync(reportFile), `${fixture.file}: report.html was not written`);
  const data = JSON.parse(fs.readFileSync(sessionFile, 'utf8'));
  assert.equal(data.schema, SESSION_SCHEMA, `${fixture.file}: session.json has the wrong schema`);
  assert.deepEqual(data.checkpoints.map((checkpoint) => checkpoint.id).sort(), fixture.checkpoints.map((checkpoint) => checkpoint.id).sort(),
    `${fixture.file}: session.json does not list every checkpoint`);
  assert.ok(!data.limits.some((limit) => String(limit).startsWith('Report generation failed')), `${fixture.file}: report generation failed: ${JSON.stringify(data.limits)}`);
  assert.ok(fs.readFileSync(summaryFile, 'utf8').trim().length > 0, `${fixture.file}: SUMMARY.md is empty`);
}

// ---- trusted input steps (data from expected.json)

async function runStep(page, step) {
  switch (step.action) {
    case 'click':
      if (step.selector) await page.locator(step.selector).click();
      else await page.getByRole(step.role || 'button', { name: step.name, exact: true }).click();
      return;
    case 'key':
      await page.keyboard.press(step.key);
      return;
    case 'waitForSelector':
      // An explicit condition, never a fixed sleep.
      await page.waitForSelector(step.selector, { state: step.state || 'visible', timeout: 5000 });
      return;
    case 'waitForFunction':
      await page.waitForFunction(`Boolean(${step.expression})`, undefined, { timeout: 5000, polling: 100 });
      return;
    case 'emulateMedia':
      await page.emulateMedia({ forcedColors: step.forcedColors });
      return;
    default:
      throw new Error(`unknown fixture step: ${JSON.stringify(step)}`);
  }
}

// ---- one fixture: one context + page + session, all checkpoints in order

async function runFixture(browser, serverUrl, fixture) {
  const browserContext = await browser.newContext();
  const page = await browserContext.newPage();
  const observation = await installObservation(page);
  const requests = [];
  page.on('request', (request) => requests.push(request.url()));
  try {
    const response = await page.goto(`${serverUrl}/${fixture.file}`, { waitUntil: 'load' });
    assert.equal(response?.status(), 200, `${fixture.file}: the fixture server did not return 200`);
    const pageContext = { ...resolvePageContext(page.url(), {}), scenarioId: `fixture-${fixture.file}` };
    assert.equal(pageContext.allowed, true, `${fixture.file}: the loopback fixture context was not resolved as allowed: ${pageContext.reason}`);
    // hint is not null on purpose: sessionDirFor() names a session directory from hint.label plus a seconds-resolution
    // timestamp, so two SessionStore instances created in the same second with hint:null share one directory and
    // overwrite each other's checkpoints (a shared-module limitation, reported rather than worked around in shared code).
    const session = new SessionStore({ context: pageContext, hint: { label: `fixture-${fixture.file.replace(/\.html$/, '')}` }, profile: EXPECTED.profile || 'full' });
    const captured = [];
    for (const checkpoint of fixture.checkpoints) {
      const changesBefore = observation.changes.length;
      for (const step of checkpoint.steps) await runStep(page, step);
      const request = { id: checkpoint.id, label: checkpoint.label, profile: checkpoint.profile || EXPECTED.profile || 'full' };
      if (checkpoint.scope) request.scope = checkpoint.scope;
      // screenshot:false keeps the run inside the test budget; every other collector and engine of the profile still runs.
      const { record } = await captureCheckpoint(page, request, { session, context: pageContext, screenshot: false });
      const changes = observation.changes.slice(changesBefore);
      captured.push({ checkpoint, record, changes });
      await assertCheckpoint(page, fixture, checkpoint, record, changes);
    }

    // Page-load-only scan must miss the state-dependent defect.
    const initial = captured.find((entry) => entry.checkpoint.id === 'initial');
    assert.ok(initial, `${fixture.file}: no initial checkpoint was captured`);
    for (const exp of fixture.pageLoadMustNotReport) {
      const matching = initial.record.findings.filter((finding) => matchFinding(finding, exp));
      assert.equal(matching.length, 0, `${fixture.file}: a page-load scan must not report ${exp.engine} ${ruleText(exp)} (${exp.why}); got ${matching.map(describeFinding).join('; ')}`);
    }

    if (fixture.dedupe) assertDedupe(session, fixture);

    // The controls are local: nothing may be fetched outside the fixture server (no CDN, font, image or beacon).
    const external = requests.filter((url) => !url.startsWith(`${serverUrl}/`));
    assert.deepEqual(external, [], `${fixture.file}: requested a URL outside the local fixture server: ${external.join(', ')}`);

    await session.refreshReports();
    assertReports(session, fixture);
  } finally {
    await browserContext.close();
  }
}

// ---- test registration

const availability = await launchBrowser();

if (!availability.ok) {
  test('dynamic checkpoint negative controls (skipped)', (t) => {
    t.skip(`Chromium is not available, so the negative controls cannot be measured: ${availability.reason}`);
  });
} else {
  const browser = availability.browser;
  const server = await startFixtureServer();
  test.after(async () => {
    await browser.close();
    await server.close();
  });
  for (const fixture of EXPECTED.fixtures) {
    test(`negative control: ${fixture.file}`, { timeout: 120000 }, async () => {
      await runFixture(browser, server.url, fixture);
    });
  }
}
