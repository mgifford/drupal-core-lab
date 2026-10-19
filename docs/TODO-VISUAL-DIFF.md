# To do: whole-page visual comparison, Before vs After

Not built. A sibling of `tools/playwright/tree-diff.mjs` for what the change looks like: screenshot each page Before and After at
several widths and states, diff the pixels, and report where the page changed.

What the lab already has, to build on rather than repeat:

- The viewer's **onion skin** and **difference** views (`tools/compare/index.html`): live, one page at a time, a person looks.
- `tools/playwright/gather-design.mjs`: element geometry compared Before vs After (`lib/design-review.mjs` `compareLayout`), a
  page crawl (`--crawl`, `lib/design-crawl.mjs`), forced colours, contrast, motion and print captures.
- Evaluators photograph specific states (for example the #3619154 close button in forced colours).

## Open-source tools to evaluate

| Tool | Licence | What it would give |
|---|---|---|
| Playwright `toHaveScreenshot()` | Apache-2.0 | Already installed. Masks, `animations: 'disabled'`, a style file to hide noise, pixel thresholds. Built around stored baselines, not two live sites. |
| pixelmatch | ISC | A small per-pixel diff library with anti-aliasing detection (Playwright's default comparison is based on it); enough for a first version. |
| odiff | MIT | Much faster native diff for large full-page images; ignore regions, anti-aliasing tolerance. |
| looks-same | MIT | Perceptual tolerance (colour distance), ignores a text caret; used by Testplane. |
| BackstopJS | MIT | A complete runner: scenarios, viewports, hide/remove selectors, ready scripts, an HTML report with a scrubber; often used on Drupal sites, and has a Playwright engine. A variant could generate its config (reference = Before, test = After). |
| reg-suit / reg-cli | MIT | Compares two folders of images and writes an HTML report (slider, toggle): fits "capture both sides ourselves, then compare". |
| Lost Pixel | MIT | Open-source mode for page screenshots on Playwright. |
| Visual Regression Tracker | Apache-2.0 | Self-hosted server with a baseline approval interface, if history and approvals across runs are wanted. |
| Testplane (formerly Hermione) | MIT | Test runner with screenshot assertions on looks-same. |

Check each one's current release, maintenance and licence before adopting it; prefer a library over a service, and nothing that
uploads screenshots of a logged-in admin site anywhere.

## Steps

1. **Decide the engine.** First choice: Playwright screenshots + pixelmatch (no new heavy dependency), with BackstopJS or
   reg-cli only if their reports are worth the weight. Record the decision in `docs/TESTING-TOOLS.md`.
2. **`tools/playwright/visual-diff.mjs <nid|slug>`**, shaped like `tree-diff.mjs`: the same login, the evaluators' checks that each
   side is what the variant says, the variant's pages or `--page`, `--crawl` (reuse `lib/design-crawl.mjs`) or a sitemap with a page
   cap, and the "any two sites" form (`--before=<url> --after=<url>`, for example core 11.x against `main`).
3. **Widths:** 320, 768 and 1280 by default. 320 CSS pixels is the WCAG 1.4.10 Reflow case (1280 at 400% zoom).
4. **Stable captures:** animations and transitions off, `prefers-reduced-motion`, fonts loaded, the caret hidden, and masks for
   what differs between any two builds (dates such as "Last saved", tokens, CKEditor ids). Per-variant mask selectors in
   `variants.json`.
5. **Accessibility states**, which general visual tools leave out:
   - forced colours (a light and a dark palette), dark scheme, `prefers-contrast: more`;
   - WCAG 1.4.12 text spacing (the standard CSS override), 200% text-only zoom, right to left;
   - keyboard focus on each focusable element in turn, to compare focus indicators (WCAG 2.4.7, 2.4.11, 2.4.13);
   - hover.
6. **Changed regions, named:** turn the diff into bounding boxes, and map each box to the elements under it (`elementFromPoint`,
   the geometry from `compareLayout`), so the report says what moved or changed ("`button.meta-sidebar__trigger` moved 12px left"),
   not only where pixels differ.
7. **Report:** `SUMMARY.md` per page × width × state: share of pixels changed, the regions, small crops of each region Before and
   After, and a link to open that page in the viewer. Read it next to the tree diff: a visual change with no change in the
   accessibility tree, or the reverse, is the interesting case.
8. **Light on disk:** keep only the crops of changed regions and a small overview image (WebP); full screenshots stay out of git
   (an ignored folder) and are replaced by each run; default page and width caps.
9. **Tests:** fixture pages with a known pixel change, a masked dynamic region and an animation; the diff and report code
   testable in CI without a browser, like `lib/tree-format.mjs`.
10. **DDEV Coder:** headless only, same commands; nothing opens a window.
