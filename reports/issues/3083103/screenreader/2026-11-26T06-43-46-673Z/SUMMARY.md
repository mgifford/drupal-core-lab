# #3083103 virtual screen reader: 3083103-latest

Guidepup virtual screen reader over a jsdom snapshot of the invalid form. Semantics only; no live-region speech and no layout.

## before

Phrases around the Name field:

- Name
- textbox, Name, Your full name., invalid, required
- Name field is required.
- Your full name.
- Message

First 40 phrases:

- Name
- textbox, Name, Your full name., invalid, required
- Name field is required.
- Your full name.
- Message
- textbox, Message, A short message., invalid, required
- Message field is required.
- A short message.
- Choice
- combobox, Choice, has popup listbox, not expanded, invalid, required
- option, - Select -, selected, position 1, set size 3
- option, Foo, foo, not selected, position 2, set size 3
- option, Bar, bar, not selected, position 3, set size 3
- end of combobox, Choice, has popup listbox, not expanded, invalid, required

## after

Phrases around the Name field:

- Name
- textbox, Name, Your full name., invalid, required
- Name field is required.
- Your full name.
- Message

First 40 phrases:

- Name
- textbox, Name, Your full name., invalid, required
- Name field is required.
- Your full name.
- Message
- textbox, Message, A short message., invalid, required
- Message field is required.
- A short message.
- Choice
- combobox, Choice, has popup listbox, not expanded, invalid, required
- option, - Select -, selected, position 1, set size 3
- option, Foo, foo, not selected, position 2, set size 3
- option, Bar, bar, not selected, position 3, set size 3
- end of combobox, Choice, has popup listbox, not expanded, invalid, required

