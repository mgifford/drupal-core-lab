<!-- DRAFT for a human to review and post. Do not post automatically.
     Every sentence matches a recorded result in EVIDENCE.md. Check with: node scripts/check-draft.mjs 3545814 -->

Re-tested !13201 on its base (87de7098) against a minimal View. It has a numeric ID filter, a content type filter and a Tags filter, each with its operator exposed. A second ID filter has a fixed operator.

Without the MR, the three value controls have no accessible name. The fieldset legend names only the group. Axe reports one label and two select-name violations.

With the MR they are named Value, Content types and Select terms from vocabulary Tags, and axe reports none. Filter results and the fixed-operator filter are unchanged. The MR alone also adds a visible Value label and 18px of height. A one-line follow-up hides that label, keeps the name and leaves the filter configuration form unchanged.

For #6 and #20, assertions were added to the existing FilterNumericWebTest and a new method in the existing FilterTest. The new method imports one small test view. They fail without the MR and pass with it.

The latest pipeline passed with warnings; one PHPUnit unit component job failed.

Not tested: a real screen reader, Firefox, and date or string filters.

Generated with the help of an LLM.
