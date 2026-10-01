const fs = require('fs');
const path = require('path');
const https = require('https');

const ROOT = process.cwd();
const DATE = '2026-07-15';
const A11Y_TAG = '1101';
const OPEN_STATUSES = [1, 4, 8, 13, 14, 16, 18];
const STATUS_LABEL = {
  '1': 'active',
  '8': 'needs-work',
  '13': 'needs-review',
  '14': 'reviewed-and-tested-by-community',
  '16': 'postponed',
};

function get(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        let body = '';
        res.on('data', (c) => (body += c));
        res.on('end', () => resolve(body));
      })
      .on('error', reject);
  });
}

async function getWithRetry(url, retries = 3) {
  let lastError = null;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await get(url);
    } catch (error) {
      lastError = error;
      if (attempt < retries) {
        console.error(`  retry ${attempt}/${retries - 1} for ${url}`);
      }
    }
  }
  throw lastError;
}

async function fetchOpenA11yIssues() {
  const rows = [];
  for (const status of OPEN_STATUSES) {
    console.error(`Scanning status ${status}...`);
    for (let page = 0; page < 40; page++) {
      if (page > 0 && page % 5 === 0) {
        console.error(`  status ${status}, page ${page}`);
      }
      const url = `https://www.drupal.org/api-d7/node.json?type=project_issue&field_project=3060&field_issue_category=1&field_issue_status=${status}&page=${page}`;
      const body = await getWithRetry(url, 4);
      let json;
      try {
        json = JSON.parse(body);
      } catch {
        break;
      }
      const list = Array.isArray(json.list) ? json.list : [];
      if (!list.length) {
        break;
      }
      for (const item of list) {
        const tags = (item.taxonomy_vocabulary_9 || []).map((t) => String(t.id));
        if (!tags.includes(A11Y_TAG)) {
          continue;
        }
        rows.push({
          nid: String(item.nid),
          status: String(item.field_issue_status || status),
          title: item.title,
          url: item.url,
        });
      }
    }
  }

  const dedupMap = new Map();
  for (const row of rows) {
    dedupMap.set(row.nid, row);
  }
  return [...dedupMap.values()].sort((a, b) => Number(a.nid) - Number(b.nid));
}

function extractReviewedIssueIds() {
  const files = [
    'patches/ISSUE-QUEUE-COMMENTS-2026-07-13.md',
    'PATCH-EVALUATIONS.md',
    'PATCH-STATUS-SUMMARY.md',
    'PATCH-VALIDATION-FINDINGS.md',
    'ISSUE-DRAFTS-2026-07.md',
    'ISSUE-COMMENTS-QUICK-WINS-2026-07-13.md',
    'ISSUE-3046089.md',
    'ISSUE-3087389.md',
    'ISSUE-3155130.md',
  ];
  const ids = new Set();

  for (const rel of files) {
    const full = path.join(ROOT, rel);
    if (!fs.existsSync(full)) {
      continue;
    }
    const txt = fs.readFileSync(full, 'utf8');
    for (const m of txt.matchAll(/(?:Issue\s*#|\/issues\/)(\d{6,8})/g)) {
      ids.add(m[1]);
    }
    for (const m of txt.matchAll(/https:\/\/www\.drupal\.org\/i\/(\d{6,8})/g)) {
      ids.add(m[1]);
    }
  }

  return [...ids].sort((a, b) => Number(a) - Number(b));
}

function extractPatchInventory() {
  const dir = path.join(ROOT, 'patches');
  const files = fs
    .readdirSync(dir)
    .filter((f) => /^a11y-.*\.patch$/i.test(f))
    .sort();

  const all = [];
  for (const file of files) {
    const full = path.join(dir, file);
    const txt = fs.readFileSync(full, 'utf8');
    const issueFromFilename = (file.match(/issue-(\d{6,8})/i) || [])[1] || null;
    const issueFromPatchContent =
      (txt.match(/(?:Issue\s*#|\/issues\/|node\/)(\d{6,8})/) || [])[1] || null;
    const touched = [...txt.matchAll(/^\+\+\+ b\/(.+)$/gm)].map((m) => m[1]);

    all.push({
      file,
      issueFromFilename,
      issueFromPatchContent,
      issueId: issueFromFilename || issueFromPatchContent,
      linked: Boolean(issueFromFilename || issueFromPatchContent),
      touched,
    });
  }
  return all;
}

function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .filter((t) => t.length > 2)
    .filter((t) => !['drupal', 'a11y', 'issue', 'patch', 'core', 'themes', 'module', 'modules', 'system', 'default', 'admin', 'templates'].includes(t));
}

function suggestIssueMatches(unlinkedPatches, issues) {
  return unlinkedPatches.map((patch) => {
    const basis = [patch.file, ...patch.touched.map((t) => path.basename(t).replace(/\.[^.]+$/, ''))].join(' ');
    const keys = [...new Set(tokenize(basis))].slice(0, 12);

    const candidates = issues
      .map((issue) => {
        const title = issue.title.toLowerCase();
        let score = 0;
        for (const k of keys) {
          if (title.includes(k)) score += 1;
        }
        return { issue, score };
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score || Number(b.issue.nid) - Number(a.issue.nid))
      .slice(0, 3)
      .map((x) => ({
        nid: x.issue.nid,
        title: x.issue.title,
        status: x.issue.status,
        url: x.issue.url,
        score: x.score,
      }));

    return {
      ...patch,
      keys,
      candidates,
      recommendation: candidates.length ? 'associate-existing-issue' : 'create-new-issue',
    };
  });
}

function statusPriority(status) {
  const order = { '14': 1, '8': 2, '13': 3, '1': 4, '16': 5 };
  return order[status] || 99;
}

function chooseAction(issue, reviewedSet, linkedIssueSet) {
  if (linkedIssueSet.has(issue.nid)) return 'advance-with-patch';
  if (reviewedSet.has(issue.nid)) return 'advance-or-retest';
  return 'review-needed';
}

async function main() {
  const issues = await fetchOpenA11yIssues();
  const reviewedIssueIds = extractReviewedIssueIds();
  const reviewedSet = new Set(reviewedIssueIds);
  const patchInventory = extractPatchInventory();
  const linkedPatchIssues = new Set(patchInventory.filter((p) => p.issueId).map((p) => p.issueId));
  const unlinked = patchInventory.filter((p) => !p.linked);
  const proposals = suggestIssueMatches(unlinked, issues);

  const shortlist = issues
    .filter((i) => !reviewedSet.has(i.nid))
    .sort((a, b) => statusPriority(a.status) - statusPriority(b.status) || Number(b.nid) - Number(a.nid))
    .slice(0, 20);

  const triageRows = issues.map((issue) => ({
    ...issue,
    statusLabel: STATUS_LABEL[issue.status] || `status-${issue.status}`,
    reviewed: reviewedSet.has(issue.nid),
    patchLinked: linkedPatchIssues.has(issue.nid),
    action: chooseAction(issue, reviewedSet, linkedPatchIssues),
  }));

  const byStatus = {};
  for (const issue of issues) {
    byStatus[issue.status] = (byStatus[issue.status] || 0) + 1;
  }

  const outJson = {
    generatedAt: new Date().toISOString(),
    date: DATE,
    filters: {
      project: 3060,
      issueCategory: 1,
      accessibilityTag: A11Y_TAG,
      statuses: OPEN_STATUSES,
    },
    summary: {
      issueCount: issues.length,
      reviewedCount: reviewedIssueIds.length,
      linkedPatchCount: patchInventory.filter((p) => p.linked).length,
      unlinkedPatchCount: unlinked.length,
      byStatus,
    },
    shortlist,
    proposals,
    triageRows,
  };

  const jsonPath = path.join(ROOT, 'reports', `core-a11y-triage-${DATE}.json`);
  fs.mkdirSync(path.dirname(jsonPath), { recursive: true });
  fs.writeFileSync(jsonPath, JSON.stringify(outJson, null, 2));

  const lines = [];
  lines.push(`# Core Accessibility Triage (${DATE})`);
  lines.push('');
  lines.push(`Generated: ${outJson.generatedAt}`);
  lines.push('');
  lines.push('## Summary');
  lines.push('');
  lines.push(`- Open/active core accessibility issues in filter set: ${issues.length}`);
  lines.push(`- Locally reviewed issue IDs found in repo docs: ${reviewedIssueIds.length}`);
  lines.push(`- Accessibility patch files linked to issue IDs: ${patchInventory.filter((p) => p.linked).length}`);
  lines.push(`- Accessibility patch files without issue linkage: ${unlinked.length}`);
  lines.push(`- Status breakdown: ${Object.keys(byStatus).sort().map((s) => `${s}=${byStatus[s]}`).join(', ')}`);
  lines.push('');

  lines.push('## 1) Next 20 To Review (Core-only)');
  lines.push('');
  lines.push('| Issue | Status | Title | Action |');
  lines.push('|---|---:|---|---|');
  for (const row of shortlist) {
    lines.push(`| [#${row.nid}](${row.url}) | ${row.status} | ${row.title.replace(/\|/g, '\\|')} | review-needed |`);
  }
  lines.push('');

  lines.push('## 2) Patch Without Issue Association Proposals');
  lines.push('');
  lines.push('| Patch | Recommendation | Candidate 1 | Candidate 2 | Candidate 3 |');
  lines.push('|---|---|---|---|---|');
  for (const p of proposals) {
    const c = p.candidates;
    const fmt = (x) => (x ? `[#${x.nid}](${x.url}) (s:${x.status}, score:${x.score})` : '-');
    lines.push(`| ${p.file} | ${p.recommendation} | ${fmt(c[0])} | ${fmt(c[1])} | ${fmt(c[2])} |`);
  }
  lines.push('');

  lines.push('## 3) Full Triage Table (Core-only Inventory)');
  lines.push('');
  lines.push('| Issue | Status | Reviewed | Patch Linked | Action | Title |');
  lines.push('|---|---:|---:|---:|---|---|');
  for (const row of triageRows) {
    lines.push(`| [#${row.nid}](${row.url}) | ${row.status} | ${row.reviewed ? 'yes' : 'no'} | ${row.patchLinked ? 'yes' : 'no'} | ${row.action} | ${row.title.replace(/\|/g, '\\|')} |`);
  }
  lines.push('');

  lines.push('## Linked Patch Files');
  lines.push('');
  for (const p of patchInventory.filter((x) => x.linked)) {
    lines.push(`- ${p.file} -> #${p.issueId}`);
  }
  lines.push('');

  const mdPath = path.join(ROOT, 'reports', `core-a11y-triage-${DATE}.md`);
  fs.writeFileSync(mdPath, lines.join('\n'));

  console.log(JSON.stringify({ jsonPath, mdPath, issueCount: issues.length, shortlistCount: shortlist.length, unlinkedPatches: unlinked.length }, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
