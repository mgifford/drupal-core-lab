// Named handoffs between the stages of working on an issue (AI-usage, the brief's Phase 1).
// A handoff is what the next session needs and nothing more: a short summary, facts and open questions that each cite where they come from,
// and pointers to files that already hold the detail (REPRODUCE.md, FEEDBACK.md, a lint report, a run), not copies of them. When it is written,
// the tool records the hash of every source it cites (`based_on`). When a source changes, `check` says which handoffs no longer describe it.
import fs from 'node:fs';
import path from 'node:path';
import { sha8 } from './issue-intake.mjs';

export const STAGES = ['issue', 'sources', 'reproduction', 'patch', 'validation', 'feedback'];
export const MAX_BYTES = 4096;   // about 1,000 tokens; a longer one needs an `exception` that says why
const KEYS = ['stage', 'nid', 'written', 'by', 'summary', 'facts', 'open', 'pointers', 'exception'];
const SOURCE = /^(comment:\d{1,5}|source:(issue|comments|attachments|mr|diff)|file:[^\s]+)$/;

export const handoffFile = (labRoot, nid, stage) => path.join(labRoot, 'reports/issues', String(nid), 'handoffs', `${stage}.json`);

// ctx: { commentNs: Set of comment numbers in the snapshot, exists(path) }. Returns the problems found; an empty list means valid.
export function validateHandoff(h, ctx) {
  const p = [];
  if (!h || typeof h !== 'object' || Array.isArray(h)) return ['a handoff is a JSON object'];
  for (const k of Object.keys(h)) if (!KEYS.includes(k)) p.push(`unknown field "${k}" (allowed: ${KEYS.join(', ')}; based_on is added by the tool)`);
  if (!STAGES.includes(h.stage)) p.push(`stage must be one of ${STAGES.join(', ')}`);
  if (!/^\d{5,8}$/.test(String(h.nid || ''))) p.push('nid must be 5 to 8 digits');
  if (!['model', 'person', 'script'].includes(h.by)) p.push('by must be model, person or script');
  if (typeof h.summary !== 'string' || !h.summary.trim()) p.push('summary is required'); else if (h.summary.length > 1200) p.push(`summary is ${h.summary.length} characters (limit 1200)`);
  const items = (key) => {
    if (h[key] === undefined) return; if (!Array.isArray(h[key])) return void p.push(`${key} must be a list`);
    h[key].forEach((it, i) => {
      const at = `${key}[${i}]`;
      if (!it || typeof it.text !== 'string' || !it.text.trim()) return void p.push(`${at}: text is required`);
      if (it.text.length > 400) p.push(`${at}: text is ${it.text.length} characters (limit 400)`);
      for (const k of Object.keys(it)) if (!['text', 'sources'].includes(k)) p.push(`${at}: unknown field "${k}"`);
      if (!Array.isArray(it.sources) || !it.sources.length) return void p.push(`${at}: sources is required: a fact that cites nothing cannot be checked (use comment:<n>, source:<id> or file:<path>)`);
      for (const s of it.sources) {
        if (!SOURCE.test(s)) p.push(`${at}: "${s}" is not a source (comment:<n>, source:issue|comments|attachments|mr|diff, file:<path>)`);
        else if (s.startsWith('comment:') && !ctx.commentNs.has(Number(s.slice(8)))) p.push(`${at}: ${s} does not exist in the snapshot`);
        else if (s.startsWith('file:') && !ctx.exists(s.slice(5))) p.push(`${at}: ${s} does not exist`);
      }
    });
  };
  items('facts'); items('open');
  if (h.pointers !== undefined) { if (!Array.isArray(h.pointers)) p.push('pointers must be a list of repository paths'); else for (const x of h.pointers) if (typeof x !== 'string' || path.isAbsolute(x) || x.split('/').includes('..') || !ctx.exists(x)) p.push(`pointer "${x}" is not an existing path inside the repository`); }
  const size = Buffer.byteLength(JSON.stringify(h)); if (size > MAX_BYTES && !(typeof h.exception === 'string' && h.exception.trim())) p.push(`${size} bytes is over ${MAX_BYTES} (about 1,000 tokens); shorten it, point to files instead of copying them, or give an "exception" that says why it must be longer`);
  return p;
}

// Every source and pointer a handoff relies on, with the value it has now. snap may be null (no snapshot yet).
export function basedOn(h, snap, labRoot) {
  const out = {}, refs = new Set([...(h.facts || []), ...(h.open || [])].flatMap((x) => x.sources || []));
  for (const x of h.pointers || []) refs.add(`file:${x}`);
  for (const r of refs) {
    if (r.startsWith('comment:')) { const c = snap && snap.comments.find((x) => x.n === Number(r.slice(8))); out[r] = c ? `${c.cid}:${c.sha8}` : 'missing'; }
    else if (r.startsWith('source:')) { const s = snap && snap.sources.find((x) => x.id === r.slice(7)); out[r] = s ? s.sha8 : 'missing'; }
    else { const f = path.join(labRoot, r.slice(5)); out[r] = fs.existsSync(f) && fs.statSync(f).isFile() ? sha8(fs.readFileSync(f)) : 'missing'; }
  }
  return out;
}

// Atomic: the file is written to a temporary name and renamed, so a failed write leaves the previous handoff as it was.
export function writeHandoff(labRoot, h, snap) {
  const f = handoffFile(labRoot, h.nid, h.stage), body = { ...h, based_on: basedOn(h, snap, labRoot) };
  fs.mkdirSync(path.dirname(f), { recursive: true });
  const tmp = `${f}.${process.pid}.tmp`; fs.writeFileSync(tmp, `${JSON.stringify(body, null, 2)}\n`); fs.renameSync(tmp, f);
  return { file: f, bytes: Buffer.byteLength(JSON.stringify(body)), based_on: body.based_on };
}

export function readHandoffs(labRoot, nid) {
  const dir = path.join(labRoot, 'reports/issues', String(nid), 'handoffs'); if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => f.endsWith('.json')).map((f) => { try { return JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')); } catch { return { stage: path.basename(f, '.json'), unreadable: true }; } })
    .sort((a, b) => STAGES.indexOf(a.stage) - STAGES.indexOf(b.stage));
}

// For each handoff: fresh, or stale with the reasons (which source changed).
export function checkHandoffs(labRoot, nid, snap) {
  return readHandoffs(labRoot, nid).map((h) => {
    if (h.unreadable) return { stage: h.stage, status: 'unreadable', reasons: ['the file is not valid JSON'] };
    const now = basedOn(h, snap, labRoot), reasons = [];
    for (const [k, was] of Object.entries(h.based_on || {})) {
      const cur = now[k];
      if (cur === was) continue;
      if (cur === 'missing') reasons.push(`${k} no longer exists`);
      else if (k.startsWith('comment:') && was.split(':')[0] !== cur.split(':')[0]) reasons.push(`${k} is now a different comment (id ${cur.split(':')[0]}, was ${was.split(':')[0]})`);
      else reasons.push(`${k} changed (${was} -> ${cur})`);
    }
    if (!h.based_on) reasons.push('no record of what it was based on');
    return { stage: h.stage, status: reasons.length ? 'stale' : 'fresh', reasons, written: h.written, by: h.by };
  });
}
