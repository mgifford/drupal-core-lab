// One call for "where is this, what does it do, who uses it, what tests it": the locate-then-read chain (grep, sed, cat, ls) that is
// the only call sequence that repeats in the recorded sessions (reports/ai-usage/phase-2/). Deterministic: no model, read-only.
//   node scripts/code-map.mjs <checkout folder or env name> <symbol | file> [--lines 50] [--defs 3] [--refs 10]
// <symbol>  a class, interface, trait, function, method (`Class::method` or `method`), JS function or `Drupal.name`, constant, or any
//           other word (a hook name, theme hook, config key): definitions with their doc line, signature and body (cut at --lines),
//           for a class the members instead of the body, what the body calls in the same file, the other files that use it (tests apart),
//           and a count of references in other file types. Names the next command to read more.
// <file>    an outline: classes, functions and methods with line numbers (YAML: top-level keys; Twig: blocks).
// It searches tracked and untracked, not-ignored files of a git checkout (so files a patch added are included), PHP, JS, YAML and Twig,
// and skips vendored and minified code. The output is bounded: a common name cannot flood it.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync, execFileSync } from 'node:child_process';
import { labRoot } from '../tools/compare/lib.mjs';

const USAGE = 'usage: node scripts/code-map.mjs <checkout folder or env name> <symbol | file> [--lines 50] [--defs 3] [--refs 10]';
const argv = process.argv.slice(2), pos = [], opt = { lines: 50, defs: 3, refs: 10 };
for (let i = 0; i < argv.length; i++) {
  if (['--lines', '--defs', '--refs'].includes(argv[i])) { const n = Number(argv[++i]); if (!(n >= 1)) { console.error(`${argv[i - 1]} needs a number\n${USAGE}`); process.exit(2); } opt[argv[i - 1].slice(2)] = n; }
  else if (argv[i].startsWith('--')) { console.error(`unknown option ${argv[i]}\n${USAGE}`); process.exit(2); }
  else pos.push(argv[i]);
}
if (pos.length !== 2) { console.error(USAGE); process.exit(2); }
const mainCheckout = () => { try { return path.dirname(path.resolve(labRoot, execFileSync('git', ['rev-parse', '--git-common-dir'], { cwd: labRoot, encoding: 'utf8' }).trim())); } catch { return labRoot; } };
const root = [path.resolve(pos[0]), path.join(labRoot, 'envs', pos[0]), path.join(mainCheckout(), 'envs', pos[0])].find((p) => fs.existsSync(p) && fs.statSync(p).isDirectory());
if (!root) { console.error(`${pos[0]}: not a folder, and not an environment under envs/ (here or in the main checkout)`); process.exit(2); }
if (spawnSync('git', ['rev-parse', '--git-dir'], { cwd: root }).status !== 0) { console.error(`${root} is not a git checkout (the search uses git grep)`); process.exit(2); }

const SRC = ['*.php', '*.module', '*.inc', '*.install', '*.theme', '*.profile', '*.engine', '*.js'];
const ALL = [...SRC, '*.yml', '*.twig'];
const SKIP = [':(exclude)vendor', ':(exclude)core/assets/vendor', ':(exclude)node_modules', ':(exclude)core/node_modules', ':(exclude)*.min.js', ':(exclude)core/.phpstan-baseline.php', ':(exclude)sites/*/files'];
const grep = (args, specs) => spawnSync('git', ['grep', '-n', '-I', '--untracked', '--exclude-standard', ...args, '--', ...specs, ...SKIP], { cwd: root, encoding: 'utf8', maxBuffer: 1 << 27 }).stdout.split('\n').filter(Boolean)
  .map((l) => { const m = l.match(/^(.*?):(\d+):(.*)$/); return m && { file: m[1], line: Number(m[2]), text: m[3] }; }).filter(Boolean);
const lines = (f) => fs.readFileSync(path.join(root, f), 'utf8').split('\n');
const cut = (s, n = 150) => { const t = s.replace(/\s+/g, ' ').trim(); return t.length > n ? `${t.slice(0, n - 1)}…` : t; };
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const isTest = (f) => /(^|\/)tests?\//i.test(f) || /Test(Base)?\.php$/.test(f);
const out = []; const say = (...s) => out.push(...s);
const CLASSLIKE = /^\s*(?:(?:abstract|final|readonly)\s+)*(class|interface|trait|enum)\s+(\w+)/;

// the line of the closing brace of the block opened at or after startIdx; the signature's own line if it ends in `;` first
function blockEnd(ls, startIdx) {
  let depth = 0, started = false, inBlock = false;
  for (let i = startIdx; i < ls.length && i < startIdx + 3000; i++) {
    const l = ls[i]; let q = null;
    for (let j = 0; j < l.length; j++) {
      const c = l[j], d = l[j + 1];
      if (inBlock) { if (c === '*' && d === '/') { inBlock = false; j++; } continue; }
      if (q) { if (c === '\\') j++; else if (c === q) q = null; continue; }
      if (c === '/' && d === '*') { inBlock = true; j++; continue; }
      if ((c === '/' && d === '/') || (c === '#' && d !== '[')) break;
      if (c === "'" || c === '"' || c === '`') { q = c; continue; }
      if (c === ';' && !started && depth === 0) return i;
      if (c === '{') { depth++; started = true; } else if (c === '}') { depth--; if (started && depth === 0) return i; }
    }
    if (!started && i > startIdx + 12) return -1;
  }
  return -1;
}
const docLine = (ls, idx) => {
  let i = idx - 1; while (i >= 0 && /^\s*#\[/.test(ls[i])) i--;
  if (i < 0 || !/\*\/\s*$/.test(ls[i])) return '';
  let j = i; while (j >= 0 && !/\/\*\*/.test(ls[j])) j--;
  return j < 0 ? '' : cut((ls.slice(j, i + 1).map((l) => l.replace(/^\s*\/?\*+\/?\s?/, '').trim()).find((l) => l && !l.startsWith('@')) || ''), 120);
};
const signature = (ls, idx) => { let s = ls[idx]; for (let k = idx + 1; k < Math.min(ls.length, idx + 8) && !/[{;]\s*$/.test(s); k++) s += ` ${ls[k]}`; return cut(s.replace(/\s*\{\s*$/, ''), 170); };
const enclosing = (ls, idx) => { for (let i = idx; i >= 0; i--) { const m = ls[i].match(CLASSLIKE); if (m) return m[2]; } return ''; };

function outline(file) {
  const ls = lines(file);
  say(`${file} (${ls.length} lines)`);
  const items = [];
  const isYml = /\.ya?ml$/.test(file), isTwig = /\.twig$/.test(file);
  ls.forEach((l, i) => {
    if (isYml) { if (/^[A-Za-z_][\w.\-]*:/.test(l)) items.push(`${i + 1}  ${cut(l, 100)}`); }
    else if (isTwig) { if (/\{%-?\s*(block|include|extends|embed|macro)\b/.test(l)) items.push(`${i + 1}  ${cut(l, 110)}`); }
    else if (/^\s*namespace\s/.test(l)) items.push(`${i + 1}  ${cut(l)}`);
    else if (CLASSLIKE.test(l)) items.push(`${i + 1}  ${cut(l)}`);
    else if (/^\s*(?:(?:public|protected|private|static|abstract|final)\s+)*function\s+&?\w+\s*\(/.test(l) || /^\s*(?:Drupal\.\w+(?:\.\w+)*|\w+)\s*=\s*(?:async\s+)?function\b/.test(l)) items.push(`${i + 1}  ${signature(ls, i)}`);
  });
  if (!items.length) say('  (no classes, functions or keys found)');
  const max = Math.max(opt.lines, 40);
  for (const it of items.slice(0, max)) say(`  ${it}`);
  if (items.length > max) say(`  … ${items.length - max} more (use --lines ${items.length})`);
  say(`next: sed -n 'START,ENDp' ${file}   or   node scripts/code-map.mjs <root> <member name>`);
}

function symbol(arg) {
  const [cls, member] = arg.includes('::') ? arg.split('::') : ['', arg];
  const name = member.replace(/^Drupal\./, '');
  const n = esc(name);
  if (!/^[\w.]+$/.test(name)) { console.error(`${arg}: a symbol is letters, digits, _ and . only`); process.exit(2); }
  // POSIX extended expressions only: the git on macOS has no \b, \w or \t inside brackets. END is "not a name character, or end of line".
  const END = '([^A-Za-z0-9_]|$)';
  const defRe = `(^|[ \t])(class|interface|trait|enum)[ \t]+${n}${END}|function[ \t]+&?${n}[ \t]*\\(|(^|[ \t])const[ \t]+${n}${END}|define\\([ \t]*['"]${n}['"]|Drupal\\.${n}[ \t]*=|^[ \t]*(async[ \t]+)?${n}[ \t]*\\([^)]*\\)[ \t]*\\{|^[ \t]*${n}[ \t]*:[ \t]*(async[ \t]+)?function`;
  let defs = grep(['-E', '-e', defRe], SRC);
  if (arg.startsWith('Drupal.')) defs = defs.filter((d) => /\.js$/.test(d.file));   // `Drupal.x` is JavaScript: a PHP class of the same name is not what was asked for
  const declared = new Set(defs.map((d) => `${d.file}:${d.line}`));   // every declaration of the name, whatever class owns it: none of them is a use
  if (cls) { const inCls = new Set(grep(['-E', '-e', `(class|interface|trait|enum)[ \\t]+${esc(cls)}([^A-Za-z0-9_]|$)`], SRC).map((d) => d.file)); defs = defs.filter((d) => inCls.has(d.file) && enclosing(lines(d.file), d.line - 1) === cls); }
  const all = grep(['-w', '-F', '-e', arg.startsWith('Drupal.') ? arg : name], ALL);   // `Drupal.x` is searched with its prefix: the bare word is in many unrelated places
  say(`code-map: ${arg}   (${path.basename(root)}${(() => { const h = spawnSync('git', ['rev-parse', '--short=11', 'HEAD'], { cwd: root, encoding: 'utf8' }).stdout.trim(); return h ? ` @${h}` : ''; })()})`);
  if (!defs.length && !all.length) { say(`not found: no definition and no reference to "${name}" in PHP, JS, YAML or Twig.`); return 1; }
  // the declaration that is exactly what was asked for first: `Drupal.name =` when given with its prefix, then classes, then functions
  const rank = (d) => (arg.startsWith('Drupal.') && new RegExp(`Drupal\\.${n}\\s*=`).test(d.text) ? 0 : CLASSLIKE.test(d.text) ? 1 : /function\s/.test(d.text) ? 2 : 3);
  defs = defs.map((d, i) => ({ d, i })).sort((a, b) => rank(a.d) - rank(b.d) || a.i - b.i).map((x) => x.d);
  const defKeys = new Set(defs.map((d) => `${d.file}:${d.line}`));
  say(`definitions: ${defs.length ? defs.length : 'none found'}${defs.length > opt.defs ? ` (showing ${opt.defs}; the rest listed below)` : ''}`);
  for (const d of defs.slice(0, opt.defs)) {
    const ls = lines(d.file), idx = d.line - 1, cm = ls[idx].match(CLASSLIKE), owner = cm ? '' : enclosing(ls, idx);
    say('', `${d.file}:${d.line}${owner ? `   in ${owner}` : ''}`, `  ${signature(ls, idx)}`);
    const doc = docLine(ls, idx); if (doc) say(`  doc: ${doc}`);
    if (cm) {   // a class: its members, not its body
      const end = blockEnd(ls, idx), body = ls.slice(idx + 1, end < 0 ? ls.length : end);
      const mem = []; body.forEach((l, k) => { if (/^\s{1,4}(?:(?:public|protected|private|static|abstract|final)\s+)*function\s+&?\w+\s*\(/.test(l)) mem.push(`${idx + 2 + k}  ${signature(ls, idx + 1 + k)}`); });
      say(`  members (${mem.length}${end < 0 ? ', end of class not found' : `, class ends at ${end + 1}`}):`, ...mem.slice(0, opt.lines).map((m) => `    ${m}`)); if (mem.length > opt.lines) say(`    … ${mem.length - opt.lines} more (--lines ${mem.length})`);
      continue;
    }
    const end = blockEnd(ls, idx);
    if (end < 0) { say(`  (end of the block not found; first ${Math.min(opt.lines, ls.length - idx)} lines)`); ls.slice(idx, idx + opt.lines).forEach((l, k) => say(`  ${String(idx + 1 + k).padStart(5)}│ ${l.replace(/\s+$/, '')}`)); continue; }
    const len = end - idx + 1, show = Math.min(len, opt.lines);
    say(`  body: lines ${idx + 1}-${end + 1} (${len} lines${len > show ? `, first ${show} shown; --lines ${len} for all` : ''})`);
    ls.slice(idx, idx + show).forEach((l, k) => say(`  ${String(idx + 1 + k).padStart(5)}│ ${l.replace(/\s+$/, '')}`));
    const body = ls.slice(idx, end + 1).join('\n');
    const local = [...new Set([...body.matchAll(/(?:\$this->|self::|static::|parent::)(\w+)\(/g)].map((m) => m[1]))].filter((x) => x !== name);
    if (local.length) {
      const where = local.map((x) => { const h = ls.findIndex((l) => new RegExp(`function\\s+&?${esc(x)}\\s*\\(`).test(l)); return `${x}${h >= 0 ? ` (line ${h + 1})` : ' (not in this file)'}`; });
      say(`  calls: ${where.slice(0, 12).join(', ')}${where.length > 12 ? `, … ${where.length - 12} more` : ''}`);
    }
    const other = [...new Set([...body.matchAll(/\b([A-Z]\w+)::(\w+)\(/g)].map((m) => `${m[1]}::${m[2]}`))].filter((x) => !/^(self|static|parent)::/.test(x));
    if (other.length) say(`  static calls: ${other.slice(0, 10).join(', ')}${other.length > 10 ? `, … ${other.length - 10} more` : ''}`);
  }
  if (defs.length > opt.defs) say('', ...defs.slice(opt.defs).map((d) => `also defined: ${d.file}:${d.line}`));
  // who uses it: other files, tests apart; for Class::member only files that mention the class
  let refs = all.filter((r) => !defKeys.has(`${r.file}:${r.line}`) && !declared.has(`${r.file}:${r.line}`));
  if (cls) refs = refs.filter((r) => { try { return new RegExp(`\\b${esc(cls)}\\b`).test(fs.readFileSync(path.join(root, r.file), 'utf8')); } catch { return false; } });
  const group = (list) => { const by = new Map(); for (const r of list) by.set(r.file, [...(by.get(r.file) || []), r]); return by; };
  const code = refs.filter((r) => SRC.some((g) => r.file.endsWith(g.slice(1)))), cfg = refs.filter((r) => !code.includes(r));
  for (const [title, list] of [['used by', code.filter((r) => !isTest(r.file))], ['tests', code.filter((r) => isTest(r.file))]]) {
    const by = group(list); say('', `${title}: ${list.length} reference(s) in ${by.size} file(s)`);
    let shown = 0;
    for (const [f, rs] of by) { if (shown >= opt.refs) { say(`  … ${by.size - shown} more file(s)`); break; } say(`  ${f}:${rs.slice(0, 3).map((r) => r.line).join(',')}${rs.length > 3 ? ` (+${rs.length - 3})` : ''}   ${cut(rs[0].text, 90)}`); shown++; }
  }
  if (cfg.length) { const by = group(cfg); say('', `config and templates: ${cfg.length} reference(s) in ${by.size} file(s): ${[...by.keys()].slice(0, 5).join(', ')}${by.size > 5 ? ', …' : ''}`); }
  say('', `next: node scripts/code-map.mjs <root> ${defs.length ? defs[0].file : '<file>'}   (outline), or sed -n 'START,ENDp' <file>`);
  return 0;
}

const fileArg = [path.join(root, pos[1]), path.resolve(pos[1])].find((p) => fs.existsSync(p) && fs.statSync(p).isFile());
let code = 0;
if (fileArg && path.relative(root, fileArg) && !path.relative(root, fileArg).startsWith('..')) outline(path.relative(root, fileArg));
else code = symbol(pos[1]);
console.log(out.join('\n'));
process.exit(code);
