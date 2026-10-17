# General style-reviewer scope

Clarification, 2026-10-17. Colour semantics, animation, reduced motion, print and contrast are examples of review concerns, not a finite checklist or separate product roadmap.

## Purpose

Review visual, semantic and behavioural consistency within a site and across a declared Before/After change. Ask why equivalent components differ and whether the difference is intentional, supported by a rule, context-dependent, or still unexplained.
Start with Default Admin but allow separate profiles for other themes and request contexts.

## Open-ended concern areas

Typography and emphasis; heading/landmark/form structure; colour roles and pairing; spacing/alignment/density; icons and naming; navigation and state feedback; interaction/focus; responsive/language variants; user preferences; print; any newly identified pattern.
These examples do not exhaust the contract model. Do not create an ad hoc subsystem for each example or require every scenario before the first reviewer works.

## Review method

1. Identify component purpose, state, theme and request context.
2. Group equivalent instances within and across pages.
3. Apply accepted rules when available; otherwise identify outliers without declaring the majority correct.
4. Match Before/After evidence and distinguish new, resolved, unchanged and context-changed findings.
5. Explain the difference, evidence, possible intent, confidence, applicable source and verification gaps.
6. Record reviewed exceptions with bounded applicability. Use reviewer decisions to improve the shared contracts.

A difference is not necessarily an inconsistency, and an inconsistency is not automatically a conformance failure.
Frequency, hue, animation presence, stylesheet existence or pixel difference alone cannot establish intended meaning.
A novel pattern should remain reviewable even when no rule ID exists yet. Label it an unexplained difference or candidate rule, with evidence and context.

## Report vocabulary

- Accepted-rule violation: a precise applicable rule failed.
- Suspected inconsistency: equivalent components differ without an established reason.
- Context change: theme, language, state or preference differs and affects comparability.
- Intentional exception: reviewed and scoped.
- Not checked/unknown: evidence is insufficient.

Findings should link to the current page and representative instances elsewhere, avoiding repeated reports of one shared implementation defect.
Keep observation capture, rules, comparison, review and reporting separate so additional concerns reuse the same pipeline.

## Implementation priority

The existing gathering pilot is the immediate step. A general component/rule evaluator, current-page report and paired crawl follow the phased plan.
The semantic-colour guide is one example contract family, not a replacement scope. The additional preference observations enrich the evidence captured for later review.
