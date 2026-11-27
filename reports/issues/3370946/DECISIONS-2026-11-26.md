# Decisions for #3370946 (owner, 2026-11-26)

Five questions were put to the owner in review session `65c615b8`. These are the answers, the consequence for the
work, and what is still open. They override earlier open questions in the 24-page brief and in
[3370946-refresh-notes.md](3370946-refresh-notes.md).

Context at the time of the answers: issue **Needs work**, **unassigned**, last changed 2026-08-24; MR !4479 at
`1ff37e70`, last updated 2026-01-15; no Lab variant, no environment, no evaluator.

## D1. Real VoiceOver: available

**Answer:** the owner has several machines and can run VoiceOver, including with the sound off.

**Consequence:** a real VoiceOver pass is in scope for [SCREENREADER.md](SCREENREADER.md), not merely a virtual
screen-reader pass. Two practical notes:

- Guidepup's VoiceOver driver captures speech through the accessibility API, so a muted machine still produces a
  transcript. "Without sound" does not weaken the automated capture, but it does mean the person running it cannot
  *listen*; the transcript, not a listening impression, is the artefact. Say that in the write-up rather than
  implying an audible human pass.
- The virtual screen reader still runs first, to establish heading names and reading order cheaply. Real VoiceOver
  confirms or contradicts it. Raw speech stays separate from normalised comparisons, as the brief requires, and
  total phrase counts are not the outcome measure.

**Still needed:** which machine, and confirmation that the VoiceOver session is exclusive while it runs. The
command and manual protocol belong in `SCREENREADER.md` even if the pass is done elsewhere.

## D2. Configurability: aim for more, not less

**Answer:** "Aim to be more configurable. There will be changes."

**Consequence:** §5 of the brief flips. The question is no longer "can `base_route_title` be deleted to shrink the
patch" but "what is the smallest configuration surface that still supports the changes we expect". That means:

- Keep, and design, the `base_route_title` setting — do not strip it to reduce the file count.
- The existing shape (a block setting, Claro opt-in by default) is one point in a space that also includes
  theme-level opt-in, per-route overrides and a site-wide default. Design the surface deliberately and record the
  consequences for existing installs, new installs, contributed and custom themes, config exports, update paths and
  existing page-title blocks.
- "More configurable" does **not** mean "more options for their own sake": each option still needs a user story,
  a schema entry and a test. The recommendation must state what an administrator can change, what a themer can
  change, and what is fixed.
- Note for the Claro-era assumptions: Claro and Olivero are no longer in core (`core/themes/` at `0387fb94` holds
  only `default_admin`, `stark`, `starterkit_theme`), so the historical "default in Claro, other themes opt in"
  wording has to be restated in terms that exist today.

## D3. Upstream: a fresh merge request

**Answer:** "sounds like it is time."

**Consequence:** !4479 is superseded rather than rebased. It stays open for history; the new work goes on a new
branch with its own MR.

- Build the new patch from current `main`, not by rebasing `3370946-change-in-pagetitleblock` (whose head is
  seven months older than the owner's own comment #119 patch).
- Prepare an **interdiff** against the lab's refreshed patch
  ([3370946-page-title-refresh-main.patch](3370946-page-title-refresh-main.patch)) so reviewers can see what changed
  relative to the last proposal, plus the full patch. Record both exact hashes and the Core base in
  [BRANCHES.md](BRANCHES.md).
- The refresh patch does **not** apply to `0387fb94`: the `block.post_update.php` hunk conflicts and two theme
  config files no longer exist. That is expected and is part of why a fresh MR is the right call.
- Nothing is posted to drupal.org or GitLab without explicit approval; `UPSTREAM-HANDOFF.md` carries the exact
  macOS/zsh commands (no `#` comments inside executable blocks).

## D4. Prototypes: GitHub Pages, for now

**Answer:** the DOM prototypes stay on GitHub Pages for the time being.

**Consequence and one caveat:** `cloud/` is **generated** by `scripts/build-cloud.mjs` from `tools/compare/` and
`docs/images/`; `cloud/README.md` says not to edit there. Prototypes therefore cannot be dropped into `cloud/`
by hand — they need a source directory in the repository and a copy step in `build-cloud.mjs` (or they will be wiped
on the next rebuild).

- Proposed layout: source under `tools/compare/prototypes/3370946/`, copied to `cloud/prototypes/3370946/` by
  `build-cloud.mjs`, published by the existing `pages.yml` workflow.
- The Pages site is **public**: prototypes must contain no site data, no tokens, no internal hostnames, and no
  third-party scripts. The three variants are static, self-contained HTML.
- The comparison viewer remains the place for real Before/After runs; Pages prototypes are for the design decision
  only, and must not be presented as evidence of runtime behaviour.

## D5. Duplicate artifacts: removed

**Answer:** remove duplicates; symlinks are acceptable where helpful.

**Done:** `3370946-supporting-artifacts.zip` deleted after verifying all 11 members were byte-identical to the
top-level files (`shasum`, per member). The `3370946-supporting-artifacts/` directory named in the old notes no
longer existed. The folder is now ~808 KB and no evidence was lost. [SUMMARY.md](SUMMARY.md) and
[EVIDENCE.md](EVIDENCE.md) were corrected, because they still described both duplicates.

No symlinks were needed: nothing is duplicated now. If later evidence is referenced from two places, a relative
symlink is preferred to a copy, so long as whichever tool consumes it follows links.

## Still open

- Which machine runs VoiceOver, and confirmation that it has exclusive use while the pass runs.
- The exact configuration surface from D2 will be proposed in `DESIGN-COMPARISON.md`; it is a design proposal,
  not yet agreed.
- The `build-cloud.mjs` copy step from D4 is a tooling change in shared infrastructure. It should be made once,
  with the infrastructure session aware, not hand-rolled per prototype.
- A Lab variant, recipe and evaluator are still unbuilt, and are gated on the A/B/C decision and on the lab's
  two-pair cap.
