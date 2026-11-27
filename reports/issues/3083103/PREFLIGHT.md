# Preflight: #3083103 (checked 2026-11-25)

Status: **static review only. Nothing was built, ported, applied, or posted.** No DDEV environment was
provisioned, no patch was modified, no variant was registered, no MR or comment was created. The four
original patches are byte-for-byte unchanged.

Sources read: drupal.org API (`node/3083103`, comments), GitLab API (commits, files at refs, MR 16520
changes), the MR !15692 page description, `envs/core.git` (`origin/main` = `0387fb948f7`, 2026-11-25),
`envs/baseline-main` working tree, `envs/baseline-main/core` source. Review threads **could not be read**:
the GitLab discussions API answers HTTP 401 for all three MRs, so unresolved threads are unknown
(AGENTS.md rule 15).

## 1. Issue state

| Field | Value |
|---|---|
| Issue | [#3083103](https://www.drupal.org/project/drupal/issues/3083103) Programmatically associate error messages with inputs |
| Status | Needs work (13), Normal, Feature request, component *forms system*, version `main` |
| Tags | Accessibility, Needs issue summary update, Needs tests, wcag331, Needs steps to reproduce, Needs rebase |
| Created / last changed | 2019-09-23 / **2026-08-06** (comment #84, mgifford) |
| Comments | 84 |
| Assignee | **none** (`field_issue_assigned` absent) |
| MRs | !15692 opened `ed60e948` (2026-05-07, 33 commits); !7080 opened `32d4ece4` (2026-04-15); !1063 opened `0fddb21c` (2026-03-24) |

Comment #84 attached exactly the three files already in this folder (`.md`, `.patch`, comparison `.md`,
all timestamped 2026-08-06). No later activity on this issue.

## 2. Activity in the same code, last seven days

**Yes — on a related issue, not on #3083103.**

- [#3557245](https://www.drupal.org/i/3557245) *Use `$element['#attributes']['id']` instead of
  `$element['#id']` to create a link anchor* — Needs work, 29 comments, last changed **2026-11-20**.
- MR [!16520](https://git.drupalcode.org/project/drupal/-/merge_requests/16520) "Use Attribute ID",
  opened 2026-11-16, touches **`core/modules/inline_form_errors/src/FormErrorHandler.php`** and its unit
  test — the same class and the same `displayErrorMessages()` method that any Inline Form Errors
  association has to modify. smustgrave: "Got motivated to help land a few more inline_form_errors after
  #2980380 … Fixed the merge conflicts…" (2026-11-06); dcam re-tested and reported the mismatch persists
  (2026-11-20); smustgrave replied "I'll take a look!" (2026-11-20).

This is **not** a competing *ARIA association* design, so it does not by itself trigger the stop rule for
the objective. It is a direct collision on the same file, and it changes the answer to "which ID is the
element's real ID" — the exact resolution any error association must reuse. Merging it first would change
the unit test and the link code under the August 6 patch. **Coordination risk: high.**

Other open relatives: #3243173 (focus/screen-reader issues, changed 2026-10-23), #3088245 (Convey form
error messages to AT, Needs work), #2848307 (**Inline errors not working on form table elements**, Needs
work, changed 2026-08-05 — directly relevant to the August 6 table code), #3125018 (multiple IDREFs).

## 3. Has Core already fixed it?

No. At `main` = `0387fb948f7` (2026-11-25):

- `grep -rn aria-errormessage` over `core/lib`, `core/modules`, `core/themes`: **no matches**.
- No `#error_id` property, no error-container IDs in `core/modules/system/templates/{form-element,details,fieldset}.html.twig`.
- `RenderElementBase::preprocess()` (line 151) still sets only `aria-invalid`.
- #3590902 ("Add aria-errormessage… when inline_form_errors is enabled") was **closed as a duplicate** of
  this issue on 2026-05-22, not fixed.

Changes since the patches' bases that touch this area (none add association):

- `d5babbbe` (2026-04-28, #1797438) made `enable_html5_validation` default **FALSE** on `main` — native
  browser validation is now off by default there.
- `bdba9f89` (2026-10-28, #2980380) refactored the Inline Form Errors summary into
  `inline_form_errors_summary` theme hook + template — same class, same method.
- `780eb17c`, `052a3cde` (2026-11-04) style/test-only changes.

**Source-level conclusion: the problem still exists.** Rendered confirmation is still required.

## 4. Recorded review positions (comments #5, #6, #76, #80, #82)

Not re-read in full here; #82 (smustgrave, 2026-05-06) is the most recent maintainer statement and is
quoted in the intake brief: the fix should live in `inline_form_errors`, "we could do away with the
service and template updates probably, or least change it to an attributes array so the module could
dynamically add the ID without much twig change, which need a CR." That is a **preference with a concrete
reason** (test coverage already lives in the module; template variables need a change record), not a
recorded decision.

`kentr` on #3590902 (2026-05-22) argues the opposite scope: #3083103 "would handle this for all form
errors, not just when Inline Form Errors is enabled", and notes AT disagreement about `aria-errormessage`.
Both positions are in the record; neither is ratified. Sections 5–10 of the task are the way to decide.

## 5. Review-thread gap

Unresolved MR threads on !15692, !7080 and !1063 are **not known**. Do not treat this document as a
review-complete reading of the queue. Fetch before any draft comment is posted.

## 6. What this pass established, and what it did not

Established from source (see [SOURCE-REVIEW.md](SOURCE-REVIEW.md) and [BRANCHES.md](BRANCHES.md)):

- Exact provenance of all four patches, including the August 6 patch (**11.4.x, `b2ce2022`**, not `main`).
- Exact applicability against `main` `0387fb948f7`.
- The theme-override problem shared by both primary proposals: `default_admin` is the Standard default
  theme and none of its three overriding templates print an error-container ID.
- Composite elements put error attributes on a `<fieldset>` (role `group`), not on the inputs.
- The August 6 `setTableElementInlineErrors()` has no caller.

Not established (needs the runtime phase):

- Whether the references actually dangle in rendered HTML (expected, not yet observed).
- Screen-reader speech for either strategy; accessibility-tree relationships; axe results.
- AJAX rebuild behaviour; multi-instance forms; `#error_no_message`; corrected errors.
- Whether the 2026-11-20 MR !16520 changes the ID resolution first.

## 7. Proposed runtime comparison (not started)

Three states, one baseline, two variants (never four builds):

| State | Meaning | Variant |
|---|---|---|
| A | `main` `0387fb948f7`, unmodified | shared `before` |
| B | MR !15692, ported only as necessary (14/15 files already apply) | `3083103-latest` after |
| C | August 6 proposal, ported from 11.4.x to `main` only as necessary (4/8 files apply) | `3083103-aug6` after |

`!1063` and `!7080` stay static unless the review above is wrong: both are the same design family
(renderer in core `FormErrorHandler`, ID on the messenger message), so they add no distinct runtime
question. This is a provisional judgement, not a conclusion.

Fixture: `form_test` `FormTestValidateRequiredForm` (`/form-test/validate-required`) already provides the
required textfield, checkboxes, select and radios; it needs textarea, details, fieldset, table/tableselect,
a second instance of the same form, AJAX validation and an author-set `aria-describedby`. Identical fixture
changes on both sides.

Module configurations: Inline Form Errors **enabled** and **disabled**; Standard does **not** install
`inline_form_errors` (`profiles/standard/standard.info.yml`), so disabled is the default-install state.

Browser validation: on current `main` native validation is already off by default (`enable_html5_validation`
defaults to FALSE). A separate scenario enables the setting to test the normal browser-validation path.

Estimated cost: static analysis (this pass) ≈ 1.5 h; environment provisioning ≈ 15–20 min per variant
(two variants, shared baseline); fixture work ≈ 2–4 h; evaluator + tests ≈ 4–6 h; AT runs ≈ 1–2 h.

## 8. Blocking questions before runtime

1. `envs/baseline-main` has **276 tracked files modified** (the whole `default_admin` theme CSS plus
   deleted icon/font assets). AGENTS.md rule 1 says stop when the baseline is dirty. This is somebody's
   uncommitted work; reverting it is destructive. It must be resolved (committed elsewhere, stashed by its
   owner, or a fresh baseline provisioned) before any Before/After run.
2. Should this work wait for, or build on, MR !16520 (#3557245), which is actively changing the same class?
