# #2574721: Module operations on narrow screens

Issue: [#2574721: Provide access to action links in the modules page on small screens](https://www.drupal.org/project/drupal/issues/2574721)

Merge request: [!17049](https://git.drupalcode.org/project/drupal/-/merge_requests/17049)

Last reviewed: 2026-11-25.

## Result

The issue reproduces on core `main`. At 480px, the description column and its action links disappear from the module table.

The original MR !17049 at `ed3917f4` moved the links into an operations cell but manually reconstructed Drupal dropbutton markup in Twig. It also had Twig whitespace failures and lacked corresponding PHP, CSS and regression test changes.

The revised implementation:

- Builds operations using Drupal's native `#type => 'dropbutton'` render element in `ModulesListForm`.
- Renders operations in a dedicated table column.
- Orders available operations as Configure, Permissions and Help.
- Preserves existing accessible link labels and attributes.
- Adds responsive styling to the operations column.
- Updates the system and Default Admin templates.
- Extends functional regression coverage.

The implementation avoids duplicating existing Drupal dropbutton behaviour.

## November 25 integration

The Lab proposal was integrated into the existing MR branch.

- Applied the interdiff against `ed3917f4b36`.
- Merged current core main, which was 299 commits ahead.
- Accepted upstream deletion of three obsolete Claro files.
- Corrected a missing closing div in the system modules Twig template.
- Verified all seven files using reverse application of the previously tested current-main proposal.
- Confirmed that the branch incorporated current main.
- Confirmed a clean Git whitespace check.

The resulting local revision, `e7a89e764ce`, modifies seven files, with 42 insertions and 14 deletions.

The upstream MR revision and CI results should be independently confirmed.

## Proposal artifacts

- [Original MR patch](branches/drupal-2574721.patch), tip `ed3917f4`, base `9e8373659f26`.
- [Full replacement patch on the original MR base](branches/2574721-full-proposal-9e837365.patch).
- [Interdiff from the original MR](branches/2574721-2574721-lab-proposal.patch).
- [Tested current-main proposal](branches/2574721-current-main-proposal.patch), based on `97c6ff8b253`.
- [Current upstream MR diff](https://git.drupalcode.org/project/drupal/-/merge_requests/17049.diff).

Historical patch artifacts are retained to support reproducibility.

## Testing evidence

### November 23 Lab evaluation

On core `97c6ff8b2534b242c0f1df3e4ba2493e56aebcec`:

- `ModulesListFormWebTest::testModuleListForm`: 11 assertions on Before and 15 on After; both passed.
- CSpell, PHPStan, PHPCS, TwigCS, Stylelint and generated CSS consistency checks passed.
- Chromium at 480px: Before had zero operations cells; After had 61 operations cells and 72 links.
- Pointer and keyboard interaction opened secondary operations.
- Chromium accessibility-tree evidence exposed the Operations header, action links and the additional actions button.
- Chromium light mode, dark mode and forced colours were evaluated.
- Firefox and WebKit completed visibility and interaction checks, subject to the Safari keyboard limitation below.
- No unresolved ARIA ID references, new axe violations or JavaScript errors were recorded.

### November 25 local verification

- PHP 8.5.13.
- PHPUnit 12.5.44.
- Targeted `testModuleListForm` execution returned exit code 0.
- All seven files passed the reverse patch compatibility check.

The PHPUnit HTML output referenced a previously configured DDEV project URL. The identity of the HTTP test environment requires confirmation before treating this as independent verification of the updated checkout.

See [EVIDENCE.md](EVIDENCE.md), [Playwright results](playwright/) and [accessibility tree comparisons](tree-diff/).

## Review feedback

The revised implementation addresses the implementation and test-coverage concerns raised in [comment #90](https://www.drupal.org/project/drupal/issues/2574721#comment-16768600).

The MR description should accurately reflect the seven-file implementation. Previously reported CI failures require confirmation against the updated revision.

## Outstanding concerns

- Confirm current upstream MR revision and CI results.
- Confirm that the local functional tests use the intended Drupal installation.
- Complete independent human review of the rendered design and keyboard interactions.
- Verify reflow at 320 CSS pixels and 200% and 400% zoom.
- Verify Safari keyboard traversal with macOS Full Keyboard Access enabled.
- Complete real VoiceOver or NVDA testing.
- Review compatibility with custom theme template overrides.
- Obtain subsystem maintainer review.

Forced colours testing retained one pre-existing colour-contrast axe finding on both Before and After. The proposal introduced no additional finding.

The available evidence supports the proposed fix but does not establish complete WCAG conformance.

## Next action

Confirm upstream submission and CI results, reconcile the MR description with the actual implementation, respond to outstanding review feedback and request independent community review.

Further implementation changes should be driven by specific test failures or review findings rather than repeating the existing evaluation.
