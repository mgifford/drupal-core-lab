// Diff what two environments serve for the same pages, including their CSS and JS.
//   node tools/compare/diff.mjs [slug]
// Writes reports/issues/<nid>/compare/<slug>/SUMMARY.md plus one .diff per changed file.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { labRoot, variants, envInfo, loginPath, envFetch, normalise, assetsOf } from './lib.mjs';

const v = variants().find((x) => x.slug === (process.argv[2] || variants()[0].slug));
if (!v) { console.error('unknown variant'); process.exit(1); }
const out = path.join(labRoot, 'reports/issues', v.issue, 'compare', v.slug);
fs.mkdirSync(out, { recursive: true });
for (const f of fs.readdirSync(out)) if (/\.(diff|md)$/.test(f)) fs.rmSync(path.join(out, f));

const sides = {};
for (const side of ['before', 'after']) {
  const env = v[side].env; const info = envInfo(env); const jar = {};
  if (v.login) await envFetch(env, info, loginPath(env), jar);
  sides[side] = { env, info, jar };
}
const hosts = [...sides.before.info.hosts, ...sides.after.info.hosts];
const get = async (side, p) => { const s = sides[side]; return envFetch(s.env, s.info, p, s.jar); };
const text = async (side, p) => { const r = await get(side, p); return { ...r, text: r.body.toString('utf8') }; };

function unified(a, b, label) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cmp-'));
  fs.writeFileSync(path.join(dir, 'a'), a); fs.writeFileSync(path.join(dir, 'b'), b);
  try { execFileSync('diff', ['-u', '--label', `before ${label}`, '--label', `after ${label}`, path.join(dir, 'a'), path.join(dir, 'b')]); return ''; }
  catch (e) { return e.stdout ? e.stdout.toString() : String(e); } finally { fs.rmSync(dir, { recursive: true, force: true }); }
}

const rows = []; let n = 0;
const record = (kind, name, status, diffText) => {
  let file = '';
  if (diffText) { file = `${String(++n).padStart(2, '0')}-${name.replace(/[^A-Za-z0-9]+/g, '_').slice(0, 60)}.diff`; fs.writeFileSync(path.join(out, file), diffText); }
  rows.push({ kind, name, status, file });
};

for (const page of v.pages) {
  const [b, a] = [await text('before', page), await text('after', page)];
  const nb = normalise(b.text, hosts), na = normalise(a.text, hosts);
  record('page', page, `${b.status}/${a.status}`, nb === na ? '' : unified(nb, na, page));
  const [ab, aa] = [assetsOf(b.text), assetsOf(a.text)];
  const mapB = new Map(ab.map((x) => [x.key, x])), mapA = new Map(aa.map((x) => [x.key, x]));
  for (const key of new Set([...mapB.keys(), ...mapA.keys()])) {
    if (!mapB.has(key)) { record('asset', key, 'only in after', ''); continue; }
    if (!mapA.has(key)) { record('asset', key, 'only in before', ''); continue; }
    const [x, y] = [await text('before', mapB.get(key).fetchPath), await text('after', mapA.get(key).fetchPath)];
    const [nx, ny] = [normalise(x.text, hosts), normalise(y.text, hosts)];
    record('asset', key, nx === ny ? 'same' : 'DIFFERENT', nx === ny ? '' : unified(nx, ny, key));
  }
}

const changed = rows.filter((r) => r.file || /only in/.test(r.status));
let md = `# Compare: ${v.slug}\n\nGenerated ${new Date().toISOString()}. Before: \`${v.before.env}\`. After: \`${v.after.env}\`.\n\n`;
md += `Logged in as admin: ${v.login ? 'yes' : 'no'}. Pages: ${v.pages.join(', ')}.\n\n`;
md += `**${changed.length} of ${rows.length} items differ.** Per-site noise (hostnames, tokens, cache-busting strings, settings JSON, aggregate file names) is normalised away.\n\n| Kind | Item | Result | Diff |\n|---|---|---|---|\n`;
for (const r of rows) md += `| ${r.kind} | \`${r.name}\` | ${r.status} | ${r.file ? `[${r.file}](${r.file})` : ''} |\n`;
md += `\nThis compares served HTML, CSS and JS only. It does not replace testing in a browser with a keyboard and assistive technology.\n`;
fs.writeFileSync(path.join(out, 'SUMMARY.md'), md);
console.log(`${changed.length}/${rows.length} differ -> ${path.relative(labRoot, out)}/SUMMARY.md`);
