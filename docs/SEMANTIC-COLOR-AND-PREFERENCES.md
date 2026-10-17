# Semantic colour, component intent and user preferences

DRAFT follow-up specification, 2026-10-17. Proposed Lab rules, not established Drupal requirements.

See [STYLE-REVIEWER-SCOPE.md](STYLE-REVIEWER-SCOPE.md): these are examples within the general reviewer, not a fixed feature checklist.

## What the palette does and what remains to define

The reviewed ui-palette-generator uses shared light/dark token IDs, separates content and non-content colours, and offers soft/subdued/strong emphasis levels. Its js/main.js explicitly tests selected pairs, including neutralContentStrong on card/canvas and accentContentStrong on card/canvas. Those are pairing candidates; the generator does not establish every permissible Drupal component use.

A swatch has no contrast ratio on its own. Pair selection must identify the foreground, effective background, component part, state, text size/weight where applicable and theme mode. Equal hex values do not prove equal semantic purpose; different values across themes do not prove inconsistency.

The referenced issue #3619933 could not be retrieved live during preparation. It remains a source to review, not evidence that this proposal is maintainer-approved. The Lab has a saved reproduction snapshot, but this addendum does not evaluate its patches or current issue status.

## Use separate dimensions rather than one enormous colour category

| Dimension | Examples | What it answers |
|---|---|---|
| Purpose/intent | Action, navigation, information, success, warning, error, destructive operation | Why does this component exist? |
| Visual part | Text, surface, icon, border, focus indicator | What receives the colour? |
| Emphasis | Primary, secondary, subdued | What has priority among comparable components? |
| State | Default, hover, focus-visible, selected, current, invalid, disabled, busy | What is happening now? |
| Context | Theme, local data-theme-mode, light/dark, contrast, language, user settings, print | Which presentation contract applies? |

Do not use a single semantic token to mean both primary action and error solely because the generated colours look appealing. A theme can deliberately map different semantic roles to one colour, especially in forced colours, provided their meaning remains distinguishable by other appropriate cues.
Selected, keyboard-focused and invalid are independent states and can occur together. A contract must account for combinations, not overwrite the error cue with a focus cue.

## Recommended token layers

1. Palette values: raw colour scales or the generator's swatch tokens.
2. Semantic aliases: text.primary, surface.canvas, action.primary.background, status.error.text, focus.indicator. These names are examples, not Drupal's current API.
3. Component/state mappings: button.primary.default.background, field.invalid.border, vertical-tab.selected-error.marker.

Maintain definitions in implementation sources. Export a reviewable mapping and valid pairing list for AI and tests; do not manually maintain several competing tables of hex values.
The proposed JSON beside this guide is planning data, not a new runtime dependency or enforced token format.

## Define foreground/background pairs and state relations

| Contract | Required pairing | Additional meaning |
|---|---|---|
| Ordinary text | text.primary on its actual surface | Readability and hierarchy |
| Primary action | action.primary.foreground on action.primary.background | Text identifies action; primary is relative to other actions |
| Error | status.error.text/icon/border on error surface | Visible error text and field relationship |
| Selection | selected text/icon on selected surface | Current/selected semantics as appropriate; persistent visible cue |
| Focus | indicator against the relevant adjacent surfaces | Real keyboard focus, not a decorative highlight |
| Progress/next step | instruction/status against actual surface | Persistent destination/instruction when motion is reduced |

Test actual backgrounds including transparency, images, gradients and nested surfaces. A token-only ratio can miss real composition. Report unknown when background resolution is unreliable.
Use WCAG 2 contrast requirements with their correct applicability/exceptions; do not impose one ratio on every text/icon/disabled component. APCA can be supplementary research but does not replace WCAG 2.2 contrast criteria.
Contrast and meaning are distinct: a perfectly contrasting red box does not tell someone what failed. Include suitable visible non-colour cues and programmatic relationships. Screen-reader-only text alone is not a visible alternative to colour.
In forced colours, document system-colour roles and non-colour distinctions rather than requiring branded RGB values. Do not blanket-apply forced-color-adjust:none.
In print/monochrome/backgrounds-off, preserve labels, borders, symbols or patterns that carry the distinction.

## Motion should reinforce an instruction rather than carry it alone

For every intentional motion cue record trigger, purpose, target, duration/repetition, interruption controls and reduced-motion replacement.
Examples:

| Normal cue | Reduced-motion alternative | Meaning that must remain |
|---|---|---|
| Slide/scroll to the next step | Immediate reveal/location change plus heading and step numbering | What step is current and where to continue |
| Pulse around invalid content | Persistent error text, marker and boundary | What is invalid and how to correct it |
| Animated loading indicator | Static loading label or progress value updated meaningfully | Work is pending; completion/error still reported |
| Reordering animation | Immediate final order and appropriate operation feedback | Which item moved and its resulting position |

Changing focus needs its own interaction rationale; reduced motion does not justify unsolicited focus jumps. Announce important state changes through the appropriate semantics, not every animation frame. Avoid repeated live announcements.
Do not erase information with a blanket animation:none rule. Essential functional animation, automatic movement, blinking and user-triggered motion need their own applicable requirements and exceptions.
WCAG 2.3.3 Animation from Interactions is AAA. WCAG 2.2.2 Pause, Stop, Hide is A and has specific triggering conditions. Adopting stronger reduced-motion behaviour as Lab policy is valid, but must be labelled separately from an AA conformance claim.

## Requested preference, observed preference, implementation, outcome

Keep four separate records:

- Requested: which settings were emulated or selected.
- Observed: what the document's media queries and mode markers report.
- Implementation: relevant CSS rules, JS behaviours, computed properties and component mappings.
- Outcome: whether the required information/task still works, based on an authored scenario and review.

Observe colour scheme, prefers-contrast, forced colours, reduced motion, reduced transparency and reduced data independently. Reduced motion does not imply reduced transparency, disabled JavaScript or high contrast. Null media results mean unsupported or indeterminate, not a preference for unrestricted effects.
For transparency reduction use readable opaque alternatives. Reduced-data mode should preserve task content while avoiding optional heavy effects/resources. Neither is universally supported; detect evidence instead of assuming a browser matrix.
Language, direction, text resizing/zoom and relevant platform settings remain separate dimensions. Do not claim this addendum tests every user preference.

## What the pilot gathers now

- Requested --motion=reduce or no-preference, independent of --contrast and --forced-colors.
- Observed reduced-motion/transparency/data media values in the viewer history and per-page JSON.
- Computed animation/transition/scroll properties, plus sampled running-animation counts.
- Accessible CSSOM selector/media/property inventories for preference-related rules.
- Local data-theme-mode scope on elements, useful for mirrored palette demos or embedded component themes.

It does not infer intent from hue, calculate final composited contrast, resolve all CSS/JS provenance, automatically map tokens to components or judge motion fallbacks. Initial-load samples can miss short-lived, canvas/video and interaction-triggered effects. Running-animation counts are evidence, not pairwise pass/fail predicates.
Preference CSS inventory excludes inaccessible sheets and does not establish that a declaration won the cascade. Systematic source mapping and state scenarios remain follow-up implementation.

## Next pilot

1. Review one primary action, an invalid field, selected/error vertical tabs and a next-step/progress component.
2. Define semantic intent, valid pairs and non-colour/static alternatives.
3. Map to the selected theme's existing tokens, leaving undecided aliases explicit.
4. Use real input to exercise focus, validation, progress and navigation.
5. Compare normal/reduced motion; light/dark; more contrast/forced colours; print/backgrounds-off. Prioritise meaningful combinations instead of a blind Cartesian product.
6. Plant a missing static motion fallback and a lost print error marker; demonstrate detection/review without treating legitimate theme variation as a defect.

## Sources

- https://github.com/mgifford/ui-palette-generator and https://github.com/mgifford/ui-palette-generator/blob/main/js/main.js (reviewed 2026-10-17; mutable references).
- https://mgifford.github.io/ui-palette-generator/ (reviewed current public interface).
- https://www.drupal.org/project/drupal/issues/3619933 (live retrieval unavailable; no patch judgment made).
- https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html
- https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html
- https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html
- https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html
