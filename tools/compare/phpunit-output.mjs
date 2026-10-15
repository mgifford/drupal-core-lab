// Pure helpers for scripts/try-tests.mjs: read the output of PHPUnit, PHPCS and PHPStan, decide what a Before/After pair of
// results means, and draw the table. No DDEV and no file access, so tests/lab can run them on fixture strings.

// PHPUnit colours its summary even without a terminal; ddev adds a line of its own when the run fails.
export const stripAnsi = (s) => String(s).replace(/\x1b\[[0-9;?]*[A-Za-z]|\x1b\(B/g, '').replace(/\r/g, '');

// "There were 2 errors:" and its siblings. Anything not listed (deprecations, notices) is not a result for a test method.
const SECTIONS = [[/^failures?$/, 'FAIL'], [/^errors?$/, 'ERROR'], [/^skipped tests?$/, 'skip'], [/^risky tests?$/, 'risky'], [/^warnings?$/, 'warn'], [/^incomplete tests?$/, 'incomplete']];
const NOISE = /^(Clearing old webdriver sessions|PHPUnit \S+ by |Runtime:|Configuration:|Random Seed:|Time:|HTML output was generated|http:\/\/web\/sites\/simpletest|Failed to run phpunit)|^\s*$/;

// What one `ddev phpunit <path>` run said.
//   ok: true (OK, also "OK, but there were issues"), false (failures or errors), null (no result: crashed, timed out, never started)
//   problems: one entry per numbered item: { kind, class, method, message } (message is the first line PHPUnit gives)
export function parsePhpunit(raw) {
  const text = stripAnsi(raw), lines = text.split('\n');
  const out = { phpunit: (text.match(/^PHPUnit (\S+) by /m) || [])[1], php: (text.match(/^Runtime:\s+PHP (\S+)/m) || [])[1], time: (text.match(/^Time: ([\d:.]+)/m) || [])[1], tests: null, assertions: null, counts: {}, ok: null, problems: [], detail: '' };
  const okLine = text.match(/^OK \((\d+) tests?, (\d+) assertions?\)/m);
  const totals = text.match(/^Tests: (\d+)(?:, Assertions: (\d+))?((?:, [A-Za-z][A-Za-z ]*: \d+)*)\.?\s*$/m);
  if (okLine) Object.assign(out, { ok: true, tests: Number(okLine[1]), assertions: Number(okLine[2]) });
  else if (totals) {
    Object.assign(out, { tests: Number(totals[1]), assertions: totals[2] === undefined ? null : Number(totals[2]) });
    for (const m of totals[3].matchAll(/([A-Za-z][A-Za-z ]*): (\d+)/g)) out.counts[m[1]] = Number(m[2]);
    out.ok = !(out.counts.Errors || out.counts.Failures);
  }
  let kind = null;
  for (let i = 0; i < lines.length; i++) {
    const head = lines[i].match(/^There (?:was|were) \d+ (.+?):$/);
    if (head) { kind = (SECTIONS.find(([re]) => re.test(head[1].toLowerCase())) || [])[1] || null; continue; }
    const item = lines[i].match(/^\d+\) ([\w\\]+)::(\w+)(?: with data set .*)?$/);
    if (item && kind) {
      let j = i + 1; while (j < lines.length && !lines[j].trim()) j++;
      out.problems.push({ kind, class: item[1], method: item[2], message: (lines[j] || '').trim() });
    }
  }
  if (out.ok === null) out.detail = lines.map((l) => l.trim()).filter((l) => !NOISE.test(l)).slice(0, 3).join(' / ').slice(0, 220) || 'no PHPUnit result in the output';
  return out;
}

// "OK (3 tests, 26 assertions)" or "Tests: 3, Assertions: 26, Failures: 2", the form EVIDENCE.md uses.
export function summaryLine(p) {
  if (p.ok === null) return `no result (${p.detail})`;
  if (p.ok && !Object.keys(p.counts).length) return `OK (${p.tests} test${p.tests === 1 ? '' : 's'}, ${p.assertions} assertion${p.assertions === 1 ? '' : 's'})`;
  return `Tests: ${p.tests}${p.assertions === null ? '' : `, Assertions: ${p.assertions}`}${Object.entries(p.counts).map(([k, n]) => `, ${k}: ${n}`).join('')}`;
}

// The public test methods a PHP file declares: `test*` by name, or any public method tagged #[Test].
export function testMethods(php) {
  const names = []; let tagged = false;
  for (const line of String(php).split('\n')) {
    if (/^\s*#\[(?:\\?PHPUnit\\Framework\\Attributes\\)?Test\b/.test(line)) { tagged = true; continue; }
    const m = line.match(/^\s*(?:public\s+)?function\s+(\w+)\s*\(/);
    if (m && (tagged || /^test/.test(m[1]))) names.push(m[1]);
    if (!/^\s*(#\[|\*|\/\*|$)/.test(line)) tagged = false;   // an attribute or a doc comment applies to the next line of code only
  }
  return names;
}

// What one method did: pass, FAIL, ERROR, skip, risky, warn, incomplete, or crash (the run gave no result at all).
export function methodStatus(p, shortClass, method) {
  if (p.ok === null) return 'crash';
  const hits = p.problems.filter((x) => x.method === method && x.class.split('\\').pop() === shortClass);
  return ['ERROR', 'FAIL', 'incomplete', 'skip', 'risky', 'warn'].find((k) => hits.some((h) => h.kind === k)) || 'pass';
}

const failing = (s) => ['FAIL', 'ERROR', 'crash', 'incomplete'].includes(s);
const passing = (s) => ['pass', 'risky', 'warn'].includes(s);

// The meaning of a Before/After pair for a test that is meant to be proof of a change.
export function verdictFor(before, after) {
  if (failing(before) && passing(after)) return { kind: 'useful', text: 'fails without the change, passes with it', problem: false };
  if (passing(before) && passing(after)) return { kind: 'guard', text: 'passes on both (regression guard)', problem: false };
  if (failing(before) && failing(after)) return { kind: 'both-fail', text: 'PROBLEM: fails on both', problem: true };
  if (passing(before) && failing(after)) return { kind: 'only-before', text: 'PROBLEM: passes only Before', problem: true };
  const skipped = [before === 'skip' && 'Before', after === 'skip' && 'After'].filter(Boolean).join(' and ');
  return { kind: 'not-run', text: `PROBLEM: skipped on ${skipped || 'one side'}`, problem: true };
}

// An existing core test (a file or a folder) says nothing about the change when it behaves the same on both sides; only a
// failure that appears on After is a problem. Failures are compared by name, so a folder that fails the same way on both sides is "same".
export function verdictExisting(before, after) {
  const names = (p) => (p.ok === null ? ['(no result)'] : p.problems.filter((x) => x.kind === 'FAIL' || x.kind === 'ERROR').map((x) => `${x.class.split('\\').pop()}::${x.method}`));
  const b = new Set(names(before)), a = names(after).filter((n) => !b.has(n)), fixed = [...b].filter((n) => !names(after).includes(n));
  const bad = before.ok === true ? after.ok !== true : a.length > 0;
  if (bad) return { kind: 'regression', text: `PROBLEM: fails on After only (${a.slice(0, 3).join(', ')}${a.length > 3 ? ', ...' : ''})`, problem: true };
  if (before.ok !== true && after.ok === true) return { kind: 'fixed', text: 'fails Before, passes After', problem: false };
  if (before.ok !== true) return { kind: 'same-fail', text: `fails the same way on both${fixed.length ? `; fixed on After: ${fixed.length}` : ''} (not caused by the change)`, problem: false };
  return { kind: 'same-pass', text: 'passes on both', problem: false };
}

// PHPCS and PHPStan: one result each, "clean", "FAIL" (findings, one `file:line message` per line) or "ERROR" (the tool did not
// run, which says nothing about the files; the same distinction scripts/lint.mjs makes).
const TOOL_ERROR = /Cannot find module|command not found|No such file or directory|PHP Fatal error|PHPStan process crashed|Allowed memory size|reached configured PHP memory limit|could not be found/;
export function classifyLint(tool, status, raw, files = []) {
  const text = stripAnsi(raw).replace(/\/var\/www\/html\//g, ''), lines = text.split('\n');
  const tidy = (l) => l.replace(/\s+/g, ' ').trim();
  // PHPStan shows a bare file name when one file was analysed; `files` (paths inside the checkout) say which file that was.
  const named = (f) => files.find((x) => x === f || x.endsWith(`/${f}`)) || f;
  const found = []; let file = '', wrapping = false;
  for (const l of lines) {
    const head = tool === 'phpcs' ? l.match(/^FILE: (.+)$/) : l.match(/^\s+Line\s+(\S.*)$/);
    if (head) { file = named(head[1].trim()); wrapping = false; continue; }
    const m = tool === 'phpcs' ? l.match(/^\s*(\d+) \| (ERROR|WARNING)\s+\| (?:\[.\] )?(.+)$/) : l.match(/^\s+(\d+)\s{2,}(\S.*)$/);
    if (m && file) { found.push(`${file}:${m[1]} ${tool === 'phpcs' ? `${m[2].toLowerCase()} ${tidy(m[3])}` : tidy(m[2])}`); wrapping = true; continue; }
    // a long message continues on the next lines (PHPCS: `   |       |     it`; PHPStan: indented, then a `🪪 identifier` line that ends it)
    const more = tool === 'phpcs' ? l.match(/^\s*\|\s*\|\s+(\S.*)$/) : l.match(/^\s{6,}(?!\s*(?:🪪|💡))(\S.*?)\s*$/u);
    if (more && wrapping && !/^\s*-+(\s+-+)*\s*$/.test(l)) found[found.length - 1] += ` ${tidy(more[1])}`; else wrapping = false;
  }
  if (status === 0) return { result: 'clean', lines: [] };
  const err = (text.match(TOOL_ERROR) || [])[0];
  if (found.length) return { result: 'FAIL', lines: found };
  return { result: 'ERROR', lines: [err ? tidy(lines.find((l) => l.includes(err))).slice(0, 160) : `exit ${status}: ${lines.map(tidy).filter(Boolean).slice(0, 2).join(' / ').slice(0, 160)}`] };
}

// Plain-text table, columns padded to the widest cell.
export function renderTable(header, rows) {
  const all = [header, ...rows], w = header.map((_, i) => Math.max(...all.map((r) => String(r[i]).length)));
  return all.map((r) => r.map((c, i) => (i === r.length - 1 ? String(c) : String(c).padEnd(w[i]))).join('  ')).join('\n');
}

export function renderMarkdownTable(header, rows) {
  const cell = (c) => String(c).replace(/\|/g, '\\|');
  return [header, header.map(() => '---'), ...rows].map((r) => `| ${r.map(cell).join(' | ')} |`).join('\n');
}
