# Targeted test run: #2574721 on current main

**DRAFT.** Recorded 2026-11-23 after scoped disk cleanup recovered Docker inode capacity.

The first broad, parallel run was invalid because Docker ran out of inodes while Simpletest created files.
The targeted method was then run sequentially.

| Side | Command | Result |
|---|---|---|
| Before | `ddev phpunit core/modules/system/tests/src/Functional/Form/ModulesListFormWebTest.php --filter testModuleListForm` | PASS, 1 test, 11 assertions |
| After | `ddev phpunit core/modules/system/tests/src/Functional/Form/ModulesListFormWebTest.php --filter testModuleListForm` | PASS, 1 test, 15 assertions |

The After test adds assertions that the operations render in a dedicated cell as a dropbutton
and that Configure, Permissions, and Help keep their intended order.
