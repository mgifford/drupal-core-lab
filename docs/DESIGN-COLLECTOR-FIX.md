# Design collector evidence update

Draft tooling, based on the supplied 3631337-pinned captures. No Drupal patch,
theme CSS, database, or accepted design policy changes are included.

## What changes

- Timestamped observations are compact JSON compressed directly to `.json.gz`,
  atomically replaced after each route. No large raw JSON copy is written.
  Compression reduces storage, not the in-memory report size. It does not guarantee
  every future capture stays below GitHub's file limit; inspect files before committing.
- Letter (8.5 × 11 inches) is the default. `--paper=A4` and `--paper=both` are optional.
  Screen/print style comparisons remain at the original browser viewport. Additional
  lightweight print geometry uses the selected paper width at 96 CSS pixels/inch.
- Fixed/sticky panel intersections and horizontal overflow are draft PRN-02
  candidates. Matching uses structural identities, separately for paper, state and
  motion preference. Results distinguish persistent, introduced, resolved and
  inconclusive. Equal totals do not imply identical findings.
- Unknown actual themes, different themes/preferences, truncated inventories and
  unstable readiness prevent a comparable paper result. Configured themes and
  asset paths never substitute for actual request-theme evidence.
- PRN-01 content inclusion and PRN-03 pagination remain explicit manual reviews.
  Zero geometry candidates is not a pass. CSS `@page` declarations are inventoried;
  their margins, fragmentation and native printer output are not reproduced by a
  viewport rectangle. PDFs are separate output evidence and may trigger print events.
- Coverage separates attempted pairs, compared pairs, missing pages, redirects,
  duplicates and failures. Counts can overlap. A resolved route already captured
  for the same account, supplied context and scenario is not resampled.
  This is not component clustering or exhaustive site discovery.
- The review manifest drops Basic page creation because it returned 404 in the
  supplied capture. Article remains the explicit CKEditor fixture.

## Verify the update

From the repository root:

```sh
npm ci --ignore-scripts --prefix tools/playwright
npx --prefix tools/playwright playwright install chromium
node --test tests/design/*.test.mjs
node tools/playwright/design-print-fixture.mjs
node tools/playwright/design-observations-fixture.mjs
node scripts/selftest.mjs
```

The new browser fixture uses a clean control and a deliberate width-dependent
panel intersection, tests persistent/introduced/resolved identity, exports a PDF,
and checks optional A4. Its editor is synthetic; it does not validate Drupal's CKEditor.

## First local pilot

Keep the existing pair running. In a second terminal at the repository root:

```sh
node tools/playwright/gather-design.mjs 3631337-pinned --pages=docs/design-pages.pilot.json --motion-matrix --max-pages=3 --pdf
```

This captures login, account settings and Article creation, on both sides, with
normal/reduced motion. Normally there are 12 Letter PDFs. No content is saved.
Exit 2 means incomplete evidence such as a missing editor, route or PDF; inspect
reports before interpreting differences. It does not count design violations.

Open the timestamped HTML report in the output directory. Compare the paper-width
rows with each PDF. Check content omitted or unnecessarily retained, headings,
form labels, editor toolbar/content boundaries, wrapping, overlap and nearly empty
sheets. Record intended exceptions before proposing CSS changes. A persistent
problem is worth fixing even when a patch introduces no new differences.

Return the `.json.gz`, HTML, Markdown and representative PDFs. Include actual-theme
unknowns and any console errors. Do not send session profiles or credentials.

## Re-render old and new evidence

```sh
node tools/playwright/render-design.mjs /path/to/observations.json.gz
node tools/playwright/render-design.mjs /path/to/older-observations.json --out=/path/to/review
```

Older captures lack paper-width geometry. Re-rendering labels that gap inconclusive;
it cannot reconstruct measurements or PDFs that were never captured.

After the pilot, use the seven-page review manifest, then a bounded crawl without
PDFs. Larger crawls should follow successful controls and reviewed findings.
A shared crawl button and whole-site axe/Lighthouse remain later work.
