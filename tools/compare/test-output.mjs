// Read `node --test --test-reporter=tap` output (explicitly TAP at the call site, independent of TTY defaults): the counts, and for
// each failure what went wrong, where, how to rerun it alone and what usually fixes it, so nobody has to read the TAP again.
// A test FILE that cannot load (a missing package, a syntax error) is reported by node as `not ok N - <file>` with only
// "test failed"; the real exception is the child's stderr, printed as `# ` lines just BEFORE that file's `# Subtest:` line. Those
// lines are kept with the failure that follows them. When everything passes the summary stays one line.
import { PACKAGES, HOMES } from './deps.mjs';

export const CLASSES = ['MISSING_DEPENDENCY', 'MISSING_EXECUTABLE', 'LIVE_INFRASTRUCTURE', 'PERMISSION', 'SYNTAX', 'TIMEOUT', 'ASSERTION', 'ERROR', 'UNKNOWN'];

const SUMMARY = /^(tests|suites|pass|fail|cancelled|skipped|todo|duration_ms) /;
const unescapeName = (s) => s.replace(/\\#/g, '#').replace(/\\\\/g, '\\');
const unquote = (v) => {
  const t = v.trim();
  if (/^'.*'$/s.test(t)) return t.slice(1, -1).replace(/''/g, "'");
  if (/^".*"$/s.test(t)) { try { return JSON.parse(t); } catch { return t.slice(1, -1); } }
  return t === '~' ? null : t;
};

// The YAML diagnostic block of one result (lines already un-indented): flat keys, `|-` block scalars kept as text.
function parseYaml(lines) {
  const out = {};
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^([A-Za-z_]+):(?: (.*))?$/); if (!m) continue;
    if (m[2] === undefined || /^[|>]-?$/.test(m[2].trim())) {
      const body = []; while (i + 1 < lines.length && (/^ {2}/.test(lines[i + 1]) || lines[i + 1] === '')) body.push(lines[++i].replace(/^ {2}/, ''));
      out[m[1]] = body.join('\n').trim();
    } else out[m[1]] = unquote(m[2]);
  }
  return out;
}

// The results of a TAP stream: counts and the raw failures (top-level `not ok`, with nested failures and the comments before it).
export function parseTap(text) {
  const lines = String(text || '').split('\n'), failures = [];
  let pending = { comments: [], nested: [] };
  for (let i = 0; i < lines.length; i++) {
    const r = lines[i].match(/^( *)(ok|not ok) \d+ - (.*?)(?: # (?:SKIP|TODO)\b.*)?$/);
    if (r) {
      const ind = r[1], block = [];
      const inBlock = (j) => lines[j].startsWith(`${ind}  `) || (lines[j] === '' && j + 1 < lines.length && lines[j + 1].startsWith(`${ind}    `));   // a blank line inside a block scalar
      while (i + 1 < lines.length && inBlock(i + 1) && !/^ *(not ok|ok) \d+ - /.test(lines[i + 1].slice(ind.length + 2))) {
        const l = lines[++i].slice(ind.length + 2); if (l === '...') break; if (l !== '---') block.push(l);
      }
      const y = parseYaml(block), item = { ...y, name: unescapeName(r[3]), errorName: y.name || null };   // YAML `name` is the error class
      if (ind.length) { if (r[2] === 'not ok') pending.nested.push(item); continue; }
      if (r[2] === 'not ok') failures.push({ ...item, comments: pending.comments, nested: pending.nested });
      pending = { comments: [], nested: [] }; continue;
    }
    const c = lines[i].match(/^# (.*)$/);
    if (c && !c[1].startsWith('Subtest: ') && !SUMMARY.test(c[1])) pending.comments.push(c[1]);
  }
  const count = (k) => { const m = String(text || '').match(new RegExp(`^# ${k} (\\d+)`, 'm')); return m ? Number(m[1]) : undefined; };
  return { passed: count('pass'), failed: count('fail'), failures };
}

const rel = (p, root) => { if (!p) return p; const s = String(p).replace(/^file:\/\//, ''); return root && s.startsWith(`${root}/`) ? s.slice(root.length + 1) : s; };
const shq = (s) => `'${String(s).replace(/'/g, `'\\''`)}'`;
const reEscape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// One failure, explained: { name, file, line, class, errorType, code, message, missing, importer, executable, host, rerun, fix, expected, actual }.
export function describeFailure(raw, { root = '' } = {}) {
  const loc = String(raw.location || '').match(/^(.*):(\d+):\d+$/);
  const file = loc ? rel(loc[1], root) : null, line = loc ? Number(loc[2]) : null;
  const stderr = raw.comments || [], nested = (raw.nested || [])[0];
  const src = nested && (!raw.error || /subtests? failed/.test(raw.error)) ? nested : raw;
  const text = [src.error, ...stderr, src.stack].filter(Boolean).join('\n');
  // The root exception: an "<Type> [<CODE>]: message" line in the child's stderr wins over node's "test failed".
  const thrown = stderr.map((l) => l.match(/^(\w*(?:Error|Exception))(?: \[([A-Z0-9_]+)\])?: (.+)$/)).find(Boolean);
  const out = { name: raw.name, file, line, class: 'UNKNOWN', errorType: thrown?.[1] || src.errorName || null, code: thrown?.[2] || src.code || null, failureType: raw.failureType || null };
  out.message = (thrown?.[3] || (src.error && src.error !== 'test failed' ? src.error : '') || stderr.filter((l) => l.trim()).slice(-1)[0] || src.error || '').split('\n').find((l) => l.trim()) || '';
  const pkg = text.match(/Cannot find (?:package|module) '([^']+)'/), notInstalled = text.match(/\b([@\w./-]+) is not installed\b/);
  const importer = text.match(/imported from (\S+)/), exe = text.match(/spawn (\S+) ENOENT|(?:^|\s)(\S+): command not found|does not run (\S+) \(called:/m);
  const host = text.match(/refused a connection to (\S+?)(?: \(|$)/m);
  if (importer) out.importer = rel(importer[1], root);
  if (src.expected !== undefined) out.expected = String(src.expected).slice(0, 160);
  if (src.actual !== undefined) out.actual = String(src.actual).slice(0, 160);
  const isFileLevel = file && raw.name === file;

  if (/HERMETIC|EHERMETIC|transport '\w+' not allowed/.test(text)) {
    out.class = 'LIVE_INFRASTRUCTURE';
    if (exe) out.executable = exe[1] || exe[2] || exe[3]; if (host) out.host = host[1];
    out.fix = `the test reached ${out.executable ? `the real ${out.executable}` : out.host ? out.host : 'a remote git URL'}: give it a stand-in (tools/compare/hermetic.mjs standIn), a server on 127.0.0.1 or a local repository; never stop or unlist DDEV projects to make it pass`;
  } else if ((pkg && !/^[./]/.test(pkg[1])) || notInstalled) {
    out.class = 'MISSING_DEPENDENCY';
    const name = pkg ? pkg[1].split('/').slice(0, pkg[1].startsWith('@') ? 2 : 1).join('/') : notInstalled[1];
    out.missing = name;
    const known = PACKAGES[name];
    out.fix = known ? `${known.home === 'deps' ? `${HOMES.deps.install} ${name}${known.major ? `@${known.major}` : ''}` : HOMES.playwright.install}; in a secondary worktree: node scripts/deps.mjs link. Check: node scripts/deps.mjs check --for=selftest`
      : `${name} is not a package the lab lists (tools/compare/deps.mjs): add it to tools/playwright/package.json, or remove the import`;
  } else if (exe && !/HERMETIC/.test(text)) {
    out.class = 'MISSING_EXECUTABLE'; out.executable = exe[1] || exe[2] || exe[3];
    out.fix = `${out.executable} is not on PATH: install it, or (in a unit test) give the test a stand-in (tools/compare/hermetic.mjs standIn)`;
  } else if (/\bE(PERM|ACCES)\b/.test(`${src.code || ''} ${text}`)) {
    out.class = 'PERMISSION';
    out.fix = /listen E(PERM|ACCES)|connect EPERM/.test(text) ? 'this process may not use local ports here (a sandbox that forbids binding 127.0.0.1): not a lab failure; rerun where local ports are allowed' : 'the operating system refused a file or process operation: check permissions or the sandbox, then rerun';
  } else if (/SyntaxError/.test(`${out.errorType} ${text}`)) {
    out.class = 'SYNTAX';
    const where = stderr.map((l) => l.match(/^(file:\/\/)?(\/\S+?\.m?js):(\d+)$/)).find(Boolean);
    if (where) { out.file = rel(where[2], root); out.line = Number(where[3]); }
    out.fix = `node --check ${out.file || file}`;
  } else if (/cancelledByParent|timedOut|timed out|ETIMEDOUT/.test(`${raw.failureType} ${text}`)) {
    out.class = 'TIMEOUT'; out.fix = 'rerun it alone; look for a child process or server that never ends';
  } else if (/AssertionError|ERR_ASSERTION/.test(`${src.errorName} ${src.code}`)) {
    out.class = 'ASSERTION'; out.fix = 'the expectation failed: rerun it alone and compare expected with actual';
  } else if (out.errorType || src.error) {
    out.class = 'ERROR'; out.fix = 'an exception: rerun it alone and read the stack';
  }
  if (isFileLevel || !file) out.rerun = file ? `node --test ${file}` : null;
  else out.rerun = `node --test --test-name-pattern=${shq(`^${reEscape(src === nested ? nested.name : raw.name)}$`)} ${file}`;
  if (isFileLevel) out.scope = 'file did not run';
  return out;
}

const oneLine = (s, n = 220) => String(s || '').replace(/\s+/g, ' ').trim().slice(0, n);

// The verdict on one `node --test` run: { ok, detail, passed, failed, failures }. `detail` is short: the counts, a count per class,
// then up to `limit` failures with their rerun command and fix.
export function testRunSummary(result, { root = '', limit = 8 } = {}) {
  const stdout = result.stdout || '', stderr = result.stderr || '';
  const tap = parseTap(stdout), complete = tap.passed !== undefined && tap.failed !== undefined;
  const ok = result.status === 0 && complete && tap.failed === 0;
  const failures = tap.failures.map((f) => describeFailure(f, { root }));
  let detail = complete ? `${tap.passed} passed, ${tap.failed} failed` : 'test summary unavailable';
  if (!ok) {
    const byClass = {}; for (const f of failures) byClass[f.class] = (byClass[f.class] || 0) + 1;
    const lines = [];
    if (failures.length) lines.push(`by class: ${Object.entries(byClass).map(([k, n]) => `${k} ${n}`).join(', ')}`);
    for (const f of failures.slice(0, limit)) {
      lines.push(`[${f.class}] ${f.file || '(no file)'}${f.line && f.line > 1 ? `:${f.line}` : ''}${f.scope ? ` (${f.scope})` : ''}: ${oneLine(f.name, 140)}`);
      lines.push(`    ${f.errorType ? `${f.errorType}${f.code && !String(f.message).includes(f.code) ? ` [${f.code}]` : ''}: ` : ''}${oneLine(f.message)}`);
      if (f.expected !== undefined || f.actual !== undefined) lines.push(`    expected ${oneLine(f.expected, 100)}, actual ${oneLine(f.actual, 100)}`);
      const facts = [f.missing && `missing package: ${f.missing}`, f.importer && `imported from ${f.importer}`, f.executable && `executable: ${f.executable}`, f.host && `host: ${f.host}`].filter(Boolean);
      if (facts.length) lines.push(`    ${facts.join('; ')}`);
      if (f.rerun) lines.push(`    rerun: ${f.rerun}`);
      if (f.fix) lines.push(`    fix: ${f.fix}`);
    }
    if (failures.length > limit) lines.push(`... and ${failures.length - limit} more`);
    if (!failures.length) {
      const extra = [result.error?.message, result.signal && `signal ${result.signal}`, `exit ${result.status}`, stderr.trim().slice(0, 3000)].filter(Boolean);
      lines.push(...(extra.length ? extra : [stdout.slice(-3000)]));
    }
    detail += ':\n' + lines.join('\n');
  }
  return { ok, detail, passed: tap.passed, failed: tap.failed, failures };
}
