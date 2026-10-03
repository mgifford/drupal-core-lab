// Building blocks for the setup of an issue pack (prototype). Instead of writing recipe files, which a chat assistant cannot know how to do for
// a given Drupal core, a pack lists blocks from a catalogue:
//     setup:
//       - use: file_field_with_size_limit
//         params: { field: attachment, limit: "1 KB" }
// Each block is a YAML file in tools/compare/blocks/ that says what it adds, what parameters it takes (each with a strict pattern, so a value
// cannot inject YAML), what it needs, and where it was actually verified. expandSetup() turns the chosen blocks into the same recipe files the
// lab already understands. Anything the catalogue lacks goes under `needs:` in the pack, for a maintainer to add as a new block.
//
// Block files are trusted repository files; the pack's setup entries are untrusted input and are validated here.
import fs from 'node:fs';
import path from 'node:path';
import { labRoot } from './lib.mjs';

export const BLOCKS_DIR = path.join(labRoot, 'tools/compare/blocks');
export const MAX_SETUP = 10;
export const PARAM_TYPES = {
  machine_name: { re: /^[a-z][a-z0-9_]{0,24}$/, hint: 'lowercase letters, digits and underscores, starting with a letter, at most 25 characters' },
  text: { re: /^[A-Za-z0-9][A-Za-z0-9 ,.()-]{0,39}$/, hint: 'letters, digits, spaces and , . ( ) - only, at most 40 characters' },
  size: { re: /^[1-9][0-9]{0,3} ?(KB|MB)$/, hint: 'a number then KB or MB, for example 1 KB or 2 MB' },
  extensions: { re: /^[a-z0-9]{1,5}( [a-z0-9]{1,5}){0,5}$/, hint: 'lowercase extensions separated by single spaces, for example txt or png jpg' },
};
const NAME_RE = /^[a-z][a-z0-9_]{0,40}$/;
const FILE_RE = /^config\/[A-Za-z0-9_.-]+\.yml$/;
const isObj = (x) => x && typeof x === 'object' && !Array.isArray(x);
const str = (x) => typeof x === 'string';

const cache = new WeakMap();
// Returns { blocks: Map(name -> block), problems: [string] }. A problem means a block file in the repository is malformed.
export function loadCatalogue(yaml, dir = BLOCKS_DIR) {
  if (dir === BLOCKS_DIR && cache.has(yaml)) return cache.get(yaml);
  const blocks = new Map(), problems = [];
  const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith('.yml')).sort() : [];
  for (const f of files) {
    const raw = fs.readFileSync(path.join(dir, f), 'utf8');
    let m; try { m = yaml.load(raw, { schema: yaml.CORE_SCHEMA }); } catch (e) { problems.push(`${f}: not valid YAML (${String(e.message).split('\n')[0]})`); continue; }
    const bad = (msg) => problems.push(`${f}: ${msg}`);
    if (!isObj(m)) { bad('must be a YAML mapping'); continue; }
    if (m.name !== f.replace(/\.yml$/, '') || !NAME_RE.test(String(m.name))) bad('name must equal the file name and be lowercase letters, digits and underscores');
    if (!str(m.title) || m.title.length < 3 || m.title.length > 120) bad('title is required (3 to 120 characters)');
    if (!str(m.description) || m.description.length < 20 || m.description.length > 700) bad('description is required (20 to 700 characters)');
    if (!str(m.verified) || m.verified.length < 20) bad('verified is required: say where this block was actually applied (core commit, which build)');
    if (!isObj(m.params)) bad('params is required (use {} for none)');
    else for (const [k, p] of Object.entries(m.params)) {
      if (!NAME_RE.test(k)) bad(`parameter name "${k}" is not lowercase letters, digits and underscores`);
      if (!isObj(p) || !PARAM_TYPES[p.type]) bad(`parameter ${k}: type must be one of ${Object.keys(PARAM_TYPES).join(', ')}`);
      else if (p.default !== undefined && !PARAM_TYPES[p.type].re.test(String(p.default))) bad(`parameter ${k}: the default "${p.default}" does not match its own type`);
      if (isObj(p) && !str(p.description)) bad(`parameter ${k}: description is required`);
    }
    if (m.once !== undefined && typeof m.once !== 'boolean') bad('once must be true or false');
    if (m.requires !== undefined && !(Array.isArray(m.requires) && m.requires.every((r) => str(r) && NAME_RE.test(r)))) bad('requires must be a list of block names');
    if (!m.recipe && !m.files) bad('a block must have a recipe section or files');
    if (m.recipe && (!isObj(m.recipe) || Object.keys(m.recipe).some((k) => !['recipes', 'install', 'config_actions'].includes(k)))) bad('recipe may only have recipes, install and config_actions');
    for (const k of Object.keys(m.files || {})) if (!FILE_RE.test(k.replace(/\{\{[a-z0-9_]+\}\}/g, 'x'))) bad(`file "${k}" must be config/<name>.yml`);
    const used = [...raw.matchAll(/\{\{([A-Za-z0-9_]+)\}\}/g)].map((x) => x[1]);
    for (const u of used) if (!isObj(m.params) || !(u in m.params)) bad(`uses {{${u}}} but declares no such parameter`);
    blocks.set(String(m.name), { ...m, params: isObj(m.params) ? m.params : {}, requires: Array.isArray(m.requires) ? m.requires : [], raw, file: f });
  }
  for (const b of blocks.values()) for (const r of b.requires) if (!blocks.has(r)) problems.push(`${b.file}: requires "${r}", which is not in the catalogue`);
  for (const b of blocks.values()) { // no cycles
    const walk = (n, stack) => { if (stack.includes(n)) { problems.push(`${b.file}: requires itself through ${[...stack, n].join(' -> ')}`); return; } for (const r of (blocks.get(n) || {}).requires || []) walk(r, [...stack, n]); };
    walk(b.name, []);
  }
  const cat = { blocks, problems: [...new Set(problems)] };
  if (dir === BLOCKS_DIR) cache.set(yaml, cat);
  return cat;
}

// Check the pack's setup entries. Returns { errors, entries: [{ block, values }] } (values have the defaults filled in).
export function validateSetup(setup, cat) {
  const errors = [], err = (at, msg) => errors.push({ at, msg }), entries = [];
  if (!Array.isArray(setup) || setup.length < 1 || setup.length > MAX_SETUP) { err('setup', `must list 1 to ${MAX_SETUP} building blocks`); return { errors, entries }; }
  const names = [...cat.blocks.keys()].join(', ');
  const counts = {};
  setup.forEach((e, i) => {
    if (isObj(e) && str(e.use) && cat.blocks.has(e.use) && cat.blocks.get(e.use).once) { counts[e.use] = (counts[e.use] || 0) + 1; if (counts[e.use] > 1) err(`setup[${i}].use`, `${e.use} can be used at most once in a pack (two copies would need the same configuration action with different arguments). Put the second one under needs and write its step as "set X by hand"`); }
  });
  setup.forEach((e, i) => {
    const at = `setup[${i}]`;
    if (!isObj(e)) return err(at, 'must have use and, optionally, params');
    for (const k of Object.keys(e)) if (!['use', 'params'].includes(k)) err(`${at}.${k}`, 'is not a known key (use, params)');
    const b = str(e.use) ? cat.blocks.get(e.use) : undefined;
    if (!b) return err(`${at}.use`, `"${e.use}" is not a building block in the catalogue (available: ${names}). If the scenario needs something else, list it under needs and write the step as "set X by hand"; do not invent configuration`);
    const given = e.params === undefined ? {} : e.params;
    if (!isObj(given)) return err(`${at}.params`, 'must be a mapping of parameter names to values');
    const values = {}; let ok = true;
    for (const k of Object.keys(given)) if (!(k in b.params)) { err(`${at}.params.${k}`, `is not a parameter of ${b.name} (parameters: ${Object.keys(b.params).join(', ') || 'none'})`); ok = false; }
    for (const [pn, spec] of Object.entries(b.params)) {
      let v = given[pn];
      if (v === undefined) { if (spec.default === undefined) { err(`${at}.params.${pn}`, 'is required'); ok = false; continue; } v = spec.default; }
      v = String(v);
      if (!PARAM_TYPES[spec.type].re.test(v)) { err(`${at}.params.${pn}`, `"${v}" is not valid: ${PARAM_TYPES[spec.type].hint}`); ok = false; continue; }
      values[pn] = v;
    }
    if (ok) entries.push({ block: b, values });
  });
  return { errors, entries };
}

const render = (text, values) => text.replace(/\{\{([A-Za-z0-9_]+)\}\}/g, (_, k) => { if (!(k in values)) throw new Error(`no value for {{${k}}}`); return values[k]; });
const defaultsOf = (b) => Object.fromEntries(Object.entries(b.params).map(([k, p]) => [k, String(p.default)]));
const unique = (into, more) => { for (const x of more) if (!into.includes(x)) into.push(x); };
function deepMerge(into, from, at) {
  for (const [k, v] of Object.entries(from)) {
    if (isObj(v) && isObj(into[k])) deepMerge(into[k], v, `${at}.${k}`);
    else if (k in into && JSON.stringify(into[k]) !== JSON.stringify(v)) throw new Error(`two blocks set ${at}.${k} to different values`);
    else into[k] = structuredClone(v);
  }
}

// Expand validated entries into recipe files: { files: { 'recipe.yml': ..., 'config/...': ... }, used: [...] }. Throws an Error on a conflict between blocks.
export function expandSetup(entries, cat, { nid, title }, yaml) {
  const instances = [], seen = new Set();
  const key = (b, v) => `${b.name}:${JSON.stringify(v)}`;
  const add = (b, values, auto) => { const k = key(b, values); if (!seen.has(k)) { seen.add(k); instances.push({ block: b, values, auto }); } };
  const addRequires = (b) => { for (const r of b.requires) { const rb = cat.blocks.get(r); addRequires(rb); add(rb, defaultsOf(rb), true); } };
  for (const e of entries) { addRequires(e.block); add(e.block, e.values, false); }
  const acc = { recipes: [], install: [], actions: {}, files: {} };
  for (const { block, values } of instances) {
    const doc = yaml.load(render(block.raw, values), { schema: yaml.CORE_SCHEMA });
    const r = doc.recipe || {};
    unique(acc.recipes, r.recipes || []); unique(acc.install, r.install || []);
    deepMerge(acc.actions, r.config_actions || {}, 'config.actions');
    for (const [fn, body] of Object.entries(doc.files || {})) {
      if (!FILE_RE.test(fn)) throw new Error(`block ${block.name} produced a file name that is not config/<name>.yml: ${fn}`);
      if (fn in acc.files && acc.files[fn] !== body) throw new Error(`two blocks write ${fn} with different content`);
      acc.files[fn] = body;
    }
  }
  const names = [...new Set(instances.map((i) => i.block.name))];
  const rec = { name: `Repro: #${nid} ${title}`, description: `Starting state built from the setup blocks: ${names.join(', ')}.`, type: 'Testing' };
  if (acc.recipes.length) rec.recipes = acc.recipes;
  if (acc.install.length) rec.install = acc.install;
  if (Object.keys(acc.actions).length) rec.config = { actions: acc.actions };
  return {
    files: { 'recipe.yml': yaml.dump(rec, { lineWidth: -1, noRefs: true }), ...acc.files },
    used: instances.map((i) => ({ name: i.block.name, values: i.values, auto: i.auto, verified: i.block.verified })),
  };
}

// The catalogue as text for the chat prompt.
export function catalogueText(cat) {
  const lines = [];
  for (const b of cat.blocks.values()) {
    lines.push(`- ${b.name}: ${b.title}. ${b.description}`);
    const ps = Object.entries(b.params);
    lines.push(ps.length ? `  parameters: ${ps.map(([k, p]) => `${k} (${p.type}${p.default !== undefined ? `, default "${p.default}"` : ', required'}): ${p.description}`).join('; ')}` : '  parameters: none');
    if (b.requires.length) lines.push(`  also adds automatically: ${b.requires.join(', ')}`);
    if (b.once) lines.push('  use this block at most once per pack');
  }
  return lines.join('\n');
}

// Lines for the imported report: which blocks built the setup and where each was verified.
export function describeSetup(used) {
  return used.map((u) => `- ${u.name}${Object.keys(u.values).length ? ` (${Object.entries(u.values).map(([k, v]) => `${k}: ${v}`).join(', ')})` : ''}${u.auto ? ' [added automatically]' : ''}. Verified: ${u.verified}`);
}
