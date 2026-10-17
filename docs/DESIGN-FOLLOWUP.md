# Design gathering: first-run follow-up

This follows the standalone V3 pilot and the first five-page #3630425 run. The baseline includes main at 604b4717834a1deb94e165cd30353f278b20cc35 (PR #19), which already fixes the #3615469 probe. No issue patch stack or Drupal baseline is altered.

## Changes

- ARIA ID strings remain in the evidence. Ordered references compare by target structural key, tag, role, text/aria-label SHA-256 signatures, visibility and duplicate-ID count. Matching target evidence separates ID-only changes from structural/style findings. Missing, duplicate, reordered and changed targets remain differences. Older snapshots without target signatures keep exact comparisons. Nested aria-labelledby relationships retain exact comparison for separate review. This is not a complete accessible-name algorithm or proof that two references are equivalent.
- Semantic text signatures for headings, labels, legends, captions, table headers, buttons, links, summaries, definition terms, emphasis and explicit aria-labels reveal text-only changes, including an empty header gaining Operations. Literal text and field values are omitted. Hashes are not anonymization; labels may be guessable. Use disposable test data.
- Same-origin, unaggregated stylesheet paths provide theme candidates, source and supporting-only confidence. Multiple candidates may include base themes. Actual request theme remains unknown if the Drupal settings hint is absent. Configured default/admin themes are shown separately in reports. Asset paths omit queries; no CSS path is promoted to an authoritative theme or transition.
- Summaries and HTML report include screen-to-print hidden, revealed and restyled counts, paired print differences, and separate ID-only observations. Counts overlap and include inherited changes and descendants. HTML retains a print stylesheet and a main landmark.
- The schema is lab-design-observations-2. New runs are needed to collect target/text signatures and theme asset evidence. Existing JSON is not silently rewritten or reclassified.

## #3630425 page and interaction coverage

Use the existing registered comparison with its repro_3630425 recipe, not a plain site. The dedicated manifest includes the original five pages and /node/add/article:

```sh
node tools/playwright/gather-design.mjs 3630425-pinned --pages=docs/design-pages.3630425.json --max-pages=6
```

Only that explicitly selected page uses the curated 3630425-multivalue scenario. It measures the initial widget, clicks its known Add another item control, measures after-add, clicks the last named Remove control and measures after-remove. Each state gets screen and print observations. The Article is never saved. Unknown scenarios and wrong account/path combinations are rejected. Missing widget preconditions or incomplete states produce an error instead of an apparent pass. This does not add arbitrary interaction exploration to the crawler.

The existing issue evaluator remains the stronger issue-specific assertion and records the full header/axe/ARIA evidence:

```sh
node tools/playwright/evaluate-3630425.mjs 3630425-pinned
```

For separate preference/print investigations:

```sh
node tools/playwright/gather-design.mjs 3630425-pinned --pages=docs/design-pages.3630425.json --max-pages=6 --motion=reduce --out=reports/local-design/reduced-motion
node tools/playwright/gather-design.mjs 3630425-pinned --pages=docs/design-pages.3630425.json --max-pages=6 --contrast=more --forced-colors --out=reports/local-design/forced-more
node tools/playwright/gather-design.mjs 3630425-pinned --pages=docs/design-pages.3630425.json --max-pages=6 --pdf --out=reports/local-design/print-review
```

## Selftest repairs

Two legacy .js scripts contained TypeScript declarations; these are now JavaScript. The generator also had unescaped nested template literals, and both commands used an undefined __dirname in ESM. These are repaired without changing the generated test templates' purpose. Offline tests execute every generator template, parse the generated TypeScript and run the interpreter on a fixture.

Selftest explicitly requests TAP, runs test files serially because some mutate shared Lab fixtures, reports assertion/stderr/process diagnostics, and now includes tests/design. An absent summary is a failure, not a pass. js-yaml is still required by the existing tools: install it with `npm install --prefix tools/compare/.deps js-yaml@4` if missing.

The HTTPS unit test formerly relied on real DNS/egress for an invalid domain, despite selftest being described as offline. It now injects the request transport and checks DNS failure, HTTP denial and timeout deterministically. Production requests still default to node:https.request. This is not a network availability claim; live network checks remain separate.

## Controls and limitations

Unchanged-control tests must report no captured difference. Deliberate bold and semantic-label changes must produce a difference. Changed generated IDs alone must be retained separately, while broken/duplicate/reordered references stay detectable. The browser fixture exercises unchanged/positive controls, theme assets, print, source guards, keyboard download and panel axe. The curated scenario also has isolated sequence tests.

These controls validate specific detection paths, not comprehensive semantic coverage. Server theme-negotiation tracing, full accessible-name computation, intelligent page-family sampling, a Design dock panel/crawl button, colour-intent validation and whole-site axe/Lighthouse remain future work.
