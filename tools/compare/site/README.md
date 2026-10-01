# drupal-compare: a DDEV address for the viewer

A tiny DDEV project that gives the compare viewer standard DDEV hostnames over HTTPS:

| URL | Goes to |
|---|---|
| https://drupal-compare.ddev.site | the viewer (host port 8100) |
| https://drupal-compare-before.ddev.site | the Before proxy (host port 8101) |
| https://drupal-compare-after.ddev.site | the After proxy (host port 8102) |

    cd tools/compare/site && ddev start      # once
    node tools/compare/serve.mjs --ddev      # from the lab root

It only forwards traffic to the Node server on your machine; it has no Drupal in it.
Without it, run `node tools/compare/serve.mjs` and use http://localhost:8100/ instead.
