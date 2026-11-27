# Filter and operator coverage for #3545814

**DRAFT.** What was exercised on 2026-11-27, and what was not. "Unchanged" means the Before and After runs produced the same DOM label text, fieldset legend and result rows.

The fixture View is `/repro-3545814` (`recipes/repro_3545814/`). It uses the basic exposed form (normal GET submission, no AJAX). The View configuration preview does use AJAX ("Update preview") and was checked separately.

| Case | In the fixture | Before | After (MR) | Behaviour | Status |
|---|---|---|---|---|---|
| Numeric, single value, operator exposed | yes (`id_open`, `id_open_op`) | value field unnamed | MR: `Value` label **visible**; MR+C: `Value` label visually hidden | `>` and `=` submissions match | tested (MR and C) |
| Numeric, single value, fixed operator | yes (`id_fixed`) | labelled `ID (fixed operator)`, visible | unchanged | ID = 3 returns Gamma | tested |
| Numeric, Between | operator selectable | min/max labelled `Min`/`Max` | unchanged | 2–3 returns Beta, Gamma | tested |
| Numeric, Not between | operator selectable | same min/max labels (DOM) | unchanged | not submitted | partly tested |
| Numeric, Empty | operator selectable | no value control needed; operator named | unchanged | no rows | tested |
| Numeric, Not empty | operator selectable | no value control needed | unchanged | not submitted | partly tested |
| Content type (bundle), operator exposed | yes (`type`, `type_op`) | select unnamed | `Content types`, visually hidden | Article returns all four | tested |
| Taxonomy term, operator exposed | yes (`tags`, `tags_op`) | select unnamed | `Select terms from vocabulary Tags`, visually hidden | News returns Alpha, Beta | tested |
| Two filters of the same type, different labels | two numeric filters | second (fixed) labelled, first not | both labelled, distinct text | both submit independently | tested |
| Fixed and exposed operator together | both numeric filters | — | — | results unchanged | tested |
| Multiple-value select | no (`multiple: false`) | — | — | — | NOT TESTED |
| Date filter with exposed operator | not in the View | — | — | — | NOT TESTED |
| String filter with exposed operator | not in the View | — | — | — | NOT TESTED |
| Boolean / checkbox control | not in the View | — | — | — | NOT TESTED |
| Grouped exposed filter | not in the View | — | — | — | NOT TESTED (uses `groupForm()`, a separate path) |
| AJAX update of the exposed form | no (basic plugin) | — | — | preview AJAX checked | partly tested |
| Views configuration preview | yes | unnamed (numeric, content type) | named | — | tested |
| Filter configuration form (the issue's manual-test case) | yes | numeric value field labelled `Value`, visible, 291×48 px | unchanged by the MR | MR+C identical to Before (label `Value`, visible, 291×48 px) | tested (`verification/config-form/`) |
| Exposed filter block | not configured | — | — | — | NOT TESTED |
| Translations of the filter label | English only | — | — | — | NOT TESTED |

## Why the untested rows were left out

- **Date, string, boolean:** they are not in this View. The production change is in the shared `FilterPluginBase::buildExposedForm()` plus one numeric branch. The shared branch is already exercised by the bundle and taxonomy selects; a string filter takes the same branch as a select with a title, and a date filter builds a container with several children, which follows the numeric multi-child path. Adding them would enlarge the fixture without testing a different code path.
- **Multiple-value select / grouped filter:** a grouped filter uses `groupForm()` and never calls the changed `buildExposedForm()`; a multiple select changes widget attributes but not title handling.
- **Exposed filter block:** the page display has no "Exposed form in block"; the placed-block variant would be a separate configuration.
- **Translations:** the sites are English only, so `exposedTranslate()` was not exercised with a translated label.

These are limitations, not passes. They are also why the recommendation is **Needs review**, not RTBC.
