# Alternative rail-and-ribbon proposal

**DRAFT. AI-assisted local implementation and evaluation. Not RTBC.**

Issue: [Drupal #867830](https://www.drupal.org/project/drupal/issues/867830).
Comparison: `867830-ribbon-pinned`. This is a separate proposal, not a revision
of the [earlier status-label proposal](SUMMARY.md#new-current-core-proposal-2026-11-09).
Earlier patches, registrations and evidence remain unchanged.

**Automated checks pass for this local alternative. Human review is still
needed.** Open the [local Lab viewer](https://drupal-compare.ddev.site) and select
`867830-ribbon-pinned`. The [light screenshots and check table](playwright/2026-11-17T20-14-03-343Z-chromium-light-1280x900/SUMMARY.md)
compare all three installed themes.

## Design and scope

The supplied design asks for a full-height inline-end rail, a top ribbon and a
same-colour triangular continuation. Nodes use a 4px rail; held comments use a
3px rail and a bottom corner. The ribbon reserves normal-flow space so wrapped
labels do not cover the title or controls.

Each entity communicates its own publication state. Published comments in an
unpublished node must remain unmarked and have their own normal surface. A held
comment must still communicate its state when its parent is published.
The visible word is **Unpublished**, not the moderation state **Draft**.

Generic Core templates provide translatable text and stable classes; theme
patches provide presentation. Default Admin, newly generated Starterkit themes,
Claro and Olivero are the intended scope. The prototype's purple values are
design suggestions, not global Core or custom-theme requirements. Existing
Starterkit-generated themes need their copied templates updated separately.

The triangles use equal logical borders rather than the prototype's
`clip-path`. This gives the same 45-degree shape, mirrors with text direction,
and keeps real borders in forced colours. Browser testing found that a
transparent border becomes painted in forced colours. The final patches use
`Canvas` for that half and `CanvasText` for the painted half; they do not opt out
of the user's colours.

The Navigation Top Bar remains unchanged. Its existing chip, contrast and
whether it duplicates or supplements entity-local status remain separate review
questions. This proposal does not claim to resolve those questions.

## Source audit

- On 2026-11-17 the issue remains **Active**, Major, with 317 comments and no
  upstream merge request. The historical branch is not this proposal.
- The [community brief](intake/BRIEF.md) lists related and mentioned issues.
  No MR review threads were available because no MR was found.
- The compatibility concern cited as comment 300 in the supplied prompt is
  actually [comment 301](https://www.drupal.org/project/drupal/issues/867830#comment-14864549).
  It warns against removing legacy Twig variables and suggests `status_marker`
  for the old approach. Adding entity-local text does not require replacing
  those variables or creating a universal entity-status API.
- Current Core is pinned at `29b0a0b2256eb5ed27df6ec5e4e4e33142a717e8`,
  fetched from `main` on November 17. This differs from the earlier proposal's
  November 9 pin; its old screenshots are not evidence for the new version.
- Reuse Core's publication state and comment status, Drupal's `.visually-hidden`
  utility, existing theme libraries and the themes' CSS build pipelines.
  Do not remove the generic mark hook or move titles to accommodate the ribbon.

## Exact comparison and patches

Before is `envs/baseline-867830-ribbon`, with no patches or tracked source
changes. After is `envs/issue-867830-ribbon`, with the same Core and theme pins.
It applies one Core patch and one project-relative patch per contrib theme.
These are local alternatives, not an upstream merge request.

| Patch | Base revision | SHA-256 |
|---|---|---|
| [Core](branches/867830-ribbon-core.patch) | `29b0a0b2256eb5ed27df6ec5e4e4e33142a717e8` | `d399347a5375efa17013ad0c9dd49ed661bab28e3b12f7c53f4c3f1064496fdc` |
| [Claro](branches/867830-ribbon-claro.patch) | `474f080c47f5ce21961bf90515fb7bdea1d7dcd4` | `1e5b3b30593e02392c1a70dfc0ef0b988b1ab06471fdf7456c9b885c032e4644` |
| [Olivero](branches/867830-ribbon-olivero.patch) | `bcd108499147b5a8f6d0820758302345be6b24ca` | `3a3d8ada412418ad512d0bac80144d6aebce4423e1668de6e86f90b9e5ae695c` |

No legacy status variables or mark hooks are removed. No replacement status
API, title movement or database change is introduced. Umami is unchanged and
outside this alternative's scope.

### Separate project handoffs

- **Drupal Core:** apply only `867830-ribbon-core.patch` at the Core checkout
  root. It covers generic templates, Default Admin, Starterkit and Core tests.
- **[Claro](https://www.drupal.org/project/claro):** apply only
  `867830-ribbon-claro.patch` at the Claro project root.
- **[Olivero](https://www.drupal.org/project/olivero):** apply only
  `867830-ribbon-olivero.patch` at the Olivero project root.

The theme patches are standalone project-relative diffs, not additions to the
Core patch. Check each with `git apply --check` against its base revision above
before applying it. Any future Claro or Olivero issue/MR should link back to
[Drupal #867830](https://www.drupal.org/project/drupal/issues/867830).
No upstream issue, comment or merge request has been submitted for this design.

## Reproduce

From the repository root, with local Docker and DDEV:

    node scripts/doctor.mjs 867830-ribbon-pinned
    node tools/compare/setup.mjs 867830-ribbon-pinned
    node scripts/lab-env.mjs start 867830-ribbon-pinned --browser

Both sides use Standard plus `recipes/repro_867830_current/recipe.yml` and its
`apply.sh` / `create-content.php`. Follow the existing
[shared three-node walkthrough](REPRODUCE.md#shared-walkthrough-2026-11-17);
select the ribbon comparison, not the earlier proposal.

The dedicated evaluator reuses the Lab's identity checks, login, context
recording, axe scans and synthetic status speech:

    node tools/playwright/evaluate-867830-ribbon.mjs 867830-ribbon-pinned --themes=default_admin,claro,olivero
    node tools/playwright/evaluate-867830-ribbon.mjs 867830-ribbon-pinned --scheme=dark
    node tools/playwright/evaluate-867830-ribbon.mjs 867830-ribbon-pinned --forced-colors
    node tools/playwright/evaluate-867830-ribbon.mjs 867830-ribbon-pinned --lang=ar
    node tools/playwright/evaluate-867830-ribbon.mjs 867830-ribbon-pinned --viewport=320x900 --stress

Never run these concurrently: each changes the default theme identically on
both sites and restores Olivero afterwards. Arabic-prefixed canonical routes
exercise Drupal's real right-to-left (RTL) rendering; they do not prove an
Arabic translation was imported. `--stress` doubles root font size, substitutes
long labels and titles, and shortens comment bodies. This tests layout, not
real translation or browser zoom. A 320px viewport tests a reflow width, not an
actual 400% browser-zoom operation.

## Evidence and remaining blockers

The six final Chromium runs contain **142 passing live checks**. They cover
local status text, published controls, normal-flow spacing, logical placement,
rail and triangle geometry, nested comment surfaces and label contrast.
They introduce no new axe rule/target pairs. Captured markup also passes the
synthetic Guidepup status-speech checks; this is not a real screen reader pass.

| Check | Result |
|---|---|
| Focused Lab geometry, speech and Coder handoff tests | 12 passed |
| Full Lab selftest | PASS: all 9 checks; 230 Lab, 157 issue-pack and 36 design tests passed; none skipped |
| [Core rendering tests and existing NodeViewBuilder regression](lint/2026-11-17-ribbon-core-tests-final.log) | 7 tests, 598 assertions passed; includes real entity/Twig rendering and injected Arabic translations |
| [Core-native lint](lint/2026-11-17-867830-ribbon-pinned-after.md) | PASS: spelling, PHPStan, PHPCS, Twig, Stylelint and generated CSS checks |
| Theme CSS compilation and source/output checks | PASS in source scratch checkouts for Default Admin, Starterkit, Claro and Olivero |
| Generated Starterkit, Claro and Olivero rendering replay | 6 tests, 588 assertions passed in scratch; not a full live Drupal theme pass |
| Triangle raster diagnostics | 60 synthetic cases, 180 rendered triangles passed; the pre-fix negative control fails |
| [Final captured-snapshot recheck](lint/2026-11-17-ribbon-geometry-recheck.log) | All 32 After snapshots pass the final geometry/colour rules, including synthetic stress |
| Separate AI code review | PASS after adding a negative test for an invisible forced-colour triangle; not independent human review |
| AI inspection of eight final screenshots | No obvious ribbon overlap or malformed corner; extreme narrow text is difficult to scan |
| Real Windows Contrast Themes | Not run |
| Real VoiceOver/NVDA | Not run |
| Person-led keyboard, visual, zoom and narrow-layout acceptance | Not run |
| Independent human code and accessibility review | Not run |

The CSS, scratch-theme and raster checks above were run by the source agent.
Their raw logs and replay helpers remain in this session's `files/ribbon-source/`
directory, not as portable Lab tests. The linked live and Core test artifacts
are the persistent evidence for this comparison. The existing Olivero teaser
template also retains 12 pre-existing compact-hash Twig lint errors; a clean
whole-contrib lint result is not claimed.

### Final live runs

Each linked summary includes screenshots, browser/OS identity and theme/module
context. Structured results are saved beside it as `results.json`.

| Mode and scope | Unexpected checks | Evidence |
|---|---|---|
| Light, Default Admin / Claro / Olivero | 0 | [Three-theme comparison](playwright/2026-11-17T20-14-03-343Z-chromium-light-1280x900/SUMMARY.md) |
| Dark, Default Admin | 0 | [Dark comparison](playwright/2026-11-17T20-14-58-753Z-chromium-dark-1280x900/SUMMARY.md) |
| Forced colours, all three themes | 0 | [Forced-colour comparison](playwright/2026-11-17T20-17-33-429Z-chromium-light-forced-1280x900/SUMMARY.md) |
| Arabic route + forced colours, Default Admin | 0 | [RTL forced-colour comparison](playwright/2026-11-17T20-18-29-248Z-chromium-light-forced-1280x900/SUMMARY.md) |
| Arabic route, Default Admin | 0 | [RTL comparison](playwright/2026-11-17T20-18-53-738Z-chromium-light-1280x900/SUMMARY.md) |
| 320px and synthetic text-resize/wrapping stress, Default Admin | 0 | [Narrow comparison](playwright/2026-11-17T20-19-17-568Z-chromium-light-320x900/SUMMARY.md) |

Only Default Admin's native dark palette was tested. Claro and Olivero were
not given an invented dark mode. Firefox/WebKit and a full live
Starterkit-generated theme pass were not run for this alternative.
The generated [issue-wide coverage](COVERAGE.md) combines different proposals
and Core pins; its aggregate matrix is not this alternative's coverage.

### Measured label contrast

Minimum measured local-label text contrast across the natural final pages:

| Theme and mode | Minimum |
|---|---|
| Default Admin light | 15.54:1 |
| Default Admin dark | 14.31:1 |
| Claro light | 8.20:1 |
| Olivero light | 19.47:1 |
| Browser-emulated forced colours, all three | 21.00:1 |

These are text measurements against each label's rendered background, above
the 4.5:1 normal-text threshold in WCAG 2.2 SC 1.4.3. They do not measure the
Top Bar chip or establish page-wide conformance. The real text, not the rail's
colour, carries publication state.

### What testing changed

- Initial overlap failures came from measuring hidden/positioned metadata and
  double-counting Olivero's border-box triangle borders. Those runs are retained
  and marked superseded with the collector-error reasons.
- The first forced-colour run found a real shape defect: both border halves
  became painted. The final source patches fix it with system colours.
- A later anchoring check compared a padding-box inset with border-box height.
  Correcting that collector fixed false forced-colour failures without changing
  source. The raw run is retained and marked superseded.
- Separate code review caught a weak forced-colour assertion. The final rule
  rejects both invisible triangles and two painted halves. All final captured
  snapshots pass that tightened rule without modifying the original captures.

Repeat the scoped Before/After run after any patch revision. Do not reuse
these screenshots as evidence for updated source.

Automated results remain bounded evidence. Do not remove
**Needs issue summary update** or recommend RTBC from this report alone.
Agree on theme scope and chip behaviour, complete manual review and verify the
upstream implementation pipeline before requesting acceptance.

Next owner: @mgifford reviews the comparison, especially the dark/forced-colour
shapes, nested published comment and narrow text. Then decide whether to pursue
this design upstream and request human code/accessibility review. This remains
a Lab proposal for GitHub review, not an upstream Drupal contribution or an
acceptance recommendation.
