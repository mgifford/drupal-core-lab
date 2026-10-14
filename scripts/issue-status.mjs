// Read an issue's current state from drupal.org and git.drupalcode.org and compare it with what the lab last tested.
//   node scripts/issue-status.mjs <nid> [--write] [--force]     one issue
//   node scripts/issue-status.mjs --all                         one line per issue folder that has a BRANCHES.md
// Read-only on the network (https on www.drupal.org and git.drupalcode.org only, via tools/compare/pack-prepare.mjs); it
// never posts or comments. Reports: status, priority, tags, comment count and the latest comments' authors and dates,
// the merge request's state and head commit, and whether that head is still the tip recorded in BRANCHES.md (if not, the
// patches in branches/ are stale: re-run scripts/new-issue.mjs <nid> --branch <branch> and test again).
// --write saves reports/issues/<nid>/STATUS-<date>.md (refuses to replace one unless --force; never touches a hand-written
// STATUS.md) and status.json, which the next run uses to say what changed since.
import fs from 'node:fs';
import path from 'node:path';
import { labRoot } from '../tools/compare/lib.mjs';
import { getJson, htmlToText, neutralize, STATUS, PRIORITY, CATEGORY } from '../tools/compare/pack-prepare.mjs';

const args = process.argv.slice(2);
const write = args.includes('--write'), force = args.includes('--force'), all = args.includes('--all');
const nidArg = args.find((a) => /^\d{5,8}$/.test(a));
if (!all && !nidArg) { console.error('usage: node scripts/issue-status.mjs <nid> [--write] [--force] | --all'); process.exit(2); }
const day = (epoch) => new Date(Number(epoch) * 1000).toISOString().slice(0, 10);
const today = new Date().toISOString().slice(0, 10);

// The tip and branch recorded when the patch was extracted (first table row of BRANCHES.md).
function recorded(nid) {
  const f = path.join(labRoot, 'reports/issues', nid, 'BRANCHES.md');
  if (!fs.existsSync(f)) return null;
  const row = fs.readFileSync(f, 'utf8').split('\n').find((l) => /^\| `branches\//.test(l));
  if (!row) return null;
  const cells = row.split('|').map((c) => c.trim());
  return { branch: (cells[2].match(/`([^`]+)`\s*$/) || [])[1] || null, tip: cells[3] || null };
}

async function fetchStatus(nid) {
  const node = await getJson(`https://www.drupal.org/api-d7/node/${nid}.json`);
  if (!node || node.type !== 'project_issue') throw new Error(`issue ${nid} was not found on drupal.org`);
  const comments = [];
  for (let p = 0; p < 20; p++) {
    const page = await getJson(`https://www.drupal.org/api-d7/comment.json?node=${nid}&limit=50&page=${p}`);
    const list = (page && page.list) || []; comments.push(...list); if (list.length < 50) break;
  }
  comments.sort((a, b) => Number(a.cid) - Number(b.cid));
  const tags = [];
  for (const t of (node.taxonomy_vocabulary_9 || []).slice(0, 15)) { try { const j = await getJson(`https://www.drupal.org/api-d7/taxonomy_term/${t.id}.json`); if (j) tags.push(j.name); } catch { /* skip */ } }
  const rec = recorded(nid);
  let mr = null;
  const branches = (await getJson(`https://git.drupalcode.org/api/v4/projects/issue%2Fdrupal-${nid}/repository/branches?search=${nid}`)) || [];
  const mrs = [];
  for (const b of branches.filter((x) => x.name && x.name.startsWith(`${nid}-`))) {
    const list = (await getJson(`https://git.drupalcode.org/api/v4/projects/project%2Fdrupal/merge_requests?source_branch=${encodeURIComponent(b.name)}&scope=all&state=all`)) || [];
    mrs.push(...list.map((m) => ({ iid: m.iid, state: m.state, branch: m.source_branch, sha: String(m.sha || '').slice(0, 8), updated: String(m.updated_at).slice(0, 10), draft: !!m.draft })));
  }
  mrs.sort((a, b) => (b.branch === rec?.branch) - (a.branch === rec?.branch) || (b.state === 'opened') - (a.state === 'opened') || b.updated.localeCompare(a.updated));
  mr = mrs[0] || null;
  return {
    nid, fetched: today, title: node.title, url: `https://www.drupal.org/project/drupal/issues/${nid}`,
    status: STATUS[node.field_issue_status] || `code ${node.field_issue_status}`, priority: PRIORITY[node.field_issue_priority] || null,
    category: CATEGORY[node.field_issue_category] || null, component: node.field_issue_component || null, version: node.field_issue_version || null,
    tags, changed: day(node.changed), comments: comments.length,
    latest: comments.slice(-3).map((c, i, a) => ({ n: comments.length - a.length + i + 1, by: c.name || 'unknown', on: day(c.created), text: neutralize(htmlToText(c.comment_body && c.comment_body.value)).replace(/\s+/g, ' ').slice(0, 240) })),
    mr, otherMrs: mrs.slice(1), recorded: rec,
    patchStale: !!(mr && rec && rec.tip && mr.branch === rec.branch && !mr.sha.startsWith(rec.tip.slice(0, 8)) && !rec.tip.startsWith(mr.sha)),
  };
}

function changes(s, prev) {
  if (!prev) return ['no earlier status.json to compare with'];
  const c = [];
  if (prev.status !== s.status) c.push(`status ${prev.status} → ${s.status}`);
  if (prev.comments !== s.comments) c.push(`${s.comments - prev.comments} new comment(s) since ${prev.fetched}`);
  if ((prev.mr && prev.mr.sha) !== (s.mr && s.mr.sha)) c.push(`MR head ${prev.mr?.sha || 'none'} → ${s.mr?.sha || 'none'}`);
  return c.length ? c : [`no change since ${prev.fetched}`];
}

function markdown(s, ch) {
  const mrLine = s.mr ? `!${s.mr.iid} (${s.mr.state}${s.mr.draft ? ', draft' : ''}), branch \`${s.mr.branch}\`, head \`${s.mr.sha}\`, updated ${s.mr.updated}` : 'none found';
  return `# #${s.nid} status snapshot (${s.fetched})\n\nFetched by \`scripts/issue-status.mjs\` from the drupal.org and GitLab APIs. Re-check on the issue page before relying on it.\n\n` +
    `- Issue: [${s.title}](${s.url})\n- Status: **${s.status}**; ${s.priority} ${s.category}; component ${s.component}; version ${s.version}\n- Tags: ${s.tags.join(', ') || 'none'}\n- Last updated ${s.changed}; ${s.comments} comments\n` +
    `- Merge request: ${mrLine}${s.otherMrs.length ? `; others: ${s.otherMrs.map((m) => `!${m.iid} (${m.state})`).join(', ')}` : ''}\n` +
    `- Lab patch: ${s.recorded ? `tip \`${s.recorded.tip}\` of \`${s.recorded.branch}\` (BRANCHES.md)` : 'no BRANCHES.md'}${s.patchStale ? ' **STALE: the MR has newer commits. Re-extract the patch and test again.**' : ''}\n` +
    `- Since the last snapshot: ${ch.join('; ')}\n\n## Latest comments\n\n${s.latest.map((c) => `- #${c.n} ${c.by}, ${c.on}: ${c.text}`).join('\n') || 'none'}\n`;
}

const nids = all ? fs.readdirSync(path.join(labRoot, 'reports/issues')).filter((d) => /^\d+$/.test(d) && recorded(d)) : [nidArg];
let failed = 0;
for (const nid of nids) {
  let s;
  try { s = await fetchStatus(nid); } catch (e) { console.error(`#${nid}: ${e.message}`); failed++; continue; }
  const dir = path.join(labRoot, 'reports/issues', nid);
  const prevFile = path.join(dir, 'status.json');
  const prev = fs.existsSync(prevFile) ? JSON.parse(fs.readFileSync(prevFile, 'utf8')) : null;
  const ch = changes(s, prev);
  if (all) { console.log(`#${nid} ${s.status.padEnd(28)} ${String(s.comments).padStart(3)} comments  MR ${s.mr ? `!${s.mr.iid} ${s.mr.state} ${s.mr.sha}` : 'none'}${s.patchStale ? '  PATCH STALE' : ''}  (${ch.join('; ')})`); }
  else console.log(markdown(s, ch));
  if (write) {
    fs.mkdirSync(dir, { recursive: true });
    const f = path.join(dir, `STATUS-${s.fetched}.md`);
    if (fs.existsSync(f) && !force) console.error(`kept existing ${path.relative(labRoot, f)} (use --force to replace it)`);
    else { fs.writeFileSync(f, markdown(s, ch)); console.error(`wrote ${path.relative(labRoot, f)}`); }
    fs.writeFileSync(prevFile, JSON.stringify(s, null, 2) + '\n');
  }
}
process.exit(failed ? 1 : 0);
