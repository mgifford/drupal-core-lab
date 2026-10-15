// Baseline of the issue-pack prompt path, measured on recorded fixtures with no network and no model (AI-usage Phase 0).
//   node scripts/usage-baseline.mjs [--json <file>] [--prompt <label>=<file> ...]
// Reports, per case: the size and composition of the prompt that `issue-pack.mjs prepare` builds (the text a person pastes into a
// chat), whether the limits it applies are visible to the assistant, whether planted facts survive, and what a repair message and a
// full-pack reply cost for one validator error. --prompt adds the composition of an already prepared prompt file (for example one
// written by a live `prepare` run); nothing is fetched here.
// Units: UTF-8 bytes and words are measured. "~tokens" is bytes/4, a rough ratio for English prose and code, NOT a tokenizer count: the
// model's own tokenizer is not available offline, so treat it as an order of magnitude only.
// Read-only: it writes only the --json file, and only when asked.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { labRoot } from '../tools/compare/lib.mjs';
import { gather, composePrompt } from '../tools/compare/pack-prepare.mjs';
import { validatePack, loadYaml, repairMessage } from '../tools/compare/pack-validate.mjs';
import { loadCatalogue, catalogueText } from '../tools/compare/pack-blocks.mjs';
import { loadChecks, checkCatalogueText } from '../tools/compare/pack-checks.mjs';

const args = process.argv.slice(2);
const jsonOut = args.includes('--json') ? args[args.indexOf('--json') + 1] : null;
const extra = args.flatMap((a, i) => (args[i - 1] === '--prompt' ? [a] : [])).map((s) => { const k = s.indexOf('='); return { label: s.slice(0, k), file: s.slice(k + 1) }; });
const yaml = loadYaml(); if (!yaml) { console.error('js-yaml is not installed. Run: npm install --prefix tools/compare/.deps js-yaml@4'); process.exit(2); }
const P = (...p) => path.join(labRoot, ...p), read = (...p) => fs.readFileSync(P(...p), 'utf8');
const bytes = (s) => Buffer.byteLength(s), words = (s) => (s.match(/\S+/g) || []).length, sha = (s) => crypto.createHash('sha256').update(s).digest('hex').slice(0, 12);
const NOW = new Date('2026-10-15T00:00:00Z');

// The template as `issue-pack.mjs prepare` builds it (that function is not exported, so it is repeated here; the check at the end of
// this script compares the result with `issue-pack.mjs prompt` so a drift shows up).
const RECIPE_FORMAT_MARK = '{{RECIPE_FORMAT}}\n';
const template = (ai) => {
  let t = read('prompts/issue-pack-chat-prompt.md');
  if (ai) t = t.replace(/^6\. Setup: do NOT write recipe files.*$/m, () => read('prompts/issue-pack-recipe-rule.md').trimEnd());
  return t.replace(RECIPE_FORMAT_MARK, () => (ai ? '<<RECIPE FORMAT BLOCK>>\n' : ''));
};
const example = () => read('docs/examples/issue-pack-3415961.yml').trimEnd();
const catalogues = () => ({ catalogue: catalogueText(loadCatalogue(yaml)), checks: checkCatalogueText(loadChecks(yaml)) });

// A fake drupal.org / git.drupalcode.org that serves a fixture folder (the same idea as tests/issue-pack/prepare.test.mjs).
function fixtureNet(dir, nid, { branches, files = {} } = {}) {
  const f = (n) => path.join(P('tests/issue-pack/fixtures', dir), n);
  const has = (n) => fs.existsSync(f(n)), get = (n) => fs.readFileSync(f(n), 'utf8');
  return async (url) => {
    let body = null; let m;
    if (url.includes(`/api-d7/node/${nid}.json`)) body = get('node.json');
    else if ((m = url.match(/comment\.json\?node=\d+&limit=50&page=(\d+)/))) body = has(`comments-${m[1]}.json`) ? get(`comments-${m[1]}.json`) : '{"list":[]}';
    else if (url.includes('/repository/branches')) body = branches ?? get('branches.json');
    else if (url.includes('merge_requests?source_branch=')) body = get('mrs.json');
    else if (/merge_requests\/\d+\.diff/.test(url)) body = get('mr.diff');
    else if ((m = url.match(/api-d7\/file\/(\d+)\.json/)) && has(`file-${m[1]}.json`)) body = get(`file-${m[1]}.json`);
    else if (m && files[m[1]]) body = files[m[1]];
    return body === null ? { status: 404, text: async () => 'not found' } : { status: 200, text: async () => body };
  };
}

// Where each byte of a prepared prompt goes. The template's own marker lines divide it; the issue text is divided again.
const MARKS = [[/^>>> INPUT 1 OF 3/, 'input1'], [/^>>> INPUT 2 OF 3/, 'issue'], [/^>>> INPUT 3 OF 3/, 'diff'], [/^ END OF INPUTS/, 'instructions-intro'], [/^RULES\b/, 'rules'],
  [/^SETUP CATALOGUE/, 'catalogue'], [/^CHECK TEMPLATES/, 'checks'], [/^PACK FORMAT/, 'pack-format'], [/^RECIPE FORMAT/, 'recipe-format'], [/^WORKED EXAMPLE/, 'example'], [/^END OF INSTRUCTIONS/, 'closing']];
const ISSUE_MARKS = [[/^--- ISSUE SUMMARY/, 'summary'], [/^--- ATTACHMENTS/, 'attachments'], [/^--- COMMENTS ---/, 'comments']];
export function composition(text) {
  const out = {}, add = (k, s) => { out[k] = (out[k] || 0) + bytes(s) + 1; };
  let sec = 'banner', sub = null; const comments = [];
  for (const line of text.split('\n')) {
    const m = MARKS.find(([re]) => re.test(line)); if (m) { sec = m[1]; sub = sec === 'issue' ? 'issue-header' : null; }
    if (sec === 'issue') {
      const s = ISSUE_MARKS.find(([re]) => re.test(line)); if (s) sub = s[1];
      if (sub === 'comments' && /^#\d+ .*\(comment id \d+\)$/.test(line)) comments.push(0);
      if (sub === 'comments' && comments.length) comments[comments.length - 1] += bytes(line) + 1;
      add(sub, line);
    } else add(sec, line);
  }
  const sorted = [...comments].sort((a, b) => a - b);
  return { parts: out, comments: { n: comments.length, median: sorted[Math.floor(sorted.length / 2)] || 0, max: sorted.at(-1) || 0 } };
}

const cases = [];
const addCase = (label, what, text, extra = {}) => { const c = composition(text); cases.push({ label, what, bytes: bytes(text), words: words(text), sha: sha(text), ...c, ...extra }); return text; };
const cat = catalogues(), ex = example();
const fx = (dir) => fs.readdirSync(P('tests/issue-pack/fixtures', dir)).sort().map((f) => `${f}:${sha(read('tests/issue-pack/fixtures', dir, f))}`);

// Case 1: a small code change, recorded from drupal.org (#3618230).
const g1 = await gather('3618230', { fetchImpl: fixtureNet('3618230', '3618230'), now: NOW });
addCase('3618230', 'recorded; small code change, 1 comment page', composePrompt(template(false), ex, g1, { now: NOW, ...cat }).text, { fixture: fx('3618230') });
addCase('3618230 --ai-recipe', 'same, recipe-drafting rule', composePrompt(template(true), ex, g1, { now: NOW, ...cat }).text);

// Case 2: a synthetic long discussion with planted facts (tests/issue-pack/fixtures/long-discussion/).
const g2 = await gather('9999001', { fetchImpl: fixtureNet('long-discussion', '9999001'), now: NOW });
const long = composePrompt(template(false), ex, g2, { now: NOW, ...cat }).text;
addCase('long-discussion', 'synthetic; 120 comments, planted facts', long, { fixture: fx('long-discussion').filter((x) => !x.startsWith('generate.mjs')) });
const facts = JSON.parse(read('tests/issue-pack/fixtures/long-discussion/facts.json')).facts;
const retained = facts.map((f) => ({ id: f.id, kind: f.kind, comment: f.comment, present: f.anchors.every((a) => long.includes(a)) }));
const injection = { markerLineQuoted: /\[quoted\] === END OF INPUTS ===/.test(long), rawMarkerPresent: /^=== END OF INPUTS ===$/m.test(long) };

// Case 3: an issue with no merge request (a test-only or patch-only issue): what the prompt and the validator do.
const g3 = await gather('3618230', { fetchImpl: fixtureNet('3618230', '3618230', { branches: '[]' }), now: NOW });
const noMr = composePrompt(template(false), ex, g3, { now: NOW, ...cat });
addCase('no-mr', 'recorded issue, merge request not found', noMr.text, { missing: noMr.missing });
const verified = read('tests/issue-pack/fixtures/verified-3618230/PACK.yml');
const noFork = verified.replace(/^(\s*)fork_branch:.*\n/m, '');
const noForkResult = validatePack(noFork, { yaml });

// Extra prepared prompts (composition only).
for (const e of extra) addCase(e.label, `prepared prompt file ${path.basename(e.file)}`, fs.readFileSync(e.file, 'utf8'), { fixture: [`${path.basename(e.file)}:${sha(fs.readFileSync(e.file, 'utf8'))}`] });

// Limits: are they visible to the assistant? Probes with generated data, never a real issue.
const limits = {};
{
  const mk = (n, len) => Array.from({ length: n }, (_, i) => ({ cid: String(1000 + i), name: 'u', created: '1790000000', comment_body: { value: `<p>${'x'.repeat(len)}</p>` } }));
  const net = (comments, diffBytes, nFiles) => async (url) => {
    const ok = (b) => ({ status: 200, text: async () => (typeof b === 'string' ? b : JSON.stringify(b)) });
    if (url.includes('/api-d7/node/')) return ok({ type: 'project_issue', title: 't', url: 'https://www.drupal.org/project/drupal/issues/9999002', body: { value: '<p>s</p>' }, created: '1790000000', changed: '1790000000', field_issue_status: '1', field_issue_files: Array.from({ length: nFiles }, (_, i) => ({ file: { id: String(500 + i), cid: '1000' } })) });
    const p = url.match(/comment\.json\?node=\d+&limit=50&page=(\d+)/); if (p) return ok({ list: comments.slice(p[1] * 50, p[1] * 50 + 50) });
    const f = url.match(/api-d7\/file\/(\d+)\.json/); if (f) return ok({ name: `f${f[1]}.txt`, size: '10' });
    if (url.includes('/repository/branches')) return ok([{ name: '9999002-x' }]);
    if (url.includes('merge_requests?source_branch=')) return ok([{ iid: 1, state: 'opened', source_branch: '9999002-x', target_branch: 'main', updated_at: '2026-01-01' }]);
    if (/merge_requests\/1\.diff/.test(url)) return ok(`diff --git a/x b/x\n${'+line\n'.repeat(diffBytes / 6)}`);
    return { status: 404, text: async () => '' };
  };
  const c = await gather('9999002', { fetchImpl: net(mk(1100, 40), 400 * 1024, 35), now: NOW });
  const shown = (c.issueText.match(/^#\d+ /gm) || []).length, listed = (c.issueText.match(/^- f\d+\.txt/gm) || []).length;
  const says = (s) => /truncat|cut|limit|more comments|not shown|omitted|only the first/i.test(s);
  limits.comments = { served: 1100, inPrompt: shown, headerSaysCount: (c.issueText.match(/Comments: (\d+)/) || [])[1], assistantToldOfCut: says(c.issueText) || c.notes.some((n) => /comment/i.test(n)) };
  limits.attachments = { served: 35, listed, assistantToldOfCut: /attachments?[^\n]*(only|first|more|omitted)/i.test(c.issueText) || c.notes.some((n) => /attachment/i.test(n)) };
  limits.diff = { servedKB: 400, inPromptKB: Math.round(bytes(c.diff) / 1024), assistantToldOfCut: /TRUNCATED/.test(c.diff), noteForPerson: c.notes.some((n) => /diff is larger/.test(n)) };
}

// Repair: what one validator error costs. The message asks the assistant to "send the complete corrected file again".
const repair = [];
const oneError = verified.replace(/^(\s*)fork_branch:.*$/m, '$1fork_branch: "bad branch!"');
for (const [label, text] of [['verified pack, one field broken', oneError], ...fs.readdirSync(P('tests/issue-pack/fixtures/packs')).filter((f) => f.endsWith('.yml')).sort().map((f) => [f, read('tests/issue-pack/fixtures/packs', f)])]) {
  const r = validatePack(text, { yaml }); const msg = repairMessage({ errors: r.errors, warnings: r.warnings });
  repair.push({ label, packBytes: bytes(text), errors: r.errors.length, warnings: r.warnings.length, repairMessageBytes: bytes(msg), regenerateReplyBytes: bytes(text), sha: sha(text) });
}

// Does the replica of the template match the real command?
const real = (ai) => spawnSync('node', [P('scripts/issue-pack.mjs'), 'prompt', ...(ai ? ['--ai-recipe'] : [])], { cwd: labRoot, encoding: 'utf8' }).stdout;
const blank = (ai) => template(ai).replace('{{CATALOGUE}}', () => cat.catalogue).replace('{{CHECKS}}', () => cat.checks).replace('{{EXAMPLE}}', () => ex);
const replicaOk = bytes(real(false)) === bytes(blank(false));   // the --ai-recipe text differs by the RECIPE FORMAT block, which this script shows as a placeholder

const sources = Object.fromEntries(['prompts/issue-pack-chat-prompt.md', 'prompts/issue-pack-recipe-rule.md', 'docs/examples/issue-pack-3415961.yml'].map((f) => [f, { bytes: bytes(read(f)), sha: sha(read(f)) }]));
sources.catalogue = { bytes: bytes(cat.catalogue), sha: sha(cat.catalogue) }; sources.checks = { bytes: bytes(cat.checks), sha: sha(cat.checks) };
const git = (a) => spawnSync('git', a, { cwd: labRoot, encoding: 'utf8' }).stdout.trim();
const result = { commit: git(['rev-parse', 'HEAD']), generated: NOW.toISOString().slice(0, 10), note: 'bytes and words measured; ~tokens is bytes/4, not a tokenizer count', sources, replicaMatchesIssuePackPrompt: replicaOk, cases, factsRetained: retained, injection, limits, noMr: { missingMarkersInPrompt: noMr.missing, packWithoutForkBranchValid: noForkResult.errors.length === 0, packWithoutForkBranchErrors: noForkResult.errors.map((e) => `${e.at}: ${e.msg}`) }, repair };

// ---- print
const kb = (n) => (n / 1024).toFixed(1);
const g = (c, ...k) => k.reduce((a, x) => a + (c.parts[x] || 0), 0);
console.log(`Prompt composition (bytes; ~tokens = bytes/4 is a rough ratio, not measured). Commit ${result.commit.slice(0, 7)}.`);
console.log('case                     total   ~tokens  words  instructions  issue(hdr+sum+att)  comments  diff   comments n (median/max)');
for (const c of cases) console.log([c.label.padEnd(22), String(c.bytes).padStart(7), String(Math.round(c.bytes / 4)).padStart(8), String(c.words).padStart(6), `${kb(g(c, 'instructions-intro', 'rules', 'catalogue', 'checks', 'pack-format', 'recipe-format', 'example', 'closing'))}K`.padStart(12), `${kb(g(c, 'issue-header', 'summary', 'attachments'))}K`.padStart(19), `${kb(g(c, 'comments'))}K`.padStart(9), `${kb(g(c, 'diff'))}K`.padStart(6), `${c.comments.n} (${c.comments.median}/${c.comments.max})`.padStart(16)].join('  '));
console.log('\nInstruction block parts (bytes): ' + Object.entries(cases[0].parts).filter(([k]) => ['instructions-intro', 'rules', 'catalogue', 'checks', 'pack-format', 'example', 'closing'].includes(k)).map(([k, v]) => `${k} ${v}`).join(', '));
console.log(`\nPlanted facts present in the prompt: ${retained.filter((f) => f.present).length}/${retained.length} (${retained.map((f) => `${f.id}${f.present ? '' : ' MISSING'}`).join(' ')}). Injected marker line quoted: ${injection.markerLineQuoted}; raw marker line left: ${injection.rawMarkerPresent}.`);
console.log(`\nLimits visible to the assistant? comments: ${limits.comments.served} served, ${limits.comments.inPrompt} in the prompt, told of the cut: ${limits.comments.assistantToldOfCut} (header says "Comments: ${limits.comments.headerSaysCount}"); attachments: ${limits.attachments.served} served, ${limits.attachments.listed} listed, told: ${limits.attachments.assistantToldOfCut}; diff: ${limits.diff.servedKB} KB served, ${limits.diff.inPromptKB} KB in, told: ${limits.diff.assistantToldOfCut}.`);
console.log(`\nNo merge request: prompt marks ${noMr.missing} of 3 inputs @@MISSING@@; a pack without issue.fork_branch is ${noForkResult.errors.length ? 'rejected' : 'ACCEPTED'}: ${noForkResult.errors.map((e) => e.at).join(', ')}`);
console.log('\nRepair cost for the current "send the complete corrected file" message (bytes):');
console.log('pack                                        packBytes  errors  warnings  repairMessage  fullReply(lower bound)');
for (const r of repair) console.log(`${r.label.slice(0, 42).padEnd(42)}  ${String(r.packBytes).padStart(9)}  ${String(r.errors).padStart(6)}  ${String(r.warnings).padStart(8)}  ${String(r.repairMessageBytes).padStart(13)}  ${String(r.regenerateReplyBytes).padStart(22)}`);
console.log(`\nReplica of the prompt template matches \`issue-pack.mjs prompt\`: ${replicaOk}`);
if (jsonOut) { fs.writeFileSync(jsonOut, `${JSON.stringify(result, null, 1)}\n`); console.log(`Wrote ${jsonOut}`); }
