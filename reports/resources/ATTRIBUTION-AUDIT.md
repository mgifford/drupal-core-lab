# Unknown activity: audit and remediation candidates

Generated from the local ledger and local Claude Code transcripts. No AI model was called. The numbers are for the
period 2026-10-02 to 2026-11-23 and are reproducible with:

```bash
node scripts/resource.mjs audit
node scripts/resource.mjs audit --json=/tmp/attribution-audit.json
node scripts/session-usage.mjs --tools --sequences
```

This report distinguishes **activity Unknown** from **issue unattributed**. They are independent dimensions: an event can
have a known activity and no Drupal issue, or an Unknown activity on a known issue. Aggregating them was a flaw in the
earlier single-number view.

## What changed in the measurement, before interpreting the numbers

| Aspect | Historical baseline (archived) | Current |
|---|---|---|
| Token total | 812,783,208 | 812,783,208 (same source total) |
| Accounting unit | Session; tokens split by tool-call share | One event per provider message id where the source reconciles |
| Unknown activity | 274,631,430 tokens (33.8%), 688 requests | 135,999,107 tokens (16.7%), 392 requests |
| Code exploration | 200,426,180 tokens (24.7%) | 237,103,821 tokens (29.2%) |
| Patch development | 65,585,998 tokens (8.1%) | 259,599,082 tokens (31.9%) |
| Validation | 109,952,202 tokens (13.5%) | 30,067,507 tokens (3.7%) |
| Drupal issue unattributed | 744,513,755 tokens | 744,513,755 tokens (same) |
| Activity basis | Heuristic tool-call-share allocation | Primary operation of each request; all components retained |

**The Unknown share fell because the measurement unit and rule set changed, not because fewer tokens were consumed.**
No token total fell. Request context is associated with the activity happening at that request; it is not proven to be
caused by that activity. The patch-development increase is largely requests that write files (including Python/Node
heredocs) whose whole context is now associated with the write, rather than being spread over all tool calls in the
session.

## Unknown reasons

| Reason | Events | Tokens | Model requests | Operations | What it means |
|---|---:|---:|---:|---:|---|
| `model_only_request` | 231 | 80,996,080 | 231 | 0 | The provider request contains no tool invocation. It is a real request and stays visible; there is no tool-based activity evidence. |
| `compound_command` | 137 | 44,997,860 | 137 | 140 | A shell command mixed a resolvable operation with an unresolved one, or a heredoc/inline code body had no determinable purpose. |
| `unrecognized_command` | 24 | 10,005,167 | 24 | 24 | A simple command or script has no registry rule. |

No `parser_error`, `unrecognized_tool`, `ambiguous_activity`, or `missing_usage` remained after the parser fixes in this
change; the categories stay in the schema for future data.

### Model-only requests are the largest recoverable-looking group, but are not recoverable by a classifier

231 requests carry 81.0M tokens and no tool call. They are the model continuing to reason or write after a tool result.
Attributing them to the preceding tool's activity would be an inference, not measurement: the request may be planning
the next step, drafting the answer, or reconsidering the previous one. The current system keeps them Unknown with a
specific reason. Recovering them would need turn-level task metadata from the client, which the transcript does not
provide. **Recommendation: keep Unknown; do not add a heuristic attribution solely to lower the share.**

### Compound commands: 45.0M tokens

These are not one class. Local inspection of the representative sequences shows:

- commands that chain a known lab script with `cd`, `git status`, `echo`, `tail`, or a redirect (plumbing already
  ignored);
- inline Python/Node heredocs whose write/read/test purpose is not distinguishable from the command line;
- commands that mix two substantive operations (for example a validation run and a historical lookup).

The deterministic primary-operation rule already resolves the cases where one operation is clearly substantive. The
remaining cases need either a narrower command, a named lab script, or a rule for a specific program. Candidate fixes,
ranked by evidence:

1. **Prefer one lab script per intent** when the same multi-step command recurs. The project already has scripts for most
   of these flows; a chained command is harder to classify and re-reads context after each step.
2. **Add registry rules for recurring, documented scripts** (the `LAB_SCRIPTS` table). This is the lowest-risk fix and is
   tested.
3. **Do not classify inline code from its content beyond deterministic write/read/test signals.** The current signals are
   labelled heuristic; a larger classifier would need message text and is deliberately out of scope.

### Unrecognized commands: 10.0M tokens

24 operations. The current candidate list is dominated by inline `node -e` / `python3 -c` / `python3 -` code and a few
one-off programs. Each needs a named rule or a wrapper script before it can be classified without guessing. The
tests include negative controls so a new rule cannot silently turn `node` into validation or `git` into exploration.

## Attribution coverage

- Activity: 1,956 of 2,348 counted events classified (83.3% of events and 83.3% of tokens).
- Model requests: 1,843 of 2,235 classified (82.5%). The difference from the event count is the 54 model-eval requests,
  which are already classified.
- Tool operations: 2,155 recorded, 164 inside Unknown events (92.4% of operations are in a classified event).
- Drupal issue: 8.4% of tokens are attributed to an issue. This is a separate gap and is unchanged from the historical
  report; it is not a classification failure.
- Explicit task: one local task record now exists (`issue-3619127`, `accessibility-evaluation`, `completed_verified`,
  verified by the owner, no mapped session, expected deliverable `accessibility-findings`). It has zero request events,
  so it appears in the task view with no resource attribution and `data_completeness: unavailable`. 113 events carry
  non-session task ids from process, CI and model-eval records, but those are not development-task declarations. 2,181
  request events are associated with a session task id; a session is not one task. The missing resource association is
  explicit, not zero consumption.

## Reconciliation

- 10 of 10 Claude sessions matched: 2,181 request events sum to 812,265,879 tokens, equal to the session total.
- 2,740 duplicate usage records were collapsed by provider message id.
- 0 requests had missing usage.
- 231 tool-free requests and 165 multi-tool requests are included.
- No session total and its request events are both counted.

## What is not fixable with this telemetry

- Provider requests whose activity is only in hidden system/tool context.
- Tool-free thinking/output requests without a task association.
- Inline code whose purpose is not expressed by a write/read/test signal.
- Other AI clients: only Claude Code transcripts are adapted today.
- Attachments: only references are captured by default; a ZIP or patch is not inspected unless explicitly requested,
  and inspection does not prove model ingestion.
- Verified outcomes: a successful command is not a verified task outcome; evidence review remains human.

## Reproduce a case

```bash
node scripts/resource.mjs audit --json=/tmp/a.json
node scripts/session-usage.mjs --tools --sequences
node scripts/session-usage.mjs --provenance /tmp/p.json <transcript.jsonl>
```

The second command prints no message text. The third writes prompt metadata; add `--prompt-content <dir>` only when raw
local prompt text is genuinely needed. Keep that directory out of Git.
