// #3630425: does the multi-value field table's actions-column header give useful screen reader context,
// before and after MR !17622, without a visual or interaction regression?
//   node tools/playwright/screenreader-3630425.mjs [3630425-mr17622] --mode=virtual|voiceover|both \
//     [--sides=before,after] [--out=DIR] [--from=DIR]
//
// virtual   Guidepup virtual screen reader (@guidepup/virtual-screen-reader) over the table HTML Playwright
//           rendered after Drupal behaviours initialised. Reuses the evaluator's saved table HTML when
//           --from points at its run folder; otherwise it captures once with Playwright. jsdom has no layout
//           and does not reproduce VoiceOver table navigation or the browser accessibility API.
// voiceover Guidepup (@guidepup/guidepup) driving the real macOS VoiceOver in Safari. VoiceOver SPEAKS ALOUD.
//           It records each navigation command with the phrases that command actually added, so a repeated
//           last phrase is not mistaken for a repeated announcement. It needs the machine to itself for the
//           duration; it opens a Safari window and closes only that window.
//
// Output: reports/issues/3630425/screenreader/<stamp>/ (SUMMARY.md, results.json, raw phrase logs).
// Evidence, not a conformance verdict and not a substitute for a person's review.

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { JSDOM, VirtualConsole } from 'jsdom';
import { virtual } from '@guidepup/virtual-screen-reader';
import { labRoot, envInfo, loginPath, envDir } from '../compare/lib.mjs';
import { identity, identityRecord, blockMessage } from '../compare/env-state.mjs';
import { runBlockReason } from '../compare/patch-state.mjs';
import { runArgs, launch, openSide, sidePatchStates, gitInfo, siteContext } from './lib/lab-run.mjs';
import { cssEscape } from './lib/tree-capture.mjs';

const TABLE = 'table[id^="field-lab-multivalue-values"]';
const STAGES = ['initial', 'add', 'remove'];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const scrub = (s) => String(s ?? '')
  .replace(/user\/reset\/[^\s'"]+/gi, 'user/reset/[redacted]')
  .replace(/([?&](?:pass|token|key)=)[^&\s'"]+/gi, '$1[redacted]');
const oneLine = (s) => scrub(String(s ?? '')).replace(/\s+/g, ' ').trim();

const argv = process.argv.slice(2);
const USAGE = `usage: node tools/playwright/screenreader-3630425.mjs [slug] --mode=virtual|voiceover|both [--sides=before,after] [--out=DIR] [--from=DIR]
  virtual   Guidepup virtual screen reader over the rendered table (reuses the evaluator's saved HTML with --from)
  voiceover Guidepup driving real VoiceOver in Safari (exclusive machine; speaks aloud)
  --from    a reports/issues/3630425/playwright/STAMP folder with SIDE-STAGE-table.html files
  default slug: 3630425-mr17622; default output: reports/issues/3630425/screenreader/STAMP`;
if (argv.includes('--help') || argv.includes('-h')) { console.log(USAGE); process.exit(0); }
const opt = (name, fallback = null) => {
  const a = argv.find((x) => x.startsWith(`--${name}=`));
  return a ? a.slice(name.length + 3) : fallback;
};
const MODE = opt('mode', 'both');
if (!['virtual', 'voiceover', 'both'].includes(MODE)) {
  console.error('--mode must be virtual, voiceover or both');
  process.exit(2);
}
const SIDES = (opt('sides', 'before,after') || '').split(',').map((s) => s.trim()).filter(Boolean);
if (!SIDES.length || SIDES.some((s) => !['before', 'after'].includes(s))) {
  console.error('--sides must be a comma-separated subset of before,after');
  process.exit(2);
}
const FROM = opt('from', '') || '';
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const outDir = path.resolve(opt('out', '') || path.join(labRoot, 'reports/issues/3630425/screenreader', stamp));
fs.mkdirSync(outDir, { recursive: true });
process.argv.push(`--out=${outDir}`);
const run = runArgs({ slug: '3630425-mr17622' });
const issue = run.v.issue || '3630425';

const command = (cmd, args, timeout = 20000) => {
  try { return execFileSync(cmd, args, { encoding: 'utf8', timeout }).trim(); } catch { return ''; }
};
const pkgVersion = (name) => {
  try { return JSON.parse(fs.readFileSync(path.join(labRoot, 'tools/playwright/node_modules', name, 'package.json'), 'utf8')).version; } catch { return null; }
};
const versions = {
  node: process.version,
  platform: `${process.platform} ${process.arch}`,
  macos: process.platform === 'darwin' ? command('sw_vers', ['-productVersion']) || null : null,
  safari: process.platform === 'darwin' ? command('defaults', ['read', '/Applications/Safari.app/Contents/Info.plist', 'CFBundleShortVersionString']) || null : null,
  voiceover: process.platform === 'darwin' ? command('defaults', ['read', '/System/Library/CoreServices/VoiceOver.app/Contents/Info.plist', 'CFBundleShortVersionString']) || null : null,
  virtualScreenReader: pkgVersion('@guidepup/virtual-screen-reader'),
  jsdom: pkgVersion('jsdom'),
  guidepup: null,
};

const results = {
  issue,
  variant: run.v.slug,
  when: new Date().toISOString(),
  mode: MODE,
  sides: SIDES,
  out: path.relative(labRoot, outDir),
  versions,
  source: FROM ? { from: path.relative(labRoot, path.resolve(FROM)) } : null,
  core: run.v.core || null,
  patches: run.v.after.patches || [],
  commits: {},
  identity: null,
  preconditions: {},
  virtual: {},
  voiceover: {},
  limits: [],
  status: 'incomplete',
};

function save() {
  fs.writeFileSync(path.join(outDir, 'results.json'), JSON.stringify(results, null, 2));
  fs.writeFileSync(path.join(outDir, 'SUMMARY.md'), summaryMarkdown(results));
}
function fail(message) {
  results.status = 'blocked';
  results.blocked = message;
  save();
  console.error(message);
  process.exit(1);
}

// ---------------------------------------------------------------- preconditions and rendering

function domFacts(html) {
  const dom = new JSDOM(`<!DOCTYPE html><html><body>${html}</body></html>`, { virtualConsole: new VirtualConsole() });
  const doc = dom.window.document;
  const table = doc.querySelector(TABLE);
  if (!table) return { problems: ['no table with the Lab multi-value selector in the snapshot'] };
  const ths = [...(table.tHead?.rows[0]?.cells || [])];
  const rows = [...(table.tBodies?.[0]?.rows || [])];
  const removes = [...table.querySelectorAll('input[type=submit],button')].filter((b) => /Remove/.test(b.value || b.textContent));
  return {
    tableId: table.id,
    headers: ths.map((c) => ({ text: oneLine(c.textContent), colspan: c.colSpan, html: c.outerHTML })),
    rows: rows.length,
    cellsPerRow: rows.map((r) => r.cells.length),
    removes: removes.length,
    removeNames: removes.map((b) => oneLine(b.value || b.textContent)),
  };
}

function preconditionProblems(facts, stage, baseRows = null) {
  const p = [];
  if (facts.problems) return facts.problems;
  if (facts.headers.length !== 3) p.push(`expected 3 header cells, found ${facts.headers.length}`);
  if (facts.headers[0] && facts.headers[0].colspan !== 2) p.push(`first header should span 2 columns, found colspan=${facts.headers[0].colspan}`);
  if (facts.headers[0] && !/Lab multi-value text/.test(facts.headers[0].text)) p.push(`first header does not contain the field label: "${facts.headers[0].text}"`);
  if (facts.headers[2] && facts.headers[2].text !== 'Order') p.push(`third header should be Order, found "${facts.headers[2].text}"`);
  if (!facts.rows) p.push('no body rows');
  if (facts.rows !== facts.removes) p.push(`${facts.rows} rows but ${facts.removes} Remove controls`);
  if (facts.cellsPerRow.some((n) => n !== 4)) p.push(`a row does not have 4 cells: ${facts.cellsPerRow.join(',')}`);
  if (baseRows !== null) {
    const expected = stage === 'add' ? baseRows + 1 : stage === 'remove' ? baseRows : baseRows;
    if (facts.rows !== expected) p.push(`stage ${stage} should have ${expected} rows (initial ${baseRows}), found ${facts.rows}`);
  }
  return p;
}

async function tableState(page) {
  const count = await page.locator(TABLE).count();
  if (count !== 1) throw new Error(`expected exactly one Lab multi-value table, found ${count}`);
  return page.locator(TABLE).evaluate((table) => ({
    theme: window.drupalSettings?.ajaxPageState?.theme || null,
    rows: table.tBodies[0]?.rows.length || 0,
    headers: [...(table.tHead?.rows[0]?.cells || [])].map((c) => ({ text: c.textContent.trim(), colspan: c.colSpan, html: c.outerHTML })),
    removes: [...table.querySelectorAll('input[type=submit],button')].filter((b) => /Remove/.test(b.value || b.textContent)).length,
    cellsPerRow: [...(table.tBodies[0]?.rows || [])].map((r) => r.cells.length),
    html: table.outerHTML,
  }));
}

async function captureSide(side) {
  const { page, base, rec } = await openSide(run, side);
  const sideResult = { env: run.v[side].env, url: base + '/node/add/article', stages: {} };
  try {
    await page.goto(base + '/node/add/article');
    await page.locator(TABLE).waitFor({ timeout: 30000 });
    await page.waitForFunction(() => !!window.drupalSettings?.ajaxPageState?.theme, null, { timeout: 15000 });
    for (const stage of STAGES) {
      if (stage === 'add') {
        const initial = sideResult.stages.initial.rows;
        const add = page.locator('[name="field_lab_multivalue_add_more"]');
        if (await add.count() !== 1) throw new Error('Add another item control missing');
        await add.click();
        await page.waitForFunction(({ selector, count }) => document.querySelector(selector)?.tBodies[0].rows.length === count + 1, { selector: TABLE, count: initial }, { timeout: 20000 });
      }
      if (stage === 'remove') {
        const before = sideResult.stages.add.rows;
        const lastRemove = page.locator(TABLE).locator('[name$="_remove_button"]').last();
        if (!await lastRemove.count()) throw new Error('per-item Remove control missing after AJAX add');
        await lastRemove.click();
        await page.waitForFunction(({ selector, count }) => document.querySelector(selector)?.tBodies[0].rows.length === count - 1, { selector: TABLE, count: before }, { timeout: 20000 });
      }
      const state = await tableState(page);
      const aria = await page.locator(TABLE).ariaSnapshot();
      sideResult.stages[stage] = { ...state, aria };
      fs.writeFileSync(path.join(outDir, `${side}-${stage}-table.html`), state.html);
      fs.writeFileSync(path.join(outDir, `${side}-${stage}-aria.txt`), aria);
    }
    await rec.collect();
    sideResult.jsErrors = rec.jsErrors || [];
    sideResult.pages = rec.pages;
    sidResultCollectAjax(sideResult, rec);
  } finally {
    await rec.close(outDir).catch(() => {});
  }
  return sideResult;
}

function sidResultCollectAjax(sideResult, rec) {
  sideResult.ajax = (rec.ajax || []).map((a) => ({ url: a.url, status: a.status, commands: a.commands?.map((c) => c.command || c) }));
}

function loadFromRun(dir) {
  const source = {};
  for (const side of SIDES) {
    const stages = {};
    for (const stage of STAGES) {
      const htmlFile = path.join(dir, `${side}-${stage}-table.html`);
      if (!fs.existsSync(htmlFile)) throw new Error(`--from ${dir}: missing ${path.basename(htmlFile)}`);
      const ariaFile = path.join(dir, `${side}-${stage}-aria.txt`);
      stages[stage] = {
        html: fs.readFileSync(htmlFile, 'utf8'),
        aria: fs.existsSync(ariaFile) ? fs.readFileSync(ariaFile, 'utf8') : null,
      };
    }
    source[side] = stages;
  }
  return source;
}

// ---------------------------------------------------------------- virtual screen reader

function tableNameFromAria(aria) {
  const m = String(aria || '').match(/^\s*-\s*table(?:\s+"([^"]*)")?:/m);
  return m ? (m[1] || null) : null;
}

async function virtualPass(tableHtml, aria, url) {
  const dom = new JSDOM('<!DOCTYPE html><html lang="en"><body><div id="sr-root"></div></body></html>', {
    pretendToBeVisual: true,
    url,
    virtualConsole: new VirtualConsole(),
  });
  const doc = dom.window.document;
  doc.getElementById('sr-root').innerHTML = tableHtml;
  const hadCss = 'CSS' in globalThis;
  if (!globalThis.CSS?.escape) globalThis.CSS = { escape: cssEscape };
  global.window = dom.window;
  global.document = doc;
  global.Node = dom.window.Node;
  global.Element = dom.window.Element;
  global.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
  const phrases = [];
  let stopped = false;
  try {
    await virtual.start({ container: doc.getElementById('sr-root'), window: dom.window, displayCursor: false });
    phrases.push(oneLine(await virtual.lastSpokenPhrase()));
    const max = 250;
    for (let i = 0; i < max; i++) {
      await virtual.next();
      const said = oneLine(await virtual.lastSpokenPhrase());
      phrases.push(said);
      if (/^end of table/i.test(said) || virtual.activeNode === doc.body) { stopped = true; break; }
    }
    if (!stopped) phrases.push(`(stopped after ${max} items)`);
  } finally {
    await virtual.stop().catch(() => {});
    dom.window.close();
    if (!hadCss) delete globalThis.CSS;
  }
  const headers = phrases.filter((p) => /^columnheader\b/i.test(p)).map((p) => oneLine(p.replace(/^columnheader,?\s*/i, '')) || '(unnamed)');
  return {
    tableRole: phrases.some((p) => /^table\b/i.test(p)) ? 'table' : null,
    tableName: tableNameFromAria(aria),
    columnHeaders: headers,
    rowPhrases: phrases.filter((p) => /^row\b/i.test(p)).length,
    removeButtons: phrases.filter((p) => /^button,\s*Remove\b/i.test(p)).length,
    operationsReferences: phrases.filter((p) => /Operations/i.test(p)),
    readingOrder: phrases,
  };
}

async function virtualMode() {
  let source;
  if (FROM) {
    source = loadFromRun(path.resolve(FROM));
    results.source = { from: path.relative(labRoot, path.resolve(FROM)), reused: true };
  } else {
    const { browser, environment } = await launch(run);
    results.environment = environment;
    try {
      source = {};
      for (const side of SIDES) {
        const captured = await captureSide(side);
        const baseRows = captured.stages.initial.rows;
        results.preconditions[side] = Object.fromEntries(STAGES.map((stage) => {
          const state = preconditionProblems({ ...captured.stages[stage], problems: null }, stage, baseRows);
          if (captured.stages[stage].theme !== 'default_admin') state.push(`theme is ${captured.stages[stage].theme}, expected default_admin`);
          return [stage, { state, theme: captured.stages[stage].theme }];
        }));
        source[side] = Object.fromEntries(STAGES.map((stage) => [stage, { html: captured.stages[stage].html, aria: captured.stages[stage].aria }]));
        results.captures = results.captures || {};
        results.captures[side] = { env: captured.env, url: captured.url, jsErrors: captured.jsErrors, ajaxRequests: (captured.ajax || []).length };
      }
    } finally {
      await browser.close().catch(() => {});
    }
    results.source = { captured: true };
  }

  for (const side of SIDES) {
    results.virtual[side] = { stages: {} };
    const baseRows = domFacts(source[side].initial.html).rows;
    for (const stage of STAGES) {
      const html = source[side][stage].html;
      const facts = domFacts(html);
      const problems = preconditionProblems(facts, stage, baseRows);
      if (!results.preconditions[side]) results.preconditions[side] = {};
      results.preconditions[side][stage] = { ...(results.preconditions[side][stage] || {}), state: problems };
      const read = await virtualPass(html, source[side][stage].aria, `https://lab.invalid/node/add/article`);
      results.virtual[side].stages[stage] = { facts, ...read };
      save();
      console.log(`virtual ${side} ${stage}: ${read.columnHeaders.join(' | ')}`);
    }
  }
}

// ---------------------------------------------------------------- real VoiceOver

const osascript = (script, timeout = 60000) => {
  try { return execFileSync('osascript', ['-e', script], { encoding: 'utf8', timeout }).trim(); } catch (e) { throw new Error(oneLine(e.message)); }
};
const safariIds = () => {
  try { return osascript('tell application "Safari" to return id of every window').split(/,\s*/).filter(Boolean); } catch { return []; }
};
function safariOpenWindow(url) {
  const safe = JSON.stringify(url);
  return osascript(`tell application "Safari"
make new document with properties {URL:${safe}}
set w to front window
set index of w to 1
return (id of w) as text
end tell`);
}
const safariWindow = (id) => `(first window whose id is ${Number(id)})`;
function safariSetUrl(id, url) {
  osascript(`tell application "Safari" to set URL of document of ${safariWindow(id)} to ${JSON.stringify(url)}`);
}
function safariCurrentUrl(id) {
  if (!id) return '';
  try { return osascript(`tell application "Safari" to return URL of document of ${safariWindow(id)}`); } catch { return ''; }
}
function safariCloseWindow(id) {
  try { osascript(`tell application "Safari" to close ${safariWindow(id)}`); } catch { /* already gone */ }
}
function safariJs(id, expression) {
  if (!id) return { ok: false, error: 'no Safari window' };
  try {
    return { ok: true, value: osascript(`tell application "Safari" to do JavaScript ${JSON.stringify(expression)} in document of ${safariWindow(id)}`) };
  } catch (e) {
    return { ok: false, error: oneLine(e.message) };
  }
}
function safariJson(id, expression) {
  const r = safariJs(id, `JSON.stringify(${expression})`);
  if (!r.ok) return { error: r.error };
  try { return JSON.parse(r.value); } catch { return { error: 'could not parse the Safari JSON probe' }; }
}

async function loadRealGuidepup() {
  const tried = [];
  try {
    const mod = await import('@guidepup/guidepup');
    return { mod, from: 'package' };
  } catch (e) {
    tried.push(`package: ${oneLine(e.message)}`);
  }
  const candidates = [
    process.env.GUIDEPUP_REAL,
    process.platform === 'darwin' ? path.join(process.env.HOME || '', 'design-system-lab/node_modules/@guidepup/guidepup') : null,
  ].filter(Boolean);
  for (const dir of candidates) {
    const entry = path.join(dir, 'lib/index.js');
    if (!fs.existsSync(entry)) { tried.push(`${dir}: no lib/index.js`); continue; }
    try {
      const mod = await import(pathToFileURL(entry).href);
      return { mod, from: dir };
    } catch (e) {
      tried.push(`${dir}: ${oneLine(e.message)}`);
    }
  }
  throw new Error(`@guidepup/guidepup could not be loaded. ${tried.join('; ')}`);
}

function makeStepper(voiceOver, steps) {
  return async function step(label, representation, fn, { settle = 900 } = {}) {
    const before = (await voiceOver.spokenPhraseLog()).length;
    let error = null;
    try { await fn(); } catch (e) { error = oneLine(e.message); }
    await sleep(settle);
    let log = [];
    let last = '';
    try {
      log = await voiceOver.spokenPhraseLog();
      last = oneLine(await voiceOver.lastSpokenPhrase());
    } catch (e) { error = error || oneLine(e.message); }
    const rec = { label, representation, newPhrases: log.slice(before).map(oneLine).filter((p, i, a) => p || i === 0), lastPhrase: last, error };
    steps.push(rec);
    return rec;
  };
}

function stalled(steps) {
  if (steps.length < 3) return false;
  const last = steps[steps.length - 1];
  return steps.slice(-3).every((s) => !s.newPhrases.length && s.lastPhrase === last.lastPhrase);
}

async function seek(step, label, representation, fn, match, max, settle) {
  const local = [];
  for (let i = 1; i <= max; i++) {
    const s = await step(`${label} ${i}`, representation, fn, { settle });
    local.push(s);
    if (match(s)) return { found: true, steps: local };
    if (stalled(local)) return { found: false, stalled: true, steps: local };
  }
  return { found: false, incomplete: true, steps: local };
}

async function tableProbe(step, voiceOver, k, label, { reset = false } = {}) {
  const out = {};
  if (reset) {
    out.stopInteracting = await step(`${label} stopInteracting`, 'VO-Shift-Up', () => voiceOver.stopInteracting(), { settle: 900 });
    out.moveToFirst = await step(`${label} moveToFirst`, 'VO-Home', () => voiceOver.perform(k.moveToFirst), { settle: 900 });
  }
  out.find = await seek(step, `${label} findNextTable`, 'VO-Command-T', () => voiceOver.perform(k.findNextTable), (s) => /table/i.test(s.lastPhrase), 8, 1000);
  if (!out.find.found) return out;
  out.interact = await step(`${label} interactWithItem`, 'VO-Shift-Down', () => voiceOver.interact(), { settle: 1200 });
  out.rowAndColumnNumbers = await step(`${label} readTableRowAndColumnNumbers`, 'VO-Shift-T', () => voiceOver.perform(k.readTableRowAndColumnNumbers));
  out.headerRow = await step(`${label} readTableRow`, 'VO-R', () => voiceOver.perform(k.readTableRow), { settle: 1200 });
  out.columns = [];
  for (let i = 1; i <= 3; i++) out.columns.push(await step(`${label} moveToNextColumn ${i}`, 'VO-Command-Y', () => voiceOver.perform(k.moveToNextColumn), { settle: 1000 }));
  out.columnHeader = await step(`${label} readTableColumnHeader`, 'VO-C', () => voiceOver.perform(k.readTableColumnHeader));
  return out;
}

async function nthRemove(step, voiceOver, k, label, nth) {
  const steps = [];
  let hits = 0;
  for (let i = 1; i <= 30; i++) {
    const s = await step(`${label} findNextControl ${i}`, 'VO-Command-J', () => voiceOver.perform(k.findNextControl), { settle: 800 });
    const previous = steps.length ? steps[steps.length - 1].lastPhrase : '';
    steps.push(s);
    const advanced = s.newPhrases.length > 0 || s.lastPhrase !== previous;
    if (advanced && (/Remove/i.test(s.lastPhrase) || /Remove/i.test(s.newPhrases.join(' ')))) {
      hits++;
      if (hits === nth) return { found: true, hits, steps };
    }
    if (stalled(steps)) return { found: false, stalled: true, hits, steps };
  }
  return { found: false, incomplete: true, hits, steps };
}

async function removeProbe(step, voiceOver, k, label) {
  const out = {};
  out.find = await seek(step, `${label} findNextControl`, 'VO-Command-J', () => voiceOver.perform(k.findNextControl), (s) => /Remove/i.test(s.lastPhrase) || /Remove/i.test(s.newPhrases.join(' ')), 20, 900);
  if (!out.find.found) return out;
  out.columnHeader = await step(`${label} readTableColumnHeader`, 'VO-C', () => voiceOver.perform(k.readTableColumnHeader));
  out.rowAndColumnNumbers = await step(`${label} readTableRowAndColumnNumbers`, 'VO-Shift-T', () => voiceOver.perform(k.readTableRowAndColumnNumbers));
  out.down = await step(`${label} moveDown`, 'VO-Down', () => voiceOver.perform(k.moveDown), { settle: 1200 });
  out.columnHeaderAfterDown = await step(`${label} readTableColumnHeader after moveDown`, 'VO-C', () => voiceOver.perform(k.readTableColumnHeader));
  return out;
}

async function findControl(step, voiceOver, k, label, pattern, max = 30) {
  return seek(step, `${label} findNextControl`, 'VO-Command-J', () => voiceOver.perform(k.findNextControl), (s) => pattern.test(s.lastPhrase) || pattern.test(s.newPhrases.join(' ')), max, 900);
}

async function voiceOverSide(side, mod) {
  const { voiceOver } = mod;
  let k = null;
  const env = run.v[side].env;
  const info = envInfo(env);
  const host = info.hosts.slice().sort((a, b) => a.length - b.length)[0];
  const base = `https://${host}`;
  const result = {
    env,
    base,
    windowId: null,
    openedAt: new Date().toISOString(),
    safariWindowsBefore: safariIds(),
    steps: [],
    scenarios: {},
    focus: [],
    errors: [],
    safariJs: null,
    completed: false,
    incomplete: [],
  };
  const step = makeStepper(voiceOver, result.steps);
  let started = false;
  const focusProbe = () => result.safariJs
    ? safariJson(result.windowId, `({ tag: document.activeElement ? document.activeElement.tagName : null, name: document.activeElement ? document.activeElement.getAttribute('name') : null, value: document.activeElement ? (document.activeElement.value || document.activeElement.textContent || null) : null })`)
    : null;
  try {
    result.windowId = safariOpenWindow(base + loginPath(env));
    await sleep(6000);
    safariSetUrl(result.windowId, base + '/node/add/article');
    await sleep(6000);
    result.url = safariCurrentUrl(result.windowId);
    const js = safariJs(result.windowId, 'document.readyState');
    result.safariJs = js.ok;
    if (js.ok) {
      for (let i = 0; i < 20; i++) {
        if (/complete/i.test(safariJs(result.windowId, 'document.readyState').value || '')) break;
        await sleep(500);
      }
    }
    result.table = safariJson(result.windowId, `(() => { const t = document.querySelector('table[id^=field-lab-multivalue-values]'); if (!t) return null; return { theme: window.drupalSettings?.ajaxPageState?.theme || null, rows: t.tBodies[0]?.rows.length || 0, headers: [...(t.tHead?.rows[0]?.cells || [])].map((c) => ({ text: c.textContent.trim(), colspan: c.colSpan })), removes: [...t.querySelectorAll('input[type=submit],button')].filter((b) => /Remove/.test(b.value || b.textContent)).length, focus: document.activeElement ? { tag: document.activeElement.tagName, name: document.activeElement.getAttribute('name') } : null }; })()`);
    if (result.safariJs && result.table && !result.table.error) {
      if (result.table.theme !== 'default_admin') result.errors.push(`theme is ${result.table.theme}, expected default_admin`);
      if (result.table.rows !== 2) result.errors.push(`expected 2 initial rows, Safari reported ${result.table.rows}`);
      if (result.table.removes !== 2) result.errors.push(`expected 2 initial Remove controls, Safari reported ${result.table.removes}`);
    }

    for (let attempt = 1; attempt <= 3 && !started; attempt++) {
      try { await voiceOver.stop(); } catch { /* not running */ }
      await sleep(3000);
      try { await voiceOver.start(); } catch (e) { result.errors.push(`start attempt ${attempt}: ${oneLine(e.message)}`); continue; }
      await sleep(2500);
      const said = (await voiceOver.spokenPhraseLog()).join(' ');
      if (!/Recovery mode/i.test(said)) started = true;
      else result.errors.push(`start attempt ${attempt}: VoiceOver started in Recovery mode`);
    }
    if (!started) throw new Error('VoiceOver did not start normally');
    k = voiceOver.keyboardCommands;   // the getter throws while VoiceOver is not running
    result.spokenAtStart = (await voiceOver.spokenPhraseLog()).slice(-5);

    const heading = await seek(step, 'findNextHeading', 'VO-Command-H', () => voiceOver.perform(k.findNextHeading), (s) => /heading level 1/i.test(s.lastPhrase), 15, 900);
    result.scenarios.page = heading;

    result.scenarios.enterAndHeader = await tableProbe(step, voiceOver, k, 'initial');
    result.scenarios.exit = await step('stopInteracting', 'VO-Shift-Up', () => voiceOver.stopInteracting(), { settle: 1000 });
    result.scenarios.reenter = await tableProbe(step, voiceOver, k, 'reenter', { reset: true });

    result.scenarios.remove = await removeProbe(step, voiceOver, k, 'initial');
    result.focus.push({ when: 'after reaching the first Remove', describe: await step('describeItemWithKeyboardFocus', 'VO-F4', () => voiceOver.perform(k.describeItemWithKeyboardFocus)), active: focusProbe() });

    result.scenarios.beforeAddStop = await step('stopInteracting before Add', 'VO-Shift-Up', () => voiceOver.stopInteracting(), { settle: 900 });
    const add = await findControl(step, voiceOver, k, 'add another item', /Add another item/i, 30);
    result.scenarios.addButton = add;
    if (add.found) {
      const beforeLog = (await voiceOver.spokenPhraseLog()).length;
      result.scenarios.addActivate = await step('activate Add another item', 'VO-Space', () => voiceOver.act(), { settle: 4500 });
      result.scenarios.addAnnouncedByItself = (await voiceOver.spokenPhraseLog()).slice(beforeLog).map(oneLine);
      result.scenarios.afterAdd = {
        table: result.safariJs ? safariJson(result.windowId, `(() => { const t = document.querySelector('table[id^=field-lab-multivalue-values]'); if (!t) return null; return { rows: t.tBodies[0]?.rows.length ?? null, removes: [...t.querySelectorAll('input[type=submit],button')].filter((b) => /Remove/.test(b.value || b.textContent)).length, active: document.activeElement ? document.activeElement.getAttribute('name') : null }; })()`) : null,
        focus: focusProbe(),
      };
      result.focus.push({ when: 'after Add another item', describe: await step('describeItemWithKeyboardFocus', 'VO-F4', () => voiceOver.perform(k.describeItemWithKeyboardFocus)), active: focusProbe() });
      result.scenarios.afterAddTable = await tableProbe(step, voiceOver, k, 'after add', { reset: true });
      const lastRemove = await nthRemove(step, voiceOver, k, 'last remove after add', 3);
      result.scenarios.afterAddLastRemove = lastRemove.found ? {
        find: lastRemove,
        columnHeader: await step('last Remove readTableColumnHeader', 'VO-C', () => voiceOver.perform(k.readTableColumnHeader)),
        rowAndColumnNumbers: await step('last Remove readTableRowAndColumnNumbers', 'VO-Shift-T', () => voiceOver.perform(k.readTableRowAndColumnNumbers)),
      } : lastRemove;
      if (lastRemove.found) {
        const n = (await voiceOver.spokenPhraseLog()).length;
        result.scenarios.removeActivate = await step('activate last Remove', 'VO-Space', () => voiceOver.act(), { settle: 4500 });
        result.scenarios.removeAnnouncedByItself = (await voiceOver.spokenPhraseLog()).slice(n).map(oneLine);
        result.focus.push({ when: 'after Remove', describe: await step('describeItemWithKeyboardFocus', 'VO-F4', () => voiceOver.perform(k.describeItemWithKeyboardFocus)), active: focusProbe() });
        result.scenarios.afterRemoveTable = await tableProbe(step, voiceOver, k, 'after remove', { reset: true });
        result.scenarios.afterRemove = {
          table: result.safariJs ? safariJson(result.windowId, `(() => { const t = document.querySelector('table[id^=field-lab-multivalue-values]'); if (!t) return null; return { rows: t.tBodies[0]?.rows.length ?? null, removes: [...t.querySelectorAll('input[type=submit],button')].filter((b) => /Remove/.test(b.value || b.textContent)).length }; })()`) : null,
          focus: focusProbe(),
        };
      }
    }
    const missing = [];
    if (!result.scenarios.page?.found) missing.push('page h1');
    if (!result.scenarios.enterAndHeader?.find?.found) missing.push('table entry');
    if (!result.scenarios.enterAndHeader?.headerRow) missing.push('header row');
    if (!result.scenarios.remove?.find?.found) missing.push('first Remove');
    if (!result.scenarios.addButton?.found) missing.push('Add another item');
    if (!result.scenarios.addActivate) missing.push('Add activation');
    if (!result.scenarios.afterAddLastRemove?.find?.found) missing.push('new Remove after add');
    if (!result.scenarios.afterAddTable?.find?.found) missing.push('table after add');
    if (!result.scenarios.removeActivate) missing.push('Remove activation');
    if (!result.scenarios.afterRemoveTable?.find?.found) missing.push('re-entry after remove');
    result.incomplete.push(...missing.map((m) => `${m}: not reached`));
    result.completed = missing.length === 0;
  } catch (e) {
    result.errors.push(oneLine(e.message));
  } finally {
    let fullLog = [];
    if (started) {
      try { fullLog = await voiceOver.spokenPhraseLog(); } catch { /* not available after stop */ }
      try { await voiceOver.stop(); } catch (e) { result.errors.push(`stop: ${oneLine(e.message)}`); }
    }
    await sleep(2000);
    if (result.windowId) safariCloseWindow(result.windowId);
    await sleep(1000);
    result.safariWindowsAfter = safariIds();
    result.otherWindowsPreserved = result.safariWindowsBefore.every((id) => result.safariWindowsAfter.includes(id));
    for (const [name, scenario] of Object.entries(result.scenarios)) {
      const steps = scenario?.steps || [];
      if (scenario && Object.hasOwn(scenario, 'found') && !scenario.found) result.incomplete.push(`${name}: not reached`);
      if (steps.some((s) => s.error)) result.incomplete.push(`${name}: command error`);
    }
    fs.writeFileSync(path.join(outDir, `voiceover-${side}-phrases.txt`), fullLog.join('\n'));
    fs.writeFileSync(path.join(outDir, `voiceover-${side}-steps.json`), JSON.stringify(result.steps, null, 2));
    save();
  }
  return result;
}

// ---------------------------------------------------------------- report

function phraseList(phrases, limit = 80) {
  if (!phrases?.length) return '    - (nothing)';
  const shown = phrases.slice(0, limit).map((p) => `    - ${p || '(empty)'}`);
  if (phrases.length > limit) shown.push(`    - … ${phrases.length - limit} more, see results.json`);
  return shown.join('\n');
}

function summaryMarkdown(r) {
  const when = r.when;
  let md = `# #${r.issue} screen reader evidence: MR !17622 (${r.variant})\n\n`;
  md += `DRAFT, AI-assisted; a person has not reviewed it. Run ${when}. Mode: ${r.mode}; sides: ${r.sides.join(', ')}.\n\n`;
  md += `Evidence for MR [!17622](https://git.drupalcode.org/project/drupal/-/merge_requests/17622) head \`090a74cd28aa\`. This is not a re-run of !17421 or of the Lab's main port; do not attribute these results to them.\n\n`;
  md += `| | |\n|---|---|\n| Core pin | \`${r.core?.commit || 'n/a'}\` |\n| Before commit | \`${r.commits?.before || 'not read'}\` |\n| After commit | \`${r.commits?.after || 'not read'}\` |\n| Patch | \`${(r.patches || []).map((p) => path.basename(p)).join(', ') || 'n/a'}\` |\n| Source | ${r.source?.from ? `reused \`${r.source.from}\`` : 'captured in this run'} |\n| macOS / Safari / VoiceOver | ${r.versions.macos || '?'} / ${r.versions.safari || '?'} / ${r.versions.voiceover || '?'} |\n| Guidepup / virtual reader / jsdom | ${r.versions.guidepup || 'not loaded'} / ${r.versions.virtualScreenReader || '?'} / ${r.versions.jsdom || '?'} |\n\n`;
  if (r.blocked) md += `## Blocked\n\n${r.blocked}\n\n`;
  md += `## Preconditions\n\n`;
  const preSides = Object.keys(r.preconditions || {});
  if (!preSides.length) md += `Not checked in this run.\n\n`;
  else {
    md += `| Side | Stage | Problems |\n|---|---|---|\n`;
    for (const side of preSides) for (const stage of STAGES) {
      const p = r.preconditions[side]?.[stage]?.state;
      md += `| ${side} | ${stage} | ${p === undefined ? 'not checked' : p.length ? p.join('; ') : 'none'} |\n`;
    }
    md += '\n';
  }
  md += `## Virtual screen reader (Guidepup over jsdom)\n\n`;
  if (!Object.keys(r.virtual || {}).length) md += `Not run in this invocation.\n\n`;
  else {
    md += `| Side | Stage | Header names | Rows | Remove buttons | Operations phrases |\n|---|---|---|---|---|---|\n`;
    for (const side of Object.keys(r.virtual)) for (const stage of STAGES) {
      const s = r.virtual[side]?.stages?.[stage];
      if (!s) continue;
      md += `| ${side} | ${stage} | ${s.columnHeaders.map((h) => h || '(unnamed)').join(' / ') || '(none)'} | ${s.facts?.rows ?? '?'} | ${s.removeButtons} | ${s.operationsReferences.length} |\n`;
    }
    md += `\nReading order, initial state:\n\n`;
    for (const side of Object.keys(r.virtual)) md += `**${side}**\n\n${phraseList(r.virtual[side]?.stages?.initial?.readingOrder)}\n\n`;
    md += `The virtual reader works on a DOM snapshot. It has no layout engine, does not model VoiceOver table navigation and does not associate the header with a Remove cell in its per-cell speech. A bare \`columnheader\` above is the empty header; \`Operations\` is the label.\n\n`;
  }
  md += `## Real VoiceOver and Safari\n\n`;
  if (!Object.keys(r.voiceover || {}).length) md += `Not run in this invocation.\n\n`;
  else {
    for (const side of Object.keys(r.voiceover)) {
      const v = r.voiceover[side];
      md += `### ${side}\n\nURL: ${v.url || 'not read'}. Safari JavaScript probe: ${v.safariJs === null ? 'not attempted' : v.safariJs ? 'available' : 'unavailable'}. Completed: ${v.completed}. Other Safari windows preserved: ${v.otherWindowsPreserved}.\n\n`;
      if (v.errors?.length) md += `Errors: ${v.errors.join('; ')}\n\n`;
      if (v.incomplete?.length) md += `Incomplete: ${[...new Set(v.incomplete)].join('; ')}\n\n`;
      const rows = [
        ['entering the table', v.scenarios?.enterAndHeader?.interact],
        ['header row', v.scenarios?.enterAndHeader?.headerRow],
        ['across columns', v.scenarios?.enterAndHeader?.columns?.slice(-1)[0]],
        ['first Remove', v.scenarios?.remove?.find?.steps?.slice(-1)[0]],
        ['column header at Remove', v.scenarios?.remove?.columnHeader],
        ['between Remove buttons', v.scenarios?.remove?.columnHeaderAfterDown],
        ['re-enter', v.scenarios?.reenter?.interact],
        ['Add another item', v.scenarios?.addActivate],
        ['header after add', v.scenarios?.afterAddTable?.headerRow],
        ['last Remove after add', v.scenarios?.afterAddLastRemove?.find?.steps?.slice(-1)[0]],
        ['Remove activation', v.scenarios?.removeActivate],
        ['header after remove', v.scenarios?.afterRemoveTable?.headerRow],
      ];
      md += `| Scenario | Last phrase | New phrases from the command |\n|---|---|---|\n`;
      for (const [label, rec] of rows) {
        if (!rec) { md += `| ${label} | not reached | |\n`; continue; }
        const added = rec.newPhrases?.length ? rec.newPhrases.join(' / ') : '(none)';
        md += `| ${label} | ${rec.lastPhrase || '(nothing)'} | ${added} |\n`;
      }
      md += `\n`;
      if (v.scenarios?.addAnnouncedByItself) md += `Spoken by itself after Add another item: ${v.scenarios.addAnnouncedByItself.join(' / ') || '(nothing)'}\n\n`;
      if (v.scenarios?.removeAnnouncedByItself) md += `Spoken by itself after Remove: ${v.scenarios.removeAnnouncedByItself.join(' / ') || '(nothing)'}\n\n`;
      if (v.table) md += `Safari DOM probe at load: ${JSON.stringify(v.table)}\n\n`;
      md += `<details><summary>Raw command log (${v.steps.length} steps)</summary>\n\n`;
      for (const s of v.steps) md += `- \`${s.label}\` (${s.representation}): ${s.newPhrases.join(' / ') || '(no new speech)'}${s.error ? ` ERROR ${s.error}` : ''}\n`;
      md += `\n</details>\n\n`;
    }
  }
  md += `## Limits\n\n- The virtual reader is a synthetic model. It has no CSS or layout, so it cannot show that \`Operations\` is visually hidden, and it does not reproduce VoiceOver table navigation.\n- VoiceOver output depends on macOS, Safari, VoiceOver settings and verbosity. One machine, one run. A person's keyboard and screen reader review is still required.\n- Repeated phrases are reported only when a command added them; a repeated \`lastPhrase\` with no new speech is a navigation artefact, not a repeated announcement.\n- AJAX completion is judged from the page's row state and what VoiceOver read, not only from network timing.\n- The MR's one review note could not be read (GitLab API returned HTTP 401).\n`;
  return md;
}

// ---------------------------------------------------------------- run

if (FROM && MODE === 'voiceover') fail('--from is only for --mode=virtual or both; the VoiceOver pass needs the live sites.');
const needsEnvs = MODE !== 'virtual' || !FROM;
if (needsEnvs) {
  for (const side of ['before', 'after']) {
    if (!fs.existsSync(envDir(run.v[side].env))) fail(`${run.v[side].env} (${side}) is not built. Run: node tools/compare/setup.mjs ${run.slug}`);
  }
  const idn = identity(run.v, { labRoot, envDir });
  results.identity = identityRecord(idn);
  if (idn.problems.length) fail(blockMessage(idn));
  const blocked = runBlockReason(sidePatchStates(run.v), run.slug, { before: run.v.before.env, after: run.v.after.env });
  if (blocked) fail(blocked);
  results.commits = { before: gitInfo(run.v.before.env), after: gitInfo(run.v.after.env) };
  try { results.site = { before: siteContext(run.v.before.env), after: siteContext(run.v.after.env) }; } catch (e) { results.site = { error: oneLine(e.message) }; }
} else if (fs.existsSync(path.join(labRoot, 'envs', run.v.before.env))) {
  results.commits = { before: gitInfo(run.v.before.env), after: gitInfo(run.v.after.env) };
}

try {
if (MODE === 'virtual' || MODE === 'both') {
  await virtualMode();
  save();
}

if (MODE === 'voiceover' || MODE === 'both') {
  let loaded;
  try {
    loaded = await loadRealGuidepup();
  } catch (e) {
    fail(`BLOCKED: ${oneLine(e.message)}`);
  }
  versions.guidepup = loaded.from === 'package' ? pkgVersion('@guidepup/guidepup') : (() => {
    try { return JSON.parse(fs.readFileSync(path.join(loaded.from, 'package.json'), 'utf8')).version; } catch { return null; }
  })();
  results.guidepup = { from: loaded.from === 'package' ? '@guidepup/guidepup' : path.relative(process.env.HOME || '/', loaded.from), version: versions.guidepup };
  save();
  const existing = safariIds();
  results.safariWindowsBefore = existing;
  for (const side of SIDES) {
    results.voiceover[side] = await voiceOverSide(side, loaded.mod);
    save();
    console.log(`voiceover ${side}: ${results.voiceover[side].completed ? 'completed' : 'incomplete'}`);
  }
}
} catch (e) {
  results.status = 'error';
  results.error = oneLine(e.message);
  save();
  console.error(results.error);
  process.exit(1);
}

results.status = 'completed';
if (Object.values(results.voiceover).some((v) => !v.completed || v.incomplete.length)) results.status = 'incomplete';
if (Object.values(results.preconditions).some((side) => Object.values(side).some((x) => x.state?.length))) results.status = 'incomplete';
if (!results.limits.length) {
  results.limits.push('Synthetic virtual reader over jsdom; not VoiceOver or NVDA.', 'One macOS/Safari/VoiceOver machine and run; a person has still to review it.', 'The MR review note was unreadable (HTTP 401).');
}
save();
console.log(path.relative(labRoot, outDir));
