// Local-only repeated-lookup report. It reads Claude Code transcripts through scripts/session-usage.mjs --requests and
// prints the targets an agent returned to; targets can contain private paths or search terms, so this output is for the
// local operator and is never added to a public report. It does not call a model.
//   node scripts/resource-exploration.mjs [--json=<file>] [<transcript.jsonl|dir>...]
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { labRoot } from '../tools/resource/ledger.mjs';
import { explorationDiagnostics, explorationDetails } from '../tools/resource/exploration.mjs';

const args = process.argv.slice(2);
const jsonOut = args.find((a) => a.startsWith('--json='))?.slice('--json='.length);
const files = args.filter((a) => !a.startsWith('--'));
const tmp = path.join(os.tmpdir(), `resource-exploration-${Date.now()}.json`);
const r = spawnSync(process.execPath, [path.join(labRoot, 'scripts/session-usage.mjs'), '--json', tmp, '--requests', ...files], { cwd: labRoot, encoding: 'utf8', maxBuffer: 128 * 1024 * 1024 });
if (r.status !== 0) { console.error(String(r.stderr || r.stdout).trim()); process.exit(r.status || 1); }
let data;
try { data = JSON.parse(fs.readFileSync(tmp, 'utf8')); } finally { try { fs.rmSync(tmp, { force: true }); } catch { /* none */ } }
const sessions = Array.isArray(data) ? data : (data.sessions || []);
const out = { generated_at: new Date().toISOString(), local_only: true, note: 'Targets can contain private paths or search terms. Do not publish this file.', sessions: [] };
for (const s of sessions) {
  const requests = s.requests || [];
  const details = explorationDetails(requests);
  const summary = explorationDiagnostics(requests);
  out.sessions.push({ file: s.file, title: s.title, requests: requests.length, summary, repeated: details.repeated.slice(0, 40) });
  console.log(`\n${s.file}  ${s.title || ''}`);
  console.log(`  requests ${requests.length}; unique targets ${summary.unique_targets}; repeated targets ${summary.repeated_targets}; repeated lookups ${summary.repeated_lookups}; failed searches ${summary.failed_searches}`);
  for (const x of details.repeated.slice(0, 12)) console.log(`  ${String(x.count).padStart(3)}x ${x.target.slice(0, 140)}${x.after_edit ? ' [after edit]' : ''}${x.after_failure ? ' [after failure]' : ''}`);
}
if (jsonOut) { fs.writeFileSync(jsonOut, `${JSON.stringify(out, null, 2)}\n`); console.log(`\nWrote ${jsonOut} (local-only; do not publish).`); }
