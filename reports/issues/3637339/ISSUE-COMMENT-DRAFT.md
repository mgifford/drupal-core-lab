<!-- DRAFT: human review required. Replace relative evidence/attachment links before posting. -->

**AI-assisted:** yes. A large language model helped prepare the evaluator and this draft. Human review is pending.

I evaluated MR !17818 at `8c4a0e70`, unchanged, on core `ecb483ff6d4b` and its original base `7480c58b75c0`.

The MR corrects the configured focus outline in all six requested light/dark configurations. Pink is an accent option; Pink focus requires **Same as Accent color**. Pink accent with Orange focus correctly stays Orange. Comment #7 does not identify its independent focus setting, so I cannot reconstruct that test.

A separate concern remains: the 4px outline plus 2px offset extends 6px beyond the top and logical-start viewport edges. Repeated measurements and focused screenshots show clipping. This is not automatically a WCAG AA failure.

The [assessment](EVIDENCE.md) includes keyboard traces, forced-colors, RTL, Firefox and qualified WebKit results. It separates existing axe detections from regressions.

A separate clearance experiment removes the measured overflow in 19 configuration/environment combinations without detected
navigation changes. Its [interdiff](branches/3637339-focus-clearance.patch) and [complete patch](branches/3637339-focus-clearance-full.patch)
are for review, not an upstream MR revision.

The [human-review checklist](HUMAN-REVIEW.md) covers outstanding keyboard, screen-reader, Windows contrast and upstream-review checks.

Generated with the help of an LLM.
