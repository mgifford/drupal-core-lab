// Issue tracking: what drupal.org and GitLab say about each issue, what the lab last tested, whether the lab has archived the issue,
// and the next step for a person. scripts/issue-status.mjs fetches (weekly in .github/workflows/issue-status.yml, or by hand),
// scripts/index-issues.mjs writes reports/issues/README.md from the stored files, scripts/issue-archive.mjs archives one issue.
// Network reads go through the getJson passed in: tools/compare/pack-prepare.mjs in use (https GET on www.drupal.org and
// git.drupalcode.org only), a stub in tests. Nothing here posts anything. See docs/ISSUE-LIFECYCLE.md.
import fs from 'node:fs';
import path from 'node:path';
import { htmlToText, neutralize, STATUS, PRIORITY, CATEGORY } from './pack-prepare.mjs';

const day = (epoch) => new Date(Number(epoch) * 1000).toISOString().slice(0, 10);
const GITLAB = 'https://git.drupalcode.org/api/v4';
export const issueDir = (labRoot, nid) => path.join(labRoot, 'reports/issues', String(nid));
export const issueNids = (labRoot) => { const d = path.join(labRoot, 'reports/issues'); return fs.existsSync(d) ? fs.readdirSync(d).filter((n) => /^\d+$/.test(n)).sort() : []; };

// drupal.org status codes (pack-prepare.mjs STATUS) by what they mean for the lab.
export const FIXED = new Set([2, 7]);                     // Fixed, Closed (fixed)
export const CLOSED_OTHER = new Set([3, 5, 6, 17, 18]);   // duplicate, won't fix, works as designed, outdated, cannot reproduce
export const REASONS = { fixed: 'Fixed upstream', duplicate: 'Closed (duplicate)', 'wont-fix': "Closed (won't fix)", 'works-as-designed': 'Closed (works as designed)', outdated: 'Closed (outdated)', 'cannot-reproduce': 'Closed (cannot reproduce)', other: 'Closed for another reason' };
export const reasonFromStatus = (code) => ({ 2: 'fixed', 7: 'fixed', 3: 'duplicate', 5: 'wont-fix', 6: 'works-as-designed', 17: 'outdated', 18: 'cannot-reproduce' })[code] || '';

// The patch the lab tests and the tip it was extracted at: the first table row of BRANCHES.md, or null when there is none.
export function recordedTip(labRoot, nid) {
  const f = path.join(issueDir(labRoot, nid), 'BRANCHES.md');
  if (!fs.existsSync(f)) return null;
  const row = fs.readFileSync(f, 'utf8').split('\n').find((l) => /^\| \[?`branches\//.test(l));   // the patch name may be a link
  if (!row) return null;
  const cells = row.split('|').map((c) => c.trim());
  return { branch: (cells[2].match(/`([^`]+)`\s*$/) || [])[1] || null, tip: cells[3] || null };
}

// One issue as drupal.org and GitLab report it now. `terms` caches tag names across issues, so a run asks for each tag once.
export async function fetchStatus(nid, { getJson, labRoot, today = new Date().toISOString().slice(0, 10), terms = new Map() }) {
  const node = await getJson(`https://www.drupal.org/api-d7/node/${nid}.json`);
  if (!node || node.type !== 'project_issue') throw new Error(`issue ${nid} was not found on drupal.org`);
  const comments = [];
  for (let p = 0; p < 20; p++) {
    const page = await getJson(`https://www.drupal.org/api-d7/comment.json?node=${nid}&limit=50&page=${p}`);
    const list = (page && page.list) || []; comments.push(...list); if (list.length < 50) break;
  }
  comments.sort((a, b) => Number(a.cid) - Number(b.cid));
  const tags = [];
  for (const t of (node.taxonomy_vocabulary_9 || []).slice(0, 15)) {
    if (!terms.has(t.id)) { let name = null; try { const j = await getJson(`https://www.drupal.org/api-d7/taxonomy_term/${t.id}.json`); name = j ? j.name : null; } catch { /* left out */ } terms.set(t.id, name); }
    if (terms.get(t.id)) tags.push(terms.get(t.id));
  }
  // Merge requests from this issue's fork: its branches named after the issue, plus the branch BRANCHES.md records (which may not
  // carry the number, such as sidebar-toggle-fixes). Another fork can have a branch of the same name, so only MRs from this fork count.
  const rec = recordedTip(labRoot, nid), mrs = [];
  const fork = await getJson(`${GITLAB}/projects/issue%2Fdrupal-${nid}`);
  if (fork && fork.id) {
    const named = ((await getJson(`${GITLAB}/projects/${fork.id}/repository/branches?search=${nid}&per_page=100`)) || []).map((b) => b.name);
    for (const name of [...new Set([...named, ...(rec && rec.branch ? [rec.branch] : [])])]) {
      const list = (await getJson(`${GITLAB}/projects/project%2Fdrupal/merge_requests?source_branch=${encodeURIComponent(name)}&scope=all&state=all`)) || [];
      mrs.push(...list.filter((m) => m.source_project_id === fork.id).map((m) => ({ iid: m.iid, state: m.state, branch: m.source_branch, sha: String(m.sha || '').slice(0, 8), updated: String(m.updated_at).slice(0, 10), draft: !!m.draft })));
    }
  }
  mrs.sort((a, b) => (b.branch === rec?.branch) - (a.branch === rec?.branch) || (b.state === 'opened') - (a.state === 'opened') || b.updated.localeCompare(a.updated));
  return {
    nid: String(nid), since: today, title: node.title, url: `https://www.drupal.org/project/drupal/issues/${nid}`,
    status: STATUS[node.field_issue_status] || `code ${node.field_issue_status}`, statusCode: Number(node.field_issue_status),
    priority: PRIORITY[node.field_issue_priority] || null, category: CATEGORY[node.field_issue_category] || null,
    component: node.field_issue_component || null, version: node.field_issue_version || null, tags, changed: day(node.changed), comments: comments.length,
    latest: comments.slice(-3).map((c, i, a) => ({ n: comments.length - a.length + i + 1, by: c.name || 'unknown', on: day(c.created), text: neutralize(htmlToText(c.comment_body && c.comment_body.value)).replace(/\s+/g, ' ').slice(0, 240) })),
    mr: mrs[0] || null, otherMrs: mrs.slice(1),
  };
}

// What changed between two stored states; [] when nothing that matters did.
export function changes(s, prev) {
  if (!prev) return [];
  const c = [];
  if (prev.status !== s.status) c.push(`status ${prev.status} → ${s.status}`);
  if (prev.comments !== s.comments) c.push(`${s.comments - prev.comments} new comment(s)`);
  if ((prev.mr?.sha || null) !== (s.mr?.sha || null)) c.push(`MR head ${prev.mr?.sha || 'none'} → ${s.mr?.sha || 'none'}`);
  else if ((prev.mr?.state || null) !== (s.mr?.state || null)) c.push(`MR ${prev.mr?.state || 'none'} → ${s.mr?.state || 'none'}`);
  if (prev.title !== s.title) c.push('title changed');
  if (prev.priority !== s.priority) c.push(`priority ${prev.priority} → ${s.priority}`);
  if (JSON.stringify(prev.tags || []) !== JSON.stringify(s.tags || [])) c.push('tags changed');
  return c;
}

// Whether the merge request has moved on from what the lab tested: '' when it has not, otherwise what to say. Worked out from the
// stored MR and the current BRANCHES.md, so re-extracting the patch clears it at once.
export function retestReason(mr, rec) {
  if (!mr || !rec || !rec.tip) return '';
  if (rec.branch && mr.branch !== rec.branch) return `the MR is now !${mr.iid} on branch ${mr.branch}; the lab tested ${rec.branch}`;
  const head = mr.sha.toLowerCase(), tip = rec.tip.toLowerCase();
  return head && (tip.startsWith(head) || head.startsWith(tip.slice(0, 8))) ? '' : `MR !${mr.iid} is at ${mr.sha}; the lab tested ${rec.tip.slice(0, 8)}`;
}

export const readStatus = (dir) => { try { return JSON.parse(fs.readFileSync(path.join(dir, 'status.json'), 'utf8')); } catch { return null; } };

// The archive record (ARCHIVED.md, written by scripts/issue-archive.mjs): { date, reason } or null.
export function readArchived(dir) {
  const f = path.join(dir, 'ARCHIVED.md');
  if (!fs.existsSync(f)) return null;
  const t = fs.readFileSync(f, 'utf8'), field = (k) => (t.match(new RegExp(`^- ${k}: (.+)$`, 'm')) || [])[1] || '';
  return { date: field('Archived') || (t.match(/\d{4}-\d{2}-\d{2}/) || [''])[0], reason: field('Reason') || 'see ARCHIVED.md' };
}

// The next step for a person, and which part of the issue list it belongs in: attention, waiting, unchecked or archived.
export function nextStep({ nid, status: s, rec, archived }) {
  if (archived) return { group: 'archived', text: `Archived ${archived.date}: ${archived.reason}` };
  if (!s) return { group: 'unchecked', text: `Not checked yet: node scripts/issue-status.mjs ${nid} --write` };
  const archive = `node scripts/issue-archive.mjs ${nid}`;
  if (FIXED.has(s.statusCode)) return { group: 'attention', text: `${s.status} upstream: confirm on core main, then archive (${archive})` };
  if (CLOSED_OTHER.has(s.statusCode)) return { group: 'attention', text: `${s.status}: archive (${archive})` };
  if (s.mr && s.mr.state === 'merged') return { group: 'attention', text: `MR !${s.mr.iid} is merged: confirm on core main, then archive (${archive})` };
  const retest = retestReason(s.mr, rec);
  if (retest) return { group: 'attention', text: `Re-test: ${retest}` };
  if (s.statusCode === 14) return { group: 'attention', text: 'RTBC: one final run on current core main' };
  if (s.mr && s.mr.state === 'closed') return { group: 'attention', text: `MR !${s.mr.iid} is closed: check the issue for a newer one` };
  if (s.statusCode === 13) return { group: 'waiting', text: 'Needs work: waiting on the MR' };
  if (s.statusCode === 8) return { group: 'waiting', text: rec && s.mr ? 'Needs review: the lab has tested the current MR head' : 'Needs review; the lab has no MR patch recorded (BRANCHES.md)' };
  return { group: 'waiting', text: s.mr ? s.status : `${s.status}; no MR found` };
}

// A dated snapshot of one issue for STATUS-<date>.md and for the terminal.
export function statusMarkdown(s, ch, rec, prev) {
  const mrLine = s.mr ? `!${s.mr.iid} (${s.mr.state}${s.mr.draft ? ', draft' : ''}), branch \`${s.mr.branch}\`, head \`${s.mr.sha}\`, updated ${s.mr.updated}` : 'none found';
  const retest = retestReason(s.mr, rec);
  return `# #${s.nid} status snapshot (${s.since})\n\nFetched by \`scripts/issue-status.mjs\` from the drupal.org and GitLab APIs. Re-check on the issue page before relying on it.\n\n` +
    `- Issue: [${s.title}](${s.url})\n- Status: **${s.status}**; ${s.priority} ${s.category}; component ${s.component}; version ${s.version}\n- Tags: ${s.tags.join(', ') || 'none'}\n- Last updated ${s.changed}; ${s.comments} comments\n` +
    `- Merge request: ${mrLine}${s.otherMrs.length ? `; others: ${s.otherMrs.map((m) => `!${m.iid} (${m.state})`).join(', ')}` : ''}\n` +
    `- Lab patch: ${rec ? `tip \`${rec.tip}\` of \`${rec.branch}\` (BRANCHES.md)` : 'no BRANCHES.md'}${retest ? ` **Re-test: ${retest}.**` : ''}\n` +
    `- Since the last check: ${!prev ? 'first check' : ch.length ? ch.join('; ') : `no change since ${prev.since}`}\n\n## Latest comments\n\n${s.latest.map((c) => `- #${c.n} ${c.by}, ${c.on}: ${c.text}`).join('\n') || 'none'}\n`;
}

// Keep the state in <issue>/status.json, rewritten only when something changed, so a run that finds nothing new changes no file and
// `since` keeps the date the lab first saw the current state. A change after an earlier check also gets STATUS-<date>.md (an
// existing one is kept unless `force`); the first check of an issue gets none.
export function saveStatus(dir, s, { rec = null, force = false } = {}) {
  const prev = readStatus(dir), changed = changes(s, prev), wrote = [];
  if (prev && !changed.length) return { prev, changed, wrote };
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'status.json'), JSON.stringify(s, null, 2) + '\n'); wrote.push('status.json');
  const snapshot = path.join(dir, `STATUS-${s.since}.md`);
  if (prev && (force || !fs.existsSync(snapshot))) { fs.writeFileSync(snapshot, statusMarkdown(s, changed, rec, prev)); wrote.push(path.basename(snapshot)); }
  return { prev, changed, wrote };
}

// Mark one variant retired in the text of a variants.json without rewriting the rest of the file: `"retired": "<note>"` goes right
// after its slug, on a line of its own when the slug has one. Throws unless the slug occurs exactly once and the result still parses
// with the mark on that variant.
export function markRetired(text, slug, note) {
  const re = new RegExp(`"slug"\\s*:\\s*"${slug.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"(,\\r?\\n[ \\t]*)?`, 'g');
  const hits = (text.match(re) || []).length;
  if (hits !== 1) throw new Error(`expected "slug": "${slug}" once in the file, found it ${hits} times`);
  const out = text.replace(re, (m, nextLine) => (nextLine ? `${m.slice(0, -nextLine.length)}${nextLine}"retired": ${JSON.stringify(note)}${nextLine}` : `${m}, "retired": ${JSON.stringify(note)}`));
  if (!JSON.parse(out).some((x) => x.slug === slug && x.retired === note)) throw new Error(`the retired mark did not land on ${slug}`);
  return out;
}

// ARCHIVED.md: the record that the lab has finished with an issue. readArchived reads its Archived and Reason lines.
export function archivedMarkdown({ nid, title, date, reason, status, commit, duplicateOf, retired, kept, note }) {
  return `# #${nid} archived (${date})\n\n${title ? `${title}\n\n` : ''}` +
    'Archived in place: this folder, its evidence and its pinned comparisons stay as they are, so links to them keep working.\n\n' +
    `- Archived: ${date}\n- Reason: ${reason}\n` +
    `- drupal.org status: ${status ? `${status.status} (status.json, ${status.since})` : 'not checked by the lab (no status.json)'}\n` +
    `- Core commit with the change: ${commit ? `\`${commit}\`` : 'not recorded'}\n` +
    (duplicateOf ? `- Duplicate of: [#${duplicateOf}](https://www.drupal.org/project/drupal/issues/${duplicateOf})\n` : '') +
    `- Retired comparisons (they follow a core branch that now has the change, so their patch no longer applies): ${retired.length ? retired.map((x) => `\`${x}\``).join(', ') : 'none'}\n` +
    `- Comparisons that still build: ${kept.length ? kept.map((x) => `\`${x}\``).join(', ') : 'none'}\n` +
    (note ? `- Note: ${note}\n` : '') +
    `\nTo free the disk a retired comparison used, on the machine that built it: ${retired.length ? retired.map((x) => `\`node scripts/lab-env.mjs retire ${x} --yes\``).join(', ') : 'nothing to do'}.\n` +
    'To undo: delete this file and the `"retired"` entries in variants.json (or revert the commit that archived it).\n';
}

// reports/issues/README.md: every issue folder, grouped by what it needs next. Built only from files in the lab (status.json,
// BRANCHES.md, ARCHIVED.md and the folder's own headings), so it runs offline.
export function buildIndex(labRoot) {
  const esc = (t) => String(t).replace(/\s+/g, ' ').replace(/\|/g, '\\|').trim();
  const groups = { attention: [], waiting: [], unchecked: [], archived: [] };
  for (const nid of issueNids(labRoot)) {
    const dir = issueDir(labRoot, nid), has = (f) => fs.existsSync(path.join(dir, f));
    const heading = (f) => { if (!f || !has(f) || !fs.statSync(path.join(dir, f)).isFile()) return ''; const m = fs.readFileSync(path.join(dir, f), 'utf8').match(/^#\s+(.*)$/m); return m ? m[1].replace(/^Reproduce #\d+:\s*/, '').replace(/^#\d+:\s*/, '').trim() : ''; };
    const s = readStatus(dir), rec = recordedTip(labRoot, nid), archived = readArchived(dir);
    let what = (s && s.title) || heading('REPRODUCE.md') || heading('SUMMARY.md') || '(see folder)';
    if (what.length > 80) what = what.slice(0, 80).replace(/\s+\S*$/, '').trim() + '…';
    const step = nextStep({ nid, status: s, rec, archived });
    const issue = `[${nid}](${has('SUMMARY.md') ? `${nid}/SUMMARY.md` : `${nid}/`})`;
    if (step.group === 'archived') { groups.archived.push(`| ${issue} | ${esc(what)} | ${archived.date} | ${esc(archived.reason)} |`); continue; }
    const lab = `${rec && rec.tip ? `\`${rec.tip.slice(0, 8)}\`` : 'no MR patch'}${has('REPRODUCE.md') ? ` ([how](${nid}/REPRODUCE.md))` : ''}`;
    if (step.group === 'unchecked') { groups.unchecked.push(`| ${issue} | ${esc(what)} | ${lab} |`); continue; }
    const dorg = s ? `${esc(s.status)}, updated ${s.changed}` : '';
    const mr = s ? (s.mr ? `!${s.mr.iid} ${s.mr.state} at \`${s.mr.sha}\`` : 'none found') : '';
    groups[step.group].push(`| ${issue} | ${esc(what)} | ${dorg} | ${mr} | ${lab} | ${esc(step.text)} |`);
  }
  const table = (rows) => `| Issue | What | drupal.org | Merge request | Lab tested | Next step |\n|---|---|---|---|---|---|\n${rows.join('\n')}\n`;
  const section = (title, intro, rows, render = table) => `## ${title} (${rows.length})\n\n${intro}\n\n${rows.length ? render(rows) : 'None.\n'}`;
  const md = `# Issues evaluated in this lab\n\n` +
    'Generated by `node scripts/index-issues.mjs`; do not edit by hand. The drupal.org columns come from each issue\'s `status.json`,\n' +
    'which the weekly check (`.github/workflows/issue-status.yml`, or `node scripts/issue-status.mjs --all --write`) rewrites only when\n' +
    'something changed. "Lab tested" is the merge request commit in the issue\'s `BRANCHES.md`. How to act on each next step, and how\n' +
    'an issue is archived: [docs/ISSUE-LIFECYCLE.md](../../docs/ISSUE-LIFECYCLE.md). To start a new issue:\n' +
    '`node scripts/new-issue.mjs <nid> --branch <fork-branch>` ([docs/NEW-ISSUE.md](../../docs/NEW-ISSUE.md)).\n\n' +
    section('Needs attention', 'Something changed upstream that the lab should act on.', groups.attention) + '\n' +
    section('Waiting', 'Nothing for the lab to do until the issue moves.', groups.waiting) + '\n' +
    section('Not checked yet', 'No `status.json` yet: the next weekly check fills these in, or `node scripts/issue-status.mjs <nid> --write` for one.', groups.unchecked,
      (rows) => `| Issue | What | Lab tested |\n|---|---|---|\n${rows.join('\n')}\n`) + '\n' +
    section('Archived', 'Finished: closed on drupal.org and archived in place. The folders and their evidence stay; see each `ARCHIVED.md`.', groups.archived,
      (rows) => `| Issue | What | Archived | Reason |\n|---|---|---|---|\n${rows.join('\n')}\n`);
  return { md, counts: Object.fromEntries(Object.entries(groups).map(([k, v]) => [k, v.length])) };
}
