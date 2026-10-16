# prompts/

## issue-pack-chat-prompt.md: the prompt for a chat assistant

The template that turns a Drupal.org core issue into an **issue pack** (one YAML file the lab can validate and import). You do not edit or paste this file:
a command fills it in for your issue.

### Generate the prompt for an issue

    node scripts/issue-pack.mjs prepare https://www.drupal.org/project/drupal/issues/<number>

This fetches the issue summary, comments and attachment names (drupal.org API), finds the issue fork branch and its merge request (git.drupalcode.org), fetches the diff, fills in
the three inputs at the top of the prompt, writes `issue-pack-prompt-<number>.txt` (to `~/Desktop` if it exists, otherwise the current folder), copies it to your clipboard
and prints the path. Then paste the whole prompt into a new chat with an assistant that can make a downloadable text file.

- If something could not be fetched, that input says `@@MISSING@@` with the reason, and the first lines of the file say how many are missing. Paste those yourself.
- `--mr <number>` chooses a merge request when several match; `--out <file>` chooses where to write; `--no-copy` skips the clipboard.
- It only reads public pages and sends nothing about you. Core issues only.

### No network, or you want to fill it in by hand

    node scripts/issue-pack.mjs prompt          # prints the blank prompt; replace the three @@MISSING@@ lines at the top

Open the issue page, select all and copy for input 2; open the merge request's URL with `.diff` added for input 3.

If your chat tool turns the pasted prompt into an attachment and answers with a description of it (it did in ChatGPT), add one line of your own: *Follow the instructions in the attached text and reply with the issue pack YAML only.*

The prompt lists the **setup catalogue** (`tools/compare/blocks/`): the assistant picks blocks for the starting state instead of writing Drupal configuration, and lists what the catalogue lacks under `needs`.

### After the assistant answers

    node scripts/issue-pack.mjs validate issue-pack-<number>.yml
    node scripts/issue-pack.mjs import issue-pack-<number>.yml

If the validator reports errors or warnings, run it again with `--repair`: it prints a message (and copies it to your clipboard) to paste back into the same chat; `--recipe <folder>` (on `validate` and `import`) swaps in a recipe you trust for the assistant's own ([docs/ISSUE-PACK.md](../docs/ISSUE-PACK.md)). A pack is a draft until you have run it and confirmed it.

## bug-feature.md: the rules for a bug summary in Gherkin

The rules a model follows to rewrite `reports/issues/<nid>/BUG.feature` (one behaviour per scenario, each with its Before and After result and its
sources). You do not paste this file: `node scripts/bug-feature.mjs prompt <nid> --out p.txt` fills in the issue number, the current feature or a fresh
draft, and the issue's `SUMMARY.md`, `EVIDENCE.md`, `FEEDBACK.md` and intake brief as data. Save the reply as `BUG.feature`, then
`node scripts/bug-feature.mjs check <nid>`. An agent working in the lab reads the file directly. See [docs/BUG-FEATURE.md](../docs/BUG-FEATURE.md).
