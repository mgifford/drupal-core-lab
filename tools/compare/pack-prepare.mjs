// Prepare the chat prompt for one Drupal core issue: fetch the issue text and its merge request diff from their standard public places and
// fill in the three inputs of prompts/issue-pack-chat-prompt.md. Read-only: it only issues GET requests to drupal.org and git.drupalcode.org,
// sends nothing about you, and writes nothing itself (scripts/issue-pack.mjs prepare writes the result). Everything fetched is DATA for the
// chat assistant; the prompt tells it so, and lines that could pass for the prompt's own markers are quoted below.
//
//   issue:  https://www.drupal.org/api-d7/node/<nid>.json, .../comment.json?node=<nid>, .../file/<fid>.json
//   fork:   https://git.drupalcode.org/api/v4/projects/issue%2Fdrupal-<nid>/repository/branches?search=<nid>
//   MR:     https://git.drupalcode.org/api/v4/projects/project%2Fdrupal/merge_requests?source_branch=<branch>&scope=all&state=all
//   diff:   https://git.drupalcode.org/project/drupal/-/merge_requests/<iid>.diff
export const HOSTS = new Set(['www.drupal.org', 'git.drupalcode.org']);
export const USER_AGENT = 'drupal-core-lab-issue-pack/1 (+https://github.com/mgifford/drupal-core-lab)';
export const MAX_DIFF_BYTES = 300 * 1024;
const MAX_COMMENT_PAGES = 20, PAGE_SIZE = 50, MAX_FILES = 30;

// Numeric codes from the drupal.org API. Each label is printed with its code, so a wrong label is visible. Unknown codes are shown as codes only.
export const STATUS = { 1: 'Active', 2: 'Fixed', 3: 'Closed (duplicate)', 4: 'Postponed', 5: 'Closed (won\'t fix)', 6: 'Closed (works as designed)', 7: 'Closed (fixed)',
  8: 'Needs review', 13: 'Needs work', 14: 'Reviewed & tested by the community', 15: 'Patch (to be ported)', 16: 'Postponed (maintainer needs more info)' };
export const PRIORITY = { 100: 'Minor', 200: 'Normal', 300: 'Major', 400: 'Critical' };
export const CATEGORY = { 1: 'Bug report', 2: 'Task', 3: 'Feature request', 4: 'Support request', 5: 'Plan' };
const label = (map, code) => (code === undefined || code === null || code === '' ? 'unknown' : `${map[code] ?? 'code ' + code} [${code}]`);

export function parseIssue(input) {
  const s = String(input || '').trim();
  if (/^\d{5,8}$/.test(s)) return s;
  let u; try { u = new URL(s); } catch { throw new Error(`"${s}" is not an issue number or a drupal.org issue URL`); }
  const m = u.hostname === 'www.drupal.org' && u.protocol === 'https:' && (u.pathname.match(/^\/project\/drupal\/issues\/(\d{5,8})\/?$/) || u.pathname.match(/^\/node\/(\d{5,8})\/?$/));
  if (!m) throw new Error('only Drupal core issues are supported: use https://www.drupal.org/project/drupal/issues/<number> or the number');
  return m[1];
}

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', hellip: '…', mdash: '—', ndash: '–', rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“' };
export function htmlToText(html) {
  return String(html || '')
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n').replace(/<\/(p|div|h[1-6]|pre|blockquote|tr)>/gi, '\n\n').replace(/<li[^>]*>/gi, '\n- ').replace(/<\/(ul|ol)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n))).replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&([a-z]+);/gi, (m, n) => ENTITIES[n.toLowerCase()] ?? m)
    .replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
}

// Fetched text must not be able to pass for the prompt's own banner, headings or placeholder: quote any line that looks like one.
export function neutralize(text) {
  return String(text).split('\n').map((l) => (/^\s*(>>> INPUT|={3,}|@@MISSING@@|END OF INPUTS|FOR THE PERSON|RULES\b)/.test(l) ? `[quoted] ${l}` : l)).join('\n');
}

const allowed = (u) => u.protocol === 'https:' && HOSTS.has(u.hostname);
const REDIRECTS = new Set([301, 302, 303, 307, 308]);

// GET with the allowlist enforced on every hop (a redirect to another host is refused, never followed), a time limit, and a byte cap
// that is applied while reading, so an oversized response is not held in memory.
export async function getText(url, { fetchImpl = fetch, timeoutMs = 30000, maxBytes = 5 * 1024 * 1024 } = {}) {
  const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    let current = new URL(url);
    for (let hop = 0; hop <= 3; hop++) {
      if (!allowed(current)) throw new Error(`refusing to fetch ${current.protocol}//${current.hostname}: only https on ${[...HOSTS].join(' and ')}`);
      const res = await fetchImpl(current.href, { headers: { 'user-agent': USER_AGENT, accept: '*/*' }, signal: ctl.signal, redirect: 'manual' });
      if (REDIRECTS.has(res.status)) {
        const loc = res.headers && res.headers.get && res.headers.get('location');
        if (!loc) throw new Error(`${current.hostname} answered a redirect with no Location`);
        current = new URL(loc, current); continue;
      }
      const declared = Number(res.headers && res.headers.get ? res.headers.get('content-length') : NaN);
      if (declared > maxBytes) throw new Error(`response from ${current.hostname} is larger than ${maxBytes / 1024 / 1024} MB`);
      if (res.body && typeof res.body.getReader === 'function') {
        const reader = res.body.getReader(), chunks = []; let total = 0;
        for (;;) {
          const { done, value } = await reader.read(); if (done) break;
          total += value.length;
          if (total > maxBytes) { await reader.cancel().catch(() => {}); throw new Error(`response from ${current.hostname} is larger than ${maxBytes / 1024 / 1024} MB`); }
          chunks.push(value);
        }
        return { status: res.status, text: Buffer.concat(chunks).toString('utf8') };
      }
      const text = await res.text();
      if (text.length > maxBytes) throw new Error(`response from ${current.hostname} is larger than ${maxBytes / 1024 / 1024} MB`);
      return { status: res.status, text };
    }
    throw new Error('too many redirects');
  } finally { clearTimeout(t); }
}
const getJson = async (url, opts) => { const r = await getText(url, opts); if (r.status === 404) return null; if (r.status !== 200) throw new Error(`${url} answered HTTP ${r.status}`); try { return JSON.parse(r.text); } catch { throw new Error(`${url} did not return JSON`); } };

const day = (epoch) => new Date(Number(epoch) * 1000).toISOString().slice(0, 10);
const kb = (n) => `${Math.max(1, Math.round(Number(n) / 1024))} KB`;

export async function gather(nid, { fetchImpl = fetch, mr: mrOverride, log = () => {}, now = new Date() } = {}) {
  if (!/^\d{5,8}$/.test(String(nid))) throw new Error('the issue number must be 5 to 8 digits');
  if (mrOverride !== undefined && !/^\d{1,7}$/.test(String(mrOverride))) throw new Error('the merge request number must be 1 to 7 digits');
  const o = { fetchImpl };
  const out = { nid, url: `https://www.drupal.org/project/drupal/issues/${nid}`, issueText: null, mr: null, diff: null, notes: [], missing: {} };

  log(`Fetching issue ${nid} from drupal.org ...`);
  const node = await getJson(`https://www.drupal.org/api-d7/node/${nid}.json`, o);
  if (!node || node.type !== 'project_issue') { out.missing.issue = `issue ${nid} was not found on drupal.org`; return out; }
  if (!String(node.url || '').includes('/project/drupal/')) throw new Error(`#${nid} is not a Drupal core issue (${node.url}); only core issues are supported`);

  const comments = [];
  for (let p = 0; p < MAX_COMMENT_PAGES; p++) {
    const page = await getJson(`https://www.drupal.org/api-d7/comment.json?node=${nid}&limit=${PAGE_SIZE}&page=${p}`, o);
    const list = (page && page.list) || [];
    comments.push(...list);
    if (list.length < PAGE_SIZE) break;
  }
  comments.sort((a, b) => Number(a.cid) - Number(b.cid));
  const numberOf = new Map(comments.map((c, i) => [String(c.cid), i + 1]));

  const files = [];
  for (const f of (node.field_issue_files || []).slice(0, MAX_FILES)) {
    const id = f.file && f.file.id; if (!id) continue;
    try { const j = await getJson(`https://www.drupal.org/api-d7/file/${id}.json`, o); if (j) files.push({ name: j.name, size: j.size, cid: f.file.cid }); } catch { /* an attachment we cannot describe is skipped */ }
  }

  const lines = [
    `ISSUE #${nid}: ${node.title}`, `URL: ${out.url}`,
    `Status: ${label(STATUS, node.field_issue_status)} | Priority: ${label(PRIORITY, node.field_issue_priority)} | Category: ${label(CATEGORY, node.field_issue_category)} | Component: ${node.field_issue_component || 'unknown'} | Version: ${node.field_issue_version || 'unknown'}`,
    `Created: ${day(node.created)} | Last updated: ${day(node.changed)} | Comments: ${comments.length}`,
    `Source: the drupal.org API, fetched ${now.toISOString().slice(0, 10)}. Status, tag and metadata change notes that the web page shows inside comments are not included; comment numbers are counted in order and may differ from the page if comments were removed.`,
    '', '--- ISSUE SUMMARY (written by the reporter; it may have been edited after the comments) ---', htmlToText(node.body && node.body.value) || '(empty)', '',
    '--- ATTACHMENTS ---', ...(files.length ? files.map((f) => `- ${f.name} (${kb(f.size)}), added in comment #${numberOf.get(String(f.cid)) ?? '?'}`) : ['(none listed)']), '', '--- COMMENTS ---',
  ];
  for (const c of comments) {
    const n = numberOf.get(String(c.cid));
    lines.push('', `#${n} ${c.name || 'unknown'}, ${day(c.created)} (comment id ${c.cid})`, htmlToText(c.comment_body && c.comment_body.value) || '(no text)');
  }
  out.issueText = neutralize(lines.join('\n'));

  // the issue fork's branch and its merge request
  log('Looking for the issue fork branch and merge request on git.drupalcode.org ...');
  let found = [];
  if (mrOverride) {
    const m = await getJson(`https://git.drupalcode.org/api/v4/projects/project%2Fdrupal/merge_requests/${mrOverride}`, o);
    if (m) found = [m]; else out.notes.push(`Merge request !${mrOverride} was not found in project/drupal.`);
  } else {
    const branches = (await getJson(`https://git.drupalcode.org/api/v4/projects/issue%2Fdrupal-${nid}/repository/branches?search=${nid}`, o)) || [];
    for (const b of branches.filter((x) => x.name && x.name.startsWith(`${nid}-`))) {
      const list = (await getJson(`https://git.drupalcode.org/api/v4/projects/project%2Fdrupal/merge_requests?source_branch=${encodeURIComponent(b.name)}&scope=all&state=all`, o)) || [];
      found.push(...list);
    }
  }
  if (!found.length) out.missing.mr = mrOverride ? `merge request !${mrOverride} was not found` : `no merge request was found for a branch named ${nid}-... in the issue fork (patch-only issues need a fork branch for the lab)`;
  else {
    found.sort((a, b) => (b.state === 'opened') - (a.state === 'opened') || String(b.updated_at).localeCompare(String(a.updated_at)));
    const m = found[0];
    out.mr = { iid: String(m.iid), state: m.state, branch: m.source_branch, target: m.target_branch, updated: String(m.updated_at).slice(0, 10), url: `https://git.drupalcode.org/project/drupal/-/merge_requests/${m.iid}` };
    if (found.length > 1) out.notes.push(`More than one merge request matched; using !${m.iid}. Others: ${found.slice(1).map((x) => `!${x.iid} (${x.state}, ${x.source_branch})`).join(', ')}. Use --mr <number> to choose another.`);
    log(`Fetching the diff of merge request !${m.iid} ...`);
    const d = await getText(`${out.mr.url}.diff`, o);
    if (d.status !== 200 || !d.text.trim()) out.missing.diff = `the diff of !${m.iid} could not be fetched (HTTP ${d.status})`;
    else {
      let diff = d.text, truncated = false;
      if (Buffer.byteLength(diff) > MAX_DIFF_BYTES) { diff = Buffer.from(diff).subarray(0, MAX_DIFF_BYTES).toString('utf8'); truncated = true; out.notes.push(`The diff is larger than ${MAX_DIFF_BYTES / 1024} KB and was cut.`); }
      out.diff = neutralize(`Merge request !${m.iid} (${m.state}, last updated ${out.mr.updated}), source branch ${m.source_branch}, target branch ${m.target_branch}\n${out.mr.url}\n\n${diff}${truncated ? `\n[TRUNCATED at ${MAX_DIFF_BYTES / 1024} KB: the diff continues. Say in review.unverified that you saw only part of it.]` : ''}`);
    }
  }
  return out;
}

// Put the gathered text into the template's three inputs and say in the banner what is still missing.
export function composePrompt(template, example, g, { now = new Date() } = {}) {
  const inputs = [g.url, g.issueText, g.diff];
  const lines = template.replace('{{EXAMPLE}}', () => example).split('\n'); const out = [];
  let missing = 0;
  for (let i = 0; i < lines.length; i++) {
    out.push(lines[i]);
    const h = lines[i].match(/^>>> INPUT (\d) OF 3/);
    if (!h) continue;
    const k = Number(h[1]) - 1, v = inputs[k];
    i++; // skip the placeholder line
    if (v) out.push(v); else { missing++; out.push(`@@MISSING@@ (${(k === 0 ? 'no issue URL' : k === 1 ? g.missing.issue : g.missing.mr || g.missing.diff) || 'not available'}; paste it yourself)`); }
  }
  let text = out.join('\n');
  const day10 = now.toISOString().slice(0, 10);
  const banner = missing === 0
    ? ` INPUTS FILLED IN AUTOMATICALLY on ${day10} by scripts/issue-pack.mjs (issue from the drupal.org API, merge request from git.drupalcode.org).\n CHECK THEM, THEN SEND THIS WHOLE MESSAGE.`
    : ` ${missing} OF 3 INPUTS COULD NOT BE FETCHED (marked @@MISSING@@ below). Paste them yourself, then SEND THIS WHOLE MESSAGE.`;
  text = text.replace(/^ FOR THE PERSON:[^\n]*\n Replace each placeholder[^\n]*\n/m, `${banner}\n`);
  return { text, missing };
}
