# Evidence for the Default Admin icon revision

## Revisions

| Item | Revision |
|---|---|
| Historical baseline | `29b0a0b2256eb5ed27df6ec5e4e4e33142a717e8` |
| Current MR head | `fe4adb4f942385912bb3244b570afa475cadf3bd` |
| Current upstream main | `0387fb948f786bc344a5cc54aa0d98b8f552e378` |
| Revised branch | `3603162-svg-revision` at `d4728a2aa3fc34e45e428d78ac111bd0c5e228ad` |
| Issue fork branch | [https://git.drupalcode.org/issue/drupal-3603162/-/tree/3603162-svg-revision](https://git.drupalcode.org/issue/drupal-3603162/-/tree/3603162-svg-revision) (pushed; MR pending) |

## Source and compiled checks

```sh
cd work/mr16166/core
node ./scripts/css/postcss-build.js --check \
  --file themes/default_admin/css/base/icons.pcss.css \
  --file themes/default_admin/css/components/autocomplete-loading.module.pcss.css \
  --file themes/default_admin/css/components/file.pcss.css \
  --file themes/default_admin/css/components/form--select.pcss.css \
  --file themes/default_admin/css/components/form--checkbox-radio.pcss.css \
  --file themes/default_admin/css/components/system-status-report-general-info.pcss.css \
  --file themes/default_admin/css/components/more-actions.pcss.css \
  --file themes/default_admin/css/components/tabledrag.pcss.css
./node_modules/.bin/stylelint "themes/default_admin/css/**/*.css"
```

Result: build check exit 0; Stylelint exit 0 on all theme CSS; CSpell 0 issues on 216 theme CSS files.

## Static validation and audit

```sh
python3 tools/validate_svgs.py work/mr16166/core/themes/default_admin/images work/evidence/svg-validation.json
node tools/icon_usage.mjs work/mr16166/core/themes/default_admin work/evidence/icon-usage.json
python3 tools/measure.py work/evidence/metrics.json
```

Results:

- 64 SVGs, 0 XML/structure errors, 0 warnings.
- 60 icon properties, 0 undefined, 0 missing file, 0 unused file, 0 unused property.
- 41 literal SVG source references and 1 inline Twig reference.
- `loader.svg` is a documented master asset for the pretinted loader copies.

## Browser evidence

Local Drupal 12.0-dev site, Default Admin, Chrome 157 through Playwright 1.59.

| Component | Route | Modes | Result |
|---|---|---|---|
| Permissions | `/admin/people/permissions` | light, dark, forced-light, forced-dark | `#adaeb3` check in dark, 5.85:1; forced colours keeps native glyph |
| Autocomplete | `/node/add/article` | light, dark, RTL, forced | mask present, input background `none`, 36px inline padding; RTL fresh document 36px left / 12px right |
| Sticky actions | `/node/add/article` | light, dark, RTL, reduced motion, forced | `<input type="submit">`; white/`#111` pretints; 32px start padding; no-repeat; RTL keyframes |
| Media library selected item | `/node/add/article` media widget | light, dark, hover, forced | pencil and remove glyph visible; remove name “Remove Test image” |
| Status report | `/admin/reports/status` | light, dark, forced-light, forced-dark | all 5 masks painted white/black in forced colours |
| Menu tabledrag | `/admin/structure/menu/manage/main` | light, dark, RTL, dragging | `currentColor`, `aria-hidden="true"`, `focusable="false"` |

Axe on permissions, status and node form: 0 WCAG A/AA violations. Incomplete checks were not counted as passes.

## Tests

```sh
python3 -m unittest discover -s tests -p '*_test.py' -v
# Ran 46 tests in 0.021s — OK

cd /Users/mgifford/drupal-core-lab/envs/baseline-main
SIMPLETEST_DB='sqlite://localhost//.../sites/default/files/.test.sqlite' \
  ./vendor/bin/phpunit -c core core/themes/default_admin/tests/src/Unit core/themes/default_admin/tests/src/Kernel
# OK (14 tests, 209 assertions)
```

Functional tests: 8 errored because `SIMPLETEST_BASE_URL` was not served with the test database. Not counted as passes.

## Screenshots

- `work/evidence/screens/permissions-*.png`
- `work/evidence/screens/autocomplete-*.png`
- `work/evidence/screens/loader2-*.png`
- `work/evidence/screens/media-*.png`
- `work/evidence/screens/status-*.png`
- `work/evidence/screens/tabledrag-*.png`
- `work/evidence/screens/select-*.png`

## Limitations

The static audit covers the theme tree only. It does not prove absence of use in contrib or custom code, and it does not observe unexercised runtime states. The loader state used Drupal's real `.ajax-progress--throbber` markup inserted after the real Save input, because node Save is not an AJAX submit. The media edit control used the theme's real class and markup inside the real selected item because the fixture widget display omits the edit field.
