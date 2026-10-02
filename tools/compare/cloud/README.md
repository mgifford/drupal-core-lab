# Compare viewer in a DDEV Coder workspace (browser only)

Runs the existing viewer in a Coder Freeform workspace and opens it at Coder app URLs, with no local install and no
`coder port-forward`. The viewer and each frame get their own app URL, so the host, Origin and frame-ancestors checks in
`serve.mjs` stay on; the viewer's origin is added through `LAB_EXTRA_ORIGINS` and the frame origins through
`LAB_BEFORE_ORIGIN` / `LAB_AFTER_ORIGIN`. Keep the apps owner-only (Public Sharing off).

Tested 2026-10-02 on the DDEV Freeform template (image `ddev/coder-ddev:v0.5`, Coder v2.37.2) with variant 3619127-pinned:
viewer, both frames and login load through the app URLs. Not yet checked here: the reproduction steps and keyboard behavior in the frames.

## One-time setup in the workspace

1. Create the workspace with these DDEV project names (comma-separated, case-sensitive), plus the two environments of the variant you run:

       repro-baseline-main,repro-issue-3619127-vanilla,drupal-compare,drupal-compare-before,drupal-compare-after

2. Build the variant: `node tools/compare/setup.mjs 3619127-pinned`
3. Register each project with Coder (once each) and restart it:

       for d in envs/baseline-main envs/issue-3619127-vanilla tools/compare/site tools/compare/cloud/before tools/compare/cloud/after; do
         (cd $d && ddev coder-setup && ddev restart); done

   `tools/compare/cloud/{before,after}` are small nginx-only DDEV projects that forward their Coder hostname to the viewer's
   proxy ports (8101, 8102). `tools/compare/site/.ddev/nginx_full/compare-cloud.conf` lets the existing `drupal-compare` project
   answer its Coder hostname.

## Each session

    node scripts/lab-env.mjs start 3619127-pinned     # starts the sites (and a viewer using the local DDEV hostnames)
    tools/compare/cloud/start-viewer.sh 3619127-pinned   # replaces that viewer with one using the Coder URLs

Open `https://drupal-compare--<workspace>--<owner>.<coder-domain>/` while signed in to Coder.

## Notes

- `LAB_BIND=0.0.0.0` is needed because the proxy containers reach the host over the Docker bridge (`host.docker.internal` is 172.17.0.1 on Linux), not loopback.
  Inside the workspace only. The default stays `127.0.0.1`, so local runs are unchanged.
- Coder creates apps only for the project names set when the workspace is built or updated; changing them needs `coder update <workspace> --always-prompt`
  (`coder restart --parameter` did not apply the names in testing).
- `ddev coder-setup` writes `docker-compose.coder-describe.yaml` and route files into each project; do not commit them.
