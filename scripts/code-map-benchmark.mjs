// What scripts/code-map.mjs saves per lookup, measured on a fixed list of lookups in one core checkout (AI-usage Phase 2).
//   node scripts/code-map-benchmark.mjs [<checkout folder or env name>] [--json <file>]      (default env: baseline-3618230-latest)
// For each lookup it runs, for real, (a) a MODELLED manual chain, the grep, sed and grep calls an assistant makes by hand, and (b) one
// code-map call, and reports calls and the bytes each puts into the conversation. The manual chain is a model, not a recording: it is
// generous to the manual side (the search skips vendored code like code-map does, and the file region it reads is the exact body, found
// with code-map's own answer). The saving in calls is by construction (3 to 1, 2 to 1); the bytes are measured. It says nothing about
// cost in a session: see reports/ai-usage/phase-2/RESULTS.md for what the recorded sessions allow us to say.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync, execFileSync } from 'node:child_process';
import { labRoot } from '../tools/compare/lib.mjs';

const args = process.argv.slice(2), jsonOut = args.includes('--json') ? args[args.indexOf('--json') + 1] : null;
const target = args.find((a, i) => !a.startsWith('--') && args[i - 1] !== '--json') || 'baseline-3618230-latest';
const mainCheckout = () => { try { return path.dirname(path.resolve(labRoot, execFileSync('git', ['rev-parse', '--git-common-dir'], { cwd: labRoot, encoding: 'utf8' }).trim())); } catch { return labRoot; } };
const root = [path.resolve(target), path.join(labRoot, 'envs', target), path.join(mainCheckout(), 'envs', target)].find((p) => fs.existsSync(p) && fs.statSync(p).isDirectory());
if (!root) { console.error(`${target}: no such checkout`); process.exit(2); }
const sh = (cmd, a) => spawnSync(cmd, a, { cwd: root, encoding: 'utf8', maxBuffer: 1 << 27 }).stdout || '';
const SPECS = ['*.php', '*.module', '*.inc', '*.js', '*.yml', '*.twig'], SKIP = [':(exclude)vendor', ':(exclude)core/assets/vendor', ':(exclude)node_modules', ':(exclude)core/node_modules', ':(exclude)*.min.js', ':(exclude)core/.phpstan-baseline.php'];
const grepWord = (w) => sh('git', ['grep', '-n', '-I', '-w', '-F', '--untracked', '--exclude-standard', '-e', w, '--', ...SPECS, ...SKIP]);
const grepTests = (w) => sh('git', ['grep', '-ln', '-I', '-w', '-F', '--untracked', '--exclude-standard', '-e', w, '--', '*/tests/*', ...SKIP]);
const sed = (f, s, e) => sh('sed', ['-n', `${s},${e}p`, path.join(root, f)]);
const members = (f) => sh('grep', ['-n', '-E', 'function |^(abstract |final )?class ', path.join(root, f)]);
const codeMap = (arg) => spawnSync('node', [path.join(labRoot, 'scripts/code-map.mjs'), root, arg], { encoding: 'utf8' }).stdout || '';

const TASKS = [
  { label: 'a method: where, body, callers, tests', arg: 'ManagedFile::uploadAjaxCallback', kind: 'method', word: 'uploadAjaxCallback' },
  { label: 'a method with many callers', arg: 'Xss::filterAdmin', kind: 'method', word: 'filterAdmin' },
  { label: 'a class: its members and users', arg: 'ManagedFile', kind: 'class', word: 'ManagedFile' },
  { label: 'a JS function', arg: 'Drupal.announce', kind: 'method', word: 'Drupal.announce' },
  { label: 'a render element / hook word, no definition', arg: 'status_messages', kind: 'word', word: 'status_messages' },
  { label: 'a file outline', arg: 'core/modules/file/src/Element/ManagedFile.php', kind: 'outline', word: '' },
];
const rows = [];
for (const t of TASKS) {
  const map = codeMap(t.arg), first = map.match(/^(\S+?):(\d+)\s*(?:in \S+)?$/m), body = map.match(/body: lines (\d+)-(\d+)/);
  const calls = [];
  if (t.kind === 'outline') calls.push(['grep -n "function |class " <file>', members(t.arg)]);
  else {
    calls.push([`git grep -nw ${t.word}`, grepWord(t.word)]);
    if (t.kind === 'class' && first) calls.push(['grep -n "function " <file>', members(first[1])]);
    else if (body && first) calls.push([`sed -n '${body[1]},${body[2]}p' <file>`, sed(first[1], body[1], body[2])]);
    calls.push([`git grep -lw ${t.word} -- '*/tests/*'`, grepTests(t.word)]);
  }
  rows.push({ task: t.label, lookup: t.arg, manualCalls: calls.length, manualBytes: calls.reduce((a, c) => a + Buffer.byteLength(c[1]), 0), manualParts: calls.map((c) => [c[0], Buffer.byteLength(c[1])]), mapCalls: 1, mapBytes: Buffer.byteLength(map), mapLines: map.split('\n').length - 1 });
}
const commit = sh('git', ['rev-parse', '--short=11', 'HEAD']).trim();
const sum = (k) => rows.reduce((a, r) => a + r[k], 0);
console.log(`code-map against a modelled manual chain, ${path.basename(root)} @${commit} (bytes put into the conversation; calls)`);
console.log('lookup                                          manual calls  manual bytes  code-map calls  code-map bytes');
for (const r of rows) console.log(`${r.task.slice(0, 46).padEnd(46)}  ${String(r.manualCalls).padStart(11)}  ${String(r.manualBytes).padStart(12)}  ${String(r.mapCalls).padStart(14)}  ${String(r.mapBytes).padStart(14)}`);
console.log(`${'total'.padEnd(46)}  ${String(sum('manualCalls')).padStart(11)}  ${String(sum('manualBytes')).padStart(12)}  ${String(sum('mapCalls')).padStart(14)}  ${String(sum('mapBytes')).padStart(14)}`);
const result = { commit, checkout: path.basename(root), note: 'manual chain is modelled, not recorded; bytes are measured; calls by construction', tasks: rows, totals: { manualCalls: sum('manualCalls'), manualBytes: sum('manualBytes'), mapCalls: sum('mapCalls'), mapBytes: sum('mapBytes') }, codeMapSha: crypto.createHash('sha256').update(fs.readFileSync(path.join(labRoot, 'scripts/code-map.mjs'))).digest('hex').slice(0, 12) };
if (jsonOut) { fs.mkdirSync(path.dirname(path.resolve(jsonOut)), { recursive: true }); fs.writeFileSync(jsonOut, `${JSON.stringify(result, null, 1)}\n`); console.log(`Wrote ${jsonOut}`); }
