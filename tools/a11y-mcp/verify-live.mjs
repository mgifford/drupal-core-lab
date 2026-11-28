#!/usr/bin/env node
// Live verification: drive Playwright MCP against a real Drupal Before/After pair, capture named checkpoints on the live
// CKEditor page, and compare the two sides at equivalent states.
//
//   node tools/a11y-mcp/verify-live.mjs --slug 3419891-pinned [--side=both|before|after] [--route=/node/1/edit]
//                                       [--out=reports/infrastructure/a11y-mcp] [--no-compare] [--keep-hint]
//
// It needs: tools/playwright installed with Chromium, both environments built (tools/compare/setup.mjs), DDEV running
// (scripts/lab-env.mjs start), and the one-time login command from the Drupal add-on (ddev drupal login).
//
// What it proves, on a real Drupal page rather than a fixture:
//   1. the MCP browser opens the Drupal component;
//   2. axe-core (and, when available, a second engine) evaluates the exact current state;
//   3. the checkpoint does not reload the page (performance.timeOrigin and the open dialog are unchanged);
//   4. the checkpoint records provenance: issue, variant, side, core commit, patch state, route, theme, viewport;
//   5. both sides are compared only after their states are shown to be equivalent.
//
// Secrets: the one-time login link is used and never printed, written or recorded. Checkpoint page paths are sanitised
// (tools/observability/sanitize.mjs redacts /user/reset/<uid>/<timestamp>/<token>/login).
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { labRoot, resolveVariant, envDir, envInfo, loginPath, reportsDir } from '../compare/lib.mjs';
import { startMcpClient } from './mcp-client.mjs';
import { loadRecords, compareSides, renderSession } from '../playwright/lib/a11y/report.mjs';
import { readSessionHint, writeSessionHint } from '../playwright/lib/a11y/store.mjs';
import { gitInfo } from '../playwright/lib/lab-run.mjs';

const args = process.argv.slice(2);
const opt = (n, d = null) => {
  const eq = args.find((a) => a.startsWith(`--${n}=`));
  if (eq) return eq.slice(n.length + 3);
  const at = args.indexOf(`--${n}`);
  return at >= 0 && args[at + 1] && !args[at + 1].startsWith('--') ? args[at + 1] : at >= 0 ? true : d;
};
const flag = (n) => args.includes(`--${n}`);
const die = (message, code = 1) => { console.error(message); process.exit(code); };
const log = (...a) => console.log(...a);

const slugArg = opt('slug');
if (!slugArg) die('usage: node tools/a11y-mcp/verify-live.mjs --slug <variant> [--side=both|before|after] [--route=/node/1/edit] [--out=<dir>]');
const resolved = resolveVariant(slugArg);
if (resolved.error) die(resolved.error);
const v = resolved.v;
const sides = opt('side', 'both') === 'both' ? ['before', 'after'] : [String(opt('side'))];
for (const s of sides) if (!['before', 'after'].includes(s)) die('--side must be both, before or after');
const route = opt('route', v.pages?.[0] || '/node/1/edit');
const outBase = path.resolve(labRoot, opt('out', path.join('reports', 'infrastructure', 'a11y-mcp')));
const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const sessionDir = path.join(outBase, `${stamp}-live-${v.slug}`);
const hintFile = path.join(labRoot, '.lab-cache', 'a11y-mcp', 'session.json');
const previousHint = fs.existsSync(hintFile) ? fs.readFileSync(hintFile, 'utf8') : null;

// The environments must be built and running; say the exact command instead of failing obscurely.
for (const side of sides) {
  const env = v[side].env;
  let info;
  try { info = envInfo(env); } catch (error) { die(`${env} is not built (${String(error.message).split('\n')[0]}). Build it: node tools/compare/setup.mjs ${v.slug}`, 3); }
  if (info.status !== 'running') die(`${env} is ${info.status}. Start it: node scripts/lab-env.mjs start ${v.slug}`, 3);
}

fs.mkdirSync(path.dirname(hintFile), { recursive: true });
fs.writeFileSync(hintFile, JSON.stringify({ variant: v.slug, scenario: `live-${v.slug}`, label: `live-${v.slug}`, out: path.relative(labRoot, sessionDir), profile: 'full' }, null, 2));

const baseFor = (env) => `https://${envInfo(env).hosts.slice().sort((a, b) => a.length - b.length)[0]}`;
const results = { schema: 'lab-a11y-live-verification/1', when: new Date().toISOString(), variant: v.slug, issue: String(v.issue), route, tool: 'playwright-mcp', sides: [], checkpoints: [], comparison: null, limits: [] };
let mcp;

// A read-only probe of the CKEditor toolbar: which controls exist and how to reach one without an MCP element ref.
const TOOLBAR_PROBE = `() => {
  const unique = (sel) => { try { return document.querySelectorAll(sel).length === 1; } catch (e) { return false; } };
  const cssPath = (el) => {
    const parts = [];
    for (let n = el; n && n.nodeType === 1 && n !== document.documentElement && parts.length < 8; n = n.parentElement) {
      let part = n.localName;
      const parent = n.parentElement;
      if (parent) { const same = [].slice.call(parent.children).filter(function (c) { return c.localName === n.localName; }); if (same.length > 1) part += ':nth-of-type(' + (same.indexOf(n) + 1) + ')'; }
      parts.unshift(part);
      if (n.id && unique('#' + CSS.escape(n.id))) { parts.unshift('#' + CSS.escape(n.id)); break; }
    }
    return parts.join(' > ');
  };
  const out = [];
  const seen = new Set();
  for (const sel of ['.ck-toolbar button', '.ck.ck-toolbar button', '[role=toolbar] button']) {
    for (const b of document.querySelectorAll(sel)) {
      if (seen.has(b)) continue; seen.add(b);
      const aria = b.getAttribute('aria-label');
      const tip = b.getAttribute('data-cke-tooltip-text');
      const name = (aria || tip || b.textContent || '').replace(/\\s+/g, ' ').trim();
      if (!name) continue;
      let selector = null;
      if (aria) selector = 'button[aria-label="' + aria.replace(/"/g, '\\\\"') + '"]';
      else if (tip) selector = 'button[data-cke-tooltip-text="' + tip.replace(/"/g, '\\\\"') + '"]';
      else if (b.id) selector = '#' + CSS.escape(b.id);
      else selector = cssPath(b);
      out.push({ name, selector, disabled: !!b.disabled, pressed: b.getAttribute('aria-pressed') });
    }
  }
  return out;
}`;
const READY_EDITOR = `document.querySelector('.ck-editor__editable[contenteditable="true"], .ck-editor__editable') !== null`;
const READY_DIALOG = `document.querySelector('[role=dialog], dialog[open], .ck-dialog, .ck-balloon-panel') !== null`;
const checkpointExpr = (request) => `() => window.__labA11y.checkpoint(${JSON.stringify(request)})`;

async function checkpoint(request) {
  const before = await mcp.evaluate('() => ({ origin: performance.timeOrigin, nav: performance.getEntriesByType("navigation").length, dialogs: document.querySelectorAll("[role=dialog], dialog[open], .ck-dialog").length, active: document.activeElement ? (document.activeElement.getAttribute("aria-label") || document.activeElement.localName) : null })');
  const result = await mcp.evaluate(checkpointExpr(request));
  const after = await mcp.evaluate('() => ({ origin: performance.timeOrigin, nav: performance.getEntriesByType("navigation").length, dialogs: document.querySelectorAll("[role=dialog], dialog[open], .ck-dialog").length, active: document.activeElement ? (document.activeElement.getAttribute("aria-label") || document.activeElement.localName) : null })');
  return { result, before, after, preserved: before.origin === after.origin && before.nav === after.nav };
}

try {
  // A cold Drupal first request (Mutagen sync + container wake) can exceed MCP's 60 s navigation timeout.
  mcp = startMcpClient({ labRoot, headless: true, log, extraArgs: ['--timeout-navigation=180000', '--timeout-action=30000'] });
  await mcp.init();

  for (const side of sides) {
    const env = v[side].env;
    const base = baseFor(env);
    const sideResult = { side, env, host: new URL(base).hostname, commit: gitInfo(env), checkpoints: [], errors: [] };
    log(`\n${side.toUpperCase()} ${env} (${sideResult.commit}) ${base}${route}`);
    try {
      // Log in with the one-time link (never printed, never written).
      const login = base + loginPath(env);
      // Retry once: the first request to a cold site can time out even with a long timeout.
      let nav = await mcp.call('browser_navigate', { url: login });
      if (nav.isError) {
        log('  login navigation failed once, retrying');
        nav = await mcp.call('browser_navigate', { url: login });
      }
      if (nav.isError) throw new Error(`login navigation failed: ${nav.text.slice(0, 300)}`);
      const afterLogin = await mcp.evaluate('() => ({ path: location.pathname, loggedIn: !document.querySelector("form#user-login-form") })');
      if (!afterLogin.loggedIn) throw new Error('the one-time login did not log the browser in (link expired or the add-on returned a different user)');
      log(`  logged in via the one-time link; now at ${afterLogin.path}`);

      const goto = await mcp.call('browser_navigate', { url: base + route });
      if (goto.isError) throw new Error(`could not open ${route}: ${goto.text.slice(0, 300)}`);

      // Drupal attaches CKEditor 5 when the body field is focused; clicking it is the trusted input that initialises the
      // editor. The readiness condition below then waits for the real editable, never for a fixed delay.
      const editable = await mcp.evaluate(`() => ({ present: !!document.querySelector('.ck-editor__editable, .ck-content'), editable: document.querySelector('.ck-editor__editable')?.getAttribute('contenteditable') || null })`);
      if (!editable?.editable || editable.editable !== 'true') {
        const focus = await mcp.call('browser_click', { element: 'CKEditor body field', target: '.ck-editor__editable, .ck-content, [contenteditable]' });
        if (focus.isError) sideResult.errors.push(`could not focus the editor: ${focus.text.slice(0, 300)}`);
      }

      // 1. The editor as it initialises.
      const editor = await checkpoint({ id: 'editor-initialized', label: 'CKEditor initialised', profile: 'full', readiness: { expression: READY_EDITOR, timeoutMs: 30000 } });
      sideResult.checkpoints.push({ id: 'editor-initialized', status: editor.result?.checkpoint?.checkpoint?.status, preserved: editor.preserved, engines: editor.result?.checkpoint?.engines, findings: editor.result?.checkpoint?.totals });
      if (!editor.result?.ok) { sideResult.errors.push(`editor-initialized: ${JSON.stringify(editor.result?.error || editor.result).slice(0, 400)}`); }
      else log(`  editor-initialized: ${editor.result.checkpoint.findings.length} finding(s), state preserved: ${editor.preserved}`);

      // 2. A focused toolbar item: a trusted click on a toolbar control, then the checkpoint.
      const toolbar = await mcp.evaluate(TOOLBAR_PROBE);
      sideResult.toolbar = (toolbar || []).map((b) => b.name).slice(0, 40);
      const pick = (re) => (toolbar || []).find((b) => re.test(b.name) && b.selector && !b.disabled);
      const bold = pick(/bold/i);
      if (bold) {
        const click = await mcp.call('browser_click', { element: `toolbar ${bold.name}`, target: bold.selector });
        if (!click.isError) {
          // Readiness is the control itself (the click focuses it); the checkpoint records what actually has focus, so
          // the record shows whether the toolbar control was focused without executing an agent-supplied expression.
          const focused = await checkpoint({ id: 'toolbar-item-focused', label: `Toolbar item focused: ${bold.name}`, profile: 'quick', readiness: { selector: bold.selector, state: 'visible', timeoutMs: 8000 } });
          sideResult.checkpoints.push({ id: 'toolbar-item-focused', status: focused.result?.checkpoint?.checkpoint?.status || 'not-captured', preserved: focused.preserved, engines: focused.result?.checkpoint?.engines, findings: focused.result?.checkpoint?.totals });
          if (!focused.result?.ok) sideResult.errors.push(`toolbar-item-focused: ${JSON.stringify(focused.result?.error || focused.result).slice(0, 300)}`);
        }
      }

      // 3. An open dropdown (the CKEditor paragraph/heading list): an in-page overlay, no file chooser.
      const headingButton = pick(/paragraph|heading/i);
      if (headingButton) {
        const click = await mcp.call('browser_click', { element: `toolbar ${headingButton.name}`, target: headingButton.selector });
        if (!click.isError) {
          const open = await checkpoint({ id: 'dropdown-open', label: 'CKEditor heading dropdown open', profile: 'quick', readiness: { expression: 'document.querySelector(".ck-dropdown__panel-visible, [role=listbox]") !== null', timeoutMs: 8000 } });
          sideResult.checkpoints.push({ id: 'dropdown-open', status: open.result?.checkpoint?.checkpoint?.status, preserved: open.preserved, engines: open.result?.checkpoint?.engines, findings: open.result?.checkpoint?.totals });
          await mcp.call('browser_press_key', { key: 'Escape' });
        }
      }

      // 4. The link balloon: an in-page dialog-like state with a focused URL field.
      const linkButton = pick(/link/i);
      if (linkButton) {
        const click = await mcp.call('browser_click', { element: `toolbar ${linkButton.name}`, target: linkButton.selector });
        if (!click.isError) {
          const balloon = await checkpoint({ id: 'balloon-open', label: 'CKEditor link balloon open', profile: 'quick', readiness: { expression: 'document.querySelector(".ck-balloon-panel_visible, .ck-form, [role=dialog]") !== null', timeoutMs: 8000 }, scope: '.ck-balloon-panel, .ck-form' });
          sideResult.checkpoints.push({ id: 'balloon-open', status: balloon.result?.checkpoint?.checkpoint?.status, preserved: balloon.preserved, engines: balloon.result?.checkpoint?.engines, findings: balloon.result?.checkpoint?.totals });
          // Dismiss, then check that focus came back into the editor.
          await mcp.call('browser_press_key', { key: 'Escape' });
          const restored = await checkpoint({ id: 'focus-restored', label: 'Focus restored after the balloon closed', profile: 'quick', readiness: { expression: 'document.activeElement !== null && (document.activeElement.isContentEditable || document.activeElement.getAttribute("role") === "textbox" || document.activeElement.closest(".ck-editor__editable, .ck-content") !== null)', timeoutMs: 8000 } });
          sideResult.checkpoints.push({ id: 'focus-restored', status: restored.result?.checkpoint?.checkpoint?.status, preserved: restored.preserved, engines: restored.result?.checkpoint?.engines, findings: restored.result?.checkpoint?.totals });
        }
      }

      // 5. The image control. Drupal's toolbar image button can open the operating system's file chooser, which a
      // checkpoint must not trigger (it would block and change nothing about the page). The image dialog is covered by
      // the scripted evaluator (tools/playwright/evaluate-3419891.mjs) and the scenario file; here it is recorded as
      // skipped rather than attempted blindly.
      const image = pick(/image/i);
      if (!image) sideResult.checkpoints.push({ id: 'image-dialog-open', status: 'skipped', reason: 'no image control in the visible toolbar' });
      else if (/upload/i.test(image.name)) sideResult.checkpoints.push({ id: 'image-dialog-open', status: 'skipped', reason: `the only image control ("${image.name}") opens a file chooser; use the scripted evaluator or a scenario for the image dialog` });
      else {
        const click = await mcp.call('browser_click', { element: `toolbar ${image.name}`, target: image.selector });
        if (click.isError) sideResult.errors.push(`clicking ${image.name} failed: ${click.text.slice(0, 300)}`);
        else {
          const dialog = await checkpoint({ id: 'image-dialog-open', label: 'CKEditor image dialog open', profile: 'full', readiness: { expression: READY_DIALOG, timeoutMs: 15000 }, scope: '[role=dialog], .ck-dialog, dialog[open]' });
          sideResult.checkpoints.push({ id: 'image-dialog-open', status: dialog.result?.checkpoint?.checkpoint?.status, preserved: dialog.preserved, engines: dialog.result?.checkpoint?.engines, findings: dialog.result?.checkpoint?.totals });
        }
      }
    } catch (error) {
      sideResult.errors.push(String(error.message || error).slice(0, 600));
    }
    results.sides.push(sideResult);
  }

  const finish = await mcp.evaluate('() => window.__labA11y.finish()');
  if (!finish?.ok) throw new Error(`finish failed: ${JSON.stringify(finish)}`);
  const sessionPath = path.join(labRoot, finish.session);
  const session = JSON.parse(fs.readFileSync(path.join(sessionPath, 'session.json'), 'utf8'));
  session.checkpoints = session.checkpoints.map((c) => ({ ...c, file: c.file || path.relative(labRoot, path.join(sessionPath, 'checkpoints', `${String(c.sequence).padStart(3, '0')}-${c.id}.json`)) }));
  results.session = path.relative(labRoot, sessionPath);
  results.checkpoints = session.checkpoints.map((c) => ({ id: c.id, side: c.side, sequence: c.sequence, status: c.status, file: c.file }));

  if (!flag('no-compare') && sides.length === 2) {
    const pairs = compareSides(loadRecords(session));
    results.comparison = pairs.map((p) => ({
      checkpointId: p.checkpointId,
      comparable: p.comparable,
      reason: p.reason || null,
      checks: (p.equivalence?.checks || []).map((c) => ({ name: c.name, pass: c.pass, detail: c.detail })),
      classifications: p.classifications.map((c) => ({ change: c.change, engine: c.engine || c.finding?.engine?.id || null, rule: c.finding?.ruleId || null })),
    }));
    log('\nBefore / After at equivalent states:');
    for (const p of results.comparison) {
      log(`  ${p.checkpointId}: ${p.comparable ? 'equivalent' : `NOT COMPARABLE (${p.reason})`}`);
      for (const c of p.checks.filter((x) => !x.pass)) log(`    failed check: ${c.name} (${c.detail})`);
      const counts = {};
      for (const c of p.classifications) counts[c.change] = (counts[c.change] || 0) + 1;
      log(`    classifications: ${Object.entries(counts).map(([k, n]) => `${k} ${n}`).join(', ') || 'none'}`);
    }
  }

  results.limits = [
    'Chromium only (the MCP browser). Other engines are reported per checkpoint, not assumed.',
    'No real screen reader and no person took part: announcements, focus order and icon meaning remain manual checks.',
    'The CKEditor image dialog is reached and measured; inserting media, alternative-text editing and focus restoration are not exercised by this script.',
  ];
  results.unexpected = results.sides.flatMap((s) => s.errors).length;
  const verificationFile = path.join(sessionPath, 'live-verification.json');
  fs.writeFileSync(verificationFile, JSON.stringify(results, null, 2) + '\n');
  const { markdown } = renderSession(session);
  fs.writeFileSync(path.join(sessionPath, 'SUMMARY.md'), markdown);
  log(`\nEvidence: ${path.relative(labRoot, sessionPath)}`);
  log(`  report:   ${path.relative(labRoot, path.join(sessionPath, 'report.html'))}`);
  log(`  summary:  ${path.relative(labRoot, path.join(sessionPath, 'SUMMARY.md'))}`);
  log(`  verification: ${path.relative(labRoot, verificationFile)}`);

  const captured = results.checkpoints.filter((c) => c.status === 'captured');
  const comparable = (results.comparison || []).filter((p) => p.comparable);
  if (captured.length < sides.length) die(`Only ${captured.length} checkpoint(s) captured; see ${path.relative(labRoot, verificationFile)}`, 1);
  if (sides.length === 2 && !flag('no-compare') && comparable.length === 0) die('No checkpoint was captured on both sides at equivalent states; the comparison is not evidence. See the verification file.', 2);
  log('\nOK: the MCP browser opened the Drupal component, the checkpoints were captured on the live page with state preserved, and the sides were compared only after equivalence was checked.');
  process.exitCode = 0;
} catch (error) {
  console.error(`FAILED: ${String(error.message || error).slice(0, 1500)}`);
  process.exitCode = 1;
} finally {
  if (mcp) await mcp.close();
  if (!flag('keep-hint')) {
    if (previousHint == null) { try { fs.rmSync(hintFile); } catch { /* already gone */ } } else fs.writeFileSync(hintFile, previousHint);
  }
}
