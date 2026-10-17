# Drupal design review

Status: DRAFT, not adopted. This is an AI-assisted entry point for visual and
semantic consistency work in Drupal Core Lab, starting with Default Admin.
It is not an approved Drupal design specification or an accessibility verdict.

Read [ACCESSIBILITY.md](ACCESSIBILITY.md) and [AGENTS.md](AGENTS.md) first.
Their existing precedence remains in force. [STYLES.md](STYLES.md) remains the
repository's existing style policy; [STYLE.md](STYLE.md) is only a short pointer.
If instructions conflict, identify the conflict rather than silently overriding
policy. Known conflicts are tracked in the [register](docs/design/CONFLICTS.md).

## Reference and canonical proposed rules

- [Default Admin reference](docs/design/default-admin-design-system.html): readable,
  self-contained HTML, with print CSS and an embedded rule index.
- [Draft contracts](docs/design/contracts.json): canonical source of the 26
  proposed reviewer rules and source references. Every rule is explicitly
  unapproved. The current scanner does not load this file.
- [Maintenance guide](docs/design/README.md): regeneration, validation and scope.
- [Evidence provenance](docs/design/EVIDENCE.md): capture identity and limitations.

Edit the contracts to change a proposed rule. Edit the HTML template to change
explanatory prose or presentation. Regenerate rather than editing the generated
HTML or maintaining a second copy of the rules here:

```sh
node scripts/build-design-reference.mjs
node scripts/build-design-reference.mjs --check
```

## Review procedure for people and AI

1. Identify the route, account, actual theme evidence, configured themes, language,
   direction, viewport, component region, state and preferences. A missing actual
   theme is unknown. Stylesheet names are supporting evidence only.
2. Identify the likely owning layer: form/render API, module, library, template,
   theme, recipe/configuration, editor or browser behaviour.
3. Compare equivalent component variants. Separate semantic intent from visual
   styling. A heavier label does not automatically require strong markup.
4. Link the observation to a stable rule ID. State its status, source, exception
   and evidence. Repeated behaviour does not establish design intent.
5. Distinguish introduced, resolved, persistent and not-comparable findings by
   identity. Equal totals can conceal different issues.
6. Review screen, paper output and relevant preferences independently. The current
   print-viewport overlap heuristic does not prove paper layouts are acceptable.
7. Propose a scoped correction at the owning layer. Do not apply a global override
   or infer a conformance failure from an observed difference alone.

A useful finding records rule ID, evidence reference, component identity, side,
state, media mode, theme confidence, comparison classification, rationale,
likely owner, exceptions and unresolved questions. Do not collect credentials,
input values or private content for this purpose.

## What is established and what is still proposed

Published HTML and accessibility requirements retain their own authority and
scope. Drupal documentation is linked with its version/context. The proposed
contracts make review intent explicit; they are not newly accepted Drupal policy.
Observed Default Admin values are pinned examples, not universal token constants.

This package does not implement scanner rules, a viewer report/button, print CSS
fixes, full-site axe/Lighthouse, or missing-theme instrumentation. Next work is
contract review, source-level token inventory, correction of paper-size evidence,
and representative interaction fixtures before expanding the crawl.
