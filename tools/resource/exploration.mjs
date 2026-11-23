// Deterministic, local-only code-exploration diagnostics. Targets (file paths, search patterns, code-map symbols) are
// normalised for comparison and are never published. The result is a diagnostic: a repeated lookup is not waste by
// itself, because a file may have changed, a test may have failed, or new evidence may have arrived.
import { classifyOperation } from './classify.mjs';

const EXPLORATION_TOOLS = new Set(['Read', 'Grep', 'Glob', 'Edit', 'Write', 'MultiEdit']);

const normalize = (p) => String(p || '').replace(/\\/g, '/').replace(/^\.\//, '');

function targetOf(op) {
  if (!op || !op.tool) return null;
  if (op.file) return `file:${normalize(op.file)}`;
  if (op.pattern) return `search:${op.pattern}@${normalize(op.path || '.')}`;
  if (op.tool === 'Bash' && op.command) {
    const command = String(op.command);
    const map = command.match(/(?:^|\s)\S*code-map\.mjs\s+(\S+)\s+(.+?)(?:\s*$|\s[|;&])/);
    if (map) return `code-map:${map[1]}:${map[2]}`;
    const search = command.match(/(?:^|\s)(?:rg|grep)\s+(?:-[^\s]+\s+)*["']?([^"'\s]+)/);
    if (search) return `search:${search[1]}`;
    const read = command.match(/(?:^|\s)(?:cat|sed|head|tail)\s+(.+)$/);
    if (read) {
      const operands = read[1].split(/\s+/).map((x) => x.replace(/^["']|["']$/g, '')).filter((x) => x && !x.startsWith('-'));
      const file = operands.at(-1);
      if (file && /[./]/.test(file) && !/^\d+(?:,\d+)?[a-z]?$/.test(file)) return `file:${normalize(file)}`;
    }
    const script = command.match(/(?:^|\s)\S*(?:evaluate-|walkthrough)\S*\.mjs\s+(\S+)/);
    if (script) return `playwright:${normalize(script[1])}`;
  }
  return null;
}

export function explorationDiagnostics(requests = []) {
  const ordered = [...requests].sort((a, b) => String(a.timestamp || '').localeCompare(String(b.timestamp || '')) || String(a.id || '').localeCompare(String(b.id || '')));
  const seen = new Map(), edited = new Set(), files = new Set();
  let repeated = 0, afterEdit = 0, failed = 0, afterFailure = 0, codeMap = 0, resultBytes = 0, loopSequences = 0, previousFailure = false;
  let run = [];
  for (const request of ordered) {
    const ops = request.ops || [];
    const classified = ops.map((op) => ({ op, detail: classifyOperation(op) }));
    const exploration = classified.filter((c) => c.detail.activity === 'code-exploration');
    const isExploration = exploration.length > 0;
    if (ops.some((op) => op.tool === 'Bash' && /code-map\.mjs/.test(String(op.command || '')))) codeMap++;
    for (const c of exploration) {
      const target = targetOf(c.op);
      if (!target) continue;
      if (c.op.file) files.add(normalize(c.op.file));
      const count = (seen.get(target) || 0) + 1;
      seen.set(target, count);
      if (count > 1) repeated++;
      const file = c.op.file ? `file:${normalize(c.op.file)}` : null;
      if ((file && edited.has(file)) || (!file && edited.has(target))) afterEdit++;
      if (previousFailure) afterFailure++;
    }
    const failedLooksLikeSearch = (request.errors || 0) > 0 && ops.length > 0 && ops.every((op) => EXPLORATION_TOOLS.has(op.tool) || /(?:^|\s)(?:rg|grep|cat|sed|head|tail)\b/.test(String(op.command || '')));
    if (failedLooksLikeSearch) failed++;
    const targets = exploration.map((c) => targetOf(c.op)).filter(Boolean);
    if (isExploration && targets.length) {
      run.push(...targets);
      if (run.length > 8) run = run.slice(-8);
      if (run.length >= 3 && new Set(run).size < run.length) loopSequences++;
    } else run = [];
    for (const c of classified) if (c.detail.activity === 'patch-development' && c.op.file) edited.add(`file:${normalize(c.op.file)}`);
    previousFailure = failedLooksLikeSearch;
    resultBytes += Number(request.resultBytes) || 0;
  }
  return {
    unique_targets: seen.size,
    repeated_targets: [...seen.values()].filter((n) => n > 1).length,
    repeated_lookups: repeated,
    failed_searches: failed,
    exploration_after_failure: afterFailure,
    exploration_after_edit: afterEdit,
    loop_sequences: loopSequences,
    code_map_calls: codeMap,
    unique_files: files.size,
    result_bytes: resultBytes,
  };
}

// Local-only detail for a human investigation: repeated targets and the requests that touched them. Never publish the
// targets. A repeated target is a question to inspect, not a finding of waste.
export function explorationDetails(requests = []) {
  const ordered = [...requests].sort((a, b) => String(a.timestamp || '').localeCompare(String(b.timestamp || '')) || String(a.id || '').localeCompare(String(b.id || '')));
  const edited = new Set(), map = new Map();
  let previousFailure = false;
  for (const request of ordered) {
    const ops = request.ops || [];
    const classified = ops.map((op) => ({ op, detail: classifyOperation(op) }));
    const exploration = classified.filter((c) => c.detail.activity === 'code-exploration');
    for (const c of exploration) {
      const target = targetOf(c.op);
      if (!target) continue;
      const entry = map.get(target) || { target, count: 0, requests: [], after_edit: false, after_failure: false, files: new Set() };
      entry.count++; entry.requests.push(request.id || null);
      if (c.op.file) { entry.files.add(normalize(c.op.file)); if (edited.has(`file:${normalize(c.op.file)}`)) entry.after_edit = true; }
      if (previousFailure) entry.after_failure = true;
      map.set(target, entry);
    }
    const failedLooksLikeSearch = (request.errors || 0) > 0 && ops.length > 0 && ops.every((op) => EXPLORATION_TOOLS.has(op.tool) || /(?:^|\s)(?:rg|grep|cat|sed|head|tail)\b/.test(String(op.command || '')));
    for (const c of classified) if (c.detail.activity === 'patch-development' && c.op.file) edited.add(`file:${normalize(c.op.file)}`);
    previousFailure = failedLooksLikeSearch;
  }
  return {
    unique_targets: map.size,
    repeated: [...map.values()].filter((e) => e.count > 1).map((e) => ({ target: e.target, count: e.count, request_ids: e.requests, after_edit: e.after_edit, after_failure: e.after_failure, files: [...e.files] })).sort((a, b) => b.count - a.count || a.target.localeCompare(b.target)),
    note: 'Local-only detail. Targets can contain private paths or search terms; never publish them.',
  };
}
