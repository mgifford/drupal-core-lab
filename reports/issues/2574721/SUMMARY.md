# #2574721: Module operations on narrow screens

**DRAFT.** Evidence is recorded, but a person has not reviewed it or posted anything to drupal.org.

Issue: [#2574721](https://www.drupal.org/project/drupal/issues/2574721)

## Result

The issue reproduces on core `main`. At 480px, the description column and its action links disappear from the module table.

MR !17049 at `ed3917f4` moves the links into an operations cell, but its implementation manually rebuilds Drupal dropbutton markup in Twig.
It also has Twig whitespace failures and no PHP, CSS, or test coverage.

The lab proposal addresses those concerns by building the operations as a `#type => 'dropbutton'` render array in `ModulesListForm`,
rendering that array in a dedicated cell, adding responsive widths, and testing the order and placement of the links.

On core `97c6ff8b2534b242c0f1df3e4ba2493e56aebcec`, the proposal passed at 1280px and 480px in Chromium,
including dark mode and forced colours. Firefox and WebKit also completed the visible and interaction checks.

## Proposal artifacts

- MR patch under review: [`branches/drupal-2574721.patch`](branches/drupal-2574721.patch), tip `ed3917f4`, base `9e8373659f26`.
- Full replacement patch on the MR base: [`branches/2574721-full-proposal-9e837365.patch`](branches/2574721-full-proposal-9e837365.patch).
- Interdiff from the MR: [`branches/2574721-2574721-lab-proposal.patch`](branches/2574721-2574721-lab-proposal.patch).
- Current-main patch: [`branches/2574721-current-main-proposal.patch`](branches/2574721-current-main-proposal.patch), based on `97c6ff8b253`.

## Evidence

- `ModulesListFormWebTest::testModuleListForm`: 11 assertions on Before and 15 on After; both passed.
- Core checks: CSpell, PHPStan, PHPCS, TwigCS, Stylelint, and generated CSS consistency passed.
- Chromium 480px: Before had 0 operations cells; After had 61 cells and 72 links.
- After kept the sampled dropbutton inside the viewport and supported pointer and keyboard opening.
- Chromium 480px accessibility-tree evidence exposed the Operations header, action links, and “List additional actions” button.
- No unresolved ARIA ID references, new axe violations, or JavaScript errors were recorded.
- See [EVIDENCE.md](EVIDENCE.md) and the [playwright runs](playwright/).

## Outstanding concerns

- A person must verify the rendered design, keyboard use, 400% zoom, and screen-reader announcement quality.
- WebKit Playwright did not reproduce Safari’s macOS Full Keyboard Access preference; a person must verify link traversal in Safari.
- Forced colours retained one pre-existing `color-contrast` axe finding on both sides; the proposal added none.
- No real VoiceOver or NVDA pass was run.
- The generated proposal has not been posted to the merge request or tested by drupal.org CI.

## Next action

Human reviewer: inspect the full patch and interdiff, then decide whether to replace the MR contents and update its description.
The lab did not push, post, comment, or change the MR.
