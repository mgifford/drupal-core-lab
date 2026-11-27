# Learnings and unfinished work: #3083103

Written at the end of the evaluation session, 2026-11-26. For the next session that touches this issue, and
for the lab's own practice.

## What worked

1. **Static preflight before building.** Reading the issue, its related issues and the MR heads first found
   two things that changed the shape of the task: #3557245 is active in the same class, and #3590902 had
   already been closed as a duplicate — so there was no landed fix to discover halfway through.
2. **Provenance by content, not by claim.** The August 6 patch had no base. Hashing every pre-image blob and
   comparing it with `git show <commit>:<path>` through the GitLab raw API proved it was an **11.4.x** diff
   at `b2ce2022`, not a `main` one. That single fact invalidated the "my patch is preferred" comparison
   without needing a browser. Same technique pinned every other patch stack.
3. **Refusing the dirty baseline.** `envs/baseline-main` had 276 tracked changes (a deliberate
   `default_admin` asset refactor, not residue). Building a fresh `baseline-3083103` cost one setup run and
   avoided a result that could never be trusted.
4. **One shared baseline for two After states.** Three environments, not four; the second variant reused the
   baseline. Releasing both Afters afterwards kept the evidence and cost 560 MB.
5. **The gate before the fix.** Writing the acceptance test before any new patch turned "which patch do we
   prefer" into "make these seven assertions pass in `default_admin`". It immediately separated the two
   failure modes (no association vs dangling association) that a screenshot cannot distinguish.
6. **Preserving the originals.** The four recorded patches are byte-for-byte unchanged; ports are new files
   with their own hashes and a written list of what changed and why.

## What cost time, and why

1. **Patch identity discovered by building.** 12 `setup.mjs` runs, 18 `git apply`, 3 `--refresh-patches`.
   Most of it was rework after !15692 did not apply or fatally conflicted on `main`. The static check
   (`git read-tree <base> && git apply --cached --check`) answers that in seconds; it should have been the
   last step of the static pass, before the first build.
2. **A porting defect found only at runtime.** On current `main`, `inline_form_errors` uses a typed promoted
   `RendererInterface $renderer`; the MR adds an untyped parent property, which is a fatal error. A
   five-second `php -l` cannot catch a property-type conflict between parent and child — only loading the
   class can. For a patch that adds a parent property, check the child's declarations first.
3. **Three fixture bugs that looked like product bugs.** `$form_state->getValue()` is empty during an AJAX
   rebuild (needs `getUserInput()`); `#field_prefix` escapes markup (needs `Markup::create()`); a hard-coded
   author ID duplicated across two form instances. Each produced a false "dangling reference" until found.
4. **Evaluator bugs that cost a cycle each.** A missing URL prefix (`/no-ife` instead of
   `/form-test/error-association/no-ife`), a races between `waitForLoadState('load')` and a POST navigation,
   and AJAX-rebuilt IDs that carry a random suffix. Rule: an evaluator must fail loudly with the URL and the
   selector it looked for, not with a bare timeout.
5. **A machine-wide `docker builder prune` during concurrent work.** Twice. It freed space but undercut other
   sessions' measurements, and the second attempt could not keep up with a concurrent build. The lab needs
   the approval rule that came out of this: a global Docker command is recorded with a named approval before
   it runs; per-project `lab-env trim` otherwise.
6. **Eleven sessions on one checkout.** The coordination that worked was the file channel
   (`reports/infrastructure/COORDINATION-*.md`) plus leases — not assumptions in a transcript. My first
   inventory over-attributed environments by grepping for mentions; ownership has to come from who created
   the environment.

## Unfinished, in the order I would do it

| # | Task | Why it matters | Effort |
|---|---|---|---|
| 1 | Run the acceptance test against the **August 6 port** | Completes the matrix; its env was released, so one `setup.mjs 3083103-aug6` is needed. Expected: 5+ failures. | ~30 min |
| 2 | Add a **FunctionalJavascript** case for AJAX validation and add-more | The Functional test cannot see the AJAX lifecycle; the random-suffix ID behaviour needs a browser. | ~2 h |
| 3 | Review **MR !16520 / #3557245** and settle the ID source (`#id` vs `#attributes['id']`) | Any association must use the same resolution as the summary links; the MR is active. | ~1 h |
| 4 | Align with **#2848307** (session `159c4033`) before editing `FormErrorHandler.php` | Same class and method; two changes will collide. Note already in `reports/infrastructure/`. | coordination |
| 5 | **Proof of concept**: carry the ID with the error content (`#prefix`/`#suffix` or a render array), not a template variable | Only candidate that survives all themes; must pass the seven tests in `default_admin`. | ~4 h |
| 6 | If the PoC passes: minimal patch + interdiff. If not: narrow this issue to Inline Form Errors and open a separate Core issue for the Standard-install gap | Decides the issue's scope; no new MR before this. | ~1 day |
| 7 | **Real NVDA/VoiceOver** pass; Firefox/WebKit; forced colours; dark scheme; mobile width | The virtual reader is semantics only; the matrix is one cell. | ~3 h |
| 8 | Read the **unresolved MR threads** (GitLab API returned 401) and update the draft comment with the test result | AGENTS.md rule 15; the draft is 169 words and pre-dates the test. | ~30 min |
| 9 | Decide `baseline-main`: identify its owner and archive-or-revert; mark `3619127-pinned` results unreliable meanwhile | 276 tracked files, 203 deletions; not mine to restore. | owner decision |
| 10 | Infrastructure follow-ups from the review: inode/docker-VM preflight, `gc --dry-run`, per-run evidence retention, `variants.json` lock, owner-aware viewer stop | The disk incident is the evidence that these are needed. | separate session |

## Facts worth carrying forward

- **Standard uses `default_admin` for both `default` and `admin`**, and it overrides `form-element`,
  `details` and `fieldset` templates **without error-container IDs**. Any test of error association must run
  in `default_admin`; `stark` hides the defect.
- **Inline Form Errors is not installed by Standard.** A module-only fix is inert on a default install.
- **`0` axe violations is not a pass.** axe reported nothing about the dangling IDREFs; only resolving every
  token against the DOM found them.
- **`#id` is unique per page** (`edit-name`, `edit-name--2`) and gets a **random suffix on AJAX**
  (`edit-extra-tag--<random>`). `#array_parents` is only identical across form instances for ID-less elements.
- **Composite elements** put the group's `#attributes` on a `<fieldset>` (role `group`): `aria-describedby` is
  valid there, `aria-invalid` and `aria-errormessage` are not.
- **`#error_no_message`**: core still sets `aria-invalid`; MR !15692 additionally leaves a dangling
  `aria-errormessage`; the August 6 patch guards it correctly.
- **An author-set `#id` is not uniquified.** `Html::getUniqueId()` only runs when `#id` is absent, so the same
  explicitly-ID'd element in two form instances duplicates the element and its error container.
- **Tables and tableselects render no inline error container** (#2848307); a mechanism must not point at one.
- **`#theme` can be an array**; use `#type` for type gates.
- **The proof of concept passed the gate** (7/7 in `default_admin`) with no template change and no renderer
  dependency, which is the evidence the recommendation was missing.
