# Viewer-side check for #3636987 (a person's pass)

**AI-run viewer capture done 2026-11-27**; see [manual/README.md](manual/README.md) and the screenshots
there. This page is the checklist for a person's own pass, which is still open.

The registered comparison is `3636987-pinned`. The AI capture used a private viewer instance on port 8110
because the shared 8100 viewer was serving another session's variant; neither that session's viewer nor
its sites were changed. If the shared viewer is free, `node scripts/lab-env.mjs start 3636987-pinned
--browser` opens it on the normal URL. Do not start while `node scripts/preflight.mjs` says BLOCK.

## Start

```
node scripts/preflight.mjs
node scripts/lab-env.mjs start 3636987-pinned --browser
```

The viewer is https://drupal-compare.ddev.site or http://localhost:8100 with `?variant=3636987-pinned`.
Log in to both frames (admin / admin).

## Check, forced-colours dark (the reported state)

1. **Conditions > Forced colours: Dark**. Both frames should report forced colours on and a dark scheme.
2. Open `/admin/content` in both frames. Keep Mirror off.
3. Look at the end of the *Content type* and *Published status* selects.
   Before: two chevrons (Drupal's SVG plus the browser's native caret). After: one caret.
4. **Run checks**. Expected:
   - "The forced-colors rule list covers dark-mode selects": Fail Before, Pass After.
   - "Forced colours on: every select on this page has no custom background image": 0 After. If it says
     "not in forced colours", the Conditions emulation is not on; set it and run again.
   - padding-inline-end and appearance: "same" on both sides.
5. Tab to a select with real keyboard input in each frame. Both show one caret and a focus indicator.
6. Open `/admin/structure/block`. The extra-small region selects show two chevrons Before and one After
   in forced dark. Run the checks on this page too.
7. Switch **Forced colours: Light**: one caret on both sides.
8. Turn forced colours off and set **Color mode: Dark**: both sides keep Drupal's custom chevron.
9. Optional RTL: **Text direction: RTL**. The caret moves to the other edge; no extra chevron appears.

## Save the evidence

- Screenshot the viewer with Before and After visible in the reported state; save it in
  `reports/issues/3636987/manual/`.
- Use the viewer's **Download log** and save it there too. It records the browser, colour mode and the
  environment; a person's log is manual evidence, not a scripted run.
- Re-run `node scripts/coverage.mjs 3636987` so the manual row appears.

A pass here confirms the registered comparison and the visual result. It does not replace a person's
keyboard or screen-reader pass, and it is not RTBC evidence.
