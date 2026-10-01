# envs/

Disposable Drupal core environments live here, one directory per variant.
Everything in this directory except this file is gitignored.

Naming:

    core.git/                    one shared clone of upstream Drupal core
    baseline-main/               worktree at upstream/main, never edited
    issue-<nid>-<variant>/       worktree with an issue fork branch or patch

Each directory is its own DDEV project. See ../AGENTS.md for how to create,
compare and remove them. Evidence from a run goes in ../reports/issues/<nid>/.
