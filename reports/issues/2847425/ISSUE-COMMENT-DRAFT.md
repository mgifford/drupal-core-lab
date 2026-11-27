<!-- Draft for a person to review against EVIDENCE.md and rewrite in their own words before posting.
     The evidence link must be filled in with the published location of this folder. -->

Re-tested MR !7305 on 0387fb948f with a fixture covering conditional visibility, requirement and disabled, single
and multiple files, and details, fieldset and container groups.

The MR fixes the reported defect. Hidden managed files stay hidden on load, the required marker and attribute reach
the upload control, disabled reaches the file input and buttons, and hiding a file inside a group no longer collapses
the group.

Two problems remain. With a file present, the whole #states array is copied to the hidden file IDs input; required is
invalid there and no label can reference it. The wrapper div also receives disabled, so FormTest needs 45 instead of
44.

A refinement that sends required and optional only to the upload control, keeps the other states on the wrapper, and
removes control-only attributes from it passes the extended JavaScript tests and FormTest at 44. The label
association after upload (#3513308) and states after AJAX (#1091852) remain open.

Evidence: https://github.com/mgifford/drupal-core-lab/tree/main/reports/issues/2847425

Generated with the help of an LLM.
