Tested MR !17622 (head 090a74cd) on main `dbfce851` with Default Admin and an unlimited core text field.

Without the patch, the actions `th` is empty. The empty-table-header check reports one violation at initial load, after Add another item and after removal. The accessibility tree exposes a bare column header.

With the patch, the `th` contains visually hidden Operations text. The same check reports no violations at those three stages. The virtual screen reader reads `columnheader, Operations`. Rows and Remove controls are unchanged at 3, 4 and 3. Stable screenshots are pixel-identical, apart from nine subpixel values after Add.

The MR test fails on Before at the new assertion and passes on After with 35 assertions.

Real VoiceOver table navigation has not completed, so column context at the Remove buttons is not yet verified.

Generated with the help of an LLM.
