# #2847425: Conditional visibility and requirements of managed file fields

**DRAFT. Documentation reviewed 2026-11-25. Independent runtime evaluation pending.**

The September 16 update to MR !7305 reportedly addresses enclosing-group visibility and incorrect label and description ID associations.

The historical Lab test kit predates those changes. Its expectation that Scenario 3 fails must not be treated as evidence against the updated MR.

Remaining reported concerns include the disappearance of the required indicator after AJAX upload and inappropriate attributes on wrapper elements.

The current MR requires independent evaluation of conditional visibility, required and disabled states, AJAX upload and removal, accessible names, description associations and keyboard focus.

The existing test kit should be reused and its diagnostics independently validated.

No replacement implementation is recommended until an unresolved defect has been reproduced.

- [Drupal issue](https://www.drupal.org/project/drupal/issues/2847425)
- [MR !7305](https://git.drupalcode.org/project/drupal/-/merge_requests/7305)
- [Evidence](EVIDENCE.md)
- [Reproduction instructions](REPRODUCE.md)
- [Patch provenance](BRANCHES.md)
- [Test kit](kit/README.md)

Generated with the help of an LLM.
