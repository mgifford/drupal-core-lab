// Targeted repair of an issue pack (AI-usage, the brief's Phase 2): change the fields the validator complained about, not the whole file.
// The edit is a JSON Patch (RFC 6902) restricted to add, remove, replace and test, with the pack's hash as its base:
//   { "pack_edit_version": 1, "base": "<hash from the repair message>", "ops": [ { "op": "test", "path": "/variant/checks/0/probe", "value": "true" },
//                                                                              { "op": "replace", "path": "/variant/checks/0/probe", "value": "..." } ] }
// Nothing is applied unless: the base equals the hash of the pack as it is now (a stale edit is refused), every op is well formed and every `test`
// holds (RFC 6902: if one op fails none is applied), the result is valid YAML that reads back to exactly the same values, and the validator
// finds no error that the pack did not already have. The pack is not changed by this module; the caller writes the returned text atomically.
// Not string replacement: ops name a field by path, and an unknown op, a path that does not exist, or a name like __proto__ is refused.
// YAML comments are not kept (the pack is parsed and written again); every value is, which is what is checked.
import crypto from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';
import { validatePack, HINTS } from './pack-validate.mjs';

export const EDIT_VERSION = 1, MAX_OPS = 20, MAX_VALUE_BYTES = 24000, MAX_EDIT_BYTES = 80000;
const OPS = ['add', 'remove', 'replace', 'test'], FORBIDDEN = new Set(['__proto__', 'constructor', 'prototype']);
export const packHash = (text) => crypto.createHash('sha256').update(text).digest('hex').slice(0, 12);
const isObj = (x) => x && typeof x === 'object' && !Array.isArray(x);
const esc = (s) => String(s).replace(/~/g, '~0').replace(/\//g, '~1'), unesc = (s) => s.replace(/~1/g, '/').replace(/~0/g, '~');
export const toPointer = (tokens) => tokens.map((t) => `/${esc(t)}`).join('');
export const parsePointer = (p) => (typeof p === 'string' && p.startsWith('/') && p.length > 1 ? p.slice(1).split('/').map(unesc) : null);
const isIndex = (t) => /^(0|[1-9]\d{0,5})$/.test(t);

// The validator names a field like `variant.checks[0].probe` or `recipe.files.recipe.yml` (a key with a dot). Resolve it against the pack itself:
// the longest run of dotted words that is a key wins. Returns tokens, or null when nothing in the pack answers to it.
export function atToTokens(at, doc) {
  const parts = []; for (const m of String(at).matchAll(/\[(\d+)\]|([^.[\]]+)/g)) parts.push(m[1] !== undefined ? { index: m[1] } : { word: m[2] });
  const tokens = []; let node = doc;
  for (let i = 0; i < parts.length;) {
    if (parts[i].index !== undefined) { if (!Array.isArray(node) || Number(parts[i].index) >= node.length) return null; tokens.push(parts[i].index); node = node[Number(parts[i].index)]; i++; continue; }
    if (!isObj(node)) return null;
    let key = null, j = i, joined = '';
    for (; j < parts.length && parts[j].word !== undefined; j++) { joined = j === i ? parts[j].word : `${joined}.${parts[j].word}`; if (Object.hasOwn(node, joined)) key = { k: joined, next: j + 1 }; }
    if (!key) return tokens.length ? tokens : null;
    tokens.push(key.k); node = node[key.k]; i = key.next;
  }
  return tokens;
}
const walk = (doc, tokens) => { let n = doc; for (const t of tokens) { if (Array.isArray(n)) { if (!isIndex(t) || Number(t) >= n.length) return { ok: false }; n = n[Number(t)]; } else if (isObj(n) && Object.hasOwn(n, t)) n = n[t]; else return { ok: false }; } return { ok: true, value: n }; };

export function parseEdit(input, yaml) {
  const problems = []; let e = input;
  if (typeof input === 'string') {
    if (Buffer.byteLength(input) > MAX_EDIT_BYTES) return { edit: null, problems: [`the edit is larger than ${MAX_EDIT_BYTES} bytes`] };
    try { e = JSON.parse(input); } catch { try { e = yaml.load(input, { schema: yaml.CORE_SCHEMA }); } catch (err) { return { edit: null, problems: [`the edit is neither JSON nor YAML (${String(err.message).split('\n')[0]})`] }; } }
  }
  if (!isObj(e)) return { edit: null, problems: ['an edit is an object with pack_edit_version, base and ops'] };
  for (const k of Object.keys(e)) if (!['pack_edit_version', 'base', 'ops', 'note'].includes(k)) problems.push(`unknown field "${k}"`);
  if (e.pack_edit_version !== EDIT_VERSION) problems.push(`pack_edit_version must be ${EDIT_VERSION}`);
  if (typeof e.base !== 'string' || !/^[0-9a-f]{12}$/.test(e.base)) problems.push('base must be the 12-character pack hash from the repair message');
  if (!Array.isArray(e.ops) || !e.ops.length) problems.push('ops must be a list with at least one operation');
  else if (e.ops.length > MAX_OPS) problems.push(`at most ${MAX_OPS} operations in one edit`);
  else e.ops.forEach((op, i) => {
    const at = `ops[${i}]`;
    if (!isObj(op)) return void problems.push(`${at} must be an object`);
    for (const k of Object.keys(op)) if (!['op', 'path', 'value'].includes(k)) problems.push(`${at}: unknown field "${k}" (move, copy and from are not supported)`);
    if (!OPS.includes(op.op)) problems.push(`${at}: op must be one of ${OPS.join(', ')}, not "${op.op}"`);
    const tk = parsePointer(op.path);
    if (!tk) problems.push(`${at}: path must be a JSON Pointer such as /variant/checks/0/probe`);
    else {
      if (tk.some((t) => FORBIDDEN.has(t))) problems.push(`${at}: path may not name ${tk.find((t) => FORBIDDEN.has(t))}`);
      if (tk[0] === 'pack_version') problems.push(`${at}: pack_version is not editable`);
    }
    if (['add', 'replace', 'test'].includes(op.op) && !('value' in op)) problems.push(`${at}: ${op.op} needs a value`);
    if (op.op === 'remove' && 'value' in op) problems.push(`${at}: remove takes no value`);
    if ('value' in op && Buffer.byteLength(JSON.stringify(op.value) ?? '') > MAX_VALUE_BYTES) problems.push(`${at}: value is larger than ${MAX_VALUE_BYTES} bytes`);
  });
  return { edit: problems.length ? null : e, problems };
}

// RFC 6902 on a copy. Returns { ok, doc, touched } or { ok: false, problems }; the input is never changed.
export function applyOps(doc, ops) {
  const out = structuredClone(doc), touched = [];
  for (const [i, op] of ops.entries()) {
    const tk = parsePointer(op.path), last = tk[tk.length - 1], parent = walk(out, tk.slice(0, -1)), at = `ops[${i}] ${op.op} ${op.path}`;
    if (!parent.ok) return { ok: false, problems: [`${at}: the parent of that path does not exist in the pack`] };
    const p = parent.value, value = 'value' in op ? structuredClone(op.value) : undefined;
    if (op.op === 'test') { const t = walk(out, tk); if (!t.ok) return { ok: false, problems: [`${at}: test failed, nothing is at that path`] }; if (!isDeepStrictEqual(t.value, value)) return { ok: false, problems: [`${at}: test failed, the pack no longer holds the value the edit expected there`] }; continue; }
    if (Array.isArray(p)) {
      if (op.op === 'add') { if (last === '-') p.push(value); else if (isIndex(last) && Number(last) <= p.length) p.splice(Number(last), 0, value); else return { ok: false, problems: [`${at}: not a valid position in that list`] }; }
      else { if (!isIndex(last) || Number(last) >= p.length) return { ok: false, problems: [`${at}: there is no item ${last} in that list`] }; if (op.op === 'replace') p[Number(last)] = value; else p.splice(Number(last), 1); }
    } else if (isObj(p)) {
      if (op.op === 'add') p[last] = value;
      else { if (!Object.hasOwn(p, last)) return { ok: false, problems: [`${at}: there is no field "${last}" there`] }; if (op.op === 'replace') p[last] = value; else delete p[last]; }
    } else return { ok: false, problems: [`${at}: that path is inside a plain value, not a list or mapping`] };
    touched.push(op.path);
  }
  return { ok: true, doc: out, touched };
}

// Literal blocks for multi-line text, no folding of long lines, no aliases. The caller checks that it reads back to the same values.
export const dumpPack = (doc, yaml) => yaml.dump(doc, { lineWidth: -1, noRefs: true, schema: yaml.CORE_SCHEMA });

const key = (x) => `${x.at}|${x.msg}`;
// text: the pack as it is now. input: the edit (string or object). ctx: { yaml, requireValid }.
export function applyEdit(text, input, { yaml, requireValid = false } = {}) {
  const fail = (problems) => ({ ok: false, text: null, problems: [].concat(problems) });
  const { edit, problems } = parseEdit(input, yaml); if (!edit) return fail(problems);
  const now = packHash(text); if (edit.base !== now) return fail(`stale edit: it was made for pack ${edit.base} and the pack is now ${now}. Nothing was changed. Validate again to get a message for the current pack.`);
  let doc; try { doc = yaml.load(text, { schema: yaml.CORE_SCHEMA }); } catch (e) { return fail(`the pack is not valid YAML, so it cannot be edited field by field: ${String(e.message).split('\n')[0]}`); }
  if (!isObj(doc)) return fail('the pack is not a YAML mapping, so it cannot be edited field by field');
  const r = applyOps(doc, edit.ops); if (!r.ok) return fail(r.problems);
  const out = dumpPack(r.doc, yaml);
  let back; try { back = yaml.load(out, { schema: yaml.CORE_SCHEMA }); } catch (e) { return fail(`the edited pack could not be written as YAML (${String(e.message).split('\n')[0]}); nothing was changed`); }
  if (!isDeepStrictEqual(back, r.doc)) return fail('writing the edited pack as YAML would have changed a value; nothing was changed');
  const before = validatePack(text, { yaml }), after = validatePack(out, { yaml }), had = new Set([...before.errors, ...before.warnings].map(key)), had_e = new Set(before.errors.map(key));
  const introduced = after.errors.filter((x) => !had_e.has(key(x)));
  if (introduced.length) return { ...fail(`the edit would introduce ${introduced.length} validator error(s), so the pack was not changed:\n${introduced.map((x) => `  - ${x.at}: ${x.msg}`).join('\n')}`), before, after };
  if (requireValid && after.errors.length) return { ...fail(`the pack would still have ${after.errors.length} error(s), and --require-valid was given:\n${after.errors.map((x) => `  - ${x.at}: ${x.msg}`).join('\n')}`), before, after };
  return { ok: true, text: out, problems: [], touched: r.touched, before, after, hashBefore: now, hashAfter: packHash(out), fixed: [...before.errors, ...before.warnings].filter((x) => !new Set([...after.errors, ...after.warnings].map(key)).has(key(x))), newWarnings: after.warnings.filter((x) => !had.has(key(x))) };
}

// The message for the chat: what is wrong, where, what is there now, and the shape of the reply. Not the whole pack back.
const hintFor = (msg) => (HINTS.find(([re]) => re.test(msg)) || [])[1];
export function targetedRepairMessage({ errors = [], warnings = [] }, text, { yaml } = {}) {
  const items = [...errors.map((e) => ({ kind: 'error', ...e })), ...warnings.map((w) => ({ kind: 'warning', ...w }))];
  if (!items.length) return '';
  let doc = null; try { doc = yaml.load(text, { schema: yaml.CORE_SCHEMA }); } catch { /* handled below */ }
  const readable = isObj(doc);
  const L = [`Your issue pack ${errors.length ? 'did not pass the validator' : 'passed the validator, with warnings'}. Do NOT send the pack again. Reply with ONLY a pack edit (JSON) that fixes these, and change nothing else. The pack is identified by this hash: ${packHash(text)}`, ''];
  items.forEach((it, i) => {
    const tk = readable ? atToTokens(it.at, doc) : null, cur = tk ? walk(doc, tk) : { ok: false };
    L.push(`${i + 1}. [${it.kind}] ${it.at}: ${it.msg}`);
    if (tk) L.push(`   path: ${toPointer(tk)}${cur.ok ? `\n   now: ${JSON.stringify(cur.value).slice(0, 300)}${JSON.stringify(cur.value).length > 300 ? ' ...' : ''}` : ''}`);
    const h = hintFor(it.msg); if (h) L.push(`   What to do: ${h}`);
  });
  L.push('', 'Reply format, for example:', JSON.stringify({ pack_edit_version: EDIT_VERSION, base: packHash(text), ops: [{ op: 'test', path: '/path/from/above', value: '<the "now" value>' }, { op: 'replace', path: '/path/from/above', value: '<the new value>' }] }),
    'op is replace, add, remove or test. Put a test first with the "now" value, so the edit fails instead of overwriting something that changed. A new list item uses the path of the list plus "/-". Use only blocks and check templates from the prompt you were given.');
  return L.join('\n');
}

// Facts the fetch already knows must not depend on a model's typing. Compares pack.issue with the intake snapshot (tools/compare/issue-intake.mjs)
// and returns an edit that sets title, url, fork_branch and merge_request where they differ; null when they agree. A different issue number is a problem, not an edit.
export function issueSyncEdit(text, snap, { yaml }) {
  let doc; try { doc = yaml.load(text, { schema: yaml.CORE_SCHEMA }); } catch { return { edit: null, problems: ['the pack is not valid YAML'] }; }
  if (!isObj(doc) || !isObj(doc.issue)) return { edit: null, problems: ['the pack has no issue block'] };
  if (String(doc.issue.nid) !== String(snap.nid)) return { edit: null, problems: [`the pack is for issue ${doc.issue.nid} and the snapshot is for ${snap.nid}; nothing to sync`] };
  const want = { title: snap.node.title, url: snap.url, ...(snap.mr ? { fork_branch: snap.mr.branch, merge_request: `!${snap.mr.iid}` } : {}) }, ops = [];
  for (const [k, v] of Object.entries(want)) {
    if (doc.issue[k] === v) continue;
    if (k in doc.issue) ops.push({ op: 'test', path: `/issue/${k}`, value: doc.issue[k] }, { op: 'replace', path: `/issue/${k}`, value: v }); else ops.push({ op: 'add', path: `/issue/${k}`, value: v });
  }
  return { edit: ops.length ? { pack_edit_version: EDIT_VERSION, base: packHash(text), ops } : null, problems: [] };
}
