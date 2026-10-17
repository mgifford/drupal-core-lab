// Generate the draft design reference from its canonical proposed contracts.
// No dependencies, network, Drupal installation or scanner integration required.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const file = value => path.join(root, value);
const data = JSON.parse(fs.readFileSync(file('docs/design/contracts.json'), 'utf8'));
const template = fs.readFileSync(file('docs/design/reference.template.html'), 'utf8');
const output = file('docs/design/default-admin-design-system.html');
const esc = value => String(value).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
if (data.status !== 'DRAFT_NOT_ADOPTED' || !Array.isArray(data.rules)) throw new Error('Expected draft contract collection');
const ids = new Set();
for (const rule of data.rules) {
  if (!/^[A-Z][A-Z0-9]{1,4}-\d{2}$/.test(rule.id) || ids.has(rule.id)) throw new Error('Invalid or duplicate rule ID: ' + rule.id);
  ids.add(rule.id);
  if (rule.status !== 'proposal' || rule.accepted !== false) throw new Error('This draft renderer requires unapproved proposals: ' + rule.id);
  for (const key of ['title', 'section', 'statement', 'applies_to', 'check', 'exceptions']) if (typeof rule[key] !== 'string' || !rule[key]) throw new Error('Missing rule field: ' + rule.id + '/' + key);
  for (const key of rule.sources) if (!data.sources[key]) throw new Error('Unknown source: ' + key);
  if (!template.includes('id="' + rule.section + '"')) throw new Error('Missing section: ' + rule.section);
}
const link = key => {
  const source = data.sources[key];
  if (!source.url.startsWith('https://')) throw new Error('Source must use HTTPS: ' + key);
  return `<a href="${esc(source.url)}">${esc(source.title)}</a>`;
};
const used = new Set();
let html = template.replace(/<!--RULE:([A-Z0-9]+-\d{2})-->/g, (_, id) => {
  const r = data.rules.find(rule => rule.id === id);
  if (!r || used.has(id)) throw new Error('Missing or repeated template rule: ' + id);
  used.add(id);
  const refs = r.sources.map(link).join('; ') || 'Proposed Lab contract; no external adoption claimed.';
  const evidence = r.evidence.map(value => `<a href="#evidence">${esc(value)}</a>`).join('; ');
  return `<article class="rule" id="${r.id}" data-status="proposal"><h3><code>${r.id}</code> ${esc(r.title)}</h3><p class="status">Proposed reviewer rule · not adopted${r.signal === 'external-requirement' ? ' · external requirement has its own source' : ''}</p><p>${esc(r.statement)}</p><dl><dt>Applies to</dt><dd>${esc(r.applies_to)}</dd><dt>How to review</dt><dd>${esc(r.check)}</dd><dt>Exceptions and limits</dt><dd>${esc(r.exceptions)}</dd><dt>Basis</dt><dd>${refs}${evidence ? ' · Evidence: ' + evidence : ''}</dd></dl></article>`;
});
if (used.size !== ids.size) throw new Error('Some contracts have no template slot');
if (html.split('<!--CONTRACTS_JSON-->').length !== 2) throw new Error('Expected one JSON slot');
html = html.replace('<!--CONTRACTS_JSON-->', () => JSON.stringify(data, null, 2).replace(/<\//g, '<\\/'));
const htmlIds = [...html.matchAll(/\sid="([^"]+)"/g)].map(match => match[1]);
if (new Set(htmlIds).size !== htmlIds.length) throw new Error('Duplicate HTML IDs');
for (const match of html.matchAll(/href="#([^"]+)"/g)) if (!htmlIds.includes(match[1])) throw new Error('Missing internal target: ' + match[1]);
if (process.argv.includes('--check')) {
  if (!fs.existsSync(output) || fs.readFileSync(output, 'utf8') !== html) { console.error('Design reference is stale. Run node scripts/build-design-reference.mjs'); process.exitCode = 1; }
  else console.log('Design reference is up to date; ' + ids.size + ' proposed contracts and internal links checked.');
} else {
  fs.writeFileSync(output, html);
  console.log('Wrote docs/design/default-admin-design-system.html (' + ids.size + ' proposed contracts).');
}
