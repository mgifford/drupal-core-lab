// Read-only retrieval and classification of a Drupal core merge request's GitLab CI pipeline on git.drupalcode.org.
// scripts/mr-pipeline.mjs is the command; tests/lab/gitlab-ci.test.mjs runs this on recorded responses (tests/fixtures/gitlab-ci/).
//
// Network: https GET only, through getText in pack-prepare.mjs (www.drupal.org and git.drupalcode.org only, a redirect to another host
// is refused, byte caps). Anonymous, like the rest of the lab: no token is read, sent, stored or printed. What an anonymous reader may
// see on git.drupalcode.org (checked 2026-11-27):
//   API  projects/:id/merge_requests/:iid, .../pipelines, .../diffs; projects/:id/pipelines/:pid, .../jobs, .../test_report_summary;
//        projects/:id/repository/commits/:sha
//   web  <project path>/-/pipelines/:pid/tests/suite.json?build_ids[]=<job> (one job's test cases, with file:line in the output)
//        <project path>/-/jobs/<job>/trace.json (the job log as lines)
// Not readable anonymously: API jobs/:id and jobs/:id/trace (401). Web -/jobs/:id/raw redirects to a signed S3 address: the host
// allowlist refuses it, and the address carries a credential, so it is never followed or printed. pipelines/:id/test_report is 14 MB
// for core; the per-job suite.json is read instead. A 401 or 403 is AUTHORIZATION_BLOCKED: the lab says what it could not read.
//
// Facts are what GitLab reports: status, allow_failure, failure_reason, ref, commit parents, test output, log lines. Likely causes are
// kept apart, each with the evidence it rests on, and are never stated as facts. A failure in a file the merge request does not
// change is not thereby unrelated. Retry advice is text for a person; nothing here retries, posts or pushes.
// Finished jobs' logs and failed test cases do not change: they are cached under .lab-cache/gitlab/jobs/<job>/ (git-ignored), with
// token-shaped strings redacted before anything is written, and read from there the next time.
import fs from 'node:fs';
import path from 'node:path';
import { getText } from './pack-prepare.mjs';

export const HOST = 'https://git.drupalcode.org';
export const API = `${HOST}/api/v4`;
export const CORE_PROJECT = 'project/drupal';
export const CLASSES = ['PASS', 'BLOCKING_FAILURE', 'ALLOWED_FAILURE', 'RUNNING', 'PENDING', 'INFRASTRUCTURE_ERROR', 'AUTHORIZATION_BLOCKED', 'UNKNOWN'];
const enc = encodeURIComponent;
const MB = 1024 * 1024, JOB_PAGES = 5, MAX_CASES = 50, EXCERPT_LINES = 30, LINE_CHARS = 300;

// failure_reason values GitLab sets when the runner or GitLab failed, not the job's own commands. job_execution_timeout is not one:
// a change that makes a test hang times out too.
export const INFRA_REASONS = new Set(['api_failure', 'stuck_or_timeout_failure', 'runner_system_failure', 'missing_dependency_failure', 'runner_unsupported',
  'scheduler_failure', 'data_integrity_failure', 'archived_failure', 'no_matching_runner', 'trace_size_exceeded', 'ci_quota_exceeded', 'unmet_prerequisites', 'builds_disabled']);
const WAITING = new Set(['created', 'pending', 'waiting_for_resource', 'preparing', 'scheduled', 'waiting_for_callback', 'manual']);
export const FINISHED = new Set(['success', 'failed', 'canceled', 'skipped']);

export const short = (sha) => (sha ? String(sha).slice(0, 8) : 'unknown');
// Job names carry pictographs ("🌐️️ PHPUnit Functional 8/8"); a screen reader reads them aloud, so text output uses the plain name.
export const plainName = (name) => String(name || '').replace(/[\p{Extended_Pictographic}\u{FE0F}\u{200D}\u{20E3}]/gu, '').replace(/\s+/g, ' ').trim();

// ---- redaction: applied to every log line and test output before it is cached or printed
// Order matters: specific shapes first; the last, generic one skips a value already redacted.
const SECRETS = [
  [/-----BEGIN [A-Z ]*PRIVATE KEY-----(?:[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----)?/g, '[REDACTED PRIVATE KEY]'],
  [/\b(PRIVATE-TOKEN|JOB-TOKEN|Authorization)(\s*:\s*)(?:(Bearer|Basic|token)\s+)?[^\s"']+/gi, (m, h, sep, kind) => `${h}${sep}${kind ? `${kind} ` : ''}[REDACTED]`],
  [/\b(Bearer)\s+(?!\[REDACTED)[A-Za-z0-9._~+/=-]{8,}/g, '$1 [REDACTED]'],
  [/\bgl(?:pat|dt|rt|cbt|ptt|soat|ft|imt|agent|oas|ffct)-[A-Za-z0-9_-]{8,}/g, '[REDACTED]'],
  [/\bGR1348941[A-Za-z0-9_-]{8,}/g, '[REDACTED]'],
  [/(X-Amz-(?:Credential|Signature|Security-Token))=[^&\s"']+/g, '$1=[REDACTED]'],
  [/(https?:\/\/)[^\s:@/]+:[^\s@/]+@/g, '$1[REDACTED]@'],
  // NAME=value, NAME: value and "name":"value" for any name containing token, password, secret or api key (CI_JOB_TOKEN, MYSQL_ROOT_PASSWORD, ...)
  [/([A-Za-z0-9_-]*(?:token|password|passwd|secret|api_?key)[A-Za-z0-9_-]*)("?\s*[=:]\s*"?)(?!\[REDACTED)([^\s"'&,;]+)/gi, '$1$2[REDACTED]'],
];
export function redact(text) {
  let out = String(text ?? ''), count = 0;
  for (const [re, to] of SECRETS) out = out.replace(re, (...a) => { count++; return typeof to === 'function' ? to(...a) : a[0].replace(new RegExp(re.source, re.flags.replace('g', '')), to); });
  return { text: out, count };
}

// ---- classification
export function classifyJob(j) {
  const r = (c, why) => ({ class: c, why }), s = j.status;
  if (s === 'success') return r('PASS', 'passed');
  if (s === 'failed') {
    if (j.allow_failure) return r('ALLOWED_FAILURE', `failed${j.failure_reason ? ` (${j.failure_reason})` : ''}; the pipeline allows this job to fail, so it does not block`);
    if (INFRA_REASONS.has(j.failure_reason)) return r('INFRASTRUCTURE_ERROR', `GitLab reports ${j.failure_reason}: the runner or GitLab failed, not the job's own commands`);
    return r('BLOCKING_FAILURE', `failed (${j.failure_reason || 'no reason given'}) and is not allowed to fail, so it blocks`);
  }
  if (s === 'running') return r('RUNNING', 'still running: no result yet');
  if (s === 'manual') return r('PENDING', j.allow_failure ? 'manual and optional: runs only when someone starts it; not a failure' : 'manual: waits for someone to start it, and the pipeline waits for it; not a failure');
  if (WAITING.has(s)) return r('PENDING', `${s}: has not run yet; not a failure`);
  if (s === 'skipped') return r('UNKNOWN', 'skipped: did not run, so it has no result; not a failure');
  if (s === 'canceled' || s === 'canceling') return r('UNKNOWN', `${s}: stopped before it had a result; not a failure`);
  return r('UNKNOWN', `GitLab status "${s}" is not one the lab knows`);
}

// The pipeline: GitLab's own status first, then what its jobs say. Jobs is the classified list, or null when it could not be read.
export function classifyPipeline(p, jobs) {
  if (!p) return { class: 'UNKNOWN', why: 'the pipeline could not be read' };
  if (!jobs) return { class: 'UNKNOWN', why: `GitLab reports ${p.status}, but its jobs could not be read` };
  const of = (c) => jobs.filter((j) => j.class === c), blocking = of('BLOCKING_FAILURE'), infra = of('INFRASTRUCTURE_ERROR'), allowed = of('ALLOWED_FAILURE');
  const n = (xs, what) => `${xs.length} ${what}${xs.length === 1 ? '' : 's'}`;
  if (p.status === 'success') return { class: 'PASS', why: `GitLab reports success${allowed.length ? `; ${n(allowed, 'job')} failed that ${allowed.length === 1 ? 'is' : 'are'} allowed to fail` : ''}` };
  if (p.status === 'failed') {
    if (blocking.length) return { class: 'BLOCKING_FAILURE', why: `${n(blocking, 'job')} failed that ${blocking.length === 1 ? 'is' : 'are'} not allowed to fail${infra.length ? `, and ${n(infra, 'infrastructure error')}` : ''}` };
    if (infra.length) return { class: 'INFRASTRUCTURE_ERROR', why: `only infrastructure errors block: ${infra.map((j) => `${j.id} (${j.failure_reason})`).join(', ')}` };
    return { class: 'UNKNOWN', why: `GitLab reports failed, but no job that blocks failed${p.yaml_errors ? `; configuration error: ${p.yaml_errors}` : '; a downstream pipeline or a configuration error may be the cause: open the pipeline page'}` };
  }
  if (p.status === 'running') return { class: 'RUNNING', why: `still running${blocking.length ? `; ${n(blocking, 'blocking failure')} already` : ''}` };
  if (WAITING.has(p.status)) return { class: 'PENDING', why: `${p.status}: no result yet` };
  return { class: 'UNKNOWN', why: `GitLab reports ${p.status}: no result` };
}

// Which commit the pipeline tested. A merge-result (or merge-train) pipeline runs on a commit GitLab made by merging the source branch
// into the target: its sha is not a commit of the source branch. Its parents say which source and target revisions were merged.
export function revisionOf(p, commit, mr) {
  const ref = String(p.ref || ''), m = ref.match(/^refs\/merge-requests\/(\d+)\/(merge|train|head)$/);
  let rev;
  if (m && m[2] !== 'head') {
    const parents = commit && Array.isArray(commit.parent_ids) && commit.parent_ids.length === 2 ? commit.parent_ids : null;
    rev = { kind: m[2] === 'train' ? 'merge-train' : 'merge-result', synthetic: true, mrIid: Number(m[1]), sha: p.sha, source: parents ? parents[1] : null, target: parents ? parents[0] : null };
  } else rev = { kind: p.tag ? 'tag' : 'source', synthetic: false, mrIid: m ? Number(m[1]) : null, sha: p.sha, source: p.sha, target: null };
  rev.mrHead = mr ? mr.sha || null : null;
  rev.current = rev.source && rev.mrHead ? rev.source === rev.mrHead : null;
  return rev;
}

// ---- log and test output
export function traceLines(trace) {
  return (trace && Array.isArray(trace.lines) ? trace.lines : []).map((l) => (l.content || []).map((c) => c.text || '').join(''));
}
const HIT = /✘|There (?:was|were) \d+ (?:failure|error)|PHP (?:Fatal|Parse) error|Fatal error:|FAILURES!|ERRORS!|^\s*Tests: .*(?:Failures|Errors)|ERROR: Job failed|^\s*(?:Fail|Error)\s+\d+\.\d+s\s|No space left on device|Could not resolve host|Connection (?:timed out|refused)|exit code 137|OOMKilled/;
const BLOCK_HEAD = /✘|There (?:was|were) \d+/;
// The lines that say what failed, numbered as in the full log (1-based), at most EXCERPT_LINES, each cut to LINE_CHARS.
export function logExcerpt(lines, { max = EXCERPT_LINES } = {}) {
  const keep = new Set();
  lines.forEach((l, i) => { if (!HIT.test(l)) return; keep.add(i); if (BLOCK_HEAD.test(l)) for (let k = 1; k <= 6 && i + k < lines.length; k++) { keep.add(i + k); if (/^\s*┴/.test(lines[i + k])) break; } });
  return [...keep].sort((a, b) => a - b).slice(0, max).map((i) => ({ line: i + 1, text: lines[i].trimEnd().slice(0, LINE_CHARS) }));
}
const INFRA_SIGNS = /No space left on device|Could not resolve host|Connection (?:timed out|refused)|exit code 137|OOMKilled|\bKilled\b|ERROR: Job failed \(system failure\)|TLS handshake timeout|503 Service Unavailable|rate limit/i;

// The base path the test site was served under, from the browser output links PHPUnit prints: "/subdirectory" or "" at a root.
export function basePathFrom(lines) {
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/https?:\/\/[^/\s]+((?:\/[^/\s]+)*?)\/sites\/simpletest\/browser_output\//);
    if (m) return { path: m[1], line: i + 1, text: lines[i].trim().slice(0, LINE_CHARS) };
  }
  return null;
}

const phpClass = (classname) => String(classname || '').replace(/\./g, '\\');
export function testCase(tc) {
  const out = redact(tc.system_output || '').text, lines = out.split('\n').map((l) => l.trimEnd()).filter(Boolean);
  const name = `${phpClass(tc.classname)}::${tc.name}()`;
  const body = lines[0] && lines[0].includes(`::${tc.name}`) ? lines.slice(1) : lines;
  const esc = String(tc.file || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const at = (tc.file && out.match(new RegExp(`${esc}:(\\d+)`))) || out.match(/^(?!.*\/vendor\/)\S+\.php:(\d+)$/m);
  return { status: tc.status, name, file: tc.file || null, line: at ? Number(at[1]) : null, message: body[0] ? body[0].slice(0, LINE_CHARS) : null,
    excerpt: body.slice(0, 6).map((l) => l.slice(0, LINE_CHARS)), recentFailures: tc.recent_failures || null };
}

// ---- cache: one folder per finished job; used only while GitLab still reports the same finish time
export const jobCacheDir = (cacheRoot, id) => path.join(cacheRoot, String(Number(id)));
function readCache(cacheRoot, job, file) {
  if (!cacheRoot) return null;
  const dir = jobCacheDir(cacheRoot, job.id);
  try {
    const meta = JSON.parse(fs.readFileSync(path.join(dir, 'meta.json'), 'utf8'));
    if (meta.finishedAt !== job.finished_at || !fs.existsSync(path.join(dir, file))) return null;
    return { meta, text: fs.readFileSync(path.join(dir, file), 'utf8'), path: path.join(dir, file) };
  } catch { return null; }
}
function writeCache(cacheRoot, job, file, text, extra) {
  if (!cacheRoot || !FINISHED.has(job.status) || !job.finished_at) return null;
  const dir = jobCacheDir(cacheRoot, job.id);
  const put = (f, t) => { const tmp = path.join(dir, `${f}.${process.pid}.tmp`); fs.writeFileSync(tmp, t); fs.renameSync(tmp, path.join(dir, f)); };
  let meta = {}; try { meta = JSON.parse(fs.readFileSync(path.join(dir, 'meta.json'), 'utf8')); } catch { /* first file of this job */ }
  // Another finish time means another run of the job: everything cached for the old one goes, or its log would pass for the new one's.
  if (meta.finishedAt && meta.finishedAt !== job.finished_at) { fs.rmSync(dir, { recursive: true, force: true }); meta = {}; }
  fs.mkdirSync(dir, { recursive: true });
  put(file, text); put('meta.json', `${JSON.stringify({ ...meta, job: job.id, status: job.status, finishedAt: job.finished_at, [file]: extra }, null, 1)}\n`);
  return path.join(dir, file);
}

// ---- network
async function read(url, o, { maxBytes = 5 * MB, json = true } = {}) {
  o.requests.push(url);
  let r; try { r = await getText(url, { fetchImpl: o.fetchImpl, maxBytes }); } catch (e) {
    const cause = e.cause && (e.cause.code || e.cause.message);
    return { ok: false, class: 'UNKNOWN', status: null, error: `${e.message}${cause && !String(e.message).includes(cause) ? ` (${cause})` : ''}` };
  }
  if (r.status === 200) {
    if (!json) return { ok: true, text: r.text };
    try { return { ok: true, data: JSON.parse(r.text) }; } catch {
      // getText follows a redirect on the same host, so a reader GitLab sends to /users/sign_in gets that page, not a 401
      const html = /^\s*</.test(r.text), signIn = html && /sign_in|sign in/i.test(r.text);
      return { ok: false, class: signIn ? 'AUTHORIZATION_BLOCKED' : 'UNKNOWN', status: 200, error: signIn ? 'a sign-in page instead of JSON' : html ? 'an HTML page instead of JSON' : 'not JSON' };
    }
  }
  return { ok: false, status: r.status, class: r.status === 401 || r.status === 403 ? 'AUTHORIZATION_BLOCKED' : 'UNKNOWN', error: `HTTP ${r.status}` };
}
const gap = (what, url, r) => ({ what, url, status: r.status, class: r.class, error: r.error });
const answered = (x) => (x.status === 200 ? `answered with ${x.error}` : `answered HTTP ${x.status}`);
const projectPath = (webUrl) => { try { return new URL(webUrl).pathname.split('/-/')[0].replace(/^\//, ''); } catch { return CORE_PROJECT; } };

async function findMr(nid, o, gaps) {
  const url = `${API}/projects/${enc(`issue/drupal-${nid}`)}/repository/branches?search=${nid}`, b = await read(url, o);
  if (!b.ok) { gaps.push(gap(`the issue fork's branches (#${nid})`, url, b)); return { mr: null, others: [] }; }
  const found = [];
  for (const br of (Array.isArray(b.data) ? b.data : []).filter((x) => String(x.name || '').includes(String(nid)))) {
    const u = `${API}/projects/${enc(CORE_PROJECT)}/merge_requests?source_branch=${enc(br.name)}&scope=all&state=all`, l = await read(u, o);
    if (l.ok && Array.isArray(l.data)) found.push(...l.data); else gaps.push(gap(`merge requests from ${br.name}`, u, l));
  }
  found.sort((a, b2) => (b2.state === 'opened') - (a.state === 'opened') || String(b2.updated_at).localeCompare(String(a.updated_at)));
  return { mr: found[0] || null, others: found.slice(1).map((x) => `!${x.iid} (${x.state}, ${x.source_branch})`) };
}

async function jobEvidence(job, ctx, o, gaps) {
  const ev = { tests: null, counts: null, log: null, excerpt: [], basePath: null, infraSigns: [] };
  // failed test cases (suite.json for this job alone)
  const hasJunit = (job.artifacts || []).some((a) => a.file_type === 'junit');
  if (hasJunit) {
    const hit = readCache(o.cacheRoot, job, 'tests.json');
    let cached = null; if (hit) { try { cached = JSON.parse(hit.text); } catch { cached = null; } }   // a damaged cache file is a miss, not a crash
    if (cached && Array.isArray(cached.cases)) { ev.tests = cached.cases; ev.counts = cached.counts; ev.testsFrom = 'cache'; }
    else {
      const url = `${HOST}/${ctx.path}/-/pipelines/${ctx.pipelineId}/tests/suite.json?build_ids%5B%5D=${job.id}`, r = await read(url, o, { maxBytes: 40 * MB });
      if (!r.ok) gaps.push(gap(`test cases of job ${job.id}`, url, r));
      else {
        const s = r.data || {}, bad = (s.test_cases || []).filter((c) => c.status === 'failed' || c.status === 'error');
        ev.counts = { total: s.total_count ?? null, failed: s.failed_count ?? null, error: s.error_count ?? null, skipped: s.skipped_count ?? null, capped: bad.length > MAX_CASES };
        ev.tests = bad.slice(0, MAX_CASES).map(testCase); ev.testsFrom = 'network';
        writeCache(o.cacheRoot, job, 'tests.json', `${JSON.stringify({ counts: ev.counts, cases: ev.tests }, null, 1)}\n`, { cases: ev.tests.length });
      }
    }
  }
  // the log
  if (!o.logs) return ev;
  if (job.erased_at) { gaps.push({ what: `log of job ${job.id}`, url: job.web_url, status: null, class: 'UNKNOWN', error: `erased ${job.erased_at}` }); return ev; }
  let text = null, hit = readCache(o.cacheRoot, job, 'log.txt');
  if (hit) { text = hit.text; ev.log = { from: 'cache', path: hit.path, lines: hit.meta['log.txt']?.lines ?? null, truncated: false, redactions: hit.meta['log.txt']?.redactions ?? 0 }; }
  else {
    const url = `${HOST}/${ctx.path}/-/jobs/${job.id}/trace.json`, r = await read(url, o, { maxBytes: 40 * MB });
    if (!r.ok) gaps.push(gap(`log of job ${job.id}`, url, r));
    else {
      const red = redact(traceLines(r.data).join('\n')); text = red.text;
      const complete = r.data.complete !== false && !r.data.truncated, lines = text.split('\n').length;
      const saved = complete ? writeCache(o.cacheRoot, job, 'log.txt', text, { lines, redactions: red.count }) : null;
      ev.log = { from: 'network', path: saved, lines, truncated: !!r.data.truncated, complete, redactions: red.count };
      if (!complete) gaps.push({ what: `log of job ${job.id}`, url, status: 200, class: 'UNKNOWN', error: r.data.truncated ? 'GitLab served a truncated log; not cached' : 'the log is not complete yet; not cached' });
    }
  }
  if (text !== null) {
    const lines = text.split('\n');
    ev.excerpt = logExcerpt(lines); ev.basePath = basePathFrom(lines);
    ev.infraSigns = lines.map((l, i) => ({ line: i + 1, text: l.trim().slice(0, LINE_CHARS) })).filter((x) => INFRA_SIGNS.test(x.text)).slice(0, 5);
  }
  return ev;
}

// ---- likely causes: each needs evidence, and none is stated as a fact
const ROOT_RELATIVE = /(?:href|src|action)=\\?["']((?:\/[A-Za-z0-9_.~%-]+)+\/?)\\?["']|["']((?:\/[a-z0-9_.~%-]+){1,8}\/?)["']/i;
export function likelyCauses(jobs) {
  const out = [], key = (n) => plainName(n).replace(/\[\d+\.\d+-[a-z]+\]/i, '[PHP]');
  for (const j of jobs) {
    for (const t of j.tests || []) {
      const m = String(t.message || '').match(ROOT_RELATIVE), want = m && (m[1] || m[2]), base = j.basePath && j.basePath.path;
      if (want && base && !want.startsWith(`${base}/`)) out.push({ job: j.id, test: t.name, cause: 'base-path',
        summary: `The assertion expects the root-relative path "${want}", and this job serves the test site under ${base}/, where that link would be "${base}${want}". An exact match passes at a site root and fails under a base path.`,
        evidence: [`test output: ${t.message}`, `log line ${j.basePath.line}: ${j.basePath.text}`],
        check: 'Run the test with the site in a subfolder, or assert on the path without the base path (its suffix) instead of the exact root-relative href.' });
      if (t.recentFailures && t.recentFailures.count) out.push({ job: j.id, test: t.name, cause: 'fails-on-target',
        summary: `GitLab counted ${t.recentFailures.count} failure(s) of this test on ${t.recentFailures.base_branch || 'the target branch'} recently. That suggests, and does not prove, that it fails without this change.`,
        evidence: [`suite.json recent_failures: ${JSON.stringify(t.recentFailures)}`], check: 'Compare the failure message with the target branch\'s latest pipeline before calling it unrelated.' });
    }
    if (['BLOCKING_FAILURE', 'ALLOWED_FAILURE'].includes(j.class)) {
      const twin = jobs.filter((x) => x.id !== j.id && x.class === 'PASS' && /\[\d+\.\d+-/.test(x.name) && key(x.name) === key(j.name));
      if (twin.length) out.push({ job: j.id, cause: 'php-version', summary: `Fails on ${(j.name.match(/\[([\d.]+)-/) || [])[1] ? `PHP ${j.name.match(/\[([\d.]+)-/)[1]}` : 'one PHP version'}, while the same job passes on ${twin.map((x) => `PHP ${(x.name.match(/\[([\d.]+)-/) || [])[1]}`).join(', ')} in this pipeline: likely a difference in that PHP version, not in the change alone.`,
        evidence: [j, ...twin].map((x) => `job ${x.id} ${plainName(x.name)}: ${x.status}`), check: 'Read the failing tests of that job (--all-failures) and compare them with the target branch\'s pipeline on the same PHP version.' });
    }
    if (j.infraSigns && j.infraSigns.length && j.class === 'BLOCKING_FAILURE') out.push({ job: j.id, cause: 'infrastructure-signs',
      summary: `GitLab reports ${j.failure_reason || 'a script failure'}, but the log has signs of a runner, disk or network problem. A retry of this one job is the cheap check.`,
      evidence: j.infraSigns.map((x) => `log line ${x.line}: ${x.text}`), check: 'Retry this job alone; if it fails the same way, read the test failures as the change\'s.' });
    if (j.class === 'BLOCKING_FAILURE' && j.failure_reason === 'job_execution_timeout') out.push({ job: j.id, cause: 'timeout',
      summary: 'The job reached its time limit. A test that hangs because of the change and a slow runner both fit.', evidence: (j.excerpt || []).slice(-3).map((x) => `log line ${x.line}: ${x.text}`),
      check: 'Compare the job\'s duration with the same job on the target branch.' });
  }
  return out;
}

// ---- facts and retry text
function factsOf(r) {
  const F = [], p = r.pipeline, rev = r.revision, mr = r.mr;
  if (!p) return F;
  if (rev.synthetic) F.push(`Pipeline ${p.id} ran on GitLab's ${rev.kind} commit ${short(rev.sha)} (ref ${p.ref}): a merge GitLab made of source ${short(rev.source)} into the target at ${short(rev.target)}, not a commit on the source branch.`);
  else F.push(`Pipeline ${p.id} ran on ${rev.kind === 'tag' ? 'tag' : 'source'} commit ${short(rev.sha)} (ref ${p.ref}).`);
  if (rev.synthetic && !rev.source) F.push(`The merge commit's parents could not be read, so which source revision was tested is not known.`);
  if (mr && rev.current === false) F.push(`The merge request's head is now ${short(mr.sha)}, so this pipeline tested an older source revision (${short(rev.source)}).${mr.head_pipeline ? ` The head pipeline is ${mr.head_pipeline.id} (${mr.head_pipeline.status}).` : ''}`);
  if (mr && rev.current === true) F.push(`It tested the merge request's current head ${short(mr.sha)}.`);
  if (!r.jobs) return F;
  const of = (c) => r.jobs.filter((j) => j.class === c), list = (xs) => xs.map((j) => `${plainName(j.name)} (job ${j.id})`).join(', ');
  for (const j of of('BLOCKING_FAILURE')) F.push(`${plainName(j.name)} (job ${j.id}) failed (${j.failure_reason || 'no reason given'}) and is not allowed to fail: it blocks.`);
  for (const j of of('INFRASTRUCTURE_ERROR')) F.push(`${plainName(j.name)} (job ${j.id}) failed with ${j.failure_reason}: GitLab attributes it to the runner or GitLab, not the job's commands.`);
  for (const j of r.jobs) for (const t of j.tests || []) {
    F.push(`${t.name} ${t.status}${t.file ? ` at ${t.file}${t.line ? `:${t.line}` : ''}` : ''}${t.message ? `: ${t.message}` : ''}`);
    if (t.file && r.changedFiles) F.push(r.changedFiles.includes(t.file)
      ? `${t.file} is changed by this merge request${rev.current === false ? ' (in its current version)' : ''}.`
      : `${t.file} is not changed by this merge request${rev.current === false ? ' (in its current version)' : ''}. That alone does not make the failure unrelated: the change can alter what the test checks.`);
  }
  const allowed = of('ALLOWED_FAILURE'); if (allowed.length) F.push(`${allowed.length} job(s) failed and are allowed to fail, so they do not block: ${list(allowed)}.`);
  const running = of('RUNNING'), waiting = of('PENDING'), none = of('UNKNOWN');
  if (running.length) F.push(`${running.length} job(s) still running: ${list(running)}.`);
  if (waiting.length) { const c = {}; for (const j of waiting) c[j.status] = (c[j.status] || 0) + 1; F.push(`${waiting.length} job(s) have not run (${Object.entries(c).map(([s, n]) => `${s} ${n}`).join(', ')}); they are not failures.`); }
  if (none.length) { const c = {}; for (const j of none) c[j.status] = (c[j.status] || 0) + 1; F.push(`${none.length} job(s) have no result (${Object.entries(c).map(([s, n]) => `${s} ${n}`).join(', ')}); they are not failures.`); }
  F.push(`${of('PASS').length} job(s) passed.`);
  return F;
}

export function retryAdvice(r) {
  const out = [], rev = r.revision, mr = r.mr;
  for (const j of (r.jobs || []).filter((x) => x.class === 'BLOCKING_FAILURE' || x.class === 'INFRASTRUCTURE_ERROR')) {
    const L = [`To re-run only ${plainName(j.name)} (job ${j.id}): open ${j.web_url} while signed in to git.drupalcode.org with an account that may run this project's pipelines, and press Retry. The lab does not do this for you. No new commit is needed.`];
    if (rev.current === false && mr) L.push(`This pipeline tested ${short(rev.source)}, not the head ${short(mr.sha)}: a retry here tests that older ${rev.synthetic ? 'merge result' : 'commit'} again.${mr.head_pipeline ? ` Read the head pipeline first: node scripts/mr-pipeline.mjs --mr ${mr.iid} --pipeline ${mr.head_pipeline.id}.` : ''}`);
    if (j.class === 'BLOCKING_FAILURE' && (j.tests || []).length) L.push('A test failed on an assertion: a retry fails the same way unless the cause is flaky or outside the change. Read the likely causes before retrying.');
    if (j.class === 'INFRASTRUCTURE_ERROR') L.push('GitLab reports an infrastructure failure: a retry of this job alone is the usual remedy.');
    out.push({ job: j.id, text: L });
  }
  return out;
}

// ---- the whole read: merge request, pipeline, commit, jobs, then evidence for the failures that matter
export async function inspect({ nid = null, mr: mrIid = null, pipeline: pipelineId = null, fetchImpl = fetch, cacheRoot = null, allFailures = false, logs = true, now = new Date() } = {}) {
  const o = { fetchImpl, cacheRoot, logs, requests: [] }, gaps = [], notes = [];
  const r = { schema: 1, readAt: now.toISOString(), nid: nid ? String(nid) : null, mr: null, pipeline: null, revision: null, jobs: null, class: 'UNKNOWN', why: '', facts: [], likelyCauses: [], retry: [], gaps, notes, otherPipelines: [], changedFiles: null };
  const core = `${API}/projects/${enc(CORE_PROJECT)}`;
  const getMr = async (iid) => { const u = `${core}/merge_requests/${iid}`, x = await read(u, o); if (!x.ok) gaps.push(gap(`merge request !${iid}`, u, x)); return x.ok ? x.data : null; };

  if (mrIid) r.mr = await getMr(mrIid);
  else if (nid && !pipelineId) { const f = await findMr(nid, o, gaps); r.mr = f.mr; if (f.others.length) notes.push(`More than one merge request matched; using !${f.mr.iid}. Others: ${f.others.join(', ')}. Use --mr to choose.`); if (!f.mr && !gaps.length) notes.push(`No merge request was found for a branch of issue/drupal-${nid} that names ${nid}.`); }

  // the pipeline: the one asked for, else the merge request's head pipeline
  let pid = pipelineId, projectId = null;
  if (!pid && r.mr) { if (r.mr.head_pipeline) { pid = r.mr.head_pipeline.id; projectId = r.mr.head_pipeline.project_id; } else notes.push(`Merge request !${r.mr.iid} has no head pipeline.`); }
  if (pid) {
    const tries = projectId ? [String(projectId)] : [enc(CORE_PROJECT), ...(nid ? [enc(`issue/drupal-${nid}`)] : [])];
    for (const proj of tries) {
      const u = `${API}/projects/${proj}/pipelines/${pid}`, x = await read(u, o);
      if (x.ok) { r.pipeline = x.data; break; }
      if (x.status !== 404 || proj === tries[tries.length - 1]) { gaps.push(gap(`pipeline ${pid}`, u, x)); if (x.class === 'AUTHORIZATION_BLOCKED') { r.class = 'AUTHORIZATION_BLOCKED'; r.why = `pipeline ${pid} ${answered(x)}: an anonymous reader may not see it`; } break; }
    }
  }
  if (!r.pipeline) {
    const auth = gaps.find((g) => g.class === 'AUTHORIZATION_BLOCKED');
    if (auth && r.class !== 'AUTHORIZATION_BLOCKED') { r.class = 'AUTHORIZATION_BLOCKED'; r.why = `${auth.what} ${answered(auth)}: an anonymous reader may not see it`; }
    if (!r.why) r.why = pid ? `pipeline ${pid} could not be read` : 'no pipeline to read';
    r.facts = factsOf(r); return { ...r, requests: o.requests };
  }
  const p = r.pipeline, ppath = projectPath(p.web_url);

  // the merge request the pipeline belongs to, from its ref, when none was named
  const refMr = (String(p.ref).match(/^refs\/merge-requests\/(\d+)\//) || [])[1];
  if (!r.mr && refMr) r.mr = await getMr(refMr);
  if (r.mr && refMr && String(r.mr.iid) !== refMr) notes.push(`Pipeline ${p.id} belongs to merge request !${refMr}, not !${r.mr.iid}.`);
  if (r.mr) {
    const u = `${core}/merge_requests/${r.mr.iid}/pipelines`, x = await read(u, o);
    if (x.ok && Array.isArray(x.data)) r.otherPipelines = x.data.slice(0, 5).map((q) => ({ id: q.id, status: q.status, ref: q.ref, sha: q.sha, project: q.project_id, web_url: q.web_url }));
    else gaps.push(gap(`pipelines of !${r.mr.iid}`, u, x));
    const d = `${core}/merge_requests/${r.mr.iid}/diffs?per_page=100`, y = await read(d, o);
    if (y.ok && Array.isArray(y.data)) r.changedFiles = [...new Set(y.data.flatMap((f) => [f.old_path, f.new_path]).filter(Boolean))];
    else gaps.push(gap(`changed files of !${r.mr.iid}`, d, y));
  }

  // the commit: only needed to name the parents of a merge result
  let commit = null;
  if (/^refs\/merge-requests\/\d+\/(merge|train)$/.test(p.ref)) {
    const u = `${API}/projects/${p.project_id}/repository/commits/${p.sha}`, x = await read(u, o);
    if (x.ok) commit = x.data; else gaps.push(gap(`commit ${short(p.sha)}`, u, x));
  }
  r.revision = revisionOf(p, commit, r.mr);

  // jobs (latest attempts only: GitLab leaves retried jobs out of this list)
  const jobs = []; let blocked = null;
  for (let page = 1; page <= JOB_PAGES; page++) {
    const u = `${API}/projects/${p.project_id}/pipelines/${p.id}/jobs?per_page=100&page=${page}`, x = await read(u, o);
    if (!x.ok) { gaps.push(gap(`jobs of pipeline ${p.id}`, u, x)); blocked = x; break; }
    const list = Array.isArray(x.data) ? x.data : []; jobs.push(...list); if (list.length < 100) break;
    if (page === JOB_PAGES) notes.push(`LIMIT: only the first ${JOB_PAGES * 100} jobs were read.`);
  }
  if (blocked) {
    const c = classifyPipeline(p, null);
    r.class = blocked.class === 'AUTHORIZATION_BLOCKED' ? 'AUTHORIZATION_BLOCKED' : c.class;
    r.why = blocked.class === 'AUTHORIZATION_BLOCKED' ? `GitLab reports the pipeline ${p.status}, but its jobs ${answered(blocked)}: an anonymous reader may not see them` : c.why;
    r.facts = factsOf(r); return { ...r, requests: o.requests };
  }
  r.jobs = jobs.map((j) => ({ id: j.id, name: j.name, stage: j.stage, status: j.status, allow_failure: !!j.allow_failure, failure_reason: j.failure_reason || null,
    finished_at: j.finished_at || null, erased_at: j.erased_at || null, web_url: j.web_url || `${HOST}/${ppath}/-/jobs/${j.id}`,
    artifacts: (j.artifacts || []).map((a) => ({ file_type: a.file_type })), artifactsExpireAt: j.artifacts_expire_at || null,
    links: { job: j.web_url || `${HOST}/${ppath}/-/jobs/${j.id}`, ...(j.artifacts_file ? { browse: `${HOST}/${ppath}/-/jobs/${j.id}/artifacts/browse`, download: `${HOST}/${ppath}/-/jobs/${j.id}/artifacts/download` } : {}) },
    ...classifyJob(j) }));

  // suite counts for every job, from the small summary; test cases and logs only for the failures that matter
  { const u = `${API}/projects/${p.project_id}/pipelines/${p.id}/test_report_summary`, x = await read(u, o);
    if (x.ok) for (const s of (x.data && x.data.test_suites) || []) for (const id of s.build_ids || []) { const j = r.jobs.find((y) => y.id === id); if (j) j.suite = { name: s.name, total: s.total_count, failed: s.failed_count, error: s.error_count, jobs: (s.build_ids || []).length }; }
    else gaps.push(gap(`test summary of pipeline ${p.id}`, u, x)); }
  const ctx = { path: ppath, pipelineId: p.id };
  for (const j of r.jobs.filter((y) => y.class === 'BLOCKING_FAILURE' || y.class === 'INFRASTRUCTURE_ERROR' || (allFailures && y.class === 'ALLOWED_FAILURE'))) Object.assign(j, await jobEvidence(j, ctx, o, gaps));

  Object.assign(r, classifyPipeline(p, r.jobs));
  const rank = { BLOCKING_FAILURE: 0, INFRASTRUCTURE_ERROR: 1, ALLOWED_FAILURE: 2 }, classOf = (id) => (r.jobs.find((j) => j.id === id) || {}).class;
  r.facts = factsOf(r); r.likelyCauses = likelyCauses(r.jobs).sort((a, b) => (rank[classOf(a.job)] ?? 3) - (rank[classOf(b.job)] ?? 3)); r.retry = retryAdvice(r);
  return { ...r, requests: o.requests };
}

// ---- text for a person: plain words, no colour, no pictographs
export function renderText(r, { root = null } = {}) {
  const L = [], rel = (f) => (root && f ? path.relative(root, f) : f), mr = r.mr;
  if (mr) L.push(`${r.nid ? `#${r.nid} ` : ''}merge request !${mr.iid} (${mr.state}): ${mr.source_branch} -> ${mr.target_branch}, head ${short(mr.sha)}`);
  else if (r.nid) L.push(`#${r.nid}: no merge request read`);
  L.push(r.pipeline ? `Pipeline ${r.pipeline.id} (GitLab: ${r.pipeline.status}): ${r.class}` : `Pipeline: ${r.class}`, `  ${r.why}`);
  if (r.pipeline) L.push(`  ${r.pipeline.web_url}`);
  if (r.facts.length) L.push('', 'Facts (as GitLab reports them):', ...r.facts.map((f) => `  - ${f}`));
  for (const j of (r.jobs || []).filter((x) => x.class === 'BLOCKING_FAILURE' || x.class === 'INFRASTRUCTURE_ERROR' || (x.class === 'ALLOWED_FAILURE' && (x.tests || x.log)))) {
    L.push('', `${j.class === 'ALLOWED_FAILURE' ? 'Allowed failure (does not block)' : j.class === 'INFRASTRUCTURE_ERROR' ? 'Infrastructure error' : 'Blocking failure'}: ${plainName(j.name)} (job ${j.id}, ${j.failure_reason || 'no reason given'})`,
      `  job:       ${j.links.job}`);
    if (j.links.browse) L.push(`  artifacts: ${j.links.browse}${j.artifactsExpireAt ? ` (kept until ${String(j.artifactsExpireAt).slice(0, 10)})` : ''}`);
    if (j.log) L.push(`  log:       ${j.log.path ? `${rel(j.log.path)} (${j.log.from === 'cache' ? 'from the cache, not downloaded again' : 'downloaded and cached'}` : `not cached (${j.log.truncated ? 'truncated' : 'not complete'}`}; ${j.log.lines} lines${j.log.redactions ? `; ${j.log.redactions} token-shaped value(s) redacted` : ''})`);
    if (j.counts) L.push(`  tests:     ${j.counts.failed} failed, ${j.counts.error} errors of ${j.counts.total}${j.counts.capped ? ` (first ${MAX_CASES} listed)` : ''}`);
    for (const t of j.tests || []) L.push(`  ${t.status === 'error' ? 'Error' : 'Failed'}: ${t.name}${t.file ? ` at ${t.file}${t.line ? `:${t.line}` : ''}` : ''}`, ...t.excerpt.map((x) => `      ${x}`));
    if (j.excerpt && j.excerpt.length) L.push('  log excerpt:', ...j.excerpt.map((x) => `    ${String(x.line).padStart(6)}  ${x.text}`));
  }
  const allowed = (r.jobs || []).filter((j) => j.class === 'ALLOWED_FAILURE' && !j.tests);
  if (allowed.length) L.push('', 'Allowed failures (do not block; --all-failures reads their tests and logs):', ...allowed.map((j) => `  - ${plainName(j.name)} (job ${j.id})${j.suite ? `: suite ${j.suite.failed} failed, ${j.suite.error} errors of ${j.suite.total}` : ''}`));
  if (r.likelyCauses.length) {
    L.push('', 'Likely causes (from the evidence below; not confirmed):');
    for (const c of r.likelyCauses) L.push(`  - job ${c.job}${c.test ? `, ${c.test}` : ''} [${c.cause}]: ${c.summary}`, ...c.evidence.map((e) => `      evidence: ${e}`), `      check: ${c.check}`);
  }
  if (r.retry.length) L.push('', 'Retry (instructions only; the lab runs nothing):', ...r.retry.flatMap((x) => x.text.map((t, i) => `  ${i ? ' ' : '-'} ${t}`)));
  if (r.otherPipelines.length && r.pipeline) L.push('', 'Recent pipelines of this merge request:', ...r.otherPipelines.map((q) => `  ${q.id} ${q.status.padEnd(8)} ${q.ref} ${short(q.sha)}${q.id === r.pipeline.id ? '  (this one)' : ''}`));
  if (r.gaps.length) L.push('', 'Not read:', ...r.gaps.map((g) => `  - ${g.what}: ${g.class}${g.status ? ` (HTTP ${g.status})` : ''}${g.error && !String(g.error).startsWith('HTTP') ? `: ${g.error}` : ''}${g.class === 'AUTHORIZATION_BLOCKED' ? '. Read it in a browser while signed in; the lab stores no token.' : ''}`));
  if (r.notes.length) L.push('', ...r.notes);
  return `${L.join('\n')}\n`;
}

// Exit codes for the command: 0 PASS, 1 a failure that blocks (or an infrastructure error), 3 not finished, 4 not readable or unknown.
export const exitCodeOf = (c) => ({ PASS: 0, BLOCKING_FAILURE: 1, INFRASTRUCTURE_ERROR: 1, RUNNING: 3, PENDING: 3, AUTHORIZATION_BLOCKED: 4, UNKNOWN: 4 })[c] ?? 4;
