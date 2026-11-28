#!/usr/bin/env node
// Human/agent commands for the Playwright MCP accessibility-checkpoint integration.
//
//   node tools/a11y-mcp/cli.mjs session [--variant <slug>] [--scenario <id>] [--label <text>] [--out <dir>] [--profile <name>] [--clear]
//   node tools/a11y-mcp/cli.mjs engines
//   node tools/a11y-mcp/cli.mjs verify
//   node tools/a11y-mcp/cli.mjs list [--all]
//   node tools/a11y-mcp/cli.mjs check <session-dir>
//   node tools/a11y-mcp/cli.mjs report <session-dir>
//   node tools/a11y-mcp/cli.mjs compare <session-dir> [--json]
//
// The session command only writes .lab-cache/a11y-mcp/session.json (gitignored): the MCP hook reads it to attribute
// checkpoints to a variant/scenario and, optionally, to a fixed output folder. Nothing here scans or launches a browser.
import fs from 'node:fs';
import path from 'node:path';
import { labRoot } from '../compare/lib.mjs';
import { resolveVariant } from '../compare/lib.mjs';
import { describeEngines } from '../playwright/lib/a11y/engines.mjs';
import { checkpointProblems } from '../playwright/lib/a11y/checkpoint.mjs';
import { loadRecords, compareSides, renderSession } from '../playwright/lib/a11y/report.mjs';
import { MCP_INFO } from '../playwright/lib/a11y/mcp-hook.mjs';
import { readSessionHint, writeSessionHint, SESSION_FILE } from '../playwright/lib/a11y/store.mjs';
import { readLabConfig } from '../compare/lab-config.mjs';

const args = process.argv.slice(2);
const command = args[0];
const opt = (name, d = null) => { const hit = args.find((a) => a.startsWith(`--${name}=`)); return hit ? hit.slice(name.length + 3) : d; };
const flag = (name) => args.includes(`--${name}`);
const positional = args.slice(1).filter((a) => !a.startsWith('--'));
const die = (message, code = 2) => { console.error(message); process.exit(code); };

const rel = (p) => path.relative(labRoot, path.resolve(labRoot, p));

function sessionCmd() {
  if (flag('clear')) {
    if (fs.existsSync(SESSION_FILE)) fs.rmSync(SESSION_FILE);
    console.log(`cleared ${rel(SESSION_FILE)}`);
    return;
  }
  const variantArg = opt('variant');
  let variant = null;
  if (variantArg) {
    const r = resolveVariant(variantArg);
    if (r.error) return die(r.error);
    variant = r.v.slug;
  }
  const hint = {
    variant,
    scenario: opt('scenario'),
    label: opt('label'),
    out: opt('out'),
    profile: opt('profile'),
  };
  for (const [key, value] of Object.entries(hint)) if (value == null) delete hint[key];
  const file = writeSessionHint(hint);
  console.log(`Wrote ${rel(file)}:`);
  console.log(JSON.stringify(hint, null, 2));
  console.log('\nThe Playwright MCP hook reads this for every checkpoint in this checkout. Clear it with: node tools/a11y-mcp/cli.mjs session --clear');
}

async function enginesCmd() {
  const engines = await describeEngines({ allowFixtures: true });
  for (const e of engines) {
    console.log(`${e.id}\t${e.label}\t${e.version}\t${e.license}\t${e.available ? 'available' : 'not installed'}`);
    console.log(`  live page: ${e.livePage}  injects JS: ${e.requiresInjectedJavaScript}  navigates: ${e.requiresNavigation}  iframes: ${e.iframes}  shadow DOM: ${e.shadowDom}  computed styles: ${e.computedStyles}  preserves state: ${e.preservesState}`);
    if (e.unavailableReason) console.log(`  ${e.unavailableReason}`);
  }
}

function verifyCmd() {
  const problems = [];
  const config = readLabConfig(labRoot);
  if (config.problems.length) problems.push(`lab.config.yml: ${config.problems.join('; ')}`);
  let mcp = null;
  try { mcp = JSON.parse(fs.readFileSync(path.join(labRoot, '.mcp.json'), 'utf8')); } catch (error) { problems.push(`.mcp.json is not readable: ${error.message}`); }
  const server = mcp?.mcpServers?.playwright;
  if (!server) problems.push('.mcp.json has no "playwright" server');
  else {
    const argv = server.args || [];
    const initPage = argv.find((a) => a.startsWith('--init-page='))?.split('=')[1];
    const initScript = argv.find((a) => a.startsWith('--init-script='))?.split('=')[1];
    if (!initPage) problems.push('the playwright server does not pass --init-page; checkpoints will not be captured');
    else if (!fs.existsSync(path.join(labRoot, initPage))) problems.push(`--init-page=${initPage} does not exist`);
    if (!initScript) problems.push('the playwright server does not pass --init-script; the approved page helper will not be present before page scripts');
    else if (!fs.existsSync(path.join(labRoot, initScript))) problems.push(`--init-script=${initScript} does not exist`);
    const mcpPkg = path.join(labRoot, 'tools/playwright/node_modules/@playwright/mcp/package.json');
    if (!fs.existsSync(mcpPkg)) problems.push('@playwright/mcp is not installed: PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 npm ci --prefix tools/playwright');
    console.log(`Playwright MCP: ${MCP_INFO.version} (${MCP_INFO.integration})`);
    console.log('Integration: init-page (Node side, one hook per tab) + init-script (approved page helper, before page scripts).');
    console.log(`WebMCP tool route: ${MCP_INFO.webmcp}`);
  }
  if (!config.config.a11y_mcp?.enabled) problems.push('a11y_mcp.enabled is false in lab.config.yml');
  if (problems.length) { for (const p of problems) console.error(`FAIL  ${p}`); process.exit(1); }
  console.log('OK: the Playwright MCP integration is configured. This says nothing about a Drupal environment: build/start one first.');
}

function sessionDirs() {
  const dirs = [];
  const issues = path.join(labRoot, 'reports/issues');
  if (fs.existsSync(issues)) for (const nid of fs.readdirSync(issues)) {
    const base = path.join(issues, nid, 'checkpoints');
    if (fs.existsSync(base)) for (const d of fs.readdirSync(base)) if (fs.existsSync(path.join(base, d, 'session.json'))) dirs.push(path.join(base, d));
  }
  const local = path.join(labRoot, '.lab-cache/a11y-mcp');
  if (fs.existsSync(local)) for (const d of fs.readdirSync(local)) if (fs.existsSync(path.join(local, d, 'session.json'))) dirs.push(path.join(local, d));
  return dirs.sort();
}

function listCmd() {
  const dirs = sessionDirs();
  if (!dirs.length) return console.log('No checkpoint session yet. Open Playwright MCP and call window.__labA11y.checkpoint({id:"..."}) from the page.');
  for (const dir of dirs) {
    const s = JSON.parse(fs.readFileSync(path.join(dir, 'session.json'), 'utf8'));
    console.log(`${rel(dir)}\t${s.issue ? `#${s.issue}` : s.kinds?.join(',') || 'session'}\t${s.checkpoints.length} checkpoint(s)\t${s.findings?.length || 0} finding(s)\t${s.started}`);
  }
  if (!flag('all')) console.log('\nUse "node tools/a11y-mcp/cli.mjs report <session-dir>" to regenerate the report.');
}

function loadSession(dirArg) {
  const dir = path.resolve(labRoot, dirArg || '');
  const file = path.join(dir, 'session.json');
  if (!fs.existsSync(file)) return die(`No session.json in ${dirArg}. Find one with: node tools/a11y-mcp/cli.mjs list`);
  const session = JSON.parse(fs.readFileSync(file, 'utf8'));
  session.checkpoints = (session.checkpoints || []).map((c) => ({ ...c, file: c.file || path.relative(labRoot, path.join(dir, 'checkpoints', `${String(c.sequence).padStart(3, '0')}-${c.id}.json`)) }));
  return { dir, session };
}

function checkCmd() {
  const { dir, session } = loadSession(positional[0]);
  const problems = [];
  for (const c of session.checkpoints) {
    const file = path.join(labRoot, c.file);
    if (!fs.existsSync(file)) { problems.push(`missing checkpoint file ${c.file}`); continue; }
    let record;
    try { record = JSON.parse(fs.readFileSync(file, 'utf8')); } catch (error) { problems.push(`${c.file}: not JSON (${error.message})`); continue; }
    for (const p of checkpointProblems(record)) problems.push(`${path.basename(c.file)}: ${p}`);
    if (record.side !== c.side) problems.push(`${path.basename(c.file)}: side in the record (${record.side}) differs from the index (${c.side})`);
    for (const e of record.evidence?.engines || []) if (['failed', 'not-run'].includes(e.status) && !e.error) problems.push(`${path.basename(c.file)}: ${e.engine} is ${e.status} without a reason`);
  }
  const known = new Set(session.findings?.map((f) => f.fingerprint));
  for (const c of session.checkpoints) {
    const record = JSON.parse(fs.readFileSync(path.join(labRoot, c.file), 'utf8'));
    for (const f of record.findings || []) if (!known.has(f.fingerprint)) problems.push(`${path.basename(c.file)}: finding ${f.displayId} is not in the session's deduplicated set`);
  }
  if (problems.length) { for (const p of problems) console.error(`FAIL  ${p}`); process.exit(1); }
  console.log(`OK: ${session.checkpoints.length} checkpoint(s) in ${rel(dir)} are complete and consistent.`);
}

async function reportCmd() {
  const { dir, session } = loadSession(positional[0]);
  const records = loadRecords(session);
  const { markdown, html } = renderSession(session);
  fs.writeFileSync(path.join(dir, 'SUMMARY.md'), markdown);
  fs.writeFileSync(path.join(dir, 'report.html'), html);
  console.log(`Regenerated ${rel(path.join(dir, 'SUMMARY.md'))} and ${rel(path.join(dir, 'report.html'))} from ${records.length} checkpoint(s).`);
}

function compareCmd() {
  const { session } = loadSession(positional[0]);
  const records = loadRecords(session);
  const pairs = compareSides(records);
  if (flag('json')) { console.log(JSON.stringify(pairs.map((p) => ({ checkpointId: p.checkpointId, comparable: p.comparable, reason: p.reason, checks: p.equivalence?.checks, classifications: p.classifications.map((c) => ({ change: c.change, engine: c.engine || c.finding?.engine?.id || null, rule: c.finding?.ruleId || null, detail: c.detail || null })) })), null, 2)); return; }
  if (!pairs.length) return console.log('No checkpoint was captured on both sides.');
  for (const p of pairs) {
    console.log(`${p.checkpointId}: ${p.comparable ? 'equivalent' : `NOT COMPARABLE (${p.reason})`}`);
    for (const c of p.equivalence?.checks || []) console.log(`  ${c.pass ? 'ok  ' : 'FAIL'} ${c.name}: ${c.detail}`);
    const counts = {};
    for (const c of p.classifications) counts[c.change] = (counts[c.change] || 0) + 1;
    console.log(`  classifications: ${Object.entries(counts).map(([k, v]) => `${k} ${v}`).join(', ') || 'none'}`);
  }
}

const commands = { session: sessionCmd, engines: enginesCmd, verify: verifyCmd, list: listCmd, check: checkCmd, report: reportCmd, compare: compareCmd };
if (!command || !commands[command]) {
  console.log(fs.readFileSync(new URL(import.meta.url), 'utf8').split('\n').slice(1, 13).map((l) => l.replace(/^\/\/ ?/, '')).join('\n'));
  process.exit(command ? 2 : 0);
}
await commands[command]();
