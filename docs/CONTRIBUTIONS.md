# Human and AI contributions

This is a curated account of how an implementation came to be. It exists so AI-assisted work does not obscure the
people who originated an idea, found a mechanism, corrected generated code or independently verified a result.

It is **not** inferred from commit authorship. A person or an agent records an entry with the source it came from; the
record is the source of truth for attribution, and `CONTRIBUTIONS.md` is generated from it.

## Where it lives

- `reports/issues/<nid>/contributions.json` — structured entries.
- `reports/issues/<nid>/CONTRIBUTIONS.md` — generated, sectioned account.
- `reports/issues/<nid>/CONTRIBUTIONS-DRAFT.md` — generated short credit draft for a person to edit and post.
- `SUMMARY.md` and `ISSUE-COMMENT-DRAFT.md` remain the issue summary and the human's draft; nothing is posted
  automatically.

## Kinds

| Kind | Meaning |
|---|---|
| `human-origin` | The person who identified the problem, mechanism or original approach |
| `inherited-decision` | A technical decision inherited from that work |
| `ai-addition` | Work generated or extended by AI |
| `ai-test-discovery` | A problem or regression found through AI-assisted testing |
| `human-correction` | A human correction to AI-generated code or evidence |
| `rejected-ai-approach` | An AI-generated approach that was rejected |
| `human-decision` | A human decision that shaped the final implementation |
| `independent-verification` | A person who independently verified the result |
| `uncertainty` | A limitation or open question that remains |

## Commands

```bash
node scripts/contributions.mjs add 3534229 \
  --kind human-origin --by "kentr" \
  --what "identified CSS masks and system colours as the mechanism" \
  --link "https://www.drupal.org/project/drupal/issues/3534229#comment-..." \
  --date 2026-11-27

node scripts/contributions.mjs add 3534229 \
  --kind ai-test-discovery --by "AI-assisted testing" \
  --what "found a possible clipping regression in the Alignment dropdown caret" \
  --evidence reports/issues/3534229/EVIDENCE.md

node scripts/contributions.mjs list 3534229
node scripts/contributions.mjs draft 3534229
node scripts/contributions.mjs check
```

`draft` refuses to run without at least one `human-origin` entry. It only states recorded entries; a person edits the
draft before posting. Neither command posts, comments or changes an issue.

## Rules

- Link the original comment, patch or MR where possible.
- Do not infer authorship from commit metadata.
- Credit the original human contribution before describing AI additions.
- Record rejected AI approaches and human corrections, not only the final success.
- Mark independent verification only when a person actually reviewed the result.
- Keep remaining uncertainty explicit.
