# Drupal Core Lab: Technical Reference

Technical architecture, repository structure, commands, test environments, evidence management, and development conventions for [Drupal Core Lab](https://github.com/mgifford/drupal-core-lab).

This document describes the current implementation and provides an entry point to the more detailed technical documentation.

For a project introduction, see the [README](../README.md). For a guided installation, see the [first-run guide](FIRST-RUN.md).

## 1. Purpose and scope

Drupal Core Lab is an issue-focused testing environment.

Its primary responsibilities are:

- Reproducing problems reported against Drupal Core.
- Establishing controlled Before and After environments.
- Evaluating proposed patches and merge requests.
- Running repeatable browser, accessibility, and code-quality tests.
- Comparing behaviour and collecting reviewable evidence.
- Preserving experiments so they can be repeated against newer Drupal revisions.
- Supporting contributors preparing evidence for upstream Drupal issues.

Drupal Core Lab is not a continuous Drupal quality monitoring service.

Broader longitudinal monitoring of Drupal Core, Drupal CMS, and related components belongs to the [Drupal Quality Observatory](https://github.com/mgifford/drupal-core).

Drupal Core Lab does not contain a permanent Drupal Core checkout. Drupal source is acquired into disposable environments.

## 2. System architecture

The Lab has five main parts:

1. **Issue definitions:** Versioned configurations describing Drupal issues, required environments, patches, reproduction steps, and expected behaviour.
2. **Environment management:** Git worktrees and DDEV installations providing isolated Before and After Drupal sites.
3. **Comparison viewer:** A browser interface for examining both implementations and performing interactive investigations.
4. **Testing tools:** Playwright, axe-core, accessibility-tree comparisons, Guidepup virtual screen-reader output, and optional Lighthouse investigations.
5. **Evidence and publication:** Per-issue Markdown, JSON, screenshots, patches, test artifacts, and generated static documentation.

The general workflow is:

```text
Drupal.org issue
       |
       v
Issue intake and source review
       |
       v
Variant configuration and recipe
       |
       v
Acquire pinned Drupal source
       |
       +----------------------+
       |                      |
       v                      v
Before environment     After environment
Original source        Source + proposed changes
       |                      |
       +-----------+----------+
                   |
                   v
        Reproduce and compare
                   |
                   v
        Automated and manual tests
                   |
                   v
       Evidence and coverage records
                   |
                   v
       Human review and upstream draft
```

The Before environment must remain a trustworthy reference. Test-support patches may be applied to both environments when explicitly declared, but the proposed change under evaluation belongs in After.

## 3. Repository structure

The repository's major directories and configuration files are:

| Path | Responsibility |
|---|---|
| `AGENTS.md` | Repository-wide instructions for AI coding agents |
| `AI-LEARNING.md` | Historical development lessons and known problems |
| `ACCESSIBILITY.md` | Accessibility requirements |
| `lab.config.yml` | Shared settings for repository tooling |
| `.agents/` | Agent instructions, skills, and evaluation assets |
| `.claude/` | Claude-specific project configuration and skills |
| `.github/` | GitHub Actions, CI and publication workflows |
| `docs/` | Technical documentation and contributor guides |
| `recipes/` | Drupal recipes and issue-specific installation configuration |
| `reports/issues/` | Reproduction instructions, patches, findings, and evidence organized by issue |
| `reports/findings/` | Findings outside the immediate scope of an issue |
| `reports/_templates/` | Templates for evidence and upstream drafts |
| `tools/compare/` | Environment setup, comparison viewer, variants, and diff tools |
| `tools/playwright/` | Scripted interaction tests, screen-reader simulations, and accessibility evidence |
| `scripts/` | Repository orchestration, lifecycle, documentation, validation, and maintenance utilities |
| `envs/` | Disposable Drupal Core Git worktrees and local environments |
| `cloud/` | Generated static GitHub Pages site |
| `bundles/` | Portable reproduction bundles |
| `patches/` | Historical or shared patch material |
| `tests/` | Additional testing and regression fixtures |
| `prompts/` | Templates for issue preparation and agent-assisted workflows |

### Generated and historical content

`cloud/` is generated. Do not edit its published files directly.

`envs/` contains disposable development environments and is not the authoritative source for an issue's evidence.

Some files under `patches/`, `tests/`, and `docs/legacy/` were inherited from the former Drupal Core repository. Their presence does not establish that they belong to the current execution workflow.

See [MIGRATION.md](../MIGRATION.md) for the original migration and [Known Pitfalls](PITFALLS.md) for documented problems.

## 4. Issue and variant configuration

The unit of work is a Drupal issue.

An issue normally has:

- A Drupal.org issue number and URL.
- One or more proposed patches or merge requests.
- A reproducible configuration or Drupal recipe.
- A Before environment.
- An After environment.
- Expected behaviour and test assertions.
- Evidence and coverage records.

### Variants

Comparison configurations are called *variants* and use stable slugs.

For example:

- `3619127-pinned`
- `3619127-latest`

A pinned variant identifies an exact Drupal Core revision and supports reproducing the original experiment.

A latest variant targets the current upstream development branch when acquired. It is useful for re-evaluating a change against newer Drupal code.

A latest variant is not a permanent reference to one immutable commit. Every test run must record the actual revision used.

Variants are defined in `tools/compare/variants.json` or in an issue's own `reports/issues/<nid>/variants.json`. The comparison tooling combines these sources.

A variant may describe:

- Drupal Core revision or upstream reference.
- Before and After environment definitions.
- Patches and their application order.
- Drupal recipes and configuration.
- Installation requirements.
- Reproduction steps.
- Expected and actual results.
- Automated checks.
- Relevant pages and observation points.

The authoritative field reference is in [tools/compare/README.md](../tools/compare/README.md).

### Patch identity

The experiment must record the exact source revision of every patch.

For stacked patches, application order matters.

A new patch revision must not silently replace an earlier tested revision. Preserve the previous artifact and record the relationship between them.

Use `scripts/patch-change.mjs` for recording changes to tracked patch artifacts.

## 5. Environment architecture

Drupal Core Lab uses Git worktrees and DDEV to create isolated Drupal installations.

The environment structure generally includes:

```text
envs/
  core.git/
  baseline-.../
  issue-.../
```

`envs/core.git/` maintains shared upstream Git objects.

Baseline worktrees contain the selected Drupal Core revision.

Issue worktrees contain the corresponding revision with the proposed changes applied.

Each installation has its own DDEV environment.

### Environment requirements

Local use generally requires:

- Docker.
- DDEV 1.24 or newer.
- Git.
- Node.js 20 or newer.
- Sufficient memory and disk space for multiple Drupal installations.

Some optional tools, including Lighthouse integration, require a newer Node.js version.

Use `node scripts/doctor.mjs` to assess the current environment rather than relying solely on documented minimum versions.

### Drupal dependencies

Environment setup uses the [DDEV Drupal Core development add-on](https://github.com/justafish/ddev-drupal-core-dev).

Do not add Drush or unrelated Composer dependencies to the disposable Drupal Core checkouts merely to support the Lab.

The Lab's dependency policy is separate from the Drupal Quality Observatory, which may use different tooling.

When using the DDEV add-on, prefer its supported commands and the utilities documented in [Environment Management](ENVIRONMENTS.md).

### Environment isolation

- Keep Before and After installations separate.
- Match Drupal revisions, installation configuration, recipes, and test data unless a difference is explicitly part of the experiment.
- Record differences in enabled modules, themes, languages, and other relevant settings.
- Take database snapshots before destructive operations.
- Do not reuse modified baseline environments as pristine references.
- Avoid running unnecessary DDEV projects simultaneously.
- Never treat installation failures as successful tests.

### Basic commands

Run the environment diagnostic:

```bash
node scripts/doctor.mjs
```

Build a registered comparison:

```bash
node tools/compare/setup.mjs 3619127-pinned
```

Start both environments and the viewer:

```bash
node scripts/lab-env.mjs start 3619127-pinned
```

Inspect environment state:

```bash
node scripts/lab-env.mjs status
```

Stop the comparison:

```bash
node scripts/lab-env.mjs stop 3619127-pinned
```

The setup command is designed to resume when a recoverable operation fails. Check its diagnostics before rebuilding or deleting an environment.

See [Environment Management](ENVIRONMENTS.md) for reset, deletion, disk management, and recovery.

## 6. Comparison viewer

The browser-based comparison viewer is implemented primarily under `tools/compare/`.

Its source interface is `tools/compare/index.html`, with server behaviour in `tools/compare/serve.mjs`.

### Current capabilities

The viewer supports:

- Before and After Drupal frames.
- Side-by-side comparison.
- Onion-skin and difference viewing modes.
- Desktop, tablet, and mobile widths.
- Light, dark, and operating-system colour preferences.
- Forced-colours testing through an appropriate browser environment.
- Right-to-left presentation simulation.
- Testing with site JavaScript disabled.
- Synchronized navigation and scrolling.
- Optional input mirroring.
- Reproduction steps and comparison checks.
- Manual confirmation and coverage controls.
- Optional axe-core and Lighthouse panels.

**A draggable slider dividing the two versions is not currently implemented.** Do not describe it as an existing feature.

Some presentation settings are simulations. Results involving operating-system preferences or forced colours should be verified in the actual target environment where practical.

### Viewer addresses

Depending on configuration, the viewer may be accessible at:

- `http://localhost:8100/`
- `https://drupal-compare.ddev.site/`

The Before and After sites use separate hostnames and proxy endpoints to isolate sessions.

The viewer relies on trusted local or owner-controlled environments. It is not designed to expose development installations publicly.

### Viewer development

The same interface source supports local operation and a static documentation mode.

Changes to server-dependent controls must account for the static site.

See [Viewer Development](VIEWER-DEV.md) for security requirements, rendering conventions, controls, and testing expectations.

## 7. Automated and manual testing

Testing methods provide complementary evidence.

| Method | Primary purpose | Important limitation |
|---|---|---|
| Playwright | Repeatable browser interaction and assertions | Only exercises scripted journeys and configured states |
| Playwright MCP | Interactive exploration and assistance preparing tests | Exploratory actions are not automatically regression tests |
| axe-core | Automated accessibility rule checks | Does not cover every accessibility requirement |
| Guidepup virtual screen reader | Simulated speech and semantic observations | Not a substitute for a human screen-reader evaluation |
| Accessibility-tree comparison | Differences in exposed semantics, roles, names, and state | Does not establish the complete assistive technology experience |
| Lighthouse | Optional page-load investigation | Limited coverage of interaction states |
| Manual testing | Contextual evaluation of usability and accessibility | Requires documented methods, environments, and observations |

### Playwright

The repository's active browser-testing tooling is under `tools/playwright/`.

For a worked example:

```bash
node tools/playwright/walkthrough.mjs 3619127-pinned
```

For a broader comparison of accessibility-tree evidence:

```bash
node tools/playwright/tree-diff.mjs 3619127-pinned
```

The walkthrough for issue #3619127 is specific to that issue. New issues should have their own appropriate evaluator where needed.

See [Playwright Testing](../tools/playwright/README.md).

### Manual testing

Record what was actually tested:

- Keyboard-only interactions.
- Focus order and visible focus.
- Assistive technology and browser combinations.
- Relevant viewport and text-scaling conditions.
- Light, dark, and forced-colours configurations.
- Touch or pointer interaction where relevant.

Do not report a manual test unless it was performed.

A virtual screen-reader transcript must be identified as simulated output.

See [Testing Tools](TESTING-TOOLS.md).

### Test outcomes

Test reports must distinguish:

- Expected behaviour observed.
- Expected behaviour not observed.
- Test not run.
- Test blocked by an environment or infrastructure problem.
- Inconclusive evidence.
- Conditions that were outside the evaluated scope.

An automated pass is not a declaration of WCAG conformance.

## 8. Evidence and report structure

Evidence is organized by Drupal issue number.

For example:

```text
reports/
  issues/
    3619127/
      SUMMARY.md
      REPRODUCE.md
      EVIDENCE.md
      BRANCHES.md
      branches/
      STATUS.md
      COVERAGE.md
      playwright/
      screenreader/
      compare/
```

An issue may have additional files and directories depending on its investigation and age.

### Main evidence files

| File | Purpose |
|---|---|
| `SUMMARY.md` | Entry point to the issue and its evidence |
| `REPRODUCE.md` | Reproduction instructions and environment requirements |
| `BRANCHES.md` | Patch and merge-request provenance |
| `branches/` | Stored patch files |
| `EVIDENCE.md` | Validation method, results, and evidence gaps |
| `COVERAGE.md` | Tested and untested browser or configuration combinations |
| `STATUS.md` | Issue status and relevant review context |
| `status.json` | Machine-readable upstream status snapshot |
| `BUG.feature` | Optional Gherkin description of the observed behaviour |
| `ISSUE-COMMENT-DRAFT.md` | Draft material for human review before upstream submission |
| `intake/` | Source-based issue briefs, indexes, and provenance |

Additional generated outputs may contain screenshots, browser traces, accessibility-tree differences, and machine-readable results.

### Evidence integrity

Every significant result should identify:

1. Drupal Core revision.
2. Patch or merge-request revision.
3. Installed configuration.
4. Browser and relevant tool versions.
5. Steps performed.
6. Expected and observed outcomes.
7. Relevant artifacts.
8. Testing limitations.

A result from an earlier patch revision must not be presented as evidence for a newer revision.

A missing result must not be treated as a passing result.

Evidence remains a draft until appropriately reviewed.

### Generated run summaries

After producing new Playwright runs, use:

```bash
node scripts/run-readmes.mjs 3619127
```

This generates navigable summaries for supported run artifacts.

Use `--check` to validate whether generated summaries are current.

For the complete evidence layout, see [Results Layout](RESULTS-LAYOUT.md).

## 9. Issue intake and lifecycle

The Lab tracks the relationship between a tested change and its upstream Drupal issue.

A typical issue moves through these activities:

1. Identify the issue and relevant source discussions.
2. Review proposed changes and related issues.
3. Create or update the Lab's issue configuration.
4. Reproduce the problem.
5. Test the selected patch.
6. Record evidence and unresolved questions.
7. Re-evaluate when upstream changes.
8. Archive completed investigations without deleting their historical evidence.

### Issue intake

To retrieve source material for an issue:

```bash
node scripts/issue-intake.mjs fetch 3619127
```

The intake process can retain references to issue comments, related issues, merge requests, and review threads.

A current source snapshot is necessary when evaluating a proposal that may have changed upstream.

### Starting an issue

Use `scripts/new-issue.mjs` to scaffold an investigation.

See [Starting a New Issue](NEW-ISSUE.md) for exact arguments, including issue fork branches and locally authored proposals.

### Issue packs

An issue pack is a structured file describing the proposed experiment.

AI assistants may help prepare packs, but generated configurations must be validated and reviewed before being treated as reproducible experiments.

See [Issue Packs](ISSUE-PACK.md).

### Tracking upstream changes

The repository contains tooling to compare recorded patch revisions with current merge-request heads and upstream issue status.

The [weekly issue-status workflow](../.github/workflows/issue-status.yml) can prepare updates through pull requests.

An upstream status change does not automatically mean that a Lab experiment has been re-run or verified.

See [Issue Lifecycle](ISSUE-LIFECYCLE.md).

## 10. Command reference

Run project commands from the repository root unless their documentation specifies otherwise.

The following are the main entry points, not an exhaustive inventory.

| Task | Command |
|---|---|
| Check environment | `node scripts/doctor.mjs` |
| Inspect active environments | `node scripts/lab-env.mjs status` |
| Build an existing comparison | `node tools/compare/setup.mjs 3619127-pinned` |
| Start a comparison | `node scripts/lab-env.mjs start 3619127-pinned` |
| Stop a comparison | `node scripts/lab-env.mjs stop 3619127-pinned` |
| Run a worked walkthrough | `node tools/playwright/walkthrough.mjs 3619127-pinned` |
| Compare accessibility trees | `node tools/playwright/tree-diff.mjs 3619127-pinned` |
| Fetch issue sources | `node scripts/issue-intake.mjs fetch 3619127` |
| Update issue index | `node scripts/index-issues.mjs` |
| Generate run documentation | `node scripts/run-readmes.mjs 3619127` |
| Generate static GitHub Pages site | `node scripts/build-cloud.mjs` |
| Run repository self-tests | `node scripts/selftest.mjs` |
| Validate before pushing | `node scripts/ready-to-push.mjs` |

More specialized commands exist for patch handling, linting, test proposals, manual feedback, issue packs, status checks, archiving, and cloud workspaces.

Consult [Commands](COMMANDS.md) for their arguments and safety requirements.

### Legacy npm commands

The root `package.json` still contains legacy scripts referencing `core/tests/playwright/`.

That path belongs to the old Drupal Core repository layout and is not the active Lab testing location.

Do not assume commands such as `npm run a11y:evaluate-patch` or `npm run test:a11y-headed` work in the current Lab.

Use the maintained commands under `scripts/` and `tools/`, and verify the script before recommending it.

The obsolete root npm scripts should eventually be removed or replaced in a dedicated maintenance change.

## 11. GitHub Pages publication

The public site is generated from the Lab's local viewer and issue definitions.

The primary build command is:

```bash
node scripts/build-cloud.mjs
```

It generates the `cloud/` directory, including static HTML, selected variant information, and supporting assets.

The publication workflow is `.github/workflows/pages.yml`.

### Static versus live behaviour

The published site can show issue documentation, configured reproduction steps, and supporting references.

It cannot provide active Drupal environments, authenticated interactive comparisons, or server-side scanning.

Controls requiring the live server must not be represented as operational on GitHub Pages.

### Publication rules

- Modify source files, not generated `cloud/` output.
- Regenerate `cloud/` after relevant changes.
- Run the static-site validation checks.
- Preserve existing issue links and published references where practical.
- Do not expose local environment details, credentials, or private evidence.

For implementation details, see [Viewer Development](VIEWER-DEV.md).

## 12. Cloud development

An optional integration supports DDEV Coder workspaces.

It is intended for contributors who need browser-based development without local Docker.

Cloud setup uses the same core Lab architecture, but depends on workspace configuration, network access, and supported DDEV services.

The cloud workflow is not fully verified across all users and configurations.

Consult:

- [Cloud Quickstart](CLOUD-QUICKSTART.md).
- [Cloud Implementation and Verification Status](../tools/compare/cloud/README.md).

Cloud workspace creation, configuration changes, and public sharing require explicit user approval.

Do not assume a successful local comparison establishes that the cloud workflow works.

## 13. Security and privacy

The Lab uses deliberately configured development environments and must not expose them as public services.

Important requirements include:

- Keep Drupal test installations private.
- Do not reuse personal or production credentials.
- Do not commit access tokens, passwords, or authentication artifacts.
- Use one-time login links where supported.
- Protect viewer proxies against unauthorized requests.
- Maintain hostname and origin restrictions.
- Do not publish development environments without explicit authorization.
- Review external patches and code before applying them.
- Do not report suspected non-public security vulnerabilities through public issues or reports.

A suspected Drupal security vulnerability should follow the [Drupal security reporting process](https://www.drupal.org/security).

See [AGENTS.md](../AGENTS.md) and [Viewer Development](VIEWER-DEV.md) for detailed safeguards.

## 14. Repository maintenance and quality gates

The repository includes automated checks for documentation consistency, variant configuration, scripts, and other project invariants.

Run:

```bash
node scripts/selftest.mjs
```

Before an approved push, run:

```bash
node scripts/ready-to-push.mjs
```

The pre-push check verifies that the branch is suitable for the current base and runs repository tests.

It does not authorize publication.

### Patch protection

Patch files are evidence. Modifying a patch changes what is being tested.

Do not silently rewrite patches, even through automated maintenance or AI-assisted corrections.

Use `scripts/patch-change.mjs` to record changes and preserve previous versions.

### Issue close-out

Before moving on to another investigation, reconcile its generated reports, coverage records, and uncommitted files.

The issue lifecycle tooling provides a close-out process.

See [Issue Lifecycle](ISSUE-LIFECYCLE.md).

### Compatibility

Development commonly involves macOS with zsh and Linux cloud workspaces.

Avoid assuming GNU command-line utilities or shell syntax behave identically across environments.

Prefer the repository's Node.js scripts for repeatable operations.

## 15. AI-assisted development

The repository supports AI-assisted issue investigation, test preparation, documentation, and code development.

AI agents must follow [AGENTS.md](../AGENTS.md).

Important boundaries:

- Do not invent reproduction steps, source references, or test results.
- Do not modify the baseline to make a proposed fix appear successful.
- Do not treat AI-generated issue packs as verified.
- Preserve uncertainty and unverified claims.
- Do not post to Drupal.org without explicit approval.
- Do not silently change patch artifacts.
- Use the actual Lab commands, not generic commands inherited from the Drupal Core repository.

The [AI Learning History](../AI-LEARNING.md) records previous development lessons and known mistakes.

## 16. Technical documentation index

| Question | Documentation |
|---|---|
| How do I install and use the Lab? | [First Run](FIRST-RUN.md) |
| How do I use the comparison viewer? | [User Guide](USER-GUIDE.md) |
| What commands and options are supported? | [Commands](COMMANDS.md) |
| How are Drupal environments constructed? | [Environments](ENVIRONMENTS.md) |
| How do I investigate a new issue? | [New Issue](NEW-ISSUE.md) |
| How do issue packs work? | [Issue Packs](ISSUE-PACK.md) |
| How do I manage an issue's lifecycle? | [Issue Lifecycle](ISSUE-LIFECYCLE.md) |
| How are results and evidence stored? | [Results Layout](RESULTS-LAYOUT.md) |
| Which testing tools are used? | [Testing Tools](TESTING-TOOLS.md) |
| How do I develop the viewer? | [Viewer Development](VIEWER-DEV.md) |
| How do I run scripted browser tests? | [Playwright](../tools/playwright/README.md) |
| How does the static site work? | [Viewer Development](VIEWER-DEV.md) |
| How does cloud development work? | [Cloud Quickstart](CLOUD-QUICKSTART.md) |
| What problems have already been encountered? | [Known Pitfalls](PITFALLS.md) |
| What must AI coding agents follow? | [AGENTS.md](../AGENTS.md) |
| Where did this project originate? | [Migration History](../MIGRATION.md) |

## 17. Maintenance of this reference

This document should describe the architecture as implemented.

When a technical change affects the directory structure, primary commands, environment model, evidence layout, publication process, or project boundaries, update this reference in the same pull request.

Keep detailed implementation instructions in their existing specialized documents.

Avoid duplicating commands, configuration schemas, and troubleshooting procedures unnecessarily.

Where documentation and implementation differ, verify the code and tests, correct the relevant documentation, and describe any remaining uncertainty.

This reference is not a substitute for running the Lab and verifying its behaviour.
