// Dependency-free normalization for reports/issues/<nid>/status.json. Kept separate from schema validation so the viewer
// and other small readers do not pull in the observability validator (or need its directory beside them).
export const SCHEMA_VERSION = 1;

const iidFromUrl = (url) => { const m = String(url || '').match(/merge_requests\/(\d+)/); return m ? Number(m[1]) : null; };

export function normalizeMr(mr) {
  if (mr == null) return null;
  if (typeof mr === 'string') {
    return { iid: iidFromUrl(mr), state: null, branch: null, sha: null, updated: null, draft: false, url: mr };
  }
  if (typeof mr !== 'object' || Array.isArray(mr)) return null;
  const iid = Number(mr.iid);
  return {
    ...mr,
    iid: Number.isInteger(iid) && iid > 0 ? iid : iidFromUrl(mr.url),
    state: mr.state ?? null,
    branch: mr.branch ?? null,
    sha: mr.sha == null ? null : String(mr.sha),
    updated: mr.updated ?? null,
    draft: mr.draft ?? null,
  };
}

export function normalizeStatus(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return raw;
  const s = { ...raw };
  s.nid = s.nid == null ? s.nid : String(s.nid);
  const comments = s.comments == null || s.comments === '' ? null : Number(s.comments);
  s.comments = Number.isInteger(comments) && comments >= 0 ? comments : null;
  const code = s.statusCode == null || s.statusCode === '' ? null : Number(s.statusCode);
  s.statusCode = Number.isInteger(code) ? code : null;
  for (const key of ['changed', 'since', 'priority', 'category', 'component', 'version']) if (s[key] === undefined) s[key] = null;
  s.tags = Array.isArray(s.tags) ? s.tags.filter((x) => typeof x === 'string') : [];
  s.latest = Array.isArray(s.latest) ? s.latest : [];
  s.mr = normalizeMr(s.mr);
  s.otherMrs = Array.isArray(s.otherMrs) ? s.otherMrs.map(normalizeMr).filter(Boolean) : [];
  s.schemaVersion = SCHEMA_VERSION;
  return s;
}
