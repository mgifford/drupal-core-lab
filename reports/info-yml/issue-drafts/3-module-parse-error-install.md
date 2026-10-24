# Draft issue: A parse error in a .module file leaves the module installed, and cache rebuilds fail

Not posted. drupal.org was unreachable from the lab, so it was not searched for an existing issue; an older one is likely.
Evidence: the steps below, run as written ([verification.txt](verification.txt), draft 3), and the `php-syntax-error/module`
and `php-syntax-error-install/module` rows in [RESULTS.md](../RESULTS.md). Core `main` at `89df3a065deb`, PHP 8.5.12.

---

### Problem/Motivation

`ModuleInstaller::doInstall()` saves the module in `core.extension` (lines 282-287). Then it updates the kernel (line 326) and loads the `.module` file (line 345). A parse error in that file ends the request or command after the save. The module stays installed, and the next cache rebuild fails. The Extend page (HTTP 500) and `core/scripts/dr ex:install` both behave this way. With the parse error in the `.install` file instead, the module is not recorded as installed.

### Steps to reproduce

1. Install the Standard profile.
2. Add `modules/custom/example/example.info.yml` with `name: Example`, `type: module` and `core_version_requirement: ^12`.
3. Add `modules/custom/example/example.module` containing `<?php function example_help( { }`.
4. Run `php core/scripts/dr ex:install example -y`. It exits 255 on the parse error. The module is recorded as installed.
5. Run `php core/scripts/dr cache:rebuild`. It exits 255.

### Proposed resolution

Before saving `core.extension`, tokenize each new module's `.module` file with `token_get_all($code, TOKEN_PARSE)`. Stop the install on a `ParseError`.

Generated with the help of an LLM.
