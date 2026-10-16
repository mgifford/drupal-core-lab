# Write the bug summary for Drupal core issue #@@NID@@ as a Gherkin feature

This whole message is your task. Rewrite the feature below into a bug summary that a reviewer on drupal.org can read in a minute, and
that the lab can check (`node scripts/bug-feature.mjs check @@NID@@`). Use only what the inputs say. Reply with the feature file only,
in one `gherkin` code block. The rules marked (checked) fail the lab's checker when broken.

1. (checked) Gherkin with English keywords: Feature, Background, Scenario, Scenario Outline, Examples, Given, When, Then, And, But.
2. (checked) Keep `@issue-@@NID@@ @draft` on the line above `Feature:`. Never write `@reviewed`: only a person can review.
3. (checked) One behaviour per scenario: Given steps (the state), then When steps (what the user does), then Then steps (what the user
   observes). Never a Given or When after a Then: split it into two scenarios. Every scenario has a When and a Then.
4. (checked) Under each `Scenario:` line, a `# Before: <result>` and an `# After: <result>` comment. The result starts with fails,
   passes, mixed, not run or not judged, and names the run folder (file:...) or the person and date that showed it. Before is
   core without the change, After is the same core with it. If the inputs show no result for that behaviour, write `not run`.
   Never guess a result.
5. Each scenario has at least one `# source:` comment: `file:<path>` from the inputs, `comment:<n>` for a drupal.org comment
   number, or a drupal.org link. Cite only files that appear in the inputs.
6. Write what a user does and perceives, in plain words: "I press Tab until the Hide button has focus", "a screen reader announces
   the error once", "the error text is visible next to the field". Say which input or setting the behaviour depends on (keyboard
   only, a screen reader and which one, forced colours, dark mode, 200% zoom) and tag the scenario with it: @keyboard,
   @screen-reader, @forced-colors, @dark-mode, @zoom, @reflow.
7. Keep CSS selectors, probes, patch file names and the lab's viewer (frames, Mirror, Go, Run checks) out of the steps. They
   belong in the lab's checks and comments.
8. A Then says what is observable and specific: which text, which element has focus, what is announced, what is visible or gone.
   Not "works", "correctly", "properly" or "as expected".
9. (checked) Site paths only (`/node/add/article`), never host names or ports. Links only to drupal.org, git.drupalcode.org,
   api.drupal.org or w3.org. No passwords: write "Given I am logged in as an administrator".
10. Tag a WCAG success criterion (`@wcag-2.4.4`) only when the issue or the evidence names it, and say in a comment where.
11. Something a commenter reported that neither the lab nor a person reproduced: keep it if it matters, tag the scenario
    @unverified, and write `# Before: not run` and `# After: not run`.
12. Under 10 steps per scenario. A Background holds only the Given steps every scenario shares. Use a Scenario Outline with an
    Examples table only when the same steps run with different data (for example several text formats).
13. Keep the comment block above `Feature:` that says how the file was made, and change it to say you rewrote it, from which inputs,
    and on what date. Keep the lines that list the lab's runs.
