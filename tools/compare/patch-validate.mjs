// Is a stored patch what it says it is? Read-only checks for reports/issues/<nid>/branches/*.patch and proposals (AGENTS.md rules 1 and 17).
//   parse       a unified diff whose hunk line counts add up. A context line that is a lone space is how a unified diff writes an EMPTY
//               source line: it is patch syntax, not trailing whitespace. `git diff --check` (or an editor) run on the .patch FILE flags
//               it; nothing here does. A context line whose space was stripped (an empty line) is accepted, as git apply accepts it.
//   base        the declared start revision is a commit here, and each file's pre-image (the patch's `index <old>..` line) is that
//               revision's blob: a patch made against another revision is named even when it happens to apply
//   applies     to the declared start revision, in a temporary index (GIT_INDEX_FILE) with a temporary object directory that borrows
//               the repository's objects: the repository, its index, its refs and its object store are never written
//   files       the files it changes equal the expected list (missing and extra are named)
//   whitespace  of the RESULTING source: `git diff --cached --check <base>` between the start revision and the patched temporary index.
//               Only lines the patch adds are judged, by git's own rules (core.whitespace defaults)
//   equivalent  a full patch and an interdiff give the same result (rule 17), allowing for files core changed between their bases
// Nothing here edits a patch. A corrected version is a new file with provenance: node scripts/patch-change.mjs record <patch> ...
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { patchFileList } from './patch-state.mjs';

// Auto-gc and maintenance off (a background gc after a fetch breaks the next shallow fetch: "shallow file has changed"); no colour, no
// external diff, no prefix changes from personal configuration.
const GITC = ['-c', 'gc.auto=0', '-c', 'maintenance.auto=false', '-c', 'color.ui=false', '-c', 'diff.noprefix=false', '-c', 'diff.external=', '-c', 'core.quotePath=false'];
const firstLine = (r) => `${r.stderr || ''}${r.stdout || ''}`.trim().split('\n')[0].slice(0, 240);

// A repository named by a path: a bare repository (envs/core.git), a checkout, or a linked worktree whose `.git` is a file. A bare one
// is always addressed with --git-dir: agent shells set safe.bareRepository=explicit, which refuses `git -C <bare>`. Paths come from git
// (--git-common-dir, --git-path), never from assuming `<dir>/.git` is a folder.
export function openRepo(dir) {
  const abs = path.resolve(dir);
  if (!fs.existsSync(abs)) return { ok: false, error: `${dir} does not exist` };
  const bare = fs.existsSync(path.join(abs, 'HEAD')) && fs.existsSync(path.join(abs, 'objects')) && !fs.existsSync(path.join(abs, '.git'));
  const repo = { dir: abs, bare, args: bare ? [`--git-dir=${abs}`] : ['-C', abs] };
  const r = git(repo, ['rev-parse', '--path-format=absolute', '--git-common-dir', '--git-path', 'objects', '--git-path', 'shallow', '--is-shallow-repository']);
  if (r.status !== 0) return { ok: false, error: `${dir} is not a git repository: ${firstLine(r)}` };
  const [commonDir, objects, shallowFile, shallow] = r.stdout.trim().split('\n');
  return { ok: true, ...repo, commonDir, objects, shallowFile, shallow: shallow === 'true' };
}

export function git(repo, args, { env, input, buffer } = {}) {
  return spawnSync('git', [...GITC, ...repo.args, ...args], { encoding: buffer ? 'buffer' : 'utf8', maxBuffer: 1 << 28, env: env || process.env, input });
}
export const revParse = (repo, rev) => { const r = git(repo, ['rev-parse', '--verify', '--quiet', `${rev}^{commit}`]); return r.status === 0 ? r.stdout.trim() : ''; };
const blobAt = (repo, rev, file, env) => { const r = git(repo, ['rev-parse', '--verify', '--quiet', `${rev}:${file}`], { env }); return r.status === 0 ? r.stdout.trim() : ''; };
const readBlob = (repo, blob, env) => (blob ? git(repo, ['cat-file', 'blob', blob], { env }).stdout : '');

// A temporary index and object directory. New blobs and trees go to <tmp>/objects; everything else is read from the repository's own
// objects (GIT_ALTERNATE_OBJECT_DIRECTORIES). index() gives a fresh environment for one tree.
export function scratch(repo) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'lab-patch-validate-')), objects = path.join(tmp, 'objects');
  fs.mkdirSync(objects);
  const base = { ...process.env, GIT_OBJECT_DIRECTORY: objects, GIT_ALTERNATE_OBJECT_DIRECTORIES: [repo.objects, process.env.GIT_ALTERNATE_OBJECT_DIRECTORIES].filter(Boolean).join(path.delimiter) };
  let n = 0;
  return { env: base, index: () => ({ ...base, GIT_INDEX_FILE: path.join(tmp, `index-${++n}`) }), cleanup: () => fs.rmSync(tmp, { recursive: true, force: true }) };
}

// Parse a unified diff. Returns { files: [{ a, b, oldIndex, newIndex, hunks, added: [{ text, line }] }], errors, emptyContext,
// strippedContext, crlf }. errors name the patch line. Text outside hunks (a commit message, `new file mode`, `rename from`) is ignored.
export function parsePatch(text) {
  const lines = String(text).split('\n'); if (lines[lines.length - 1] === '') lines.pop();
  const out = { files: [], errors: [], emptyContext: 0, strippedContext: 0, crlf: 0 };
  let file = null, hunk = null;
  const open = () => hunk && (hunk.old > 0 || hunk.new > 0);
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i], at = i + 1;
    if (l.endsWith('\r')) out.crlf++;
    if (open()) {
      if (l === '') { out.strippedContext++; hunk.old--; hunk.new--; continue; }
      const c = l[0];
      if (c === ' ') { if (l === ' ') out.emptyContext++; hunk.old--; hunk.new--; }
      else if (c === '-') hunk.old--;
      else if (c === '+') { hunk.new--; file.added.push({ text: l.slice(1), line: at }); }
      else if (c === '\\') continue;
      else { out.errors.push(`line ${at}: the hunk "${hunk.header}" ends early: ${Math.max(hunk.old, 0)} old and ${Math.max(hunk.new, 0)} new line(s) still expected`); hunk = null; i--; continue; }
      if (hunk.old < 0 || hunk.new < 0) { out.errors.push(`line ${at}: more lines than the hunk "${hunk.header}" declares`); hunk = null; }
      continue;
    }
    hunk = null;
    let m;
    if ((m = l.match(/^diff --git a\/(.+?) b\/(.+)$/))) { file = { a: m[1], b: m[2], oldIndex: '', newIndex: '', hunks: 0, added: [], binary: false }; out.files.push(file); continue; }
    if (file && (m = l.match(/^index ([0-9a-f]+)\.\.([0-9a-f]+)/))) { file.oldIndex = m[1]; file.newIndex = m[2]; continue; }
    if (l.startsWith('GIT binary patch') || /^Binary files .* differ$/.test(l)) { if (file) file.binary = true; continue; }
    if ((m = l.match(/^--- (?:a\/(.+?)|\/dev\/null)(?:\t.*)?$/))) {
      if (!file || file.hunks) { file = { a: m[1] || '', b: '', oldIndex: '', newIndex: '', hunks: 0, added: [], binary: false }; out.files.push(file); }
      continue;
    }
    if ((m = l.match(/^\+\+\+ (?:b\/(.+?)|\/dev\/null)(?:\t.*)?$/))) { if (file && !file.b) file.b = m[1] || ''; continue; }
    if ((m = l.match(/^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/))) {
      if (!file) { out.errors.push(`line ${at}: a hunk before any file header`); continue; }
      hunk = { header: l.slice(0, 60), old: m[2] === undefined ? 1 : Number(m[2]), new: m[4] === undefined ? 1 : Number(m[4]) }; file.hunks++;
      continue;
    }
  }
  if (open()) out.errors.push(`the patch ends inside the hunk "${hunk.header}": ${hunk.old} old and ${hunk.new} new line(s) missing`);
  if (!out.files.length) out.errors.push('no file changes found: not a unified diff');
  return out;
}

// The tree a patch produces from `rev`, built in the scratch: { ok, tree, error, reverse }.
export function applyToTree(repo, sc, rev, patch) {
  const env = sc.index();
  const rt = git(repo, ['read-tree', rev], { env });
  if (rt.status !== 0) return { ok: false, error: `cannot read ${rev}: ${firstLine(rt)}` };
  const ap = git(repo, ['apply', '--cached', '--whitespace=nowarn', '-'], { env, input: patch });
  if (ap.status !== 0) return { ok: false, error: firstLine(ap), reverse: git(repo, ['apply', '--cached', '--check', '--reverse', '-'], { env, input: patch }).status === 0 };
  const wt = git(repo, ['write-tree'], { env });
  return wt.status === 0 ? { ok: true, tree: wt.stdout.trim(), env } : { ok: false, error: firstLine(wt) };
}

// git diff --check output: "path:line: what.\n+text" pairs.
export function parseCheck(stdout) {
  const found = [];
  for (const m of String(stdout).matchAll(/^(.+?):(\d+): (.+?)\.?\n(.*)$/gm)) found.push({ file: m[1], line: Number(m[2]), problem: m[3], text: m[4] });
  return found;
}

// Every check on one patch. { ok, checks: [{ name, status: ok|FAIL|WARN|skip, detail }], parse, files, tree, whitespace }
//   repo     openRepo() result     patch  Buffer or string     base  the declared start revision     expect  file list or null
export function validatePatch({ repo, patch, base, expect = null, sc: given = null }) {
  const buf = Buffer.isBuffer(patch) ? patch : Buffer.from(String(patch)), text = buf.toString('utf8');
  const checks = [], add = (name, status, detail = '') => checks.push({ name, status, detail });
  const parse = parsePatch(text), files = patchFileList(text), res = { checks, parse, files, tree: '', whitespace: [] };
  add('parse', parse.errors.length ? 'FAIL' : 'ok', parse.errors.length ? parse.errors.slice(0, 4).join('; ')
    : `${parse.files.length} file(s)${parse.emptyContext ? `; ${parse.emptyContext} context line(s) are a lone space: an empty source line in diff syntax, not trailing whitespace` : ''}${parse.strippedContext ? `; ${parse.strippedContext} empty context line(s) lost their leading space (git apply accepts them; some tools do not)` : ''}${parse.crlf ? `; ${parse.crlf} line(s) end in CRLF` : ''}`);
  const sha = base ? revParse(repo, base) : '';
  if (!base) add('declared start revision', 'FAIL', 'none given (--base <rev>): a patch is only evidence against the revision it starts from');
  else if (!sha) add('declared start revision', 'FAIL', `${base} is not a commit in ${repo.dir}${repo.shallow ? ' (the history here is shallow: fetch that commit, see node scripts/prepare-push.mjs)' : ''}`);
  else {
    const wrong = [];
    for (const f of parse.files.filter((x) => x.oldIndex && !/^0+$/.test(x.oldIndex) && x.a)) {
      const blob = blobAt(repo, sha, f.a);
      if (!blob.startsWith(f.oldIndex)) wrong.push(`${f.a} (patch ${f.oldIndex.slice(0, 10)}, ${base} ${blob ? blob.slice(0, 10) : 'absent'})`);
    }
    add('declared start revision', wrong.length ? 'FAIL' : 'ok', wrong.length ? `made against other versions of: ${wrong.slice(0, 4).join('; ')}${wrong.length > 4 ? ` and ${wrong.length - 4} more` : ''}` : `${sha.slice(0, 12)}${parse.files.some((x) => x.oldIndex) ? ': each pre-image blob matches' : ''}`);
  }
  const sc = given || scratch(repo);
  try {
    if (!sha || parse.errors.length) add('applies', 'skip', !sha ? 'no start revision to apply to' : 'the patch does not parse');
    else {
      const ap = applyToTree(repo, sc, sha, buf);
      if (!ap.ok) add('applies', 'FAIL', `to ${sha.slice(0, 12)}: ${ap.error}${ap.reverse ? '. It applies in reverse: that revision already has these changes' : ''}`);
      else {
        res.tree = ap.tree;
        add('applies', 'ok', `to ${sha.slice(0, 12)} (temporary index; the repository was not written)`);
        const ck = git(repo, ['diff', '--cached', '--check', sha], { env: ap.env });
        res.whitespace = parseCheck(ck.stdout);
        add('whitespace of the resulting source', res.whitespace.length ? 'FAIL' : 'ok', res.whitespace.length
          ? res.whitespace.slice(0, 5).map((w) => `${w.file}:${w.line} ${w.problem}`).join('; ') + (res.whitespace.length > 5 ? ` and ${res.whitespace.length - 5} more` : '')
          : 'git diff --check of the patched files against the start revision: clean (only lines the patch adds are judged)');
      }
    }
  } finally { if (!given) sc.cleanup(); }
  if (expect) {
    const want = [...new Set(expect)].sort(), missing = want.filter((f) => !files.includes(f)), extra = files.filter((f) => !want.includes(f));
    add('expected files', missing.length || extra.length ? 'FAIL' : 'ok', missing.length || extra.length
      ? `${missing.length ? `missing: ${missing.join(', ')}` : ''}${missing.length && extra.length ? '; ' : ''}${extra.length ? `not expected: ${extra.join(', ')}` : ''}` : `${files.length} file(s), as expected`);
  }
  res.ok = !checks.some((c) => c.status === 'FAIL');
  return res;
}

const changedNames = (repo, a, b, env) => git(repo, ['diff-tree', '-r', '--no-renames', '--name-only', '-z', a, b], { env }).stdout.split('\0').filter(Boolean);
const lineBag = (s) => { const m = new Map(); for (const l of String(s).split('\n')) m.set(l, (m.get(l) || 0) + 1); return m; };
const minus = (a, b) => [...a].flatMap(([l, n]) => Array(Math.max(0, n - (b.get(l) || 0))).fill(l)).sort();
const sameList = (x, y) => x.length === y.length && x.every((v, i) => v === y[i]);

// AGENTS.md rule 17: the full patch on its base and the interdiff on the prior proposal give the same proposal. For each file either
// side changes: the same content, or (when core changed that file between the two bases) the same lines added and removed.
//   full, fullBase       the full patch and the core commit it starts from
//   interdiff, priorTip  the interdiff and the prior proposal it starts from (an MR tip)
//   priorBase            the core commit under the prior proposal; default merge-base(priorTip, fullBase), which a shallow clone may lack
// { state: equivalent|differs|unknown, files: [{ file, result }], detail }
export function equivalence({ repo, full, fullBase, interdiff, priorTip, priorBase = '' }) {
  const sc = scratch(repo);
  try {
    const nb = revParse(repo, fullBase), tip = revParse(repo, priorTip);
    if (!nb || !tip) return { state: 'unknown', files: [], detail: `${!nb ? fullBase : priorTip} is not a commit here` };
    let ob = priorBase ? revParse(repo, priorBase) : '';
    if (!ob && !priorBase) { const mb = git(repo, ['merge-base', tip, nb]); ob = mb.status === 0 ? mb.stdout.trim().split('\n')[0] : ''; }
    if (!ob) return { state: 'unknown', files: [], detail: priorBase ? `${priorBase} is not a commit here` : `no common ancestor of ${priorTip} and ${fullBase} in the history here${repo.shallow ? ' (shallow clone: name it with --prior-base, or fetch more history: node scripts/prepare-push.mjs)' : ''}` };
    const x = applyToTree(repo, sc, tip, interdiff), y = applyToTree(repo, sc, nb, full);
    if (!x.ok) return { state: 'differs', files: [], detail: `the interdiff does not apply to ${priorTip}: ${x.error}` };
    if (!y.ok) return { state: 'differs', files: [], detail: `the full patch does not apply to ${fullBase}: ${y.error}` };
    const env = sc.env, all = [...new Set([...changedNames(repo, ob, x.tree, env), ...changedNames(repo, nb, y.tree, env)])].sort(), files = [];
    for (const f of all) {
      const bx = blobAt(repo, x.tree, f, env), by = blobAt(repo, y.tree, f, env);
      if (bx === by) { files.push({ file: f, result: 'same' }); continue; }
      const bo = blobAt(repo, ob, f, env), bn = blobAt(repo, nb, f, env);
      if (bo === bn) { files.push({ file: f, result: 'differs' }); continue; }
      const [o, xx, n, yy] = [bo, bx, bn, by].map((b) => lineBag(readBlob(repo, b, env)));
      const same = sameList(minus(xx, o), minus(yy, n)) && sameList(minus(o, xx), minus(n, yy));
      files.push({ file: f, result: same ? 'same change, core base differs' : 'differs' });
    }
    const bad = files.filter((f) => f.result === 'differs');
    return { state: bad.length ? 'differs' : 'equivalent', files, detail: bad.length ? `differ: ${bad.map((f) => f.file).join(', ')}` : `${files.length} file(s) agree${files.some((f) => f.result !== 'same') ? ` (${files.filter((f) => f.result !== 'same').length} on a core base that changed)` : ''}` };
  } finally { sc.cleanup(); }
}
