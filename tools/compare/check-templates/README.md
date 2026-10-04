# Check templates

A pack's automatic checks come from this menu instead of free-form probes. A chat assistant picks a template and fills in parameters; the
label and the probe are generated, so they always agree and the assistant never writes JavaScript.

```yaml
checks:
  - use: element_exists
    kind: fix
    params: { selector: ".file-upload-messages", what: "The upload message wrapper" }
```

Each `*.yml` file here has `name` (the file name), `title`, `description`, `kinds` (which of precondition, fix, regression it may be
used as), `params` (each with a strict `type` and a `description`), `label`, `probe`, `expect` and `verified` (where it was evaluated).
In `probe`, every `{{param|js}}` is inserted as a JSON string (`js_lower` lowercases it first); in `label`, `{{param}}` is plain text.

Parameter types (patterns in `tools/compare/pack-checks.mjs`): `selector` (tag, `.class`, `#id`, `[attr]`, `[attr=value]`, joined by a
space or ` > `, up to four parts, no pseudo-classes), `text`, `attribute`, `value`, `field_name`. A value outside its pattern is an error
that says what the pattern is.

Free-form `label`/`probe` checks are still accepted for people who write packs by hand; they go through the same read-only screen.

To add a template, copy a file, change it, and add a case to `tests/issue-pack/check-templates.test.mjs`: that test evaluates every
template's probe in Chromium on a fixture page (skipped when Playwright is not installed). These probes show markup, not what a
screen reader says.
