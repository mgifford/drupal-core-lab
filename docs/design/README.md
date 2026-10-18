# Maintaining the design reference

DRAFT, not adopted. Start at [DESIGN.md](../../DESIGN.md).

| File | Purpose |
| --- | --- |
| [contracts.json](contracts.json) | Canonical proposed rule statements, stable IDs, scopes, exceptions and sources |
| [reference.template.html](reference.template.html) | Explanatory prose, evidence summary, layout and print CSS |
| [default-admin-design-system.html](default-admin-design-system.html) | Generated readable reference with the same proposed rules embedded as JSON |
| [CONFLICTS.md](CONFLICTS.md) | Explicit conflicts and historical claims requiring review |
| [EVIDENCE.md](EVIDENCE.md) | Provenance and limitations of the captures |

From the repository root:

```sh
node scripts/build-design-reference.mjs
node scripts/build-design-reference.mjs --check
```

The build uses Node built-ins only. It requires no DDEV, browser, network or npm
installation. It checks IDs, source references, template coverage, internal HTML
links, and synchronization of generated output. It intentionally permits only
unapproved proposals in this draft format. Accepting contracts requires an explicit
format/policy update with recorded ownership and review, not changing one boolean.

Rule updates belong in contracts.json. Prose and document CSS belong in the
template. Update evidence prose deliberately when evidence changes; it is a
snapshot, not live scan data. Do not hand-edit the generated HTML.

The collector reads PRN-01/02/03 metadata for explicitly labelled draft print review.
It does not implement a general contract evaluator. The build does not run accessibility,
contrast, browser, print or Drupal tests, and does not certify the reference.
Visual, keyboard, print and assistive-technology review remain outstanding.

The HTML has no remote runtime assets, executable scripts, fonts or trackers.
Its JSON block is data only. Source links require a connection only when followed.
The document CSS illustrates readable documentation, not exact Default Admin UI.

## Suggested integration

DESIGN.md is the AI/reviewer entry point. STYLE.md points to the existing STYLES.md
and the new reference instead of creating a competing policy. This bundle adds a
small companion notice to STYLES.md and preserves the rest of its content.
AGENTS.md and ACCESSIBILITY.md are unchanged. The collector update is documented in
[DESIGN-COLLECTOR-FIX.md](../DESIGN-COLLECTOR-FIX.md).

Review contracts and conflicts first. Then inventory pinned theme tokens, review
paper-width measurements and add representative interaction fixtures. A broad crawl
is not a substitute for a reviewed rule or a known negative control.
