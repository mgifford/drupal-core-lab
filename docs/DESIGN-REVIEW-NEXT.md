# Editor, motion and print evidence

DRAFT. This extends design gathering. It does not change Drupal, the issue patch,
accepted design standards, or the viewer UI. Use disposable Lab sites and test data.

## First capture: eight distinct seed pages

With the existing `3631337-pinned` pair running, from the repository root:

```sh
node tools/playwright/gather-design.mjs 3631337-pinned --pages=docs/design-pages.review.json --motion-matrix --max-pages=8 --pdf
```

This visits login, password reset, site information, account settings, the content
listing, Article creation, Basic page creation and Help. The supplied sites were
Standard installs with Article and Basic page available. Other recipes can remove
or rename these content types; update the manifest rather than treating a 404 as a
design defect. Missing expected CKEditor is reported as a coverage gap and exits 2.
A textarea fallback is still captured so that evidence is not discarded.

`--motion-matrix` captures default and reduced motion on the same document for
each selected interaction state. It produces separate within-site preference
comparisons and Before/After comparisons under reduced motion. Do not combine
it with `--motion=reduce`. Existing single-mode commands remain supported.
Media changes are bounded by readiness sampling; continuing animations are not
stopped or hidden. A sampled stable document is not proof of application readiness.

With PDFs, this command normally generates 64 PDFs: eight pages, two sides,
two preferences, two paper sizes. Prefer the following crawl without PDFs first
if disk space is limited. All output filenames retain the UTC run timestamp.

## Broader discovery

```sh
node tools/playwright/gather-design.mjs 3631337-pinned --pages=docs/design-pages.review.json --motion-matrix --crawl --max-pages=20
```

Seeds take priority. Discovered routes are ordered to favour less-visited route
families, keeping account and explicit context separate. Numeric path segments
share a family; help topics share a family. This is a scheduling heuristic, not
DOM/template clustering. URLs remain queued, not silently excluded. A recipe
with 15,000 menu entries still needs a deliberately narrow allowlist and budget.

The example allowlists only `/admin/help` and `/node/add`. It does not expand the
crawl to every admin route. Rejection reasons count unique reason + origin + path
combinations; rejectedLinks counts occurrences across pages and both sides.
Duplicate eligible links are counted separately. `queuedNotVisited` is the
remaining discovered queue, not an estimate of all untested site URLs.

## Editing existing content

Creation pages and editing pages can have different fields, states and editor
configuration. Do not assume that node 1 exists or represents a useful fixture.
Copy the manifest, add one known test node's edit route and keep `editor: true`:

```json
{"path":"/node/123/edit","account":"administrator","editor":true}
```

Replace 123 with the fixture node ID. If Before and After use different IDs, use
explicit `beforePath` and `afterPath` in that record. Neither content creation nor
editing is submitted by this collector. Do not set broad `/node` crawl prefixes.
The optional existing 3630425 multivalue scenario remains a separate manifest.

## What to review

- Editor UI and editable content have distinct `region` values on every recorded
  element, with counts in the human report. Compare font, emphasis, colour,
  semantics and media responses within the correct region. This does not establish
  an intended style contract or compare saved content with a frontend theme.
- Generated CKEditor IDs use structural keys. Raw ARIA reference IDs are retained.
  Changed relationships, text signatures and broken targets still produce changes.
  Structural keys can mismatch after insertions; review unmatched elements.
- Motion evidence distinguishes declared animations, declared transitions,
  running animations and smooth scrolling. Declarations do not prove actual motion;
  a remaining transition under reduce is a review candidate, not a failure.
  Equivalent cues, task completion, JS-triggered motion, focus and invalid states
  require explicit scenarios and human review.
- Geometry comparisons are separate from style/semantic counts. Matched visible
  elements changing by over one CSS pixel are listed in JSON. Different environment
  hostnames or test data can cause wrapping. Input values are not recorded.
- Print evidence flags fixed/sticky navigation and its rectangle intersections
  with content. This can identify an existing problem on both sides, independent
  of patch differences. It is not proof of occlusion: stacking, sticky positioning,
  viewport size and paper pagination require PDF/manual review.
- PDFs use Chromium's A4 and Letter output with backgrounds off. Page counts,
  nearly empty final sheets, PDF accessibility and native printer output are NOT
  automatically analysed in this update. The print DOM is measured at the browser
  viewport, not separately at each paper size.
- Theme stylesheet paths support an inference only. A missing active-theme hint
  remains unknown. Vendor `themes` directories are no longer mistaken for Drupal
  theme names. This path inventory targets root-mounted Lab sites.
- Configuration errors, absent expected editors and unsuccessful readiness samples
  are exposed in the report. Reports remain DRAFT and do not certify conformance.

## Hypotheses from the supplied captures

1. Print navigation overlays content on both sides, so a regression-only report
   misses it. Confirm site information and account settings in manual print
   preview, then isolate the navigation/theme print CSS responsible. No core fix
   is included here.
2. Reduced motion affects transition declarations on all five original seed pages.
   Compare the same document in both modes to reduce reload noise. Do not infer
   motion quality from zero Before/After differences.
3. A help-only expansion underrepresents component diversity. Compare route-family
   coverage and queue counts before increasing the page budget.
4. CKEditor should appear on the Article and Basic page forms in this Standard
   setup. Missing editor readiness should become evidence, not a silent success.
