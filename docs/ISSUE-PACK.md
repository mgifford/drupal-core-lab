# Issue packs: bring your own issue

An **issue pack** is one YAML file that describes how to reproduce a Drupal core issue in the lab: a summary with its sources, a recipe for the
starting state, and the steps, checks and questions for the viewer. A chat assistant can write one from an issue page; the lab validates it and imports it.
**A pack is always a draft** until a person has run it and confirmed it.

```
chat assistant ──writes──▶ issue-pack-<nid>.yml ──upload / paste──▶ workspace ──validate──▶ import ──▶ build ──▶ run and confirm
```

## Quick start

1. Print the prompt and paste it into a chat assistant that can make a downloadable text file (it does not need to run code):

       node scripts/issue-pack.mjs prompt

   Fill in the issue URL. If the assistant cannot open drupal.org, paste the issue page text and the merge request diff. It needs the **issue fork branch name**
   (the merge request's source branch, shown on the issue page).
2. Get the file into your workspace. In the workspace's web VS Code, drag it into the file explorer, or paste it into a new file.
3. Check it (no network, nothing is written, nothing from the pack is run):

       node scripts/issue-pack.mjs validate issue-pack-3415961.yml

4. Import it (fetches the issue fork branch, writes the patch, recipe and report folder):

       node scripts/issue-pack.mjs import issue-pack-3415961.yml --dry-run     # show the plan
       node scripts/issue-pack.mjs import issue-pack-3415961.yml [--depth 2000]  # a branch that merged main needs a larger depth

5. Build and run as for any issue (`docs/NEW-ISSUE.md`, section 3): `node tools/compare/setup.mjs <nid>-latest`, then the viewer.
   In a Coder workspace use `scripts/cloud-bootstrap.mjs <nid>-latest` (`tools/compare/cloud/README.md`).
6. **Read the pack's `review.unverified` list and `SUMMARY.md`, run every step and check yourself, and fix what is wrong.** The first run of a pack usually
   shows a selector or config key the assistant guessed wrong. Until you have done this the variant says `draft` in the viewer.

Needs `js-yaml`, installed by `node tools/compare/setup.mjs <slug>` or `npm install --prefix tools/compare/.deps js-yaml@4`.
A worked example is `docs/examples/issue-pack-3415961.yml`.

## What import writes

| Where | What |
|---|---|
| `reports/issues/<nid>/variants.json` | the `<nid>-pinned` and `<nid>-latest` variants (core commit the patch was based on, patch, environments, your steps and checks). `tools/compare/variants.json` is never edited. |
| `recipes/repro_<nid>/` and `reports/issues/<nid>/recipe/` | the recipe (the second is a copy that stays with the report) |
| `reports/issues/<nid>/PACK.yml`, `SUMMARY.md` | the pack as received and a readable summary with sources and what was not verified |
| `reports/issues/<nid>/branches/…patch`, `REPRODUCE.md`, `EVIDENCE.md`, … | what `scripts/new-issue.mjs` always writes |

It refuses to overwrite an existing `reports/issues/<nid>/` or recipe. If you commit an import, run `node scripts/build-cloud.mjs` and commit `cloud/` too (CI fails if it is stale).

## What the validator checks, and what it does not

Checks: known keys only; the issue number, URL, branch and recipe name agree; text is plain (no HTML-like tags); site paths only (no hosts); recipe files limited to
`recipe.yml` and `config/*.yml`, valid YAML, known recipe keys, dependencies only from core or this repo's recipes, module names that look like machine names;
URLs only on drupal.org, git.drupalcode.org and api.drupal.org (an error in the recipe and variant, a warning in the summary); no secrets or keys; no YAML anchors
or aliases; at most 200 KB; `review.status` must be `draft` and `review.unverified` may not be empty; every check's `probe` must be a single read-only expression.

It does **not** prove the pack is correct or safe to trust. In particular:
- A `probe` is evaluated inside the Before and After frames. The probe check rejects network calls, cookies, navigation, DOM-writing and focus-changing calls, assignments and
  template strings, but it is a heuristic, not a sandbox. Read the checks of any pack you did not write.
- A recipe and a patch run code in your workspace. Use a throwaway workspace and store no tokens in it.
- A syntactically valid pack can still describe the wrong steps, selectors or config. That is what the manual run is for.
- Tests: `node --test tests/issue-pack/validate.test.mjs`.

## Contributing a pack back

You do not need write access to `mgifford/drupal-core-lab`. Fork it, add `reports/issues/<nid>/` and `recipes/repro_<nid>/` from your import, and open a pull request.
The maintainer reviews the pack as untrusted input (steps, probes and recipe) before merging; merged issues become examples for others. Nothing is ever posted to Drupal.org by the lab.
