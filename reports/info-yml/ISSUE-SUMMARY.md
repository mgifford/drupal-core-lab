### Problem/Motivation

One malformed `.info.yml` file can break a site, even when its extension is not installed. Since 11.2, extension discovery parses every info file (#3490347). A parse error stops cache rebuilds and the container build.

On 12.x, 25 of 49 test cases broke cache rebuilds and cold-cache pages in every placement tested. Examples: an unquoted colon, a tab, a missing `type` key, an empty file. Warm pages keep working, so the break appears at the next cache rebuild.

### Steps to reproduce

1. Install the Standard profile.
2. Add `modules/custom/example/example.info.yml` with `name: Example`, `type: module`, `core_version_requirement: ^12` and `description: Example: one`.
3. Run `php core/scripts/dr cache:rebuild`. It exits 1: "A colon cannot be used in an unquoted mapping value at line 4".
4. Empty the cache tables. Anonymous pages return 500.

### Proposed resolution

Add an `ExtensionFileValidator` service and a `core/scripts/dr ex:validate` command. They need no installed site. They report parse errors, wrong value types, file names that discovery ignores, and PHP syntax errors. Exit code 1 fails a CI job or a deployment script.

Test results: https://github.com/mgifford/drupal-core-lab/tree/main/reports/info-yml

Generated with the help of an LLM.
