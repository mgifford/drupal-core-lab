# Bug summaries in Gherkin (`BUG.feature`)

An issue's bug summary can be written as a Gherkin feature: plain-language scenarios in Given / When / Then form, one behaviour each,
with what the user does and what they should observe. The lab keeps it as `reports/issues/<nid>/BUG.feature`. A model or a person writes it;
`scripts/bug-feature.mjs` drafts it from the lab's data, writes the prompt for a model, checks it and exports it. Nothing is posted anywhere.

Worked example: [`reports/issues/3618230/BUG.feature`](../reports/issues/3618230/BUG.feature) (seven scenarios, written by an AI assistant
from the issue's evidence, reviewed by the owner on 2026-10-18).

## Why

- A reviewer on drupal.org can read it in a minute. Each scenario is one behaviour: the state, the action, what is observed.
- Writing "Then" forces a specific, observable outcome: the text shown, where focus goes, what a screen reader announces. "It works" is not a step.
- Each scenario carries its Before and After result and the run or person that showed it, so a summary cannot claim more than the evidence.
- Accessibility bugs depend on how the person uses the site. A scenario names it (keyboard only, a screen reader and which one, forced colours,
  dark mode, zoom) and is tagged with it (`@keyboard`, `@screen-reader`, `@forced-colors`, `@dark-mode`, `@zoom`, `@reflow`).
- Writing scenarios turns up gaps. The #3618230 example has an open question that no run or person has answered:
  whether a dismissed error should also be gone for screen reader users. The run recorded that it stays in the accessibility tree.

It is **not** a test. No step is executed: core's tests are PHPUnit (core does not use Behat), and the lab's executable side is the variant's checks
and `tools/playwright/evaluate-<nid>.mjs`. The draft maps those checks to Then steps, so the two are easy to compare.

## The steps

    node scripts/bug-feature.mjs draft <nid> --write      # 1. a mechanical first draft, from the variant and the verdicts of its runs
    node scripts/bug-feature.mjs prompt <nid> --out p.txt # 2. the message for a model to rewrite it per behaviour (or, in a lab session, an agent reads prompts/bug-feature.md)
    node scripts/bug-feature.mjs check <nid>              # 3. structure and the lab's rules; exit 1 on an error (--strict: also on a warning)
                                                          # 4. a person reads every scenario against EVIDENCE.md and the runs it cites
    node scripts/bug-feature.mjs export <nid>             # 5. without comments and lab tags, for a drupal.org issue summary ("Steps to reproduce")

1. **Draft.** The draft is mechanical. It takes the pinned variant (`--variant <slug>` for another one) and makes the recipe steps the Background.
   The viewer's steps become When steps and the lab's checks become Then steps (precondition, fix, regression). The observations become a
   table with the result each side should give. Every run whose record is still current is listed with its verdict, and stale or superseded runs are left out
   and counted. The steps are the viewer's instructions as written ("in both frames", "press Go"), so the checker warns about them. They are meant to be rewritten.
   `--write` saves `BUG.feature` and refuses to replace one that exists (`--force`), since a person or a model may have rewritten it.
2. **Rewrite.** `prompt` prints the rules ([`prompts/bug-feature.md`](../prompts/bug-feature.md)), the current `BUG.feature` (or a fresh
   draft), and the issue's `SUMMARY.md`, `EVIDENCE.md`, `FEEDBACK.md` and `intake/BRIEF.md`, marked as data. Each input is cut at 14,000
   characters, so the message stays small. Paste it into a chat, or have the session's agent follow the same rules. Save the reply as
   `reports/issues/<nid>/BUG.feature`. If the issue was fetched long ago, run `node scripts/issue-intake.mjs fetch <nid>` first (`AGENTS.md` rule 15).
3. **Check.** See below. A clean check is necessary, not sufficient: it checks form, not truth.
4. **Review.** A person reads each scenario against the evidence it cites. Once it is right they replace `@draft` with `@reviewed` and add a
   `# Reviewed by <who> on <YYYY-MM-DD>` line. A model never marks a file `@reviewed` on its own judgement; it may record a review only when the person says the file is right, in their name and with their words (as for #3618230 on 2026-10-18).
5. **Export.** Prints the feature without comments and without `@draft`, `@reviewed` and `@issue-<nid>`. It warns while the file is still
   `@draft` and refuses a file with errors. Posting it is the owner's decision (`AGENTS.md` rule 4), with the AI-assisted disclosure (rule 10).

## The format

    # <how the file was made, from which inputs, on what date; the core commits; the lab runs, each as file:<run folder>/>
    @issue-<nid> @draft
    Feature: <the issue title, or the behaviour>
      https://www.drupal.org/project/drupal/issues/<nid>
      <free text: the user story, the cause, what the change does>

      Background:
        Given <the state every scenario starts from>
        And I am logged in as an administrator

      @keyboard
      Scenario: <one behaviour, as the issue wants it>
        # source: file:<path> | comment:<n> | a drupal.org link
        # Before: <fails | passes | mixed | not run | not judged> <which run or person, and when>
        # After: <the same words> <which run or person, and when>
        Given <state>
        When <what the user does>
        Then <what the user observes>

- A scenario describes the behaviour the issue asks for, so on Before it usually **fails** (the bug) and on After it **passes** (the fix). A
  regression scenario passes on both sides.
- `# Before:` and `# After:` sit under the `Scenario:` line, with `# source:` lines. They are Gherkin comments, so other tools ignore them.
- `@unverified`: reported in a comment, not reproduced by the lab or a person. Its results are `not run`.
- `@wcag-2.4.4`: only when the issue or the evidence names the success criterion.
- Plain Gherkin otherwise: `Scenario Outline` with `Examples` for the same steps on different data, data tables, doc strings, `Rule`.
  English keywords only.

## What `check` checks

Errors (exit 1):
- Gherkin structure: a header or step the parser does not know, tags that belong to nothing, an unclosed doc string, uneven table rows, Examples
  outside an Outline, an Outline without Examples rows, two scenarios with the same name.
- One behaviour per scenario: Given, then When, then Then. A Given or When after a Then is an error (split the scenario). Every scenario has a When and a Then;
  a Background has only Given steps; a scenario does not start with And or But.
- The Feature has `@issue-<nid>` matching the folder, and exactly one of `@draft` or `@reviewed`. `@reviewed` needs the "Reviewed by" line.
- Every scenario has `# Before:` and `# After:` lines.
- Every `file:<path>` it cites exists.
- Links only to drupal.org, git.drupalcode.org, api.drupal.org and w3.org (site paths, not hosts). No step that types a password, and nothing that looks like a token.
- A `@wcag-` tag in the form `@wcag-<principle>.<guideline>.<criterion>`.

Warnings: a scenario with no `# source:`, a result line that does not start with the agreed words, a Then that says "works", "correctly" or "as expected". Also:
a step that describes the lab's viewer (frames, Mirror, Go, Run checks), a step that names a CSS selector, a "?" left in an expected-results table, a step over 220
characters, a scenario over 12 steps, an Outline `<placeholder>` that is not an Examples column, a missing issue link, a TODO.

Not checked: whether a step is true, whether a cited run shows what the result line says, whether the scenario is the behaviour the issue asks for.
That is the review in step 4. The checker reads a subset of Gherkin. On 2026-10-16 all 13 drafts, the #3618230 example and its export
also parsed with Cucumber's own parser (`@cucumber/gherkin` 30, installed for that check only, not a dependency of the lab).

Tests: `node --test tests/lab/bug-feature.test.mjs` (`selftest` runs them). They also check that every committed `BUG.feature` has no errors.

## Where this came from

Proposed by the owner on 2026-10-16, with a link to a Gherkin and BDD guide (testquality.com) that could not be reached from that session.
The conventions above follow the Gherkin reference (cucumber.io) and the lab's own rules (`AGENTS.md`: evidence stays a draft until a person
reviews it, say what was not verified, record commits).
