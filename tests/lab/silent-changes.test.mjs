// The recorder's changes after user input (tools/playwright/lib/recorder.mjs) and their summary (lib/silent-changes.mjs).
// The summary needs no browser; the recorder runs in Chromium on a local page with one case of each kind (needs tools/playwright
// installed with Chromium; skipped otherwise; LAB_CHROMIUM=<path> names another Chromium binary).
//   node --test tests/lab/silent-changes.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { once } from 'node:events';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { RECORDER } from '../../tools/playwright/lib/recorder.mjs';
import { groupChanges, silentMarkdown, silentRows } from '../../tools/playwright/lib/silent-changes.mjs';

const labRoot = fileURLToPath(new URL('../..', import.meta.url));

test('groupChanges: a word typed one key at a time is one row; clicks on different controls are separate', () => {
  const w = (action, on, text, how = 'silent', where = 'span#preview') => ({ action, on, changes: [{ text, where, how }] });
  const rows = groupChanges([w('typing', 'input#name "Name"', 'Machine name: a'), w('typing', 'input#name "Name"', 'Machine name: ab'), w('key Tab', 'input#name "Name"', 'Tip', 'focus', 'div#tip'), w('click', 'button#filter "Filter"', '3 items found', 'silent', 'p#count'), w('click', 'button#save "Save"', 'Saved', 'live', 'div#status')]);
  assert.deepEqual(rows.map((r) => [r.action, r.on, r.where, r.how, r.times, r.text, r.last]), [
    ['typing', 'input#name "Name"', 'span#preview', 'silent', 2, 'Machine name: a', 'Machine name: ab'],
    ['key Tab', 'input#name "Name"', 'div#tip', 'focus', 1, 'Tip', 'Tip'],
    ['click', 'button#filter "Filter"', 'p#count', 'silent', 1, '3 items found', '3 items found'],
    ['click', 'button#save "Save"', 'div#status', 'live', 1, 'Saved', 'Saved'],
  ]);
});

test('silentRows and silentMarkdown: new in After, gone in After, on both sides; the other kinds counted', () => {
  const side = (...ws) => ({ speech: { changes: ws } });
  const w = (on, text, how, where) => ({ action: 'click', on, changes: [{ text, where, how }] });
  const results = { sides: {
    before: side(w('button#a "A"', 'Done', 'silent', 'p#x'), w('button#b "B"', 'Gone', 'silent', 'p#y'), w('button#c "C"', 'Saved', 'live', 'div#s')),
    after: side(w('button#a "A"', 'Done', 'silent', 'p#x'), w('button#b "B"', 'Gone', 'announced', 'p#y'), w('button#d "D"', 'New | text', 'silent', 'p#z'), w('button#e "Show"', 'Hide', 'control', 'button#e')),
  } };
  assert.deepEqual(silentRows(groupChanges(results.sides.before.speech.changes), groupChanges(results.sides.after.speech.changes)).map((r) => `${r.change} ${r.on}`),
    ['new in After button#d "D"', 'gone in After button#b "B"', 'on both sides button#a "A"']);
  const md = silentMarkdown(results);
  assert.match(md, /\| \*\*new in After\*\* \| after \|  \| click button#d "D" \| New \\\| text \| `p#z` \| 1 \|/);
  assert.match(md, /\| gone in After \| before \|  \| click button#b "B" \| Gone \|/);
  assert.match(md, /Inside the control itself .*after click button#e "Show" → "Hide"/);
  assert.match(md, /Before: 0 in a live region|Before: 1 in a live region/);
  assert.match(md, /After: 0 in a live region, 1 Drupal\.announce\(\) after the same action, 0 focus moved to it, 0 shown by the control pressed \(expanded\), 1 inside the control itself, 0 the name of a control that appeared or changed, 2 silent\./);
  assert.match(silentMarkdown({ sides: { before: { speech: { announce: [] } }, after: { speech: { announce: [] } } } }), /Not recorded in this run/);
});

// ---- The recorder in a browser

const PW = path.join(labRoot, 'tools/playwright/node_modules/@playwright/test/index.mjs');
async function browser() {
  if (!fs.existsSync(PW)) return null;
  const { chromium } = await import(pathToFileURL(PW).href);
  if (process.env.LAB_CHROMIUM) return chromium.launch({ executablePath: process.env.LAB_CHROMIUM });
  return fs.existsSync(chromium.executablePath()) ? chromium.launch() : null;
}

const PAGE = `<!DOCTYPE html><html lang="en"><head><title>Changes</title>
<style>.vh { position: absolute; clip: rect(1px, 1px, 1px, 1px); width: 1px; height: 1px; overflow: hidden }</style></head><body>
<script>window.Drupal = {}; Drupal.announce = function (t) { document.getElementById('drupal-live-announce').textContent = t; };</script>
<div id="drupal-live-announce" class="vh" aria-live="polite"></div>
<main>
<button id="filter">Filter</button><p id="count"></p>
<button id="save">Save</button><div role="status" id="status"></div>
<button id="apply">Apply</button><p id="applied"></p>
<button id="more" aria-expanded="false" aria-controls="panel">More</button><div id="panel" hidden><p>Extra options here</p></div>
<button id="open">Open dialog</button><div id="dlg" role="dialog" aria-label="Confirm" hidden><p>Are you sure?</p><button id="ok">OK</button></div>
<button id="toggle">Show details</button>
<button id="del">Delete</button><p id="undo"></p>
<label for="name">Name</label> <input id="name"> <span id="preview"></span>
<p id="shortcut"></p>
</main>
<script>
const $ = (id) => document.getElementById(id);
$('filter').onclick = () => { $('count').textContent = '3 items found'; };
$('save').onclick = () => { $('status').textContent = 'Saved'; };
$('apply').onclick = () => { Drupal.announce('Applied'); $('applied').textContent = 'Settings applied'; };
$('more').onclick = () => { $('more').setAttribute('aria-expanded', 'true'); $('panel').hidden = false; };
$('open').onclick = () => { $('dlg').hidden = false; $('ok').focus(); };
$('toggle').onclick = () => { $('toggle').textContent = 'Hide details'; };
$('del').onclick = () => { $('undo').innerHTML = '<button type="button">Undo</button>'; };
document.addEventListener('keydown', (e) => { if (e.altKey && e.key === 's') $('shortcut').textContent = 'Shortcut opened the panel'; });
$('name').oninput = () => { $('preview').textContent = 'Machine name: ' + $('name').value.toLowerCase(); };
</script></body></html>`;

test('recorder: each change after real input is sorted by how a screen reader user learns of it', { timeout: 60000 }, async (t) => {
  const b = await browser().catch(() => null);
  if (!b) { t.skip('tools/playwright is not installed with Chromium (cd tools/playwright && npm install && npx playwright install chromium), or set LAB_CHROMIUM'); return; }
  const server = http.createServer((req, res) => { res.writeHead(200, { 'content-type': 'text/html' }); res.end(PAGE); });
  server.listen(0, '127.0.0.1'); await once(server, 'listening');
  try {
    const ctx = await b.newContext();
    await ctx.addInitScript(RECORDER);
    const page = await ctx.newPage();
    await page.goto(`http://127.0.0.1:${server.address().port}/`);
    for (const id of ['filter', 'save', 'apply', 'more', 'open']) { await page.click(`#${id}`); await page.waitForTimeout(50); }
    await page.keyboard.press('Escape');
    await page.click('#toggle');
    await page.click('#del');
    await page.click('#name'); await page.keyboard.type('Abc', { delay: 20 });
    await page.evaluate(() => document.activeElement.blur()); await page.keyboard.press('Alt+s');
    const lab = await page.evaluate(() => { window.__lab.flush(); return window.__lab; });
    const got = lab.changes.flatMap((w) => w.changes.map((c) => `${w.action} | ${w.on} | ${c.text} | ${c.where} | ${c.how}`));
    assert.deepEqual(got, [
      'click | button#filter "Filter" | 3 items found | p#count | silent',
      'click | button#save "Save" | Saved | div#status | live',
      'click | button#apply "Apply" | Settings applied | p#applied | announced',
      'click | button#more "More" | Extra options here | p | disclosed',
      'click | button#open "Open dialog" | Are you sure? | p | focus',
      'click | button#open "Open dialog" | OK | button#ok | focus',
      'click | button#toggle "Show details" | Hide details | button#toggle | control',
      'click | button#del "Delete" | Undo | button | name',
      'typing | input#name "Name" | Machine name: a | span#preview | silent',
      'typing | input#name "Name" | Machine name: ab | span#preview | silent',
      'typing | input#name "Name" | Machine name: abc | span#preview | silent',
      'key Alt+s | the page | Shortcut opened the panel | p#shortcut | silent',
    ]);
    assert.deepEqual(lab.announce.map((a) => a.text), ['Applied'], 'Drupal.announce() is still recorded and still runs');
    assert.equal(await page.textContent('#drupal-live-announce'), 'Applied');
    assert.ok(!JSON.stringify(lab).includes('"Abc"'), 'what was typed is not recorded as a value');
    const rows = silentRows(groupChanges([]), groupChanges(lab.changes));
    assert.deepEqual(rows.map((r) => `${r.action} ${r.page} ${r.on} ${r.times}`), ['click / button#filter "Filter" 1', 'typing / input#name "Name" 3', 'key Alt+s / the page 1']);
  } finally { await b.close(); server.close(); }
});
