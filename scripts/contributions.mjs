#!/usr/bin/env node
// Curated human/AI contribution history for one issue. It never infers authorship from commits and never posts anything.
//   node scripts/contributions.mjs add <nid> --kind human-origin|ai-addition|... --by "who" --what "..." [--link url]...
//        [--evidence path]... [--date YYYY-MM-DD] [--verified-by-human|--not-verified] [--note "..."]
//   node scripts/contributions.mjs list <nid>     regenerate CONTRIBUTIONS.md
//   node scripts/contributions.mjs draft <nid>    write a short CONTRIBUTIONS-DRAFT.md for a person to edit and post
//   node scripts/contributions.mjs check           validate every contributions.json
import fs from 'node:fs';
import path from 'node:path';
import { labRoot } from '../tools/compare/lib.mjs';
import { KINDS, readContributions, writeContributions, contributionPath, validateFile, issueMarkdown, draftMarkdown, nextId, normalizeEntry } from '../tools/compare/contributions.mjs';

const args = process.argv.slice(2), cmd = args[0];
const val = (name) => { const i = args.indexOf(`--${name}`); return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : null; };
const vals = (name) => args.flatMap((a, i) => (args[i - 1] === `--${name}` ? [a] : []));
const nid = args[1] && /^\d{5,8}$/.test(args[1]) ? args[1] : null;
const today = () => new Date().toISOString().slice(0, 10);
const all = () => { const dir = path.join(labRoot, 'reports/issues'); return fs.existsSync(dir) ? fs.readdirSync(dir).filter((d) => /^\d{5,8}$/.test(d)).sort().map((n) => ({ nid: n, file: readContributions(labRoot, n) })).filter((x) => fs.existsSync(contributionPath(labRoot, x.nid))) : []; };
const usage = () => { console.error('usage: contributions.mjs add <nid> --kind <kind> --by "..." --what "..." [--link url]... [--evidence path]... [--date YYYY-MM-DD] [--verified-by-human|--not-verified] [--note "..."] | list <nid> | draft <nid> | check'); process.exit(2); };

if (cmd === 'add') {
  if (!nid) usage();
  const kind = val('kind'), by = val('by'), what = val('what');
  if (!KINDS.includes(kind) || !by || !what) usage();
  const file = readContributions(labRoot, nid);
  const entry = normalizeEntry({ id: nextId(file), kind, by, what, date: val('date') || today(), links: vals('link'), evidence: vals('evidence'), verified_by_human: args.includes('--verified-by-human') ? true : args.includes('--not-verified') ? false : null, note: val('note') });
  file.entries.push(entry);
  const out = writeContributions(labRoot, nid, file);
  console.log(`added ${entry.id} (${kind}) to #${nid}; ${out.entries.length} total. No attribution was inferred.`);
} else if (cmd === 'list') {
  if (!nid) usage();
  if (!fs.existsSync(contributionPath(labRoot, nid))) { console.error(`#${nid} has no contributions.json; add a human-origin entry first`); process.exit(1); }
  const file = readContributions(labRoot, nid);
  fs.writeFileSync(path.join(labRoot, 'reports/issues', nid, 'CONTRIBUTIONS.md'), issueMarkdown(nid, file));
  console.log(`Wrote reports/issues/${nid}/CONTRIBUTIONS.md`);
} else if (cmd === 'draft') {
  if (!nid) usage();
  const file = readContributions(labRoot, nid);
  let md;
  try { md = draftMarkdown(nid, file); } catch (e) { console.error(e.message); process.exit(1); }
  fs.writeFileSync(path.join(labRoot, 'reports/issues', nid, 'CONTRIBUTIONS-DRAFT.md'), md);
  console.log(`Wrote reports/issues/${nid}/CONTRIBUTIONS-DRAFT.md (DRAFT; a person edits and posts it)`);
} else if (cmd === 'check') {
  const bad = [];
  for (const { nid: n, file } of all()) { const r = validateFile(file); if (!r.ok) bad.push(`#${n}: ${r.errors.slice(0, 4).map((e) => `${e.path || '/'} ${e.message}`).join('; ')}`); }
  if (bad.length) { for (const b of bad) console.error(`ERROR ${b}`); process.exit(1); }
  console.log(`${all().length} contributions file(s) valid.`);
} else usage();
