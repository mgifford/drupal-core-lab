# Learnings from the #3466040 independent review

1. **A fixture open/close loop is not an AJAX lifecycle test.** The MR's fixture showed one observer,
   one callback and a clean disconnect over four opens. The Field UI flow created **three observers on
   the same `#drupal-modal`**, fired nine callbacks and disconnected only the newest. Any claim that the
   observer lifecycle is clean must exercise repeated `dialog:aftercreate` without `dialog:beforeclose`.

2. **Listener registration order matters.** The patch's `dialog:aftercreate` listener can be registered
   after the probe's, so reading `data('drupalAutoResizeObserver')` synchronously can be a false
   negative. Read it in a microtask after all listeners, or count `ResizeObserver` construction and
   correlate targets.

3. **A label regex can turn a pass into a false fail.** The shared `PRIMARY_LABEL` did not match
   "Save translation", so `reachedPrimary` was false on both sides and the translation run even said
   `reproduced-not-fixed`. The real Tab trail reached Save at step 4 and the button was in the viewport.
   Read the trail and the element rectangle, not only the flag.

4. **Viewport choice changes the conclusion.** The translation modal at 100 % and 720 overflowed by only
   2.9/5.8 px and Save was still visible; at **125 % reflow** it overflowed by **69.8 px** and Save was
   outside the 864 px viewport. The owner's 100 %/720 keyboard claim was unsupported; the 125 % case is
   the real barrier. Test the zoom levels where the geometry crosses the boundary, not only round ones.

5. **Fixed-width dialogs fail reflow.** At 400 % reflow (480×270 CSS), the translation modal remained
   882 px wide, so 402 px of the form was off-screen horizontally. This is a pre-existing
   `config_translation` width choice, not this MR, but it belongs in the WCAG 1.4.10 discussion.

6. **Test hardening is small and decisive.** Asserting `details.open` before/after and
   `scrollHeight > clientHeight` makes the test fail on pristine core (5 assertions, geometry failure)
   and pass with the fix (6 assertions). Without them the original test can pass without the details
   opening or a scrollable content area.

7. **The fix is one observer, not three.** Reusing the observer, canceling the previous debounce and
   `removeData()` on close reduced the Field UI flow from 12 created observers (3 patch) to 10
   (1 patch), with zero leaked after close. The probe's "three records" were three `aftercreate`
   observations of the same id 10.

8. **A shared checkout has a shared clock.** Another session re-applied the test-support patch, ran
   setups and restarted containers mid-run. Use isolated output, record patch-state hashes, and restore
   the pair before handing off. A `BLOCKED` from `launch()` is usually the environment telling the truth,
   not a product result.

9. **Pin the proposal.** A mutable MR diff is not a comparison. The handoff includes the base
   `97c6ff8b`, the MR head `aed1df5e`, a full patch against base, and an interdiff against the MR head;
   both were checked with `git apply --check`.

10. **The final gate is human.** Automated geometry, a Tab walk, axe and lint do not replace a person's
    keyboard pass or a screen reader, and they do not decide the issue status. The package is ready for
    a human to apply, run CI, and set **Needs review**; RTBC remains a separate decision.
