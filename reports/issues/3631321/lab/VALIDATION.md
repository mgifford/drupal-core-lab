# Validation, 2026-10-16

Prepared against drupal-core-lab `5ac97144af95ce42c4eab80afe565bb4f297a48f`. Node v24.19.0, Linux x64. AI-assisted work, no remote mutations.

| Check | Result |
|---|---|
| Parent diff | 30,189 bytes, SHA-256 a567bdee4cc084282ee0235141db415c7a8c1ef79e12fa2b91a94e8a839fc798, matches fetched MR !17078 diff |
| All six stacks | PASS: both sides of 3631321-pinned, 3631337-pinned, and 3631337-independent against exact base 6868135abe8e18373329d51bcb2d2bc81967d8c0 |
| Patch whitespace | PASS using git apply --check --whitespace=error |
| CSS source lint | PASS: actual Drupal core .stylelintrc configuration, Stylelint, both changed PostCSS files |
| Generated CSS | PASS: core/scripts/css/postcss-build.js --check from core/ on both files with both proposals applied |
| New viewer probes | PASS: checkProbe safety validator on every check in all five new variants |
| Registered variants | PASS: lab selftest resolves 39 variants, including the five additions |
| Coder instructions | PASS: both generated instructions match scripts/coder-prompt.mjs --check |
| JavaScript/shell syntax | PASS: lab syntax sweep plus explicit checks of importer and shared evaluator |
| Existing lab unit tests | 148/148 passed on the final direct TAP run. Earlier network-probe runs were intermittent; the failing probe also failed in an untouched checkout. |
| Existing issue-pack tests | 156/157 passed. Existing probe check fails at 3615469-pinned, “The login link includes page”, for assignment/semicolon. New probes pass separately. |
| Documentation checker | Existing missing reports/issues/3593502/resources/ also fails on untouched checkout. No new missing documentation links reported. |
| Generated cloud registry | PASS after build-cloud.mjs |
| Full selftest | NOT GREEN: existing probe test, intermittent network test, and missing documentation path. No unrelated fixes included. |
| Coverage | 0/7 live automated environments, 0 manual logs for each new issue. Explicitly NOT TESTED. |

## Not verified

Docker, DDEV, and PHP are unavailable here. No installed local browser was available; Playwright's browser download returned HTML rather than a ZIP. Consequently neither full Drupal site behavior nor CSS rendering was tested here. No screenshot is claimed as evidence. The live evaluators are prepared but have not been executed against Drupal. Full core CI lint, keyboard review, Guidepup/screen-reader checks, actual Farsi RTL, Firefox/WebKit, and native Windows/custom contrast palettes remain pending.

The parent issue's 57 comments, current MR metadata and diff were read. The review-thread endpoint returned HTTP 401; a zero count in the deterministic intake must not be treated as proof of no unresolved threads. Source snapshots and per-issue intake briefs are included.

## Repeat the verified patch check

```sh
node scripts/validate-forced-colors-patches.mjs /absolute/path/to/a/Drupal/git/checkout
```

The source repository must contain the pinned base object. This uses a separate temporary Git index and disposable files; it does not modify your core checkout or its index. The usual Lab `setup.mjs SLUG --check-patches` is also available and fetches the required core object if needed.

The proposed 3631337 patch intentionally addresses only grouping-error differentiation. Warning semantics and dedicated system colors require further design and standards discussion. Dotted/solid/double is a hypothesis for review, not an accessibility conformance claim.
