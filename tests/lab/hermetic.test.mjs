// Tests for tools/compare/hermetic.mjs, the environment scripts/selftest.mjs runs the static checks in: live tools are refusing
// stand-ins that leave a record, only loopback connections and local git remotes work, and git reads no personal configuration.
// Each test makes its own hermetic environment, so its deliberate refusals go to its own log, not to the self-test's.
//   node --test tests/lab/hermetic.test.mjs
import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { hermeticEnv, standIn, readCalls, LIVE_TOOLS, REFUSED } from '../../tools/compare/hermetic.mjs';

const H = hermeticEnv();
after(() => H.cleanup());
const inH = (cmd, args, opts = {}) => spawnSync(cmd, args, { env: H.env, encoding: 'utf8', timeout: 30000, ...opts });

test('every live tool is a refusing stand-in that says what was called and records it', () => {
  for (const tool of LIVE_TOOLS) {
    const r = inH(tool, ['list', '-j']);
    assert.equal(r.status, REFUSED, tool);
    assert.match(r.stderr, new RegExp(`HERMETIC: the static self-test does not run ${tool} \\(called: ${tool} list -j\\)`));
  }
  assert.deepEqual(H.calls().map((c) => c.call), LIVE_TOOLS.map((t) => `${t} list -j`));
});

test('a stand-in a test writes itself comes first on PATH and answers instead', () => {
  const bin = path.join(H.root, 'own'), log = path.join(H.root, 'own.log');
  standIn(bin, 'ddev', { stdout: '{"level":"info","raw":[{"name":"x","approot":"/a b/c"}]}', log });
  const r = inH('ddev', ['list', '-j'], { env: { ...H.env, PATH: `${bin}${path.delimiter}${H.env.PATH}` } });
  assert.equal(r.status, 0); assert.deepEqual(JSON.parse(r.stdout).raw, [{ name: 'x', approot: '/a b/c' }]);
  assert.deepEqual(readCalls(log), [{ call: 'ddev list -j', count: 1 }]);
});

test('Node may reach loopback; any other host is refused before a connection and recorded', async () => {
  const server = http.createServer((q, s) => s.end('local')); await new Promise((r) => server.listen(0, '127.0.0.1', r));
  after(() => server.close());
  const { port } = server.address();
  const code = `const ok = await (await fetch('http://127.0.0.1:${port}/')).text();
    let refused = ''; try { await fetch('https://drupal.org.invalid/x', { signal: AbortSignal.timeout(5000) }); } catch (e) { refused = e.cause?.code || e.code || e.message; }
    console.log(JSON.stringify({ ok, refused }));`;
  const out = await new Promise((resolve) => {
    const child = spawn(process.execPath, ['--input-type=module', '-e', code], { env: H.env }); let o = '';
    child.stdout.on('data', (c) => { o += c; }); child.on('close', () => resolve(o));
  });
  assert.deepEqual(JSON.parse(out), { ok: 'local', refused: 'EHERMETIC' });
  assert.ok(H.calls().some((c) => c.call === 'net drupal.org.invalid:443'), JSON.stringify(H.calls()));
});

test('git clones a local folder but no remote, and reads no personal configuration; bare repositories must be named', () => {
  const src = path.join(H.root, 'src'), bare = path.join(H.root, 'b.git'); fs.mkdirSync(src);
  inH('git', ['init', '-q', src]); fs.writeFileSync(path.join(src, 'a'), 'a');
  inH('git', ['-C', src, 'add', '.']); assert.equal(inH('git', ['-C', src, '-c', 'user.name=t', '-c', 'user.email=t@t', 'commit', '-qm', 'a']).status, 0);
  assert.equal(inH('git', ['clone', '-q', '--bare', src, bare]).status, 0, 'a local clone is allowed');
  const remote = inH('git', ['ls-remote', 'https://example.invalid/x.git']);
  assert.notEqual(remote.status, 0); assert.match(remote.stderr, /transport 'https' not allowed/);
  assert.equal(inH('git', ['config', '--global', '--get', 'user.name']).stdout, '', 'the person\'s global config is not read');
  assert.equal(inH('git', ['config', '--get', 'safe.bareRepository']).stdout.trim(), 'explicit');
  assert.match(inH('git', ['-C', bare, 'rev-parse', 'HEAD']).stderr, /cannot use bare repository/, 'as in agent shells');
  assert.equal(inH('git', [`--git-dir=${bare}`, 'rev-parse', 'HEAD']).status, 0);
});

test('the environment drops inherited Coder, DDEV and git config variables', () => {
  const h = hermeticEnv({ base: { PATH: process.env.PATH, CODER_AGENT_URL: 'x', DDEV_PROJECT: 'y', GIT_CONFIG_COUNT: '1', GIT_CONFIG_KEY_0: 'a.b', GIT_CONFIG_VALUE_0: 'c', HOME: os.homedir() } });
  after(() => h.cleanup());
  for (const k of ['CODER_AGENT_URL', 'DDEV_PROJECT', 'GIT_CONFIG_COUNT', 'GIT_CONFIG_KEY_0', 'GIT_CONFIG_VALUE_0']) assert.equal(h.env[k], undefined, k);
  assert.equal(h.env.GIT_ALLOW_PROTOCOL, 'file'); assert.ok(h.env.PATH.startsWith(h.bin));
});
