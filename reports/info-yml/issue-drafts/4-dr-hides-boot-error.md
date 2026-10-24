# Draft issue: core/scripts/dr hides the error when the site cannot boot

Not posted. drupal.org was unreachable from the lab, so it was not searched for an existing issue. Evidence: the steps below,
run as written ([verification.txt](verification.txt), draft 4), and the `php-syntax-error` rows for an installed module and
profile in [RESULTS.md](../RESULTS.md). Core `main` at `89df3a065deb`, PHP 8.5.12.

---

### Problem/Motivation

`DrupalApplication::bootstrap()` catches every `\Throwable` and returns `FALSE` (`DrupalApplication.php:130-131`). Then `find()` rethrows the original "command not found" error (lines 77-80). When the site cannot boot, a site command fails with 'There are no commands defined in the "ex" namespace.' The message does not name the cause. One cause is a parse error in an installed module's `.module` file.

### Steps to reproduce

1. Install the Standard profile.
2. Add a module `example` with a valid `example.module`, and install it with `php core/scripts/dr ex:install example -y`.
3. Replace `example.module` with `<?php function example_help( { }`.
4. Run `php core/scripts/dr ex:install syslog -y`. It exits 1: 'There are no commands defined in the "ex" namespace.'

### Proposed resolution

When `bootstrap()` fails, keep the exception. Show its class and message with the "command not found" error.

Generated with the help of an LLM.
