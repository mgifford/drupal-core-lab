import { createHash } from 'node:crypto';

// Sanitisation used before anything leaves the lab or is written to a committed report.
//
// The rule is deny-by-default: only the fields named here are copied from Drupal or the browser. We never publish raw
// request headers, cookies, session identifiers, request bodies, SQL or query arguments. URL query *values* are dropped;
// only the parameter names are kept, because they describe the Drupal request shape (for example _wrapper_format).
const SECRET_HEADER = /(authorization|cookie|set-cookie|proxy-authorization|x-csrf|token|session|api[-_]?key|secret|password)/i;
const SECRET_ATTRIBUTE = /(authorization|cookie|token|session|secret|password|passwd|api[-_]?key|private|credential)/i;

export const SAFE_HEADERS = new Set([
  'content-type', 'content-length', 'cache-control', 'location', 'vary', 'x-drupal-cache', 'x-drupal-dynamic-cache',
  'x-core-lab-trace-id', 'x-core-lab-root-span-id', 'x-core-lab-request-id', 'x-core-lab-observability',
  'x-core-lab-export', 'x-core-lab-db-queries', 'x-core-lab-server-ms', 'x-core-lab-span-count',
]);

export const SAFE_ATTRIBUTES = new Set([
  'http.request.method', 'http.response.status_code', 'url.path', 'url.scheme', 'url.query.parameter_count',
  'http.route', 'drupal.route', 'drupal.controller', 'drupal.version', 'drupal.site_path', 'drupal.run.id',
  'drupal.side', 'drupal.environment.id', 'drupal.action.id', 'drupal.request.id', 'drupal.user.authenticated',
  'drupal.db.query_count', 'drupal.db.query_duration_ms', 'drupal.db.cache_query_count', 'drupal.db.cache_write_count',
  'drupal.db.targets', 'drupal.cache.database_queries', 'drupal.cache.database_writes', 'drupal.span.count',
  'core_lab.run.id', 'core_lab.side', 'core_lab.environment.id', 'core_lab.action.id', 'core_lab.request.id',
  'core_lab.collector', 'service.name', 'deployment.environment.name',
]);

// Redact token-shaped path segments, including Drupal's one-time login path (/user/reset/<uid>/<time>/<token>/login).
// Query values are handled separately and are never kept.
export function sanitisePath(pathname) {
  let p = String(pathname || '/');
  p = p.replace(/\/user\/reset\/\d+\/\d+\/[^/]+\/login/g, '/user/reset/[uid]/[timestamp]/[token]/login');
  return p.split('/').map((seg) => {
    if (!seg) return seg;
    if (/^\d{10,}$/.test(seg)) return '[redacted]';
    if (/^(?=.*[A-Z])(?=.*[0-9])[A-Za-z0-9_-]{24,}$/.test(seg)) return '[redacted]';
    return seg;
  }).join('/');
}

// Keep the method, path and query parameter names. Drop the origin, query values, fragments and any userinfo.
export function sanitiseUrl(input) {
  let u;
  try { u = new URL(String(input), 'http://core-lab.invalid'); } catch { return '/'; }
  const keys = [...new Set([...u.searchParams.keys()])].filter((k) => /^[A-Za-z0-9_.\-\[\]]+$/.test(k)).sort();
  return sanitisePath(u.pathname) + (keys.length ? `?${keys.join('&')}` : '');
}

// Only a known-safe subset of response headers. Everything else is omitted rather than guessed at.
export function sanitiseHeaders(headers = {}) {
  const out = {};
  for (const [k, v] of Object.entries(headers || {})) {
    const key = k.toLowerCase();
    if (!SAFE_HEADERS.has(key) || SECRET_HEADER.test(key)) continue;
    out[key] = String(Array.isArray(v) ? v.join(', ') : v).replace(/[\r\n\t]/g, ' ').slice(0, 300);
  }
  return out;
}

// Span attribute allowlist. Unknown attributes are dropped: instrumentation can add new ones at any time, and a
// denylist would silently leak the next one.
export function sanitiseAttributes(attributes = {}) {
  const out = {};
  for (const [k, v] of Object.entries(attributes || {})) {
    if (!SAFE_ATTRIBUTES.has(k) || SECRET_ATTRIBUTE.test(k)) continue;
    if (['string', 'number', 'boolean'].includes(typeof v)) out[k] = typeof v === 'string' ? v.slice(0, 300) : v;
    else if (Array.isArray(v)) out[k] = v.filter((x) => ['string', 'number', 'boolean'].includes(typeof x)).slice(0, 50);
  }
  return out;
}

// Table names from a SQL statement, without the statement text or its arguments. Used only to count cache-table
// activity and to list the tables a request touched. SQL parsing is best-effort; unknown shapes return [].
export function tablesOf(sql) {
  const text = String(sql || '');
  const names = new Set();
  for (const m of text.matchAll(/\b(?:FROM|JOIN|INTO|UPDATE)\s+[{`"[]?([A-Za-z0-9_]+)[}`"\]]?/gi)) {
    if (m[1] && !/^(SELECT|WHERE|SET|VALUES|ON|AS)$/i.test(m[1])) names.add(m[1]);
  }
  return [...names].sort();
}

export const isCacheTable = (table) => /^cache(_|$)/.test(table) || ['cachetags', 'semaphore', 'key_value'].includes(table);
export const isCacheWrite = (sql) => /^\s*(INSERT|UPDATE|DELETE|REPLACE|TRUNCATE|CREATE|DROP|ALTER)\b/i.test(String(sql || ''));

// A run id is used in file names and as a header value. Keep it to characters that are safe in both.
export function safeId(value, fallback = 'unknown') {
  const s = String(value ?? '').trim().replace(/\.{2,}/g, '-').replace(/[^A-Za-z0-9._-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').replace(/^\.+/, '');
  return s.slice(0, 120) || fallback;
}

// Length-limited plain text for exception descriptions and notes.
export function safeText(value, max = 300) {
  return String(value ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
}

// Strip anything that looks like a credential from a free-form error string before it is shown in a report.
export function redactSecrets(text) {
  return safeText(String(text ?? '')
    .replace(/((?:authorization|cookie|set-cookie|token|session|password|api[-_]?key)\s*[:=]\s*)(?:Bearer\s+)?[^\s,;]+/gi, '$1[redacted]')
    .replace(/([?&](?:token|key|hash|pass|password|session)=)[^&\s]+/gi, '$1[redacted]'), 600);
}

export function sha256(buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}
