# AI usage, Phase 2 (option B): fewer calls per task (2026-10-15)

DRAFT until a person has reviewed it. Base commit `b4ae1f1` (Phase 1). Nothing pushed.

## What the recorded sessions say (this decides what to build)

`node scripts/session-usage.mjs --sequences` ranks the call sequences that repeat, by the context their later calls read (what one command would avoid).
Six sessions, 1,004 tool-using calls, 384M input-side tokens. Data: `sequences.json` (the last session, `a0fe63d8`, built these tools and was still being written).

- **No repeated lab-command sequence is worth wrapping.** The best real one (`issue-pack` repeated, then `pack-validate`) is 0.49% of all input-side tokens; the
  ten best together are at most 3.9% (they overlap, so that is an upper bound) and are mostly one session iterating on the pack tooling itself. Calls to lab
  scripts (`lab-env`, `evaluate-*`, `lint`, `coverage`, `check-draft`, `setup`) are each 1 to 2% of calls and do not chain the same way twice.
  A wrapper for the `AGENTS.md` "Start here" sequence would be built on a pattern the sessions do not show.
- **The one pattern that does repeat is locate-then-read:** `grep -> sed` (5 times, 2 sessions), `ls -> cat` (4 times, 3 sessions), `grep -> cat` (2 sessions). Exploration calls
  (`grep`, `cat`, `sed`, `ls`, `Read`) are 170 of 1,004 calls (16.9%) and read 12.3% of the input-side tokens. If every such chain of 3 calls became 1, the ceiling is
  about 8.2% of input-side tokens. Realistic effect is a fraction of that (only symbol lookups collapse; adoption is partial), so expect low single digits.
- Same-call repeats are iterations (fix, run, fix): `issue-pack` 4 runs of 3 or more (12 calls, 6.9M), `check-draft`, `coder`. Not collapsible; the lever there is
  a smaller first result, which `try-tests.mjs` already is for tests.

## What was built

| File | What |
|---|---|
| `scripts/code-map.mjs` (new) | One call for "where is it, what does it do, who uses it, what tests it": the definition with doc line, signature and body (cut at `--lines`), for a class its members, what the body calls in the same file, other files that use it (tests apart, config and templates counted), and the next command. A file path gives an outline (PHP, JS, YAML keys, Twig blocks). Deterministic and read-only; `git grep` over tracked and untracked, not-ignored files (so files a patch added are found), skipping vendored and minified code, with bounded output. |
| `scripts/session-usage.mjs` | New `--sequences`: ranking of repeated sequences, the call mix, same-call runs; bash categories now name every lab script in a chained command. |
| `scripts/code-map-benchmark.mjs` (new) | The measurement below, repeatable on any checkout. |
| `tests/lab/code-map.test.mjs` (new, 9), `tests/lab/ai-usage.test.mjs` (+1) | Fixture checkout with strings and comments containing braces, an interface method, `Class::member` against another class's same-named method, vendored and ignored files, an untracked file, 60-file fan-out, JS, YAML, Twig, bounds, read-only. |
| `AGENTS.md` | One line in the command list (about 230 bytes added to the starting context). |

## Measured: calls and bytes put into the conversation, 6 fixed lookups in `baseline-3618230-latest` @3b94128e929

The manual chain is **modelled** (grep for the word, `sed` of the exact body, grep in tests), generous to the manual side (vendored code skipped, exact region read).
Calls are saved by construction; bytes are measured by running both.

| Lookup | Manual calls | Manual bytes | code-map calls | code-map bytes |
|---|---|---|---|---|
| method `ManagedFile::uploadAjaxCallback` | 3 | 1,566 | 1 | 2,323 |
| method with many callers `Xss::filterAdmin` | 3 | 7,911 | 1 | 2,751 |
| class `ManagedFile` | 3 | 3,698 | 1 | 2,445 |
| JS `Drupal.announce` | 3 | 6,188 | 1 | 4,991 |
| hook-like word `status_messages` | 2 | 10,840 | 1 | 2,770 |
| outline of `ManagedFile.php` | 1 | 858 | 1 | 917 |
| **total** | **15** | **31,061** | **6** | **16,197** |

Calls 15 to 6; bytes down 48%. It is not smaller everywhere: for a small, rarely used method the map is larger (it adds callers, calls and tests the chain
did not fetch). Where it wins on bytes is common names, because the output is capped (`--refs`, `--lines`) and the rest is one more call away.

## Checks

- 196 tests, 195 pass, 1 skipped (Playwright is not installed here); `node scripts/selftest.mjs` passes. Negative controls: removing string handling from the brace matcher fails 2 tests; dropping untracked files fails 1.
- Found by running it on the real checkout, not by the tests: the macOS `git grep -E` has no `\b`, so class definitions were silently missed (fixed with an explicit boundary, covered by the tests); a `Drupal.x` lookup first showed an unrelated method named `x`.

## Not claimed, and limits

- **No recorded session has used `code-map` yet**, so the saving in a real session is **not measured**. The ceiling (8.2%) and the benchmark are all there is.
  To measure it: after a few sessions run `node scripts/session-usage.mjs --sequences` and compare against this baseline: exploration 16.9% of calls and 12.3% of input-side
  tokens; `grep -> sed` and `ls -> cat` chains. An assistant has to choose to use it; the `AGENTS.md` line is the only nudge.
- The body is found by brace matching (strings, comments, `#[` attributes handled; heredocs and JS regex literals are not): if the end is not found it says so and shows `--lines` lines.
- It does not parse PHP; "calls" lists `$this->`, `self::`, `static::` and `Class::method(` patterns in the body. A lookup takes 1 to 4 s (about 10 s of CPU across cores) on a full core checkout.
- A modelled chain is not a recording; the manual side could be smarter than modelled (a narrower grep) or sloppier (reading a whole file).

## Rollback

Revert the commit. `code-map` is additive; `--sequences` is a new flag; the category change only renames Bash rows in `--tools` output for chained commands.
