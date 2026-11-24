// Deterministic "where to focus" ordering for the issues the lab has evaluated. No network, no model: it reads the local
// status.json snapshots, BRANCHES.md (the revision the lab tested) and ARCHIVED.md. The weekly issue-status Action refreshes
// the snapshots, then writes reports/issues/FOCUS.md. See docs/ISSUE-LIFECYCLE.md.
import fs from 'node:fs';
import {
  issueDir, issueNids, readStatus, readArchived, recordedTip, retestReason, FIXED, CLOSED_OTHER,
} from './issue-tracking.mjs';

export const FOCUS_TIERS = Object.freeze([
  { key: 'reopen', label: 'Reopened archive', priority: 'P0', why: 'An archived issue is open again: it may need to come back into the lab.' },
  { key: 'review', label: 'Review now', priority: 'P0', why: 'Needs review: the most useful place to help a reviewer.' },
  { key: 'rtbc', label: 'Final verification', priority: 'P1', why: 'RTBC: one final run on current core main.' },
  { key: 'work', label: 'Unblock / refresh', priority: 'P2', why: 'Needs work: review the queue and decide whether a patch or test can move it.' },
  { key: 'watch', label: 'Watch', priority: 'P3', why: 'Active: no reviewable change yet.' },
  { key: 'postponed', label: 'Postponed', priority: 'P4', why: 'Postponed or to be ported; leave it alone unless it moves.' },
  { key: 'closeout', label: 'Close out', priority: 'P5', why: 'Fixed or closed upstream: confirm, then archive.' },
  { key: 'unchecked', label: 'Not checked', priority: 'P6', why: 'No status.json yet.' },
  { key: 'archived', label: 'Archived', priority: 'P7', why: 'Finished and archived in place.' },
]);
const TIER = Object.fromEntries(FOCUS_TIERS.map((t) => [t.key, t]));
const PRIORITY_RANK = { Critical: 0, Major: 1, Normal: 2, Minor: 3 };
const FLAG_RANK = {
  reopen: 0, 'review-ready': 0, 'review-retest': 1, 'review-draft': 2, 'review-no-tip': 3, 'review-no-mr': 4, 'review-mr-closed': 5,
  'rtbc-retest': 0, 'rtbc-ready': 1,
  'work-no-mr': 0, 'work-retest': 1, 'work-no-tip': 2, 'work-queue': 3,
  'archive-merged': 0, 'archive-fixed': 1, 'archive-closed': 2,
  unchecked: 0,
};
const esc = (t) => String(t || '').replace(/\s+/g, ' ').replace(/\|/g, '\\|').trim();
const short = (t, n = 76) => { const s = esc(t); return s.length > n ? `${s.slice(0, n).replace(/\s+\S*$/, '')}…` : s; };

function reviewTags(status) {
  return (status.tags || []).filter((t) => /needs .*review|needs work|accessibility|wcag|rtbc/i.test(t)).slice(0, 4);
}

// One issue, classified and given one action. `rec` is what BRANCHES.md says the lab tested.
export function focusIssue(labRoot, nid) {
  const dir = issueDir(labRoot, nid);
  const status = readStatus(dir);
  const archived = readArchived(dir);
  let rec = null;
  try { rec = recordedTip(labRoot, nid); } catch { rec = null; }
  // Do not carry status.json's `latest` comment text into the report or JSON. Only the public classification fields are kept.
  const statusView = status ? {
    status: status.status, statusCode: status.statusCode, title: status.title, url: status.url,
    priority: status.priority, changed: status.changed, comments: status.comments, since: status.since,
    tags: status.tags, mr: status.mr,
  } : null;
  const issue = { nid: String(nid), dir, status: statusView, rec, archived };
  const base = { ...issue, title: status?.title || '', changed: status?.changed || '', comments: status?.comments ?? null, priority: status?.priority || null, tags: reviewTags(status || {}) };
  if (!status) {
    if (archived) return { ...base, tier: 'archived', flag: 'archived', action: `Archived ${archived.date}: ${archived.reason}` };
    return { ...base, tier: 'unchecked', flag: 'unchecked', action: `Run \`node scripts/issue-status.mjs ${nid} --write\``, title: '', changed: '', comments: null, priority: null, tags: [] };
  }
  const code = Number(status.statusCode);
  const mr = status.mr || null;
  const retest = retestReason(mr, rec);
  const merged = mr && mr.state === 'merged';
  if (archived && !FIXED.has(code) && !CLOSED_OTHER.has(code) && !merged) {
    return { ...base, tier: 'reopen', flag: 'reopen', action: `Archived issue is now ${status.status}: check the issue/MR and decide whether to unarchive; remove ARCHIVED.md and the retired marks if it should return` };
  }
  if (archived) return { ...base, tier: 'archived', flag: 'archived', action: `Archived ${archived.date}: ${archived.reason}` };
  if (FIXED.has(code) || CLOSED_OTHER.has(code) || merged) {
    const flag = merged ? 'archive-merged' : FIXED.has(code) ? 'archive-fixed' : 'archive-closed';
    return { ...base, tier: 'closeout', flag, action: merged ? `MR !${mr.iid} is merged: confirm on core main, then \`node scripts/issue-archive.mjs ${nid}\`` : `${status.status}: confirm, then \`node scripts/issue-archive.mjs ${nid}\`` };
  }
  if (code === 8) {
    let flag, action;
    if (mr?.draft) { flag = 'review-draft'; action = `Draft MR !${mr.iid}: confirm it is ready before reviewing; do not review unfinished work`; }
    else if (retest) { flag = 'review-retest'; action = `\`node scripts/test-mr.mjs ${nid}\` — ${retest}; then review`; }
    else if (!rec || !rec.tip) { flag = 'review-no-tip'; action = 'Record the tested revision in `BRANCHES.md`, then review'; }
    else if (!mr) { flag = 'review-no-mr'; action = `\`node scripts/issue-intake.mjs fetch ${nid}\` and find the current MR`; }
    else if (mr.state === 'closed') { flag = 'review-mr-closed'; action = `\`node scripts/issue-intake.mjs fetch ${nid}\` and check for a newer MR`; }
    else { flag = 'review-ready'; action = 'Review the current evidence and draft a comment'; }
    return { ...base, tier: 'review', flag, action };
  }
  if (code === 14) {
    return { ...base, tier: 'rtbc', flag: retest ? 'rtbc-retest' : 'rtbc-ready', action: `\`node scripts/test-mr.mjs ${nid}\` on current core main${retest ? ` — ${retest}` : ''}; if green, confirm with maintainers` };
  }
  if (code === 13) {
    let flag, action;
    if (!mr) { flag = 'work-no-mr'; action = `\`node scripts/issue-intake.mjs fetch ${nid}\`; find or refresh a patch/MR`; }
    else if (retest) { flag = 'work-retest'; action = `\`node scripts/test-mr.mjs ${nid}\` — ${retest}; then review the queue`; }
    else if (!rec || !rec.tip) { flag = 'work-no-tip'; action = 'Record the tested revision; review recent comments/tags and the patch'; }
    else { flag = 'work-queue'; action = `\`node scripts/issue-intake.mjs fetch ${nid}\`; review recent comments/tags and decide whether to update`; }
    return { ...base, tier: 'work', flag, action };
  }
  if (code === 1) return { ...base, tier: 'watch', flag: 'watch', action: 'No lab action until the status changes' };
  if ([4, 15, 16].includes(code)) return { ...base, tier: 'postponed', flag: 'postponed', action: 'Monitor; postponed or waiting to be ported' };
  return { ...base, tier: 'watch', flag: 'watch', action: `Unrecognised status code ${code}; check the issue` };
}

export function focusIssues(labRoot) {
  const rows = issueNids(labRoot).map((nid) => focusIssue(labRoot, nid));
  const tierRank = Object.fromEntries(FOCUS_TIERS.map((t, i) => [t.key, i]));
  rows.sort((a, b) => tierRank[a.tier] - tierRank[b.tier]
    || (FLAG_RANK[a.flag] ?? 9) - (FLAG_RANK[b.flag] ?? 9)
    || (PRIORITY_RANK[a.priority] ?? 9) - (PRIORITY_RANK[b.priority] ?? 9)
    || String(b.changed).localeCompare(String(a.changed))
    || (b.comments ?? -1) - (a.comments ?? -1)
    || Number(a.nid) - Number(b.nid));
  const counts = Object.fromEntries(FOCUS_TIERS.map((t) => [t.key, rows.filter((r) => r.tier === t.key).length]));
  return { rows, counts };
}

function issueCell(r) {
  return fs.existsSync(`${r.dir}/SUMMARY.md`) ? `[#${r.nid}](${r.nid}/SUMMARY.md)` : `[#${r.nid}](${r.nid}/)`;
}
function titleCell(r) { return short(r.title); }
function mrCell(r) {
  const mr = r.status?.mr;
  if (!mr) return 'none found';
  return `[!${mr.iid}](https://git.drupalcode.org/project/drupal/-/merge_requests/${mr.iid}) ${mr.state}${mr.draft ? ', draft' : ''} at \`${mr.sha}\``;
}
function testedCell(r) { return r.rec?.tip ? `\`${r.rec.tip.slice(0, 8)}\`` : 'not recorded'; }
function flagText(r) {
  return {
    'review-ready': 'Current head tested: review',
    'review-retest': 'MR head changed: re-test first',
    'review-draft': 'Draft MR: confirm readiness',
    'review-no-tip': 'No tested revision recorded',
    'review-no-mr': 'No MR found',
    'review-mr-closed': 'MR closed',
    'rtbc-retest': 'MR head changed: final re-test',
    'rtbc-ready': 'Ready for final run',
    'work-no-mr': 'No MR found: find a patch',
    'work-retest': 'MR head changed: refresh and re-test',
    'work-no-tip': 'No tested revision: record it',
    'work-queue': 'Queue review',
    'archive-merged': 'MR merged',
    'archive-fixed': 'Fixed upstream',
    'archive-closed': 'Closed',
    watch: 'Monitor',
    postponed: 'Postponed',
    unchecked: 'Not checked',
    archived: 'Archived',
  }[r.flag] || r.flag;
}
function table(headers, rows) {
  const body = rows.map((r) => `| ${r.join(' | ')} |`).join('\n');
  return `| ${headers.join(' | ')} |\n|${headers.map(() => '---').join('|')}|\n${body}\n`;
}

export function focusMarkdown(rows, counts) {
  const by = (tier) => rows.filter((r) => r.tier === tier);
  let md = '# Where to focus\n\n';
  md += 'Built from the local `status.json` snapshots, `BRANCHES.md` and `ARCHIVED.md` by `node scripts/focus-issues.mjs`. No model was called and nothing here posts to drupal.org. The status and MR data can be stale; open the issue before acting.\n\n';
  md += `**Priority:** Reopened archive → Needs review → RTBC → Needs work → Active/postponed → close-out. ${counts.reopen} reopened, ${counts.review} need review, ${counts.rtbc} are RTBC, ${counts.work} need work.\n\n`;
  md += table(['Tier', 'Count'], FOCUS_TIERS.filter((t) => counts[t.key] >= 0).map((t) => [`${t.priority} · ${t.label}`, counts[t.key]]));
  md += '\n';

  const reopen = by('reopen');
  if (reopen.length) {
    md += `## P0 · Reopened archive (${reopen.length})\n\n${TIER.reopen.why} The weekly check includes archived issues so this can be seen; archiving is reversed only after a person checks the issue and MR.\n\n`;
    md += table(['Issue', 'Title', 'drupal.org status', 'MR', 'Action'], reopen.map((r) => [issueCell(r), titleCell(r), esc(r.status.status), mrCell(r), esc(r.action)]));
  }
  const review = by('review');
  if (review.length) {
    md += `## P0 · Review now — Needs review (${review.length})\n\n${TIER.review.why} If the MR moved since the lab tested it, re-test first; do not review stale evidence.\n\n`;
    md += table(['Issue', 'Title', 'Priority', 'MR', 'Lab tested', 'Why now', 'Next action'], review.map((r) => [issueCell(r), titleCell(r), esc(r.priority || '—'), mrCell(r), testedCell(r), flagText(r), esc(r.action)]));
  }
  const rtbc = by('rtbc');
  if (rtbc.length) {
    md += `\n## P1 · Final verification — RTBC (${rtbc.length})\n\n${TIER.rtbc.why}\n\n`;
    md += table(['Issue', 'Title', 'Priority', 'MR', 'Lab tested', 'Next action'], rtbc.map((r) => [issueCell(r), titleCell(r), esc(r.priority || '—'), mrCell(r), testedCell(r), esc(r.action)]));
  }
  const work = by('work');
  if (work.length) {
    md += `\n## P2 · Unblock / refresh — Needs work (${work.length})\n\n${TIER.work.why} Queue review means reading the recent comments, tags and MR before deciding; it is not a request to bump the issue.\n\n`;
    md += table(['Issue', 'Title', 'Priority', 'MR', 'Lab tested', 'Flag', 'Queue tags', 'Next action'], work.map((r) => [issueCell(r), titleCell(r), esc(r.priority || '—'), mrCell(r), testedCell(r), flagText(r), esc(r.tags.join(', ') || '—'), esc(r.action)]));
  }
  const watch = by('watch');
  if (watch.length) {
    md += `\n## P3 · Watch — Active (${watch.length})\n\n${TIER.watch.why}\n\n`;
    md += table(['Issue', 'Title', 'Priority', 'MR', 'Why watch'], watch.map((r) => [issueCell(r), titleCell(r), esc(r.priority || '—'), mrCell(r), flagText(r)]));
  }
  const postponed = by('postponed');
  if (postponed.length) {
    md += `\n## P4 · Postponed / to be ported (${postponed.length})\n\n${TIER.postponed.why}\n\n`;
    md += table(['Issue', 'Title', 'Status', 'MR'], postponed.map((r) => [issueCell(r), titleCell(r), esc(r.status.status), mrCell(r)]));
  }
  const close = by('closeout');
  if (close.length) {
    md += `\n## P5 · Close out — fixed / closed upstream (${close.length})\n\n${TIER.closeout.why} Confirm the fix is in core main before archiving; archiving keeps the folder, evidence and pinned comparison.\n\n`;
    md += table(['Issue', 'Title', 'drupal.org status', 'Action'], close.map((r) => [issueCell(r), titleCell(r), esc(r.status.status), esc(r.action)]));
  }
  const unchecked = by('unchecked');
  if (unchecked.length) {
    md += `\n## P6 · Not checked (${unchecked.length})\n\n${TIER.unchecked.why}\n\n`;
    md += table(['Issue', 'Next action'], unchecked.map((r) => [issueCell(r), esc(r.action)]));
  }
  if (counts.archived) md += `\nArchived: ${counts.archived}; excluded from the tiers above.\n`;

  md += `\n## How this is ranked\n\n`;
  md += `- **Needs review** first: it is the highest-leverage place to help a reviewer. A changed MR head is re-tested before review.\n`;
  md += `- **RTBC** next: one final run on current core main; then confirm and close.\n`;
  md += `- **Needs work** next: read the recent comments, tags and MR, then decide whether a patch refresh or re-test can unblock it.\n`;
  md += `- **Active** and postponed issues are watched, not bumped.\n`;
  md += `- **Fixed/closed** issues are close-out candidates: confirm on core main, then archive with \`scripts/issue-archive.mjs\`.\n`;
  md += `- A status snapshot is not a review: open the issue, its comments and its MR threads before acting. Nothing here posts to drupal.org.\n`;
  return md;
}

// A compact version for the Action job summary and PR body.
export function focusSummary(rows, counts, limit = 8) {
  const top = rows.filter((r) => ['reopen', 'review', 'rtbc', 'work'].includes(r.tier)).slice(0, limit);
  let md = '## Where to focus\n\n';
  md += `${counts.reopen} reopened · ${counts.review} need review · ${counts.rtbc} RTBC · ${counts.work} need work · ${counts.watch} active · ${counts.closeout} close-out candidates\n\n`;
  if (top.length) {
    md += table(['Priority', 'Issue', 'Title', 'MR', 'Lab tested', 'Next action'], top.map((r) => [TIER[r.tier].priority, `#${r.nid}`, titleCell(r), mrCell(r), testedCell(r), esc(r.action)]));
  }
  md += `\nFull report: \`reports/issues/FOCUS.md\`. The status snapshots are refreshed by the weekly check; this is not a live view.\n`;
  return md;
}

