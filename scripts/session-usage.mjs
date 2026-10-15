// Where did a Claude Code session's tokens go? Reads the client's own transcript files (JSONL under ~/.claude/projects/) and prints
// numbers only: provider-reported usage, tool calls and the size of what tools sent back into the conversation. No message text is
// printed or copied. Read-only; nothing is written unless --json is given.
//   node scripts/session-usage.mjs                      every transcript of this checkout (and its worktrees), one row each
//   node scripts/session-usage.mjs <file.jsonl|dir>...  those transcripts
//   node scripts/session-usage.mjs --tools              also the tool breakdown per session (calls, result bytes, errors)
//   node scripts/session-usage.mjs --sequences          also the call sequences that repeat across the sessions, ranked by the context their later calls
//                                                       read (what a one-call command would avoid), and runs of the same call repeated
//   node scripts/session-usage.mjs --json <file>        also write the numbers as JSON
// Field meaning (Claude Code 2.1.x transcripts, checked 2026-10-15; confirm again after a client upgrade):
//   one API call = one distinct message.id (the same usage is repeated on each content block of it, so it is counted once);
//   input = uncached input; cache_write = input written to the prompt cache; cache_read = cached input re-read (the conversation
//   history and instructions sent again on every call); output includes thinking tokens, shown separately as "thinking".
//   "first call context" = input + cache_write + cache_read of the first call: instructions, tool definitions, memory and the first message.
//   avgCtx = (input + cache_write + cache_read) / calls: the context the model reads on an average call. fixed% = first call context x calls
//   as a share of all input-side tokens: how much of the reading is the same instructions and tool definitions sent again each call
//   (an upper bound: the first call also holds the first message).
//   cost USD, apiMin (time in model calls) and toolMin (time in tools) come from the client's cost-state record, which some sessions lack (n/a).
//   The USD figure is the client's own estimate, not an invoice; it says nothing about subscription allowances or the billing mode.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { labRoot } from '../tools/compare/lib.mjs';

const args = process.argv.slice(2);
const flagVal = (f) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : undefined; };
const jsonOut = flagVal('--json'), showTools = args.includes('--tools');
const given = args.filter((a, i) => !a.startsWith('--') && args[i - 1] !== '--json');

// ~/.claude/projects/<path with / and . replaced by ->; the checkout and its worktrees share the prefix
const projects = path.join(os.homedir(), '.claude/projects');
const encoded = labRoot.replace(/\.claude\/worktrees\/.*$/, '').replace(/\/$/, '').replace(/[/.]/g, '-');
const dirs = given.length ? given : (fs.existsSync(projects) ? fs.readdirSync(projects).filter((d) => d.startsWith(encoded)).map((d) => path.join(projects, d)) : []);
const files = dirs.flatMap((d) => (fs.existsSync(d) && fs.statSync(d).isDirectory() ? fs.readdirSync(d).filter((f) => f.endsWith('.jsonl')).map((f) => path.join(d, f)) : [d]));
if (!files.length) { console.error(`No transcripts found (looked for ${encoded}* in ${projects}). Pass a .jsonl file or a folder.`); process.exit(1); }

const bytes = (c) => Buffer.byteLength(typeof c === 'string' ? c : JSON.stringify(c ?? ''));
const category = (cmd) => {   // what a Bash call was, without keeping the command
  const c = String(cmd || '');
  const scripts = [...new Set([...c.matchAll(/scripts\/([\w-]+)\.mjs|tools\/(?:compare|playwright)\/([\w-]+)\.mjs/g)].map((m) => `lab:${m[1] || m[2]}`))];
  if (scripts.length) return scripts.join('+');   // several: the person or assistant chained them by hand in one command
  const first = c.trim().match(/^(?:cd [^;&|]+(?:&&|;)\s*)?(?:\w+=\S+\s+)*([\w./-]+)(?:\s+(\w[\w-]*))?/);
  return first ? (['git', 'ddev', 'npm', 'node', 'docker', 'gh'].includes(first[1]) ? `${first[1]} ${first[2] || ''}`.trim() : first[1].replace(/^.*\//, '')) : 'other';
};

function analyse(file) {
  const rows = fs.readFileSync(file, 'utf8').split('\n').filter(Boolean).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
  const calls = new Map(), toolName = new Map(), tools = {}, reads = new Map(), steps = new Map();
  const s = { file: path.basename(file), title: '', client: new Set(), models: new Set(), from: '', to: '', userTurns: 0, calls: 0, usd: null, firstCallContext: null };
  const bump = (name, k, n = 1) => { (tools[name] ||= { calls: 0, resultBytes: 0, errors: 0 })[k] += n; };
  for (const o of rows) {
    if (o.timestamp) { if (!s.from || o.timestamp < s.from) s.from = o.timestamp; if (o.timestamp > s.to) s.to = o.timestamp; }
    if (o.version) s.client.add(o.version);
    if (o.type === 'custom-title' && o.customTitle) s.title = o.customTitle;
    if (o.type === 'cost-state') { s.usd = o.totalCostUSD ?? s.usd; s.apiMs = o.totalAPIDuration ?? s.apiMs; s.toolMs = o.totalToolDuration ?? s.toolMs; }
    if (o.type === 'assistant' && o.message) {
      const m = o.message; if (m.model && m.model !== '<synthetic>') s.models.add(m.model);
      if (m.usage && m.id) { const prev = calls.get(m.id); if (!prev || (m.usage.output_tokens || 0) >= (prev.output_tokens || 0)) calls.set(m.id, m.usage); }
      for (const b of Array.isArray(m.content) ? m.content : []) if (b.type === 'tool_use') {
        const name = b.name || 'unknown', label = name === 'Bash' ? `Bash/${category(b.input && b.input.command)}` : name;
        toolName.set(b.id, label); bump(label, 'calls');
        if (m.id) { if (!steps.has(m.id)) steps.set(m.id, []); steps.get(m.id).push(label); }
        if (name === 'Read' && b.input) { const k = `${b.input.file_path}|${b.input.offset ?? ''}|${b.input.limit ?? ''}`; reads.set(k, (reads.get(k) || 0) + 1); }
      }
    }
    if (o.type === 'user' && o.message) {
      const c = o.message.content;
      if (Array.isArray(c)) { let human = true; for (const b of c) if (b.type === 'tool_result') { human = false; const n = toolName.get(b.tool_use_id) || 'unknown'; bump(n, 'resultBytes', bytes(b.content)); if (b.is_error) bump(n, 'errors'); } if (human && !o.isMeta) s.userTurns++; }
      else if (typeof c === 'string' && !o.isMeta) s.userTurns++;
    }
  }
  const sum = { input: 0, cacheWrite: 0, cacheRead: 0, output: 0, thinking: 0 };
  let first = true;
  for (const u of calls.values()) {
    sum.input += u.input_tokens || 0; sum.cacheWrite += u.cache_creation_input_tokens || 0; sum.cacheRead += u.cache_read_input_tokens || 0;
    sum.output += u.output_tokens || 0; sum.thinking += (u.output_tokens_details && u.output_tokens_details.thinking_tokens) || 0;
    if (first) { s.firstCallContext = (u.input_tokens || 0) + (u.cache_creation_input_tokens || 0) + (u.cache_read_input_tokens || 0); first = false; }
  }
  s.calls = calls.size; Object.assign(s, sum);
  s.inputSide = sum.input + sum.cacheWrite + sum.cacheRead; s.avgContext = s.calls ? Math.round(s.inputSide / s.calls) : 0; s.fixedShare = s.inputSide ? Math.round(100 * (s.firstCallContext || 0) * s.calls / s.inputSide) : 0;
  s.client = [...s.client].join(','); s.models = [...s.models].join(',');
  s.toolCalls = Object.values(tools).reduce((a, t) => a + t.calls, 0); s.toolResultBytes = Object.values(tools).reduce((a, t) => a + t.resultBytes, 0); s.toolErrors = Object.values(tools).reduce((a, t) => a + t.errors, 0);
  s.repeatedReads = [...reads.values()].filter((n) => n > 1).reduce((a, n) => a + n - 1, 0);
  s.tools = tools;
  // one entry per model call that used a tool, in order: its labels (one if the calls in it were alike) and the context it read
  s.steps = [...steps].map(([id, labels]) => { const u = calls.get(id) || {}; return { label: [...new Set(labels)].join(' & '), context: (u.input_tokens || 0) + (u.cache_creation_input_tokens || 0) + (u.cache_read_input_tokens || 0) }; });
  return s;
}

const out = files.map(analyse).sort((a, b) => a.from.localeCompare(b.from));
const k = (n) => (n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(0)}k` : String(n));
console.log('session   date        title                              calls  userTurns  firstCtx  avgCtx  fixed%  input  cacheWrite  cacheRead  output(thinking)  toolCalls  toolResultKB  errors  repeatReads  usd(est)  apiMin  toolMin  client/model');
for (const s of out) console.log([s.file.slice(0, 8), s.from.slice(0, 10), (s.title || '-').slice(0, 33).padEnd(33), String(s.calls).padStart(5), String(s.userTurns).padStart(9), k(s.firstCallContext ?? 0).padStart(8), k(s.avgContext).padStart(6), `${s.fixedShare}%`.padStart(6), k(s.input).padStart(6), k(s.cacheWrite).padStart(10), k(s.cacheRead).padStart(10), `${k(s.output)}(${k(s.thinking)})`.padStart(16), String(s.toolCalls).padStart(9), String(Math.round(s.toolResultBytes / 1024)).padStart(12), String(s.toolErrors).padStart(6), String(s.repeatedReads).padStart(11), (s.usd == null ? 'n/a' : s.usd.toFixed(2)).padStart(8), (s.apiMs == null ? 'n/a' : (s.apiMs / 60000).toFixed(1)).padStart(6), (s.toolMs == null ? 'n/a' : (s.toolMs / 60000).toFixed(1)).padStart(7), `${s.client} ${s.models}`].join('  '));
if (showTools) for (const s of out) {
  console.log(`\n${s.file.slice(0, 8)} ${s.title || ''}: tools by result size`);
  for (const [n, t] of Object.entries(s.tools).sort((a, b) => b[1].resultBytes - a[1].resultBytes).slice(0, 12)) console.log(`  ${n.padEnd(28)} calls ${String(t.calls).padStart(4)}  result KB ${String(Math.round(t.resultBytes / 1024)).padStart(5)}  errors ${t.errors}`);
}
// Sequences of model calls that repeat, by what each call used. Collapsing a sequence of n calls into one command would avoid the
// context read by the n-1 later calls (an estimate: the one command's own output is not subtracted). A run of the same call repeated
// is an iteration (fix, run again), not a sequence, and is listed apart. Different sequences overlap (a 3-call sequence contains two 2-call ones).
export function sequenceReport(sessions, { min = 2, max = 4 } = {}) {
  const grams = new Map(), runs = new Map(), mix = new Map();
  for (const s of sessions) {
    const st = s.steps || [];
    for (const x of st) { const m = mix.get(x.label) || { label: x.label, steps: 0, context: 0 }; m.steps++; m.context += x.context; mix.set(x.label, m); }
    for (let n = min; n <= max; n++) {
      const lastEnd = new Map();   // a sequence is not counted again while it overlaps its own previous occurrence (A B A B counts A->B twice, not three times)
      for (let i = 0; i + n <= st.length; i++) {
        const w = st.slice(i, i + n), labels = w.map((x) => x.label);
        if (new Set(labels).size === 1) continue;
        const key = labels.join(' -> '); if (i < (lastEnd.get(key) ?? 0)) continue; lastEnd.set(key, i + n);
        const g = grams.get(key) || { key, n, occurrences: 0, sessions: new Set(), contextAvoided: 0, allBash: labels.every((l) => l.split(' & ').every((x) => x.startsWith('Bash/'))) };
        g.occurrences++; g.sessions.add(s.file.slice(0, 8)); g.contextAvoided += w.slice(1).reduce((a, x) => a + x.context, 0); grams.set(key, g);
      }
    }
    for (let i = 0; i < st.length;) {
      let j = i; while (j + 1 < st.length && st[j + 1].label === st[i].label) j++;
      if (j - i + 1 >= 3) { const r = runs.get(st[i].label) || { label: st[i].label, runs: 0, calls: 0, context: 0 }; r.runs++; r.calls += j - i + 1; r.context += st.slice(i, j + 1).reduce((a, x) => a + x.context, 0); runs.set(st[i].label, r); }
      i = j + 1;
    }
  }
  const total = sessions.reduce((a, s) => a + (s.inputSide || 0), 0);
  const ranked = [...grams.values()].filter((g) => g.occurrences >= 2).map((g) => ({ ...g, sessions: g.sessions.size, callsSaved: (g.n - 1) * g.occurrences, share: total ? g.contextAvoided / total : 0 })).sort((a, b) => b.contextAvoided - a.contextAvoided);
  const steps = sessions.reduce((a, s) => a + (s.steps || []).length, 0);
  // locating and reading code by hand: the calls a one-call lookup (scripts/code-map.mjs) replaces. Ceiling: every chain of 3 becomes 1.
  const EXPLORE = /^(Bash\/(grep|cat|sed|ls|head|tail|find|wc|awk|rg)|Read|Grep|Glob)$/, ex = [...mix.values()].filter((m) => EXPLORE.test(m.label));
  const exploration = { calls: ex.reduce((a, m) => a + m.steps, 0), context: ex.reduce((a, m) => a + m.context, 0) };
  exploration.shareOfCalls = steps ? exploration.calls / steps : 0; exploration.shareOfTokens = total ? exploration.context / total : 0; exploration.ceilingShareOfTokens = exploration.shareOfTokens * 2 / 3;
  return { totalInputSide: total, totalSteps: steps, exploration, mix: [...mix.values()].sort((a, b) => b.steps - a.steps).slice(0, 40), ranked: ranked.slice(0, 50), repeatedRuns: [...runs.values()].sort((a, b) => b.context - a.context).slice(0, 20) };
}
let sequences = null;
if (args.includes('--sequences')) {
  sequences = sequenceReport(out);
  console.log(`\nRepeated call sequences across ${out.length} sessions (${k(sequences.totalInputSide)} input-side tokens in all). contextAvoided = what the later calls of the sequence read; share = of all input-side tokens.`);
  console.log(`\nLocating and reading code by hand (grep, cat, sed, ls, Read): ${sequences.exploration.calls} of ${sequences.totalSteps} calls (${(100 * sequences.exploration.shareOfCalls).toFixed(1)}%), ${(100 * sequences.exploration.shareOfTokens).toFixed(1)}% of input-side tokens; ceiling if every chain of 3 became 1 call: ${(100 * sequences.exploration.ceilingShareOfTokens).toFixed(1)}%.`);
  console.log(`\nWhat the ${sequences.totalSteps} tool-using calls were (calls, share of calls, context read):`);
  for (const m of sequences.mix.slice(0, 14)) console.log(`${String(m.steps).padStart(5)}  ${`${(100 * m.steps / sequences.totalSteps).toFixed(1)}%`.padStart(5)}  ${k(m.context).padStart(6)}  ${m.label}`);
  console.log('\noccurrences  sessions  callsSaved  contextAvoided  share  allBash  sequence');
  for (const g of sequences.ranked.slice(0, 15)) console.log(`${String(g.occurrences).padStart(11)}  ${String(g.sessions).padStart(8)}  ${String(g.callsSaved).padStart(10)}  ${k(g.contextAvoided).padStart(14)}  ${`${(100 * g.share).toFixed(2)}%`.padStart(5)}  ${String(g.allBash).padStart(7)}  ${g.key}`);
  console.log('\nSame call repeated 3 or more times in a row (an iteration, not a sequence): runs, calls, context read');
  for (const r of sequences.repeatedRuns.slice(0, 8)) console.log(`${String(r.runs).padStart(4)} runs ${String(r.calls).padStart(4)} calls ${k(r.context).padStart(7)}  ${r.label}`);
}
const forJson = out.map(({ steps, ...rest }) => rest);
if (jsonOut) { fs.writeFileSync(jsonOut, `${JSON.stringify(sequences ? { sessions: forJson, sequences } : forJson, null, 1)}\n`); console.log(`\nWrote ${jsonOut}`); }
