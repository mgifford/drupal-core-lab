// A small, dependency-free validator for the evidence schema. It supports the JSON Schema 2020-12 keywords this project's
// schema uses: $ref (local), type (single or list), required, properties, additionalProperties, items, enum, const, pattern,
// minLength, minItems, maxItems, minimum, maximum, oneOf, anyOf, allOf and format=date-time.
//
// Why not ajv: Core Lab's self-test runs with no network and no extra packages. Keeping the validator here means the schema
// file can remain the single source of truth without adding a dependency to every contributor's checkout. Tests cover the
// keywords the schema uses; an unsupported keyword is an error, not a silent pass.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
export const SCHEMA_PATH = path.join(here, 'evidence.schema.json');

const typeOf = (v) => {
  if (v === null) return 'null';
  if (Array.isArray(v)) return 'array';
  if (Number.isInteger(v)) return 'integer';
  return typeof v;
};
const matchesType = (v, t) => (t === 'number' ? typeof v === 'number' : t === 'integer' ? Number.isInteger(v) : typeOf(v) === t);

const RESERVED = new Set([
  '$schema', '$id', '$defs', '$ref', '$comment', 'title', 'description', 'default', 'examples',
  'type', 'required', 'properties', 'additionalProperties', 'items', 'enum', 'const', 'pattern',
  'minLength', 'maxLength', 'minItems', 'maxItems', 'minimum', 'maximum', 'oneOf', 'anyOf', 'allOf',
  'format', 'deprecated',
]);

// Resolve a local JSON pointer such as #/$defs/request. Anything else is rejected: a remote $ref would make validation
// depend on the network and on a document this repository does not pin.
export function resolveRef(root, ref) {
  if (!ref.startsWith('#/')) throw new Error(`unsupported $ref (only local "#/..." references are allowed): ${ref}`);
  return ref.slice(2).split('/').reduce((o, part) => {
    const key = part.replace(/~1/g, '/').replace(/~0/g, '~');
    if (!o || typeof o !== 'object' || !(key in o)) throw new Error(`$ref does not resolve: ${ref}`);
    return o[key];
  }, root);
}

function validateNode(value, schema, root, at, errors) {
  if (schema === true) return;
  if (schema === false) { errors.push({ path: at || '/', message: 'value is not allowed here' }); return; }
  if (!schema || typeof schema !== 'object') { errors.push({ path: at || '/', message: 'invalid schema node' }); return; }
  if (schema.$ref) {
    let target;
    try { target = resolveRef(root, schema.$ref); } catch (e) { errors.push({ path: at || '/', message: e.message }); return; }
    validateNode(value, target, root, at, errors);
    return;
  }
  for (const key of Object.keys(schema)) if (!RESERVED.has(key)) errors.push({ path: at || '/', message: `validator does not support schema keyword "${key}"` });

  if (schema.const !== undefined && JSON.stringify(value) !== JSON.stringify(schema.const)) {
    errors.push({ path: at || '/', message: `must equal ${JSON.stringify(schema.const)}` });
  }
  if (schema.enum && !schema.enum.some((x) => JSON.stringify(x) === JSON.stringify(value))) {
    errors.push({ path: at || '/', message: `must be one of: ${schema.enum.map((x) => JSON.stringify(x)).join(', ')}` });
  }
  if (schema.type !== undefined) {
    const types = Array.isArray(schema.type) ? schema.type : [schema.type];
    if (!types.some((t) => matchesType(value, t))) {
      errors.push({ path: at || '/', message: `must be ${types.join(' or ')}, not ${typeOf(value)}` });
      return;
    }
  }
  if (schema.format === 'date-time' && typeof value === 'string') {
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/.test(value) || Number.isNaN(Date.parse(value))) {
      errors.push({ path: at || '/', message: 'must be an RFC 3339 date-time in UTC (ending in Z)' });
    }
  }
  if (typeof schema.pattern === 'string' && typeof value === 'string' && !new RegExp(schema.pattern, 'u').test(value)) {
    errors.push({ path: at || '/', message: `does not match ${schema.pattern}` });
  }
  if (typeof value === 'string') {
    if (schema.minLength !== undefined && value.length < schema.minLength) errors.push({ path: at || '/', message: `must be at least ${schema.minLength} characters` });
    if (schema.maxLength !== undefined && value.length > schema.maxLength) errors.push({ path: at || '/', message: `must be at most ${schema.maxLength} characters` });
  }
  if (typeof value === 'number') {
    if (schema.minimum !== undefined && value < schema.minimum) errors.push({ path: at || '/', message: `must be at least ${schema.minimum}` });
    if (schema.maximum !== undefined && value > schema.maximum) errors.push({ path: at || '/', message: `must be at most ${schema.maximum}` });
  }
  if (Array.isArray(value)) {
    if (schema.minItems !== undefined && value.length < schema.minItems) errors.push({ path: at || '/', message: `must contain at least ${schema.minItems} item(s)` });
    if (schema.maxItems !== undefined && value.length > schema.maxItems) errors.push({ path: at || '/', message: `must contain at most ${schema.maxItems} item(s)` });
    if (schema.items) value.forEach((item, i) => validateNode(item, schema.items, root, `${at || ''}/${i}`, errors));
  }
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    for (const key of schema.required || []) if (!(key in value)) errors.push({ path: at || '/', message: `required property "${key}" is missing` });
    const props = schema.properties || {};
    for (const [key, v] of Object.entries(value)) {
      if (props[key]) validateNode(v, props[key], root, `${at || ''}/${key}`, errors);
      else if (schema.additionalProperties === false) errors.push({ path: `${at || ''}/${key}`, message: 'property is not allowed' });
      else if (schema.additionalProperties && typeof schema.additionalProperties === 'object') validateNode(v, schema.additionalProperties, root, `${at || ''}/${key}`, errors);
    }
  }
  for (const [i, branch] of (schema.allOf || []).entries()) {
    const before = errors.length; validateNode(value, branch, root, at, errors);
    if (errors.length > before) errors[errors.length - 1].message += ` (allOf[${i}])`;
  }
  if (schema.anyOf) {
    const results = schema.anyOf.map((branch) => { const e = []; validateNode(value, branch, root, at, e); return e; });
    if (!results.some((e) => e.length === 0)) errors.push({ path: at || '/', message: `must match at least one allowed shape (${results.map((e) => e[0]?.message).filter(Boolean).join('; ')})` });
  }
  if (schema.oneOf) {
    const results = schema.oneOf.map((branch) => { const e = []; validateNode(value, branch, root, at, e); return e; });
    const ok = results.filter((e) => e.length === 0).length;
    if (ok !== 1) errors.push({ path: at || '/', message: `must match exactly one allowed shape (matched ${ok})` });
  }
}

// Validate any document against a loaded schema. Returns { ok, errors } and never throws on malformed input.
export function validateAgainst(value, schema) {
  const errors = [];
  validateNode(value, schema, schema, '', errors);
  return { ok: errors.length === 0, errors };
}

// The evidence-schema convenience wrapper.
export function validateEvidence(value, schema = loadSchema()) {
  return validateAgainst(value, schema);
}

export function loadSchema() {
  return JSON.parse(fs.readFileSync(SCHEMA_PATH, 'utf8'));
}

export function assertEvidence(value, label = 'evidence manifest') {
  const result = validateEvidence(value);
  if (!result.ok) {
    const lines = result.errors.slice(0, 40).map((e) => `  ${e.path || '/'}: ${e.message}`);
    throw new Error(`${label} does not validate against schema ${value?.schema_version || '(missing version)'}:\n${lines.join('\n')}${result.errors.length > 40 ? `\n  … and ${result.errors.length - 40} more` : ''}`);
  }
  return value;
}
