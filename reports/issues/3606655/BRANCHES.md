# Branch patches for #3606655

Two revisions are kept side by side. The 2026-10-15 extraction is historical evidence and is not
overwritten; the 2026-11-26 extraction is what this review evaluates. Neither is rebased onto current
`main`: each is the branch's own diff against its own base. The MR on drupal.org is the source of truth.

| Patch | Source | Tip | Base | Base date and subject | Files |
|---|---|---|---|---|---|
| [`branches/3606655-make-dark-mode.patch`](branches/3606655-make-dark-mode.patch) | https://git.drupalcode.org/issue/drupal-3606655.git `3606655-make-dark-mode` | 08a4cb4ca4 | 073a7d381984 | 2026-10-01 task: #3627134 Delete WorkspacesRequirements | 33 |
| [`branches/3606655-mr16432-170be9e3.patch`](branches/3606655-mr16432-170be9e3.patch) | MR !16432 diff, https://git.drupalcode.org/project/drupal/-/merge_requests/16432.diff (fetched 2026-11-26) | 170be9e30054dc7e7477465e1bc9b9bdd648ef66 | ced1e2636622be0c1197a7cadeba13a7c9bbc8a8 | 2026-11-04 14:41 -0800 task: #3620948 [November 2026] Refactor test code via Rector | 33 |

Hashes:

- `3606655-make-dark-mode.patch` — sha256 `bbbe599ee1918f79414c812f15a5c7ecd44067e0d5a7d592609bc5a3832d31da`, 2011 lines.
- `3606655-mr16432-170be9e3.patch` — sha256 `04507c78e85e52c19ae1877a9da717f45d71ed0c6c2c903810954ac5885f5f04`, 2003 lines, 85637 bytes. The MR shows 36 commits against `main`; its diff endpoints report the same 85637 bytes and sha256 prefix `04507c78`, which is how this file is tied to that revision.

## What changed between the two revisions

The November 4 rebase (#114) plus the PHPStan level 3 correction are the only code differences. Compared
line by line, the two patches differ in the `AccountForm` constructor only: the old revision assigned
`$this->languageManager` in the body and declared the property without a type; the current revision uses
a promoted, typed `protected LanguageManagerInterface $languageManager` parameter. Everything else is
identical after ignoring hunk headers and re-expanded blob hashes.

That means the design was **not** changed on November 3–5. The switch from a server-rendered preference
(a `user.color_scheme` cache context plus `data-color-scheme` set from the account's stored value) to an
invariant `data-color-scheme="auto"` plus a `DrupalColorScheme` cookie and an inline head script had
already happened in MR diff version 32, 2026-09-02 — before the historical patch was extracted. The
historical lab patch therefore contains the cookie design too; see `EVIDENCE.md` for what that means for
the scope review.

## Upstream state recorded 2026-11-26

- Issue #3606655: **Needs review** (status 8), Normal, Feature request, component *theme system*, version
  `main`; last changed 2026-11-04; 114 comments. **Assigned: Unassigned** (checked on the issue page), so
  the seven-day assignment rule does not restrict work here.
- MR !16432: opened, not a draft, branch `3606655-make-dark-mode` into `main`, head `170be9e3`, last
  updated 2026-11-05T09:33Z; `merge_status: can_be_merged`, `has_conflicts: false`. 53 notes.
- Review threads: **17 resolvable discussions are unresolved** in the discussions feed (18 resolvable in
  total, 1 resolved). All 17 are older than the current tip: 1 from amateescu (2026-08-04), 1 from goba
  (2026-08-22), 14 from longwave and 1 from poker10 (2026-09-02/03). The MR still reports
  `blocking_discussions_resolved: true`; both facts are recorded here because they disagree.
- Pipelines: the latest is #1032080 on 2026-11-05 (merge ref `f9076ada`), overall **success**. Its
  `PHP Static Analysis (phpstan)` job passed, which is the November 4 correction confirmed. The two
  failures in that pipeline are `PHPUnit Unit (Core): [8.6-ubuntu]` and `PHPUnit Unit (Component):
  [8.6-ubuntu]`, both `allow_failure=true` (PHP 8.6 nightly); their logs answer HTTP 401 anonymously and
  are **not** attributed here. The November 4 pipeline #1030768 also passed, and so did #983956 (Oct 1)
  for the historical tip.
- The current tip is **not stale against `main`**: its diff applies cleanly to `ced1e263` (its base) and
  to `a48087f2` (current `main`, 2026-11-26), checked with `git apply --cached --check` on a bare index.
  Applying is not the same as working; only `ced1e263` was built and tested here.
