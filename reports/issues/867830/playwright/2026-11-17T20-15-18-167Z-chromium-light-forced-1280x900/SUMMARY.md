> **Superseded** 2026-11-17: Collector error: pseudo-element 100% inset uses padding-box height, not parent border-box; forced-colour borders exposed the mismatch. Source Canvas halves are correct. Not counted in COVERAGE.md.

# Ribbon alternative: #867830

DRAFT automated evidence, 2026-11-17T20:15:18.816Z.

Variant: 867830-ribbon-pinned. Core: 29b0a0b225 2026-11-17 / 29b0a0b225 2026-11-17.
Browser: chromium 156.0.8078.4; darwin arm64; light; forced colours true; 1280x900; language en.

| Theme | Page | Check | Result | Detail |
|---|---|---|---|---|
| default_admin | draftArticle | before: contextual status and published controls | PASS | [{"kind":"node","good":true},{"kind":"comment","good":true},{"kind":"comment","good":true}] |
| default_admin | draftPage | before: contextual status and published controls | PASS | [{"kind":"node","good":true}] |
| default_admin | liveArticle | before: contextual status and published controls | PASS | [{"kind":"node","good":true},{"kind":"comment","good":true}] |
| default_admin | draftArticle | after: contextual status and published controls | PASS | [{"kind":"node","good":true},{"kind":"comment","good":true},{"kind":"comment","good":true}] |
| default_admin | draftArticle | After: ribbon geometry, colours and nested independence | FAIL | ["node[0]: ribbon triangle is not anchored below inline-end","comment[2]: ribbon triangle is not anchored below inline-end"] |
| default_admin | draftPage | after: contextual status and published controls | PASS | [{"kind":"node","good":true}] |
| default_admin | draftPage | After: ribbon geometry, colours and nested independence | FAIL | ["node[0]: ribbon triangle is not anchored below inline-end"] |
| default_admin | liveArticle | after: contextual status and published controls | PASS | [{"kind":"node","good":true},{"kind":"comment","good":true}] |
| default_admin | liveArticle | After: ribbon geometry, colours and nested independence | PASS | [] |
| default_admin | draftArticle | No new axe rule/target pairs (not just count parity) | PASS | [] |
| default_admin | draftArticle | Baseline lacks local status; After adds it | PASS | "" |
| default_admin | draftPage | No new axe rule/target pairs (not just count parity) | PASS | [] |
| default_admin | draftPage | Baseline lacks local status; After adds it | PASS | "" |
| default_admin | liveArticle | No new axe rule/target pairs (not just count parity) | PASS | [] |
| claro | draftArticle | before: contextual status and published controls | PASS | [{"kind":"node","good":true},{"kind":"comment","good":true},{"kind":"comment","good":true}] |
| claro | draftPage | before: contextual status and published controls | PASS | [{"kind":"node","good":true}] |
| claro | liveArticle | before: contextual status and published controls | PASS | [{"kind":"node","good":true},{"kind":"comment","good":true}] |
| claro | draftArticle | after: contextual status and published controls | PASS | [{"kind":"node","good":true},{"kind":"comment","good":true},{"kind":"comment","good":true}] |
| claro | draftArticle | After: ribbon geometry, colours and nested independence | FAIL | ["node[0]: ribbon triangle is not anchored below inline-end","comment[2]: ribbon triangle is not anchored below inline-end"] |
| claro | draftPage | after: contextual status and published controls | PASS | [{"kind":"node","good":true}] |
| claro | draftPage | After: ribbon geometry, colours and nested independence | FAIL | ["node[0]: ribbon triangle is not anchored below inline-end"] |
| claro | liveArticle | after: contextual status and published controls | PASS | [{"kind":"node","good":true},{"kind":"comment","good":true}] |
| claro | liveArticle | After: ribbon geometry, colours and nested independence | PASS | [] |
| claro | draftArticle | No new axe rule/target pairs (not just count parity) | PASS | [] |
| claro | draftArticle | Baseline lacks local status; After adds it | PASS | "" |
| claro | draftPage | No new axe rule/target pairs (not just count parity) | PASS | [] |
| claro | draftPage | Baseline lacks local status; After adds it | PASS | "" |
| claro | liveArticle | No new axe rule/target pairs (not just count parity) | PASS | [] |
| olivero | draftArticle | before: contextual status and published controls | PASS | [{"kind":"node","good":true},{"kind":"comment","good":true},{"kind":"comment","good":true}] |
| olivero | draftPage | before: contextual status and published controls | PASS | [{"kind":"node","good":true}] |
| olivero | liveArticle | before: contextual status and published controls | PASS | [{"kind":"node","good":true},{"kind":"comment","good":true}] |
| olivero | draftArticle | after: contextual status and published controls | PASS | [{"kind":"node","good":true},{"kind":"comment","good":true},{"kind":"comment","good":true}] |
| olivero | draftArticle | After: ribbon geometry, colours and nested independence | FAIL | ["node[0]: ribbon triangle is not anchored below inline-end","comment[2]: ribbon triangle is not anchored below inline-end"] |
| olivero | draftPage | after: contextual status and published controls | PASS | [{"kind":"node","good":true}] |
| olivero | draftPage | After: ribbon geometry, colours and nested independence | FAIL | ["node[0]: ribbon triangle is not anchored below inline-end"] |
| olivero | liveArticle | after: contextual status and published controls | PASS | [{"kind":"node","good":true},{"kind":"comment","good":true}] |
| olivero | liveArticle | After: ribbon geometry, colours and nested independence | PASS | [] |
| olivero | draftArticle | No new axe rule/target pairs (not just count parity) | PASS | [] |
| olivero | draftArticle | Baseline lacks local status; After adds it | PASS | "" |
| olivero | draftPage | No new axe rule/target pairs (not just count parity) | PASS | [] |
| olivero | draftPage | Baseline lacks local status; After adds it | PASS | "" |
| olivero | liveArticle | No new axe rule/target pairs (not just count parity) | PASS | [] |

## Screenshots

- [default_admin before draftArticle, en](default_admin-before-draftArticle-en.png)
- [default_admin before draftPage, en](default_admin-before-draftPage-en.png)
- [default_admin before liveArticle, en](default_admin-before-liveArticle-en.png)
- [default_admin after draftArticle, en](default_admin-after-draftArticle-en.png)
- [default_admin after draftPage, en](default_admin-after-draftPage-en.png)
- [default_admin after liveArticle, en](default_admin-after-liveArticle-en.png)
- [claro before draftArticle, en](claro-before-draftArticle-en.png)
- [claro before draftPage, en](claro-before-draftPage-en.png)
- [claro before liveArticle, en](claro-before-liveArticle-en.png)
- [claro after draftArticle, en](claro-after-draftArticle-en.png)
- [claro after draftPage, en](claro-after-draftPage-en.png)
- [claro after liveArticle, en](claro-after-liveArticle-en.png)
- [olivero before draftArticle, en](olivero-before-draftArticle-en.png)
- [olivero before draftPage, en](olivero-before-draftPage-en.png)
- [olivero before liveArticle, en](olivero-before-liveArticle-en.png)
- [olivero after draftArticle, en](olivero-after-draftArticle-en.png)
- [olivero after draftPage, en](olivero-after-draftPage-en.png)
- [olivero after liveArticle, en](olivero-after-liveArticle-en.png)

## Verification boundary

The scripted verdict covers the listed predicates only, not RTBC or WCAG conformance. Guidepup reads captured status markup, not the live operating-system accessibility stack. Forced colours are browser emulation, not real Windows Contrast Themes. Arabic routes test natural directionality; the interface remains English unless translations are imported. Optional stress captures replace labels and double root font size; they are synthetic layout diagnostics, not translation or browser-zoom verification. No person-led keyboard, screen-reader, zoom or visual acceptance was performed. The Navigation Top Bar is unchanged and remains a separate review question. Full node ARIA snapshots and rule/target-level axe results are in results.json.

## Context

| | Before | After |
|---|---|---|
| Core commit | `29b0a0b225 2026-11-17` | `29b0a0b225 2026-11-17` |
| Drupal, PHP | 12.0-dev, 8.5.12 | 12.0-dev, 8.5.12 |
| Profile; default / admin theme (config) | standard; olivero / default_admin | standard; olivero / default_admin |
| Theme that rendered each page | /user/1/edit → default_admin<br>/lab/unpublished-article → olivero<br>/lab/unpublished-page → olivero<br>/lab/published-article → olivero | /user/1/edit → default_admin<br>/lab/unpublished-article → olivero<br>/lab/unpublished-page → olivero<br>/lab/published-article → olivero |
| Languages (default) | ar, en, und, zxx (en) | ar, en, und, zxx (en) |
| Modules only on this side | none | none |
| Enabled modules | 41 | 41 |

