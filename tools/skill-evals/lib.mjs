// Skill evals: file format, deterministic validation, and the prompts a model run uses. No network here.
//   .agents/skills/<name>/evals/evals.json
//   { "skill": "<name>", "version": 1,
//     "trigger": { "should": [prompt, ...], "should_not": [prompt, ...] },
//     "cases": [ { "id": "kebab-id", "prompt": "...", "expected": ["what a good answer does", ...],
//                  "must_not": ["what it must not do", ...], "grounded_in": ["exact text from the skill's files", ...] } ] }
// "grounded_in" is what keeps a case honest: every string must appear, word for word (whitespace aside), in the skill's own
// SKILL.md or one of its other text files, so an expectation cannot drift from, or be invented beyond, what the skill says.
import fs from 'node:fs';
import path from 'node:path';

export const MIN_CASES = 6, MIN_TRIGGER = 3;
const norm = (s) => String(s).replace(/\s+/g, ' ').trim();
const TEXT = /\.(md|mdx|txt|json|ya?ml|php|js|mjs|sh|twig|css)$/i;

export function skillFiles(dir) {
  const out = [];
  (function walk(d) {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      if (e.name === 'evals' || e.name.startsWith('.')) continue;
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p); else if (TEXT.test(e.name)) out.push(p);
    }
  })(dir);
  return out;
}

export function frontmatter(text) {
  const m = String(text).match(/^---\n([\s\S]*?)\n---/);
  if (!m) return null;
  const get = (k) => { const r = m[1].match(new RegExp(`^${k}:\\s*(.*(?:\\n(?![a-z-]+:).*)*)`, 'm')); return r ? norm(r[1].replace(/^['"]|['"]$/g, '')) : null; };
  return { name: get('name'), description: get('description') };
}

// Problems with a skill's SKILL.md itself (reported as warnings: some skills are third-party).
export function skillWarnings(dir) {
  const w = [], f = path.join(dir, 'SKILL.md');
  if (!fs.existsSync(f)) return ['no SKILL.md'];
  const fm = frontmatter(fs.readFileSync(f, 'utf8'));
  if (!fm || !fm.name || !fm.description) return ['SKILL.md has no name and description in its frontmatter'];
  if (fm.name !== path.basename(dir)) w.push(`frontmatter name "${fm.name}" does not match the folder "${path.basename(dir)}"`);
  if (fm.description.length > 1024) w.push(`description is ${fm.description.length} characters (limit 1024)`);
  return w;
}

// The problems with one evals.json (empty list = good). `dir` is the skill folder.
export function validateEvals(dir, data) {
  const p = [], name = path.basename(dir);
  if (!data || typeof data !== 'object') return ['evals.json is not an object'];
  if (data.skill !== name) p.push(`"skill" is ${JSON.stringify(data.skill)}, expected "${name}"`);
  if (data.version !== 1) p.push('"version" must be 1');
  const list = (v) => Array.isArray(v) && v.every((x) => typeof x === 'string' && x.trim());
  const t = data.trigger || {};
  for (const k of ['should', 'should_not']) if (!list(t[k]) || t[k].length < MIN_TRIGGER) p.push(`trigger.${k} needs at least ${MIN_TRIGGER} prompts`);
  if (list(t.should) && list(t.should_not)) for (const x of t.should) if (t.should_not.includes(x)) p.push(`a prompt is in both trigger lists: ${x.slice(0, 50)}`);
  const cases = Array.isArray(data.cases) ? data.cases : [];
  if (cases.length < MIN_CASES) p.push(`needs at least ${MIN_CASES} cases (has ${cases.length})`);
  const haystack = norm(skillFiles(dir).map((f) => fs.readFileSync(f, 'utf8')).join('\n'));
  const ids = new Set();
  for (const [i, c] of cases.entries()) {
    const at = `case ${c && c.id ? c.id : `#${i + 1}`}`;
    if (!c || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(c.id || '')) { p.push(`${at}: "id" must be kebab-case`); continue; }
    if (ids.has(c.id)) p.push(`${at}: duplicate id`); ids.add(c.id);
    if (typeof c.prompt !== 'string' || norm(c.prompt).length < 20) p.push(`${at}: "prompt" is missing or too short`);
    if (!list(c.expected) || c.expected.length < 2) p.push(`${at}: needs at least 2 "expected" assertions`);
    if (c.must_not !== undefined && !list(c.must_not)) p.push(`${at}: "must_not" must be a list of strings`);
    if (!list(c.grounded_in) || !c.grounded_in.length) p.push(`${at}: needs "grounded_in" (exact text from the skill)`);
    else for (const g of c.grounded_in) if (norm(g).length < 12) p.push(`${at}: a grounded_in string is too short to mean anything: ${g}`); else if (!haystack.includes(norm(g))) p.push(`${at}: grounded_in not found in the skill: "${norm(g).slice(0, 60)}"`);
  }
  return p;
}

// ---- model run (prompts and parsing; the HTTP call is in scripts/skill-evals.mjs) ----
export const caseMessages = (skillText, prompt, useSkill = true) => [
  ...(useSkill ? [{ role: 'system', content: `You are a coding assistant. Follow this skill exactly where it applies.\n\n${skillText}` }] : []),
  { role: 'user', content: prompt },
];
export const judgeMessages = (prompt, answer, assertion, negative = false) => [{ role: 'user', content: `You grade an assistant's answer.\n\nUser request:\n${prompt}\n\nAnswer:\n${answer}\n\n${negative ? 'Violation to look for' : 'Requirement'}: ${assertion}\n\nReply with only JSON: {"met": true|false, "evidence": "<short quote or reason>"}. "met" means the answer ${negative ? 'DOES commit this violation' : 'satisfies the requirement'}.` }];
export function parseJudge(text) {
  const m = String(text).match(/\{[\s\S]*?\}/);
  if (!m) return { met: null, evidence: 'judge gave no JSON' };
  try { const j = JSON.parse(m[0]); return { met: typeof j.met === 'boolean' ? j.met : null, evidence: String(j.evidence || '').slice(0, 300) }; } catch { return { met: null, evidence: 'judge JSON did not parse' }; }
}
export const triggerMessages = (skills, prompt) => [{ role: 'user', content: `These skills are available:\n${skills.map((s) => `- ${s.name}: ${s.description}`).join('\n')}\n\nUser request:\n${prompt}\n\nWhich skills, if any, should be loaded for this request? Reply with only JSON: {"skills": ["name", ...]}.` }];
export function parseTrigger(text) {
  const m = String(text).match(/\{[\s\S]*?\}/);
  try { const j = JSON.parse(m[0]); return Array.isArray(j.skills) ? j.skills.map(String) : null; } catch { return null; }
}
