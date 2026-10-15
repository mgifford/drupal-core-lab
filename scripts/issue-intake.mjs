// Compact issue intake and named handoffs (AI-usage, the brief's Phase 1). Deterministic: no model is called here.
//   node scripts/issue-intake.mjs fetch <nid> [--mr <n>] [--no-brief]   fetch the issue and its merge request, keep the complete snapshot (reports are not bloated:
//                                                       .lab-cache/sources/<nid>/, git-ignored), write the manifest and comment index to reports/issues/<nid>/intake/,
//                                                       say what changed since the last fetch and which handoffs that makes stale
//   node scripts/issue-intake.mjs brief <nid>           rebuild intake/BRIEF.md from the snapshot (offline)
//   node scripts/issue-intake.mjs show <nid> <n|cid|issue|diff|mr>   print one source from the snapshot (older comments by number or id)
//   node scripts/issue-intake.mjs handoff write <nid> <stage> --file <json> [--by model|person|script]   validate and store a handoff (stages: issue sources reproduction patch validation feedback)
//   node scripts/issue-intake.mjs handoff check <nid>   fresh or stale, and why
//   node scripts/issue-intake.mjs handoff show <nid> <stage>
// Reads drupal.org and git.drupalcode.org (GET only) for `fetch`; nothing is posted. See reports/ai-usage/brief-phase-1-intake/RESULTS.md.
import fs from 'node:fs';
import path from 'node:path';
import { labRoot } from '../tools/compare/lib.mjs';
import { gather } from '../tools/compare/pack-prepare.mjs';
import { buildSnapshot, manifestOf, indexComments, renderBrief, showSource, diffManifests, sha8 } from '../tools/compare/issue-intake.mjs';
import { STAGES, validateHandoff, writeHandoff, checkHandoffs, readHandoffs, handoffFile } from '../tools/compare/handoff.mjs';

const args = process.argv.slice(2), [cmd, a1, a2, a3] = args, val = (n) => { const i = args.indexOf(`--${n}`); return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : null; };
const usage = () => { console.error(fs.readFileSync(new URL(import.meta.url), 'utf8').split('\n').slice(1, 12).map((l) => l.replace(/^\/\/ ?/, '')).join('\n')); process.exit(2); };
const fail = (m, c = 1) => { console.error(m); process.exit(c); };
const nid = (x) => { if (!/^\d{5,8}$/.test(x || '')) usage(); return x; };
const cacheFile = (n) => path.join(labRoot, '.lab-cache/sources', n, 'snapshot.json');
const intakeDir = (n) => path.join(labRoot, 'reports/issues', n, 'intake');
const loadSnap = (n) => { const f = cacheFile(n); if (!fs.existsSync(f)) fail(`No snapshot for #${n}. Run: node scripts/issue-intake.mjs fetch ${n}   (the complete snapshot is kept on this machine only: ${path.relative(labRoot, f)})`); return JSON.parse(fs.readFileSync(f, 'utf8')); };
const write = (f, text) => { fs.mkdirSync(path.dirname(f), { recursive: true }); const tmp = `${f}.${process.pid}.tmp`; fs.writeFileSync(tmp, text); fs.renameSync(tmp, f); };
const labPatches = (n) => { const dir = path.join(labRoot, 'reports/issues', n, 'branches'); return fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith('.patch')).map((f) => ({ path: `branches/${f}`, sha8: sha8(fs.readFileSync(path.join(dir, f))) })) : []; };
function buildBrief(snap) {
  const index = indexComments(snap.comments), dir = intakeDir(snap.nid);
  write(path.join(dir, 'comment-index.json'), `${JSON.stringify({ nid: snap.nid, fetchedAt: snap.fetchedAt, comments: index }, null, 1)}\n`);
  write(path.join(dir, 'sources.json'), `${JSON.stringify(manifestOf(snap), null, 2)}\n`);
  const brief = renderBrief(snap, index, { labPatches: labPatches(snap.nid) }); write(path.join(dir, 'BRIEF.md'), brief);
  return { index, brief };
}

if (cmd === 'fetch') {
  const n = nid(a1), g = await gather(n, { mr: val('mr') || undefined, log: (m) => console.log(m) });
  if (!g.structured) fail(`#${n}: ${g.missing.issue || 'the issue could not be fetched'}. Nothing was written.`);
  const snap = buildSnapshot(g), mf = path.join(intakeDir(n), 'sources.json'), prev = fs.existsSync(mf) ? JSON.parse(fs.readFileSync(mf, 'utf8')) : null;
  write(cacheFile(n), `${JSON.stringify(snap)}\n`);
  const changes = diffManifests(prev, manifestOf(snap));
  console.log(`\n#${n}: snapshot of ${snap.comments.length} comments, ${snap.sources.length} sources, fetched ${snap.fetchedAt}.`);
  console.log(prev ? (changes.length ? `Changed since ${prev.fetchedAt}:\n${changes.map((c) => `  - ${c.id}: ${c.change}`).join('\n')}` : `Nothing changed since ${prev.fetchedAt}.`) : 'First snapshot.');
  if (snap.gaps.length) console.log(`Gaps:\n${snap.gaps.map((x) => `  - ${x.source}: ${x.what}`).join('\n')}`);
  if (!args.includes('--no-brief')) { const b = buildBrief(snap); console.log(`Brief: ${path.relative(labRoot, path.join(intakeDir(n), 'BRIEF.md'))} (${Buffer.byteLength(b.brief)} bytes; the full issue text of the pack prompt is ${Buffer.byteLength(g.issueText)}).`); }
  const stale = checkHandoffs(labRoot, n, snap).filter((h) => h.status !== 'fresh');
  if (stale.length) console.log(`\nHandoffs that no longer describe the sources:\n${stale.map((h) => `  - ${h.stage}: ${h.reasons.join('; ')}`).join('\n')}\nRevise them (handoff write), then handoff check.`);
} else if (cmd === 'brief') {
  const snap = loadSnap(nid(a1)), b = buildBrief(snap); console.log(`Wrote ${path.relative(labRoot, path.join(intakeDir(snap.nid), 'BRIEF.md'))} (${Buffer.byteLength(b.brief)} bytes).`);
} else if (cmd === 'show') {
  const snap = loadSnap(nid(a1)), out = showSource(snap, a2); if (out === null) fail(`#${a1} has no "${a2}" in the snapshot (comments are numbered 1 to ${snap.comments.length}; also: issue, diff, mr).`); process.stdout.write(out);
} else if (cmd === 'handoff') {
  const sub = a1, n = nid(a2);
  if (sub === 'write') {
    const stage = a3, f = val('file'); if (!STAGES.includes(stage) || !f) usage();
    let h; try { h = JSON.parse(fs.readFileSync(path.resolve(f), 'utf8')); } catch (e) { fail(`Could not read ${f}: ${e.message}`); }
    h = { stage, nid: n, written: new Date().toISOString().slice(0, 10), by: val('by') || h.by || 'model', ...h, ...(val('by') ? { by: val('by') } : {}), stage, nid: n };
    const snapFile = cacheFile(n), snap = fs.existsSync(snapFile) ? JSON.parse(fs.readFileSync(snapFile, 'utf8')) : null;
    const probs = validateHandoff(h, { commentNs: new Set(snap ? snap.comments.map((c) => c.n) : []), exists: (p) => fs.existsSync(path.join(labRoot, p)) });
    if (!snap && JSON.stringify(h).includes('"comment:')) probs.push('it cites comments but there is no snapshot to check them against: run fetch first');
    if (probs.length) fail(`Not written (${handoffFile(labRoot, n, stage).replace(`${labRoot}/`, '')} is as it was):\n${probs.map((p) => `  - ${p}`).join('\n')}`);
    const w = writeHandoff(labRoot, h, snap); console.log(`Wrote ${path.relative(labRoot, w.file)} (${w.bytes} bytes, about ${Math.round(w.bytes / 4)} tokens), based on ${Object.keys(w.based_on).length} source(s).`);
  } else if (sub === 'check') {
    const f = cacheFile(n), snap = fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : null, r = checkHandoffs(labRoot, n, snap);
    if (!r.length) { console.log(`#${n}: no handoffs written.`); process.exit(0); }
    if (!snap) console.log('(no snapshot on this machine: comments and sources cannot be compared; files can)');
    for (const h of r) console.log(`${h.status.toUpperCase().padEnd(6)} ${h.stage}${h.written ? ` (${h.written}, ${h.by})` : ''}${h.reasons.length ? `: ${h.reasons.join('; ')}` : ''}`);
    process.exit(r.some((h) => h.status !== 'fresh') ? 1 : 0);
  } else if (sub === 'show') {
    const f = handoffFile(labRoot, n, a3); if (!fs.existsSync(f)) fail(`No ${a3} handoff for #${n}. Stages: ${STAGES.join(', ')}. Written: ${readHandoffs(labRoot, n).map((h) => h.stage).join(', ') || 'none'}.`); process.stdout.write(fs.readFileSync(f, 'utf8'));
  } else usage();
} else usage();
