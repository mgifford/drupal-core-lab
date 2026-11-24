// Mutagen snapshot parsing and the optional public measurement. No DDEV or Docker.
import test from 'node:test';
import assert from 'node:assert/strict';
import { parseMutagenStatus } from '../../tools/resource/adapters/mutagen.mjs';
import { makeEvent, publicEvent, validateEvent } from '../../tools/resource/events.mjs';
import { aggregate } from '../../tools/resource/aggregate.mjs';
import { assertPublic } from '../../tools/resource/public.mjs';

const text = `Mutagen: ok:
--------------------------------------------------------------------------------
Name: repro-issue-3619127-vanilla
Identifier: sync_x
Configuration:
	Synchronization mode: Two Way Resolved
Synchronizable contents:
	10766 directories
	67764 files (460 MB)
Synchronizable contents:
	10766 directories
	67764 files (460 MB)
Status: Watching for changes
`;

test('parses the session file count, declared size and status', () => {
  assert.deepEqual(parseMutagenStatus(text), { name: 'repro-issue-3619127-vanilla', status: 'Watching for changes', files: 67764, size: '460 MB', bytes: 460000000 });
  assert.equal(parseMutagenStatus('nothing here').files, null);
});

test('a Mutagen event validates and exposes only aggregate snapshot data publicly', () => {
  const e = makeEvent({
    event_type: 'process', occurred_at: '2026-11-24T10:00:00Z', duration_ms: 12,
    issue: '3619127', task: { id: 'mutagen-status:test', label: 'test' }, activity: 'infrastructure', tool: 'ddev-mutagen',
    source: { adapter: 'mutagen-status', method: 'test', confidence: 'measured', reference: null },
    measurements: { mutagen: { files: 67764, bytes: 460000000, sessions: 1, measurement: 'sampled' } },
    quality: { completeness: 'partial', missing: [], notes: [] },
    private: { project: 'repro-issue-3619127-vanilla', status: 'Watching for changes' },
  });
  assert.doesNotThrow(() => validateEvent(e));
  const pub = publicEvent(e);
  assert.deepEqual(pub.mutagen, { files: 67764, bytes: 460000000, sessions: 1, measurement: 'sampled' });
  assert.doesNotMatch(JSON.stringify(pub), /repro-issue/);
  assert.doesNotThrow(() => assertPublic(pub, 'public mutagen event'));
});

test('aggregate keeps the latest snapshot per variant, without private project paths', () => {
  const event = (issue, variant, files, bytes, at) => makeEvent({
    event_type: 'process', occurred_at: at, issue, variant, task: { id: `mutagen-status:${variant || issue}`, label: 'status' },
    activity: 'infrastructure', tool: 'ddev-mutagen', source: { adapter: 'mutagen-status', method: 'test', confidence: 'measured', reference: null },
    measurements: { mutagen: { files, bytes, sessions: 1, measurement: 'sampled' } }, quality: { completeness: 'partial', missing: [] },
    private: { project: 'repro-local-name' },
  });
  const s = aggregate([event('3619127', null, 100, 200, '2026-11-24T10:00:00Z'), event('3619127', null, 120, 240, '2026-11-24T10:01:00Z')]);
  assert.equal(s.infrastructure.mutagen.samples, 2);
  assert.deepEqual(s.infrastructure.mutagen.snapshots.map((x) => [x.label, x.files, x.bytes]), [['issue-3619127', 120, 240]]);
  assert.doesNotMatch(JSON.stringify(s.infrastructure.mutagen), /repro-local/);
});
