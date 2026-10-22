// Tests for the info.yml lab (tests/info-yml/): the fixtures match their generator, every case is complete, and the
// Libraries-style archive holds the release it claims to. No PHP, no site, no network. Run: node --test tests/lab/info-yml.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { spawnSync } from 'node:child_process';
import { labRoot } from '../../tools/compare/lib.mjs';

const fix = path.join(labRoot, 'tests/info-yml/fixtures');
const PARENT_DIR = { module: 'infofix', theme: 'infofix_theme', profile: 'infofix_profile' };

test('the committed fixtures are what make-fixtures.mjs writes', () => {
  const r = spawnSync('node', [path.join(labRoot, 'tests/info-yml/make-fixtures.mjs'), '--check'], { cwd: labRoot, encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr || r.stdout);
});

test('every case in the index has a complete case.json and files for each of its kinds', () => {
  const index = JSON.parse(fs.readFileSync(path.join(fix, 'index.json'), 'utf8'));
  assert.ok(index.length >= 40, `only ${index.length} cases`);
  for (const c of index) {
    const meta = JSON.parse(fs.readFileSync(path.join(fix, c.id, 'case.json'), 'utf8'));
    for (const key of ['id', 'title', 'category', 'kinds', 'expected', 'remove', 'files']) assert.ok(key in meta, `${c.id}: case.json has no ${key}`);
    for (const kind of meta.kinds) {
      assert.ok(meta.files[kind].length > 0, `${c.id}/${kind}: no files`);
      for (const rel of meta.files[kind]) {
        assert.ok(rel.startsWith(`${PARENT_DIR[kind]}/`), `${c.id}/${kind}: ${rel} is outside the extension directory`);
        assert.ok(fs.existsSync(path.join(fix, c.id, kind, rel)), `${c.id}/${kind}: ${rel} is missing`);
      }
    }
  }
});

test('the "missing" cases really lack the key they are named after', () => {
  for (const [id, key] of [['missing-name', 'name'], ['missing-type', 'type'], ['missing-cvr', 'core_version_requirement'], ['missing-cvr-core-8x', 'core_version_requirement']]) {
    for (const kind of Object.keys(PARENT_DIR)) {
      const file = path.join(fix, id, kind, PARENT_DIR[kind], `${PARENT_DIR[kind]}.info.yml`);
      assert.doesNotMatch(fs.readFileSync(file, 'utf8'), new RegExp(`^${key}:`, 'm'), `${id}/${kind} still has ${key}`);
    }
  }
});

test('the Libraries-style archive contains exactly the v2 files', () => {
  const tar = zlib.gunzipSync(fs.readFileSync(path.join(fix, 'libraries-tarball/libfix-1.1.0.tar.gz')));
  const names = [];
  for (let off = 0; off + 512 <= tar.length;) {
    const name = tar.subarray(off, off + 100).toString('utf8').replace(/\0.*$/s, '');
    if (!name) break;
    const size = parseInt(tar.subarray(off + 124, off + 136).toString('ascii').replace(/\0.*$/s, '').trim() || '0', 8);
    if (tar[off + 156] === 0x30) names.push(name);
    off += 512 + Math.ceil(size / 512) * 512;
  }
  const v2 = path.join(fix, 'libraries-tarball/v2');
  const expected = fs.readdirSync(v2, { recursive: true }).filter((f) => fs.statSync(path.join(v2, f)).isFile()).sort();
  assert.deepEqual(names.sort(), expected);
});
