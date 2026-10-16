# #3207233: Improve active workspace indication

DRAFT. Local proposal and replay package. No Drupal runtime, manual keyboard, or actual screen reader results have been obtained in this session.

Issue: https://www.drupal.org/project/drupal/issues/3207233

Start with [REPRODUCE.md](REPRODUCE.md). It contains the commands to build and compare two disposable local DDEV sites.

| File | Purpose |
|---|---|
| [REPRODUCE.md](REPRODUCE.md) | Local setup, browser runs, PHPUnit, manual checks, and stopping |
| [variants.json](variants.json) | Pinned and latest-main comparison pairs |
| [BRANCHES.md](BRANCHES.md) | Patch origin, exact core base, and scope |
| [branches/3207233-active-workspace-main.patch](branches/3207233-active-workspace-main.patch) | Full replacement proposal, applied only to After |
| [EVIDENCE.md](EVIDENCE.md) | Validation completed and remaining gaps |
| [STATUS.md](STATUS.md) | Issue snapshot and related issues |
| [intake/BRIEF.md](intake/BRIEF.md) | Deterministic issue extract and source manifest |
| [Recipe](../../../recipes/repro_3207233/recipe.yml) | Installs workspaces and workspaces_ui |
| [Fixture script](../../../recipes/repro_3207233/create-workspaces.php) | Creates four sample workspaces through Drupal's entity API |
| [Replay](../../../tools/playwright/evaluate-3207233.mjs) | Records real input, DOM, ARIA, simulated speech, screenshots, and axe |

The proposal retains row highlighting and indentation, puts translated active-state text inside the named workspace link, adds emphasis to the active label, and adds a current-workspace table caption. It covers Live without adding an unnecessary tab stop.

This differs from attachment #12: it keeps the overview CSS library and link render array. The caption is an additional local design proposal, not an approved usability decision. Workspace-switch announcements, toolbar naming, and page-title changes are omitted to keep this patch focused. No database updates or dependencies are added to Drupal core.

The core patch is identical to the draft supplied earlier in this conversation. The new work here is the lab integration and testing package. Do not apply attachment #12 before this patch.

Generated with the help of an LLM.
