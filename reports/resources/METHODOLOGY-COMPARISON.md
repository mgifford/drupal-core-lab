# Methodology comparison: legacy session allocation and request-level accounting

This compares the archived baseline of 2026-11-23 with the request-level accounting added the same day. It exists so a
reader does not mistake a classification change for a reduction in resource consumption.

- Archived baseline: [archive/2026-11-23/BASELINE.md](archive/2026-11-23/BASELINE.md) and its JSON.
- Current baseline: [BASELINE.md](BASELINE.md).
- Source data: the same 10 Claude Code transcripts, 54 model-eval trials, 100 GitHub Actions runs/jobs, Docker samples and
  measured local commands.
- No model was called to produce either report.

## What is genuinely measurable and unchanged

| Measure | Archived | Current | Comparable? |
|---|---:|---:|---|
| Provider-reported tokens | 812,783,208 | 812,783,208 | Yes — same source total |
| Uncached input | 4,380 | 4,380 | Yes |
| Cache creation | 12,858,965 | 12,858,965 | Yes |
| Cache read | 796,812,969 | 796,812,969 | Yes |
| Output | 2,636,967 | 2,636,967 | Yes |
| Reasoning (included in output) | 1,084,537 | 1,084,537 | Yes |
| Model requests | 2,235 | 2,235 | Yes (2,181 Claude + 54 eval) |
| Client-estimated cost | $237.19 | $237.19 | Yes, but not an invoice |
| Drupal issue unattributed | 744,513,755 | 744,513,755 | Yes — same gap |

The token and request totals reconcile exactly. Request-level accounting did not discard or duplicate usage.

## What changed

| Activity | Archived tokens | Archived share | Current tokens | Current share | Method difference |
|---|---:|---:|---:|---:|---|
| patch-development | 65,585,998 | 8.1% | 259,599,082 | 31.9% | Requests whose most frequent operation is a write/edit (including heredoc writes) carry their full request context instead of a tool-call share |
| code-exploration | 200,426,180 | 24.7% | 237,103,821 | 29.2% | Requests whose most frequent operation is a read/search are exploration; multi-tool requests are not split equally |
| unknown | 274,631,430 | 33.8% | 135,999,107 | 16.7% | Request-level evidence resolves many mixed sessions; remaining Unknown has an explicit reason, including 81.0M tokens in tool-free requests |
| environment-setup | 40,917,862 | 5.0% | 79,624,158 | 9.8% | Environment requests carry whole request context; legacy split them by all tool calls |
| validation | 109,952,202 | 13.5% | 30,067,507 | 3.7% | Validation requests are associated directly; process and CI events are separate |
| issue-intake | 70,710,563 | 8.7% | 29,681,226 | 3.7% | Direct request association |
| other activities | 50,558,973 | 6.2% | 40,708,307 | 5.0% | Mixed |

**Neither column is an estimate of avoidable tokens.** A request's provider-reported input includes the whole prior
conversation and instructions. Request-level accounting answers “which activity was happening when this context was
processed”, not “this activity caused these tokens”.

## Why Unknown fell

The reduction is not evidence that the agent became more efficient. It has three measurement causes:

1. **Unit change.** A session is no longer forced to have one dominant activity. Each observable request is classified.
2. **Primary-operation rule.** A compound command or multi-tool request with one substantive operation and some plumbing
   is attributed to the primary operation; all components are still recorded and the result is labelled `heuristic`.
3. **Better parsing.** Loops, assignments, redirects, subshells and heredoc writes are parsed conservatively rather than
   landing in Unknown. Inline code is classified only from deterministic write/read/test signals.

Two causes push in the opposite direction and keep Unknown honest:

- 231 tool-free requests (81.0M tokens) are now explicit `model_only_request` Unknown; the legacy session split could
  silently assign those tokens to exploration or validation.
- Requests whose operations genuinely span several strong activities remain Unknown (`ambiguous_activity`) or are marked
  heuristic with a note.

## Why code exploration looks different

The archived 24.7% came from splitting every session's tokens by tool-call share. A session with 60% exploration calls
was assigned 60% of all its tokens, including context processed while validating or writing a file. The current 29.2%
associates each request's context with the operation at that request and lets the most frequent operation in a multi-tool
request win. A request with several reads and one edit is now exploration; a request with several edits and one read is
patch development. The `scripts/session-usage.mjs --sequences` view is a third, independent basis: it measured exploration
calls at 16.9% of calls and 12.3% of input-side tokens in the earlier six-session sample. These are different questions,
not contradictory answers.

## Why patch development looks larger

Writing a file is a high-context request: the model has the whole conversation available while it produces the edit.
The legacy split assigned most of that context to whatever tool calls dominated the session. The current method assigns
it to patch development and records the components. This makes the “where did the reading happen” view more
understandable, but it can overstate the incremental cost of the write itself. Read the cache-read total and the
per-request context size alongside it; do not read the patch-development share as “editing cost 281M tokens”.

## Comparability rules

- Compare token totals, cache categories, request counts and cost across methodologies.
- Do not compare activity shares across methodologies without naming the method.
- Do not compare a period with request-level coverage to a period with legacy-only coverage as if coverage were equal.
- Do not treat a lower Unknown share as an efficiency improvement.
- Compare task-level or session-level metrics only when the same model, task complexity, starting revision, starting
  context, available tools, environment and deliverables are documented.

## Reproduce

```bash
node scripts/resource.mjs audit
node scripts/resource.mjs report --write --baseline
node scripts/resource.mjs report --check
node scripts/resource.mjs export --out=cloud/resources.json
```

The archived JSON has no `attribution` or `reconciliation` section; it predates request-level accounting. The current
JSON does. A future comparison should keep the archived files unchanged and add a new dated archive.
