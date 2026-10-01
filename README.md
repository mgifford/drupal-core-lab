# drupal-core-lab

A workspace for **evaluating Drupal core changes**, kept separate from Drupal
core itself. It holds the tooling, the accessibility skills and the accumulated
evidence. Core checkouts are disposable and live in `envs/` (gitignored).

    AGENTS.md     how to work here: baseline vs patched environments
    docs/         process, strategy and learnings
    reports/      kept over time: per-issue evidence, scans, drafts
      issues/<nid>/   evidence, patches, validation steps for one issue
      _templates/     EVIDENCE.md, ISSUE-COMMENT-DRAFT.md
    tools/ tests/ scripts/   scanners, Playwright tests, helpers
    patches/      patch files collected for evaluation
    recipes/      Drupal recipes used to set up test sites
    .agents/ .claude/   AI skills and agent definitions
    envs/         disposable core worktrees, one DDEV project each

Modelled on [justafish/ddev-drupal-core-dev](https://github.com/justafish/ddev-drupal-core-dev) (DDEV add-on for core development).
Start with `AGENTS.md`. Migration notes and open follow-ups: `MIGRATION.md`.
Current work: `reports/issues/3619127/`.
