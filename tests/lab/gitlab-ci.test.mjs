// Tests for tools/compare/gitlab-ci.mjs and scripts/mr-pipeline.mjs: reading and classifying a merge request's GitLab pipeline.
// Recorded responses only (tests/fixtures/gitlab-ci/, #2574721, pipeline 1068051, job 13993524); no network. Responses changed for a
// case (a running pipeline, a 401, a 403) are made in the test from the recorded ones and are SYNTHETIC.
//   node --test tests/lab/gitlab-ci.test.mjs
import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { labRoot } from '../../tools/compare/lib.mjs';
import { inspect, renderText, classifyJob, classifyPipeline, revisionOf, redact, plainName, exitCodeOf, CLASSES } from '../../tools/compare/gitlab-ci.mjs';

const FX = path.join(labRoot, 'tests/fixtures/gitlab-ci'), fx = (f) => fs.readFileSync(path.join(FX, f), 'utf8'), fxj = (f) => JSON.parse(fx(f));
const NOW = new Date('2026-11-27T12:00:00Z');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'gitlab-ci-test-'));
after(() => fs.rmSync(tmp, { recursive: true, force: true }));
let n = 0; const cacheRoot = () => path.join(tmp, `cache-${++n}`);

// A fake git.drupalcode.org serving the recorded responses. `over` replaces one by a URL fragment: a string body, or { status, body }.
// Every request is kept with its method and headers, so a test can show that only GETs were sent and no credential was.
const API = 'https://git.drupalcode.org/api/v4/projects', WEB = 'https://git.drupalcode.org';
const ROUTES = {
  [`${API}/issue%2Fdrupal-2574721/repository/branches?search=2574721`]: () => JSON.stringify([{ name: '2574721-provide-access-to' }, { name: 'drupal-2574721' }]),   // names as recorded; other fields left out
  [`${API}/project%2Fdrupal/merge_requests?source_branch=drupal-2574721&scope=all&state=all`]: () => `[${fx('mr-17049.json')}]`,
  [`${API}/project%2Fdrupal/merge_requests?source_branch=2574721-provide-access-to&scope=all&state=all`]: () => '[]',
  [`${API}/project%2Fdrupal/merge_requests/17049`]: () => fx('mr-17049.json'),
  [`${API}/project%2Fdrupal/merge_requests/17049/pipelines`]: () => fx('mr-17049-pipelines.json'),
  [`${API}/project%2Fdrupal/merge_requests/17049/diffs?per_page=100`]: () => fx('mr-17049-diffs.json'),
  [`${API}/project%2Fdrupal/pipelines/1068051`]: () => fx('pipeline-1068051.json'),
  [`${API}/59858/pipelines/1070200`]: () => JSON.stringify({ ...fxj('pipeline-1068051.json'), id: 1070200, sha: '076313bc67afb1f7f3d20f107d68775a0fa2d7df', status: 'success', web_url: `${WEB}/project/drupal/-/pipelines/1070200` }),
  [`${API}/59858/repository/commits/1ec20a6f10b03b74bd303c64168331fc39c4f658`]: () => fx('commit-1ec20a6f.json'),
  [`${API}/59858/pipelines/1068051/jobs?per_page=100&page=1`]: () => fx('pipeline-1068051-jobs.json'),
  [`${API}/59858/pipelines/1068051/test_report_summary`]: () => fx('pipeline-1068051-test-report-summary.json'),
  [`${WEB}/project/drupal/-/pipelines/1068051/tests/suite.json?build_ids%5B%5D=13993524`]: () => fx('suite-13993524.json'),
  [`${WEB}/project/drupal/-/jobs/13993524/trace.json`]: () => fx('trace-13993524.json'),
  [`${API}/issue%2Fdrupal-2574721/pipelines/953903`]: () => fx('pipeline-953903.json'),
  [`${API}/243324/pipelines/953903/jobs?per_page=100&page=1`]: () => fx('pipeline-953903-jobs.json'),
};
function net(over = {}) {
  const seen = [];
  const fetchImpl = async (url, opts = {}) => {
    seen.push({ url, method: opts.method || 'GET', headers: Object.keys(opts.headers || {}).map((h) => h.toLowerCase()) });
    const o = Object.entries(over).find(([k]) => url.includes(k));
    let status = 200, body = null;
    if (o) { const v = typeof o[1] === 'function' ? o[1]() : o[1]; if (v && typeof v === 'object') ({ status, body } = v); else body = v; }
    else if (ROUTES[url]) body = ROUTES[url]();
    if (body === null) { status = status === 200 ? 404 : status; body = '{"message":"404 Not found"}'; }
    return { status, headers: { get: () => null }, text: async () => body };
  };
  return { fetchImpl, seen };
}
const worked = (over, o = {}) => { const f = net(over); return inspect({ nid: '2574721', pipeline: '1068051', fetchImpl: f.fetchImpl, cacheRoot: cacheRoot(), now: NOW, ...o }).then((r) => ({ r, seen: f.seen })); };
const jobsWith = (fn) => JSON.stringify(fxj('pipeline-1068051-jobs.json').map(fn));

test('the worked example: one blocking job, its test and line, the base path as a likely cause and never as a fact', async () => {
  const { r, seen } = await worked();
  assert.equal(r.class, 'BLOCKING_FAILURE');
  assert.deepEqual(r.jobs.filter((j) => j.class === 'BLOCKING_FAILURE').map((j) => j.id), [13993524]);
  const j = r.jobs.find((x) => x.id === 13993524), t = j.tests[0];
  assert.equal(t.name, 'Drupal\\Tests\\system\\Functional\\Form\\ModulesListFormWebTest::testModuleListForm()');
  assert.equal(t.file, 'core/modules/system/tests/src/Functional/Form/ModulesListFormWebTest.php'); assert.equal(t.line, 59);
  assert.match(t.message, /ElementNotFoundException: .*a\[href="\/system-test\/configure\/bar"\]/);
  assert.deepEqual(j.counts, { total: 375, failed: 1, error: 0, skipped: 22, capped: false });
  assert.ok(j.excerpt.some((x) => /FAILURES!/.test(x.text)) && j.excerpt.some((x) => /ERROR: Job failed/.test(x.text)), 'the log excerpt has the failure and the job result');
  assert.ok(!j.excerpt.some((x) => /browser_output/.test(x.text)), 'not the long list of browser output links');
  assert.equal(j.links.browse, 'https://git.drupalcode.org/project/drupal/-/jobs/13993524/artifacts/browse');
  const bp = r.likelyCauses.find((c) => c.cause === 'base-path');
  assert.equal(bp.job, 13993524); assert.match(bp.summary, /"\/system-test\/configure\/bar".*under \/subdirectory\//);
  assert.ok(bp.evidence.some((e) => /^log line \d+: http:\/\/localhost\/subdirectory\/sites\/simpletest\/browser_output\//.test(e)), 'cites the log line');
  assert.equal(r.likelyCauses[0].cause, 'base-path', 'the blocking job\'s cause comes before the allowed failures\'');
  assert.ok(!r.facts.some((f) => /subdirectory/.test(f)), 'the base path is evidence for a likely cause, not stated as a fact');
  assert.ok(r.facts.some((f) => f.includes('ModulesListFormWebTest.php is changed by this merge request')));
  // read-only, anonymous, on the one host
  assert.ok(seen.every((s) => s.method === 'GET' && s.url.startsWith('https://git.drupalcode.org/')), JSON.stringify(seen.filter((s) => s.method !== 'GET')));
  assert.ok(seen.every((s) => !s.headers.some((h) => /authorization|private-token|job-token|cookie/.test(h))), 'no credential is sent');
  assert.ok(!seen.some((s) => /\/test_report(?!_summary)|\/raw\b|api\/v4\/projects\/\d+\/jobs\//.test(s.url)), 'not the 14 MB test report, the S3 redirect or the 401 job API');
  // retry is advice: the job alone, in the browser, no commit
  const retry = r.retry.find((x) => x.job === 13993524).text.join(' ');
  assert.match(retry, /https:\/\/git\.drupalcode\.org\/project\/drupal\/-\/jobs\/13993524.*press Retry/);
  assert.match(retry, /a retry here tests that older merge result again/);
  assert.doesNotMatch(renderText(r), /empty commit|allow-empty|git commit|git push|curl .*POST/i);
  assert.equal(exitCodeOf(r.class), 1);
});

test('pending, manual, skipped and allowed-failure jobs are never shown as failures', async () => {
  const recorded = fxj('pipeline-1068051-jobs.json'), cls = (id) => classifyJob(recorded.find((j) => j.id === id)).class;
  assert.equal(cls(13993538), 'PENDING', 'manual, optional'); assert.equal(cls(13993536), 'UNKNOWN', 'skipped: no result');
  assert.equal(cls(13993531), 'ALLOWED_FAILURE', 'PHP 8.6 Unit failed, allow_failure'); assert.equal(cls(13993524), 'BLOCKING_FAILURE');
  for (const s of ['created', 'pending', 'waiting_for_resource', 'preparing', 'scheduled', 'manual']) assert.equal(classifyJob({ status: s }).class, 'PENDING', s);
  assert.equal(classifyJob({ status: 'running' }).class, 'RUNNING');
  const { r } = await worked(), text = renderText(r);
  assert.equal((text.match(/^Blocking failure:/gm) || []).length, 1);
  assert.match(text, /Allowed failures \(do not block[^\n]*\n {2}- PHPUnit Unit \(Component\): \[8\.6-ubuntu\] \(job 13993533\)/);
  assert.ok(r.facts.some((f) => /6 job\(s\) have not run \(manual 6\); they are not failures/.test(f)));
  // SYNTHETIC: the same pipeline while it runs. Nothing blocking has failed; the allowed failure still does not count.
  const running = await worked({
    'pipelines/1068051/jobs': jobsWith((j) => (j.id === 13993524 ? { ...j, status: 'running', failure_reason: undefined } : j.status === 'success' ? { ...j, status: j.id % 2 ? 'pending' : 'created' } : j)),
    [`${API}/project%2Fdrupal/pipelines/1068051`]: JSON.stringify({ ...fxj('pipeline-1068051.json'), status: 'running' }),
  });
  assert.equal(running.r.class, 'RUNNING'); assert.equal(exitCodeOf('RUNNING'), 3);
  assert.doesNotMatch(renderText(running.r), /^Blocking failure|BLOCKING_FAILURE/m);
  assert.ok(!running.r.requests.some((u) => /trace\.json|suite\.json/.test(u)), 'no log is read for a job that has not failed');
  // SYNTHETIC: success with allowed failures is a pass
  assert.equal(classifyPipeline({ status: 'success' }, [{ class: 'PASS' }, { class: 'ALLOWED_FAILURE' }]).class, 'PASS');
  assert.equal(classifyPipeline({ status: 'pending' }, []).class, 'PENDING');
});

test('a merge-result commit is told apart from a source-branch commit', async () => {
  const { r } = await worked(), rev = r.revision;
  assert.deepEqual({ kind: rev.kind, synthetic: rev.synthetic, sha: rev.sha, source: rev.source, target: rev.target, current: rev.current },
    { kind: 'merge-result', synthetic: true, sha: '1ec20a6f10b03b74bd303c64168331fc39c4f658', source: 'e7a89e764ce2b2040ab903ffcc7563907572faf6', target: '1dec2b8cc1968e12eb4e66fc41d1859036ad4d66', current: false });
  assert.match(r.facts[0], /merge-result commit 1ec20a6f .*source e7a89e76 into the target at 1dec2b8c, not a commit on the source branch/);
  assert.match(r.facts[1], /head is now 55e34161, so this pipeline tested an older source revision \(e7a89e76\)\. The head pipeline is 1070200 \(success\)/);
  // the issue fork's own branch pipeline (recorded): the pipeline's sha IS the source commit; found after a 404 in project/drupal
  const f = net(), fork = await inspect({ nid: '2574721', mr: '17049', pipeline: '953903', fetchImpl: f.fetchImpl, cacheRoot: cacheRoot(), now: NOW, logs: false });
  assert.deepEqual({ kind: fork.revision.kind, synthetic: fork.revision.synthetic, source: fork.revision.source, current: fork.revision.current },
    { kind: 'source', synthetic: false, source: 'ed3917f4b36a1b44a57bae39028bd14541009a54', current: false });
  assert.ok(f.seen.some((s) => s.url.endsWith('/project%2Fdrupal/pipelines/953903')) && f.seen.some((s) => s.url.endsWith('/issue%2Fdrupal-2574721/pipelines/953903')));
  assert.ok(!f.seen.some((s) => /repository\/commits/.test(s.url)), 'a source commit needs no parents');
  assert.deepEqual(fork.jobs.filter((j) => j.class === 'BLOCKING_FAILURE').map((j) => plainName(j.name)), ['Twig Coding standards (twig-cs-fixer)']);
  // a merge result whose commit could not be read: which source revision was tested is unknown, and said so
  const nc = revisionOf(fxj('pipeline-1068051.json'), null, fxj('mr-17049.json'));
  assert.deepEqual({ kind: nc.kind, source: nc.source, current: nc.current }, { kind: 'merge-result', source: null, current: null });
  assert.equal(revisionOf({ ref: 'refs/merge-requests/17049/head', sha: 'abc' }, null, { sha: 'abc' }).current, true);
});

test('a 401 or 403 is AUTHORIZATION_BLOCKED, and the lab says what it could not read', async () => {
  const denied = { status: 401, body: '{"message":"401 Unauthorized"}' };   // the body git.drupalcode.org gave for jobs/:id (recorded)
  const jobs = await worked({ 'pipelines/1068051/jobs': denied });
  assert.equal(jobs.r.class, 'AUTHORIZATION_BLOCKED'); assert.match(jobs.r.why, /GitLab reports the pipeline failed, but its jobs answered HTTP 401/);
  assert.equal(exitCodeOf(jobs.r.class), 4);
  assert.match(renderText(jobs.r), /jobs of pipeline 1068051: AUTHORIZATION_BLOCKED \(HTTP 401\)\. Read it in a browser while signed in; the lab stores no token\./);
  const pipe = await worked({ [`${API}/project%2Fdrupal/pipelines/1068051`]: { status: 403, body: '{"message":"403 Forbidden"}' } });
  assert.equal(pipe.r.class, 'AUTHORIZATION_BLOCKED');
  const mr = await inspect({ nid: '2574721', fetchImpl: net({ 'repository/branches': denied }).fetchImpl, cacheRoot: cacheRoot(), now: NOW });
  assert.equal(mr.class, 'AUTHORIZATION_BLOCKED', 'the merge request lookup itself');
  // a log the reader may not see: the job's class is still the fact GitLab gave; the log is a gap, not a guess
  const log = await worked({ 'jobs/13993524/trace.json': { status: 403, body: '{"message":"403 Forbidden"}' } }), j = log.r.jobs.find((x) => x.id === 13993524);
  assert.equal(log.r.class, 'BLOCKING_FAILURE'); assert.equal(j.class, 'BLOCKING_FAILURE'); assert.equal(j.log, null); assert.equal(j.tests.length, 1);
  assert.deepEqual(log.r.gaps.map((g) => [g.what, g.class, g.status]), [['log of job 13993524', 'AUTHORIZATION_BLOCKED', 403]]);
  // SYNTHETIC: GitLab redirects (same host, so followed) to its sign-in page and that page answers 200: still not readable, not a guess
  const signIn = await worked({ 'pipelines/1068051/jobs': '<!DOCTYPE html><html><body><a href="/users/sign_in">Sign in</a></body></html>' });
  assert.equal(signIn.r.class, 'AUTHORIZATION_BLOCKED'); assert.match(signIn.r.why, /its jobs answered with a sign-in page instead of JSON/);
  const html = await worked({ 'pipelines/1068051/jobs': '<html><body>Maintenance</body></html>' });
  assert.equal(html.r.class, 'UNKNOWN', 'an HTML page that is not a sign-in page is not called an authorization problem');
});

test('a finished job\'s log and failed tests are downloaded once, redacted, then read from the cache', async () => {
  const root = cacheRoot(), first = net(), a = await inspect({ nid: '2574721', pipeline: '1068051', fetchImpl: first.fetchImpl, cacheRoot: root, now: NOW });
  assert.ok(first.seen.some((s) => s.url.endsWith('/jobs/13993524/trace.json')) && first.seen.some((s) => s.url.includes('suite.json')));
  const dir = path.join(root, '13993524'), log = fs.readFileSync(path.join(dir, 'log.txt'), 'utf8');
  assert.match(log, /token=\[REDACTED\]/); assert.doesNotMatch(log, /SYNTHETIC-not-a-real-token/, 'redacted before it was written');
  assert.equal(JSON.parse(fs.readFileSync(path.join(dir, 'meta.json'), 'utf8')).finishedAt, fxj('pipeline-1068051-jobs.json').find((j) => j.id === 13993524).finished_at);
  const again = net(), b = await inspect({ nid: '2574721', pipeline: '1068051', fetchImpl: again.fetchImpl, cacheRoot: root, now: NOW });
  assert.ok(!again.seen.some((s) => /trace\.json|suite\.json/.test(s.url)), 'cache hit: neither is fetched again');
  const jb = b.jobs.find((x) => x.id === 13993524), ja = a.jobs.find((x) => x.id === 13993524);
  assert.equal(jb.log.from, 'cache'); assert.equal(jb.testsFrom, 'cache'); assert.deepEqual(jb.tests, ja.tests); assert.deepEqual(jb.excerpt, ja.excerpt);
  assert.match(renderText(b, { root }), /log: {7}13993524\/log\.txt \(from the cache, not downloaded again; \d+ lines; 2 token-shaped value\(s\) redacted\)/);
  // a damaged cache file is read again from GitLab, not a crash
  fs.writeFileSync(path.join(dir, 'tests.json'), '{"cases": [');
  const damaged = net(), d = await inspect({ nid: '2574721', pipeline: '1068051', fetchImpl: damaged.fetchImpl, cacheRoot: root, now: NOW });
  assert.equal(d.jobs.find((x) => x.id === 13993524).testsFrom, 'network'); assert.ok(damaged.seen.some((s) => s.url.includes('suite.json')));
  assert.ok(!damaged.seen.some((s) => s.url.endsWith('trace.json')), 'the intact log is still a cache hit');
  // GitLab reports another finish time (the job was erased and run again): the cache is not trusted
  const moved = net({ 'pipelines/1068051/jobs': jobsWith((j) => (j.id === 13993524 ? { ...j, finished_at: '2026-11-28T00:00:00.000Z' } : j)) });
  await inspect({ nid: '2574721', pipeline: '1068051', fetchImpl: moved.fetchImpl, cacheRoot: root, now: NOW });
  assert.ok(moved.seen.some((s) => s.url.endsWith('/jobs/13993524/trace.json')));
  // a log GitLab says is not complete is used but not cached
  const partial = cacheRoot(), inc = await worked({ 'jobs/13993524/trace.json': JSON.stringify({ ...fxj('trace-13993524.json'), complete: false }) }, { cacheRoot: partial });
  assert.equal(fs.existsSync(path.join(partial, '13993524', 'log.txt')), false); assert.ok(inc.r.gaps.some((g) => /not complete yet; not cached/.test(g.error)));
});

test('a failure in a file the merge request does not change is not called unrelated', async () => {
  const diffs = JSON.stringify(fxj('mr-17049-diffs.json').filter((d) => !d.new_path.endsWith('ModulesListFormWebTest.php')));
  const suite = fxj('suite-13993524.json'); suite.test_cases[0].recent_failures = { count: 3, base_branch: 'main' };   // SYNTHETIC: GitLab's recent-failures count
  const { r } = await worked({ 'merge_requests/17049/diffs': diffs, 'suite.json': JSON.stringify(suite) }), text = renderText(r);
  assert.ok(r.facts.some((f) => /ModulesListFormWebTest\.php is not changed by this merge request.*That alone does not make the failure unrelated/.test(f)));
  assert.doesNotMatch(text.replace(/does not make the failure unrelated|before calling it unrelated/g, ''), /unrelated|not caused by|pre-existing/i);
  const t = r.likelyCauses.find((c) => c.cause === 'fails-on-target');
  assert.match(t.summary, /3 failure\(s\) of this test on main recently\. That suggests, and does not prove/);
});

test('infrastructure: GitLab\'s failure reason is the fact; signs in a log are only a likely cause', async () => {
  assert.equal(classifyJob({ status: 'failed', failure_reason: 'runner_system_failure' }).class, 'INFRASTRUCTURE_ERROR');
  assert.equal(classifyJob({ status: 'failed', failure_reason: 'runner_system_failure', allow_failure: true }).class, 'ALLOWED_FAILURE');
  assert.equal(classifyJob({ status: 'failed', failure_reason: 'job_execution_timeout' }).class, 'BLOCKING_FAILURE', 'a hang can be the change');
  const infra = await worked({ 'pipelines/1068051/jobs': jobsWith((j) => (j.id === 13993524 ? { ...j, failure_reason: 'runner_system_failure' } : j)) });   // SYNTHETIC
  assert.equal(infra.r.class, 'INFRASTRUCTURE_ERROR'); assert.match(infra.r.retry[0].text.join(' '), /a retry of this job alone is the usual remedy/);
  const trace = fxj('trace-13993524.json'); trace.lines.push({ offset: 1, content: [{ text: 'fatal: No space left on device' }] });   // SYNTHETIC
  const signs = await worked({ 'jobs/13993524/trace.json': JSON.stringify(trace) }), c = signs.r.likelyCauses.find((x) => x.cause === 'infrastructure-signs');
  assert.equal(signs.r.jobs.find((j) => j.id === 13993524).class, 'BLOCKING_FAILURE', 'the class stays what GitLab reports');
  assert.match(c.evidence[0], /^log line \d+: fatal: No space left on device$/);
});

test('redaction, plain job names and the classes', () => {
  const s = ['token=abc123 status=201', 'PRIVATE-TOKEN: glpat-abcdefgh12345678', 'Authorization: Bearer eyJhbGciOi', 'X-Amz-Signature=deadbeef&X-Amz-Credential=AKIA1234',
    'https://user:hunter2@example.org/x', 'GR1348941abcdefghijkl', 'ok line with tokens and passwords mentioned'].join('\n');
  const r = redact(s);
  assert.equal(r.text, ['token=[REDACTED] status=201', 'PRIVATE-TOKEN: [REDACTED]', 'Authorization: Bearer [REDACTED]', 'X-Amz-Signature=[REDACTED]&X-Amz-Credential=[REDACTED]',
    'https://[REDACTED]@example.org/x', '[REDACTED]', 'ok line with tokens and passwords mentioned'].join('\n'));
  assert.equal(r.count, 7);
  // names that only contain the word, JSON, a bare bearer token, a quote after a header value, a private key
  const more = ['CI_JOB_TOKEN=abc123', 'MYSQL_ROOT_PASSWORD=hunter2 next', 'AWS_SECRET_ACCESS_KEY=abc', '{"token":"abc123","n":1}', 'password: foo', 'curl -H x Bearer eyJabcdefghij',
    '"PRIVATE-TOKEN: glpat-x123456789"', '-----BEGIN RSA PRIVATE KEY-----\nMIIEow\n-----END RSA PRIVATE KEY-----', 'testPasswordReset passed; Tests: 6, Assertions: 58'].join('\n');
  assert.equal(redact(more).text, ['CI_JOB_TOKEN=[REDACTED]', 'MYSQL_ROOT_PASSWORD=[REDACTED] next', 'AWS_SECRET_ACCESS_KEY=[REDACTED]', '{"token":"[REDACTED]","n":1}', 'password: [REDACTED]',
    'curl -H x Bearer [REDACTED]', '"PRIVATE-TOKEN: [REDACTED]"', '[REDACTED PRIVATE KEY]', 'testPasswordReset passed; Tests: 6, Assertions: 58'].join('\n'));
  assert.equal(plainName('🌐️️ PHPUnit Functional 8/8'), 'PHPUnit Functional 8/8'); assert.equal(plainName('📋 PHPUnit Unit (Core): [8.6-ubuntu]'), 'PHPUnit Unit (Core): [8.6-ubuntu]');
  assert.deepEqual(CLASSES, ['PASS', 'BLOCKING_FAILURE', 'ALLOWED_FAILURE', 'RUNNING', 'PENDING', 'INFRASTRUCTURE_ERROR', 'AUTHORIZATION_BLOCKED', 'UNKNOWN']);
});

test('the command refuses bad arguments before reading anything', () => {
  for (const a of [[], ['--mr', 'abc'], ['2574721', '--bogus'], ['--pipeline'], ['12']]) {
    const r = spawnSync(process.execPath, ['scripts/mr-pipeline.mjs', ...a], { cwd: labRoot, encoding: 'utf8', timeout: 30000 });
    assert.equal(r.status, 2, `${a.join(' ')}: ${r.stderr}`); assert.match(r.stderr, /node scripts\/mr-pipeline\.mjs <nid>/);
  }
});
