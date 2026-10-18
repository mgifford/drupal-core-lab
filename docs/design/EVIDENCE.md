# Evidence provenance

This reference uses Mike Gifford's supplied local captures, not a new Drupal run.
The compact evidence summary is maintained in the HTML template. Raw observations
and PDFs are deliberately not included in this documentation bundle.

- Comparison: 3631337-pinned, reported Standard profile, Drupal 12.0-dev.
- Core: 6868135abe8e18373329d51bcb2d2bc81967d8c0.
- Before patches: parent test-support patch from 3604037, then the 3631321 inactive-tab-border patch.
- After patches: the same ordered stack plus the local 3631337 error-shapes patch.
- PDF capture started: 2026-10-17T14:07:51.160Z; uploaded as Archive(1).zip.
- Crawl started: 2026-10-17T15:08:14.508Z; artifact name begins observations-3631337-pinned-2026-10-17T15-08-14-508Z.
- Chromium 156.0.8078.4; macOS arm64; 1280 by 900 viewport; light colour scheme;
  forced colours off; default and reduced-motion captures; screen and print.

These are patched comparison environments, not untouched upstream. Actual theme
hints were missing on some pages. The raw data does not identify the reason for
missing hints, fully attribute CSS, compute complete accessible names, or establish
accepted design intent. Initial editor presence does not test formatting or saving.
No new keyboard, screen-reader, native OS preference or printer test was performed
while preparing this reference. The paper-width print defects were visually
reviewed in the supplied PDFs; the overlap heuristic did not capture them.

The HTML identifies the scope of external references and which Drupal UI child
pages were reviewed. Current issue/MR status was not audited for this document.
All proposed contracts remain unapproved; they are not implemented scanner rules.
