<!-- DRAFT for a human to review and post. Do not post automatically.
     Core's AGENTS.md asks the operator to rewrite LLM-drafted drupal.org prose in their own words before posting,
     and to keep the disclosure line below. Written to its rules: at most 180 words, no headers, facts only.
     Every sentence is backed by EVIDENCE.md (2026-10-14), including its "Manual check" and tests-patch sections. Attach before-1-error.png and after-1-error.png from
     playwright/2026-10-14T09-27-29-357Z-chromium-light-1280x900/ if you want the screenshots on the issue. -->

Tested on main (3b94128e929), where the node form uses Default Admin. I added a file field with a 1 KB limit and uploaded a 2 KB file. I also checked it by hand.

Without the MR, "Hide" shows as plain text and the dismiss button is missing. The template renders a `<button>`, so it should be there. The messages go into `#prefix`, and `Xss::filterAdmin()` strips `button` from it. So the stripping is a side effect, not intended. Olivero's SVG was stripped the same way.

With the MR, the Hide button is back. Tab reaches it and Enter hides the message. The error stays inside the widget. Later uploads replace or clear the error. The new kernel test passes. axe reports no violations on either side.

With the MR, the message element has `role="alert"`, and `Drupal.announce()` is also called with the error text (assertive). I did not test this with a screen reader.

The Nightwatch test in the 2026-08-24 tests patch fails with and without the MR. Its over-limit upload goes through `FormAjaxSubscriber`, so it does not test this change.

Generated with the help of an LLM.
