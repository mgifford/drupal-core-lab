# AI usage, Phase 0: baseline measurements (2026-10-15)

DRAFT until a person has reviewed it. Produced by two scripts that read only local files; neither calls a model or fetches anything. Findings and reasoning: [FINDINGS.md](FINDINGS.md). Raw numbers: `baseline.json`, `sessions.json`.

## How to reproduce

    node scripts/usage-baseline.mjs --json reports/ai-usage/phase-0/baseline.json   # prompt size and composition, limits, repair cost (recorded fixtures)
    node scripts/session-usage.mjs [--tools] [--json <file>]                         # usage of recorded Claude Code sessions (numbers only, no message text)
    node --test tests/lab/ai-usage.test.mjs                                          # the tools measure what they say (fixture frozen, no text leaks)

The two `*-live` rows are prompts written by a live `issue-pack.mjs prepare` run on 2026-10-15 (read-only requests to drupal.org and git.drupalcode.org) and kept outside the repository; reproduce them by running `prepare` again (the issue text may have changed), then `usage-baseline.mjs --prompt <label>=<file>`. The other rows are offline. Units: UTF-8 bytes and words are measured; `~tokens` is bytes/4, a rough ratio and not a tokenizer count (none is available offline). Repository: base commit `099722e`.

## Prompt size and composition

```text
Prompt composition (bytes; ~tokens = bytes/4 is a rough ratio, not measured). Commit 099722e.
case                     total   ~tokens  words  instructions  issue(hdr+sum+att)  comments  diff   comments n (median/max)
3618230                   28735      7184    4172         18.4K                 3.0K       1.1K    4.8K       10 (90/207)
3618230 --ai-recipe       29592      7398    4315         19.3K                 3.0K       1.1K    4.8K       10 (90/207)
long-discussion           42405     10601    6100         18.4K                 1.0K      20.1K    1.2K     120 (92/1018)
no-mr                     24055      6014    3773         18.4K                 3.0K       1.1K    0.3K       10 (90/207)
3604037-live              80761     20190   10736         18.4K                 9.6K      20.3K   29.9K     55 (130/2818)
3619127-live              35772      8943    5261         18.4K                 3.2K       5.6K    7.0K       41 (80/697)

Instruction block parts (bytes): instructions-intro 538, rules 4687, catalogue 1462, checks 4440, pack-format 1007, example 6526, closing 220

Planted facts present in the prompt: 7/7 (D1 PROP_A D2 PROP_B U1 R1 INJ1). Injected marker line quoted: true; raw marker line left: false.

Limits visible to the assistant? comments: 1100 served, 1000 in the prompt, told of the cut: false (header says "Comments: 1000"); attachments: 35 served, 30 listed, told: false; diff: 400 KB served, 300 KB in, told: true.

No merge request: prompt marks 1 of 3 inputs @@MISSING@@; a pack without issue.fork_branch is rejected: issue.fork_branch

Repair cost for the current "send the complete corrected file" message (bytes):
pack                                        packBytes  errors  warnings  repairMessage  fullReply(lower bound)
verified pack, one field broken                  6733       1         0            245                    6733
example-free-form-recipe.yml                     7238       0         0              0                    7238
llm-draft-constant-probe.yml                     3761       0         3           1502                    3761
llm-draft-no-article-no-checks.yml               3716       0         3           1495                    3716
llm-draft-nothing-tells-before-from-after.       7185       0         4           1773                    7185
llm-draft-phantom-global.yml                     6240       0         2           1618                    6240
llm-draft-recipe-sets-no-state.yml               4177       0         2           1090                    4177

Replica of the prompt template matches `issue-pack.mjs prompt`: true
```

Columns: `instructions` is the constant block (rules, catalogue, check templates, pack format, worked example); `issue` is header, summary and attachment list; the comment counts show (median/max bytes). Comparison targets use these bytes: long-discussion total 42,405; comments 20,584; issue-dependent part (summary + comments) 20,949.

## Recorded sessions (Claude Code transcripts of this project and its worktrees)

```text
session   date        title                              calls  userTurns  firstCtx  avgCtx  fixed%  input  cacheWrite  cacheRead  output(thinking)  toolCalls  toolResultKB  errors  repeatReads  usd(est)  apiMin  toolMin  client/model
7acff364  2026-10-02  Drupal core accessibility lab set     69          8       77k    194k     40%     140        216k       13.2M          89k(31k)         74          1888       3            1      4.75    19.7      4.2  2.1.286 claude-sonnet-5-5
381de1b9  2026-10-02  review the code                      593        122       69k    379k     18%      1k        4.2M      220.6M        684k(281k)        519           516      11            0     75.75   130.9     81.9  2.1.286 claude-sonnet-5-5
9aaeddd5  2026-10-05  Drupal core lab: next-week review      1          1       70k     70k    100%       2         70k           0            130(0)          1             0       1            0      0.28     0.1      0.0  2.1.286 claude-sonnet-5-5
2fc4e859  2026-10-14  Drupal issue 3618230                 206         27       78k    273k     29%     414        1.0M       55.2M         186k(55k)        197           349       8            0       n/a     n/a      n/a  2.1.295 claude-opus-5-5
09580209  2026-10-14  Fix scripts/lint.mjs: DDEV GIT_DI    155         20       79k    207k     38%     310        277k       31.9M          92k(34k)        136           153       8            0     11.48    22.1     17.7  2.1.295 claude-opus-5-5
a0fe63d8  2026-10-15  Add scripts/try-tests.mjs: run pr     86          3       81k    250k     32%     172        367k       21.2M         173k(95k)         93           236       5            0       n/a     n/a      n/a  2.1.295 claude-sonnet-5-5
```

Column meaning: see the header of `scripts/session-usage.mjs`. `usd(est)`, `apiMin` and `toolMin` come from the client's cost record, which two sessions lack (`n/a`); the USD figure is the client's estimate, not an invoice. The last row (`a0fe63d8`) is the session that produced these tools and was still being written when sampled: partial. `9aaeddd5` is a one-call session.

## Sources and fixtures (hashes)

- `prompts/issue-pack-chat-prompt.md`: 7817 bytes, sha256 2a7810316117...
- `prompts/issue-pack-recipe-rule.md`: 1346 bytes, sha256 6dab075027ed...
- `docs/examples/issue-pack-3415961.yml`: 6420 bytes, sha256 a08f71b18730...
- `catalogue`: 1402 bytes, sha256 bb930beabec5...
- `checks`: 4379 bytes, sha256 3ef2e0485c4c...

Synthetic fixture `tests/issue-pack/fixtures/long-discussion/` (regenerate with `generate.mjs`; a test checks the committed bytes equal the generator output):

- `branches.json sha256 74fe70331d8f...`
- `comments-0.json sha256 40b6813397ac...`
- `comments-1.json sha256 7ea157325e93...`
- `comments-2.json sha256 b7eedfe9a3b5...`
- `facts.json sha256 fb2061f49012...`
- `mr.diff sha256 9f4a64f64271...`
- `mrs.json sha256 94aae7c72663...`
- `node.json sha256 93dbc58f5355...`

## Existing tests, run before any change

`node --test tests/issue-pack/*.test.mjs tests/lab/*.test.mjs` (with js-yaml installed under `tools/compare/.deps`): 168 tests, 167 pass, 0 fail, 1 skipped ("generated probes give the right answers in Chromium": Playwright is not installed in this worktree). `node scripts/selftest.mjs`: passed.

## Missing values

- Tokenizer-exact input, output, cached and reasoning tokens for the pack chat: its client, model and billing are not recorded; the pack path has no usage record.
- Actual cost or plan consumption: only the client's estimate exists, for 4 of 6 sessions; the billing mode (API or subscription) is not in the transcripts.
- How often repairs happen in real use; how many chat turns a pack takes.
- Per-stage attribution inside a session; time to a verified comparison; setup time was not re-measured (docs: 10 to 20 min local, about 7 min in Coder).
- Any measurement of model understanding of a brief (Phase 0 has no brief); mechanical retention is measured only as "planted anchors present in the prompt" (7 of 7 today, because nothing is compacted yet).
