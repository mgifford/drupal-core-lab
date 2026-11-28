// Static checks for the dynamic-checkpoint negative-control fixtures (tests/fixtures/a11y-mcp/).
//
// Pure node:test, no browser. It checks the fixture site and the hand-written expectations as data: every fixture exists
// and is valid-ish HTML, every asserted rule identifier belongs to its engine's naming scheme, no fixture references a
// network URL, and the expectations are structurally complete (each state-dependent control says what a page-load-only
// scan must miss, each control has a page-load checkpoint, the persistent control declares its dedupe).
//
//   node --test tests/lab/a11y-mcp-fixtures.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { startFixtureServer } from '../fixtures/a11y-mcp/serve.mjs';

const labRoot = fileURLToPath(new URL('../..', import.meta.url));
const FIXTURE_DIR = path.join(labRoot, 'tests/fixtures/a11y-mcp');
const EXPECTED_FILE = path.join(FIXTURE_DIR, 'expected.json');
const EXPECTED_SCHEMA = 'lab-a11y-fixture-expectations/1';
const KNOWN_ENGINES = new Set(['axe-core', 'htmlcs']);
const AXE_RULE = /^[a-z0-9][a-z0-9-]*$/;
const HTMLCS_PREFIX = 'WCAG2AA.';
const CHECKPOINT_ID = /^[a-z0-9][a-z0-9._-]{0,79}$/;
const STEP_ACTIONS = new Set(['click', 'key', 'waitForSelector', 'waitForFunction', 'emulateMedia']);

const expected = JSON.parse(fs.readFileSync(EXPECTED_FILE, 'utf8'));
const fixtures = expected.fixtures;

const htmlFiles = fs.readdirSync(FIXTURE_DIR).filter((name) => name.endsWith('.html')).sort();
const fixtureNames = fixtures.map((f) => f.file).sort();

const readFixture = (file) => fs.readFileSync(path.join(FIXTURE_DIR, file), 'utf8');

// Every rule-ish expectation in the file: a finding to assert, a rule a page-load scan must miss, or a dedupe match.
function* ruleExpectations(fixture) {
  for (const exp of fixture.pageLoadMustNotReport || []) yield { where: `pageLoadMustNotReport of ${fixture.file}`, exp };
  for (const checkpoint of fixture.checkpoints || []) {
    for (const exp of checkpoint.expect?.findings || []) yield { where: `checkpoint ${checkpoint.id} of ${fixture.file}`, exp };
  }
  if (fixture.dedupe?.match) yield { where: `dedupe of ${fixture.file}`, exp: fixture.dedupe.match };
}

function ruleText(exp) {
  return exp.ruleId || exp.ruleStartsWith || '';
}

test('expected.json is the expected schema and describes every fixture exactly once', () => {
  assert.equal(expected.schema, EXPECTED_SCHEMA);
  assert.ok(Array.isArray(fixtures) && fixtures.length >= 10, `expected at least 10 fixture controls, got ${fixtures.length}`);
  assert.equal(new Set(fixtures.map((f) => f.file)).size, fixtures.length, 'fixture file names must be unique');
  assert.deepEqual(fixtureNames, htmlFiles, 'expected.json must list exactly the HTML files in the fixture directory (no stale entry, no undocumented control)');
  for (const fixture of fixtures) {
    assert.match(fixture.file, /^[A-Za-z0-9][A-Za-z0-9._-]*\.html$/, `fixture file name is a plain HTML file name: ${fixture.file}`);
    assert.equal(typeof fixture.what, 'string');
    assert.ok(fixture.what.length > 20, `${fixture.file}: what must be one explainable sentence (got ${fixture.what})`);
    assert.equal(typeof fixture.stateDependent, 'boolean', `${fixture.file}: stateDependent must be true or false`);
    assert.ok(Array.isArray(fixture.pageLoadMustNotReport), `${fixture.file}: pageLoadMustNotReport must be an array (may be empty)`);
    assert.ok(Array.isArray(fixture.checkpoints) && fixture.checkpoints.length >= 2, `${fixture.file}: at least a page-load and one later checkpoint`);
    assert.ok(Array.isArray(fixture.validControls), `${fixture.file}: validControls must be an array`);
    assert.ok(Array.isArray(fixture.manual) && fixture.manual.length >= 1 && fixture.manual.every((m) => typeof m === 'string' && m.length > 10), `${fixture.file}: at least one manual check is required`);
  }
});

test('every fixture file is valid-ish self-contained HTML: doctype, English lang, title and h1', () => {
  for (const fixture of fixtures) {
    const html = readFixture(fixture.file);
    assert.match(html, /^\s*<!DOCTYPE html>/i, `${fixture.file}: must start with a doctype`);
    assert.match(html, /<html\s+lang="en"/i, `${fixture.file}: must declare lang="en"`);
    const title = /<title>([\s\S]*?)<\/title>/i.exec(html);
    assert.ok(title && title[1].trim().length > 0, `${fixture.file}: must have a non-empty <title>`);
    const h1 = /<h1[^>]*>([\s\S]*?)<\/h1>/i.exec(html);
    assert.ok(h1 && h1[1].replace(/<[^>]+>/g, '').trim().length > 0, `${fixture.file}: must have a non-empty <h1>`);
    assert.match(html, /<meta\s+charset="utf-8"/i, `${fixture.file}: must declare its charset`);
  }
});

test('every asserted rule identifier follows its engine naming scheme (axe: lower-case-with-hyphens; htmlcs: WCAG2AA.)', () => {
  let seen = 0;
  for (const fixture of fixtures) {
    for (const { where, exp } of ruleExpectations(fixture)) {
      seen += 1;
      assert.ok(KNOWN_ENGINES.has(exp.engine), `${where}: unknown engine ${JSON.stringify(exp.engine)}`);
      assert.ok(exp.ruleId || exp.ruleStartsWith, `${where}: an engine rule must be named with ruleId or ruleStartsWith`);
      const rule = ruleText(exp);
      assert.ok(rule.length > 0 && rule.length < 300, `${where}: rule identifier must be a non-empty string`);
      if (exp.engine === 'axe-core') {
        assert.match(rule, AXE_RULE, `${where}: axe-core rule ids are lower-case-with-hyphens (got ${rule})`);
        assert.equal(exp.ruleStartsWith, undefined, `${where}: name axe-core rules with the exact ruleId (there is no stable prefix scheme)`);
      } else {
        assert.ok(rule.startsWith(HTMLCS_PREFIX), `${where}: HTML_CodeSniffer expectations must start with "${HTMLCS_PREFIX}" (got ${rule})`);
      }
    }
  }
  assert.ok(seen >= 10, `expected rule identifiers to be asserted across the controls, saw ${seen}`);
});

test('no fixture references a network URL: no src/href/action target and no CSS url() beyond data: or a fragment', () => {
  for (const fixture of fixtures) {
    const html = readFixture(fixture.file);
    // URL-bearing attributes: src, href, srcset, action, formaction, poster, data, background, cite.
    for (const match of html.matchAll(/\b(src|href|srcset|action|formaction|poster|data|background|cite)\s*=\s*("[^"]*"|'[^']*')/gi)) {
      const value = match[2].slice(1, -1).trim();
      assert.ok(!/^https?:\/\//i.test(value), `${fixture.file}: ${match[1]}=${value} is a network reference`);
      assert.ok(!/^\/\//.test(value), `${fixture.file}: ${match[1]}=${value} is a protocol-relative network reference`);
    }
    // CSS url() values must be inline data: URIs (the icon controls draw their icons this way) or fragments.
    for (const match of html.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/gi)) {
      const target = match[1].trim();
      assert.ok(target.startsWith('data:') || target.startsWith('#'), `${fixture.file}: CSS url(${target}) must be an inline data: URI or a fragment`);
    }
    // No script/stylesheet/frame/link element may load a remote document, even via a relative-looking URL that is absolute.
    assert.doesNotMatch(html, /<(script|link|iframe|img|source|video|audio|embed|object)\b[^>]*\b(src|href|data|srcset)\s*=\s*["'](https?:)?\/\//i, `${fixture.file}: must not load an external document`);
    // Outside HTML comments and url() values nothing may be an absolute URL. Documentation comments may cite the WCAG
    // specification (https://www.w3.org ...), and only that. The SVG XML namespace is an identifier, never fetched, so an
    // xmlns="http://www.w3.org/2000/svg" attribute is not a network reference and is removed before the scan.
    const comments = [...html.matchAll(/<!--([\s\S]*?)-->/g)].map((m) => m[1]).join('\n');
    for (const url of comments.match(/https?:\/\/[^\s"'<>)]+/g) || []) {
      assert.ok(url.startsWith('https://www.w3.org/'), `${fixture.file}: a documentation comment may only cite https://www.w3.org URLs (got ${url})`);
    }
    const outsideComments = html
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/url\([^)]*\)/gi, 'url()')
      .replace(/\bxmlns(?::[a-z]+)?\s*=\s*["']http:\/\/www\.w3\.org\/2000\/svg["']/gi, 'xmlns="svg"');
    const stray = outsideComments.match(/https?:\/\/[^\s"'<>)]+/g) || [];
    assert.deepEqual(stray, [], `${fixture.file}: references a network URL outside a comment, an SVG namespace or a data: URI: ${stray.join(', ')}`);
  }
});

test('each state-dependent control names what a page-load-only scan must miss, and shows the defect later', () => {
  const evidenceKeys = ['findings', 'noFindings', 'state', 'focus', 'visual', 'changes', 'attributes', 'visibility'];
  for (const fixture of fixtures.filter((f) => f.stateDependent)) {
    assert.ok(fixture.pageLoadMustNotReport.length >= 1, `${fixture.file}: a state-dependent control must list the rule a page-load scan must not report`);
    const checkpoints = fixture.checkpoints;
    assert.equal(checkpoints[0].id, 'initial', `${fixture.file}: the first checkpoint must be the page-load checkpoint "initial"`);
    const later = checkpoints.slice(1);
    const hasLaterEvidence = later.some((c) => Object.entries(c.expect || {}).some(([key, value]) => {
      if (!evidenceKeys.includes(key)) return false;
      if (Array.isArray(value)) return value.length > 0;
      return value && typeof value === 'object' ? Object.keys(value).length > 0 : Boolean(value);
    }));
    assert.ok(hasLaterEvidence, `${fixture.file}: a state-dependent control must assert evidence of the defect in a checkpoint after page load`);
  }
});

test('page-load expectations are well formed for every control; the valid control asserts no axe findings everywhere', () => {
  for (const fixture of fixtures) {
    assert.equal(fixture.checkpoints[0].id, 'initial', `${fixture.file}: first checkpoint is "initial"`);
    assert.deepEqual(fixture.checkpoints[0].steps, [], `${fixture.file}: the page-load checkpoint must not perform steps`);
    const ids = fixture.checkpoints.map((c) => c.id);
    assert.equal(new Set(ids).size, ids.length, `${fixture.file}: checkpoint ids must be unique`);
    for (const id of ids) assert.match(id, CHECKPOINT_ID, `${fixture.file}: invalid checkpoint id ${id}`);
    for (const checkpoint of fixture.checkpoints) {
      assert.ok(Array.isArray(checkpoint.steps), `${fixture.file}/${checkpoint.id}: steps must be an array`);
      for (const step of checkpoint.steps) {
        assert.ok(STEP_ACTIONS.has(step.action), `${fixture.file}/${checkpoint.id}: unknown step action ${JSON.stringify(step.action)}`);
      }
      for (const exp of checkpoint.expect?.findings || []) {
        if (Object.hasOwn(exp, 'absent')) assert.equal(typeof exp.absent, 'boolean', `${fixture.file}/${checkpoint.id}: absent, when present, must be a boolean`);
      }
    }
  }
  const valid = fixtures.find((f) => f.file === 'valid-controls.html');
  assert.ok(valid, 'the valid-controls fixture must exist');
  for (const checkpoint of valid.checkpoints) {
    assert.ok((checkpoint.expect?.noFindings || []).includes('axe-core'), `${valid.file}/${checkpoint.id}: the valid control must assert no axe-core findings`);
  }
});

test('the persistent control declares one finding observed at every checkpoint (dedupe)', () => {
  const persistent = fixtures.find((f) => f.file === 'persistent-finding.html');
  assert.ok(persistent, 'persistent-finding.html must be in expected.json');
  assert.equal(persistent.stateDependent, false, 'the persistent defect exists at page load, so it is not state-dependent');
  assert.ok(persistent.dedupe, 'the persistent control must express its dedupe expectation');
  assert.equal(persistent.dedupe.distinct, 1, 'the repeated finding is one distinct defect');
  assert.equal(persistent.dedupe.observations, persistent.checkpoints.length, 'the finding must be observed at every checkpoint');
  assert.ok(persistent.checkpoints.length >= 3, 'the persistent control needs at least three checkpoints to show several observations');
  for (const checkpoint of persistent.checkpoints) {
    const matches = (checkpoint.expect.findings || []).some((exp) => exp.engine === persistent.dedupe.match.engine && exp.ruleId === persistent.dedupe.match.ruleId);
    assert.ok(matches, `${checkpoint.id}: the persistent finding must be asserted at every checkpoint`);
  }
});

test('serve.mjs serves the fixtures as text/html and refuses everything else (404), without a browser', async () => {
  assert.equal(typeof startFixtureServer, 'function');
  const server = await startFixtureServer({ root: FIXTURE_DIR });
  try {
    const page = await fetch(`${server.url}/valid-controls.html`);
    assert.equal(page.status, 200);
    assert.match(page.headers.get('content-type') || '', /^text\/html/);
    assert.match(await page.text(), /<h1>Valid controls<\/h1>/);
    const index = await fetch(`${server.url}/`);
    assert.equal(index.status, 200);
    assert.match(await index.text(), /dialog-unnamed-button\.html/);
    const missing = await fetch(`${server.url}/does-not-exist.html`);
    assert.equal(missing.status, 404);
    const notHtml = await fetch(`${server.url}/serve.mjs`);
    assert.equal(notHtml.status, 404, 'only .html fixture files are served');
    const traversal = await fetch(`${server.url}/%2e%2e%2fexpected.json`);
    assert.equal(traversal.status, 404, 'path traversal is refused');
  } finally {
    await server.close();
  }
});
