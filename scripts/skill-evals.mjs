// Evals for the skills in .agents/skills.
//   node scripts/skill-evals.mjs list                      which skills have evals, how many cases (deterministic)
//   node scripts/skill-evals.mjs validate [skill]          check every evals.json: shape, enough cases, and every "grounded_in" really in the skill (deterministic; selftest runs it)
//   node scripts/skill-evals.mjs run <skill> [--model M] [--judge-model M] [--endpoint URL] [--only <case-id>] [--baseline] [--no-trigger] [--dry-run]
//       Sends each case's prompt to a model with the skill as its instructions, then has a judge model mark each expectation met or not.
//       --baseline also runs without the skill, to show what the skill adds. --dry-run prints what would be sent and calls nothing.
//       Local first: any Ollama-compatible server. Set LAB_EVAL_MODEL (and OLLAMA_HOST, default http://localhost:11434), or pass the flags.
//       Results go to reports/skill-evals/<skill>/<time>.json. A model run is evidence about one model on one day, not a guarantee.
import fs from 'node:fs';
import path from 'node:path';
import { labRoot } from '../tools/compare/lib.mjs';
import { skillWarnings, validateEvals, caseMessages, judgeMessages, parseJudge, triggerMessages, parseTrigger, frontmatter } from '../tools/skill-evals/lib.mjs';

const root = path.join(labRoot, '.agents/skills');
const argv = process.argv.slice(2);
const [cmd, arg] = [argv[0], argv[1] && !argv[1].startsWith('--') ? argv[1] : undefined];
const flag = (n) => { const i = argv.indexOf(`--${n}`); return i >= 0 ? argv[i + 1] : null; };
const skills = fs.readdirSync(root, { withFileTypes: true }).filter((e) => e.isDirectory() && fs.existsSync(path.join(root, e.name, 'SKILL.md'))).map((e) => e.name).sort();
const evalFile = (s) => path.join(root, s, 'evals/evals.json');
const load = (s) => { try { return JSON.parse(fs.readFileSync(evalFile(s), 'utf8')); } catch (e) { return { __error: e.message }; } };

if (cmd === 'list') {
  let have = 0;
  for (const s of skills) {
    if (!fs.existsSync(evalFile(s))) { console.log(`none  ${s}`); continue; }
    const d = load(s); have++;
    console.log(`${d.__error ? 'BAD ' : 'ok  '}  ${s}  ${d.__error ? d.__error : `${(d.cases || []).length} cases, ${(d.trigger?.should || []).length}+${(d.trigger?.should_not || []).length} trigger prompts`}`);
  }
  console.log(`\n${have} of ${skills.length} skills have evals.`);
} else if (cmd === 'validate') {
  const list = arg ? [arg] : skills;
  let bad = 0;
  for (const s of list) {
    if (!skills.includes(s)) { console.error(`unknown skill: ${s}`); process.exit(2); }
    const problems = fs.existsSync(evalFile(s)) ? (() => { const d = load(s); return d.__error ? [`evals.json: ${d.__error}`] : validateEvals(path.join(root, s), d); })() : ['no evals/evals.json'];
    for (const w of skillWarnings(path.join(root, s))) console.log(`WARN  ${s}: ${w}`);
    if (problems.length) { bad++; console.log(`FAIL  ${s}`); for (const x of problems) console.log(`      ${x}`); } else console.log(`ok    ${s}`);
  }
  console.log(`\n${list.length - bad} of ${list.length} skills pass.`);
  process.exit(bad ? 1 : 0);
} else if (cmd === 'run') {
  const s = arg; if (!skills.includes(s)) { console.error('usage: node scripts/skill-evals.mjs run <skill> (see list)'); process.exit(2); }
  const d = load(s), problems = d.__error ? [d.__error] : validateEvals(path.join(root, s), d);
  if (problems.length) { console.error(`${s}: evals.json has problems; run validate first:\n  ${problems.slice(0, 5).join('\n  ')}`); process.exit(1); }
  const model = flag('model') || process.env.LAB_EVAL_MODEL, judge = flag('judge-model') || process.env.LAB_EVAL_JUDGE || model;
  const endpoint = (flag('endpoint') || process.env.OLLAMA_HOST || 'http://localhost:11434').replace(/\/$/, '');
  const dry = argv.includes('--dry-run'), only = flag('only');
  if (!model && !dry) { console.error('Pick a model: --model <name> or LAB_EVAL_MODEL (an Ollama-compatible server at OLLAMA_HOST, default http://localhost:11434).'); process.exit(2); }
  const skillText = fs.readFileSync(path.join(root, s, 'SKILL.md'), 'utf8');
  const chat = async (m, messages) => {
    if (dry) return '(dry run)';
    const r = await fetch(`${endpoint}/api/chat`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ model: m, messages, stream: false, options: { temperature: 0 } }), signal: AbortSignal.timeout(600000) });
    if (!r.ok) throw new Error(`${endpoint} answered HTTP ${r.status}`);
    return (await r.json()).message?.content || '';
  };
  const result = { skill: s, when: new Date().toISOString(), model, judge, endpoint, cases: [], trigger: [] };
  const cases = d.cases.filter((c) => !only || c.id === only);
  for (const c of cases) {
    for (const withSkill of argv.includes('--baseline') ? [true, false] : [true]) {
      if (dry) { console.log(`[${c.id}${withSkill ? '' : ' baseline'}] ${c.prompt.slice(0, 100)}\n   expects: ${c.expected.length}, must_not: ${(c.must_not || []).length}`); continue; }
      const answer = await chat(model, caseMessages(skillText, c.prompt, withSkill));
      const marks = [];
      for (const [list, negative] of [[c.expected, false], [c.must_not || [], true]]) for (const a of list) { const j = parseJudge(await chat(judge, judgeMessages(c.prompt, answer, a, negative))); marks.push({ assertion: a, negative, ok: j.met === null ? null : negative ? !j.met : j.met, evidence: j.evidence }); }
      const pass = marks.filter((x) => x.ok === true).length;
      result.cases.push({ id: c.id, withSkill, pass, total: marks.length, unjudged: marks.filter((x) => x.ok === null).length, marks, answer });
      console.log(`${withSkill ? 'skill   ' : 'baseline'} ${c.id}: ${pass}/${marks.length}`);
    }
  }
  if (!argv.includes('--no-trigger') && !only) {
    const all = skills.map((n) => ({ name: n, description: frontmatter(fs.readFileSync(path.join(root, n, 'SKILL.md'), 'utf8'))?.description || '' }));
    for (const [list, should] of [[d.trigger.should, true], [d.trigger.should_not, false]]) for (const prompt of list) {
      if (dry) { console.log(`[trigger ${should ? 'should' : 'should not'}] ${prompt.slice(0, 90)}`); continue; }
      const got = parseTrigger(await chat(model, triggerMessages(all, prompt)));
      const ok = got === null ? null : got.includes(s) === should;
      result.trigger.push({ prompt, should, got, ok });
      console.log(`trigger ${ok === null ? 'unparsed' : ok ? 'ok     ' : 'WRONG  '} ${should ? 'should    ' : 'should not'} ${prompt.slice(0, 70)}`);
    }
  }
  if (!dry) {
    const dir = flag('out') || path.join(labRoot, 'reports/skill-evals', s); fs.mkdirSync(dir, { recursive: true });
    const f = path.join(dir, `${result.when.replace(/[:.]/g, '-')}.json`); fs.writeFileSync(f, `${JSON.stringify(result, null, 2)}\n`);
    const w = result.cases.filter((c) => c.withSkill), t = result.trigger.filter((x) => x.ok !== null);
    console.log(`\n${s} with ${model}: ${w.reduce((a, c) => a + c.pass, 0)}/${w.reduce((a, c) => a + c.total, 0)} expectations met; trigger ${t.filter((x) => x.ok).length}/${t.length}. Wrote ${path.relative(labRoot, f)}`);
  }
} else { console.error(fs.readFileSync(new URL(import.meta.url), 'utf8').split('\n').slice(1, 11).map((l) => l.replace(/^\/\/ ?/, '')).join('\n')); process.exit(2); }
