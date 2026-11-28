// A small, local claim of what one agent session intends to touch. It is advisory: the check names files outside the
// claim, it does not stop a commit and it never resets, stashes or deletes anything. See docs/WORKSPACE-HYGIENE.md.
import fs from 'node:fs';
import path from 'node:path';

export const sessionId = (env = process.env) => String(env.DSH_SESSION_ID || 'local').replace(/[^A-Za-z0-9_.-]/g, '_');
export const scopePath = (root, session = sessionId()) => path.join(root, '.lab-cache/agent-scopes', `${session}.json`);
export const indexPath = (root, session = sessionId()) => path.join(root, '.lab-cache/agent-indexes', `${session}.index`);

export function normalizeScopePath(p) {
  const s = String(p || '').trim().replace(/^\.\//, '').replace(/[/\\]+$/, '');
  if (!s || s.startsWith('/') || s.split(/[/\\]/).includes('..')) throw new Error(`scope path must be a relative path inside the checkout: ${JSON.stringify(p)}`);
  return s;
}

export function makeScope({ issue = null, paths = [], session = sessionId(), branch = null, head = null, now = new Date().toISOString() } = {}) {
  return { session, issue: issue == null ? null : String(issue), paths: [...new Set(paths.map(normalizeScopePath))].sort(), branch, head, started: now, updated: now };
}

export const isAllowed = (scope, file) => (scope.paths || []).some((p) => file === p || file.startsWith(`${p}/`));
export const outsidePaths = (scope, files) => [...new Set(files)].filter((f) => !isAllowed(scope, f)).sort();

export function readScope(root, session = sessionId()) {
  try { return JSON.parse(fs.readFileSync(scopePath(root, session), 'utf8')); } catch { return null; }
}
export function writeScope(root, scope) {
  const target = scopePath(root, scope.session);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, `${JSON.stringify({ ...scope, updated: new Date().toISOString() }, null, 2)}\n`);
  return target;
}
export function removeScope(root, session = sessionId()) { fs.rmSync(scopePath(root, session), { force: true }); }

// Parse `git status --porcelain -z`; renames/copies carry the old path as a second NUL field, and that path also matters.
export function parseStatusZ(text) {
  const out = [];
  const parts = String(text || '').split('\0').filter(Boolean);
  for (let i = 0; i < parts.length; i++) {
    const rec = parts[i];
    if (rec.length < 4) continue;
    const code = rec.slice(0, 2);
    const file = rec.slice(3);
    out.push(file);
    if (/[RC]/.test(code[0]) && parts[i + 1]) { out.push(parts[i + 1]); i++; }
  }
  return out;
}
