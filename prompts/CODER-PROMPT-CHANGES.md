# Coder prompt generation change

Prepared against repository commit b3b98161b905ec6eb6daf646b545536c31962706.

This change adds the Coder reading links and pre-implementation checklist to AGENTS.md,
a maintained prompt template and generator, and shared fixed cloud proxy identities.
The bootstrap, smoke check and viewer startup read those identities. Tests check their
agreement with DDEV YAML and nginx routing and the freshness of generated prompts.

The #3619127 handoff is regenerated from its existing pinned variant. Its standalone
site-building commands and pasted recipe are replaced by the Lab bootstrap and recipe
reference. Its reproduction actions and viewer observations come from the existing
variant. The MR plus two local follow-ups remain the declared patch stack.

The #3593502 and #3615469 handoffs are unchanged. #3593502 still needs a registered
variant; #3615469 now has per-issue variants and can be generated separately after
reviewing any unique instructions in its current handoff.
No patches under test, recipes or variant definitions are changed.

Apply the supplied patch from the root of your drupal-core-lab checkout:

```bash
git apply --check /path/to/drupal-core-lab-coder-prompts.patch
git apply /path/to/drupal-core-lab-coder-prompts.patch
node scripts/coder-prompt.mjs 3619127-pinned --check
node --test tests/lab/coder-prompt.test.mjs
```

In Coder's New workspace form, select DDEV Freeform and set **DDEV project names**
(`project_names`) to the output of:

```bash
node tools/compare/cloud/config.mjs --project-names
```

There is no automated Coder parameter change in this patch. Runtime Coder/DDEV testing
has not been performed in this environment.

The four new generator/configuration tests, all 145 Lab tests (sequential run), documentation
link checks and syntax checks pass. The issue-pack suite has 155 passes, one skip and one
failure: the existing #3615469 link-text probe is rejected by its probe validator.
That variant and validator are not changed here. An initial host-probe failure did not
recur on the final Lab run. PHP and live DDEV/Coder checks were unavailable.

## Version 2: patch context and report templates

This complete replacement patch uses one context line so the AGENTS.md insertion does not depend on the long paragraph above it.
The earlier failure means that hunk's expected context did not match your local file; its exact local difference is unknown here.
No force, reset, rejected hunks or deletion of local changes is required. Run git apply --check before applying.

SUMMARY.md now has a shared template used by both issue scaffolding and pack import. REPRODUCE.md no longer claims a run was
verified at scaffold time or prescribes #3619127's evaluator for every issue. Both templates incorporate the accessibility
reporting guide's separation of barrier, impact, evidence, investigation and verification, with optional standards mapping.
Existing reports are not bulk-rewritten; the earlier #3619127 Coder prompt regeneration remains part of this complete patch.

Version 2 validation: all seven focused generator/template tests pass; documentation links and syntax checks pass.
The sequential Lab run reports 147 passes and one intermittent host-probe failure in the existing network test.
The complete patch passes git apply --check against its base and a fixture with the preceding AGENTS.md paragraph changed.
Actual application to a user's unprovided local AGENTS.md cannot be guaranteed.
