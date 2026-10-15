# AI usage, option C: scope the starting context (2026-10-15)

DRAFT until a person has reviewed it. Base commit `0eade57` (option B). Nothing pushed.

## How it was measured (new, and better than what Phase 0 used)

`node scripts/context-size.mjs` runs the command-line client's local `/context` command in print mode: the **client's own count** of what a session starts with, no model
call. Phase 0 estimated from attachment sizes in transcripts (bytes/4), which under-counted markdown: `AGENTS.md` is 21,612 bytes and the client counts **8.6k tokens**
(2.5 bytes per token), not the 5k that bytes/4 gives. Phase 0's "the repository controls about 6% of the starting context" was wrong; it was about a quarter.

What the command-line client starts with (before any change), 34.3k tokens: `AGENTS.md` 8.6k (25%), skills 10k (29%), system tools 8.6k (25%), the owner's global
`INSTRUCTIONS.md` 2.4k, system prompt 2.4k, agents 0.7k, MCP 1.4k. A desktop-app session starts with about 69k to 81k (`firstCtx` in `session-usage.mjs`): the app adds its
own tool and server instructions, which this number does not include and the repository does not control.

## Finding 1: scoping the skill list does not reduce the starting context (corrects Phase 0)

The real mechanism is `skillOverrides` in a settings file (`off`, `name-only`, `user-invocable-only`; one entry per skill, no wildcards; plugin skills are not covered;
a `permissions.deny` rule did not change the listing). Tested with `claude -p "/context" --settings <file>`, three profiles:

| Profile | Skills | System tools | Total |
|---|---|---|---|
| none | 10.0k | 8.6k | 34.3k |
| A: the 66 spec-kitty skills `off`, the 40 accessibility skills `name-only` | 6.3k | 12.2k | 34.3k |
| B: A, and the other unrelated user skills `off` | 5.5k | 12.9k | 34.3k |

Every token taken out of the skill listing came back as tool schemas moved from "deferred" to inline: the total does not move. So **do not scope skills to save tokens**; Phase 0's
option C for the owner's configuration is withdrawn. (It might save a `ToolSearch` call now and then; those are 3 of 1,004 calls in the recorded sessions.) Nothing in the
owner's configuration was changed.

## Finding 2: `AGENTS.md` was the one block the repository controls, and it could be cut by two thirds

Moved verbatim into on-demand documents, with a short index and a "read on demand" table left in `AGENTS.md`:

| Section of the old `AGENTS.md` | Now in |
|---|---|
| The workflow (full command usage) | `docs/COMMANDS.md`; a one-line-per-command index stays in `AGENTS.md` |
| Environments, how an environment is made, manual fallback, teardown | `docs/ENVIRONMENTS.md` |
| Known pitfalls | `docs/PITFALLS.md` |
| Changing the viewer (including its security rules) | `docs/VIEWER-DEV.md` |
| Where results go | `docs/RESULTS-LAYOUT.md` |

Kept in `AGENTS.md`: what the repository is, the precedence line, the start-here sequence, the command index (with the `code-map` and `try-tests` nudges), the read-on-demand table, and
all 11 rules for agents, plus a new rule 12 that carries the Coder safety sentence from the viewer section. The first line now says to read the **first 18 lines** of `AI-LEARNING.md`
(how this owner works, about 1k tokens) instead of the whole file (19.6 KB), and to search the rest when something fails.

Checked: every non-empty line of the old `AGENTS.md` is in the new `AGENTS.md` or one of the five documents, except the old first line and the headings of the moved sections (8 lines, all
intended). `check-docs.mjs`: 337 references in 92 documents, 0 missing (it validates the moved text's paths too). The pointers elsewhere (`README.md`, `docs/README.md`,
`docs/FIRST-RUN.md`, `envs/README.md`, `tools/compare/README.md`, `scripts/lab-site.sh`, one line of `AI-LEARNING.md`) were updated.

## Measured, with the same counter

| | Before | After |
|---|---|---|
| `AGENTS.md` | 8.6k tokens (21,612 bytes) | **2.9k** (7,085 bytes) |
| Memory files | 11.3k | 5.6k |
| Starting context, command-line client | 34.3k | **28.6k** (-5.7k, -16.6%) |
| `AI-LEARNING.md` when followed | 19.6 KB read | first 18 lines, about 1k tokens |

Data: `context-before.json`, `context-after.json`.

**Expected effect on a desktop session, not yet measured:** the first call should be about 5.7k tokens smaller (about 7% of 75k). If the fixed part stays about 30% of all input-side
tokens (Phase 0), that is about 2% of a session's input-side tokens, more when `AI-LEARNING.md` would have been read. Verify with `firstCtx` in `node scripts/session-usage.mjs`
after the next desktop session (baseline 78k to 81k) and with `node scripts/context-size.mjs` (28.6k).

## Risks and what was not done

- An assistant may not open `docs/PITFALLS.md` when something fails; the table in `AGENTS.md` says when, and `PITFALLS.md` opens with the search command. If a known pitfall is hit again, that is the signal to move that row back.
- Not changed: the owner's global `INSTRUCTIONS.md` (2.4k tokens, loaded in every project) and the skill list; both are the owner's. The desktop app's own additions are not measurable from here.
- `AI-LEARNING.md` itself is unchanged apart from one pointer: its standing rules sit in its first 18 lines, so that is a convention, not a split.

## Rollback

Revert the commit: the five documents disappear and `AGENTS.md` returns to its old text.
