# AI usage: a small paired model evaluation of the compact brief and the targeted repair (2026-10-15)

DRAFT until a person has reviewed it. Authorized by the owner ("a paired comparison would be useful"). Run with `node scripts/model-eval.mjs run --yes`; tables regenerate with
`node scripts/model-eval.mjs report`. Per-trial outcomes: [trials.json](trials.json) (no reply text); the tables: [RESULTS-TABLES.md](RESULTS-TABLES.md). The raw replies are in `.lab-cache/model-eval/` and are not committed.

## Setup, held constant on both sides of every pair

`claude -p` 2.1.287, model `claude-sonnet-5-5`, no tools, no user or project settings, no session, no slash commands, default effort; one fresh process per call; the same wrapper text
for both conditions. 54 calls, 0 failed, about $2 as the client reported it (subscription allowance, not an invoice). 3 trials per cell, so read the individual outcomes, not percentages.
The client adds a variable overhead of about 3,600 input tokens to some calls whatever the prompt, so input tokens are compared at their lowest per cell.

## A. Does the compact brief lose anything a model needs from a long thread?

Four synthetic threads of 120 comments (the long-discussion fixture, then the planted facts moved to other comments and renamed twice, then a recall test). Six questions with known answers
(the maintainer's constraint, the current proposal, the dropped proposal, the open accessibility question, the merge request tip, whether the model followed an instruction hidden in a comment), scored by fixed patterns.

| Thread | Full text, score per trial (of 6) | Compact brief, score per trial |
|---|---|---|
| V0, V1, V2 (planted facts in comments the intake patterns select) | 6, 6, 6 each | 6, 6, 6 each |
| V3, the older maintainer decision worded without any of the words the patterns look for | 6, 6, 6 | **5, 5, 5** |

- On V0 to V2 **no difference was detected**: 9 of 9 trials each side answered every question correctly. This is a ceiling effect: the questions are easy for this model even from the full text, and the facts sit exactly where the brief looks. It shows the brief keeps what it selects; it is weak evidence about threads that differ from these.
- **V3 shows the known risk, measured.** With the decision phrased as "Speaking as a maintainer: public API is off the table here ... a committer needs to agree before anyone reopens that", the brief does not select that comment (it is listed by number only), and the model answering from the brief missed the constraint in all 3 trials. The full text answered it in all 3. The brief says plainly that older comments are omitted and how to read them, but a model that does not ask will not know.
- Input tokens, at the lower client overhead: about 10,400 for the full text and about 2,100 to 2,200 for the brief, **about 80% fewer**. Output tokens were the same (median 340 to 390). Cost per call fell from about $0.054 to about $0.021 (low-overhead cells).

## B. Does a model repair a pack as reliably when asked for a small edit?

Five broken packs (three with one wrong field, two recorded drafts with 2 and 3 validator findings). Whole-file condition: the existing repair message, the model sends the complete file. Targeted condition: `--targeted` message, the model sends an edit.
Scored by the real validator and a comparison of every value: 1 when every finding is fixed, no error or new finding appears and nothing else changed.

| Case | Whole file, score per trial | Targeted edit, score per trial | Median output tokens, whole file to edit |
|---|---|---|---|
| wrong fork branch | 1, 1, 1 | 1, 1, 1 | 2,339 to 104 |
| title too short | 1, 1, 1 | 1, 1, 1 | 2,299 to 105 |
| markup in a note | 1, 1, 1 | 1, 1, 1 | 2,280 to 93 |
| phantom global (2 findings) | 0, 1, 0 | **1, 1, 1** | 2,088 to 723 |
| constant probe (3 findings; one needs recipe knowledge the pack lacks) | 0, 0, 0.67 | 0, 0, 0 | 2,012 to 765 |

- All 15 targeted edits were well formed and applied; none was refused. On the three one-field cases both ways worked every time, and the edit used about 4% of the output tokens.
- **Unrelated changes:** in 2 of the 3 whole-file replies for the phantom-global pack the model also rewrote `notes`, a field nobody asked it to touch. A targeted edit cannot do that, and did not.
- **The hard case failed both ways.** For the constant-probe pack neither condition produced a clean result. Each targeted edit fixed 2 of the 3 findings and introduced one new one (it removed the only check, which raises "no precondition check"). The whole-file replies introduced new findings in two trials (3 and 1) and fixed 2 of 3 cleanly in the third (score 0.67). A smaller reply does not make a model better at a repair that needs knowledge it does not have.

## A correction made while analysing

The first scoring rule for the three one-field cases demanded the pack's original value back. The model cannot know a title or a note that was replaced by "x", so every trial of both conditions scored 0 for title and markup although the validator was satisfied (fixed, no errors, nothing else changed). I changed the rule to the one above, applied it to both conditions, and rescore from the stored replies on every `report`. The change was made after seeing the tables, which is disclosed here; it does not favour either side (it moved 12 trials, 6 in each condition, from 0 to 1). For the llm-draft packs the validator's own hint allows an explanation under `review.unverified`, so `/review` is now an allowed place to change.

## What this does and does not show

- It is **not blind**: the threads, the questions, the packs and the scoring patterns were all written by the author of the tools. The threads are synthetic and 120 comments long; real threads are messier.
- Three trials per cell, one model, one client version. Individual outcomes are in `trials.json`; no significance claim is made.
- Part A cannot tell the brief apart from the full text where the facts are easy to find, and its one hard case was designed to make the brief fail, which it did.
- Part B shows a targeted edit is not less reliable than a whole file on these five packs and uses far fewer output tokens; it does not show it fixes things a whole file cannot.
- Output tokens are measured; the "about 80%" input saving compares the prompts the two conditions were given, not a full workflow.

## Consequences

- The `--compact` brief should stay opt-in, and the person (or the agent) should read the "Not shown" list. A cheap improvement worth trying next: also retain verbatim every comment by an author who wrote an earlier retained decision, and any comment that a retained comment cites, widening recall at a modest cost. It would need the same paired test.
- The targeted repair is safe to offer by default for one- and two-field findings. For findings that need knowledge the pack lacks, ask a person, not a model, in either form.
