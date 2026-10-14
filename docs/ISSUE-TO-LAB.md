# From an issue URL to a tested Before/After

This page is the map for the shortest path the lab offers: **point at a Drupal core issue that has an open merge request, and
end up with two sites to compare and a written, repeatable recipe for the starting state.**

It is a design + status page, not a tutorial. The tutorial is `docs/ISSUE-PACK.md`; the per-issue workflow is `docs/NEW-ISSUE.md`.
Written 2026-10-14, when the glue below was added. Nothing here is verified evidence until a person has run it.

## Why this shape

The alternative — a generic "step runner" that replays any issue's UI — was deferred by the owner (2026-10-14) as too large and too
fragile. The compromise is to keep the lab's existing model (two pinned environments, a viewer, checks a person confirms) and let a
chat assistant write the *description* of the test: the issue pack. That is repeatable, reviewable, and needs no new runtime.

## The flow

```
issue URL ──prepare──▶ chat prompt ──(a chat writes)──▶ issue-pack-<nid>.yml
                                                              │
                                                   validate ──┴── import
                                                              │
                        recipes/repro_<nid>/ + reports/issues/<nid>/ + two variants
                                                              │
                                                    setup.mjs ─┴─ serve.mjs / cloud-bootstrap.mjs
```

One command stands in for the first four arrows: `scripts/issue-from-url.mjs`.

## What exists, what this adds

| Stage | Command | State before 2026-10-14 | This change |
|---|---|---|---|
| Fetch the issue and its merge request, write the chat prompt | `issue-pack.mjs prepare <url>` | exists | — |
| A chat writes the pack (summary, recipe, steps, checks, questions) | (a chat) | exists; the assistant may only *pick catalogue blocks*, never write configuration | **`--ai-recipe`**: the assistant may also draft `recipe.yml` + `config/*.yml`, always marked unverified |
| Check and import the pack | `issue-pack.mjs validate` / `import` | exists | — |
| Build Before and After | `setup.mjs <slug>` | exists; core comes from `git.drupalcode.org` or `--core-url` | **`--core-from=<path>`** seeds the core objects from a local checkout, for when the network is filtered |
| Compare | `serve.mjs <slug>`, the viewer | exists | — |
| Run the merge request's own tests | `ddev phpunit <path>` on each side | done by hand, logs kept under `reports/issues/<nid>/phpunit/` | documented as the evidence for test-only issues; still by hand |
| Do all of the above in the cloud | `cloud-bootstrap.mjs <slug>` | exists; can fail at the core clone (egress), cannot adopt an issue-picker workspace | **`--core-url`** and **`--use-existing-core[=<path>]`** |

## The glue: `scripts/issue-from-url.mjs`

    node scripts/issue-from-url.mjs https://www.drupal.org/project/drupal/issues/<nid> [options]

It is a thin front door over the existing tools, so it never hides a step:

1. Fetch the issue + merge request + diff and write the chat prompt (unless `--pack <file>` is given, or a pack for the issue is
   already in the workspace).
2. If no pack file is found it prints exactly what to do next (paste the prompt into a chat, save the reply as
   `issue-pack-<nid>.yml`) and stops. Run it again once the file exists.
3. If a pack file is found it runs `validate` (and prints the repair message on failure), then `import` (unless `--no-import`).
4. It prints the next commands (`--check-patches`, then `setup.mjs <nid>-latest`, then the viewer, then `phpunit` when the issue is a
   test change).

Options: `--pack <file>`, `--out <file>`, `--ai-recipe`, `--mr <n>`, `--no-import`, `--dry-run`. It never posts anywhere and never
commits.

## AI-drafted recipes (`--ai-recipe`)

The default prompt (rule 6) forbids the assistant from writing Drupal configuration, because it cannot know your site: it may only
choose building blocks from `tools/compare/blocks/`, and anything missing becomes a `needs:` entry and a "set it up by hand" step.
That is safe but limited — today the catalogue is three blocks plus the Article content type.

`issue-pack.mjs prepare --ai-recipe` replaces that one rule with a stricter recipe-drafting rule (in
`prompts/issue-pack-recipe-rule.md`): the assistant may write `recipe.yml` and `config/*.yml`, but only from keys it can see in the
merge request diff or the issue text, never invented, and it must add a line to `review.unverified` saying the configuration was
drafted from the sources and not checked. The validator already checks that recipe files parse, that file names and `recipe.yml` keys
are known, and that a `/node/add/article` step creates the Article content type; `import` writes the files and marks the whole pack a
draft. So an AI recipe is accepted, reviewable, and still a draft.

> A recipe folder a *person* trusts can always be supplied instead with `--recipe <dir>` on `validate`/`import`; that path is
> unchanged and is still the safer one when the configuration matters.

## Test-only issues

Some issues with a "Needs review" merge request change no browser behaviour at all: #3338664, "Migrate Nightwatch Axe tests to
PHPUnit", moves tests and CI from Nightwatch to PHPUnit. A two-site visual diff is the wrong instrument; the evidence is the merge
request's own tests. Run them on each built side and keep the raw log, the way #3604037 and #3618230 already do:

    ddev phpunit <path-to-test>    # in envs/<before env> and again in envs/<after env>
    # logs → reports/issues/<nid>/phpunit/{before,after}-<Test>.log

There is no script for this yet; it is a documented convention because the test path varies per issue and a "test-only" issue still
needs a person to read the failures.

## Cloud: adopting an issue-picker workspace

The cloud path (`tools/compare/cloud/README.md`, `docs/CLOUD-PLAN.md`) has two holes this change closes or names:

- **Core fetch under filtered egress.** `setup.mjs` supports `--core-url`; `cloud-bootstrap.mjs` did not pass it. It now accepts
  `--core-url=<url>` (or `$LAB_CORE_URL`) and forwards it, so a fresh workspace can clone core from the GitHub mirror.
- **`--use-existing-core` (Coder `drupal-core` issue-picker workspaces).** The picker already checks out the issue fork and installs a
  site; the lab needs the *before* side and its own two environments. `cloud-bootstrap.mjs --use-existing-core[=<path>]` (default
  `~/drupal-core`, or `$LAB_EXISTING_CORE`) detects that checkout and seeds the lab's core objects from it via
  `setup.mjs --core-from=<path>`, so the code under test is the same revision the picker installed and no network clone is needed.
  The picker's own DDEV project is not reused: the lab still builds its own two environments from the same core.

  **Not tested in a Coder workspace.** Written from the template source and a local dry run only. The status table in
  `tools/compare/cloud/README.md` still decides whether the cloud path is usable by anyone but its author.

## What stays a draft

Everything a chat writes is a draft: `review.status: draft`, `variants.json` `status: draft: written from an issue pack`, and a
`SUMMARY.md` that says so. `import` marks `REPRODUCE.md` unverified. No command here posts to drupal.org, pushes, or signs in to
Coder. A person runs every step and confirms every check before any of it is evidence.

## Open questions

1. **Deep links.** The Pages guide's "Run in the cloud" button points at the issue picker, not at this path; the picker has no
   documented query parameter. See `docs/CLOUD-PLAN.md` §5.5.
2. **`--use-existing-core` adoption.** Whether the picker's clone is shallow (its base commit may be missing) is unverified; the
   local seed falls back to `--core-url` and says so.
3. **`issue-from-url` and the pack file name.** The chat writes `issue-pack-<nid>.yml`; the glue looks for it next to the prompt and
   under `reports/issues/<nid>/PACK.yml`. If a person saves it elsewhere they pass `--pack <file>`.
