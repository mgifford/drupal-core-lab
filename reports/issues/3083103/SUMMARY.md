# #3083103: Programmatically associate error messages with inputs

**DRAFT.** Scoping material only — nothing has been built or run in this lab. This folder was converted to the standard shape
on 2026-10-14; the original notes and patches are unchanged.

**This is the entry point for this issue.** Start with **Files and links** below.

Issue: https://www.drupal.org/project/drupal/issues/3083103
Patches: 3 with provenance in `branches/` + 1 without (see [BRANCHES.md](BRANCHES.md))
Status snapshot: [STATUS.md](STATUS.md)

## Summary

The issue is to associate form error messages with their controls programmatically (`aria-invalid`, `aria-errormessage`,
`aria-describedby`). This folder holds three branch patches with provenance, an LLM patch description, and an LLM
comparison against **MR !15692** that reaches the verdict "my patch is preferred". That verdict is the author's and has not
been ratified by a person.

## Files and links

| What | Where |
|---|---|
| Patches and provenance | [BRANCHES.md](BRANCHES.md) |
| Patch description (unchanged) | [3083103-aria-error-association.md](3083103-aria-error-association.md) |
| Comparison vs MR !15692 (unchanged) | [3083103-comparison.md](3083103-comparison.md) |
| How to reproduce | [REPRODUCE.md](REPRODUCE.md) |
| Evidence | [EVIDENCE.md](EVIDENCE.md) |
| Draft comment (do not post) | [ISSUE-COMMENT-DRAFT.md](ISSUE-COMMENT-DRAFT.md) |
| Status snapshot | [STATUS.md](STATUS.md) |

## Sources

- https://www.drupal.org/project/drupal/issues/3083103 (checked 2026-10-14)
- MR !15692 (referenced in the comparison note; not fetched here)
- Related: #2848307, #3243173

## Not verified

- No lab run; no pinned Before/After pair, no environment, no commit record, no human review.
- The comparison note's verdict and requirement-compliance table are the author's, not ratified.
- One patch (`3083103-aria-error-association.patch`) has no provenance.

## Notes

- The patch description says the module boundary is preserved (ARIA attributes set only in `inline_form_errors`); the
  comparison argues MR !15692 breaks it by setting them in core `FormErrorHandler`. Worth re-checking against the current
  MR before use.
