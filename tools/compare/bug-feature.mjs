// A bug summary as a Gherkin feature (Given / When / Then): reports/issues/<nid>/BUG.feature. See docs/BUG-FEATURE.md.
// parseFeature()  the subset of Gherkin the lab writes (English keywords; Feature, Rule, Background, Scenario, Scenario Outline, Examples,
//                 steps with a data table or a doc string, tags, comments, descriptions). Not a Cucumber runner: nothing here executes a step.
// checkFeature()  that structure plus the lab's rules: one behaviour per scenario, Before and After results, sources that exist, a review
//                 state, site paths and no secrets. Form only: whether a step is true is for a person to check against EVIDENCE.md.
// draftFeature()  a mechanical first draft from what the lab already holds for an issue (a variant's steps, checks and observations, and the
//                 verdicts of its runs). It is meant to be rewritten, by a person or a model (scripts/bug-feature.mjs prompt).
import fs from 'node:fs';
import path from 'node:path';
import { runStaleness } from './run-record.mjs';

const STEP = /^(Given|When|Then|And|But|\*)\s+(.*)$/;
const HEADER = /^(Feature|Rule|Background|Scenario Outline|Scenario Template|Scenario|Example|Examples|Scenarios)\s*:\s*(.*)$/;
const PHASE = { Given: 0, When: 1, Then: 2 };
// Words a result line (# Before: / # After:) starts with.
export const RESULT_WORDS = ['fails', 'passes', 'mixed', 'not run', 'not judged'];
const HOSTS = new Set(['www.drupal.org', 'drupal.org', 'git.drupalcode.org', 'api.drupal.org', 'www.w3.org', 'w3.org']);

export function parseFeature(text) {
  const lines = text.replace(/\r\n?/g, '\n').split('\n');
  const errors = []; const comments = [];
  let feature = null, rule = null, block = null, step = null, examples = null, tags = [], doc = null, language = null;
  const err = (line, msg) => errors.push({ line, msg });
  const takeTags = () => { const t = tags; tags = []; return t; };
  lines.forEach((raw, i) => {
    const n = i + 1, line = raw.trim();
    if (doc) { if (line === doc.fence) { doc = null; } else doc.target.docString.push(raw); return; }
    if (!line) return;
    if (line.startsWith('#')) {
      const lang = line.match(/^#\s*language\s*:\s*(\S+)/); if (lang && !feature) language = lang[1];
      const c = { line: n, text: line.replace(/^#\s?/, '') }; comments.push(c); if (block) block.comments.push(c); else if (feature) feature.comments.push(c); return;
    }
    if (line.startsWith('@')) {
      const part = line.replace(/\s+#.*$/, '');
      for (const t of part.split(/\s+/)) { if (/^@[^@\s]+$/.test(t)) tags.push({ name: t, line: n }); else err(n, `"${t}" is not a tag (a tag is @ followed by a word, no spaces)`); }
      return;
    }
    if (line.startsWith('|')) {
      if (!line.endsWith('|') || line.endsWith('\\|')) { err(n, 'a table row must end with |'); return; }
      const cells = line.slice(1, -1).split(/(?<!\\)\|/).map((c) => c.trim().replace(/\\\|/g, '|').replace(/\\\\/g, '\\'));
      const target = examples || (step && !step.docString ? step : null);
      if (!target) { err(n, 'a table row must follow a step or Examples:'); return; }
      if (examples) { if (!examples.header) examples.header = { cells, line: n }; else examples.rows.push({ cells, line: n }); }
      else (step.table ||= []).push({ cells, line: n });
      return;
    }
    if (line.startsWith('"""') || line.startsWith('```')) {
      if (!step || step.table || step.docString) { err(n, 'a doc string must follow a step directly'); return; }
      step.docString = []; doc = { fence: line.slice(0, 3), target: step, line: n }; return;
    }
    const h = line.match(HEADER);
    if (h) {
      const kw = h[1], name = h[2].trim(), t = takeTags();
      if (kw === 'Feature') {
        if (feature) { err(n, 'only one Feature: per file'); return; }
        feature = { name, line: n, tags: t, description: [], comments: [], background: null, rules: [], scenarios: [] }; block = null; step = null; examples = null; return;
      }
      if (!feature) { err(n, `${kw}: before Feature:`); return; }
      if (kw === 'Rule') { rule = { name, line: n, tags: t, description: [] }; feature.rules.push(rule); block = null; step = null; examples = null; return; }
      if (kw === 'Background') {
        if (t.length) err(n, 'a Background cannot have tags');
        if (feature.background) err(n, 'only one Background per feature');
        if (feature.scenarios.length) err(n, 'Background must come before the first Scenario');
        block = { kind: 'background', name, line: n, tags: [], description: [], steps: [], comments: [], examples: [] }; feature.background = block; step = null; examples = null; return;
      }
      if (/^(Examples|Scenarios)$/.test(kw)) {
        if (!block || block.kind === 'background') { err(n, 'Examples: must belong to a Scenario Outline'); return; }
        examples = { name, line: n, tags: t, header: null, rows: [] }; block.examples.push(examples); step = null; return;
      }
      block = { kind: /Outline|Template/.test(kw) ? 'outline' : 'scenario', keyword: kw, name, line: n, tags: t, rule: rule && rule.name, description: [], steps: [], comments: [], examples: [] };
      feature.scenarios.push(block); step = null; examples = null; return;
    }
    if (tags.length) { err(n, 'tags must be followed by Feature:, Rule:, Scenario:, Scenario Outline: or Examples:'); tags = []; }
    const s = line.match(STEP);
    if (s) {
      if (!block) { err(n, 'a step must be inside a Background or a Scenario'); return; }
      if (examples) { err(n, 'a step after Examples:; put steps above the Examples table'); return; }
      step = { keyword: s[1], text: s[2].trim(), line: n, table: null, docString: null }; block.steps.push(step); return;
    }
    // free text: a description, allowed straight after a header and before its first step or table
    const owner = examples ? (examples.header ? null : examples) : block ? (block.steps.length ? null : block) : rule && !block ? rule : feature && !block ? feature : null;
    if (!owner) { err(n, feature ? `"${line.slice(0, 60)}" is not a step (Given, When, Then, And, But), a table row, a tag, a comment or a header` : 'text before Feature:'); return; }
    (owner.description ||= []).push(line);
  });
  if (doc) err(doc.line, `doc string opened with ${doc.fence} is never closed`);
  if (tags.length) err(tags[0].line, 'tags at the end of the file belong to nothing');
  if (!feature) err(1, 'no Feature: line');
  return { feature, comments, errors, language };
}

const cited = (comments) => comments.flatMap((c) => [...c.text.matchAll(/\bfile:([^\s,;)]+)/g)].map((m) => ({ line: c.line, path: m[1].replace(/[.:]+$/, '').replace(/#.*$/, '') })));
const resultLine = (comments, side) => comments.find((c) => new RegExp(`^${side}\\b[^:]*:`, 'i').test(c.text));
const textOf = (s) => [s.text, ...(s.table || []).flatMap((r) => r.cells), ...(s.docString || [])].join(' ');

// Returns { errors, warnings, stats }, each problem { line, msg }. opts: { nid, labRoot } (labRoot to check file: citations).
export function checkFeature(text, { nid = null, labRoot = null } = {}) {
  const { feature, comments, errors: parseErrors, language } = parseFeature(text);
  const errors = [...parseErrors], warnings = [];
  const E = (line, msg) => errors.push({ line, msg }), W = (line, msg) => warnings.push({ line, msg });
  if (language && language !== 'en') E(1, `# language: ${language}: only English keywords are checked here`);
  const stats = { scenarios: 0, steps: 0 };
  if (!feature) return { errors, warnings, stats };

  // review state and identity
  const ft = feature.tags.map((t) => t.name);
  if (!feature.name) E(feature.line, 'the Feature has no name: use the issue title, or what the behaviour is');
  const issueTags = ft.filter((t) => /^@issue-/.test(t));
  if (!issueTags.length) E(feature.line, `the Feature needs an @issue-${nid || '<nid>'} tag`);
  else if (nid && !issueTags.includes(`@issue-${nid}`)) E(feature.line, `the Feature is tagged ${issueTags.join(' ')} but this is issue ${nid}`);
  const draft = ft.includes('@draft'), reviewed = ft.includes('@reviewed');
  if (draft === reviewed) E(feature.line, 'the Feature needs exactly one of @draft (not yet reviewed by a person) or @reviewed');
  if (reviewed && !comments.some((c) => /^Reviewed by \S.* on \d{4}-\d{2}-\d{2}\b/.test(c.text))) E(feature.line, '@reviewed needs a "# Reviewed by <who> on <YYYY-MM-DD>" line; only a person can review');
  const url = nid ? `drupal.org/project/drupal/issues/${nid}` : 'drupal.org/project/drupal/issues/';
  if (![...feature.description, ...feature.comments.map((c) => c.text)].some((l) => l.includes(url))) W(feature.line, `the Feature description does not link the issue (https://www.${url})`);
  for (const t of [...feature.tags, ...feature.scenarios.flatMap((s) => s.tags)]) if (/^@wcag/i.test(t.name) && !/^@wcag-[1-4]\.\d{1,2}\.\d{1,2}$/.test(t.name)) E(t.line, `${t.name}: a WCAG tag is @wcag-<principle>.<guideline>.<criterion>, for example @wcag-2.4.4`);

  // the whole file: links, secrets, citations, leftovers
  text.split('\n').forEach((l, i) => {
    for (const m of l.matchAll(/\bhttps?:\/\/([^/\s:"')|]+)/g)) if (!HOSTS.has(m[1].toLowerCase())) E(i + 1, `link to ${m[1]}: use site paths (/node/add/article), and link only drupal.org, git.drupalcode.org, api.drupal.org or w3.org`);
    if (/\b(glpat-[\w-]{10,}|ghp_\w{20,}|github_pat_\w{20,}|sk-[A-Za-z0-9_-]{20,}|xox[bpa]-[\w-]{10,})/.test(l)) E(i + 1, 'looks like a token or key: remove it, and revoke it if it was real');
    if (/\bTODO\b/.test(l)) W(i + 1, 'still says TODO');
  });
  if (labRoot) for (const c of cited(comments)) if (!fs.existsSync(path.join(labRoot, c.path))) E(c.line, `cites file:${c.path}, which does not exist`);

  const blocks = [...(feature.background ? [feature.background] : []), ...feature.scenarios];
  if (!feature.scenarios.length) E(feature.line, 'no Scenario: a bug summary needs at least one');
  const names = new Map();
  for (const b of blocks) {
    const isBg = b.kind === 'background', what = isBg ? 'Background' : `Scenario "${b.name}"`;
    if (!isBg) {
      stats.scenarios++;
      if (!b.name) E(b.line, 'a Scenario needs a name: the behaviour it describes');
      else if (names.has(b.name)) E(b.line, `two scenarios are called "${b.name}" (also line ${names.get(b.name)})`); else names.set(b.name, b.line);
    }
    if (!b.steps.length) { E(b.line, `${what} has no steps`); continue; }
    let phase = -1, kind = null; const seen = new Set();
    for (const s of b.steps) {
      stats.steps++;
      if (/^(And|But|\*)$/.test(s.keyword)) { if (!kind) { E(s.line, `${what} starts with "${s.keyword}": start with Given, When or Then`); kind = 'Given'; } }
      else kind = s.keyword;
      const p = PHASE[kind];
      if (isBg && kind !== 'Given') E(s.line, `a Background holds only Given steps (the state every scenario starts from); "${s.keyword} ${s.text.slice(0, 40)}" belongs in a scenario`);
      if (p < phase) E(s.line, `"${s.keyword} ${s.text.slice(0, 50)}" comes after a ${Object.keys(PHASE)[phase]} step: one behaviour per scenario (Given, then When, then Then); split it into two scenarios`);
      phase = Math.max(phase, p); seen.add(kind);
      if (s.table) { const w = s.table[0].cells.length; for (const r of s.table) if (r.cells.length !== w) E(r.line, `table row has ${r.cells.length} cells, the first row has ${w}`); }
      const t = s.text;
      if (t.length > 220) W(s.line, `step of ${t.length} characters: split it or say less`);
      if (/\bpassword\b/i.test(t) && /"[^"]+"/.test(t.replace(/"password"/i, ''))) E(s.line, 'a step types a password: write "Given I am logged in as an administrator" (the lab logs in with a one-time link)');
      if (kind === 'Then' && /\b(works?|working|correctly|properly|as expected|is fixed|fine)\b/i.test(t)) W(s.line, `"${t.slice(0, 60)}": say what a person observes (the text, where focus is, what is announced), not that it works`);
      if (/\b(frames?|press Go|Run checks|Mirror|the viewer)\b/.test(t)) W(s.line, `"${t.slice(0, 60)}" describes the lab's viewer: say what the user does on the site`);
      if (/(^|[\s("'])[.#][a-z][\w-]{2,}\b/i.test(t.replace(/\.(txt|png|jpe?g|gif|svg|csv|pdf|webp|html?)\b/gi, ''))) W(s.line, `"${t.slice(0, 60)}" names a CSS selector: describe what the user perceives; keep selectors in the lab's checks`);
      if (s.table && s.table[0] && /before/i.test(s.table[0].cells.join(' ')) && s.table.slice(1).some((r) => r.cells.some((c) => c === '?'))) W(s.line, 'an expected Before or After value is "?": fill it in from the issue or the evidence');
    }
    if (isBg) continue;
    if (b.steps.length > 12) W(b.line, `${what} has ${b.steps.length} steps: a reviewer follows one under 10 more easily`);
    if (!seen.has('When')) E(b.line, `${what} has no When step: say what the user does`);
    if (!seen.has('Then')) E(b.line, `${what} has no Then step: say what the user should observe`);
    for (const side of ['Before', 'After']) {
      const r = resultLine(b.comments, side);
      if (!r) E(b.line, `${what} needs a "# ${side}: <result>" comment under its Scenario line (${RESULT_WORDS.join(', ')}), with the run or the person that showed it`);
      else { const v = r.text.replace(/^[^:]*:\s*/, '').toLowerCase(); if (!RESULT_WORDS.some((w) => v.startsWith(w))) W(r.line, `"# ${r.text.slice(0, 50)}": start the result with ${RESULT_WORDS.join(', ')}`); }
    }
    if (!b.comments.some((c) => /^source\s*:/i.test(c.text))) W(b.line, `${what} cites no source: add "# source: file:<path>", "# source: comment:<n>" or a drupal.org link`);
    if (b.kind === 'outline') {
      if (!b.examples.length) E(b.line, `${what} is an Outline with no Examples:`);
      const cols = new Set(b.examples.flatMap((x) => (x.header ? x.header.cells : [])));
      for (const x of b.examples) {
        if (!x.header || !x.rows.length) E(x.line, 'Examples: needs a header row and at least one row');
        else for (const r of x.rows) if (r.cells.length !== x.header.cells.length) E(r.line, `Examples row has ${r.cells.length} cells, the header has ${x.header.cells.length}`);
      }
      for (const s of b.steps) for (const m of textOf(s).matchAll(/<([^<>\s][^<>]*)>/g)) if (!cols.has(m[1])) W(s.line, `<${m[1]}> is not a column of the Examples table, so it stays as written`);
    } else if (b.examples.length) E(b.examples[0].line, `Examples: belong to a Scenario Outline; ${what} is a plain Scenario`);
  }
  return { errors, warnings, stats, draft };
}

// ---- the draft

const one = (s) => String(s ?? '').replace(/\s+/g, ' ').trim();
const noDot = (s) => one(s).replace(/\.$/, '');
const cell = (s) => one(s).replace(/\\/g, '\\\\').replace(/\|/g, '\\|');
const yesNo = (v) => (v === true ? 'yes' : v === false ? 'no' : v === undefined || v === null || v === '' ? '?' : one(v));
const lower = (s) => s.replace(/^(The|A|An|No|Every|Its|That|This|Each|Number|Focus)\b/, (w) => w.toLowerCase());
// A viewer instruction ("Open /node/add/article") as the user's own action ("I open /node/add/article").
const VERBS = 'Open|Click|Type|Press|Paste|Choose|Switch|Use|Close|Expand|Focus|Turn|Repeat|Have|Look|Narrow|Toggle|Hover|Upload|Select|Prepare|Scroll|Enter|Fill|Tab|Visit|Save|Submit|Add|Remove|Drag|Set|Pick|Activate|Inspect|Check|Navigate|Reload|Resize|Zoom|Wait|Tick|Untick|Edit|Create|Delete|Log|Go|Find|Read|Listen|Move|Start|Leave|Make|Put|Write|Change';
const asAction = (s) => s.replace(new RegExp(`^(${VERBS})\\b`), (w) => `I ${w.toLowerCase()}`);
const cut = (s, n) => (s.length <= n ? s : s.slice(0, n).replace(/\s+\S*$/, '').replace(/[,;:]$/, ''));
function checkStep(c) {
  const label = noDot(c.label || '(a check with no label)'), e = c.expect;
  if (e === true || e === undefined) return lower(label);
  if (e === false) return `not: ${lower(label)}`;
  if (e === 'same') return /\b(same|matches)\b/i.test(label) ? lower(label) : `${lower(label)}, the same on Before and After`;
  return `${lower(label)}: ${typeof e === 'string' ? `"${e}"` : JSON.stringify(e)}`;
}
const VERDICT = { 'reproduced-and-fixed': ['fails', 'passes'], 'reproduced-not-fixed': ['fails', 'fails'], 'not-reproduced': ['passes (not reproduced)', 'passes'], mixed: ['mixed', 'mixed'] };
const envLabel = (r) => [r.env.browser, r.env.colorScheme, r.env.forcedColors ? 'forced colours' : '', r.env.viewport && r.env.viewport.width ? `${r.env.viewport.width}px` : ''].filter(Boolean).join(' ');
function sideResult(runs, i, left = {}) {
  if (!runs.length) return left.unstructured ? 'not judged (the run folders have no results.json: read them and write the result)' : 'not run (no lab run yet)';
  const by = new Map();
  for (const r of runs) {
    let w = (VERDICT[r.verdict] || ['not judged (the run has no verdict)', 'not judged (the run has no verdict)'])[i];
    if (i === 1 && r.unexpected && w === 'passes') w = 'mixed (fixed, but regression checks differ)';
    if (!by.has(w)) by.set(w, []); by.get(w).push(envLabel(r) || r.dir);
  }
  if (by.size === 1) { const [[w, envs]] = [...by]; return `${w} (${runs.length} run${runs.length > 1 ? 's' : ''}: ${[...new Set(envs)].join('; ')})`; }
  return `mixed across runs: ${[...by].map(([w, envs]) => `${w} in ${[...new Set(envs)].join(', ')}`).join('; ')}`;
}

// Runs of an issue that still describe its patches and recipe (stale and superseded runs are left out, and counted), newest first.
export function issueRuns(issueDir, allVariants, labRoot) {
  const out = [], left = { stale: 0, superseded: 0, unstructured: 0 }, pw = path.join(issueDir, 'playwright');
  if (!fs.existsSync(pw)) return { runs: out, left };
  for (const d of fs.readdirSync(pw).sort().reverse()) {
    if (!fs.statSync(path.join(pw, d)).isDirectory()) continue;
    const f = path.join(pw, d, 'results.json'); if (!fs.existsSync(f)) { left.unstructured++; continue; }
    let r; try { r = JSON.parse(fs.readFileSync(f, 'utf8')); } catch { continue; }
    if (r.superseded) { left.superseded++; continue; }
    const st = runStaleness(r, allVariants.find((x) => x.slug === r.variant), { labRoot });
    if (st.status === 'stale') { left.stale++; continue; }
    out.push({ dir: path.relative(labRoot, path.join(pw, d)), variant: r.variant || '', verdict: r.verdict || null, unexpected: r.unexpected || 0, env: r.environment || {}, before: (r.commits && r.commits.before) || '', record: st.status });
  }
  return { runs: out, left };
}

// variant: a resolved variant; runs: from issueRuns(); sourceFile: where the variant lives (relative); today: YYYY-MM-DD.
export function draftFeature({ nid, variant: v, runs = [], left = { stale: 0, superseded: 0, unstructured: 0 }, sourceFile, today, title }) {
  const name = one(title || (v.label || '').replace(/^#\d+:\s*/, '').replace(/,\s*(pinned|latest) core( main)?$/i, '') || `Issue ${nid}`);
  const steps = (v.steps || []).map((s) => (typeof s === 'string' ? { text: s } : s)).filter((s) => one(s.text));
  const given = steps.filter((s) => s.how === 'recipe'), actions = steps.filter((s) => s.how !== 'recipe');
  const checks = v.checks || [], by = (k) => checks.filter((c) => (c.kind || 'fix') === k);
  const observe = (v.observe || []).map((o) => (typeof o === 'string' ? { label: o } : o)).filter((o) => one(o.label));
  const after = (v.after && v.after.patches || []).filter((p) => !(v.before && v.before.patches || []).includes(p)).map((p) => path.basename(p));
  const core = v.core && v.core.commit ? `core ${v.core.commit.slice(0, 10)} (${v.slug})` : `core ${(v.core && v.core.ref) || 'main'} at the time of each run (${v.slug})`;
  const L = [];
  L.push(`# Bug summary for #${nid} in Gherkin. DRAFT written by \`node scripts/bug-feature.mjs draft ${nid}\` on ${today}, mechanically, from`);
  L.push(`# the lab's variant ${v.slug} (file:${sourceFile}) and the verdicts of its runs. Not reviewed by a person, and not yet`);
  L.push('# rewritten: the steps are the viewer\'s instructions as written. Rewrite it per behaviour (docs/BUG-FEATURE.md), then:');
  L.push(`#   node scripts/bug-feature.mjs check ${nid}`);
  L.push(`# Variant ${v.slug}: Before is ${core.replace(/ \([^)]*\)$/, '')}, After the same${after.length ? ` plus ${after.join(', ')}` : ' plus the change under test'}. Each run below names its own core.`);
  if (runs.length) {
    L.push('# Lab runs (scripted, real input), newest first:');
    for (const r of runs) L.push(`#   file:${r.dir}/ ${r.variant}, ${envLabel(r) || 'environment not recorded'}${r.before ? `, core ${r.before.split(' ')[0].slice(0, 10)}` : ''}: ${r.verdict ? r.verdict.replace(/-/g, ' ') : 'no verdict (older run format)'}${r.unexpected ? `, ${r.unexpected} regression check(s) differ` : ''}${r.record === 'unrecorded' ? ' (run predates patch records)' : ''}`);
  } else L.push(`# Lab runs with a results.json: none${left.unstructured ? '' : ' yet'}.`);
  if (left.stale || left.superseded) L.push(`# Left out: ${left.stale} stale and ${left.superseded} superseded run(s) (node scripts/coverage.mjs ${nid} lists them).`);
  if (left.unstructured) L.push(`# ${left.unstructured} run folder(s) under file:reports/issues/${nid}/playwright/ have no results.json, so no verdict is read from them: read them by hand.`);
  L.push(`@issue-${nid} @draft`);
  L.push(`Feature: ${name}`);
  L.push(`  https://www.drupal.org/project/drupal/issues/${nid}`);
  if (one(v.expected)) L.push('', `  Expected: ${one(v.expected)}`);
  if (one(v.actual)) L.push(`  Actual: ${one(v.actual)}`);
  const bg = [...given.map((s) => lower(noDot(s.text))), ...(v.recipe && !given.length ? [`the site is set up as the lab recipe "${v.recipe}" sets it up`] : []), ...(v.login ? ['I am logged in as an administrator'] : [])];
  if (bg.length) {
    L.push('', '  Background:');
    if (v.recipe) L.push(`    # The starting state is the lab recipe file:recipes/${v.recipe}/recipe.yml`);
    bg.forEach((t, i) => L.push(`    ${i ? 'And' : 'Given'} ${t}`));
  }
  const scenarioName = cut(noDot(one(v.expected).replace(/^After\s*(\([^)]*\))?\s*:\s*/i, '').split(/(?<=[.;])\s/)[0]), 100) || 'The behaviour the issue asks for';
  L.push('', '  Scenario: ' + scenarioName);
  L.push(`    # source: file:${sourceFile} (${v.slug}: steps, checks, observations)`);
  L.push(`    # Before: ${sideResult(runs, 0, left)}`);
  L.push(`    # After: ${sideResult(runs, 1, left)}`);
  if (!actions.length) L.push(`    When I open "${(v.pages && v.pages[0]) || '/'}"`);
  actions.forEach((s, i) => { L.push(`    ${i ? 'And' : 'When'} ${asAction(lower(noDot(s.text)))}`); if (one(s.lookFor)) L.push(`    # Look for: ${one(s.lookFor)}`); });
  let first = true; const then = (t) => { L.push(`    ${first ? 'Then' : 'And'} ${t}`); first = false; };
  for (const [k, head] of [['precondition', 'Lab checks that the steps reached the bug'], ['fix', 'Lab checks of the fix'], ['regression', 'Lab checks of what must not change']]) {
    const list = by(k); if (!list.length) continue;
    L.push(`    # ${head}:`); for (const c of list) then(checkStep(c));
  }
  if (observe.length) {
    L.push('    # What a person checks, with the result the variant expects on each side:');
    then('a person comparing Before and After sees:');
    L.push('      | A person checks | Before | After |');
    for (const o of observe) L.push(`      | ${cell(o.label)} | ${cell(yesNo(o.expectBefore))} | ${cell(yesNo(o.expectAfter))} |`);
  }
  if (first) then('the problem described in "Actual" is gone');
  return L.join('\n') + '\n';
}

// The feature without what only makes sense in the lab: comments and the lab's own tags. A file to attach to a comment a person wrote,
// once reviewed, never pasted as it stands (Drupal's AI contribution policy, core/AGENTS.md: docs/BUG-FEATURE.md, "Using it on drupal.org").
export function exportFeature(text) {
  return text.replace(/\r\n?/g, '\n').split('\n').filter((l) => !/^\s*#/.test(l))
    .map((l) => (/^\s*@/.test(l) ? l.replace(/@(draft|reviewed|issue-\d+)\b\s*/g, '').replace(/\s+$/, '') : l))
    .filter((l, i, a) => !(/^\s*$/.test(l) && (i === 0 || /^\s*$/.test(a[i - 1])))).join('\n').replace(/^\n+/, '').replace(/\n*$/, '\n');
}
