// Tests for targeted repair of an issue pack (AI-usage, the brief's Phase 2): tools/compare/pack-edit.mjs and `issue-pack.mjs edit|sync-issue|validate --targeted`.
// Recorded packs only: no network, no model. Run: node --test tests/issue-pack/pack-edit.test.mjs
import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { isDeepStrictEqual } from 'node:util';
import { labRoot } from '../../tools/compare/lib.mjs';
import { validatePack, loadYaml, repairMessage } from '../../tools/compare/pack-validate.mjs';
import { packHash, parseEdit, applyOps, applyEdit, dumpPack, atToTokens, targetedRepairMessage, issueSyncEdit, EDIT_VERSION } from '../../tools/compare/pack-edit.mjs';

const yaml = loadYaml();
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'pack-edit-test-')), cacheDir = path.join(labRoot, '.lab-cache/sources/99000014');
after(() => { fs.rmSync(tmp, { recursive: true, force: true }); fs.rmSync(cacheDir, { recursive: true, force: true }); });
const FIX = (...p) => path.join(labRoot, 'tests/issue-pack/fixtures', ...p);
const verified = fs.readFileSync(FIX('verified-3618230/PACK.yml'), 'utf8'), load = (t) => yaml.load(t, { schema: yaml.CORE_SCHEMA }), good = load(verified);
const val = (t) => validatePack(t, { yaml });
const edit = (text, ops) => ({ pack_edit_version: EDIT_VERSION, base: packHash(text), ops });
const at = (doc, ptr) => ptr.slice(1).split('/').reduce((n, k) => n[k], doc);
// a pack with one field made wrong, written the way the tool writes packs
const broken = (ptr, bad) => { const d = structuredClone(good), t = ptr.slice(1).split('/'), last = t.pop(); t.reduce((n, k) => n[k], d)[last] = bad; return dumpPack(d, yaml); };
const run = (...a) => spawnSync('node', [path.join(labRoot, 'scripts/issue-pack.mjs'), ...a], { cwd: labRoot, encoding: 'utf8' });

test('the verified pack is valid, and writing it again keeps every value', () => {
  assert.equal(val(verified).errors.length, 0); assert.ok(isDeepStrictEqual(load(dumpPack(good, yaml)), good));
});

test('a one-field correction changes that field and nothing else, for each kind of field', () => {
  const cases = [['/issue/fork_branch', 'bad branch!', /fork_branch/], ['/issue/title', 'x', /issue\.title/], ['/issue/url', 'https://example.com/x', /issue\.url/], ['/sources/0/note', 'see <b>this</b> issue', /sources\[0\]\.note/], ['/variant/expected', 'x', /expected/]];
  for (const [ptr, bad, re] of cases) {
    const text = broken(ptr, bad), before = val(text); assert.ok(before.errors.some((e) => re.test(e.at)), `${ptr} is reported: ${JSON.stringify(before.errors)}`);
    const r = applyEdit(text, edit(text, [{ op: 'test', path: ptr, value: bad }, { op: 'replace', path: ptr, value: at(good, ptr) }]), { yaml, requireValid: true });
    assert.equal(r.ok, true, `${ptr}: ${r.problems}`); assert.deepEqual(r.touched, [ptr]); assert.ok(isDeepStrictEqual(load(r.text), good), `${ptr}: every other value is as in the verified pack`); assert.equal(val(r.text).errors.length, 0);
  }
});

test('a stale edit fails, and an edit whose later operation fails applies none of its earlier ones', () => {
  const text = broken('/issue/fork_branch', 'bad branch!'), e = edit(text, [{ op: 'replace', path: '/issue/fork_branch', value: 'ok-branch' }]);
  const changed = text.replace('title:', 'title:  ');   // the pack was edited by someone else after the repair message was made
  assert.notEqual(packHash(changed), packHash(text)); const r = applyEdit(changed, e, { yaml }); assert.equal(r.ok, false); assert.match(r.problems[0], /stale edit: it was made for pack [0-9a-f]{12} and the pack is now/); assert.equal(r.text, null);
  const doc = structuredClone(good), snapshot = structuredClone(doc);
  const ops = applyOps(doc, [{ op: 'replace', path: '/issue/title', value: 'Changed title' }, { op: 'test', path: '/issue/nid', value: 'not the nid' }]);
  assert.equal(ops.ok, false); assert.match(ops.problems[0], /test failed/); assert.ok(isDeepStrictEqual(doc, snapshot), 'the input is untouched');
  const two = applyEdit(text, edit(text, [{ op: 'replace', path: '/issue/title', value: 'Another title here' }, { op: 'test', path: '/issue/nid', value: '1' }]), { yaml }); assert.equal(two.ok, false); assert.equal(two.text, null);
});

test('an invalid edit is refused and the pack stays as it was: unknown operation, field, path, name, type, size', () => {
  const text = broken('/issue/fork_branch', 'bad branch!'), E = (ops) => applyEdit(text, edit(text, ops), { yaml }), refused = (r, re) => { assert.equal(r.ok, false); assert.equal(r.text, null); assert.match(r.problems.join('\n'), re); };
  refused(E([{ op: 'move', from: '/issue/title', path: '/issue/url' }]), /op must be one of add, remove, replace, test/); refused(E([{ op: 'copy', path: '/issue/x', value: 1 }]), /op must be one of/);
  refused(E([{ op: 'replace', path: '/issue/nope', value: 'x' }]), /there is no field "nope" there/); refused(E([{ op: 'replace', path: '/variant/checks/99/probe', value: 'x' }]), /does not exist in the pack|no item/);
  refused(E([{ op: 'add', path: '/issue/hacked', value: 'x' }]), /would introduce 1 validator error.*issue\.hacked: is not a known key/s); refused(E([{ op: 'add', path: '/surprise', value: 'x' }]), /not a known top-level key/);
  refused(E([{ op: 'replace', path: '/pack_version', value: 2 }]), /pack_version is not editable`?|not editable/); refused(E([{ op: 'replace', path: '/__proto__/x', value: 1 }]), /may not name __proto__/);
  refused(E([{ op: 'replace', path: '/issue/nid', value: 12 }]), /introduce.*issue\.nid/s); refused(E([{ op: 'replace', path: 'issue/title', value: 'x' }]), /JSON Pointer/);
  refused(E([{ op: 'replace', path: '/issue/title' }]), /needs a value/); refused(E([{ op: 'remove', path: '/issue/title', value: 'x' }]), /remove takes no value/);
  refused(E(Array.from({ length: 21 }, () => ({ op: 'test', path: '/issue/nid', value: '3618230' }))), /at most 20 operations/); refused(E([{ op: 'replace', path: '/issue/title', value: 'x'.repeat(30000) }]), /larger than 24000 bytes/);
  refused(applyEdit(text, { ...edit(text, [{ op: 'test', path: '/issue/nid', value: '3618230' }]), extra: 1 }, { yaml }), /unknown field "extra"/); refused(applyEdit(text, { pack_edit_version: 2, base: packHash(text), ops: [] }, { yaml }), /pack_edit_version must be 1/);
  refused(applyEdit(text, '{not json or yaml: [', { yaml }), /neither JSON nor YAML|an edit is an object/); refused(applyEdit(text, { pack_edit_version: 1, base: 'nope', ops: [{ op: 'test', path: '/issue/nid', value: '1' }] }, { yaml }), /12-character pack hash/);
  refused(applyEdit('issue: [unclosed', edit('issue: [unclosed', [{ op: 'test', path: '/issue/nid', value: '1' }]), { yaml }), /not valid YAML, so it cannot be edited field by field/);
  // through the command: the file is byte for byte as it was and nothing else appears next to it
  const f = path.join(tmp, 'cli-pack.yml'); fs.writeFileSync(f, text); const e = path.join(tmp, 'bad-edit.json'); fs.writeFileSync(e, JSON.stringify(edit(text, [{ op: 'add', path: '/issue/hacked', value: 'x' }])));
  const r = run('edit', f, e); assert.equal(r.status, 1); assert.match(r.stderr, /Not applied; .* is as it was/); assert.equal(fs.readFileSync(f, 'utf8'), text); assert.deepEqual(fs.readdirSync(tmp).filter((x) => x.startsWith('cli-pack')), ['cli-pack.yml']);
});

test('the assembled pack passes the existing validation; --require-valid refuses an edit that leaves errors, the default accepts progress', () => {
  const d = structuredClone(good); d.issue.fork_branch = 'bad branch!'; d.issue.title = 'x'; const text = dumpPack(d, yaml); assert.equal(val(text).errors.length, 2);
  const one = edit(text, [{ op: 'replace', path: '/issue/fork_branch', value: good.issue.fork_branch }]);
  const strict = applyEdit(text, one, { yaml, requireValid: true }); assert.equal(strict.ok, false); assert.match(strict.problems[0], /still have 1 error\(s\), and --require-valid was given/); assert.equal(strict.text, null);
  const progress = applyEdit(text, one, { yaml }); assert.equal(progress.ok, true); assert.equal(progress.after.errors.length, 1); assert.deepEqual(progress.fixed.map((x) => x.at), ['issue.fork_branch']);
  const both = applyEdit(progress.text, edit(progress.text, [{ op: 'replace', path: '/issue/title', value: good.issue.title }]), { yaml, requireValid: true }); assert.equal(both.ok, true); assert.equal(val(both.text).errors.length, 0); assert.ok(isDeepStrictEqual(load(both.text), good));
});

test('an unsupported setup stays explicit: it cannot be invented, and the way out is to name it under needs, where the validator keeps warning about it', () => {
  const d = structuredClone(good); d.setup = [{ use: 'time_machine', params: { when: 'yesterday' } }]; delete d.recipe; const text = dumpPack(d, yaml); const before = val(text);
  assert.ok(before.errors.some((x) => x.at === 'setup[0].use' && /not a building block in the catalogue/.test(x.msg)), `the validator names it: ${JSON.stringify(before.errors)}`);
  assert.match(targetedRepairMessage(before, text, { yaml }), /list it under needs and write the step as "set X by hand"/);
  const invented = applyEdit(text, edit(text, [{ op: 'add', path: '/setup/-', value: { use: 'warp_drive', params: {} } }]), { yaml }); assert.equal(invented.ok, false, 'another block that is not in the catalogue is refused'); assert.match(invented.problems[0], /warp_drive.*not a building block/s);
  const why = 'The issue needs the clock set to yesterday; the person sets it by hand.';
  const explicit = applyEdit(text, edit(text, [{ op: 'replace', path: '/setup/0', value: { use: 'article_content_type' } }, { op: 'add', path: '/needs', value: [{ block: 'time_machine', why }] }]), { yaml });
  assert.equal(explicit.ok, true, JSON.stringify(explicit.problems)); const out = load(explicit.text); assert.deepEqual(out.needs, [{ block: 'time_machine', why }]); assert.ok(!JSON.stringify(out.setup).includes('time_machine'));
  assert.deepEqual(explicit.after.errors, []); assert.ok(explicit.after.warnings.some((x) => x.at === 'needs[0]' && /does not exist yet: time_machine/.test(x.msg)), 'the missing block is still reported, not hidden');
});

test('every committed valid pack reads back to the same values, so old packs import as before', () => {
  const files = [FIX('verified-3618230/PACK.yml'), path.join(labRoot, 'docs/examples/issue-pack-3415961.yml'), FIX('packs/example-free-form-recipe.yml'), ...fs.readdirSync(path.join(labRoot, 'reports/issues')).map((d) => path.join(labRoot, 'reports/issues', d, 'PACK.yml')).filter((f) => fs.existsSync(f))];
  let n = 0;
  for (const f of files) {
    const t = fs.readFileSync(f, 'utf8'), v0 = val(t); if (v0.errors.length) continue; n++;
    const r = applyEdit(t, edit(t, [{ op: 'test', path: '/issue/nid', value: load(t).issue.nid }]), { yaml });
    assert.equal(r.ok, true, `${path.relative(labRoot, f)}: ${r.problems}`); assert.ok(isDeepStrictEqual(load(r.text), load(t)), `${path.relative(labRoot, f)}: same values`);
    const v1 = val(r.text); assert.deepEqual(v1.errors, v0.errors); assert.deepEqual(v1.warnings, v0.warnings);
  }
  assert.ok(n >= 3, `${n} valid packs checked`);
});

test('YAML writing keeps multi-line and awkward text exactly, as readable literal blocks', () => {
  const tricky = {
    multi: 'first line\n  indented line\n\nafter a blank line\n', noTrailing: 'one\ntwo', colon: 'key: value # not a comment', quotes: `it's "quoted" and 'single'`, long: 'word '.repeat(80).trim(), unicode: 'café — “curly” ✓', leadingSpace: '  starts with spaces',
    trailingSpace: 'ends with spaces  ', looksNumber: '0123', looksBool: 'yes', looksNull: 'null', tilde: '~', sci: '1e3', empty: '', onlySpaces: '   ', dash: '- not a list', bracket: '[not, a, list]', brace: '{not: map}', pipeStart: '| not a block', hash: '#start', tab: 'a\tb', crlf: 'a\r\nb\r\n',
    list: ['x: y', 'multi\nline\n'], nested: { deep: { text: 'line one\nline two\n' } },
  };
  const out = dumpPack(tricky, yaml); assert.ok(isDeepStrictEqual(load(out), tricky), 'every value reads back identical');
  assert.match(out, /multi: \|\n {2}first line\n/, 'multi-line text is a literal block, readable'); assert.ok(!/word word word.*\n\s+word/.test(out), 'a long line is not folded');
  const text = broken('/issue/fork_branch', 'bad branch!'), step = at(good, '/variant/steps/0'), hasText = typeof step === 'object' && 'text' in step;
  const val2 = 'Open the form.\n  - then press Tab\nKeep this: yes # not a comment\n';
  const r = applyEdit(text, edit(text, [{ op: 'replace', path: '/issue/fork_branch', value: good.issue.fork_branch }, ...(hasText ? [{ op: 'replace', path: '/variant/steps/0/text', value: val2 }] : [])]), { yaml });
  assert.equal(r.ok, true, `${r.problems}`); if (hasText) assert.equal(load(r.text).variant.steps[0].text, val2);
});

test('the repair message names the field, its path and its current value, carries the pack hash, and is not the pack', () => {
  const text = broken('/variant/expected', 'x'), v = val(text), msg = targetedRepairMessage(v, text, { yaml });
  assert.ok(msg.includes(packHash(text))); assert.match(msg, /path: \/variant\/expected\n   now: "x"/); assert.match(msg, /Reply format, for example:/); assert.ok(msg.length < text.length / 2, `${msg.length} bytes against a ${text.length} byte pack`);
  assert.deepEqual(atToTokens('variant.checks[0].probe', good) && atToTokens('variant.checks[0].probe', good).slice(0, 2), ['variant', 'checks']); assert.deepEqual(atToTokens('recipe.files.recipe.yml', good), ['recipe', 'files', 'recipe.yml']); assert.equal(atToTokens('nope.here', good), null);
  const f = path.join(tmp, 'unreadable.yml'); fs.writeFileSync(f, 'issue: [unclosed'); const r = run('validate', f, '--repair', '--targeted', '--no-copy'); assert.match(r.stdout, /not readable YAML, so it cannot be repaired field by field: the message asks for the whole file/); assert.match(r.stdout, /send the complete corrected file again/);
  const g = path.join(tmp, 'ok-pack.yml'); fs.writeFileSync(g, text); const t = run('validate', g, '--repair', '--targeted', '--no-copy'); assert.match(t.stdout, /Do NOT send the pack again/); assert.match(t.stdout, new RegExp(packHash(text)));
  assert.equal(run('validate', g, '--repair', '--targeted', '--recipe', FIX('verified-3618230/../../../../recipes/repro_3618230'), '--no-copy').status === 0, false);
});

test('the command applies a good edit atomically, keeps the old file, and a dry run writes nothing', () => {
  const text = broken('/issue/fork_branch', 'bad branch!'), f = path.join(tmp, 'apply-pack.yml'), e = path.join(tmp, 'good-edit.json'); fs.writeFileSync(f, text);
  fs.writeFileSync(e, JSON.stringify(edit(text, [{ op: 'test', path: '/issue/fork_branch', value: 'bad branch!' }, { op: 'replace', path: '/issue/fork_branch', value: good.issue.fork_branch }])));
  let r = run('edit', f, e, '--dry-run'); assert.equal(r.status, 0, r.stderr + r.stdout); assert.match(r.stdout, /dry run: nothing written/); assert.equal(fs.readFileSync(f, 'utf8'), text);
  r = run('edit', f, e, '--require-valid'); assert.equal(r.status, 0, r.stderr + r.stdout); assert.match(r.stdout, /Fixed: issue\.fork_branch/); assert.ok(isDeepStrictEqual(load(fs.readFileSync(f, 'utf8')), good));
  assert.equal(fs.readFileSync(`${f}.before-${packHash(text)}`, 'utf8'), text, 'the old file is kept'); assert.ok(!fs.readdirSync(tmp).some((x) => x.endsWith('.tmp')), 'no temporary file is left');
  r = run('edit', f, e); assert.equal(r.status, 1); assert.match(r.stderr, /stale edit/, 'the same edit again is stale: the pack is no longer the one it was made for');
});

test('facts the fetch already knows are set from the fetch, not typed by a model; another issue number is refused', () => {
  const snap = { nid: '3618230', url: 'https://www.drupal.org/project/drupal/issues/3618230', node: { title: good.issue.title }, mr: { branch: good.issue.fork_branch, iid: '16777' } };
  assert.equal(issueSyncEdit(verified, snap, { yaml }).edit, null, 'an agreeing pack needs no edit');
  const d = structuredClone(good); d.issue.title = 'A title the assistant made up'; d.issue.fork_branch = '3618230-wrong'; delete d.issue.merge_request; const text = dumpPack(d, yaml);
  const { edit: e } = issueSyncEdit(text, snap, { yaml }); assert.deepEqual(e.ops.map((o) => `${o.op} ${o.path}`), ['test /issue/title', 'replace /issue/title', 'test /issue/fork_branch', 'replace /issue/fork_branch', 'add /issue/merge_request']);
  const r = applyEdit(text, e, { yaml, requireValid: true }); assert.equal(r.ok, true, `${r.problems}`); assert.ok(isDeepStrictEqual(load(r.text), good));
  assert.match(issueSyncEdit(text, { ...snap, nid: '3618231' }, { yaml }).problems[0], /pack is for issue 3618230 and the snapshot is for 3618231/);
  fs.mkdirSync(cacheDir, { recursive: true }); fs.writeFileSync(path.join(cacheDir, 'snapshot.json'), JSON.stringify({ ...snap, nid: '99000014' }));
  const f = path.join(tmp, 'sync-pack.yml'); const wrongNid = structuredClone(d); wrongNid.issue.nid = '99000014'; wrongNid.issue.url = 'https://www.drupal.org/project/drupal/issues/99000014'; fs.writeFileSync(f, dumpPack(wrongNid, yaml));
  const cli = run('sync-issue', f); assert.equal(cli.status, 0, cli.stderr); assert.match(cli.stdout, /differs from the fetched issue/); assert.equal(fs.readFileSync(f, 'utf8'), dumpPack(wrongNid, yaml), 'without --write nothing changes');
  assert.equal(run('sync-issue', path.join(tmp, 'nope.yml')).status, 2);
});

test('MECHANICAL: the reply for a one-field correction is far smaller than the whole pack, and the whole repair turn is smaller too', () => {
  const text = broken('/issue/fork_branch', 'bad branch!'), v = val(text);
  const fullTurn = Buffer.byteLength(repairMessage(v)) + Buffer.byteLength(text), reply = JSON.stringify(edit(text, [{ op: 'test', path: '/issue/fork_branch', value: 'bad branch!' }, { op: 'replace', path: '/issue/fork_branch', value: good.issue.fork_branch }]));
  const targetedTurn = Buffer.byteLength(targetedRepairMessage(v, text, { yaml })) + Buffer.byteLength(reply);
  assert.ok(Buffer.byteLength(reply) < Buffer.byteLength(text) * 0.5, `reply ${Buffer.byteLength(reply)} bytes against a ${Buffer.byteLength(text)} byte pack`);
  assert.ok(targetedTurn < fullTurn, `message plus reply ${targetedTurn} bytes against ${fullTurn} (the full reply is a lower bound: it is at least the pack)`);
});
