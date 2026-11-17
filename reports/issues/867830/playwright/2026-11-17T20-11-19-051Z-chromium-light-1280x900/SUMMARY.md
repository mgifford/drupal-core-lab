# Ribbon alternative: #867830

DRAFT automated evidence, 2026-11-17T20:11:19.718Z.

Variant: 867830-ribbon-pinned. Core: 29b0a0b225 2026-11-17 / 29b0a0b225 2026-11-17.
Browser: chromium 156.0.8078.4; darwin arm64; light; forced colours false; 1280x900; language ar.

| Theme | Page | Check | Result | Detail |
|---|---|---|---|---|
| default_admin | draftArticle | before: contextual status and published controls | PASS | [{"kind":"node","good":true},{"kind":"comment","good":true},{"kind":"comment","good":true}] |
| default_admin | draftPage | before: contextual status and published controls | PASS | [{"kind":"node","good":true}] |
| default_admin | liveArticle | before: contextual status and published controls | PASS | [{"kind":"node","good":true},{"kind":"comment","good":true}] |
| default_admin | draftArticle | after: contextual status and published controls | PASS | [{"kind":"node","good":true},{"kind":"comment","good":true},{"kind":"comment","good":true}] |
| default_admin | draftArticle | After: ribbon geometry, colours and nested independence | PASS | [] |
| default_admin | draftPage | after: contextual status and published controls | PASS | [{"kind":"node","good":true}] |
| default_admin | draftPage | After: ribbon geometry, colours and nested independence | PASS | [] |
| default_admin | liveArticle | after: contextual status and published controls | PASS | [{"kind":"node","good":true},{"kind":"comment","good":true}] |
| default_admin | liveArticle | After: ribbon geometry, colours and nested independence | PASS | [] |
| default_admin | draftArticle | No new axe rule/target pairs (not just count parity) | PASS | [] |
| default_admin | draftArticle | Baseline lacks local status; After adds it | PASS | "" |
| default_admin | draftPage | No new axe rule/target pairs (not just count parity) | PASS | [] |
| default_admin | draftPage | Baseline lacks local status; After adds it | PASS | "" |
| default_admin | liveArticle | No new axe rule/target pairs (not just count parity) | PASS | [] |

## Screenshots

- [default_admin before draftArticle, ar](default_admin-before-draftArticle-ar.png)
- [default_admin before draftPage, ar](default_admin-before-draftPage-ar.png)
- [default_admin before liveArticle, ar](default_admin-before-liveArticle-ar.png)
- [default_admin after draftArticle, ar](default_admin-after-draftArticle-ar.png)
- [default_admin after draftPage, ar](default_admin-after-draftPage-ar.png)
- [default_admin after liveArticle, ar](default_admin-after-liveArticle-ar.png)

## Verification boundary

The scripted verdict covers the listed predicates only, not RTBC or WCAG conformance. Guidepup reads captured status markup, not the live operating-system accessibility stack. Forced colours are browser emulation, not real Windows Contrast Themes. Arabic routes test natural directionality; the interface remains English unless translations are imported. Optional stress captures replace labels and double root font size; they are synthetic layout diagnostics, not translation or browser-zoom verification. No person-led keyboard, screen-reader, zoom or visual acceptance was performed. The Navigation Top Bar is unchanged and remains a separate review question. Full node ARIA snapshots and rule/target-level axe results are in results.json.

## Context

| | Before | After |
|---|---|---|
| Core commit | `29b0a0b225 2026-11-17` | `29b0a0b225 2026-11-17` |
| Drupal, PHP | 12.0-dev, 8.5.12 | 12.0-dev, 8.5.12 |
| Profile; default / admin theme (config) | standard; default_admin / default_admin | standard; default_admin / default_admin |
| Theme that rendered each page | /user/1/edit → default_admin<br>/lab/unpublished-article → default_admin<br>/ar/node/2 → default_admin<br>/lab/unpublished-page → default_admin<br>/ar/node/3 → default_admin<br>/lab/published-article → default_admin<br>/ar/node/1 → default_admin | /user/1/edit → default_admin<br>/lab/unpublished-article → default_admin<br>/ar/node/2 → default_admin<br>/lab/unpublished-page → default_admin<br>/ar/node/3 → default_admin<br>/lab/published-article → default_admin<br>/ar/node/1 → default_admin |
| Languages (default) | ar, en, und, zxx (en) | ar, en, und, zxx (en) |
| Modules only on this side | none | none |
| Enabled modules | 41 | 41 |

