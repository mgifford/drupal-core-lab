# Drupal core lab handoff

Session paused October 17, 2026, approximately 13:35 America/Toronto. Scope: Drupal #2951317, compact iframe headers, and the related lab housekeeping discussed in this session. AI-assisted closeout; results remain DRAFT.

## Read this first

- The corrected pinned replay summary reports **11 applicable checks passed**. Native submission blocking was not exercised: both forms disable native HTML5 validation. The mixed verdict is a coverage gap, not a failed assertion.
- Do not repeat the original claim that an invalid radio group necessarily blocks Save under the default configuration. The fixture does not implement server-side validation for dynamic #states.
- Lab PR [#22](https://github.com/mgifford/drupal-core-lab/pull/22) (design collector) and [#23](https://github.com/mgifford/drupal-core-lab/pull/23) (compact headers) are merged. Fetched main: `5c1bf90`. Do not reopen #22 or reapply the header patch to a checkout that already contains #23.
- The corrected evaluator was applied and run by Mike. Whether that correction is committed or pushed on his laptop has not been confirmed. Check Git before creating another branch or applying an old patch.
- No TODO.md is added: the ordered checklist below is the single closeout checklist. Do not overwrite an existing TODO.md from other work.

## Exact comparison

| Item | Value |
|---|---|
| Issue | [#2951317: Radios element missing required attribute](https://www.drupal.org/project/drupal/issues/2951317) |
| Selected MR | [!15536](https://git.drupalcode.org/project/drupal/-/merge_requests/15536) |
| Fork branch | `2951317-radios-element-missing-required-attr` |
| Captured MR tip | `ab7ab046f920f7a5a29704888976e56b6a36514a` |
| Core, both sides | `ad11ba71c0f09b856e45dfdb8db155b5a588712d` |
| Primary slug | `2951317-pinned` |
| Follow-up slug | `2951317-latest`, registered but no runtime result reviewed here |
| Environments | `baseline-2951317`, `issue-2951317` |
| Recipe | `recipes/repro_2951317/recipe.yml`; Standard install, test extensions enabled |
| Test route | `/admin/config/development/lab-radios-2951317` |
| Replay | `tools/playwright/evaluate-2951317.mjs` |

Before receives only `reports/issues/2951317/branches/2951317-shared-fixture.patch` (SHA-256 `0b6ee870ae17a6caa52004ca3d60e90b592d43039cb18557b508f8eb7b945b27`). After receives that fixture first, then `reports/issues/2951317/branches/2951317-radios-element-missing-required-attr.patch` (SHA-256 `27550bbdd14990cfe34b3180fe9ccd49472ccb9ab93d4d795b394f0f01d39f28`). Neither patch was changed during closeout.

The shared fixture installs an administrator-only test form with required, defaulted, optional, and dynamically required radio groups. It is test support, not an upstream fix. It must remain identical on both sides.

## Evidence and conclusions

[Issue evidence](reports/issues/2951317/EVIDENCE.md) and [received-file provenance](reports/issues/2951317/received/2026-10-17/README.md) hold the detail.

- Original run: `reports/issues/2951317/playwright/2026-10-17T17-15-35-954Z-chromium-light-1280x900/` on Mike's laptop. Summary generated 17:15:36 UTC. Its JSON verified both patch stacks and no undeclared core edits. Chromium 156.0.8078.4, macOS ARM64, light, 1280×900; Drupal 12.0-dev, PHP 8.5.8. Ten checks passed; the native-blocking test had the wrong precondition. Zero axe violations across recorded stages and no recorded JavaScript errors.
- Corrected summary: generated 17:21:34 UTC. Eleven applicable checks passed; native-blocking row not applicable. Both sides recorded native validation disabled; After made one POST and displayed the acceptance message. Its exact containing folder and full corrected results.json were not supplied. Locate that run by its summary timestamp, not by guessing a folder name.
- The correction records form/submitter validation flags, POST count, acceptance message, invalidity, and focus. A same-URL rebuild no longer masquerades as blocked submission. No core setting was changed to make the result pass.
- The checked behavior includes required attribute placement, radiogroup roles, a legend-only required indicator, selection preservation, hiding/showing None, invalid hidden None while required, and clearing invalidity after a real choice.
- Rendered-theme capture returned null on the fixture route, despite default_admin being configured. Report configuration and rendered-page evidence separately. Null is not proof of an incorrect theme.
- The older committed 15:27 UTC run has incomplete site context and the original native-blocking assumption. Keep it for history, but do not treat it as a complete independent validation run.
- No manual test log, synthetic Guidepup run, full browser matrix, core test-suite result, or native-enabled submission result was reviewed. An accessibility snapshot or an empty announcement log does not establish screen-reader behavior.

## Outstanding work, in order

- [ ] **Preserve the corrected complete run** on the laptop: SUMMARY.md, results.json, screenshots, and recorder files. The uploaded corrected summary is retained under `reports/issues/2951317/received/2026-10-17/`; do not pair it with the older JSON. Preserve the original failed run and explain its test assumption rather than deleting or silently relabeling it.
- [ ] **Review and commit the replay correction and closeout files.** Check whether the same correction already exists on the current branch. Use an explicit file list when staging; `git add .` previously included unrelated collector code and PDFs. PR #22's broad commit was intentional work, but not the header fix; #23 contains the header fix.
- [ ] **Add a separately declared native-validation-enabled comparison.** Keep the existing default comparison intact. Apply the same enable_html5_validation setting/precondition on both sides through a registered, reproducible setup; do not silently edit the baseline or temporarily remove novalidate in the browser and call it default Drupal behavior. Record noValidate/formNoValidate and prove no POST when the hidden None choice is invalid. Check visible focus, error recovery, and success after a real choice. This is a proposed next step, not an already registered slug or completed test.
- [ ] **Complete a person-led keyboard pass** and save the viewer's downloadable log under the issue's manual/ folder. Check Tab and arrow keys, visible focus, required cues, and error recovery. The scripted Enter/arrow actions do not replace that log.
- [ ] **Run synthetic Guidepup comparison.** This is the lab's agreed screen-reader scope. Real VoiceOver/NVDA is not required unless Mike asks. Check group names and required/invalid information; do not require a live announcement unless the interaction calls for one.
- [ ] **Complete the remaining coverage matrix:** Chromium dark, forced colors, narrow viewport; Firefox and WebKit light. Chromium light 1280px is the only reviewed environment. Review each summary before broadening testing.
- [ ] **Test static validation without JavaScript** and distinguish server validation from browser validation. Dynamic #states require JavaScript. Contrib/Conditional Fields/Webform compatibility and full core PHPUnit/FunctionalJavascript tests remain separate gaps, not implied passes.
- [ ] **Test current core** with `2951317-latest` only after the pinned behavior is understood. Check patch application first. Re-fetch/re-pin deliberately if the MR or core moved; old evidence can become stale.
- [ ] **Reconcile page-level theme instrumentation** so the test route reports authoritative rendered theme data where available. Retain unknown when only stylesheet hints exist.
- [ ] **Before a complete MR review or Drupal.org draft**, refresh issue intake and read the parent/related issues and all MR discussions, including !3092 and !7341. Prior discussion requests returned HTTP 401. Zero fetched discussions does not mean no unresolved threads. No upstream comment, status change, or MR revision has been posted.
- [ ] **Future lab usability:** stop/status should distinguish running projects from already-stopped environments more clearly, avoiding repetitive shutdown messages. Keep that as a separate tooling improvement; do not mix it into the Drupal MR.

## Shutdown now

From the existing lab root on Mike's laptop:

```sh
node scripts/lab-env.mjs stop all
node scripts/lab-env.mjs status
docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'
git status --short --branch
```

This preserves databases, checkouts, and evidence. The assistant has not stopped Mike's Mac services remotely. The viewer address project and shared DDEV services may remain; docker ps also includes unrelated Docker projects. Do not delete environments or reset databases merely to close this session.

Last supplied status showed four running environments: the Before/After pairs for #2951317 and #3631337. The other listed environments were already stopped. One comparison pair, two Drupal environments, is the usual working state.

## Resume later

Use the existing lab checkout containing these issue files, not an old full ZIP snapshot. Inspect local changes before switching branches or pulling. If applying the supplied closeout ZIP, first review its file list with `unzip -l`; it contains focused source/document updates and received evidence, not core, databases, dependencies, or the old header patch.

```sh
git status --short --branch
git log -3 --oneline
node scripts/doctor.mjs 2951317-pinned
node scripts/lab-env.mjs start 2951317-pinned --browser
```

Open http://localhost:8100 if needed. Do not rerun setup for already-built matching sites. If the pair genuinely does not exist, use `node tools/compare/setup.mjs 2951317-pinned` once. Start only the pair being examined.

Run the corrected evaluator and update coverage:

```sh
node tools/playwright/evaluate-2951317.mjs 2951317-pinned
node scripts/coverage.mjs 2951317
```

The first command prints a new timestamped run folder. Read that folder's SUMMARY.md and results.json, not the issue-level SUMMARY.md or COVERAGE.md. Two current run records do not mean two environments tested. A mixed verdict with an explicitly inapplicable native-blocking row is expected in the default setup.

The header fix is already merged in #23. Its fixed row is 2.5rem; path/theme text does not expand on hover/focus. Full theme detail remains available in Environment and assistive text. Verify the served copy with:

```sh
curl -s http://localhost:8100/ | grep -F 'grid-template-rows: 2.5rem'
```

A one-time-login message visible on only one side creates a separate content offset; dismiss it before judging layout alignment.

## Other work retained

- PR #22 merged the design collector/print workflow, tests, docs, and #3631337 evidence (main merge `e039642`). See docs/DESIGN-COLLECTOR-FIX.md, docs/DESIGN-GATHERING.md, docs/DESIGN-REVIEW-NEXT.md, and docs/design-pages.pilot.json. Its five CI checks passed in Mike's transcript. This does not establish complete design-system coverage or print accessibility.
- PR #23 merged the header fix (main merge `5c1bf90`, source commit `ca5e161`). It was confirmed served locally and Mike reported improvement. No further header patch should be needed on current main.
- Stopped #3593502 environments reported a changed recipe: stored `453184a459c0` versus current `29e95fe66b09`. Reconcile before testing that issue; do not reset it casually. Snapshot before any database-destructive repair.
- Stopped #3426468-latest After reported unapplied patches. Review local edits before a deliberate `setup.mjs 3426468-latest --refresh-patches`. These warnings do not invalidate the #2951317 run.
- Git's earlier no-upstream error was resolved by publishing the branch. A new branch needs `git push -u origin HEAD`; run ready-to-push first. CI passing and a PR being merged are distinct from browser evidence.

## Publication and scope rules

Keep the MR patch unchanged unless a real defect is established and a separate follow-up is declared. Follow AGENTS.md for patch-change records, snapshots, draft evidence, and approvals. Run `node scripts/ready-to-push.mjs` before any push. Push review work to a PR branch, never directly to main. Check lab.config.yml's auto-fix setting when opening a PR; do not let automation silently rewrite a patch under test. Do not post to Drupal.org without explicit authorization.

This closeout is prepared locally; it has not been pushed or merged. It corrects outdated preparation-only statements and unconditional native-blocking expectations. The original uploaded run evidence is retained unchanged.
