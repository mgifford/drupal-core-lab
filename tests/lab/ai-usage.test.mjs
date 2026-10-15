// Tests for the AI-usage measurement tools (Phase 0): the frozen synthetic fixture, scripts/usage-baseline.mjs and
// scripts/session-usage.mjs. No network, no DDEV, no model. Run: node --test tests/lab/ai-usage.test.mjs
// They check that the tools measure what they say they measure. They do not pin today's prompt sizes or today's limits, so a later
// phase that improves them does not break these tests; the numbers live in reports/ai-usage/.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { labRoot, } from '../../tools/compare/lib.mjs';

const node = (script, args, opts = {}) => spawnSync('node', [path.join(labRoot, script), ...args], { cwd: labRoot, encoding: 'utf8', maxBuffer: 64 << 20, ...opts });
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-usage-test-'));
const FX = path.join(labRoot, 'tests/issue-pack/fixtures/long-discussion');

test('the synthetic long-discussion fixture is exactly what its generator writes (frozen, so hashes in reports stay valid)', () => {
  const out = path.join(tmp, 'ld'); const r = node('tests/issue-pack/fixtures/long-discussion/generate.mjs', [out]); assert.equal(r.status, 0, r.stderr);
  const files = fs.readdirSync(out).sort(); assert.ok(files.length >= 8, files.join());
  for (const f of files) assert.equal(fs.readFileSync(path.join(out, f), 'utf8'), fs.readFileSync(path.join(FX, f), 'utf8'), f);
});

test('every planted fact is in the fixture exactly where facts.json says (so a brief can be checked against it later)', () => {
  const { facts } = JSON.parse(fs.readFileSync(path.join(FX, 'facts.json'), 'utf8'));
  const comments = [0, 1, 2].flatMap((p) => JSON.parse(fs.readFileSync(path.join(FX, `comments-${p}.json`), 'utf8')).list);
  assert.equal(comments.length, 120);
  for (const f of facts) { const body = comments[f.comment - 1].comment_body.value; for (const a of f.anchors) assert.ok(body.includes(a.replace(/&/g, '&amp;')) || body.includes(a), `${f.id}: "${a}" is not in comment #${f.comment}`); }
  assert.ok(facts.some((f) => f.supersedes), 'a superseded proposal is planted'); assert.ok(facts.some((f) => f.kind === 'unresolved') && facts.some((f) => f.kind === 'untrusted-instruction'));
});

test('usage-baseline: composition adds up, planted facts and the injected marker behave, nothing is fetched', () => {
  const out = path.join(tmp, 'baseline.json');
  const r = node('scripts/usage-baseline.mjs', ['--json', out]); assert.equal(r.status, 0, r.stdout + r.stderr);
  const b = JSON.parse(fs.readFileSync(out, 'utf8'));
  assert.equal(b.replicaMatchesIssuePackPrompt, true, 'the template replica no longer matches `issue-pack.mjs prompt`: update scripts/usage-baseline.mjs');
  assert.deepEqual(b.cases.map((c) => c.label).slice(0, 4), ['3618230', '3618230 --ai-recipe', 'long-discussion', 'no-mr']);
  for (const c of b.cases) { const sum = Object.values(c.parts).reduce((a, n) => a + n, 0); assert.ok(Math.abs(sum - c.bytes) <= 1, `${c.label}: parts ${sum} vs total ${c.bytes}`); assert.match(c.sha, /^[0-9a-f]{12}$/); }
  assert.equal(b.cases.find((c) => c.label === 'long-discussion').comments.n, 120);
  assert.equal(b.injection.markerLineQuoted, true); assert.equal(b.injection.rawMarkerPresent, false);
  assert.ok(b.factsRetained.length >= 6 && b.factsRetained.every((f) => typeof f.present === 'boolean'));
  assert.ok(b.noMr.missingMarkersInPrompt >= 1 && b.noMr.packWithoutForkBranchValid === false);
  assert.ok(b.repair.every((x) => x.repairMessageBytes >= 0 && x.regenerateReplyBytes === x.packBytes));
  assert.match(b.note, /not a tokenizer count/);
});

// A transcript in the shape Claude Code writes (the same usage repeated on each content block of one message), with a canary in the
// message text that must never appear in the output.
const line = (o) => JSON.stringify(o);
const usage = (cacheRead, out, think) => ({ input_tokens: 2, cache_creation_input_tokens: 100, cache_read_input_tokens: cacheRead, output_tokens: out, output_tokens_details: { thinking_tokens: think } });
const TRANSCRIPT = [
  line({ type: 'custom-title', customTitle: 'A test session' }),
  line({ type: 'user', timestamp: '2026-10-01T00:00:00Z', version: '2.1.999', message: { content: 'CANARY-SECRET-TEXT please do the thing' } }),
  line({ type: 'assistant', timestamp: '2026-10-01T00:00:01Z', message: { id: 'msg_1', model: 'm-1', usage: usage(1000, 50, 10), content: [{ type: 'text', text: 'CANARY-SECRET-TEXT' }] } }),
  line({ type: 'assistant', timestamp: '2026-10-01T00:00:02Z', message: { id: 'msg_1', model: 'm-1', usage: usage(1000, 50, 10), content: [{ type: 'tool_use', id: 't1', name: 'Read', input: { file_path: '/x/a.md' } }] } }),
  line({ type: 'user', message: { content: [{ type: 'tool_result', tool_use_id: 't1', content: 'x'.repeat(2048) }] } }),
  line({ type: 'assistant', timestamp: '2026-10-01T00:00:03Z', message: { id: 'msg_2', model: 'm-1', usage: usage(3000, 70, 20), content: [{ type: 'tool_use', id: 't2', name: 'Read', input: { file_path: '/x/a.md' } }, { type: 'tool_use', id: 't3', name: 'Bash', input: { command: 'node scripts/lint.mjs foo' } }] } }),
  line({ type: 'user', message: { content: [{ type: 'tool_result', tool_use_id: 't2', content: 'y'.repeat(1024) }, { type: 'tool_result', tool_use_id: 't3', content: 'boom', is_error: true }] } }),
  line({ type: 'cost-state', totalCostUSD: 1.5, totalAPIDuration: 120000, totalToolDuration: 30000 }),
].join('\n');

test('session-usage: counts a message once, sizes tool results, flags errors and repeated reads, and prints no message text', () => {
  const dir = path.join(tmp, 'sessions'); fs.mkdirSync(dir); fs.writeFileSync(path.join(dir, 'abcd1234-x.jsonl'), `${TRANSCRIPT}\n`);
  const json = path.join(tmp, 'sessions.json');
  const r = node('scripts/session-usage.mjs', [dir, '--tools', '--json', json]); assert.equal(r.status, 0, r.stderr);
  const [s] = JSON.parse(fs.readFileSync(json, 'utf8'));
  assert.equal(s.calls, 2); assert.equal(s.cacheRead, 4000); assert.equal(s.cacheWrite, 200); assert.equal(s.output, 120); assert.equal(s.thinking, 30);
  assert.equal(s.firstCallContext, 1102); assert.equal(s.toolCalls, 3); assert.equal(s.toolErrors, 1); assert.equal(s.repeatedReads, 1);
  assert.equal(s.toolResultBytes, 2048 + 1024 + 4); assert.equal(s.tools['Bash/lab:lint'].errors, 1);
  assert.equal(s.usd, 1.5); assert.equal(s.apiMs, 120000); assert.equal(s.client, '2.1.999'); assert.equal(s.models, 'm-1');
  assert.equal(s.avgContext, Math.round((2 + 100 + 1000 + 2 + 100 + 3000) / 2));
  assert.doesNotMatch(r.stdout + fs.readFileSync(json, 'utf8'), /CANARY|please do the thing/);
});

test('session-usage: a folder with no transcripts is an error, not an empty success', () => {
  const dir = path.join(tmp, 'empty'); fs.mkdirSync(dir);
  const r = node('scripts/session-usage.mjs', [dir]); assert.notEqual(r.status, 0);
});
