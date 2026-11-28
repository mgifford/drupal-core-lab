# Reproduce #3466040 / MR !9088

**DRAFT — setup and steps actually used in the independent review.** Results are in [REVIEW.md](REVIEW.md) and [EVIDENCE.md](EVIDENCE.md). Re-running on updated core requires re-pinning and re-checking the patches.

## Identity

| | |
|---|---|
| Issue | [#3466040](https://www.drupal.org/project/drupal/issues/3466040) |
| MR | [!9088](https://git.drupalcode.org/project/drupal/-/merge_requests/9088) at `aed1df5eeddf0b89c91bab47eb83847f44c58211` |
| Base | `97c6ff8b2534b242c0f1df3e4ba2493e56aebcec` (2026-11-23) |
| Variant | `3466040-regression-pinned` — Before `baseline-3466040` + test-support; After `issue-3466040` + MR |
| Recipe | `recipes/repro_3466040` (Article type, French, Config Translation) |
| MR patch | `reports/issues/3466040/branches/3466040-dialog-buttoninputs-not.patch` |
| Test-support | `reports/issues/3466040/branches/3466040-test-support.patch` (fixture/test only, no production code) |

## Preconditions

- Docker and DDEV available; both sites built at the same core commit and the recipe applied to both.
- Before also carries the declared test-support patch; After carries the full MR. The only production difference is `core/misc/dialog/dialog.position.js`.
- Test-extension discovery enabled and the fixture module installed on both:

```bash
cd envs/baseline-3466040
ddev drupal test:extensions-enable
ddev drupal module:install dialog_renderer_test
ddev drupal cache

cd ../issue-3466040
ddev drupal test:extensions-enable
ddev drupal module:install dialog_renderer_test
ddev drupal cache
```

- Log in as an administrator (the Lab's scripts use the one-time login link, not a typed password).

## Build and start

```bash
node tools/compare/setup.mjs 3466040-regression-pinned --check-patches
node tools/compare/setup.mjs 3466040-regression-pinned
```

The first command only checks that both patch stacks apply. If the sites are not up, start the pair with `node scripts/lab-env.mjs start 3466040-regression-pinned`.

## Shortest reproduction (the MR fixture)

| Step | Expected user outcome | Observed Before | Observed After |
|---|---|---|---|
| Open `/dialog_renderer-test-links` and click **Details modal!** | A short modal dialog opens, OK visible | `302 x 265.4`, OK in view | same |
| Click **Show more content** | The dialog re-fits; OK stays visible and reachable | dialog `top 251.3 → bottom 980.3` (`212.3px` below a 768px viewport); OK at `y 926.3`, off-screen | dialog `top 19.5 → bottom 748.5`; OK at `y 694.5`, visible and hit-testable |
| Tab from the summary to OK | Focus stays on a visible control | focused but off-screen, no scroll possible | focused, in view, hit-testable |
| Close and re-open three times | No size drift, no leaked observer, no errors | n/a | 4 observers created, 4 disconnected, 0 errors |
| Repeat expand/collapse five times | The dialog returns to the same size | stable `980.3 / 516.7` | stable `748.5 / 516.7` |

Selectors: `a[href="/dialog_renderer-content-details"]`, `.ui-dialog`, `.ui-dialog-titlebar`, `.ui-dialog-titlebar-close`, `.ui-dialog-content`, `.ui-dialog-buttonpane`, `.ui-dialog-buttonpane button`, `.ui-dialog details summary`.

## Scripted replay

```bash
node tools/playwright/review-3466040.mjs 3466040-regression-pinned --viewport=1024x768
node tools/playwright/matrix-3466040.mjs 3466040-regression-pinned --side=after
node tools/playwright/evaluate-3466040.mjs 3466040-pinned --scenario=views --viewport=1920x1080
```

The first is the full probe used for the primary evidence; the second is the configuration matrix (zoom/viewport/colour), which did not complete in this session because Docker Desktop stopped under host memory pressure; the third records the Views UI scenario.

## The issue's other steps (pristine pair, 2026-11-27 second pass)

The fixture runs use `3466040-regression-pinned` (Before + declared test-support patch). The issue's own
admin-UI steps use the pristine pair, `3466040-pinned`:

```bash
node scripts/lab-env.mjs start 3466040-pinned
node tools/playwright/evaluate-3466040.mjs 3466040-pinned --scenario=views --viewport=1920x720
node tools/playwright/evaluate-3466040.mjs 3466040-pinned --scenario=field-ui --viewport=1920x720 --settle=1200
node tools/playwright/evaluate-3466040-translation.mjs 3466040-pinned --viewport=1920x1080
node tools/playwright/evaluate-3466040-translation.mjs 3466040-pinned --viewport=1920x720
```

- **Views filter** (`/admin/structure/views/view/content` → "Content: Content type" → expand details):
  **not reproduced** at 1080 or 720. Views UI's `dialog.views.js` sizes an inner
  `[data-drupal-views-scroll]` container; the dialog stayed `845.4px` at 1080 and `1442×684` (`18→702`) at
  720 on both sides while 4 of 5 details were expanded. `Apply` stayed in view and hit-testable.
- **Field UI** (Article → Manage fields → Add a Date and time field → field config → "Set default value"):
  **not reproduced** at 1080 or 720. The config dialog opens already at the 95% cap (`1026px` at 1080,
  `684px` at 720), so enabling the default value grows only the scrollable content area (`536/1272` at 720);
  Save stays in view, hit-testable and reached in 6 real Tab presses on both sides.
- **Multilingual view translation** (`/admin/structure/views/view/content/translate` → French **Add** → expand
  details): **reproduced on Before and fixed on After**, with a small magnitude.
  - 1920×1080: Before `221.8→1082.9` after the first expansion (`2.9px` below the viewport), content
    `713/713` so it cannot scroll, and the Tab walk ends on Close without reaching "Save translation". After:
    the expansion is re-centred (`109.5→970.6`), a second expansion caps it at `27→1053` with content
    `878/1307` scrolling, and the Tab walk reaches "Save translation".
  - 1920×720: Before `41.8→725.8` (`5.8px` overflow), focus ends on Close; After `18→702`, fits, Save
    reached.
- The evaluator's Field UI step needed a timing fix for the AJAX-replaced modal (it failed only on the
  pristine side); this was a harness bug, not product evidence.

## Re-running the pristine pair after a fixture run

The fixture run (`3466040-regression-pinned`) puts the declared test-support patch on `baseline-3466040`.
Before using `3466040-pinned` again, restore the pristine Before:

```bash
node tools/compare/setup.mjs 3466040-pinned --refresh-patches
```

If setup reports that the checkout does not match its patches after a manual `git checkout`, that is the stale
patch record; `--refresh-patches` rewrites both the files and the record.

## Acceptance and verification plan

- The action pane is visible and hit-testable after the details expands.
- The details is actually open, and the content area scrolls rather than being clipped.
- The observer settles (no callbacks after settling) and is disconnected on close.
- No console/page errors; no size drift over repeated open/close.
- The configuration/AT matrix and a person's keyboard/screen-reader pass are completed before RTBC.

## Evidence and limits

Primary run: [`playwright/2026-11-27T16-43-04-546Z-chromium-light-1024x768-fixture/`](playwright/2026-11-27T16-43-04-546Z-chromium-light-1024x768-fixture/SUMMARY.md). Console and page errors: none. Not tested: zoom, narrow viewports, dark/forced colours, reduced motion, real browser zoom, Firefox/WebKit, real AT, a person's keyboard pass, local PHPUnit. See [REVIEW.md](REVIEW.md#not-tested-and-what-needs-a-person).
