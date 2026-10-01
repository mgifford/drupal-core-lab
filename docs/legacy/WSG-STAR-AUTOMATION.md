# WSG STAR × Drupal Core Crawl — Automation Classification

**Scope:** the 34 techniques in STAR category 3, *Web Development*, from the
W3C [Sustainability Techniques And Recommendations (STAR)](https://w3c.github.io/sustainableweb-wsg/star.html)
companion to the draft [Web Sustainability Guidelines](https://www.w3.org/TR/web-sustainability-guidelines/)
(source: [star.json](https://github.com/w3c/sustainableweb-wsg/blob/main/star.json), edition 2026-07-03).

**Question answered:** which STAR test procedures can the existing Playwright
crawl (`core/tests/playwright/tests/a11y-axe-crawl.spec.ts` + the
sustainability metrics collector) execute automatically, per page, on every
scan?

## Classification key

| Status | Meaning |
| :--- | :--- |
| ✅ **Implemented** | The crawl already measures this on every run |
| 🔧 **Automatable — page-level** | The crawl can execute this with a small addition (listed) |
| 🟡 **Partial** | Machine-checkable, but at repo/CI level or only as a heuristic — not a per-page crawl check |
| 👤 **Manual / policy** | Human judgment, product, or organizational process; the crawl can at most supply supporting data |

## Summary

Of 34 Web Development techniques: **10 implemented, 3 automatable page-level,
12 partial, 9 manual/policy.** The 13 implemented+automatable techniques are
the recommended scope for a "WSG check" pass in the crawl.

## Technique-by-Technique

| # | Technique | Status | How the crawl covers it (or why not) |
| :--- | :--- | :--- | :--- |
| 1 | [performance-goals](https://w3c.github.io/sustainableweb-wsg/test-suite/performance-goals.html) — Profile existing projects to identify common factors of value | 🟡 Partial | The metrics history (`reports/sustainability/history.json`) *is* the profile; setting goals from it is a human step. |
| 2 | [energy-intensity](https://w3c.github.io/sustainableweb-wsg/test-suite/energy-intensity.html) — Calculate the energy intensity of technologies | ✅ Implemented | CO2.js (SWD v4) per-byte estimates per page per run, in `analyze-sustainability.js`. |
| 3 | [minified-code](https://w3c.github.io/sustainableweb-wsg/test-suite/minified-code.html) — Minify public front-end code | 🔧 Automatable | Fetch each same-origin `.js`/`.css` response; flag assets whose whitespace/newline density exceeds a minified threshold. |
| 4 | [code-splitting](https://w3c.github.io/sustainableweb-wsg/test-suite/code-splitting.html) — Code-split to reduce payloads | 🟡 Partial | Unused-byte % from the Chrome coverage API (below) is the signal; whether to split is a build-level decision in core's build pipeline. |
| 5 | [remove-redundancy](https://w3c.github.io/sustainableweb-wsg/test-suite/remove-redundancy.html) — Eliminate redundant code via coverage/tree-shaking | 🔧 Automatable | Playwright exposes `page.coverage.startJSCoverage()`/`startCSSCoverage()`: record unused bytes per bundle per page; report worst offenders. |
| 6 | [organize-code-arrangement](https://w3c.github.io/sustainableweb-wsg/test-suite/organize-code-arrangement.html) — Remove duplication | 🟡 Partial | Repo-level duplication tooling (e.g. jscpd) in CI, not a page-level crawl check. |
| 7 | [assess-and-reduce](https://w3c.github.io/sustainableweb-wsg/test-suite/assess-and-reduce.html) — Assess third-party impacts | ✅ Implemented | Resource Timing entries whose origin ≠ page origin: count + bytes per page. Core pages should be zero; any hit is a finding. |
| 8 | [third-party-implementation](https://w3c.github.io/sustainableweb-wsg/test-suite/third-party-implementation.html) — Import-on-interaction for third parties | 👤 Manual | Facade patterns need human review of interaction design. |
| 9 | [self-hosting](https://w3c.github.io/sustainableweb-wsg/test-suite/self-hosting.html) — Deliver content via the most sustainable pathway | ✅ Implemented | Same third-party detector as #7: flag any cross-origin font/script/style that could be self-hosted. |
| 10 | [third-party-preferences](https://w3c.github.io/sustainableweb-wsg/test-suite/third-party-preferences.html) — Let users choose third-party loads | 👤 Manual | Product/consent design. |
| 11 | [semantic-code](https://w3c.github.io/sustainableweb-wsg/test-suite/semantic-code.html) — Validate source for semantic accuracy | 🟡 Partial | `html-validate` could run against crawled DOM snapshots (nearly page-level automatable); axe's landmark/semantic best-practice rules already cover a subset. |
| 12 | [optional-features](https://w3c.github.io/sustainableweb-wsg/test-suite/optional-features.html) — Eliminate optional rendering code | 🟡 Partial | Coverage data (#5) identifies candidates; removal is a maintainer decision. |
| 13 | [non-standard-code](https://w3c.github.io/sustainableweb-wsg/test-suite/non-standard-code.html) — Replace non-standard syntax | 🟡 Partial | Lint-level (stylelint/doiuse) in CI against source, not the crawl. |
| 14 | [custom-code](https://w3c.github.io/sustainableweb-wsg/test-suite/custom-code.html) — Prefer efficient native APIs | 👤 Manual | Code-review judgment. |
| 15 | [asynchronous-code](https://w3c.github.io/sustainableweb-wsg/test-suite/asynchronous-code.html) — Scripts async or deferred | ✅ Implemented | DOM check per page: count `<script src>` without `async`/`defer`/`type="module"`; render-blocking scripts are findings. |
| 16 | [optimized-loading](https://w3c.github.io/sustainableweb-wsg/test-suite/optimized-loading.html) — Correct delivery route for load-time assets | 🔧 Automatable | DOM checks: below-the-fold `<img>` without `loading="lazy"`, missing `rel=preload` for late-discovered critical assets, `fetchpriority` usage. |
| 17 | [required-elements](https://w3c.github.io/sustainableweb-wsg/test-suite/required-elements.html) — Required HTML elements present | ✅ Implemented | DOM check: doctype, `<html lang>`, `<title>`, viewport meta. Partially covered by axe (`html-has-lang`, `document-title`) already. |
| 18 | [meta-tags](https://w3c.github.io/sustainableweb-wsg/test-suite/meta-tags.html) — Relevant metadata via a recognized scheme | ✅ Implemented | DOM check: `meta[name=description]`, Open Graph/canonical presence per page. |
| 19 | [structured-data](https://w3c.github.io/sustainableweb-wsg/test-suite/structured-data.html) — Content structured with Microdata | ✅ Implemented (presence) | DOM check for Microdata/JSON-LD blocks; full validity needs an external validator (partial). |
| 20 | [media-and-preference-queries](https://w3c.github.io/sustainableweb-wsg/test-suite/media-and-preference-queries.html) — CSS preference media queries applied | 🟡 Partial | The crawl already emulates `prefers-color-scheme`; a `prefers-reduced-motion` emulation pass asserting animations pause is a heuristic worth adding. |
| 21 | [device-adaptable](https://w3c.github.io/sustainableweb-wsg/test-suite/device-adaptable.html) — Test breakpoints and network speeds | ✅ Implemented (viewports) | 4 viewports per page every run; network throttling profiles would complete it (🟡 for that half). |
| 22 | [progressive-enhancement](https://w3c.github.io/sustainableweb-wsg/test-suite/progressive-enhancement.html) — Feature-test progressive enhancement | 🔧 Automatable (smoke) | A `javaScriptEnabled: false` pass asserting primary content renders without JS. |
| 23 | [carbon-aware-design](https://w3c.github.io/sustainableweb-wsg/test-suite/carbon-aware-design.html) — Configure around carbon-aware situations | 👤 Manual | Infrastructure/product design. |
| 24 | [alternative-browsing](https://w3c.github.io/sustainableweb-wsg/test-suite/alternative-browsing.html) — Low-impact/alternate interaction methods | 👤 Manual | Product design. |
| 25 | [sustainable-javascript](https://w3c.github.io/sustainableweb-wsg/test-suite/sustainable-javascript.html) — Optimize codebase for performance | 🟡 Partial | Main-thread/CPU time per page is measurable via CDP as a trend signal; the rewriting itself is manual. |
| 26 | [energy-relevant-apis](https://w3c.github.io/sustainableweb-wsg/test-suite/energy-relevant-apis.html) — JavaScript APIs correctly applied | 👤 Manual | Code review / targeted lint rules. |
| 27 | [dependency-management](https://w3c.github.io/sustainableweb-wsg/test-suite/dependency-management.html) — Remove unused packages | 🟡 Partial | Repo/CI level (`depcheck`, `composer unused`), not the crawl. |
| 28 | [dependency-necessity](https://w3c.github.io/sustainableweb-wsg/test-suite/dependency-necessity.html) — Modularized/lightweight libraries | 👤 Manual | Architecture decision. |
| 29 | [dependency-updates](https://w3c.github.io/sustainableweb-wsg/test-suite/dependency-updates.html) — Dependencies up to date | 🟡 Partial | Repo/CI level (`yarn outdated`, `composer outdated`); Drupal core already gates this in its release process. |
| 30 | [expected-files](https://w3c.github.io/sustainableweb-wsg/test-suite/expected-files.html) — Expected assets in base directory | ✅ Implemented | HTTP checks per run: `/robots.txt`, `/favicon.ico`, a themed 404/403, `/sitemap.xml` where applicable. |
| 31 | [beneficial-files](https://w3c.github.io/sustainableweb-wsg/test-suite/beneficial-files.html) — Beneficial plaintext assets in expected locations | ✅ Implemented | HTTP checks: `/.well-known/security.txt`, `humans.txt`, `carbon.txt`, web app manifest. |
| 32 | [appropriate-implementation](https://w3c.github.io/sustainableweb-wsg/test-suite/appropriate-implementation.html) — Sustainable creation toolchains | 👤 Manual | Organizational/toolchain policy. |
| 33 | [extensions-and-plugins](https://w3c.github.io/sustainableweb-wsg/test-suite/extensions-and-plugins.html) — Test third-party resources for impacts | 🟡 Partial | The module-testing framework (enable module → re-scan → diff) extends naturally from a11y impact to page-weight impact using the same pageMetrics. |
| 34 | [versioning](https://w3c.github.io/sustainableweb-wsg/test-suite/versioning.html) — Latest syntax language versions | 🟡 Partial | Doctype/ES-target detectable from shipped assets; meaningful checking is build-level. |

## Recommended implementation order (page-level checks)

Each of these fits the existing `scanRoute()`/`pageMetrics` pattern and the
`analyze-sustainability.js` report:

1. **Third-party / self-hosting detector** (#7, #9) — trivial with the
   Resource Timing data already collected (compare origins); zero extra load.
2. **Render-blocking script check** (#15) — one `page.evaluate()`.
3. **Required elements + meta tags** (#17, #18) — one `page.evaluate()`;
   dedupe against axe rules to avoid double-reporting.
4. **Expected/beneficial files** (#30, #31) — a handful of HTTP requests once
   per run, not per page.
5. **Lazy-loading / delivery-route heuristics** (#16, #19) — DOM checks with
   viewport math.
6. **JS/CSS coverage (unused bytes)** (#5, informs #4/#12) — highest value,
   moderate effort; adds per-bundle unused-byte trends to history.json.
7. **No-JS smoke pass** (#22) — separate small page set, anonymous pages only.
8. **Minification heuristic** (#3) — same-origin asset fetch + whitespace
   ratio; core ships minified assets, so this is a regression guard.

Manual/policy techniques belong in the WSG alignment statement
([WSG-ALIGNMENT.md](WSG-ALIGNMENT.md)) rather than the crawl.
