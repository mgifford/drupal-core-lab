// Deterministic attribution, prompt/artifact provenance and request-accounting tests. No model, no network, no DDEV.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { classifyOperation, classifyRequestOperations, classifyLabelDetailed, classifyTool, classifyCommand, allocateActivity, CLASSIFIER_VERSION } from '../../tools/resource/classify.mjs';
import { LAB_SCRIPTS, GIT_RULES } from '../../tools/resource/rules.mjs';
import { classifyPromptText, promptOrigin, artifactReferences, PROMPT_RULES_VERSION } from '../../tools/resource/prompts.mjs';
import { inspectZipBuffer, inspectPatchText, inspectArtifact } from '../../tools/resource/artifacts.mjs';
import { explorationDiagnostics, explorationDetails } from '../../tools/resource/exploration.mjs';
import { makeEvent, validateEvent, publicEvent } from '../../tools/resource/events.mjs';
import { aggregate, publicRows, counted } from '../../tools/resource/aggregate.mjs';
import { assertPublic } from '../../tools/resource/public.mjs';

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'resource-attribution-'));

function zipBuffer(entries) {
  const records = [];
  for (const e of entries) {
    const name = Buffer.from(e.name);
    const cd = Buffer.alloc(46);
    cd.writeUInt32LE(0x02014b50, 0);
    cd.writeUInt16LE(20, 4); cd.writeUInt16LE(20, 6);
    cd.writeUInt16LE(e.encrypted ? 1 : 0, 8); cd.writeUInt16LE(0, 10);
    cd.writeUInt32LE(e.compressed ?? 0, 20); cd.writeUInt32LE(e.uncompressed ?? 0, 24);
    cd.writeUInt16LE(name.length, 28); cd.writeUInt32LE(e.external ?? 0, 38);
    records.push(Buffer.concat([cd, name]));
  }
  const central = Buffer.concat(records);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(entries.length, 8); eocd.writeUInt16LE(entries.length, 10);
  eocd.writeUInt32LE(central.length, 12); eocd.writeUInt32LE(0, 16);
  return Buffer.concat([central, eocd]);
}

const baseEvent = (over = {}) => ({
  event_type: 'ai-request', occurred_at: '2026-11-01T10:00:00Z', duration_ms: null,
  issue: null, variant: null, task: { id: 'task-1', label: 'T', execution_id: 'x' },
  activity: 'unknown', tool: 'claude-code', model: 'claude-test', provider: 'anthropic',
  outcome: 'unknown', validation: 'unknown',
  source: { adapter: 'test', method: 'fixture', confidence: 'provider-reported', reference: 'local:test' },
  accounting: { scope: 'request', counted: true, method_version: 'request-level-v1' },
  measurements: { tokens: { input_total: 10, uncached_input: 1, output: 2, cache_creation: 3, cache_read: 6, reasoning: 0, model_requests: 1, token_basis: 'provider-reported' } },
  quality: { completeness: 'partial', missing: ['cpu'], notes: [] },
  ...over,
});

test('classifier separates operation, tool and provenance instead of matching command names', () => {
  const read = classifyLabelDetailed('Read');
  assert.equal(read.activity, 'code-exploration');
  assert.equal(read.subcategory, 'source_discovery');
  assert.equal(read.rule_id, 'tool.read');
  assert.equal(read.provenance, 'tool_name_rule');

  assert.equal(classifyTool('Bash/git grep x'), 'code-exploration');
  assert.equal(classifyTool('Bash/git status'), 'environment-setup', 'git is not automatically exploration');
  assert.equal(classifyTool('Bash/git diff --stat'), 'code-exploration');
  assert.equal(classifyTool('Bash/ddev composer install'), 'composer-install');
  assert.equal(classifyTool('Bash/ddev drupal cache'), 'cache-rebuild');
  assert.equal(classifyTool('Bash/lab:setup'), 'environment-setup');
  assert.equal(classifyTool('Bash/lab:measure-resources'), 'resource-measurement');
  assert.equal(classifyTool('Bash/lab:not-a-real-script'), 'unknown');
  assert.equal(classifyTool('Bash/node'), 'unknown', 'negative control: node alone is not validation');
  assert.equal(classifyTool('Bash/for'), 'unknown', 'a loop label without its body stays Unknown');

  const loop = classifyOperation({ tool: 'Bash', command: 'for f in *.php; do node scripts/lint.mjs "$f"; done' });
  assert.equal(loop.activity, 'validation');
  assert.equal(loop.rule_id, 'script.lint');

  const test = classifyOperation({ tool: 'Bash', command: 'node --test tests/lab/*.test.mjs' });
  assert.equal(test.activity, 'validation');

  const write = classifyOperation({ tool: 'Bash', command: 'node -e "require(\'fs\').writeFileSync(\'x\',\'y\')"' });
  assert.equal(write.activity, 'patch-development');
  assert.equal(write.confidence, 'heuristic');

  const heredoc = classifyOperation({ tool: 'Bash', command: "python3 - <<'EOF'\nopen('x','w').write('y')\nEOF" });
  assert.equal(heredoc.activity, 'patch-development');

  const compound = classifyOperation({ tool: 'Bash', command: 'grep -n "x" a.md && node --test tests/x.test.mjs' });
  assert.equal(compound.activity, 'validation', 'the primary operation is recorded and all components are retained');
  assert.ok(compound.components.some((c) => c.activity === 'code-exploration'));
  assert.equal(compound.confidence, 'heuristic');

  const unknownTool = classifyOperation({ tool: 'mcp__unknown__thing' });
  assert.equal(unknownTool.activity, 'unknown');
  assert.equal(unknownTool.unknown_reason, 'unrecognized_tool');

  const malformed = classifyOperation({ tool: 'Bash', command: 'node -e "unclosed' });
  assert.equal(malformed.activity, 'unknown');
  assert.equal(malformed.unknown_reason, 'parser_error');
});

test('every registry entry resolves to its documented activity and rule', () => {
  for (const [file, entry] of Object.entries(LAB_SCRIPTS)) {
    const d = classifyLabelDetailed(`Bash/lab:${file.replace(/\.mjs$/, '')}`);
    assert.equal(d.activity, entry.activity, file);
    assert.equal(d.rule_id, entry.rule, file);
  }
  for (const [sub, entry] of Object.entries(GIT_RULES)) {
    const d = classifyCommand(['git', sub]);
    assert.equal(d, entry.activity, `git ${sub}`);
  }
});

test('request classification keeps tool-free and mixed requests explicit and never divides tokens', () => {
  const only = classifyRequestOperations([]);
  assert.equal(only.activity, 'unknown');
  assert.equal(only.unknown_reason, 'model_only_request');

  const mixed = classifyRequestOperations([{ tool: 'Read', file: 'a.js' }, { tool: 'Edit', file: 'a.js' }]);
  assert.equal(mixed.activity, 'patch-development');
  assert.equal(mixed.confidence, 'heuristic');
  assert.equal(mixed.components.length, 2);

  const noDetails = classifyRequestOperations([{ tool: 'Bash' }]);
  assert.equal(noDetails.activity, 'unknown');
  assert.equal(noDetails.unknown_reason, 'missing_tool_details');
});

test('legacy allocation remains labelled and reports Unknown reasons without double counting', () => {
  const a = allocateActivity({ Read: { calls: 3 }, 'Bash/lab:not-a-real-script': { calls: 1 }, 'Bash/for': { calls: 1 } }, 1000);
  assert.equal(a.allocations.reduce((n, x) => n + x.tokens, 0), 1000);
  assert.equal(a.classification.method_version, 'legacy-tool-call-share-v1');
  assert.ok(a.classification.unknown_reasons.some((r) => r.reason === 'unrecognized_command'));
  assert.ok(a.classification.unknown_reasons.some((r) => r.reason === 'compound_command'));
  assert.equal(CLASSIFIER_VERSION, a.classification.version);
});

test('prompt metadata classifies structure and purpose without claiming token counts', () => {
  const short = classifyPromptText('Fix the failing test.');
  assert.equal(short.purpose, 'short_instruction');
  assert.equal(short.size_bucket, 'lt_1kib');
  assert.ok(short.content_types.includes('natural_language'));

  const spec = classifyPromptText(`## Objective\nImplement the following.\n## Requirements\n- one\n- two\n## Acceptance criteria\n- tests pass\n${'detail '.repeat(500)}`);
  assert.equal(spec.purpose, 'implementation_specification');
  assert.ok(spec.bytes > 2000);
  assert.ok(spec.content_types.includes('markdown'));

  const stack = classifyPromptText('The test is failing with this stack trace:\nTraceback (most recent call last):\n  File "x.py", line 1\nError: boom');
  assert.equal(stack.purpose, 'test_failure_analysis');
  assert.ok(stack.content_types.includes('stack_trace'));

  const patch = classifyPromptText('Review the attached patch reports/issues/1/x.patch and reproduce the problem.', { origin: 'human' });
  assert.equal(patch.purpose, 'artifact_analysis');
  assert.equal(patch.artifact_references[0].kind, 'patch');

  const code = classifyPromptText('```js\nconsole.log(1)\n```');
  assert.ok(code.content_types.includes('code_fence'));
  assert.equal(classifyPromptText('same').fingerprint, classifyPromptText('same').fingerprint);
  assert.notEqual(classifyPromptText('a').fingerprint, classifyPromptText('b').fingerprint);
  assert.equal(promptOrigin({ text: '<command-name>x</command-name>' }), 'generated');
  assert.equal(promptOrigin({ text: 'do it', client: 'claude-code' }), 'human');
  assert.equal(PROMPT_RULES_VERSION, spec.rules_version);
  assert.deepEqual(artifactReferences('see lib/a.php and notes.txt').map((r) => r.kind), ['source']);
});

test('ZIP inspection is bounded and flags traversal, absolute paths, symlinks and encryption without extracting', () => {
  const zip = zipBuffer([
    { name: 'README.md', uncompressed: 10, compressed: 5 },
    { name: 'tests/ExampleTest.php', uncompressed: 20 },
    { name: '../escape.php', uncompressed: 1 },
    { name: '/absolute.php', uncompressed: 1 },
    { name: 'link.php', uncompressed: 1, external: ((0o120777 << 16) >>> 0) },
    { name: 'secret.php', uncompressed: 1, encrypted: true },
    { name: 'dir/', uncompressed: 0 },
  ]);
  const info = inspectZipBuffer(zip);
  assert.equal(info.inspected, true);
  assert.equal(info.entries_declared, 7);
  assert.equal(info.entries_read, 7);
  assert.equal(info.path_traversal_entries, 1);
  assert.equal(info.absolute_path_entries, 1);
  assert.equal(info.symlinks, 1);
  assert.equal(info.encrypted_entries, 1);
  assert.equal(info.has_tests, true);
  assert.equal(info.has_docs, true);
  assert.equal(info.extraction, 'none');
  assert.ok(info.total_uncompressed_bytes >= 34);
});

test('patch inspection reports files and line counts; artifact inspection never follows a symlink or leaves the repository', () => {
  const patch = inspectPatchText('diff --git a/x.php b/x.php\n--- a/x.php\n+++ b/x.php\n@@\n-old\n+new\n+test\n');
  assert.equal(patch.files_changed, 1);
  assert.equal(patch.added_lines, 2);
  assert.equal(patch.removed_lines, 1);
  assert.equal(patch.applied, 'unknown');

  const dir = path.join(tmp, 'artifacts'); fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, 'x.patch'); fs.writeFileSync(file, 'diff --git a/a b/a\n--- a/a\n+++ b/a\n+x\n');
  const inside = inspectArtifact('x.patch', { baseDir: dir });
  assert.equal(inside.metadata.available, true);
  assert.equal(inside.metadata.inspected, true);
  assert.equal(inside.metadata.patch.added_lines, 1);

  const outside = inspectArtifact(path.join(tmp, 'elsewhere.txt'), { baseDir: dir });
  assert.equal(outside.metadata.available, false);
  assert.match(outside.metadata.reasons.join(' '), /outside the repository/);

  const symlink = path.join(dir, 'link.patch');
  try { fs.symlinkSync(file, symlink); assert.equal(inspectArtifact('link.patch', { baseDir: dir }).metadata.available, false); } catch { /* platform without symlinks */ }
});

test('exploration diagnostics distinguish unique, repeated, after-edit and after-failure lookups', () => {
  const requests = [
    { id: '1', timestamp: '2026-01-01T00:00:00Z', ops: [{ tool: 'Read', file: 'a.js' }], errors: 0, resultBytes: 100 },
    { id: '2', timestamp: '2026-01-01T00:00:01Z', ops: [{ tool: 'Grep', pattern: 'foo', path: 'src' }], errors: 1, resultBytes: 50 },
    { id: '3', timestamp: '2026-01-01T00:00:02Z', ops: [{ tool: 'Read', file: 'a.js' }], errors: 0, resultBytes: 100 },
    { id: '4', timestamp: '2026-01-01T00:00:03Z', ops: [{ tool: 'Edit', file: 'a.js' }], errors: 0, resultBytes: 0 },
    { id: '5', timestamp: '2026-01-01T00:00:04Z', ops: [{ tool: 'Read', file: 'a.js' }], errors: 0, resultBytes: 100 },
    { id: '6', timestamp: '2026-01-01T00:00:05Z', ops: [{ tool: 'Bash', command: 'node scripts/code-map.mjs env Foo::bar' }], errors: 0, resultBytes: 20 },
  ];
  const d = explorationDiagnostics(requests);
  assert.equal(d.unique_targets, 3);
  assert.equal(d.repeated_lookups >= 2, true);
  assert.equal(d.failed_searches, 1);
  assert.equal(d.exploration_after_edit >= 1, true);
  assert.equal(d.code_map_calls, 1);
  assert.equal(d.result_bytes, 370);
  const details = explorationDetails(requests);
  assert.equal(details.unique_targets, 3);
  assert.ok(details.repeated.some((x) => x.target === 'file:a.js' && x.count === 3 && x.after_edit));
  assert.match(details.note, /Local-only/);
});

test('aggregation counts only counted events, reports Unknown reasons and excludes an uncounted roll-up', () => {
  const r1 = makeEvent(baseEvent({ activity: 'unknown', classification: { version: '2.0.0', method: 'request-level', method_version: 'request-level-v1', provenance: 'unclassified', confidence: 'unclassified', unknown_reasons: [{ reason: 'model_only_request', operations: 0 }], components: [{ activity: 'unknown', operations: 0, unknown_reason: 'model_only_request' }] }, measurements: { ...baseEvent().measurements, tokens: { input_total: 100, uncached_input: 0, output: 0, cache_creation: 0, cache_read: 100, reasoning: 0, model_requests: 1, token_basis: 'provider-reported' } } }));
  const r2 = makeEvent(baseEvent({ activity: 'unknown', classification: { version: '2.0.0', method: 'request-level', method_version: 'request-level-v1', provenance: 'unclassified', confidence: 'unclassified', unknown_reasons: [{ reason: 'unrecognized_command', operations: 1 }], components: [{ activity: 'unknown', operations: 1, unknown_reason: 'unrecognized_command' }] }, measurements: { ...baseEvent().measurements, tokens: { input_total: 50, uncached_input: 0, output: 0, cache_creation: 0, cache_read: 50, reasoning: 0, model_requests: 1, token_basis: 'provider-reported' } } }));
  const r3 = makeEvent(baseEvent({ activity: 'code-exploration', classification: { version: '2.0.0', method: 'request-level', method_version: 'request-level-v1', provenance: 'tool_name_rule', confidence: 'deterministic', subcategory: 'source_discovery', unknown_reasons: [], components: [{ activity: 'code-exploration', operations: 1, subcategory: 'source_discovery' }] }, measurements: { ...baseEvent().measurements, tokens: { input_total: 200, uncached_input: 0, output: 0, cache_creation: 0, cache_read: 200, reasoning: 0, model_requests: 1, token_basis: 'provider-reported' } } }));
  const roll = makeEvent(baseEvent({ event_type: 'ai-usage', activity: 'unknown', accounting: { scope: 'session', counted: false, method_version: 'request-level-v1' }, reconciliation: { status: 'matched', session_tokens: 350, request_tokens: 350, delta: 0, expected_requests: 3, request_count: 3, model_only_requests: 1 }, measurements: { ...baseEvent().measurements, tokens: { input_total: 99999, uncached_input: 0, output: 0, cache_creation: 0, cache_read: 99999, reasoning: 0, model_requests: 99, token_basis: 'provider-reported' } } }));
  for (const e of [r1, r2, r3, roll]) assert.equal(validateEvent(e).ok, true, JSON.stringify(validateEvent(e).errors));
  assert.equal(counted(roll), false);
  const s = aggregate([r1, r2, r3, roll]);
  assert.equal(s.totals.ai.tokens, 350, 'the uncounted session total is excluded');
  assert.equal(s.totals.ai.model_requests, 3);
  assert.equal(s.attribution.activity.unknown, 2);
  assert.equal(s.attribution.activity.tokens_unknown, 150);
  assert.equal(s.attribution.unknown.reasons.find((x) => x.unknown_reason === 'model_only_request').tokens, 100);
  assert.equal(s.by_exploration_subcategory[0].subcategory, 'source_discovery');
  assert.equal(s.reconciliation.status.matched, 1);
  const rows = publicRows([r1, r2, r3, roll]);
  assert.equal(rows.length, 3);
  assert.equal(rows.reduce((n, r) => n + r.events, 0), 3);
  assert.ok(rows.every((r) => r.unknown_reasons.every((x) => typeof x === 'string')));
  assert.doesNotThrow(() => assertPublic({ rows }, 'rows'));
});

test('prompt metadata is local-only and raw prompt content is written only when explicitly requested', () => {
  const dir = path.join(tmp, 'session'); fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, 'p.jsonl');
  const long = `## Objective\nImplement this.\n## Acceptance criteria\n- pass\n${'x '.repeat(300)}`;
  const lines = [
    { type: 'assistant', timestamp: '2026-01-01T00:00:00Z', version: '2.1.0', message: { id: 'm1', model: 'claude-test', usage: { input_tokens: 10, output_tokens: 5 }, content: [{ type: 'tool_use', id: 't1', name: 'Read', input: { file_path: '/x' } }] } },
    { type: 'user', timestamp: '2026-01-01T00:00:01Z', message: { content: 'Fix the failing test.' } },
    { type: 'user', timestamp: '2026-01-01T00:00:02Z', message: { content: long } },
    { type: 'user', timestamp: '2026-01-01T00:00:03Z', message: { content: [{ type: 'tool_result', tool_use_id: 't1', content: 'ok' }] } },
  ];
  fs.writeFileSync(file, `${lines.map((l) => JSON.stringify(l)).join('\n')}\n`);
  const provFile = path.join(tmp, 'prov.json');
  const contentDir = path.join(tmp, 'private-content');
  const run = (extra = []) => spawnSync(process.execPath, [path.join(process.cwd(), 'scripts/session-usage.mjs'), '--provenance', provFile, '--inspect-artifacts', ...extra, file], { cwd: process.cwd(), encoding: 'utf8' });
  const r = run(['--prompt-content', contentDir]);
  assert.equal(r.status, 0, r.stderr);
  const prov = JSON.parse(fs.readFileSync(provFile, 'utf8'));
  const session = prov.sessions[0];
  assert.equal(session.prompts.length, 2);
  assert.equal(session.prompts[0].purpose, 'short_instruction');
  assert.equal(session.prompts[1].purpose, 'implementation_specification');
  assert.ok(session.prompts.every((p) => !JSON.stringify(p).includes('Fix the failing test')));
  assert.ok(session.prompts.every((p) => p.capture === 'content' && p.content_file));
  const contentFiles = fs.readdirSync(contentDir);
  assert.equal(contentFiles.length, 2);
  assert.ok(fs.readFileSync(path.join(contentDir, contentFiles[0]), 'utf8').length > 0);
  const noContent = path.join(tmp, 'prov-meta.json');
  const r2 = spawnSync(process.execPath, [path.join(process.cwd(), 'scripts/session-usage.mjs'), '--provenance', noContent, file], { cwd: process.cwd(), encoding: 'utf8' });
  assert.equal(r2.status, 0, r2.stderr);
  const meta = JSON.parse(fs.readFileSync(noContent, 'utf8'));
  assert.ok(meta.sessions[0].prompts.every((p) => p.capture === 'metadata' && !p.content_file));
  assert.equal(meta.capture, 'metadata');
});

test('public allowlist rejects prompt text, raw paths and a bare reason field while keeping aggregates', () => {
  const e = makeEvent(baseEvent({ private: { prompt: 'SECRET', transcript: '/Users/x/.claude/projects/a' }, provenance: { version: '1.0.0', capture: 'metadata', prompts: 1, prompt_bytes: 10, completeness: 'partial' } }));
  const pub = publicEvent(e);
  assert.equal(JSON.stringify(pub).includes('SECRET'), false);
  assert.equal(JSON.stringify(pub).includes('/Users/'), false);
  assert.doesNotThrow(() => assertPublic({ event: pub }, 'event'));
  assert.throws(() => assertPublic({ prompt: 'raw' }), /forbidden public field/);
  assert.throws(() => assertPublic({ reasons: [{ reason: 'x' }] }), /forbidden public field/);
});
