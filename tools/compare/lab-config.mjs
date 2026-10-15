// The repository's own settings: lab.config.yml at the root (AI-usage, auto-fix). A deliberately small reader, so that it needs no package
// and cannot be misread: nested mappings by two-space indent, `key: value`, `#` comments, true/false, numbers and plain strings. Lists,
// anchors, multi-line values and tabs are errors, not guesses. A missing file means the defaults; an unreadable one is reported, never ignored.
import fs from 'node:fs';
import path from 'node:path';

export const DEFAULTS = { auto_fix: { enabled: true } };
const SCHEMA = { auto_fix: { enabled: 'boolean' } };

export function parseConfig(text) {
  const root = {}, problems = [], stack = [{ indent: -2, obj: root }];
  String(text).split('\n').forEach((raw, i) => {
    const at = `line ${i + 1}`;
    if (/\t/.test(raw.replace(/#.*$/, ''))) return void problems.push(`${at}: tabs are not allowed; indent with two spaces`);
    const line = raw.replace(/(^|\s)#.*$/, '').replace(/\s+$/, '');
    if (!line.trim()) return;
    const m = line.match(/^( *)([A-Za-z_][\w-]*):(?:\s+(.*))?$/);
    if (!m) return void problems.push(`${at}: not a "key: value" line (lists, anchors and multi-line values are not supported): ${line.trim().slice(0, 60)}`);
    const indent = m[1].length; if (indent % 2) return void problems.push(`${at}: indent by two spaces`);
    while (stack.length > 1 && indent <= stack[stack.length - 1].indent) stack.pop();
    const top = stack[stack.length - 1];
    if (indent !== top.indent + 2) return void problems.push(`${at}: unexpected indent`);
    if (Object.hasOwn(top.obj, m[2])) return void problems.push(`${at}: "${m[2]}" is set twice`);
    if (m[3] === undefined) { const o = {}; top.obj[m[2]] = o; stack.push({ indent, obj: o }); return; }
    const v = m[3].trim();
    top.obj[m[2]] = v === 'true' ? true : v === 'false' ? false : /^-?\d+(\.\d+)?$/.test(v) ? Number(v) : v.replace(/^(['"])(.*)\1$/, '$2');
  });
  return { value: root, problems };
}

// Check against the schema and fill in the defaults. Returns { config, problems }.
export function resolveConfig(value) {
  const problems = [], config = JSON.parse(JSON.stringify(DEFAULTS));
  for (const [k, v] of Object.entries(value || {})) {
    if (!SCHEMA[k]) { problems.push(`unknown setting "${k}" (known: ${Object.keys(SCHEMA).join(', ')})`); continue; }
    if (typeof v !== 'object') { problems.push(`"${k}" must contain settings, not a value`); continue; }
    for (const [k2, v2] of Object.entries(v)) {
      if (!SCHEMA[k][k2]) problems.push(`unknown setting "${k}.${k2}" (known: ${Object.keys(SCHEMA[k]).map((x) => `${k}.${x}`).join(', ')})`);
      else if (typeof v2 !== SCHEMA[k][k2]) problems.push(`"${k}.${k2}" must be ${SCHEMA[k][k2] === 'boolean' ? 'true or false' : `a ${SCHEMA[k][k2]}`}, not "${v2}"`);
      else config[k][k2] = v2;
    }
  }
  return { config, problems };
}

export function readLabConfig(labRoot) {
  const file = path.join(labRoot, 'lab.config.yml');
  if (!fs.existsSync(file)) return { config: JSON.parse(JSON.stringify(DEFAULTS)), source: 'defaults (no lab.config.yml)', problems: [] };
  const p = parseConfig(fs.readFileSync(file, 'utf8')), r = resolveConfig(p.value);
  return { config: r.config, source: 'lab.config.yml', problems: [...p.problems, ...r.problems] };
}

export const getKey = (config, key) => key.split('.').reduce((o, k) => (o && typeof o === 'object' ? o[k] : undefined), config);
