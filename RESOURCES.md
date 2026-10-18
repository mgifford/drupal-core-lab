# Drupal core lab resources

Reviewed October 17, 2026. This is a reference index for design, accessibility, preferences, sustainability, and reproducible testing. Use [HANDOFF.md](HANDOFF.md) for the current session state and ordered next steps. Use each issue's EVIDENCE.md for tested outcomes. A reference being listed here does not mean its requirements or implementation have been verified.

## Start in the repository

| Need | Resource | How to use it |
|---|---|---|
| Agent workflow and permissions | [AGENTS.md](AGENTS.md), [AI-LEARNING.md](AI-LEARNING.md) | Read standing rules before changing environments or publishing work. |
| Accessibility policy | [ACCESSIBILITY.md](ACCESSIBILITY.md) | Project expectations and test scope; verify specific standards claims against their primary sources. |
| Style policy | [STYLES.md](STYLES.md) | Existing conventions, tokens, voice, and coding expectations. |
| Design review method | [DESIGN.md](DESIGN.md) | Identify context, owning layer, equivalent states, and evidence. |
| Default Admin reference | [Design reference](docs/design/default-admin-design-system.html) | Readable reference and print view. Use the maintenance guide for updates. |
| Proposed design rules | [contracts.json](docs/design/contracts.json), [conflict register](docs/design/CONFLICTS.md) | Proposed contracts are unapproved reviewer guidance, not accepted Drupal policy. |
| Source and provenance | [Design evidence](docs/design/EVIDENCE.md), [maintenance guide](docs/design/README.md) | Keep sources, pinned examples, and regeneration steps together. |
| Gather design evidence | [DESIGN-GATHERING.md](docs/DESIGN-GATHERING.md) | Commands and limits for theme, preferences, screen, and print observations. |
| Collector corrections and next phases | [Collector fix](docs/DESIGN-COLLECTOR-FIX.md), [next work](docs/DESIGN-REVIEW-NEXT.md), [follow-up](docs/DESIGN-FOLLOWUP.md) | Separate implemented collection from proposed broader review and interaction coverage. |
| Page selection | [Pilot pages](docs/design-pages.pilot.json) | Start with representative pages rather than an unbounded crawl. |
| Add a Drupal issue | [NEW-ISSUE.md](docs/NEW-ISSUE.md), [results layout](docs/RESULTS-LAYOUT.md) | Declare the recipe, exact revision, patch stacks, scenario, and evidence gaps. |
| Start/stop and troubleshoot | [Commands](docs/COMMANDS.md), [environments](docs/ENVIRONMENTS.md), [pitfalls](docs/PITFALLS.md) | Start the selected pair; preserve evidence and snapshot before destructive repairs. |
| Change the viewer | [VIEWER-DEV.md](docs/VIEWER-DEV.md) | Preserve element IDs, accessibility, security guards, and generated cloud output. |
| Browser and screen-reader tooling | [Playwright guide](tools/playwright/README.md), [testing scope](docs/TESTING-TOOLS.md) | Distinguish trusted-input replay, accessibility snapshots, axe, and synthetic Guidepup. |
| Coder handoffs | [Prompt guide](prompts/README.md), [cloud quickstart](docs/CLOUD-QUICKSTART.md) | Generate issue instructions from the registered scenario. Cloud workspace creation remains opt-in. |

## Primary standards and technical references

| Topic | Reference | Review question |
|---|---|---|
| Accessibility outcomes | [WCAG 2.2](https://www.w3.org/TR/WCAG22/) | Which criterion and conformance level apply to the actual barrier? Automated checks do not determine complete conformance. |
| Authoring tools | [ATAG 2.0](https://www.w3.org/TR/ATAG20/) | Assess author access and support for producing accessible content separately. |
| Radio keyboard behavior | [WAI-ARIA APG radio group pattern](https://www.w3.org/WAI/ARIA/apg/patterns/radio/) | Compare names, grouping, keyboard behavior, and focus. APG is implementation guidance, not a substitute for native HTML semantics. |
| Native radio inputs and constraints | [HTML radio button state](https://html.spec.whatwg.org/multipage/input.html#radio-button-state-(type=radio)) | Separate required attributes, selected value, validity, and actual submission behavior. |
| Browser validation | [HTML constraint validation](https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#constraint-validation) | Check form novalidate and submitter formnovalidate before expecting native blocking. |
| Contrast preferences and forced colors | [Media Queries Level 5](https://www.w3.org/TR/mediaqueries-5/) | Treat prefers-contrast and forced-colors as distinct conditions. Record actual emulation and platform support. |
| Motion preferences | [prefers-reduced-motion](https://www.w3.org/TR/mediaqueries-5/#prefers-reduced-motion) | Does the alternative still communicate what changed or what action is needed? |
| Forced-color styling | [CSS Color Adjustment](https://www.w3.org/TR/css-color-adjust-1/) | Inspect system colors, contrast, visible focus, and any forced-color-adjust exception. |
| Paper output | [CSS Paged Media](https://www.w3.org/TR/css-page-3/) | Review A4 and Letter rendering where relevant; a screen viewport is not a paper size. |
| Sustainability | [Web Sustainability Guidelines](https://www.w3.org/TR/web-sustainability-guidelines/) | Connect observations to a documented guideline and measurement method. Record the source edition/status when making a formal claim. |

These links are living references. Preserve an exact edition, retrieval date, or commit alongside evidence used in an issue. Draft specifications, APG guidance, local proposals, observed theme behavior, and normative requirements carry different authority.

## Drupal discussions and experiments

| Work | Resource | Why retain it |
|---|---|---|
| Required radios | [#2951317](https://www.drupal.org/project/drupal/issues/2951317), [MR !15536](https://git.drupalcode.org/project/drupal/-/merge_requests/15536), [lab evidence](reports/issues/2951317/EVIDENCE.md) | Required semantics, dynamic states, None handling, and declared patch identity. |
| Native validation setting | [Pinned FormPreprocess.php](https://github.com/drupal/drupal/blob/ad11ba71c0f09b856e45dfdb8db155b5a588712d/core/lib/Drupal/Core/Form/FormPreprocess.php), [#3537128](https://www.drupal.org/node/3537128) | The pinned implementation disables native HTML5 validation by default. Do not assume an invalid input blocks a POST. |
| Related radio and fieldset work | [#3267246](https://www.drupal.org/project/drupal/issues/3267246), [#3174459](https://www.drupal.org/project/drupal/issues/3174459), [parent #2852874](https://www.drupal.org/project/drupal/issues/2852874) | Read dependencies and related scope before a complete MR review. |
| High-contrast implementation | [#3631337](https://www.drupal.org/project/drupal/issues/3631337) | Track the actual theme implementation alongside independent browser preferences and forced colors. |
| Semantic color and theme intent | [#3619933](https://www.drupal.org/project/drupal/issues/3619933) | Retain the discussion of grouping, intent, differences, and theme semantics. |
| Palette exploration | [ui-palette-generator source](https://github.com/mgifford/ui-palette-generator), [demo](https://mgifford.github.io/ui-palette-generator/) | Explore pairings and semantic roles. Experiments and computed contrast are not approved design-system contracts. |
| Other comparison discussed here | [#3630425](https://www.drupal.org/project/drupal/issues/3630425) | Keep its scenario and evidence separate from required-radio findings. |

Issue states and MR heads change. Refresh issue intake and read all relevant review threads before publishing a review. An inaccessible thread is a gap, not evidence that nobody raised concerns.

## Evidence tools and their limits

- [Playwright](https://playwright.dev/docs/intro): trusted-input replay, screenshots, media emulation, and browser accessibility snapshots. Emulation is not a complete operating-system or assistive-technology test.
- [axe-core](https://github.com/dequelabs/axe-core): automated rule findings. Zero findings is not a conformance verdict.
- [Guidepup virtual screen reader](https://github.com/guidepup/virtual-screen-reader): the lab's agreed synthetic screen-reader comparison. Do not label synthetic output as actual VoiceOver or NVDA speech.
- [Lighthouse](https://github.com/GoogleChrome/lighthouse): performance and other audits. A performance score alone is not an energy or carbon measurement.
- [Firefox energy scanner](https://github.com/mgifford/firefox-energy-scanner): related measurement project discussed for sustainability work; applicability to a particular lab run still needs investigation.

For a usable report, keep these dimensions explicit: route/account, exact core and patch identity, recipe/configuration, actual versus configured theme, viewport, browser/version, preferences, screen versus print, tested interaction state, observed behavior, and unresolved gaps. Avoid duplicating the active task list here; keep it in HANDOFF.md or the issue's status file.
