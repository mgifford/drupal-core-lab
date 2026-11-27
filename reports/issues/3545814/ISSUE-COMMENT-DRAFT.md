<!-- DRAFT for a human to review and post. Do not post automatically.
     Every sentence matches a recorded result in EVIDENCE.md. Check with: node scripts/check-draft.mjs 3545814 -->

Re-tested !13201 against a minimal View. It has a numeric ID filter, a content type filter and a Tags filter, each with its operator exposed. A second ID filter has a fixed operator.

Without the change, the three value controls have no accessible name. The fieldset legend names only the group. Axe reports one label and two select-name violations.

With the fix they are named Value, Content types and Select terms from vocabulary Tags. Axe reports none. Filter results and the fixed-operator filter are unchanged.

The latest revision (12d23a) hides the numeric Value label, so the 18px visual change is gone. It also adds regression tests in FilterNumericWebTest and ExposedFormTest. CI passed with warnings; only the PHP 8.6 unit jobs failed, as before the change.

Not tested: a real screen reader, Firefox, and date or string filters.

Generated with the help of an LLM.
