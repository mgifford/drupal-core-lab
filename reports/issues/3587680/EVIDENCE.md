# Evidence: issue 3587680

Status: **DRAFT — fix note only, no lab run.** The original note [3587680-update.md](3587680-update.md) reports a
before/after `curl | grep -c "<h3></h3>"` count (4 → 0) and a resolved axe-core `empty-heading` violation. None of this
was reproduced in this lab.

## Not verified

Everything in the lab sense: no environment, no pinned/latest pair, no automated or manual checks, no human review, no
commit/tool/browser record. The patch is against a contrib module (`theming_tools`), which the lab does not cover. Re-check
the issue before relying on anything here.
