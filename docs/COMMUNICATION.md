# Upstream communication tracking

Test results answer “what did the lab observe?” Communication answers “has this finding been taken upstream, and what
does a person need to do next?” They are deliberately separate: a finding can be fully verified and still have no
upstream comment, and a posted comment is not proof that the code is correct.

## Where it lives

- `reports/issues/<nid>/communication.json` — the structured record.
- `reports/issues/<nid>/COMMUNICATION.md` — generated view for one issue.
- `reports/issues/COMMUNICATION.md` — generated cross-issue “needs an update” view.
- `ISSUE-COMMENT-DRAFT.md` remains the draft text. The tracker points at it; it does not replace it.
- `feedback.json` and `FEEDBACK.md` remain about whether a run answered feedback. This tracker is about upstream
  communication, not test outcomes.

## States

| State | Meaning |
|---|---|
| `new` | Finding recorded; no draft yet |
| `draft-prepared` | A draft exists but has not been reviewed |
| `awaiting-human-review` | Waiting for a person to approve the draft |
| `ready-to-post` | Reviewed and waiting for the human to post it |
| `posted` | Posted upstream; keep the comment URL |
| `independently-addressed` | Someone else fixed or raised it; keep the link |
| `superseded` | A later revision or finding replaced it |
| `withdrawn` | Deliberately withdrawn |
| `no-upstream-communication` | Nothing should be posted (for example an internal tooling finding) |

“Needs a next human step” covers `new`, `draft-prepared`, `awaiting-human-review` and `ready-to-post`. It never
means the lab should post automatically.

## Commands

```bash
# record a finding (the tested revision is the one the evidence used)
node scripts/communication.mjs add 3534229 \
  --summary "Toolbar icons remain invisible in forced-colours mode" \
  --discovered-by joint --tested-revision "MR !18007 @ 50833b75" \
  --evidence reports/issues/3534229/EVIDENCE.md \
  --draft reports/issues/3534229/ISSUE-COMMENT-DRAFT.md \
  --note "Human identified the CSS-mask mechanism; AI-assisted testing extended it"

# a human reviewed it and is ready to post
node scripts/communication.mjs update 3534229 C001 --state ready-to-post --decision "Owner approved the draft"

# it was posted
node scripts/communication.mjs update 3534229 C001 --posted-url https://www.drupal.org/project/drupal/issues/3534229#comment-...

# someone else addressed it
node scripts/communication.mjs update 3534229 C001 --independently-addressed "kentr (MR !18007)"

# regenerate views / validate
node scripts/communication.mjs list 3534229
node scripts/communication.mjs list --all
node scripts/communication.mjs check
```

## Rules

- The script **never posts, comments, changes an issue, opens an MR or contacts drupal.org**. It only writes local JSON
  and Markdown.
- `discovered-by` is `human`, `ai`, `joint` or `unknown`. It records what the people involved agree happened; it is not
  inferred from commit authorship.
- Keep the tested revision in `tested_revision`; a later MR head does not retroactively make an old finding current.
- Preserve the upstream comment URL when something is posted; that is the evidence that it was communicated.
- When an MR or finding is superseded, say so with `--superseded-by` and leave the old record in place.
- The generated views are dashboards, not a second source of truth. Edit `communication.json` through the CLI and let
  the Markdown be regenerated.

See [RESULTS-LAYOUT.md](RESULTS-LAYOUT.md) for the rest of an issue folder and [ISSUE-LIFECYCLE.md](ISSUE-LIFECYCLE.md)
for when an issue is archived.
