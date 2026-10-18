// Read each issue's state from drupal.org and git.drupalcode.org and compare it with what the lab last tested.
//   node scripts/issue-status.mjs <nid> [--write] [--force]   one issue, as a status snapshot
//   node scripts/issue-status.mjs --all [--write]             every issue folder not archived (no ARCHIVED.md), one line each
// Read-only on the network (https GET on www.drupal.org and git.drupalcode.org only, via tools/compare/pack-prepare.mjs); it never
// posts or comments. --write keeps reports/issues/<nid>/status.json, rewritten only when something changed (status, comments,
// merge request, title, priority or tags), so a run that finds nothing new changes no file. A change after an earlier check also
// writes STATUS-<date>.md (an existing one is kept unless --force; a hand-written STATUS.md is never touched).
// node scripts/index-issues.mjs turns these files into reports/issues/README.md; the weekly GitHub Action runs both
// (.github/workflows/issue-status.yml). Exit 1 if any issue could not be read. See docs/ISSUE-LIFECYCLE.md.
import { labRoot } from '../tools/compare/lib.mjs';
import { getJson } from '../tools/compare/pack-prepare.mjs';
import { fetchStatus, saveStatus, readStatus, changes, statusMarkdown, recordedTip, readArchived, nextStep, issueDir, issueNids } from '../tools/compare/issue-tracking.mjs';

const args = process.argv.slice(2);
const write = args.includes('--write'), force = args.includes('--force'), all = args.includes('--all');
const nidArg = args.find((a) => /^\d{5,8}$/.test(a));
if (!all && !nidArg) { console.error('usage: node scripts/issue-status.mjs <nid> [--write] [--force] | --all [--write]'); process.exit(2); }
const today = new Date().toISOString().slice(0, 10), terms = new Map();
const nids = all ? issueNids(labRoot).filter((nid) => !readArchived(issueDir(labRoot, nid))) : [nidArg];
const failed = [], changed = [], first = [];
for (const nid of nids) {
  const dir = issueDir(labRoot, nid), rec = recordedTip(labRoot, nid);
  let s;
  try { s = await fetchStatus(nid, { getJson, labRoot, today, terms }); } catch (e) { console.error(`#${nid}: could not be read: ${e.message}`); failed.push(nid); continue; }
  const prev = readStatus(dir), ch = changes(s, prev);
  if (write) saveStatus(dir, s, { rec, force });
  if (!prev) first.push(nid); else if (ch.length) changed.push(nid);
  if (!all) { console.log(statusMarkdown(s, ch, rec, prev)); continue; }
  const step = nextStep({ nid, status: s, rec, archived: null });
  console.log(`#${nid} ${s.status.padEnd(28)} ${String(s.comments).padStart(3)} comments  MR ${s.mr ? `!${s.mr.iid} ${s.mr.state} ${s.mr.sha}` : 'none'}  ${!prev ? 'first check' : ch.length ? `changed: ${ch.join('; ')}` : 'no change'}  -> ${step.text}`);
}
if (all) {
  const list = (xs) => xs.map((n) => `#${n}`).join(', ');
  console.log(`\nChecked ${nids.length - failed.length} of ${nids.length} issues: ${changed.length} changed${changed.length ? ` (${list(changed)})` : ''}, ${first.length} checked for the first time` +
    `${failed.length ? `, ${failed.length} could not be read (${list(failed)})` : ''}.${write ? '' : ' Nothing was written (add --write).'}`);
}
process.exit(failed.length ? 1 : 0);
