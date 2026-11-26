**Draft only: for a person to review, rewrite in their own words, and post. Nothing was posted.**

Re-checked MR !16432 (170be9e3) on core ced1e263. The 4 November rebase holds: the pipeline is green,
PHPStan level 3 included, and the shipped tests pass (17 tests, 209 assertions).

Two decisions are needed before further review.

The issue summary and the merge request describe different designs. The summary asks for a data-color-scheme
attribute carrying the stored value, a color_scheme Twig variable, and a theme capability that gates the
attribute and a cache context. The merge request renders data-color-scheme="auto" everywhere, carries the
preference in a DrupalColorScheme cookie, and applies it with a script in the head. I found no
user.color_scheme cache context and no server-rendered preference. The cookie path tested clean for cache
isolation and accessibility, but it is not the design in the summary.

Also unresolved: 17 review threads from August and September, including cookie consent and the script on
every page. user_update_11401 is numbered for 11.4 while main is 12.0-dev, and a docblock names a test that
does not exist.

Generated with the help of an LLM.
