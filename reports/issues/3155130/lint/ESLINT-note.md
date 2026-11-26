# JavaScript lint note

`node scripts/lint.mjs 3155130-contrib --contrib` checks PHP only and lists `js/text.js` as NOT checked. A manual ESLint run
filled that gap:

```sh
cp modules/contrib/text_with_summary/js/text.js core/misc/tmp-text-with-summary.js
cd core && node_modules/.bin/eslint misc/tmp-text-with-summary.js
```

Result: **0 errors**, 52 warnings (`no-jquery/*` and `jsdoc/*`, the same warning classes as the original file; no new
error class). Three Prettier errors in the first run were fixed by reflowing the affected expressions, and the patch was
regenerated. The copy into `core/misc/` was only needed because core's flat ESLint config ignores files outside its base
path; the temporary file was removed afterwards.

This is code style, not accessibility evidence.
