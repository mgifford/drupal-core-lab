# Patch provenance for #3207233

Date: 2026-10-16. DRAFT local proposal; no issue-fork branch or merge request is represented by this file.

- Patch: `branches/3207233-active-workspace-main.patch`.
- Exact base: Drupal main `ca18edacfe9b9c2afc217151cd40653b90575f9e`, fetched on 2026-10-16.
- Reference attachment: https://www.drupal.org/files/issues/2023-02-03/3207233-12.patch.
- This patch replaces the old proposal. It is not an interdiff and must not be stacked on attachment #12.
- Before is pristine core. After applies this one patch. Fixture setup is identical on both sites.
- Core files changed: `core/modules/workspaces_ui/src/WorkspaceListBuilder.php` and `core/modules/workspaces/tests/src/Functional/WorkspaceTest.php`.
- Lab reference: `mgifford/drupal-core-lab` main `72a21944f0032a31b827e19998e36a233864078e`.

Use the pinned pair first for repeatability. The latest variant resolves main when its pair is first built; restarting an existing pair does not update its checkout. Preserve evidence before retiring an old pair and rebuilding it on newer core. Never reset a checkout to a new commit while retaining an unrelated database.

Patch SHA-256: `06e00e2a81705dd553cb5d4f1699f287e0f94c0935625d4da9eca60a6baf124b`.
