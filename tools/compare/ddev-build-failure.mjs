// Recognise a DDEV image build that failed because Docker reused an empty cached `apt-get update` layer.
// `apt-get update` exits 0 when snapshot.debian.org drops a fetch, so the empty result is cached and every later build of the same
// Dockerfile fails at the install step with "Unable to locate package" / "Version ... was not found" in about a tenth of a second.
// A build with no cache fixes it (`ddev debug rebuild`).
export const ADDON = 'justafish/ddev-drupal-core-dev';
// Bump on purpose: its web-build/Dockerfile.chromium pins an exact chromium and a dated Debian snapshot.
export const ADDON_VERSION = 'v1.2.5';
// The DDEV release the pins were last checked against; scripts/check-pins.mjs uses it where DDEV is not installed (CI).
export const DDEV_TESTED = 'v1.25.5';

export function isStaleAptCache(text) {
  const t = String(text || '');
  return /docker-compose build failed/.test(t)
    && /apt-get install/.test(t)
    && /(Unable to locate package|Version '[^']+' for '[^']+' was not found)/.test(t);
}
