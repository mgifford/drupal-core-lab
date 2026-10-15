// Size of one repair turn, whole pack against targeted edit, on recorded packs (AI-usage Phase 2). No network, no model.
//   node scripts/repair-benchmark.mjs [--json <file>]
// A repair turn is the message you paste into the chat plus the reply you paste back. For the whole-pack repair the reply is at least the pack
// itself ("send the complete corrected file again"), so the pack's size is a LOWER BOUND for it. For the targeted repair the reply is a pack
// edit. Case 1 is exact (the edit puts the field back). Cases 2 and 3 use an edit written here to fix the same findings; it stands in for what a model would send,
// so those reply sizes are constructed, not measured from a model. Every edit is applied and checked by the real validator.
import fs from 'node:fs';
import path from 'node:path';
import { labRoot } from '../tools/compare/lib.mjs';
import { validatePack, loadYaml, repairMessage } from '../tools/compare/pack-validate.mjs';
import { packHash, applyEdit, dumpPack, targetedRepairMessage, EDIT_VERSION } from '../tools/compare/pack-edit.mjs';

const yaml = loadYaml(); if (!yaml) { console.error('js-yaml is not installed. Run: npm install --prefix tools/compare/.deps js-yaml@4'); process.exit(2); }
const fx = (...p) => fs.readFileSync(path.join(labRoot, 'tests/issue-pack/fixtures', ...p), 'utf8'), bytes = (s) => Buffer.byteLength(s);
const verified = fx('verified-3618230/PACK.yml'), good = yaml.load(verified, { schema: yaml.CORE_SCHEMA });
const broken = structuredClone(good); broken.issue.fork_branch = 'bad branch!';
const FILE = "document.querySelector('input[type=\"file\"]') !== null", WRAP = "document.querySelector('.file-upload-messages') !== null";
const cases = [
  { name: '#3618230 verified pack, one field wrong (exact)', text: dumpPack(broken, yaml), ops: [{ op: 'test', path: '/issue/fork_branch', value: 'bad branch!' }, { op: 'replace', path: '/issue/fork_branch', value: good.issue.fork_branch }] },
  { name: 'llm-draft-phantom-global (2 warnings; edit constructed)', text: fx('packs/llm-draft-phantom-global.yml'), ops: [{ op: 'replace', path: '/variant/checks/1/probe', value: WRAP }, { op: 'replace', path: '/variant/checks/2/probe', value: "(document.querySelector('.messages--error') !== null)" }] },
  { name: 'llm-draft-constant-probe (3 warnings, 2 fixable by an edit; constructed)', text: fx('packs/llm-draft-constant-probe.yml'), ops: [{ op: 'replace', path: '/variant/checks/0/probe', value: FILE }, { op: 'add', path: '/variant/checks/-', value: { label: 'The file upload messages wrapper exists', probe: WRAP, expect: true, kind: 'fix' } }] },
];
const rows = [];
for (const c of cases) {
  const v = validatePack(c.text, { yaml }), edit = { pack_edit_version: EDIT_VERSION, base: packHash(c.text), ops: c.ops }, reply = JSON.stringify(edit), r = applyEdit(c.text, edit, { yaml });
  const fullMsg = repairMessage(v), tMsg = targetedRepairMessage(v, c.text, { yaml });
  rows.push({ name: c.name, findings: v.errors.length + v.warnings.length, fullMsg: bytes(fullMsg), fullReplyLowerBound: bytes(c.text), tMsg: bytes(tMsg), tReply: bytes(reply), applied: r.ok, fixed: r.ok ? r.fixed.length : 0, remaining: r.ok ? r.after.errors.length + r.after.warnings.length : null, problem: r.ok ? null : r.problems[0] });
}
console.log('Repair turn = message pasted into the chat + reply pasted back (bytes; ~tokens = bytes/4). Full-pack reply is a lower bound (the pack itself).\n');
console.log('case'.padEnd(74), 'findings  full turn (>=)  targeted turn  saved   applied  fixed  remaining');
for (const r of rows) { const full = r.fullMsg + r.fullReplyLowerBound, t = r.tMsg + r.tReply; console.log(r.name.padEnd(74), String(r.findings).padStart(8), String(full).padStart(15), String(t).padStart(14), `${Math.round((1 - t / full) * 100)}%`.padStart(6), String(r.applied).padStart(8), String(r.fixed).padStart(6), String(r.remaining).padStart(10)); if (r.problem) console.log('   NOT APPLIED:', r.problem); }
console.log('\nReply only (the generated output): ' + rows.map((r) => `${r.fullReplyLowerBound} -> ${r.tReply} bytes (${Math.round((1 - r.tReply / r.fullReplyLowerBound) * 100)}% less)`).join('; '));
const j = process.argv.indexOf('--json'); if (j > 0) fs.writeFileSync(process.argv[j + 1], `${JSON.stringify({ note: 'bytes on recorded packs; cases 2 and 3 use a constructed edit, not a model reply', rows }, null, 2)}\n`);
