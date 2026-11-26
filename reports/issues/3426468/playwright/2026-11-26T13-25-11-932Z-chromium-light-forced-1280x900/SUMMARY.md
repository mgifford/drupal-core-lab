# Playwright evidence: #3426468 (3426468-latest)

DRAFT. chromium 159.0.8154.6, requested light scheme, forced colours, 1280x900. Real Tab and pointer input was used for the focus and hover rows. axe-core uses the WCAG 2.0-2.2 A/AA tags. Contrast is computed from rendered colours, not token names; a low delta between active and inactive text is reported as a state signal, not as an SC 1.4.3 failure.

| Type | Check | Before | After | Result |
|---|---|---|---|---|
| precondition | All three routes loaded on both sides | true | true | as expected |
| precondition | Current top-level item identified on appearance and content (both sides) | true | true | as expected |
| precondition | Current item found on every route (both sides) | true | true | as expected |
| fix | appearance: current top-level item is marked by more than colour | 1 | 1 | as expected |
| fix | appearance: current top-level indicator contrast >= 3:1 (SC 1.4.11) | 21 | 21 | as expected |
| regression | appearance: current top-level text contrast >= 4.5:1 (SC 1.4.3) | 13.99 | 13.99 | as expected |
| observe | appearance: active-vs-inactive text delta (state signal, not 1.4.3) | 1.5 | 1.5 | recorded |
| regression | appearance: current top-level indicator is not clipped (expanded) | [0] | [0] | as expected |
| regression | appearance: current top-level indicator does not overlap icon or label | false | false | as expected |
| observe | appearance: aria-current on the current top-level item (null is a pre-existing gap, not this patch) | null | null | recorded |
| regression | appearance: the patch does not change aria-current on the current item | null | null | as expected |
| observe | appearance: rendered current text colour | {"rgb":"rgb(0, 0, 159)","raw":"rgb(0, 0, 159)"} | {"rgb":"rgb(0, 0, 159)","raw":"rgb(0, 0, 159)"} | recorded |
| fix | content: current top-level item is marked by more than colour | 1 | 1 | as expected |
| fix | content: current top-level indicator contrast >= 3:1 (SC 1.4.11) | 21 | 21 | as expected |
| regression | content: current top-level text contrast >= 4.5:1 (SC 1.4.3) | 13.99 | 13.99 | as expected |
| observe | content: active-vs-inactive text delta (state signal, not 1.4.3) | 1.5 | 1.5 | recorded |
| regression | content: current top-level indicator is not clipped (expanded) | [0] | [0] | as expected |
| regression | content: current top-level indicator does not overlap icon or label | false | false | as expected |
| observe | content: aria-current on the current top-level item (null is a pre-existing gap, not this patch) | null | null | recorded |
| regression | content: the patch does not change aria-current on the current item | null | null | as expected |
| observe | content: rendered current text colour | {"rgb":"rgb(0, 0, 159)","raw":"rgb(0, 0, 159)"} | {"rgb":"rgb(0, 0, 159)","raw":"rgb(0, 0, 159)"} | recorded |
| fix | form-modes: top-level ancestor (Structure) is marked by more than colour | 1 | 1 | as expected |
| fix | form-modes: top-level ancestor indicator contrast >= 3:1 (SC 1.4.11) | 21 | 21 | as expected |
| regression | form-modes: top-level ancestor indicator is not clipped (expanded) | [0] | [0] | as expected |
| regression | form-modes: top-level ancestor is not marked aria-current | null | null | as expected |
| observe | Shortcut module present (the issue's case c needs it; it is absent from core at this commit) | false | false | recorded |
| observe | form-modes: submenu ancestor (open trigger containing the current item) has its own non-colour marker | null | 0 | recorded |
| observe | form-modes: current submenu item keeps its dot/indicator | null | 1 | recorded |
| regression | form-modes: current submenu item has aria-current="page" | "page" | "page" | as expected |
| observe | appearance: active trail was already expanded when the page loaded | true | true | recorded |
| observe | appearance: active trail expanded by the evaluator (real clicks) | null | 0 | recorded |
| regression | appearance: no active ancestor is marked aria-current | null | [] | as expected |
| observe | form-modes: active trail was already expanded when the page loaded | false | false | recorded |
| observe | form-modes: active trail expanded by the evaluator (real clicks) | null | 2 | recorded |
| regression | form-modes: no active ancestor is marked aria-current | null | [] | as expected |
| observe | content: active trail was already expanded when the page loaded | true | true | recorded |
| observe | content: active trail expanded by the evaluator (real clicks) | null | 0 | recorded |
| regression | content: no active ancestor is marked aria-current | null | [] | as expected |
| fix | appearance: the active item keeps its indicator on hover | null | {"text":"Appearance","indicator":true,"beforeWidth":"4px"} | as expected |
| regression | appearance: hovering an inactive item does not add the active indicator | null | {"text":"Create","indicator":false,"beforeWidth":"0px"} | as expected |
| fix | form-modes: the active item keeps its indicator on hover | null | {"text":"Collapse Structure","indicator":true,"beforeWidth":"4px"} | as expected |
| regression | form-modes: hovering an inactive item does not add the active indicator | null | {"text":"Create","indicator":false,"beforeWidth":"0px"} | as expected |
| fix | content: the active item keeps its indicator on hover | null | {"text":"Content","indicator":true,"beforeWidth":"4px"} | as expected |
| regression | content: hovering an inactive item does not add the active indicator | null | {"text":"Create","indicator":false,"beforeWidth":"0px"} | as expected |
| regression | appearance: keyboard focus outline visible on every focused Navigation control | null | {"focused":16,"withoutOutline":0} | as expected |
| observe | appearance: focused controls using a visible but non-theme focus outline (<2px) | null | [] | recorded |
| regression | appearance: focus outline still visible on the current item | null | {"outline":"solid","width":"2px","color":"rgba(5, 0, 73, 0.8)"} | as expected |
| regression | appearance: the new bar does not intersect the focus ring (SC 2.4.11) | null | {"ring":2,"overlap":false} | as expected |
| regression | form-modes: keyboard focus outline visible on every focused Navigation control | null | {"focused":14,"withoutOutline":0} | as expected |
| observe | form-modes: focused controls using a visible but non-theme focus outline (<2px) | null | [] | recorded |
| regression | form-modes: focus outline still visible on the current item | null | {"outline":"solid","width":"2px","color":"rgba(5, 0, 73, 0.8)"} | as expected |
| observe | form-modes: existing submenu dot and the inset focus ring touch (pre-existing) | null | {"ring":0,"overlap":true} | recorded |
| regression | content: keyboard focus outline visible on every focused Navigation control | null | {"focused":16,"withoutOutline":0} | as expected |
| observe | content: focused controls using a visible but non-theme focus outline (<2px) | null | [] | recorded |
| regression | content: focus outline still visible on the current item | null | {"outline":"solid","width":"2px","color":"rgba(5, 0, 73, 0.8)"} | as expected |
| regression | content: the new bar does not intersect the focus ring (SC 2.4.11) | null | {"ring":2,"overlap":false} | as expected |
| observe | keyboard focus reached Navigation controls on the After side | null | 46 | recorded |
| observe | forced colours: rendered CanvasText and Canvas | null | {"bodyBackground":"rgb(255, 255, 255)","bodyBackgroundRgb":"rgb(255, 255, 255)","canvas":{"color":"rgb(0, 0, 0)","background":"rgb(255, 255, 255)"},"linkColor":"rgb(0, 0, 159)"} | recorded |
| regression | Indicator does not shift the Navigation item box | [] | [] | as expected |
| regression | appearance: axe violations (elements) do not increase | 0 | 0 | as expected |
| regression | form-modes: axe violations (elements) do not increase | 0 | 0 | as expected |
| regression | content: axe violations (elements) do not increase | 0 | 0 | as expected |
| regression | No uncaught JavaScript errors | 0 | 0 | as expected |

## Rendered state (not the requested emulation)

| Route | dir | prefers-color-scheme: dark | forced-colors: active | data-admin-toolbar | body background | CanvasText / Canvas |
|---|---|---|---|---|---|---|
| /admin/appearance | ltr | false | true | expanded | rgb(255, 255, 255) | rgb(0, 0, 0) / rgb(255, 255, 255) |
| /admin/structure/display-modes/form | ltr | false | true | expanded | rgb(255, 255, 255) | rgb(0, 0, 0) / rgb(255, 255, 255) |
| /admin/content | ltr | false | true | expanded | rgb(255, 255, 255) | rgb(0, 0, 0) / rgb(255, 255, 255) |

## Navigation items (After)

| Route | Level | State | Element | Text | aria-current | aria-expanded | Indicator | Indicator contrast | Text contrast | Clipped by |
|---|---|---|---|---|---|---|---|---|---|---|
| /admin/appearance | top | inactive | button.toolbar-button | Back | — | — | — | — | 21 | none |
| /admin/appearance | top | expanded | button.toolbar-button | Collapse sidebar | — | true | — | — | 21 | none |
| /admin/appearance | top | inactive | a.toolbar-button | Create | — | — | — | — | 13.99 | none |
| /admin/appearance | top | inactive | a.toolbar-button | Blocks | — | — | — | — | 13.99 | none |
| /admin/appearance | top | inactive | a.toolbar-button | Content | — | — | — | — | 13.99 | none |
| /admin/appearance | top | inactive | a.toolbar-button | Files | — | — | — | — | 13.99 | none |
| /admin/appearance | top | inactive | a.toolbar-button | Welcome | — | — | — | — | 13.99 | none |
| /admin/appearance | top | inactive | button.toolbar-button | Extend Structure | — | false | — | — | 21 | none |
| /admin/appearance | level-2 | inactive | a.toolbar-button | Structure | — | — | — | — | 13.99 | none |
| /admin/appearance | level-2 | inactive | a.toolbar-button | Block layout | — | — | — | — | 13.99 | none |
| /admin/appearance | level-2 | inactive | a.toolbar-button | Block types | — | — | — | — | 13.99 | none |
| /admin/appearance | level-2 | inactive | a.toolbar-button | Content types | — | — | — | — | 13.99 | none |
| /admin/appearance | level-2 | inactive | button.toolbar-button | Display modes | — | false | — | — | 21 | none |
| /admin/appearance | level-3 | inactive | a.toolbar-menu__link | Form modes | — | — | — | — | 13.99 | none |
| /admin/appearance | level-3 | inactive | a.toolbar-menu__link | View modes | — | — | — | — | 13.99 | none |
| /admin/appearance | level-2 | inactive | a.toolbar-button | Menus | — | — | — | — | 13.99 | none |
| /admin/appearance | level-2 | inactive | a.toolbar-button | Taxonomy | — | — | — | — | 13.99 | none |
| /admin/appearance | level-2 | inactive | a.toolbar-button | Views | — | — | — | — | 13.99 | none |
| /admin/appearance | top | current | a.current | Appearance | — | — | bar ::before 4x40px rgb(0, 0, 0) | 21 | 13.99 | none |
| /admin/appearance | top | inactive | a.toolbar-button | Extend | — | — | — | — | 13.99 | none |
| /admin/appearance | top | inactive | button.toolbar-button | Extend Configuration | — | false | — | — | 21 | none |
| /admin/appearance | level-2 | inactive | a.toolbar-button | Configuration | — | — | — | — | 13.99 | none |
| /admin/appearance | level-2 | inactive | button.toolbar-button | People | — | false | — | — | 21 | none |
| /admin/appearance | level-3 | inactive | a.toolbar-menu__link | Account settings | — | — | — | — | 13.99 | none |
| /admin/appearance | level-2 | inactive | button.toolbar-button | System | — | false | — | — | 21 | none |
| /admin/appearance | level-3 | inactive | a.toolbar-menu__link | Basic site settings | — | — | — | — | 13.99 | none |
| /admin/appearance | level-3 | inactive | a.toolbar-menu__link | Cron | — | — | — | — | 13.99 | none |
| /admin/appearance | level-2 | inactive | button.toolbar-button | Content authoring | — | false | — | — | 21 | none |
| /admin/appearance | level-3 | inactive | a.toolbar-menu__link | Text formats and editors | — | — | — | — | 13.99 | none |
| /admin/appearance | level-2 | inactive | button.toolbar-button | User interface | — | false | — | — | 21 | none |
| /admin/appearance | level-3 | inactive | a.toolbar-menu__link | Navigation blocks | — | — | — | — | 13.99 | none |
| /admin/appearance | level-3 | inactive | a.toolbar-menu__link | Navigation settings | — | — | — | — | 13.99 | none |
| /admin/appearance | level-2 | inactive | button.toolbar-button | Development | — | false | — | — | 21 | none |
| /admin/appearance | level-3 | inactive | a.toolbar-menu__link | Performance | — | — | — | — | 13.99 | none |
| /admin/appearance | level-3 | inactive | a.toolbar-menu__link | Development settings | — | — | — | — | 13.99 | none |
| /admin/appearance | level-3 | inactive | a.toolbar-menu__link | Logging and errors | — | — | — | — | 13.99 | none |
| /admin/appearance | level-3 | inactive | a.toolbar-menu__link | Maintenance mode | — | — | — | — | 13.99 | none |
| /admin/appearance | level-3 | inactive | a.toolbar-menu__link | Configuration synchronization | — | — | — | — | 13.99 | none |
| /admin/appearance | level-2 | inactive | button.toolbar-button | Media | — | false | — | — | 21 | none |
| /admin/appearance | level-3 | inactive | a.toolbar-menu__link | File system | — | — | — | — | 13.99 | none |
| /admin/appearance | level-3 | inactive | a.toolbar-menu__link | Image styles | — | — | — | — | 13.99 | none |
| /admin/appearance | level-3 | inactive | a.toolbar-menu__link | Image toolkit | — | — | — | — | 13.99 | none |
| /admin/appearance | level-2 | inactive | button.toolbar-button | Search and metadata | — | false | — | — | 21 | none |
| /admin/appearance | level-3 | inactive | a.toolbar-menu__link | URL aliases | — | — | — | — | 13.99 | none |
| /admin/appearance | level-2 | inactive | button.toolbar-button | Region and language | — | false | — | — | 21 | none |
| /admin/appearance | level-3 | inactive | a.toolbar-menu__link | Regional settings | — | — | — | — | 13.99 | none |
| /admin/appearance | level-3 | inactive | a.toolbar-menu__link | Date and time formats | — | — | — | — | 13.99 | none |
| /admin/appearance | level-2 | inactive | button.toolbar-button | Web services | — | false | — | — | 21 | none |
| /admin/appearance | level-3 | inactive | a.toolbar-menu__link | Menu Linkset Settings | — | — | — | — | 13.99 | none |
| /admin/appearance | top | inactive | a.toolbar-button | People | — | — | — | — | 13.99 | none |
| /admin/appearance | top | inactive | button.toolbar-button | Extend Reports | — | false | — | — | 21 | none |
| /admin/appearance | level-2 | inactive | a.toolbar-button | Reports | — | — | — | — | 13.99 | none |
| /admin/appearance | level-2 | inactive | a.toolbar-button | Status report | — | — | — | — | 13.99 | none |
| /admin/appearance | level-2 | inactive | a.toolbar-button | Available updates | — | — | — | — | 13.99 | none |
| /admin/appearance | level-2 | inactive | a.toolbar-button | Recent log messages | — | — | — | — | 13.99 | none |
| /admin/appearance | level-2 | inactive | a.toolbar-button | Field list | — | — | — | — | 13.99 | none |
| /admin/appearance | level-2 | inactive | a.toolbar-button | Top 'access denied' errors | — | — | — | — | 13.99 | none |
| /admin/appearance | level-2 | inactive | a.toolbar-button | Top 'page not found' errors | — | — | — | — | 13.99 | none |
| /admin/appearance | level-2 | inactive | a.toolbar-button | Views plugins | — | — | — | — | 13.99 | none |
| /admin/appearance | top | inactive | a.toolbar-button | Announcements | — | — | — | — | 13.99 | none |
| /admin/appearance | top | inactive | a.toolbar-button | Help | — | — | — | — | 13.99 | none |
| /admin/appearance | top | inactive | button.toolbar-button | Extend admin | — | false | — | — | 21 | none |
| /admin/appearance | level-2 | inactive | a.toolbar-button | admin | — | — | — | — | 13.99 | none |
| /admin/appearance | level-2 | inactive | a.toolbar-button | View profile | — | — | — | — | 13.99 | none |
| /admin/appearance | level-2 | inactive | a.toolbar-button | Edit profile | — | — | — | — | 13.99 | none |
| /admin/appearance | level-2 | inactive | a.toolbar-button | Log out | — | — | — | — | 13.99 | none |
| /admin/structure/display-modes/form | top | inactive | button.toolbar-button | Back | — | — | — | — | 21 | none |
| /admin/structure/display-modes/form | top | expanded | button.toolbar-button | Collapse sidebar | — | true | — | — | 21 | none |
| /admin/structure/display-modes/form | top | inactive | a.toolbar-button | Create | — | — | — | — | 13.99 | none |
| /admin/structure/display-modes/form | top | inactive | a.toolbar-button | Blocks | — | — | — | — | 13.99 | none |
| /admin/structure/display-modes/form | top | inactive | a.toolbar-button | Content | — | — | — | — | 13.99 | none |
| /admin/structure/display-modes/form | top | inactive | a.toolbar-button | Files | — | — | — | — | 13.99 | none |
| /admin/structure/display-modes/form | top | inactive | a.toolbar-button | Welcome | — | — | — | — | 13.99 | none |
| /admin/structure/display-modes/form | top | ancestor (top level) | button.toolbar-button | Collapse Structure | — | true | bar ::before 4x40px rgb(0, 0, 0) | 21 | 21 | none |
| /admin/structure/display-modes/form | level-2 | ancestor (submenu) | a.toolbar-button | Structure | — | — | — | — | 13.99 | none |
| /admin/structure/display-modes/form | level-2 | inactive | a.toolbar-button | Block layout | — | — | — | — | 13.99 | none |
| /admin/structure/display-modes/form | level-2 | inactive | a.toolbar-button | Block types | — | — | — | — | 13.99 | none |
| /admin/structure/display-modes/form | level-2 | inactive | a.toolbar-button | Content types | — | — | — | — | 13.99 | none |
| /admin/structure/display-modes/form | level-2 | ancestor (submenu) | button.toolbar-button | Display modes | — | true | — | — | 21 | none |
| /admin/structure/display-modes/form | level-3 | current | a.current | Form modes | page | — | dot ::after 8x8px rgb(255, 255, 255) | 1 | 13.99 | div.admin-toolbar__content |
| /admin/structure/display-modes/form | level-3 | inactive | a.toolbar-menu__link | View modes | — | — | — | — | 13.99 | none |
| /admin/structure/display-modes/form | level-2 | inactive | a.toolbar-button | Menus | — | — | — | — | 13.99 | none |
| /admin/structure/display-modes/form | level-2 | inactive | a.toolbar-button | Taxonomy | — | — | — | — | 13.99 | none |
| /admin/structure/display-modes/form | level-2 | inactive | a.toolbar-button | Views | — | — | — | — | 13.99 | none |
| /admin/structure/display-modes/form | top | inactive | a.toolbar-button | Appearance | — | — | — | — | 13.99 | none |
| /admin/structure/display-modes/form | top | inactive | a.toolbar-button | Extend | — | — | — | — | 13.99 | none |
| /admin/structure/display-modes/form | top | inactive | button.toolbar-button | Extend Configuration | — | false | — | — | 21 | none |
| /admin/structure/display-modes/form | level-2 | inactive | a.toolbar-button | Configuration | — | — | — | — | 13.99 | none |
| /admin/structure/display-modes/form | level-2 | inactive | button.toolbar-button | People | — | false | — | — | 21 | none |
| /admin/structure/display-modes/form | level-3 | inactive | a.toolbar-menu__link | Account settings | — | — | — | — | 13.99 | none |
| /admin/structure/display-modes/form | level-2 | inactive | button.toolbar-button | System | — | false | — | — | 21 | none |
| /admin/structure/display-modes/form | level-3 | inactive | a.toolbar-menu__link | Basic site settings | — | — | — | — | 13.99 | none |
| /admin/structure/display-modes/form | level-3 | inactive | a.toolbar-menu__link | Cron | — | — | — | — | 13.99 | none |
| /admin/structure/display-modes/form | level-2 | inactive | button.toolbar-button | Content authoring | — | false | — | — | 21 | none |
| /admin/structure/display-modes/form | level-3 | inactive | a.toolbar-menu__link | Text formats and editors | — | — | — | — | 13.99 | none |
| /admin/structure/display-modes/form | level-2 | inactive | button.toolbar-button | User interface | — | false | — | — | 21 | none |
| /admin/structure/display-modes/form | level-3 | inactive | a.toolbar-menu__link | Navigation blocks | — | — | — | — | 13.99 | none |
| /admin/structure/display-modes/form | level-3 | inactive | a.toolbar-menu__link | Navigation settings | — | — | — | — | 13.99 | none |
| /admin/structure/display-modes/form | level-2 | inactive | button.toolbar-button | Development | — | false | — | — | 21 | none |
| /admin/structure/display-modes/form | level-3 | inactive | a.toolbar-menu__link | Performance | — | — | — | — | 13.99 | none |
| /admin/structure/display-modes/form | level-3 | inactive | a.toolbar-menu__link | Development settings | — | — | — | — | 13.99 | none |
| /admin/structure/display-modes/form | level-3 | inactive | a.toolbar-menu__link | Logging and errors | — | — | — | — | 13.99 | none |
| /admin/structure/display-modes/form | level-3 | inactive | a.toolbar-menu__link | Maintenance mode | — | — | — | — | 13.99 | none |
| /admin/structure/display-modes/form | level-3 | inactive | a.toolbar-menu__link | Configuration synchronization | — | — | — | — | 13.99 | none |
| /admin/structure/display-modes/form | level-2 | inactive | button.toolbar-button | Media | — | false | — | — | 21 | none |
| /admin/structure/display-modes/form | level-3 | inactive | a.toolbar-menu__link | File system | — | — | — | — | 13.99 | none |
| /admin/structure/display-modes/form | level-3 | inactive | a.toolbar-menu__link | Image styles | — | — | — | — | 13.99 | none |
| /admin/structure/display-modes/form | level-3 | inactive | a.toolbar-menu__link | Image toolkit | — | — | — | — | 13.99 | none |
| /admin/structure/display-modes/form | level-2 | inactive | button.toolbar-button | Search and metadata | — | false | — | — | 21 | none |
| /admin/structure/display-modes/form | level-3 | inactive | a.toolbar-menu__link | URL aliases | — | — | — | — | 13.99 | none |
| /admin/structure/display-modes/form | level-2 | inactive | button.toolbar-button | Region and language | — | false | — | — | 21 | none |
| /admin/structure/display-modes/form | level-3 | inactive | a.toolbar-menu__link | Regional settings | — | — | — | — | 13.99 | none |
| /admin/structure/display-modes/form | level-3 | inactive | a.toolbar-menu__link | Date and time formats | — | — | — | — | 13.99 | none |
| /admin/structure/display-modes/form | level-2 | inactive | button.toolbar-button | Web services | — | false | — | — | 21 | none |
| /admin/structure/display-modes/form | level-3 | inactive | a.toolbar-menu__link | Menu Linkset Settings | — | — | — | — | 13.99 | none |
| /admin/structure/display-modes/form | top | inactive | a.toolbar-button | People | — | — | — | — | 13.99 | none |
| /admin/structure/display-modes/form | top | inactive | button.toolbar-button | Extend Reports | — | false | — | — | 21 | none |
| /admin/structure/display-modes/form | level-2 | inactive | a.toolbar-button | Reports | — | — | — | — | 13.99 | none |
| /admin/structure/display-modes/form | level-2 | inactive | a.toolbar-button | Status report | — | — | — | — | 13.99 | none |
| /admin/structure/display-modes/form | level-2 | inactive | a.toolbar-button | Available updates | — | — | — | — | 13.99 | none |
| /admin/structure/display-modes/form | level-2 | inactive | a.toolbar-button | Recent log messages | — | — | — | — | 13.99 | none |
| /admin/structure/display-modes/form | level-2 | inactive | a.toolbar-button | Field list | — | — | — | — | 13.99 | none |
| /admin/structure/display-modes/form | level-2 | inactive | a.toolbar-button | Top 'access denied' errors | — | — | — | — | 13.99 | none |
| /admin/structure/display-modes/form | level-2 | inactive | a.toolbar-button | Top 'page not found' errors | — | — | — | — | 13.99 | none |
| /admin/structure/display-modes/form | level-2 | inactive | a.toolbar-button | Views plugins | — | — | — | — | 13.99 | none |
| /admin/structure/display-modes/form | top | inactive | a.toolbar-button | Announcements | — | — | — | — | 13.99 | none |
| /admin/structure/display-modes/form | top | inactive | a.toolbar-button | Help | — | — | — | — | 13.99 | none |
| /admin/structure/display-modes/form | top | inactive | button.toolbar-button | Extend admin | — | false | — | — | 21 | none |
| /admin/structure/display-modes/form | level-2 | inactive | a.toolbar-button | admin | — | — | — | — | 13.99 | none |
| /admin/structure/display-modes/form | level-2 | inactive | a.toolbar-button | View profile | — | — | — | — | 13.99 | none |
| /admin/structure/display-modes/form | level-2 | inactive | a.toolbar-button | Edit profile | — | — | — | — | 13.99 | none |
| /admin/structure/display-modes/form | level-2 | inactive | a.toolbar-button | Log out | — | — | — | — | 13.99 | none |
| /admin/content | top | inactive | button.toolbar-button | Back | — | — | — | — | 21 | none |
| /admin/content | top | expanded | button.toolbar-button | Collapse sidebar | — | true | — | — | 21 | none |
| /admin/content | top | inactive | a.toolbar-button | Create | — | — | — | — | 13.99 | none |
| /admin/content | top | inactive | a.toolbar-button | Blocks | — | — | — | — | 13.99 | none |
| /admin/content | top | current | a.current | Content | — | — | bar ::before 4x40px rgb(0, 0, 0) | 21 | 13.99 | none |
| /admin/content | top | inactive | a.toolbar-button | Files | — | — | — | — | 13.99 | none |
| /admin/content | top | inactive | a.toolbar-button | Welcome | — | — | — | — | 13.99 | none |
| /admin/content | top | inactive | button.toolbar-button | Extend Structure | — | false | — | — | 21 | none |
| /admin/content | level-2 | inactive | a.toolbar-button | Structure | — | — | — | — | 13.99 | none |
| /admin/content | level-2 | inactive | a.toolbar-button | Block layout | — | — | — | — | 13.99 | none |
| /admin/content | level-2 | inactive | a.toolbar-button | Block types | — | — | — | — | 13.99 | none |
| /admin/content | level-2 | inactive | a.toolbar-button | Content types | — | — | — | — | 13.99 | none |
| /admin/content | level-2 | inactive | button.toolbar-button | Display modes | — | false | — | — | 21 | none |
| /admin/content | level-3 | inactive | a.toolbar-menu__link | Form modes | — | — | — | — | 13.99 | none |
| /admin/content | level-3 | inactive | a.toolbar-menu__link | View modes | — | — | — | — | 13.99 | none |
| /admin/content | level-2 | inactive | a.toolbar-button | Menus | — | — | — | — | 13.99 | none |
| /admin/content | level-2 | inactive | a.toolbar-button | Taxonomy | — | — | — | — | 13.99 | none |
| /admin/content | level-2 | inactive | a.toolbar-button | Views | — | — | — | — | 13.99 | none |
| /admin/content | top | inactive | a.toolbar-button | Appearance | — | — | — | — | 13.99 | none |
| /admin/content | top | inactive | a.toolbar-button | Extend | — | — | — | — | 13.99 | none |
| /admin/content | top | inactive | button.toolbar-button | Extend Configuration | — | false | — | — | 21 | none |
| /admin/content | level-2 | inactive | a.toolbar-button | Configuration | — | — | — | — | 13.99 | none |
| /admin/content | level-2 | inactive | button.toolbar-button | People | — | false | — | — | 21 | none |
| /admin/content | level-3 | inactive | a.toolbar-menu__link | Account settings | — | — | — | — | 13.99 | none |
| /admin/content | level-2 | inactive | button.toolbar-button | System | — | false | — | — | 21 | none |
| /admin/content | level-3 | inactive | a.toolbar-menu__link | Basic site settings | — | — | — | — | 13.99 | none |
| /admin/content | level-3 | inactive | a.toolbar-menu__link | Cron | — | — | — | — | 13.99 | none |
| /admin/content | level-2 | inactive | button.toolbar-button | Content authoring | — | false | — | — | 21 | none |
| /admin/content | level-3 | inactive | a.toolbar-menu__link | Text formats and editors | — | — | — | — | 13.99 | none |
| /admin/content | level-2 | inactive | button.toolbar-button | User interface | — | false | — | — | 21 | none |
| /admin/content | level-3 | inactive | a.toolbar-menu__link | Navigation blocks | — | — | — | — | 13.99 | none |
| /admin/content | level-3 | inactive | a.toolbar-menu__link | Navigation settings | — | — | — | — | 13.99 | none |
| /admin/content | level-2 | inactive | button.toolbar-button | Development | — | false | — | — | 21 | none |
| /admin/content | level-3 | inactive | a.toolbar-menu__link | Performance | — | — | — | — | 13.99 | none |
| /admin/content | level-3 | inactive | a.toolbar-menu__link | Development settings | — | — | — | — | 13.99 | none |
| /admin/content | level-3 | inactive | a.toolbar-menu__link | Logging and errors | — | — | — | — | 13.99 | none |
| /admin/content | level-3 | inactive | a.toolbar-menu__link | Maintenance mode | — | — | — | — | 13.99 | none |
| /admin/content | level-3 | inactive | a.toolbar-menu__link | Configuration synchronization | — | — | — | — | 13.99 | none |
| /admin/content | level-2 | inactive | button.toolbar-button | Media | — | false | — | — | 21 | none |
| /admin/content | level-3 | inactive | a.toolbar-menu__link | File system | — | — | — | — | 13.99 | none |
| /admin/content | level-3 | inactive | a.toolbar-menu__link | Image styles | — | — | — | — | 13.99 | none |
| /admin/content | level-3 | inactive | a.toolbar-menu__link | Image toolkit | — | — | — | — | 13.99 | none |
| /admin/content | level-2 | inactive | button.toolbar-button | Search and metadata | — | false | — | — | 21 | none |
| /admin/content | level-3 | inactive | a.toolbar-menu__link | URL aliases | — | — | — | — | 13.99 | none |
| /admin/content | level-2 | inactive | button.toolbar-button | Region and language | — | false | — | — | 21 | none |
| /admin/content | level-3 | inactive | a.toolbar-menu__link | Regional settings | — | — | — | — | 13.99 | none |
| /admin/content | level-3 | inactive | a.toolbar-menu__link | Date and time formats | — | — | — | — | 13.99 | none |
| /admin/content | level-2 | inactive | button.toolbar-button | Web services | — | false | — | — | 21 | none |
| /admin/content | level-3 | inactive | a.toolbar-menu__link | Menu Linkset Settings | — | — | — | — | 13.99 | none |
| /admin/content | top | inactive | a.toolbar-button | People | — | — | — | — | 13.99 | none |
| /admin/content | top | inactive | button.toolbar-button | Extend Reports | — | false | — | — | 21 | none |
| /admin/content | level-2 | inactive | a.toolbar-button | Reports | — | — | — | — | 13.99 | none |
| /admin/content | level-2 | inactive | a.toolbar-button | Status report | — | — | — | — | 13.99 | none |
| /admin/content | level-2 | inactive | a.toolbar-button | Available updates | — | — | — | — | 13.99 | none |
| /admin/content | level-2 | inactive | a.toolbar-button | Recent log messages | — | — | — | — | 13.99 | none |
| /admin/content | level-2 | inactive | a.toolbar-button | Field list | — | — | — | — | 13.99 | none |
| /admin/content | level-2 | inactive | a.toolbar-button | Top 'access denied' errors | — | — | — | — | 13.99 | none |
| /admin/content | level-2 | inactive | a.toolbar-button | Top 'page not found' errors | — | — | — | — | 13.99 | none |
| /admin/content | level-2 | inactive | a.toolbar-button | Views plugins | — | — | — | — | 13.99 | none |
| /admin/content | top | inactive | a.toolbar-button | Announcements | — | — | — | — | 13.99 | none |
| /admin/content | top | inactive | a.toolbar-button | Help | — | — | — | — | 13.99 | none |
| /admin/content | top | inactive | button.toolbar-button | Extend admin | — | false | — | — | 21 | none |
| /admin/content | level-2 | inactive | a.toolbar-button | admin | — | — | — | — | 13.99 | none |
| /admin/content | level-2 | inactive | a.toolbar-button | View profile | — | — | — | — | 13.99 | none |
| /admin/content | level-2 | inactive | a.toolbar-button | Edit profile | — | — | — | — | 13.99 | none |
| /admin/content | level-2 | inactive | a.toolbar-button | Log out | — | — | — | — | 13.99 | none |

## Screenshots

- `before-appearance-full.png`
- `before-appearance-nav.png`
- `before-appearance-hover-nav.png`
- `before-appearance-focus-first-nav.png`
- `before-appearance-focus-current-nav.png`
- `before-form-modes-full.png`
- `before-form-modes-nav.png`
- `before-form-modes-hover-nav.png`
- `before-form-modes-focus-current-nav.png`
- `before-content-full.png`
- `before-content-nav.png`
- `before-content-hover-nav.png`
- `before-content-focus-first-nav.png`
- `before-content-focus-current-nav.png`
- `after-appearance-full.png`
- `after-appearance-nav.png`
- `after-appearance-hover-nav.png`
- `after-appearance-focus-first-nav.png`
- `after-appearance-focus-current-nav.png`
- `after-form-modes-full.png`
- `after-form-modes-nav.png`
- `after-form-modes-hover-nav.png`
- `after-form-modes-focus-current-nav.png`
- `after-content-full.png`
- `after-content-nav.png`
- `after-content-hover-nav.png`
- `after-content-focus-first-nav.png`
- `after-content-focus-current-nav.png`

## Context

| | Before | After |
|---|---|---|
| Core commit | `a48087f26ec 2026-11-26` | `a48087f26ec 2026-11-26` |
| Drupal, PHP | 12.0-dev, 8.5.7 | 12.0-dev, 8.5.7 |
| Profile; default / admin theme (config) | standard; default_admin / default_admin | standard; default_admin / default_admin |
| Theme that rendered each page | /user/1/edit → default_admin<br>/admin/appearance → null<br>/admin/structure/display-modes/form → default_admin<br>/admin/content → null | /user/1/edit → default_admin<br>/admin/appearance → null<br>/admin/structure/display-modes/form → default_admin<br>/admin/content → null |
| Languages (default) | none (en) | none (en) |
| Modules only on this side | none | none |
| Enabled modules | 39 | 39 |

CSS build of the After patch stack (core's build:css, separate from accessibility results): **PASS**.


## Limits

- This is the forced-colours mode: the baseline already has the system-colour bar, so the run checks that the bar survives and the text colour change applies; it is not a reproduction of the normal-mode colour-only state.
- WebKit does not reproduce Safari’s macOS Full Keyboard Access preference in Playwright, so a WebKit Tab pass records what the engine does, not what a person with that preference sees.
- RTL is emulated with `dir="rtl"` on `<html>`; an installed RTL language (and its translated menu) was not used.
- Forced colours are emulated by the browser; the actual palette is recorded above. Firefox and WebKit do not support the same emulation.
- Keyboard focus was reached with real Tab presses; a person still has to judge whether the focus ring is easy to follow in context.
- axe-core does not decide SC 1.4.1 or SC 1.4.11; the indicator and contrast rows do that for the measured states only.
