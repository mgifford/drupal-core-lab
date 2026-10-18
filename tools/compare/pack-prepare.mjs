// Prepare the chat prompt for one Drupal core issue: fetch the issue text and its merge request diff from their standard public places and
// fill in the three inputs of prompts/issue-pack-chat-prompt.md. Read-only: it only issues GET requests to drupal.org and git.drupalcode.org,
// sends nothing about you, and writes nothing itself (scripts/issue-pack.mjs prepare writes the result). Everything fetched is DATA for the
// chat assistant; the prompt tells it so, and lines that could pass for the prompt's own markers are quoted below.
//
//   issue:  https://www.drupal.org/api-d7/node/<nid>.json, .../comment.json?node=<nid>, .../file/<fid>.json
//   fork:   https://git.drupalcode.org/api/v4/projects/issue%2Fdrupal-<nid>/repository/branches?search=<nid>
//   MR:     https://git.drupalcode.org/api/v4/projects/project%2Fdrupal/merge_requests?source_branch=<branch>&scope=all&state=all
//   diff:   https://git.drupalcode.org/project/drupal/-/merge_requests/<iid>.diff
//   related issues: the issue's parent and related fields, issues mentioned in its summary or comments (each read with .../node/<id>.json),
//           and issues that name it as their parent or as related (.../node.json?field_issue_parent=<nid>, ?field_issue_related=<nid>)
//   review threads: https://git.drupalcode.org/api/v4/projects/project%2Fdrupal/merge_requests/<iid>/discussions, for every merge request found
export const HOSTS = new Set(['www.drupal.org', 'git.drupalcode.org']);
export const USER_AGENT = 'drupal-core-lab-issue-pack/1 (+https://github.com/mgifford/drupal-core-lab)';
export const MAX_DIFF_BYTES = 300 * 1024;
const MAX_COMMENT_PAGES = 20, PAGE_SIZE = 50, MAX_FILES = 30;
const MAX_RELATED = 25, LIST_LIMIT = 50, MAX_THREAD_MRS = 5, MAX_THREAD_PAGES = 10, THREAD_PAGE = 100;
export const CLOSED = new Set(['2', '3', '5', '6', '7']);   // fixed or closed: an open related issue is the one that may have been overlooked

// Numeric codes from the drupal.org API. Each label is printed with its code, so a wrong label is visible. Unknown codes are shown as codes only.
export const STATUS = { 1: 'Active', 2: 'Fixed', 3: 'Closed (duplicate)', 4: 'Postponed', 5: 'Closed (won\'t fix)', 6: 'Closed (works as designed)', 7: 'Closed (fixed)',
  8: 'Needs review', 13: 'Needs work', 14: 'Reviewed & tested by the community', 15: 'Patch (to be ported)', 16: 'Postponed (maintainer needs more info)',
  17: 'Closed (outdated)', 18: 'Closed (cannot reproduce)' };
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
export const getJson = async (url, opts) => { const r = await getText(url, opts); if (r.status === 404) return null; if (r.status !== 200) throw new Error(`${url} answered HTTP ${r.status}`); try { return JSON.parse(r.text); } catch { throw new Error(`${url} did not return JSON`); } };

const day = (epoch) => new Date(Number(epoch) * 1000).toISOString().slice(0, 10);
const kb = (n) => `${Math.max(1, Math.round(Number(n) / 1024))} KB`;

// ---- related issues: what the issue links to, what links to it, and what its text mentions. Only issues are listed; a link to any other kind of
// page is left out. Every cap and every issue that could not be read is said, in the text and in the notes, never dropped silently.
const idOf = (x) => (x && (x.id || (String(x.url || x.uri || '').match(/\/(?:node|i)\/(\d{5,8})\b/) || [])[1])) || null;
const listOf = (v) => (Array.isArray(v) ? v : v ? [v] : []);
const MENTION_TEXT = /(?:^|[^\w&/])#(\d{6,8})\b/g;   // six or more digits, so "#12" (a comment) is not an issue
const MENTION_URL = /(?:drupal\.org)?\/(?:project\/[a-z0-9_]+\/issues|node|i)\/(\d{5,8})\b/g;
export function mentionsIn(text) { const ids = new Set(); for (const re of [MENTION_TEXT, MENTION_URL]) for (const m of String(text || '').matchAll(re)) ids.add(m[1]); return [...ids]; }
const issueFacts = (n) => ({ title: n.title || '', status: n.field_issue_status ?? null, priority: n.field_issue_priority ?? null, project: (n.field_project && n.field_project.machine_name) || null,
  changed: Number(n.changed) || null, url: n.url || null });

async function gatherRelated(nid, node, comments, o) {
  const how = new Map(), add = (id, why) => { if (!id || String(id) === String(nid)) return; const k = String(id); if (!how.has(k)) how.set(k, []); if (!how.get(k).includes(why)) how.get(k).push(why); };
  for (const x of [...listOf(node.field_issue_parent), ...listOf(node.field_issue_parent_link)]) add(idOf(x), 'parent');
  for (const x of [...listOf(node.field_issue_related), ...listOf(node.field_issue_related_links)]) add(idOf(x), 'related');
  for (const id of mentionsIn(node.body && node.body.value)) add(id, 'mentioned in the summary');
  for (const c of comments) for (const id of mentionsIn(c.html)) add(id, `mentioned in #${c.n}`);
  const facts = new Map(), notes = [];
  // Issues that point here. A filter the API does not apply would return unrelated issues, so each one is checked before it is kept.
  for (const [field, why, holds] of [['field_issue_parent', 'child (names this issue as its parent)', (n) => listOf(n.field_issue_parent).some((x) => String(idOf(x)) === String(nid))],
    ['field_issue_related', 'lists this issue as related', (n) => listOf(n.field_issue_related).some((x) => String(idOf(x)) === String(nid))]]) {
    try {
      const page = await getJson(`https://www.drupal.org/api-d7/node.json?type=project_issue&${field}=${nid}&limit=${LIST_LIMIT}`, o);
      const list = ((page && page.list) || []).filter((n) => n && n.type === 'project_issue' && holds(n));
      for (const n of list) { add(n.nid, why); facts.set(String(n.nid), issueFacts(n)); }
      if (list.length >= LIST_LIMIT) notes.push(`LIMIT: at least ${LIST_LIMIT} issues ${why === 'lists this issue as related' ? 'list this issue as related' : 'name this issue as their parent'}; only the first ${LIST_LIMIT} are listed.`);
    } catch (e) { notes.push(`Issues that ${field === 'field_issue_parent' ? 'name this issue as their parent' : 'list this issue as related'} could not be listed: ${e.message}`); }
  }
  const order = { parent: 0, related: 1 }, rank = (whys) => Math.min(...whys.map((w) => order[w] ?? (w.startsWith('child') || w.startsWith('lists') ? 2 : 3)));
  const ids = [...how.keys()].sort((a, b) => rank(how.get(a)) - rank(how.get(b)));
  const toRead = ids.filter((id) => !facts.has(id)), read = toRead.slice(0, MAX_RELATED), unread = toRead.slice(MAX_RELATED), failed = [], notIssue = [];
  for (const id of read) {
    try { const n = await getJson(`https://www.drupal.org/api-d7/node/${id}.json`, o); if (!n) failed.push(`#${id} (not found)`); else if (n.type !== 'project_issue') notIssue.push(id); else facts.set(id, issueFacts(n)); }
    catch (e) { failed.push(`#${id} (${e.message})`); }
  }
  if (unread.length) notes.push(`LIMIT: ${toRead.length} linked or mentioned issues; the first ${MAX_RELATED} were read. Not read: ${unread.map((x) => `#${x}`).join(', ')}.`);
  if (failed.length) notes.push(`Related issues that could not be read: ${failed.join(', ')}.`);
  const items = ids.filter((id) => !notIssue.includes(id)).map((id) => ({ nid: id, how: how.get(id), read: facts.has(id), ...(facts.get(id) || {}) }));
  return { items, notes, limits: { found: ids.length, read: facts.size, max: MAX_RELATED, capped: unread.length > 0, unreadable: failed.length } };
}
export function relatedText(rel) {
  const L = ['', `--- RELATED ISSUES (${rel.items.length}: parent, related, child, issues that list this one as related, and issues mentioned in the summary or comments) ---`];
  if (!rel.items.length) L.push('(none found)');
  for (const r of rel.items) {
    const state = !r.read ? 'NOT READ' : `${CLOSED.has(String(r.status)) ? 'closed' : 'OPEN'}: ${label(STATUS, r.status)}, ${label(PRIORITY, r.priority)}, project ${r.project || 'unknown'}, last changed ${r.changed ? day(r.changed) : 'unknown'}`;
    L.push(`- #${r.nid} ${r.read ? `"${r.title}"` : ''} [${state}] (${r.how.join('; ')}) https://www.drupal.org/i/${r.nid}`.replace('  ', ' '));
  }
  return L;
}

// ---- review threads on the merge requests: GitLab discussions, system notes left out. A thread is unresolved when it can be resolved and is not.
async function gatherThreads(mrs, o) {
  const threads = [], notes = [], limits = { mrs: mrs.length, read: 0, max: MAX_THREAD_MRS, capped: mrs.length > MAX_THREAD_MRS, pagesCapped: [] };
  for (const m of mrs.slice(0, MAX_THREAD_MRS)) {
    try {
      let p = 1;
      for (; p <= MAX_THREAD_PAGES; p++) {
        const page = await getJson(`https://git.drupalcode.org/api/v4/projects/project%2Fdrupal/merge_requests/${m.iid}/discussions?per_page=${THREAD_PAGE}&page=${p}`, o);
        const list = Array.isArray(page) ? page : [];
        for (const d of list) {
          const ns = (d.notes || []).filter((n) => !n.system); if (!ns.length) continue;
          const pos = (ns[0].position) || {}, resolvable = ns.filter((n) => n.resolvable);
          threads.push({ mr: String(m.iid), mrState: m.state, id: String(d.id), file: pos.new_path || pos.old_path || null, line: pos.new_line ?? pos.old_line ?? null,
            state: !resolvable.length ? 'comment' : resolvable.every((n) => n.resolved) ? 'resolved' : 'unresolved',
            notes: ns.map((n) => ({ author: (n.author && n.author.username) || 'unknown', created: String(n.created_at || '').slice(0, 10), text: String(n.body || '') })) });
        }
        if (list.length < THREAD_PAGE) break;
      }
      if (p > MAX_THREAD_PAGES) { limits.pagesCapped.push(String(m.iid)); notes.push(`LIMIT: review threads of !${m.iid} were read up to ${MAX_THREAD_PAGES} pages of ${THREAD_PAGE}; there may be more.`); }
      limits.read++;
    } catch (e) { notes.push(`The review threads of !${m.iid} could not be read: ${e.message}`); }
  }
  if (limits.capped) notes.push(`LIMIT: ${mrs.length} merge requests; review threads were read for ${MAX_THREAD_MRS}: ${mrs.slice(0, MAX_THREAD_MRS).map((m) => `!${m.iid}`).join(', ')}.`);
  return { threads, notes, limits };
}
export function threadsText(t) {
  const n = (s) => t.threads.filter((x) => x.state === s).length, order = { unresolved: 0, comment: 1, resolved: 2 };
  const L = ['', `--- MERGE REQUEST REVIEW THREADS (git.drupalcode.org: ${t.threads.length} threads, ${n('unresolved')} unresolved, ${n('comment')} general comments, ${n('resolved')} resolved) ---`];
  if (!t.threads.length) L.push('(none found)');
  for (const x of [...t.threads].sort((a, b) => order[a.state] - order[b.state])) {
    L.push('', `[${x.state.toUpperCase()}] !${x.mr} (${x.mrState})${x.file ? `, ${x.file}${x.line != null ? ` line ${x.line}` : ''}` : ''}`);
    for (const c of x.notes) L.push(`@${c.author}, ${c.created}:`, ...c.text.split('\n').map((l) => `  ${l}`));
  }
  return L;
}

export async function gather(nid, { fetchImpl = fetch, mr: mrOverride, log = () => {}, now = new Date() } = {}) {
  if (!/^\d{5,8}$/.test(String(nid))) throw new Error('the issue number must be 5 to 8 digits');
  if (mrOverride !== undefined && !/^\d{1,7}$/.test(String(mrOverride))) throw new Error('the merge request number must be 1 to 7 digits');
  const o = { fetchImpl };
  const out = { nid, url: `https://www.drupal.org/project/drupal/issues/${nid}`, issueText: null, mr: null, diff: null, notes: [], missing: {} };

  log(`Fetching issue ${nid} from drupal.org ...`);
  const node = await getJson(`https://www.drupal.org/api-d7/node/${nid}.json`, o);
  if (!node || node.type !== 'project_issue') { out.missing.issue = `issue ${nid} was not found on drupal.org`; return out; }
  if (!String(node.url || '').includes('/project/drupal/')) throw new Error(`#${nid} is not a Drupal core issue (${node.url}); only core issues are supported`);

  const comments = []; let pagesFetched = 0, lastPageFull = false;
  for (let p = 0; p < MAX_COMMENT_PAGES; p++) {
    const page = await getJson(`https://www.drupal.org/api-d7/comment.json?node=${nid}&limit=${PAGE_SIZE}&page=${p}`, o);
    const list = (page && page.list) || [];
    comments.push(...list); pagesFetched++; lastPageFull = list.length === PAGE_SIZE;
    if (list.length < PAGE_SIZE) break;
  }
  // Reaching the page limit with a full last page means there may be more comments: that is said in the text, not left to the count.
  const commentLimit = { pages: pagesFetched, pageSize: PAGE_SIZE, maxPages: MAX_COMMENT_PAGES, fetched: comments.length, capped: pagesFetched === MAX_COMMENT_PAGES && lastPageFull };
  comments.sort((a, b) => Number(a.cid) - Number(b.cid));
  const numberOf = new Map(comments.map((c, i) => [String(c.cid), i + 1]));

  const files = [], filesTotal = (node.field_issue_files || []).length;
  for (const f of (node.field_issue_files || []).slice(0, MAX_FILES)) {
    const id = f.file && f.file.id; if (!id) continue;
    try { const j = await getJson(`https://www.drupal.org/api-d7/file/${id}.json`, o); if (j) files.push({ name: j.name, size: j.size, cid: f.file.cid }); } catch { /* an attachment we cannot describe is skipped */ }
  }

  const fileLimit = { total: filesTotal, listed: files.length, max: MAX_FILES, capped: filesTotal > MAX_FILES };
  const limitNotes = [
    ...(commentLimit.capped ? [`LIMIT: only the first ${commentLimit.fetched} comments were fetched (${commentLimit.maxPages} pages of ${commentLimit.pageSize}); the issue may have more, and the last comments here may not be the latest.`] : []),
    ...(fileLimit.capped ? [`LIMIT: ${fileLimit.total} attachments exist and ${fileLimit.listed} are listed (the limit is ${fileLimit.max}).`] : []),
    ...(files.length < Math.min(filesTotal, MAX_FILES) ? [`LIMIT: ${Math.min(filesTotal, MAX_FILES) - files.length} attachment(s) could not be described and are not listed.`] : []),
  ];
  const lines = [
    `ISSUE #${nid}: ${node.title}`, `URL: ${out.url}`,
    `Status: ${label(STATUS, node.field_issue_status)} | Priority: ${label(PRIORITY, node.field_issue_priority)} | Category: ${label(CATEGORY, node.field_issue_category)} | Component: ${node.field_issue_component || 'unknown'} | Version: ${node.field_issue_version || 'unknown'}`,
    `Created: ${day(node.created)} | Last updated: ${day(node.changed)} | Comments: ${comments.length}`, ...limitNotes,
    `Source: the drupal.org API, fetched ${now.toISOString().slice(0, 10)}. Status, tag and metadata change notes that the web page shows inside comments are not included; comment numbers are counted in order and may differ from the page if comments were removed.`,
    '', '--- ISSUE SUMMARY (written by the reporter; it may have been edited after the comments) ---', htmlToText(node.body && node.body.value) || '(empty)', '',
    '--- ATTACHMENTS ---', ...(files.length ? files.map((f) => `- ${f.name} (${kb(f.size)}), added in comment #${numberOf.get(String(f.cid)) ?? '?'}`) : ['(none listed)']), '', '--- COMMENTS ---',
  ];
  for (const c of comments) {
    const n = numberOf.get(String(c.cid));
    lines.push('', `#${n} ${c.name || 'unknown'}, ${day(c.created)} (comment id ${c.cid})`, htmlToText(c.comment_body && c.comment_body.value) || '(no text)');
  }
  log('Looking up related, parent, child and mentioned issues ...');
  const rel = await gatherRelated(nid, node, comments.map((c) => ({ n: numberOf.get(String(c.cid)), html: c.comment_body && c.comment_body.value })), o);
  lines.push(...relatedText(rel), ...rel.notes.filter((x) => x.startsWith('LIMIT')));
  out.notes.push(...rel.notes);
  out.issueText = neutralize(lines.join('\n'));
  // The same facts as data, for scripts/issue-intake.mjs (nothing here is shortened; the prompt text above is what the chat gets).
  out.structured = { fetchedAt: now.toISOString(), url: out.url, node: { title: node.title, status: node.field_issue_status ?? null, priority: node.field_issue_priority ?? null, category: node.field_issue_category ?? null,
    component: node.field_issue_component || null, version: node.field_issue_version || null, created: Number(node.created) || null, changed: Number(node.changed) || null, summary: htmlToText(node.body && node.body.value) },
    comments: comments.map((c) => ({ n: numberOf.get(String(c.cid)), cid: String(c.cid), author: c.name || 'unknown', created: Number(c.created) || null, text: htmlToText(c.comment_body && c.comment_body.value) })),
    files: files.map((f) => ({ name: f.name, size: Number(f.size) || null, comment: numberOf.get(String(f.cid)) ?? null })), mr: null, diff: null,
    related: rel.items, threads: null, limits: { comments: commentLimit, attachments: fileLimit, diff: null, related: rel.limits, threads: null } };

  // the issue fork's branch and its merge request
  log('Looking for the issue fork branch and merge request on git.drupalcode.org ...');
  let found = []; const heads = {};
  if (mrOverride) {
    const m = await getJson(`https://git.drupalcode.org/api/v4/projects/project%2Fdrupal/merge_requests/${mrOverride}`, o);
    if (m) found = [m]; else out.notes.push(`Merge request !${mrOverride} was not found in project/drupal.`);
  } else {
    const branches = (await getJson(`https://git.drupalcode.org/api/v4/projects/issue%2Fdrupal-${nid}/repository/branches?search=${nid}`, o)) || [];
    for (const b of branches.filter((x) => x.name && x.name.startsWith(`${nid}-`))) {
      heads[b.name] = (b.commit && b.commit.id) || null;
      const list = (await getJson(`https://git.drupalcode.org/api/v4/projects/project%2Fdrupal/merge_requests?source_branch=${encodeURIComponent(b.name)}&scope=all&state=all`, o)) || [];
      found.push(...list);
    }
  }
  if (!found.length) out.missing.mr = mrOverride ? `merge request !${mrOverride} was not found` : `no merge request was found for a branch named ${nid}-... in the issue fork (patch-only issues need a fork branch for the lab)`;
  else {
    found.sort((a, b) => (b.state === 'opened') - (a.state === 'opened') || String(b.updated_at).localeCompare(String(a.updated_at)));
    const m = found[0];
    out.mr = { iid: String(m.iid), state: m.state, branch: m.source_branch, target: m.target_branch, updated: String(m.updated_at).slice(0, 10), url: `https://git.drupalcode.org/project/drupal/-/merge_requests/${m.iid}` };
    out.structured.mr = { ...out.mr, updatedAt: String(m.updated_at), sha: m.sha || null, branchHead: heads[m.source_branch] || null };
    if (found.length > 1) out.notes.push(`More than one merge request matched; using !${m.iid}. Others: ${found.slice(1).map((x) => `!${x.iid} (${x.state}, ${x.source_branch})`).join(', ')}. Use --mr <number> to choose another.`);
    log(`Fetching the diff of merge request !${m.iid} ...`);
    const d = await getText(`${out.mr.url}.diff`, o);
    if (d.status !== 200 || !d.text.trim()) out.missing.diff = `the diff of !${m.iid} could not be fetched (HTTP ${d.status})`;
    else {
      let diff = d.text, truncated = false;
      out.structured.diff = { text: d.text }; out.structured.limits.diff = { servedBytes: Buffer.byteLength(d.text), cap: MAX_DIFF_BYTES, truncatedInPrompt: Buffer.byteLength(d.text) > MAX_DIFF_BYTES };
      if (Buffer.byteLength(diff) > MAX_DIFF_BYTES) { diff = Buffer.from(diff).subarray(0, MAX_DIFF_BYTES).toString('utf8'); truncated = true; out.notes.push(`The diff is larger than ${MAX_DIFF_BYTES / 1024} KB and was cut.`); }
      out.diff = neutralize(`Merge request !${m.iid} (${m.state}, last updated ${out.mr.updated}), source branch ${m.source_branch}, target branch ${m.target_branch}\n${out.mr.url}\n\n${diff}${truncated ? `\n[TRUNCATED at ${MAX_DIFF_BYTES / 1024} KB: the diff continues. Say in review.unverified that you saw only part of it.]` : ''}`);
    }
    // Review comments live on the merge requests, not in the issue: read them for every merge request found, closed ones included.
    log(`Reading the review threads of ${found.length} merge request(s) ...`);
    const t = await gatherThreads(found, o);
    out.structured.threads = t.threads; out.structured.limits.threads = t.limits; out.notes.push(...t.notes);
    out.issueText += `\n${neutralize([...threadsText(t), ...t.notes.filter((x) => x.startsWith('LIMIT'))].join('\n'))}`;
  }
  return out;
}

// Put the gathered text into the template's three inputs and say in the banner what is still missing.
export function composePrompt(template, example, g, { now = new Date(), catalogue = '', checks = '' } = {}) {
  const inputs = [g.url, g.issueText, g.diff];
  const lines = template.replace('{{CATALOGUE}}', () => catalogue).replace('{{CHECKS}}', () => checks).replace('{{EXAMPLE}}', () => example).split('\n'); const out = [];
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
