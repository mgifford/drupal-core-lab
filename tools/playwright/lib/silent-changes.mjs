// The recorder's changes after user input (lib/recorder.mjs), grouped, and Before and After compared, for a run's SUMMARY.md.
// No browser here, so tests/lab can check it without Playwright.

export const HOW = {
  live: 'in a live region',
  announced: 'Drupal.announce() after the same action',
  focus: 'focus moved to it',
  disclosed: 'shown by the control pressed (expanded)',
  control: 'inside the control itself',
  name: 'the name of a control that appeared or changed',
  silent: 'silent',
};

// One row per action, page, control, element and how: a word typed into a field (action "typing", one window per key) is one
// row, with how many times the text changed.
export function groupChanges(windows = []) {
  const groups = new Map();
  for (const w of windows || []) for (const c of w.changes || []) {
    const k = `${w.action}\t${w.page || ''}\t${w.on}\t${c.where}\t${c.how}`;
    const g = groups.get(k);
    if (g) { g.times++; g.last = c.text; continue; }
    groups.set(k, { action: w.action, ...(w.page ? { page: w.page } : {}), on: w.on, where: c.where, how: c.how, text: c.text, last: c.text, times: 1, ...(c.live ? { live: c.live } : {}), ...(c.announced ? { announced: c.announced } : {}) });
  }
  return [...groups.values()];
}

const cell = (s, n = 110) => { const t = String(s ?? '').replace(/\s+/g, ' ').trim(); return (t.length > n ? t.slice(0, n - 1) + '…' : t).replace(/\|/g, '\\|'); };
const key = (x) => `${x.action}\t${x.page || ''}\t${x.on}\t${x.where}`;

// Silent changes compared: new in After (a regression to look at), gone in After (perhaps what the change fixed), on both sides.
export function silentRows(before, after) {
  const s = (rows) => rows.filter((x) => x.how === 'silent');
  const b = new Set(s(before).map(key)), a = new Set(s(after).map(key));
  return [
    ...s(after).filter((x) => !b.has(key(x))).map((x) => ({ ...x, side: 'after', change: 'new in After' })),
    ...s(before).filter((x) => !a.has(key(x))).map((x) => ({ ...x, side: 'before', change: 'gone in After' })),
    ...s(after).filter((x) => b.has(key(x))).map((x) => ({ ...x, side: 'after', change: 'on both sides' })),
  ];
}

export function silentMarkdown(results) {
  const sides = ['before', 'after'];
  let md = `## Changes after input, and how a screen reader learns of them\n\n`;
  md += `After each click, key press or typing, the text that appeared or changed on the page. **Silent**: not in a live region, no \`Drupal.announce()\` after the same action, focus did not move to it, and the control pressed did not disclose it. A silent change is a candidate for WCAG 2.2 SC 4.1.3 Status Messages, for a person to judge: not every change is a status message. See docs/SILENT-CHANGES.md.\n\n`;
  if (!sides.some((s) => results.sides[s]?.speech?.changes)) return md + 'Not recorded in this run (the recorder has done this since 2026-10-19).\n\n';
  const g = Object.fromEntries(sides.map((s) => [s, groupChanges(results.sides[s]?.speech?.changes)]));
  const rows = silentRows(g.before, g.after);
  if (!rows.length) md += 'No silent change on either side.\n\n';
  else {
    md += `| | Side | Page | After | Text (first; last) | Where | Times |\n|---|---|---|---|---|---|---|\n`;
    for (const r of rows) md += `| ${r.change === 'new in After' ? '**new in After**' : r.change} | ${r.side} | ${r.page ? `\`${cell(r.page, 50)}\`` : ''} | ${r.action} ${cell(r.on, 60)} | ${cell(r.text)}${r.times > 1 && r.last !== r.text ? `; ${cell(r.last, 60)}` : ''} | \`${cell(r.where, 50)}\` | ${r.times} |\n`;
    md += '\n';
  }
  const control = sides.flatMap((s) => g[s].filter((x) => x.how === 'control').map((x) => ({ ...x, side: s })));
  if (control.length) md += `Inside the control itself (its own text changed; a screen reader may not say it again): ${control.slice(0, 8).map((x) => `${x.side} ${x.action} ${cell(x.on, 50)} → "${cell(x.last, 50)}"`).join('; ')}${control.length > 8 ? `; and ${control.length - 8} more` : ''}.\n\n`;
  for (const s of sides) {
    const n = (how) => g[s].filter((x) => x.how === how).reduce((t, x) => t + x.times, 0);
    md += `${s === 'before' ? 'Before' : 'After'}: ${Object.keys(HOW).map((h) => `${n(h)} ${HOW[h]}`).join(', ')}.\n`;
  }
  return md + '\n';
}
