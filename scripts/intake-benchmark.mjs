// Size of the pack prompt with the full issue text and with the compact brief, on recorded fixtures (AI-usage Phase 1). No network, no model.
//   node scripts/intake-benchmark.mjs [--json <file>]
// MECHANICAL: bytes, and whether the planted facts of the long-discussion fixture are present. It does not show that a model understands the
// compact brief as well as the full text; that needs a paired evaluation with a model, which is not run here. ~tokens is bytes/4, a rough ratio.
import fs from 'node:fs';
import path from 'node:path';
import { labRoot } from '../tools/compare/lib.mjs';
import { gather, composePrompt } from '../tools/compare/pack-prepare.mjs';
import { loadYaml } from '../tools/compare/pack-validate.mjs';
import { loadCatalogue, catalogueText } from '../tools/compare/pack-blocks.mjs';
import { loadChecks, checkCatalogueText } from '../tools/compare/pack-checks.mjs';
import { buildSnapshot, indexComments, renderBrief } from '../tools/compare/issue-intake.mjs';

const yaml = loadYaml(); if (!yaml) { console.error('js-yaml is not installed. Run: npm install --prefix tools/compare/.deps js-yaml@4'); process.exit(2); }
const P = (...p) => path.join(labRoot, ...p), read = (...p) => fs.readFileSync(P(...p), 'utf8'), bytes = (s) => Buffer.byteLength(s);
const tpl = read('prompts/issue-pack-chat-prompt.md').replace('{{RECIPE_FORMAT}}\n', () => ''), ex = read('docs/examples/issue-pack-3415961.yml').trimEnd();
const cat = { catalogue: catalogueText(loadCatalogue(yaml)), checks: checkCatalogueText(loadChecks(yaml)) };
function net(dir, nid, o = {}) {
  const f = (n) => P('tests/issue-pack/fixtures', dir, n), has = (n) => fs.existsSync(f(n)), get = (n) => fs.readFileSync(f(n), 'utf8');
  return async (url) => { let body = null, m;
    if (url.includes(`/api-d7/node/${nid}.json`)) body = get('node.json');
    else if ((m = url.match(/comment\.json\?node=\d+&limit=50&page=(\d+)/))) body = has(`comments-${m[1]}.json`) ? get(`comments-${m[1]}.json`) : '{"list":[]}';
    else if (url.includes('/repository/branches')) body = o.noMr ? '[]' : get('branches.json');
    else if (url.includes('merge_requests?source_branch=')) body = get('mrs.json');
    else if (/merge_requests\/\d+\.diff/.test(url)) body = get('mr.diff');
    else if ((m = url.match(/api-d7\/file\/(\d+)\.json/)) && has(`file-${m[1]}.json`)) body = get(`file-${m[1]}.json`);
    return body === null ? { status: 404, text: async () => 'not found' } : { status: 200, text: async () => body }; };
}
const facts = JSON.parse(read('tests/issue-pack/fixtures/long-discussion/facts.json')).facts;
const rows = [];
for (const [label, dir, nid, o] of [['3618230 (10 comments)', '3618230', '3618230'], ['long-discussion (120 comments)', 'long-discussion', '9999001'], ['3618230, no merge request', '3618230', '3618230', { noMr: true }]]) {
  const g = await gather(nid, { fetchImpl: net(dir, nid, o), now: new Date('2026-10-15T00:00:00Z') }), snap = buildSnapshot(g), brief = renderBrief(snap, indexComments(snap.comments));
  const full = composePrompt(tpl, ex, g, cat), compact = composePrompt(tpl, ex, { ...g, issueText: bytes(brief) < bytes(g.issueText) ? brief : g.issueText }, cat);   // as `prepare --compact` chooses
  const kept = dir === 'long-discussion' ? facts.filter((f) => f.kind !== 'untrusted-instruction').filter((f) => f.anchors.every((a) => brief.toLowerCase().includes(a.toLowerCase()))).length : null;
  rows.push({ label, comments: snap.comments.length, issueTextBytes: bytes(g.issueText), briefBytes: bytes(brief), promptFull: bytes(full.text), promptCompact: bytes(compact.text), missing: compact.missing, plantedKept: kept, gaps: snap.gaps.length });
}
const pct = (a, b) => `${Math.round((b / a) * 100)}%`;
console.log('Pack prompt bytes (rough ~tokens = bytes/4). "issue text" is INPUT 2; the diff, the instructions and the example are unchanged.\n');
console.log('case                               comments  issue text   brief   (of full)  prompt full  prompt compact  (of full)  planted facts kept');
for (const r of rows) console.log(`${r.label.padEnd(34)} ${String(r.comments).padStart(8)}  ${String(r.issueTextBytes).padStart(10)}  ${String(r.briefBytes).padStart(6)}   ${pct(r.issueTextBytes, r.briefBytes).padStart(7)}  ${String(r.promptFull).padStart(11)}  ${String(r.promptCompact).padStart(14)}  ${pct(r.promptFull, r.promptCompact).padStart(8)}   ${r.plantedKept === null ? 'n/a' : `${r.plantedKept} of 6 (the 7th is an instruction, kept out on purpose)`}`);
console.log('\nA short thread does not get shorter (the brief adds an identity table and the limits), so `prepare --compact` keeps the full text there. The saving is in long threads.');
const j = process.argv.indexOf('--json'); if (j > 0) fs.writeFileSync(process.argv[j + 1], `${JSON.stringify({ note: 'mechanical byte counts on recorded fixtures; not evidence a model understands the brief', rows }, null, 2)}\n`);
