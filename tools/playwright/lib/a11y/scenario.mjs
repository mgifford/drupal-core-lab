// The "explore first, then replay" half of a dynamic accessibility checkpoint: a small, data-only scenario
// representation (JSON, schema lab-a11y-scenario/1) and a deterministic Playwright runner.
//
// Two things are deliberately not invented here:
//   - no scripting language. A scenario is an ordered list of steps from a fixed vocabulary, plus optional
//     read-only in-page expressions (`evaluate`) for facts the data steps cannot express. The expression is
//     NOT an unrestricted host-code endpoint: validation rejects anything that could click, focus, type,
//     navigate, reload, reset, submit, write storage or otherwise change state.
//   - no element references copied from an MCP session. Locators are semantic (role + name, label, text,
//     testId) and a bare selector only as a last resort for markup that has no usable semantic handle
//     (`<summary>` has no Playwright role mapping, for example). An MCP reference such as `e12` is rejected
//     with a named problem rather than resolved to whatever it means in another session.
//
// The runner (tools/playwright/scenario-run.mjs) opens each side with lib/lab-run.mjs `openSide`, then calls
// runScenario() to replay the same steps against Before and After. Checkpoints are captured with
// captureCheckpoint(), so replay and exploratory capture produce the same record. After both sides,
// compareScenario() pairs the records, refuses to compare states that are not equivalent, and classifies
// findings and scenario assertions. The CLI writes the result with lab-run.mjs `writeRun`.
//
// Pure part: this module does not import Playwright. captureCheckpoint()/waitForReadiness() are imported
// inside runScenario() only, so validateScenario(), locatorOf() and compareScenario() work with no browser.
import fs from 'node:fs';
import path from 'node:path';
import { labRoot } from '../../../compare/lib.mjs';
import { equivalence, validId } from './checkpoint.mjs';
import { classifyPair } from './findings.mjs';
import { loadRecords } from './report.mjs';

export const SCENARIO_SCHEMA = 'lab-a11y-scenario/1';
export const BROWSERS = ['chromium', 'firefox', 'webkit'];
export const COLOUR_SCHEMES = ['light', 'dark'];
export const REDUCED_MOTION = ['no-preference', 'reduce'];
export const ACTIONS = ['goto', 'click', 'press', 'fill', 'check', 'uncheck', 'hover', 'selectOption', 'waitFor', 'checkpoint', 'screenshot', 'evaluate', 'assert'];
export const READINESS_STATES = ['visible', 'attached', 'hidden', 'detached'];
export const LOCATOR_KINDS = ['role', 'label', 'text', 'testId', 'selector'];

const MAX = { steps: 200, checkpoints: 60, expression: 2000, label: 200, text: 500, notes: 6000, list: 60 };
const MCP_REF = /^e\d+$/;
const IDENT = /^[a-z0-9][a-z0-9._-]{0,79}$/;

const isObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const isString = (v) => typeof v === 'string';
const isNonEmptyString = (v, n = MAX.text) => isString(v) && v.trim().length > 0 && v.length <= n;

// Words an `evaluate` expression may not contain: each one can change page state, navigate, or execute more
// code. The list is deliberately conservative; a legitimate read-only expression does not need any of them.
const FORBIDDEN_EXPRESSION = [
  '.click(', '.focus(', '.blur(', '.submit(', '.reset(', '.remove(', '.append(', '.appendChild(', '.insertBefore(', '.removeChild(',
  'dispatchEvent', 'setAttribute', 'removeAttribute', 'innerHTML', 'outerHTML', 'textContent=', 'value=', 'document.write',
  'localStorage', 'sessionStorage', 'indexedDB', 'document.cookie', 'location', 'navigate', 'reload', 'history.',
  'scrollTo', 'scrollIntoView', 'scrollBy', 'requestSubmit', 'fetch(', 'XMLHttpRequest', 'postMessage', 'eval(', 'new Function',
  'import(', 'setTimeout(', 'setInterval(',
];

// --------------------------------------------------------------------------------------------- validation
function problemsForKeys(obj, allowed, where, problems) {
  for (const key of Object.keys(obj)) if (!allowed.has(key)) problems.push(`${where}: unknown key "${key}" (allowed: ${[...allowed].join(', ')})`);
}

function arrayOfStrings(value, name, problems, { required = true, max = MAX.list, maxLength = 300 } = {}) {
  if (value == null) { if (required) problems.push(`${name} is required and must be an array of strings`); return; }
  if (!Array.isArray(value)) { problems.push(`${name} must be an array of strings`); return; }
  if (value.length > max) problems.push(`${name} has more than ${max} entries`);
  value.forEach((v, i) => { if (!isString(v) || !v.trim()) problems.push(`${name}[${i}] must be a non-empty string`); else if (v.length > maxLength) problems.push(`${name}[${i}] is longer than ${maxLength} characters`); });
}

function timeoutProblem(value, where, problems) {
  if (value == null) return;
  if (!Number.isInteger(value) || value < 100 || value > 120000) problems.push(`${where}.timeoutMs must be an integer between 100 and 120000`);
}

export function validateReadiness(readiness, where, problems, { required = false } = {}) {
  if (readiness == null) { if (required) problems.push(`${where}.readiness is required: state an explicit condition (selector, expression or networkIdle); fixed sleeps are not supported`); return; }
  if (isString(readiness)) {
    if (!readiness.trim() || readiness.length > 300) problems.push(`${where}.readiness selector must be a non-empty string of at most 300 characters`);
    return;
  }
  if (!isObject(readiness)) { problems.push(`${where}.readiness must be a selector string or an object`); return; }
  problemsForKeys(readiness, new Set(['selector', 'expression', 'networkIdle', 'state', 'timeoutMs', 'kind']), `${where}.readiness`, problems);
  const has = ['selector', 'expression', 'networkIdle'].filter((k) => readiness[k] != null);
  if (readiness.kind === 'networkIdle' && !has.includes('networkIdle')) has.push('networkIdle');
  if (has.length !== 1) { problems.push(`${where}.readiness must set exactly one of selector, expression or networkIdle`); return; }
  if (readiness.selector != null) {
    if (!isNonEmptyString(readiness.selector, 300)) problems.push(`${where}.readiness.selector must be a non-empty string of at most 300 characters`);
    if (readiness.state != null && !READINESS_STATES.includes(readiness.state)) problems.push(`${where}.readiness.state must be one of ${READINESS_STATES.join(', ')}`);
  }
  if (readiness.expression != null) {
    if (!isNonEmptyString(readiness.expression, MAX.expression)) problems.push(`${where}.readiness.expression must be a non-empty string of at most ${MAX.expression} characters`);
    else if (!/^[\s\w.\[\]'"()=!<>&|?:+\-*/%,;#@$]*$/.test(readiness.expression)) problems.push(`${where}.readiness.expression contains characters that are not allowed in a boolean expression`);
  }
  timeoutProblem(readiness.timeoutMs, `${where}.readiness`, problems);
}

export function validateLocator(locator, where, problems) {
  if (!isObject(locator)) { problems.push(`${where}.locator must be an object`); return; }
  problemsForKeys(locator, new Set(['role', 'name', 'exact', 'label', 'text', 'testId', 'selector']), `${where}.locator`, problems);
  const kinds = LOCATOR_KINDS.filter((k) => locator[k] != null);
  if (kinds.length !== 1) { problems.push(`${where}.locator must set exactly one of role, label, text, testId or selector`); return; }
  const [kind] = kinds;
  if (kind === 'role') {
    if (!isNonEmptyString(locator.role, 40)) problems.push(`${where}.locator.role must be a non-empty string of at most 40 characters`);
    if (!isNonEmptyString(locator.name, 160)) problems.push(`${where}.locator.name is required with role (an accessible name, not an MCP reference)`);
  } else if (!isNonEmptyString(locator[kind], kind === 'selector' ? 300 : 160)) {
    problems.push(`${where}.locator.${kind} must be a non-empty string of at most ${kind === 'selector' ? 300 : 160} characters`);
  }
  if (locator.exact != null && typeof locator.exact !== 'boolean') problems.push(`${where}.locator.exact must be true or false`);
  for (const k of ['role', 'name', 'label', 'text', 'testId', 'selector']) {
    const v = locator[k];
    if (isString(v) && MCP_REF.test(v.trim())) problems.push(`${where}.locator.${k} is an MCP element reference ("${v}"); those are session-scoped and never valid in a scenario. Use role + name, label, text or testId.`);
  }
}

function validateStateExpectation(exp, where, problems) {
  if (!isObject(exp)) { problems.push(`${where} must be an object with path and one of equals, truthy or countMin`); return; }
  problemsForKeys(exp, new Set(['path', 'equals', 'truthy', 'countMin']), where, problems);
  if (!isNonEmptyString(exp.path, 200)) problems.push(`${where}.path is required (for example "state.application.messages" or "focus.active.role")`);
  const modes = ['equals', 'truthy', 'countMin'].filter((k) => Object.hasOwn(exp, k));
  if (modes.length !== 1) problems.push(`${where} must set exactly one of equals, truthy or countMin`);
  if (Object.hasOwn(exp, 'countMin') && (!Number.isInteger(exp.countMin) || exp.countMin < 0)) problems.push(`${where}.countMin must be a non-negative integer`);
  if (Object.hasOwn(exp, 'truthy') && typeof exp.truthy !== 'boolean') problems.push(`${where}.truthy must be true or false`);
}

export function validateCheck(check, where, problems) {
  if (!isObject(check)) { problems.push(`${where} must be a check object`); return; }
  const kinds = [
    ['engine', ['engine', 'rule', 'targetContains', 'present']],
    ['focus', ['focus']],
    ['state', ['state']],
    ['announcement', ['announcement']],
    ['silentChange', ['silentChange']],
    ['equivalence', ['equivalence']],
  ].filter(([, keys]) => keys.some((k) => Object.hasOwn(check, k)));
  if (!kinds.length) { problems.push(`${where} has no recognised check: use engine/rule, focus, state, announcement, silentChange or equivalence`); return; }
  if (kinds.length > 1) { problems.push(`${where} mixes check types (${kinds.map(([k]) => k).join(', ')}); a check is one of them`); return; }
  const [kind, keys] = kinds[0];
  problemsForKeys(check, new Set(keys), where, problems);
  if (kind === 'engine') {
    if (!isNonEmptyString(check.engine, 60)) problems.push(`${where}.engine is required (for example "axe-core" or "htmlcs")`);
    if (!isNonEmptyString(check.rule, 120)) problems.push(`${where}.rule is required (for example "color-contrast")`);
    if (check.targetContains != null && !isNonEmptyString(check.targetContains, 200)) problems.push(`${where}.targetContains must be a string of at most 200 characters (it is matched against the finding's element selector)`);
    if (check.present != null && typeof check.present !== 'boolean') problems.push(`${where}.present must be true or false`);
  } else if (kind === 'focus') {
    const f = check.focus;
    if (!isObject(f)) { problems.push(`${where}.focus must be an object with role, name and/or within`); return; }
    problemsForKeys(f, new Set(['role', 'name', 'within']), `${where}.focus`, problems);
    if (f.role == null && f.name == null && f.within == null) problems.push(`${where}.focus needs at least one of role, name or within`);
    if (f.role != null && !isNonEmptyString(f.role, 40)) problems.push(`${where}.focus.role must be a non-empty string of at most 40 characters`);
    if (f.name != null && !isNonEmptyString(f.name, 160)) problems.push(`${where}.focus.name must be a non-empty string of at most 160 characters`);
    if (f.within != null && (!isNonEmptyString(f.within, 300) || /[\u0000-\u001f]/.test(f.within))) problems.push(`${where}.focus.within must be a CSS selector of at most 300 characters with no control characters`);
  } else if (kind === 'state') {
    validateStateExpectation(check.state, `${where}.state`, problems);
  } else if (kind === 'announcement') {
    const a = check.announcement;
    if (!isObject(a)) { problems.push(`${where}.announcement must be an object with text and via`); return; }
    problemsForKeys(a, new Set(['text', 'via']), `${where}.announcement`, problems);
    if (!isNonEmptyString(a.text, 300)) problems.push(`${where}.announcement.text is required (a substring of the observed announcement)`);
    if (!['announce', 'live'].includes(a.via)) problems.push(`${where}.announcement.via must be "announce" (Drupal.announce) or "live" (a live region)`);
  } else if (kind === 'silentChange') {
    if (typeof check.silentChange !== 'boolean') problems.push(`${where}.silentChange must be true or false`);
  } else if (kind === 'equivalence') {
    validateEquivalence(check.equivalence, `${where}.equivalence`, problems);
  }
}

export function validateEquivalence(exp, where, problems) {
  if (!isObject(exp)) { problems.push(`${where} must be an object`); return; }
  problemsForKeys(exp, new Set(['dialogOpen', 'states', 'content', 'focus']), where, problems);
  if (exp.dialogOpen != null && typeof exp.dialogOpen !== 'boolean') problems.push(`${where}.dialogOpen must be true or false`);
  if (exp.focus != null) problems.push(`${where}.focus is not an equivalence expectation: a focus difference is often the behaviour under test. Use a per-side assert with focus, or omit it here.`);
  if (exp.states != null) {
    if (!Array.isArray(exp.states) || !exp.states.length) problems.push(`${where}.states must be a non-empty array`);
    else exp.states.forEach((s, i) => validateStateExpectation(s, `${where}.states[${i}]`, problems));
  }
  if (exp.content != null) arrayOfStrings(exp.content, `${where}.content`, problems, { max: 20, maxLength: 300 });
  if (!['dialogOpen', 'states', 'content'].some((k) => exp[k] != null)) problems.push(`${where} needs at least one of dialogOpen, states or content`);
}

function validateStep(step, index, problems) {
  const where = `steps[${index}]`;
  if (!isObject(step)) { problems.push(`${where} must be an object`); return; }
  const action = step.action;
  if (!ACTIONS.includes(action)) {
    if (typeof action === 'string' && /^(sleep|wait|pause|waitForTimeout|waitForNavigation|delay)$/i.test(action)) problems.push(`${where}: action "${action}" is not supported. Waits must be explicit conditions: use goto/waitFor with a selector, expression or networkIdle readiness condition, never a fixed sleep.`);
    else problems.push(`${where}: unknown action "${action}" (allowed: ${ACTIONS.join(', ')})`);
    return;
  }
  const byAction = {
    goto: ['path', 'readiness'], click: ['locator'], press: ['key', 'locator'], fill: ['locator', 'value'], check: ['locator'], uncheck: ['locator'],
    hover: ['locator'], selectOption: ['locator', 'value'], waitFor: ['readiness'], checkpoint: ['id'], screenshot: ['name'], evaluate: ['expression'], assert: ['check'],
  };
  problemsForKeys(step, new Set(['action', 'label', 'timeoutMs', 'optional', ...byAction[action]]), `${where} (${action})`, problems);
  if (step.label != null && !isNonEmptyString(step.label, MAX.label)) problems.push(`${where}.label must be a non-empty string of at most ${MAX.label} characters`);
  timeoutProblem(step.timeoutMs, where, problems);
  if (step.optional != null && typeof step.optional !== 'boolean') problems.push(`${where}.optional must be true or false`);
  const requires = (...keys) => { for (const k of keys) if (step[k] == null) problems.push(`${where} (${action}) requires "${k}"`); };
  if (action === 'goto') {
    requires('path', 'readiness');
    if (step.path != null && (!isNonEmptyString(step.path, 300) || !step.path.startsWith('/'))) problems.push(`${where}.path must be a non-empty path starting with "/" (at most 300 characters)`);
    validateReadiness(step.readiness, where, problems, { required: true });
  } else if (action === 'click' || action === 'check' || action === 'uncheck' || action === 'hover' || action === 'press' || action === 'fill' || action === 'selectOption') {
    if (action !== 'press' || step.locator != null) requires('locator');
    if (step.locator != null) validateLocator(step.locator, where, problems);
    if (action === 'press') {
      requires('key');
      if (!isNonEmptyString(step.key, 40)) problems.push(`${where}.key must be a non-empty key name of at most 40 characters`);
    }
    if ((action === 'fill' || action === 'selectOption') && !isString(step.value)) problems.push(`${where}.value must be a string`);
    if (action === 'fill' && isString(step.value) && step.value.length > 10000) problems.push(`${where}.value is longer than 10000 characters`);
  } else if (action === 'waitFor') {
    requires('readiness');
    validateReadiness(step.readiness, where, problems, { required: true });
  } else if (action === 'checkpoint') {
    requires('id');
    if (step.id != null && !IDENT.test(step.id)) problems.push(`${where}.id must be a lower-case checkpoint id ([a-z0-9._-], 1-80 characters starting with a letter or digit)`);
  } else if (action === 'screenshot') {
    requires('name');
    if (step.name != null && !isNonEmptyString(step.name, 80)) problems.push(`${where}.name must be a non-empty string of at most 80 characters`);
  } else if (action === 'evaluate') {
    requires('expression');
    validateExpression(step.expression, `${where}.expression`, problems);
  } else if (action === 'assert') {
    requires('check');
    if (step.check != null) validateCheck(step.check, `${where}.check`, problems);
  }
}

export function validateExpression(expression, where, problems) {
  if (!isNonEmptyString(expression, MAX.expression)) { problems.push(`${where} must be a non-empty read-only expression of at most ${MAX.expression} characters`); return; }
  const lower = expression.toLowerCase().replace(/\s+/g, ' ');
  for (const token of FORBIDDEN_EXPRESSION) if (lower.includes(token.toLowerCase())) { problems.push(`${where} contains "${token}", which changes state, navigates or executes more code. evaluate is a read-only in-page probe, not an unrestricted host-code endpoint.`); return; }
  if (/;\s*[a-z$(]/i.test(expression) && !/^\(?\(\)\s*=>/.test(expression.trim())) problems.push(`${where} looks like several statements; give one read-only expression (a single value, optionally an arrow function with one expression body)`);
}

function validateCheckpointDefinition(cp, index, problems) {
  const where = `checkpoints[${index}]`;
  if (!isObject(cp)) { problems.push(`${where} must be an object`); return; }
  problemsForKeys(cp, new Set(['id', 'label', 'profile', 'scope', 'include', 'exclude', 'tags', 'rules', 'readiness', 'expected']), where, problems);
  if (!validId(cp.id)) problems.push(`${where}.id is required and must be a lower-case identifier ([a-z0-9._-], 1-80 characters starting with a letter or digit)`);
  if (!isNonEmptyString(cp.label, MAX.label)) problems.push(`${where}.label is required (a short human label of at most ${MAX.label} characters)`);
  if (cp.profile != null && !['quick', 'semantic', 'visual', 'dynamic', 'multi-engine', 'full'].includes(cp.profile)) problems.push(`${where}.profile must be one of quick, semantic, visual, dynamic, multi-engine, full`);
  if (cp.scope != null && !isNonEmptyString(cp.scope, 300)) problems.push(`${where}.scope must be a non-empty CSS selector of at most 300 characters`);
  arrayOfStrings(cp.include, `${where}.include`, problems, { required: false, max: 50, maxLength: 300 });
  arrayOfStrings(cp.exclude, `${where}.exclude`, problems, { required: false, max: 50, maxLength: 300 });
  arrayOfStrings(cp.tags, `${where}.tags`, problems, { required: false, max: 30, maxLength: 100 });
  arrayOfStrings(cp.rules, `${where}.rules`, problems, { required: false, max: 200, maxLength: 120 });
  if (cp.readiness != null) validateReadiness(cp.readiness, where, problems, { required: false });
  if (cp.expected != null) validateEquivalence(cp.expected, `${where}.expected`, problems);
}

// Hand-written: no new npm dependency, and unknown keys are problems so a typo cannot silently do nothing.
export function validateScenario(obj) {
  const problems = [];
  if (!isObject(obj)) return { ok: false, problems: ['the scenario must be a JSON object'] };
  const allowed = new Set(['schema', 'id', 'issue', 'variant', 'title', 'description', 'preconditions', 'fixture', 'route', 'login', 'viewport', 'browser', 'colourScheme', 'forcedColors', 'reducedMotion', 'steps', 'checkpoints', 'expected', 'regressionAssertions', 'resetInstructions', 'manualReview', 'limits', 'verified', 'notes']);
  problemsForKeys(obj, allowed, 'scenario', problems);

  if (obj.schema !== SCENARIO_SCHEMA) problems.push(`schema must be "${SCENARIO_SCHEMA}" (got ${JSON.stringify(obj.schema)})`);
  if (!validId(obj.id)) problems.push('id is required: a stable lower-case identifier ([a-z0-9._-], 1-80 characters starting with a letter or digit)');
  if (obj.issue != null && !/^\d+$/.test(String(obj.issue))) problems.push('issue must be a drupal.org issue number or null');
  if (obj.variant != null && (typeof obj.variant !== 'string' || !/^[a-z0-9][a-z0-9._-]*$/.test(obj.variant))) problems.push('variant must be a registered variant slug or null');
  if (!isNonEmptyString(obj.title, 200)) problems.push('title is required (a short human title of at most 200 characters)');
  if (!isNonEmptyString(obj.description, 2000)) problems.push('description is required (at most 2000 characters)');
  arrayOfStrings(obj.preconditions, 'preconditions', problems);
  if (!isObject(obj.fixture)) problems.push('fixture is required: {"recipe": "..."} or {"standardInstall": true}, plus notes');
  else {
    problemsForKeys(obj.fixture, new Set(['recipe', 'standardInstall', 'notes']), 'fixture', problems);
    const hasRecipe = obj.fixture.recipe != null, standard = obj.fixture.standardInstall === true;
    if (hasRecipe && standard) problems.push('fixture must not set both recipe and standardInstall');
    if (!hasRecipe && !standard) problems.push('fixture must name a recipe or set standardInstall: true');
    if (hasRecipe && !isNonEmptyString(obj.fixture.recipe, 300)) problems.push('fixture.recipe must be a non-empty recipe path or name');
    if (obj.fixture.standardInstall != null && typeof obj.fixture.standardInstall !== 'boolean') problems.push('fixture.standardInstall must be true or false');
    if (!isNonEmptyString(obj.fixture.notes, 1000)) problems.push('fixture.notes is required: say what the fixture provides and what is missing');
  }
  if (!isNonEmptyString(obj.route, 300) || !obj.route.startsWith('/')) problems.push('route is required: the initial path, starting with "/" (at most 300 characters)');
  if (typeof obj.login !== 'boolean') problems.push('login must be true or false (whether the side is logged in before the steps)');
  if (!isObject(obj.viewport)) problems.push('viewport is required as {"width": n, "height": n}');
  else {
    problemsForKeys(obj.viewport, new Set(['width', 'height']), 'viewport', problems);
    for (const k of ['width', 'height']) if (!Number.isInteger(obj.viewport[k]) || obj.viewport[k] < 200 || obj.viewport[k] > 10000) problems.push(`viewport.${k} must be an integer between 200 and 10000`);
  }
  if (!BROWSERS.includes(obj.browser)) problems.push(`browser must be one of ${BROWSERS.join(', ')}`);
  if (!COLOUR_SCHEMES.includes(obj.colourScheme)) problems.push(`colourScheme must be one of ${COLOUR_SCHEMES.join(', ')}`);
  if (typeof obj.forcedColors !== 'boolean') problems.push('forcedColors must be true or false');
  if (!REDUCED_MOTION.includes(obj.reducedMotion)) problems.push(`reducedMotion must be one of ${REDUCED_MOTION.join(', ')}`);

  if (!Array.isArray(obj.steps) || !obj.steps.length) problems.push('steps is required and must be a non-empty ordered array');
  else {
    if (obj.steps.length > MAX.steps) problems.push(`steps has more than ${MAX.steps} entries`);
    obj.steps.forEach((s, i) => validateStep(s, i, problems));
  }

  // The replay always starts by navigating to the scenario's initial route with an explicit readiness
  // condition: the first step must be that goto, so a scenario cannot silently start on whatever page the
  // login flow happened to leave open.
  if (Array.isArray(obj.steps) && obj.steps.length) {
    const first = obj.steps[0];
    if (!isObject(first) || first.action !== 'goto') problems.push('steps[0] must be the initial {"action":"goto"} with an explicit readiness condition, so the replay always starts on the scenario route');
    else {
      if (first.path !== obj.route) problems.push(`steps[0].path "${first.path}" must equal the scenario route "${obj.route}"`);
      if (first.readiness == null) problems.push('steps[0] (goto the initial route) needs an explicit readiness condition');
    }
  }

  const checkpointIds = new Set();
  if (!Array.isArray(obj.checkpoints)) problems.push('checkpoints is required and must be an array (it may be empty)');
  else {
    if (obj.checkpoints.length > MAX.checkpoints) problems.push(`checkpoints has more than ${MAX.checkpoints} entries`);
    obj.checkpoints.forEach((cp, i) => {
      validateCheckpointDefinition(cp, i, problems);
      if (cp && isString(cp.id)) {
        if (checkpointIds.has(cp.id)) problems.push(`checkpoints[${i}].id "${cp.id}" is declared more than once`);
        checkpointIds.add(cp.id);
      }
    });
  }

  const checkList = (value, name, where) => {
    if (value == null) { problems.push(`${name} is required and must be an array of check objects`); return; }
    if (!Array.isArray(value)) { problems.push(`${name} must be an array of check objects`); return; }
    if (value.length > 40) problems.push(`${name} has more than 40 entries`);
    value.forEach((c, i) => validateCheck(c, `${where}[${i}]`, problems));
  };
  checkList(obj.expected, 'expected', 'expected');
  checkList(obj.regressionAssertions, 'regressionAssertions', 'regressionAssertions');
  arrayOfStrings(obj.resetInstructions, 'resetInstructions', problems);
  arrayOfStrings(obj.manualReview, 'manualReview', problems, { maxLength: 1000 });
  arrayOfStrings(obj.limits, 'limits', problems, { maxLength: 1000 });
  if (typeof obj.verified !== 'boolean') problems.push('verified must be true or false (whether this scenario was ever replayed against a real Before/After pair)');
  if (!isNonEmptyString(obj.notes, MAX.notes)) problems.push(`notes is required (at most ${MAX.notes} characters): say what was read, what was inferred, and what is missing`);

  // Cross-references between steps and declared checkpoints.
  if (Array.isArray(obj.steps) && Array.isArray(obj.checkpoints)) {
    const declared = new Set(obj.checkpoints.filter((c) => c && isString(c.id)).map((c) => c.id));
    const referenced = new Set();
    obj.steps.forEach((s, i) => {
      if (s && s.action === 'checkpoint' && isString(s.id)) {
        if (!declared.has(s.id)) problems.push(`steps[${i}].id "${s.id}" has no matching entry in checkpoints[]`);
        if (referenced.has(s.id)) problems.push(`steps[${i}].id "${s.id}" is captured more than once; capture a new state with a new id`);
        referenced.add(s.id);
      }
    });
    for (const id of declared) if (!referenced.has(id)) problems.push(`checkpoints[] declares "${id}" but no step captures it; remove it or add {"action":"checkpoint","id":"${id}"}`);
  }
  return { ok: problems.length === 0, problems };
}

// ---------------------------------------------------------------------------------------------- locators
// Playwright Locator for a locator spec. Semantic order: role+name, label, text, testId, selector. The
// selector is the only non-semantic fallback and is documented in the scenario notes where it is used.
export function locatorOf(scope, spec) {
  if (!spec || typeof spec !== 'object') throw new Error('locator must be an object');
  for (const k of ['role', 'name', 'label', 'text', 'testId', 'selector']) {
    const v = spec[k];
    if (isString(v) && MCP_REF.test(v.trim())) throw new Error(`locator.${k} is an MCP element reference ("${v}"); MCP references are session-scoped and are never regression locators`);
  }
  const exact = spec.exact === undefined ? {} : { exact: spec.exact };
  if (spec.role != null) return scope.getByRole(spec.role, { name: spec.name, ...exact });
  if (spec.label != null) return scope.getByLabel(spec.label, exact);
  if (spec.text != null) return scope.getByText(spec.text, exact);
  if (spec.testId != null) return scope.getByTestId(spec.testId);
  if (spec.selector != null) return scope.locator(spec.selector);
  throw new Error('locator has no role+name, label, text, testId or selector');
}

// ------------------------------------------------------------------------------------- scenario replay
const bounded = (value, n = 2000) => {
  try { const s = JSON.stringify(value); return s.length > n ? `${s.slice(0, n - 1)}…` : s; } catch { return String(value).slice(0, n); }
};

// The page facts captureCheckpoint needs, read from the live URL at capture time (same shape as context.mjs).
function pageFacts(page) {
  try {
    const url = new URL(page.url());
    return { origin: url.origin, host: url.hostname.toLowerCase(), path: url.pathname, queryNames: [...new Set(url.searchParams.keys())].sort(), hash: url.hash ? '[present]' : null };
  } catch { return null; }
}

function readPath(obj, dotted) {
  let cur = obj;
  for (const part of String(dotted).split('.')) {
    if (cur == null) return undefined;
    cur = cur[part];
  }
  return cur;
}
const deepEqual = (a, b) => { try { return JSON.stringify(a) === JSON.stringify(b); } catch { return false; } };

function speechWindow(recorder, cursor) {
  if (!recorder) return { announce: [], live: [], changes: [], cursor: cursor || { announce: 0, live: 0, changes: 0 } };
  const start = cursor || { announce: 0, live: 0, changes: 0 };
  const speech = recorder.speech || { announce: [], live: [], changes: [] };
  return {
    announce: (speech.announce || []).slice(start.announce),
    live: (speech.live || []).slice(start.live),
    changes: (speech.changes || []).slice(start.changes),
    cursor: { announce: (speech.announce || []).length, live: (speech.live || []).length, changes: (speech.changes || []).length },
  };
}

// One assert check, evaluated against the latest checkpoint record or the live page. Returns
// { pass, deferred?, evidence } — evidence is what it looked at, so a failure can be read, not guessed.
async function evaluateCheck(check, { page, record, recorder, cursor, helper }) {
  const evidence = {};
  if (check.engine) {
    const findings = record?.findings || [];
    const wantPresent = check.present === undefined ? true : check.present;
    const matches = findings.filter((f) => String(f.engine?.id || '') === check.engine && String(f.ruleId || '') === check.rule);
    const targeted = check.targetContains == null ? matches : matches.filter((f) => String(f.element?.selector || '').includes(check.targetContains));
    const present = targeted.length > 0;
    Object.assign(evidence, {
      checkpoint: record?.id || null,
      engine: check.engine, rule: check.rule, present, wanted: wantPresent,
      matched: targeted.slice(0, 10).map((f) => ({ id: f.displayId, outcome: f.outcome, selector: f.element?.selector || null })),
    });
    if (!record) return { pass: false, evidence: { ...evidence, error: 'no checkpoint has been captured before this assertion' } };
    return { pass: present === wantPresent, evidence };
  }
  if (check.focus) {
    const f = check.focus;
    const observed = await page.evaluate((within) => {
      const helperApi = globalThis.__labA11y;
      const focus = helperApi && typeof helperApi.focus === 'function' ? helperApi.focus() : null;
      const active = focus && focus.active ? focus.active : null;
      let inWithin = null;
      if (within) {
        const root = document.querySelector(within);
        const el = document.activeElement;
        inWithin = !!root && !!el && root.contains(el);
      }
      return { active, inWithin };
    }, f.within || null).catch((error) => ({ error: String(error.message).slice(0, 300) }));
    Object.assign(evidence, { expected: f, observed: observed.active ? { role: observed.active.role, name: observed.active.name, selector: observed.active.selector, tag: observed.active.tag } : null, within: observed.inWithin, error: observed.error || null });
    if (observed.error) return { pass: false, evidence };
    let pass = true;
    if (f.role != null) pass = pass && String(observed.active?.role || '').toLowerCase() === String(f.role).toLowerCase();
    if (f.name != null) pass = pass && String(observed.active?.name || '').toLowerCase().includes(String(f.name).toLowerCase());
    if (f.within != null) pass = pass && observed.inWithin === true;
    return { pass, evidence };
  }
  if (check.state) {
    const s = check.state;
    const value = record ? readPath(record, s.path) : undefined;
    evidence.path = s.path; evidence.value = bounded(value, 600); evidence.checkpoint = record?.id || null;
    if (!record) return { pass: false, evidence: { ...evidence, error: 'no checkpoint has been captured before this assertion; state paths are read from the checkpoint record' } };
    let pass;
    if (Object.hasOwn(s, 'equals')) pass = deepEqual(value, s.equals);
    else if (Object.hasOwn(s, 'countMin')) pass = Array.isArray(value) && value.length >= s.countMin;
    else pass = Boolean(value) === (s.truthy === undefined ? true : s.truthy);
    return { pass, evidence };
  }
  if (check.announcement) {
    if (recorder && typeof recorder.collect === 'function') await recorder.collect();
    const win = speechWindow(recorder, cursor);
    const text = String(check.announcement.text).toLowerCase();
    const source = check.announcement.via === 'announce' ? win.announce : win.live;
    const hits = source.filter((a) => String(a.text || '').toLowerCase().includes(text));
    evidence.via = check.announcement.via; evidence.text = check.announcement.text; evidence.matches = hits.slice(0, 10).map((a) => String(a.text || '').slice(0, 200));
    return { pass: hits.length > 0, evidence, cursor: win.cursor };
  }
  if (check.silentChange !== undefined) {
    if (recorder && typeof recorder.collect === 'function') await recorder.collect();
    const win = speechWindow(recorder, cursor);
    const changes = win.changes.flatMap((r) => (r.changes || []).map((c) => ({ ...c, action: r.action, page: r.page })));
    const silent = changes.filter((c) => c.how === 'silent');
    evidence.silent = check.silentChange; evidence.changes = changes.slice(0, 20).map((c) => ({ text: String(c.text || '').slice(0, 120), how: c.how, where: c.where || null }));
    return { pass: check.silentChange ? silent.length > 0 : silent.length === 0, evidence, cursor: win.cursor };
  }
  if (check.equivalence) {
    // Cannot be decided on one side: recorded here and evaluated by compareScenario() against the pair.
    return { pass: null, deferred: true, evidence: { equivalence: check.equivalence, note: 'evaluated against the Before/After pair after both sides have run' } };
  }
  return { pass: false, evidence: { error: 'unrecognised check' } };
}

const describeCheck = (check) => {
  const kind = ['engine', 'focus', 'state', 'announcement', 'silentChange', 'equivalence'].find((k) => Object.hasOwn(check, k));
  if (kind === 'engine') return `engine ${check.engine} rule ${check.rule} ${check.present === false ? 'absent' : 'present'}${check.targetContains ? ` target~${check.targetContains}` : ''}`;
  if (kind === 'focus') return `focus ${[check.focus.role && `role=${check.focus.role}`, check.focus.name && `name~${check.focus.name}`, check.focus.within && `within=${check.focus.within}`].filter(Boolean).join(' ')}`;
  if (kind === 'state') { const s = check.state; return `state ${s.path} ${Object.hasOwn(s, 'equals') ? `= ${bounded(s.equals, 120)}` : Object.hasOwn(s, 'countMin') ? `count >= ${s.countMin}` : `truthy=${s.truthy}`}`; }
  if (kind === 'announcement') return `announcement via ${check.announcement.via} contains "${check.announcement.text}"`;
  if (kind === 'silentChange') return `silent change ${check.silentChange}`;
  return `equivalence ${bounded(check.equivalence, 200)}`;
};

// Replay one scenario on the side whose page is already open. The caller (scenario-run.mjs) opens the side
// with lab-run.mjs `openSide` and passes it as run.page/run.base/run.rec, or through the options. It also
// creates the SessionStore, because the session directory comes from the page's resolved context.
//
// Returns { steps, checkpoints, assertions, errors }; a required step that fails stops the replay and the
// remaining steps are recorded as skipped. `optional: true` steps that cannot find their locator are skipped.
export async function runScenario(run, side, scenario, { session, checkpointContext = {}, page = null, base = null, recorder = null, out = null } = {}) {
  const validation = validateScenario(scenario);
  if (!validation.ok) throw new Error(`scenario is invalid: ${validation.problems.join('; ')}`);
  const thePage = page || run.page;
  const theBase = base || run.base || '';
  const theRecorder = recorder || run.rec || null;
  const theOut = out || run.out || null;
  if (!thePage) throw new Error('runScenario needs an open page: call lab-run.mjs openSide(run, side) and pass it as run.page or { page }');
  if (!session) throw new Error('runScenario needs a SessionStore: create it from the page context and pass { session }');
  if (!theBase) throw new Error('runScenario needs the side base URL: pass run.base or { base }');
  const context = { ...checkpointContext, side, scenarioId: scenario.id };

  const { captureCheckpoint, waitForReadiness, helperSourceText } = await import('./capture.mjs');
  await thePage.addInitScript({ content: helperSourceText() }).catch(() => {});

  const result = { side, steps: [], checkpoints: [], assertions: [], errors: [] };
  let lastRecord = null;
  let cursor = { announce: 0, live: 0, changes: 0 };
  let stopped = null;

  const stepRecord = (index, step) => ({ index, action: step.action, label: step.label || null });

  for (let i = 0; i < scenario.steps.length; i += 1) {
    const step = scenario.steps[i];
    const entry = { ...stepRecord(i, step), status: 'ok', detail: null };
    if (stopped) { entry.status = 'skipped'; entry.detail = `not run: ${stopped}`; result.steps.push(entry); continue; }
    const timeout = step.timeoutMs || 15000;
    const fail = (message) => {
      entry.status = 'failed'; entry.detail = message;
      result.errors.push({ step: i, action: step.action, label: step.label || null, error: message });
      if (!step.optional) stopped = `step ${i} (${step.action}) failed`;
    };
    const skip = (message) => { entry.status = 'skipped'; entry.detail = message; };
    try {
      if (step.action === 'goto') {
        await thePage.goto(`${theBase}${step.path}`, { waitUntil: 'domcontentloaded', timeout });
        const ready = await waitForReadiness(thePage, step.readiness);
        entry.detail = ready.satisfied ? `navigated ${step.path}; readiness met` : `navigated ${step.path}; readiness not met: ${ready.error || 'timeout'}`;
        if (!ready.satisfied) fail(entry.detail);
      } else if (step.action === 'waitFor') {
        const ready = await waitForReadiness(thePage, step.readiness);
        entry.detail = ready.satisfied ? `readiness met after ${ready.waitedMs} ms` : `readiness not met: ${ready.error || 'timeout'}`;
        if (!ready.satisfied) (step.optional ? skip(entry.detail) : fail(entry.detail));
      } else if (step.action === 'screenshot') {
        if (!theOut) throw new Error('a screenshot step needs an output directory (run.out or { out })');
        const file = path.join(theOut, `${side}-${String(step.name).replace(/[^A-Za-z0-9._-]+/g, '-')}.png`);
        fs.mkdirSync(path.dirname(file), { recursive: true });
        await thePage.screenshot({ path: file, animations: 'disabled', caret: 'hide', scale: 'css' });
        entry.detail = path.relative(labRoot, file);
        entry.file = entry.detail;
      } else if (step.action === 'evaluate') {
        const value = await thePage.evaluate(step.expression);
        const text = bounded(value, 2000);
        entry.detail = text;
        // Keep the value only when it is small: an expression that returns a large object must not bloat results.json.
        try { if (JSON.stringify(value).length <= 2000) entry.value = value; else entry.valueTruncated = true; } catch { entry.valueTruncated = true; }
      } else if (step.action === 'checkpoint') {
        const definition = scenario.checkpoints.find((c) => c.id === step.id) || { id: step.id };
        const request = {
          id: step.id,
          label: definition.label || step.label || step.id,
          ...(definition.profile ? { profile: definition.profile } : {}),
          ...(definition.scope ? { scope: definition.scope } : {}),
          ...(definition.include ? { include: definition.include } : {}),
          ...(definition.exclude ? { exclude: definition.exclude } : {}),
          ...(definition.tags ? { tags: definition.tags } : {}),
          ...(definition.rules ? { rules: definition.rules } : {}),
          ...(definition.readiness ? { readiness: definition.readiness } : {}),
          ...(definition.expected ? { expected: definition.expected } : {}),
        };
        // The checkpoint's page facts must describe the page the checkpoint was taken on, not whatever page the
        // login flow left open when the session context was created.
        const captureContext = { ...context, page: pageFacts(thePage) || context.page || null };
        const captured = await captureCheckpoint(thePage, request, { session, context: captureContext });
        lastRecord = captured.record;
        result.checkpoints.push({ id: captured.record.id, label: captured.record.label, status: captured.record.status, sequence: captured.record.sequence, file: session.checkpointPaths(captured.record).relative, findings: captured.record.findings.length, readiness: captured.record.state?.readiness?.satisfied ?? null });
        entry.detail = `${captured.record.status}; ${captured.record.findings.length} finding(s)`;
      } else if (step.action === 'assert') {
        // Flush recorder action windows before reading announcements/silent changes, and move the cursor.
        if (theRecorder && typeof theRecorder.collect === 'function') await theRecorder.collect();
        const outcome = await evaluateCheck(step.check, { page: thePage, record: lastRecord, recorder: theRecorder, cursor });
        if (outcome.cursor) cursor = outcome.cursor;
        const assertion = { source: 'step', step: i, label: step.label || null, checkpointId: lastRecord?.id || null, check: step.check, described: describeCheck(step.check), pass: outcome.pass, deferred: !!outcome.deferred, evidence: outcome.evidence };
        result.assertions.push(assertion);
        if (outcome.deferred) { entry.detail = `${assertion.described}: deferred to the Before/After comparison`; entry.deferred = true; }
        else { entry.detail = `${assertion.described}: ${outcome.pass ? 'pass' : 'FAIL'}`; entry.pass = outcome.pass; }
      } else {
        const locator = step.locator ? locatorOf(thePage, step.locator) : null;
        if (locator) {
          const count = await locator.count().catch(() => 0);
          if (!count) {
            const message = `locator found no element: ${bounded(step.locator, 200)}`;
            if (step.optional) { skip(message); result.steps.push(entry); continue; }
            throw new Error(message);
          }
        }
        if (step.action === 'click') { await locator.click({ timeout }); entry.detail = 'clicked'; }
        else if (step.action === 'check') { await locator.check({ timeout }); entry.detail = 'checked'; }
        else if (step.action === 'uncheck') { await locator.uncheck({ timeout }); entry.detail = 'unchecked'; }
        else if (step.action === 'hover') { await locator.hover({ timeout }); entry.detail = 'hovered'; }
        else if (step.action === 'fill') { await locator.fill(step.value, { timeout }); entry.detail = `filled ${String(step.value).length} character(s)`; }
        else if (step.action === 'selectOption') { await locator.selectOption(step.value, { timeout }); entry.detail = `selected ${step.value}`; }
        else if (step.action === 'press') {
          if (locator) { await locator.press(step.key, { timeout }); entry.detail = `pressed ${step.key} on the located element`; }
          else { await thePage.keyboard.press(step.key); entry.detail = `pressed ${step.key}`; }
        }
      }
    } catch (error) {
      const message = String(error.message || error).split('\n')[0].slice(0, 500);
      if (step.optional && step.action !== 'assert' && step.action !== 'checkpoint' && step.action !== 'goto') skip(message);
      else fail(message);
    }
    result.steps.push(entry);
  }

  // Scenario-level assertions, evaluated after the last state, on the same side. `expected` describes the
  // behaviour the scenario expects to hold; `regressionAssertions` guard behaviour that must not get worse.
  for (const [source, list] of [['expected', scenario.expected || []], ['regression', scenario.regressionAssertions || []]]) {
    for (let i = 0; i < list.length; i += 1) {
      const check = list[i];
      try {
        if (theRecorder && typeof theRecorder.collect === 'function') await theRecorder.collect();
        const outcome = await evaluateCheck(check, { page: thePage, record: lastRecord, recorder: theRecorder, cursor: { announce: 0, live: 0, changes: 0 } });
        result.assertions.push({ source, index: i, label: null, checkpointId: lastRecord?.id || null, check, described: describeCheck(check), pass: outcome.pass, deferred: !!outcome.deferred, evidence: outcome.evidence });
      } catch (error) {
        const message = String(error.message || error).split('\n')[0].slice(0, 500);
        result.errors.push({ step: null, source, index: i, error: message });
        result.assertions.push({ source, index: i, check, described: describeCheck(check), pass: false, deferred: false, evidence: { error: message } });
      }
    }
  }
  return result;
}

// ----------------------------------------------------------------------------------- Before/After compare
function sessionObject(value) {
  if (!value) return null;
  if (value.session && value.session.session) return value.session.session;   // SessionStore
  if (value.session && Array.isArray(value.session.checkpoints)) return value.session;
  if (value.sessionData) return value.sessionData;
  return null;
}

function recordsOf(value) {
  if (!value) return [];
  if (Array.isArray(value.records)) return value.records;
  const session = sessionObject(value);
  if (session) return loadRecords(session);
  if (typeof value === 'string' || value.dir) {
    const dir = typeof value === 'string' ? value : value.dir;
    const file = path.join(labRoot, dir, 'session.json');
    return loadRecords(JSON.parse(fs.readFileSync(file, 'utf8')));
  }
  return [];
}

const assertionsOf = (value) => (value && (value.assertions || (value.result && value.result.assertions))) || [];

const verdictMap = (v) => (['reproduced-and-fixed', 'reproduced-not-fixed', 'not-reproduced', 'mixed'].includes(v) ? v : 'mixed');

// Pair the checkpoint records of both sides, refuse to compare states that are not equivalent, and classify
// findings and scenario-level assertions. `before`/`after` may be { session } (a SessionStore),
// { dir } (a session directory) or { records, assertions } (a runScenario result).
export function compareScenario(run, before, after, scenario) {
  const beforeRecords = recordsOf(before);
  const afterRecords = recordsOf(after);
  const beforeAssertions = assertionsOf(before);
  const afterAssertions = assertionsOf(after);
  const declared = Array.isArray(scenario.checkpoints) ? scenario.checkpoints : [];
  const ordered = [...new Set([...declared.map((c) => c.id), ...beforeRecords.map((r) => r.id), ...afterRecords.map((r) => r.id)])];

  const pairs = [];
  const checks = [];
  const summary = { byChange: {}, findings: {}, assertions: {}, engines: {} };
  const bump = (bucket, key) => { summary[bucket][key] = (summary[bucket][key] || 0) + 1; };

  for (const id of ordered) {
    const definition = declared.find((c) => c.id === id) || {};
    const b = beforeRecords.find((r) => r.id === id && (!r.side || r.side === 'before')) || null;
    const a = afterRecords.find((r) => r.id === id && (!r.side || r.side === 'after')) || null;
    let eq = null;
    let classifications = [];
    if (!b || !a) {
      eq = { equivalent: false, checks: [{ name: 'both sides captured', pass: false, detail: !b ? 'no Before checkpoint at this state' : 'no After checkpoint at this state' }] };
    } else {
      eq = equivalence(b, a, definition.expected || {});
      const engines = { executed: [], unsupported: [] };
      for (const side of ['before', 'after']) for (const e of ((side === 'before' ? b : a).evidence?.engines || [])) {
        if (e.status === 'executed' && !engines.executed.includes(e.engine)) engines.executed.push(e.engine);
        if (e.status === 'unsupported' && !engines.unsupported.includes(e.engine)) engines.unsupported.push(e.engine);
      }
      classifications = classifyPair({ before: b.findings || [], after: a.findings || [], sameState: eq.equivalent, enginesExecuted: engines.executed, enginesUnsupported: engines.unsupported });
    }
    for (const c of eq.checks) checks.push({ kind: 'equivalence', checkpointId: id, name: c.name, pass: c.pass, detail: c.detail });
    for (const c of classifications) {
      bump('byChange', c.change);
      if (c.finding) bump('findings', c.engine);
    }
    pairs.push({
      checkpointId: id,
      label: definition.label || b?.label || a?.label || id,
      beforeStatus: b?.status || null,
      afterStatus: a?.status || null,
      equivalent: eq.equivalent,
      checks: eq.checks,
      classifications,
      before: b, after: a,
    });
  }

  // Scenario-level equivalence assertions are decided here, against the last pair that has both records.
  // The same checks are produced by both sides, so one side's list is enough.
  const lastPair = [...pairs].reverse().find((p) => p.before && p.after);
  const deferredSource = afterAssertions.some((a) => a.deferred) ? afterAssertions : beforeAssertions;
  const pairById = new Map(pairs.map((p) => [p.checkpointId, p]));
  for (const assertion of deferredSource.filter((a) => a.deferred && a.check?.equivalence)) {
    // A step-level equivalence assertion names the checkpoint it was captured at; a scenario-level one applies
    // to the last state both sides reached.
    const target = pairById.get(assertion.checkpointId) || lastPair || pairs[pairs.length - 1];
    if (!target || !target.before || !target.after) {
      checks.push({ kind: 'equivalence', checkpointId: target?.checkpointId || null, name: `assertion: ${assertion.label || assertion.described}`, pass: false, detail: 'no pair with both sides was available' });
      continue;
    }
    const extra = equivalence(target.before, target.after, assertion.check.equivalence);
    for (const c of extra.checks) checks.push({ kind: 'equivalence', checkpointId: target.checkpointId, name: `assertion: ${c.name}`, pass: c.pass, detail: c.detail });
  }
  // One assertion row per assertion identity, compared across the two sides. The identity includes the source
  // and the step/index, so a side that stopped early cannot shift the other side's rows.
  const assertionRows = [];
  const assertionKey = (a) => `${a.source || 'step'}:${a.step ?? a.index ?? ''}:${a.described || ''}:${bounded(a.check, 300)}`;
  const beforeByKey = new Map(beforeAssertions.map((a) => [assertionKey(a), a]));
  const afterByKey = new Map(afterAssertions.map((a) => [assertionKey(a), a]));
  for (const key of [...afterByKey.keys(), ...[...beforeByKey.keys()].filter((k) => !afterByKey.has(k))]) {
    const b = beforeByKey.get(key) || null;
    const a = afterByKey.get(key) || null;
    // A deferred equivalence check has no single-side pass/fail; it is compared through the pair check above.
    if (b?.deferred || a?.deferred) continue;
    const bp = b ? b.pass : null;
    const ap = a ? a.pass : null;
    let change;
    if (bp === false && ap === true) change = 'resolved-assertion';
    else if (bp === true && ap === false) change = 'new-regression';
    else if (bp === false && ap === false) change = 'assertion-not-met';
    else if (bp === true && ap === true) change = 'unchanged-pass';
    else change = 'not-compared';
    bump('byChange', change);
    const row = { source: a?.source || b?.source || 'step', index: a?.index ?? b?.index ?? null, step: a?.step ?? b?.step ?? null, label: a?.label || b?.label || null, described: a?.described || b?.described || '', checkpointId: a?.checkpointId || b?.checkpointId || null, change, before: bp, after: ap, check: a?.check || b?.check || null };
    assertionRows.push(row);
    checks.push({ kind: 'assertion', checkpointId: row.checkpointId, name: `assertion: ${row.described}`, pass: ap === true, detail: `${row.source}: Before ${bp === null ? 'not run' : bp ? 'pass' : 'fail'}, After ${ap === null ? 'not run' : ap ? 'pass' : 'fail'} — ${change}` });
  }

  const stateProblems = pairs.filter((p) => !p.equivalent).length;
  const newRegressions = (summary.byChange['new-regression'] || 0);
  const resolved = (summary.byChange['resolved-failure'] || 0) + (summary.byChange['resolved-assertion'] || 0);
  const stillFailing = (summary.byChange['assertion-not-met'] || 0);
  const afterAssertionFailures = assertionRows.filter((r) => r.after === false).length;
  let verdict;
  let note;
  if (!pairs.length || !pairs.some((p) => p.before && p.after)) { verdict = 'mixed'; note = 'no checkpoint was captured on both sides, so there is no Before/After comparison'; }
  else if (stateProblems) { verdict = 'mixed'; note = `${stateProblems} checkpoint(s) did not reach equivalent states; a difference is not described for them because it cannot be attributed to the change`; }
  else if (newRegressions) { verdict = 'reproduced-not-fixed'; note = `${newRegressions} new regression(s) or regressed assertions on the After side`; }
  else if (resolved) { verdict = 'reproduced-and-fixed'; note = `${resolved} finding(s)/assertion(s) present or failing on Before are resolved on After`; }
  else if (stillFailing) { verdict = 'reproduced-not-fixed'; note = `${stillFailing} expected assertion(s) are not met on either side`; }
  else { verdict = 'not-reproduced'; note = 'the two sides reached equivalent states and the scenario assertions did not change'; }
  const unexpected = stateProblems + newRegressions + afterAssertionFailures;
  return {
    verdict: verdictMap(verdict),
    unexpected,
    note,
    pairs: pairs.map(({ before: b, after: a, classifications, ...rest }) => ({ ...rest, classifications, beforeFindings: (b?.findings || []).length, afterFindings: (a?.findings || []).length, beforeFile: b?.evidence?.dir || null, afterFile: a?.evidence?.dir || null })),
    checks,
    assertions: assertionRows,
    classificationSummary: { byChange: summary.byChange, findingsByEngine: summary.findings, stateProblems, newRegressions, resolved, stillFailing, afterAssertionFailures },
  };
}

// --------------------------------------------------------------------------------------------- summary MD
const cell = (s, n = 160) => { const t = String(s == null ? '' : s).replace(/\s+/g, ' ').trim(); return (t.length > n ? `${t.slice(0, n - 1)}…` : t).replace(/\|/g, '\\|'); };

// A `## Scenario` section for the run's SUMMARY.md: what was replayed, what each checkpoint reached, the
// Before/After comparison, the assertions, and the manual review this scenario still needs.
export function scenarioSummaryMarkdown({ scenario, sides = {}, comparison = null, run = null } = {}) {
  if (!scenario) return '';
  const L = [];
  const sideNames = Object.keys(sides);
  L.push('## Scenario', '');
  L.push(`Scenario \`${scenario.id}\` (${SCENARIO_SCHEMA}): **${scenario.title}**.`, '');
  L.push('| | |', '|---|---|');
  L.push(`| Issue | ${scenario.issue ? `#${scenario.issue}` : 'none'} |`);
  L.push(`| Variant | ${scenario.variant ? `\`${scenario.variant}\`` : 'none registered yet'} |`);
  L.push(`| Route | \`${scenario.route}\` |`);
  L.push(`| Fixture | ${scenario.fixture?.recipe ? `recipe \`${scenario.fixture.recipe}\`` : scenario.fixture?.standardInstall ? 'plain Standard install' : 'not stated'} |`);
  L.push(`| Environment | ${scenario.browser}, ${scenario.colourScheme}${scenario.forcedColors ? ', forced colours' : ''}, ${scenario.reducedMotion}, ${scenario.viewport.width}x${scenario.viewport.height}, ${scenario.login ? 'logged in' : 'anonymous'} |`);
  L.push(`| Sides run | ${sideNames.length ? sideNames.join(', ') : 'none'} |`);
  L.push(`| Verified | **${scenario.verified ? 'yes (review the run it came from)' : 'no: this scenario has not been replayed against a real pair'}** |`);
  L.push('');
  if (!scenario.verified) L.push('This scenario is a draft. `verified: false` means it was authored from issue and report evidence but has not been replayed end to end; the run below is the first check, not a verification.', '');
  if (sideNames.length < 2) L.push(`**Only the ${sideNames.join(' side')} side was run. No Before/After comparison was made in this run.**`, '');

  L.push('### Steps', '');
  L.push('| # | Action | Label | Status | Detail |', '|---|---|---|---|---|');
  for (const side of sideNames) {
    for (const step of sides[side]?.steps || []) L.push(`| ${step.index} | ${side}: ${step.action} | ${cell(step.label)} | ${step.status} | ${cell(step.detail, 200)} |`);
  }
  L.push('');

  L.push('### Checkpoints reached', '');
  L.push('| Side | # | Checkpoint | Status | Findings | Evidence |', '|---|---|---|---|---|---|');
  for (const side of sideNames) for (const cp of sides[side]?.checkpoints || []) L.push(`| ${side} | ${cp.sequence} | \`${cp.id}\` ${cell(cp.label)} | ${cp.status} | ${cp.findings} | ${cp.file ? `\`${cp.file}\`` : ''} |`);
  L.push('');

  if (comparison) {
    L.push('### Before / After at equivalent states', '');
    if (!comparison.pairs.length) L.push('No checkpoint was captured on both sides, so there is no comparison.', '');
    else {
      L.push(`Comparison verdict: **${comparison.verdict}**. ${cell(comparison.note || '', 300)}`, '');
      L.push('| Checkpoint | Equivalent? | Before | After | Classifications |', '|---|---|---|---|---|');
      for (const p of comparison.pairs) {
        const cls = p.classifications.length ? p.classifications.map((c) => `${c.change}${c.engine ? ` (${c.engine})` : ''}`).join('; ') : 'none';
        L.push(`| \`${p.checkpointId}\` ${cell(p.label)} | ${p.equivalent ? 'yes' : '**NO: not compared**'} | ${p.beforeStatus || 'not captured'} | ${p.afterStatus || 'not captured'} | ${cell(cls, 200)} |`);
      }
      L.push('');
      L.push('| Check | Pass | Detail |', '|---|---|---|');
      for (const c of comparison.checks) L.push(`| ${c.kind === 'assertion' ? 'assertion: ' : ''}${cell(c.name)} | ${c.pass === null ? 'deferred' : c.pass ? 'yes' : '**no**'} | ${cell(c.detail, 200)} |`);
      L.push('');
    }
    if (comparison.assertions?.length) {
      L.push('### Scenario assertions, Before against After', '');
      L.push('| Source | Assertion | Before | After | Change |', '|---|---|---|---|---|');
      for (const a of comparison.assertions) L.push(`| ${a.source} | ${cell(a.described)} | ${a.before === null ? 'not run' : a.before ? 'pass' : 'fail'} | ${a.after === null ? 'not run' : a.after ? 'pass' : 'fail'} | ${a.change} |`);
      L.push('');
    }
  }

  L.push('### Manual review this scenario still needs', '');
  if (!scenario.manualReview?.length) L.push('None listed. That is not a claim that the state was reviewed by a person.', '');
  else for (const item of scenario.manualReview) L.push(`- ${item}`);
  L.push('');
  L.push('### Scenario limits', '');
  if (!scenario.limits?.length) L.push('None listed.', '');
  else for (const item of scenario.limits) L.push(`- ${item}`);
  L.push('');
  if (scenario.notes) { L.push('### Scenario notes', '', scenario.notes, ''); }
  if (run?.out) L.push(`Scenario file: \`${scenario.file || scenario.id}\`. Output: \`${run.out}\`.`, '');
  return L.join('\n') + '\n';
}

export { bounded, readPath, deepEqual };
