// tools/playwright/tree-diff.mjs: the text views and SUMMARY.md (no browser), then the whole tool on two small local sites (needs
// tools/playwright installed with Chromium; skipped otherwise; LAB_CHROMIUM=<path> names another Chromium binary).
//   node --test tests/lab/tree-diff.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { axTreeText, normaliseTree, pageFile, refChanges, summaryMarkdown, terminalReport } from '../../tools/playwright/lib/tree-format.mjs';

const labRoot = fileURLToPath(new URL('../..', import.meta.url));

test('normaliseTree: random id suffixes, CKEditor ids, content dates and hostnames go; ordinary names stay', () => {
  const t = normaliseTree('edit-actions--Ab3dE_fGh1k button--extrasmall ck-editor__label_e86b0f16899ff79b350cdae36d9a97440 10/19/2026 - 14:03 https://repro-x.ddev.site/node/1', ['repro-x.ddev.site']);
  assert.equal(t, 'edit-actions--RANDOM button--extrasmall ck-editor__label_HEX DATE https://HOST/node/1');
});

test('axTreeText: ignored and empty generic nodes move their children up; text equal to its parent\'s name is left out', () => {
  const p = (name, value, type = 'booleanOrUndefined') => ({ name, value: { type, value } });
  const nodes = [
    { nodeId: '1', role: { value: 'RootWebArea' }, name: { value: 'Fixture' }, childIds: ['2', '5', '8'] },
    { nodeId: '2', parentId: '1', ignored: true, role: { value: 'none' }, childIds: ['3'] },
    { nodeId: '3', parentId: '2', role: { value: 'button' }, name: { value: 'Menu' }, childIds: ['4'],
      properties: [p('focusable', true), p('expanded', false), { name: 'controls', value: { type: 'idrefList', value: '', relatedNodes: [{ idref: 'panel', backendDOMNodeId: 9 }] } }, { name: 'labelledby', value: { type: 'nodeList', relatedNodes: [] } }] },
    { nodeId: '4', parentId: '3', role: { value: 'StaticText' }, name: { value: 'Menu' }, childIds: ['6'] },
    { nodeId: '6', parentId: '4', role: { value: 'InlineTextBox' }, name: { value: 'Menu' } },
    { nodeId: '5', parentId: '1', role: { value: 'generic' }, childIds: ['7'] },
    { nodeId: '7', parentId: '5', role: { value: 'paragraph' }, childIds: ['9'] },
    { nodeId: '9', parentId: '7', role: { value: 'StaticText' }, name: { value: 'Hello   world' } },
    { nodeId: '8', parentId: '1', role: { value: 'textbox' }, name: { value: 'Name' }, description: { value: 'Your full name' }, value: { value: 'Ada' }, properties: [p('required', true), p('invalid', 'false', 'token')] },
  ];
  assert.equal(axTreeText(nodes), [
    'RootWebArea "Fixture"',
    '  button "Menu" focusable expanded=false controls=#panel',
    '  paragraph',
    '    text "Hello world"',
    '  textbox "Name" description="Your full name" value="Ada" required invalid=false',
    '',
  ].join('\n'));
});

test('pageFile and refChanges', () => {
  assert.equal(pageFile('/', 0), '01-front');
  assert.equal(pageFile('/node/1/edit?destination=/admin', 11), '12-node-1-edit');
  const r = (id, problem = 'missing') => ({ page: '/p', element: 'input#a', attr: 'aria-describedby', id, problem });
  assert.deepEqual(refChanges([r('x'), r('y')], [r('y'), r('z')]).map((x) => `${x.id} ${x.change}`), ['z new in After', 'x gone in After', 'y on both sides']);
});

test('summaryMarkdown: a page that did not load as asked is listed first; same and changed views; ID references', () => {
  const run = {
    title: '1-latest', when: 'now', login: true, environment: { browserVersion: '1', viewport: { width: 1280, height: 900 } },
    sides: { before: { label: 'B' }, after: { label: 'A' } },
    pages: [
      { path: '/node/1/edit', file: '01-node-1-edit', sides: { before: { status: 200, landed: '/user/login?destination=/node/1/edit', spoken: 9 }, after: { status: 200, landed: '/node/1/edit', spoken: 10 } },
        views: { axtree: { diff: '--- a\n+++ b\n@@\n-x\n+y\n+z\n', file: '01-node-1-edit.axtree.diff' }, aria: { diff: '', file: 'x' }, speech: { diff: '', file: 'y' } } },
      { path: '/gone', file: '02-gone', sides: { before: { status: 404, landed: '/gone' }, after: { error: 'net::ERR_CONNECTION_REFUSED' } }, views: {} },
    ],
    refs: { before: [], after: [{ page: '/node/1/edit', element: 'input#a', attr: 'aria-describedby', id: 'help', problem: 'missing' }] },
  };
  const md = summaryMarkdown(run);
  assert.match(md, /before: `\/node\/1\/edit` ended at `\/user\/login\?destination=\/node\/1\/edit` \(not logged in\?\)/);
  assert.match(md, /before: `\/gone` answered HTTP 404/);
  assert.match(md, /after: `\/gone` could not be read: net::ERR_CONNECTION_REFUSED/);
  assert.match(md, /\| `\/node\/1\/edit` \| \[\+2 −1\]\(01-node-1-edit\.axtree\.diff\) \| same \| same \| 9 \/ 10 \|/);
  assert.match(md, /\| `\/gone` \| not read \| not read \| not read \|/);
  assert.match(md, /\*\*new in After\*\* \| `\/node\/1\/edit` \| `input#a` \| aria-describedby \| no element has id `help`/);
  assert.match(md, /\*\*1 of 6 views differ\.\*\*/);
});

test('terminalReport: problems first, then each page\'s changed lines (cut after max), ID references and where the report is', () => {
  const diff = ['--- before /p (Accessibility tree)', '+++ after /p (Accessibility tree)', '@@ -1,3 +1,3 @@', ' main', '-    button "Hide panel" expanded', '+    button "Panel" expanded', '-  a', '+  b', '+  c'].join('\n');
  const run = {
    login: true, environment: { browserVersion: '141', viewport: { width: 480, height: 900 } },
    pages: [
      { path: '/p', sides: { before: { status: 200, landed: '/p' }, after: { status: 200, landed: '/p' } }, views: { axtree: { diff, file: '01-p.axtree.diff' }, aria: { diff: '' }, speech: { diff: '' } } },
      { path: '/q', sides: { before: { status: 200, landed: '/q' }, after: { status: 200, landed: '/q' } }, views: { axtree: { diff: '' }, aria: { diff: '' }, speech: { diff: '' } } },
      { path: '/r', sides: { before: { error: 'refused' }, after: { status: 200, landed: '/user/login' } }, views: {} },
    ],
    refs: { before: [], after: [{ page: '/p', element: 'input#a', attr: 'aria-describedby', id: 'x', problem: 'missing' }] },
  };
  const t = terminalReport(run, 'reports/issues/1/tree-diff/1-latest', { max: 3 });
  assert.match(t, /480x900, logged in: yes/);
  assert.match(t, /CHECK FIRST:\n  before: \/r could not be read: refused\n  after: \/r ended at \/user\/login \(not logged in\?\)/);
  assert.match(t, /\/p\n  Accessibility tree +\+3 -2\n    - button "Hide panel" expanded\n    \+ button "Panel" expanded\n    - a\n    \.\.\. 2 more in 01-p\.axtree\.diff\n  ARIA after JavaScript +same\n  Speech \(Guidepup\) +same/);
  assert.match(t, /\/q\n  same in all three views/);
  assert.match(t, /\/r\n  not compared: see CHECK FIRST/);
  assert.match(t, /1 new in After, 0 gone in After, 0 on both sides/);
  assert.match(t, /Report: reports\/issues\/1\/tree-diff\/1-latest\/SUMMARY\.md/);
});

// ---- The whole tool, on two local sites

const PW = path.join(labRoot, 'tools/playwright/node_modules');
async function chromiumPath() {
  if (!['@playwright/test', 'jsdom', '@guidepup/virtual-screen-reader'].every((m) => fs.existsSync(path.join(PW, m)))) return null;
  if (process.env.LAB_CHROMIUM) return process.env.LAB_CHROMIUM;
  const { chromium } = await import(pathToFileURL(path.join(PW, '@playwright/test/index.mjs')).href);
  return fs.existsSync(chromium.executablePath()) ? '' : null;
}

const CSS = '.is-closed { display: none } .visually-hidden { position: absolute !important; clip: rect(1px, 1px, 1px, 1px); overflow: hidden; height: 1px; width: 1px } .force { display: block }';
const page = (after) => `<!DOCTYPE html><html lang="en"><head><title>Fixture</title><link rel="stylesheet" href="/style.css"></head><body><main>
<h1>Settings</h1>
<button id="menu" aria-controls="panel">Menu</button>
<div id="panel" class="is-closed"><a href="/x">Link in a closed panel</a></div>
<label for="name">Name</label><input id="name" aria-describedby="name-help">${after ? '<div id="name-help">Your full name</div>' : ''}
<span class="visually-hidden">Note for screen readers</span>
<p hidden>Never shown</p>
<p hidden class="force">Shown by CSS</p>
${after ? '<script>document.getElementById(\'menu\').setAttribute(\'aria-expanded\', \'false\')</script>' : ''}
</main></body></html>`;
function site(after) {
  return http.createServer((req, res) => {
    if (req.url === '/style.css') { res.writeHead(200, { 'content-type': 'text/css' }); return res.end(CSS); }
    if (req.url === '/form') { res.writeHead(200, { 'content-type': 'text/html' }); return res.end(page(after)); }
    if (req.url === '/old' && !after) { res.writeHead(302, { location: '/user/login?destination=/old' }); return res.end(); }
    res.writeHead(200, { 'content-type': 'text/html' }); res.end('<!DOCTYPE html><html lang="en"><head><title>Other</title></head><body><h1>Other page</h1></body></html>');
  });
}

test('tree-diff.mjs on two local sites: what changed in each view, what is hidden, and a page that did not load as asked', { timeout: 120000 }, async (t) => {
  const chromium = await chromiumPath();
  if (chromium === null) { t.skip('tools/playwright is not installed with Chromium (cd tools/playwright && npm install && npx playwright install chromium), or set LAB_CHROMIUM'); return; }
  const servers = [site(false), site(true)];
  for (const s of servers) { s.listen(0, '127.0.0.1'); await once(s, 'listening'); }
  const out = fs.mkdtempSync(path.join(os.tmpdir(), 'tree-diff-'));
  try {
    const [b, a] = servers.map((s) => `http://127.0.0.1:${s.address().port}`);
    const child = spawn(process.execPath, ['tools/playwright/tree-diff.mjs', `--before=${b}`, `--after=${a}`, '--page=/form', '--page=/old', `--out=${out}`, ...(chromium ? [`--chromium=${chromium}`] : [])], { cwd: labRoot, stdio: ['ignore', 'pipe', 'pipe'] });
    let log = ''; for (const s of [child.stdout, child.stderr]) s.on('data', (d) => (log += d));
    const [code] = await once(child, 'exit');
    assert.equal(code, 0, log);
    const read = (f) => fs.readFileSync(path.join(out, f), 'utf8');
    const speech = read('before/01-form.speech.txt');
    assert.match(speech, /Note for screen readers/, 'visually hidden text is spoken');
    assert.match(speech, /Shown by CSS/, 'an element CSS shows despite its hidden attribute is spoken');
    assert.doesNotMatch(speech, /Link in a closed panel|Never shown/, 'what Chromium does not render is not spoken');
    assert.match(read('01-form.axtree.diff'), /^\+\s+button "Menu" .*expanded=false/m, 'aria-expanded set by JavaScript reaches the accessibility tree');
    assert.match(read('01-form.aria.diff'), /^-.*input#name aria-describedby="name-help" \[missing #name-help\]/m);
    assert.match(read('01-form.speech.diff'), /^\+.*Your full name/m);
    const md = read('SUMMARY.md');
    assert.match(md, /before: `\/old` ended at `\/user\/login\?destination=\/old` \(not logged in\?\)/);
    assert.match(md, /gone in After \| `\/form` \| `input#name` \| aria-describedby \| no element has id `name-help`/);
  } finally {
    for (const s of servers) s.close();
    fs.rmSync(out, { recursive: true, force: true });
  }
});
