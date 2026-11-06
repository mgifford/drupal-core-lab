# Skill evals

Every skill in `.agents/skills/<name>/` has `evals/evals.json`: what the skill should trigger on, and cases that test its rules.
`node scripts/skill-evals.mjs list` shows coverage.

## Format

- `trigger.should` and `trigger.should_not`: at least 3 each. Prompts that should load the skill and near-misses that should not.
- `cases`: at least 6. Each has an `id`, a `prompt`, `expected` assertions (at least 2) a judge can mark met or not, optional `must_not`
  assertions, and `grounded_in`.
- `grounded_in` is text copied word for word from that skill's own files. This is what stops an eval from asserting something the
  skill never says, and from going stale quietly: when the skill is edited and the sentence disappears, validation fails and the
  case must be updated with it.

## Two levels

| Level | Command | Needs a model | Runs in |
|---|---|---|---|
| Structure and grounding | `node scripts/skill-evals.mjs validate [skill]` | no | `selftest` and CI |
| Does a model follow the skill | `node scripts/skill-evals.mjs run <skill> --model <m>` | yes | on a person's machine |

`run` sends each prompt to a model with `SKILL.md` as its instructions, then has a judge model mark each assertion. `--baseline` also
runs without the skill, so the difference is the skill's contribution. It also tests triggering: given every skill's description, does
the model pick this skill for the `should` prompts and not for the `should_not` ones? Local first: any Ollama-compatible server
(`OLLAMA_HOST`, default `http://localhost:11434`; `LAB_EVAL_MODEL`). Results go to `reports/skill-evals/<skill>/` (or `--out <dir>`).

A run is evidence about one model on one day. A small local model judging itself is noisy: read the `evidence` text on anything
surprising before changing a skill because of it. `--dry-run` prints what would be sent.

## When you change a skill

Edit the skill, run `validate`, update any case whose `grounded_in` text moved, and add a case for a new rule.
