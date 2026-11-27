# Session learnings: #3370946 review (2026-11-26)

Session `65c615b8`. Nothing was built; no environment, variant or evaluator was created. This file records what the
session learned and what the next session should not redo.

## Findings about the issue and current Core

- The issue is **unassigned** and has been idle since 2026-08-24. MR !4479 is at `1ff37e70` (2026-01-15), seven months
  older than the owner's own comment #119 patch. The deferral rule in the brief does not apply — the most recent
  contributor is the owner.
- **Claro and Olivero are no longer in core.** At `0387fb94`, `core/themes/` holds `default_admin`, `stark` and
  `starterkit_theme`. The issue's Proposed resolution ("configurable… default in Claro, other themes opt in") names a
  theme that is not in core, and two hunks of the refresh patch target config files that no longer exist.
- **The refresh patch does not apply** to `0387fb94`: the `block.post_update.php` hunk conflicts and the Claro/Olivero
  config paths are gone. Proven with a temporary git index against `envs/core.git`, no checkout needed.
- **`PageTitleBlock` is now ~40 lines** with no dependency injection: `$title`, `defaultConfiguration()` returning
  `label_display: 0`, and `build()` returning `#type: page_title`. The historical machinery (container injection, config
  key, two services, schema, post-update, profile configs) is a large addition to a trivial class.
- **`BaseRouteTitleResolver` and `RequestGenerator` do not exist on main**, so both are proposals, not partial landings.
- **`PageTitleBlockTest` does not exist on main.** Existing coverage is
  `core/modules/system/tests/src/Functional/System/PageTitleTest.php` (HTML escaping of titles). The patch's test is new
  coverage; the brief's "modernise the existing PageTitleBlockTest" is factually wrong.
- **Default Admin still renders local tasks as `nav > ul.tabs`** with visually hidden "Primary tabs"/"Secondary tabs"
  headings, and still places the page title (`weight -30`) above them in `header`. The original orientation problem
  plausibly survives — but that is a browser check, not an inference.
- **Related issues constrain the design**: #2938129 (PageTitle block non-functional outside `BlockPageVariant`) is an
  architectural risk; #2514218 asks for the content-type name on Manage fields/form/display and overlaps this scope.

## Process learnings (lab-wide ones are also in AI-LEARNING.md)

- Twenty-four sessions share this workspace and there is no cross-session message tool. Coordination is files plus
  leases plus the owner. `reports/infrastructure/COORDINATION-2026-11-26-session-*.md` is the established channel.
- The host hit **100% full** (388 MiB free) during the session; read-only commands failed with `ENOSPC` and
  `docker builder prune` could not complete. The repo is 10 GB while `Docker.raw` is 228 GB apparent, so repo-side
  cleanup has a ceiling. Recovery came from outside the lab.
- The shared working tree held ~170 uncommitted files across seven issues and sat on another issue's branch. Pushing
  from it would have carried other sessions' work. The commit was prepared in a clean worktree
  (`.wt-3370946`) created from `origin/main`, with only this issue's files copied in.
- Owner decisions arrived late and inverted part of the brief (more configurability, fresh MR). They are recorded in
  [DECISIONS-2026-11-26.md](DECISIONS-2026-11-26.md) with their consequences.

## What the next session should do first

1. `SOURCE-REVIEW.md`: current-Core behaviour plus the configuration-surface survey that decision D2 now requires.
2. `DESIGN-COMPARISON.md`: A/B/C on DOM prototypes, hosted on GitHub Pages via a copy step in
   `scripts/build-cloud.mjs` (`cloud/` is generated; do not hand-edit it).
3. Read the remaining 108 comments and both MR diffs. The review threads answered **HTTP 401** and were not read —
   never imply otherwise.
4. Only then register the variant, recipe and evaluator, subject to the lab's two-pair cap.

## Not verified

- No MR review thread was read (401 on both !4479 and !4283).
- No real VoiceOver pass was run; the owner has machines available, but no run happened in this session.
- No runtime check of any title behaviour on current Core; every Core statement above is source reading at a pinned
  revision, not a rendered page.
