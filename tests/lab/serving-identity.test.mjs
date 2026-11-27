// Tests for tools/compare/serving-identity.mjs: before a result is accepted, the DDEV project, the web container and the web server
// must all be this checkout. A stand-in for ddev (a function) and for HTTP (a function); temp folders only, no DDEV, no network.
//   node --test tests/lab/serving-identity.test.mjs
import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { projectCheck, containerCheck, httpCheck, databaseIdentity, identifyingFiles, servingIdentity } from '../../tools/compare/serving-identity.mjs';

const tmp = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'serving-id-')));
after(() => fs.rmSync(tmp, { recursive: true, force: true }));
const write = (f, t) => { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, t); };
const sha = (f) => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const site = (name) => {
  const dir = path.join(tmp, 'envs', name);
  write(path.join(dir, 'core/lib/Drupal.php'), `<?php // ${name}\n`); write(path.join(dir, 'core/misc/a.js'), `// ${name}\n`);
  write(path.join(dir, 'sites/default/settings.php'), "<?php\n$databases['default']['default'] = ['driver' => 'sqlite', 'database' => 'sites/default/files/.sqlite', 'username' => 'u', 'password' => 'secret'];\n");
  fs.mkdirSync(path.join(dir, 'sites/default/files'), { recursive: true });
  return dir;
};
const raw = (name, dir, extra = {}) => ({ name: `repro-${name}`, approot: dir, status: 'running', primary_url: `https://repro-${name}.ddev.site`, hostname: `repro-${name}.ddev.site`, database_type: 'sqlite',
  dbinfo: { username: 'db', password: 'db', dbname: 'db', host: 'db' }, services: { web: { full_name: `ddev-repro-${name}-web`, image: 'ddev/ddev-webserver:v1.25.5' } }, ...extra });
// A stand-in DDEV: describe answers with `answer`; exec sha256sum hashes the files of `containerDir` (what the container holds).
const ddevFor = (answer, containerDir) => (dir, args) => {
  if (args[0] === 'describe') return { status: 0, stdout: `{"level":"warning","msg":"x"}\n${JSON.stringify({ raw: answer })}\n` };
  if (args[0] === 'exec' && args[1].startsWith('sha256sum ')) {
    const files = [...args[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
    return { status: 0, stdout: files.map((f) => `${sha(path.join(containerDir, f))}  ${f}`).join('\n') };
  }
  return { status: 1, stderr: 'unexpected' };
};

test('project: the folder\'s own project, running, passes; a fallback to another project, a wrong name or a stopped site does not', () => {
  const dir = site('zz-a-before'), other = site('zz-b-before');
  assert.deepEqual(projectCheck({ env: 'zz-a-before', dir, ddev: ddevFor(raw('zz-a-before', dir)) }).problems, []);
  const fallback = projectCheck({ env: 'zz-a-before', dir, ddev: ddevFor(raw('zz-b-before', other)) }).problems;
  assert.equal(fallback.length, 1);
  assert.match(fallback[0], /DDEV answered from .*zz-a-before with project repro-zz-b-before at .*zz-b-before, not this folder.*cd .*zz-a-before && ddev config --project-name=repro-zz-a-before/);
  assert.match(projectCheck({ env: 'zz-a-before', dir, ddev: ddevFor(raw('zz-x', dir)) }).problems[0], /project in .* is repro-zz-x, but zz-a-before should be repro-zz-a-before/);
  assert.match(projectCheck({ env: 'zz-a-before', dir, ddev: ddevFor(raw('zz-a-before', dir, { status: 'stopped' })) }).problems[0], /is stopped, not running/);
  assert.match(projectCheck({ env: 'zz-a-before', dir, ddev: () => ({ status: 1, stderr: 'Could not connect to a Docker provider' }) }).problems[0], /DDEV gave no project description .*Docker provider/);
});

test('container: same bytes pass; another installation\'s bytes are named file by file', () => {
  const dir = site('zz-c-before'), other = site('zz-d-before'), files = identifyingFiles(dir, tmp, []);
  assert.deepEqual(files, ['core/lib/Drupal.php']);
  assert.deepEqual(containerCheck({ dir, files, ddev: ddevFor(null, dir) }), { checked: 1, problems: [] });
  assert.match(containerCheck({ dir, files, ddev: ddevFor(null, other) }).problems[0], /web container's copy differs from this checkout for core\/lib\/Drupal\.php/);
  assert.match(containerCheck({ dir, files, ddev: () => ({ status: 1, stderr: 'no such container' }) }).problems[0], /could not read the files in the web container \(no such container\)/);
});

test('identifying files: core\'s Drupal.php plus every file the side\'s patches touch that exists', () => {
  const dir = site('zz-e-after');
  write(path.join(tmp, 'p/x.patch'), 'diff --git a/core/misc/a.js b/core/misc/a.js\n--- a/core/misc/a.js\n+++ b/core/misc/a.js\n@@ -1 +1 @@\n-x\n+y\ndiff --git a/core/gone.txt b/core/gone.txt\n');
  assert.deepEqual(identifyingFiles(dir, tmp, ['p/x.patch', 'p/missing.patch']), ['core/lib/Drupal.php', 'core/misc/a.js']);
});

test('HTTP: the server must return the one-off file written into this checkout; it is removed whatever happens', async () => {
  const dir = site('zz-f-before'), filesDir = path.join(dir, 'sites/default/files');
  const serveFrom = (root) => async (p) => { const f = path.join(root, p.replace(/^\//, '')); return fs.existsSync(f) ? { status: 200, body: fs.readFileSync(f, 'utf8') } : { status: 404, body: '' }; };
  const ok = await httpCheck({ env: 'zz-f-before', dir, raw: raw('zz-f-before', dir), get: serveFrom(dir) });
  assert.deepEqual(ok, { basePath: '/', problems: [] });
  const other = site('zz-g-before');
  const wrong = await httpCheck({ env: 'zz-f-before', dir, raw: raw('zz-f-before', dir), get: serveFrom(other), waitMs: 1200 });
  assert.match(wrong.problems[0], /https:\/\/repro-zz-f-before\.ddev\.site did not serve a file written into .*zz-f-before \(HTTP 404\): the URL is answered by another installation/);
  const sub = await httpCheck({ env: 'zz-f-before', dir, raw: raw('zz-f-before', dir, { primary_url: 'https://h.ddev.site/subdirectory/' }), get: async (p) => ({ status: 200, body: p.startsWith('/subdirectory/') ? fs.readFileSync(path.join(dir, p.replace('/subdirectory/', '')), 'utf8') : '' }) });
  assert.deepEqual(sub, { basePath: '/subdirectory', problems: [] }, 'a base path in the URL is used and recorded');
  assert.deepEqual(fs.readdirSync(filesDir), [], 'no identity file is left behind');
  fs.rmSync(filesDir, { recursive: true });
  assert.match((await httpCheck({ env: 'zz-f-before', dir, raw: raw('zz-f-before', dir), get: serveFrom(dir) })).problems[0], /does not exist \(is the site installed\?\)/);
});

test('database identity says what and where, never a user name or password', () => {
  const dir = site('zz-h-before');
  const db = databaseIdentity(raw('zz-h-before', dir), dir);
  assert.deepEqual(db, { type: 'sqlite', version: null, file: 'sites/default/files/.sqlite' });
  fs.rmSync(path.join(dir, 'sites/default/settings.php'));
  const mysql = databaseIdentity(raw('zz-h-before', dir, { database_type: 'mariadb', database_version: '10.11' }), dir);
  assert.deepEqual(mysql, { type: 'mariadb', version: '10.11', host: 'db', name: 'db' });
  assert.doesNotMatch(JSON.stringify([db, mysql]), /secret|password|username/);
});

test('servingIdentity: a full record when everything is this checkout; the first mismatch stops the checks', async () => {
  const dir = site('zz-i-after'), other = site('zz-j-after');
  const ok = await servingIdentity({ side: 'after', env: 'zz-i-after', dir, labRoot: tmp, ddev: ddevFor(raw('zz-i-after', dir), dir), get: async (p) => ({ status: 200, body: fs.readFileSync(path.join(dir, p.slice(1)), 'utf8') }) });
  assert.deepEqual(ok.problems, []);
  assert.equal(ok.record.ddevProject, 'repro-zz-i-after'); assert.equal(ok.record.container.name, 'ddev-repro-zz-i-after-web');
  assert.equal(ok.record.containerFiles.checked, 1); assert.equal(ok.record.http, 'served a file written into this checkout'); assert.equal(ok.record.basePath, '/');
  assert.doesNotMatch(JSON.stringify(ok.record), /password|secret/);
  const stale = await servingIdentity({ side: 'after', env: 'zz-i-after', dir, labRoot: tmp, ddev: ddevFor(raw('zz-i-after', dir), other), get: async () => { throw new Error('HTTP must not be reached'); } });
  assert.equal(stale.problems.length, 1); assert.match(stale.problems[0], /container's copy differs/);
  const noHttp = await servingIdentity({ side: 'after', env: 'zz-i-after', dir, labRoot: tmp, ddev: ddevFor(raw('zz-i-after', dir), dir), http: false });
  assert.equal(noHttp.record.http, 'not checked');
});
