// Static checks for the resource dashboard: referenced ids, labels, and the accessibility features the page promises.
// This does not replace a browser keyboard/screen-reader pass or an axe-core run; it catches wiring regressions cheaply.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const file = path.join(process.cwd(), 'tools/resource/dashboard.html');
const html = fs.readFileSync(file, 'utf8');
const idList = [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
const ids = new Set(idList);
const references = [...html.matchAll(/\$\('([^']+)'\)/g)].map((m) => m[1]);
const labelled = [...html.matchAll(/aria-labelledby="([^"]+)"/g)].flatMap((m) => m[1].split(/\s+/));

test('every script-referenced element id exists and is unique', () => {
  const duplicates = idList.filter((id, i) => idList.indexOf(id) !== i);
  assert.deepEqual([...new Set(duplicates)], []);
  for (const id of new Set(references)) assert.ok(ids.has(id), `missing element id: ${id}`);
});

test('every aria-labelledby target exists and every section has an accessible name', () => {
  for (const id of labelled) assert.ok(ids.has(id), `missing aria-labelledby target: ${id}`);
  for (const m of html.matchAll(/<section\b[^>]*>/g)) {
    const tag = m[0];
    const ok = /aria-labelledby="[^"]+"/.test(tag) || /aria-label="[^"]+"/.test(tag);
    assert.ok(ok, `section without an accessible name: ${tag}`);
  }
});

test('the dashboard keeps native controls and the promised preference modes', () => {
  assert.match(html, /<form id="filters"/);
  assert.match(html, /<select id="activity"/);
  assert.match(html, /<input type="date" id="from"/);
  assert.match(html, /@media \(prefers-color-scheme: dark\)/);
  assert.match(html, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(html, /@media \(forced-colors: active\)/);
  assert.match(html, /:focus-visible/);
  assert.match(html, /role="region"/);
  assert.match(html, /\.opportunity p \{[^}]*overflow-wrap: anywhere/);
  assert.match(html, /\.barvalue \{[^}]*overflow-wrap: anywhere/);
  assert.doesNotMatch(html, /<div[^>]+onclick=/i);
});

test('new views are present: attribution, unknown reasons, exploration, prompts and reconciliation', () => {
  for (const id of ['attribution-table', 'unknown-table', 'reconciliation-table', 'exploration-table', 'exploration-diagnostics-table', 'prompt-table', 'purpose-table', 'artifact-table']) {
    assert.ok(ids.has(id), `missing new view: ${id}`);
    assert.ok(html.includes(`table:not([hidden])`) || html.includes(`id="${id}"`));
  }
  assert.match(html, /function renderAttribution\(/);
  assert.match(html, /function renderExploration\(/);
  assert.match(html, /function renderProvenance\(/);
});
