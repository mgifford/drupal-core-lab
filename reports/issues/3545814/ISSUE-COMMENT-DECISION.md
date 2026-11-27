<!-- DRAFT for a human to review and post. Do not post automatically.
     This is the decision question for the MR author, separate from the evidence comment. -->

@kentr !13201 fixes the missing accessible names, and the tests now cover them. It also adds a visible "Value" label to the numeric filter when the operator is exposed, and that fieldset grows by 18px. The issue summary asks for the labels to be hidden, and the merge request comment says "Hide label when operator is exposed".

A one-line change to NumericFilter::valueForm() sets #title_display to "invisible" only when the operator is exposed. It uses "before" otherwise, so the filter configuration form keeps its label. I recorded it in five browser environments: the accessible name "Value" stays, axe reports none, the fieldset returns to its previous height, and the fixed-operator filter and configuration form are unchanged.

Would you prefer to fold that in, or keep the visible label and update the "User interface changes" section? I can attach the interdiff either way.

Generated with the help of an LLM.
