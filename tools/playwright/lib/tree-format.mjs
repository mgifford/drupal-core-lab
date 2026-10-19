// Plain-text views of what assistive technology is given for a page, made to diff line by line (tools/playwright/tree-diff.mjs),
// and the SUMMARY.md that lists them. No browser here, so tests/lab can check these without Playwright.
import { normalise } from '../../compare/lib.mjs';

export const VIEWS = [
  { key: 'axtree', title: 'Accessibility tree', what: 'Chromium\'s accessibility tree (the "AXTree"): role, name, description, value and states of each node, indented. What the browser hands to a screen reader through the platform accessibility API.' },
  { key: 'aria', title: 'ARIA after JavaScript', what: 'Each element with a role, aria-* attribute, tabindex, hidden or inert, and each link, button, form control, summary, details, dialog, iframe and image, with those attributes as the page\'s JavaScript left them. Every ID reference (aria-labelledby, aria-describedby, aria-controls, for, ...) is looked up: [missing #id] or [#id ×n] marks one that does not resolve to exactly one element.' },
  { key: 'speech', title: 'Speech (Guidepup)', what: 'What the Guidepup virtual screen reader says moving through the whole page item by item (like the down arrow in a screen reader\'s browse mode), on a copy of the DOM in which everything Chromium does not render is hidden.' },
];

// Per-site noise: hostnames, tokens and the rest that lib.mjs removes, Drupal's random id suffixes (Html::getUniqueId() in AJAX
// requests: "--" and 11 characters), random hexadecimal ids (CKEditor 5: "e" and 32 hex digits) and dates of content created when
// each site was built.
export function normaliseTree(text, hosts = []) {
  return normalise(text, hosts)
    .replace(/--(?=[a-z_-]*[A-Z0-9])[A-Za-z0-9_-]{11}(?![A-Za-z0-9_-])/g, '--RANDOM')
    .replace(/(?<![0-9A-Za-z])(?=[0-9a-f]*[a-f])(?=[0-9a-f]*\d)[0-9a-f]{32,64}(?![0-9A-Za-z])/g, 'HEX')
    .replace(/\b\d{2}\/\d{2}\/\d{4} - \d{2}:\d{2}\b/g, 'DATE');
}

const clean = (s) => String(s ?? '').replace(/\s+/g, ' ').trim();
const quote = (s, max = 300) => { const t = clean(s); return JSON.stringify(t.length > max ? t.slice(0, max - 1) + '…' : t); };

// Accessibility tree from CDP Accessibility.getFullAXTree. Nodes Chromium ignores, and generic containers with no name, description
// or state, are left out and their children moved up; text equal to its parent's name is left out; inline text boxes are dropped.
// labelledby and describedby are left out because the name and description they produce are on the line.
const DROP_ROLES = new Set(['InlineTextBox', 'LineBreak']);
const PLAIN_ROLES = new Set(['generic', 'none', 'presentation', 'GenericContainer', 'Unknown', '']);
const DROP_PROPS = new Set(['labelledby', 'describedby', 'settable', 'editable', 'hiddenRoot', 'root']);
function axProp(p) {
  const v = p.value || {};
  if (['idref', 'idrefList', 'node', 'nodeList'].includes(v.type)) return `${p.name}=${(v.relatedNodes || []).map((r) => (r.idref ? `#${r.idref}` : r.text ? quote(r.text, 40) : 'node')).join(',') || 'none'}`;
  if (v.value === true || v.value === 'true') return p.name;
  return `${p.name}=${typeof v.value === 'string' && /[\s"=]/.test(v.value) ? quote(v.value) : v.value}`;
}
export function axTreeText(nodes) {
  if (!nodes || !nodes.length) return '';
  const byId = new Map(nodes.map((n) => [n.nodeId, n]));
  const lines = [];
  const visit = (n, depth, parentName) => {
    const role = n.role?.value ?? '';
    if (DROP_ROLES.has(role)) return;
    const name = clean(n.name?.value);
    if (role === 'StaticText') { if (name && name !== parentName) lines.push(`${'  '.repeat(depth)}text ${quote(name)}`); return; }
    const desc = clean(n.description?.value), value = clean(n.value?.value);
    const props = n.ignored ? [] : (n.properties || []).filter((p) => !DROP_PROPS.has(p.name)).map(axProp);
    const shown = !n.ignored && !(PLAIN_ROLES.has(role) && !name && !desc && !props.length);
    if (shown) lines.push(`${'  '.repeat(depth)}${role}${name ? ' ' + quote(name) : ''}${desc ? ' description=' + quote(desc) : ''}${value ? ' value=' + quote(value) : ''}${props.length ? ' ' + props.join(' ') : ''}`);
    for (const id of n.childIds || []) { const k = byId.get(id); if (k) visit(k, shown ? depth + 1 : depth, shown ? name : parentName); }
  };
  visit(nodes.find((n) => !n.parentId) || nodes[0], 0, '');
  return lines.join('\n') + '\n';
}

// "+a −b" from a unified diff, or null when there is none.
export function changeCount(diff) {
  if (!diff) return null;
  let add = 0, del = 0;
  for (const l of diff.split('\n')) { if (l.startsWith('+') && !l.startsWith('+++')) add++; else if (l.startsWith('-') && !l.startsWith('---')) del++; }
  return { add, del };
}

// A page path as a file name: 01-node-1-edit, 02-front.
export const pageFile = (p, i) => `${String(i + 1).padStart(2, '0')}-${String(p).replace(/[?#].*$/, '').replace(/^\/+|\/+$/g, '').replace(/[^A-Za-z0-9]+/g, '-').slice(0, 60) || 'front'}`;

// ID references that do not resolve, compared: new in After, gone in After, on both.
export function refChanges(before, after) {
  const key = (r) => `${r.page}\t${r.element}\t${r.attr}\t${r.id}\t${r.problem}`;
  const b = new Set(before.map(key)), a = new Set(after.map(key));
  return [
    ...after.filter((r) => !b.has(key(r))).map((r) => ({ ...r, change: 'new in After' })),
    ...before.filter((r) => !a.has(key(r))).map((r) => ({ ...r, change: 'gone in After' })),
    ...after.filter((r) => b.has(key(r))).map((r) => ({ ...r, change: 'on both sides' })),
  ];
}

// Problems to read before the views: a page that did not load as asked describes some other page.
function warningsOf(run) {
  const out = [];
  for (const p of run.pages) for (const side of ['before', 'after']) {
    const s = p.sides[side] || { error: 'not read' };
    if (s.error) out.push(`${side}: \`${p.path}\` could not be read: ${s.error}`);
    else if ((s.status && s.status >= 400) || (s.landed && s.landed.split('?')[0] !== p.path.split('?')[0])) out.push(`${side}: \`${p.path}\` ${s.status >= 400 ? `answered HTTP ${s.status}` : `ended at \`${s.landed}\``}${/\/user\/login/.test(s.landed || '') ? ' (not logged in?)' : ''}: the views show that page, not the one asked for.`);
  }
  return out;
}

// What the terminal shows at the end of a run: per page and view, the changed lines (at most `max` each), then where the rest is.
export function terminalReport(run, where, { max = 6 } = {}) {
  const env = run.environment || {};
  const lines = [`\nWhat changed, Before -> After (each page as it loads; Chromium ${env.browserVersion || ''}, ${env.viewport ? `${env.viewport.width}x${env.viewport.height}` : ''}, logged in: ${run.login ? 'yes' : 'no'}):`];
  const warnings = warningsOf(run);
  if (warnings.length) lines.push('', 'CHECK FIRST:', ...warnings.map((w) => `  ${w.replace(/`/g, '')}`));
  for (const p of run.pages) {
    lines.push('', p.path);
    const changed = VIEWS.filter((v) => p.views[v.key]?.diff);
    if (!VIEWS.some((v) => p.views[v.key])) { lines.push('  not compared: see CHECK FIRST'); continue; }
    if (!changed.length) { lines.push('  same in all three views'); continue; }
    for (const v of VIEWS) {
      const x = p.views[v.key]; if (!x) continue;
      const c = changeCount(x.diff);
      lines.push(`  ${v.title.padEnd(24)}${c ? `+${c.add} -${c.del}` : 'same'}`);
      if (!c) continue;
      const body = x.diff.split('\n').filter((l) => /^[-+]/.test(l) && !/^(---|\+\+\+) /.test(l)).map((l) => `    ${l[0]} ${l.slice(1).trim()}`.slice(0, 170));
      lines.push(...body.slice(0, max));
      if (body.length > max) lines.push(`    ... ${body.length - max} more in ${x.file}`);
    }
  }
  const refs = refChanges(run.refs.before || [], run.refs.after || []);
  const count = (c) => refs.filter((r) => r.change === c).length;
  lines.push('', `ID references that do not resolve: ${refs.length ? `${count('new in After')} new in After, ${count('gone in After')} gone in After, ${count('on both sides')} on both sides` : 'none'}.`);
  lines.push('', `Report: ${where}/SUMMARY.md`, `  each changed line in the .diff files next to it; every view in full in before/ and after/`, `  how to read it: docs/ACCESSIBILITY-TREE-DIFF.md`);
  return lines.join('\n');
}

// SUMMARY.md. run: { title, when, sides: { before: { label, commit }, after }, environment, login, pages: [{ path, file,
// sides: { before: { status, landed, spoken }, after }, views: { axtree: { diff, file } ... } }], refs: { before: [], after: [] } }
export function summaryMarkdown(run) {
  const env = run.environment || {};
  let md = `# Accessibility tree, ARIA and speech: ${run.title}\n\n`;
  md += `Generated ${run.when}. Before: ${run.sides.before.label}. After: ${run.sides.after.label}.\n`;
  md += `Chromium ${env.browserVersion || ''}, viewport ${env.viewport ? `${env.viewport.width}x${env.viewport.height}` : ''}, logged in: ${run.login ? 'yes' : 'no'}. State: each page as it loads (no clicks).\n\n`;
  const warnings = warningsOf(run);
  if (warnings.length) md += `**Check first:**\n\n${warnings.map((w) => `- ${w}`).join('\n')}\n\n`;
  const differ = run.pages.reduce((n, p) => n + VIEWS.filter((v) => p.views[v.key]?.diff).length, 0);
  md += `**${differ} of ${run.pages.length * VIEWS.length} views differ.** Hostnames, tokens, random id suffixes and content dates are normalised away.\n\n`;
  md += `| Page | ${VIEWS.map((v) => v.title).join(' | ')} | Items spoken (Before / After) |\n|---|${VIEWS.map(() => '---|').join('')}---|\n`;
  for (const p of run.pages) {
    const cell = (v) => { const x = p.views[v.key]; if (!x) return 'not read'; const c = changeCount(x.diff); return c ? `[+${c.add} −${c.del}](${x.file})` : 'same'; };
    md += `| \`${p.path}\` | ${VIEWS.map(cell).join(' | ')} | ${p.sides.before.spoken ?? '-'} / ${p.sides.after.spoken ?? '-'} |\n`;
  }
  const refs = refChanges(run.refs.before || [], run.refs.after || []);
  md += `\n## ID references that do not resolve\n\n`;
  if (!refs.length) md += 'None on either side.\n';
  else {
    md += `An aria-labelledby, aria-describedby, aria-controls, for (and the like) that names no element, or an id used more than once, loses or confuses the relationship it is meant to give.\n\n| Change | Page | Element | Attribute | Problem |\n|---|---|---|---|---|\n`;
    for (const r of refs) md += `| ${r.change === 'new in After' ? '**new in After**' : r.change} | \`${r.page}\` | \`${r.element}\` | ${r.attr} | ${r.problem === 'missing' ? `no element has id \`${r.id}\`` : `id \`${r.id}\` is on ${r.count} elements`} |\n`;
  }
  md += `\n## What each view is\n\n${VIEWS.map((v) => `- **${v.title}** (\`*.${v.key}.diff\`): ${v.what}`).join('\n')}\n\n`;
  md += `Every view in full: \`before/\` and \`after/\`. In a diff, \`-\` lines are Before only, \`+\` lines After only.\n\n`;
  md += `## Limits\n\n- Each page as it loads. States reached by clicking (an opened dialog, an expanded menu, an error after Save) need the issue's evaluator or the viewer.\n- Chromium only. Firefox and Safari build their own trees, and real screen readers (NVDA, JAWS, VoiceOver, TalkBack) add their own behaviour: Guidepup is a model of one, by decision (docs/TESTING-TOOLS.md).\n- A difference is evidence for a person to read, not a verdict: a changed line can be the fix itself.\n`;
  return md;
}
