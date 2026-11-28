# Accessibility checkpoints: issue #3419891

Session `2026-11-27T16-15-53-live-3419891-pinned`, generated 2026-11-27T16:20:07.466Z. **DRAFT: automated evidence, not a human accessibility review or a published finding.**

Source: playwright; Playwright MCP 0.0.84 (playwright-mcp --init-page + --init-script; a single exposed binding; browser_evaluate calls the approved helper). Profile: full.

**1 checkpoint(s)**, **49 distinct finding(s)** (49 observation(s) at checkpoints; a persistent finding is counted once).

## Scenario summary

| | |
|---|---|
| Issue | #3419891 |
| Variants | `3419891-pinned` |
| Sides captured | After |
| Pages | `/node/add/page (default_admin)` |
| Browser | chromium 157.0.8103.79 |
| Viewports | 1280x720 |
| Colour modes | light |
| Core commits | `0387fb948f 2026-11-25` |

## Checkpoint inventory (in the order reached)

| # | Checkpoint | Side | Status | Page | State | Engines | Findings | Evidence |
|---|---|---|---|---|---|---|---|---|
| 1 | `editor-initialized` CKEditor initialised | After | captured | `/node/add/page` | 4 expanded; focus body | axe-core:executed htmlcs:executed | 49 | [evidence](001-editor-initialized) |

## Before / After at equivalent states

| Checkpoint | Equivalent? | Checks | Classifications |
|---|---|---|---|
| `editor-initialized` | **NO** (no Before checkpoint at this state) | — | no findings either side |

## Findings (one row per distinct finding)

| ID | Engine | Rule | Impact | Outcome | WCAG | Target | Observed at | Review |
|---|---|---|---|---|---|---|---|---|
| A11Y-PAT-A86E7889C9BA | axe-core 4.14.0 | `color-contrast` | serious | incomplete | 1.4.3 | `.toolbar-button--icon--navigation-blocks > .toolbar-button_…` | after#editor-initialized | needs-review |
| A11Y-PAT-A685240C2A10 | axe-core 4.14.0 | `color-contrast` | serious | incomplete | 1.4.3 | `.toolbar-button--icon--navigation-content > .toolbar-button…` | after#editor-initialized | needs-review |
| A11Y-PAT-832FBD830BD6 | axe-core 4.14.0 | `color-contrast` | serious | incomplete | 1.4.3 | `.toolbar-button--icon--navigation-files > .toolbar-button__…` | after#editor-initialized | needs-review |
| A11Y-PAT-665BE289D348 | axe-core 4.14.0 | `color-contrast` | serious | incomplete | 1.4.3 | `.toolbar-button--icon--signpost > .toolbar-button__label[da…` | after#editor-initialized | needs-review |
| A11Y-PAT-BAE94CE3FD3C | axe-core 4.14.0 | `color-contrast` | serious | incomplete | 1.4.3 | `.toolbar-button--icon--system-admin-structure > .toolbar-bu…` | after#editor-initialized | needs-review |
| A11Y-PAT-B837201BBD08 | axe-core 4.14.0 | `color-contrast` | serious | incomplete | 1.4.3 | `.toolbar-button--icon--system-themes-page > .toolbar-button…` | after#editor-initialized | needs-review |
| A11Y-PAT-9705917EFF4D | axe-core 4.14.0 | `color-contrast` | serious | incomplete | 1.4.3 | `.toolbar-button--icon--system-modules-list > .toolbar-butto…` | after#editor-initialized | needs-review |
| A11Y-PAT-35877AF37DC5 | axe-core 4.14.0 | `color-contrast` | serious | incomplete | 1.4.3 | `.toolbar-button--icon--system-admin-config > .toolbar-butto…` | after#editor-initialized | needs-review |
| A11Y-PAT-87A1CE446506 | axe-core 4.14.0 | `color-contrast` | serious | incomplete | 1.4.3 | `.toolbar-button--icon--entity-user-collection > .toolbar-bu…` | after#editor-initialized | needs-review |
| A11Y-PAT-5A214CFDA1BD | axe-core 4.14.0 | `color-contrast` | serious | incomplete | 1.4.3 | `.toolbar-button--icon--system-admin-reports > .toolbar-butt…` | after#editor-initialized | needs-review |
| A11Y-PAT-B72CD1CF6F0C | axe-core 4.14.0 | `color-contrast` | serious | incomplete | 1.4.3 | `.toolbar-button--icon--announcements-feed-announcement > .t…` | after#editor-initialized | needs-review |
| A11Y-PAT-8911E086E746 | axe-core 4.14.0 | `color-contrast` | serious | incomplete | 1.4.3 | `#edit-field-body-0-format--2` | after#editor-initialized | needs-review |
| A11Y-PAT-E43E44C8AA0A | axe-core 4.14.0 | `target-size` | serious | incomplete | 2.5.8 | `.ck-splitbutton__arrow[data-cke-tooltip-text="Bulleted List…` | after#editor-initialized | needs-review |
| A11Y-PAT-F441E5EB7CEA | axe-core 4.14.0 | `target-size` | serious | incomplete | 2.5.8 | `.ck-splitbutton__arrow[data-cke-tooltip-text="Numbered List…` | after#editor-initialized | needs-review |
| A11Y-PAT-ADB4EEC5FCD0 | htmlcs 2.5.1 | `WCAG2AA.Principle1.Guideline1_4.1_4_3.G18.Abs` | — | incomplete | 1.4.3 | `body > a` | after#editor-initialized | needs-review |
| A11Y-PAT-2AC835C2D1CD | htmlcs 2.5.1 | `WCAG2AA.Principle1.Guideline1_4.1_4_10.C32,C31,…` | — | incomplete | 1.4.10 | `body > div:nth-of-type(2)` | after#editor-initialized | needs-review |
| A11Y-PAT-992A4F26EDD8 | htmlcs 2.5.1 | `WCAG2AA.Principle1.Guideline1_3.1_3_1_A.G141` | — | incomplete | 1.3.1 | `#system-breadcrumb` | after#editor-initialized | needs-review |
| A11Y-PAT-55611DE348A8 | htmlcs 2.5.1 | `WCAG2AA.Principle1.Guideline1_4.1_4_3.G145.Abs` | — | incomplete | 1.4.3 | `#system-breadcrumb` | after#editor-initialized | needs-review |
| A11Y-PAT-3F06BC3DCB11 | htmlcs 2.5.1 | `WCAG2AA.Principle2.Guideline2_4.2_4_1.G1,G123,G…` | — | violation | 2.4.1 | `#edit-default-admin-sticky-actions > a` | after#editor-initialized | unreviewed |
| A11Y-PAT-AE49B15857AF | htmlcs 2.5.1 | `WCAG2AA.Principle1.Guideline1_4.1_4_3.G18.Abs` | — | incomplete | 1.4.3 | `#edit-default-admin-sticky-actions > a > span` | after#editor-initialized | needs-review |
| A11Y-PAT-30D84D5FCD4A | htmlcs 2.5.1 | `WCAG2AA.Principle4.Guideline4_1.4_1_2.H91.A.Emp…` | — | incomplete | 4.1.2 | `#main-content` | after#editor-initialized | needs-review |
| A11Y-PAT-D44E905541B9 | htmlcs 2.5.1 | `WCAG2AA.Principle1.Guideline1_4.1_4_10.C32,C31,…` | — | incomplete | 1.4.10 | `#node-page-form > div > div:nth-of-type(1) > div:nth-of-typ…` | after#editor-initialized | needs-review |
| A11Y-PAT-EC3228AC8463 | htmlcs 2.5.1 | `WCAG2AA.Principle1.Guideline1_3.1_3_1.H85.2` | — | incomplete | 1.3.1 | `#edit-field-body-0-format--2` | after#editor-initialized | needs-review |
| A11Y-PAT-D521307E1FA2 | htmlcs 2.5.1 | `WCAG2AA.Principle1.Guideline1_4.1_4_3.G18.BgIma…` | — | incomplete | 1.4.3 | `#edit-field-body-0-format--2 > option:nth-of-type(1)` | after#editor-initialized | needs-review |
| A11Y-PAT-551BC9B47799 | htmlcs 2.5.1 | `WCAG2AA.Principle1.Guideline1_3.1_3_1_A.G141` | — | incomplete | 1.3.1 | `#edit-field-body-0-format-guidelines > div > h4` | after#editor-initialized | needs-review |
| A11Y-PAT-3B549CD3B2AD | htmlcs 2.5.1 | `WCAG2AA.Principle1.Guideline1_4.1_4_10.C32,C31,…` | — | incomplete | 1.4.10 | `#default_admin_sidebar` | after#editor-initialized | needs-review |
| A11Y-PAT-2CB9F21BDA8E | htmlcs 2.5.1 | `WCAG2AA.Principle1.Guideline1_3.1_3_1.H44.NotFo…` | — | incomplete | 1.3.1 | `#edit-meta-changed > label` | after#editor-initialized | needs-review |
| A11Y-PAT-7AD3981761F2 | htmlcs 2.5.1 | `WCAG2AA.Principle1.Guideline1_3.1_3_1.H44.NotFo…` | — | incomplete | 1.3.1 | `#edit-meta-author > label` | after#editor-initialized | needs-review |
| A11Y-PAT-CECA0EF18021 | htmlcs 2.5.1 | `WCAG2AA.Principle1.Guideline1_3.1_3_1.H85.2` | — | incomplete | 1.3.1 | `#edit-menu-menu-parent` | after#editor-initialized | needs-review |
| A11Y-PAT-6CB4CA31EF9E | htmlcs 2.5.1 | `WCAG2AA.Principle1.Guideline1_4.1_4_3.G18.Abs` | — | incomplete | 1.4.3 | `#edit-created-0-value > div:nth-of-type(1) > label` | after#editor-initialized | needs-review |
| A11Y-PAT-19E6C7117D72 | htmlcs 2.5.1 | `WCAG2AA.Principle1.Guideline1_4.1_4_3.G145.Abs` | — | incomplete | 1.4.3 | `#admin-toolbar__scroll-wrapper-935526640` | after#editor-initialized | needs-review |
| A11Y-PAT-19E9F68FB594 | htmlcs 2.5.1 | `WCAG2AA.Principle1.Guideline1_4.1_4_3.G145.BgIm…` | — | incomplete | 1.4.3 | `#menu-builder > div:nth-of-type(2) > h3` | after#editor-initialized | needs-review |
| A11Y-PAT-90C46BC2A8E9 | htmlcs 2.5.1 | `WCAG2AA.Principle1.Guideline1_4.1_4_3.G145.Abs` | — | incomplete | 1.4.3 | `#menu-footer > div:nth-of-type(1) > h3` | after#editor-initialized | needs-review |
| A11Y-PAT-2E0782C6A641 | htmlcs 2.5.1 | `WCAG2AA.Principle1.Guideline1_4.1_4_3.G18.Abs` | — | incomplete | 1.4.3 | `#menu-footer > button > span` | after#editor-initialized | needs-review |
| A11Y-PAT-9C17F18B9A7D | htmlcs 2.5.1 | `WCAG2AA.Principle1.Guideline1_4.1_4_3.G18.Abs` | — | incomplete | 1.4.3 | `#menu-builder > div:nth-of-type(1) > a > span` | after#editor-initialized | needs-review |
| A11Y-PAT-0E5C9F78F926 | htmlcs 2.5.1 | `WCAG2AA.Principle1.Guideline1_4.1_4_3.G18.Abs` | — | incomplete | 1.4.3 | `#navigation-link--navigationcreate-1676520538 > button > sp…` | after#editor-initialized | needs-review |
| A11Y-PAT-4F6C35E7805C | htmlcs 2.5.1 | `WCAG2AA.Principle1.Guideline1_4.1_4_3.G18.BgIma…` | — | incomplete | 1.4.3 | `#navigation-link--navigationblocks-465866846 > a > span` | after#editor-initialized | needs-review |
| A11Y-PAT-3E0CD3F935AF | htmlcs 2.5.1 | `WCAG2AA.Principle1.Guideline1_4.1_4_3.G18.BgIma…` | — | incomplete | 1.4.3 | `#navigation-link--navigationcontent-797462560 > a > span` | after#editor-initialized | needs-review |
| A11Y-PAT-4D542B3394AB | htmlcs 2.5.1 | `WCAG2AA.Principle1.Guideline1_4.1_4_3.G18.BgIma…` | — | incomplete | 1.4.3 | `#navigation-link--navigationfiles-56391285 > a > span` | after#editor-initialized | needs-review |
| A11Y-PAT-0F44C87EEDBC | htmlcs 2.5.1 | `WCAG2AA.Principle1.Guideline1_4.1_4_3.G18.BgIma…` | — | incomplete | 1.4.3 | `#navigation-link--standardwelcome-572710013 > a > span` | after#editor-initialized | needs-review |
| A11Y-PAT-17EC00359EB8 | htmlcs 2.5.1 | `WCAG2AA.Principle1.Guideline1_4.1_4_3.G18.BgIma…` | — | incomplete | 1.4.3 | `#navigation-link--systemadmin-structure-437146800 > button …` | after#editor-initialized | needs-review |
| A11Y-PAT-D30C4E043A9A | htmlcs 2.5.1 | `WCAG2AA.Principle1.Guideline1_4.1_4_3.G18.BgIma…` | — | incomplete | 1.4.3 | `#navigation-link--systemthemes-page-1115983276 > a > span` | after#editor-initialized | needs-review |
| A11Y-PAT-C9C5290787E0 | htmlcs 2.5.1 | `WCAG2AA.Principle1.Guideline1_4.1_4_3.G18.BgIma…` | — | incomplete | 1.4.3 | `#navigation-link--systemmodules-list-1014147636 > a > span` | after#editor-initialized | needs-review |
| A11Y-PAT-6973804B0D94 | htmlcs 2.5.1 | `WCAG2AA.Principle1.Guideline1_4.1_4_3.G18.BgIma…` | — | incomplete | 1.4.3 | `#navigation-link--systemadmin-config-382479556 > button > s…` | after#editor-initialized | needs-review |
| A11Y-PAT-6B9F4F33BAA2 | htmlcs 2.5.1 | `WCAG2AA.Principle1.Guideline1_4.1_4_3.G18.BgIma…` | — | incomplete | 1.4.3 | `#navigation-link--entityusercollection-1790731261 > a > span` | after#editor-initialized | needs-review |
| A11Y-PAT-2AF01F4DEEC1 | htmlcs 2.5.1 | `WCAG2AA.Principle1.Guideline1_4.1_4_3.G18.BgIma…` | — | incomplete | 1.4.3 | `#navigation-link--systemadmin-reports-548518960 > button > …` | after#editor-initialized | needs-review |
| A11Y-PAT-2C5D39EB65A4 | htmlcs 2.5.1 | `WCAG2AA.Principle1.Guideline1_4.1_4_3.G18.BgIma…` | — | incomplete | 1.4.3 | `#navigation-link--announcements-feedannouncement-2130463987…` | after#editor-initialized | needs-review |
| A11Y-PAT-A62EBD028606 | htmlcs 2.5.1 | `WCAG2AA.Principle1.Guideline1_4.1_4_3.G18.Abs` | — | incomplete | 1.4.3 | `#navigation-link--navigationuser-linksuserwrapper-182398850…` | after#editor-initialized | needs-review |
| A11Y-PAT-C6AC7CCD9755 | htmlcs 2.5.1 | `WCAG2AA.Principle1.Guideline1_3.1_3_1.F92,ARIA4` | — | violation | 1.3.1 | `#admin-toolbar` | after#editor-initialized | unreviewed |

Engine agreement is not proof of correctness, and a single engine is not necessarily wrong. Each row keeps its engine and rule identifier; WCAG and ACT are mappings.

## Manual review required

Automated checks cannot decide these. They are stored separately and were **not performed by a person** in this session.

| Checkpoint | Check | Question | Result |
|---|---|---|---|
| `editor-initialized` | `status-understandable` | Is the status or error message understandable on its own, without seeing where it appeared? | not-run |
| `editor-initialized` | `icon-recognisable` | Is the icon recognisable and, where it conveys meaning, is its name meaningful in this context? | not-run |
| `editor-initialized` | `engine-needs-review` | Review the engine results marked as needing review; they are not passes. | not-run |
| `editor-initialized` | `screen-reader-repeat` | Does a screen reader announce anything unnecessarily repetitive at this state? | not-run |

## Announcement and interaction history

Nothing recorded (use profile dynamic or full at a checkpoint that follows an interaction).


## Focus transitions

No focus transition was recorded before these checkpoints.


## Screenshots

- After `editor-initialized` (viewport): [viewport.png](reports/infrastructure/a11y-mcp/2026-11-27T16-15-53-live-3419891-pinned/evidence/001-editor-initialized/viewport.png)

## Reproduction steps (from the recorded trusted interactions)

No trusted interaction was recorded before these checkpoints. Repeating the session needs the same starting page and the same choices.

## Resource consumption (measured, not estimated)

| Measure | Value |
|---|---|
| Checkpoints | 1 |
| Engine runs | 2 |
| Scan time | 4473 ms |
| Evidence on disk | 408.2 KiB |
| Screenshots | 1 |
| Browser launches by this integration | 0 (the MCP browser is reused) |
| Energy | not measured; no avoided-energy figure is invented |

## Engine capability declarations

| Engine | Version | Live page | Injects JS | Navigates | Iframes | Shadow DOM | Computed styles | Preserves state | Scope | Licence |
|---|---|---|---|---|---|---|---|---|---|---|
| axe-core | 4.14.0 | yes | yes | no | yes | yes | yes | yes | yes | MPL-2.0 |
| HTML_CodeSniffer | 2.5.1 | yes | yes | no | yes | no | yes | yes | filter | BSD-3-Clause |
| IBM Equal Access | not installed | no | no | yes | yes | yes | yes | no | no | Apache-2.0 |

## Limits

- Chromium only (the MCP browser); other engines/capabilities are reported per checkpoint, not assumed.
- Automated engines see a minority of real barriers; a clean scan is not an accessibility pass.
- No real screen reader, no person, was involved unless a manual step says so.
- Chromium only. A different engine or browser would build different evidence; nothing here is extrapolated to them.
- Automated results are a DRAFT: a clean scan is not an accessibility pass. The manual checks in this record were not performed by a person unless a result says so.
- Page helper 1.0.0; Playwright MCP 0.0.84 via playwright-mcp --init-page + --init-script; a single exposed binding; browser_evaluate calls the approved helper.

Generated with the help of an LLM (DeepSeek Harness) from the recorded evidence. AI-assisted development and evaluation disclosure; a person must review before anything is reported upstream.
