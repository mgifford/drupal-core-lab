// Check templates for an issue pack (prototype). A chat assistant writes probes badly, so instead of a free-form probe a check can name a
// template from tools/compare/check-templates/ and fill in its parameters:
//     checks:
//       - use: element_exists
//         kind: fix
//         params: { selector: ".file-upload-messages", what: "The upload message wrapper" }
// The label and the probe are generated from the template, so they always agree, and every parameter has a strict pattern, so a value cannot
// change the shape of the probe. expandChecks() returns ordinary { label, probe, expect, kind } checks (same positions as in the pack) that go
// through the normal validation. Template files are trusted repository files; the pack's entries are untrusted.
import fs from 'node:fs';
import path from 'node:path';
import { labRoot } from './lib.mjs';

export const CHECKS_DIR = path.join(labRoot, 'tools/compare/check-templates');
const KINDS = ['precondition', 'fix', 'regression'];
const NAME_RE = /^[a-z][a-z0-9_]{0,40}$/;
const SIMPLE = '(?:[a-z][a-z0-9-]*)?(?:[.#][A-Za-z_][A-Za-z0-9_-]*|\\[[a-z][a-z0-9-]*(?:=(?:[A-Za-z0-9_.:-]+|"[A-Za-z0-9_. \\[\\]-]*"|\'[A-Za-z0-9_. \\[\\]-]*\'))?\\])*';
export const CHECK_PARAM_TYPES = {
  selector: { re: new RegExp(`^(?=.)${SIMPLE}(?: (?:> )?${SIMPLE}){0,3}$`), hint: 'a simple CSS selector: tag, .class, #id, [attribute] or [attribute=value], combined with a space or " > " (at most 4 parts, no pseudo-classes)' },
  text: { re: /^[A-Za-z0-9][A-Za-z0-9 ,.()!#:-]{0,79}$/, hint: 'letters, digits, spaces and , . ( ) ! # : - only, at most 80 characters' },
  attribute: { re: /^[a-z][a-z-]{1,30}$/, hint: 'a lowercase attribute name such as aria-expanded' },
  value: { re: /^[A-Za-z0-9][A-Za-z0-9 _.:-]{0,39}$/, hint: 'letters, digits, spaces and _ . : - only, at most 40 characters' },
  field_name: { re: /^[A-Za-z_][A-Za-z0-9_\[\]-]{0,59}$/, hint: 'a form field name such as title[0][value]' },
};
// Marks a template entry that could not be expanded. A Symbol, so a pack (YAML) can never carry it.
export const FAILED = Symbol('failed template check');
const isObj = (x) => x && typeof x === 'object' && !Array.isArray(x);
const str = (x) => typeof x === 'string';
const ESCAPES = { js: (v) => JSON.stringify(v), js_lower: (v) => JSON.stringify(v.toLowerCase()) };

const cache = new WeakMap();
// Returns { templates: Map(name -> template), problems: [string] }.
export function loadChecks(yaml, dir = CHECKS_DIR) {
  if (dir === CHECKS_DIR && cache.has(yaml)) return cache.get(yaml);
  const templates = new Map(), problems = [];
  const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith('.yml')).sort() : [];
  for (const f of files) {
    const raw = fs.readFileSync(path.join(dir, f), 'utf8');
    let m; try { m = yaml.load(raw, { schema: yaml.CORE_SCHEMA }); } catch (e) { problems.push(`${f}: not valid YAML (${String(e.message).split('\n')[0]})`); continue; }
    const bad = (msg) => problems.push(`${f}: ${msg}`);
    if (!isObj(m)) { bad('must be a YAML mapping'); continue; }
    if (m.name !== f.replace(/\.yml$/, '') || !NAME_RE.test(String(m.name))) bad('name must equal the file name');
    if (!str(m.title) || m.title.length < 3) bad('title is required');
    if (!str(m.description) || m.description.length < 20 || m.description.length > 700) bad('description is required (20 to 700 characters)');
    if (!str(m.verified) || m.verified.length < 20) bad('verified is required');
    if (!Array.isArray(m.kinds) || !m.kinds.length || !m.kinds.every((k) => KINDS.includes(k))) bad('kinds must list precondition, fix and/or regression');
    if (!isObj(m.params)) bad('params is required (use {} for none)');
    else for (const [k, p] of Object.entries(m.params)) {
      if (!NAME_RE.test(k)) bad(`parameter name "${k}" is not lowercase letters, digits and underscores`);
      if (!isObj(p) || !CHECK_PARAM_TYPES[p.type]) bad(`parameter ${k}: type must be one of ${Object.keys(CHECK_PARAM_TYPES).join(', ')}`);
      if (isObj(p) && !str(p.description)) bad(`parameter ${k}: description is required`);
    }
    if (!str(m.label) || !str(m.probe)) bad('label and probe are required');
    if (!(typeof m.expect === 'boolean' || typeof m.expect === 'number' || str(m.expect))) bad('expect is required');
    for (const field of ['label', 'probe']) for (const [, name, esc] of String(m[field]).matchAll(/\{\{([a-z0-9_]+)(?:\|([a-z_]+))?\}\}/g)) {
      if (!isObj(m.params) || !(name in m.params)) bad(`${field} uses {{${name}}} but declares no such parameter`);
      if (esc && !ESCAPES[esc]) bad(`${field} uses unknown escape "${esc}"`);
      if (field === 'probe' && !esc) bad(`probe parameter {{${name}}} must say how it is escaped (js or js_lower)`);
      if (field === 'label' && esc) bad('label parameters are plain text, without an escape');
    }
    templates.set(String(m.name), { ...m, params: isObj(m.params) ? m.params : {}, file: f });
  }
  const cat = { templates, problems };
  if (dir === CHECKS_DIR) cache.set(yaml, cat);
  return cat;
}

const fill = (tpl, values, escaped) => tpl.replace(/\{\{([a-z0-9_]+)(?:\|([a-z_]+))?\}\}/g, (_, n, esc) => (escaped ? ESCAPES[esc](values[n]) : values[n]));

// A template entry that cannot be expanded comes back as { [FAILED]: true }, so later checks do not pile errors on it.
// Expands the template entries of a checks list. Entries that do not use a template pass through unchanged. Returns { checks, errors }.
export function expandChecks(checks, cat) {
  const errors = [], err = (at, msg) => errors.push({ at, msg });
  const names = [...cat.templates.keys()].join(', ');
  const out = checks.map((c, i) => {
    if (!isObj(c) || c.use === undefined) return c;
    const at = `variant.checks[${i}]`;
    if (!str(c.use) || !cat.templates.has(c.use)) { err(`${at}.use`, `"${c.use}" is not a check template. Available: ${names}`); return { [FAILED]: true }; }
    const t = cat.templates.get(c.use);
    for (const k of Object.keys(c)) if (!['use', 'kind', 'params'].includes(k)) err(`${at}.${k}`, 'is not a known key for a template check (use, kind, params)');
    const failed = { [FAILED]: true, kind: c.kind };
    if (!t.kinds.includes(c.kind)) err(`${at}.kind`, `${c.use} can be used as ${t.kinds.join(', ')}`);
    const given = c.params === undefined ? {} : c.params;
    if (!isObj(given)) { err(`${at}.params`, 'must be a mapping of parameter names to values'); return failed; }
    const values = {};
    for (const k of Object.keys(given)) if (!(k in t.params)) err(`${at}.params.${k}`, `${c.use} has no parameter "${k}"${Object.keys(t.params).length ? ` (it takes ${Object.keys(t.params).join(', ')})` : ' (it takes none)'}`);
    for (const [k, p] of Object.entries(t.params)) {
      const v = given[k];
      if (v === undefined) { err(`${at}.params.${k}`, `${c.use} needs ${k}: ${p.description}`); continue; }
      const s = typeof v === 'number' ? String(v) : v;
      if (!str(s) || !CHECK_PARAM_TYPES[p.type].re.test(s)) { err(`${at}.params.${k}`, `must be ${CHECK_PARAM_TYPES[p.type].hint}`); continue; }
      values[k] = s;
    }
    if (errors.some((e) => e.at.startsWith(at))) return failed;
    return { label: fill(t.label, values, false), probe: fill(t.probe, values, true), expect: t.expect, kind: c.kind };
  });
  return { checks: out, errors };
}

// The list shown to a chat assistant in the prompt.
export function checkCatalogueText(cat) {
  return [...cat.templates.values()].map((t) => {
    const ps = Object.entries(t.params).map(([k, p]) => `${k} (${p.type}: ${p.description})`).join('; ') || 'none';
    return `- ${t.name}: ${t.description}\n    kinds: ${t.kinds.join(', ')}\n    params: ${ps}`;
  }).join('\n');
}
