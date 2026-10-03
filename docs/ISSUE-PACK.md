# Issue packs: bring your own issue

An **issue pack** is one YAML file that describes how to reproduce a Drupal core issue in the lab: a summary with its sources, a recipe for the
starting state, and the steps, checks and questions for the viewer. A chat assistant can write one from an issue page; the lab validates it and imports it.
**A pack is always a draft** until a person has run it and confirmed it.

```
chat assistant ──writes──▶ issue-pack-<nid>.yml ──upload / paste──▶ workspace ──validate──▶ import ──▶ build ──▶ run and confirm
```

## Quick start

1. Prepare the prompt for your issue. This fetches the issue text and comments from the drupal.org API, finds the issue fork branch and the merge request on
   git.drupalcode.org, fetches the diff, fills in the prompt's three inputs, saves the result (`~/Desktop/issue-pack-prompt-<nid>.txt`, or the current folder
   if there is no Desktop), copies it to the clipboard and prints the path:

       node scripts/issue-pack.mjs prepare https://www.drupal.org/project/drupal/issues/<nid>

   It only reads public pages (drupal.org and git.drupalcode.org) and sends nothing about you. Anything it cannot find is left marked `@@MISSING@@` in the file,
   with the reason, and the banner at the top says how many inputs are missing. Options: `--mr <number>` to pick a merge request when several match, `--out <file>`,
   `--no-copy`. A diff over 300 KB is cut and says so. Only Drupal core issues are supported. Check the filled-in inputs, then paste the whole prompt into a new chat
   with an assistant that can make a downloadable text file (it does not need to run code). Without a network, `node scripts/issue-pack.mjs prompt` prints the blank prompt
   and you fill in the three inputs yourself.
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

## Working with the chat assistant

How the assistant learns the format: `node scripts/issue-pack.mjs prompt` prints one message with four parts: the task and rules, a field-by-field description
of the pack, **one complete valid pack** (the strongest signal of the shape you want), and the three inputs you fill in. Paste all of it as your first message.
A chat tool that can browse may open the issue itself; otherwise paste the issue page text (all comments) and the merge request diff. Ask for the result as a
downloadable file named `issue-pack-<nid>.yml`; if the tool cannot make files, ask for one code block and save it with that name.

The first answer will usually need a round. Save it to a file, and let the validator write the message for you:

    node scripts/issue-pack.mjs validate issue-pack-<nid>.yml --repair

It prints the problems in the validator's own words, each with what to do about it, and copies the whole message to your clipboard (`--no-copy` to skip). Paste it into the **same chat**.
A chat assistant cannot know your Drupal configuration, so the prompt does not ask it to write recipe files. It chooses **setup blocks** from a catalogue (`tools/compare/blocks/`, listed in the prompt) and the importer expands them into the recipe;
anything the catalogue lacks goes under `needs`, and the step is written as "set X by hand". See `tools/compare/blocks/README.md`, including how to add a block.

If you know the configuration yourself, or a block is missing, give the validator and the importer a recipe folder you trust (one that builds on current core, for example one you already used for this issue) and it replaces the setup:

    node scripts/issue-pack.mjs validate issue-pack-<nid>.yml --recipe recipes/<recipe folder> --repair
    node scripts/issue-pack.mjs import   issue-pack-<nid>.yml --recipe recipes/<recipe folder>

The assistant keeps the summary, steps, checks and questions; your folder (`recipe.yml` and `config/*.yml`) supplies the starting state. The pack's `review.unverified` gets a line saying the recipe was supplied by you, and the steps may
describe your recipe imperfectly, so read them against it. Your folder is yours to vouch for: the lab does not know that it works until you build it. (`--attach-recipe <folder>` on `--repair` instead asks the assistant to copy your files
into its pack; that works only if the assistant follows the instruction exactly.)
Repeat until the validator reports nothing to repair, then ask for the things a validator cannot check:

    List every claim in summary, steps and checks that comes from your own reasoning and not from the issue text, the comments or the diff,
    with the comment number or file for the ones that do. Add anything you were unsure of to review.unverified.

If your chat tool turns the long paste into an attachment (ChatGPT often does) it may describe the text instead of acting on it: type one line next to the attachment, for example *Follow the instructions in the attached text and reply with the issue pack YAML only.* The prompt itself now begins by telling the assistant that the whole message is its task, and ends with the instruction to write the pack. Use the same chat for the repair rounds.

Tips: give it one issue and one merge request at a time; tell it which branch the merge request uses; if it invents a selector or a config key, say so and ask it to move
that check into review.unverified or into a manual question; never paste secrets or private data into the chat.

## Is this pack any good? Check it before you build anything

Run `node scripts/issue-pack.mjs validate <file>` and read three things.

1. **Errors.** Any error means the pack cannot be imported. Fix it (`--repair` writes the message for the chat).
2. **"What this pack can test".** The summary after the warnings says how many automatic checks there are by kind, how many manual questions expect a *different* answer on Before and After, and what the recipe creates.
   A pack is worth building when it has a `fix` check or at least one differing question (otherwise nothing can show a difference), a `precondition` check, and a recipe whose config matches what the steps rely on (a limit, a field, a setting).
3. **Warnings.** Each says what to change. The ones that matter most: a probe that reads nothing from the page (it always gives the same answer), steps that rely on state the recipe never sets, a recipe that never creates the Article type for `/node/add/article`, and "nothing can tell Before from After".

A clean validator run is necessary, not sufficient. It cannot tell whether a check's label matches its probe, whether a selector exists, or whether the steps describe the recipe. Only then, import and build it, do the steps by hand in the viewer, press **Run checks**, and see that the `fix` check fails on Before and passes on After.

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
`recipe.yml` and `config/*.yml`, valid YAML, known recipe keys, dependencies only from core or this repo's recipes, module names that look like machine names; or, for `setup`, only blocks that exist in the catalogue with parameter values that match the block's pattern (a value cannot add YAML), at most 10 blocks, `once` blocks only once, and `needs` entries with a block name and a reason (each is a warning: the step must be done by hand);
URLs only on drupal.org, git.drupalcode.org and api.drupal.org (an error in the recipe and variant, a warning in the summary); no secrets or keys; no YAML anchors
or aliases; at most 200 KB; `review.status` must be `draft` and `review.unverified` may not be empty; every check's `probe` must be a single read-only expression. It also **warns** (does not reject) when a step or the description mentions a "configured" limit or setting while the recipe only applies stock recipes and sets no configuration of its own, because then the tester cannot follow the step; adding configuration to the recipe, or naming the setup in `review.unverified`, silences it.

It does **not** prove the pack is correct or safe to trust. In particular:
- A `probe` is evaluated inside the Before and After frames. The probe check rejects network calls, cookies, navigation, DOM-writing and focus-changing calls, assignments and
  template strings, but it is a heuristic, not a sandbox. Read the checks of any pack you did not write.
- A recipe and a patch run code in your workspace. Use a throwaway workspace and store no tokens in it.
- A syntactically valid pack can still describe the wrong steps, selectors or config. That is what the manual run is for.
- Tests (offline, 56 of them, including hostile packs and a replayed copy of real drupal.org responses): `node --test tests/issue-pack/*.test.mjs`.

## Contributing a pack back

You do not need write access to `mgifford/drupal-core-lab`. Fork it, add `reports/issues/<nid>/` and `recipes/repro_<nid>/` from your import, and open a pull request.
The maintainer reviews the pack as untrusted input (steps, probes and recipe) before merging; merged issues become examples for others. Nothing is ever posted to Drupal.org by the lab.
