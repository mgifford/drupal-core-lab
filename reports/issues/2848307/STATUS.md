# Status of #2848307 (snapshot 2026-11-26)

Re-check drupal.org before relying on this. It is a local snapshot, not a posted status.

| Field | Value |
|---|---|
| Issue | https://www.drupal.org/project/drupal/issues/2848307 |
| Issue status when read | Needs work |
| Existing MR | !16355, tip `46e9b7e7` (2026-07-18) |
| Core base | `0387fb948f786bc344a5cc54aa0d98b8f552e378` |
| Consolidated patch | [branches/2848307-table-inline-errors.patch](branches/2848307-table-inline-errors.patch) |
| Interdiff | [branches/2848307-interdiff-experimental-to-consolidated.patch](branches/2848307-interdiff-experimental-to-consolidated.patch) |
| Lab variant | `2848307-latest` |
| Tests | Before: 19 tests, 4 errors, 10 failures; After: 19 tests, OK. Uninstall before fails, after passes. Full IFE suite after: 28 tests, OK. |
| Lint | PASS (`scripts/lint.mjs 2848307-latest`) |
| Lab evidence | [lab/2026-11-26T08-02-42-656Z](lab/2026-11-26T08-02-42-656Z/SUMMARY.md) |
| Posted / pushed | **No.** Draft only. |

## Next actions

1. A person reviews the patch, the evidence and the comment draft.
2. Decide whether the uninstall template change is acceptable or whether the form should be
   restructured into a real tableselect in a follow-up.
3. Re-run the Lab pair after any MR update, then read the MR review threads again before posting.
4. If the patch is acceptable, follow [UPSTREAM.md](UPSTREAM.md). Do not push without approval.

## Related

- #3083103: general programmatic error association. Not integrated here; see
  [SOURCE-REVIEW.md](SOURCE-REVIEW.md#5-scope-check-against-3083103) and
  `../3083103/SOURCE-REVIEW.md`.
- #2509268: the earlier repeated-child-error fix for the uninstall form.
