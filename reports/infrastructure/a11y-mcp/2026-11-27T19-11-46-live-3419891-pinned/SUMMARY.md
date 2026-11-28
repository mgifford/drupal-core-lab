# Accessibility checkpoints: issue #3419891

Session `2026-11-27T19-11-46-live-3419891-pinned`, generated 2026-11-28T02:28:15.984Z. **DRAFT: automated evidence, not a human accessibility review or a published finding.**

Source: playwright; Playwright MCP 0.0.84 (playwright-mcp --init-page + --init-script; a single exposed binding; browser_evaluate calls the approved helper). Profile: full.

**8 checkpoint(s)**, **63 distinct finding(s)** (77 observation(s) at checkpoints; a persistent finding is counted once).

## Scenario summary

| | |
|---|---|
| Issue | #3419891 |
| Variants | `3419891-pinned` |
| Sides captured | Before, After |
| Pages | `/node/add/page (default_admin)` |
| Browser | chromium 157.0.8103.79 |
| Viewports | 1280x720 |
| Colour modes | light |
| Core commits | `0387fb948f 2026-11-25` |

## Checkpoint inventory (in the order reached)

| # | Checkpoint | Side | Status | Page | State | Engines | Findings | Evidence |
|---|---|---|---|---|---|---|---|---|
| 1 | `editor-initialized` CKEditor initialised | Before | captured | `/node/add/page` | 4 expanded; focus body | axe-core:executed htmlcs:executed | 49 | [evidence](001-editor-initialized) |
| 2 | `dropdown-open` CKEditor heading dropdown open | Before | captured | `/node/add/page` | 5 expanded; focus menuitemradio "Paragraph" | axe-core:executed | 14 | [evidence](002-dropdown-open) |
| 3 | `balloon-open` CKEditor link balloon open | Before | captured | `/node/add/page` | 4 expanded; focus textbox "Link URL" | axe-core:executed | 0 | [evidence](003-balloon-open) |
| 4 | `focus-restored` Focus restored after the balloon closed | Before | state-not-reached | `/node/add/page` | 4 expanded; focus textbox "Rich Text Editor. Editing are…"; READINESS NOT MET | axe-core:not-run | 0 | [evidence](004-focus-restored) |
| 5 | `editor-initialized` CKEditor initialised | After | captured | `/node/add/page` | 4 expanded; focus body | axe-core:executed htmlcs:executed | 49 | [evidence](005-editor-initialized) |
| 6 | `dropdown-open` CKEditor heading dropdown open | After | captured | `/node/add/page` | 5 expanded; focus menuitemradio "Paragraph" | axe-core:executed | 14 | [evidence](006-dropdown-open) |
| 7 | `balloon-open` CKEditor link balloon open | After | captured | `/node/add/page` | 4 expanded; focus textbox "Link URL" | axe-core:executed | 0 | [evidence](007-balloon-open) |
| 8 | `focus-restored` Focus restored after the balloon closed | After | state-not-reached | `/node/add/page` | 4 expanded; focus textbox "Rich Text Editor. Editing are…"; READINESS NOT MET | axe-core:not-run | 0 | [evidence](008-focus-restored) |

## Before / After at equivalent states

| Checkpoint | Equivalent? | Checks | Classifications |
|---|---|---|---|
| `balloon-open` | yes | 9/9 pass | manual-review-required |
| `dropdown-open` | yes | 9/9 pass | existing-failure (axe-core:color-contrast); existing-failure (axe-core:color-contrast); existing-failure (axe-core:color-contrast); existing-failure (axe-core:color-contrast); existing-failure (axe-c… |
| `editor-initialized` | yes | 9/9 pass | existing-failure (axe-core:color-contrast); existing-failure (axe-core:color-contrast); existing-failure (axe-core:color-contrast); existing-failure (axe-core:color-contrast); existing-failure (axe-c… |
| `focus-restored` | **NO** (the two sides did not reach equivalent states) | 8/9 pass | tool-error (axe-core); state-not-reached; manual-review-required |

### `balloon-open`: state equivalence

| Check | Pass | Detail |
|---|---|---|
| same scenario | yes | live-3419891-pinned vs live-3419891-pinned |
| same checkpoint | yes | balloon-open vs balloon-open |
| same route | yes | /node/add/page vs /node/add/page |
| same viewport | yes | {"width":1280,"height":720} vs {"width":1280,"height":720} |
| same colorScheme | yes | light vs light |
| same forcedColors | yes | none vs none |
| same reducedMotion | yes | no-preference vs no-preference |
| same contrast | yes | no-preference vs no-preference |
| both reached a captured state | yes | captured / captured |

### `dropdown-open`: state equivalence

| Check | Pass | Detail |
|---|---|---|
| same scenario | yes | live-3419891-pinned vs live-3419891-pinned |
| same checkpoint | yes | dropdown-open vs dropdown-open |
| same route | yes | /node/add/page vs /node/add/page |
| same viewport | yes | {"width":1280,"height":720} vs {"width":1280,"height":720} |
| same colorScheme | yes | light vs light |
| same forcedColors | yes | none vs none |
| same reducedMotion | yes | no-preference vs no-preference |
| same contrast | yes | no-preference vs no-preference |
| both reached a captured state | yes | captured / captured |

### `editor-initialized`: state equivalence

| Check | Pass | Detail |
|---|---|---|
| same scenario | yes | live-3419891-pinned vs live-3419891-pinned |
| same checkpoint | yes | editor-initialized vs editor-initialized |
| same route | yes | /node/add/page vs /node/add/page |
| same viewport | yes | {"width":1280,"height":720} vs {"width":1280,"height":720} |
| same colorScheme | yes | light vs light |
| same forcedColors | yes | none vs none |
| same reducedMotion | yes | no-preference vs no-preference |
| same contrast | yes | no-preference vs no-preference |
| both reached a captured state | yes | captured / captured |

Accessibility-tree differences for this checkpoint: axtree +19 -19; aria +19 -19; speech +0 -0. Full views: `reports/infrastructure/a11y-mcp/2026-11-27T19-11-46-live-3419891-pinned/evidence/001-editor-initialized`.

### `focus-restored`: state equivalence

| Check | Pass | Detail |
|---|---|---|
| same scenario | yes | live-3419891-pinned vs live-3419891-pinned |
| same checkpoint | yes | focus-restored vs focus-restored |
| same route | yes | /node/add/page vs /node/add/page |
| same viewport | yes | {"width":1280,"height":720} vs {"width":1280,"height":720} |
| same colorScheme | yes | light vs light |
| same forcedColors | yes | none vs none |
| same reducedMotion | yes | no-preference vs no-preference |
| same contrast | yes | no-preference vs no-preference |
| both reached a captured state | **no** | state-not-reached / state-not-reached |

## Findings (one row per distinct finding)

| ID | Engine | Rule | Impact | Outcome | WCAG | Target | Observed at | Review |
|---|---|---|---|---|---|---|---|---|
| A11Y-PAT-A86E7889C9BA | axe-core 4.14.0 | `color-contrast` | serious | incomplete | 1.4.3 | `.toolbar-button--icon--navigation-blocks > .toolbar-button_…` | before#editor-initialized, before#dropdown-open | needs-review |
| A11Y-PAT-A685240C2A10 | axe-core 4.14.0 | `color-contrast` | serious | incomplete | 1.4.3 | `.toolbar-button--icon--navigation-content > .toolbar-button…` | before#editor-initialized, before#dropdown-open | needs-review |
| A11Y-PAT-832FBD830BD6 | axe-core 4.14.0 | `color-contrast` | serious | incomplete | 1.4.3 | `.toolbar-button--icon--navigation-files > .toolbar-button__…` | before#editor-initialized, before#dropdown-open | needs-review |
| A11Y-PAT-665BE289D348 | axe-core 4.14.0 | `color-contrast` | serious | incomplete | 1.4.3 | `.toolbar-button--icon--signpost > .toolbar-button__label[da…` | before#editor-initialized, before#dropdown-open | needs-review |
| A11Y-PAT-BAE94CE3FD3C | axe-core 4.14.0 | `color-contrast` | serious | incomplete | 1.4.3 | `.toolbar-button--icon--system-admin-structure > .toolbar-bu…` | before#editor-initialized, before#dropdown-open | needs-review |
| A11Y-PAT-B837201BBD08 | axe-core 4.14.0 | `color-contrast` | serious | incomplete | 1.4.3 | `.toolbar-button--icon--system-themes-page > .toolbar-button…` | before#editor-initialized, before#dropdown-open | needs-review |
| A11Y-PAT-9705917EFF4D | axe-core 4.14.0 | `color-contrast` | serious | incomplete | 1.4.3 | `.toolbar-button--icon--system-modules-list > .toolbar-butto…` | before#editor-initialized, before#dropdown-open | needs-review |
| A11Y-PAT-35877AF37DC5 | axe-core 4.14.0 | `color-contrast` | serious | incomplete | 1.4.3 | `.toolbar-button--icon--system-admin-config > .toolbar-butto…` | before#editor-initialized, before#dropdown-open | needs-review |
| A11Y-PAT-87A1CE446506 | axe-core 4.14.0 | `color-contrast` | serious | incomplete | 1.4.3 | `.toolbar-button--icon--entity-user-collection > .toolbar-bu…` | before#editor-initialized, before#dropdown-open | needs-review |
| A11Y-PAT-5A214CFDA1BD | axe-core 4.14.0 | `color-contrast` | serious | incomplete | 1.4.3 | `.toolbar-button--icon--system-admin-reports > .toolbar-butt…` | before#editor-initialized, before#dropdown-open | needs-review |
| A11Y-PAT-B72CD1CF6F0C | axe-core 4.14.0 | `color-contrast` | serious | incomplete | 1.4.3 | `.toolbar-button--icon--announcements-feed-announcement > .t…` | before#editor-initialized, before#dropdown-open | needs-review |
| A11Y-PAT-8911E086E746 | axe-core 4.14.0 | `color-contrast` | serious | incomplete | 1.4.3 | `#edit-field-body-0-format--2` | before#editor-initialized, before#dropdown-open | needs-review |
| A11Y-PAT-E43E44C8AA0A | axe-core 4.14.0 | `target-size` | serious | incomplete | 2.5.8 | `.ck-splitbutton__arrow[data-cke-tooltip-text="Bulleted List…` | before#editor-initialized, before#dropdown-open | needs-review |
| A11Y-PAT-F441E5EB7CEA | axe-core 4.14.0 | `target-size` | serious | incomplete | 2.5.8 | `.ck-splitbutton__arrow[data-cke-tooltip-text="Numbered List…` | before#editor-initialized, before#dropdown-open | needs-review |
| A11Y-PAT-ADB4EEC5FCD0 | htmlcs 2.5.1 | `WCAG2AA.Principle1.Guideline1_4.1_4_3.G18.Abs` | — | incomplete | 1.4.3 | `body > a` | before#editor-initialized | needs-review |
| A11Y-PAT-2AC835C2D1CD | htmlcs 2.5.1 | `WCAG2AA.Principle1.Guideline1_4.1_4_10.C32,C31,…` | — | incomplete | 1.4.10 | `body > div:nth-of-type(2)` | before#editor-initialized | needs-review |
| A11Y-PAT-992A4F26EDD8 | htmlcs 2.5.1 | `WCAG2AA.Principle1.Guideline1_3.1_3_1_A.G141` | — | incomplete | 1.3.1 | `#system-breadcrumb` | before#editor-initialized | needs-review |
| A11Y-PAT-55611DE348A8 | htmlcs 2.5.1 | `WCAG2AA.Principle1.Guideline1_4.1_4_3.G145.Abs` | — | incomplete | 1.4.3 | `#system-breadcrumb` | before#editor-initialized | needs-review |
| A11Y-PAT-3F06BC3DCB11 | htmlcs 2.5.1 | `WCAG2AA.Principle2.Guideline2_4.2_4_1.G1,G123,G…` | — | violation | 2.4.1 | `#edit-default-admin-sticky-actions > a` | before#editor-initialized | unreviewed |
| A11Y-PAT-AE49B15857AF | htmlcs 2.5.1 | `WCAG2AA.Principle1.Guideline1_4.1_4_3.G18.Abs` | — | incomplete | 1.4.3 | `#edit-default-admin-sticky-actions > a > span` | before#editor-initialized | needs-review |
| A11Y-PAT-30D84D5FCD4A | htmlcs 2.5.1 | `WCAG2AA.Principle4.Guideline4_1.4_1_2.H91.A.Emp…` | — | incomplete | 4.1.2 | `#main-content` | before#editor-initialized | needs-review |
| A11Y-PAT-D44E905541B9 | htmlcs 2.5.1 | `WCAG2AA.Principle1.Guideline1_4.1_4_10.C32,C31,…` | — | incomplete | 1.4.10 | `#node-page-form > div > div:nth-of-type(1) > div:nth-of-typ…` | before#editor-initialized | needs-review |
| A11Y-PAT-EC3228AC8463 | htmlcs 2.5.1 | `WCAG2AA.Principle1.Guideline1_3.1_3_1.H85.2` | — | incomplete | 1.3.1 | `#edit-field-body-0-format--2` | before#editor-initialized | needs-review |
| A11Y-PAT-D521307E1FA2 | htmlcs 2.5.1 | `WCAG2AA.Principle1.Guideline1_4.1_4_3.G18.BgIma…` | — | incomplete | 1.4.3 | `#edit-field-body-0-format--2 > option:nth-of-type(1)` | before#editor-initialized | needs-review |
| A11Y-PAT-551BC9B47799 | htmlcs 2.5.1 | `WCAG2AA.Principle1.Guideline1_3.1_3_1_A.G141` | — | incomplete | 1.3.1 | `#edit-field-body-0-format-guidelines > div > h4` | before#editor-initialized | needs-review |
| A11Y-PAT-3B549CD3B2AD | htmlcs 2.5.1 | `WCAG2AA.Principle1.Guideline1_4.1_4_10.C32,C31,…` | — | incomplete | 1.4.10 | `#default_admin_sidebar` | before#editor-initialized | needs-review |
| A11Y-PAT-2CB9F21BDA8E | htmlcs 2.5.1 | `WCAG2AA.Principle1.Guideline1_3.1_3_1.H44.NotFo…` | — | incomplete | 1.3.1 | `#edit-meta-changed > label` | before#editor-initialized | needs-review |
| A11Y-PAT-7AD3981761F2 | htmlcs 2.5.1 | `WCAG2AA.Principle1.Guideline1_3.1_3_1.H44.NotFo…` | — | incomplete | 1.3.1 | `#edit-meta-author > label` | before#editor-initialized | needs-review |
| A11Y-PAT-CECA0EF18021 | htmlcs 2.5.1 | `WCAG2AA.Principle1.Guideline1_3.1_3_1.H85.2` | — | incomplete | 1.3.1 | `#edit-menu-menu-parent` | before#editor-initialized | needs-review |
| A11Y-PAT-6CB4CA31EF9E | htmlcs 2.5.1 | `WCAG2AA.Principle1.Guideline1_4.1_4_3.G18.Abs` | — | incomplete | 1.4.3 | `#edit-created-0-value > div:nth-of-type(1) > label` | before#editor-initialized | needs-review |
| A11Y-PAT-280EB2B43E7D | htmlcs 2.5.1 | `WCAG2AA.Principle1.Guideline1_4.1_4_3.G145.Abs` | — | incomplete | 1.4.3 | `#admin-toolbar__scroll-wrapper-1792577257` | before#editor-initialized | needs-review |
| A11Y-PAT-19E9F68FB594 | htmlcs 2.5.1 | `WCAG2AA.Principle1.Guideline1_4.1_4_3.G145.BgIm…` | — | incomplete | 1.4.3 | `#menu-builder > div:nth-of-type(2) > h3` | before#editor-initialized | needs-review |
| A11Y-PAT-90C46BC2A8E9 | htmlcs 2.5.1 | `WCAG2AA.Principle1.Guideline1_4.1_4_3.G145.Abs` | — | incomplete | 1.4.3 | `#menu-footer > div:nth-of-type(1) > h3` | before#editor-initialized | needs-review |
| A11Y-PAT-2E0782C6A641 | htmlcs 2.5.1 | `WCAG2AA.Principle1.Guideline1_4.1_4_3.G18.Abs` | — | incomplete | 1.4.3 | `#menu-footer > button > span` | before#editor-initialized | needs-review |
| A11Y-PAT-9C17F18B9A7D | htmlcs 2.5.1 | `WCAG2AA.Principle1.Guideline1_4.1_4_3.G18.Abs` | — | incomplete | 1.4.3 | `#menu-builder > div:nth-of-type(1) > a > span` | before#editor-initialized | needs-review |
| A11Y-PAT-EFE03C3A07B4 | htmlcs 2.5.1 | `WCAG2AA.Principle1.Guideline1_4.1_4_3.G18.Abs` | — | incomplete | 1.4.3 | `#navigation-link--navigationcreate-652154234 > button > spa…` | before#editor-initialized | needs-review |
| A11Y-PAT-066221CD9EC3 | htmlcs 2.5.1 | `WCAG2AA.Principle1.Guideline1_4.1_4_3.G18.BgIma…` | — | incomplete | 1.4.3 | `#navigation-link--navigationblocks-1374408245 > a > span` | before#editor-initialized | needs-review |
| A11Y-PAT-60FDF42902C9 | htmlcs 2.5.1 | `WCAG2AA.Principle1.Guideline1_4.1_4_3.G18.BgIma…` | — | incomplete | 1.4.3 | `#navigation-link--navigationcontent-398383699 > a > span` | before#editor-initialized | needs-review |
| A11Y-PAT-DD7CBE0ECC07 | htmlcs 2.5.1 | `WCAG2AA.Principle1.Guideline1_4.1_4_3.G18.BgIma…` | — | incomplete | 1.4.3 | `#navigation-link--navigationfiles-2137495659 > a > span` | before#editor-initialized | needs-review |
| A11Y-PAT-1D1C625E5E66 | htmlcs 2.5.1 | `WCAG2AA.Principle1.Guideline1_4.1_4_3.G18.BgIma…` | — | incomplete | 1.4.3 | `#navigation-link--standardwelcome-325510237 > a > span` | before#editor-initialized | needs-review |
| A11Y-PAT-926009AE27F4 | htmlcs 2.5.1 | `WCAG2AA.Principle1.Guideline1_4.1_4_3.G18.BgIma…` | — | incomplete | 1.4.3 | `#navigation-link--systemadmin-structure-1023174967 > button…` | before#editor-initialized | needs-review |
| A11Y-PAT-5EAAAB734A50 | htmlcs 2.5.1 | `WCAG2AA.Principle1.Guideline1_4.1_4_3.G18.BgIma…` | — | incomplete | 1.4.3 | `#navigation-link--systemthemes-page-1827371361 > a > span` | before#editor-initialized | needs-review |
| A11Y-PAT-CD1C2D7315AC | htmlcs 2.5.1 | `WCAG2AA.Principle1.Guideline1_4.1_4_3.G18.BgIma…` | — | incomplete | 1.4.3 | `#navigation-link--systemmodules-list-2054754043 > a > span` | before#editor-initialized | needs-review |
| A11Y-PAT-8FC5B5AAC457 | htmlcs 2.5.1 | `WCAG2AA.Principle1.Guideline1_4.1_4_3.G18.BgIma…` | — | incomplete | 1.4.3 | `#navigation-link--systemadmin-config-1971228731 > button > …` | before#editor-initialized | needs-review |
| A11Y-PAT-70CD37458F6B | htmlcs 2.5.1 | `WCAG2AA.Principle1.Guideline1_4.1_4_3.G18.BgIma…` | — | incomplete | 1.4.3 | `#navigation-link--entityusercollection-1564519979 > a > span` | before#editor-initialized | needs-review |
| A11Y-PAT-ED2175E7914C | htmlcs 2.5.1 | `WCAG2AA.Principle1.Guideline1_4.1_4_3.G18.BgIma…` | — | incomplete | 1.4.3 | `#navigation-link--systemadmin-reports-982276584 > button > …` | before#editor-initialized | needs-review |
| A11Y-PAT-A69A2434445B | htmlcs 2.5.1 | `WCAG2AA.Principle1.Guideline1_4.1_4_3.G18.BgIma…` | — | incomplete | 1.4.3 | `#navigation-link--announcements-feedannouncement-1249979531…` | before#editor-initialized | needs-review |
| A11Y-PAT-7D59AA8E860A | htmlcs 2.5.1 | `WCAG2AA.Principle1.Guideline1_4.1_4_3.G18.Abs` | — | incomplete | 1.4.3 | `#navigation-link--navigationuser-linksuserwrapper-523289680…` | before#editor-initialized | needs-review |
| A11Y-PAT-C6AC7CCD9755 | htmlcs 2.5.1 | `WCAG2AA.Principle1.Guideline1_3.1_3_1.F92,ARIA4` | — | violation | 1.3.1 | `#admin-toolbar` | before#editor-initialized | unreviewed |
| A11Y-PAT-19E6C7117D72 | htmlcs 2.5.1 | `WCAG2AA.Principle1.Guideline1_4.1_4_3.G145.Abs` | — | incomplete | 1.4.3 | `#admin-toolbar__scroll-wrapper-935526640` | after#editor-initialized | needs-review |
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

Engine agreement is not proof of correctness, and a single engine is not necessarily wrong. Each row keeps its engine and rule identifier; WCAG and ACT are mappings.

## Manual review required

Automated checks cannot decide these. They are stored separately and were **not performed by a person** in this session.

| Checkpoint | Check | Question | Result |
|---|---|---|---|
| `editor-initialized` | `status-understandable` | Is the status or error message understandable on its own, without seeing where it appeared? | not-run |
| `editor-initialized` | `icon-recognisable` | Is the icon recognisable and, where it conveys meaning, is its name meaningful in this context? | not-run |
| `editor-initialized` | `engine-needs-review` | Review the engine results marked as needing review; they are not passes. | not-run |
| `editor-initialized` | `screen-reader-repeat` | Does a screen reader announce anything unnecessarily repetitive at this state? | not-run |
| `dropdown-open` | `status-understandable` | Is the status or error message understandable on its own, without seeing where it appeared? | not-run |
| `dropdown-open` | `screen-reader-repeat` | Does a screen reader announce anything unnecessarily repetitive at this state? | not-run |
| `balloon-open` | `status-understandable` | Is the status or error message understandable on its own, without seeing where it appeared? | not-run |
| `balloon-open` | `screen-reader-repeat` | Does a screen reader announce anything unnecessarily repetitive at this state? | not-run |
| `focus-restored` | `status-understandable` | Is the status or error message understandable on its own, without seeing where it appeared? | not-run |
| `focus-restored` | `screen-reader-repeat` | Does a screen reader announce anything unnecessarily repetitive at this state? | not-run |

## Announcement and interaction history

Nothing recorded (use profile dynamic or full at a checkpoint that follows an interaction).


## Focus transitions

| Checkpoint | Side | From | To |
|---|---|---|---|
| `dropdown-open` | Before | — | button Bold |
| `dropdown-open` | Before | button Bold | textbox Rich Text Editor. Editing area: main. Press ⌥0 fo… |
| `dropdown-open` | Before | textbox Rich Text Editor. Editing area: main. Press ⌥0 fo… | button Paragraph, Heading |
| `dropdown-open` | Before | button Paragraph, Heading | menuitemradio Paragraph |
| `balloon-open` | Before | — | button Bold |
| `balloon-open` | Before | button Bold | textbox Rich Text Editor. Editing area: main. Press ⌥0 fo… |
| `balloon-open` | Before | textbox Rich Text Editor. Editing area: main. Press ⌥0 fo… | button Paragraph, Heading |
| `balloon-open` | Before | button Paragraph, Heading | menuitemradio Paragraph |
| `balloon-open` | Before | menuitemradio Paragraph | button Paragraph, Heading |
| `balloon-open` | Before | button Paragraph, Heading | button Link |
| `balloon-open` | Before | button Link | textbox Link URL |
| `focus-restored` | Before | — | button Bold |
| `focus-restored` | Before | button Bold | textbox Rich Text Editor. Editing area: main. Press ⌥0 fo… |
| `focus-restored` | Before | textbox Rich Text Editor. Editing area: main. Press ⌥0 fo… | button Paragraph, Heading |
| `focus-restored` | Before | button Paragraph, Heading | menuitemradio Paragraph |
| `focus-restored` | Before | menuitemradio Paragraph | button Paragraph, Heading |
| `focus-restored` | Before | button Paragraph, Heading | button Link |
| `focus-restored` | Before | button Link | textbox Link URL |
| `focus-restored` | Before | textbox Link URL | textbox Rich Text Editor. Editing area: main. Press ⌥0 fo… |
| `focus-restored` | Before | textbox Rich Text Editor. Editing area: main. Press ⌥0 fo… | button Insert |
| `focus-restored` | Before | — | textbox Rich Text Editor. Editing area: main. Press ⌥0 fo… |
| `dropdown-open` | After | — | button Bold |
| `dropdown-open` | After | button Bold | textbox Rich Text Editor. Editing area: main. Press ⌥0 fo… |
| `dropdown-open` | After | textbox Rich Text Editor. Editing area: main. Press ⌥0 fo… | button Paragraph, Heading |
| `dropdown-open` | After | button Paragraph, Heading | menuitemradio Paragraph |
| `balloon-open` | After | — | button Bold |
| `balloon-open` | After | button Bold | textbox Rich Text Editor. Editing area: main. Press ⌥0 fo… |
| `balloon-open` | After | textbox Rich Text Editor. Editing area: main. Press ⌥0 fo… | button Paragraph, Heading |
| `balloon-open` | After | button Paragraph, Heading | menuitemradio Paragraph |
| `balloon-open` | After | menuitemradio Paragraph | button Paragraph, Heading |
| `balloon-open` | After | button Paragraph, Heading | button Link |
| `balloon-open` | After | button Link | textbox Link URL |
| `focus-restored` | After | — | button Bold |
| `focus-restored` | After | button Bold | textbox Rich Text Editor. Editing area: main. Press ⌥0 fo… |
| `focus-restored` | After | textbox Rich Text Editor. Editing area: main. Press ⌥0 fo… | button Paragraph, Heading |
| `focus-restored` | After | button Paragraph, Heading | menuitemradio Paragraph |
| `focus-restored` | After | menuitemradio Paragraph | button Paragraph, Heading |
| `focus-restored` | After | button Paragraph, Heading | button Link |
| `focus-restored` | After | button Link | textbox Link URL |
| `focus-restored` | After | textbox Link URL | textbox Rich Text Editor. Editing area: main. Press ⌥0 fo… |
| `focus-restored` | After | textbox Rich Text Editor. Editing area: main. Press ⌥0 fo… | button Insert |
| `focus-restored` | After | — | textbox Rich Text Editor. Editing area: main. Press ⌥0 fo… |

## Screenshots

- Before `editor-initialized` (viewport): [viewport.png](reports/infrastructure/a11y-mcp/2026-11-27T19-11-46-live-3419891-pinned/evidence/001-editor-initialized/viewport.png)
- After `editor-initialized` (viewport): [viewport.png](reports/infrastructure/a11y-mcp/2026-11-27T19-11-46-live-3419891-pinned/evidence/005-editor-initialized/viewport.png)

## Reproduction steps (from the recorded trusted interactions)

These are what the browser saw, not MCP element references (those are session-scoped and are never regression locators). Convert them to semantic locators in a scenario file before replaying.

### `dropdown-open` (Before)

1. trusted pointerdown on `div:nth-of-type(1) > div > div:nth-of-type(2) > div > div:nth-of-type(1) > button:nth-of-type(1) > svg > path`
1. trusted pointerdown on `div:nth-of-type(1) > div > div:nth-of-type(2) > div > div:nth-of-type(1) > div:nth-of-type(3) > button > span`

### `balloon-open` (Before)

1. trusted pointerdown on `div:nth-of-type(1) > div > div:nth-of-type(2) > div > div:nth-of-type(1) > button:nth-of-type(1) > svg > path`
1. trusted pointerdown on `div:nth-of-type(1) > div > div:nth-of-type(2) > div > div:nth-of-type(1) > div:nth-of-type(3) > button > span`
1. trusted key on `div:nth-of-type(2) > div > div:nth-of-type(1) > div:nth-of-type(3) > div > ul > li:nth-of-type(1) > button` ("Paragraph") key Escape
1. trusted pointerdown on `div:nth-of-type(1) > div > div:nth-of-type(2) > div > div:nth-of-type(1) > button:nth-of-type(3) > svg > path`

### `focus-restored` (Before)

1. trusted pointerdown on `div:nth-of-type(1) > div > div:nth-of-type(2) > div > div:nth-of-type(1) > button:nth-of-type(1) > svg > path`
1. trusted pointerdown on `div:nth-of-type(1) > div > div:nth-of-type(2) > div > div:nth-of-type(1) > div:nth-of-type(3) > button > span`
1. trusted key on `div:nth-of-type(2) > div > div:nth-of-type(1) > div:nth-of-type(3) > div > ul > li:nth-of-type(1) > button` ("Paragraph") key Escape
1. trusted pointerdown on `div:nth-of-type(1) > div > div:nth-of-type(2) > div > div:nth-of-type(1) > button:nth-of-type(3) > svg > path`
1. trusted key on `#ck-labeled-field-view-e5adca6393c254348fad257f1cf5574b4` ("Link URL") key Escape

### `dropdown-open` (After)

1. trusted pointerdown on `div:nth-of-type(1) > div > div:nth-of-type(2) > div > div:nth-of-type(1) > button:nth-of-type(1) > svg > path`
1. trusted pointerdown on `div:nth-of-type(1) > div > div:nth-of-type(2) > div > div:nth-of-type(1) > div:nth-of-type(3) > button > span`

### `balloon-open` (After)

1. trusted pointerdown on `div:nth-of-type(1) > div > div:nth-of-type(2) > div > div:nth-of-type(1) > button:nth-of-type(1) > svg > path`
1. trusted pointerdown on `div:nth-of-type(1) > div > div:nth-of-type(2) > div > div:nth-of-type(1) > div:nth-of-type(3) > button > span`
1. trusted key on `div:nth-of-type(2) > div > div:nth-of-type(1) > div:nth-of-type(3) > div > ul > li:nth-of-type(1) > button` ("Paragraph") key Escape
1. trusted pointerdown on `div:nth-of-type(1) > div > div:nth-of-type(2) > div > div:nth-of-type(1) > button:nth-of-type(3) > svg > path`

### `focus-restored` (After)

1. trusted pointerdown on `div:nth-of-type(1) > div > div:nth-of-type(2) > div > div:nth-of-type(1) > button:nth-of-type(1) > svg > path`
1. trusted pointerdown on `div:nth-of-type(1) > div > div:nth-of-type(2) > div > div:nth-of-type(1) > div:nth-of-type(3) > button > span`
1. trusted key on `div:nth-of-type(2) > div > div:nth-of-type(1) > div:nth-of-type(3) > div > ul > li:nth-of-type(1) > button` ("Paragraph") key Escape
1. trusted pointerdown on `div:nth-of-type(1) > div > div:nth-of-type(2) > div > div:nth-of-type(1) > button:nth-of-type(3) > svg > path`
1. trusted key on `#ck-labeled-field-view-e83e01aaa6d15b4283c6bef330ec9ed81` ("Link URL") key Escape

## Resource consumption (measured, not estimated)

| Measure | Value |
|---|---|
| Checkpoints | 8 |
| Engine runs | 8 |
| Scan time | 22425 ms |
| Evidence on disk | 1703.3 KiB |
| Screenshots | 2 |
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
- The accessibility tree was not captured for this checkpoint (profile quick/multi-engine/visual/dynamic do not include it; use semantic or full).
- Announcements and silent changes were not collected for this checkpoint (use profile dynamic or full).
- The readiness condition was not met, so this checkpoint describes an unexpected state: page.waitForFunction: Timeout 5000ms exceeded.. A missing finding here may mean the state was never reached.
- axe-core did not run: readiness condition was not met, so the checks that need the expected state were not run

Generated with the help of an LLM (DeepSeek Harness) from the recorded evidence. AI-assisted development and evaluation disclosure; a person must review before anything is reported upstream.
