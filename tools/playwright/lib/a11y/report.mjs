// The human-readable views of a checkpoint session: Markdown for the terminal and the issue report, and one accessible
// HTML file for reading in a browser. Both are generated from the same canonical JSON (session.json, checkpoints/*.json)
// and neither adds facts that are not in it.
//
// Accessibility of the report itself is part of the deliverable: semantic headings and tables, table captions and header
// scopes, no colour-only meaning, no script, light and dark support, and a visible focus style.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { labRoot } from '../../../compare/lib.mjs';
import { findingTotals } from './findings.mjs';
import { equivalence } from './checkpoint.mjs';

const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const cell = (s, n = 120) => { const t = String(s == null ? '' : s).replace(/\s+/g, ' ').trim(); return (t.length > n ? t.slice(0, n - 1) + '…' : t).replace(/\|/g, '\\|'); };
const mdLink = (file, label) => (file ? `[${label || path.basename(file)}](${file})` : '');

export function loadRecords(session) {
  const out = [];
  for (const c of session.checkpoints || []) {
    try { out.push(JSON.parse(fs.readFileSync(path.join(labRoot, c.file), 'utf8'))); }
    catch (error) { out.push({ ...c, loadError: String(error.message).split('\n')[0] }); }
  }
  return out.sort((a, b) => a.sequence - b.sequence);
}

// Filters: by checkpoint id, component/scope selector, rule id or engine. Applied to findings and to the table rows;
// the checkpoint inventory always lists every captured checkpoint, so a filter cannot hide that a state was visited.
function matches(finding, filters) {
  if (!filters) return true;
  if (filters.engine && finding.engine?.id !== filters.engine) return false;
  if (filters.rule && finding.ruleId !== filters.rule) return false;
  if (filters.checkpoint && !(finding.observations || []).some((o) => o.checkpointId === filters.checkpoint)) return false;
  if (filters.component && !String(finding.element?.selector || '').includes(filters.component)) return false;
  return true;
}

function filteredFindings(session, filters) {
  return (session.findings || []).filter((f) => matches(f, filters));
}

const sideLabel = (s) => (s === 'before' ? 'Before' : s === 'after' ? 'After' : s || 'not attributed');

// Pair the same checkpoint id at Before and After, and say whether the two states are equivalent before anything is
// compared. A comparison on non-equivalent states is refused, not published as a difference.
export function compareSides(records) {
  const byKey = new Map();
  for (const r of records) {
    if (!r.side) continue;
    const key = `${r.scenario?.id || ''}\t${r.id}`;
    const entry = byKey.get(key) || { scenarioId: r.scenario?.id || '', checkpointId: r.id, label: r.label, before: null, after: null };
    entry[r.side] = r;
    byKey.set(key, entry);
  }
  const pairs = [];
  for (const entry of byKey.values()) {
    if (!entry.before || !entry.after) {
      pairs.push({ ...entry, comparable: false, reason: entry.before ? 'no After checkpoint at this state' : 'no Before checkpoint at this state', equivalence: null, classifications: [] });
      continue;
    }
    const eitherOpen = entry.before.state?.application?.dialogs?.some((d) => d.open) || entry.after.state?.application?.dialogs?.some((d) => d.open);
    const eq = equivalence(entry.before, entry.after, { dialogOpen: eitherOpen });
    const beforeFindings = entry.before.findings || [];
    const afterFindings = entry.after.findings || [];
    const b = new Set(beforeFindings.map((f) => f.fingerprint));
    const a = new Set(afterFindings.map((f) => f.fingerprint));
    const classifications = [];
    for (const f of afterFindings) {
      const change = b.has(f.fingerprint) ? ((beforeFindings.find((x) => x.fingerprint === f.fingerprint)?.outcome !== f.outcome) ? 'changed-finding' : 'existing-failure') : 'new-regression';
      classifications.push({ change, finding: f });
    }
    for (const f of beforeFindings) if (!a.has(f.fingerprint)) classifications.push({ change: 'resolved-failure', finding: f });
    for (const e of entry.after.evidence?.engines || []) {
      if (e.status === 'failed') classifications.push({ change: 'tool-error', engine: e.engine, detail: e.error });
      else if (e.status === 'unsupported') classifications.push({ change: 'unsupported-capability', engine: e.engine, detail: e.error });
      else if (e.status === 'not-run') classifications.push({ change: 'tool-error', engine: e.engine, detail: e.error || 'not run' });
    }
    if (!entry.before.state?.readiness?.satisfied || !entry.after.state?.readiness?.satisfied) classifications.push({ change: 'state-not-reached', detail: 'a readiness condition was not met on one side' });
    if ((entry.after.manual || []).some((m) => m.requiresPerson && m.result !== 'person-observed')) classifications.push({ change: 'manual-review-required', detail: 'manual checks are recorded as not run' });
    pairs.push({ ...entry, comparable: eq.equivalent, reason: eq.equivalent ? null : 'the two sides did not reach equivalent states', equivalence: eq, classifications });
  }
  return pairs.sort((x, y) => (x.scenarioId + x.checkpointId).localeCompare(y.scenarioId + y.checkpointId));
}

// A tree difference between the two sides of one checkpoint, when both captured one. Uses the same `diff -u` the tree
// diff tool uses; absent trees are reported as absent.
function treeDiff(before, after) {
  const fileOf = (r, key) => r?.evidence?.tree?.files?.[key] || null;
  const out = {};
  for (const key of ['axtree', 'aria', 'speech']) {
    const b = fileOf(before, key), a = fileOf(after, key);
    if (!b || !a) { out[key] = { available: false, reason: !b && !a ? 'neither side captured the tree (use profile semantic or full)' : `${!b ? 'Before' : 'After'} did not capture the tree` }; continue; }
    const d = spawnSync('diff', ['-u', '--label', 'before', '--label', 'after', path.join(labRoot, b), path.join(labRoot, a)], { encoding: 'utf8' });
    const lines = String(d.stdout || '').split('\n').filter((l) => /^[+-]/.test(l) && !/^(---|\+\+\+) /.test(l));
    out[key] = { available: true, added: lines.filter((l) => l[0] === '+').length, removed: lines.filter((l) => l[0] === '-').length, sample: lines.slice(0, 20) };
  }
  return out;
}

export function renderSession(session, { filters = {}, generated = new Date().toISOString() } = {}) {
  const records = loadRecords(session);
  const findings = filteredFindings(session, filters);
  const totals = findingTotals(findings);
  const pairs = compareSides(records);
  const md = markdown(session, records, findings, totals, pairs, filters, generated);
  const html = htmlReport(session, records, findings, totals, pairs, filters, generated);
  return { markdown: md, html };
}

// ---------------------------------------------------------------- Markdown
function markdown(session, records, findings, totals, pairs, filters, generated) {
  const L = [];
  const sessionDir = records[0]?.evidence?.dir ? path.dirname(records[0].evidence.dir) : '.';
  const linkFromSession = (rel) => (rel ? path.relative(path.join(labRoot, sessionDir), path.join(labRoot, rel)).split(path.sep).join('/') : null);
  const title = session.issue ? `Accessibility checkpoints: issue #${session.issue}` : `Accessibility checkpoints: ${session.kinds.join(', ')}`;
  L.push(`# ${title}`, '');
  L.push(`Session \`${session.id}\`, generated ${generated}. **DRAFT: automated evidence, not a human accessibility review or a published finding.**`, '');
  L.push(`Source: ${session.tool?.name || 'playwright'}; ${session.mcp ? `Playwright MCP ${session.mcp.version || ''} (${session.mcp.integration || 'init-page'})` : 'scripted runner'}. Profile: ${session.configuredProfile || 'quick'}.`, '');
  if (filters && Object.keys(filters).length) L.push(`Filtered by: ${Object.entries(filters).map(([k, v]) => `${k}=${v}`).join(', ')}. The inventory below still lists every checkpoint.`, '');
  L.push(`**${records.length} checkpoint(s)**, **${totals.distinct} distinct finding(s)** (${totals.observations} observation(s) at checkpoints; a persistent finding is counted once).`, '');
  L.push('## Scenario summary', '');
  L.push('| | |', '|---|---|');
  L.push(`| Issue | ${session.issue ? `#${session.issue}` : 'none (local fixture or unregistered environment)'} |`);
  L.push(`| Variants | ${session.variants.length ? session.variants.map((v) => `\`${v}\``).join(', ') : 'none'} |`);
  L.push(`| Sides captured | ${[...new Set(records.map((r) => r.side).filter(Boolean))].map(sideLabel).join(', ') || 'not attributed'} |`);
  L.push(`| Pages | ${[...new Set(records.map((r) => `${r.page?.path}${r.environment?.theme ? ` (${r.environment.theme})` : ''}`))].map((p) => `\`${p}\``).join(', ') || 'none'} |`);
  L.push(`| Browser | ${[...new Set(records.map((r) => `${r.environment?.browser} ${r.environment?.browserVersion || ''}`))].join(', ')} |`);
  L.push(`| Viewports | ${[...new Set(records.map((r) => `${r.environment?.viewport?.width}x${r.environment?.viewport?.height}`))].join(', ')} |`);
  L.push(`| Colour modes | ${[...new Set(records.map((r) => `${r.environment?.colorScheme}${r.environment?.forcedColors === 'active' ? ' forced-colors' : ''}${r.environment?.reducedMotion === 'reduce' ? ' reduced-motion' : ''}`))].join(', ')} |`);
  L.push(`| Core commits | ${[...new Set(records.map((r) => r.provenance?.core?.commit).filter(Boolean))].map((c) => `\`${c}\``).join(', ') || 'unknown'} |`);
  L.push('');

  L.push('## Checkpoint inventory (in the order reached)', '');
  L.push('| # | Checkpoint | Side | Status | Page | State | Engines | Findings | Evidence |', '|---|---|---|---|---|---|---|---|---|');
  for (const r of records) {
    const stateBits = [
      r.state?.application?.dialogs?.some((d) => d.open) ? 'dialog open' : null,
      r.state?.application?.expanded?.length ? `${r.state.application.expanded.filter((e) => e.expanded === 'true').length} expanded` : null,
      r.focus?.active ? `focus ${r.focus.active.role || r.focus.active.tag}${r.focus.active.name ? ` "${cell(r.focus.active.name, 30)}"` : ''}` : null,
      r.state?.readiness?.satisfied === false ? 'READINESS NOT MET' : null,
    ].filter(Boolean);
    const engines = (r.evidence?.engines || []).map((e) => `${e.engine}:${e.status}`).join(' ');
    L.push(`| ${r.sequence} | \`${r.id}\` ${cell(r.label, 50)} | ${sideLabel(r.side)} | ${r.status} | \`${r.page?.path}\` | ${stateBits.join('; ') || '—'} | ${engines || '—'} | ${(r.findings || []).length} | ${r.evidence?.dir ? mdLink(linkFromSession(r.evidence.dir), 'evidence') : ''} |`);
  }
  L.push('');

  L.push('## Before / After at equivalent states', '');
  if (!pairs.length) L.push('No checkpoint was captured on both sides, so there is no Before/After comparison in this session.', '');
  else {
    L.push('| Checkpoint | Equivalent? | Checks | Classifications |', '|---|---|---|---|');
    for (const p of pairs) {
      const cls = p.classifications.length ? p.classifications.map((c) => `${c.change}${c.finding ? ` (${c.finding.engine.id}:${c.finding.ruleId})` : c.engine ? ` (${c.engine})` : ''}`).join('; ') : 'no findings either side';
      const checks = p.equivalence?.checks?.length ? `${p.equivalence.checks.filter((c) => c.pass).length}/${p.equivalence.checks.length} pass` : '—';
      L.push(`| \`${p.checkpointId}\` | ${p.comparable ? 'yes' : `**NO** (${p.reason})`} | ${checks} | ${cell(cls, 200)} |`);
    }
    L.push('');
    for (const p of pairs) {
      if (!p.equivalence) continue;
      L.push(`### \`${p.checkpointId}\`: state equivalence`, '');
      L.push('| Check | Pass | Detail |', '|---|---|---|');
      for (const c of p.equivalence.checks) L.push(`| ${cell(c.name)} | ${c.pass ? 'yes' : '**no**'} | ${cell(c.detail, 160)} |`);
      L.push('');
      if (p.comparable) {
        const td = treeDiff(p.before, p.after);
        const any = Object.values(td).filter((x) => x.available && (x.added || x.removed));
        if (any.length) {
          L.push(`Accessibility-tree differences for this checkpoint: ${Object.entries(td).map(([k, v]) => (v.available ? `${k} +${v.added} -${v.removed}` : `${k} not captured`)).join('; ')}. Full views: \`${p.before.evidence?.tree?.files?.axtree ? path.dirname(p.before.evidence.tree.files.axtree) : 'not captured'}\`.`, '');
        }
      }
    }
  }

  L.push('## Findings (one row per distinct finding)', '');
  if (!findings.length) L.push('No automated finding passed the filter. This is not an accessibility pass.', '');
  else {
    L.push('| ID | Engine | Rule | Impact | Outcome | WCAG | Target | Observed at | Review |', '|---|---|---|---|---|---|---|---|---|');
    for (const f of findings) {
      L.push(`| ${f.displayId} | ${f.engine.id} ${f.engine.version} | \`${cell(f.ruleId, 48)}\` | ${f.impact || '—'} | ${f.outcome} | ${(f.wcag || []).join(', ') || '—'} | \`${cell(f.element?.selector, 60)}\` | ${(f.observations || []).map((o) => `${o.side || '?'}#${o.checkpointId}`).join(', ')} | ${f.reviewStatus} |`);
    }
    L.push('');
    L.push('Engine agreement is not proof of correctness, and a single engine is not necessarily wrong. Each row keeps its engine and rule identifier; WCAG and ACT are mappings.', '');
  }

  const manual = (session.manual || []).filter((m) => m.requiresPerson);
  L.push('## Manual review required', '');
  L.push('Automated checks cannot decide these. They are stored separately and were **not performed by a person** in this session.', '');
  if (!manual.length) L.push('No manual checks were recorded (capture a checkpoint with state, or use profile full/semantic).', '');
  else {
    L.push('| Checkpoint | Check | Question | Result |', '|---|---|---|---|');
    for (const m of manual.slice(0, 80)) L.push(`| \`${m.checkpointId}\` | \`${m.id}\` | ${cell(m.question, 140)} | ${m.result} |`);
    if (manual.length > 80) L.push(`| … | | ${manual.length - 80} more | |`);
  }
  L.push('');

  const speech = records.flatMap((r) => (r.evidence?.speech?.recorder?.announce || []).map((a) => ({ ...a, checkpointId: r.id, side: r.side })));
  const live = records.flatMap((r) => (r.evidence?.speech?.recorder?.live || []).map((a) => ({ ...a, checkpointId: r.id, side: r.side })));
  L.push('## Announcement and interaction history', '');
  if (!speech.length && !live.length) L.push('Nothing recorded (use profile dynamic or full at a checkpoint that follows an interaction).', '');
  else {
    L.push('| Checkpoint | Side | Source | Politeness | Text |', '|---|---|---|---|---|');
    for (const a of speech.slice(0, 60)) L.push(`| \`${a.checkpointId}\` | ${sideLabel(a.side)} | Drupal.announce | ${a.priority} | ${cell(a.text, 120)} |`);
    for (const a of live.slice(0, 60)) L.push(`| \`${a.checkpointId}\` | ${sideLabel(a.side)} | live region ${a.role || a.ariaLive || ''} | ${a.ariaLive || '—'} | ${cell(a.text, 120)} |`);
  }
  L.push('');

  const focusRows = records.flatMap((r) => (r.interaction?.focusHistory || []).map((f) => ({ ...f, checkpointId: r.id, side: r.side, active: r.focus?.active })));
  L.push('## Focus transitions', '');
  if (!focusRows.length) L.push('No focus transition was recorded before these checkpoints.', '');
  else {
    L.push('| Checkpoint | Side | From | To |', '|---|---|---|---|');
    for (const f of focusRows.slice(0, 60)) L.push(`| \`${f.checkpointId}\` | ${sideLabel(f.side)} | ${f.from ? `${f.from.role || ''} ${cell(f.from.name || f.from.selector || '', 50)}` : '—'} | ${f.to ? `${f.to.role || ''} ${cell(f.to.name || f.to.selector || '', 50)}` : '—'} |`);
  }
  L.push('');

  const shots = records.flatMap((r) => (r.evidence?.screenshots || []).filter((s) => s.file).map((s) => ({ ...s, checkpointId: r.id, side: r.side })));
  L.push('## Screenshots', '');
  if (!shots.length) L.push('None captured (profile visual/full captures them).', '');
  else L.push(...shots.map((s) => `- ${sideLabel(s.side)} \`${s.checkpointId}\` (${s.kind}${s.selector ? `: \`${s.selector}\`` : ''}): ${mdLink(s.file)}`), '');

  const steps = records.filter((r) => (r.interaction?.history || []).length).map((r) => ({ r, steps: r.interaction.history }));
  L.push('## Reproduction steps (from the recorded trusted interactions)', '');
  if (!steps.length) L.push('No trusted interaction was recorded before these checkpoints. Repeating the session needs the same starting page and the same choices.', '');
  else {
    L.push('These are what the browser saw, not MCP element references (those are session-scoped and are never regression locators). Convert them to semantic locators in a scenario file before replaying.', '');
    for (const { r, steps: list } of steps) {
      L.push(`### \`${r.id}\` (${sideLabel(r.side)})`, '');
      for (const s of list.slice(-30)) L.push(`1. ${s.trusted ? 'trusted' : 'page-driven'} ${s.kind}${s.target ? ` on \`${s.target.selector || s.target.tag}\`${s.target.name ? ` ("${cell(s.target.name, 40)}")` : ''}` : ''}${s.key ? ` key ${s.key}` : ''}`);
      L.push('');
    }
  }

  L.push('## Resource consumption (measured, not estimated)', '');
  const res = session.resources || {};
  L.push('| Measure | Value |', '|---|---|');
  L.push(`| Checkpoints | ${res.checkpoints ?? records.length} |`);
  L.push(`| Engine runs | ${res.engineRuns ?? '—'} |`);
  L.push(`| Scan time | ${res.scanMs ?? '—'} ms |`);
  L.push(`| Evidence on disk | ${res.evidenceBytes != null ? `${(res.evidenceBytes / 1024).toFixed(1)} KiB` : '—'} |`);
  L.push(`| Screenshots | ${res.screenshots ?? 0} |`);
  L.push(`| Browser launches by this integration | ${res.browserLaunches ?? 0} (the MCP browser is reused) |`);
  L.push(`| Energy | ${res.energy == null ? 'not measured; no avoided-energy figure is invented' : res.energy} |`);
  L.push('');
  if (session.engineCapabilities?.length) {
    L.push('## Engine capability declarations', '');
    L.push('| Engine | Version | Live page | Injects JS | Navigates | Iframes | Shadow DOM | Computed styles | Preserves state | Scope | Licence |', '|---|---|---|---|---|---|---|---|---|---|---|');
    for (const e of session.engineCapabilities) L.push(`| ${e.label} | ${e.version} | ${e.livePage ? 'yes' : 'no'} | ${e.requiresInjectedJavaScript ? 'yes' : 'no'} | ${e.requiresNavigation ? 'yes' : 'no'} | ${e.iframes ? 'yes' : 'no'} | ${e.shadowDom ? 'yes' : 'no'} | ${e.computedStyles ? 'yes' : 'no'} | ${e.preservesState ? 'yes' : 'no'} | ${e.componentScope === true ? 'yes' : e.componentScope || 'no'} | ${e.license} |`);
    L.push('');
  }
  L.push('## Limits', '');
  for (const l of [...new Set([...(session.limits || []), ...records.flatMap((r) => r.limits || [])])]) L.push(`- ${l}`);
  L.push('');
  L.push('Generated with the help of an LLM (DeepSeek Harness) from the recorded evidence. AI-assisted development and evaluation disclosure; a person must review before anything is reported upstream.');
  return L.join('\n') + '\n';
}

// ---------------------------------------------------------------- HTML
const CSS = `
:root { color-scheme: light dark; --fg:#111; --bg:#fff; --muted:#555; --line:#bbb; --accent:#0645ad; --bad:#8a1f11; --warn:#6b4b00; --ok:#0b5a25; }
@media (prefers-color-scheme: dark) { :root { --fg:#e8e8e8; --bg:#111; --muted:#b8b8b8; --line:#555; --accent:#8ab4f8; --bad:#ff9a8a; --warn:#ffd27f; --ok:#8fdca8; } }
@media (forced-colors: active) { :root { --fg:CanvasText; --bg:Canvas; --muted:GrayText; --line:CanvasText; --accent:LinkText; } }
* { box-sizing: border-box; }
body { margin: 0 auto; max-width: 78rem; padding: 1rem; font: 1rem/1.5 system-ui, -apple-system, "Segoe UI", sans-serif; color: var(--fg); background: var(--bg); }
a { color: var(--accent); }
a:focus-visible, :focus-visible { outline: 3px solid var(--accent); outline-offset: 2px; }
h1 { font-size: 1.6rem; } h2 { font-size: 1.3rem; margin-top: 2rem; border-bottom: 1px solid var(--line); padding-bottom: .25rem; } h3 { font-size: 1.1rem; }
table { border-collapse: collapse; width: 100%; margin: .5rem 0 1rem; display: block; overflow-x: auto; }
caption { text-align: left; font-weight: 600; padding: .25rem 0; }
th, td { border: 1px solid var(--line); padding: .35rem .5rem; text-align: left; vertical-align: top; }
th { background: color-mix(in srgb, var(--fg) 8%, var(--bg)); }
code { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: .9em; }
.draft { border: 2px solid var(--bad); padding: .5rem .75rem; margin: 1rem 0; }
.muted { color: var(--muted); }
.pass { color: var(--ok); font-weight: 600; } .fail { color: var(--bad); font-weight: 600; } .warn { color: var(--warn); font-weight: 600; }
`;

function htmlReport(session, records, findings, totals, pairs, filters, generated) {
  const H = [];
  const title = session.issue ? `Accessibility checkpoints: issue #${session.issue}` : 'Accessibility checkpoints: local session';
  H.push('<!doctype html>', '<html lang="en">', '<head>', '<meta charset="utf-8">', '<meta name="viewport" content="width=device-width, initial-scale=1">', `<title>${esc(title)}</title>`, `<style>${CSS}</style>`, '</head>', '<body>');
  H.push(`<h1>${esc(title)}</h1>`);
  H.push(`<div class="draft" role="note"><strong>DRAFT.</strong> Automated evidence, generated ${esc(generated)}. This is not an independent human accessibility review and nothing here has been published upstream.</div>`);
  H.push(`<p>Session <code>${esc(session.id)}</code>. ${esc(session.tool?.name || 'playwright')}${session.mcp ? ` via Playwright MCP ${esc(session.mcp.version || '')} (${esc(session.mcp.integration || 'init-page')})` : ''}. Profile <code>${esc(session.configuredProfile || 'quick')}</code>.</p>`);
  if (filters && Object.keys(filters).length) H.push(`<p class="muted">Filtered by ${esc(Object.entries(filters).map(([k, v]) => `${k}=${v}`).join(', '))}. The inventory still lists every checkpoint.</p>`);
  H.push(`<p><strong>${records.length} checkpoint(s)</strong>, <strong>${totals.distinct} distinct finding(s)</strong> from ${totals.observations} observation(s). A persistent finding is counted once.</p>`);
  H.push('<nav aria-labelledby="contents"><h2 id="contents">Contents</h2><ul>',
    '<li><a href="#summary">Scenario summary</a></li><li><a href="#inventory">Checkpoint inventory</a></li>',
    '<li><a href="#compare">Before and After at equivalent states</a></li><li><a href="#findings">Findings</a></li>',
    '<li><a href="#manual">Manual review required</a></li><li><a href="#announcements">Announcement and interaction history</a></li>',
    '<li><a href="#focus">Focus transitions</a></li><li><a href="#screenshots">Screenshots</a></li><li><a href="#steps">Reproduction steps</a></li>',
    '<li><a href="#resources">Resource consumption</a></li><li><a href="#engines">Engine capability declarations</a></li><li><a href="#limits">Limits</a></li></ul></nav>');

  H.push('<h2 id="summary">Scenario summary</h2>');
  H.push('<table><caption>What this session measured</caption><tbody>');
  const row = (k, v) => H.push(`<tr><th scope="row">${esc(k)}</th><td>${v}</td></tr>`);
  row('Issue', session.issue ? `#${esc(session.issue)}` : 'none (local fixture or unregistered environment)');
  row('Variants', session.variants.length ? session.variants.map((v) => `<code>${esc(v)}</code>`).join(', ') : 'none');
  row('Sides captured', esc([...new Set(records.map((r) => r.side).filter(Boolean))].map(sideLabel).join(', ') || 'not attributed'));
  row('Pages', [...new Set(records.map((r) => `${r.page?.path}${r.environment?.theme ? ` (${r.environment.theme})` : ''}`))].map((p) => `<code>${esc(p)}</code>`).join(', ') || 'none');
  row('Browser', esc([...new Set(records.map((r) => `${r.environment?.browser} ${r.environment?.browserVersion || ''}`))].join(', ')));
  row('Viewports', esc([...new Set(records.map((r) => `${r.environment?.viewport?.width}x${r.environment?.viewport?.height}`))].join(', ')));
  row('Colour modes', esc([...new Set(records.map((r) => `${r.environment?.colorScheme}${r.environment?.forcedColors === 'active' ? ' forced-colors' : ''}`))].join(', ')));
  row('Core commits', [...new Set(records.map((r) => r.provenance?.core?.commit).filter(Boolean))].map((c) => `<code>${esc(c)}</code>`).join(', ') || 'unknown');
  H.push('</tbody></table>');

  H.push('<h2 id="inventory">Checkpoint inventory</h2>');
  H.push('<table><caption>Every named checkpoint, in the order it was reached, with the evidence beside it</caption><thead><tr><th scope="col">#</th><th scope="col">Checkpoint</th><th scope="col">Side</th><th scope="col">Status</th><th scope="col">Page</th><th scope="col">State</th><th scope="col">Engines</th><th scope="col">Findings</th></tr></thead><tbody>');
  for (const r of records) {
    const stateBits = [
      r.state?.application?.dialogs?.some((d) => d.open) ? 'dialog open' : null,
      r.state?.application?.expanded?.length ? `${r.state.application.expanded.filter((e) => e.expanded === 'true').length} expanded` : null,
      r.focus?.active ? `focus ${r.focus.active.role || r.focus.active.tag}${r.focus.active.name ? ` "${esc(String(r.focus.active.name).slice(0, 40))}"` : ''}` : null,
      r.state?.readiness?.satisfied === false ? '<span class="fail">readiness not met</span>' : null,
    ].filter(Boolean);
    const engines = (r.evidence?.engines || []).map((e) => `${esc(e.engine)}:${esc(e.status)}`).join(' ');
    H.push(`<tr><td>${r.sequence}</td><td><code>${esc(r.id)}</code> ${esc(r.label)}<br><span class="muted">${esc((r.evidence?.dir || ''))}</span></td><td>${esc(sideLabel(r.side))}</td><td>${esc(r.status)}</td><td><code>${esc(r.page?.path)}</code></td><td>${stateBits.join('; ') || '—'}</td><td>${engines || '—'}</td><td>${(r.findings || []).length}</td></tr>`);
  }
  H.push('</tbody></table>');

  H.push('<h2 id="compare">Before and After at equivalent states</h2>');
  if (!pairs.length) H.push('<p>No checkpoint was captured on both sides, so there is no comparison.</p>');
  else {
    H.push('<table><caption>Comparisons: equivalence is checked before any difference is described</caption><thead><tr><th scope="col">Checkpoint</th><th scope="col">Equivalent?</th><th scope="col">Classifications</th></tr></thead><tbody>');
    for (const p of pairs) {
      const cls = p.classifications.length ? p.classifications.map((c) => `${esc(c.change)}${c.finding ? ` (${esc(c.finding.engine.id)}:${esc(c.finding.ruleId)})` : c.engine ? ` (${esc(c.engine)})` : ''}`).join('; ') : 'no findings either side';
      H.push(`<tr><td><code>${esc(p.checkpointId)}</code></td><td>${p.comparable ? '<span class="pass">yes</span>' : `<span class="fail">no</span> ${esc(p.reason || '')}`}</td><td>${cls}</td></tr>`);
    }
    H.push('</tbody></table>');
    for (const p of pairs) {
      if (!p.equivalence) continue;
      H.push(`<h3><code>${esc(p.checkpointId)}</code>: state equivalence</h3><table><caption>Conditions used to decide that the two sides are the same state</caption><thead><tr><th scope="col">Check</th><th scope="col">Pass</th><th scope="col">Detail</th></tr></thead><tbody>`);
      for (const c of p.equivalence.checks) H.push(`<tr><td>${esc(c.name)}</td><td>${c.pass ? '<span class="pass">yes</span>' : '<span class="fail">no</span>'}</td><td>${esc(c.detail)}</td></tr>`);
      H.push('</tbody></table>');
    }
  }

  H.push('<h2 id="findings">Findings</h2>');
  if (!findings.length) H.push('<p>No automated finding passed the filter. This is not an accessibility pass.</p>');
  else {
    H.push(`<table><caption>${totals.distinct} distinct findings; totals by engine: ${esc(Object.entries(totals.byEngine).map(([k, v]) => `${k} ${v}`).join(', '))}. Impact: ${esc(Object.entries(totals.byImpact).map(([k, v]) => `${k} ${v}`).join(', '))}</caption><thead><tr><th scope="col">ID</th><th scope="col">Engine</th><th scope="col">Rule</th><th scope="col">Impact</th><th scope="col">Outcome</th><th scope="col">WCAG</th><th scope="col">Target</th><th scope="col">Observed at</th><th scope="col">Review</th></tr></thead><tbody>`);
    for (const f of findings) {
      H.push(`<tr><td>${esc(f.displayId)}</td><td>${esc(f.engine.id)} ${esc(f.engine.version)}</td><td><code>${esc(f.ruleId)}</code></td><td>${esc(f.impact || '—')}</td><td>${esc(f.outcome)}</td><td>${esc((f.wcag || []).join(', ') || '—')}</td><td><code>${esc(f.element?.selector || '')}</code></td><td>${(f.observations || []).map((o) => esc(`${o.side || '?'}#${o.checkpointId}`)).join(', ')}</td><td>${esc(f.reviewStatus)}</td></tr>`);
    }
    H.push('</tbody></table><p class="muted">Engine agreement is not proof of correctness. Each finding keeps its own engine and rule identifier; WCAG and ACT identifiers are mappings.</p>');
  }

  H.push('<h2 id="manual">Manual review required</h2>');
  H.push('<p>These were <strong>not performed by a person</strong> in this session. Stored separately from automated results.</p>');
  const manual = (session.manual || []).filter((m) => m.requiresPerson);
  if (!manual.length) H.push('<p>No manual checks were recorded.</p>');
  else {
    H.push('<table><caption>Manual checks raised by these checkpoints</caption><thead><tr><th scope="col">Checkpoint</th><th scope="col">Check</th><th scope="col">Question</th><th scope="col">Result</th></tr></thead><tbody>');
    for (const m of manual.slice(0, 200)) H.push(`<tr><td><code>${esc(m.checkpointId)}</code></td><td><code>${esc(m.id)}</code></td><td>${esc(m.question)}</td><td>${esc(m.result)}</td></tr>`);
    H.push('</tbody></table>');
  }

  H.push('<h2 id="announcements">Announcement and interaction history</h2>');
  const speech = records.flatMap((r) => (r.evidence?.speech?.recorder?.announce || []).map((a) => ({ ...a, checkpointId: r.id, side: r.side, src: 'Drupal.announce' })));
  const live = records.flatMap((r) => (r.evidence?.speech?.recorder?.live || []).map((a) => ({ ...a, checkpointId: r.id, side: r.side, src: `live region ${a.role || a.ariaLive || ''}` })));
  if (!speech.length && !live.length) H.push('<p>Nothing recorded (use profile dynamic or full at a checkpoint that follows an interaction). A final DOM snapshot cannot establish whether an announcement was missed, repeated or interrupted.</p>');
  else {
    H.push('<table><caption>What was announced, in order</caption><thead><tr><th scope="col">Checkpoint</th><th scope="col">Side</th><th scope="col">Source</th><th scope="col">Text</th></tr></thead><tbody>');
    for (const a of [...speech, ...live].slice(0, 100)) H.push(`<tr><td><code>${esc(a.checkpointId)}</code></td><td>${esc(sideLabel(a.side))}</td><td>${esc(a.src)}</td><td>${esc(a.text)}</td></tr>`);
    H.push('</tbody></table>');
  }

  H.push('<h2 id="focus">Focus transitions</h2>');
  const focusRows = records.flatMap((r) => (r.interaction?.focusHistory || []).map((f) => ({ ...f, checkpointId: r.id, side: r.side })));
  if (!focusRows.length) H.push('<p>No focus transition was recorded.</p>');
  else {
    H.push('<table><caption>Where focus moved before each checkpoint</caption><thead><tr><th scope="col">Checkpoint</th><th scope="col">Side</th><th scope="col">From</th><th scope="col">To</th></tr></thead><tbody>');
    for (const f of focusRows.slice(0, 100)) H.push(`<tr><td><code>${esc(f.checkpointId)}</code></td><td>${esc(sideLabel(f.side))}</td><td>${esc(f.from ? `${f.from.role || ''} ${f.from.name || f.from.selector || ''}` : '—')}</td><td>${esc(f.to ? `${f.to.role || ''} ${f.to.name || f.to.selector || ''}` : '—')}</td></tr>`);
    H.push('</tbody></table>');
  }

  H.push('<h2 id="screenshots">Screenshots</h2>');
  const shots = records.flatMap((r) => (r.evidence?.screenshots || []).filter((s) => s.file).map((s) => ({ ...s, checkpointId: r.id, side: r.side })));
  const reportDir = session.checkpoints?.[0]?.file ? path.dirname(path.dirname(session.checkpoints[0].file)) : '.';
  if (!shots.length) H.push('<p>None captured.</p>');
  else {
    H.push('<ul>');
    for (const s of shots) H.push(`<li><a href="${esc(path.relative(path.join(labRoot, reportDir), path.join(labRoot, s.file)).split(path.sep).join('/'))}">${esc(sideLabel(s.side))} <code>${esc(s.checkpointId)}</code> ${esc(s.kind)}${s.selector ? ` of ${esc(s.selector)}` : ''}</a></li>`);
    H.push('</ul>');
  }

  H.push('<h2 id="steps">Reproduction steps</h2>');
  const withSteps = records.filter((r) => (r.interaction?.history || []).length);
  if (!withSteps.length) H.push('<p>No trusted interaction was recorded before these checkpoints.</p>');
  else {
    H.push('<p>Recorded trusted interactions, in order. These are not MCP element references: convert them to semantic locators in a scenario file before replaying.</p>');
    for (const r of withSteps) {
      H.push(`<h3><code>${esc(r.id)}</code> (${esc(sideLabel(r.side))})</h3><ol>`);
      for (const s of r.interaction.history.slice(-30)) H.push(`<li>${s.trusted ? 'trusted' : 'page-driven'} ${esc(s.kind)}${s.target ? ` on <code>${esc(s.target.selector || s.target.tag)}</code>${s.target.name ? ` "${esc(s.target.name)}"` : ''}` : ''}${s.key ? ` key ${esc(s.key)}` : ''}</li>`);
      H.push('</ol>');
    }
  }

  H.push('<h2 id="resources">Resource consumption</h2>');
  const res = session.resources || {};
  H.push('<table><caption>Measured by this integration; no estimate is substituted</caption><tbody>');
  H.push(`<tr><th scope="row">Checkpoints</th><td>${esc(res.checkpoints ?? records.length)}</td></tr>`);
  H.push(`<tr><th scope="row">Engine runs</th><td>${esc(res.engineRuns ?? '—')}</td></tr>`);
  H.push(`<tr><th scope="row">Scan time</th><td>${esc(res.scanMs ?? '—')} ms</td></tr>`);
  H.push(`<tr><th scope="row">Evidence on disk</th><td>${res.evidenceBytes != null ? `${(res.evidenceBytes / 1024).toFixed(1)} KiB` : '—'}</td></tr>`);
  H.push(`<tr><th scope="row">Screenshots</th><td>${esc(res.screenshots ?? 0)}</td></tr>`);
  H.push(`<tr><th scope="row">Browser launches by this integration</th><td>0 (the MCP browser is reused)</td></tr>`);
  H.push(`<tr><th scope="row">Energy</th><td>not measured; no avoided-energy figure is invented</td></tr>`);
  H.push('</tbody></table>');

  if (session.engineCapabilities?.length) {
    H.push('<h2 id="engines">Engine capability declarations</h2><table><caption>What each engine declared before it was allowed to run</caption><thead><tr><th scope="col">Engine</th><th scope="col">Version</th><th scope="col">Live page</th><th scope="col">Injects JS</th><th scope="col">Navigates</th><th scope="col">Iframes</th><th scope="col">Shadow DOM</th><th scope="col">Computed styles</th><th scope="col">Preserves state</th><th scope="col">Scope</th><th scope="col">Licence</th></tr></thead><tbody>');
    for (const e of session.engineCapabilities) H.push(`<tr><td>${esc(e.label)}</td><td>${esc(e.version)}</td><td>${e.livePage ? 'yes' : 'no'}</td><td>${e.requiresInjectedJavaScript ? 'yes' : 'no'}</td><td>${e.requiresNavigation ? 'yes' : 'no'}</td><td>${e.iframes ? 'yes' : 'no'}</td><td>${e.shadowDom ? 'yes' : 'no'}</td><td>${e.computedStyles ? 'yes' : 'no'}</td><td>${e.preservesState ? 'yes' : 'no'}</td><td>${esc(e.componentScope === true ? 'yes' : e.componentScope || 'no')}</td><td>${esc(e.license)}</td></tr>`);
    H.push('</tbody></table>');
  }

  H.push('<h2 id="limits">Limits</h2><ul>');
  for (const l of [...new Set([...(session.limits || []), ...records.flatMap((r) => r.limits || [])])]) H.push(`<li>${esc(l)}</li>`);
  H.push('</ul>');
  H.push('<p class="muted">Generated with the help of an LLM (DeepSeek Harness) from the recorded evidence. AI-assisted development and evaluation disclosure. A person must review before anything is reported upstream.</p>');
  H.push('</body></html>');
  return H.join('\n') + '\n';
}
