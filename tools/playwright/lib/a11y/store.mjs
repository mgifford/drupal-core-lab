// Where a checkpoint's evidence lives, and how the session index stays honest about it.
//
// One session per issue (or per local fixture run) per MCP server process. Every checkpoint is written atomically as
// JSON; raw engine output and screenshots go next to it; the session index is rewritten after each checkpoint so a
// reader always sees a consistent set. Reports are generated from these files, not from anything held in memory.
import fs from 'node:fs';
import path from 'node:path';
import { labRoot, reportsDir, variants as resolveAllVariants } from '../../../compare/lib.mjs';

export const SESSION_SCHEMA = 'lab-a11y-session/1';

const stamp = (d = new Date()) => d.toISOString().replace(/[:.]/g, '-').replace('T', 'T').slice(0, 19);
const safeName = (s) => String(s || 'session').replace(/[^A-Za-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'session';
const seq = (n) => String(n).padStart(3, '0');

function writeAtomic(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = `${file}.tmp-${process.pid}-${Math.random().toString(36).slice(2, 8)}`;
  fs.writeFileSync(tmp, data);
  fs.renameSync(tmp, file);
}

function dirSize(dir) {
  let total = 0;
  if (!fs.existsSync(dir)) return 0;
  const walk = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.isFile()) total += fs.statSync(p).size;
    }
  };
  walk(dir);
  return total;
}

// The session override a person (or an agent) can create before exploring:
//   node tools/a11y-mcp/cli.mjs session --variant 3534229-pinned --scenario ckeditor-toolbar --out reports/issues/3534229/checkpoints/run
export const SESSION_FILE = path.join(labRoot, '.lab-cache', 'a11y-mcp', 'session.json');
export function readSessionHint() {
  try {
    const data = JSON.parse(fs.readFileSync(SESSION_FILE, 'utf8'));
    if (!data || typeof data !== 'object') return null;
    return {
      variant: typeof data.variant === 'string' ? data.variant : null,
      scenario: typeof data.scenario === 'string' ? data.scenario : null,
      label: typeof data.label === 'string' ? data.label : null,
      out: typeof data.out === 'string' ? data.out : null,
      profile: typeof data.profile === 'string' ? data.profile : null,
      issue: data.issue != null ? String(data.issue) : null,
    };
  } catch { return null; }
}

export function writeSessionHint(hint) {
  const file = SESSION_FILE;
  writeAtomic(file, JSON.stringify({ ...hint, written: new Date().toISOString() }, null, 2) + '\n');
  return file;
}

// Where a session's evidence goes. A Lab variant's session goes into the issue's report folder (committed evidence);
// a local fixture session goes into .lab-cache (never committed). `out` overrides both, but must stay inside the lab.
export function sessionDirFor({ context, hint, now = new Date() }) {
  if (hint?.out) {
    const resolved = path.resolve(labRoot, hint.out);
    if (!resolved.startsWith(labRoot + path.sep)) throw new Error(`session out must be inside the Lab checkout: ${hint.out}`);
    return resolved;
  }
  const label = safeName(hint?.label || hint?.scenario || 'session');
  // Two sessions opened in the same second (two test fixtures, or two MCP processes) must not share a folder and
  // overwrite each other: a short random suffix keeps them apart.
  const unique = Math.random().toString(36).slice(2, 6);
  const name = `${stamp(now)}-${label}-${unique}`;
  if (context.issue) {
    const variant = resolveAllVariants().find((v) => v.slug === context.variant);
    const base = path.join(labRoot, variant ? reportsDir(variant) : path.join('reports/issues', String(context.issue)), 'checkpoints');
    return path.join(base, name);
  }
  return path.join(labRoot, '.lab-cache', 'a11y-mcp', name);
}

// The session key: an issue number, or the fixture origin, so two different sides of one issue share one session and a
// fixture run does not mix with a Drupal run.
export function sessionKeyFor(context) {
  if (context.issue) return `issue:${context.issue}`;
  if (context.kind === 'local-fixture') return `fixture:${context.page?.origin || 'loopback'}`;
  return `env:${context.env || 'unknown'}`;
}

export class SessionStore {
  constructor({ context, hint = null, mcp = null, profile = 'quick', now = new Date() }) {
    this.dir = sessionDirFor({ context, hint, now });
    this.mcp = mcp;
    this.profile = profile;
    this.session = {
      schema: SESSION_SCHEMA,
      id: path.basename(this.dir),
      started: now.toISOString(),
      updated: now.toISOString(),
      issue: context.issue || null,
      variants: context.variant ? [context.variant] : [],
      kinds: [context.kind],
      tool: { name: 'playwright', integration: 'playwright-mcp init-page + approved in-page helper; axe-core runs on the live page' },
      mcp: mcp || null,
      configuredProfile: profile,
      pages: [],
      checkpoints: [],
      findings: [],
      manual: [],
      resources: { checkpoints: 0, engineRuns: 0, scanMs: 0, evidenceBytes: 0, screenshots: 0, browserLaunches: 0, energy: null, energyNote: 'not measured; the lab does not estimate energy use' },
      limits: [
        'Chromium only (the MCP browser); other engines/capabilities are reported per checkpoint, not assumed.',
        'Automated engines see a minority of real barriers; a clean scan is not an accessibility pass.',
        'No real screen reader, no person, was involved unless a manual step says so.',
      ],
    };
    fs.mkdirSync(this.dir, { recursive: true });
    this.persist();
  }

  key() { return path.basename(this.dir); }

  addPage(entry) {
    const exists = this.session.pages.find((p) => p.path === entry.path && p.origin === entry.origin && p.contextId === entry.contextId);
    if (!exists) this.session.pages.push({ ...entry, when: new Date().toISOString() });
    else exists.lastSeen = new Date().toISOString();
  }

  noteVariant(context) {
    if (context.variant && !this.session.variants.includes(context.variant)) this.session.variants.push(context.variant);
    if (context.kind && !this.session.kinds.includes(context.kind)) this.session.kinds.push(context.kind);
    if (context.issue && this.session.issue !== context.issue) {
      if (!this.session.issue) this.session.issue = context.issue;
      else this.session.limits.push(`This session also saw issue ${context.issue}; the session's declared issue is ${this.session.issue}.`);
    }
  }

  checkpointPaths(record) {
    const base = `${seq(record.sequence)}-${safeName(record.id)}`;
    return {
      json: path.join(this.dir, 'checkpoints', `${base}.json`),
      evidenceDir: path.join(this.dir, 'evidence', base),
      relative: path.relative(labRoot, path.join(this.dir, 'checkpoints', `${base}.json`)),
      relativeEvidence: path.relative(labRoot, path.join(this.dir, 'evidence', base)),
    };
  }

  // Write one checkpoint: raw evidence first (so a reference in the record always resolves), then the record, then the
  // index. Returns the record with its evidence paths filled in and the session-relative references set.
  saveCheckpoint(record) {
    const paths = this.checkpointPaths(record);
    fs.mkdirSync(paths.evidenceDir, { recursive: true });
    record.evidence = { ...record.evidence, dir: paths.relativeEvidence, summary: path.relative(labRoot, path.join(this.dir, 'SUMMARY.md')), report: path.relative(labRoot, path.join(this.dir, 'report.html')) };
    for (const f of record.findings || []) if (f.evidenceRef) f.evidenceRef = String(f.evidenceRef);
    record.resources = { ...record.resources, evidenceBytes: dirSize(paths.evidenceDir) };
    writeAtomic(paths.json, JSON.stringify(record, null, 2) + '\n');

    const entry = {
      id: record.id,
      sequence: record.sequence,
      label: record.label,
      status: record.status,
      side: record.side,
      when: record.when,
      page: record.page?.path || null,
      variant: record.variant,
      scriptedOrExploratory: record.provenance?.source,
      engines: (record.evidence?.engines || []).map((e) => ({ engine: e.engine, version: e.version, status: e.status, findings: e.counts?.distinct ?? 0 })),
      findings: record.findings?.length || 0,
      manual: (record.manual || []).filter((m) => m.requiresPerson).length,
      evidenceDir: paths.relativeEvidence,
      file: paths.relative,
    };
    this.session.checkpoints = this.session.checkpoints.filter((c) => c.sequence !== record.sequence);
    this.session.checkpoints.push(entry);
    this.session.checkpoints.sort((a, b) => a.sequence - b.sequence);
    this.session.manual = this.session.manual.filter((m) => m.checkpointId !== record.id);
    for (const m of record.manual || []) this.session.manual.push({ ...m, checkpointId: record.id, side: record.side, when: record.when });
    this.session.resources.checkpoints = this.session.checkpoints.length;
    this.session.resources.screenshots += (record.evidence?.screenshots || []).length;
    this.session.resources.evidenceBytes = dirSize(this.dir);
    this.session.updated = new Date().toISOString();
    this.mergeFindings(record);
    this.persist();
    return record;
  }

  // The session's deduplicated findings: one entry per fingerprint, with every checkpoint it was observed at.
  mergeFindings(record) {
    const byFp = new Map(this.session.findings.map((f) => [f.fingerprint, f]));
    for (const f of record.findings || []) {
      const existing = byFp.get(f.fingerprint);
      const observation = { checkpointId: record.id, sequence: record.sequence, side: record.side, when: record.when, status: record.status, evidenceRef: f.evidenceRef || null };
      if (!existing) {
        byFp.set(f.fingerprint, { ...f, observations: [observation] });
        continue;
      }
      if (!existing.observations.some((o) => o.checkpointId === observation.checkpointId)) existing.observations.push(observation);
      if (existing.reviewStatus === 'unreviewed' && f.reviewStatus === 'needs-review') existing.reviewStatus = 'needs-review';
    }
    this.session.findings = [...byFp.values()];
  }

  addResource({ engineRuns = 0, scanMs = 0 }) {
    this.session.resources.engineRuns += engineRuns;
    this.session.resources.scanMs += scanMs;
    this.session.updated = new Date().toISOString();
  }

  persist() {
    writeAtomic(path.join(this.dir, 'session.json'), JSON.stringify(this.session, null, 2) + '\n');
  }

  // Regenerate the human-readable views from the canonical JSON. Cheap enough to do after every checkpoint.
  async refreshReports() {
    try {
      const { renderSession } = await import('./report.mjs');
      const { markdown, html } = renderSession(this.session);
      writeAtomic(path.join(this.dir, 'SUMMARY.md'), markdown);
      writeAtomic(path.join(this.dir, 'report.html'), html);
    } catch (error) {
      // A report failure must not lose evidence; it is recorded in the session instead.
      this.session.limits.push(`Report generation failed: ${String(error.message).split('\n')[0].slice(0, 200)}`);
      this.persist();
    }
  }
}

// Open the session for a context, reusing an existing one when the same issue/fixture is already being explored in this
// process. `registry` is a Map the caller owns (one per MCP server process).
export function sessionFor(registry, { context, hint = null, mcp = null, profile = 'quick' }) {
  const key = sessionKeyFor(context);
  if (registry.has(key)) {
    const store = registry.get(key);
    store.noteVariant(context);
    return store;
  }
  const store = new SessionStore({ context, hint, mcp, profile });
  registry.set(key, store);
  return store;
}

export { writeAtomic, dirSize, safeName, seq };
