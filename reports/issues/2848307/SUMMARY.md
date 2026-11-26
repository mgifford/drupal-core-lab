# #2848307: inline errors on table and tableselect form elements

**DRAFT.** Tests pass and Lab evidence exists; a person has not reviewed the patch or the
accessibility result, and nothing has been posted or pushed.

**Entry point for this issue.** Start with **What changed**, then **Evidence**, then the
[implementation notes](IMPLEMENTATION.md) and the [comment draft](ISSUE-COMMENT-DRAFT.md).

- Issue: https://www.drupal.org/project/drupal/issues/2848307
- Existing MR: https://git.drupalcode.org/project/drupal/-/merge_requests/16355
- Core base: `0387fb948f786bc344a5cc54aa0d98b8f552e378`
- Consolidated patch: [branches/2848307-table-inline-errors.patch](branches/2848307-table-inline-errors.patch)
- Interdiff from the experimental patch: [branches/2848307-interdiff-experimental-to-consolidated.patch](branches/2848307-interdiff-experimental-to-consolidated.patch)

## What changed

The experimental patch added a second recursive error handler that walked the whole form,
built HTML in `#prefix` and set `aria-describedby` on the table. This implementation instead uses
Drupal's rendering layer:

- A table or tableselect with its **own** error gets the `inline_form_errors_table` theme wrapper
  from a pre-render callback. The wrapper prints the one error message with an ID and the table.
- The table's `aria-describedby` points at that error (existing ID references are kept), and the
  table gets `tabindex="-1"` so the summary link can focus it.
- The inherited copy of the group error is removed from child checkboxes/radios, so the message is
  not repeated and no row is marked `aria-invalid`.
- The modules uninstall form keeps the error on its `uninstall` selection group, prints it once
  next to the hand-rendered table, and links the summary to the real table ID.

The global recursive HTML renderer and the `handleFormErrors()` table traversal are **removed**.
See [IMPLEMENTATION.md](IMPLEMENTATION.md) for what was retained or removed from the original patch
and why.

## Evidence

- Regression test output: [before](tests/before-pristine.txt) 19 tests, 4 errors and 10 failures on
  pristine core; [after](tests/after-fix.txt) 19 tests, 62 assertions, OK. The uninstall test fails
  before and passes after ([before](tests/before-uninstall.txt), [after](tests/after-uninstall.txt)).
- Lab comparison: [lab/2026-11-26T08-02-42-656Z/SUMMARY.md](lab/2026-11-26T08-02-42-656Z/SUMMARY.md)
  with 24 screenshots (light/dark/forced colours), DOM associations, keyboard focus and the
  Guidepup virtual screen reader.
- Lint: [PASS](lint/2026-11-26-2848307-latest-after.md) (CSpell, PHPStan, PHPCS, twig-cs-fixer,
  ESLint).

## Not verified

No real VoiceOver/NVDA run, no axe scan, no Firefox/WebKit run, no measured contrast, no person's
keyboard or screen-reader pass. The virtual screen reader is synthetic. See
[EVIDENCE.md](EVIDENCE.md#not-verified) for the full list.

## Files

| What | Where |
|---|---|
| Source review (task 1) | [SOURCE-REVIEW.md](SOURCE-REVIEW.md) |
| Implementation and removed changes | [IMPLEMENTATION.md](IMPLEMENTATION.md) |
| Evidence and limits | [EVIDENCE.md](EVIDENCE.md) |
| How to rebuild and test | [REPRODUCE.md](REPRODUCE.md) |
| Drupal.org comment draft (do not post) | [ISSUE-COMMENT-DRAFT.md](ISSUE-COMMENT-DRAFT.md) |
| Upstream submission steps | [UPSTREAM.md](UPSTREAM.md) |
| Status snapshot | [STATUS.md](STATUS.md) |
| Historical AI work-log (unchanged) | [ISSUE_2848307_WORK_SUMMARY.md](ISSUE_2848307_WORK_SUMMARY.md) |
