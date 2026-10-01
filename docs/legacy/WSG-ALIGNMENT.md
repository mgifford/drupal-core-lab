# Drupal & the W3C Web Sustainability Guidelines — Alignment Statement (Draft)

**Status:** draft for community review — intended as content for
[drupal.org/about/sustainability](https://www.drupal.org/about/sustainability)
and as a real-world CMS reference implementation offered to the
[W3C Sustainable Web Interest Group](https://www.w3.org/groups/ig/sustainableweb/).

**Standard referenced:** [Web Sustainability Guidelines (WSG), W3C Group Draft Note](https://www.w3.org/TR/web-sustainability-guidelines/)
with its [STAR techniques](https://w3c.github.io/sustainableweb-wsg/star.html)
(93 guidelines / ~196 success criteria across UX design, web development,
hosting, and business categories).

> The WSG is a draft Interest Group Note: there is no formal conformance to
> claim, and this document claims none. It documents *alignment* — what
> Drupal core already does, with evidence; where it falls short, with open
> issues; and how alignment is measured over time.

---

## Why a CMS matters here

Drupal powers a meaningful share of the web's output. A default that saves
20 KB per page view in core is multiplied across millions of sites and
billions of page views — platform-level defaults are among the highest-
leverage sustainability interventions the web has. That is also why the WSG
Interest Group needs CMS reference implementations: most WSG success
criteria are ultimately delivered (or blocked) by platform defaults, not by
individual site owners.

## What Drupal core already does (evidence-based)

Mapped to WSG categories. Each item is a shipped core capability, most of
them on by default.

### Efficient delivery (WSG §3 Web Development)

- **CSS/JS aggregation and minification** on by default — fewer, smaller
  requests per page.
- **Native lazy loading** — images render with `loading="lazy"` by default;
  oEmbed/remote media iframes are lazy-loaded.
- **Responsive images** — the Breakpoint and Responsive Image modules
  generate `srcset`/`sizes` variants so devices download only the pixels
  they need.
- **Image style pipeline** — server-side resizing/re-encoding with WebP
  conversion support, so originals are never shipped to browsers.
- **Render caching, Internal Page Cache, and Dynamic Page Cache** on by
  default — repeated views cost near-zero compute; cache tags make CDN and
  reverse-proxy caching precise instead of TTL-guesswork.
- **BigPipe** streams personalized fragments so the cacheable page shell
  arrives immediately — less main-thread work and fewer full re-renders.
- **Semantic, lean front-end defaults** — Olivero ships semantic HTML5 with
  modest JavaScript; core has systematically reduced jQuery usage on
  anonymous-facing pages.

### Longevity and social equity (WSG §2 UX Design, §5 Business)

- **Accessibility as a core gate** — WCAG 2.2 AA-oriented policies with a
  dedicated maintainer team; 46 of the WSG guideline tags are shared with
  accessibility, and this overlap is where Drupal is strongest.
- **Device longevity** — progressive enhancement policies and broad browser
  support keep older hardware useful (usable interfaces without bleeding-edge
  devices).
- **Multilingual by default** — 100+ language community translations reduce
  duplicated site builds.
- **Open source itself** — shared platform maintenance amortizes the
  embodied cost of software across the whole ecosystem (WSG §5 asks
  organizations to reduce duplicated effort).

### Operations (WSG §4 Hosting/Infrastructure — shared responsibility)

- Cache-friendliness (tags, max-age, stale-while-revalidate patterns) makes
  low-energy serving via CDN the easy path.
- Core supports modern PHP and HTTP/2+ deployment; hosting choices beyond
  that belong to site owners and are documented rather than shipped.

## How alignment is measured (methodology)

Claims above are backed by an automated, repeatable baseline rather than
narrative:

- A Playwright crawl of every core page in all three core themes records
  **transfer size, request count, DOM nodes, and image formats** per page,
  and estimates **CO2 per page view** with [CO2.js](https://www.thegreenwebfoundation.org/co2-js/)
  (Sustainable Web Design model v4).
- Results append to a public, per-page **trend history**
  ([`reports/sustainability/history.json`](https://github.com/mgifford/drupal-core/blob/main/reports/sustainability/history.json)),
  so regressions in page weight or requests are visible per release —
  the same regression discipline core applies to accessibility.
- Reports publish to <https://mgifford.github.io/drupal-core/>.
- [WSG-STAR-AUTOMATION.md](WSG-STAR-AUTOMATION.md) classifies all 34 STAR
  *Web Development* techniques by machine-testability: 13 are page-level
  automatable (2 already running), 12 partial (CI/build level), 9 manual/
  policy. This classification is offered back to the Interest Group as
  implementer feedback on STAR's testability.

## Where core can do better (open, honest gaps)

Each gap is scoped as a concrete core issue (drafts in
[ISSUE-DRAFTS-2026-07.md](ISSUE-DRAFTS-2026-07.md)):

1. **Modern image formats by default** — WebP conversion exists, but new
   sites should get the most efficient widely-supported format (AVIF where
   the toolkit supports it) without configuration.
2. **Font loading defaults** — themes should demonstrate best-practice
   subsetting, `font-display`, and preloading so the pattern propagates to
   contrib themes.
3. **JavaScript shipped to anonymous users** — measure and ratchet down the
   default anonymous-page JS payload.
4. **Admin theme payload** — editors spend hours daily in the admin UI;
   its weight and DOM size deserve a budget and trend tracking like the
   front end.
5. **Sustainability regression gate** — page-weight/request budgets in CI,
   analogous to the accessibility gate.

## For the Sustainable Web IG

Drupal offers this work as a **reference implementation case study**: a
large open-source CMS applying WSG to its defaults, with a public
measurement pipeline and a documented testability classification of STAR.
Feedback we can bring the IG from this exercise:

- Which STAR test procedures are executable by a real crawler today (13/34
  in Web Development) and which need machine-testable acceptance criteria.
- Where WSG responsibilities split between platform, theme, and site owner —
  a distinction the guidelines currently leave implicit, and one every CMS
  will need to navigate.

## How to help

- Tag issues **`Sustainability`** in the [Drupal core queue](https://www.drupal.org/project/issues/drupal).
- Discuss in the community: [drupal.org/community/contributor-guide](https://www.drupal.org/community/contributor-guide)
  and the #sustainability channel on Drupal Slack.
- W3C group: [Sustainable Web IG](https://www.w3.org/groups/ig/sustainableweb/).

---

*Maintained alongside the accessibility testing harness at
[github.com/mgifford/drupal-core](https://github.com/mgifford/drupal-core).
Corrections welcome — every claim above should stay verifiable; if you find
one that isn't, file an issue.*
